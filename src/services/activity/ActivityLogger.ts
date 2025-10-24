import { supabase } from '../supabase/config';
import { auditService, AuditAction, AuditSeverity } from '../audit/AuditService';

export enum ActivityType {
  // User Activities
  USER_LOGIN = 'USER_LOGIN',
  USER_LOGOUT = 'USER_LOGOUT',
  USER_PROFILE_UPDATE = 'USER_PROFILE_UPDATE',
  USER_PASSWORD_CHANGE = 'USER_PASSWORD_CHANGE',

  // Sales Activities
  SALE_STARTED = 'SALE_STARTED',
  SALE_COMPLETED = 'SALE_COMPLETED',
  SALE_CANCELLED = 'SALE_CANCELLED',
  SALE_REFUNDED = 'SALE_REFUNDED',
  ITEM_ADDED_TO_CART = 'ITEM_ADDED_TO_CART',
  ITEM_REMOVED_FROM_CART = 'ITEM_REMOVED_FROM_CART',
  CART_CLEARED = 'CART_CLEARED',

  // Inventory Activities
  INVENTORY_COUNT_STARTED = 'INVENTORY_COUNT_STARTED',
  INVENTORY_COUNT_COMPLETED = 'INVENTORY_COUNT_COMPLETED',
  INVENTORY_ADJUSTMENT = 'INVENTORY_ADJUSTMENT',
  PRODUCT_RECEIVED = 'PRODUCT_RECEIVED',
  PRODUCT_TRANSFERRED = 'PRODUCT_TRANSFERRED',

  // Customer Activities
  CUSTOMER_ADDED = 'CUSTOMER_ADDED',
  CUSTOMER_UPDATED = 'CUSTOMER_UPDATED',
  CUSTOMER_LOYALTY_UPDATED = 'CUSTOMER_LOYALTY_UPDATED',

  // System Activities
  SHIFT_STARTED = 'SHIFT_STARTED',
  SHIFT_ENDED = 'SHIFT_ENDED',
  CASH_REGISTER_OPENED = 'CASH_REGISTER_OPENED',
  CASH_REGISTER_CLOSED = 'CASH_REGISTER_CLOSED',
  BACKUP_CREATED = 'BACKUP_CREATED',
  SYSTEM_MAINTENANCE = 'SYSTEM_MAINTENANCE',

  // Error Activities
  ERROR_OCCURRED = 'ERROR_OCCURRED',
  PAYMENT_FAILED = 'PAYMENT_FAILED',
  HARDWARE_ERROR = 'HARDWARE_ERROR'
}

export interface ActivityLog {
  id?: string;
  company_id: string;
  branch_id?: string;
  location_id?: string;
  user_id: string;
  activity_type: ActivityType;
  description: string;
  metadata?: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
  session_id?: string;
  created_at?: string;
}

export interface ActivitySummary {
  total_activities: number;
  activities_by_type: Record<ActivityType, number>;
  activities_by_user: Record<string, number>;
  recent_activities: ActivityLog[];
  peak_hours: Array<{
    hour: number;
    count: number;
  }>;
}

export class ActivityLogger {
  private static instance: ActivityLogger;
  private activityQueue: ActivityLog[] = [];
  private isProcessing = false;

  private constructor() {
    this.startBackgroundProcessing();
  }

  static getInstance(): ActivityLogger {
    if (!ActivityLogger.instance) {
      ActivityLogger.instance = new ActivityLogger();
    }
    return ActivityLogger.instance;
  }

  /**
   * Log a user activity
   */
  async logActivity(activity: Omit<ActivityLog, 'id' | 'created_at'>): Promise<void> {
    try {
      // Add to queue for background processing
      this.activityQueue.push(activity);

      // Log to audit service for critical activities
      if (this.isCriticalActivity(activity.activity_type)) {
        await this.logToAuditService(activity);
      }
    } catch (error) {
      console.error('Failed to queue activity log:', error);
    }
  }

