# Enhanced POS Database Schema with Multi-Company, Multi-Branch, Multi-Location Support

## Overview
This document outlines the complete database schema for Retail POS system with multi-company, multi-branch, and multi-location support using Supabase (PostgreSQL) with all tables prefixed with "GLMERP01_".

## Core Tables

### 1. Multi-Company Structure

#### GLMERP01_companies
```sql
CREATE TABLE GLMERP01_companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name TEXT NOT NULL,
  legal_name TEXT NOT NULL,
  tax_id TEXT,
  registration_number TEXT,
  logo_url TEXT,
  address TEXT,
  phone TEXT,
  email TEXT,
  website TEXT,
  default_currency TEXT DEFAULT 'USD',
  tax_settings JSONB,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### GLMERP01_branches
```sql
CREATE TABLE GLMERP01_branches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES GLMERP01_companies(id) ON DELETE CASCADE,
  branch_name TEXT NOT NULL,
  branch_code TEXT UNIQUE NOT NULL,
  address TEXT,
  phone TEXT,
  email TEXT,
  manager_id UUID REFERENCES GLMERP01_profiles(id),
  business_hours JSONB,
  tax_rate DECIMAL(5,4) DEFAULT 0.0000,
  currency TEXT DEFAULT 'USD',
  timezone TEXT DEFAULT 'UTC',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### GLMERP01_locations
```sql
CREATE TABLE GLMERP01_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id UUID REFERENCES GLMERP01_branches(id) ON DELETE CASCADE,
  location_name TEXT NOT NULL,
  location_code TEXT NOT NULL,
  location_type TEXT NOT NULL CHECK (location_type IN ('warehouse', 'store', 'kiosk', 'office')),
  address TEXT,
  phone TEXT,
  email TEXT,
  manager_id UUID REFERENCES GLMERP01_profiles(id),
  business_hours JSONB,
  tax_rate DECIMAL(5,4) DEFAULT 0.0000,
  currency TEXT DEFAULT 'USD',
  timezone TEXT DEFAULT 'UTC',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(branch_id, location_code)
);
```

### 2. Users & Authentication

#### GLMERP01_profiles
```sql
CREATE TABLE GLMERP01_profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  phone TEXT,
  role TEXT NOT NULL CHECK (role IN ('super_admin', 'company_admin', 'branch_manager', 'location_manager', 'manager', 'cashier', 'inventory_clerk')),
  avatar_url TEXT,
  is_active BOOLEAN DEFAULT true,
  company_id UUID REFERENCES GLMERP01_companies(id),
  branch_id UUID REFERENCES GLMERP01_branches(id),
  location_id UUID REFERENCES GLMERP01_locations(id),
  assigned_locations UUID[],
  permissions JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### GLMERP01_user_sessions
```sql
CREATE TABLE GLMERP01_user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES GLMERP01_profiles(id) ON DELETE CASCADE,
  company_id UUID REFERENCES GLMERP01_companies(id),
  branch_id UUID REFERENCES GLMERP01_branches(id),
  location_id UUID REFERENCES GLMERP01_locations(id),
  session_token TEXT UNIQUE NOT NULL,
  device_info JSONB,
  ip_address INET,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 3. Product Catalog

