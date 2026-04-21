import { Book } from "../types";
import { STATUS_LABEL_MAP } from "../constants";
import { currency } from "../utils";

interface BookTableProps {
  items: Book[];
  loading: boolean;
  emptyMessage: string;
  onEdit: (book: Book) => void;
}

export const BookTable = ({ items, loading, emptyMessage, onEdit }: BookTableProps) => {
  if (loading) {
    return <div className="empty-state">Loading data...</div>;
  }

  if (items.length === 0) {
    return <div className="empty-state">{emptyMessage}</div>;
  }

  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Book</th>
            <th>Category</th>
            <th>Buy</th>
            <th>Sell</th>
            <th>Stock</th>
            <th>Buy charged</th>
            <th>Free</th>
            <th>Cost value</th>
            <th>Sale value</th>
            <th>Margin</th>
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {items.map((book) => (
            <tr key={book.id}>
              <td>
                <div className="book-cell">
                  {book.imageUrls[0] ? (
                    <img src={book.imageUrls[0]} alt={book.title} className="book-thumb" />
                  ) : (
                    <div className="book-thumb placeholder">Book</div>
                  )}
                  <div>
                    <strong>{book.title}</strong>
                    <span>{book.pageCount} pages</span>
                  </div>
                </div>
              </td>
              <td>{book.category}</td>
              <td>{currency.format(book.buyPrice)}</td>
              <td>{currency.format(book.sellPrice)}</td>
              <td>{book.stock}</td>
              <td>{book.paidStockQuantity}</td>
              <td>{book.freeStockQuantity}</td>
              <td>{currency.format(book.costValue)}</td>
              <td>{currency.format(book.salesValue)}</td>
              <td>
                <strong className={book.potentialProfit >= 0 ? "profit-positive" : "profit-negative"}>
                  {currency.format(book.potentialProfit)}
                </strong>
              </td>
              <td>
                <span className={`status-badge ${book.stockStatus}`}>
                  {STATUS_LABEL_MAP[book.stockStatus]}
                </span>
              </td>
              <td>
                <button
                  type="button"
                  className="table-action"
                  onClick={() => onEdit(book)}
                >
                  Edit
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
