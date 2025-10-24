import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { 
  LoginScreen, 
  RegisterScreen, 
  DashboardScreen, 
  ProductsScreen, 
  InventoryScreen, 
  SalesScreen, 
  CustomersScreen, 
  ReportsScreen, 
  SettingsScreen 
} from '../screens';

export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  Dashboard: undefined;
  Products: {
    productId?: string;
    categoryId?: string;
  };
  Inventory: {
    productId?: string;
    variantId?: string;
  };
  Sales: {
    saleId?: string;
  };
  Customers: {
    customerId?: string;
  };
  Reports: {
    reportType?: string;
  };
  Settings: undefined;
};

const AuthStack = createNativeStackNavigator<RootStackParamList>();

const AuthStackScreen = () => {
  return (
    <AuthStack.Navigator>
      <AuthStack.Screen
        name="Login"
        component={LoginScreen}
        options={{
          title: 'Login',
          headerShown: false,
        }}
      />
      <AuthStack.Screen
        name="Register"
        component={RegisterScreen}
        options={{
          title: 'Register',
          headerShown: false,
        }}
      />
    </AuthStack.Navigator>
  );
};

const MainStack = createNativeStackNavigator<RootStackParamList>();

const MainStackScreen = () => {
  return (
    <MainStack.Navigator>
      <MainStack.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          title: 'Dashboard',
          headerLeft: () => (
            <Ionicons
              name="menu"
              size={24}
              color="black"
              style={{ marginLeft: 10 }}
            />
          ),
        }}
      />
      <MainStack.Screen
        name="Products"
        component={ProductsScreen}
        options={{
          title: 'Products',
          headerLeft: () => (
            <Ionicons
              name="menu"
              size={24}
              color="black"
              style={{ marginLeft: 10 }}
            />
          ),
        }}
      />
      <MainStack.Screen
        name="Inventory"
        component={InventoryScreen}
        options={{
          title: 'Inventory',
          headerLeft: () => (
            <Ionicons
              name="menu"
              size={24}
              color="black"
              style={{ marginLeft: 10 }}
            />
          ),
        }}
      />
      <MainStack.Screen
        name="Sales"
        component={SalesScreen}
        options={{
          title: 'Sales',
          headerLeft: () => (
            <Ionicons
              name="menu"
              size={24}
              color="black"
              style={{ marginLeft: 10 }}
            />
          ),
        }}
      />
      <MainStack.Screen
        name="Customers"
        component={CustomersScreen}
        options={{
          title: 'Customers',
          headerLeft: () => (
            <Ionicons
              name="menu"
              size={24}
              color="black"
              style={{ marginLeft: 10 }}
            />
          ),
        }}
      />
      <MainStack.Screen
        name="Reports"
        component={ReportsScreen}
        options={{
          title: 'Reports',
          headerLeft: () => (
            <Ionicons
              name="menu"
              size={24}
              color="black"
              style={{ marginLeft: 10 }}
            />
          ),
        }}
      />
      <MainStack.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          title: 'Settings',
          headerLeft: () => (
            <Ionicons
              name="menu"
              size={24}
              color="black"
              style={{ marginLeft: 10 }}
            />
          ),
        }}
      />
    </MainStack.Navigator>
  );
};

export { AuthStack, MainStack };