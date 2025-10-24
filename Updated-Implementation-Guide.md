# Updated POS Implementation Guide

## Project Structure (Root Folder)

```
/
├── app.json                  # Expo configuration
├── package.json              # Node.js dependencies
├── tsconfig.json             # TypeScript configuration
├── babel.config.js           # Babel configuration
├── .env                     # Environment variables
├── assets/                  # Images, fonts, etc.
│   ├── images/
│   ├── icons/
│   └── fonts/
├── src/                     # Source code
│   ├── components/           # Reusable UI components
│   │   ├── common/          # Generic components
│   │   ├── forms/           # Form components
│   │   ├── pos/             # POS-specific components
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
│   │   ├── hardware/        # Hardware integration
│   │   └── currency/        # PHP currency service integration
│   ├── hooks/               # Custom React hooks
│   ├── utils/               # Utility functions
│   ├── types/               # TypeScript type definitions
│   ├── constants/           # App constants
│   └── store/               # State management
├── php/                     # PHP backend services
│   ├── currency/             # Currency calculation services
│   │   ├── CurrencyCalculator.php
│   │   ├── TaxCalculator.php
│   │   └── DiscountCalculator.php
│   ├── reports/              # PHP reporting services
│   │   ├── SalesReport.php
│   │   └── InventoryReport.php
│   ├── api/                 # PHP API endpoints
│   │   ├── currency.php
│   │   ├── taxes.php
│   │   └── calculations.php
│   └── config/              # PHP configuration
│       └── database.php
├── docs/                    # Documentation
├── __tests__/               # Test files
└── node_modules/            # Dependencies
```

## PHP Currency Integration

### 1. PHP Currency Calculator

```php
<?php
// php/currency/CurrencyCalculator.php

class CurrencyCalculator {
    private static $precision = 2;
    private static $currency = 'USD';
    
    public static function setCurrency(string $currency): void {
        self::$currency = $currency;
    }
    
    public static function setPrecision(int $precision): void {
        self::$precision = $precision;
    }
    
    public static function add(float $amount1, float $amount2): float {
        return self::round($amount1 + $amount2);
    }
    
    public static function subtract(float $amount1, float $amount2): float {
        return self::round($amount1 - $amount2);
    }
    
    public static function multiply(float $amount, float $multiplier): float {
        return self::round($amount * $multiplier);
    }
    
    public static function divide(float $amount, float $divisor): float {
        if ($divisor == 0) {
            throw new InvalidArgumentException('Division by zero');
        }
        return self::round($amount / $divisor);
    }
    
    public static function calculateTax(float $amount, float $taxRate): float {
        return self::round($amount * $taxRate);
    }
    
    public static function calculateDiscount(float $amount, float $discountRate): float {
        return self::round($amount * $discountRate);
    }
    
    public static function applyDiscount(float $amount, float $discountAmount): float {
        return self::round($amount - $discountAmount);
    }
    
    public static function formatCurrency(float $amount): string {
        $symbols = [
            'USD' => '$',
            'EUR' => '€',
            'GBP' => '£',
            'JPY' => '¥'
        ];
        
        $symbol = $symbols[self::$currency] ?? '$';
        return $symbol . number_format($amount, self::$precision);
    }
    
    private static function round(float $amount): float {
        // Use proper rounding for currency to avoid floating point issues
        return round($amount, self::$precision, PHP_ROUND_HALF_UP);
    }
    
    public static function calculateTotal(array $items): float {
        $total = 0.0;
        foreach ($items as $item) {
            $itemTotal = self::multiply($item['unit_price'], $item['quantity']);
            $total = self::add($total, $itemTotal);
        }
        return $total;
    }
    
    public static function calculateSubtotalWithTax(float $subtotal, float $taxRate): array {
        $taxAmount = self::calculateTax($subtotal, $taxRate);
        $total = self::add($subtotal, $taxAmount);
        
        return [
            'subtotal' => $subtotal,
            'tax_amount' => $taxAmount,
            'total' => $total
        ];
    }
}
```

### 2. PHP Tax Calculator