#### GLMERP01_categories
```sql
CREATE TABLE GLMERP01_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES GLMERP01_companies(id) ON DELETE CASCADE,
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
  company_id UUID REFERENCES GLMERP01_companies(id) ON DELETE CASCADE,
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
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(company_id, sku)
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

#### GLMERP01_product_pricing
```sql
CREATE TABLE GLMERP01_product_pricing (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES GLMERP01_products(id) ON DELETE CASCADE,
  variant_id UUID REFERENCES GLMERP01_product_variants(id) ON DELETE CASCADE,
  branch_id UUID REFERENCES GLMERP01_branches(id),
  location_id UUID REFERENCES GLMERP01_locations(id),
  cost_price DECIMAL(10,2),
  selling_price DECIMAL(10,2) NOT NULL,
  tax_rate DECIMAL(5,4) DEFAULT 0.0000,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(product_id, variant_id, branch_id, location_id)
);
```

### 4. Inventory Management

#### GLMERP01_inventory
```sql
CREATE TABLE GLMERP01_inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES GLMERP01_companies(id) ON DELETE CASCADE,
  branch_id UUID REFERENCES GLMERP01_branches(id) ON DELETE CASCADE,
  location_id UUID REFERENCES GLMERP01_locations(id) ON DELETE CASCADE,
  product_id UUID REFERENCES GLMERP01_products(id),
  variant_id UUID REFERENCES GLMERP01_product_variants(id),
  quantity_on_hand INTEGER NOT NULL DEFAULT 0,
  quantity_committed INTEGER NOT NULL DEFAULT 0,
  quantity_on_order INTEGER NOT NULL DEFAULT 0,
  quantity_available INTEGER GENERATED ALWAYS AS (quantity_on_hand - quantity_committed) STORED,
  reorder_level INTEGER DEFAULT 0,
  reorder_quantity INTEGER DEFAULT 0,
  last_counted_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(company_id, branch_id, location_id, product_id, variant_id)
);
```

#### GLMERP01_inventory_transfers
```sql
CREATE TABLE GLMERP01_inventory_transfers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES GLMERP01_companies(id) ON DELETE CASCADE,
  transfer_number TEXT UNIQUE NOT NULL,
  from_location_id UUID REFERENCES GLMERP01_locations(id),
  to_location_id UUID REFERENCES GLMERP01_locations(id),
  status TEXT NOT NULL CHECK (status IN ('pending', 'in_transit', 'completed', 'cancelled')),
  transfer_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expected_date TIMESTAMP WITH TIME ZONE,
  completed_date TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_by UUID REFERENCES GLMERP01_profiles(id),
  received_by UUID REFERENCES GLMERP01_profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### GLMERP01_inventory_transfer_items
```sql
CREATE TABLE GLMERP01_inventory_transfer_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transfer_id UUID REFERENCES GLMERP01_inventory_transfers(id) ON DELETE CASCADE,
  product_id UUID REFERENCES GLMERP01_products(id),
  variant_id UUID REFERENCES GLMERP01_product_variants(id),
  quantity_requested INTEGER NOT NULL,
  quantity_shipped INTEGER DEFAULT 0,
  quantity_received INTEGER DEFAULT 0,
  unit_cost DECIMAL(10,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### GLMERP01_inventory_transactions
```sql
CREATE TABLE GLMERP01_inventory_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES GLMERP01_companies(id) ON DELETE CASCADE,
  branch_id UUID REFERENCES GLMERP01_branches(id) ON DELETE CASCADE,
  location_id UUID REFERENCES GLMERP01_locations(id) ON DELETE CASCADE,
  product_id UUID REFERENCES GLMERP01_products(id),
  variant_id UUID REFERENCES GLMERP01_product_variants(id),
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('sale', 'return', 'adjustment', 'purchase', 'transfer_in', 'transfer_out')),
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
  company_id UUID REFERENCES GLMERP01_companies(id) ON DELETE CASCADE,
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
  company_id UUID REFERENCES GLMERP01_companies(id) ON DELETE CASCADE,
  branch_id UUID REFERENCES GLMERP01_branches(id) ON DELETE CASCADE,
  location_id UUID REFERENCES GLMERP01_locations(id) ON DELETE CASCADE,
  order_number TEXT UNIQUE NOT NULL,
  supplier_id UUID REFERENCES GLMERP01_suppliers(id),
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

### 5. Sales & Transactions

#### GLMERP01_sales
```sql
CREATE TABLE GLMERP01_sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES GLMERP01_companies(id) ON DELETE CASCADE,
  branch_id UUID REFERENCES GLMERP01_branches(id) ON DELETE CASCADE,
  location_id UUID REFERENCES GLMERP01_locations(id) ON DELETE CASCADE,
  sale_number TEXT UNIQUE NOT NULL,
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
  payment_method TEXT NOT NULL CHECK (payment_method IN ('cash', 'card', 'digital_wallet', 'gift_card', 'store_credit', 'check')),
  amount DECIMAL(12,2) NOT NULL,
  reference TEXT,
  card_type TEXT,
  card_last_four TEXT,
  transaction_id TEXT,
  check_number TEXT,
  status TEXT NOT NULL CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  processed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### GLMERP01_gift_cards
```sql
CREATE TABLE GLMERP01_gift_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES GLMERP01_companies(id) ON DELETE CASCADE,
  branch_id UUID REFERENCES GLMERP01_branches(id) ON DELETE CASCADE,
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

### 6. Customer Management

