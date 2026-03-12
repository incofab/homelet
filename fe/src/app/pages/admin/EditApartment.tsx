import { useCallback, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { useApiQuery } from '../../hooks/useApiQuery';
import { apiPut } from '../../lib/api';
import { extractRecord } from '../../lib/paginatedData';
import { api, routes } from '../../lib/urls';
import type { ApartmentDetail } from '../../lib/models';
import { ApartmentForm } from './ApartmentForm';

export function EditApartment() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<{
    type: 'idle' | 'error';
    message?: string;
  }>({ type: 'idle' });
  const [submitting, setSubmitting] = useState(false);

  const selectApartment = useCallback(
    (data: unknown) => extractRecord<ApartmentDetail>(data, 'apartment'),
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

  const apartment = apartmentQuery.data;
  const buildingId = apartment?.building?.id ?? apartment?.building_id ?? '';

  return (
    <ApartmentForm
      backTo={id ? routes.adminApartment(id) : routes.adminBuildings}
      cancelTo={id ? routes.adminApartment(id) : routes.adminBuildings}
      heading="Edit Apartment"
      subheading="Update this apartment's listing details"
      submitLabel="Save Changes"
      loading={apartmentQuery.loading}
      submitting={submitting}
      errorMessage={status.type === 'error' ? status.message : undefined}
      initialValues={{
        unit: apartment?.unit_code ?? '',
        monthlyRent: apartment?.yearly_price
          ? String(Math.round(apartment.yearly_price / 12))
          : '',
        description: apartment?.description ?? '',
        amenities: (apartment?.amenities ?? []).join('\n'),
        status:
          apartment?.status === 'occupied' ||
          apartment?.status === 'maintenance'
            ? apartment.status
            : 'vacant',
        isPublic: apartment?.is_public ?? false,
      }}
      onSubmit={async (payload) => {
        if (!id) return;

        setSubmitting(true);
        setStatus({ type: 'idle' });

        try {
          await apiPut(api.apartment(id), payload);
          navigate(routes.adminApartment(id));
        } catch (error) {
          setStatus({
            type: 'error',
            message: (error as Error).message || 'Unable to update apartment.',
          });
        } finally {
          setSubmitting(false);
        }
      }}
    />
  );
}
