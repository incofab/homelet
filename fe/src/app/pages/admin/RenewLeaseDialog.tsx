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
import { formatDate, formatMoney } from "../../lib/format";
import { addDaysToDate, addMonthsNoOverflow } from "../../lib/leaseDates";
import type { Lease } from "../../lib/models";
import { api } from "../../lib/urls";

type RenewLeaseDialogProps = {
  lease: Lease;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => Promise<void> | void;
};

export function RenewLeaseDialog({
  lease,
  open,
  onOpenChange,
  onSuccess,
}: RenewLeaseDialogProps) {
  const defaultStartDate = addDaysToDate(lease.end_date, 1);
  const [startDate, setStartDate] = useState(defaultStartDate);
  const [durationInMonths, setDurationInMonths] = useState("12");
  const [endDate, setEndDate] = useState(addMonthsNoOverflow(defaultStartDate, 12));
  const [endDateTouched, setEndDateTouched] = useState(false);
  const [newRentAmount, setNewRentAmount] = useState(
    lease.rent_amount ? String(lease.rent_amount) : ""
  );
  const [recordPayment, setRecordPayment] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentDate, setPaymentDate] = useState(defaultStartDate);
  const [paymentDueDate, setPaymentDueDate] = useState(defaultStartDate);
  const [paymentStatus, setPaymentStatus] = useState("paid");
  const [paymentReference, setPaymentReference] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paymentDueDateTouched, setPaymentDueDateTouched] = useState(false);

  useEffect(() => {
    const parsedDuration = Number(durationInMonths);

    if (endDateTouched) {
      return;
    }

    if (!startDate || Number.isNaN(parsedDuration) || parsedDuration < 1) {
      setEndDate("");
      return;
    }

    setEndDate(addMonthsNoOverflow(startDate, parsedDuration));
  }, [durationInMonths, endDateTouched, startDate]);

  useEffect(() => {
    if (!startDate || paymentDueDateTouched) {
      return;
    }

    setPaymentDueDate(startDate);
  }, [paymentDueDateTouched, startDate]);

  const summary = useMemo(() => {
    const apartment = lease.apartment?.unit_code ?? "Unit";
    const building = lease.apartment?.building?.name ?? "Building";
    const rent = lease.rent_amount ? formatMoney(lease.rent_amount) : "—";
    const end = lease.end_date ? formatDate(lease.end_date) : "—";

    return { apartment, building, rent, end };
  }, [lease]);

  const resetState = () => {
    setStartDate(defaultStartDate);
    setEndDate(addMonthsNoOverflow(defaultStartDate, 12));
    setDurationInMonths("12");
    setEndDateTouched(false);
    setNewRentAmount(lease.rent_amount ? String(lease.rent_amount) : "");
    setRecordPayment(false);
    setPaymentAmount("");
    setPaymentDate(defaultStartDate);
    setPaymentDueDate(defaultStartDate);
    setPaymentStatus("paid");
    setPaymentReference("");
    setPaymentDueDateTouched(false);
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
      await apiPost(api.leaseRenew(lease.id), {
        start_date: startDate || undefined,
        end_date: endDate || undefined,
        duration_in_months: endDate ? undefined : Number(durationInMonths),
        new_rent_amount: newRentAmount ? Number(newRentAmount) : undefined,
        record_payment: recordPayment,
        payment_amount: recordPayment && paymentAmount ? Number(paymentAmount) : undefined,
        payment_date: recordPayment ? paymentDate || undefined : undefined,
        payment_due_date: recordPayment ? paymentDueDate || undefined : undefined,
        payment_status: recordPayment ? paymentStatus : undefined,
        payment_reference: recordPayment ? paymentReference || undefined : undefined,
      });

      await onSuccess?.();
      handleOpenChange(false);
    } catch (requestError) {
      setError((requestError as Error).message || "Unable to renew lease.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Renew Lease</DialogTitle>
          <DialogDescription>
            Create a new lease for {summary.apartment} at {summary.building}. Current
            rent: {summary.rent}. Current lease ends: {summary.end}.
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm text-foreground" htmlFor="renew-lease-start-date">
                Renewal Start Date
              </label>
              <input
                id="renew-lease-start-date"
                type="date"
                className="w-full rounded-lg border border-border bg-input-background px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                value={startDate}
                onChange={(event) => setStartDate(event.target.value)}
                disabled={submitting}
              />
            </div>

            <div>
              <label className="mb-2 block text-sm text-foreground" htmlFor="renew-lease-rent-amount">
                New Rent Amount
              </label>
              <input
                id="renew-lease-rent-amount"
                type="number"
                min="0"
                className="w-full rounded-lg border border-border bg-input-background px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                value={newRentAmount}
                onChange={(event) => setNewRentAmount(event.target.value)}
                disabled={submitting}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm text-foreground" htmlFor="renew-lease-end-date">
                Renewal End Date
              </label>
              <input
                id="renew-lease-end-date"
                type="date"
                className="w-full rounded-lg border border-border bg-input-background px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                value={endDate}
                onChange={(event) => {
                  setEndDate(event.target.value);
                  setEndDateTouched(Boolean(event.target.value));
                }}
                disabled={submitting}
              />
            </div>

            <div>
              <label className="mb-2 block text-sm text-foreground" htmlFor="renew-lease-duration">
                Or Duration In Months
              </label>
              <input
                id="renew-lease-duration"
                type="number"
                min="1"
                className="w-full rounded-lg border border-border bg-input-background px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                value={durationInMonths}
                onChange={(event) => {
                  setDurationInMonths(event.target.value);
                  setEndDateTouched(false);
                }}
                disabled={submitting}
              />
            </div>
          </div>

          <label className="flex items-center gap-3 text-sm text-foreground">
            <input
              type="checkbox"
              checked={recordPayment}
              onChange={(event) => setRecordPayment(event.target.checked)}
              disabled={submitting}
            />
            Record first payment for the renewed lease
          </label>

          {recordPayment ? (
            <div className="grid grid-cols-1 gap-4 rounded-lg border border-border p-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm text-foreground" htmlFor="renew-lease-payment-amount">
                  Payment Amount
                </label>
                <input
                  id="renew-lease-payment-amount"
                  type="number"
                  min="0"
                  className="w-full rounded-lg border border-border bg-input-background px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                  value={paymentAmount}
                  onChange={(event) => setPaymentAmount(event.target.value)}
                  disabled={submitting}
                />
              </div>

              <div>
                <label className="mb-2 block text-sm text-foreground" htmlFor="renew-lease-payment-status">
                  Payment Status
                </label>
                <select
                  id="renew-lease-payment-status"
                  className="w-full rounded-lg border border-border bg-input-background px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                  value={paymentStatus}
                  onChange={(event) => setPaymentStatus(event.target.value)}
                  disabled={submitting}
                >
                  <option value="paid">Paid</option>
                  <option value="pending">Pending</option>
                  <option value="failed">Failed</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm text-foreground" htmlFor="renew-lease-payment-date">
                  Payment Date
                </label>
                <input
                  id="renew-lease-payment-date"
                  type="date"
                  className="w-full rounded-lg border border-border bg-input-background px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                  value={paymentDate}
                  onChange={(event) => setPaymentDate(event.target.value)}
                  disabled={submitting}
                />
              </div>

              <div>
                <label className="mb-2 block text-sm text-foreground" htmlFor="renew-lease-payment-due-date">
                  Payment Due Date
                </label>
                <input
                  id="renew-lease-payment-due-date"
                  type="date"
                  className="w-full rounded-lg border border-border bg-input-background px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                  value={paymentDueDate}
                  onChange={(event) => {
                    setPaymentDueDate(event.target.value);
                    setPaymentDueDateTouched(Boolean(event.target.value));
                  }}
                  disabled={submitting}
                />
              </div>

              <div className="md:col-span-2">
                <label className="mb-2 block text-sm text-foreground" htmlFor="renew-lease-payment-reference">
                  Payment Reference
                </label>
                <input
                  id="renew-lease-payment-reference"
                  type="text"
                  className="w-full rounded-lg border border-border bg-input-background px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                  value={paymentReference}
                  onChange={(event) => setPaymentReference(event.target.value)}
                  disabled={submitting}
                />
              </div>
            </div>
          ) : null}

          {error ? <p className="text-sm text-destructive">{error}</p> : null}

          <div className="flex items-center gap-3 pt-2">
            <Button type="submit" disabled={submitting}>
              {submitting ? (
                <>
                  <LoaderCircle size={18} className="mr-2 animate-spin" />
                  Renewing...
                </>
              ) : (
                "Create Renewal"
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
