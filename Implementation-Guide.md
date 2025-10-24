# POS Implementation Guide

## Project Setup & Dependencies

### Expo React Native Project Initialization
```bash
# Create new Expo project
npx create-expo-app retail-pos --template
cd retail-pos

# Install core dependencies
npm install @supabase/supabase-js
npm install @react-navigation/native @react-navigation/stack @react-navigation/bottom-tabs
npm install react-native-screens react-native-safe-area-context
npm install @react-native-async-storage/async-storage
npm install react-native-paper react-native-vector-icons
npm install @tanstack/react-query
npm install react-hook-form
npm install react-native-camera react-native-qrcode-scanner
npm install react-native-bluetooth-serial
npm install react-native-print
npm install @stripe/stripe-react-native
npm install react-native-date-picker
npm install react-native-modal
```

### Development Dependencies
```bash
npm install --save-dev @types/react @types/react-native
npm install --save-dev typescript
npm install --save-dev eslint prettier
npm install --save-dev @typescript-eslint/eslint-plugin
```

## Project Structure

```
retail-pos/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── common/          # Generic components
│   │   ├── forms/           # Form components
│   │   └── layout/          # Layout components
│   ├── screens/             # Screen components
│   │   ├── auth/            # Authentication screens
│   │   ├── pos/             # Point of Sale screens
│   │   ├── inventory/       # Inventory management
│   │   ├── customers/       # Customer management
│   │   ├── reports/         # Reporting screens
│   │   └── settings/        # Settings screens
│   ├── navigation/          # Navigation configuration
│   ├── services/            # API and external services
│   │   ├── supabase/        # Supabase client
│   │   ├── payments/        # Payment processing
│   │   └── hardware/        # Hardware integration
│   ├── hooks/               # Custom React hooks
│   ├── utils/               # Utility functions
│   ├── types/               # TypeScript type definitions
│   ├── constants/           # App constants
│   └── store/               # State management
├── assets/                  # Images, fonts, etc.
├── docs/                    # Documentation
└── __tests__/               # Test files
```

## Core Implementation Areas

### 1. Supabase Configuration

#### Environment Setup
```typescript
// src/config/supabase.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});
```

#### Database Service Layer
```typescript
// src/services/supabase/database.ts
import { supabase } from '../config/supabase';
import { Database } from '../types/database';

type Tables = Database['public']['Tables'];

export class DatabaseService {
  // Generic CRUD operations
  static async create<T extends keyof Tables>(
    table: T,
    data: Tables[T]['Insert']
  ) {
    const { data: result, error } = await supabase
      .from(table)
      .insert(data)
      .select()
      .single();
    
    if (error) throw error;
    return result;
  }

  static async read<T extends keyof Tables>(
    table: T,
    filters?: Tables[T]['Row']
  ) {
    let query = supabase.from(table).select('*');
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          query = query.eq(key, value);
        }
      });
    }
    
    const { data, error } = await query;
    if (error) throw error;
    return data;
  }

  // Similar methods for update and delete
}
```

### 2. Authentication System

#### Auth Context
```typescript
// src/contexts/AuthContext.tsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../config/supabase';
import { Profile } from '../types/database';

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  hasPermission: (permission: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Initialize auth state
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      }
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null);
        if (session?.user) {
          await fetchProfile(session.user.id);
        } else {
          setProfile(null);
        }
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId: string) => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    setProfile(data);
  };

  const hasPermission = (permission: string): boolean => {
    if (!profile) return false;
    
    const rolePermissions = {
      admin: ['*'],
      manager: ['inventory', 'customers', 'reports', 'sales'],
      cashier: ['sales', 'customers'],
      inventory_clerk: ['inventory']
    };

    const permissions = rolePermissions[profile.role as keyof typeof rolePermissions];
    return permissions.includes('*') || permissions.includes(permission);
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  return (
    <AuthContext.Provider value={{
      user,
      profile,
      loading,
      signIn,
      signOut,
      hasPermission
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
```

### 3. POS Screen Implementation

