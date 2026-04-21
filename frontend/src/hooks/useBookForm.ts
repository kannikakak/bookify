import { useState } from "react";
import { Book, CreateBookPayload } from "../types";
import { INITIAL_BOOK_FORM } from "../constants";
import type { BookFormState } from "../types/forms";

export const useBookForm = () => {
  const [bookForm, setBookForm] = useState<BookFormState>(INITIAL_BOOK_FORM);
  const [bookImages, setBookImages] = useState<File[]>([]);
  const [bookImageInputKey, setBookImageInputKey] = useState(0);
  const [editingBookId, setEditingBookId] = useState<number | null>(null);
  const [showProductForm, setShowProductForm] = useState(false);
  const [bookSaving, setBookSaving] = useState(false);
  const [bookSuccessMessage, setBookSuccessMessage] = useState<string | null>(null);

  const editingBook = (books: Book[]): Book | null => {
    return books.find((book) => book.id === editingBookId) ?? null;
  };

  const resetForm = () => {
    setBookForm(INITIAL_BOOK_FORM);
    setBookImages([]);
    setEditingBookId(null);
    setShowProductForm(false);
    setBookImageInputKey((current) => current + 1);
  };

  const loadEditingBook = (book: Book) => {
    setEditingBookId(book.id);
    setShowProductForm(true);
    setBookImages([]);
    setBookImageInputKey((current) => current + 1);
    setBookSuccessMessage(null);
    setBookForm({
      title: book.title,
      category: book.category,
      buyPrice: String(book.buyPrice),
      sellPrice: String(book.sellPrice),
      pageCount: String(book.pageCount),
      stock: String(book.stock),
      lowStockThreshold: String(book.lowStockThreshold),
      imageUrlsText: book.imageUrls.join("\n")
    });
  };

  return {
    bookForm,
    setBookForm,
    bookImages,
    setBookImages,
    bookImageInputKey,
    setBookImageInputKey,
    editingBookId,
    showProductForm,
    setShowProductForm,
    bookSaving,
    setBookSaving,
    bookSuccessMessage,
    setBookSuccessMessage,
    editingBook,
    resetForm,
    loadEditingBook
  };
};
