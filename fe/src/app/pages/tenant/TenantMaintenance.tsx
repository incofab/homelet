import { Plus, Upload } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "../../components/Card";
import { StatusBadge } from "../../components/StatusBadge";
import { Button } from "../../components/Button";
import { Input } from "../../components/Input";
import { useCallback, useState } from "react";
import type { FormEvent } from "react";
import { useApiQuery } from "../../hooks/useApiQuery";
import { apiPost } from "../../lib/api";
import { formatDate, formatStatusLabel } from "../../lib/format";
import { api } from "../../lib/urls";
import { PaginatedData, extractRecord } from "../../lib/paginatedData";
import type { MaintenanceRequest } from "../../lib/models";
import type { TenantDashboardResponse } from "../../lib/responses";

export function TenantMaintenance() {
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [formState, setFormState] = useState({ title: "", priority: "medium", description: "" });
  const [formStatus, setFormStatus] = useState<{ type: "idle" | "error" | "success"; message?: string }>(
    { type: "idle" }
  );
  const [submitting, setSubmitting] = useState(false);

  const selectRequests = useCallback(
    (data: unknown) => PaginatedData.from<MaintenanceRequest>(data, "maintenance_requests"),
    []
  );
  const selectMetrics = useCallback(
    (data: unknown) => extractRecord<TenantDashboardResponse>(data, "metrics"),
    []
  );
  const requestsQuery = useApiQuery<unknown, PaginatedData<MaintenanceRequest>>(api.maintenanceRequests, {
    select: selectRequests,
  });
  const dashboardQuery = useApiQuery<unknown, TenantDashboardResponse>(api.dashboardTenant, {
    select: selectMetrics,
  });

  const activeApartmentId =
    dashboardQuery.data?.active_lease?.apartment_id ?? dashboardQuery.data?.active_lease?.apartment?.id;

  const maintenanceHistory = requestsQuery.data?.items ?? [];
  const activeRequests = maintenanceHistory.filter((req) => req.status?.toLowerCase?.() !== "completed");

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!activeApartmentId) {
      setFormStatus({ type: "error", message: "No active apartment found for this account." });
      return;
    }
    setSubmitting(true);
    setFormStatus({ type: "idle" });

    try {
      await apiPost(api.maintenanceRequests, {
        apartment_id: activeApartmentId,
        title: formState.title,
        description: formState.description,
      });
      setFormStatus({ type: "success", message: "Maintenance request submitted." });
      setFormState({ title: "", priority: "medium", description: "" });
      setShowRequestForm(false);
      await requestsQuery.refetch();
    } catch (error) {
      setFormStatus({ type: "error", message: (error as Error).message || "Unable to submit request." });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl mb-2">Maintenance Requests</h1>
          <p className="text-muted-foreground">Request and track repairs</p>
        </div>
        {!showRequestForm && (
          <Button onClick={() => setShowRequestForm(true)}>
            <Plus size={20} className="mr-2" />
            New Request
          </Button>
        )}
      </div>

      {/* Request Form */}
      {showRequestForm && (
        <Card>
          <CardHeader>
            <CardTitle>Submit Maintenance Request</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-6" onSubmit={handleSubmit}>
              <Input
                label="Issue Summary"
                type="text"
                placeholder="Brief description of the issue"
                required
                value={formState.title}
                onChange={(event) => setFormState((prev) => ({ ...prev, title: event.target.value }))}
              />

              <div>
                <label className="block text-sm mb-2">Priority Level</label>
                <select
                  className="w-full px-4 py-2 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  value={formState.priority}
                  onChange={(event) => setFormState((prev) => ({ ...prev, priority: event.target.value }))}
                >
                  <option value="low">Low - Can wait</option>
                  <option value="medium">Medium - Soon</option>
                  <option value="high">High - Urgent</option>
                </select>
              </div>

              <div>
                <label className="block text-sm mb-2">Detailed Description</label>
                <textarea
                  className="w-full px-4 py-2 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  rows={4}
                  placeholder="Please provide as much detail as possible..."
                  required
                  value={formState.description}
                  onChange={(event) => setFormState((prev) => ({ ...prev, description: event.target.value }))}
                />
              </div>

              <div>
                <label className="block text-sm mb-2">Upload Photos (Optional)</label>
                <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary transition-colors cursor-pointer">
                  <Upload size={40} className="mx-auto mb-3 text-muted-foreground" />
                  <p className="text-muted-foreground">Click to upload or drag and drop</p>
                  <p className="text-sm text-muted-foreground mt-1">PNG, JPG up to 10MB each</p>
                </div>
              </div>

              {formStatus.type === "error" && (
                <p className="text-sm text-destructive">{formStatus.message}</p>
              )}

              <div className="flex items-center gap-4 pt-4">
                <Button type="submit" disabled={submitting}>
                  {submitting ? "Submitting..." : "Submit Request"}
                </Button>
                <Button type="button" variant="ghost" onClick={() => setShowRequestForm(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {formStatus.type === "success" && (
        <Card>
          <p className="text-success">{formStatus.message}</p>
        </Card>
      )}

      {/* Active Requests */}
      <Card>
        <CardHeader>
          <CardTitle>Active Requests</CardTitle>
        </CardHeader>
        <CardContent>
          {activeRequests.length > 0 ? (
            <div className="space-y-4">
              {activeRequests.map((request) => (
                <div key={request.id} className="p-4 border border-border rounded-lg">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h4 className="text-lg mb-1">{request.title ?? "Maintenance request"}</h4>
                      <p className="text-sm text-muted-foreground">Submitted: {request.created_at ? formatDate(request.created_at) : "—"}</p>
                    </div>
                    <StatusBadge status={formatStatusLabel(request.status)} type="maintenance" />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-1 rounded ${
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
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No active maintenance requests</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Request History */}
      <Card>
        <CardHeader>
          <CardTitle>Request History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {maintenanceHistory.length === 0 ? (
              <p className="text-muted-foreground">No maintenance history yet.</p>
            ) : (
              maintenanceHistory.map((request) => (
                <div key={request.id} className="flex items-center justify-between pb-3 border-b border-border last:border-0">
                  <div className="flex-1">
                    <p className="mb-1">{request.title ?? "Maintenance request"}</p>
                    <p className="text-sm text-muted-foreground">{request.created_at ? formatDate(request.created_at) : "—"}</p>
                  </div>
                  <StatusBadge status={formatStatusLabel(request.status)} type="maintenance" />
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
