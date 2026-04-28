import { useParams, Link } from 'react-router';
import { Copy, Edit, Bed, Bath, Maximize } from 'lucide-react';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { StatusBadge } from '../../components/StatusBadge';
import { AppBreadcrumbs } from '../../components/AppBreadcrumbs';
import { ImageWithFallback } from '../../components/figma/ImageWithFallback';
import { useApiQuery } from '../../hooks/useApiQuery';
import { env } from '../../lib/env';
import { formatMoney, formatStatusLabel, formatDate } from '../../lib/format';
import { api, routes } from '../../lib/urls';
import { PaginatedData, extractRecord } from '../../lib/paginatedData';
import { useCallback, useMemo, useState } from 'react';
import type { ApartmentDetail, Media } from '../../lib/models';
import { AssignTenantForm } from './AssignTenantForm';
import { AdminMediaManager } from '../../components/AdminMediaManager';
import { RecordPaymentDialog } from './RecordPaymentDialog';
import { appToast } from '../../lib/toast';

export function ApartmentDetail() {
  const { id } = useParams();
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
    : [env.apartmentPlaceholderImage];
  const rentRequestUrl = useMemo(() => {
    if (!id || typeof window === 'undefined') return '';
    return `${window.location.origin}${routes.rentRequest(id)}`;
  }, [id]);
  const shareText = useMemo(() => {
    const unit = apartment?.unit_code
      ? `Apartment ${apartment.unit_code}`
      : 'This apartment';
    const building = apartment?.building?.name
      ? ` at ${apartment.building.name}`
      : '';

    return `${unit}${building} is ready for your rental request. Open this link to submit your details: ${rentRequestUrl}`;
  }, [apartment?.building?.name, apartment?.unit_code, rentRequestUrl]);
  const shareLinks = useMemo(() => {
    const encodedText = encodeURIComponent(shareText);
    const encodedSubject = encodeURIComponent('Rental request link');

    return {
      whatsapp: `https://wa.me/?text=${encodedText}`,
      sms: `sms:?&body=${encodedText}`,
      email: `mailto:?subject=${encodedSubject}&body=${encodedText}`,
    };
  }, [shareText]);
  const isVacant = apartment?.status?.toLowerCase?.() === 'vacant';
  const activeLeaseId = tenant?.lease_id ?? null;
  const rentAmount = tenant?.rent_amount ?? apartment?.yearly_price ?? null;

  const copyRentRequestUrl = useCallback(async () => {
    if (!rentRequestUrl) return;

    try {
      await window.navigator.clipboard.writeText(rentRequestUrl);
      appToast.success('Link copied to clipboard.');
    } catch (error) {
      appToast.error('Copy failed. Select and copy the link manually.');
    }
  }, [rentRequestUrl]);

  return (
    <div className="space-y-6">
      <AppBreadcrumbs
        items={[
          { label: 'Buildings', to: routes.adminBuildings },
          {
            label: apartment?.building?.name ?? 'Building',
            to: buildingId
              ? routes.adminBuilding(buildingId)
              : routes.adminBuildings,
          },
          {
            label: 'Apartments',
            to: buildingId
              ? routes.adminBuildingApartments(buildingId)
              : routes.adminBuildings,
          },
          { label: apartment?.unit_code ?? 'Apartment' },
        ]}
      />

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
                {buildingId && id ? (
                  <Link
                    to={`${routes.adminBuildingApartmentsNew(buildingId)}?duplicateFrom=${id}`}
                    aria-label="Duplicate apartment"
                  >
                    <Button variant="ghost" size="sm">
                      <Copy size={18} />
                    </Button>
                  </Link>
                ) : null}
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

            <div className="mt-6 pt-6 border-t border-border">
              <AdminMediaManager
                title="Apartment Images"
                emptyLabel="No apartment images uploaded yet."
                items={mediaQuery.data?.items ?? []}
                uploadPath={api.apartmentMedia(id ?? '')}
                deletePath={(mediaId) =>
                  api.apartmentMediaItem(id ?? '', mediaId)
                }
                onChanged={async () => {
                  await mediaQuery.refetch();
                }}
              />
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <div className="text-2xl text-primary mb-6">
              {apartment?.yearly_price
                ? `${formatMoney(apartment.yearly_price)}/year`
                : '—'}
            </div>
            <div className="space-y-4">
              <div>
                <h2 className="text-xl">Next best action</h2>
                <p className="text-sm text-muted-foreground">
                  Choose the fastest path for this apartment.
                </p>
              </div>

              <div className="space-y-2 rounded-lg border border-border p-3">
                <p className="text-sm text-muted-foreground">
                  Share rental request link
                </p>
                <p className="break-all text-sm">{rentRequestUrl || '—'}</p>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={copyRentRequestUrl}
                    disabled={!rentRequestUrl || !isVacant}
                    className="w-full"
                  >
                    <Copy size={16} className="mr-2" />
                    Copy Link
                  </Button>
                  <a
                    href={shareLinks.whatsapp}
                    target="_blank"
                    rel="noreferrer"
                    className={!isVacant ? 'pointer-events-none' : undefined}
                    aria-disabled={!isVacant}
                  >
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      disabled={!isVacant}
                      className="w-full"
                    >
                      WhatsApp
                    </Button>
                  </a>
                  <a
                    href={shareLinks.sms}
                    className={!isVacant ? 'pointer-events-none' : undefined}
                    aria-disabled={!isVacant}
                  >
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      disabled={!isVacant}
                      className="w-full"
                    >
                      SMS
                    </Button>
                  </a>
                  <a
                    href={shareLinks.email}
                    className={!isVacant ? 'pointer-events-none' : undefined}
                    aria-disabled={!isVacant}
                  >
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      disabled={!isVacant}
                      className="w-full"
                    >
                      Email
                    </Button>
                  </a>
                </div>
                {!isVacant ? (
                  <p className="text-xs text-muted-foreground">
                    Request sharing is available when the apartment is vacant.
                  </p>
                ) : null}
              </div>

              {isVacant ? (
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
                  triggerLabel="Assign Tenant"
                  submitLabel="Assign Tenant"
                  onSuccess={async () => {
                    await apartmentQuery.refetch();
                  }}
                />
              ) : (
                <Button className="w-full" disabled>
                  Assign Tenant
                </Button>
              )}

              <RecordPaymentDialog
                triggerVariant="secondary"
                triggerClassName="w-full"
                triggerDisabled={!activeLeaseId}
                defaultLeaseId={activeLeaseId}
                defaultAmount={rentAmount}
                onSuccess={async () => {
                  await apartmentQuery.refetch();
                }}
              />
              {!activeLeaseId ? (
                <p className="text-xs text-muted-foreground">
                  Record payment becomes available after an active tenant lease
                  exists.
                </p>
              ) : null}
            </div>

            {isVacant ? null : (
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">
                    Current Tenant
                  </p>
                  <p className="text-lg">{tenant?.name ?? '—'}</p>
                </div>
                {tenant?.id ? (
                  <Link to={routes.adminTenant(tenant.id)}>
                    <Button variant="secondary" size="sm">
                      View Tenant Details
                    </Button>
                  </Link>
                ) : null}
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
