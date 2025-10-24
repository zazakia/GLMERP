import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { useAuth } from '../contexts/AuthContext';
import { LoginScreen, RegisterScreen, HomeScreen, DashboardScreen, SalesScreen, ProductsScreen, InventoryScreen, CustomersScreen, ReportsScreen, SettingsScreen } from '../screens';
import LoadingScreen from '../components/common/LoadingScreen';

const Stack = createStackNavigator();

export default function AppNavigator() {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: '#2c3e50',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      {user ? (
        // Authenticated screens
        <>
          <Stack.Screen
            name="Home"
            component={HomeScreen}
            options={{ title: 'GLM ERP POS' }}
          />
          <Stack.Screen
            name="Dashboard"
            component={DashboardScreen}
            options={{ title: 'Dashboard' }}
          />
          <Stack.Screen
            name="Sales"
            component={SalesScreen}
            options={{ title: 'Sales' }}
          />
          <Stack.Screen
            name="Products"
            component={ProductsScreen}
            options={{ title: 'Products' }}
          />
          <Stack.Screen
            name="Inventory"
            component={InventoryScreen}
            options={{ title: 'Inventory' }}
          />
          <Stack.Screen
            name="Customers"
            component={CustomersScreen}
            options={{ title: 'Customers' }}
          />
          <Stack.Screen
            name="Reports"
            component={ReportsScreen}
            options={{ title: 'Reports' }}
          />
          <Stack.Screen
            name="Settings"
            component={SettingsScreen}
            options={{ title: 'Settings' }}
          />
        </>
      ) : (
        // Authentication screens
        <>
          <Stack.Screen
            name="Login"
            component={LoginScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Register"
            component={RegisterScreen}
            options={{ headerShown: false }}
          />
        </>
      )}
    </Stack.Navigator>
  );
}