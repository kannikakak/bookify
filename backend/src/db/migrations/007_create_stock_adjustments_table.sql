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
