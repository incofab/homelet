import { useParams } from 'react-router';
import { Button } from './Button';
import { Card, CardContent, CardHeader, CardTitle } from './Card';
import { StatusBadge } from './StatusBadge';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { AppBreadcrumbs } from './AppBreadcrumbs';
import { useApiQuery } from '../hooks/useApiQuery';
import { apiPut } from '../lib/api';
import { api } from '../lib/urls';
import { extractRecord } from '../lib/paginatedData';
import { formatDate, formatStatusLabel } from '../lib/format';
import type { MaintenanceRequest } from '../lib/models';
import type { MaintenanceRequestResponse } from '../lib/responses';
import { useCallback, useState } from 'react';

interface MaintenanceRequestDetailViewProps {
  parentTo: string;
  parentLabel: string;
  canUpdateStatus?: boolean;
}

const STATUS_ACTIONS = [
  { status: 'open', label: 'Mark Open' },
  { status: 'in_progress', label: 'Start Progress' },
  { status: 'resolved', label: 'Mark Resolved' },
];

const confirmStatusUpdate = (status: string) =>
  window.confirm(
    `Update this maintenance request to ${formatStatusLabel(status)}?`,
  );

export function MaintenanceRequestDetailView({
  parentTo,
  parentLabel,
  canUpdateStatus = false,
}: MaintenanceRequestDetailViewProps) {
  const { id } = useParams();
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  const [statusError, setStatusError] = useState<string | null>(null);
  const selectRequest = useCallback(
    (data: unknown) =>
      extractRecord<MaintenanceRequest>(data, 'maintenance_request'),
    [],
  );
  const requestQuery = useApiQuery<unknown, MaintenanceRequest>(
    id ? api.maintenanceRequest(id) : null,
    {
      enabled: Boolean(id),
      deps: [id],
      select: selectRequest,
    },
  );
  const request = requestQuery.data;
  const normalizedStatus = request?.status?.toLowerCase?.() ?? '';

  const updateStatus = async (status: string) => {
    if (!id || updatingStatus) {
      return;
    }

    setUpdatingStatus(status);
    setStatusError(null);

    try {
      await apiPut<MaintenanceRequestResponse>(api.maintenanceRequest(id), {
        status,
      });
      await requestQuery.refetch();
    } catch (error) {
      setStatusError(
        (error as Error).message ||
          'Unable to update maintenance request status.',
      );
    } finally {
      setUpdatingStatus(null);
    }
  };

  return (
    <div className="max-w-5xl space-y-6">
      <AppBreadcrumbs
        items={[
          { label: parentLabel, to: parentTo },
          { label: request?.title ?? 'Maintenance Request' },
        ]}
      />

      {requestQuery.loading ? (
        <Card>
          <p className="text-muted-foreground">
            Loading maintenance request...
          </p>
        </Card>
      ) : requestQuery.error ? (
        <Card>
          <p className="text-destructive">{requestQuery.error}</p>
        </Card>
      ) : !request ? (
        <Card>
          <p className="text-muted-foreground">
            Maintenance request not found.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <Card>
              <div className="mb-4 flex items-start justify-between gap-4">
                <div>
                  <h1 className="mb-2 text-3xl">
                    {request.title ?? 'Maintenance request'}
                  </h1>
                  <p className="text-muted-foreground">
                    {request.apartment?.unit_code ?? 'Unit'} ·{' '}
                    {request.apartment?.building?.name ?? 'Building'}
                  </p>
                </div>
                <StatusBadge
                  status={formatStatusLabel(request.status)}
                  type="maintenance"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 border-y border-border py-4 md:grid-cols-3">
                <div>
                  <p className="mb-1 text-sm text-muted-foreground">Priority</p>
                  <p>{formatStatusLabel(request.priority ?? 'low')}</p>
                </div>
                <div>
                  <p className="mb-1 text-sm text-muted-foreground">
                    Submitted
                  </p>
                  <p>
                    {request.created_at ? formatDate(request.created_at) : '—'}
                  </p>
                </div>
                <div>
                  <p className="mb-1 text-sm text-muted-foreground">Tenant</p>
                  <p>{request.tenant?.name ?? '—'}</p>
                </div>
              </div>

              <div className="mt-6">
                <h2 className="mb-3 text-xl">Description</h2>
                <p className="whitespace-pre-line text-muted-foreground">
                  {request.description || 'No description provided.'}
                </p>
              </div>
            </Card>

            {canUpdateStatus ? (
              <Card>
                <h2 className="mb-3 text-xl">Update Status</h2>
                <p className="mb-4 text-sm text-muted-foreground">
                  Move this request through the maintenance workflow.
                </p>
                <div className="flex flex-wrap gap-3">
                  {STATUS_ACTIONS.map((action) => (
                    <Button
                      key={action.status}
                      type="button"
                      variant={
                        action.status === 'resolved' ? 'secondary' : 'primary'
                      }
                      size="sm"
                      disabled={
                        updatingStatus !== null ||
                        normalizedStatus === action.status
                      }
                      onClick={() => {
                        if (!confirmStatusUpdate(action.status)) {
                          return;
                        }
                        void updateStatus(action.status);
                      }}
                    >
                      {updatingStatus === action.status
                        ? 'Updating...'
                        : action.label}
                    </Button>
                  ))}
                </div>
                {statusError ? (
                  <p className="mt-3 text-sm text-destructive">{statusError}</p>
                ) : null}
              </Card>
            ) : null}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Uploaded Images</CardTitle>
            </CardHeader>
            <CardContent>
              {request.media?.length ? (
                <div className="grid grid-cols-1 gap-4">
                  {request.media.map((item, index) => (
                    <ImageWithFallback
                      key={item.id}
                      src={item.url}
                      alt={`Maintenance request image ${index + 1}`}
                      className="h-48 w-full rounded-lg object-cover"
                    />
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No images uploaded.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
