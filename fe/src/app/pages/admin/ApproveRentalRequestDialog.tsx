import type { FormEvent } from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { CheckCircle2, LoaderCircle } from 'lucide-react';
import { Button } from '../../components/Button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog';
import { apiPost } from '../../lib/api';
import { formatMoney } from '../../lib/format';
import { useApiQuery } from '../../hooks/useApiQuery';
import { PaginatedData } from '../../lib/paginatedData';
import type { ApartmentSummary, RentalRequest } from '../../lib/models';
import type { RentalRequestWorkflowResponse } from '../../lib/responses';
import { api } from '../../lib/urls';

type ApproveRentalRequestDialogProps = {
  request: RentalRequest;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => Promise<void> | void;
};

const today = () => new Date().toISOString().slice(0, 10);

const approvalSteps = [
  'Confirm tenant details',
  'Lease dates',
  'First payment',
  'Send welcome message',
];

export function ApproveRentalRequestDialog({
  request,
  open,
  onOpenChange,
  onSuccess,
}: ApproveRentalRequestDialogProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [startDate, setStartDate] = useState(today());
  const [apartmentId, setApartmentId] = useState(
    request.apartment?.id ? String(request.apartment.id) : '',
  );
  const [rentAmount, setRentAmount] = useState(
    request.apartment?.yearly_price
      ? String(request.apartment.yearly_price)
      : '',
  );
  const [recordPayment, setRecordPayment] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState(
    request.apartment?.yearly_price
      ? String(request.apartment.yearly_price)
      : '',
  );
  const [paymentDate, setPaymentDate] = useState(today());
  const [paymentDueDate, setPaymentDueDate] = useState(today());
  const [paymentStatus, setPaymentStatus] = useState('paid');
  const [paymentReference, setPaymentReference] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const selectApartments = useCallback(
    (data: unknown) => PaginatedData.from<ApartmentSummary>(data, 'apartments'),
    [],
  );
  const buildingId = request.apartment?.building?.id;
  const apartmentsQuery = useApiQuery<unknown, PaginatedData<ApartmentSummary>>(
    open && buildingId ? api.buildingApartments(buildingId) : null,
    {
      enabled: Boolean(open && buildingId),
      deps: [open, buildingId],
      select: selectApartments,
    },
  );

  useEffect(() => {
    if (!open) {
      return;
    }

    const nextDate = today();
    setCurrentStep(0);
    setApartmentId(request.apartment?.id ? String(request.apartment.id) : '');
    setStartDate(nextDate);
    setRentAmount(
      request.apartment?.yearly_price
        ? String(request.apartment.yearly_price)
        : '',
    );
    setPaymentAmount(
      request.apartment?.yearly_price
        ? String(request.apartment.yearly_price)
        : '',
    );
    setPaymentDate(nextDate);
    setPaymentDueDate(nextDate);
    setPaymentStatus('paid');
    setPaymentReference('');
    setRecordPayment(false);
    setError(null);
  }, [open, request]);

  const apartmentOptions = useMemo(() => {
    const options = new Map<number, ApartmentSummary>();

    if (request.apartment?.id) {
      options.set(request.apartment.id, {
        id: request.apartment.id,
        unit_code: request.apartment.unit_code,
        yearly_price: request.apartment.yearly_price,
        status: 'requested',
      });
    }

    (apartmentsQuery.data?.items ?? []).forEach((apartment) => {
      const status = apartment.status?.toLowerCase?.() ?? 'vacant';

      if (status === 'vacant' || apartment.id === request.apartment?.id) {
        options.set(apartment.id, apartment);
      }
    });

    return Array.from(options.values());
  }, [apartmentsQuery.data?.items, request.apartment]);

  const selectedApartment = apartmentOptions.find(
    (apartment) => String(apartment.id) === apartmentId,
  );

  useEffect(() => {
    if (!selectedApartment) {
      return;
    }

    const nextAmount = selectedApartment.yearly_price
      ? String(selectedApartment.yearly_price)
      : '';
    setRentAmount(nextAmount);
    setPaymentAmount(nextAmount);
  }, [selectedApartment]);

  const apartmentLabel = useMemo(() => {
    const unit = request.apartment?.unit_code ?? 'Unit';
    const building = request.apartment?.building?.name;
    return building ? `${unit} · ${building}` : unit;
  }, [request]);

  const canContinue = useMemo(() => {
    if (currentStep === 1) {
      return Boolean(apartmentId && startDate);
    }

    if (currentStep === 2 && recordPayment) {
      return Boolean(paymentAmount && paymentDate);
    }

    return true;
  }, [
    apartmentId,
    currentStep,
    paymentAmount,
    paymentDate,
    recordPayment,
    startDate,
  ]);

  const submitApproval = async () => {
    if (submitting) {
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await apiPost<RentalRequestWorkflowResponse>(
        api.rentalRequestApprove(request.id),
        {
          start_date: startDate,
          apartment_id: apartmentId ? Number(apartmentId) : undefined,
          rent_amount: rentAmount ? Number(rentAmount) : undefined,
          record_payment: recordPayment,
          payment_amount:
            recordPayment && paymentAmount ? Number(paymentAmount) : undefined,
          payment_date: recordPayment ? paymentDate || undefined : undefined,
          payment_due_date: recordPayment
            ? paymentDueDate || undefined
            : undefined,
          payment_status: recordPayment ? paymentStatus : undefined,
          payment_reference: recordPayment
            ? paymentReference || undefined
            : undefined,
        },
      );

      await onSuccess?.();
      onOpenChange(false);
    } catch (requestError) {
      setError(
        (requestError as Error).message || 'Unable to approve rental request.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    if (currentStep < approvalSteps.length - 1) {
      if (canContinue) {
        setCurrentStep((step) => step + 1);
      }
      return;
    }

    await submitApproval();
  };

  const renderStep = () => {
    if (currentStep === 0) {
      return (
        <div className="space-y-4">
          <div className="rounded-lg border border-border p-4 text-sm">
            <p className="font-medium">
              {request.name ?? 'Prospective Tenant'}
            </p>
            <p className="text-muted-foreground">
              {request.email ?? 'No email provided'}
            </p>
            <p className="text-muted-foreground">
              {request.phone ?? 'No phone provided'}
            </p>
          </div>
          <div>
            <p className="mb-2 text-sm text-muted-foreground">Message</p>
            <p className="rounded-lg border border-border p-4 text-sm">
              {request.message ?? 'No message provided.'}
            </p>
          </div>
          <p className="text-sm text-muted-foreground">
            Confirm the name and contact details before creating the tenant
            profile.
          </p>
        </div>
      );
    }

    if (currentStep === 1) {
      return (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <label
              className="mb-2 block text-sm text-foreground"
              htmlFor="rental-request-apartment"
            >
              Apartment to assign
            </label>
            <select
              id="rental-request-apartment"
              className="w-full rounded-lg border border-border bg-input-background px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
              value={apartmentId}
              onChange={(event) => setApartmentId(event.target.value)}
              disabled={submitting || apartmentOptions.length === 0}
              required
            >
              {apartmentOptions.map((apartment) => (
                <option key={apartment.id} value={apartment.id}>
                  {apartment.unit_code ?? 'Unit'}
                  {apartment.yearly_price
                    ? ` · ${formatMoney(apartment.yearly_price)}`
                    : ''}
                </option>
              ))}
            </select>
            {apartmentLabel ? (
              <p className="mt-2 text-xs text-muted-foreground">
                Requested apartment: {apartmentLabel}
              </p>
            ) : null}
          </div>

          <div>
            <label
              className="mb-2 block text-sm text-foreground"
              htmlFor="rental-request-start-date"
            >
              Lease Start Date
            </label>
            <input
              id="rental-request-start-date"
              type="date"
              className="w-full rounded-lg border border-border bg-input-background px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
              value={startDate}
              onChange={(event) => setStartDate(event.target.value)}
              disabled={submitting}
            />
          </div>

          <div>
            <label
              className="mb-2 block text-sm text-foreground"
              htmlFor="rental-request-rent-amount"
            >
              Rent Amount
            </label>
            <input
              id="rental-request-rent-amount"
              type="number"
              min="0"
              className="w-full rounded-lg border border-border bg-input-background px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
              value={rentAmount}
              onChange={(event) => setRentAmount(event.target.value)}
              disabled={submitting}
            />
            {request.apartment?.yearly_price ? (
              <p className="mt-2 text-xs text-muted-foreground">
                Suggested from apartment pricing:{' '}
                {formatMoney(request.apartment.yearly_price)}
              </p>
            ) : null}
          </div>
        </div>
      );
    }

    if (currentStep === 2) {
      return (
        <div className="space-y-4">
          <label className="flex items-center gap-3 text-sm text-foreground">
            <input
              type="checkbox"
              checked={recordPayment}
              onChange={(event) => setRecordPayment(event.target.checked)}
              disabled={submitting}
            />
            Record first payment while approving
          </label>

          {recordPayment ? (
            <div className="grid grid-cols-1 gap-4 rounded-lg border border-border p-4 md:grid-cols-2">
              <div>
                <label
                  className="mb-2 block text-sm text-foreground"
                  htmlFor="rental-request-payment-amount"
                >
                  Payment Amount
                </label>
                <input
                  id="rental-request-payment-amount"
                  type="number"
                  min="0"
                  className="w-full rounded-lg border border-border bg-input-background px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                  value={paymentAmount}
                  onChange={(event) => setPaymentAmount(event.target.value)}
                  disabled={submitting}
                />
              </div>

              <div>
                <label
                  className="mb-2 block text-sm text-foreground"
                  htmlFor="rental-request-payment-status"
                >
                  Payment Status
                </label>
                <select
                  id="rental-request-payment-status"
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
                <label
                  className="mb-2 block text-sm text-foreground"
                  htmlFor="rental-request-payment-date"
                >
                  Payment Date
                </label>
                <input
                  id="rental-request-payment-date"
                  type="date"
                  className="w-full rounded-lg border border-border bg-input-background px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                  value={paymentDate}
                  onChange={(event) => setPaymentDate(event.target.value)}
                  disabled={submitting}
                />
              </div>

              <div>
                <label
                  className="mb-2 block text-sm text-foreground"
                  htmlFor="rental-request-payment-due-date"
                >
                  Payment Due Date
                </label>
                <input
                  id="rental-request-payment-due-date"
                  type="date"
                  className="w-full rounded-lg border border-border bg-input-background px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                  value={paymentDueDate}
                  onChange={(event) => setPaymentDueDate(event.target.value)}
                  disabled={submitting}
                />
              </div>

              <div className="md:col-span-2">
                <label
                  className="mb-2 block text-sm text-foreground"
                  htmlFor="rental-request-payment-reference"
                >
                  Payment Reference
                </label>
                <input
                  id="rental-request-payment-reference"
                  type="text"
                  className="w-full rounded-lg border border-border bg-input-background px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                  value={paymentReference}
                  onChange={(event) => setPaymentReference(event.target.value)}
                  disabled={submitting}
                />
              </div>
            </div>
          ) : (
            <p className="rounded-lg border border-border p-4 text-sm text-muted-foreground">
              Skip this step if the tenant has not paid yet. You can record the
              first payment later from the apartment or payments page.
            </p>
          )}
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <div className="rounded-lg border border-border p-4">
          <h4 className="mb-3 text-lg">Ready to approve</h4>
          <div className="space-y-2 text-sm">
            <p>
              Tenant: <span className="font-medium">{request.name}</span>
            </p>
            <p>
              Apartment:{' '}
              <span className="font-medium">
                {selectedApartment?.unit_code ?? apartmentLabel}
              </span>
            </p>
            <p>
              Lease starts: <span className="font-medium">{startDate}</span>
            </p>
            <p>
              First payment:{' '}
              <span className="font-medium">
                {recordPayment
                  ? `${formatMoney(Number(paymentAmount || 0))} · ${paymentStatus}`
                  : 'Not recorded now'}
              </span>
            </p>
          </div>
        </div>

        <div className="rounded-lg border border-success/30 bg-success/5 p-4">
          <div className="mb-2 flex items-center gap-2">
            <CheckCircle2 size={18} className="text-success" />
            <h4 className="font-medium">Welcome message</h4>
          </div>
          <p className="text-sm text-muted-foreground">
            After approval, Homelet creates the tenant lease and sends the
            tenancy agreement email. Use this as the welcome message for the new
            tenant.
          </p>
        </div>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Approve Rental Request</DialogTitle>
          <DialogDescription>
            Follow each step to move {request.name ?? 'this applicant'} into the
            selected apartment.
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-5" onSubmit={handleSubmit}>
          <ol className="grid grid-cols-1 gap-2 md:grid-cols-4">
            {approvalSteps.map((step, index) => (
              <li
                key={step}
                className={`rounded-lg border px-3 py-2 text-sm ${
                  index === currentStep
                    ? 'border-primary bg-primary/5 text-foreground'
                    : index < currentStep
                      ? 'border-success/30 bg-success/5 text-foreground'
                      : 'border-border text-muted-foreground'
                }`}
              >
                <span className="block text-xs">Step {index + 1}</span>
                {step}
              </li>
            ))}
          </ol>

          {renderStep()}

          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          {!canContinue ? (
            <p className="text-sm text-destructive">
              Complete the required details before continuing.
            </p>
          ) : null}

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            {currentStep > 0 ? (
              <Button
                type="button"
                variant="secondary"
                onClick={() => setCurrentStep((step) => step - 1)}
                disabled={submitting}
              >
                Back
              </Button>
            ) : null}
            <Button type="submit" disabled={submitting || !canContinue}>
              {submitting ? (
                <LoaderCircle size={16} className="mr-2 animate-spin" />
              ) : null}
              {currentStep === approvalSteps.length - 1
                ? submitting
                  ? 'Approving...'
                  : 'Approve and Send Welcome Message'
                : 'Continue'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
