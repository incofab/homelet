import { Link } from 'react-router';
import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { Input } from '../../components/Input';
import { env } from '../../lib/env';
import {
  AppBreadcrumbs,
  type AppBreadcrumbItem,
} from '../../components/AppBreadcrumbs';

interface BuildingFormValues {
  name: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  description: string;
  contactEmail: string;
  contactPhone: string;
}

interface BuildingFormPayload {
  name: string;
  address_line1: string;
  address_line2: string | null;
  city: string;
  state: string;
  country: string;
  description: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  for_sale: boolean;
  sale_price: null;
}

interface BuildingFormProps {
  breadcrumbs: AppBreadcrumbItem[];
  cancelTo: string;
  heading: string;
  subheading: string;
  submitLabel: string;
  loading?: boolean;
  submitting?: boolean;
  errorMessage?: string;
  initialValues: BuildingFormValues;
  onSubmit: (payload: BuildingFormPayload) => Promise<void>;
}

const emptyValues: BuildingFormValues = {
  name: '',
  addressLine1: '',
  addressLine2: '',
  city: '',
  state: '',
  description: '',
  contactEmail: '',
  contactPhone: '',
};

export function BuildingForm({
  breadcrumbs,
  cancelTo,
  heading,
  subheading,
  submitLabel,
  loading = false,
  submitting = false,
  errorMessage,
  initialValues,
  onSubmit,
}: BuildingFormProps) {
  const [formState, setFormState] = useState<BuildingFormValues>(initialValues);

  useEffect(() => {
    setFormState(initialValues);
  }, [initialValues]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    await onSubmit({
      name: formState.name,
      address_line1: formState.addressLine1,
      address_line2: formState.addressLine2 || null,
      city: formState.city,
      state: formState.state,
      country: env.defaultCountry,
      description: formState.description || null,
      contact_email: formState.contactEmail || null,
      contact_phone: formState.contactPhone || null,
      for_sale: false,
      sale_price: null,
    });
  };

  return (
    <div className="max-w-3xl space-y-6">
      <AppBreadcrumbs items={breadcrumbs} />

      <div>
        <h1 className="text-3xl mb-2">{heading}</h1>
        <p className="text-muted-foreground">{subheading}</p>
      </div>

      <Card>
        <form className="space-y-6" onSubmit={handleSubmit}>
          <Input
            label="Building Name"
            placeholder="e.g., Skyline Tower"
            required
            value={formState.name}
            onChange={(event) =>
              setFormState((prev) => ({ ...prev, name: event.target.value }))
            }
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input
              label="Street Address"
              placeholder="123 Main Street"
              required
              value={formState.addressLine1}
              onChange={(event) =>
                setFormState((prev) => ({
                  ...prev,
                  addressLine1: event.target.value,
                }))
              }
            />
            <Input
              label="City"
              placeholder="Lagos"
              required
              value={formState.city}
              onChange={(event) =>
                setFormState((prev) => ({ ...prev, city: event.target.value }))
              }
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input
              label="State"
              placeholder="Lagos"
              required
              value={formState.state}
              onChange={(event) =>
                setFormState((prev) => ({ ...prev, state: event.target.value }))
              }
            />
            <Input
              label="Address Line 2"
              placeholder="Suite 4"
              value={formState.addressLine2}
              onChange={(event) =>
                setFormState((prev) => ({
                  ...prev,
                  addressLine2: event.target.value,
                }))
              }
            />
          </div>

          <div>
            <label className="block text-sm mb-2">Description</label>
            <textarea
              className="w-full px-4 py-2 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              rows={4}
              placeholder="Describe the building and its amenities..."
              value={formState.description}
              onChange={(event) =>
                setFormState((prev) => ({
                  ...prev,
                  description: event.target.value,
                }))
              }
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input
              label="Contact Email"
              type="email"
              placeholder="leasing@example.com"
              value={formState.contactEmail}
              onChange={(event) =>
                setFormState((prev) => ({
                  ...prev,
                  contactEmail: event.target.value,
                }))
              }
            />
            <Input
              label="Contact Phone"
              placeholder="+1 555 0100"
              value={formState.contactPhone}
              onChange={(event) =>
                setFormState((prev) => ({
                  ...prev,
                  contactPhone: event.target.value,
                }))
              }
            />
          </div>

          {errorMessage ? (
            <p className="text-sm text-destructive">{errorMessage}</p>
          ) : null}

          <div className="flex items-center gap-4 pt-4">
            <Button type="submit" disabled={loading || submitting}>
              {submitLabel}
            </Button>
            <Link to={cancelTo}>
              <Button type="button" variant="ghost">
                Cancel
              </Button>
            </Link>
          </div>
        </form>
      </Card>
    </div>
  );
}
