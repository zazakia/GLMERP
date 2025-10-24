import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';

const HomeScreen = ({ navigation }: { navigation: any }) => {
  const { user, profile, company, branch, location, hasPermission } = useAuth();

  const navigateToScreen = (screenName: string) => {
    navigation.navigate(screenName);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Welcome, {profile?.full_name || 'User'}!</Text>
          <Text style={styles.subtitle}>{company?.company_name || 'GLM ERP'}</Text>
        </View>
        
        <View style={styles.infoContainer}>
          <Text style={styles.infoTitle}>Current Location</Text>
          <Text style={styles.infoValue}>
            {location?.location_name || 'Not selected'}
          </Text>
        </View>
        
        <View style={styles.infoContainer}>
          <Text style={styles.infoTitle}>Current Branch</Text>
          <Text style={styles.infoValue}>
            {branch?.branch_name || 'Not selected'}
          </Text>
        </View>
        
        <View style={styles.infoContainer}>
          <Text style={styles.infoTitle}>Current Company</Text>
          <Text style={styles.infoValue}>
            {company?.company_name || 'Not selected'}
          </Text>
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
            <Text style={styles.menuItemText}>Products</Text>
          </TouchableOpacity>
          
          {hasPermission('inventory') && (
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => navigateToScreen('Inventory')}
            >
              <Ionicons name="cube" size={24} color="#2c3e50" />
              <Text style={styles.menuItemText}>Inventory</Text>
            </TouchableOpacity>
          )}
          
          {hasPermission('customers') && (
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => navigateToScreen('Customers')}
            >
              <Ionicons name="people" size={24} color="#2c3e50" />
              <Text style={styles.menuItemText}>Customers</Text>
            </TouchableOpacity>
          )}
          
          {hasPermission('reports') && (
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => navigateToScreen('Reports')}
            >
              <Ionicons name="bar-chart" size={24} color="#2c3e50" />
              <Text style={styles.menuItemText}>Reports</Text>
            </TouchableOpacity>
          )}
          
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => navigateToScreen('Settings')}
          >
            <Ionicons name="settings" size={24} color="#2c3e50" />
            <Text style={styles.menuItemText}>Settings</Text>
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
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 18,
    color: '#666',
    marginBottom: 20,
  },
  infoContainer: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
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
  },
  infoValue: {
    fontSize: 16,
    color: '#666',
    flex: 1,
    textAlign: 'right',
  },
  menuContainer: {
    marginTop: 30,
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

export default HomeScreen;