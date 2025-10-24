import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRealtimeInventory } from '../../hooks/useRealtimeInventory';
import { InventoryRealtimeService } from '../../services/realtime/InventoryRealtimeService';
import { InventoryAlerts } from './InventoryAlerts';
import { useAuth } from '../../contexts/AuthContext';

interface InventorySummary {
  total_products: number;
  low_stock_items: number;
  out_of_stock_items: number;
  total_value: number;
}

export const InventoryDashboard: React.FC = () => {
  const { location } = useAuth();
  const {
    isConnected,
    lastUpdate,
    alerts,
    totalAlerts,
    criticalAlerts,
    warningAlerts,
    infoAlerts,
    clearAlerts
  } = useRealtimeInventory({
    enableAlerts: true,
    enableChangeTracking: true
  });

  const [summary, setSummary] = useState<InventorySummary | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (location?.id) {
      loadInventorySummary();
    }
  }, [location?.id]);

  const loadInventorySummary = async () => {
    if (!location?.id) return;

    try {
      const summaryData = await InventoryRealtimeService.getInventorySummary(location.id);
      setSummary(summaryData);
    } catch (error) {
      console.error('Error loading inventory summary:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadInventorySummary();
    setRefreshing(false);
  };

  const handleDismissAlert = (alert: any) => {
    // In a real app, this would mark the alert as resolved in the database
    console.log('Dismissing alert:', alert);
  };

  const handleViewProduct = (productId: string) => {
    // Navigate to product details
    console.log('View product:', productId);
  };

  const handleViewLocation = (locationId: string) => {
    // Navigate to location details
    console.log('View location:', locationId);
  };

  const formatCurrency = (amount: number) => {
    return `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Connection Status */}
      <View style={styles.statusContainer}>
        <View style={[styles.statusIndicator, { backgroundColor: isConnected ? '#27ae60' : '#e74c3c' }]} />
        <Text style={styles.statusText}>
          {isConnected ? 'Real-time Connected' : 'Disconnected'}
        </Text>
        {lastUpdate && (
          <Text style={styles.lastUpdateText}>
            Last update: {lastUpdate.toLocaleTimeString()}
          </Text>
        )}
      </View>

      {/* Summary Cards */}
      <View style={styles.summaryContainer}>
        <View style={styles.summaryCard}>
          <Ionicons name="cube" size={24} color="#3498db" />
          <Text style={styles.summaryValue}>{summary?.total_products || 0}</Text>
          <Text style={styles.summaryLabel}>Total Products</Text>
        </View>

        <View style={styles.summaryCard}>
          <Ionicons name="cash" size={24} color="#27ae60" />
          <Text style={styles.summaryValue}>{formatCurrency(summary?.total_value || 0)}</Text>
          <Text style={styles.summaryLabel}>Total Value</Text>
        </View>

        <View style={styles.summaryCard}>
          <Ionicons name="warning" size={24} color="#f39c12" />
          <Text style={styles.summaryValue}>{summary?.low_stock_items || 0}</Text>
          <Text style={styles.summaryLabel}>Low Stock</Text>
        </View>

        <View style={styles.summaryCard}>
          <Ionicons name="alert-circle" size={24} color="#e74c3c" />
          <Text style={styles.summaryValue}>{summary?.out_of_stock_items || 0}</Text>
          <Text style={styles.summaryLabel}>Out of Stock</Text>
        </View>
      </View>

      {/* Alerts Summary */}
      <View style={styles.alertsSummary}>
        <View style={styles.alertsHeader}>
          <Text style={styles.alertsTitle}>Inventory Alerts</Text>
          <TouchableOpacity onPress={clearAlerts}>
            <Text style={styles.clearAllText}>Clear All</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.alertsStats}>
          <View style={styles.alertStat}>
            <View style={[styles.alertDot, { backgroundColor: '#e74c3c' }]} />
            <Text style={styles.alertStatText}>{criticalAlerts} Critical</Text>
          </View>

          <View style={styles.alertStat}>
            <View style={[styles.alertDot, { backgroundColor: '#f39c12' }]} />
            <Text style={styles.alertStatText}>{warningAlerts} Warnings</Text>
          </View>

          <View style={styles.alertStat}>
            <View style={[styles.alertDot, { backgroundColor: '#3498db' }]} />
            <Text style={styles.alertStatText}>{infoAlerts} Info</Text>
          </View>
        </View>
      </View>

      {/* Alerts List */}
      <InventoryAlerts
        alerts={alerts}
        onDismissAlert={handleDismissAlert}
        onViewProduct={handleViewProduct}
        onViewLocation={handleViewLocation}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  statusText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  lastUpdateText: {
    fontSize: 12,
    color: '#666',
  },
  summaryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 8,
  },
  summaryCard: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    margin: '1%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 8,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    textAlign: 'center',
  },
  alertsSummary: {
    backgroundColor: '#fff',
    margin: 16,
    borderRadius: 8,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  alertsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  alertsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  clearAllText: {
    fontSize: 14,
    color: '#3498db',
    fontWeight: 'bold',
  },
  alertsStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  alertStat: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  alertDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  alertStatText: {
    fontSize: 14,
    color: '#666',
  },
});