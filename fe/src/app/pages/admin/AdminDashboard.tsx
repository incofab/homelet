import { Building2, Users, DollarSign, Home, TrendingUp, AlertCircle } from "lucide-react";
import { Link } from "react-router";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { MetricCard } from "../../components/MetricCard";
import { Card, CardHeader, CardTitle, CardContent } from "../../components/Card";
import { StatusBadge } from "../../components/StatusBadge";
import { EmptyState } from "../../components/EmptyState";
import { useApiQuery } from "../../hooks/useApiQuery";
import { formatDate, formatMoney, formatStatusLabel } from "../../lib/format";
import { env } from "../../lib/env";
import { useCallback, useMemo } from "react";
import { api, routes } from "../../lib/urls";
import { PaginatedData, extractRecord } from "../../lib/paginatedData";
import type { AdminDashboardResponse } from "../../lib/responses";
import type { Payment } from "../../lib/models";

export function AdminDashboard() {
  const selectMetrics = useCallback(
    (data: unknown) => extractRecord<AdminDashboardResponse>(data, "metrics"),
    []
  );
  const selectPayments = useCallback(
    (data: unknown) => PaginatedData.from<Payment>(data, "payments"),
    []
  );
  const dashboardQuery = useApiQuery<unknown, AdminDashboardResponse>(api.dashboardAdmin, {
    select: selectMetrics,
  });
  const paymentsQuery = useApiQuery<unknown, PaginatedData<Payment>>(api.payments, {
    select: selectPayments,
  });
  const payments = paymentsQuery.data?.items ?? [];

  const counts = dashboardQuery.data?.counts;
  const occupancyRate = counts ? (counts.occupied / Math.max(counts.occupied + counts.vacant, 1)) * 100 : null;

  const occupancyData = useMemo(() => {
    return [
      { name: "Occupied", value: counts?.occupied ?? 0, color: "#16a34a" },
      { name: "Vacant", value: counts?.vacant ?? 0, color: "#2563eb" },
    ];
  }, [counts]);

  const revenueData = useMemo(() => {
    const paidPayments = payments.filter((payment) =>
      ["paid", "success", "completed"].includes(payment.status?.toLowerCase?.() ?? "")
    );

    const buckets = new Map<string, number>();
    paidPayments.forEach((payment) => {
      const rawDate = payment.payment_date ?? payment.paid_at ?? payment.created_at;
      if (!rawDate) return;
      const date = new Date(rawDate);
      if (Number.isNaN(date.getTime())) return;
      const label = date.toLocaleDateString(env.defaultLocale, { month: "short" });
      buckets.set(label, (buckets.get(label) ?? 0) + payment.amount);
    });

    if (buckets.size === 0) return [];

    return Array.from(buckets.entries()).map(([month, revenue]) => ({
      month,
      revenue: env.moneyInKobo ? revenue / 100 : revenue,
    }));
  }, [payments]);

  const pendingPayments = useMemo(() => {
    return payments
      .filter((payment) => ["pending", "overdue"].includes(payment.status?.toLowerCase?.() ?? ""))
      .slice(0, 3)
      .map((payment) => ({
        id: payment.id,
        tenant: payment.tenant?.name ?? "Tenant",
        amount: formatMoney(payment.amount),
        due: payment.due_date ? `Due ${formatDate(payment.due_date)}` : "Pending",
        status: formatStatusLabel(payment.status),
      }));
  }, [payments]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl mb-2">Dashboard</h1>
        <p className="text-muted-foreground">Overview of your property portfolio</p>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total Buildings"
          value={counts?.buildings?.toString() ?? "—"}
          icon={<Building2 size={32} />}
        />
        <MetricCard
          title="Total Units"
          value={counts?.apartments?.toString() ?? "—"}
          icon={<Home size={32} />}
        />
        <MetricCard
          title="Occupancy Rate"
          value={occupancyRate !== null ? `${Math.round(occupancyRate)}%` : "—"}
          icon={<TrendingUp size={32} />}
        />
        <MetricCard
          title="Total Income Paid"
          value={dashboardQuery.data ? formatMoney(dashboardQuery.data.total_income_paid) : "—"}
          icon={<DollarSign size={32} />}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Revenue Trend</CardTitle>
          </CardHeader>
          <CardContent>
            {revenueData.length === 0 ? (
              <EmptyState
                icon={<DollarSign size={28} className="text-muted-foreground" />}
                title="No payment data yet"
                description="Paid payments will appear here once recorded."
              />
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="month" stroke="#64748b" />
                  <YAxis stroke="#64748b" />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "8px" }}
                  />
                  <Bar dataKey="revenue" fill="#2563eb" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Occupancy</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={occupancyData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {occupancyData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex items-center justify-center gap-6 mt-4">
              {occupancyData.map((entry) => (
                <div key={entry.name} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }}></div>
                  <span className="text-sm">{entry.name}: {entry.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alerts & Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Expiring Leases */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Expiring Leases</CardTitle>
              <Link to={routes.adminTenants}>
                <span className="text-sm text-primary hover:underline">View all</span>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {dashboardQuery.loading ? (
              <p className="text-muted-foreground">Loading...</p>
            ) : dashboardQuery.data && dashboardQuery.data.expiring_leases_next_90_days > 0 ? (
              <div className="flex items-center gap-3">
                <AlertCircle size={20} className="text-warning" />
                <p className="text-sm">
                  {dashboardQuery.data.expiring_leases_next_90_days} leases are expiring within the next 90 days.
                </p>
              </div>
            ) : (
              <EmptyState
                icon={<AlertCircle size={28} className="text-muted-foreground" />}
                title="No expiring leases"
                description="Lease renewals will appear here as they approach expiry."
              />
            )}
          </CardContent>
        </Card>

        {/* Pending Payments */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Pending Payments</CardTitle>
              <Link to={routes.adminPayments}>
                <span className="text-sm text-primary hover:underline">View all</span>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {pendingPayments.length === 0 ? (
              <EmptyState
                icon={<Users size={28} className="text-muted-foreground" />}
                title="No pending payments"
                description="All payments are up to date."
              />
            ) : (
              <div className="space-y-4">
                {pendingPayments.map((payment) => (
                  <div key={payment.id} className="flex items-start justify-between pb-4 border-b border-border last:border-0">
                    <div className="flex-1">
                      <span className="block mb-1">{payment.tenant}</span>
                      <p className="text-sm text-muted-foreground">{payment.due}</p>
                    </div>
                    <div className="text-right">
                      <span className="block mb-2">{payment.amount}</span>
                      <StatusBadge status={payment.status} type="payment" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
