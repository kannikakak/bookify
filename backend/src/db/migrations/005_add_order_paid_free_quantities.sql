SET @column_exists := (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'sales_orders'
    AND COLUMN_NAME = 'paid_quantity'
);

SET @migration_sql := IF(
  @column_exists = 0,
  'ALTER TABLE sales_orders ADD COLUMN paid_quantity INT NOT NULL DEFAULT 0 AFTER quantity',
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
    AND COLUMN_NAME = 'free_quantity'
);

SET @migration_sql := IF(
  @column_exists = 0,
  'ALTER TABLE sales_orders ADD COLUMN free_quantity INT NOT NULL DEFAULT 0 AFTER paid_quantity',
  'SELECT 1'
);

PREPARE migration_stmt FROM @migration_sql;
EXECUTE migration_stmt;
DEALLOCATE PREPARE migration_stmt;

UPDATE sales_orders
SET paid_quantity = quantity
WHERE paid_quantity = 0;
