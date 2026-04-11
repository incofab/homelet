import { Link } from 'react-router';
import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { Input } from '../../components/Input';

type ApartmentFormValues = {
  unit: string;
  yearlyRent: string;
  description: string;
  amenities: string;
  status: 'vacant' | 'occupied' | 'maintenance';
  isPublic: boolean;
};

type ApartmentFormPayload = {
  unit_code: string;
  type: 'custom';
  yearly_price: number;
  description: string;
  floor: string;
  status: ApartmentFormValues['status'];
  is_public: boolean;
  amenities: string[];
};

type ApartmentFormProps = {
  backTo: string;
  cancelTo: string;
  heading: string;
  subheading: string;
  submitLabel: string;
  initialValues?: Partial<ApartmentFormValues>;
  loading?: boolean;
  submitting?: boolean;
  errorMessage?: string;
  onSubmit: (payload: ApartmentFormPayload) => Promise<void>;
};

const DEFAULT_VALUES: ApartmentFormValues = {
  unit: '',
  yearlyRent: '',
  description: '',
  amenities: '',
  status: 'vacant',
  isPublic: true,
};

export function ApartmentForm({
  backTo,
  cancelTo,
  heading,
  subheading,
  submitLabel,
  initialValues,
  loading = false,
  submitting = false,
  errorMessage,
  onSubmit,
}: ApartmentFormProps) {
  const [formState, setFormState] =
    useState<ApartmentFormValues>(DEFAULT_VALUES);

  useEffect(() => {
    setFormState({
      ...DEFAULT_VALUES,
      ...initialValues,
    });
  }, [initialValues]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    const yearlyPrice = Number(formState.yearlyRent || 0);
    const amenities = formState.amenities
      .split('\n')
      .map((item) => item.trim())
      .filter(Boolean);

    await onSubmit({
      unit_code: formState.unit.trim(),
      type: 'custom',
      yearly_price: yearlyPrice,
      description: formState.description.trim(),
      floor: '',
      status: formState.status,
      is_public: formState.isPublic,
      amenities,
    });
  };

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center gap-4">
        <Link to={backTo}>
          <Button variant="ghost" size="sm">
            <ArrowLeft size={20} className="mr-2" />
            Back
          </Button>
        </Link>
      </div>

      <div>
        <h1 className="text-3xl mb-2">{heading}</h1>
        <p className="text-muted-foreground">{subheading}</p>
      </div>

      <Card>
        <form className="space-y-6" onSubmit={handleSubmit}>
          <Input
            label="Unit Number"
            placeholder="e.g., Unit 302"
            required
            disabled={loading || submitting}
            value={formState.unit}
            onChange={(event) =>
              setFormState((prev) => ({ ...prev, unit: event.target.value }))
            }
          />

          <Input
            label="Yearly Rent"
            type="number"
            min="0"
            placeholder="1200000"
            required
            disabled={loading || submitting}
            value={formState.yearlyRent}
            onChange={(event) =>
              setFormState((prev) => ({
                ...prev,
                yearlyRent: event.target.value,
              }))
            }
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label
                className="block text-sm mb-2 text-foreground"
                htmlFor="apartment-status"
              >
                Status
              </label>
              <select
                id="apartment-status"
                className="w-full px-4 py-2 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                disabled={loading || submitting}
                value={formState.status}
                onChange={(event) =>
                  setFormState((prev) => ({
                    ...prev,
                    status: event.target.value as ApartmentFormValues['status'],
                  }))
                }
              >
                <option value="vacant">Vacant</option>
                <option value="occupied">Occupied</option>
                <option value="maintenance">Maintenance</option>
              </select>
            </div>

            <label className="flex items-center gap-3 rounded-lg border border-border px-4 py-3">
              <input
                type="checkbox"
                checked={formState.isPublic}
                disabled={loading || submitting}
                onChange={(event) =>
                  setFormState((prev) => ({
                    ...prev,
                    isPublic: event.target.checked,
                  }))
                }
              />
              <span>
                <span className="block text-sm text-foreground">
                  Public listing
                </span>
                <span className="block text-xs text-muted-foreground">
                  Show this apartment on the public listings page.
                </span>
              </span>
            </label>
          </div>

          <div>
            <label className="block text-sm mb-2 text-foreground">
              Description
            </label>
            <textarea
              className="w-full px-4 py-2 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              rows={4}
              placeholder="Describe the apartment features..."
              disabled={loading || submitting}
              value={formState.description}
              onChange={(event) =>
                setFormState((prev) => ({
                  ...prev,
                  description: event.target.value,
                }))
              }
            />
          </div>

          <div>
            <label className="block text-sm mb-2 text-foreground">
              Amenities (one per line)
            </label>
            <textarea
              className="w-full px-4 py-2 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              rows={6}
              placeholder="Hardwood Floors\nStainless Steel Appliances\nIn-Unit Washer/Dryer"
              disabled={loading || submitting}
              value={formState.amenities}
              onChange={(event) =>
                setFormState((prev) => ({
                  ...prev,
                  amenities: event.target.value,
                }))
              }
            />
          </div>

          {errorMessage ? (
            <p className="text-sm text-destructive">{errorMessage}</p>
          ) : null}
          {loading ? (
            <p className="text-sm text-muted-foreground">
              Loading apartment details...
            </p>
          ) : null}

          <div className="flex items-center gap-4 pt-4">
            <Button type="submit" disabled={loading || submitting}>
              {submitLabel}
            </Button>
            <Link to={cancelTo}>
              <Button type="button" variant="ghost" disabled={submitting}>
                Cancel
              </Button>
            </Link>
          </div>
        </form>
      </Card>
    </div>
  );
}