#### GLMERP01_customers
```sql
CREATE TABLE GLMERP01_customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES GLMERP01_companies(id) ON DELETE CASCADE,
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
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(company_id, customer_number)
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

### 7. Discounts & Promotions

#### GLMERP01_discounts
```sql
CREATE TABLE GLMERP01_discounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES GLMERP01_companies(id) ON DELETE CASCADE,
  branch_id UUID REFERENCES GLMERP01_branches(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed_amount')),
  discount_value DECIMAL(10,2) NOT NULL,
  minimum_purchase DECIMAL(12,2),
  maximum_discount DECIMAL(12,2),
  applicable_products UUID[],
  applicable_categories UUID[],
  applicable_branches UUID[],
  usage_limit INTEGER,
  usage_count INTEGER DEFAULT 0,
  starts_at TIMESTAMP WITH TIME ZONE,
  ends_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 8. Shift Management

#### GLMERP01_shifts
```sql
CREATE TABLE GLMERP01_shifts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES GLMERP01_companies(id) ON DELETE CASCADE,
  branch_id UUID REFERENCES GLMERP01_branches(id) ON DELETE CASCADE,
  location_id UUID REFERENCES GLMERP01_locations(id) ON DELETE CASCADE,
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
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(company_id, branch_id, location_id, shift_number)
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

### 9. Reporting & Analytics

#### GLMERP01_daily_reports
```sql
CREATE TABLE GLMERP01_daily_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES GLMERP01_companies(id) ON DELETE CASCADE,
  branch_id UUID REFERENCES GLMERP01_branches(id) ON DELETE CASCADE,
  location_id UUID REFERENCES GLMERP01_locations(id) ON DELETE CASCADE,
  report_date DATE NOT NULL,
  total_sales DECIMAL(12,2) NOT NULL,
  total_tax DECIMAL(12,2) NOT NULL,
  total_discounts DECIMAL(12,2) NOT NULL,
  number_of_transactions INTEGER NOT NULL,
  average_transaction DECIMAL(12,2),
  payment_breakdown JSONB,
  top_selling_products JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(company_id, branch_id, location_id, report_date)
);
```

#### GLMERP01_audit_logs
```sql
CREATE TABLE GLMERP01_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES GLMERP01_companies(id) ON DELETE CASCADE,
  branch_id UUID REFERENCES GLMERP01_branches(id) ON DELETE CASCADE,
  location_id UUID REFERENCES GLMERP01_locations(id) ON DELETE CASCADE,
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
CREATE INDEX idx_GLMERP01_companies_active ON GLMERP01_companies(is_active);
CREATE INDEX idx_GLMERP01_branches_company ON GLMERP01_branches(company_id);
CREATE INDEX idx_GLMERP01_branches_active ON GLMERP01_branches(is_active);
CREATE INDEX idx_GLMERP01_locations_branch ON GLMERP01_locations(branch_id);
CREATE INDEX idx_GLMERP01_locations_active ON GLMERP01_locations(is_active);
CREATE INDEX idx_GLMERP01_profiles_company ON GLMERP01_profiles(company_id);
CREATE INDEX idx_GLMERP01_profiles_branch ON GLMERP01_profiles(branch_id);
CREATE INDEX idx_GLMERP01_profiles_location ON GLMERP01_profiles(location_id);
CREATE INDEX idx_GLMERP01_profiles_email ON GLMERP01_profiles(email);
CREATE INDEX idx_GLMERP01_products_company ON GLMERP01_products(company_id);
CREATE INDEX idx_GLMERP01_products_sku ON GLMERP01_products(sku);
CREATE INDEX idx_GLMERP01_products_barcode ON GLMERP01_products(barcode);
CREATE INDEX idx_GLMERP01_products_category ON GLMERP01_products(category_id);
CREATE INDEX idx_GLMERP01_inventory_company ON GLMERP01_inventory(company_id);
CREATE INDEX idx_GLMERP01_inventory_branch ON GLMERP01_inventory(branch_id);
CREATE INDEX idx_GLMERP01_inventory_location ON GLMERP01_inventory(location_id);
CREATE INDEX idx_GLMERP01_inventory_product ON GLMERP01_inventory(product_id);
CREATE INDEX idx_GLMERP01_sales_company ON GLMERP01_sales(company_id);
CREATE INDEX idx_GLMERP01_sales_branch ON GLMERP01_sales(branch_id);
CREATE INDEX idx_GLMERP01_sales_location ON GLMERP01_sales(location_id);
CREATE INDEX idx_GLMERP01_sales_date ON GLMERP01_sales(sale_date);
CREATE INDEX idx_GLMERP01_sale_items_sale ON GLMERP01_sale_items(sale_id);
CREATE INDEX idx_GLMERP01_customers_company ON GLMERP01_customers(company_id);
CREATE INDEX idx_GLMERP01_customers_email ON GLMERP01_customers(email);
CREATE INDEX idx_GLMERP01_customers_phone ON GLMERP01_customers(phone);
CREATE INDEX idx_GLMERP01_gift_cards_number ON GLMERP01_gift_cards(card_number);
CREATE INDEX idx_GLMERP01_shifts_company ON GLMERP01_shifts(company_id);
CREATE INDEX idx_GLMERP01_shifts_branch ON GLMERP01_shifts(branch_id);
CREATE INDEX idx_GLMERP01_shifts_location ON GLMERP01_shifts(location_id);
CREATE INDEX idx_GLMERP01_shifts_cashier ON GLMERP01_shifts(cashier_id);
```

## Row Level Security (RLS) Policies

```sql
-- Enable RLS on all GLMERP01 tables
ALTER TABLE GLMERP01_companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE GLMERP01_branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE GLMERP01_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE GLMERP01_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE GLMERP01_sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE GLMERP01_inventory ENABLE ROW LEVEL SECURITY;
-- ... enable on all tables