```php
<?php
// php/currency/TaxCalculator.php

class TaxCalculator {
    private static $taxRates = [
        'standard' => 0.08,
        'reduced' => 0.05,
        'zero' => 0.00
    ];
    
    public static function setTaxRate(string $type, float $rate): void {
        self::$taxRates[$type] = $rate;
    }
    
    public static function getTaxRate(string $type): float {
        return self::$taxRates[$type] ?? self::$taxRates['standard'];
    }
    
    public static function calculateTax(float $amount, string $taxType = 'standard'): float {
        $rate = self::getTaxRate($taxType);
        return CurrencyCalculator::calculateTax($amount, $rate);
    }
    
    public static function calculateTaxForItems(array $items): array {
        $taxBreakdown = [];
        $totalTax = 0.0;
        
        foreach ($items as $item) {
            $taxType = $item['tax_type'] ?? 'standard';
            $itemTax = self::calculateTax($item['total_price'], $taxType);
            
            if (!isset($taxBreakdown[$taxType])) {
                $taxBreakdown[$taxType] = 0.0;
            }
            
            $taxBreakdown[$taxType] = CurrencyCalculator::add($taxBreakdown[$taxType], $itemTax);
            $totalTax = CurrencyCalculator::add($totalTax, $itemTax);
        }
        
        return [
            'tax_breakdown' => $taxBreakdown,
            'total_tax' => $totalTax
        ];
    }
}
```

### 3. PHP Discount Calculator

```php
<?php
// php/currency/DiscountCalculator.php

class DiscountCalculator {
    public static function calculatePercentageDiscount(float $amount, float $percentage): float {
        $discountAmount = CurrencyCalculator::multiply($amount, $percentage / 100);
        return $discountAmount;
    }
    
    public static function applyPercentageDiscount(float $amount, float $percentage): float {
        $discountAmount = self::calculatePercentageDiscount($amount, $percentage);
        return CurrencyCalculator::applyDiscount($amount, $discountAmount);
    }
    
    public static function calculateFixedDiscount(float $amount, float $discountAmount): float {
        return min($discountAmount, $amount);
    }
    
    public static function applyFixedDiscount(float $amount, float $discountAmount): float {
        $actualDiscount = self::calculateFixedDiscount($amount, $discountAmount);
        return CurrencyCalculator::applyDiscount($amount, $actualDiscount);
    }
    
    public static function calculateBestDiscount(float $amount, array $discounts): array {
        $bestDiscount = [
            'type' => null,
            'amount' => 0,
            'final_amount' => $amount
        ];
        
        foreach ($discounts as $discount) {
            $finalAmount = $amount;
            $discountAmount = 0;
            
            if ($discount['type'] === 'percentage') {
                $finalAmount = self::applyPercentageDiscount($amount, $discount['value']);
                $discountAmount = CurrencyCalculator::subtract($amount, $finalAmount);
            } elseif ($discount['type'] === 'fixed') {
                $finalAmount = self::applyFixedDiscount($amount, $discount['value']);
                $discountAmount = CurrencyCalculator::subtract($amount, $finalAmount);
            }
            
            if ($finalAmount < $bestDiscount['final_amount']) {
                $bestDiscount = [
                    'type' => $discount['type'],
                    'amount' => $discountAmount,
                    'final_amount' => $finalAmount
                ];
            }
        }
        
        return $bestDiscount;
    }
}
```

### 4. PHP API Endpoints

