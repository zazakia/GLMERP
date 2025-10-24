# POS Database Schema Design with GLMERP01 Prefix

## Overview
This document outlines the complete database schema for the Retail POS system using Supabase (PostgreSQL) with all tables prefixed with "GLMERP01_".

## Core Tables

### 1. Users & Authentication

#### GLMERP01_profiles
```sql
CREATE TABLE GLMERP01_profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  phone TEXT,
  role TEXT NOT NULL CHECK (role IN ('admin', 'manager', 'cashier', 'inventory_clerk')),
  avatar_url TEXT,
  is_active BOOLEAN DEFAULT true,
  store_id UUID REFERENCES GLMERP01_stores(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### GLMERP01_stores
```sql
CREATE TABLE GLMERP01_stores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  address TEXT,
  phone TEXT,
  email TEXT,
  business_hours JSONB,
  tax_rate DECIMAL(5,4) DEFAULT 0.0000,
  currency TEXT DEFAULT 'USD',
  timezone TEXT DEFAULT 'UTC',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### GLMERP01_user_sessions
```sql
CREATE TABLE GLMERP01_user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES GLMERP01_profiles(id) ON DELETE CASCADE,
  session_token TEXT UNIQUE NOT NULL,
  device_info JSONB,
  ip_address INET,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 2. Product Catalog

#### GLMERP01_categories
```sql
CREATE TABLE GLMERP01_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  parent_id UUID REFERENCES GLMERP01_categories(id),
  image_url TEXT,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### GLMERP01_products
```sql
CREATE TABLE GLMERP01_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sku TEXT UNIQUE NOT NULL,
  barcode TEXT,
  name TEXT NOT NULL,
  description TEXT,
  category_id UUID REFERENCES GLMERP01_categories(id),
  cost_price DECIMAL(10,2),
  selling_price DECIMAL(10,2) NOT NULL,
  tax_rate DECIMAL(5,4) DEFAULT 0.0000,
  track_inventory BOOLEAN DEFAULT true,
  allow_decimal_quantity BOOLEAN DEFAULT false,
  image_urls TEXT[],
  attributes JSONB,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### GLMERP01_product_variants
```sql
CREATE TABLE GLMERP01_product_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES GLMERP01_products(id) ON DELETE CASCADE,
  sku TEXT UNIQUE NOT NULL,
  barcode TEXT,
  name TEXT NOT NULL,
  attributes JSONB NOT NULL,
  cost_price DECIMAL(10,2),
  selling_price DECIMAL(10,2) NOT NULL,
  image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 3. Inventory Management

#### GLMERP01_inventory
```sql
CREATE TABLE GLMERP01_inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID REFERENCES GLMERP01_stores(id),
  product_id UUID REFERENCES GLMERP01_products(id),
  variant_id UUID REFERENCES GLMERP01_product_variants(id),
  quantity_on_hand INTEGER NOT NULL DEFAULT 0,
  quantity_committed INTEGER NOT NULL DEFAULT 0,
  quantity_on_order INTEGER NOT NULL DEFAULT 0,
  reorder_level INTEGER DEFAULT 0,
  reorder_quantity INTEGER DEFAULT 0,
  last_counted_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(store_id, product_id, variant_id)
);
```

