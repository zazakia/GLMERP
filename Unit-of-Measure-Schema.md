# Unit of Measure (UOM) System for GLM ERP POS

## Overview

This document outlines the implementation of a comprehensive Unit of Measure (UOM) system for the GLM ERP POS system. The UOM system allows products to be sold in different units (e.g., pieces, kilograms, liters, boxes) while maintaining accurate inventory tracking and pricing.

## Core UOM Tables

### 1. GLMERP01_units_of_measure

Base table for all units of measure.

```sql
CREATE TABLE GLMERP01_units_of_measure (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES GLMERP01_companies(id) ON DELETE CASCADE,
  unit_code VARCHAR(10) NOT NULL,
  unit_name VARCHAR(50) NOT NULL,
  unit_type VARCHAR(20) NOT NULL CHECK (unit_type IN ('count', 'weight', 'volume', 'length', 'area', 'time')),
  base_unit BOOLEAN DEFAULT false,
  conversion_factor DECIMAL(10,6) DEFAULT 1.0,
  base_unit_id UUID REFERENCES GLMERP01_units_of_measure(id),
  symbol VARCHAR(10),
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(company_id, unit_code)
);
```

### 2. GLMERP01_product_uom_conversions

Defines conversion relationships between different units for each product.

```sql
CREATE TABLE GLMERP01_product_uom_conversions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES GLMERP01_companies(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES GLMERP01_products(id) ON DELETE CASCADE,
  from_unit_id UUID NOT NULL REFERENCES GLMERP01_units_of_measure(id),
  to_unit_id UUID NOT NULL REFERENCES GLMERP01_units_of_measure(id),
  conversion_factor DECIMAL(10,6) NOT NULL,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(product_id, from_unit_id, to_unit_id)
);
```

### 3. GLMERP01_product_pricing_uom

Pricing information for different units of measure.

```sql
CREATE TABLE GLMERP01_product_pricing_uom (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES GLMERP01_companies(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES GLMERP01_products(id) ON DELETE CASCADE,
  uom_id UUID NOT NULL REFERENCES GLMERP01_units_of_measure(id),
  selling_price DECIMAL(10,2) NOT NULL,
  cost_price DECIMAL(10,2),
  min_quantity DECIMAL(10,2) DEFAULT 1.0,
  max_quantity DECIMAL(10,2),
  is_default BOOLEAN DEFAULT false,
  effective_from DATE DEFAULT CURRENT_DATE,
  effective_to DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(product_id, uom_id, effective_from)
);
```

### 4. GLMERP01_inventory_uom

Inventory tracking for different units of measure.

```sql
CREATE TABLE GLMERP01_inventory_uom (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES GLMERP01_companies(id) ON DELETE CASCADE,
  branch_id UUID NOT NULL REFERENCES GLMERP01_branches(id) ON DELETE CASCADE,
  location_id UUID NOT NULL REFERENCES GLMERP01_locations(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES GLMERP01_products(id) ON DELETE CASCADE,
  uom_id UUID NOT NULL REFERENCES GLMERP01_units_of_measure(id),
  quantity_on_hand DECIMAL(12,4) NOT NULL DEFAULT 0,
  quantity_committed DECIMAL(12,4) NOT NULL DEFAULT 0,
  quantity_on_order DECIMAL(12,4) NOT NULL DEFAULT 0,
  quantity_available DECIMAL(12,4) GENERATED ALWAYS AS (quantity_on_hand - quantity_committed),
  reorder_level DECIMAL(12,4) DEFAULT 0,
  reorder_quantity DECIMAL(12,4) DEFAULT 0,
  last_counted_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(branch_id, location_id, product_id, uom_id)
);
```

### 5. GLMERP01_sale_items_uom

Sale items with unit of measure information.

