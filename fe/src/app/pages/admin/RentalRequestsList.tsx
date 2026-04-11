import { Search, Filter } from "lucide-react";
import { Card } from "../../components/Card";
import { StatusBadge } from "../../components/StatusBadge";
import { Button } from "../../components/Button";
import { EmptyState } from "../../components/EmptyState";
import { useApiQuery } from "../../hooks/useApiQuery";
import { apiPut } from "../../lib/api";
import { formatDate, formatStatusLabel } from "../../lib/format";
import { useCallback, useMemo, useState } from "react";
import { api } from "../../lib/urls";
import { PaginatedData } from "../../lib/paginatedData";
import type { RentalRequest } from "../../lib/models";
import { ApproveRentalRequestDialog } from "./ApproveRentalRequestDialog";
import { RejectRentalRequestDialog } from "./RejectRentalRequestDialog";

export function RentalRequestsList() {
  const selectRequests = useCallback(
    (data: unknown) => PaginatedData.from<RentalRequest>(data, "rental_requests"),
    []
  );
  const requestsQuery = useApiQuery<unknown, PaginatedData<RentalRequest>>(api.rentalRequests, {
    select: selectRequests,
  });
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [approveRequest, setApproveRequest] = useState<RentalRequest | null>(null);
  const [rejectRequest, setRejectRequest] = useState<RentalRequest | null>(null);
  const requests = requestsQuery.data?.items ?? [];

  const summary = useMemo(() => {
    const counts = { new: 0, contacted: 0, approved: 0, rejected: 0 };
    requests.forEach((request) => {
      const status = request.status?.toLowerCase?.() ?? "";
      if (status === "new") counts.new += 1;
      if (status === "contacted") counts.contacted += 1;
      if (status === "approved") counts.approved += 1;
      if (status === "rejected") counts.rejected += 1;
    });
    return counts;
  }, [requests]);

  const updateStatus = async (requestId: number, status: string) => {
    setUpdatingId(requestId);
    try {
      await apiPut(api.rentalRequest(requestId), { status });
      await requestsQuery.refetch();
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl mb-2">Rental Requests</h1>
          <p className="text-muted-foreground">Review and respond to potential tenants</p>
        </div>
        <Button variant="secondary">
          <Filter size={20} className="mr-2" />
          Filter
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <p className="text-sm text-muted-foreground mb-1">New Requests</p>
          <p className="text-3xl text-info">{summary.new}</p>
        </Card>
        <Card>
          <p className="text-sm text-muted-foreground mb-1">Contacted</p>
          <p className="text-3xl text-warning">{summary.contacted}</p>
        </Card>
        <Card>
          <p className="text-sm text-muted-foreground mb-1">Approved</p>
          <p className="text-3xl text-success">{summary.approved}</p>
        </Card>
        <Card>
          <p className="text-sm text-muted-foreground mb-1">Rejected</p>
          <p className="text-3xl text-muted-foreground">{summary.rejected}</p>
        </Card>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
        <input
          type="text"
          placeholder="Search rental requests..."
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
              title="No rental requests"
              description="Requests will appear here once prospective tenants apply."
            />
          </Card>
        ) : (
          requests.map((request) => {
            const status = request.status?.toLowerCase?.() ?? "";
            return (
              <Card key={request.id}>
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-lg mb-1">{request.name ?? "Prospective Tenant"}</h3>
                      <div className="text-sm text-muted-foreground space-y-1">
                        <p>{request.email ?? "—"}</p>
                        <p>{request.phone ?? "—"}</p>
                      </div>
                    </div>
                    <StatusBadge status={formatStatusLabel(request.status)} type="request" />
                  </div>

                  <div className="py-3 border-y border-border">
                    <p className="text-sm text-muted-foreground mb-1">Interested In</p>
                    <p>{request.apartment?.unit_code ?? "Unit"} · {request.apartment?.building?.name ?? "Building"}</p>
                  </div>

                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Message</p>
                    <p className="text-sm">{request.message ?? "No message provided."}</p>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <span className="text-sm text-muted-foreground">Submitted: {request.created_at ? formatDate(request.created_at) : "—"}</span>
                    {status === "new" && (
                      <div className="flex items-center gap-2">
                        <Button
                          variant="destructive"
                          size="sm"
                          disabled={updatingId === request.id}
                          onClick={() => setRejectRequest(request)}
                        >
                          Reject
                        </Button>
                        <Button
                          size="sm"
                          disabled={updatingId === request.id}
                          onClick={() => updateStatus(request.id, "contacted")}
                        >
                          Contact
                        </Button>
                        <Button
                          size="sm"
                          disabled={updatingId === request.id}
                          onClick={() => setApproveRequest(request)}
                        >
                          Approve
                        </Button>
                      </div>
                    )}
                    {status === "contacted" && (
                      <div className="flex items-center gap-2">
                        <Button
                          variant="destructive"
                          size="sm"
                          disabled={updatingId === request.id}
                          onClick={() => setRejectRequest(request)}
                        >
                          Reject
                        </Button>
                        <Button
                          size="sm"
                          disabled={updatingId === request.id}
                          onClick={() => setApproveRequest(request)}
                        >
                          Approve
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            );
          })
        )}
      </div>

      {approveRequest ? (
        <ApproveRentalRequestDialog
          request={approveRequest}
          open={Boolean(approveRequest)}
          onOpenChange={(open) => {
            if (!open) setApproveRequest(null);
          }}
          onSuccess={requestsQuery.refetch}
        />
      ) : null}

      {rejectRequest ? (
        <RejectRentalRequestDialog
          request={rejectRequest}
          open={Boolean(rejectRequest)}
          onOpenChange={(open) => {
            if (!open) setRejectRequest(null);
          }}
          onSuccess={requestsQuery.refetch}
        />
      ) : null}
    </div>
  );
}
