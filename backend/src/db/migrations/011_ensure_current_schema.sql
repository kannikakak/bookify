CREATE TABLE IF NOT EXISTS books (
  id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  category VARCHAR(120) NOT NULL,
  buy_price DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  sell_price DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  page_count INT NOT NULL,
  stock INT NOT NULL DEFAULT 0,
  low_stock_threshold INT NOT NULL DEFAULT 5,
  image_urls LONGTEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL DEFAULT NULL
);

SET @column_exists := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'books' AND COLUMN_NAME = 'buy_price'
);
SET @migration_sql := IF(@column_exists = 0, 'ALTER TABLE books ADD COLUMN buy_price DECIMAL(10, 2) NOT NULL DEFAULT 0.00 AFTER category', 'SELECT 1');
PREPARE migration_stmt FROM @migration_sql;
EXECUTE migration_stmt;
DEALLOCATE PREPARE migration_stmt;

SET @column_exists := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'books' AND COLUMN_NAME = 'sell_price'
);
SET @migration_sql := IF(@column_exists = 0, 'ALTER TABLE books ADD COLUMN sell_price DECIMAL(10, 2) NOT NULL DEFAULT 0.00 AFTER buy_price', 'SELECT 1');
PREPARE migration_stmt FROM @migration_sql;
EXECUTE migration_stmt;
DEALLOCATE PREPARE migration_stmt;

SET @column_exists := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'books' AND COLUMN_NAME = 'low_stock_threshold'
);
SET @migration_sql := IF(@column_exists = 0, 'ALTER TABLE books ADD COLUMN low_stock_threshold INT NOT NULL DEFAULT 5 AFTER stock', 'SELECT 1');
PREPARE migration_stmt FROM @migration_sql;
EXECUTE migration_stmt;
DEALLOCATE PREPARE migration_stmt;

SET @column_exists := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'books' AND COLUMN_NAME = 'image_urls'
);
SET @migration_sql := IF(@column_exists = 0, 'ALTER TABLE books ADD COLUMN image_urls LONGTEXT NULL AFTER low_stock_threshold', 'SELECT 1');
PREPARE migration_stmt FROM @migration_sql;
EXECUTE migration_stmt;
DEALLOCATE PREPARE migration_stmt;

SET @column_exists := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'books' AND COLUMN_NAME = 'created_at'
);
SET @migration_sql := IF(@column_exists = 0, 'ALTER TABLE books ADD COLUMN created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP AFTER image_urls', 'SELECT 1');
PREPARE migration_stmt FROM @migration_sql;
EXECUTE migration_stmt;
DEALLOCATE PREPARE migration_stmt;

SET @column_exists := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'books' AND COLUMN_NAME = 'updated_at'
);
SET @migration_sql := IF(@column_exists = 0, 'ALTER TABLE books ADD COLUMN updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER created_at', 'SELECT 1');
PREPARE migration_stmt FROM @migration_sql;
EXECUTE migration_stmt;
DEALLOCATE PREPARE migration_stmt;

SET @column_exists := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'books' AND COLUMN_NAME = 'deleted_at'
);
SET @migration_sql := IF(@column_exists = 0, 'ALTER TABLE books ADD COLUMN deleted_at TIMESTAMP NULL DEFAULT NULL AFTER updated_at', 'SELECT 1');
PREPARE migration_stmt FROM @migration_sql;
EXECUTE migration_stmt;
DEALLOCATE PREPARE migration_stmt;

UPDATE books SET image_urls = '[]' WHERE image_urls IS NULL;
ALTER TABLE books MODIFY image_urls LONGTEXT NOT NULL;

CREATE TABLE IF NOT EXISTS expenses (
  id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  category VARCHAR(60) NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  note VARCHAR(255) NOT NULL,
  spent_on DATE NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sales_orders (
  id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  invoice_code VARCHAR(40) NULL,
  book_id INT NOT NULL,
  customer_name VARCHAR(160) NOT NULL,
  customer_phone VARCHAR(40) NOT NULL DEFAULT '',
  customer_address VARCHAR(255) NOT NULL DEFAULT '',
  quantity INT NOT NULL,
  paid_quantity INT NOT NULL DEFAULT 0,
  free_quantity INT NOT NULL DEFAULT 0,
  unit_buy_price DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  unit_sell_price DECIMAL(10, 2) NOT NULL,
  discount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  total_amount DECIMAL(10, 2) NOT NULL,
  delivery_fee DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  ordered_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_sales_orders_book
    FOREIGN KEY (book_id) REFERENCES books(id)
    ON DELETE RESTRICT
);

SET @column_exists := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'sales_orders' AND COLUMN_NAME = 'invoice_code'
);
SET @migration_sql := IF(@column_exists = 0, 'ALTER TABLE sales_orders ADD COLUMN invoice_code VARCHAR(40) NULL AFTER id', 'SELECT 1');
PREPARE migration_stmt FROM @migration_sql;
EXECUTE migration_stmt;
DEALLOCATE PREPARE migration_stmt;

