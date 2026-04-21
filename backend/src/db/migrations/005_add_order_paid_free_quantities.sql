ALTER TABLE sales_orders
  ADD COLUMN IF NOT EXISTS paid_quantity INT NOT NULL DEFAULT 0 AFTER quantity,
  ADD COLUMN IF NOT EXISTS free_quantity INT NOT NULL DEFAULT 0 AFTER paid_quantity;

UPDATE sales_orders
SET paid_quantity = quantity
WHERE paid_quantity = 0;
