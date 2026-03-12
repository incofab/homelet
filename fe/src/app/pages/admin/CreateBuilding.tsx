import { Link, useNavigate } from 'react-router';
import { ArrowLeft } from 'lucide-react';
import { useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { Input } from '../../components/Input';
import { apiPost } from '../../lib/api';
import { env } from '../../lib/env';
import { api, routes } from '../../lib/urls';
import type { CreateBuildingResponse } from '../../lib/responses';

export function CreateBuilding() {
  const navigate = useNavigate();
  const [formState, setFormState] = useState({
    name: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    zip: '',
    yearBuilt: '',
    description: '',
    contactEmail: '',
    contactPhone: '',
    totalUnits: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<{
    type: 'idle' | 'error';
    message?: string;
  }>({
    type: 'idle',
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setStatus({ type: 'idle' });

    try {
      const data = await apiPost<CreateBuildingResponse>(api.buildings, {
        name: formState.name,
        address_line1: formState.addressLine1,
        address_line2: formState.addressLine2 || formState.zip || null,
        city: formState.city,
        state: formState.state,
        country: env.defaultCountry,
        description: formState.description,
        contact_email: formState.contactEmail || null,
        contact_phone: formState.contactPhone || null,
        for_sale: false,
        sale_price: null,
      });
      navigate(routes.adminBuilding(data.building.id));
    } catch (error) {
      setStatus({
        type: 'error',
        message: (error as Error).message || 'Unable to create building.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to={routes.adminBuildings}>
          <Button variant="ghost" size="sm">
            <ArrowLeft size={20} className="mr-2" />
            Back
          </Button>
        </Link>
      </div>

      <div>
        <h1 className="text-3xl mb-2">Add New Building</h1>
        <p className="text-muted-foreground">
          Create a new property in your portfolio
        </p>
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

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
              label="ZIP Code"
              placeholder="10001"
              value={formState.zip}
              onChange={(event) =>
                setFormState((prev) => ({ ...prev, zip: event.target.value }))
              }
            />
            <Input
              label="Year Built"
              type="number"
              placeholder="2020"
              value={formState.yearBuilt}
              onChange={(event) =>
                setFormState((prev) => ({
                  ...prev,
                  yearBuilt: event.target.value,
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

          <Input
            label="Total Units"
            type="number"
            placeholder="48"
            value={formState.totalUnits}
            onChange={(event) =>
              setFormState((prev) => ({
                ...prev,
                totalUnits: event.target.value,
              }))
            }
          />

          <div>
            <label className="block text-sm mb-2">Building Image</label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0] ?? null;
                setImageFile(file);
              }}
            />
            <div
              role="button"
              tabIndex={0}
              onClick={() => fileInputRef.current?.click()}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  fileInputRef.current?.click();
                }
              }}
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => {
                event.preventDefault();
                const file = event.dataTransfer.files?.[0] ?? null;
                if (file) setImageFile(file);
              }}
              className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary transition-colors cursor-pointer"
            >
              <p className="text-muted-foreground">
                Click to upload or drag and drop
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                PNG, JPG up to 10MB
              </p>
              {imageFile ? (
                <p className="text-sm mt-3">Selected: {imageFile.name}</p>
              ) : null}
            </div>
          </div>

          {status.type === 'error' && (
            <p className="text-sm text-destructive">{status.message}</p>
          )}

          <div className="flex items-center gap-4 pt-4">
            <Button type="submit" disabled={submitting}>
              Create Building
            </Button>
            <Link to={routes.adminBuildings}>
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
