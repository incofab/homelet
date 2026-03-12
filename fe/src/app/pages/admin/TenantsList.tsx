import { Search, Users, Filter } from 'lucide-react';
import { Card } from '../../components/Card';
import { StatusBadge } from '../../components/StatusBadge';
import { Button } from '../../components/Button';
import { EmptyState } from '../../components/EmptyState';
import { useApiQuery } from '../../hooks/useApiQuery';
import { formatStatusLabel } from '../../lib/format';
import { api } from '../../lib/urls';
import { PaginatedData } from '../../lib/paginatedData';
import { useCallback, useMemo } from 'react';
import type { Tenant } from '../../lib/models';

export function TenantsList() {
  const selectTenants = useCallback((data: unknown) => {
    const raw = PaginatedData.from<Tenant>(data, 'tenants');
    // const items = raw.items.map((tenant) => ({
    //   ...tenant,
    //   active_lease: active_lease,
    // }));
    return raw.items;
    // return items;
  }, []);
  const tenantsQuery = useApiQuery<unknown, Tenant[]>(api.tenants, {
    select: selectTenants,
  });
  const tenants = useMemo(() => tenantsQuery.data ?? [], [tenantsQuery.data]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl mb-2">Tenants</h1>
          <p className="text-muted-foreground">
            Manage tenant accounts and leases
          </p>
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
            description="Tenants will appear here once leases are assigned."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4">Tenant</th>
                  <th className="text-left py-3 px-4">Contact</th>
                  <th className="text-left py-3 px-4">Lease ID</th>
                  <th className="text-left py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody>
                {tenants.map((tenant) => (
                  <tr
                    key={tenant.id}
                    className="border-b border-border last:border-0 hover:bg-muted/50"
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                          <Users size={20} className="text-primary" />
                        </div>
                        <span>{tenant.name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-sm">
                        <p className="text-muted-foreground">{tenant.email}</p>
                        <p className="text-muted-foreground">
                          {tenant.phone ?? '—'}
                        </p>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-muted-foreground">
                      {tenant.active_lease?.id ?? '—'}
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge
                        status={formatStatusLabel(
                          tenant.active_lease?.status ?? 'inactive',
                        )}
                        type="lease"
                      />
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
