import { useCallback, useEffect, useMemo, useState } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "../../components/Button";
import { Card } from "../../components/Card";
import { EmptyState } from "../../components/EmptyState";
import { useApiQuery } from "../../hooks/useApiQuery";
import { formatDate, formatMoney, formatStatusLabel } from "../../lib/format";
import { apiDelete } from "../../lib/api";
import { PaginatedData } from "../../lib/paginatedData";
import type { Building, Expense } from "../../lib/models";
import { api } from "../../lib/urls";
import { EditExpenseDialog } from "./EditExpenseDialog";
import { ManageExpenseCategoriesDialog } from "./ManageExpenseCategoriesDialog";
import { RecordExpenseDialog } from "./RecordExpenseDialog";

const selectExpenses = (data: unknown) => PaginatedData.from<Expense>(data, "expenses");
const selectBuildings = (data: unknown) => PaginatedData.from<Building>(data, "buildings").items;

export function ExpensesList() {
  const buildingsQuery = useApiQuery<unknown, Building[]>(api.buildings, {
    select: selectBuildings,
  });
  const buildings = buildingsQuery.data ?? [];
  const [selectedBuildingId, setSelectedBuildingId] = useState("");

  useEffect(() => {
    if (!selectedBuildingId && buildings.length > 0) {
      setSelectedBuildingId(String(buildings[0].id));
    }
  }, [buildings, selectedBuildingId]);

  const expensesEndpoint = useMemo(() => {
    if (!selectedBuildingId) {
      return api.expenses;
    }

    return `${api.expenses}?building_id=${selectedBuildingId}`;
  }, [selectedBuildingId]);

  const expensesQuery = useApiQuery<unknown, PaginatedData<Expense>>(expensesEndpoint, {
    enabled: Boolean(expensesEndpoint),
    deps: [expensesEndpoint],
    select: selectExpenses,
  });

  const expenses = expensesQuery.data?.items ?? [];
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deletingExpenseId, setDeletingExpenseId] = useState<number | null>(null);

  const summary = useMemo(() => {
    const currentMonthPrefix = new Date().toISOString().slice(0, 7);

    return expenses.reduce(
      (totals, expense) => {
        totals.total += expense.amount;

        if ((expense.expense_date ?? "").startsWith(currentMonthPrefix)) {
          totals.thisMonth += expense.amount;
        }

        if (!expense.category?.id) {
          totals.uncategorized += 1;
        }

        return totals;
      },
      { total: 0, thisMonth: 0, uncategorized: 0 }
    );
  }, [expenses]);

  const handleRefresh = useCallback(async () => {
    await expensesQuery.refetch();
  }, [expensesQuery]);

  const handleDelete = useCallback(async (expense: Expense) => {
    if (!window.confirm(`Delete "${expense.title}"? This action cannot be undone.`)) {
      return;
    }

    setDeletingExpenseId(expense.id);
    setDeleteError(null);

    try {
      await apiDelete(api.expense(expense.id));
      await handleRefresh();
    } catch (error) {
      setDeleteError((error as Error).message || "Unable to delete expense.");
    } finally {
      setDeletingExpenseId(null);
    }
  }, [handleRefresh]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl mb-2">Expenses</h1>
          <p className="text-muted-foreground">
            Record building operating costs with optional custom categories.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <ManageExpenseCategoriesDialog
            buildings={buildings}
            defaultBuildingId={selectedBuildingId}
            onSuccess={handleRefresh}
          />
          <RecordExpenseDialog
            buildings={buildings}
            defaultBuildingId={selectedBuildingId}
            onSuccess={handleRefresh}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Card>
          <p className="text-sm text-muted-foreground mb-1">Selected Building</p>
          <select
            aria-label="Expense building filter"
            className="w-full rounded-lg border border-border bg-input-background px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
            value={selectedBuildingId}
            onChange={(event) => setSelectedBuildingId(event.target.value)}
          >
            {buildings.map((building) => (
              <option key={building.id} value={building.id}>
                {building.name}
              </option>
            ))}
          </select>
        </Card>
        <Card className="bg-destructive/5 border-destructive/20">
          <p className="text-sm text-muted-foreground mb-1">Total Expenses</p>
          <p className="text-3xl text-destructive">{formatMoney(summary.total)}</p>
        </Card>
        <Card className="bg-warning/5 border-warning/20">
          <p className="text-sm text-muted-foreground mb-1">This Month</p>
          <p className="text-3xl text-warning">{formatMoney(summary.thisMonth)}</p>
        </Card>
        <Card>
          <p className="text-sm text-muted-foreground mb-1">Uncategorized</p>
          <p className="text-3xl">{summary.uncategorized}</p>
        </Card>
      </div>

      <Card>
        {deleteError ? <p className="mb-4 text-sm text-destructive">{deleteError}</p> : null}
        {expensesQuery.loading ? (
          <p className="text-muted-foreground">Loading expenses...</p>
        ) : expenses.length === 0 ? (
          <EmptyState
            title="No expenses yet"
            description="Recorded expenses will appear here once you start tracking operating costs."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-4 py-3 text-left">Date</th>
                  <th className="px-4 py-3 text-left">Title</th>
                  <th className="px-4 py-3 text-left">Category</th>
                  <th className="px-4 py-3 text-left">Vendor</th>
                  <th className="px-4 py-3 text-left">Method</th>
                  <th className="px-4 py-3 text-left">Reference</th>
                  <th className="px-4 py-3 text-left">Recorded By</th>
                  <th className="px-4 py-3 text-left">Amount</th>
                  <th className="px-4 py-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {expenses.map((expense) => (
                  <tr key={expense.id} className="border-b border-border last:border-0 hover:bg-muted/40">
                    <td className="px-4 py-3 text-muted-foreground">{formatDate(expense.expense_date)}</td>
                    <td className="px-4 py-3">
                      <p>{expense.title}</p>
                      {expense.description ? (
                        <p className="text-sm text-muted-foreground">{expense.description}</p>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {expense.category?.name ?? "Uncategorized"}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{expense.vendor_name ?? "—"}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {expense.payment_method ? formatStatusLabel(expense.payment_method) : "—"}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{expense.reference ?? "—"}</td>
                    <td className="px-4 py-3 text-muted-foreground">{expense.recorder?.name ?? "—"}</td>
                    <td className="px-4 py-3">{formatMoney(expense.amount)}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col items-start gap-2">
                        <div className="flex flex-wrap items-center gap-2">
                          {expense.permissions?.can_update ? (
                            <EditExpenseDialog
                              expense={expense}
                              buildings={buildings}
                              onSuccess={handleRefresh}
                            />
                          ) : null}
                          {expense.permissions?.can_delete ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              disabled={deletingExpenseId === expense.id}
                              onClick={() => void handleDelete(expense)}
                            >
                              <Trash2 size={16} className="mr-2" />
                              {deletingExpenseId === expense.id ? "Deleting..." : "Delete"}
                            </Button>
                          ) : null}
                          {!expense.permissions?.can_update && !expense.permissions?.can_delete ? (
                            <span className="text-sm text-muted-foreground">No actions available</span>
                          ) : null}
                        </div>
                        {expense.permissions?.update_denial_reason && !expense.permissions.can_update ? (
                          <p className="text-xs text-muted-foreground">
                            {expense.permissions.update_denial_reason}
                          </p>
                        ) : null}
                        {expense.permissions?.delete_denial_reason && !expense.permissions.can_delete ? (
                          <p className="text-xs text-muted-foreground">
                            {expense.permissions.delete_denial_reason}
                          </p>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
