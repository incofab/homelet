import { useCallback, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { LoaderCircle, Plus } from "lucide-react";
import { Button } from "../../components/Button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog";
import { useApiQuery } from "../../hooks/useApiQuery";
import { apiPost } from "../../lib/api";
import type { Building, ExpenseCategory } from "../../lib/models";
import { api } from "../../lib/urls";

type RecordExpenseDialogProps = {
  buildings: Building[];
  defaultBuildingId?: string;
  onSuccess?: () => Promise<void> | void;
};

const today = () => new Date().toISOString().slice(0, 10);

const selectCategories = (data: unknown) => {
  const record = (data ?? {}) as Record<string, unknown>;
  return Array.isArray(record.categories) ? (record.categories as ExpenseCategory[]) : [];
};

export function RecordExpenseDialog({
  buildings,
  defaultBuildingId,
  onSuccess,
}: RecordExpenseDialogProps) {
  const [open, setOpen] = useState(false);
  const [formState, setFormState] = useState({
    buildingId: defaultBuildingId ?? "",
    categoryId: "",
    title: "",
    vendorName: "",
    amount: "",
    expenseDate: today(),
    paymentMethod: "bank_transfer",
    reference: "",
    description: "",
    notes: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const categoriesQuery = useApiQuery<unknown, ExpenseCategory[]>(
    open && formState.buildingId ? api.buildingExpenseCategories(formState.buildingId) : null,
    {
      enabled: open && Boolean(formState.buildingId),
      deps: [open, formState.buildingId],
      select: selectCategories,
    }
  );

  const availableBuildings = useMemo(() => buildings ?? [], [buildings]);

  const resetState = useCallback(() => {
    setFormState({
      buildingId: defaultBuildingId ?? "",
      categoryId: "",
      title: "",
      vendorName: "",
      amount: "",
      expenseDate: today(),
      paymentMethod: "bank_transfer",
      reference: "",
      description: "",
      notes: "",
    });
    setError(null);
  }, [defaultBuildingId]);

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);

    if (!nextOpen) {
      resetState();
    }
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    if (!formState.buildingId || !formState.title.trim() || !formState.amount || submitting) {
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await apiPost(api.expenses, {
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
      setError((requestError as Error).message || "Unable to record expense.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus size={20} className="mr-2" />
        Record Expense
      </Button>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record Expense</DialogTitle>
            <DialogDescription>
              Capture operating costs, vendors, references, and optional building categories.
            </DialogDescription>
          </DialogHeader>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm text-foreground" htmlFor="expense-building">
                  Building
                </label>
                <select
                  id="expense-building"
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
                <label className="mb-2 block text-sm text-foreground" htmlFor="expense-category">
                  Category
                </label>
                <select
                  id="expense-category"
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
                <label className="mb-2 block text-sm text-foreground" htmlFor="expense-title">
                  Title
                </label>
                <input
                  id="expense-title"
                  type="text"
                  className="w-full rounded-lg border border-border bg-input-background px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                  value={formState.title}
                  onChange={(event) =>
                    setFormState((prev) => ({ ...prev, title: event.target.value }))
                  }
                  placeholder="Generator service"
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-sm text-foreground" htmlFor="expense-vendor">
                  Vendor
                </label>
                <input
                  id="expense-vendor"
                  type="text"
                  className="w-full rounded-lg border border-border bg-input-background px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                  value={formState.vendorName}
                  onChange={(event) =>
                    setFormState((prev) => ({ ...prev, vendorName: event.target.value }))
                  }
                  placeholder="PowerFix Ltd"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div>
                <label className="mb-2 block text-sm text-foreground" htmlFor="expense-amount">
                  Amount
                </label>
                <input
                  id="expense-amount"
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
                <label className="mb-2 block text-sm text-foreground" htmlFor="expense-date">
                  Expense Date
                </label>
                <input
                  id="expense-date"
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
                <label className="mb-2 block text-sm text-foreground" htmlFor="expense-method">
                  Payment Method
                </label>
                <select
                  id="expense-method"
                  className="w-full rounded-lg border border-border bg-input-background px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                  value={formState.paymentMethod}
                  onChange={(event) =>
                    setFormState((prev) => ({ ...prev, paymentMethod: event.target.value }))
                  }
                >
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="cash">Cash</option>
                  <option value="card">Card</option>
                  <option value="cheque">Cheque</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm text-foreground" htmlFor="expense-reference">
                Reference
              </label>
              <input
                id="expense-reference"
                type="text"
                className="w-full rounded-lg border border-border bg-input-background px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                value={formState.reference}
                onChange={(event) =>
                  setFormState((prev) => ({ ...prev, reference: event.target.value }))
                }
                placeholder="Invoice or transfer reference"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm text-foreground" htmlFor="expense-description">
                Description
              </label>
              <textarea
                id="expense-description"
                className="min-h-24 w-full rounded-lg border border-border bg-input-background px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                value={formState.description}
                onChange={(event) =>
                  setFormState((prev) => ({ ...prev, description: event.target.value }))
                }
                placeholder="What was paid for?"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm text-foreground" htmlFor="expense-notes">
                Notes
              </label>
              <textarea
                id="expense-notes"
                className="min-h-24 w-full rounded-lg border border-border bg-input-background px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                value={formState.notes}
                onChange={(event) =>
                  setFormState((prev) => ({ ...prev, notes: event.target.value }))
                }
                placeholder="Optional accounting or approval notes"
              />
            </div>

            {error ? <p className="text-sm text-destructive">{error}</p> : null}

            <div className="flex items-center gap-3 pt-2">
              <Button type="submit" disabled={submitting}>
                {submitting ? (
                  <>
                    <LoaderCircle size={18} className="mr-2 animate-spin" />
                    Recording...
                  </>
                ) : (
                  "Save Expense"
                )}
              </Button>
              <Button type="button" variant="ghost" onClick={() => handleOpenChange(false)}>
                Cancel
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
