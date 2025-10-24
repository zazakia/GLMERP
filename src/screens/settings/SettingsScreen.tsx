import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Switch, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../../contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../../services/supabase/config';
import { Database } from '../../../types/database';

const SettingsScreen = ({ navigation }: { navigation: any }) => {
  const { user, profile, company, branch, location, hasPermission, switchCompany, switchBranch, switchLocation } = useAuth();
  const [companies, setCompanies] = useState<Database['public']['Tables']['GLMERP01_companies']['Row'][]>([]);
  const [branches, setBranches] = useState<Database['public']['Tables']['GLMERP01_branches']['Row'][]>([]);
  const [locations, setLocations] = useState<Database['public']['Tables']['GLMERP01_locations']['Row'][]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchCompanies();
    fetchBranches();
    fetchLocations();
  }, []);

  const fetchCompanies = async () => {
    try {
      // In a real app, this would fetch companies from Supabase
      // For now, we'll use mock data
      const mockCompanies: Database['public']['Tables']['GLMERP01_companies']['Row'][] = [
        {
          id: '1',
          company_name: 'GLM ERP',
          legal_name: 'GLM ERP Solutions Inc.',
          tax_id: '123456789',
          registration_number: 'REG123456',
          logo_url: 'https://picsum.photos/seed/pics/200/300/300.jpg',
          address: '123 Main St, Anytown, USA',
          phone: '+1234567890',
          email: 'info@glmerp.com',
          website: 'https://glmerp.com',
          default_currency: 'USD',
          tax_settings: { standard_rate: 0.08, reduced_rate: 0.05 },
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: '2',
          company_name: 'Test Company',
          legal_name: 'Test Company LLC',
          tax_id: '987654321',
          registration_number: 'REG987654',
          logo_url: 'https://picsum.photos/seed/pics/200/301/301.jpg',
          address: '456 Test Ave, Testville, USA',
          phone: '+1987654321',
          email: 'info@testcompany.com',
          website: 'https://testcompany.com',
          default_currency: 'EUR',
          tax_settings: { standard_rate: 0.20, reduced_rate: 0.10 },
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ];

      setCompanies(mockCompanies);
    } catch (error) {
      console.error('Error fetching companies:', error);
      Alert.alert('Error', 'Failed to load companies');
    }
  };

  const fetchBranches = async () => {
    try {
      // In a real app, this would fetch branches from Supabase
      // For now, we'll use mock data
      const mockBranches: Database['public']['Tables']['GLMERP01_branches']['Row'][] = [
        {
          id: '1',
          company_id: '1',
          branch_name: 'Main Store',
          branch_code: 'MAIN',
          address: '123 Main St, Anytown, USA',
          phone: '+1234567890',
          email: 'main@glmerp.com',
          manager_id: '1',
          business_hours: { monday: '9:00-18:00', tuesday: '9:00-18:00', wednesday: '9:00-18:00', thursday: '9:00-18:00', friday: '9:00-18:00', saturday: '10:00-16:00', sunday: 'Closed' },
          tax_rate: 0.08,
          currency: 'USD',
          timezone: 'America/New_York',
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: '2',
          company_id: '1',
          branch_name: 'Downtown Store',
          branch_code: 'DOWNTOWN',
          address: '456 Downtown Ave, Anytown, USA',
          phone: '+1234567891',
          email: 'downtown@glmerp.com',
          manager_id: '2',
          business_hours: { monday: '8:00-20:00', tuesday: '8:00-20:00', wednesday: '8:00-20:00', thursday: '8:00-20:00', friday: '8:00-20:00', saturday: '9:00-17:00', sunday: 'Closed' },
          tax_rate: 0.08,
          currency: 'USD',
          timezone: 'America/New_York',
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ];

      setBranches(mockBranches);
    } catch (error) {
      console.error('Error fetching branches:', error);
      Alert.alert('Error', 'Failed to load branches');
    }
  };

  const fetchLocations = async () => {
    try {
      // In a real app, this would fetch locations from Supabase
      // For now, we'll use mock data
      const mockLocations: Database['public']['Tables']['GLMERP01_locations']['Row'][] = [
        {
          id: '1',
          branch_id: '1',
          location_name: 'Main Floor',
          location_code: 'MAIN',
          location_type: 'store',
          address: '123 Main St, Anytown, USA',
          phone: '+1234567890',
          email: 'main@glmerp.com',
          manager_id: '1',
          business_hours: { monday: '9:00-18:00', tuesday: '9:00-18:00', wednesday: '9:00-18:00', thursday: '9:00-18:00', friday: '9:00-18:00', saturday: '10:00-16:00', sunday: 'Closed' },
          tax_rate: 0.08,
          currency: 'USD',
          timezone: 'America/New_York',
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: '2',
          branch_id: '1',
          location_name: 'Warehouse',
          location_code: 'WH',
          location_type: 'warehouse',
          address: '789 Warehouse Rd, Anytown, USA',
          phone: '+1234567891',
          email: 'warehouse@glmerp.com',
          manager_id: '3',
          business_hours: { monday: '8:00-17:00', tuesday: '8:00-17:00', wednesday: '8:00-17:00', thursday: '8:00-17:00', friday: '8:00-17:00', saturday: '9:00-13:00', sunday: 'Closed' },
          tax_rate: 0.08,
          currency: 'USD',
          timezone: 'America/New_York',
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ];

      setLocations(mockLocations);
    } catch (error) {
      console.error('Error fetching locations:', error);
      Alert.alert('Error', 'Failed to load locations');
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchCompanies().then(() => {
      fetchBranches().then(() => {
        fetchLocations().then(() => {
          setRefreshing(false);
        });
      });
    });
  };

  const handleCompanySwitch = async (companyId: string) => {
    try {
      setLoading(true);
      await switchCompany(companyId);
      Alert.alert(
        'Company Switched',
        'You have successfully switched to a new company.',
        [
          { text: 'OK', onPress: () => setLoading(false) }
        ]
      );
    } catch (error) {
      setLoading(false);
      Alert.alert('Error', 'Failed to switch company');
    }
  };

  const handleBranchSwitch = async (branchId: string) => {
    try {
      setLoading(true);
      await switchBranch(branchId);
      Alert.alert(
        'Branch Switched',
        'You have successfully switched to a new branch.',
        [
          { text: 'OK', onPress: () => setLoading(false) }
        ]
      );
    } catch (error) {
      setLoading(false);
      Alert.alert('Error', 'Failed to switch branch');
    }
  };

  const handleLocationSwitch = async (locationId: string) => {
    try {
      setLoading(true);
      await switchLocation(locationId);
      Alert.alert(
        'Location Switched',
        'You have successfully switched to a new location.',
        [
          { text: 'OK', onPress: () => setLoading(false) }
        ]
      );
    } catch (error) {
      setLoading(false);
      Alert.alert('Error', 'Failed to switch location');
    }
  };

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign Out', onPress: () => navigation.navigate('Login') }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Settings</Text>
        <Text style={styles.subtitle}>Manage your account and preferences</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>

          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>Name:</Text>
            <Text style={styles.settingValue}>{profile?.full_name || 'N/A'}</Text>
          </View>

          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>Email:</Text>
            <Text style={styles.settingValue}>{profile?.email || 'N/A'}</Text>
          </View>

          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>Role:</Text>
            <Text style={styles.settingValue}>{profile?.role || 'N/A'}</Text>
          </View>

          <TouchableOpacity
            style={styles.signOutButton}
            onPress={handleSignOut}
          >
            <Text style={styles.signOutButtonText}>Sign Out</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Company</Text>

          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>Current:</Text>
            <Text style={styles.settingValue}>{company?.company_name || 'N/A'}</Text>
          </View>

          <TouchableOpacity
            style={styles.switchButton}
            onPress={() => navigation.navigate('CompanySelection')}
          >
            <Text style={styles.switchButtonText}>Switch</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Branch</Text>

          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>Current:</Text>
            <Text style={styles.settingValue}>{branch?.branch_name || 'N/A'}</Text>
          </View>

          <TouchableOpacity
            style={styles.switchButton}
            onPress={() => navigation.navigate('BranchSelection')}
          >
            <Text style={styles.switchButtonText}>Switch</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Location</Text>

          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>Current:</Text>
            <Text style={styles.settingValue}>{location?.location_name || 'N/A'}</Text>
          </View>

          <TouchableOpacity
            style={styles.switchButton}
            onPress={() => navigation.navigate('LocationSelection')}
          >
            <Text style={styles.switchButtonText}>Switch</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preferences</Text>

          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>Dark Mode:</Text>
            <Switch
              value={false}
              onValueChange={() => {}}
            />
          </View>

          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>Notifications:</Text>
            <Switch
              value={true}
              onValueChange={() => {}}
            />
          </View>
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
    marginBottom: 15,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  settingLabel: {
    fontSize: 16,
    color: '#666',
  },
  settingValue: {
    fontSize: 16,
    color: '#333',
    flex: 1,
    textAlign: 'right',
  },
  signOutButton: {
    backgroundColor: '#e74c3c',
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
    marginTop: 20,
  },
  signOutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  switchButton: {
    backgroundColor: '#2c3e50',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
  },
  switchButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
});

export default SettingsScreen;