#### Main POS Interface
```typescript
// src/screens/pos/POSScreen.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, Alert } from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { CartItem, Product } from '../../types/database';
import { ProductSearch } from '../../components/pos/ProductSearch';
import { CartDisplay } from '../../components/pos/CartDisplay';
import { PaymentModal } from '../../components/pos/PaymentModal';

export const POSScreen: React.FC = () => {
  const { profile } = useAuth();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [showPayment, setShowPayment] = useState(false);
  const [loading, setLoading] = useState(false);

  const addToCart = (product: Product, quantity: number = 1) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(item => 
        item.product_id === product.id && 
        item.variant_id === product.variant_id
      );
      
      if (existingItem) {
        return prevCart.map(item =>
          item.product_id === product.id && item.variant_id === product.variant_id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      
      return [...prevCart, {
        product_id: product.id,
        variant_id: product.variant_id,
        quantity,
        unit_price: product.selling_price,
        total_price: product.selling_price * quantity
      }];
    });
  };

  const removeFromCart = (productId: string, variantId?: string) => {
    setCart(prevCart => prevCart.filter(item => 
      !(item.product_id === productId && item.variant_id === variantId)
    ));
  };

  const updateQuantity = (productId: string, variantId: string | undefined, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId, variantId);
      return;
    }
    
    setCart(prevCart => prevCart.map(item =>
      item.product_id === productId && item.variant_id === variantId
        ? { ...item, quantity, total_price: item.unit_price * quantity }
        : item
    ));
  };

  const calculateTotals = () => {
    const subtotal = cart.reduce((sum, item) => sum + item.total_price, 0);
    const tax = subtotal * 0.08; // Example tax rate
    const total = subtotal + tax;
    
    return { subtotal, tax, total };
  };

  const processSale = async (paymentData: any) => {
    setLoading(true);
    try {
      const { subtotal, tax, total } = calculateTotals();
      
      // Create sale record
      const sale = await DatabaseService.create('sales', {
        store_id: profile?.store_id,
        customer_id: selectedCustomer?.id,
        cashier_id: profile?.id,
        subtotal,
        tax_amount: tax,
        total_amount: total,
        amount_paid: paymentData.amount,
        status: 'completed'
      });

      // Create sale items
      for (const item of cart) {
        await DatabaseService.create('sale_items', {
          sale_id: sale.id,
          product_id: item.product_id,
          variant_id: item.variant_id,
          quantity: item.quantity,
          unit_price: item.unit_price,
          total_price: item.total_price
        });
      }

      // Create payment record
      await DatabaseService.create('payments', {
        sale_id: sale.id,
        payment_method: paymentData.method,
        amount: paymentData.amount,
        status: 'completed'
      });

      // Update inventory
      for (const item of cart) {
        await updateInventory(item.product_id, item.variant_id, -item.quantity);
      }

      // Clear cart
      setCart([]);
      setSelectedCustomer(null);
      setShowPayment(false);
      
      Alert.alert('Success', 'Sale completed successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to process sale');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const updateInventory = async (productId: string, variantId: string | undefined, quantityChange: number) => {
    // Implementation for inventory update
  };

  return (
    <View style={{ flex: 1 }}>
      <View style={{ flex: 1 }}>
        <ProductSearch onProductSelect={addToCart} />
        <CartDisplay
          cart={cart}
          onUpdateQuantity={updateQuantity}
          onRemoveItem={removeFromCart}
          totals={calculateTotals()}
        />
      </View>
      
      <TouchableOpacity
        style={{ padding: 20, backgroundColor: '#007AFF' }}
        onPress={() => setShowPayment(true)}
        disabled={cart.length === 0}
      >
        <Text style={{ color: 'white', textAlign: 'center', fontSize: 18 }}>
          Proceed to Payment (${calculateTotals().total.toFixed(2)})
        </Text>
      </TouchableOpacity>

      <PaymentModal
        visible={showPayment}
        total={calculateTotals().total}
        onPayment={processSale}
        onClose={() => setShowPayment(false)}
      />
    </View>
  );
};
```

### 4. Hardware Integration

#### Barcode Scanner
```typescript
// src/services/hardware/BarcodeScanner.tsx
import React, { useEffect, useRef } from 'react';
import { RNCamera } from 'react-native-camera';

interface BarcodeScannerProps {
  onBarcodeDetected: (barcode: string) => void;
  onClose: () => void;
}

export const BarcodeScanner: React.FC<BarcodeScannerProps> = ({
  onBarcodeDetected,
  onClose
}) => {
  const cameraRef = useRef<RNCamera>(null);

  const onBarCodeRead = (event: any) => {
    const { data } = event;
    onBarcodeDetected(data);
    onClose();
  };

  return (
    <RNCamera
      ref={cameraRef}
      style={{ flex: 1 }}
      type={RNCamera.Constants.Type.back}
      onBarCodeRead={onBarCodeRead}
      captureAudio={false}
    />
  );
};
```

