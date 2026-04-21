UPDATE sales_orders
SET
  paid_quantity = quantity,
  free_quantity = 0,
  total_amount = (unit_sell_price * quantity) - discount;
