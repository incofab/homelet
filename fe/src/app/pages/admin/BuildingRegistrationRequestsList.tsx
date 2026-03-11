import { useCallback, useMemo, useState } from "react";
import { Link } from "react-router";
import { FileText, Filter, MapPin } from "lucide-react";
import { Button } from "../../components/Button";
import { Card } from "../../components/Card";
import { EmptyState } from "../../components/EmptyState";
import { StatusBadge } from "../../components/StatusBadge";
import { useApiQuery } from "../../hooks/useApiQuery";
import { formatStatusLabel } from "../../lib/format";
import { api, routes } from "../../lib/urls";
import { extractRecord } from "../../lib/paginatedData";
import type { BuildingRegistrationRequest } from "../../lib/models";

const STATUS_OPTIONS = ["pending", "approved", "rejected"] as const;

type StatusFilter = (typeof STATUS_OPTIONS)[number];

export function BuildingRegistrationRequestsList() {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("pending");

  const requestsPath = useMemo(() => {
    const query = statusFilter ? `?status=${statusFilter}` : "";
    return `${api.adminBuildingRegistrationRequests}${query}`;
  }, [statusFilter]);

  const selectRequests = useCallback((data: unknown) => {
    return extractRecord<BuildingRegistrationRequest[]>(data, "requests") ?? [];
  }, []);

  const requestsQuery = useApiQuery<unknown, BuildingRegistrationRequest[]>(requestsPath, {
    select: selectRequests,
    deps: [requestsPath],
  });

  const requests = requestsQuery.data ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl mb-2">Building Registration Requests</h1>
          <p className="text-muted-foreground">
            Review building submissions and approve qualified owners.
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
            variant={statusFilter === status ? "default" : "secondary"}
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
            const location = [request.city, request.state, request.country].filter(Boolean).join(", ");
            const ownerName = request.owner_name ?? "Authenticated owner";
            const ownerEmail = request.owner_email ?? "";
            return (
              <Card key={request.id}>
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg">{request.name}</h3>
                      <StatusBadge status={formatStatusLabel(request.status)} type="request" />
                    </div>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <div className="flex items-center gap-2">
                        <MapPin size={16} />
                        <span>{location || "Location unavailable"}</span>
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
