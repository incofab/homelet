import type { FormEvent } from "react";
import { useMemo, useState } from "react";
import { LoaderCircle } from "lucide-react";
import { Button } from "../../components/Button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog";
import { apiPut } from "../../lib/api";
import { formatDate } from "../../lib/format";
import type { Lease } from "../../lib/models";
import { api } from "../../lib/urls";

type ExtendLeaseDialogProps = {
  lease: Lease;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => Promise<void> | void;
};

export function ExtendLeaseDialog({
  lease,
  open,
  onOpenChange,
  onSuccess,
}: ExtendLeaseDialogProps) {
  const [newEndDate, setNewEndDate] = useState("");
  const [durationInMonths, setDurationInMonths] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentEndDate = useMemo(
    () => (lease.end_date ? formatDate(lease.end_date) : "—"),
    [lease.end_date]
  );

  const resetState = () => {
    setNewEndDate("");
    setDurationInMonths("");
    setError(null);
  };

  const handleOpenChange = (nextOpen: boolean) => {
    onOpenChange(nextOpen);
    if (!nextOpen) {
      resetState();
    }
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    if (submitting) {
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await apiPut(api.leaseExtend(lease.id), {
        new_end_date: newEndDate || undefined,
        duration_in_months: durationInMonths ? Number(durationInMonths) : undefined,
      });

      await onSuccess?.();
      handleOpenChange(false);
    } catch (requestError) {
      setError((requestError as Error).message || "Unable to extend lease.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Extend Lease</DialogTitle>
          <DialogDescription>
            Current lease end date: {currentEndDate}. Provide a new end date or an
            extension duration in months.
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="mb-2 block text-sm text-foreground" htmlFor="extend-lease-end-date">
              New End Date
            </label>
            <input
              id="extend-lease-end-date"
              type="date"
              className="w-full rounded-lg border border-border bg-input-background px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
              value={newEndDate}
              onChange={(event) => setNewEndDate(event.target.value)}
              disabled={submitting}
            />
          </div>

          <div>
            <label className="mb-2 block text-sm text-foreground" htmlFor="extend-lease-duration">
              Or Extend By Months
            </label>
            <input
              id="extend-lease-duration"
              type="number"
              min="1"
              className="w-full rounded-lg border border-border bg-input-background px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
              value={durationInMonths}
              onChange={(event) => setDurationInMonths(event.target.value)}
              disabled={submitting}
              placeholder="e.g. 6"
            />
          </div>

          {error ? <p className="text-sm text-destructive">{error}</p> : null}

          <div className="flex items-center gap-3 pt-2">
            <Button type="submit" disabled={submitting}>
              {submitting ? (
                <>
                  <LoaderCircle size={18} className="mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Extension"
              )}
            </Button>
            <Button type="button" variant="ghost" onClick={() => handleOpenChange(false)}>
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
