# GLM ERP POS System - Database Schema

This document outlines the complete database schema for the GLM ERP POS system, including all tables with proper relationships and constraints.

## Table Naming Convention

All tables use the `GLMERP01_` prefix to ensure proper organization and avoid naming conflicts.

## Core Tables

### 1. Companies (GLMERP01_companies)

Stores information about different companies in the system.

```sql
CREATE TABLE GLMERP01_companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name VARCHAR(255) NOT NULL,
  legal_name VARCHAR(255) NOT NULL,
  tax_id VARCHAR(50),
  registration_number VARCHAR(50),
  logo_url TEXT,
  address TEXT,
  phone VARCHAR(50),
  email VARCHAR(255),
  website VARCHAR(255),
  default_currency VARCHAR(3) DEFAULT 'USD',
  tax_settings JSONB,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 2. Branches (GLMERP01_branches)

Stores information about different branches within each company.

```sql
CREATE TABLE GLMERP01_branches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES GLMERP01_companies(id) ON DELETE CASCADE,
  branch_name VARCHAR(255) NOT NULL,
  branch_code VARCHAR(50) NOT NULL,
  address TEXT,
  phone VARCHAR(50),
  email VARCHAR(255),
  manager_id UUID REFERENCES GLMERP01_profiles(id),
  business_hours JSONB,
  tax_rate DECIMAL(5,2) DEFAULT 0.08,
  currency VARCHAR(3) DEFAULT 'USD',
  timezone VARCHAR(50) DEFAULT 'UTC',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 3. Locations (GLMERP01_locations)

Stores information about different locations within each branch.

```sql
CREATE TABLE GLMERP01_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id UUID NOT NULL REFERENCES GLMERP01_branches(id) ON DELETE CASCADE,
  location_name VARCHAR(255) NOT NULL,
  location_code VARCHAR(50) NOT NULL,
  location_type VARCHAR(50) DEFAULT 'store',
  address TEXT,
  phone VARCHAR(50),
  email VARCHAR(255),
  manager_id UUID REFERENCES GLMERP01_profiles(id),
  business_hours JSONB,
  tax_rate DECIMAL(5,2) DEFAULT 0.08,
  currency VARCHAR(3) DEFAULT 'USD',
  timezone VARCHAR(50) DEFAULT 'UTC',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 4. User Profiles (GLMERP01_profiles)

Stores user information and role assignments.

```sql
CREATE TABLE GLMERP01_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES GLMERP01_companies(id) ON DELETE CASCADE,
  branch_id UUID REFERENCES GLMERP01_branches(id) ON DELETE CASCADE,
  location_id UUID REFERENCES GLMERP01_locations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  role VARCHAR(50) DEFAULT 'cashier',
  avatar_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 5. Categories (GLMERP01_categories)

Stores product categories for organization.

```sql
CREATE TABLE GLMERP01_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES GLMERP01_companies(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES GLMERP01_categories(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  image_url TEXT,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 6. Products (GLMERP01_products)

Stores product information including pricing and inventory settings.

```sql
CREATE TABLE GLMERP01_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES GLMERP01_companies(id) ON DELETE CASCADE,
  sku VARCHAR(100) NOT NULL,
  barcode VARCHAR(50),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category_id UUID REFERENCES GLMERP01_categories(id) ON DELETE CASCADE,
  cost_price DECIMAL(10,2) NOT NULL,
  selling_price DECIMAL(10,2) NOT NULL,
  tax_rate DECIMAL(5,2) DEFAULT 0.08,
  track_inventory BOOLEAN DEFAULT true,
  allow_decimal_quantity BOOLEAN DEFAULT false,
  image_urls TEXT[],
  attributes JSONB,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 7. Product Variants (GLMERP01_product_variants)

Stores different variants of the same product (e.g., different sizes, colors).

