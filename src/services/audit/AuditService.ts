import { supabase } from '../supabase/config';
import { Database } from '../../types/database';

type AuditLogRow = Database['public']['Tables']['GLMERP01_audit_logs']['Row'];
type AuditLogInsert = Database['public']['Tables']['GLMERP01_audit_logs']['Insert'];

export enum AuditAction {
  // Authentication & Authorization
  LOGIN = 'LOGIN',
  LOGOUT = 'LOGOUT',
  PASSWORD_CHANGE = 'PASSWORD_CHANGE',
  PERMISSION_CHANGE = 'PERMISSION_CHANGE',

  // User Management
  USER_CREATE = 'USER_CREATE',
  USER_UPDATE = 'USER_UPDATE',
  USER_DELETE = 'USER_DELETE',
  USER_ROLE_CHANGE = 'USER_ROLE_CHANGE',

  // Product Management
  PRODUCT_CREATE = 'PRODUCT_CREATE',
  PRODUCT_UPDATE = 'PRODUCT_UPDATE',
  PRODUCT_DELETE = 'PRODUCT_DELETE',
  PRODUCT_PRICE_CHANGE = 'PRODUCT_PRICE_CHANGE',

  // Inventory Management
  INVENTORY_ADJUSTMENT = 'INVENTORY_ADJUSTMENT',
  INVENTORY_TRANSFER = 'INVENTORY_TRANSFER',
  STOCK_COUNT = 'STOCK_COUNT',

  // Sales & Transactions
  SALE_CREATE = 'SALE_CREATE',
  SALE_UPDATE = 'SALE_UPDATE',
  SALE_VOID = 'SALE_VOID',
  SALE_RETURN = 'SALE_RETURN',
  PAYMENT_PROCESS = 'PAYMENT_PROCESS',
  PAYMENT_REFUND = 'PAYMENT_REFUND',

  // Customer Management
  CUSTOMER_CREATE = 'CUSTOMER_CREATE',
  CUSTOMER_UPDATE = 'CUSTOMER_UPDATE',
  CUSTOMER_DELETE = 'CUSTOMER_DELETE',

  // System Operations
  BACKUP_CREATE = 'BACKUP_CREATE',
  BACKUP_RESTORE = 'BACKUP_RESTORE',
  SYSTEM_CONFIG_CHANGE = 'SYSTEM_CONFIG_CHANGE',
  DATA_EXPORT = 'DATA_EXPORT',
  DATA_IMPORT = 'DATA_IMPORT',

  // Security Events
  FAILED_LOGIN = 'FAILED_LOGIN',
  SUSPICIOUS_ACTIVITY = 'SUSPICIOUS_ACTIVITY',
  DATA_ACCESS = 'DATA_ACCESS',
  PERMISSION_DENIED = 'PERMISSION_DENIED'
}

export enum AuditSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export interface AuditLogEntry {
  company_id: string;
  user_id: string;
  action: AuditAction;
  table_name?: string;
  record_id?: string;
  old_values?: Record<string, any>;
  new_values?: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
  severity?: AuditSeverity;
  description?: string;
  metadata?: Record<string, any>;
}

export interface AuditQuery {
  company_id?: string;
  user_id?: string;
  action?: AuditAction;
  table_name?: string;
  record_id?: string;
  severity?: AuditSeverity;
  date_from?: Date;
  date_to?: Date;
  limit?: number;
  offset?: number;
}

export interface AuditReport {
  total_entries: number;
  entries: AuditLogRow[];
  summary: {
    actions_by_type: Record<AuditAction, number>;
    actions_by_user: Record<string, number>;
    actions_by_severity: Record<AuditSeverity, number>;
    timeline: Array<{
      date: string;
      count: number;
    }>;
  };
}

export class AuditService {
  private static instance: AuditService;
  private auditQueue: AuditLogEntry[] = [];
  private isProcessing = false;

  private constructor() {
    // Start background processing
    this.startBackgroundProcessing();
  }

