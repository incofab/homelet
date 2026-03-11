import { CreditCard, Building2 } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "../../components/Card";
import { StatusBadge } from "../../components/StatusBadge";
import { Button } from "../../components/Button";
import { Input } from "../../components/Input";
import { useCallback, useState } from "react";
import { useApiQuery } from "../../hooks/useApiQuery";
import { formatMoney, formatDate, formatStatusLabel } from "../../lib/format";
import { api } from "../../lib/urls";
import { PaginatedData, extractRecord } from "../../lib/paginatedData";
import type { Payment } from "../../lib/models";
import type { TenantDashboardResponse } from "../../lib/responses";

export function TenantPayments() {
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const selectPayments = useCallback(
    (data: unknown) => PaginatedData.from<Payment>(data, "payments"),
    []
  );
  const selectMetrics = useCallback(
    (data: unknown) => extractRecord<TenantDashboardResponse>(data, "metrics"),
    []
  );
  const paymentsQuery = useApiQuery<unknown, PaginatedData<Payment>>(api.tenantPayments, {
    select: selectPayments,
  });
  const dashboardQuery = useApiQuery<unknown, TenantDashboardResponse>(api.dashboardTenant, {
    select: selectMetrics,
  });

  const paymentHistory = paymentsQuery.data?.items ?? [];

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl mb-2">Payments</h1>
        <p className="text-muted-foreground">Manage your rent payments</p>
      </div>

      {/* Current Balance */}
      <Card className="bg-primary/5 border-primary/20">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <p className="text-sm text-muted-foreground mb-1">Current Balance Due</p>
            <p className="text-4xl mb-2">
              {dashboardQuery.data?.last_payment?.amount ? formatMoney(dashboardQuery.data.last_payment.amount) : "—"}
            </p>
            <p className="text-muted-foreground">
              Due on {dashboardQuery.data?.last_payment?.payment_date ? formatDate(dashboardQuery.data.last_payment.payment_date) : "—"}
            </p>
          </div>
          {!showPaymentForm && (
            <Button size="lg" onClick={() => setShowPaymentForm(true)}>
              <CreditCard size={20} className="mr-2" />
              Make Payment
            </Button>
          )}
        </div>
      </Card>

      {/* Payment Form */}
      {showPaymentForm && (
        <Card>
          <CardHeader>
            <CardTitle>Make a Payment</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-6">
              <div>
                <label className="block text-sm mb-2">Payment Amount</label>
                <input
                  type="text"
                  value={
                    dashboardQuery.data?.last_payment?.amount
                      ? formatMoney(dashboardQuery.data.last_payment.amount)
                      : "—"
                  }
                  disabled
                  className="w-full px-4 py-2 bg-muted border border-border rounded-lg text-2xl"
                />
              </div>

              <div>
                <label className="block text-sm mb-4">Payment Method</label>
                <div className="space-y-3">
                  <label className="flex items-center gap-3 p-4 border border-border rounded-lg cursor-pointer hover:bg-muted/50">
                    <input type="radio" name="payment-method" defaultChecked />
                    <CreditCard size={24} className="text-primary" />
                    <div className="flex-1">
                      <p>Credit/Debit Card</p>
                      <p className="text-sm text-muted-foreground">Visa, Mastercard, Amex</p>
                    </div>
                  </label>
                  <label className="flex items-center gap-3 p-4 border border-border rounded-lg cursor-pointer hover:bg-muted/50">
                    <input type="radio" name="payment-method" />
                    <Building2 size={24} className="text-primary" />
                    <div className="flex-1">
                      <p>Bank Transfer</p>
                      <p className="text-sm text-muted-foreground">ACH Transfer</p>
                    </div>
                  </label>
                </div>
              </div>

              <div className="space-y-4">
                <Input label="Card Number" type="text" placeholder="1234 5678 9012 3456" />
                <div className="grid grid-cols-2 gap-4">
                  <Input label="Expiry Date" type="text" placeholder="MM/YY" />
                  <Input label="CVV" type="text" placeholder="123" />
                </div>
                <Input label="Cardholder Name" type="text" placeholder="Sarah Johnson" />
              </div>

              <div className="flex items-center gap-4 pt-4">
                <Button type="submit" size="lg">Pay Now</Button>
                <Button type="button" variant="ghost" onClick={() => setShowPaymentForm(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Payment History */}
      <Card>
        <CardHeader>
          <CardTitle>Payment History</CardTitle>
        </CardHeader>
        <CardContent>
          {paymentHistory.length === 0 ? (
            <p className="text-sm text-muted-foreground">No payments recorded yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4">Reference</th>
                    <th className="text-left py-3 px-4">Amount</th>
                    <th className="text-left py-3 px-4">Date Paid</th>
                    <th className="text-left py-3 px-4">Method</th>
                    <th className="text-left py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {paymentHistory.map((payment) => (
                    <tr key={payment.id} className="border-b border-border last:border-0">
                      <td className="py-3 px-4">#{payment.id}</td>
                      <td className="py-3 px-4">{formatMoney(payment.amount)}</td>
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
        </CardContent>
      </Card>
    </div>
  );
}