```sql
CREATE TABLE GLMERP01_product_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES GLMERP01_products(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  sku VARCHAR(100),
  barcode VARCHAR(50),
  selling_price DECIMAL(10,2) NOT NULL,
  cost_price DECIMAL(10,2) NOT NULL,
  image_url TEXT,
  attributes JSONB,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 8. Inventory (GLMERP01_inventory)

Tracks inventory levels for products and variants at different locations.

```sql
CREATE TABLE GLMERP01_inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES GLMERP01_companies(id) ON DELETE CASCADE,
  branch_id UUID NOT NULL REFERENCES GLMERP01_branches(id) ON DELETE CASCADE,
  location_id UUID NOT NULL REFERENCES GLMERP01_locations(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES GLMERP01_products(id) ON DELETE CASCADE,
  variant_id UUID REFERENCES GLMERP01_product_variants(id) ON DELETE CASCADE,
  quantity_on_hand INTEGER NOT NULL DEFAULT 0,
  quantity_committed INTEGER NOT NULL DEFAULT 0,
  quantity_on_order INTEGER NOT NULL DEFAULT 0,
  quantity_available INTEGER GENERATED ALWAYS AS (quantity_on_hand - quantity_committed),
  reorder_level INTEGER NOT NULL DEFAULT 0,
  reorder_quantity INTEGER NOT NULL DEFAULT 0,
  last_counted_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 9. Inventory Transactions (GLMERP01_inventory_transactions)

Tracks all inventory movements for audit purposes.

```sql
CREATE TABLE GLMERP01_inventory_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES GLMERP01_companies(id) ON DELETE CASCADE,
  branch_id UUID NOT NULL REFERENCES GLMERP01_branches(id) ON DELETE CASCADE,
  location_id UUID NOT NULL REFERENCES GLMERP01_locations(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES GLMERP01_products(id) ON DELETE CASCADE,
  variant_id UUID REFERENCES GLMERP01_product_variants(id) ON DELETE CASCADE,
  transaction_type VARCHAR(50) NOT NULL,
  quantity_change INTEGER NOT NULL,
  quantity_before INTEGER NOT NULL,
  quantity_after INTEGER NOT NULL,
  reference_id UUID,
  reference_type VARCHAR(50),
  reason TEXT,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 10. Customers (GLMERP01_customers)

Stores customer information and purchase history.

```sql
CREATE TABLE GLMERP01_customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES GLMERP01_companies(id) ON DELETE CASCADE,
  customer_number VARCHAR(50) NOT NULL,
  first_name VARCHAR(255) NOT NULL,
  last_name VARCHAR(255) NOT NULL,
  company VARCHAR(255),
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  date_of_birth DATE,
  notes TEXT,
  loyalty_points INTEGER DEFAULT 0,
  store_credit DECIMAL(10,2) DEFAULT 0.00,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 11. Customer Addresses (GLMERP01_customer_addresses)

Stores multiple shipping and billing addresses for each customer.

```sql
CREATE TABLE GLMERP01_customer_addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES GLMERP01_customers(id) ON DELETE CASCADE,
  address_type VARCHAR(50) NOT NULL,
  address_line_1 VARCHAR(255) NOT NULL,
  address_line_2 VARCHAR(255),
  city VARCHAR(100) NOT NULL,
  state VARCHAR(100),
  postal_code VARCHAR(20),
  country VARCHAR(100),
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 12. Sales (GLMERP01_sales)

Stores sales transaction information.

```sql
CREATE TABLE GLMERP01_sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES GLMERP01_companies(id) ON DELETE CASCADE,
  branch_id UUID NOT NULL REFERENCES GLMERP01_branches(id) ON DELETE CASCADE,
  location_id UUID NOT NULL REFERENCES GLMERP01_locations(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES GLMERP01_customers(id) ON DELETE CASCADE,
  sale_number VARCHAR(50) NOT NULL,
  sale_date DATE NOT NULL,
  subtotal DECIMAL(10,2) NOT NULL,
  tax_amount DECIMAL(10,2) NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  status VARCHAR(50) DEFAULT 'completed',
  notes TEXT,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 13. Sale Items (GLMERP01_sale_items)

Stores individual items included in each sale.

```sql
CREATE TABLE GLMERP01_sale_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id UUID NOT NULL REFERENCES GLMERP01_sales(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES GLMERP01_products(id) ON DELETE CASCADE,
  variant_id UUID REFERENCES GLMERP01_product_variants(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  total_price DECIMAL(10,2) NOT NULL,
  discount_amount DECIMAL(10,2) DEFAULT 0.00,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 14. Payments (GLMERP01_payments)

Stores payment information for each sale.

```sql
CREATE TABLE GLMERP01_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id UUID NOT NULL REFERENCES GLMERP01_sales(id) ON DELETE CASCADE,
  payment_method VARCHAR(50) NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  reference_number VARCHAR(100),
  status VARCHAR(50) DEFAULT 'completed',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 15. Discounts (GLMERP01_discounts)

Stores discount and promotion information.

```sql
CREATE TABLE GLMERP01_discounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES GLMERP01_companies(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  discount_type VARCHAR(50) NOT NULL,
  discount_value DECIMAL(5,2) NOT NULL,
  minimum_purchase DECIMAL(10,2) DEFAULT 0.00,
  maximum_discount DECIMAL(10,2) DEFAULT 0.00,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 16. Shifts (GLMERP01_shifts)

Stores shift information for cash tracking.

```sql
CREATE TABLE GLMERP01_shifts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES GLMERP01_companies(id) ON DELETE CASCADE,
  branch_id UUID NOT NULL REFERENCES GLMERP01_branches(id) ON DELETE CASCADE,
  location_id UUID NOT NULL REFERENCES GLMERP01_locations(id) ON DELETE CASCADE,
  shift_name VARCHAR(255) NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  manager_id UUID NOT NULL REFERENCES GLMERP01_profiles(id),
  opening_cash DECIMAL(10,2) DEFAULT 0.00,
  closing_cash DECIMAL(10,2) DEFAULT 0.00,
  cash_sales DECIMAL(10,2) DEFAULT 0.00,
  card_sales DECIMAL(10,2) DEFAULT 0.00,
  other_sales DECIMAL(10,2) DEFAULT 0.00,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 17. Shift Payments (GLMERP01_shift_payments)

Tracks payments made during shifts.

```sql
CREATE TABLE GLMERP01_shift_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shift_id UUID NOT NULL REFERENCES GLMERP01_shifts(id) ON DELETE CASCADE,
  payment_method VARCHAR(50) NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  reference_number VARCHAR(100),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 18. Daily Reports (GLMERP01_daily_reports)

Stores daily summary reports for analytics.

```sql
CREATE TABLE GLMERP01_daily_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES GLMERP01_companies(id) ON DELETE CASCADE,
  branch_id UUID NOT NULL REFERENCES GLMERP01_branches(id) ON DELETE CASCADE,
  location_id UUID NOT NULL REFERENCES GLMERP01_locations(id) ON DELETE CASCADE,
  report_date DATE NOT NULL,
  total_sales DECIMAL(10,2) NOT NULL,
  total_orders INTEGER NOT NULL,
  total_customers INTEGER NOT NULL,
  total_products INTEGER NOT NULL,
  report_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 19. Audit Logs (GLMERP01_audit_logs)

Tracks all system activities for security and compliance.

```sql
CREATE TABLE GLMERP01_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES GLMERP01_companies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action VARCHAR(255) NOT NULL,
  table_name VARCHAR(255) NOT NULL,
  record_id UUID,
  old_values JSONB,
  new_values JSONB,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Indexes

Create appropriate indexes for performance optimization:

```sql
-- Product indexes
CREATE INDEX idx_products_company ON GLMERP01_products(company_id);
CREATE INDEX idx_products_category ON GLMERP01_products(category_id);
CREATE INDEX idx_products_sku ON GLMERP01_products(sku);
CREATE INDEX idx_products_barcode ON GLMERP01_products(barcode);

-- Inventory indexes
CREATE INDEX idx_inventory_product ON GLMERP01_inventory(product_id);
CREATE INDEX idx_inventory_location ON GLMERP01_inventory(location_id);

-- Sales indexes
CREATE INDEX idx_sales_customer ON GLMERP01_sales(customer_id);
CREATE INDEX idx_sales_date ON GLMERP01_sales(sale_date);
CREATE INDEX idx_sales_company ON GLMERP01_sales(company_id);

-- Customer indexes
CREATE INDEX idx_customers_company ON GLMERP01_customers(company_id);
CREATE INDEX idx_customers_email ON GLMERP01_customers(email);
CREATE INDEX idx_customers_number ON GLMERP01_customers(customer_number);
```

## Row Level Security (RLS)

Implement Row Level Security policies to ensure data isolation between companies:

```sql
-- Enable RLS on all tables
ALTER TABLE GLMERP01_companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE GLMERP01_branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE GLMERP01_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE GLMERP01_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE GLMERP01_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE GLMERP01_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE GLMERP01_product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE GLMERP01_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE GLMERP01_inventory_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE GLMERP01_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE GLMERP01_customer_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE GLMERP01_sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE GLMERP01_sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE GLMERP01_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE GLMERP01_discounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE GLMERP01_shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE GLMERP01_shift_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE GLMERP01_daily_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE GLMERP01_audit_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY company_isolation ON GLMERP01_companies FOR ALL USING (company_id = current_setting('app.company_id'));
CREATE POLICY branch_isolation ON GLMERP01_branches FOR ALL USING (company_id = current_setting('app.company_id'));
CREATE POLICY location_isolation ON GLMERP01_locations FOR ALL USING (company_id = current_setting('app.company_id'));
CREATE POLICY profile_isolation ON GLMERP01_profiles FOR ALL USING (company_id = current_setting('app.company_id'));
CREATE POLICY category_isolation ON GLMERP01_categories FOR ALL USING (company_id = current_setting('app.company_id'));
CREATE POLICY product_isolation ON GLMERP01_products FOR ALL USING (company_id = current_setting('app.company_id'));
CREATE POLICY product_variant_isolation ON GLMERP01_product_variants FOR ALL USING (company_id = current_setting('app.company_id'));
CREATE POLICY inventory_isolation ON GLMERP01_inventory FOR ALL USING (company_id = current_setting('app.company_id'));
CREATE POLICY inventory_transaction_isolation ON GLMERP01_inventory_transactions FOR ALL USING (company_id = current_setting('app.company_id'));
CREATE POLICY customer_isolation ON GLMERP01_customers FOR ALL USING (company_id = current_setting('app.company_id'));
CREATE POLICY customer_address_isolation ON GLMERP01_customer_addresses FOR ALL USING (company_id = current_setting('app.company_id'));
CREATE POLICY sale_isolation ON GLMERP01_sales FOR ALL USING (company_id = current_setting('app.company_id'));
CREATE POLICY sale_item_isolation ON GLMERP01_sale_items FOR ALL USING (company_id = current_setting('app.company_id'));
CREATE POLICY payment_isolation ON GLMERP01_payments FOR ALL USING (company_id = current_setting('app.company_id'));
CREATE POLICY discount_isolation ON GLMERP01_discounts FOR ALL USING (company_id = current_setting('app.company_id'));
CREATE POLICY shift_isolation ON GLMERP01_shifts FOR ALL USING (company_id = current_setting('app.company_id'));
CREATE POLICY shift_payment_isolation ON GLMERP01_shift_payments FOR ALL USING (company_id = current_setting('app.company_id'));
CREATE POLICY daily_report_isolation ON GLMERP01_daily_reports FOR ALL USING (company_id = current_setting('app.company_id'));
CREATE POLICY audit_log_isolation ON GLMERP01_audit_logs FOR ALL USING (company_id = current_setting('app.company_id'));
```

## Database Functions

Create useful functions for common operations:

```sql
-- Function to get current company ID from session
CREATE OR REPLACE FUNCTION current_setting(setting_name TEXT)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN current_setting(setting_name);
END;
$$;

-- Function to generate unique SKU
CREATE OR REPLACE FUNCTION generate_sku(prefix TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN prefix || LPAD(EXTRACT(YEAR FROM NOW())::TEXT, 4, '0') || '-' || LPAD(EXTRACT(MONTH FROM NOW())::TEXT, 2, '0') || '-' || LPAD(EXTRACT(DAY FROM NOW())::TEXT, 2, '0') || '-' || LPAD(floor(random() * 10000)::TEXT, 4, '0');
END;
$$;
```

## Triggers

Create triggers for automated data maintenance:

```sql
-- Trigger to update inventory when sale is completed
CREATE OR REPLACE FUNCTION update_inventory_on_sale()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN TGOP('UPDATE GLMERP01_inventory SET quantity_on_hand = quantity_on_hand - NEW.quantity, updated_at = NOW() WHERE product_id = NEW.product_id AND variant_id = NEW.variant_id AND location_id = NEW.location_id');
END;
$$;

CREATE TRIGGER trigger_update_inventory_on_sale
AFTER INSERT ON GLMERP01_sale_items
FOR EACH ROW
EXECUTE FUNCTION update_inventory_on_sale();

-- Trigger to log inventory changes
CREATE OR REPLACE FUNCTION log_inventory_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO GLMERP01_audit_logs (company_id, user_id, action, table_name, record_id, old_values, new_values, ip_address, user_agent, created_at)
  VALUES (
    NEW.company_id,
    NEW.user_id,
    'UPDATE',
    'GLMERP01_inventory',
    NEW.id,
    json_build_object('quantity_on_hand', OLD.quantity_on_hand),
    json_build_object('quantity_on_hand', NEW.quantity_on_hand),
    inet_client_addr(),
    current_setting('request_headers')::text,
    NOW()
  );
  RETURN NULL;
END;
$$;

CREATE TRIGGER trigger_log_inventory_change
AFTER UPDATE ON GLMERP01_inventory
FOR EACH ROW
WHEN (OLD.quantity_on_hand IS DISTINCT FROM NEW.quantity_on_hand)
EXECUTE FUNCTION log_inventory_change();
```

## Data Migration Strategy

For database changes, use the following migration strategy:

1. **Version Control**: All schema changes should be versioned
2. **Backward Compatibility**: Maintain compatibility with existing data
3. **Zero Downtime**: Use transactional migrations
4. **Rollback Plan**: Always have a rollback strategy
5. **Testing**: Test migrations in staging before production

## Performance Considerations

1. **Query Optimization**: Use appropriate indexes and query optimization
2. **Connection Pooling**: Configure Supabase connection pooling
3. **Caching**: Implement Redis caching for frequently accessed data
4. **Pagination**: Use cursor-based pagination for large datasets
5. **Batch Operations**: Process multiple records in single transactions

## Security Considerations

1. **Input Validation**: Validate all inputs at application and database level
2. **SQL Injection**: Use parameterized queries
3. **Authentication**: Implement proper JWT token validation
4. **Authorization**: Enforce role-based access control
5. **Data Encryption**: Encrypt sensitive data at rest
6. **Audit Trail**: Log all data modifications
7. **Compliance**: Ensure GDPR and other regulations compliance

This schema provides a comprehensive foundation for the GLM ERP POS system with proper relationships, security, and performance considerations.