import { useParams, Link } from 'react-router';
import { ArrowLeft, Edit, UserPlus, Bed, Bath, Maximize } from 'lucide-react';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { StatusBadge } from '../../components/StatusBadge';
import { ImageWithFallback } from '../../components/figma/ImageWithFallback';
import { useApiQuery } from '../../hooks/useApiQuery';
import { env } from '../../lib/env';
import { formatMoney, formatStatusLabel, formatDate } from '../../lib/format';
import { api, routes } from '../../lib/urls';
import { PaginatedData, extractRecord } from '../../lib/paginatedData';
import { useCallback, useState } from 'react';
import type { ApartmentDetail, Media } from '../../lib/models';
import { AssignTenantForm } from './AssignTenantForm';

export function ApartmentDetail() {
  const { id } = useParams();
  const [showAssignTenantForm, setShowAssignTenantForm] = useState(false);
  const selectApartment = useCallback(
    (data: unknown) => extractRecord<ApartmentDetail>(data, 'apartment'),
    [],
  );
  const selectMedia = useCallback(
    (data: unknown) => PaginatedData.from<Media>(data, 'media'),
    [],
  );
  const apartmentQuery = useApiQuery<unknown, ApartmentDetail>(
    id ? api.apartment(id) : null,
    {
      enabled: Boolean(id),
      deps: [id],
      select: selectApartment,
    },
  );
  const mediaQuery = useApiQuery<unknown, PaginatedData<Media>>(
    id ? api.apartmentMedia(id) : null,
    {
      enabled: Boolean(id),
      deps: [id],
      select: selectMedia,
    },
  );

  const apartment = apartmentQuery.data;
  const tenant = apartment?.current_tenant ?? apartment?.tenant;
  const buildingId = apartment?.building?.id ?? apartment?.building_id ?? '';
  const images = mediaQuery.data?.items?.length
    ? mediaQuery.data.items.map((item) => item.url)
    : [env.placeholderImage];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link to={routes.adminBuilding(buildingId)}>
          <Button variant="ghost" size="sm">
            <ArrowLeft size={20} className="mr-2" />
            Back
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <div className="grid grid-cols-2 gap-4 mb-6">
              {images.map((img, idx) => (
                <ImageWithFallback
                  key={idx}
                  src={img}
                  alt={`${apartment?.unit_code ?? 'Unit'} - ${idx + 1}`}
                  className="w-full h-64 object-cover rounded-lg col-span-2 first:col-span-2"
                />
              ))}
            </div>

            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="text-3xl mb-2">
                  {apartment?.unit_code ?? 'Unit'}
                </h1>
                <p className="text-muted-foreground">
                  {apartment?.building?.name ?? 'Building'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge
                  status={formatStatusLabel(apartment?.status ?? 'vacant')}
                  type="apartment"
                />
                <Link
                  to={
                    id ? routes.adminApartmentEdit(id) : routes.adminBuildings
                  }
                  aria-label="Edit apartment"
                >
                  <Button variant="ghost" size="sm">
                    <Edit size={18} />
                  </Button>
                </Link>
              </div>
            </div>

            <div className="flex items-center gap-6 py-4 border-y border-border">
              <div className="flex items-center gap-2">
                <Bed size={20} className="text-muted-foreground" />
                <span>
                  {apartment?.beds ?? apartment?.bedrooms ?? '—'} Beds
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Bath size={20} className="text-muted-foreground" />
                <span>
                  {apartment?.baths ?? apartment?.bathrooms ?? '—'} Baths
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Maximize size={20} className="text-muted-foreground" />
                <span>{apartment?.sqft ?? apartment?.square_feet ?? '—'}</span>
              </div>
            </div>

            <div className="mt-6">
              <h3 className="text-xl mb-3">Description</h3>
              <p className="text-muted-foreground">
                {apartment?.description || 'No description provided.'}
              </p>
            </div>

            <div className="mt-6">
              <h3 className="text-xl mb-3">Amenities</h3>
              <div className="grid grid-cols-2 gap-2">
                {(apartment?.amenities ?? []).length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No amenities listed.
                  </p>
                ) : (
                  apartment?.amenities?.map((amenity, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-sm">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary"></div>
                      <span>{amenity}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <div className="text-2xl text-primary mb-6">
              {apartment?.yearly_price
                ? `${formatMoney(apartment.yearly_price / 12)}/mo`
                : '—'}
            </div>
            {apartment?.status?.toLowerCase?.() === 'vacant' ? (
              <div className="space-y-4">
                <Button
                  className="w-full"
                  onClick={() => setShowAssignTenantForm((prev) => !prev)}
                >
                  <UserPlus size={18} className="mr-2" />
                  {showAssignTenantForm ? 'Hide Form' : 'Assign Tenant'}
                </Button>
                {showAssignTenantForm ? (
                  <AssignTenantForm
                    apartments={[
                      {
                        id: apartment.id,
                        unit_code: apartment.unit_code,
                        yearly_price: apartment.yearly_price,
                        status: apartment.status,
                      },
                    ]}
                    defaultApartmentId={apartment.id}
                    submitLabel="Assign Tenant"
                    onSuccess={async () => {
                      setShowAssignTenantForm(false);
                      await apartmentQuery.refetch();
                    }}
                  />
                ) : null}
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">
                    Current Tenant
                  </p>
                  <p className="text-lg">{tenant?.name ?? '—'}</p>
                </div>
                <div className="pt-4 border-t border-border space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Email</span>
                    <span>{tenant?.email ?? '—'}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Phone</span>
                    <span>{tenant?.phone ?? '—'}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Lease Start</span>
                    <span>
                      {tenant?.lease_start
                        ? formatDate(tenant.lease_start)
                        : '—'}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Lease End</span>
                    <span>
                      {tenant?.lease_end ? formatDate(tenant.lease_end) : '—'}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm items-center">
                    <span className="text-muted-foreground">Status</span>
                    <StatusBadge
                      status={formatStatusLabel(tenant?.lease_status ?? '')}
                      type="lease"
                    />
                  </div>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
