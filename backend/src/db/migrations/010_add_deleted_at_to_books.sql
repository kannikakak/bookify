SET @column_exists := (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'books'
    AND COLUMN_NAME = 'deleted_at'
);

SET @migration_sql := IF(
  @column_exists = 0,
  'ALTER TABLE books ADD COLUMN deleted_at TIMESTAMP NULL DEFAULT NULL AFTER updated_at',
  'SELECT 1'
);

PREPARE migration_stmt FROM @migration_sql;
EXECUTE migration_stmt;
DEALLOCATE PREPARE migration_stmt;
