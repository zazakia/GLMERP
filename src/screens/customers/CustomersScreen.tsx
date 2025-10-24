import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Alert, TextInput, Modal, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../../contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../../services/supabase/config';
import { Database } from '../../../types/database';

type Customer = Database['public']['Tables']['GLMERP01_customers']['Row'];
type CustomerAddress = Database['public']['Tables']['GLMERP01_customer_addresses']['Row'];

const CustomersScreen = ({ navigation, route }: { navigation: any; route: any }) => {
  const { user, profile, company, branch, location, hasPermission } = useAuth();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      // In a real app, this would fetch customers from Supabase
      // For now, we'll use mock data
      const mockCustomers: Customer[] = [
        {
          id: '1',
          company_id: company?.id || '',
          customer_number: 'CUST001',
          first_name: 'John',
          last_name: 'Doe',
          company: 'Acme Corp',
          email: 'john.doe@acme.com',
          phone: '+1234567890',
          date_of_birth: '1980-01-01',
          notes: 'Regular customer, prefers email communication',
          loyalty_points: 150,
          store_credit: 25.00,
          is_active: true,
          created_at: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString(),
          updated_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: '2',
          company_id: company?.id || '',
          customer_number: 'CUST002',
          first_name: 'Jane',
          last_name: 'Smith',
          company: '',
          email: 'jane.smith@example.com',
          phone: '+1234567891',
          date_of_birth: '1985-05-15',
          notes: 'VIP customer, high spender',
          loyalty_points: 500,
          store_credit: 100.00,
          is_active: true,
          created_at: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString(),
          updated_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: '3',
          company_id: company?.id || '',
          customer_number: 'CUST003',
          first_name: 'Bob',
          last_name: 'Johnson',
          company: 'Bob\'s Burgers',
          email: 'bob@johnsonsburgers.com',
          phone: '+1234567892',
          date_of_birth: '1975-03-10',
          notes: 'New customer, joined recently',
          loyalty_points: 25,
          store_credit: 0.00,
          is_active: true,
          created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          updated_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        },
      ];

      setCustomers(mockCustomers);
    } catch (error) {
      console.error('Error fetching customers:', error);
      Alert.alert('Error', 'Failed to load customers');
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchCustomers().then(() => {
      setRefreshing(false);
    });
  };

  const openAddModal = () => {
    setShowAddModal(true);
  };

  const openEditModal = (customer: Customer) => {
    setSelectedCustomer(customer);
    setShowEditModal(true);
  };

  const closeModals = () => {
    setShowAddModal(false);
    setShowEditModal(false);
    setSelectedCustomer(null);
  };

  const handleAddCustomer = async (customerData: any) => {
    try {
      setLoading(true);
      // In a real app, this would add the customer to Supabase
      // For now, we'll just simulate a successful addition
      setTimeout(() => {
        Alert.alert(
          'Customer Added',
          'Customer has been added successfully.',
          [
            { text: 'OK', onPress: () => closeModals() }
          ]
        );
        setLoading(false);
        closeModals();
        fetchCustomers();
      }, 1000);
    } catch (error) {
      setLoading(false);
      Alert.alert('Error', 'Failed to add customer');
    }
  };

  const handleEditCustomer = async (customerData: any) => {
    if (!selectedCustomer) return;

    try {
      setLoading(true);
      // In a real app, this would update the customer in Supabase
      // For now, we'll just simulate a successful update
      setTimeout(() => {
        Alert.alert(
          'Customer Updated',
          'Customer has been updated successfully.',
          [
            { text: 'OK', onPress: () => closeModals() }
          ]
        );
        setLoading(false);
        closeModals();
        fetchCustomers();
      }, 1000);
    } catch (error) {
      setLoading(false);
      Alert.alert('Error', 'Failed to update customer');
    }
  };

  const handleDeleteCustomer = async (customerId: string) => {
    try {
      setLoading(true);
      // In a real app, this would delete the customer from Supabase
      // For now, we'll just simulate a successful deletion
      setTimeout(() => {
        Alert.alert(
          'Customer Deleted',
          'Customer has been deleted successfully.',
          [
            { text: 'OK', onPress: () => closeModals() }
          ]
        );
        setLoading(false);
        fetchCustomers();
      }, 1000);
    } catch (error) {
      setLoading(false);
      Alert.alert('Error', 'Failed to delete customer');
    }
  };

  const filteredCustomersList = customers.filter(customer =>
    customer.first_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    customer.last_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    customer.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    customer.customer_number.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderCustomerItem = ({ item }: { item: Customer }) => {
    return (
      <View style={styles.customerItem}>
        <View style={styles.customerInfo}>
          <Text style={styles.customerName}>{item.first_name} {item.last_name}</Text>
          <Text style={styles.customerEmail}>{item.email}</Text>
          <Text style={styles.customerPhone}>{item.phone}</Text>
          <Text style={styles.customerNumber}>#{item.customer_number}</Text>
        </View>

        <View style={styles.customerDetails}>
          <Text style={styles.customerDetailLabel}>Loyalty Points:</Text>
          <Text style={styles.customerDetailValue}>{item.loyalty_points}</Text>
        </View>

        <View style={styles.customerDetails}>
          <Text style={styles.customerDetailLabel}>Store Credit:</Text>
          <Text style={styles.customerDetailValue}>${item.store_credit.toFixed(2)}</Text>
        </View>

        <View style={styles.customerActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => openEditModal(item)}
          >
            <Ionicons name="create" size={20} color="#2c3e50" />
            <Text style={styles.actionButtonText}>Edit</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleDeleteCustomer(item.id)}
          >
            <Ionicons name="trash" size={20} color="#e74c3c" />
            <Text style={styles.actionButtonText}>Delete</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderCustomerModal = (isEdit: boolean) => {
    return (
      <Modal
        animationType="slide"
        transparent={true}
        visible={showAddModal || showEditModal}
        onRequestClose={closeModals}
      >
        <View style={styles.modalContainer}>
          <Text style={styles.modalTitle}>
            {isEdit ? 'Edit Customer' : 'Add Customer'}
          </Text>

          <View style={styles.form}>
            <TextInput
              style={styles.input}
              placeholder="First Name"
              defaultValue={selectedCustomer?.first_name || ''}
            />

            <TextInput
              style={styles.input}
              placeholder="Last Name"
              defaultValue={selectedCustomer?.last_name || ''}
            />

            <TextInput
              style={styles.input}
              placeholder="Company"
              defaultValue={selectedCustomer?.company || ''}
            />

            <TextInput
              style={styles.input}
              placeholder="Email"
              defaultValue={selectedCustomer?.email || ''}
              keyboardType="email-address"
            />

            <TextInput
              style={styles.input}
              placeholder="Phone"
              defaultValue={selectedCustomer?.phone || ''}
              keyboardType="phone-pad"
            />

            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Notes"
              defaultValue={selectedCustomer?.notes || ''}
              multiline
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
              onPress={() => isEdit ? handleEditCustomer({}) : handleAddCustomer({})}
              disabled={loading}
            >
              <Text style={styles.saveButtonText}>
                {loading ? 'Saving...' : 'Save'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Customers</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={openAddModal}
        >
          <Ionicons name="add" size={24} color="#fff" />
          <Text style={styles.addButtonText}>Add Customer</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search customers..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <FlatList
        data={filteredCustomersList}
        renderItem={renderCustomerItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.customersList}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#2c3e50"
          />
        }
      />

      {renderCustomerModal(false)}
      {renderCustomerModal(true)}
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
  customersList: {
    flex: 1,
  },
  customerItem: {
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
  customerInfo: {
    flex: 1,
  },
  customerName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  customerEmail: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  customerPhone: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  customerNumber: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  customerDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  customerDetailLabel: {
    fontSize: 14,
    color: '#666',
  },
  customerDetailValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  customerActions: {
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
  actionButtonText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#fff',
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

export default CustomersScreen;