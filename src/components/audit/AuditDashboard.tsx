import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, FlatList, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAudit } from '../../hooks/useAudit';
import { AuditAction, AuditSeverity } from '../../services/audit/AuditService';
import { useAuth } from '../../contexts/AuthContext';

interface AuditLogItem {
  id: string;
  action: string;
  table_name?: string;
  record_id?: string;
  description?: string;
  severity: string;
  created_at: string;
  user_id: string;
}

export const AuditDashboard: React.FC = () => {
  const { company } = useAuth();
  const {
    logs,
    loading,
    error,
    statistics,
    queryLogs,
    generateReport,
    clearError
  } = useAudit({ autoRefresh: true, refreshInterval: 60000 });

  const [selectedFilter, setSelectedFilter] = useState<AuditAction | 'ALL'>('ALL');
  const [selectedSeverity, setSelectedSeverity] = useState<AuditSeverity | 'ALL'>('ALL');

  useEffect(() => {
    if (company?.id) {
      loadAuditLogs();
    }
  }, [company?.id, selectedFilter, selectedSeverity]);

  const loadAuditLogs = async () => {
    const query: any = {
      limit: 100
    };

    if (selectedFilter !== 'ALL') {
      query.action = selectedFilter;
    }

    if (selectedSeverity !== 'ALL') {
      query.severity = selectedSeverity;
    }

    await queryLogs(query);
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return '#e74c3c';
      case 'high':
        return '#e67e22';
      case 'medium':
        return '#f39c12';
      case 'low':
        return '#27ae60';
      default:
        return '#95a5a6';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'alert-circle';
      case 'high':
        return 'warning';
      case 'medium':
        return 'information-circle';
      case 'low':
        return 'checkmark-circle';
      default:
        return 'help-circle';
    }
  };

  const getActionDescription = (action: string) => {
    const descriptions: Record<string, string> = {
      'LOGIN': 'User Login',
      'LOGOUT': 'User Logout',
      'USER_CREATE': 'User Created',
      'USER_UPDATE': 'User Updated',
      'PRODUCT_CREATE': 'Product Created',
      'PRODUCT_UPDATE': 'Product Updated',
      'SALE_CREATE': 'Sale Created',
      'PAYMENT_PROCESS': 'Payment Processed',
      'INVENTORY_ADJUSTMENT': 'Inventory Adjusted'
    };
    return descriptions[action] || action.replace(/_/g, ' ');
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString();
  };

  const handleLogPress = (log: AuditLogItem) => {
    Alert.alert(
      getActionDescription(log.action),
      log.description || 'No description available',
      [
        {
          text: 'View Details',
          onPress: () => showLogDetails(log)
        },
        {
          text: 'Close',
          style: 'cancel'
        }
      ]
    );
  };

  const showLogDetails = (log: AuditLogItem) => {
    const details = [
      `Action: ${getActionDescription(log.action)}`,
      `Table: ${log.table_name || 'N/A'}`,
      `Record ID: ${log.record_id || 'N/A'}`,
      `User: ${log.user_id}`,
      `Time: ${new Date(log.created_at).toLocaleString()}`,
      `Severity: ${log.severity.toUpperCase()}`
    ];

    Alert.alert(
      'Audit Log Details',
      details.join('\n'),
      [{ text: 'OK' }]
    );
  };

  const renderLogItem = ({ item: log }: { item: AuditLogItem }) => (
    <TouchableOpacity
      style={styles.logItem}
      onPress={() => handleLogPress(log)}
    >
      <View style={[styles.severityIndicator, { backgroundColor: getSeverityColor(log.severity) }]} />
      <View style={styles.logContent}>
        <View style={styles.logHeader}>
          <Text style={styles.logAction}>{getActionDescription(log.action)}</Text>
          <Text style={styles.logTime}>{formatTimestamp(log.created_at)}</Text>
        </View>
        <Text style={styles.logDescription} numberOfLines={2}>
          {log.description || 'No description'}
        </Text>
        {log.table_name && (
          <Text style={styles.logTable}>{log.table_name}</Text>
        )}
      </View>
      <Ionicons name="chevron-forward" size={20} color="#ccc" />
    </TouchableOpacity>
  );

  const renderStatisticsCard = (title: string, value: number, icon: string, color: string) => (
    <View style={[styles.statCard, { borderLeftColor: color }]}>
      <Ionicons name={icon as any} size={24} color={color} />
      <View style={styles.statContent}>
        <Text style={styles.statValue}>{value.toLocaleString()}</Text>
        <Text style={styles.statLabel}>{title}</Text>
      </View>
    </View>
  );

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle" size={48} color="#e74c3c" />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={clearError}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Statistics Overview */}
      <View style={styles.statsContainer}>
        {renderStatisticsCard(
          'Total Logs',
          statistics?.total_logs || 0,
          'document-text',
          '#3498db'
        )}
        {renderStatisticsCard(
          'Critical Events',
          statistics?.critical_events || 0,
          'alert-circle',
          '#e74c3c'
        )}
        {renderStatisticsCard(
          'High Severity',
          statistics?.high_severity_events || 0,
          'warning',
          '#e67e22'
        )}
        {renderStatisticsCard(
          'Recent Activity',
          statistics?.recent_activity?.length || 0,
          'time',
          '#27ae60'
        )}
      </View>

      {/* Filters */}
      <View style={styles.filtersContainer}>
        <Text style={styles.filtersTitle}>Filters</Text>
        <View style={styles.filterRow}>
          <TouchableOpacity
            style={[styles.filterButton, selectedFilter === 'ALL' && styles.filterButtonActive]}
            onPress={() => setSelectedFilter('ALL')}
          >
            <Text style={[styles.filterText, selectedFilter === 'ALL' && styles.filterTextActive]}>
              All Actions
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterButton, selectedFilter === AuditAction.LOGIN && styles.filterButtonActive]}
            onPress={() => setSelectedFilter(AuditAction.LOGIN)}
          >
            <Text style={[styles.filterText, selectedFilter === AuditAction.LOGIN && styles.filterTextActive]}>
              Logins
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterButton, selectedFilter === AuditAction.SALE_CREATE && styles.filterButtonActive]}
            onPress={() => setSelectedFilter(AuditAction.SALE_CREATE)}
          >
            <Text style={[styles.filterText, selectedFilter === AuditAction.SALE_CREATE && styles.filterTextActive]}>
              Sales
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.filterRow}>
          <TouchableOpacity
            style={[styles.filterButton, selectedSeverity === 'ALL' && styles.filterButtonActive]}
            onPress={() => setSelectedSeverity('ALL')}
          >
            <Text style={[styles.filterText, selectedSeverity === 'ALL' && styles.filterTextActive]}>
              All Severity
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterButton, selectedSeverity === AuditSeverity.CRITICAL && styles.filterButtonActive]}
            onPress={() => setSelectedSeverity(AuditSeverity.CRITICAL)}
          >
            <Text style={[styles.filterText, selectedSeverity === AuditSeverity.CRITICAL && styles.filterTextActive]}>
              Critical
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterButton, selectedSeverity === AuditSeverity.HIGH && styles.filterButtonActive]}
            onPress={() => setSelectedSeverity(AuditSeverity.HIGH)}
          >
            <Text style={[styles.filterText, selectedSeverity === AuditSeverity.HIGH && styles.filterTextActive]}>
              High
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Audit Logs List */}
      <View style={styles.logsContainer}>
        <View style={styles.logsHeader}>
          <Text style={styles.logsTitle}>Recent Activity</Text>
          <TouchableOpacity onPress={loadAuditLogs}>
            <Ionicons name="refresh" size={24} color="#3498db" />
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading audit logs...</Text>
          </View>
        ) : logs.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="document-text-outline" size={48} color="#ccc" />
            <Text style={styles.emptyText}>No audit logs found</Text>
          </View>
        ) : (
          <FlatList
            data={logs}
            keyExtractor={(item) => item.id}
            renderItem={renderLogItem}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.logsList}
          />
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  statsContainer: {
    padding: 16,
  },
  statCard: {
    flexDirection: 'row',
    alignItems: 'center',
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
  },
  statContent: {
    marginLeft: 12,
    flex: 1,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  filtersContainer: {
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
  filtersTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  filterRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  filterButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#ddd',
    marginHorizontal: 4,
    alignItems: 'center',
  },
  filterButtonActive: {
    backgroundColor: '#3498db',
    borderColor: '#3498db',
  },
  filterText: {
    fontSize: 12,
    color: '#666',
  },
  filterTextActive: {
    color: '#fff',
  },
  logsContainer: {
    backgroundColor: '#fff',
    margin: 16,
    marginTop: 0,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  logsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  logsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  logsList: {
    padding: 8,
  },
  logItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f8f9fa',
  },
  severityIndicator: {
    width: 4,
    height: 40,
    borderRadius: 2,
    marginRight: 12,
  },
  logContent: {
    flex: 1,
  },
  logHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  logAction: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  logTime: {
    fontSize: 12,
    color: '#666',
  },
  logDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  logTable: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
  },
  loadingContainer: {
    padding: 32,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginTop: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  errorText: {
    fontSize: 16,
    color: '#e74c3c',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#3498db',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 6,
  },
  retryText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});