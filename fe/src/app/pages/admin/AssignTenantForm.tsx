import { useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { UserPlus } from 'lucide-react';
import { Button } from '../../components/Button';
import { apiPost } from '../../lib/api';
import { api } from '../../lib/urls';

type AssignableApartment = {
  id: number;
  unit_code?: string;
  yearly_price?: number;
  status?: string;
};

type AssignTenantFormProps = {
  apartments: AssignableApartment[];
  defaultApartmentId?: number;
  onSuccess?: (apartmentId: number) => Promise<void> | void;
  submitLabel?: string;
};

export function AssignTenantForm({
  apartments,
  defaultApartmentId,
  onSuccess,
  submitLabel = 'Add Tenant',
}: AssignTenantFormProps) {
  const [selectedApartmentId, setSelectedApartmentId] = useState('');
  const [tenantName, setTenantName] = useState('');
  const [tenantEmail, setTenantEmail] = useState('');
  const [startDate, setStartDate] = useState('');
  const [rentAmount, setRentAmount] = useState('');
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
  }, [selectedApartmentId, availableApartments]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!selectedApartmentId) return;

    setSubmitting(true);
    setStatus({ type: 'idle' });

    try {
      await apiPost(api.apartmentAssignTenant(selectedApartmentId), {
        tenant_email: tenantEmail.trim(),
        tenant_name: tenantName.trim() || null,
        start_date: startDate,
        rent_amount: rentAmount ? Number(rentAmount) : null,
      });

      setStatus({ type: 'success', message: 'Tenant added successfully.' });
      setTenantName('');
      setTenantEmail('');
      setStartDate('');

      if (onSuccess) {
        await onSuccess(Number(selectedApartmentId));
      }
    } catch (error) {
      setStatus({
        type: 'error',
        message: (error as Error).message || 'Unable to add tenant.',
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
    <form
      className="space-y-4 rounded-lg border border-border p-4"
      onSubmit={handleSubmit}
    >
      <div className="flex items-center gap-2">
        <UserPlus size={18} className="text-primary" />
        <h3 className="text-lg">Add Tenant</h3>
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
            className="w-full px-4 py-2 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
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

      <div>
        <label className="block text-sm mb-2" htmlFor="assign-tenant-name">
          Tenant Name
        </label>
        <input
          id="assign-tenant-name"
          className="w-full px-4 py-2 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          placeholder="Jane Doe"
          value={tenantName}
          onChange={(event) => setTenantName(event.target.value)}
        />
      </div>

      <div>
        <label className="block text-sm mb-2" htmlFor="assign-tenant-email">
          Tenant Email
        </label>
        <input
          id="assign-tenant-email"
          type="email"
          required
          className="w-full px-4 py-2 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          placeholder="jane@example.com"
          value={tenantEmail}
          onChange={(event) => setTenantEmail(event.target.value)}
        />
      </div>

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
            className="w-full px-4 py-2 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            value={startDate}
            onChange={(event) => setStartDate(event.target.value)}
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
            className="w-full px-4 py-2 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="1200000"
            value={rentAmount}
            onChange={(event) => setRentAmount(event.target.value)}
          />
        </div>
      </div>

      {status.type === 'error' ? (
        <p className="text-sm text-destructive">{status.message}</p>
      ) : null}
      {status.type === 'success' ? (
        <p className="text-sm text-success">{status.message}</p>
      ) : null}

      <Button type="submit" disabled={submitting}>
        {submitting ? 'Adding...' : submitLabel}
      </Button>
    </form>
  );
}
