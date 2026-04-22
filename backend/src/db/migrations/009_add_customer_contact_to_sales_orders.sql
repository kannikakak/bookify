ALTER TABLE sales_orders
  ADD COLUMN customer_phone VARCHAR(40) NOT NULL DEFAULT '' AFTER customer_name,
  ADD COLUMN customer_address VARCHAR(255) NOT NULL DEFAULT '' AFTER customer_phone;
