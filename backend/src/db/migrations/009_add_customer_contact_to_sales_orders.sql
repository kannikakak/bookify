SET @column_exists := (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'sales_orders'
    AND COLUMN_NAME = 'customer_phone'
);

SET @migration_sql := IF(
  @column_exists = 0,
  'ALTER TABLE sales_orders ADD COLUMN customer_phone VARCHAR(40) NOT NULL DEFAULT '''' AFTER customer_name',
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
    AND COLUMN_NAME = 'customer_address'
);

SET @migration_sql := IF(
  @column_exists = 0,
  'ALTER TABLE sales_orders ADD COLUMN customer_address VARCHAR(255) NOT NULL DEFAULT '''' AFTER customer_phone',
  'SELECT 1'
);

PREPARE migration_stmt FROM @migration_sql;
EXECUTE migration_stmt;
DEALLOCATE PREPARE migration_stmt;
