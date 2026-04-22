SET @column_exists := (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'books'
    AND COLUMN_NAME = 'buy_price'
);

SET @migration_sql := IF(
  @column_exists = 0,
  'ALTER TABLE books ADD COLUMN buy_price DECIMAL(10, 2) NOT NULL DEFAULT 0.00 AFTER category',
  'SELECT 1'
);

PREPARE migration_stmt FROM @migration_sql;
EXECUTE migration_stmt;
DEALLOCATE PREPARE migration_stmt;

SET @column_exists := (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'books'
    AND COLUMN_NAME = 'sell_price'
);

SET @migration_sql := IF(
  @column_exists = 0,
  'ALTER TABLE books ADD COLUMN sell_price DECIMAL(10, 2) NOT NULL DEFAULT 0.00 AFTER buy_price',
  'SELECT 1'
);

PREPARE migration_stmt FROM @migration_sql;
EXECUTE migration_stmt;
DEALLOCATE PREPARE migration_stmt;

SET @price_column_exists := (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'books'
    AND COLUMN_NAME = 'price'
);

SET @migration_sql := IF(
  @price_column_exists > 0,
  'UPDATE books SET sell_price = price, buy_price = COALESCE(buy_price, 0.00) WHERE sell_price = 0.00',
  'UPDATE books SET buy_price = COALESCE(buy_price, 0.00)'
);

PREPARE migration_stmt FROM @migration_sql;
EXECUTE migration_stmt;
DEALLOCATE PREPARE migration_stmt;