  static getInstance(): AuditService {
    if (!AuditService.instance) {
      AuditService.instance = new AuditService();
    }
    return AuditService.instance;
  }

  /**
   * Log an audit event
   */
  async log(entry: AuditLogEntry): Promise<void> {
    try {
      // Add to queue for background processing
      this.auditQueue.push({
        ...entry,
        severity: entry.severity || AuditSeverity.LOW
      });

      // Process immediately for critical events
      if (entry.severity === AuditSeverity.CRITICAL) {
        await this.processAuditEntry(entry);
      }
    } catch (error) {
      console.error('Failed to queue audit log:', error);
      // Fallback: try to log directly
      try {
        await this.processAuditEntry(entry);
      } catch (fallbackError) {
        console.error('Failed to log audit entry:', fallbackError);
      }
    }
  }

  /**
   * Log user authentication events
   */
  async logAuthentication(
    userId: string,
    companyId: string,
    action: 'LOGIN' | 'LOGOUT' | 'FAILED_LOGIN',
    success: boolean = true,
    metadata?: Record<string, any>
  ): Promise<void> {
    const severity = action === 'FAILED_LOGIN' ? AuditSeverity.MEDIUM :
                    action === 'LOGIN' ? AuditSeverity.LOW : AuditSeverity.LOW;

    await this.log({
      company_id: companyId,
      user_id: userId,
      action: action as AuditAction,
      severity,
      description: `${action} attempt ${success ? 'successful' : 'failed'}`,
      metadata: {
        success,
        ...metadata
      }
    });
  }

  /**
   * Log data changes
   */
  async logDataChange(
    companyId: string,
    userId: string,
    tableName: string,
    recordId: string,
    action: 'CREATE' | 'UPDATE' | 'DELETE',
    oldValues?: Record<string, any>,
    newValues?: Record<string, any>,
    metadata?: Record<string, any>
  ): Promise<void> {
    const auditAction = `${action}_${tableName.toUpperCase()}` as AuditAction;

    await this.log({
      company_id: companyId,
      user_id: userId,
      action: auditAction,
      table_name: tableName,
      record_id: recordId,
      old_values: oldValues,
      new_values: newValues,
      severity: this.getDataChangeSeverity(action, tableName),
      description: `${action} operation on ${tableName}`,
      metadata
    });
  }

  /**
   * Log sales transactions
   */
  async logSaleTransaction(
    companyId: string,
    userId: string,
    saleId: string,
    action: 'CREATE' | 'UPDATE' | 'VOID' | 'RETURN',
    amount: number,
    metadata?: Record<string, any>
  ): Promise<void> {
    const auditAction = `SALE_${action}` as AuditAction;

    await this.log({
      company_id: companyId,
      user_id: userId,
      action: auditAction,
      table_name: 'GLMERP01_sales',
      record_id: saleId,
      severity: action === 'VOID' || action === 'RETURN' ? AuditSeverity.HIGH : AuditSeverity.MEDIUM,
      description: `Sale ${action.toLowerCase()} - Amount: $${amount.toFixed(2)}`,
      metadata: {
        amount,
        ...metadata
      }
    });
  }

  /**
   * Log payment processing
   */
  async logPayment(
    companyId: string,
    userId: string,
    saleId: string,
    paymentMethod: string,
    amount: number,
    success: boolean,
    metadata?: Record<string, any>
  ): Promise<void> {
    await this.log({
      company_id: companyId,
      user_id: userId,
      action: success ? AuditAction.PAYMENT_PROCESS : AuditAction.PAYMENT_REFUND,
      table_name: 'GLMERP01_payments',
      record_id: saleId,
      severity: success ? AuditSeverity.MEDIUM : AuditSeverity.HIGH,
      description: `Payment ${success ? 'processed' : 'refunded'} - ${paymentMethod}: $${amount.toFixed(2)}`,
      metadata: {
        payment_method: paymentMethod,
        amount,
        success,
        ...metadata
      }
    });
  }

