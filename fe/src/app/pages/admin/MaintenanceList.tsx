import { Search, Filter } from "lucide-react";
import { Card } from "../../components/Card";
import { StatusBadge } from "../../components/StatusBadge";
import { Button } from "../../components/Button";
import { EmptyState } from "../../components/EmptyState";
import { useApiQuery } from "../../hooks/useApiQuery";
import { formatDate, formatStatusLabel } from "../../lib/format";
import { useCallback, useMemo } from "react";
import { api } from "../../lib/urls";
import { PaginatedData } from "../../lib/paginatedData";
import type { MaintenanceRequest } from "../../lib/models";

export function MaintenanceList() {
  const selectRequests = useCallback(
    (data: unknown) => PaginatedData.from<MaintenanceRequest>(data, "maintenance_requests"),
    []
  );
  const requestsQuery = useApiQuery<unknown, PaginatedData<MaintenanceRequest>>(api.maintenanceRequests, {
    select: selectRequests,
  });
  const requests = requestsQuery.data?.items ?? [];

  const summary = useMemo(() => {
    const totals = { pending: 0, in_progress: 0, completed: 0 };
    requests.forEach((request) => {
      const status = request.status?.toLowerCase?.() ?? "";
      if (status === "pending") totals.pending += 1;
      if (status === "in_progress" || status === "in progress") totals.in_progress += 1;
      if (status === "completed") totals.completed += 1;
    });
    return totals;
  }, [requests]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl mb-2">Maintenance Requests</h1>
          <p className="text-muted-foreground">Manage and track maintenance issues</p>
        </div>
        <Button variant="secondary">
          <Filter size={20} className="mr-2" />
          Filter
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <p className="text-sm text-muted-foreground mb-1">Pending</p>
          <p className="text-3xl text-warning">{summary.pending}</p>
        </Card>
        <Card>
          <p className="text-sm text-muted-foreground mb-1">In Progress</p>
          <p className="text-3xl text-info">{summary.in_progress}</p>
        </Card>
        <Card>
          <p className="text-sm text-muted-foreground mb-1">Completed</p>
          <p className="text-3xl text-success">{summary.completed}</p>
        </Card>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
        <input
          type="text"
          placeholder="Search maintenance requests..."
          className="w-full pl-12 pr-4 py-3 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      <div className="space-y-4">
        {requestsQuery.loading ? (
          <Card>
            <p className="text-muted-foreground">Loading requests...</p>
          </Card>
        ) : requests.length === 0 ? (
          <Card>
            <EmptyState
              icon={<Filter size={28} className="text-muted-foreground" />}
              title="No maintenance requests"
              description="Requests will show up here as tenants submit them."
            />
          </Card>
        ) : (
          requests.map((request) => (
            <Card key={request.id} hover>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-start gap-3 mb-2">
                    <div>
                      <h3 className="text-lg mb-1">{request.title ?? "Maintenance request"}</h3>
                      <p className="text-sm text-muted-foreground">
                        {request.tenant?.name ?? "Tenant"} · {request.apartment?.unit_code ?? "Unit"} · {request.apartment?.building?.name ?? "Building"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-muted-foreground">Submitted: {request.created_at ? formatDate(request.created_at) : "—"}</span>
                    <span className={`px-2 py-1 rounded ${
                      request.priority?.toLowerCase?.() === "high"
                        ? "bg-destructive/10 text-destructive"
                        : request.priority?.toLowerCase?.() === "medium"
                          ? "bg-warning/10 text-warning"
                          : "bg-muted text-muted-foreground"
                    }`}>
                      {(request.priority ?? "Low")} Priority
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <StatusBadge status={formatStatusLabel(request.status)} type="maintenance" />
                  <Button variant="secondary" size="sm">Update</Button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
