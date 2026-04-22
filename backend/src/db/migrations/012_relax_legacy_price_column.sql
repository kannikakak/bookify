SET @price_column_exists := (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'books'
    AND COLUMN_NAME = 'price'
);

SET @migration_sql := IF(
  @price_column_exists > 0,
  'ALTER TABLE books MODIFY price DECIMAL(10, 2) NOT NULL DEFAULT 0.00',
  'SELECT 1'
);

PREPARE migration_stmt FROM @migration_sql;
EXECUTE migration_stmt;
DEALLOCATE PREPARE migration_stmt;
