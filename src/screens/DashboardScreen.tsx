import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../services/supabase/config';
import { Database } from '../../types/database';
import { Ionicons } from '@expo/vector-icons';

type DashboardData = {
  totalSales: number;
  totalOrders: number;
  totalCustomers: number;
  totalProducts: number;
  lowStockItems: number;
  todaySales: number;
  weeklySales: number[];
  monthlySales: number[];
};

const DashboardScreen = ({ navigation }: { navigation: any }) => {
  const { user, profile, company, branch, location, hasPermission } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [dashboardData, setDashboardData] = useState<DashboardData>({
    totalSales: 0,
    totalOrders: 0,
    totalCustomers: 0,
    totalProducts: 0,
    lowStockItems: 0,
    todaySales: 0,
    weeklySales: [0, 0, 0, 0, 0, 0, 0],
    monthlySales: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  });

  useEffect(() => {
    fetchDashboardData();
  }, [company, branch, location]);

  const fetchDashboardData = async () => {
    try {
      // In a real app, these would be actual API calls to Supabase
      // For now, we'll use mock data
      
      // Mock data for demonstration
      const mockData: DashboardData = {
        totalSales: 12543.67,
        totalOrders: 234,
        totalCustomers: 156,
        totalProducts: 892,
        lowStockItems: 12,
        todaySales: 2341.50,
        weeklySales: [1200, 1450, 1100, 1800, 2100, 1900, 2300],
        monthlySales: [4800, 5200, 4900, 5100, 5500, 5800, 6200, 6800, 7200],
      };
      
      setDashboardData(mockData);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      Alert.alert('Error', 'Failed to load dashboard data');
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchDashboardData().then(() => {
      setRefreshing(false);
    });
  };

  const navigateToScreen = (screenName: string) => {
    navigation.navigate(screenName);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Dashboard</Text>
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#2c3e50"
          />
        </View>
        
        <View style={styles.infoContainer}>
          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>Total Sales</Text>
            <Text style={styles.infoValue}>${dashboardData.totalSales.toFixed(2)}</Text>
          </View>
          
          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>Total Orders</Text>
            <Text style={styles.infoValue}>{dashboardData.totalOrders}</Text>
          </View>
          
          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>Total Customers</Text>
            <Text style={styles.infoValue}>{dashboardData.totalCustomers}</Text>
          </View>
          
          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>Total Products</Text>
            <Text style={styles.infoValue}>{dashboardData.totalProducts}</Text>
          </View>
          
          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>Low Stock Items</Text>
            <Text style={[styles.infoValue, dashboardData.lowStockItems > 0 && styles.warning]}>
              {dashboardData.lowStockItems}
            </Text>
          </View>
        </View>
        
        <View style={styles.chartContainer}>
          <Text style={styles.chartTitle}>Today's Sales</Text>
          <Text style={styles.chartValue}>${dashboardData.todaySales.toFixed(2)}</Text>
        </View>
        
        <View style={styles.chartContainer}>
          <Text style={styles.chartTitle}>Weekly Sales</Text>
          <View style={styles.barChart}>
            {dashboardData.weeklySales.map((value, index) => (
              <View
                key={index}
                style={[
                  styles.bar,
                  { height: (value / Math.max(...dashboardData.weeklySales)) * 150 }
                ]}
              />
            ))}
          </View>
        </View>
        
        <View style={styles.chartContainer}>
          <Text style={styles.chartTitle}>Monthly Sales</Text>
          <View style={styles.barChart}>
            {dashboardData.monthlySales.map((value, index) => (
              <View
                key={index}
                style={[
                  styles.bar,
                  { height: (value / Math.max(...dashboardData.monthlySales)) * 150 }
                ]}
              />
            ))}
          </View>
        </View>
        
        <View style={styles.menuContainer}>
          <Text style={styles.menuTitle}>Quick Actions</Text>
          
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => navigateToScreen('Sales')}
          >
            <Ionicons name="cash" size={24} color="#2c3e50" />
            <Text style={styles.menuItemText}>New Sale</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => navigateToScreen('Products')}
          >
            <Ionicons name="pricetag" size={24} color="#2c3e50" />
            <Text style={styles.menuItemText}>Add Product</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => navigateToScreen('Inventory')}
          >
            <Ionicons name="cube" size={24} color="#2c3e50" />
            <Text style={styles.menuItemText}>Check Inventory</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => navigateToScreen('Customers')}
          >
            <Ionicons name="people" size={24} color="#2c3e50" />
            <Text style={styles.menuItemText}>Add Customer</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  infoContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  infoCard: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    width: '48%',
    marginBottom: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  infoValue: {
    fontSize: 18,
    color: '#666',
  },
  warning: {
    color: '#e74c3c',
  },
  chartContainer: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  chartValue: {
    fontSize: 18,
    color: '#666',
  },
  barChart: {
    flexDirection: 'row',
    height: 150,
    width: '100%',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  bar: {
    width: '8%',
    backgroundColor: '#2c3e50',
    borderRadius: 5,
  },
  menuContainer: {
    marginTop: 20,
  },
  menuTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  menuItem: {
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
  menuItemText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 10,
  },
});

export default DashboardScreen;