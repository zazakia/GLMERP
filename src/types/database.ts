export type Json =
  string | number | boolean | null | undefined | JsonValue;
export type Database = {
  public: {
    Tables: {
      GLMERP01_companies: {
        Row: {
          id: string;
          company_name: string;
          legal_name: string;
          tax_id: string | null;
          registration_number: string | null;
          logo_url: string | null;
          address: string | null;
          phone: string | null;
          email: string | null;
          website: string | null;
          default_currency: string;
          tax_settings: Json | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['GLMERP01_companies']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Database['public']['Tables']['GLMERP01_companies']['Row'], 'id' | 'created_at' | 'updated_at'>>;
      };
      GLMERP01_branches: {
        Row: {
          id: string;
          company_id: string;
          branch_name: string;
          branch_code: string;
          address: string | null;
          phone: string | null;
          email: string | null;
          manager_id: string | null;
          business_hours: Json | null;
          tax_rate: number;
          currency: string;
          timezone: string;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['GLMERP01_branches']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Database['public']['Tables']['GLMERP01_branches']['Row'], 'id' | 'created_at' | 'updated_at'>>;
      };
      GLMERP01_locations: {
        Row: {
          id: string;
          branch_id: string;
          location_name: string;
          location_code: string;
          location_type: 'warehouse' | 'store' | 'kiosk' | 'office';
          address: string | null;
          phone: string | null;
          email: string | null;
          manager_id: string | null;
          business_hours: Json | null;
          tax_rate: number;
          currency: string;
          timezone: string;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['GLMERP01_locations']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Database['public']['Tables']['GLMERP01_locations']['Row'], 'id' | 'created_at' | 'updated_at'>>;
      };
      GLMERP01_profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          phone: string | null;
          role: 'super_admin' | 'company_admin' | 'branch_manager' | 'location_manager' | 'manager' | 'cashier' | 'inventory_clerk';
          avatar_url: string | null;
          is_active: boolean;
          company_id: string | null;
          branch_id: string | null;
          location_id: string | null;
          assigned_locations: string[] | null;
          permissions: Json | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['GLMERP01_profiles']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Database['public']['Tables']['GLMERP01_profiles']['Row'], 'id' | 'created_at' | 'updated_at'>>;
      };
      GLMERP01_user_sessions: {
        Row: {
          id: string;
          user_id: string;
          company_id: string | null;
          branch_id: string | null;
          location_id: string | null;
          session_token: string;
          device_info: Json | null;
          ip_address: string | null;
          expires_at: string;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['GLMERP01_user_sessions']['Row'], 'id' | 'created_at'>;
        Update: Partial<Omit<Database['public']['Tables']['GLMERP01_user_sessions']['Row'], 'id' | 'created_at'>>;
      };
      GLMERP01_categories: {
        Row: {
          id: string;
          company_id: string;
          name: string;
          description: string | null;
          parent_id: string | null;
          image_url: string | null;
          sort_order: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['GLMERP01_categories']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Database['public']['Tables']['GLMERP01_categories']['Row'], 'id' | 'created_at' | 'updated_at'>>;
      };
      GLMERP01_products: {
        Row: {
          id: string;
          company_id: string;
          sku: string;
          barcode: string | null;
          name: string;
          description: string | null;
          category_id: string | null;
          cost_price: number | null;
          selling_price: number;
          tax_rate: number;
          track_inventory: boolean;
          allow_decimal_quantity: boolean;
          image_urls: string[] | null;
          attributes: Json | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['GLMERP01_products']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Database['public']['Tables']['GLMERP01_products']['Row'], 'id' | 'created_at' | 'updated_at'>>;
      };
      GLMERP01_product_variants: {
        Row: {
          id: string;
          product_id: string;
          sku: string;
          barcode: string | null;
          name: string;
          attributes: Json;
          cost_price: number | null;
          selling_price: number;
          image_url: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['GLMERP01_product_variants']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Database['public']['Tables']['GLMERP01_product_variants']['Row'], 'id' | 'created_at' | 'updated_at'>>;
      };
      GLMERP01_product_pricing: {
        Row: {
          id: string;
          product_id: string;
          variant_id: string | null;
          branch_id: string | null;
          location_id: string | null;
          cost_price: number | null;
          selling_price: number;
          tax_rate: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['GLMERP01_product_pricing']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Database['public']['Tables']['GLMERP01_product_pricing']['Row'], 'id' | 'created_at' | 'updated_at'>>;
      };
      GLMERP01_inventory: {
        Row: {
          id: string;
          company_id: string;
          branch_id: string;
          location_id: string;
          product_id: string;
          variant_id: string | null;
          quantity_on_hand: number;
          quantity_committed: number;
          quantity_on_order: number;
          quantity_available: number;
          reorder_level: number;
          reorder_quantity: number;
          last_counted_at: string | null;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['GLMERP01_inventory']['Row'], 'id' | 'updated_at'>;
        Update: Partial<Omit<Database['public']['Tables']['GLMERP01_inventory']['Row'], 'id' | 'updated_at'>>;
      };
      GLMERP01_inventory_transactions: {
        Row: {
          id: string;
          company_id: string;
          branch_id: string;
          location_id: string;
          product_id: string;
          variant_id: string | null;
          transaction_type: 'sale' | 'return' | 'adjustment' | 'purchase' | 'transfer';
          quantity_change: number;
          quantity_before: number;
          quantity_after: number;
          reference_id: string | null;
          reference_type: string | null;
          reason: string | null;
          user_id: string;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['GLMERP01_inventory_transactions']['Row'], 'id' | 'created_at'>;
        Update: Partial<Omit<Database['public']['Tables']['GLMERP01_inventory_transactions']['Row'], 'id' | 'created_at'>>;
      };
      GLMERP01_suppliers: {
        Row: {
          id: string;
          company_id: string;
          name: string;
          contact_person: string | null;
          phone: string | null;
          email: string | null;
          address: string | null;
          payment_terms: string | null;
          notes: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['GLMERP01_suppliers']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Database['public']['Tables']['GLMERP01_suppliers']['Row'], 'id' | 'created_at' | 'updated_at'>>;
      };
      GLMERP01_purchase_orders: {
        Row: {
          id: string;
          company_id: string;
          branch_id: string;
          location_id: string;
          order_number: string;
          supplier_id: string;
          status: 'draft' | 'ordered' | 'received' | 'cancelled';
          order_date: string;
          expected_date: string | null;
          received_date: string | null;
          subtotal: number;
          tax_amount: number;
          total_amount: number;
          notes: string | null;
          created_by: string;
          received_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['GLMERP01_purchase_orders']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Database['public']['Tables']['GLMERP01_purchase_orders']['Row'], 'id' | 'created_at' | 'updated_at'>>;
      };
      GLMERP01_purchase_order_items: {
        Row: {
          id: string;
          purchase_order_id: string;
          product_id: string;
          variant_id: string | null;
          quantity_ordered: number;
          quantity_received: number;
          unit_cost: number;
          total_cost: number;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['GLMERP01_purchase_order_items']['Row'], 'id' | 'created_at'>;
        Update: Partial<Omit<Database['public']['Tables']['GLMERP01_purchase_order_items']['Row'], 'id' | 'created_at'>>;
      };
      GLMERP01_sales: {
        Row: {
          id: string;
          company_id: string;
          branch_id: string;
          location_id: string;
          sale_number: string;
          customer_id: string | null;
          cashier_id: string;
          status: 'draft' | 'completed' | 'voided' | 'returned';
          subtotal: number;
          tax_amount: number;
          discount_amount: number;
          total_amount: number;
          amount_paid: number;
          change_given: number;
          notes: string | null;
          sale_date: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['GLMERP01_sales']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Database['public']['Tables']['GLMERP01_sales']['Row'], 'id' | 'created_at' | 'updated_at'>>;
      };
      GLMERP01_sale_items: {
        Row: {
          id: string;
          sale_id: string;
          product_id: string;
          variant_id: string | null;
          quantity: number;
          unit_price: number;
          total_price: number;
          tax_rate: number;
          tax_amount: number;
          discount_amount: number;
          returned_quantity: number;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['GLMERP01_sale_items']['Row'], 'id' | 'created_at'>;
        Update: Partial<Omit<Database['public']['Tables']['GLMERP01_sale_items']['Row'], 'id' | 'created_at'>>;
      };
      GLMERP01_payments: {
        Row: {
          id: string;
          sale_id: string;
          payment_method: 'cash' | 'card' | 'digital_wallet' | 'gift_card' | 'store_credit' | 'check';
          amount: number;
          reference: string | null;
          card_type: string | null;
          card_last_four: string | null;
          transaction_id: string | null;
          check_number: string | null;
          status: 'pending' | 'completed' | 'failed' | 'refunded';
          processed_at: string;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['GLMERP01_payments']['Row'], 'id' | 'created_at'>;
        Update: Partial<Omit<Database['public']['Tables']['GLMERP01_payments']['Row'], 'id' | 'created_at'>>;
      };
      GLMERP01_gift_cards: {
        Row: {
          id: string;
          company_id: string;
          branch_id: string;
          card_number: string;
          initial_balance: number;
          current_balance: number;
          customer_id: string | null;
          issued_by: string;
          status: 'active' | 'expired' | 'voided';
          expires_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['GLMERP01_gift_cards']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Database['public']['Tables']['GLMERP01_gift_cards']['Row'], 'id' | 'created_at' | 'updated_at'>>;
      };
      GLMERP01_gift_card_transactions: {
        Row: {
          id: string;
          gift_card_id: string;
          transaction_type: 'issued' | 'used' | 'reloaded' | 'expired';
          amount: number;
          balance_before: number;
          balance_after: number;
          reference_id: string | null;
          reference_type: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['GLMERP01_gift_card_transactions']['Row'], 'id' | 'created_at'>;
        Update: Partial<Omit<Database['public']['Tables']['GLMERP01_gift_card_transactions']['Row'], 'id' | 'created_at'>>;
      };
      GLMERP01_customers: {
        Row: {
          id: string;
          company_id: string;
          customer_number: string;
          first_name: string;
          last_name: string;
          company: string;
          email: string;
          phone: string;
          date_of_birth: string | null;
          notes: string;
          loyalty_points: number;
          store_credit: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['GLMERP01_customers']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Database['public']['Tables']['GLMERP01_customers']['Row'], 'id' | 'created_at' | 'updated_at'>>;
      };
      GLMERP01_customer_addresses: {
        Row: {
          id: string;
          customer_id: string;
          address_type: 'billing' | 'shipping';
          address_line1: string;
          address_line2: string;
          city: string;
          state: string;
          postal_code: string;
          country: string;
          is_default: boolean;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['GLMERP01_customer_addresses']['Row'], 'id' | 'created_at'>;
        Update: Partial<Omit<Database['public']['Tables']['GLMERP01_customer_addresses']['Row'], 'id' | 'created_at'>>;
      };
      GLMERP01_discounts: {
        Row: {
          id: string;
          company_id: string;
          branch_id: string;
          name: string;
          description: string;
          discount_type: 'percentage' | 'fixed_amount';
          discount_value: number;
          minimum_purchase: number;
          maximum_discount: number;
          applicable_products: string[];
          applicable_categories: string[];
          applicable_branches: string[];
          usage_limit: number;
          usage_count: number;
          starts_at: string;
          ends_at: string;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['GLMERP01_discounts']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Database['public']['Tables']['GLMERP01_discounts']['Row'], 'id' | 'created_at' | 'updated_at'>>;
      };
      GLMERP01_shifts: {
        Row: {
          id: string;
          company_id: string;
          branch_id: string;
          location_id: string;
          cashier_id: string;
          shift_number: string;
          start_time: string;
          end_time: string;
          opening_cash: number;
          closing_cash: number;
          expected_cash: number;
          variance: number;
          notes: string;
          status: 'open' | 'closed';
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['GLMERP01_shifts']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Database['public']['Tables']['GLMERP01_shifts']['Row'], 'id' | 'created_at' | 'updated_at'>>;
      };
      GLMERP01_shift_payments: {
        Row: {
          id: string;
          shift_id: string;
          payment_method: string;
          amount: number;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['GLMERP01_shift_payments']['Row'], 'id' | 'created_at'>;
        Update: Partial<Omit<Database['public']['Tables']['GLMERP01_shift_payments']['Row'], 'id' | 'created_at'>>;
      };
      GLMERP01_daily_reports: {
        Row: {
          id: string;
          company_id: string;
          branch_id: string;
          location_id: string;
          report_date: string;
          total_sales: number;
          total_tax: number;
          total_discounts: number;
          number_of_transactions: number;
          average_transaction: number;
          payment_breakdown: Json;
          top_selling_products: Json;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['GLMERP01_daily_reports']['Row'], 'id' | 'created_at'>;
        Update: Partial<Omit<Database['public']['Tables']['GLMERP01_daily_reports']['Row'], 'id' | 'created_at'>>;
      };
      GLMERP01_audit_logs: {
        Row: {
          id: string;
          company_id: string;
          branch_id: string;
          location_id: string;
          user_id: string;
          action: string;
          table_name: string;
          record_id: string;
          old_values: Json;
          new_values: Json;
          ip_address: string;
          user_agent: string;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['GLMERP01_audit_logs']['Row'], 'id' | 'created_at'>;
        Update: Partial<Omit<Database['public']['Tables']['GLMERP01_audit_logs']['Row'], 'id' | 'created_at'>>;
      };
    };
  };
};