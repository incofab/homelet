import { useCallback, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router';
import { Plus, Trash2 } from 'lucide-react';
import { apiPost } from '../../lib/api';
import { api, routes } from '../../lib/urls';
import type { CreateApartmentResponse } from '../../lib/responses';
import { ApartmentForm } from './ApartmentForm';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { AppBreadcrumbs } from '../../components/AppBreadcrumbs';
import { useApiQuery } from '../../hooks/useApiQuery';
import { extractRecord } from '../../lib/paginatedData';
import type { ApartmentDetail } from '../../lib/models';

type BulkApartmentRow = {
  id: number;
  unit: string;
  yearlyRent: string;
  type:
    | 'one_room'
    | 'self_contain'
    | 'one_bedroom'
    | 'two_bedroom'
    | 'three_bedroom'
    | 'custom';
  floor: string;
  status: 'vacant' | 'occupied' | 'maintenance';
  isPublic: boolean;
};

const createEmptyBulkRow = (id: number): BulkApartmentRow => ({
  id,
  unit: '',
  yearlyRent: '',
  type: 'custom',
  floor: '',
  status: 'vacant',
  isPublic: true,
});

const isSupportedApartmentType = (
  type?: string,
): type is BulkApartmentRow['type'] =>
  [
    'one_room',
    'self_contain',
    'one_bedroom',
    'two_bedroom',
    'three_bedroom',
    'custom',
  ].includes(type ?? '');

export function CreateApartment() {
  const { buildingId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [mode, setMode] = useState<'single' | 'bulk'>('single');
  const [rows, setRows] = useState<BulkApartmentRow[]>([
    createEmptyBulkRow(1),
    createEmptyBulkRow(2),
  ]);
  const [status, setStatus] = useState<{
    type: 'idle' | 'error';
    message?: string;
  }>({ type: 'idle' });
  const duplicateFrom = searchParams.get('duplicateFrom');
  const selectApartment = useCallback(
    (data: unknown) => extractRecord<ApartmentDetail>(data, 'apartment'),
    [],
  );
  const duplicateQuery = useApiQuery<unknown, ApartmentDetail>(
    duplicateFrom ? api.apartment(duplicateFrom) : null,
    {
      enabled: Boolean(duplicateFrom),
      deps: [duplicateFrom],
      select: selectApartment,
    },
  );
  const sourceApartment = duplicateQuery.data;
  const isDuplicating = Boolean(duplicateFrom);

  const createBulkApartments = async () => {
    if (!buildingId) return;

    const apartments = rows
      .map((row) => ({
        unit_code: row.unit.trim(),
        type: row.type,
        yearly_price: Number(row.yearlyRent || 0),
        floor: row.floor.trim(),
        status: row.status,
        is_public: row.isPublic,
      }))
      .filter((row) => row.unit_code.length > 0);

    if (apartments.length === 0) {
      setStatus({
        type: 'error',
        message: 'Add at least one apartment unit number.',
      });
      return;
    }

    setSubmitting(true);
    setStatus({ type: 'idle' });

    try {
      await apiPost<CreateApartmentResponse>(
        api.buildingApartments(buildingId),
        {
          apartments,
        },
      );
      navigate(routes.adminBuildingApartments(buildingId));
    } catch (error) {
      setStatus({
        type: 'error',
        message: (error as Error).message || 'Unable to create apartments.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (mode === 'bulk' && !isDuplicating) {
    return (
      <div className="max-w-5xl space-y-6">
        <AppBreadcrumbs
          items={[
            { label: 'Buildings', to: routes.adminBuildings },
            {
              label: 'Building',
              to: routes.adminBuilding(buildingId ?? ''),
            },
            {
              label: 'Apartments',
              to: routes.adminBuildingApartments(buildingId ?? ''),
            },
            { label: 'Add Apartments' },
          ]}
        />

        <div>
          <h1 className="text-3xl mb-2">Add Apartments</h1>
          <p className="text-muted-foreground">
            Register several units now with basic details. You can add photos,
            descriptions, and amenities later.
          </p>
        </div>

        <div className="inline-flex rounded-lg border border-border p-1">
          <button
            type="button"
            className="rounded-md px-4 py-2 text-sm text-muted-foreground"
            onClick={() => setMode('single')}
          >
            Single apartment
          </button>
          <button
            type="button"
            className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground"
          >
            Multiple apartments
          </button>
        </div>

        <Card>
          <div className="space-y-4">
            {rows.map((row, index) => (
              <div
                key={row.id}
                className="grid grid-cols-1 gap-4 border-b border-border pb-4 last:border-0 md:grid-cols-[1.2fr_1fr_1fr_0.8fr_1fr_auto]"
              >
                <Input
                  label={index === 0 ? 'Unit Number' : ' '}
                  placeholder="e.g., Unit 302"
                  required
                  disabled={submitting}
                  value={row.unit}
                  onChange={(event) =>
                    setRows((prev) =>
                      prev.map((item) =>
                        item.id === row.id
                          ? { ...item, unit: event.target.value }
                          : item,
                      ),
                    )
                  }
                />
                <Input
                  label={index === 0 ? 'Yearly Rent' : ' '}
                  type="number"
                  min="0"
                  placeholder="1200000"
                  required
                  disabled={submitting}
                  value={row.yearlyRent}
                  onChange={(event) =>
                    setRows((prev) =>
                      prev.map((item) =>
                        item.id === row.id
                          ? { ...item, yearlyRent: event.target.value }
                          : item,
                      ),
                    )
                  }
                />
                <div>
                  {index === 0 ? (
                    <label className="block text-sm mb-2 text-foreground">
                      Type
                    </label>
                  ) : (
                    <div className="hidden md:block h-7" />
                  )}
                  <select
                    className="w-full px-4 py-2 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    disabled={submitting}
                    value={row.type}
                    onChange={(event) =>
                      setRows((prev) =>
                        prev.map((item) =>
                          item.id === row.id
                            ? {
                                ...item,
                                type: event.target
                                  .value as BulkApartmentRow['type'],
                              }
                            : item,
                        ),
                      )
                    }
                  >
                    <option value="custom">Custom</option>
                    <option value="one_room">One room</option>
                    <option value="self_contain">Self contain</option>
                    <option value="one_bedroom">One bedroom</option>
                    <option value="two_bedroom">Two bedroom</option>
                    <option value="three_bedroom">Three bedroom</option>
                  </select>
                </div>
                <Input
                  label={index === 0 ? 'Floor' : ' '}
                  placeholder="2"
                  disabled={submitting}
                  value={row.floor}
                  onChange={(event) =>
                    setRows((prev) =>
                      prev.map((item) =>
                        item.id === row.id
                          ? { ...item, floor: event.target.value }
                          : item,
                      ),
                    )
                  }
                />
                <div>
                  {index === 0 ? (
                    <label className="block text-sm mb-2 text-foreground">
                      Status
                    </label>
                  ) : (
                    <div className="hidden md:block h-7" />
                  )}
                  <select
                    className="w-full px-4 py-2 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    disabled={submitting}
                    value={row.status}
                    onChange={(event) =>
                      setRows((prev) =>
                        prev.map((item) =>
                          item.id === row.id
                            ? {
                                ...item,
                                status: event.target
                                  .value as BulkApartmentRow['status'],
                              }
                            : item,
                        ),
                      )
                    }
                  >
                    <option value="vacant">Vacant</option>
                    <option value="occupied">Occupied</option>
                    <option value="maintenance">Maintenance</option>
                  </select>
                </div>
                <div className="flex items-end gap-3">
                  <label className="flex min-h-10 items-center gap-2 rounded-lg border border-border px-3">
                    <input
                      type="checkbox"
                      checked={row.isPublic}
                      disabled={submitting}
                      onChange={(event) =>
                        setRows((prev) =>
                          prev.map((item) =>
                            item.id === row.id
                              ? { ...item, isPublic: event.target.checked }
                              : item,
                          ),
                        )
                      }
                    />
                    <span className="text-sm">Public</span>
                  </label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={submitting || rows.length === 1}
                    onClick={() =>
                      setRows((prev) =>
                        prev.filter((item) => item.id !== row.id),
                      )
                    }
                    aria-label={`Remove apartment row ${index + 1}`}
                  >
                    <Trash2 size={16} />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {status.type === 'error' ? (
            <p className="mt-4 text-sm text-destructive">{status.message}</p>
          ) : null}

          <div className="mt-6 flex flex-wrap items-center gap-4">
            <Button
              type="button"
              variant="secondary"
              disabled={submitting}
              onClick={() =>
                setRows((prev) => [
                  ...prev,
                  createEmptyBulkRow(
                    Math.max(...prev.map((row) => row.id), 0) + 1,
                  ),
                ])
              }
            >
              <Plus size={18} className="mr-2" />
              Add another row
            </Button>
            <Button
              type="button"
              disabled={submitting}
              onClick={createBulkApartments}
            >
              {submitting ? 'Creating...' : 'Create Apartments'}
            </Button>
            <Link to={routes.adminBuildingApartments(buildingId ?? '')}>
              <Button type="button" variant="ghost" disabled={submitting}>
                Cancel
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {!isDuplicating ? (
        <div className="inline-flex rounded-lg border border-border p-1">
          <button
            type="button"
            className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground"
          >
            Single apartment
          </button>
          <button
            type="button"
            className="rounded-md px-4 py-2 text-sm text-muted-foreground"
            onClick={() => setMode('bulk')}
          >
            Multiple apartments
          </button>
        </div>
      ) : null}

      <ApartmentForm
        breadcrumbs={[
          { label: 'Buildings', to: routes.adminBuildings },
          {
            label: 'Building',
            to: routes.adminBuilding(buildingId ?? ''),
          },
          {
            label: 'Apartments',
            to: routes.adminBuildingApartments(buildingId ?? ''),
          },
          { label: isDuplicating ? 'Duplicate Apartment' : 'Add Apartment' },
        ]}
        cancelTo={routes.adminBuildingApartments(buildingId ?? '')}
        heading={isDuplicating ? 'Duplicate Apartment' : 'Add New Apartment'}
        subheading={
          isDuplicating
            ? 'Review the copied details, then change the unit number and rent as needed.'
            : 'Create a new unit in this building'
        }
        submitLabel={isDuplicating ? 'Create Duplicate' : 'Create Apartment'}
        loading={duplicateQuery.loading}
        submitting={submitting}
        errorMessage={status.type === 'error' ? status.message : undefined}
        initialValues={
          sourceApartment
            ? {
                unit: sourceApartment.unit_code ?? '',
                type: isSupportedApartmentType(sourceApartment.type)
                  ? sourceApartment.type
                  : 'custom',
                yearlyRent: sourceApartment.yearly_price
                  ? String(sourceApartment.yearly_price)
                  : '',
                floor: sourceApartment.floor ?? '',
                description: sourceApartment.description ?? '',
                amenities: (sourceApartment.amenities ?? []).join('\n'),
                status: 'vacant',
                isPublic: sourceApartment.is_public ?? true,
              }
            : undefined
        }
        onSubmit={async (payload) => {
          if (!buildingId) return;

          setSubmitting(true);
          setStatus({ type: 'idle' });

          try {
            const data = await apiPost<CreateApartmentResponse>(
              api.buildingApartments(buildingId),
              payload,
            );
            navigate(routes.adminApartment(data.apartment.id));
          } catch (error) {
            setStatus({
              type: 'error',
              message:
                (error as Error).message || 'Unable to create apartment.',
            });
          } finally {
            setSubmitting(false);
          }
        }}
      />
    </div>
  );
}
