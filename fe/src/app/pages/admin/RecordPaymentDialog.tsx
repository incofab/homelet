import { useCallback, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { LoaderCircle, Plus } from 'lucide-react';
import { Button } from '../../components/Button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog';
import { useApiQuery } from '../../hooks/useApiQuery';
import { apiPost } from '../../lib/api';
import type { Tenant } from '../../lib/models';
import { PaginatedData } from '../../lib/paginatedData';
import { api } from '../../lib/urls';

type RecordPaymentDialogProps = {
  onSuccess?: () => Promise<void> | void;
  triggerLabel?: string;
  triggerVariant?: 'primary' | 'secondary' | 'ghost' | 'destructive';
  triggerClassName?: string;
  triggerDisabled?: boolean;
  defaultLeaseId?: string | number | null;
  defaultAmount?: string | number | null;
};

const today = () => new Date().toISOString().slice(0, 10);

export function RecordPaymentDialog({
  onSuccess,
  triggerLabel = 'Record Payment',
  triggerVariant = 'primary',
  triggerClassName = '',
  triggerDisabled = false,
  defaultLeaseId = null,
  defaultAmount = null,
}: RecordPaymentDialogProps) {
  const initialFormState = useCallback(
    () => ({
      leaseId: defaultLeaseId ? String(defaultLeaseId) : '',
      amount: defaultAmount ? String(defaultAmount) : '',
      paymentDate: today(),
      dueDate: today(),
      transactionReference: '',
      status: 'paid',
    }),
    [defaultAmount, defaultLeaseId],
  );
  const [open, setOpen] = useState(false);
  const [formState, setFormState] = useState(initialFormState);
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<{
    type: 'idle' | 'error' | 'success';
    message?: string;
  }>({ type: 'idle' });

  const selectTenants = useCallback(
    (data: unknown) => PaginatedData.from<Tenant>(data, 'tenants').items,
    [],
  );

  const tenantsQuery = useApiQuery<unknown, Tenant[]>(api.tenants, {
    enabled: open,
    select: selectTenants,
  });

  const tenantOptions = useMemo(
    () =>
      (tenantsQuery.data ?? [])
        .filter((tenant) => tenant.active_lease?.id)
        .map((tenant) => ({
          label: `${tenant.name} (${tenant.email})`,
          leaseId: String(tenant.active_lease?.id),
        })),
    [tenantsQuery.data],
  );

  const resetState = () => {
    setFormState(initialFormState());
    setStatus({ type: 'idle' });
  };

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);

    if (nextOpen) {
      setFormState(initialFormState());
      setStatus({ type: 'idle' });
    } else {
      resetState();
    }
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    if (!formState.leaseId || !formState.amount || submitting) {
      return;
    }

    setSubmitting(true);
    setStatus({ type: 'idle' });

    try {
      await apiPost(api.payments, {
        lease_id: Number(formState.leaseId),
        amount: Number(formState.amount),
        payment_method: 'manual',
        transaction_reference: formState.transactionReference || null,
        payment_date: formState.paymentDate,
        status: formState.status,
        metadata: {
          due_date: formState.dueDate || formState.paymentDate,
        },
      });

      setStatus({ type: 'success', message: 'Payment recorded successfully.' });
      await onSuccess?.();
      handleOpenChange(false);
    } catch (error) {
      setStatus({
        type: 'error',
        message: (error as Error).message || 'Unable to record payment.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Button
        variant={triggerVariant}
        className={triggerClassName}
        disabled={triggerDisabled}
        onClick={() => handleOpenChange(true)}
      >
        <Plus size={20} className="mr-2" />
        {triggerLabel}
      </Button>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record Payment</DialogTitle>
            <DialogDescription>
              Create a manual payment against an active tenant lease.
            </DialogDescription>
          </DialogHeader>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label
                className="mb-2 block text-sm text-foreground"
                htmlFor="payment-lease"
              >
                Tenant Lease
              </label>
              <select
                id="payment-lease"
                className="w-full rounded-lg border border-border bg-input-background px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                disabled={tenantsQuery.loading || submitting}
                value={formState.leaseId}
                onChange={(event) =>
                  setFormState((prev) => ({
                    ...prev,
                    leaseId: event.target.value,
                  }))
                }
                required
              >
                <option value="">Select tenant</option>
                {tenantOptions.map((tenant) => (
                  <option key={tenant.leaseId} value={tenant.leaseId}>
                    {tenant.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label
                  className="mb-2 block text-sm text-foreground"
                  htmlFor="payment-amount"
                >
                  Amount
                </label>
                <input
                  id="payment-amount"
                  type="number"
                  min="0"
                  className="w-full rounded-lg border border-border bg-input-background px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                  value={formState.amount}
                  onChange={(event) =>
                    setFormState((prev) => ({
                      ...prev,
                      amount: event.target.value,
                    }))
                  }
                  required
                />
              </div>

              <div>
                <label
                  className="mb-2 block text-sm text-foreground"
                  htmlFor="payment-status"
                >
                  Status
                </label>
                <select
                  id="payment-status"
                  className="w-full rounded-lg border border-border bg-input-background px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                  value={formState.status}
                  onChange={(event) =>
                    setFormState((prev) => ({
                      ...prev,
                      status: event.target.value,
                    }))
                  }
                >
                  <option value="paid">Paid</option>
                  <option value="pending">Pending</option>
                  <option value="failed">Failed</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label
                  className="mb-2 block text-sm text-foreground"
                  htmlFor="payment-date"
                >
                  Payment Date
                </label>
                <input
                  id="payment-date"
                  type="date"
                  className="w-full rounded-lg border border-border bg-input-background px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                  value={formState.paymentDate}
                  onChange={(event) =>
                    setFormState((prev) => ({
                      ...prev,
                      paymentDate: event.target.value,
                    }))
                  }
                  required
                />
              </div>

              <div>
                <label
                  className="mb-2 block text-sm text-foreground"
                  htmlFor="payment-due-date"
                >
                  Due Date
                </label>
                <input
                  id="payment-due-date"
                  type="date"
                  className="w-full rounded-lg border border-border bg-input-background px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                  value={formState.dueDate}
                  onChange={(event) =>
                    setFormState((prev) => ({
                      ...prev,
                      dueDate: event.target.value,
                    }))
                  }
                />
              </div>
            </div>

            <div>
              <label
                className="mb-2 block text-sm text-foreground"
                htmlFor="payment-reference"
              >
                Transaction Reference
              </label>
              <input
                id="payment-reference"
                type="text"
                className="w-full rounded-lg border border-border bg-input-background px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                value={formState.transactionReference}
                onChange={(event) =>
                  setFormState((prev) => ({
                    ...prev,
                    transactionReference: event.target.value,
                  }))
                }
                placeholder="Optional reference"
              />
            </div>

            {tenantsQuery.loading ? (
              <p className="text-sm text-muted-foreground">
                Loading tenants...
              </p>
            ) : null}
            {tenantsQuery.error ? (
              <p className="text-sm text-destructive">{tenantsQuery.error}</p>
            ) : null}
            {status.type === 'error' ? (
              <p className="text-sm text-destructive">{status.message}</p>
            ) : null}

            <div className="flex items-center gap-3 pt-2">
              <Button
                type="submit"
                disabled={submitting || tenantsQuery.loading}
              >
                {submitting ? (
                  <>
                    <LoaderCircle size={18} className="mr-2 animate-spin" />
                    Recording...
                  </>
                ) : (
                  'Save Payment'
                )}
              </Button>
              <Button
                type="button"
                variant="ghost"
                disabled={submitting}
                onClick={() => handleOpenChange(false)}
              >
                Cancel
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
