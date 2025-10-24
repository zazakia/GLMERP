import { useEffect, useState, useCallback } from 'react';
import { InventoryRealtimeService, InventoryChangeEvent, InventoryAlert } from '../services/realtime/InventoryRealtimeService';
import { useAuth } from '../contexts/AuthContext';

interface UseRealtimeInventoryOptions {
  enableAlerts?: boolean;
  enableChangeTracking?: boolean;
}

interface InventoryState {
  isConnected: boolean;
  lastUpdate: Date | null;
  alerts: InventoryAlert[];
  recentChanges: InventoryChangeEvent[];
}

export const useRealtimeInventory = (options: UseRealtimeInventoryOptions = {}) => {
  const { company, branch, location } = useAuth();
  const [state, setState] = useState<InventoryState>({
    isConnected: false,
    lastUpdate: null,
    alerts: [],
    recentChanges: []
  });

  const { enableAlerts = true, enableChangeTracking = true } = options;

  // Handle inventory change events
  const handleInventoryChange = useCallback((event: InventoryChangeEvent) => {
    setState(prevState => ({
      ...prevState,
      lastUpdate: new Date(),
      recentChanges: [event, ...prevState.recentChanges.slice(0, 49)] // Keep last 50 changes
    }));
  }, []);

  // Handle inventory alerts
  const handleInventoryAlert = useCallback((alert: InventoryAlert) => {
    setState(prevState => ({
      ...prevState,
      alerts: [alert, ...prevState.alerts.filter(a =>
        !(a.product_id === alert.product_id && a.location_id === alert.location_id && a.alert_type === alert.alert_type)
      )].slice(0, 20) // Keep last 20 alerts, remove duplicates
    }));
  }, []);

  // Initialize real-time updates
  useEffect(() => {
    if (!company?.id) return;

    const initializeRealtime = async () => {
      try {
        await InventoryRealtimeService.initializeRealtimeUpdates(
          company.id,
          branch?.id,
          location?.id
        );

        setState(prevState => ({ ...prevState, isConnected: true }));

        if (enableChangeTracking) {
          InventoryRealtimeService.subscribeToInventoryChanges(
            'main-subscriber',
            handleInventoryChange
          );
        }

        if (enableAlerts) {
          InventoryRealtimeService.subscribeToInventoryAlerts(
            'main-subscriber',
            handleInventoryAlert
          );
        }
      } catch (error) {
        console.error('Failed to initialize real-time inventory:', error);
        setState(prevState => ({ ...prevState, isConnected: false }));
      }
    };

    initializeRealtime();

    // Cleanup function
    return () => {
      InventoryRealtimeService.unsubscribeFromInventoryChanges('main-subscriber');
      InventoryRealtimeService.unsubscribeFromInventoryAlerts('main-subscriber');
      InventoryRealtimeService.stopRealtimeUpdates();
      setState(prevState => ({ ...prevState, isConnected: false }));
    };
  }, [company?.id, branch?.id, location?.id, enableAlerts, enableChangeTracking, handleInventoryChange, handleInventoryAlert]);

  // Clear alerts
  const clearAlerts = useCallback(() => {
    setState(prevState => ({ ...prevState, alerts: [] }));
  }, []);

  // Clear recent changes
  const clearRecentChanges = useCallback(() => {
    setState(prevState => ({ ...prevState, recentChanges: [] }));
  }, []);

  // Get alerts by type
  const getAlertsByType = useCallback((type: InventoryAlert['alert_type']) => {
    return state.alerts.filter(alert => alert.alert_type === type);
  }, [state.alerts]);

  // Get alerts by severity
  const getAlertsBySeverity = useCallback((severity: InventoryAlert['severity']) => {
    return state.alerts.filter(alert => alert.severity === severity);
  }, [state.alerts]);

  // Get critical alerts count
  const getCriticalAlertsCount = useCallback(() => {
    return state.alerts.filter(alert => alert.severity === 'critical').length;
  }, [state.alerts]);

  // Get recent changes for a specific product
  const getRecentChangesForProduct = useCallback((productId: string) => {
    return state.recentChanges.filter(change => change.product_id === productId);
  }, [state.recentChanges]);

  // Get recent changes for a specific location
  const getRecentChangesForLocation = useCallback((locationId: string) => {
    return state.recentChanges.filter(change => change.location_id === locationId);
  }, [state.recentChanges]);

  return {
    // State
    isConnected: state.isConnected,
    lastUpdate: state.lastUpdate,
    alerts: state.alerts,
    recentChanges: state.recentChanges,

    // Actions
    clearAlerts,
    clearRecentChanges,

    // Computed values
    getAlertsByType,
    getAlertsBySeverity,
    getCriticalAlertsCount,
    getRecentChangesForProduct,
    getRecentChangesForLocation,

    // Alert counts
    totalAlerts: state.alerts.length,
    criticalAlerts: getCriticalAlertsCount(),
    warningAlerts: getAlertsBySeverity('warning').length,
    infoAlerts: getAlertsBySeverity('info').length,

    // Change counts
    totalChanges: state.recentChanges.length,
    recentStockDecreases: state.recentChanges.filter(change => change.quantity_change < 0).length,
    recentStockIncreases: state.recentChanges.filter(change => change.quantity_change > 0).length,
  };
};