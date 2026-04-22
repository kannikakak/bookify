SET @column_exists := (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'sales_orders'
    AND COLUMN_NAME = 'invoice_code'
);

SET @migration_sql := IF(
  @column_exists = 0,
  'ALTER TABLE sales_orders ADD COLUMN invoice_code VARCHAR(40) NULL AFTER id',
  'SELECT 1'
);

PREPARE migration_stmt FROM @migration_sql;
EXECUTE migration_stmt;
DEALLOCATE PREPARE migration_stmt;

SET @column_exists := (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'sales_orders'
    AND COLUMN_NAME = 'unit_buy_price'
);

SET @migration_sql := IF(
  @column_exists = 0,
  'ALTER TABLE sales_orders ADD COLUMN unit_buy_price DECIMAL(10, 2) NOT NULL DEFAULT 0.00 AFTER free_quantity',
  'SELECT 1'
);

PREPARE migration_stmt FROM @migration_sql;
EXECUTE migration_stmt;
DEALLOCATE PREPARE migration_stmt;

SET @column_exists := (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'sales_orders'
    AND COLUMN_NAME = 'delivery_fee'
);

SET @migration_sql := IF(
  @column_exists = 0,
  'ALTER TABLE sales_orders ADD COLUMN delivery_fee DECIMAL(10, 2) NOT NULL DEFAULT 0.00 AFTER total_amount',
  'SELECT 1'
);

PREPARE migration_stmt FROM @migration_sql;
EXECUTE migration_stmt;
DEALLOCATE PREPARE migration_stmt;

UPDATE sales_orders
INNER JOIN books ON books.id = sales_orders.book_id
SET
  sales_orders.invoice_code = CONCAT('INV-', sales_orders.id),
  sales_orders.unit_buy_price = books.buy_price
WHERE sales_orders.invoice_code IS NULL;

ALTER TABLE sales_orders
  MODIFY invoice_code VARCHAR(40) NOT NULL;