```sql
CREATE TABLE GLMERP01_sale_items_uom (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_item_id UUID NOT NULL REFERENCES GLMERP01_sale_items(id) ON DELETE CASCADE,
  uom_id UUID NOT NULL REFERENCES GLMERP01_units_of_measure(id),
  quantity_sold DECIMAL(10,4) NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  total_price DECIMAL(12,2) NOT NULL,
  base_quantity DECIMAL(10,4) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Standard Units of Measure

### Count Units
- Each (EA)
- Piece (PC)
- Box (BX)
- Case (CS)
- Pack (PK)
- Dozen (DZ)

### Weight Units
- Gram (G)
- Kilogram (KG)
- Pound (LB)
- Ounce (OZ)
- Ton (T)

### Volume Units
- Milliliter (ML)
- Liter (L)
- Fluid Ounce (FLOZ)
- Gallon (GAL)
- Quart (QT)
- Pint (PT)

### Length Units
- Millimeter (MM)
- Centimeter (CM)
- Meter (M)
- Inch (IN)
- Foot (FT)
- Yard (YD)

## UOM Conversion Examples

### Product: Rice
- Base Unit: Kilogram (KG)
- Selling Units:
  - 1 KG = 1 KG (conversion factor: 1.0)
  - 1 Sack = 25 KG (conversion factor: 25.0)
  - 1 Bag = 5 KG (conversion factor: 5.0)

### Product: Milk
- Base Unit: Liter (L)
- Selling Units:
  - 1 L = 1 L (conversion factor: 1.0)
  - 1 Bottle = 1 L (conversion factor: 1.0)
  - 1 Carton = 2 L (conversion factor: 2.0)

### Product: Eggs
- Base Unit: Each (EA)
- Selling Units:
  - 1 Each = 1 EA (conversion factor: 1.0)
  - 1 Dozen = 12 EA (conversion factor: 12.0)
  - 1 Tray = 30 EA (conversion factor: 30.0)

## Implementation Logic

### 1. Product Setup
When creating a product, define:
- Base unit of measure
- Available selling units
- Conversion factors
- Pricing per unit

### 2. Inventory Management
- Track inventory in base units
- Convert to selling units for display
- Maintain conversion accuracy

### 3. Sales Processing
- Allow selection of different units
- Calculate prices based on unit pricing
- Convert quantities to base units for inventory
- Maintain transaction accuracy

### 4. Reporting
- Show sales in multiple units
- Convert to common units for analysis
- Maintain conversion consistency

## Database Functions

### Convert Quantity Between Units
```sql
CREATE OR REPLACE FUNCTION convert_uom_quantity(
  p_product_id UUID,
  p_from_uom_id UUID,
  p_to_uom_id UUID,
  p_quantity DECIMAL
)
RETURNS DECIMAL
LANGUAGE plpgsql
AS $$
DECLARE
  conversion_factor DECIMAL;
BEGIN
  -- Get conversion factor from product_uom_conversions
  SELECT conversion_factor INTO conversion_factor
  FROM GLMERP01_product_uom_conversions
  WHERE product_id = p_product_id
    AND from_unit_id = p_from_uom_id
    AND to_unit_id = p_to_uom_id;

  IF conversion_factor IS NULL THEN
    RAISE EXCEPTION 'No conversion found for product % from unit % to unit %',
      p_product_id, p_from_uom_id, p_to_uom_id;
  END IF;

  RETURN p_quantity * conversion_factor;
END;
$$;
```

### Get Product Price for UOM
```sql
CREATE OR REPLACE FUNCTION get_product_price_for_uom(
  p_product_id UUID,
  p_uom_id UUID,
  p_date DATE DEFAULT CURRENT_DATE
)
RETURNS DECIMAL
LANGUAGE plpgsql
AS $$
DECLARE
  price DECIMAL;
BEGIN
  SELECT selling_price INTO price
  FROM GLMERP01_product_pricing_uom
  WHERE product_id = p_product_id
    AND uom_id = p_uom_id
    AND effective_from <= p_date
    AND (effective_to IS NULL OR effective_to >= p_date)
  ORDER BY effective_from DESC
  LIMIT 1;

  RETURN COALESCE(price, 0);
END;
$$;
```

## Frontend Implementation

### Product Selection Component
```typescript
interface ProductUOM {
  uom_id: string;
  uom_name: string;
  conversion_factor: number;
  price: number;
  available_quantity: number;
}

interface ProductWithUOM {
  id: string;
  name: string;
  base_uom: string;
  available_uoms: ProductUOM[];
}
```

### Cart Item with UOM
```typescript
interface CartItemUOM {
  product_id: string;
  uom_id: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  base_quantity: number; // Converted to base unit
}
```

## Business Rules

### 1. Inventory Consistency
- All inventory tracking in base units
- Display quantities in user-preferred units
- Maintain conversion accuracy

### 2. Pricing Strategy
- Different prices for different units
- Volume discounts based on quantity
- Time-based pricing changes

### 3. Sales Validation
- Check available inventory in base units
- Validate minimum/maximum quantities
- Ensure pricing accuracy

### 4. Reporting Accuracy
- Convert all quantities to common units
- Maintain transaction integrity
- Provide multi-unit reporting

## Migration Strategy

### Phase 1: Database Setup
- Create UOM tables
- Populate standard units
- Set up conversion relationships

### Phase 2: Product Migration
- Add UOM information to existing products
- Set up pricing for different units
- Update inventory records

### Phase 3: Transaction Updates
- Modify sales processing
- Update inventory calculations
- Add UOM tracking to transactions

### Phase 4: UI Updates
- Update product selection
- Modify cart functionality
- Add UOM display options

## Benefits

1. **Flexibility**: Sell products in customer-preferred units
2. **Accuracy**: Precise inventory and pricing calculations
3. **Scalability**: Support for complex product offerings
4. **Compliance**: Accurate transaction recording
5. **Analytics**: Better sales and inventory insights

This UOM system provides a robust foundation for handling complex product offerings while maintaining accuracy and flexibility in the GLM ERP POS system.