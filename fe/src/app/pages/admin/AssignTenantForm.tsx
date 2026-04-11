import { useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { CheckCircle2, LoaderCircle, UserPlus } from 'lucide-react';
import { Button } from '../../components/Button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog';
import { ApiError, apiPost } from '../../lib/api';
import { addMonthsNoOverflow } from '../../lib/leaseDates';
import { api } from '../../lib/urls';

type AssignableApartment = {
  id: number;
  unit_code?: string;
  yearly_price?: number;
  status?: string;
};

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'destructive';

type AssignTenantFormProps = {
  apartments: AssignableApartment[];
  defaultApartmentId?: number;
  onSuccess?: (apartmentId: number) => Promise<void> | void;
  submitLabel?: string;
  triggerLabel?: string;
  triggerVariant?: ButtonVariant;
  triggerClassName?: string;
};

type TenantLookupResponse = {
  exists: boolean;
  requires_name: boolean;
  tenant: {
    id: number;
    name: string;
    email: string | null;
    phone: string | null;
  } | null;
};

type LookupState =
  | { type: 'idle' }
  | { type: 'loading' }
  | {
      type: 'success';
      result: TenantLookupResponse;
      checkedEmail: string;
      checkedPhone: string;
    }
  | { type: 'error'; message: string };

type ConfirmedLookup = {
  kind: 'email' | 'phone';
  result: TenantLookupResponse;
  email: string;
  phone: string;
};

const normalizeLookupEmail = (value: string) => value.trim().toLowerCase();
const normalizeLookupPhone = (value: string) => value.replace(/\D/g, '');

const parseLookupIdentifier = (value: string) => {
  const trimmed = value.trim();
  const isEmail = trimmed.includes('@');

  return {
    kind: isEmail ? ('email' as const) : ('phone' as const),
    email: isEmail ? normalizeLookupEmail(trimmed) : '',
    phone: isEmail ? '' : normalizeLookupPhone(trimmed),
  };
};

const isLookupReady = (value: string) => {
  const parsed = parseLookupIdentifier(value);

  if (parsed.kind === 'email') {
    return parsed.email.includes('@');
  }

  return parsed.phone.length >= 7;
};

const today = () => new Date().toISOString().slice(0, 10);

export function AssignTenantForm({
  apartments,
  defaultApartmentId,
  onSuccess,
  submitLabel = 'Add Tenant',
  triggerLabel = 'Assign Tenant',
  triggerVariant = 'primary',
  triggerClassName = 'w-full',
}: AssignTenantFormProps) {
  const [selectedApartmentId, setSelectedApartmentId] = useState('');
  const [lookupDialogOpen, setLookupDialogOpen] = useState(false);
  const [lookupIdentifier, setLookupIdentifier] = useState('');
  const [lookupState, setLookupState] = useState<LookupState>({ type: 'idle' });
  const [confirmedLookup, setConfirmedLookup] = useState<ConfirmedLookup | null>(
    null,
  );
  const [tenantName, setTenantName] = useState('');
  const [tenantEmail, setTenantEmail] = useState('');
  const [tenantPhone, setTenantPhone] = useState('');
  const [confirmExistingTenant, setConfirmExistingTenant] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [rentAmount, setRentAmount] = useState('');
  const [recordPayment, setRecordPayment] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentDate, setPaymentDate] = useState(today());
  const [paymentDueDate, setPaymentDueDate] = useState(today());
  const [paymentStatus, setPaymentStatus] = useState('paid');
  const [paymentReference, setPaymentReference] = useState('');
  const [paymentDueDateTouched, setPaymentDueDateTouched] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<{
    type: 'idle' | 'error' | 'success';
    message?: string;
  }>({ type: 'idle' });

  const availableApartments = useMemo(
    () =>
      apartments.filter(
        (apartment) =>
          (apartment.status?.toLowerCase?.() ?? 'vacant') === 'vacant',
      ),
    [apartments],
  );

  useEffect(() => {
    if (availableApartments.length === 0) {
      setSelectedApartmentId('');
      return;
    }

    const preferredId = defaultApartmentId ?? availableApartments[0]?.id;
    const hasPreferred = availableApartments.some(
      (apartment) => apartment.id === preferredId,
    );
    const nextId = hasPreferred ? preferredId : availableApartments[0]?.id;
    setSelectedApartmentId(nextId ? String(nextId) : '');
  }, [availableApartments, defaultApartmentId]);

  useEffect(() => {
    const selectedApartment = availableApartments.find(
      (apartment) => String(apartment.id) === selectedApartmentId,
    );

    if (!selectedApartment) return;

    setRentAmount(
      selectedApartment.yearly_price
        ? String(selectedApartment.yearly_price)
        : '',
    );
    setPaymentAmount(
      selectedApartment.yearly_price
        ? String(selectedApartment.yearly_price)
        : '',
    );
  }, [selectedApartmentId, availableApartments]);

  useEffect(() => {
    if (!startDate || paymentDueDateTouched) {
      return;
    }

    setPaymentDueDate(startDate);
  }, [paymentDueDateTouched, startDate]);

  useEffect(() => {
    if (!lookupDialogOpen || !selectedApartmentId) {
      return;
    }

    if (!isLookupReady(lookupIdentifier)) {
      setLookupState({ type: 'idle' });
      return;
    }

    const parsed = parseLookupIdentifier(lookupIdentifier);
    const timeoutId = window.setTimeout(async () => {
      setLookupState({ type: 'loading' });

      try {
        const result = await apiPost<TenantLookupResponse>(
          api.apartmentAssignTenantLookup(selectedApartmentId),
          {
            tenant_email: parsed.email || null,
            tenant_phone: parsed.phone || null,
          },
        );

        setLookupState({
          type: 'success',
          result,
          checkedEmail: parsed.email,
          checkedPhone: parsed.phone,
        });
      } catch (error) {
        setLookupState({
          type: 'error',
          message:
            error instanceof ApiError
              ? error.message
              : 'Unable to confirm the tenant details.',
        });
      }
    }, 400);

    return () => window.clearTimeout(timeoutId);
  }, [lookupDialogOpen, lookupIdentifier, selectedApartmentId]);

  const parsedLookupIdentifier = parseLookupIdentifier(lookupIdentifier);
  const lookupMatchesCurrentIdentifier =
    lookupState.type === 'success' &&
    lookupState.checkedEmail === parsedLookupIdentifier.email &&
    lookupState.checkedPhone === parsedLookupIdentifier.phone;
  const readyLookupResult =
    lookupState.type === 'success' && lookupMatchesCurrentIdentifier
      ? lookupState.result
      : null;
  const isExistingTenant = confirmedLookup?.result.exists ?? false;
  const requiresPhoneInput = tenantPhone.trim() === '';
  const canSubmit =
    selectedApartmentId !== '' &&
    startDate !== '' &&
    !submitting &&
    (!recordPayment || (paymentAmount !== '' && paymentDate !== '')) &&
    (
      confirmedLookup
        ? isExistingTenant
          ? true
          : tenantName.trim() !== '' && tenantPhone.trim() !== ''
        : false
    );
  const leaseDueDate = startDate ? addMonthsNoOverflow(startDate, 12) : '';

  const resetConfirmedLookup = () => {
    setConfirmedLookup(null);
    setTenantName('');
    setTenantEmail('');
    setTenantPhone('');
    setConfirmExistingTenant(false);
    setStartDate('');
    setRecordPayment(false);
    setPaymentAmount('');
    setPaymentDate(today());
    setPaymentDueDate(today());
    setPaymentStatus('paid');
    setPaymentReference('');
    setPaymentDueDateTouched(false);
    setStatus({ type: 'idle' });
  };

  const handleLookupConfirm = () => {
    if (!readyLookupResult) return;

    const nextEmail =
      readyLookupResult.tenant?.email ?? parsedLookupIdentifier.email ?? '';
    const nextPhone =
      readyLookupResult.tenant?.phone ?? parsedLookupIdentifier.phone ?? '';

    setConfirmedLookup({
      kind: parsedLookupIdentifier.kind,
      result: readyLookupResult,
      email: nextEmail,
      phone: nextPhone,
    });
    setTenantEmail(nextEmail);
    setTenantPhone(nextPhone);
    setTenantName(readyLookupResult.tenant?.name ?? '');
    setConfirmExistingTenant(readyLookupResult.exists);
    setLookupDialogOpen(false);
    setStatus({ type: 'idle' });
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    if (!confirmedLookup || !canSubmit) return;

    setSubmitting(true);
    setStatus({ type: 'idle' });

    try {
      await apiPost(api.apartmentAssignTenant(selectedApartmentId), {
        tenant_email:
          tenantEmail.trim() || confirmedLookup.email.trim() || null,
        tenant_phone: tenantPhone.trim() || confirmedLookup.phone.trim(),
        tenant_name: isExistingTenant ? null : tenantName.trim(),
        start_date: startDate,
        rent_amount: rentAmount ? Number(rentAmount) : null,
        record_payment: recordPayment,
        payment_amount: recordPayment && paymentAmount ? Number(paymentAmount) : null,
        payment_date: recordPayment ? paymentDate : null,
        payment_due_date: recordPayment ? paymentDueDate || paymentDate : null,
        payment_status: recordPayment ? paymentStatus : null,
        payment_reference: recordPayment ? paymentReference || null : null,
      });

      setStatus({ type: 'success', message: 'Tenant assigned successfully.' });
      setLookupIdentifier('');
      setLookupState({ type: 'idle' });
      resetConfirmedLookup();

      if (onSuccess) {
        await onSuccess(Number(selectedApartmentId));
      }
    } catch (error) {
      setStatus({
        type: 'error',
        message: (error as Error).message || 'Unable to assign tenant.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (availableApartments.length === 0) {
    return (
      <div className="rounded-lg border border-border p-4">
        <p className="text-sm text-muted-foreground">
          No vacant apartments are available for tenant assignment.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Button
        variant={triggerVariant}
        className={triggerClassName}
        onClick={() => setLookupDialogOpen(true)}
      >
        <UserPlus size={18} className="mr-2" />
        {confirmedLookup ? 'Change Tenant' : triggerLabel}
      </Button>

      <Dialog open={lookupDialogOpen} onOpenChange={setLookupDialogOpen}>
        {lookupDialogOpen ? (
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Find tenant</DialogTitle>
              <DialogDescription>
                Enter a phone number or email address to check whether this
                tenant already exists.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <label className="block text-sm mb-2" htmlFor="tenant-lookup">
                  Phone or email
                </label>
                <div className="relative">
                  <input
                    id="tenant-lookup"
                    className="w-full rounded-lg border border-border bg-input-background px-4 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="08012345678 or jane@example.com"
                    value={lookupIdentifier}
                    onChange={(event) => setLookupIdentifier(event.target.value)}
                  />
                  <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
                    {lookupState.type === 'loading' ? (
                      <LoaderCircle
                        size={16}
                        className="animate-spin text-muted-foreground"
                      />
                    ) : null}
                    {readyLookupResult?.exists ? (
                      <CheckCircle2 size={16} className="text-success" />
                    ) : null}
                  </div>
                </div>
              </div>

              {lookupState.type === 'error' ? (
                <p className="text-sm text-destructive">{lookupState.message}</p>
              ) : null}

              {readyLookupResult ? (
                readyLookupResult.exists ? (
                  <div className="rounded-lg border border-success/30 bg-success/10 px-3 py-3 text-sm">
                    <p className="font-medium text-success">Tenant exists</p>
                    <p className="mt-1">
                      {readyLookupResult.tenant?.name ?? 'Existing user'}
                    </p>
                    <p className="text-muted-foreground">
                      {(readyLookupResult.tenant?.email ??
                        parsedLookupIdentifier.email) || 'No email on record'}
                      {' · '}
                      {(readyLookupResult.tenant?.phone ??
                        parsedLookupIdentifier.phone) || 'No phone on record'}
                    </p>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No existing user was found. Click OK to continue and enter
                    the remaining tenant details.
                  </p>
                )
              ) : null}

              <div className="flex justify-end gap-2">
                <Button
                  variant="ghost"
                  onClick={() => setLookupDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleLookupConfirm}
                  disabled={readyLookupResult === null}
                >
                  OK
                </Button>
              </div>
            </div>
          </DialogContent>
        ) : null}
      </Dialog>

      {confirmedLookup ? (
        <form
          className="space-y-4 rounded-lg border border-border p-4"
          onSubmit={handleSubmit}
        >
          <div className="flex items-center justify-between gap-4">
            <div>
              <h3 className="text-lg">Assign Tenant</h3>
              <p className="text-sm text-muted-foreground">
                {confirmedLookup.email || confirmedLookup.phone}
              </p>
            </div>
            <Button variant="ghost" onClick={resetConfirmedLookup}>
              Clear
            </Button>
          </div>

          {availableApartments.length > 1 ? (
            <div>
              <label
                className="block text-sm mb-2"
                htmlFor="assign-tenant-apartment"
              >
                Apartment
              </label>
              <select
                id="assign-tenant-apartment"
                className="w-full rounded-lg border border-border bg-input-background px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                value={selectedApartmentId}
                onChange={(event) => setSelectedApartmentId(event.target.value)}
              >
                {availableApartments.map((apartment) => (
                  <option key={apartment.id} value={apartment.id}>
                    {apartment.unit_code ?? `Apartment ${apartment.id}`}
                  </option>
                ))}
              </select>
            </div>
          ) : null}

          {isExistingTenant ? (
            <label className="flex items-start gap-3 rounded-lg border border-success/30 bg-success/10 px-3 py-3 text-sm">
              <input
                type="checkbox"
                checked={confirmExistingTenant}
                onChange={(event) =>
                  setConfirmExistingTenant(event.target.checked)
                }
                className="mt-1"
              />
              <span>
                Use existing tenant{' '}
                {confirmedLookup.result.tenant?.name ?? 'record'} with{' '}
                {tenantEmail || 'no email'} and {tenantPhone || 'no phone'}.
              </span>
            </label>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label
                  className="block text-sm mb-2"
                  htmlFor="assign-tenant-name"
                >
                  Tenant Name
                </label>
                <input
                  id="assign-tenant-name"
                  required
                  className="w-full rounded-lg border border-border bg-input-background px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Jane Doe"
                  value={tenantName}
                  onChange={(event) => setTenantName(event.target.value)}
                />
              </div>
              <div>
                <label
                  className="block text-sm mb-2"
                  htmlFor="assign-tenant-email"
                >
                  Tenant Email (Optional)
                </label>
                <input
                  id="assign-tenant-email"
                  type="email"
                  className="w-full rounded-lg border border-border bg-input-background px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="jane@example.com"
                  value={tenantEmail}
                  onChange={(event) => setTenantEmail(event.target.value)}
                />
              </div>
              <div>
                <label
                  className="block text-sm mb-2"
                  htmlFor="assign-tenant-phone"
                >
                  Tenant Phone
                </label>
                <input
                  id="assign-tenant-phone"
                  type="tel"
                  required
                  className="w-full rounded-lg border border-border bg-input-background px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="08012345678"
                  value={tenantPhone}
                  onChange={(event) => setTenantPhone(event.target.value)}
                />
              </div>
            </div>
          )}

          {isExistingTenant && requiresPhoneInput ? (
            <div>
              <label
                className="block text-sm mb-2"
                htmlFor="assign-existing-tenant-phone"
              >
                Tenant Phone
              </label>
              <input
                id="assign-existing-tenant-phone"
                type="tel"
                required
                className="w-full rounded-lg border border-border bg-input-background px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="08012345678"
                value={tenantPhone}
                onChange={(event) => setTenantPhone(event.target.value)}
              />
            </div>
          ) : null}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label
                className="block text-sm mb-2"
                htmlFor="assign-tenant-start-date"
              >
                Lease Start Date
              </label>
              <input
                id="assign-tenant-start-date"
                type="date"
                required
                className="w-full rounded-lg border border-border bg-input-background px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                value={startDate}
                onChange={(event) => setStartDate(event.target.value)}
              />
            </div>
            <div>
              <label
                className="block text-sm mb-2"
                htmlFor="assign-tenant-end-date"
              >
                Lease Due Date
              </label>
              <input
                id="assign-tenant-end-date"
                type="date"
                className="w-full rounded-lg border border-border bg-muted/30 px-4 py-2 text-muted-foreground focus:outline-none"
                value={leaseDueDate}
                readOnly
                disabled
              />
            </div>
            <div>
              <label className="block text-sm mb-2" htmlFor="assign-tenant-rent">
                Annual Rent
              </label>
              <input
                id="assign-tenant-rent"
                type="number"
                min="0"
                className="w-full rounded-lg border border-border bg-input-background px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="1200000"
                value={rentAmount}
                onChange={(event) => setRentAmount(event.target.value)}
              />
            </div>
          </div>

          <div className="space-y-4 rounded-lg border border-border p-4">
            <label className="flex items-center gap-3 text-sm">
              <input
                type="checkbox"
                checked={recordPayment}
                onChange={(event) => setRecordPayment(event.target.checked)}
                className="h-4 w-4"
              />
              <span>Record payment now</span>
            </label>

            {recordPayment ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label
                      className="block text-sm mb-2"
                      htmlFor="assign-tenant-payment-amount"
                    >
                      Payment Amount
                    </label>
                    <input
                      id="assign-tenant-payment-amount"
                      type="number"
                      min="0"
                      required
                      className="w-full rounded-lg border border-border bg-input-background px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                      value={paymentAmount}
                      onChange={(event) => setPaymentAmount(event.target.value)}
                    />
                  </div>
                  <div>
                    <label
                      className="block text-sm mb-2"
                      htmlFor="assign-tenant-payment-status"
                    >
                      Payment Status
                    </label>
                    <select
                      id="assign-tenant-payment-status"
                      className="w-full rounded-lg border border-border bg-input-background px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                      value={paymentStatus}
                      onChange={(event) => setPaymentStatus(event.target.value)}
                    >
                      <option value="paid">Paid</option>
                      <option value="pending">Pending</option>
                      <option value="failed">Failed</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label
                      className="block text-sm mb-2"
                      htmlFor="assign-tenant-payment-date"
                    >
                      Payment Date
                    </label>
                    <input
                      id="assign-tenant-payment-date"
                      type="date"
                      required
                      className="w-full rounded-lg border border-border bg-input-background px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                      value={paymentDate}
                      onChange={(event) => setPaymentDate(event.target.value)}
                    />
                  </div>
                  <div>
                    <label
                      className="block text-sm mb-2"
                      htmlFor="assign-tenant-payment-due-date"
                    >
                      Due Date
                    </label>
                    <input
                      id="assign-tenant-payment-due-date"
                      type="date"
                      className="w-full rounded-lg border border-border bg-input-background px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                      value={paymentDueDate}
                      onChange={(event) => {
                        setPaymentDueDate(event.target.value);
                        setPaymentDueDateTouched(Boolean(event.target.value));
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label
                    className="block text-sm mb-2"
                    htmlFor="assign-tenant-payment-reference"
                  >
                    Transaction Reference
                  </label>
                  <input
                    id="assign-tenant-payment-reference"
                    type="text"
                    className="w-full rounded-lg border border-border bg-input-background px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Optional reference"
                    value={paymentReference}
                    onChange={(event) => setPaymentReference(event.target.value)}
                  />
                </div>
              </>
            ) : null}
          </div>

          {status.type === 'error' ? (
            <p className="text-sm text-destructive">{status.message}</p>
          ) : null}
          {status.type === 'success' ? (
            <p className="text-sm text-success">{status.message}</p>
          ) : null}

          <Button type="submit" disabled={!canSubmit}>
            {submitting ? 'Assigning...' : submitLabel}
          </Button>
        </form>
      ) : null}
    </div>
  );
}
