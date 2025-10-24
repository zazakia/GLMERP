import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { InventoryAlert } from '../../services/realtime/InventoryRealtimeService';

interface InventoryAlertsProps {
  alerts: InventoryAlert[];
  onDismissAlert?: (alert: InventoryAlert) => void;
  onViewProduct?: (productId: string) => void;
  onViewLocation?: (locationId: string) => void;
}

export const InventoryAlerts: React.FC<InventoryAlertsProps> = ({
  alerts,
  onDismissAlert,
  onViewProduct,
  onViewLocation
}) => {
  const getAlertIcon = (alertType: InventoryAlert['alert_type']) => {
    switch (alertType) {
      case 'out_of_stock':
        return 'alert-circle';
      case 'low_stock':
        return 'warning';
      case 'overstock':
        return 'information-circle';
      default:
        return 'help-circle';
    }
  };

  const getAlertColor = (severity: InventoryAlert['severity']) => {
    switch (severity) {
      case 'critical':
        return '#e74c3c';
      case 'warning':
        return '#f39c12';
      case 'info':
        return '#3498db';
      default:
        return '#95a5a6';
    }
  };

  const getAlertTitle = (alert: InventoryAlert) => {
    switch (alert.alert_type) {
      case 'out_of_stock':
        return 'Out of Stock';
      case 'low_stock':
        return 'Low Stock';
      case 'overstock':
        return 'Overstock';
      default:
        return 'Alert';
    }
  };

  const getAlertMessage = (alert: InventoryAlert) => {
    switch (alert.alert_type) {
      case 'out_of_stock':
        return `${alert.product_name} is completely out of stock at ${alert.location_name}`;
      case 'low_stock':
        return `${alert.product_name} is running low (${alert.current_quantity} remaining) at ${alert.location_name}`;
      case 'overstock':
        return `${alert.product_name} has excess stock (${alert.current_quantity}) at ${alert.location_name}`;
      default:
        return `${alert.product_name} at ${alert.location_name}`;
    }
  };

  const handleAlertPress = (alert: InventoryAlert) => {
    Alert.alert(
      getAlertTitle(alert),
      getAlertMessage(alert),
      [
        {
          text: 'View Product',
          onPress: () => onViewProduct?.(alert.product_id)
        },
        {
          text: 'View Location',
          onPress: () => onViewLocation?.(alert.location_id)
        },
        {
          text: 'Dismiss',
          onPress: () => onDismissAlert?.(alert),
          style: 'destructive'
        },
        {
          text: 'Cancel',
          style: 'cancel'
        }
      ]
    );
  };

  const renderAlertItem = ({ item: alert }: { item: InventoryAlert }) => (
    <TouchableOpacity
      style={[styles.alertItem, { borderLeftColor: getAlertColor(alert.severity) }]}
      onPress={() => handleAlertPress(alert)}
    >
      <View style={styles.alertIcon}>
        <Ionicons
          name={getAlertIcon(alert.alert_type)}
          size={24}
          color={getAlertColor(alert.severity)}
        />
      </View>

      <View style={styles.alertContent}>
        <Text style={styles.alertTitle}>{getAlertTitle(alert)}</Text>
        <Text style={styles.alertMessage} numberOfLines={2}>
          {getAlertMessage(alert)}
        </Text>
        <Text style={styles.alertTimestamp}>
          {new Date().toLocaleTimeString()}
        </Text>
      </View>

      <TouchableOpacity
        style={styles.dismissButton}
        onPress={() => onDismissAlert?.(alert)}
      >
        <Ionicons name="close" size={20} color="#666" />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  if (alerts.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="checkmark-circle" size={48} color="#27ae60" />
        <Text style={styles.emptyText}>All inventory levels are good!</Text>
        <Text style={styles.emptySubtext}>No alerts at this time</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Inventory Alerts</Text>
        <Text style={styles.headerCount}>{alerts.length}</Text>
      </View>

      <FlatList
        data={alerts}
        keyExtractor={(item) => `${item.product_id}-${item.location_id}-${item.alert_type}`}
        renderItem={renderAlertItem}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContainer}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  headerCount: {
    backgroundColor: '#e74c3c',
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    minWidth: 24,
    textAlign: 'center',
  },
  listContainer: {
    padding: 8,
  },
  alertItem: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 8,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    flexDirection: 'row',
    alignItems: 'center',
  },
  alertIcon: {
    marginRight: 12,
  },
  alertContent: {
    flex: 1,
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  alertMessage: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 4,
  },
  alertTimestamp: {
    fontSize: 12,
    color: '#999',
  },
  dismissButton: {
    padding: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#27ae60',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
});