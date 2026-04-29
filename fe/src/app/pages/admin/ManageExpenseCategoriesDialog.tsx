import { useCallback, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { LoaderCircle, Plus } from "lucide-react";
import { Button } from "../../components/Button";
import { useApiQuery } from "../../hooks/useApiQuery";
import { apiPost } from "../../lib/api";
import type { Building, ExpenseCategory } from "../../lib/models";
import { api } from "../../lib/urls";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog";

type ManageExpenseCategoriesDialogProps = {
  buildings: Building[];
  defaultBuildingId?: string;
  onSuccess?: () => Promise<void> | void;
};

const selectCategories = (data: unknown) => {
  const record = (data ?? {}) as Record<string, unknown>;
  return Array.isArray(record.categories) ? (record.categories as ExpenseCategory[]) : [];
};

export function ManageExpenseCategoriesDialog({
  buildings,
  defaultBuildingId,
  onSuccess,
}: ManageExpenseCategoriesDialogProps) {
  const [open, setOpen] = useState(false);
  const [buildingId, setBuildingId] = useState(defaultBuildingId ?? "");
  const [name, setName] = useState("");
  const [color, setColor] = useState("#2563EB");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const categoriesQuery = useApiQuery<unknown, ExpenseCategory[]>(
    open && buildingId ? api.buildingExpenseCategories(buildingId) : null,
    {
      enabled: open && Boolean(buildingId),
      deps: [open, buildingId],
      select: selectCategories,
    }
  );

  const availableBuildings = useMemo(() => buildings ?? [], [buildings]);

  const resetState = useCallback(() => {
    setName("");
    setColor("#2563EB");
    setDescription("");
    setError(null);
  }, []);

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);

    if (!nextOpen) {
      resetState();
    }
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    if (!buildingId || !name.trim() || submitting) {
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await apiPost(api.buildingExpenseCategories(buildingId), {
        name: name.trim(),
        color: color || null,
        description: description.trim() || null,
      });

      resetState();
      await categoriesQuery.refetch();
      await onSuccess?.();
    } catch (requestError) {
      setError((requestError as Error).message || "Unable to create category.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Button
        variant="secondary"
        onClick={() => {
          setBuildingId((current) => current || defaultBuildingId || "");
          setOpen(true);
        }}
      >
        Manage Categories
      </Button>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Expense Categories</DialogTitle>
            <DialogDescription>
              Create optional categories for each building before recording expenses.
            </DialogDescription>
          </DialogHeader>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="mb-2 block text-sm text-foreground" htmlFor="expense-category-building">
                Building
              </label>
              <select
                id="expense-category-building"
                className="w-full rounded-lg border border-border bg-input-background px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                value={buildingId}
                onChange={(event) => setBuildingId(event.target.value)}
                disabled={submitting}
              >
                <option value="">Select building</option>
                {availableBuildings.map((building) => (
                  <option key={building.id} value={building.id}>
                    {building.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-[1fr,120px]">
              <div>
                <label className="mb-2 block text-sm text-foreground" htmlFor="expense-category-name">
                  Category Name
                </label>
                <input
                  id="expense-category-name"
                  type="text"
                  className="w-full rounded-lg border border-border bg-input-background px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Utilities"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm text-foreground" htmlFor="expense-category-color">
                  Color
                </label>
                <input
                  id="expense-category-color"
                  type="color"
                  className="h-[42px] w-full rounded-lg border border-border bg-input-background px-2 py-1"
                  value={color}
                  onChange={(event) => setColor(event.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm text-foreground" htmlFor="expense-category-description">
                Description
              </label>
              <textarea
                id="expense-category-description"
                className="min-h-24 w-full rounded-lg border border-border bg-input-background px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Electricity, water, internet and utility bills"
              />
            </div>

            {categoriesQuery.data && categoriesQuery.data.length > 0 ? (
              <div className="rounded-lg border border-border p-4">
                <p className="mb-3 text-sm text-muted-foreground">Existing Categories</p>
                <div className="space-y-2">
                  {categoriesQuery.data.map((category) => (
                    <div key={category.id} className="flex items-center justify-between gap-3 rounded-lg bg-muted/40 px-3 py-2">
                      <div className="flex items-center gap-3">
                        <span
                          className="h-3 w-3 rounded-full"
                          style={{ backgroundColor: category.color ?? "#94A3B8" }}
                        />
                        <span>{category.name}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">{category.description ?? "No description"}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {error ? <p className="text-sm text-destructive">{error}</p> : null}

            <div className="flex items-center gap-3">
              <Button type="submit" disabled={submitting || !buildingId}>
                {submitting ? (
                  <>
                    <LoaderCircle size={18} className="mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Plus size={18} className="mr-2" />
                    Add Category
                  </>
                )}
              </Button>
              <Button type="button" variant="ghost" onClick={() => handleOpenChange(false)}>
                Close
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