-- Example RLS policies with multi-company support
CREATE POLICY "Super admins can access all company data" ON GLMERP01_companies
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM GLMERP01_profiles 
      WHERE id = auth.uid() AND role = 'super_admin'
    )
  );

CREATE POLICY "Company admins can access their company data" ON GLMERP01_companies
  FOR ALL USING (
    company_id IN (
      SELECT company_id FROM GLMERP01_profiles 
      WHERE id = auth.uid() AND role IN ('company_admin', 'branch_manager', 'location_manager')
    )
  );

CREATE POLICY "Branch managers can access their branch data" ON GLMERP01_branches
  FOR ALL USING (
    branch_id IN (
      SELECT branch_id FROM GLMERP01_profiles 
      WHERE id = auth.uid() AND role IN ('branch_manager', 'location_manager')
    )
  );

CREATE POLICY "Location managers can access their location data" ON GLMERP01_locations
  FOR ALL USING (
    location_id IN (
      SELECT location_id FROM GLMERP01_profiles 
      WHERE id = auth.uid() AND role = 'location_manager'
    )
  );

CREATE POLICY "Users can access their assigned locations" ON GLMERP01_sales
  FOR ALL USING (
    location_id IN (
      SELECT unnest(assigned_locations) FROM GLMERP01_profiles 
      WHERE id = auth.uid()
    )
  );
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
CREATE TRIGGER update_GLMERP01_companies_updated_at BEFORE UPDATE ON GLMERP01_companies
  FOR EACH ROW EXECUTE FUNCTION update_GLMERP01_updated_at_column();

CREATE TRIGGER update_GLMERP01_branches_updated_at BEFORE UPDATE ON GLMERP01_branches
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

-- Auto-generate transfer numbers
CREATE OR REPLACE FUNCTION generate_GLMERP01_transfer_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.transfer_number IS NULL THEN
    NEW.transfer_number := 'TRF' || LPAD(EXTRACT(EPOCH FROM NOW())::TEXT, 10, '0');
  END IF;
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER generate_GLMERP01_transfer_number_trigger BEFORE INSERT ON GLMERP01_inventory_transfers
  FOR EACH ROW EXECUTE FUNCTION generate_GLMERP01_transfer_number();
```

## TypeScript Types with Multi-Company Support

```typescript
// src/types/database.ts
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
          tax_settings: any | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['GLMERP01_companies']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Database['public']['Tables']['GLMERP01_companies']['Row'], 'id' | 'created_at'>>;
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
          business_hours: any | null;
          tax_rate: number;
          currency: string;
          timezone: string;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['GLMERP01_branches']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Database['public']['Tables']['GLMERP01_branches']['Row'], 'id' | 'created_at'>>;
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
          business_hours: any | null;
          tax_rate: number;
          currency: string;
          timezone: string;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['GLMERP01_locations']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Database['public']['Tables']['GLMERP01_locations']['Row'], 'id' | 'created_at'>>;
      };
      // ... similar definitions for all GLMERP01 tables
    };
  };
};
```

This enhanced schema provides comprehensive multi-company, multi-branch, and multi-location support while maintaining data isolation and security across different organizational levels.