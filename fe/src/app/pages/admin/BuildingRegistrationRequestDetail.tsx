import { useCallback, useState } from "react";
import { Link, useParams } from "react-router";
import { ArrowLeft, Mail, Phone, MapPin, Building2 } from "lucide-react";
import { Button } from "../../components/Button";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/Card";
import { StatusBadge } from "../../components/StatusBadge";
import { useApiQuery } from "../../hooks/useApiQuery";
import { apiPost } from "../../lib/api";
import { formatDate, formatMoney, formatStatusLabel } from "../../lib/format";
import { api, routes } from "../../lib/urls";
import { extractRecord } from "../../lib/paginatedData";
import type { BuildingRegistrationRequest } from "../../lib/models";
import type { BuildingRegistrationApproveResponse, BuildingRegistrationRequestResponse } from "../../lib/responses";

export function BuildingRegistrationRequestDetail() {
  const { id } = useParams();
  const [rejectionReason, setRejectionReason] = useState("");
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [approving, setApproving] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [approvedBuildingId, setApprovedBuildingId] = useState<number | null>(null);

  const selectRequest = useCallback(
    (data: unknown) => extractRecord<BuildingRegistrationRequest>(data, "request"),
    []
  );

  const requestQuery = useApiQuery<unknown, BuildingRegistrationRequest | null>(
    id ? api.adminBuildingRegistrationRequest(id) : null,
    {
      enabled: Boolean(id),
      deps: [id],
      select: selectRequest,
    }
  );

  const request = requestQuery.data;
  const status = request?.status?.toLowerCase?.() ?? "";
  const location = request
    ? [request.address_line1, request.address_line2, request.city, request.state, request.country]
        .filter(Boolean)
        .join(", ")
    : "";

  const handleApprove = async () => {
    if (!id || approving) return;
    setActionMessage(null);
    setActionError(null);
    setApproving(true);
    try {
      const data = await apiPost<BuildingRegistrationApproveResponse>(
        api.adminBuildingRegistrationApprove(id)
      );
      if (data.building?.id) setApprovedBuildingId(data.building.id);
      setActionMessage("Request approved. The building has been created.");
      await requestQuery.refetch();
    } catch (error) {
      setActionError((error as Error).message || "Unable to approve request.");
    } finally {
      setApproving(false);
    }
  };

  const handleReject = async () => {
    if (!id || rejecting) return;
    if (!rejectionReason.trim()) {
      setActionError("Please provide a rejection reason.");
      return;
    }
    setActionMessage(null);
    setActionError(null);
    setRejecting(true);
    try {
      await apiPost<BuildingRegistrationRequestResponse>(
        api.adminBuildingRegistrationReject(id),
        { rejection_reason: rejectionReason }
      );
      setActionMessage("Request rejected.");
      await requestQuery.refetch();
    } catch (error) {
      setActionError((error as Error).message || "Unable to reject request.");
    } finally {
      setRejecting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link to={routes.adminBuildingRequests}>
          <Button variant="ghost" size="sm">
            <ArrowLeft size={20} className="mr-2" />
            Back
          </Button>
        </Link>
      </div>

      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl mb-2">Building Registration Request</h1>
          <p className="text-muted-foreground">Review submission details and take action.</p>
        </div>
        {request ? (
          <StatusBadge status={formatStatusLabel(request.status)} type="request" />
        ) : null}
      </div>

      {requestQuery.loading ? (
        <Card>
          <p className="text-muted-foreground">Loading request...</p>
        </Card>
      ) : !request ? (
        <Card>
          <p className="text-muted-foreground">Request not found.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Building Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h2 className="text-2xl mb-1">{request.name}</h2>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin size={16} />
                    <span>{location || "Location unavailable"}</span>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Description</p>
                  <p>{request.description || "No description provided."}</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">For Sale</p>
                    <p>{request.for_sale ? "Yes" : "No"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Sale Price</p>
                    <p>{request.for_sale ? formatMoney(request.sale_price ?? null) : "—"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Country</p>
                    <p>{request.country}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Owner Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Building2 size={20} className="text-primary" />
                  </div>
                  <div>
                    <p>{request.owner_name || "Authenticated owner"}</p>
                    <p className="text-sm text-muted-foreground">Owner</p>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-4 text-sm text-muted-foreground">
                  {request.owner_email ? (
                    <span className="flex items-center gap-2">
                      <Mail size={16} />
                      {request.owner_email}
                    </span>
                  ) : null}
                  {request.owner_phone ? (
                    <span className="flex items-center gap-2">
                      <Phone size={16} />
                      {request.owner_phone}
                    </span>
                  ) : null}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Current</span>
                  <StatusBadge status={formatStatusLabel(request.status)} type="request" />
                </div>
                {request.approved_at ? (
                  <p className="text-sm text-muted-foreground">
                    Approved on {formatDate(request.approved_at)}
                  </p>
                ) : null}
                {request.rejected_at ? (
                  <p className="text-sm text-muted-foreground">
                    Rejected on {formatDate(request.rejected_at)}
                  </p>
                ) : null}
                {request.rejection_reason ? (
                  <div className="text-sm">
                    <p className="text-muted-foreground mb-1">Rejection reason</p>
                    <p>{request.rejection_reason}</p>
                  </div>
                ) : null}
              </CardContent>
            </Card>

            {status === "pending" ? (
              <Card>
                <CardHeader>
                  <CardTitle>Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button className="w-full" onClick={handleApprove} disabled={approving}>
                    {approving ? "Approving..." : "Approve Request"}
                  </Button>
                  <div>
                    <label className="block text-sm mb-2">Rejection Reason</label>
                    <textarea
                      className="w-full px-4 py-2 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      rows={3}
                      value={rejectionReason}
                      onChange={(event) => setRejectionReason(event.target.value)}
                      placeholder="Share why the request is rejected"
                    />
                  </div>
                  <Button
                    variant="destructive"
                    className="w-full"
                    onClick={handleReject}
                    disabled={rejecting}
                  >
                    {rejecting ? "Rejecting..." : "Reject Request"}
                  </Button>
                  {actionError ? <p className="text-sm text-destructive">{actionError}</p> : null}
                  {actionMessage ? <p className="text-sm text-success">{actionMessage}</p> : null}
                  {approvedBuildingId ? (
                    <Link to={routes.adminBuilding(approvedBuildingId)}>
                      <Button variant="secondary" className="w-full">
                        View Building
                      </Button>
                    </Link>
                  ) : null}
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>Next Steps</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {status === "approved" ? (
                    <p className="text-sm text-muted-foreground">
                      This request has already been approved.
                    </p>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      This request has already been rejected.
                    </p>
                  )}
                  {approvedBuildingId ? (
                    <Link to={routes.adminBuilding(approvedBuildingId)}>
                      <Button variant="secondary" className="w-full">
                        View Building
                      </Button>
                    </Link>
                  ) : null}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