  /**
   * Log inventory changes
   */
  async logInventoryChange(
    companyId: string,
    userId: string,
    productId: string,
    locationId: string,
    quantityChange: number,
    reason: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    await this.log({
      company_id: companyId,
      user_id: userId,
      action: AuditAction.INVENTORY_ADJUSTMENT,
      table_name: 'GLMERP01_inventory',
      record_id: productId,
      severity: Math.abs(quantityChange) > 100 ? AuditSeverity.HIGH : AuditSeverity.MEDIUM,
      description: `Inventory adjustment: ${quantityChange > 0 ? '+' : ''}${quantityChange} units - ${reason}`,
      metadata: {
        location_id: locationId,
        quantity_change: quantityChange,
        reason,
        ...metadata
      }
    });
  }

  /**
   * Query audit logs
   */
  async queryLogs(query: AuditQuery): Promise<AuditLogRow[]> {
    try {
      let supabaseQuery = supabase
        .from('GLMERP01_audit_logs')
        .select('*')
        .order('created_at', { ascending: false });

      if (query.company_id) {
        supabaseQuery = supabaseQuery.eq('company_id', query.company_id);
      }

      if (query.user_id) {
        supabaseQuery = supabaseQuery.eq('user_id', query.user_id);
      }

      if (query.action) {
        supabaseQuery = supabaseQuery.eq('action', query.action);
      }

      if (query.table_name) {
        supabaseQuery = supabaseQuery.eq('table_name', query.table_name);
      }

      if (query.record_id) {
        supabaseQuery = supabaseQuery.eq('record_id', query.record_id);
      }

      if (query.severity) {
        supabaseQuery = supabaseQuery.eq('severity', query.severity);
      }

      if (query.date_from) {
        supabaseQuery = supabaseQuery.gte('created_at', query.date_from.toISOString());
      }

      if (query.date_to) {
        supabaseQuery = supabaseQuery.lte('created_at', query.date_to.toISOString());
      }

      if (query.limit) {
        supabaseQuery = supabaseQuery.limit(query.limit);
      }

      if (query.offset) {
        supabaseQuery = supabaseQuery.range(query.offset, (query.offset + (query.limit || 50)) - 1);
      }

      const { data, error } = await supabaseQuery;

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error querying audit logs:', error);
      throw error;
    }
  }

  /**
   * Generate audit report
   */
  async generateReport(query: AuditQuery): Promise<AuditReport> {
    try {
      const entries = await this.queryLogs({ ...query, limit: 1000 });

      // Generate summary statistics
      const actionsByType: Record<AuditAction, number> = {} as Record<AuditAction, number>;
      const actionsByUser: Record<string, number> = {};
      const actionsBySeverity: Record<AuditSeverity, number> = {} as Record<AuditSeverity, number>;
      const timeline: Array<{ date: string; count: number }> = [];

      entries.forEach(entry => {
        // Count by action type
        actionsByType[entry.action] = (actionsByType[entry.action] || 0) + 1;

        // Count by user
        actionsByUser[entry.user_id] = (actionsByUser[entry.user_id] || 0) + 1;

        // Count by severity
        actionsBySeverity[entry.severity as AuditSeverity] = (actionsBySeverity[entry.severity as AuditSeverity] || 0) + 1;

        // Timeline data
        const date = new Date(entry.created_at).toISOString().split('T')[0];
        const existingEntry = timeline.find(t => t.date === date);
        if (existingEntry) {
          existingEntry.count++;
        } else {
          timeline.push({ date, count: 1 });
        }
      });

      return {
        total_entries: entries.length,
        entries,
        summary: {
          actions_by_type: actionsByType,
          actions_by_user: actionsByUser,
          actions_by_severity: actionsBySeverity,
          timeline: timeline.sort((a, b) => a.date.localeCompare(b.date))
        }
      };
    } catch (error) {
      console.error('Error generating audit report:', error);
      throw error;
    }
  }

  /**
   * Clean up old audit logs (retention policy)
   */
  async cleanupOldLogs(retentionDays: number = 365): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