SET @column_exists := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'sales_orders' AND COLUMN_NAME = 'customer_phone'
);
SET @migration_sql := IF(@column_exists = 0, 'ALTER TABLE sales_orders ADD COLUMN customer_phone VARCHAR(40) NOT NULL DEFAULT '''' AFTER customer_name', 'SELECT 1');
PREPARE migration_stmt FROM @migration_sql;
EXECUTE migration_stmt;
DEALLOCATE PREPARE migration_stmt;

SET @column_exists := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'sales_orders' AND COLUMN_NAME = 'customer_address'
);
SET @migration_sql := IF(@column_exists = 0, 'ALTER TABLE sales_orders ADD COLUMN customer_address VARCHAR(255) NOT NULL DEFAULT '''' AFTER customer_phone', 'SELECT 1');
PREPARE migration_stmt FROM @migration_sql;
EXECUTE migration_stmt;
DEALLOCATE PREPARE migration_stmt;

SET @column_exists := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'sales_orders' AND COLUMN_NAME = 'paid_quantity'
);
SET @migration_sql := IF(@column_exists = 0, 'ALTER TABLE sales_orders ADD COLUMN paid_quantity INT NOT NULL DEFAULT 0 AFTER quantity', 'SELECT 1');
PREPARE migration_stmt FROM @migration_sql;
EXECUTE migration_stmt;
DEALLOCATE PREPARE migration_stmt;

SET @column_exists := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'sales_orders' AND COLUMN_NAME = 'free_quantity'
);
SET @migration_sql := IF(@column_exists = 0, 'ALTER TABLE sales_orders ADD COLUMN free_quantity INT NOT NULL DEFAULT 0 AFTER paid_quantity', 'SELECT 1');
PREPARE migration_stmt FROM @migration_sql;
EXECUTE migration_stmt;
DEALLOCATE PREPARE migration_stmt;

SET @column_exists := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'sales_orders' AND COLUMN_NAME = 'unit_buy_price'
);
SET @migration_sql := IF(@column_exists = 0, 'ALTER TABLE sales_orders ADD COLUMN unit_buy_price DECIMAL(10, 2) NOT NULL DEFAULT 0.00 AFTER free_quantity', 'SELECT 1');
PREPARE migration_stmt FROM @migration_sql;
EXECUTE migration_stmt;
DEALLOCATE PREPARE migration_stmt;

SET @column_exists := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'sales_orders' AND COLUMN_NAME = 'delivery_fee'
);
SET @migration_sql := IF(@column_exists = 0, 'ALTER TABLE sales_orders ADD COLUMN delivery_fee DECIMAL(10, 2) NOT NULL DEFAULT 0.00 AFTER total_amount', 'SELECT 1');
PREPARE migration_stmt FROM @migration_sql;
EXECUTE migration_stmt;
DEALLOCATE PREPARE migration_stmt;

UPDATE sales_orders
INNER JOIN books ON books.id = sales_orders.book_id
SET
  sales_orders.invoice_code = COALESCE(sales_orders.invoice_code, CONCAT('INV-', sales_orders.id)),
  sales_orders.unit_buy_price = CASE
    WHEN sales_orders.unit_buy_price = 0 THEN books.buy_price
    ELSE sales_orders.unit_buy_price
  END,
  sales_orders.paid_quantity = CASE
    WHEN sales_orders.paid_quantity = 0 THEN sales_orders.quantity
    ELSE sales_orders.paid_quantity
  END;

CREATE TABLE IF NOT EXISTS stock_adjustments (
  id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  book_id INT NOT NULL,
  quantity_added INT NOT NULL,
  stock_after INT NOT NULL,
  note VARCHAR(255) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_stock_adjustments_book
    FOREIGN KEY (book_id) REFERENCES books(id)
    ON DELETE RESTRICT
);
