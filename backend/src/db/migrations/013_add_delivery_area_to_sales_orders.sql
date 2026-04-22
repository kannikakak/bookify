SET @column_exists := (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'sales_orders'
    AND COLUMN_NAME = 'delivery_area'
);

SET @migration_sql := IF(
  @column_exists = 0,
  'ALTER TABLE sales_orders ADD COLUMN delivery_area VARCHAR(20) NOT NULL DEFAULT ''province'' AFTER delivery_fee',
  'SELECT 1'
);

PREPARE migration_stmt FROM @migration_sql;
EXECUTE migration_stmt;
DEALLOCATE PREPARE migration_stmt;

UPDATE sales_orders
SET delivery_area = 'phnom-penh'
WHERE delivery_area = 'province'
  AND (
    LOWER(customer_address) LIKE '%phnom penh%'
    OR LOWER(customer_address) LIKE '%pp%'
    OR customer_address LIKE '%ភ្នំពេញ%'
  );
