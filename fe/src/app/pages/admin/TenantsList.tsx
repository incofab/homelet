import { Search, Users, Filter } from 'lucide-react';
import { Card } from '../../components/Card';
import { StatusBadge } from '../../components/StatusBadge';
import { Button } from '../../components/Button';
import { EmptyState } from '../../components/EmptyState';
import { useApiQuery } from '../../hooks/useApiQuery';
import {
  formatDate,
  formatDaysDuration,
  formatStatusLabel,
} from '../../lib/format';
import { api, routes } from '../../lib/urls';
import { PaginatedData, extractRecord } from '../../lib/paginatedData';
import { useCallback, useMemo } from 'react';
import { Link, useParams } from 'react-router';
import type { Building, Tenant } from '../../lib/models';

export function TenantsList() {
  const { buildingId } = useParams();
  const tenantsEndpoint = buildingId
    ? api.buildingTenants(buildingId)
    : api.tenants;
  const selectTenants = useCallback((data: unknown) => {
    const raw = PaginatedData.from<Tenant>(data, 'tenants');
    return raw.items;
  }, []);
  const selectBuilding = useCallback(
    (data: unknown) => extractRecord<Building>(data, 'building'),
    [],
  );
  const tenantsQuery = useApiQuery<unknown, Tenant[]>(tenantsEndpoint, {
    deps: [tenantsEndpoint],
    select: selectTenants,
  });
  const buildingQuery = useApiQuery<unknown, Building | null>(
    buildingId ? api.building(buildingId) : null,
    {
      enabled: Boolean(buildingId),
      deps: [buildingId],
      select: selectBuilding,
    },
  );
  const tenants = useMemo(() => tenantsQuery.data ?? [], [tenantsQuery.data]);
  const pageTitle = buildingId
    ? `${buildingQuery.data?.name ?? 'Building'} Tenants`
    : 'Tenants';
  const pageDescription = buildingId
    ? 'Tenants and lease status for this building.'
    : 'Manage tenant accounts and leases';

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl mb-2">{pageTitle}</h1>
          <p className="text-muted-foreground">{pageDescription}</p>
        </div>
        <Button variant="secondary">
          <Filter size={20} className="mr-2" />
          Filter
        </Button>
      </div>

      <div className="relative">
        <Search
          className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          size={20}
        />
        <input
          type="text"
          placeholder="Search tenants..."
          className="w-full pl-12 pr-4 py-3 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      <Card>
        {tenantsQuery.loading ? (
          <p className="text-muted-foreground">Loading tenants...</p>
        ) : tenants.length === 0 ? (
          <EmptyState
            icon={<Users size={28} className="text-muted-foreground" />}
            title="No tenants yet"
            description="Add your first tenant from a vacant apartment, or share a rental request link and approve the request when they apply."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4">Tenant</th>
                  <th className="text-left py-3 px-4">Contact</th>
                  <th className="text-left py-3 px-4">Unit</th>
                  <th className="text-left py-3 px-4">Status</th>
                  <th className="text-left py-3 px-4">Days Remaining</th>
                  <th className="text-left py-3 px-4">Next Due Date</th>
                  <th className="text-left py-3 px-4">Days Exceeded</th>
                </tr>
              </thead>
              <tbody>
                {tenants.map((tenant) => {
                  const lease = tenant.current_lease;
                  const leaseStatus =
                    lease?.status ?? tenant.active_lease?.status;

                  return (
                    <tr
                      key={tenant.id}
                      className="border-b border-border last:border-0 hover:bg-muted/50"
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                            <Users size={20} className="text-primary" />
                          </div>
                          <Link
                            to={routes.adminTenant(tenant.id)}
                            className="hover:underline"
                          >
                            {tenant.name}
                          </Link>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-sm">
                          <p className="text-muted-foreground">
                            {tenant.email ?? '—'}
                          </p>
                          <p className="text-muted-foreground">
                            {tenant.phone ?? '—'}
                          </p>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-muted-foreground">
                        {lease?.apartment?.unit_code ?? '—'}
                      </td>
                      <td className="py-3 px-4">
                        <StatusBadge
                          status={formatStatusLabel(leaseStatus ?? 'inactive')}
                          type="lease"
                        />
                      </td>
                      <td className="py-3 px-4 text-muted-foreground">
                        {'days_remaining' in (lease ?? {}) &&
                        typeof lease?.days_remaining === 'number'
                          ? formatDaysDuration(lease.days_remaining)
                          : '—'}
                      </td>
                      <td className="py-3 px-4 text-muted-foreground">
                        {'next_due_date' in (lease ?? {})
                          ? formatDate(lease?.next_due_date)
                          : '—'}
                      </td>
                      <td className="py-3 px-4 text-muted-foreground">
                        {'days_exceeded' in (lease ?? {}) &&
                        typeof lease?.days_exceeded === 'number'
                          ? formatDaysDuration(lease.days_exceeded)
                          : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
