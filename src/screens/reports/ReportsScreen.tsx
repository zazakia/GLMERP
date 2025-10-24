import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../../contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../../services/supabase/config';
import { Database } from '../../../types/database';

type Report = {
  id: string;
  name: string;
  description: string;
  type: 'sales' | 'inventory' | 'customers' | 'financial';
  date: string;
  data: any;
};

const ReportsScreen = ({ navigation, route }: { navigation: any; route: any }) => {
  const { user, profile, company, branch, location, hasPermission } = useAuth();
  const [reports, setReports] = useState<Report[]>([]);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [reportType, setReportType] = useState<'sales' | 'inventory' | 'customers' | 'financial'>('sales');

  useEffect(() => {
    fetchReports();
  }, [reportType]);

  const fetchReports = async () => {
    try {
      // In a real app, this would fetch reports from Supabase
      // For now, we'll use mock data
      const mockReports: Report[] = [
        {
          id: '1',
          name: 'Daily Sales',
          description: 'Total sales for today',
          type: 'sales',
          date: new Date().toISOString(),
          data: {
            totalSales: 2341.50,
            totalOrders: 45,
            averageOrderValue: 52.03,
            topProducts: [
              { name: 'Laptop', quantity: 5, total: 600.00 },
              { name: 'T-Shirt', quantity: 8, total: 200.00 },
              { name: 'Coffee', quantity: 12, total: 144.00 },
            ],
            paymentBreakdown: {
              cash: 1200.00,
              card: 800.00,
              digital_wallet: 341.50,
            },
          },
        },
        {
          id: '2',
          name: 'Weekly Sales',
          description: 'Total sales for the past 7 days',
          type: 'sales',
          date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          data: {
            totalSales: 12543.67,
            totalOrders: 234,
            averageOrderValue: 53.60,
            dailyBreakdown: [1200, 1450, 1100, 1800, 2100, 1900, 2300],
            topProducts: [
              { name: 'Laptop', quantity: 25, total: 3000.00 },
              { name: 'T-Shirt', quantity: 40, total: 1000.00 },
              { name: 'Coffee', quantity: 60, total: 720.00 },
            ],
          },
        },
        {
          id: '3',
          name: 'Low Stock Items',
          description: 'Products that need to be reordered',
          type: 'inventory',
          date: new Date().toISOString(),
          data: {
            items: [
              { id: '1', name: 'Laptop', currentStock: 5, reorderLevel: 20 },
              { id: '2', name: 'T-Shirt', currentStock: 25, reorderLevel: 15 },
              { id: '3', name: 'Coffee', currentStock: 12, reorderLevel: 10 },
            ],
          },
        },
        {
          id: '4',
          name: 'Customer Summary',
          description: 'Customer statistics for the past month',
          type: 'customers',
          date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          data: {
            totalCustomers: 156,
            newCustomers: 12,
            returningCustomers: 144,
            topCustomers: [
              { name: 'John Doe', totalSpent: 1250.00, orders: 15 },
              { name: 'Jane Smith', totalSpent: 980.00, orders: 12 },
              { name: 'Bob Johnson', totalSpent: 2100.00, orders: 8 },
            ],
          },
        },
        {
          id: '5',
          name: 'Financial Summary',
          description: 'Financial performance for the past month',
          type: 'financial',
          date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          data: {
            revenue: 12543.67,
            expenses: 8500.00,
            profit: 4043.67,
            profitMargin: 32.2,
            topExpenseCategories: [
              { name: 'Inventory', amount: 3200.00 },
              { name: 'Salaries', amount: 2800.00 },
              { name: 'Rent', amount: 1500.00 },
              { name: 'Utilities', amount: 800.00 },
              { name: 'Marketing', amount: 200.00 },
            ],
          },
        },
      ];

      setReports(mockReports);
    } catch (error) {
      console.error('Error fetching reports:', error);
      Alert.alert('Error', 'Failed to load reports');
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchReports().then(() => {
      setRefreshing(false);
    });
  };

  const openReportDetails = (report: Report) => {
    setSelectedReport(report);
  };

  const closeReportDetails = () => {
    setSelectedReport(null);
  };

  const filteredReports = reports.filter(report => report.type === reportType);

  const renderReportItem = ({ item }: { item: Report }) => {
    return (
      <TouchableOpacity
        style={styles.reportItem}
        onPress={() => openReportDetails(item)}
      >
        <View style={styles.reportInfo}>
          <Text style={styles.reportName}>{item.name}</Text>
          <Text style={styles.reportDescription}>{item.description}</Text>
          <Text style={styles.reportDate}>{new Date(item.date).toLocaleDateString()}</Text>
        </View>

        <Ionicons name="chevron-forward" size={20} color="#666" />
      </TouchableOpacity>
    );
  };

  const renderReportDetails = () => {
    if (!selectedReport) return null;

    return (
      <Modal
        animationType="slide"
        transparent={true}
        visible={!!selectedReport}
        onRequestClose={closeReportDetails}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{selectedReport.name}</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={closeReportDetails}
            >
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            {Object.entries(selectedReport.data).map(([key, value]) => (
              <View key={key} style={styles.dataRow}>
                <Text style={styles.dataKey}>{key.replace(/([A-Z])/g, ' $1').replace(/^\w/, c => c.toUpperCase())}:</Text>
                <Text style={styles.dataValue}>
                  {typeof value === 'object' ? JSON.stringify(value, null, 2) : value.toString()}
                </Text>
              </View>
            ))}
          </ScrollView>
        </View>
      </Modal>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Reports</Text>
        <Text style={styles.subtitle}>View and analyze business data</Text>
      </View>

      <View style={styles.reportTypeContainer}>
        <TouchableOpacity
          style={[
            styles.reportType,
            reportType === 'sales' && styles.activeReportType
          ]}
          onPress={() => setReportType('sales')}
        >
          <Text style={styles.reportTypeText}>Sales</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.reportType,
            reportType === 'inventory' && styles.activeReportType
          ]}
          onPress={() => setReportType('inventory')}
        >
          <Text style={styles.reportTypeText}>Inventory</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.reportType,
            reportType === 'customers' && styles.activeReportType
          ]}
          onPress={() => setReportType('customers')}
        >
          <Text style={styles.reportTypeText}>Customers</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.reportType,
            reportType === 'financial' && styles.activeReportType
          ]}
          onPress={() => setReportType('financial')}
        >
          <Text style={styles.reportTypeText}>Financial</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={filteredReports}
        renderItem={renderReportItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.reportsList}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#2c3e50"
          />
        }
      />

      {renderReportDetails()}
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
  reportTypeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  reportType: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fff',
  },
  activeReportType: {
    borderColor: '#2c3e50',
    backgroundColor: '#f0f8ff',
  },
  reportTypeText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  reportsList: {
    flex: 1,
  },
  reportItem: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  reportInfo: {
    flex: 1,
  },
  reportName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  reportDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  reportDate: {
    fontSize: 12,
    color: '#999',
  },
  modalContainer: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
    margin: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    padding: 5,
  },
  modalContent: {
    maxHeight: '70%',
  },
  dataRow: {
    flexDirection: 'row',
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingBottom: 10,
  },
  dataKey: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    width: '40%',
  },
  dataValue: {
    fontSize: 14,
    color: '#666',
    width: '60%',
    textAlign: 'right',
  },
});

export default ReportsScreen;