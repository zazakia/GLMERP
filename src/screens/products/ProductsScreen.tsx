import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Alert, TextInput, Modal, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../../contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../../services/supabase/config';
import { Database } from '../../../types/database';

type Product = Database['public']['Tables']['GLMERP01_products']['Row'];
type Category = Database['public']['Tables']['GLMERP01_categories']['Row'];

const ProductsScreen = ({ navigation, route }: { navigation: any; route: any }) => {
  const { user, profile, company, branch, location, hasPermission } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchCategories();
    fetchProducts();
  }, []);

  useEffect(() => {
    if (selectedCategory) {
      setFilteredProducts(products.filter(product => product.category_id === selectedCategory));
    } else {
      setFilteredProducts(products);
    }
  }, [products, selectedCategory]);

  const fetchCategories = async () => {
    try {
      // In a real app, this would fetch categories from Supabase
      // For now, we'll use mock data
      const mockCategories: Category[] = [
        {
          id: 'cat1',
          company_id: company?.id || '',
          name: 'Electronics',
          description: 'Electronic devices and accessories',
          parent_id: null,
          image_url: 'https://picsum.photos/seed/pics/200/300/300.jpg',
          sort_order: 1,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: 'cat2',
          company_id: company?.id || '',
          name: 'Clothing',
          description: 'Apparel and accessories',
          parent_id: null,
          image_url: 'https://picsum.photos/seed/pics/200/301/301.jpg',
          sort_order: 2,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: 'cat3',
          company_id: company?.id || '',
          name: 'Food & Beverages',
          description: 'Consumable items',
          parent_id: null,
          image_url: 'https://picsum.photos/seed/pics/200/302/302.jpg',
          sort_order: 3,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ];
      
      setCategories(mockCategories);
    } catch (error) {
      console.error('Error fetching categories:', error);
      Alert.alert('Error', 'Failed to load categories');
    }
  };

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
          name: 'Laptop',
          description: 'High-performance laptop with 16GB RAM',
          category_id: 'cat1',
          cost_price: 800.00,
          selling_price: 1200.00,
          tax_rate: 0.08,
          track_inventory: true,
          allow_decimal_quantity: false,
          image_urls: ['https://picsum.photos/seed/pics/200/300/300.jpg'],
          attributes: { brand: 'BrandX', model: 'ModelY', color: 'Black' },
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: '2',
          company_id: company?.id || '',
          sku: 'PROD002',
          barcode: '123456789013',
          name: 'T-Shirt',
          description: 'Cotton t-shirt with graphic print',
          category_id: 'cat2',
          cost_price: 10.00,
          selling_price: 25.00,
          tax_rate: 0.08,
          track_inventory: true,
          allow_decimal_quantity: false,
          image_urls: ['https://picsum.photos/seed/pics/200/301/301.jpg'],
          attributes: { brand: 'BrandA', size: 'Medium', color: 'Blue' },
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: '3',
          company_id: company?.id || '',
          sku: 'PROD003',
          barcode: '123456789014',
          name: 'Coffee',
          description: 'Premium arabica coffee beans',
          category_id: 'cat3',
          cost_price: 5.00,
          selling_price: 12.00,
          tax_rate: 0.08,
          track_inventory: true,
          allow_decimal_quantity: true,
          image_urls: ['https://picsum.photos/seed/pics/200/302/302.jpg'],
          attributes: { brand: 'BrandC', origin: 'Colombia', roast: 'Medium' },
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

  const onRefresh = () => {
    setRefreshing(true);
    fetchCategories().then(() => {
      fetchProducts().then(() => {
        setRefreshing(false);
      });
    });
  };

  const openAddModal = () => {
    setShowAddModal(true);
  };

  const openEditModal = (product: Product) => {
    setSelectedProduct(product);
    setShowEditModal(true);
  };

  const closeModals = () => {
    setShowAddModal(false);
    setShowEditModal(false);
    setSelectedProduct(null);
  };

  const handleAddProduct = async (productData: any) => {
    try {
      setLoading(true);
      // In a real app, this would add the product to Supabase
      // For now, we'll just simulate a successful addition
      setTimeout(() => {
        Alert.alert(
          'Product Added',
          'Product has been added successfully.',
          [
            { text: 'OK', onPress: () => closeModals() }
          ]
        );
        setLoading(false);
        closeModals();
        fetchProducts();
      }, 1000);
    } catch (error) {
      setLoading(false);
      Alert.alert('Error', 'Failed to add product');
    }
  };

  const handleEditProduct = async (productData: any) => {
    if (!selectedProduct) return;
    
    try {
      setLoading(true);
      // In a real app, this would update the product in Supabase
      // For now, we'll just simulate a successful update
      setTimeout(() => {
        Alert.alert(
          'Product Updated',
          'Product has been updated successfully.',
          [
            { text: 'OK', onPress: () => closeModals() }
          ]
        );
        setLoading(false);
        closeModals();
        fetchProducts();
      }, 1000);
    } catch (error) {
      setLoading(false);
      Alert.alert('Error', 'Failed to update product');
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    try {
      setLoading(true);
      // In a real app, this would delete the product from Supabase
      // For now, we'll just simulate a successful deletion
      setTimeout(() => {
        Alert.alert(
          'Product Deleted',
          'Product has been deleted successfully.',
          [
            { text: 'OK', onPress: () => closeModals() }
          ]
        );
        setLoading(false);
        fetchProducts();
      }, 1000);
    } catch (error) {
      setLoading(false);
      Alert.alert('Error', 'Failed to delete product');
    }
  };

  const filteredProductsList = products.filter(product =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderProductItem = ({ item }: { item: Product }) => {
    return (
      <View style={styles.productItem}>
        <View style={styles.productInfo}>
          <Text style={styles.productName}>{item.name}</Text>
          <Text style={styles.productSku}>SKU: {item.sku}</Text>
          <Text style={styles.productPrice}>${item.selling_price.toFixed(2)}</Text>
        </View>
        
        <View style={styles.productActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => openEditModal(item)}
          >
            <Ionicons name="create" size={20} color="#2c3e50" />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleDeleteProduct(item.id)}
          >
            <Ionicons name="trash" size={20} color="#e74c3c" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderCategoryItem = ({ item }: { item: Category }) => {
    return (
      <TouchableOpacity
        style={[
          styles.categoryItem,
          selectedCategory === item.id && styles.selectedCategoryItem
        ]}
        onPress={() => setSelectedCategory(selectedCategory === item.id ? null : item.id)}
      >
        <Text style={styles.categoryName}>{item.name}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Products</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={openAddModal}
        >
          <Ionicons name="add" size={24} color="#fff" />
          <Text style={styles.addButtonText}>Add Product</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search products..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>
      
      <View style={styles.categoriesContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <TouchableOpacity
            style={[
              styles.categoryItem,
              !selectedCategory && styles.selectedCategoryItem
            ]}
            onPress={() => setSelectedCategory(null)}
          >
            <Text style={styles.categoryName}>All</Text>
          </TouchableOpacity>
          
          {categories.map(renderCategoryItem)}
        </ScrollView>
      </View>
      
      <FlatList
        data={filteredProductsList}
        renderItem={renderProductItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.productsList}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#2c3e50"
          />
        }
      />
      
      <Modal
        animationType="slide"
        transparent={true}
        visible={showAddModal || showEditModal}
        onRequestClose={closeModals}
      >
        <View style={styles.modalContainer}>
          <Text style={styles.modalTitle}>
            {showAddModal ? 'Add Product' : 'Edit Product'}
          </Text>
          
          <View style={styles.form}>
            <TextInput
              style={styles.input}
              placeholder="Product Name"
              defaultValue={selectedProduct?.name || ''}
            />
            
            <TextInput
              style={styles.input}
              placeholder="SKU"
              defaultValue={selectedProduct?.sku || ''}
            />
            
            <TextInput
              style={styles.input}
              placeholder="Selling Price"
              defaultValue={selectedProduct?.selling_price?.toString() || ''}
              keyboardType="numeric"
            />
            
            <TextInput
              style={styles.input}
              placeholder="Cost Price"
              defaultValue={selectedProduct?.cost_price?.toString() || ''}
              keyboardType="numeric"
            />
          </View>
          
          <View style={styles.modalButtons}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={closeModals}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.saveButton, loading && styles.buttonDisabled]}
              onPress={() => showAddModal ? handleAddProduct({}) : handleEditProduct({})}
              disabled={loading}
            >
              <Text style={styles.saveButtonText}>
                {loading ? 'Saving...' : 'Save'}
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#2c3e50',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  addButton: {
    flexDirection: 'row',
    backgroundColor: '#4caf50',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 5,
    alignItems: 'center',
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  searchContainer: {
    paddingHorizontal: 20,
    marginBottom: 10,
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
  categoriesContainer: {
    marginBottom: 10,
  },
  categoryItem: {
    backgroundColor: '#fff',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 5,
    marginRight: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  selectedCategoryItem: {
    backgroundColor: '#2c3e50',
  },
  categoryName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  productsList: {
    flex: 1,
  },
  productItem: {
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
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  productSku: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  productPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  productActions: {
    flexDirection: 'row',
  },
  actionButton: {
    backgroundColor: '#f0f0f0',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  modalContainer: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
    margin: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  form: {
    marginBottom: 20,
  },
  input: {
    height: 50,
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 5,
    marginBottom: 15,
    paddingHorizontal: 15,
    backgroundColor: '#fff',
    fontSize: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cancelButton: {
    backgroundColor: '#e0e0e0',
    padding: 15,
    borderRadius: 5,
    flex: 1,
    marginRight: 10,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  saveButton: {
    backgroundColor: '#2c3e50',
    padding: 15,
    borderRadius: 5,
    flex: 2,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#a0a0a0',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default ProductsScreen;