import { useCallback, useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { LoaderCircle, Pencil } from "lucide-react";
import { Button } from "../../components/Button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog";
import { useApiQuery } from "../../hooks/useApiQuery";
import { apiPut } from "../../lib/api";
import type { Building, Expense, ExpenseCategory } from "../../lib/models";
import { api } from "../../lib/urls";

type EditExpenseDialogProps = {
  expense: Expense;
  buildings: Building[];
  onSuccess?: () => Promise<void> | void;
};

const normalizeDateInput = (value?: string | null) => {
  if (!value) {
    return "";
  }

  return value.slice(0, 10);
};

const selectCategories = (data: unknown) => {
  const record = (data ?? {}) as Record<string, unknown>;
  return Array.isArray(record.categories) ? (record.categories as ExpenseCategory[]) : [];
};

const buildFormState = (expense: Expense) => ({
  buildingId: String(expense.building_id),
  categoryId: expense.expense_category_id ? String(expense.expense_category_id) : "",
  title: expense.title ?? "",
  vendorName: expense.vendor_name ?? "",
  amount: expense.amount ? String(expense.amount) : "",
  expenseDate: normalizeDateInput(expense.expense_date),
  paymentMethod: expense.payment_method ?? "bank_transfer",
  reference: expense.reference ?? "",
  description: expense.description ?? "",
  notes: expense.notes ?? "",
});

export function EditExpenseDialog({
  expense,
  buildings,
  onSuccess,
}: EditExpenseDialogProps) {
  const [open, setOpen] = useState(false);
  const [formState, setFormState] = useState(() => buildFormState(expense));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setFormState(buildFormState(expense));
      setError(null);
    }
  }, [expense, open]);

  const categoriesQuery = useApiQuery<unknown, ExpenseCategory[]>(
    open && formState.buildingId ? api.buildingExpenseCategories(formState.buildingId) : null,
    {
      enabled: open && Boolean(formState.buildingId),
      deps: [open, formState.buildingId],
      select: selectCategories,
    }
  );

  const availableBuildings = useMemo(() => buildings ?? [], [buildings]);

  const handleOpenChange = useCallback((nextOpen: boolean) => {
    setOpen(nextOpen);

    if (!nextOpen) {
      setFormState(buildFormState(expense));
      setError(null);
    }
  }, [expense]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    if (!formState.buildingId || !formState.title.trim() || !formState.amount || submitting) {
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await apiPut(api.expense(expense.id), {
        building_id: Number(formState.buildingId),
        expense_category_id: formState.categoryId ? Number(formState.categoryId) : null,
        title: formState.title.trim(),
        vendor_name: formState.vendorName.trim() || null,
        amount: Number(formState.amount),
        expense_date: formState.expenseDate,
        payment_method: formState.paymentMethod || null,
        reference: formState.reference.trim() || null,
        description: formState.description.trim() || null,
        notes: formState.notes.trim() || null,
      });

      await onSuccess?.();
      handleOpenChange(false);
    } catch (requestError) {
      setError((requestError as Error).message || "Unable to update expense.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Button variant="ghost" size="sm" onClick={() => setOpen(true)}>
        <Pencil size={16} className="mr-2" />
        Edit
      </Button>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Expense</DialogTitle>
            <DialogDescription>
              Update the selected expense record and keep the building and category in sync.
            </DialogDescription>
          </DialogHeader>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm text-foreground" htmlFor={`expense-building-${expense.id}`}>
                  Building
                </label>
                <select
                  id={`expense-building-${expense.id}`}
                  className="w-full rounded-lg border border-border bg-input-background px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                  value={formState.buildingId}
                  onChange={(event) =>
                    setFormState((prev) => ({
                      ...prev,
                      buildingId: event.target.value,
                      categoryId: "",
                    }))
                  }
                  disabled={submitting}
                  required
                >
                  <option value="">Select building</option>
                  {availableBuildings.map((building) => (
                    <option key={building.id} value={building.id}>
                      {building.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm text-foreground" htmlFor={`expense-category-${expense.id}`}>
                  Category
                </label>
                <select
                  id={`expense-category-${expense.id}`}
                  className="w-full rounded-lg border border-border bg-input-background px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                  value={formState.categoryId}
                  onChange={(event) =>
                    setFormState((prev) => ({ ...prev, categoryId: event.target.value }))
                  }
                  disabled={!formState.buildingId || submitting}
                >
                  <option value="">Uncategorized</option>
                  {(categoriesQuery.data ?? []).map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm text-foreground" htmlFor={`expense-title-${expense.id}`}>
                  Title
                </label>
                <input
                  id={`expense-title-${expense.id}`}
                  type="text"
                  className="w-full rounded-lg border border-border bg-input-background px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                  value={formState.title}
                  onChange={(event) =>
                    setFormState((prev) => ({ ...prev, title: event.target.value }))
                  }
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-sm text-foreground" htmlFor={`expense-vendor-${expense.id}`}>
                  Vendor
                </label>
                <input
                  id={`expense-vendor-${expense.id}`}
                  type="text"
                  className="w-full rounded-lg border border-border bg-input-background px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                  value={formState.vendorName}
                  onChange={(event) =>
                    setFormState((prev) => ({ ...prev, vendorName: event.target.value }))
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div>
                <label className="mb-2 block text-sm text-foreground" htmlFor={`expense-amount-${expense.id}`}>
                  Amount
                </label>
                <input
                  id={`expense-amount-${expense.id}`}
                  type="number"
                  min="0"
                  className="w-full rounded-lg border border-border bg-input-background px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                  value={formState.amount}
                  onChange={(event) =>
                    setFormState((prev) => ({ ...prev, amount: event.target.value }))
                  }
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-sm text-foreground" htmlFor={`expense-date-${expense.id}`}>
                  Expense Date
                </label>
                <input
                  id={`expense-date-${expense.id}`}
                  type="date"
                  className="w-full rounded-lg border border-border bg-input-background px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                  value={formState.expenseDate}
                  onChange={(event) =>
                    setFormState((prev) => ({ ...prev, expenseDate: event.target.value }))
                  }
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-sm text-foreground" htmlFor={`expense-method-${expense.id}`}>
                  Payment Method
                </label>
                <select
                  id={`expense-method-${expense.id}`}
                  className="w-full rounded-lg border border-border bg-input-background px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                  value={formState.paymentMethod}
                  onChange={(event) =>
                    setFormState((prev) => ({ ...prev, paymentMethod: event.target.value }))
                  }
                >
                  <option value="">Select method</option>
                  <option value="cash">Cash</option>
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="card">Card</option>
                  <option value="cheque">Cheque</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm text-foreground" htmlFor={`expense-reference-${expense.id}`}>
                Reference
              </label>
              <input
                id={`expense-reference-${expense.id}`}
                type="text"
                className="w-full rounded-lg border border-border bg-input-background px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                value={formState.reference}
                onChange={(event) =>
                  setFormState((prev) => ({ ...prev, reference: event.target.value }))
                }
              />
            </div>

            <div>
              <label className="mb-2 block text-sm text-foreground" htmlFor={`expense-description-${expense.id}`}>
                Description
              </label>
              <textarea
                id={`expense-description-${expense.id}`}
                className="w-full rounded-lg border border-border bg-input-background px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                rows={3}
                value={formState.description}
                onChange={(event) =>
                  setFormState((prev) => ({ ...prev, description: event.target.value }))
                }
              />
            </div>

            <div>
              <label className="mb-2 block text-sm text-foreground" htmlFor={`expense-notes-${expense.id}`}>
                Notes
              </label>
              <textarea
                id={`expense-notes-${expense.id}`}
                className="w-full rounded-lg border border-border bg-input-background px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                rows={3}
                value={formState.notes}
                onChange={(event) =>
                  setFormState((prev) => ({ ...prev, notes: event.target.value }))
                }
              />
            </div>

            {error ? <p className="text-sm text-destructive">{error}</p> : null}

            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? (
                <>
                  <LoaderCircle size={18} className="mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