      const { data, error } = await supabase
        .from('GLMERP01_audit_logs')
        .delete()
        .lt('created_at', cutoffDate.toISOString())
        .select('id');

      if (error) throw error;
      return data?.length || 0;
    } catch (error) {
      console.error('Error cleaning up old audit logs:', error);
      throw error;
    }
  }

  /**
   * Get audit log statistics
   */
  async getStatistics(companyId: string, days: number = 30): Promise<{
    total_logs: number;
    critical_events: number;
    high_severity_events: number;
    recent_activity: Array<{
      date: string;
      count: number;
      critical_count: number;
    }>;
  }> {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const { data, error } = await supabase
        .from('GLMERP01_audit_logs')
        .select('*')
        .eq('company_id', companyId)
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;

      const logs = data || [];
      const criticalEvents = logs.filter(log => log.severity === AuditSeverity.CRITICAL).length;
      const highSeverityEvents = logs.filter(log => log.severity === AuditSeverity.HIGH).length;

      // Group by date
      const activityByDate: Record<string, { total: number; critical: number }> = {};

      logs.forEach(log => {
        const date = new Date(log.created_at).toISOString().split('T')[0];
        if (!activityByDate[date]) {
          activityByDate[date] = { total: 0, critical: 0 };
        }
        activityByDate[date].total++;
        if (log.severity === AuditSeverity.CRITICAL) {
          activityByDate[date].critical++;
        }
      });

      const recentActivity = Object.entries(activityByDate)
        .map(([date, counts]) => ({
          date,
          count: counts.total,
          critical_count: counts.critical
        }))
        .sort((a, b) => b.date.localeCompare(a.date))
        .slice(0, 30);

      return {
        total_logs: logs.length,
        critical_events: criticalEvents,
        high_severity_events: highSeverityEvents,
        recent_activity: recentActivity
      };
    } catch (error) {
      console.error('Error getting audit statistics:', error);
      throw error;
    }
  }

  /**
   * Process audit entry
   */
  private async processAuditEntry(entry: AuditLogEntry): Promise<void> {
    try {
      const auditData: AuditLogInsert = {
        company_id: entry.company_id,
        user_id: entry.user_id,
        action: entry.action,
        table_name: entry.table_name,
        record_id: entry.record_id,
        old_values: entry.old_values,
        new_values: entry.new_values,
        ip_address: entry.ip_address,
        user_agent: entry.user_agent,
        severity: entry.severity || AuditSeverity.LOW,
        description: entry.description,
        metadata: entry.metadata
      };

      const { error } = await supabase
        .from('GLMERP01_audit_logs')
        .insert(auditData);

      if (error) throw error;
    } catch (error) {
      console.error('Error processing audit entry:', error);
      throw error;
    }
  }

  /**
   * Background processing of queued audit entries
   */
  private async startBackgroundProcessing(): Promise<void> {
    setInterval(async () => {
      if (this.isProcessing || this.auditQueue.length === 0) return;

      this.isProcessing = true;

      try {
        // Process up to 10 entries at a time
        const entriesToProcess = this.auditQueue.splice(0, 10);

        for (const entry of entriesToProcess) {
          await this.processAuditEntry(entry);
        }
      } catch (error) {
        console.error('Error in background audit processing:', error);
      } finally {
        this.isProcessing = false;
      }
    }, 5000); // Process every 5 seconds
  }

  /**
   * Get severity for data changes
   */
  private getDataChangeSeverity(action: string, tableName: string): AuditSeverity {
    // Critical tables that require high severity logging
    const criticalTables = ['GLMERP01_users', 'GLMERP01_companies', 'GLMERP01_sales'];
    const highSeverityTables = ['GLMERP01_inventory', 'GLMERP01_payments', 'GLMERP01_customers'];

    if (criticalTables.includes(tableName)) {
      return AuditSeverity.HIGH;
    }

    if (highSeverityTables.includes(tableName)) {
      return AuditSeverity.MEDIUM;
    }

    return AuditSeverity.LOW;
  }
}

// Export singleton instance
export const auditService = AuditService.getInstance();