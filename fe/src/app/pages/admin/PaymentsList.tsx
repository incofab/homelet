import { Search, Filter, Plus } from "lucide-react";
import { Card } from "../../components/Card";
import { StatusBadge } from "../../components/StatusBadge";
import { Button } from "../../components/Button";
import { EmptyState } from "../../components/EmptyState";
import { useApiQuery } from "../../hooks/useApiQuery";
import { formatMoney, formatDate, formatStatusLabel } from "../../lib/format";
import { useCallback, useMemo } from "react";
import { api } from "../../lib/urls";
import { PaginatedData } from "../../lib/paginatedData";
import type { Payment } from "../../lib/models";

export function PaymentsList() {
  const selectPayments = useCallback(
    (data: unknown) => PaginatedData.from<Payment>(data, "payments"),
    []
  );
  const paymentsQuery = useApiQuery<unknown, PaginatedData<Payment>>(api.payments, {
    select: selectPayments,
  });
  const payments = paymentsQuery.data?.items ?? [];

  const summary = useMemo(() => {
    const payments = paymentsQuery.data?.items ?? [];
    const totals = { paid: 0, pending: 0, overdue: 0 };

    payments.forEach((payment) => {
      const status = payment.status?.toLowerCase?.() ?? "";
      if (status === "paid") totals.paid += payment.amount;
      if (status === "pending") totals.pending += payment.amount;
      if (status === "overdue") totals.overdue += payment.amount;
    });

    return totals;
  }, [payments]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl mb-2">Payments</h1>
          <p className="text-muted-foreground">Track rent payments and billing</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="secondary">
            <Filter size={20} className="mr-2" />
            Filter
          </Button>
          <Button>
            <Plus size={20} className="mr-2" />
            Record Payment
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-success/5 border-success/20">
          <p className="text-sm text-muted-foreground mb-1">Collected</p>
          <p className="text-3xl text-success">{formatMoney(summary.paid)}</p>
        </Card>
        <Card className="bg-warning/5 border-warning/20">
          <p className="text-sm text-muted-foreground mb-1">Pending</p>
          <p className="text-3xl text-warning">{formatMoney(summary.pending)}</p>
        </Card>
        <Card className="bg-destructive/5 border-destructive/20">
          <p className="text-sm text-muted-foreground mb-1">Overdue</p>
          <p className="text-3xl text-destructive">{formatMoney(summary.overdue)}</p>
        </Card>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
        <input
          type="text"
          placeholder="Search payments..."
          className="w-full pl-12 pr-4 py-3 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      <Card>
        {paymentsQuery.loading ? (
          <p className="text-muted-foreground">Loading payments...</p>
        ) : payments.length === 0 ? (
          <EmptyState
            icon={<Plus size={28} className="text-muted-foreground" />}
            title="No payments yet"
            description="Payments will appear here once recorded."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4">Tenant</th>
                  <th className="text-left py-3 px-4">Apartment</th>
                  <th className="text-left py-3 px-4">Amount</th>
                  <th className="text-left py-3 px-4">Due Date</th>
                  <th className="text-left py-3 px-4">Paid Date</th>
                  <th className="text-left py-3 px-4">Method</th>
                  <th className="text-left py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((payment) => (
                  <tr key={payment.id} className="border-b border-border last:border-0 hover:bg-muted/50">
                    <td className="py-3 px-4">{payment.tenant?.name ?? "—"}</td>
                    <td className="py-3 px-4 text-muted-foreground">{payment.apartment?.unit_code ?? "—"}</td>
                    <td className="py-3 px-4">{formatMoney(payment.amount)}</td>
                    <td className="py-3 px-4 text-muted-foreground">
                      {payment.due_date ? formatDate(payment.due_date) : "—"}
                    </td>
                    <td className="py-3 px-4 text-muted-foreground">
                      {payment.payment_date ? formatDate(payment.payment_date) : "—"}
                    </td>
                    <td className="py-3 px-4 text-muted-foreground">{payment.method ?? "—"}</td>
                    <td className="py-3 px-4">
                      <StatusBadge status={formatStatusLabel(payment.status)} type="payment" />
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
