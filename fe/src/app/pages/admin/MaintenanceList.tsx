import { Search, Filter } from "lucide-react";
import { Card } from "../../components/Card";
import { Button } from "../../components/Button";
import { EmptyState } from "../../components/EmptyState";
import { useApiQuery } from "../../hooks/useApiQuery";
import { useCallback, useMemo } from "react";
import { api, routes } from "../../lib/urls";
import { PaginatedData } from "../../lib/paginatedData";
import type { MaintenanceRequest } from "../../lib/models";
import { MaintenanceRequestSummaryCard } from "../../components/MaintenanceRequestSummaryCard";

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
      if (status === "pending" || status === "open") totals.pending += 1;
      if (status === "in_progress" || status === "in progress") totals.in_progress += 1;
      if (status === "completed" || status === "resolved") totals.completed += 1;
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
            <MaintenanceRequestSummaryCard
              key={request.id}
              request={request}
              to={routes.adminMaintenanceRequest(request.id)}
              showContext
            />
          ))
        )}
      </div>
    </div>
  );
}
