import React from 'react';
import { createDrawerNavigator, DrawerContent, DrawerContentComponentProps, DrawerContentScrollView, DrawerItemList, DrawerItem } from '@react-navigation/drawer';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { 
  DashboardScreen, 
  ProductsScreen, 
  InventoryScreen, 
  SalesScreen, 
  CustomersScreen, 
  ReportsScreen, 
  SettingsScreen 
} from '../screens';

const CustomDrawerContent = (props: DrawerContentComponentProps) => {
  const { profile, hasPermission } = useAuth();
  
  return (
    <DrawerContentScrollView {...props}>
      <DrawerItemList>
        <DrawerItem
          label="Dashboard"
          icon={({ focused, color, size }) => (
            <Ionicons
              name={focused ? 'grid' : 'grid-outline'}
              size={size}
              color={color}
            />
          )}
          onPress={() => props.navigation.navigate('Dashboard')}
        />
        
        {hasPermission('products') && (
          <DrawerItem
            label="Products"
            icon={({ focused, color, size }) => (
              <Ionicons
                name={focused ? 'pricetag' : 'pricetag-outline'}
                size={size}
                color={color}
              />
            )}
            onPress={() => props.navigation.navigate('Products')}
          />
        )}
        
        {hasPermission('inventory') && (
          <DrawerItem
            label="Inventory"
            icon={({ focused, color, size }) => (
              <Ionicons
                name={focused ? 'cube' : 'cube-outline'}
                size={size}
                color={color}
              />
            )}
            onPress={() => props.navigation.navigate('Inventory')}
          />
        )}
        
        <DrawerItem
          label="Sales"
          icon={({ focused, color, size }) => (
            <Ionicons
              name={focused ? 'cash' : 'cash-outline'}
              size={size}
              color={color}
            />
          )}
          onPress={() => props.navigation.navigate('Sales')}
        />
        
        {hasPermission('customers') && (
          <DrawerItem
            label="Customers"
            icon={({ focused, color, size }) => (
              <Ionicons
                name={focused ? 'people' : 'people-outline'}
                size={size}
                color={color}
              />
            )}
            onPress={() => props.navigation.navigate('Customers')}
          />
        )}
        
        {hasPermission('reports') && (
          <DrawerItem
            label="Reports"
            icon={({ focused, color, size }) => (
              <Ionicons
                name={focused ? 'bar-chart' : 'bar-chart-outline'}
                size={size}
                color={color}
              />
            )}
            onPress={() => props.navigation.navigate('Reports')}
          />
        )}
        
        <DrawerItem
          label="Settings"
          icon={({ focused, color, size }) => (
            <Ionicons
              name={focused ? 'settings' : 'settings-outline'}
              size={size}
              color={color}
            />
          )}
          onPress={() => props.navigation.navigate('Settings')}
        />
      </DrawerItemList>
    </DrawerContentScrollView>
  );
};

export default CustomDrawerContent;