```php
<?php
// php/api/currency.php

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

require_once '../currency/CurrencyCalculator.php';
require_once '../currency/TaxCalculator.php';
require_once '../currency/DiscountCalculator.php';

$action = $_POST['action'] ?? $_GET['action'] ?? '';

try {
    switch ($action) {
        case 'calculate_total':
            $items = json_decode($_POST['items'], true);
            $total = CurrencyCalculator::calculateTotal($items);
            echo json_encode(['success' => true, 'total' => $total]);
            break;
            
        case 'calculate_tax':
            $amount = floatval($_POST['amount']);
            $taxType = $_POST['tax_type'] ?? 'standard';
            $tax = TaxCalculator::calculateTax($amount, $taxType);
            echo json_encode(['success' => true, 'tax' => $tax]);
            break;
            
        case 'calculate_discount':
            $amount = floatval($_POST['amount']);
            $discountType = $_POST['discount_type'];
            $discountValue = floatval($_POST['discount_value']);
            
            if ($discountType === 'percentage') {
                $finalAmount = DiscountCalculator::applyPercentageDiscount($amount, $discountValue);
                $discountAmount = CurrencyCalculator::subtract($amount, $finalAmount);
            } else {
                $finalAmount = DiscountCalculator::applyFixedDiscount($amount, $discountValue);
                $discountAmount = CurrencyCalculator::subtract($amount, $finalAmount);
            }
            
            echo json_encode([
                'success' => true,
                'original_amount' => $amount,
                'discount_amount' => $discountAmount,
                'final_amount' => $finalAmount
            ]);
            break;
            
        case 'calculate_sale_total':
            $items = json_decode($_POST['items'], true);
            $discounts = json_decode($_POST['discounts'] ?? '[]', true);
            
            $subtotal = CurrencyCalculator::calculateTotal($items);
            $discountInfo = DiscountCalculator::calculateBestDiscount($subtotal, $discounts);
            $afterDiscount = $discountInfo['final_amount'];
            
            $taxInfo = TaxCalculator::calculateTaxForItems($items);
            $total = CurrencyCalculator::add($afterDiscount, $taxInfo['total_tax']);
            
            echo json_encode([
                'success' => true,
                'subtotal' => $subtotal,
                'discount' => $discountInfo,
                'tax' => $taxInfo,
                'total' => $total
            ]);
            break;
            
        default:
            throw new Exception('Invalid action');
    }
} catch (Exception $e) {
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
```

## React Native Currency Service Integration

### 1. Currency Service

```typescript
// src/services/currency/CurrencyService.ts
import { PHP_API_BASE_URL } from '../config/api';

export interface CurrencyCalculationResult {
  success: boolean;
  total?: number;
  tax?: number;
  discount_amount?: number;
  final_amount?: number;
  error?: string;
}

export interface SaleCalculationResult {
  success: boolean;
  subtotal?: number;
  discount?: {
    type: string;
    amount: number;
    final_amount: number;
  };
  tax?: {
    tax_breakdown: Record<string, number>;
    total_tax: number;
  };
  total?: number;
  error?: string;
}

export class CurrencyService {
  private static async callPHPAPI(action: string, data: Record<string, any>): Promise<any> {
    try {
      const formData = new FormData();
      formData.append('action', action);
      
      Object.keys(data).forEach(key => {
        if (typeof data[key] === 'object') {
          formData.append(key, JSON.stringify(data[key]));
        } else {
          formData.append(key, String(data[key]));
        }
      });

      const response = await fetch(`${PHP_API_BASE_URL}/currency.php`, {
        method: 'POST',
        body: formData,
        headers: {
          'Accept': 'application/json',
        },
      });

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Currency API error:', error);
      throw error;
    }
  }

  static async calculateTotal(items: Array<{
    unit_price: number;
    quantity: number;
  }>): Promise<number> {
    const result = await this.callPHPAPI('calculate_total', { items });
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to calculate total');
    }
    
    return result.total;
  }

  static async calculateTax(amount: number, taxType: string = 'standard'): Promise<number> {
    const result = await this.callPHPAPI('calculate_tax', {
      amount,
      tax_type: taxType
    });
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to calculate tax');
    }
    
    return result.tax;
  }

  static async calculateDiscount(
    amount: number,
    discountType: 'percentage' | 'fixed',
    discountValue: number
  ): Promise<{
    original_amount: number;
    discount_amount: number;
    final_amount: number;
  }> {
    const result = await this.callPHPAPI('calculate_discount', {
      amount,
      discount_type: discountType,
      discount_value: discountValue
    });
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to calculate discount');
    }
    
    return {
      original_amount: result.original_amount,
      discount_amount: result.discount_amount,
      final_amount: result.final_amount
    };
  }

  static async calculateSaleTotal(
    items: Array<{
      unit_price: number;
      quantity: number;
      tax_type?: string;
    }>,
    discounts: Array<{
      type: 'percentage' | 'fixed';
      value: number;
    }> = []
  ): Promise<SaleCalculationResult> {
    const result = await this.callPHPAPI('calculate_sale_total', {
      items,
      discounts
    });
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to calculate sale total');
    }
    
    return result;
  }

  static formatCurrency(amount: number, currency: string = 'USD'): string {
    const symbols: Record<string, string> = {
      'USD': '$',
      'EUR': '€',
      'GBP': '£',
      'JPY': '¥'
    };
    
    const symbol = symbols[currency] || '$';
    return `${symbol}${amount.toFixed(2)}`;
  }
}
```

