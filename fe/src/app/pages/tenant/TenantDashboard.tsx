import { Home, DollarSign, Calendar, AlertCircle } from 'lucide-react';
import { Link } from 'react-router';
import { Card } from '../../components/Card';
import { StatusBadge } from '../../components/StatusBadge';
import { Button } from '../../components/Button';
import { ImageWithFallback } from '../../components/figma/ImageWithFallback';
import { useApiQuery } from '../../hooks/useApiQuery';
import {
  formatDate,
  formatDaysDuration,
  formatMoney,
  formatStatusLabel,
} from '../../lib/format';
import { env } from '../../lib/env';
import { api, routes } from '../../lib/urls';
import { PaginatedData, extractRecord } from '../../lib/paginatedData';
import { useCallback } from 'react';
import type { Payment, UserProfile } from '../../lib/models';
import type { TenantDashboardResponse } from '../../lib/responses';

export function TenantDashboard() {
  const selectMetrics = useCallback(
    (data: unknown) => data as TenantDashboardResponse,
    [],
  );
  const selectPayments = useCallback(
    (data: unknown) => PaginatedData.from<Payment>(data, 'payments'),
    [],
  );
  const selectUser = useCallback(
    (data: unknown) => extractRecord<UserProfile>(data, 'user'),
    [],
  );
  const dashboardQuery = useApiQuery<unknown, TenantDashboardResponse>(
    api.dashboardTenant,
    {
      select: selectMetrics,
    },
  );
  const paymentsQuery = useApiQuery<unknown, PaginatedData<Payment>>(
    api.tenantPayments,
    {
      select: selectPayments,
    },
  );
  const profileQuery = useApiQuery<unknown, UserProfile | null>(api.authMe, {
    select: selectUser,
  });

  const payments = paymentsQuery.data?.items ?? [];
  const lease = dashboardQuery.data?.active_lease;
  const leaseApartment =
    lease?.apartment?.unit_code ?? lease?.apartment_unit ?? 'Unit';
  const leaseBuilding =
    lease?.apartment?.building?.name ?? lease?.building_name ?? 'Building';
  const annualRent = lease?.rent_amount ?? null;

  const recentPayments = payments.slice(0, 3).map((payment) => ({
    id: payment.id,
    amount: formatMoney(payment.amount),
    date: payment.payment_date ? formatDate(payment.payment_date) : '—',
    status: formatStatusLabel(payment.status),
  }));

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl mb-2">
          Welcome Back
          {profileQuery.data?.name
            ? `, ${profileQuery.data.name.split(' ')[0]}!`
            : '!'}
        </h1>
        <p className="text-muted-foreground">Here's your rental overview</p>
      </div>

      {/* Lease Info Card */}
      <Card>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-1">
            <ImageWithFallback
              src={env.placeholderImage}
              alt={leaseApartment}
              className="w-full h-48 object-cover rounded-lg"
            />
          </div>
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-2xl mb-1">{leaseApartment}</h2>
                <p className="text-muted-foreground">{leaseBuilding}</p>
              </div>
              <StatusBadge
                status={formatStatusLabel(lease?.status ?? 'active')}
                type="lease"
              />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">
                  Annual Rent
                </p>
                <p className="text-xl">
                  {annualRent ? formatMoney(annualRent) : '—'}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">
                  Lease Start
                </p>
                <p className="text-xl">
                  {lease?.start_date ? formatDate(lease.start_date) : '—'}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Lease End</p>
                <p className="text-xl">
                  {lease?.end_date ? formatDate(lease.end_date) : '—'}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">
                  Days Remaining
                </p>
                <p className="text-xl text-success">
                  {formatDaysDuration(dashboardQuery.data?.days_to_expiry)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link to={routes.tenantPayments} className="block">
          <Card hover className="text-center">
            <DollarSign size={40} className="mx-auto mb-3 text-primary" />
            <h3 className="text-lg mb-1">Make Payment</h3>
            <p className="text-sm text-muted-foreground">
              Pay your rent online
            </p>
          </Card>
        </Link>
        <Link to={routes.tenantMaintenance} className="block">
          <Card hover className="text-center">
            <AlertCircle size={40} className="mx-auto mb-3 text-primary" />
            <h3 className="text-lg mb-1">Request Maintenance</h3>
            <p className="text-sm text-muted-foreground">Report an issue</p>
          </Card>
        </Link>
        <Link to={routes.tenantChat} className="block">
          <Card hover className="text-center">
            <Home size={40} className="mx-auto mb-3 text-primary" />
            <h3 className="text-lg mb-1">Contact Manager</h3>
            <p className="text-sm text-muted-foreground">Send a message</p>
          </Card>
        </Link>
      </div>

      {/* Next Payment */}
      <Card className="bg-info/5 border-info/20">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Calendar size={24} className="text-info" />
              <h3 className="text-xl">Last Payment</h3>
            </div>
            <p className="text-3xl mb-1">
              {dashboardQuery.data?.last_payment?.amount
                ? formatMoney(dashboardQuery.data.last_payment.amount)
                : '—'}
            </p>
            <p className="text-muted-foreground">
              Paid on{' '}
              {dashboardQuery.data?.last_payment?.payment_date
                ? formatDate(dashboardQuery.data.last_payment.payment_date)
                : '—'}
            </p>
          </div>
          <Link to={routes.tenantPayments}>
            <Button>View Payments</Button>
          </Link>
        </div>
      </Card>

      {/* Payment History */}
      <Card>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl">Recent Payments</h3>
          <Link to={routes.tenantPayments}>
            <Button variant="ghost" size="sm">
              View All
            </Button>
          </Link>
        </div>
        <div className="space-y-3">
          {recentPayments.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No payments recorded yet.
            </p>
          ) : (
            recentPayments.map((payment) => (
              <div
                key={payment.id}
                className="flex items-center justify-between pb-3 border-b border-border last:border-0"
              >
                <div>
                  <p className="mb-1">Payment #{payment.id}</p>
                  <p className="text-sm text-muted-foreground">
                    Paid on {payment.date}
                  </p>
                </div>
                <div className="text-right">
                  <p className="mb-2">{payment.amount}</p>
                  <StatusBadge status={payment.status} type="payment" />
                </div>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}
