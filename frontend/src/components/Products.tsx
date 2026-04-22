import { ChangeEvent, FormEvent, useMemo } from "react";
import { Book, CreateBookPayload } from "../types";
import { ReportSummary } from "../types";
import { BookTable } from "./BookTable";
import { BOOK_CATEGORIES } from "../constants";
import { currency, parseCurrencyInput } from "../utils";
import type { BookFormState } from "../types/forms";

interface ProductsProps {
  books: Book[];
  report: ReportSummary;
  loading: boolean;
  showProductForm: boolean;
  editingBook: Book | null;
  bookForm: BookFormState;
  bookImages: File[];
  bookImageInputKey: number;
  bookSuccessMessage: string | null;
  bookSaving: boolean;
  onFormChange: (form: BookFormState) => void;
  onImageChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onRemoveImage: (index: number) => void;
  onRemoveSavedImage: (url: string) => void;
  onAddClick: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onCancel: () => void;
  onEdit: (book: Book) => void;
}

export const Products = ({
  books,
  report,
  loading,
  showProductForm,
  editingBook,
  bookForm,
  bookImages,
  bookImageInputKey,
  bookSuccessMessage,
  bookSaving,
  onFormChange,
  onImageChange,
  onRemoveImage,
  onRemoveSavedImage,
  onAddClick,
  onSubmit,
  onCancel,
  onEdit
}: ProductsProps) => {
  const bookImagePreviews = useMemo(
    () =>
      bookImages.map((file) => ({
        name: file.name,
        url: URL.createObjectURL(file)
      })),
    [bookImages]
  );

  const productStockQuantity = Number(bookForm.stock) || 0;
  const productPaidStockQuantity = Math.max(productStockQuantity - Math.floor(productStockQuantity / 6), 0);
  const productFreeStockQuantity = Math.floor(productStockQuantity / 6);
  const productBuyCost = parseCurrencyInput(bookForm.buyPrice || "0") * productPaidStockQuantity;

  return (
    <>
      {showProductForm ? (
        <article className="panel product-form-panel">
          <div className="panel-header">
            <div>
              <p className="section-label">{editingBook ? "Edit product" : "Add product"}</p>
              <h2>{editingBook ? "Update book record" : "New book record"}</h2>
            </div>
          </div>

          <form className="form-grid" onSubmit={onSubmit}>
            <label>
              Title
              <input
                value={bookForm.title}
                onChange={(event) => onFormChange({ ...bookForm, title: event.target.value })}
                placeholder="Atomic Habits"
                required
              />
            </label>

            <label>
              Category
              <select
                value={bookForm.category}
                onChange={(event) => onFormChange({ ...bookForm, category: event.target.value })}
                required
              >
                {BOOK_CATEGORIES.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </label>

            <div className="row-grid">
              <label>
                Buy price
                <input
                  inputMode="decimal"
                  value={bookForm.buyPrice}
                  onChange={(event) => onFormChange({ ...bookForm, buyPrice: event.target.value })}
                  placeholder="3.6$"
                  required
                />
              </label>

              <label>
                Sell price
                <input
                  inputMode="decimal"
                  value={bookForm.sellPrice}
                  onChange={(event) => onFormChange({ ...bookForm, sellPrice: event.target.value })}
                  placeholder="5.99$"
                  required
                />
              </label>
            </div>

            <div className="row-grid row-grid-three">
              <label>
                Page count
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={bookForm.pageCount}
                  onChange={(event) => onFormChange({ ...bookForm, pageCount: event.target.value })}
                  required
                />
              </label>

              <label>
                Stock quantity
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={bookForm.stock}
                  onChange={(event) => onFormChange({ ...bookForm, stock: event.target.value })}
                  required
                />
              </label>

              <label>
                Low stock alert
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={bookForm.lowStockThreshold}
                  onChange={(event) =>
                    onFormChange({ ...bookForm, lowStockThreshold: event.target.value })
                  }
                  required
                />
              </label>
            </div>

            <section className="order-preview stock-cost-preview">
              <div>
                <span>Stock received</span>
                <strong>{productStockQuantity}</strong>
              </div>
              <div>
                <span>Buy charged books</span>
                <strong>{productPaidStockQuantity}</strong>
              </div>
              <div className="free-books-box">
                <span>Free books from supplier</span>
                <strong>{productFreeStockQuantity}</strong>
              </div>
              <div className="order-total">
                <span>Buy cost value</span>
                <strong>{currency.format(productBuyCost)}</strong>
              </div>
            </section>

            <label>
              Upload images
              <input
                key={bookImageInputKey}
                type="file"
                accept="image/*"
                multiple
                onChange={onImageChange}
              />
              <span className="field-hint">Upload up to 5 book images. Use the close button to remove one before saving.</span>
            </label>

            {editingBook?.imageUrls.length ? (
              <div>
                <div className="subsection-title">Saved images</div>
                <div className="image-preview-grid">
                  {bookForm.imageUrlsText
                    .split("\n")
                    .map((item) => item.trim())
                    .filter(Boolean)
                    .map((imageUrl, index) => (
                      <div className="image-preview-card removable" key={`${imageUrl}-${index}`}>
                        <button
                          type="button"
                          className="remove-image-button"
                          onClick={() => onRemoveSavedImage(imageUrl)}
                          aria-label="Remove saved image"
                        >
                          x
                        </button>
                        <img
                          src={imageUrl}
                          alt={`${editingBook.title} ${index + 1}`}
                          className="image-preview"
                        />
                        <span>Current image {index + 1}</span>
                      </div>
                    ))}
                </div>
              </div>
            ) : null}

            {bookImagePreviews.length > 0 ? (
              <div>
                <div className="subsection-title">New uploads</div>
                <div className="image-preview-grid">
                  {bookImagePreviews.map((preview, index) => (
                    <div className="image-preview-card removable" key={`${preview.name}-${index}`}>
                      <button
                        type="button"
                        className="remove-image-button"
                        onClick={() => onRemoveImage(index)}
                        aria-label="Remove uploaded image"
                      >
                        x
                      </button>
                      <img src={preview.url} alt={preview.name} className="image-preview" />
                      <span>{preview.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {bookSuccessMessage ? <p className="feedback success">{bookSuccessMessage}</p> : null}

            <div className="button-row">
              <button type="submit" className="primary-button" disabled={bookSaving}>
                {bookSaving ? "Saving..." : editingBook ? "Update book" : "Add book"}
              </button>
              <button
                type="button"
                className="secondary-button"
                onClick={onCancel}
                disabled={bookSaving}
              >
                Back
              </button>
            </div>
          </form>
        </article>
      ) : null}
    </>
  );
};
