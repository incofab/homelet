import { Plus } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "../../components/Card";
import { Button } from "../../components/Button";
import { Input } from "../../components/Input";
import { useCallback, useState } from "react";
import type { FormEvent } from "react";
import { useApiQuery } from "../../hooks/useApiQuery";
import { apiPost } from "../../lib/api";
import { api, routes } from "../../lib/urls";
import { PaginatedData, extractRecord } from "../../lib/paginatedData";
import type { MaintenanceRequest } from "../../lib/models";
import type { MaintenanceRequestResponse, TenantDashboardResponse } from "../../lib/responses";
import { ImageUploadDropzone } from "../../components/ImageUploadDropzone";
import { MaintenanceRequestSummaryCard } from "../../components/MaintenanceRequestSummaryCard";

export function TenantMaintenance() {
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [formState, setFormState] = useState({ title: "", priority: "medium", description: "" });
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
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
  const activeRequests = maintenanceHistory.filter((req) => {
    const status = req.status?.toLowerCase?.() ?? "";
    return status !== "completed" && status !== "resolved";
  });

  const uploadSelectedMedia = async (maintenanceRequestId: number, files: File[]) => {
    for (const file of files) {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("collection", "images");
      await apiPost(api.maintenanceRequestMedia(maintenanceRequestId), formData);
    }
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!activeApartmentId) {
      setFormStatus({ type: "error", message: "No active apartment found for this account." });
      return;
    }
    setSubmitting(true);
    setFormStatus({ type: "idle" });

    try {
      const data = await apiPost<MaintenanceRequestResponse>(api.maintenanceRequests, {
        apartment_id: activeApartmentId,
        title: formState.title,
        description: formState.description,
        priority: formState.priority,
      });

      let successMessage = "Maintenance request submitted.";

      if (selectedFiles.length > 0) {
        try {
          await uploadSelectedMedia(data.maintenance_request.id, selectedFiles);
        } catch {
          successMessage = "Maintenance request submitted, but one or more images could not be uploaded.";
        }
      }

      setFormStatus({ type: "success", message: successMessage });
      setFormState({ title: "", priority: "medium", description: "" });
      setSelectedFiles([]);
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
                <label className="block text-sm mb-2" htmlFor="maintenance-priority">Priority Level</label>
                <select
                  id="maintenance-priority"
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
                <ImageUploadDropzone
                  inputLabel="Maintenance request images"
                  title="Click to upload or drag and drop"
                  helperText="PNG, JPG, or WEBP up to 10MB each"
                  buttonLabel="Choose images"
                  multiple
                  disabled={submitting}
                  selectedFiles={selectedFiles}
                  onFilesSelected={(files) => {
                    setSelectedFiles((current) => [...current, ...files]);
                  }}
                />
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
                <MaintenanceRequestSummaryCard
                  key={request.id}
                  request={request}
                  to={routes.tenantMaintenanceRequest(request.id)}
                />
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
                <MaintenanceRequestSummaryCard
                  key={request.id}
                  request={request}
                  to={routes.tenantMaintenanceRequest(request.id)}
                />
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
