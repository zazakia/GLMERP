import { supabase } from '../supabase/config';
import { Database } from '../../types/database';

type InventoryRow = Database['public']['Tables']['GLMERP01_inventory']['Row'];
type InventoryUpdate = Database['public']['Tables']['GLMERP01_inventory']['Update'];

export interface InventoryChangeEvent {
  type: 'INSERT' | 'UPDATE' | 'DELETE';
  old?: InventoryRow;
  new?: InventoryRow;
  product_id: string;
  location_id: string;
  quantity_change: number;
  timestamp: Date;
}

export interface InventoryAlert {
  product_id: string;
  product_name: string;
  location_id: string;
  location_name: string;
  current_quantity: number;
  reorder_level: number;
  alert_type: 'low_stock' | 'out_of_stock' | 'overstock';
  severity: 'info' | 'warning' | 'critical';
}

export class InventoryRealtimeService {
  private static subscribers: Map<string, (event: InventoryChangeEvent) => void> = new Map();
  private static alertSubscribers: Map<string, (alert: InventoryAlert) => void> = new Map();
  private static subscription: any = null;

  /**
   * Initialize real-time inventory monitoring
   */
  static async initializeRealtimeUpdates(companyId: string, branchId?: string, locationId?: string): Promise<void> {
    try {
      // Build filter for the subscription
      let filter = `company_id=eq.${companyId}`;
      if (branchId) filter += `,branch_id=eq.${branchId}`;
      if (locationId) filter += `,location_id=eq.${locationId}`;

      // Subscribe to inventory changes
      this.subscription = supabase
        .channel('inventory_changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'GLMERP01_inventory',
            filter: filter
          },
          (payload) => {
            this.handleInventoryChange(payload);
          }
        )
        .subscribe();

      console.log('Real-time inventory updates initialized');
    } catch (error) {
      console.error('Failed to initialize real-time inventory updates:', error);
      throw error;
    }
  }

  /**
   * Stop real-time updates
   */
  static stopRealtimeUpdates(): void {
    if (this.subscription) {
      supabase.removeChannel(this.subscription);
      this.subscription = null;
    }
    this.subscribers.clear();
    this.alertSubscribers.clear();
  }

  /**
   * Subscribe to inventory changes for a specific product/location
   */
  static subscribeToInventoryChanges(
    subscriberId: string,
    callback: (event: InventoryChangeEvent) => void
  ): void {
    this.subscribers.set(subscriberId, callback);
  }

  /**
   * Unsubscribe from inventory changes
   */
  static unsubscribeFromInventoryChanges(subscriberId: string): void {
    this.subscribers.delete(subscriberId);
  }

  /**
   * Subscribe to inventory alerts
   */
  static subscribeToInventoryAlerts(
    subscriberId: string,
    callback: (alert: InventoryAlert) => void
  ): void {
    this.alertSubscribers.set(subscriberId, callback);
  }

  /**
   * Unsubscribe from inventory alerts
   */
  static unsubscribeFromInventoryAlerts(subscriberId: string): void {
    this.alertSubscribers.delete(subscriberId);
  }

  /**
   * Handle inventory change events
   */
  private static async handleInventoryChange(payload: any): Promise<void> {
    try {
      const { eventType, new: newRecord, old: oldRecord } = payload;

      let quantityChange = 0;
      let currentRecord: InventoryRow;

      switch (eventType) {
        case 'INSERT':
          currentRecord = newRecord;
          quantityChange = newRecord.quantity_on_hand;
          break;
        case 'UPDATE':
          currentRecord = newRecord;
          quantityChange = newRecord.quantity_on_hand - (oldRecord?.quantity_on_hand || 0);
          break;
        case 'DELETE':
          currentRecord = oldRecord;
          quantityChange = -(oldRecord?.quantity_on_hand || 0);
          break;
        default:
          return;
      }

      const event: InventoryChangeEvent = {
        type: eventType,
        old: oldRecord,
        new: newRecord,
        product_id: currentRecord.product_id,
        location_id: currentRecord.location_id,
        quantity_change: quantityChange,
        timestamp: new Date()
      };

      // Notify subscribers
      this.subscribers.forEach(callback => {
        try {
          callback(event);
        } catch (error) {
          console.error('Error in inventory change subscriber:', error);
        }
      });

      // Check for alerts
      await this.checkInventoryAlerts(currentRecord);
    } catch (error) {
      console.error('Error handling inventory change:', error);
    }
  }

  /**
   * Check for inventory alerts
   */
  private static async checkInventoryAlerts(inventoryRecord: InventoryRow): Promise<void> {
    try {
      // Get product information
      const { data: product } = await supabase
        .from('GLMERP01_products')
        .select('name')
        .eq('id', inventoryRecord.product_id)
        .single();

      // Get location information
      const { data: location } = await supabase
        .from('GLMERP01_locations')
        .select('location_name')
        .eq('id', inventoryRecord.location_id)
        .single();

      if (!product || !location) return;

      let alert: InventoryAlert | null = null;

      // Check for low stock
      if (inventoryRecord.quantity_on_hand <= inventoryRecord.reorder_level && inventoryRecord.reorder_level > 0) {
        alert = {
          product_id: inventoryRecord.product_id,
          product_name: product.name,
          location_id: inventoryRecord.location_id,
          location_name: location.location_name,
          current_quantity: inventoryRecord.quantity_on_hand,
          reorder_level: inventoryRecord.reorder_level,
          alert_type: inventoryRecord.quantity_on_hand <= 0 ? 'out_of_stock' : 'low_stock',
          severity: inventoryRecord.quantity_on_hand <= 0 ? 'critical' : 'warning'
        };
      }

      // Check for overstock (optional - if quantity is significantly above reorder level)
      const overstockThreshold = inventoryRecord.reorder_quantity * 3; // 3x reorder quantity
      if (inventoryRecord.quantity_on_hand > overstockThreshold) {
        alert = {
          product_id: inventoryRecord.product_id,
          product_name: product.name,
          location_id: inventoryRecord.location_id,
          location_name: location.location_name,
          current_quantity: inventoryRecord.quantity_on_hand,
          reorder_level: inventoryRecord.reorder_level,
          alert_type: 'overstock',
          severity: 'info'
        };
      }

      if (alert) {
        // Notify alert subscribers
        this.alertSubscribers.forEach(callback => {
          try {
            callback(alert);
          } catch (error) {
            console.error('Error in inventory alert subscriber:', error);
          }
        });

        // Store alert in database for historical tracking
        await this.storeInventoryAlert(alert);
      }
    } catch (error) {
      console.error('Error checking inventory alerts:', error);
    }
  }

  /**
   * Store inventory alert in database
   */
  private static async storeInventoryAlert(alert: InventoryAlert): Promise<void> {
    try {
      await supabase
        .from('GLMERP01_inventory_alerts')
        .insert({
          product_id: alert.product_id,
          location_id: alert.location_id,
          alert_type: alert.alert_type,
          severity: alert.alert_type === 'out_of_stock' ? 'critical' :
                   alert.alert_type === 'low_stock' ? 'warning' : 'info',
          current_quantity: alert.current_quantity,
          threshold_quantity: alert.reorder_level,
          message: `${alert.product_name} at ${alert.location_name}: ${alert.alert_type.replace('_', ' ')} (${alert.current_quantity})`,
          is_resolved: false,
          created_at: new Date().toISOString()
        });
    } catch (error) {
      console.error('Error storing inventory alert:', error);
    }
  }

  /**
   * Update inventory quantity
   */
  static async updateInventoryQuantity(
    productId: string,
    locationId: string,
    quantityChange: number,
    reason: string = 'manual_adjustment',
    userId?: string
  ): Promise<void> {
    try {
      // Get current inventory
      const { data: currentInventory, error: fetchError } = await supabase
        .from('GLMERP01_inventory')
        .select('*')
        .eq('product_id', productId)
        .eq('location_id', locationId)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 = no rows returned
        throw fetchError;
      }

      const oldQuantity = currentInventory?.quantity_on_hand || 0;
      const newQuantity = oldQuantity + quantityChange;

      if (currentInventory) {
        // Update existing inventory
        const { error: updateError } = await supabase
          .from('GLMERP01_inventory')
          .update({
            quantity_on_hand: newQuantity,
            updated_at: new Date().toISOString()
          })
          .eq('product_id', productId)
          .eq('location_id', locationId);

        if (updateError) throw updateError;
      } else {
        // Create new inventory record
        const { error: insertError } = await supabase
          .from('GLMERP01_inventory')
          .insert({
            product_id: productId,
            location_id: locationId,
            quantity_on_hand: newQuantity,
            quantity_committed: 0,
            quantity_on_order: 0,
            reorder_level: 0,
            reorder_quantity: 0
          });

        if (insertError) throw insertError;
      }

      // Log the transaction
      await this.logInventoryTransaction(
        productId,
        locationId,
        reason,
        quantityChange,
        oldQuantity,
        newQuantity,
        userId
      );

    } catch (error) {
      console.error('Error updating inventory quantity:', error);
      throw error;
    }
  }

  /**
   * Log inventory transaction
   */
  private static async logInventoryTransaction(
    productId: string,
    locationId: string,
    transactionType: string,
    quantityChange: number,
    quantityBefore: number,
    quantityAfter: number,
    userId?: string
  ): Promise<void> {
    try {
      // Get company and branch IDs from location
      const { data: location } = await supabase
        .from('GLMERP01_locations')
        .select('branch_id, GLMERP01_branches!inner(company_id)')
        .eq('id', locationId)
        .single();

      if (!location) return;

      await supabase
        .from('GLMERP01_inventory_transactions')
        .insert({
          company_id: location.GLMERP01_branches.company_id,
          branch_id: location.branch_id,
          location_id: locationId,
          product_id: productId,
          transaction_type: transactionType,
          quantity_change: quantityChange,
          quantity_before: quantityBefore,
          quantity_after: quantityAfter,
          user_id: userId || null,
          created_at: new Date().toISOString()
        });
    } catch (error) {
      console.error('Error logging inventory transaction:', error);
    }
  }

  /**
   * Get inventory summary for a location
   */
  static async getInventorySummary(locationId: string): Promise<{
    total_products: number;
    low_stock_items: number;
    out_of_stock_items: number;
    total_value: number;
  }> {
    try {
      const { data: inventory, error } = await supabase
        .from('GLMERP01_inventory')
        .select(`
          quantity_on_hand,
          reorder_level,
          GLMERP01_products!inner(selling_price)
        `)
        .eq('location_id', locationId);

      if (error) throw error;

      let totalProducts = 0;
      let lowStockItems = 0;
      let outOfStockItems = 0;
      let totalValue = 0;

      inventory.forEach(item => {
        totalProducts++;
        totalValue += item.quantity_on_hand * item.GLMERP01_products.selling_price;

        if (item.quantity_on_hand <= 0) {
          outOfStockItems++;
        } else if (item.quantity_on_hand <= item.reorder_level) {
          lowStockItems++;
        }
      });

      return {
        total_products: totalProducts,
        low_stock_items: lowStockItems,
        out_of_stock_items: outOfStockItems,
        total_value: totalValue
      };
    } catch (error) {
      console.error('Error getting inventory summary:', error);
      throw error;
    }
  }

  /**
   * Bulk update inventory quantities
   */
  static async bulkUpdateInventory(
    updates: Array<{
      product_id: string;
      location_id: string;
      quantity_change: number;
      reason?: string;
    }>,
    userId?: string
  ): Promise<void> {
    try {
      for (const update of updates) {
        await this.updateInventoryQuantity(
          update.product_id,
          update.location_id,
          update.quantity_change,
          update.reason || 'bulk_update',
          userId
        );
      }
    } catch (error) {
      console.error('Error in bulk inventory update:', error);
      throw error;
    }
  }
}