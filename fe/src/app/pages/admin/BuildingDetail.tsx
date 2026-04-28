import { useParams, Link } from 'react-router';
import {
  MapPin,
  Users,
  Plus,
  Edit,
  DollarSign,
  Trash2,
  Home as HomeIcon,
} from 'lucide-react';
import { Button } from '../../components/Button';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from '../../components/Card';
import { ImageWithFallback } from '../../components/figma/ImageWithFallback';
import { StatusBadge } from '../../components/StatusBadge';
import { EmptyState } from '../../components/EmptyState';
import { Input } from '../../components/Input';
import { useApiQuery } from '../../hooks/useApiQuery';
import { apiDelete, apiPost } from '../../lib/api';
import { env } from '../../lib/env';
import { formatMoney, formatStatusLabel } from '../../lib/format';
import { api, routes } from '../../lib/urls';
import { PaginatedData, extractRecord } from '../../lib/paginatedData';
import { useCallback, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import type { ApartmentSummary, Building, Media } from '../../lib/models';
import { AssignTenantForm } from './AssignTenantForm';
import { AdminMediaManager } from '../../components/AdminMediaManager';
import { appToast } from '../../lib/toast';
import { AppBreadcrumbs } from '../../components/AppBreadcrumbs';

const BUILDING_ROLE_OPTIONS = [
  { value: 'manager', label: 'Manager' },
  { value: 'caretaker', label: 'Caretaker' },
  { value: 'landlord', label: 'Landlord' },
] as const;

export function BuildingDetail() {
  const { id } = useParams();
  const [showManagerForm, setShowManagerForm] = useState(false);
  const [managerForm, setManagerForm] = useState({
    name: '',
    email: '',
    role: 'manager',
  });
  const [managerSubmitting, setManagerSubmitting] = useState(false);
  const [managerError, setManagerError] = useState<string | null>(null);
  const [removingUserId, setRemovingUserId] = useState<number | null>(null);
  const selectBuilding = useCallback(
    (data: unknown) => extractRecord<Building>(data, 'building'),
    [],
  );
  const selectApartments = useCallback(
    (data: unknown) => PaginatedData.from<ApartmentSummary>(data, 'apartments'),
    [],
  );
  const selectMedia = useCallback(
    (data: unknown) => PaginatedData.from<Media>(data, 'media'),
    [],
  );
  const selectProfile = useCallback(
    (data: unknown) =>
      extractRecord<{ user?: { id?: number }; dashboard_context?: unknown }>(
        data,
      ),
    [],
  );
  const buildingQuery = useApiQuery<unknown, Building>(
    id ? api.building(id) : null,
    {
      enabled: Boolean(id),
      deps: [id],
      select: selectBuilding,
    },
  );
  const apartmentsQuery = useApiQuery<unknown, PaginatedData<ApartmentSummary>>(
    id ? api.buildingApartments(id) : null,
    {
      enabled: Boolean(id),
      deps: [id],
      select: selectApartments,
    },
  );
  const mediaQuery = useApiQuery<unknown, PaginatedData<Media>>(
    id ? api.buildingMedia(id) : null,
    {
      enabled: Boolean(id),
      deps: [id],
      select: selectMedia,
    },
  );
  const meQuery = useApiQuery<
    unknown,
    { user?: { id?: number }; dashboard_context?: unknown }
  >(api.authMe, {
    select: selectProfile,
  });

  const building = buildingQuery.data;
  const currentUserId = meQuery.data?.user?.id ?? null;
  const apartments = apartmentsQuery.data?.items ?? [];
  const media = mediaQuery.data?.items ?? building?.media ?? [];
  const vacantApartments = useMemo(
    () =>
      apartments.filter(
        (apartment) =>
          (apartment.status?.toLowerCase?.() ?? 'vacant') === 'vacant',
      ),
    [apartments],
  );
  const totalUnits =
    building?.units ?? building?.apartments_count ?? apartments.length;
  const occupied =
    building?.occupied_count ??
    apartments.filter((apt) => apt.status?.toLowerCase?.() === 'occupied')
      .length;
  const occupancyRate =
    totalUnits > 0 ? Math.round((occupied / totalUnits) * 100) : null;
  const location = [
    building?.address_line1,
    building?.address_line2,
    building?.city,
    building?.state,
  ]
    .filter(Boolean)
    .join(', ');
  const image = media[0]?.url ?? env.buildingPlaceholderImage;

  const handleManagerSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!id || managerSubmitting) return;

    setManagerSubmitting(true);
    setManagerError(null);

    try {
      await apiPost(api.buildingManagers(id), {
        name: managerForm.name || null,
        email: managerForm.email,
        role: managerForm.role,
      });
      setManagerForm({ name: '', email: '', role: 'manager' });
      setShowManagerForm(false);
      appToast.success('Building role added successfully.');
      await buildingQuery.refetch();
    } catch (error) {
      const message = (error as Error).message || 'Unable to add manager.';
      setManagerError(message);
      appToast.error(message);
    } finally {
      setManagerSubmitting(false);
    }
  };

  const canRemoveBuildingRole = (manager: {
    id: number;
    role?: string;
  }): boolean => {
    const role = manager.role?.toLowerCase?.() ?? 'manager';

    if (role === 'landlord') {
      return (
        currentUserId === building?.owner_id &&
        manager.id !== building?.owner_id
      );
    }

    return true;
  };

  const handleRemoveBuildingRole = async (manager: {
    id: number;
    name: string;
    role?: string;
  }) => {
    if (!id || removingUserId) return;
    if (!window.confirm(`Remove ${manager.name} from this building?`)) return;

    setRemovingUserId(manager.id);

    try {
      await apiDelete(api.buildingManager(id, manager.id));
      appToast.success('Building role removed successfully.');
      await buildingQuery.refetch();
    } catch (error) {
      appToast.error((error as Error).message || 'Unable to remove role.');
    } finally {
      setRemovingUserId(null);
    }
  };

  return (
    <div className="space-y-6">
      <AppBreadcrumbs
        items={[
          { label: 'Buildings', to: routes.adminBuildings },
          { label: building?.name ?? 'Building' },
        ]}
      />

      {/* Building Info */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <ImageWithFallback
              src={image}
              alt={building?.name ?? 'Building'}
              className="w-full h-64 object-cover rounded-lg mb-6"
            />
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h1 className="text-3xl mb-2">
                  {building?.name ?? 'Building'}
                </h1>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin size={18} />
                  <span>{location || 'Location unavailable'}</span>
                </div>
              </div>
              <Link
                to={id ? routes.adminBuildingEdit(id) : routes.adminBuildings}
                aria-label="Edit building"
              >
                <Button variant="ghost" size="sm">
                  <Edit size={18} />
                </Button>
              </Link>
            </div>
            <p className="text-muted-foreground mb-4">
              {building?.description || 'No description provided.'}
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-border">
              <div>
                <p className="text-sm text-muted-foreground mb-1">
                  Total Units
                </p>
                <p className="text-xl">{totalUnits || '—'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Occupied</p>
                <p className="text-xl text-success">{occupied || 0}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">
                  Occupancy Rate
                </p>
                <p className="text-xl">
                  {occupancyRate === null ? '—' : `${occupancyRate}%`}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Year Built</p>
                <p className="text-xl">{building?.year_built ?? '—'}</p>
              </div>
            </div>
          </Card>

          {/* Apartments */}
          <Card>
            <CardHeader>
              <CardTitle>Building Images</CardTitle>
            </CardHeader>
            <CardContent>
              <AdminMediaManager
                title="Building Images"
                emptyLabel="No building images uploaded yet."
                items={media}
                uploadPath={api.buildingMedia(id ?? '')}
                deletePath={(mediaId) =>
                  api.buildingMediaItem(id ?? '', mediaId)
                }
                onChanged={async () => {
                  await Promise.all([
                    buildingQuery.refetch(),
                    mediaQuery.refetch(),
                  ]);
                }}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Apartments</CardTitle>
                <Link to={routes.adminBuildingApartments(id ?? '')}>
                  <Button size="sm">View All</Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {apartmentsQuery.loading ? (
                <p className="text-muted-foreground">Loading apartments...</p>
              ) : apartments.length === 0 ? (
                <EmptyState
                  icon={
                    <HomeIcon size={28} className="text-muted-foreground" />
                  }
                  title="No apartments yet"
                  description="Add apartments to start managing this building."
                />
              ) : (
                <div className="space-y-3">
                  {apartments.slice(0, 4).map((apt) => (
                    <Link key={apt.id} to={routes.adminApartment(apt.id)}>
                      <div className="flex items-center justify-between p-4 hover:bg-muted rounded-lg transition-colors">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                            <HomeIcon size={24} className="text-primary" />
                          </div>
                          <div>
                            <p className="mb-1">{apt.unit_code ?? 'Unit'}</p>
                            <p className="text-sm text-muted-foreground">
                              {apt.beds ?? apt.bedrooms ?? '—'} bed ·{' '}
                              {apt.baths ?? apt.bathrooms ?? '—'} bath
                              {apt.tenant?.name ? ` · ${apt.tenant.name}` : ''}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="mb-2">
                            {apt.yearly_price
                              ? `${formatMoney(apt.yearly_price)}/year`
                              : '—'}
                          </p>
                          <StatusBadge
                            status={formatStatusLabel(apt.status ?? 'vacant')}
                            type="apartment"
                          />
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Managers */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Managers</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  aria-label="Add manager"
                  onClick={() => {
                    setManagerError(null);
                    setShowManagerForm((current) => !current);
                  }}
                >
                  <Plus size={18} />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {showManagerForm ? (
                <form className="space-y-3" onSubmit={handleManagerSubmit}>
                  <Input
                    label="Manager Name"
                    placeholder="Jane Manager"
                    value={managerForm.name}
                    onChange={(event) =>
                      setManagerForm((current) => ({
                        ...current,
                        name: event.target.value,
                      }))
                    }
                  />
                  <Input
                    label="Manager Email"
                    type="email"
                    placeholder="manager@example.com"
                    required
                    value={managerForm.email}
                    onChange={(event) =>
                      setManagerForm((current) => ({
                        ...current,
                        email: event.target.value,
                      }))
                    }
                  />
                  <div>
                    <label
                      htmlFor="building-role"
                      className="block text-sm mb-2 text-foreground"
                    >
                      Role
                    </label>
                    <select
                      id="building-role"
                      className="w-full rounded-lg border border-border bg-input-background px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                      value={managerForm.role}
                      onChange={(event) =>
                        setManagerForm((current) => ({
                          ...current,
                          role: event.target.value,
                        }))
                      }
                    >
                      {BUILDING_ROLE_OPTIONS.map((role) => (
                        <option key={role.value} value={role.value}>
                          {role.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  {managerError ? (
                    <p className="text-sm text-destructive">{managerError}</p>
                  ) : null}
                  <div className="flex gap-2">
                    <Button
                      type="submit"
                      size="sm"
                      disabled={managerSubmitting}
                    >
                      {managerSubmitting ? 'Adding...' : 'Add Manager'}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setManagerError(null);
                        setShowManagerForm(false);
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              ) : null}

              {(building?.managers ?? []).length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No managers assigned.
                </p>
              ) : (
                <div className="space-y-4">
                  {building?.managers?.map((manager) => (
                    <div
                      key={manager.id}
                      className="pb-4 border-b border-border last:border-0 last:pb-0"
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                          <Users size={20} className="text-primary" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p>{manager.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {manager.email ?? ''}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatStatusLabel(manager.role ?? 'manager')}
                            {manager.id === building?.owner_id
                              ? ' · Primary owner'
                              : ''}
                          </p>
                        </div>
                        {canRemoveBuildingRole(manager) ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            aria-label={`Remove ${manager.name}`}
                            disabled={removingUserId === manager.id}
                            onClick={() => handleRemoveBuildingRole(manager)}
                          >
                            <Trash2 size={16} />
                          </Button>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Actions */}
          <Card>
            <CardContent className="space-y-3">
              <Link
                to={routes.adminBuildingApartmentsNew(id ?? '')}
                className="my-2 block"
              >
                <Button className="w-full">
                  <Plus size={18} className="mr-2" />
                  Add Apartment
                </Button>
              </Link>
              <Link
                to={routes.adminBuildingTenants(id ?? '')}
                className="my-2 block"
              >
                <Button variant="secondary" className="w-full">
                  <Users size={18} className="mr-2" />
                  View Tenants
                </Button>
              </Link>
              <Button variant="secondary" className="w-full my-2">
                <DollarSign size={18} className="mr-2" />
                {building?.for_sale
                  ? `For Sale (${formatMoney(building.sale_price ?? 0)})`
                  : 'Mark For Sale'}
              </Button>
              <AssignTenantForm
                apartments={vacantApartments}
                triggerLabel="Add Tenant"
                triggerVariant="secondary"
                submitLabel="Add Tenant to Building"
                onSuccess={async () => {
                  await Promise.all([
                    buildingQuery.refetch(),
                    apartmentsQuery.refetch(),
                  ]);
                }}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
