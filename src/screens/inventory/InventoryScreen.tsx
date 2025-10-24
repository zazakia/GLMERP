import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Alert, TextInput, Modal, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../../contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../../services/supabase/config';
import { Database } from '../../../types/database';

type Product = Database['public']['Tables']['GLMERP01_products']['Row'];
type ProductVariant = Database['public']['Tables']['GLMERP01_product_variants']['Row'];
type Inventory = Database['public']['Tables']['GLMERP01_inventory']['Row'];
type InventoryTransaction = Database['public']['Tables']['GLMERP01_inventory_transactions']['Row'];

const InventoryScreen = ({ navigation, route }: { navigation: any; route: any }) => {
  const { user, profile, company, branch, location, hasPermission } = useAuth();
  const [inventory, setInventory] = useState<Inventory[]>([]);
  const [transactions, setTransactions] = useState<InventoryTransaction[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Inventory | null>(null);
  const [adjustmentType, setAdjustmentType] = useState<'increase' | 'decrease'>('increase');
  const [adjustmentQuantity, setAdjustmentQuantity] = useState('');
  const [adjustmentReason, setAdjustmentReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchInventory();
    fetchTransactions();
  }, []);

  const fetchInventory = async () => {
    try {
      // In a real app, this would fetch inventory from Supabase
      // For now, we'll use mock data
      const mockInventory: Inventory[] = [
        {
          id: '1',
          company_id: company?.id || '',
          branch_id: branch?.id || '',
          location_id: location?.id || '',
          product_id: '1',
          variant_id: null,
          quantity_on_hand: 50,
          quantity_committed: 5,
          quantity_on_order: 10,
          quantity_available: 35,
          reorder_level: 20,
          reorder_quantity: 50,
          last_counted_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: '2',
          company_id: company?.id || '',
          branch_id: branch?.id || '',
          location_id: location?.id || '',
          product_id: '2',
          variant_id: null,
          quantity_on_hand: 25,
          quantity_committed: 3,
          quantity_on_order: 0,
          quantity_available: 22,
          reorder_level: 15,
          reorder_quantity: 30,
          last_counted_at: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: '3',
          company_id: company?.id || '',
          branch_id: branch?.id || '',
          location_id: location?.id || '',
          product_id: '3',
          variant_id: null,
          quantity_on_hand: 12,
          quantity_committed: 2,
          quantity_on_order: 5,
          quantity_available: 5,
          reorder_level: 10,
          reorder_quantity: 20,
          last_counted_at: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString(),
          updated_at: new Date().toISOString(),
        },
      ];
      
      setInventory(mockInventory);
    } catch (error) {
      console.error('Error fetching inventory:', error);
      Alert.alert('Error', 'Failed to load inventory');
    }
  };

  const fetchTransactions = async () => {
    try {
      // In a real app, this would fetch transactions from Supabase
      // For now, we'll use mock data
      const mockTransactions: InventoryTransaction[] = [
        {
          id: '1',
          company_id: company?.id || '',
          branch_id: branch?.id || '',
          location_id: location?.id || '',
          product_id: '1',
          variant_id: null,
          transaction_type: 'sale',
          quantity_change: -5,
          quantity_before: 55,
          quantity_after: 50,
          reference_id: 'sale123',
          reference_type: 'sale',
          reason: 'Customer purchase',
          user_id: user?.id || '',
          created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: '2',
          company_id: company?.id || '',
          branch_id: branch?.id || '',
          location_id: location?.id || '',
          product_id: '2',
          variant_id: null,
          transaction_type: 'purchase',
          quantity_change: 10,
          quantity_before: 15,
          quantity_after: 25,
          reference_id: 'purchase456',
          reference_type: 'purchase',
          reason: 'Stock replenishment',
          user_id: user?.id || '',
          created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: '3',
          company_id: company?.id || '',
          branch_id: branch?.id || '',
          location_id: location?.id || '',
          product_id: '3',
          variant_id: null,
          transaction_type: 'adjustment',
          quantity_change: -2,
          quantity_before: 14,
          quantity_after: 12,
          reference_id: null,
          reference_type: null,
          reason: 'Damaged items',
          user_id: user?.id || '',
          created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        },
      ];
      
      setTransactions(mockTransactions);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      Alert.alert('Error', 'Failed to load transactions');
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchInventory().then(() => {
      fetchTransactions().then(() => {
        setRefreshing(false);
      });
    });
  };

  const openAdjustModal = (item: Inventory) => {
    setSelectedItem(item);
    setShowAdjustModal(true);
  };

  const closeAdjustModal = () => {
    setShowAdjustModal(false);
    setSelectedItem(null);
    setAdjustmentType('increase');
    setAdjustmentQuantity('');
    setAdjustmentReason('');
  };

  const handleAdjustment = async () => {
    if (!selectedItem || !adjustmentQuantity || !adjustmentReason) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    try {
      setLoading(true);
      const quantity = parseInt(adjustmentQuantity);
      
      if (isNaN(quantity) || quantity <= 0) {
        Alert.alert('Error', 'Please enter a valid quantity');
        setLoading(false);
        return;
      }
      
      // In a real app, this would update the inventory in Supabase
      // For now, we'll just simulate a successful adjustment
      setTimeout(() => {
        Alert.alert(
          'Adjustment Successful',
          `Inventory has been ${adjustmentType}d by ${quantity} units.`,
          [
            { text: 'OK', onPress: () => closeAdjustModal() }
          ]
        );
        setLoading(false);
        closeAdjustModal();
        fetchInventory();
        fetchTransactions();
      }, 1000);
    } catch (error) {
      setLoading(false);
      Alert.alert('Error', 'Failed to process adjustment');
    }
  };

  const filteredInventory = inventory.filter(item =>
    item.product_id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredTransactions = transactions.filter(transaction =>
    transaction.reference_type?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    transaction.reason?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderInventoryItem = ({ item }: { item: Inventory }) => {
    const isLowStock = item.quantity_available <= item.reorder_level;
    
    return (
      <View style={[
        styles.inventoryItem,
        isLowStock && styles.lowStockItem
      ]}>
        <View style={styles.itemInfo}>
          <Text style={styles.itemName}>Product ID: {item.product_id}</Text>
          <Text style={styles.itemDetails}>On Hand: {item.quantity_on_hand}</Text>
          <Text style={styles.itemDetails}>Committed: {item.quantity_committed}</Text>
          <Text style={styles.itemDetails}>Available: {item.quantity_available}</Text>
          <Text style={styles.itemDetails}>Reorder Level: {item.reorder_level}</Text>
        </View>
        
        <View style={styles.itemActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => openAdjustModal(item)}
          >
            <Ionicons name="create" size={20} color="#2c3e50" />
            <Text style={styles.actionButtonText}>Adjust</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderTransactionItem = ({ item }: { item: InventoryTransaction }) => {
    const getTransactionTypeColor = (type: string) => {
      switch (type) {
        case 'sale':
          return '#e74c3c';
        case 'purchase':
          return '#2ecc71';
        case 'adjustment':
          return '#f39c12';
        default:
          return '#95a5a6';
      }
    };

    return (
      <View style={styles.transactionItem}>
        <View style={styles.transactionInfo}>
          <Text style={styles.transactionType}>{item.transaction_type.toUpperCase()}</Text>
          <Text style={styles.transactionDetails}>
            {item.quantity_change > 0 ? '+' : ''}{item.quantity_change}
          </Text>
          <Text style={styles.transactionDetails}>
            {item.quantity_before} → {item.quantity_after}
          </Text>
        </View>
        
        <View style={styles.transactionMeta}>
          <Text style={styles.transactionReason}>{item.reason}</Text>
          <Text style={styles.transactionDate}>
            {new Date(item.created_at).toLocaleDateString()}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Inventory</Text>
        <Text style={styles.subtitle}>Manage stock levels and track movements</Text>
      </View>
      
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search inventory..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>
      
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[
            styles.tab,
            !searchQuery && styles.activeTab
          ]}
          onPress={() => setSearchQuery('')}
        >
          <Text style={styles.tabText}>Inventory</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.tab,
            searchQuery && styles.activeTab
          ]}
          onPress={() => setSearchQuery('')}
        >
          <Text style={styles.tabText}>Transactions</Text>
        </TouchableOpacity>
      </View>
      
      {!searchQuery ? (
        <FlatList
          data={filteredInventory}
          renderItem={renderInventoryItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.inventoryList}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#2c3e50"
            />
          }
        />
      ) : (
        <FlatList
          data={filteredTransactions}
          renderItem={renderTransactionItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.transactionList}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#2c3e50"
            />
          }
        />
      )}
      
      <Modal
        animationType="slide"
        transparent={true}
        visible={showAdjustModal}
        onRequestClose={closeAdjustModal}
      >
        <View style={styles.adjustmentModal}>
          <Text style={styles.modalTitle}>Inventory Adjustment</Text>
          
          <View style={styles.adjustmentTypeContainer}>
            <TouchableOpacity
              style={[
                styles.adjustmentType,
                adjustmentType === 'increase' && styles.selectedAdjustmentType
              ]}
              onPress={() => setAdjustmentType('increase')}
            >
              <Text style={styles.adjustmentTypeText}>Increase</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.adjustmentType,
                adjustmentType === 'decrease' && styles.selectedAdjustmentType
              ]}
              onPress={() => setAdjustmentType('decrease')}
            >
              <Text style={styles.adjustmentTypeText}>Decrease</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.form}>
            <TextInput
              style={styles.input}
              placeholder="Quantity"
              value={adjustmentQuantity}
              onChangeText={setAdjustmentQuantity}
              keyboardType="numeric"
            />
            
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Reason"
              value={adjustmentReason}
              onChangeText={setAdjustmentReason}
              multiline
            />
          </View>
          
          <View style={styles.modalButtons}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={closeAdjustModal}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.saveButton, loading && styles.buttonDisabled]}
              onPress={handleAdjustment}
              disabled={loading}
            >
              <Text style={styles.saveButtonText}>
                {loading ? 'Processing...' : 'Save'}
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
  tabs: {
    flexDirection: 'row',
    marginBottom: 10,
    paddingHorizontal: 20,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#2c3e50',
  },
  tabText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#666',
  },
  inventoryList: {
    flex: 1,
  },
  inventoryItem: {
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
  lowStockItem: {
    borderLeftWidth: 4,
    borderLeftColor: '#e74c3c',
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
  itemDetails: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  itemActions: {
    justifyContent: 'center',
  },
  actionButton: {
    backgroundColor: '#2c3e50',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#fff',
  },
  transactionList: {
    flex: 1,
  },
  transactionItem: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  transactionInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  transactionType: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  transactionDetails: {
    fontSize: 14,
    color: '#666',
  },
  transactionMeta: {
    marginTop: 5,
  },
  transactionReason: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  transactionDate: {
    fontSize: 12,
    color: '#999',
  },
  adjustmentModal: {
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
  adjustmentTypeContainer: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  adjustmentType: {
    flex: 1,
    padding: 15,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#ddd',
    alignItems: 'center',
    marginRight: 10,
  },
  selectedAdjustmentType: {
    borderColor: '#2c3e50',
    backgroundColor: '#f0f8ff',
  },
  adjustmentTypeText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
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
  textArea: {
    height: 80,
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
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
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
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
});

export default InventoryScreen;