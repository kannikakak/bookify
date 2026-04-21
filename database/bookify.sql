CREATE DATABASE IF NOT EXISTS bookify_db;
USE bookify_db;

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
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

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
  book_id INT NOT NULL,
  customer_name VARCHAR(160) NOT NULL,
  quantity INT NOT NULL,
  unit_sell_price DECIMAL(10, 2) NOT NULL,
  discount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  total_amount DECIMAL(10, 2) NOT NULL,
  ordered_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_sales_orders_book
    FOREIGN KEY (book_id) REFERENCES books(id)
    ON DELETE RESTRICT
);

INSERT INTO books (
  title,
  category,
  buy_price,
  sell_price,
  page_count,
  stock,
  low_stock_threshold,
  image_urls
)
SELECT
  'The Psychology of Money',
  'Finance',
  280.00,
  450.00,
  256,
  3,
  5,
  '["https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=400&q=80"]'
WHERE NOT EXISTS (
  SELECT 1 FROM books WHERE title = 'The Psychology of Money'
);

INSERT INTO expenses (category, amount, note, spent_on)
SELECT
  'Boost Page',
  25.00,
  'Facebook boost campaign',
  CURRENT_DATE
WHERE NOT EXISTS (
  SELECT 1 FROM expenses WHERE note = 'Facebook boost campaign'
);