  /**
   * Log user authentication activities
   */
  async logUserAuth(
    userId: string,
    companyId: string,
    branchId: string | undefined,
    locationId: string | undefined,
    activityType: 'LOGIN' | 'LOGOUT',
    success: boolean = true,
    metadata?: Record<string, any>
  ): Promise<void> {
    await this.logActivity({
      company_id: companyId,
      branch_id: branchId,
      location_id: locationId,
      user_id: userId,
      activity_type: activityType === 'LOGIN' ? ActivityType.USER_LOGIN : ActivityType.USER_LOGOUT,
      description: `User ${activityType.toLowerCase()} ${success ? 'successful' : 'failed'}`,
      metadata: {
        success,
        ...metadata
      }
    });
  }

  /**
   * Log sales activities
   */
  async logSaleActivity(
    userId: string,
    companyId: string,
    branchId: string | undefined,
    locationId: string | undefined,
    saleId: string,
    activityType: 'STARTED' | 'COMPLETED' | 'CANCELLED' | 'REFUNDED',
    amount?: number,
    metadata?: Record<string, any>
  ): Promise<void> {
    const descriptions = {
      STARTED: 'Sale transaction started',
      COMPLETED: `Sale completed - $${amount?.toFixed(2) || '0.00'}`,
      CANCELLED: 'Sale cancelled',
      REFUNDED: `Sale refunded - $${amount?.toFixed(2) || '0.00'}`
    };

    await this.logActivity({
      company_id: companyId,
      branch_id: branchId,
      location_id: locationId,
      user_id: userId,
      activity_type: ActivityType[`SALE_${activityType}` as keyof typeof ActivityType],
      description: descriptions[activityType],
      metadata: {
        sale_id: saleId,
        amount,
        ...metadata
      }
    });
  }

  /**
   * Log cart activities
   */
  async logCartActivity(
    userId: string,
    companyId: string,
    branchId: string | undefined,
    locationId: string | undefined,
    activityType: 'ITEM_ADDED' | 'ITEM_REMOVED' | 'CLEARED',
    productId?: string,
    quantity?: number,
    metadata?: Record<string, any>
  ): Promise<void> {
    const descriptions = {
      ITEM_ADDED: `Added ${quantity} x ${productId} to cart`,
      ITEM_REMOVED: `Removed ${quantity} x ${productId} from cart`,
      CLEARED: 'Cart cleared'
    };

    await this.logActivity({
      company_id: companyId,
      branch_id: branchId,
      location_id: locationId,
      user_id: userId,
      activity_type: ActivityType[`CART_${activityType}` as keyof typeof ActivityType],
      description: descriptions[activityType],
      metadata: {
        product_id: productId,
        quantity,
        ...metadata
      }
    });
  }

  /**
   * Log inventory activities
   */
  async logInventoryActivity(
    userId: string,
    companyId: string,
    branchId: string | undefined,
    locationId: string | undefined,
    productId: string,
    activityType: 'COUNT_STARTED' | 'COUNT_COMPLETED' | 'ADJUSTMENT' | 'RECEIVED' | 'TRANSFERRED',
    quantityChange?: number,
    metadata?: Record<string, any>
  ): Promise<void> {
    const descriptions = {
      COUNT_STARTED: `Inventory count started for ${productId}`,
      COUNT_COMPLETED: `Inventory count completed for ${productId}`,
      ADJUSTMENT: `Inventory adjusted by ${quantityChange} for ${productId}`,
      RECEIVED: `Received ${Math.abs(quantityChange || 0)} units of ${productId}`,
      TRANSFERRED: `Transferred ${Math.abs(quantityChange || 0)} units of ${productId}`
    };

    await this.logActivity({
      company_id: companyId,
      branch_id: branchId,
      location_id: locationId,
      user_id: userId,
      activity_type: ActivityType[`INVENTORY_${activityType}` as keyof typeof ActivityType],
      description: descriptions[activityType],
      metadata: {
        product_id: productId,
        quantity_change: quantityChange,
        ...metadata
      }
    });
  }

