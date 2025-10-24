import { useState, useEffect, useCallback } from 'react';
import { auditService, AuditAction, AuditSeverity, AuditQuery, AuditReport } from '../services/audit/AuditService';
import { useAuth } from '../contexts/AuthContext';

interface UseAuditOptions {
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export const useAudit = (options: UseAuditOptions = {}) => {
  const { company } = useAuth();
  const { autoRefresh = false, refreshInterval = 30000 } = options;

  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<AuditReport | null>(null);
  const [statistics, setStatistics] = useState<any>(null);

  // Query audit logs
  const queryLogs = useCallback(async (query: AuditQuery) => {
    if (!company?.id) return;

    setLoading(true);
    setError(null);

    try {
      const results = await auditService.queryLogs({
        company_id: company.id,
        ...query
      });
      setLogs(results);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to query audit logs');
      console.error('Audit query error:', err);
    } finally {
      setLoading(false);
    }
  }, [company?.id]);

  // Generate audit report
  const generateReport = useCallback(async (query: AuditQuery) => {
    if (!company?.id) return;

    setLoading(true);
    setError(null);

    try {
      const reportData = await auditService.generateReport({
        company_id: company.id,
        ...query
      });
      setReport(reportData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate audit report');
      console.error('Audit report error:', err);
    } finally {
      setLoading(false);
    }
  }, [company?.id]);

  // Get audit statistics
  const getStatistics = useCallback(async (days: number = 30) => {
    if (!company?.id) return;

    try {
      const stats = await auditService.getStatistics(company.id, days);
      setStatistics(stats);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get audit statistics');
      console.error('Audit statistics error:', err);
    }
  }, [company?.id]);

  // Log custom audit event
  const logEvent = useCallback(async (
    action: AuditAction,
    tableName?: string,
    recordId?: string,
    description?: string,
    metadata?: Record<string, any>
  ) => {
    if (!company?.id) return;

    try {
      await auditService.log({
        company_id: company.id,
        user_id: 'current-user-id', // This should come from auth context
        action,
        table_name: tableName,
        record_id: recordId,
        description,
        metadata
      });
    } catch (err) {
      console.error('Failed to log audit event:', err);
    }
  }, [company?.id]);

  // Auto-refresh functionality
  useEffect(() => {
    if (!autoRefresh || !company?.id) return;

    const interval = setInterval(() => {
      getStatistics();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, company?.id, getStatistics]);

  // Initial load
  useEffect(() => {
    if (company?.id) {
      getStatistics();
    }
  }, [company?.id, getStatistics]);

  return {
    // State
    logs,
    loading,
    error,
    report,
    statistics,

    // Actions
    queryLogs,
    generateReport,
    getStatistics,
    logEvent,

    // Computed values
    hasLogs: logs.length > 0,
    criticalEvents: statistics?.critical_events || 0,
    highSeverityEvents: statistics?.high_severity_events || 0,
    totalLogs: statistics?.total_logs || 0,

    // Recent activity
    recentActivity: statistics?.recent_activity || [],

    // Clear error
    clearError: () => setError(null)
  };
};