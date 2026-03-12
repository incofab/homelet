import { useParams, Link } from 'react-router';
import {
  ArrowLeft,
  MapPin,
  Users,
  Plus,
  Edit,
  DollarSign,
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
import { useApiQuery } from '../../hooks/useApiQuery';
import { env } from '../../lib/env';
import { formatMoney, formatStatusLabel } from '../../lib/format';
import { api, routes } from '../../lib/urls';
import { PaginatedData, extractRecord } from '../../lib/paginatedData';
import { useCallback, useMemo, useState } from 'react';
import type { ApartmentSummary, Building } from '../../lib/models';
import { AssignTenantForm } from './AssignTenantForm';

export function BuildingDetail() {
  const { id } = useParams();
  const selectBuilding = useCallback(
    (data: unknown) => extractRecord<Building>(data, 'building'),
    [],
  );
  const selectApartments = useCallback(
    (data: unknown) => PaginatedData.from<ApartmentSummary>(data, 'apartments'),
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

  const building = buildingQuery.data;
  const apartments = apartmentsQuery.data?.items ?? [];
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
  const image = building?.media?.[0]?.url ?? env.placeholderImage;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to={routes.adminBuildings}>
          <Button variant="ghost" size="sm">
            <ArrowLeft size={20} className="mr-2" />
            Back
          </Button>
        </Link>
      </div>

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
              <Button variant="ghost" size="sm">
                <Edit size={18} />
              </Button>
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
                <Button variant="ghost" size="sm">
                  <Plus size={18} />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
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
                        <div>
                          <p>{manager.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {manager.email ?? ''}
                          </p>
                        </div>
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
              <Link to={routes.adminBuildingApartmentsNew(id ?? '')}>
                <Button className="w-full">
                  <Plus size={18} className="mr-2" />
                  Add Apartment
                </Button>
              </Link>
              <Button variant="secondary" className="w-full">
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