### 2. Updated POS Screen with PHP Integration

```typescript
// src/screens/pos/POSScreen.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, Alert } from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { CartItem, Product } from '../../types/database';
import { CurrencyService } from '../../services/currency/CurrencyService';
import { ProductSearch } from '../../components/pos/ProductSearch';
import { CartDisplay } from '../../components/pos/CartDisplay';
import { PaymentModal } from '../../components/pos/PaymentModal';

export const POSScreen: React.FC = () => {
  const { profile } = useAuth();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [showPayment, setShowPayment] = useState(false);
  const [loading, setLoading] = useState(false);
  const [calculations, setCalculations] = useState<any>(null);

  useEffect(() => {
    calculateTotals();
  }, [cart]);

  const calculateTotals = async () => {
    if (cart.length === 0) {
      setCalculations(null);
      return;
    }

    try {
      const items = cart.map(item => ({
        unit_price: item.unit_price,
        quantity: item.quantity,
        tax_type: 'standard' // Could be configurable per item
      }));

      const result = await CurrencyService.calculateSaleTotal(items);
      setCalculations(result);
    } catch (error) {
      console.error('Calculation error:', error);
      Alert.alert('Error', 'Failed to calculate totals');
    }
  };

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

  const processSale = async (paymentData: any) => {
    setLoading(true);
    try {
      if (!calculations) {
        throw new Error('No calculations available');
      }

      // Create sale record using PHP-calculated values
      const sale = await DatabaseService.create('sales', {
        store_id: profile?.store_id,
        customer_id: selectedCustomer?.id,
        cashier_id: profile?.id,
        subtotal: calculations.subtotal,
        tax_amount: calculations.tax?.total_tax || 0,
        discount_amount: calculations.discount?.amount || 0,
        total_amount: calculations.total,
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
      setCalculations(null);
      
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
          calculations={calculations}
          onUpdateQuantity={updateQuantity}
          onRemoveItem={removeFromCart}
        />
      </View>
      
      <TouchableOpacity
        style={{ padding: 20, backgroundColor: '#007AFF' }}
        onPress={() => setShowPayment(true)}
        disabled={cart.length === 0 || !calculations}
      >
        <Text style={{ color: 'white', textAlign: 'center', fontSize: 18 }}>
          Proceed to Payment {calculations && `(${CurrencyService.formatCurrency(calculations.total)})`}
        </Text>
      </TouchableOpacity>

      <PaymentModal
        visible={showPayment}
        total={calculations?.total || 0}
        onPayment={processSale}
        onClose={() => setShowPayment(false)}
      />
    </View>
  );
};
```

## PHP Server Setup

### 1. Apache/Nginx Configuration

```apache
# Apache .htaccess for PHP API
<IfModule mod_rewrite.c>
    RewriteEngine On
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteRule ^(.*)$ index.php [QSA,L]
</IfModule>

# PHP settings
php_value precision 16
php_value serialize_precision -1
```

### 2. PHP Configuration

```php
<?php
// php/config/database.php

class DatabaseConfig {
    private static $config = [
        'supabase_url' => 'your-supabase-url',
        'supabase_key' => 'your-supabase-key',
        'currency_precision' => 2,
        'default_currency' => 'USD',
        'tax_rates' => [
            'standard' => 0.08,
            'reduced' => 0.05,
            'zero' => 0.00
        ]
    ];
    
    public static function get(string $key) {
        return self::$config[$key] ?? null;
    }
    
    public static function set(string $key, $value): void {
        self::$config[$key] = $value;
    }
}
```

This updated implementation guide incorporates PHP for all currency calculations while maintaining the React Native frontend, ensuring accurate financial calculations and proper currency handling.