import type { FormEvent } from "react";
import { useEffect, useMemo, useState } from "react";
import { LoaderCircle } from "lucide-react";
import { Button } from "../../components/Button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog";
import { apiPost } from "../../lib/api";
import type { RentalRequest } from "../../lib/models";
import { api } from "../../lib/urls";

type RejectRentalRequestDialogProps = {
  request: RentalRequest;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => Promise<void> | void;
};

export function RejectRentalRequestDialog({
  request,
  open,
  onOpenChange,
  onSuccess,
}: RejectRentalRequestDialogProps) {
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setReason("");
      setError(null);
    }
  }, [open]);

  const apartmentLabel = useMemo(() => {
    const unit = request.apartment?.unit_code ?? "Unit";
    const building = request.apartment?.building?.name;
    return building ? `${unit} · ${building}` : unit;
  }, [request]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    if (submitting) {
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await apiPost(api.rentalRequestReject(request.id), {
        rejection_reason: reason.trim() || undefined,
      });
      await onSuccess?.();
      onOpenChange(false);
    } catch (requestError) {
      setError((requestError as Error).message || "Unable to reject rental request.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reject Rental Request</DialogTitle>
          <DialogDescription>
            Reject the request from {request.name ?? "this applicant"} for {apartmentLabel}. A rejection
            email and SMS will be sent when contact details are available.
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="mb-2 block text-sm text-foreground" htmlFor="rental-request-rejection-reason">
              Rejection Reason
            </label>
            <textarea
              id="rental-request-rejection-reason"
              rows={4}
              className="w-full rounded-lg border border-border bg-input-background px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              disabled={submitting}
              placeholder="Optionally share why this request was rejected"
            />
          </div>

          {error ? <p className="text-sm text-destructive">{error}</p> : null}

          <div className="flex justify-end gap-3">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" variant="destructive" disabled={submitting}>
              {submitting ? <LoaderCircle size={16} className="mr-2 animate-spin" /> : null}
              {submitting ? "Rejecting..." : "Reject Request"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