#### GLMERP01_inventory_transactions
```sql
CREATE TABLE GLMERP01_inventory_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID REFERENCES GLMERP01_stores(id),
  product_id UUID REFERENCES GLMERP01_products(id),
  variant_id UUID REFERENCES GLMERP01_product_variants(id),
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('sale', 'return', 'adjustment', 'purchase', 'transfer')),
  quantity_change INTEGER NOT NULL,
  quantity_before INTEGER NOT NULL,
  quantity_after INTEGER NOT NULL,
  reference_id UUID,
  reference_type TEXT,
  reason TEXT,
  user_id UUID REFERENCES GLMERP01_profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### GLMERP01_suppliers
```sql
CREATE TABLE GLMERP01_suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  contact_person TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,
  payment_terms TEXT,
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### GLMERP01_purchase_orders
```sql
CREATE TABLE GLMERP01_purchase_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT UNIQUE NOT NULL,
  supplier_id UUID REFERENCES GLMERP01_suppliers(id),
  store_id UUID REFERENCES GLMERP01_stores(id),
  status TEXT NOT NULL CHECK (status IN ('draft', 'ordered', 'received', 'cancelled')),
  order_date DATE NOT NULL,
  expected_date DATE,
  received_date DATE,
  subtotal DECIMAL(12,2) NOT NULL,
  tax_amount DECIMAL(12,2) DEFAULT 0,
  total_amount DECIMAL(12,2) NOT NULL,
  notes TEXT,
  created_by UUID REFERENCES GLMERP01_profiles(id),
  received_by UUID REFERENCES GLMERP01_profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### GLMERP01_purchase_order_items
```sql
CREATE TABLE GLMERP01_purchase_order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_order_id UUID REFERENCES GLMERP01_purchase_orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES GLMERP01_products(id),
  variant_id UUID REFERENCES GLMERP01_product_variants(id),
  quantity_ordered INTEGER NOT NULL,
  quantity_received INTEGER DEFAULT 0,
  unit_cost DECIMAL(10,2) NOT NULL,
  total_cost DECIMAL(12,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 4. Sales & Transactions

#### GLMERP01_sales
```sql
CREATE TABLE GLMERP01_sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_number TEXT UNIQUE NOT NULL,
  store_id UUID REFERENCES GLMERP01_stores(id),
  customer_id UUID REFERENCES GLMERP01_customers(id),
  cashier_id UUID REFERENCES GLMERP01_profiles(id),
  status TEXT NOT NULL CHECK (status IN ('draft', 'completed', 'voided', 'returned')),
  subtotal DECIMAL(12,2) NOT NULL,
  tax_amount DECIMAL(12,2) DEFAULT 0,
  discount_amount DECIMAL(12,2) DEFAULT 0,
  total_amount DECIMAL(12,2) NOT NULL,
  amount_paid DECIMAL(12,2) NOT NULL,
  change_given DECIMAL(12,2) DEFAULT 0,
  notes TEXT,
  sale_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### GLMERP01_sale_items
```sql
CREATE TABLE GLMERP01_sale_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id UUID REFERENCES GLMERP01_sales(id) ON DELETE CASCADE,
  product_id UUID REFERENCES GLMERP01_products(id),
  variant_id UUID REFERENCES GLMERP01_product_variants(id),
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  total_price DECIMAL(12,2) NOT NULL,
  tax_rate DECIMAL(5,4) DEFAULT 0.0000,
  tax_amount DECIMAL(12,2) DEFAULT 0,
  discount_amount DECIMAL(12,2) DEFAULT 0,
  returned_quantity INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### GLMERP01_payments
```sql
CREATE TABLE GLMERP01_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id UUID REFERENCES GLMERP01_sales(id) ON DELETE CASCADE,
  payment_method TEXT NOT NULL CHECK (payment_method IN ('cash', 'card', 'digital_wallet', 'gift_card', 'store_credit')),
  amount DECIMAL(12,2) NOT NULL,
  reference TEXT,
  card_type TEXT,
  card_last_four TEXT,
  transaction_id TEXT,
  status TEXT NOT NULL CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  processed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### GLMERP01_gift_cards
```sql
CREATE TABLE GLMERP01_gift_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  card_number TEXT UNIQUE NOT NULL,
  initial_balance DECIMAL(12,2) NOT NULL,
  current_balance DECIMAL(12,2) NOT NULL,
  customer_id UUID REFERENCES GLMERP01_customers(id),
  issued_by UUID REFERENCES GLMERP01_profiles(id),
  status TEXT NOT NULL CHECK (status IN ('active', 'expired', 'voided')),
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### GLMERP01_gift_card_transactions
```sql
CREATE TABLE GLMERP01_gift_card_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gift_card_id UUID REFERENCES GLMERP01_gift_cards(id) ON DELETE CASCADE,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('issued', 'used', 'reloaded', 'expired')),
  amount DECIMAL(12,2) NOT NULL,
  balance_before DECIMAL(12,2) NOT NULL,
  balance_after DECIMAL(12,2) NOT NULL,
  reference_id UUID,
  reference_type TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 5. Customer Management

#### GLMERP01_customers
```sql
CREATE TABLE GLMERP01_customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_number TEXT UNIQUE,
  first_name TEXT,
  last_name TEXT,
  company TEXT,
  email TEXT,
  phone TEXT,
  date_of_birth DATE,
  notes TEXT,
  loyalty_points INTEGER DEFAULT 0,
  store_credit DECIMAL(12,2) DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### GLMERP01_customer_addresses
```sql
CREATE TABLE GLMERP01_customer_addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES GLMERP01_customers(id) ON DELETE CASCADE,
  address_type TEXT NOT NULL CHECK (address_type IN ('billing', 'shipping')),
  address_line1 TEXT NOT NULL,
  address_line2 TEXT,
  city TEXT NOT NULL,
  state TEXT,
  postal_code TEXT,
  country TEXT,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 6. Discounts & Promotions

#### GLMERP01_discounts
```sql
CREATE TABLE GLMERP01_discounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed_amount')),
  discount_value DECIMAL(10,2) NOT NULL,
  minimum_purchase DECIMAL(12,2),
  maximum_discount DECIMAL(12,2),
  applicable_products UUID[],
  applicable_categories UUID[],
  usage_limit INTEGER,
  usage_count INTEGER DEFAULT 0,
  starts_at TIMESTAMP WITH TIME ZONE,
  ends_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 7. Shift Management

#### GLMERP01_shifts
```sql
CREATE TABLE GLMERP01_shifts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID REFERENCES GLMERP01_stores(id),
  cashier_id UUID REFERENCES GLMERP01_profiles(id),
  shift_number TEXT NOT NULL,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE,
  opening_cash DECIMAL(12,2) DEFAULT 0,
  closing_cash DECIMAL(12,2),
  expected_cash DECIMAL(12,2),
  variance DECIMAL(12,2),
  notes TEXT,
  status TEXT NOT NULL CHECK (status IN ('open', 'closed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### GLMERP01_shift_payments
```sql
CREATE TABLE GLMERP01_shift_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shift_id UUID REFERENCES GLMERP01_shifts(id) ON DELETE CASCADE,
  payment_method TEXT NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 8. Reporting & Analytics

#### GLMERP01_daily_reports
```sql
CREATE TABLE GLMERP01_daily_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID REFERENCES GLMERP01_stores(id),
  report_date DATE NOT NULL,
  total_sales DECIMAL(12,2) NOT NULL,
  total_tax DECIMAL(12,2) NOT NULL,
  total_discounts DECIMAL(12,2) NOT NULL,
  number_of_transactions INTEGER NOT NULL,
  average_transaction DECIMAL(12,2),
  payment_breakdown JSONB,
  top_selling_products JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### GLMERP01_audit_logs
```sql
CREATE TABLE GLMERP01_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES GLMERP01_profiles(id),
  action TEXT NOT NULL,
  table_name TEXT,
  record_id UUID,
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Indexes

```sql
-- Performance indexes with GLMERP01 prefix
CREATE INDEX idx_GLMERP01_products_sku ON GLMERP01_products(sku);
CREATE INDEX idx_GLMERP01_products_barcode ON GLMERP01_products(barcode);
CREATE INDEX idx_GLMERP01_products_category ON GLMERP01_products(category_id);
CREATE INDEX idx_GLMERP01_inventory_store_product ON GLMERP01_inventory(store_id, product_id);
CREATE INDEX idx_GLMERP01_sales_store_date ON GLMERP01_sales(store_id, sale_date);
CREATE INDEX idx_GLMERP01_sale_items_sale ON GLMERP01_sale_items(sale_id);
CREATE INDEX idx_GLMERP01_customers_email ON GLMERP01_customers(email);
CREATE INDEX idx_GLMERP01_customers_phone ON GLMERP01_customers(phone);
CREATE INDEX idx_GLMERP01_gift_cards_number ON GLMERP01_gift_cards(card_number);
CREATE INDEX idx_GLMERP01_shifts_store_cashier ON GLMERP01_shifts(store_id, cashier_id);
```

## Row Level Security (RLS) Policies

```sql
-- Enable RLS on all GLMERP01 tables
ALTER TABLE GLMERP01_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE GLMERP01_sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE GLMERP01_inventory ENABLE ROW LEVEL SECURITY;
-- ... enable on all tables

-- Example RLS policies with GLMERP01 prefix
CREATE POLICY "Users can view own profile" ON GLMERP01_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Store users can view store sales" ON GLMERP01_sales
  FOR SELECT USING (store_id IN (SELECT store_id FROM GLMERP01_profiles WHERE id = auth.uid()));

CREATE POLICY "Store users can manage store inventory" ON GLMERP01_inventory
  FOR ALL USING (store_id IN (SELECT store_id FROM GLMERP01_profiles WHERE id = auth.uid()));
```

## Triggers & Functions

```sql
-- Update updated_at timestamp for GLMERP01 tables
CREATE OR REPLACE FUNCTION update_GLMERP01_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply to tables with updated_at
CREATE TRIGGER update_GLMERP01_profiles_updated_at BEFORE UPDATE ON GLMERP01_profiles
  FOR EACH ROW EXECUTE FUNCTION update_GLMERP01_updated_at_column();

-- Auto-generate customer numbers for GLMERP01
CREATE OR REPLACE FUNCTION generate_GLMERP01_customer_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.customer_number IS NULL THEN
    NEW.customer_number := 'GLM' || LPAD(EXTRACT(EPOCH FROM NOW())::TEXT, 10, '0');
  END IF;
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER generate_GLMERP01_customer_number_trigger BEFORE INSERT ON GLMERP01_customers
  FOR EACH ROW EXECUTE FUNCTION generate_GLMERP01_customer_number();
```

## TypeScript Types with GLMERP01 Prefix

```typescript
// src/types/database.ts
export type Database = {
  public: {
    Tables: {
      GLMERP01_profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          phone: string | null;
          role: 'admin' | 'manager' | 'cashier' | 'inventory_clerk';
          avatar_url: string | null;
          is_active: boolean;
          store_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['GLMERP01_profiles']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Database['public']['Tables']['GLMERP01_profiles']['Row'], 'id' | 'created_at'>>;
      };
      // ... similar definitions for all GLMERP01 tables
    };
  };
};
```

This updated schema ensures all tables are properly prefixed with "GLMERP01_" for consistent naming and easy identification within the database.