  /**
   * Log shift activities
   */
  async logShiftActivity(
    userId: string,
    companyId: string,
    branchId: string | undefined,
    locationId: string | undefined,
    shiftId: string,
    activityType: 'STARTED' | 'ENDED',
    metadata?: Record<string, any>
  ): Promise<void> {
    await this.logActivity({
      company_id: companyId,
      branch_id: branchId,
      location_id: locationId,
      user_id: userId,
      activity_type: activityType === 'STARTED' ? ActivityType.SHIFT_STARTED : ActivityType.SHIFT_ENDED,
      description: `Shift ${activityType.toLowerCase()}`,
      metadata: {
        shift_id: shiftId,
        ...metadata
      }
    });
  }

  /**
   * Log error activities
   */
  async logError(
    userId: string | undefined,
    companyId: string,
    branchId: string | undefined,
    locationId: string | undefined,
    errorType: 'GENERAL' | 'PAYMENT' | 'HARDWARE',
    errorMessage: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    const activityTypes = {
      GENERAL: ActivityType.ERROR_OCCURRED,
      PAYMENT: ActivityType.PAYMENT_FAILED,
      HARDWARE: ActivityType.HARDWARE_ERROR
    };

    await this.logActivity({
      company_id: companyId,
      branch_id: branchId,
      location_id: locationId,
      user_id: userId || 'system',
      activity_type: activityTypes[errorType],
      description: `Error: ${errorMessage}`,
      metadata: {
        error_type: errorType,
        error_message: errorMessage,
        ...metadata
      }
    });
  }

  /**
   * Get activity logs with filtering
   */
  async getActivityLogs(
    companyId: string,
    filters: {
      user_id?: string;
      activity_type?: ActivityType;
      date_from?: Date;
      date_to?: Date;
      limit?: number;
    } = {}
  ): Promise<ActivityLog[]> {
    try {
      let query = supabase
        .from('GLMERP01_activity_logs')
        .select('*')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false });

      if (filters.user_id) {
        query = query.eq('user_id', filters.user_id);
      }

      if (filters.activity_type) {
        query = query.eq('activity_type', filters.activity_type);
      }

      if (filters.date_from) {
        query = query.gte('created_at', filters.date_from.toISOString());
      }

      if (filters.date_to) {
        query = query.lte('created_at', filters.date_to.toISOString());
      }

