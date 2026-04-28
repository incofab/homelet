import { useCallback, useMemo, useState } from 'react';
import { Link } from 'react-router';
import { FileText, Filter, MapPin } from 'lucide-react';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { EmptyState } from '../../components/EmptyState';
import { StatusBadge } from '../../components/StatusBadge';
import { useApiQuery } from '../../hooks/useApiQuery';
import { formatStatusLabel } from '../../lib/format';
import { api, routes } from '../../lib/urls';
import { PaginatedData, extractRecord } from '../../lib/paginatedData';
import type { BuildingRegistrationRequest } from '../../lib/models';
import type { DashboardContext } from '../../lib/responses';

const STATUS_OPTIONS = ['pending', 'approved', 'rejected'] as const;

type StatusFilter = (typeof STATUS_OPTIONS)[number];

type MeResponse = {
  dashboard_context?: DashboardContext;
};

export function BuildingRegistrationRequestsList() {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('pending');

  const selectProfile = useCallback(
    (data: unknown) => extractRecord<MeResponse>(data),
    [],
  );

  const meQuery = useApiQuery<unknown, MeResponse>(api.authMe, {
    select: selectProfile,
  });

  const isPlatformAdmin =
    meQuery.data?.dashboard_context?.is_platform_admin ?? false;

  const requestsPath = useMemo(() => {
    if (meQuery.loading) return null;
    const basePath = isPlatformAdmin
      ? api.adminBuildingRegistrationRequests
      : api.buildingRegistrationRequests;
    const query = statusFilter ? `?status=${statusFilter}` : '';
    return `${basePath}${query}`;
  }, [isPlatformAdmin, meQuery.loading, statusFilter]);

  const selectRequests = useCallback((data: unknown) => {
    return PaginatedData.from<BuildingRegistrationRequest>(data, 'requests');
  }, []);

  const requestsQuery = useApiQuery<
    unknown,
    PaginatedData<BuildingRegistrationRequest>
  >(requestsPath, {
    select: selectRequests,
    deps: [requestsPath],
  });

  const requests = requestsQuery.data?.items ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl mb-2">Building Registration Requests</h1>
          <p className="text-muted-foreground">
            {isPlatformAdmin
              ? 'Review building submissions and approve qualified owners.'
              : 'Track your submitted building registration requests.'}
          </p>
        </div>
        <Link to={routes.adminBuildingRequestNew}>
          <Button variant="secondary">Register a Building</Button>
        </Link>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        {STATUS_OPTIONS.map((status) => (
          <Button
            key={status}
            variant={statusFilter === status ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setStatusFilter(status)}
          >
            {formatStatusLabel(status)}
          </Button>
        ))}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Filter size={16} />
          <span>Showing {formatStatusLabel(statusFilter)} requests</span>
        </div>
      </div>

      {requestsQuery.loading ? (
        <Card>
          <p className="text-muted-foreground">Loading requests...</p>
        </Card>
      ) : requestsQuery.error ? (
        <Card>
          <p className="text-muted-foreground">{requestsQuery.error}</p>
        </Card>
      ) : requests.length === 0 ? (
        <Card>
          <EmptyState
            icon={<FileText size={28} className="text-muted-foreground" />}
            title="No registration requests"
            description="New building submissions will appear here once submitted."
          />
        </Card>
      ) : (
        <div className="space-y-4">
          {requests.map((request) => {
            const location = [request.city, request.state, request.country]
              .filter(Boolean)
              .join(', ');
            const ownerName = request.owner_name ?? 'Authenticated owner';
            const ownerEmail = request.owner_email ?? '';
            return (
              <Card key={request.id}>
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg">{request.name}</h3>
                      <StatusBadge
                        status={formatStatusLabel(request.status)}
                        type="request"
                      />
                    </div>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <div className="flex items-center gap-2">
                        <MapPin size={16} />
                        <span>{location || 'Location unavailable'}</span>
                      </div>
                      <p>{ownerName}</p>
                      {ownerEmail ? <p>{ownerEmail}</p> : null}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Link to={routes.adminBuildingRequest(request.id)}>
                      <Button size="sm">Review</Button>
                    </Link>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