#### Receipt Printer
```typescript
// src/services/hardware/ReceiptPrinter.ts
import { BluetoothSerial } from 'react-native-bluetooth-serial';

export class ReceiptPrinter {
  static async printReceipt(saleData: any) {
    try {
      // Connect to printer
      const isConnected = await BluetoothSerial.isConnected('PRINTER_ADDRESS');
      if (!isConnected) {
        await BluetoothSerial.connect('PRINTER_ADDRESS');
      }

      // Format receipt
      let receiptText = this.formatReceipt(saleData);
      
      // Print receipt
      await BluetoothSerial.write(receiptText);
      
      // Disconnect
      await BluetoothSerial.disconnect();
    } catch (error) {
      console.error('Printing failed:', error);
      throw error;
    }
  }

  private static formatReceipt(saleData: any): string {
    let receipt = '\n';
    receipt += '=====================\n';
    receipt += '       RECEIPT\n';
    receipt += '=====================\n';
    receipt += `Date: ${new Date().toLocaleString()}\n`;
    receipt += `Sale #: ${saleData.sale_number}\n`;
    receipt += '---------------------\n';
    
    saleData.items.forEach((item: any) => {
      receipt += `${item.name}\n`;
      receipt += `  ${item.quantity} x $${item.unit_price} = $${item.total_price}\n`;
    });
    
    receipt += '---------------------\n';
    receipt += `Subtotal: $${saleData.subtotal}\n`;
    receipt += `Tax: $${saleData.tax}\n`;
    receipt += `Total: $${saleData.total}\n`;
    receipt += '=====================\n';
    receipt += '       Thank You!\n';
    receipt += '=====================\n\n';
    
    return receipt;
  }
}
```

### 5. Offline Support

#### Offline Storage
```typescript
// src/services/offline/OfflineStorage.ts
import AsyncStorage from '@react-native-async-storage/async-storage';

export class OfflineStorage {
  private static readonly KEYS = {
    CART: 'offline_cart',
    SALES: 'offline_sales',
    PRODUCTS: 'offline_products',
    INVENTORY: 'offline_inventory'
  };

  static async saveData<T>(key: string, data: T): Promise<void> {
    try {
      const jsonValue = JSON.stringify(data);
      await AsyncStorage.setItem(key, jsonValue);
    } catch (error) {
      console.error('Error saving data:', error);
    }
  }

  static async getData<T>(key: string): Promise<T | null> {
    try {
      const jsonValue = await AsyncStorage.getItem(key);
      return jsonValue != null ? JSON.parse(jsonValue) : null;
    } catch (error) {
      console.error('Error reading data:', error);
      return null;
    }
  }

  static async syncWhenOnline(): Promise<void> {
    // Implementation for syncing offline data when online
  }
}
```

## Testing Strategy

### Unit Tests
```typescript
// __tests__/components/ProductSearch.test.tsx
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { ProductSearch } from '../../src/components/pos/ProductSearch';

describe('ProductSearch', () => {
  it('should search products by SKU', async () => {
    const mockOnProductSelect = jest.fn();
    const { getByPlaceholderText } = render(
      <ProductSearch onProductSelect={mockOnProductSelect} />
    );

    const searchInput = getByPlaceholderText('Search by SKU or name');
    fireEvent.changeText(searchInput, 'TEST123');
    
    // Test search functionality
  });
});
```

### Integration Tests
```typescript
// __tests__/integration/POSScreen.test.tsx
import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { POSScreen } from '../../src/screens/pos/POSScreen';
import { AuthProvider } from '../../src/contexts/AuthContext';

describe('POS Integration', () => {
  it('should complete a sale from product search to payment', async () => {
    const component = (
      <AuthProvider>
        <POSScreen />
      </AuthProvider>
    );

    const { getByText, getByPlaceholderText } = render(component);
    
    // Test complete flow
  });
});
```

## Performance Optimizations

### 1. Image Optimization
- Use WebP format for product images
- Implement lazy loading for product lists
- Cache images locally

### 2. Database Optimization
- Implement proper indexing
- Use database views for complex queries
- Implement pagination for large datasets

### 3. State Management
- Use React Query for server state
- Implement proper memoization
- Optimize re-renders

## Security Considerations

### 1. Data Protection
- Encrypt sensitive data at rest
- Use HTTPS for all API calls
- Implement proper authentication

### 2. Payment Security
- Never store raw payment data
- Use tokenization for card payments
- Implement PCI compliance

### 3. Access Control
- Implement role-based permissions
- Audit all sensitive operations
- Secure API endpoints

## Deployment

### 1. Build Configuration
```javascript
// app.config.js
export default {
  expo: {
    name: 'Retail POS',
    slug: 'retail-pos',
    version: '1.0.0',
    orientation: 'landscape',
    platform: ['ios', 'android'],
    plugins: [
      ['expo-camera'],
      ['expo-bluetooth'],
      ['@stripe/stripe-react-native']
    ],
    extra: {
      eas: {
        projectId: 'your-project-id'
      }
    }
  }
};
```

### 2. Environment Variables
```bash
# .env
EXPO_PUBLIC_SUPABASE_URL=your-supabase-url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=your-stripe-key
```

This implementation guide provides a comprehensive foundation for building the POS system with all the required features and considerations for production deployment.