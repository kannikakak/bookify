ALTER TABLE sales_orders
  ADD COLUMN invoice_code VARCHAR(40) NULL AFTER id,
  ADD COLUMN unit_buy_price DECIMAL(10, 2) NOT NULL DEFAULT 0.00 AFTER free_quantity,
  ADD COLUMN delivery_fee DECIMAL(10, 2) NOT NULL DEFAULT 0.00 AFTER total_amount;

UPDATE sales_orders
INNER JOIN books ON books.id = sales_orders.book_id
SET
  sales_orders.invoice_code = CONCAT('INV-', sales_orders.id),
  sales_orders.unit_buy_price = books.buy_price
WHERE sales_orders.invoice_code IS NULL;

ALTER TABLE sales_orders
  MODIFY invoice_code VARCHAR(40) NOT NULL;
