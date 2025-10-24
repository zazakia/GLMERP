import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Alert, TextInput, Modal, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../../contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../../services/supabase/config';
import { Database } from '../../../types/database';

type Product = Database['public']['Tables']['GLMERP01_products']['Row'];
type ProductVariant = Database['public']['Tables']['GLMERP01_product_variants']['Row'];
type CartItem = {
  product: Product;
  variant: ProductVariant | null;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
};

const SalesScreen = ({ navigation }: { navigation: any }) => {
  const { user, profile, company, branch, location } = useAuth();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [amountPaid, setAmountPaid] = useState(0);
  const [changeAmount, setChangeAmount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      // In a real app, this would fetch products from Supabase
      // For now, we'll use mock data
      const mockProducts: Product[] = [
        {
          id: '1',
          company_id: company?.id || '',
          sku: 'PROD001',
          barcode: '123456789012',
          name: 'Product 1',
          description: 'Description for product 1',
          category_id: 'cat1',
          cost_price: 10.00,
          selling_price: 15.00,
          tax_rate: 0.08,
          track_inventory: true,
          allow_decimal_quantity: false,
          image_urls: ['https://picsum.photos/seed/pics/200/300/300.jpg'],
          attributes: { color: 'red', size: 'medium' },
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: '2',
          company_id: company?.id || '',
          sku: 'PROD002',
          barcode: '123456789013',
          name: 'Product 2',
          description: 'Description for product 2',
          category_id: 'cat1',
          cost_price: 20.00,
          selling_price: 30.00,
          tax_rate: 0.08,
          track_inventory: true,
          allow_decimal_quantity: true,
          image_urls: ['https://picsum.photos/seed/pics/200/301/301.jpg'],
          attributes: { color: 'blue', size: 'large' },
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: '3',
          company_id: company?.id || '',
          sku: 'PROD003',
          barcode: '123456789014',
          name: 'Product 3',
          description: 'Description for product 3',
          category_id: 'cat2',
          cost_price: 5.00,
          selling_price: 8.00,
          tax_rate: 0.08,
          track_inventory: true,
          allow_decimal_quantity: false,
          image_urls: ['https://picsum.photos/seed/pics/200/302/302.jpg'],
          attributes: { color: 'green', size: 'small' },
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ];
      
      setProducts(mockProducts);
    } catch (error) {
      console.error('Error fetching products:', error);
      Alert.alert('Error', 'Failed to load products');
    }
  };

  const addToCart = (product: Product, variant: ProductVariant | null = null) => {
    const existingItemIndex = cart.findIndex(
      item => item.product.id === product.id && 
      (!variant || item.variant?.id === variant.id)
    );
    
    if (existingItemIndex >= 0) {
      // Update existing item
      const updatedCart = [...cart];
      updatedCart[existingItemIndex].quantity += 1;
      updatedCart[existingItemIndex].totalPrice = updatedCart[existingItemIndex].unitPrice * updatedCart[existingItemIndex].quantity;
      setCart(updatedCart);
    } else {
      // Add new item
      const unitPrice = variant ? variant.selling_price : product.selling_price;
      const newItem: CartItem = {
        product,
        variant,
        quantity: 1,
        unitPrice,
        totalPrice: unitPrice,
      };
      setCart([...cart, newItem]);
    }
  };

  const removeFromCart = (index: number) => {
    const updatedCart = [...cart];
    updatedCart.splice(index, 1);
    setCart(updatedCart);
  };

  const updateQuantity = (index: number, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(index);
      return;
    }
    
    const updatedCart = [...cart];
    updatedCart[index].quantity = quantity;
    updatedCart[index].totalPrice = updatedCart[index].unitPrice * quantity;
    setCart(updatedCart);
  };

  const calculateSubtotal = () => {
    return cart.reduce((total, item) => total + item.totalPrice, 0);
  };

  const calculateTax = () => {
    const subtotal = calculateSubtotal();
    return subtotal * 0.08; // 8% tax rate
  };

  const calculateTotal = () => {
    const subtotal = calculateSubtotal();
    const tax = calculateTax();
    return subtotal + tax;
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handlePayment = () => {
    const total = calculateTotal();
    
    if (paymentMethod === 'cash') {
      const change = amountPaid - total;
      setChangeAmount(change);
    } else {
      setChangeAmount(0);
    }
    
    // In a real app, this would process the payment
    // For now, we'll just show a success message
    Alert.alert(
      'Payment Successful',
      `Payment of ${total.toFixed(2)} processed successfully.`,
      [
        { text: 'OK', onPress: () => {
          setShowPaymentModal(false);
          setCart([]);
          setAmountPaid(0);
          setChangeAmount(0);
        }}
      ]
    );
  };

  const renderCartItem = ({ item, index }: { item: CartItem; index: number }) => {
    return (
      <View style={styles.cartItem}>
        <View style={styles.itemInfo}>
          <Text style={styles.itemName}>{item.product.name}</Text>
          {item.variant && (
            <Text style={styles.itemVariant}>{item.variant.name}</Text>
          )}
          <Text style={styles.itemPrice}>${item.unitPrice.toFixed(2)}</Text>
        </View>
        
        <View style={styles.itemControls}>
          <TouchableOpacity
            style={styles.quantityButton}
            onPress={() => updateQuantity(index, item.quantity - 1)}
          >
            <Text style={styles.quantityButtonText}>-</Text>
          </TouchableOpacity>
          
          <Text style={styles.quantity}>{item.quantity}</Text>
          
          <TouchableOpacity
            style={styles.quantityButton}
            onPress={() => updateQuantity(index, item.quantity + 1)}
          >
            <Text style={styles.quantityButtonText}>+</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.removeButton}
            onPress={() => removeFromCart(index)}
          >
            <Ionicons name="trash" size={20} color="#e74c3c" />
          </TouchableOpacity>
        </View>
        
        <View style={styles.itemTotal}>
          <Text style={styles.itemTotalLabel}>Total:</Text>
          <Text style={styles.itemTotalValue}>${item.totalPrice.toFixed(2)}</Text>
        </View>
      </View>
    );
  };

  const renderProductItem = ({ item }: { item: Product }) => {
    return (
      <TouchableOpacity
        style={styles.productItem}
        onPress={() => addToCart(item)}
      >
        <Text style={styles.productName}>{item.name}</Text>
        <Text style={styles.productPrice}>${item.selling_price.toFixed(2)}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Sales</Text>
        <Text style={styles.subtitle}>Process transactions and manage sales</Text>
      </View>
      
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search products..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>
      
      <View style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Products</Text>
          <FlatList
            data={filteredProducts}
            renderItem={renderProductItem}
            keyExtractor={item => item.id}
            numColumns={2}
            contentContainerStyle={styles.productList}
          />
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Cart</Text>
          {cart.length === 0 ? (
            <View style={styles.emptyCart}>
              <Text style={styles.emptyCartText}>Your cart is empty</Text>
            </View>
          ) : (
            <FlatList
              data={cart}
              renderItem={renderCartItem}
              keyExtractor={(item, index) => `${item.product.id}-${index}`}
              ListFooterComponent={() => (
                <View style={styles.cartFooter}>
                  <View style={styles.cartTotals}>
                    <View style={styles.totalRow}>
                      <Text style={styles.totalLabel}>Subtotal:</Text>
                      <Text style={styles.totalValue}>${calculateSubtotal().toFixed(2)}</Text>
                    </View>
                    
                    <View style={styles.totalRow}>
                      <Text style={styles.totalLabel}>Tax:</Text>
                      <Text style={styles.totalValue}>${calculateTax().toFixed(2)}</Text>
                    </View>
                    
                    <View style={styles.totalRow}>
                      <Text style={styles.totalLabel}>Total:</Text>
                      <Text style={styles.totalValue}>${calculateTotal().toFixed(2)}</Text>
                    </View>
                  </View>
                  
                  <TouchableOpacity
                    style={styles.checkoutButton}
                    onPress={() => setShowPaymentModal(true)}
                  >
                    <Text style={styles.checkoutButtonText}>Checkout</Text>
                  </TouchableOpacity>
                </View>
              )}
            />
          )}
        </View>
      </View>
      
      <Modal
        animationType="slide"
        transparent={true}
        visible={showPaymentModal}
        onRequestClose={() => setShowPaymentModal(false)}
      >
        <View style={styles.paymentModal}>
          <Text style={styles.paymentTitle}>Payment</Text>
          
          <View style={styles.paymentMethods}>
            <TouchableOpacity
              style={[
                styles.paymentMethod,
                paymentMethod === 'cash' && styles.selectedPaymentMethod
              ]}
              onPress={() => setPaymentMethod('cash')}
            >
              <Ionicons name="cash" size={24} color="#2c3e50" />
              <Text style={styles.paymentMethodText}>Cash</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.paymentMethod,
                paymentMethod === 'card' && styles.selectedPaymentMethod
              ]}
              onPress={() => setPaymentMethod('card')}
            >
              <Ionicons name="card" size={24} color="#2c3e50" />
              <Text style={styles.paymentMethodText}>Card</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.paymentMethod,
                paymentMethod === 'digital_wallet' && styles.selectedPaymentMethod
              ]}
              onPress={() => setPaymentMethod('digital_wallet')}
            >
              <Ionicons name="phone-portrait" size={24} color="#2c3e50" />
              <Text style={styles.paymentMethodText}>Digital Wallet</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.paymentAmount}>
            <Text style={styles.paymentAmountLabel}>Amount:</Text>
            <Text style={styles.paymentAmountValue}>${calculateTotal().toFixed(2)}</Text>
          </View>
          
          {paymentMethod === 'cash' && (
            <View style={styles.cashPayment}>
              <TextInput
                style={styles.amountInput}
                placeholder="Amount paid"
                value={amountPaid.toString()}
                onChangeText={text => setAmountPaid(parseFloat(text) || 0)}
                keyboardType="numeric"
              />
              
              <View style={styles.changeContainer}>
                <Text style={styles.changeLabel}>Change:</Text>
                <Text style={styles.changeValue}>${changeAmount.toFixed(2)}</Text>
              </View>
            </View>
          )}
          
          <View style={styles.paymentButtons}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setShowPaymentModal(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.payButton}
              onPress={handlePayment}
              disabled={loading}
            >
              <Text style={styles.payButtonText}>
                {loading ? 'Processing...' : 'Pay'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
  },
  searchContainer: {
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  searchInput: {
    height: 40,
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 15,
    backgroundColor: '#fff',
    fontSize: 16,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  productList: {
    justifyContent: 'space-between',
  },
  productItem: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    width: '48%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  productName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  productPrice: {
    fontSize: 14,
    color: '#666',
  },
  cartItem: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    flexDirection: 'row',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  itemVariant: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  itemPrice: {
    fontSize: 14,
    color: '#666',
  },
  itemControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quantityButton: {
    backgroundColor: '#e0e0e0',
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 5,
  },
  quantityButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  quantity: {
    fontSize: 16,
    fontWeight: 'bold',
    marginHorizontal: 10,
  },
  removeButton: {
    backgroundColor: '#e74c3c',
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemTotal: {
    alignItems: 'flex-end',
  },
  itemTotalLabel: {
    fontSize: 14,
    color: '#666',
  },
  itemTotalValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  cartFooter: {
    borderTopWidth: 1,
    borderTopColor: '#ddd',
    paddingTop: 15,
  },
  cartTotals: {
    marginBottom: 20,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  totalLabel: {
    fontSize: 16,
    color: '#666',
  },
  totalValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  checkoutButton: {
    backgroundColor: '#2c3e50',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  checkoutButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  emptyCart: {
    alignItems: 'center',
    padding: 50,
  },
  emptyCartText: {
    fontSize: 16,
    color: '#666',
  },
  paymentModal: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
    margin: 20,
  },
  paymentTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  paymentMethods: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  paymentMethod: {
    alignItems: 'center',
    padding: 15,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  selectedPaymentMethod: {
    borderColor: '#2c3e50',
    backgroundColor: '#f0f8ff',
  },
  paymentMethodText: {
    fontSize: 16,
    color: '#333',
    marginTop: 5,
  },
  paymentAmount: {
    marginBottom: 20,
  },
  paymentAmountLabel: {
    fontSize: 16,
    color: '#666',
    marginBottom: 5,
  },
  paymentAmountValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  cashPayment: {
    marginBottom: 20,
  },
  amountInput: {
    height: 40,
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 15,
    backgroundColor: '#fff',
    fontSize: 16,
    marginBottom: 10,
  },
  changeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  changeLabel: {
    fontSize: 16,
    color: '#666',
  },
  changeValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  paymentButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cancelButton: {
    backgroundColor: '#e0e0e0',
    padding: 15,
    borderRadius: 10,
    flex: 1,
    marginRight: 10,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#fff',
  },
  payButton: {
    backgroundColor: '#2c3e50',
    padding: 15,
    borderRadius: 10,
    flex: 1,
    alignItems: 'center',
  },
  payButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
});

export default SalesScreen;