      if (filters.limit) {
        query = query.limit(filters.limit);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching activity logs:', error);
      throw error;
    }
  }

  /**
   * Get activity summary
   */
  async getActivitySummary(
    companyId: string,
    days: number = 30
  ): Promise<ActivitySummary> {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const { data: activities, error } = await supabase
        .from('GLMERP01_activity_logs')
        .select('*')
        .eq('company_id', companyId)
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;

      const logs = activities || [];

      // Count by activity type
      const activitiesByType: Record<ActivityType, number> = {} as Record<ActivityType, number>;
      const activitiesByUser: Record<string, number> = {};
      const hourlyActivity: Record<number, number> = {};

      logs.forEach(log => {
        // Count by type
        activitiesByType[log.activity_type] = (activitiesByType[log.activity_type] || 0) + 1;

        // Count by user
        activitiesByUser[log.user_id] = (activitiesByUser[log.user_id] || 0) + 1;

        // Count by hour
        const hour = new Date(log.created_at).getHours();
        hourlyActivity[hour] = (hourlyActivity[hour] || 0) + 1;
      });

      // Convert hourly activity to array
      const peakHours = Object.entries(hourlyActivity)
        .map(([hour, count]) => ({ hour: parseInt(hour), count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      return {
        total_activities: logs.length,
        activities_by_type: activitiesByType,
        activities_by_user: activitiesByUser,
        recent_activities: logs.slice(0, 50),
        peak_hours: peakHours
      };
    } catch (error) {
      console.error('Error generating activity summary:', error);
      throw error;
    }
  }

  /**
   * Clean up old activity logs
   */
  async cleanupOldLogs(retentionDays: number = 90): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

      const { data, error } = await supabase
        .from('GLMERP01_activity_logs')
        .delete()
        .lt('created_at', cutoffDate.toISOString())
        .select('id');

      if (error) throw error;
      return data?.length || 0;
    } catch (error) {
      console.error('Error cleaning up old activity logs:', error);
      throw error;
    }
  }

  /**
   * Check if activity should be logged to audit service
   */
  private isCriticalActivity(activityType: ActivityType): boolean {
    const criticalActivities = [
      ActivityType.USER_LOGIN,
      ActivityType.USER_LOGOUT,
      ActivityType.SALE_COMPLETED,
      ActivityType.SALE_REFUNDED,
      ActivityType.SALE_CANCELLED,
      ActivityType.INVENTORY_ADJUSTMENT,
      ActivityType.SHIFT_STARTED,
      ActivityType.SHIFT_ENDED,
      ActivityType.ERROR_OCCURRED,
      ActivityType.PAYMENT_FAILED
    ];

    return criticalActivities.includes(activityType);
  }

  /**
   * Log critical activities to audit service
   */
  private async logToAuditService(activity: ActivityLog): Promise<void> {
    try {
      const auditAction = this.mapActivityToAuditAction(activity.activity_type);

      if (auditAction) {
        await auditService.log({
          company_id: activity.company_id,
          user_id: activity.user_id,
          action: auditAction,
          description: activity.description,
          metadata: activity.metadata,
          severity: this.getActivitySeverity(activity.activity_type)
        });
      }
    } catch (error) {
      console.error('Error logging to audit service:', error);
    }
  }

  /**
   * Map activity type to audit action
   */
  private mapActivityToAuditAction(activityType: ActivityType): AuditAction | null {
    const mapping: Partial<Record<ActivityType, AuditAction>> = {
      [ActivityType.USER_LOGIN]: AuditAction.LOGIN,
      [ActivityType.USER_LOGOUT]: AuditAction.LOGOUT,
      [ActivityType.SALE_COMPLETED]: AuditAction.SALE_CREATE,
      [ActivityType.SALE_REFUNDED]: AuditAction.PAYMENT_REFUND,
      [ActivityType.SALE_CANCELLED]: AuditAction.SALE_VOID,
      [ActivityType.INVENTORY_ADJUSTMENT]: AuditAction.INVENTORY_ADJUSTMENT,
      [ActivityType.ERROR_OCCURRED]: AuditAction.SUSPICIOUS_ACTIVITY,
      [ActivityType.PAYMENT_FAILED]: AuditAction.PAYMENT_REFUND
    };

    return mapping[activityType] || null;
  }

  /**
   * Get severity for activity
   */
  private getActivitySeverity(activityType: ActivityType): AuditSeverity {
    const highSeverityActivities = [
      ActivityType.ERROR_OCCURRED,
      ActivityType.PAYMENT_FAILED,
      ActivityType.HARDWARE_ERROR,
      ActivityType.SALE_REFUNDED,
      ActivityType.SALE_CANCELLED
    ];

    return highSeverityActivities.includes(activityType) ? AuditSeverity.HIGH : AuditSeverity.LOW;
  }

  /**
   * Background processing of queued activities
   */
  private async startBackgroundProcessing(): Promise<void> {
    setInterval(async () => {
      if (this.isProcessing || this.activityQueue.length === 0) return;

      this.isProcessing = true;

      try {
        // Process up to 20 activities at a time
        const activitiesToProcess = this.activityQueue.splice(0, 20);

        for (const activity of activitiesToProcess) {
          await this.processActivity(activity);
        }
      } catch (error) {
        console.error('Error in background activity processing:', error);
      } finally {
        this.isProcessing = false;
      }
    }, 3000); // Process every 3 seconds
  }

  /**
   * Process individual activity
   */
  private async processActivity(activity: ActivityLog): Promise<void> {
    try {
      const { error } = await supabase
        .from('GLMERP01_activity_logs')
        .insert({
          company_id: activity.company_id,
          branch_id: activity.branch_id,
          location_id: activity.location_id,
          user_id: activity.user_id,
          activity_type: activity.activity_type,
          description: activity.description,
          metadata: activity.metadata,
          ip_address: activity.ip_address,
          user_agent: activity.user_agent,
          session_id: activity.session_id
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error processing activity:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const activityLogger = ActivityLogger.getInstance();