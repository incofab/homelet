import { useCallback, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router';
import { Mail, Phone, Wallet, CalendarRange, RefreshCcw } from 'lucide-react';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { StatusBadge } from '../../components/StatusBadge';
import { useApiQuery } from '../../hooks/useApiQuery';
import { formatDate, formatMoney, formatStatusLabel } from '../../lib/format';
import type {
  Lease,
  Payment,
  TenantBalanceSummary,
  TenantDetail as TenantDetailModel,
} from '../../lib/models';
import { api, routes } from '../../lib/urls';
import { ExtendLeaseDialog } from './ExtendLeaseDialog';
import { RenewLeaseDialog } from './RenewLeaseDialog';
import { AppBreadcrumbs } from '../../components/AppBreadcrumbs';

type TenantDetailData = {
  tenant: TenantDetailModel | null;
  leases: Lease[];
  payments: Payment[];
  balance: TenantBalanceSummary;
};

const selectTenantDetail = (data: unknown): TenantDetailData => {
  const record = (data ?? {}) as Record<string, unknown>;

  return {
    tenant: (record.tenant as TenantDetailModel | null) ?? null,
    leases: Array.isArray(record.leases) ? (record.leases as Lease[]) : [],
    payments: Array.isArray(record.payments)
      ? (record.payments as Payment[])
      : [],
    balance: {
      total_lease_rent:
        typeof (record.balance as TenantBalanceSummary | undefined)
          ?.total_lease_rent === 'number'
          ? (record.balance as TenantBalanceSummary).total_lease_rent
          : 0,
      total_paid:
        typeof (record.balance as TenantBalanceSummary | undefined)
          ?.total_paid === 'number'
          ? (record.balance as TenantBalanceSummary).total_paid
          : 0,
      outstanding_balance:
        typeof (record.balance as TenantBalanceSummary | undefined)
          ?.outstanding_balance === 'number'
          ? (record.balance as TenantBalanceSummary).outstanding_balance
          : 0,
    },
  };
};

export function TenantDetail() {
  const { id } = useParams();
  const [selectedLease, setSelectedLease] = useState<Lease | null>(null);
  const [dialog, setDialog] = useState<'extend' | 'renew' | null>(null);

  const detailQuery = useApiQuery<unknown, TenantDetailData>(
    id ? api.tenant(id) : null,
    {
      enabled: Boolean(id),
      deps: [id],
      select: selectTenantDetail,
    },
  );

  const tenant = detailQuery.data?.tenant ?? null;
  const leases = detailQuery.data?.leases ?? [];
  const payments = detailQuery.data?.payments ?? [];
  const balance = detailQuery.data?.balance ?? {
    total_lease_rent: 0,
    total_paid: 0,
    outstanding_balance: 0,
  };

  const sortedLeases = useMemo(
    () =>
      [...leases].sort((left, right) => {
        const leftDate = left.end_date ? new Date(left.end_date).getTime() : 0;
        const rightDate = right.end_date
          ? new Date(right.end_date).getTime()
          : 0;

        if (rightDate !== leftDate) {
          return rightDate - leftDate;
        }

        return right.id - left.id;
      }),
    [leases],
  );

  const latestRenewableLeaseIds = useMemo(() => {
    const ids = new Set<number>();
    const seenBuildings = new Set<number | string>();

    sortedLeases.forEach((lease) => {
      const buildingKey =
        lease.apartment?.building?.id ?? `unknown-${lease.apartment_id}`;

      if (seenBuildings.has(buildingKey)) {
        return;
      }

      seenBuildings.add(buildingKey);
      ids.add(lease.id);
    });

    return ids;
  }, [sortedLeases]);

  const openDialog = (type: 'extend' | 'renew', lease: Lease) => {
    setSelectedLease(lease);
    setDialog(type);
  };

  const closeDialog = () => {
    setDialog(null);
    setSelectedLease(null);
  };

  const handleLeaseUpdated = useCallback(async () => {
    await detailQuery.refetch();
  }, [detailQuery]);

  return (
    <div className="space-y-6">
      <AppBreadcrumbs
        items={[
          { label: 'Tenants', to: routes.adminTenants },
          { label: tenant?.name ?? 'Tenant' },
        ]}
      />

      {detailQuery.loading ? (
        <Card>
          <p className="text-muted-foreground">Loading tenant details...</p>
        </Card>
      ) : !tenant ? (
        <Card>
          <p className="text-muted-foreground">Tenant not found.</p>
        </Card>
      ) : (
        <>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <h1 className="text-3xl mb-2">{tenant.name}</h1>
              <div className="flex flex-col gap-2 text-sm text-muted-foreground sm:flex-row sm:items-center sm:gap-4">
                <span className="flex items-center gap-2">
                  <Mail size={16} />
                  {tenant.email ?? '—'}
                </span>
                <span className="flex items-center gap-2">
                  <Phone size={16} />
                  {tenant.phone ?? '—'}
                </span>
              </div>
            </div>
            <Button
              variant="secondary"
              onClick={() => void detailQuery.refetch()}
            >
              <RefreshCcw size={18} className="mr-2" />
              Refresh
            </Button>
          </div>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.8fr,1fr]">
            <div className="space-y-6">
              <Card>
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <h2 className="text-xl">Lease History</h2>
                    <p className="text-sm text-muted-foreground">
                      Extend active leases and create renewals for active or
                      expired ones.
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  {sortedLeases.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No leases found for this tenant.
                    </p>
                  ) : (
                    sortedLeases.map((lease) => (
                      <div
                        key={lease.id}
                        className="rounded-xl border border-border bg-muted/20 p-4"
                      >
                        <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                          <div>
                            <h3 className="text-lg">
                              {lease.apartment?.unit_code ?? 'Unit'} ·{' '}
                              {lease.apartment?.building?.name ?? 'Building'}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              Lease #{lease.id}
                            </p>
                          </div>
                          <StatusBadge
                            status={formatStatusLabel(lease.status)}
                            type="lease"
                          />
                        </div>

                        <div className="grid grid-cols-1 gap-3 text-sm md:grid-cols-3">
                          <div>
                            <p className="mb-1 text-muted-foreground">
                              Start Date
                            </p>
                            <p>{formatDate(lease.start_date)}</p>
                          </div>
                          <div>
                            <p className="mb-1 text-muted-foreground">
                              End Date
                            </p>
                            <p>{formatDate(lease.end_date)}</p>
                          </div>
                          <div>
                            <p className="mb-1 text-muted-foreground">Rent</p>
                            <p>{formatMoney(lease.rent_amount)}</p>
                          </div>
                        </div>

                        <div className="mt-4 flex flex-wrap gap-3">
                          {lease.status === 'active' ? (
                            <Button
                              variant="secondary"
                              onClick={() => openDialog('extend', lease)}
                            >
                              <CalendarRange size={18} className="mr-2" />
                              Extend Lease
                            </Button>
                          ) : null}
                          {(lease.status === 'active' ||
                            lease.status === 'expired') &&
                          latestRenewableLeaseIds.has(lease.id) ? (
                            <Button onClick={() => openDialog('renew', lease)}>
                              <RefreshCcw size={18} className="mr-2" />
                              Renew Lease
                            </Button>
                          ) : null}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </Card>
            </div>

            <div className="space-y-6">
              <Card>
                <h2 className="mb-4 text-xl">Payments</h2>
                <div className="space-y-3">
                  {payments.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No payments recorded yet.
                    </p>
                  ) : (
                    payments.slice(0, 5).map((payment) => (
                      <div
                        key={payment.id}
                        className="flex items-start justify-between gap-4 rounded-xl border border-border bg-muted/20 p-4"
                      >
                        <div>
                          <p className="font-medium">
                            {formatMoney(payment.amount)}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {formatDate(
                              payment.payment_date ?? payment.created_at,
                            )}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {payment.method ?? 'Manual'}
                          </p>
                        </div>
                        <StatusBadge
                          status={formatStatusLabel(payment.status)}
                          type="payment"
                        />
                      </div>
                    ))
                  )}
                </div>
              </Card>

              <Card>
                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-primary/10 p-3">
                    <Wallet size={20} className="text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Outstanding Balance
                    </p>
                    <p className="text-2xl">
                      {formatMoney(balance.outstanding_balance)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Paid {formatMoney(balance.total_paid)} of{' '}
                      {formatMoney(balance.total_lease_rent)}
                    </p>
                  </div>
                </div>
              </Card>

              <Card>
                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-primary/10 p-3">
                    <CalendarRange size={20} className="text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Lease Count</p>
                    <p className="text-2xl">{leases.length}</p>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </>
      )}

      {selectedLease && dialog === 'extend' ? (
        <ExtendLeaseDialog
          lease={selectedLease}
          open
          onOpenChange={(nextOpen) => {
            if (!nextOpen) {
              closeDialog();
            }
          }}
          onSuccess={handleLeaseUpdated}
        />
      ) : null}

      {selectedLease && dialog === 'renew' ? (
        <RenewLeaseDialog
          lease={selectedLease}
          open
          onOpenChange={(nextOpen) => {
            if (!nextOpen) {
              closeDialog();
            }
          }}
          onSuccess={handleLeaseUpdated}
        />
      ) : null}
    </div>
  );
}
