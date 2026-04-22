import { useState } from "react";
import { INITIAL_EXPENSE_FORM } from "../constants";
import { toDateInputValue } from "../utils";
import type { ExpenseFormState } from "../types/forms";

export const useExpenseForm = () => {
  const [expenseForm, setExpenseForm] = useState<ExpenseFormState>(INITIAL_EXPENSE_FORM);
  const [expenseSaving, setExpenseSaving] = useState(false);
  const [expenseSuccessMessage, setExpenseSuccessMessage] = useState<string | null>(null);

  const resetForm = () => {
    setExpenseForm({
      ...INITIAL_EXPENSE_FORM,
      spentOn: toDateInputValue(new Date())
    });
  };

  return {
    expenseForm,
    setExpenseForm,
    expenseSaving,
    setExpenseSaving,
    expenseSuccessMessage,
    setExpenseSuccessMessage,
    resetForm
  };
};
