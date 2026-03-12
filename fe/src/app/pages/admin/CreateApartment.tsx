import { useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { apiPost } from '../../lib/api';
import { api, routes } from '../../lib/urls';
import type { CreateApartmentResponse } from '../../lib/responses';
import { ApartmentForm } from './ApartmentForm';

export function CreateApartment() {
  const { buildingId } = useParams();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<{
    type: 'idle' | 'error';
    message?: string;
  }>({ type: 'idle' });

  return (
    <ApartmentForm
      backTo={routes.adminBuildingApartments(buildingId ?? '')}
      cancelTo={routes.adminBuildingApartments(buildingId ?? '')}
      heading="Add New Apartment"
      subheading="Create a new unit in this building"
      submitLabel="Create Apartment"
      submitting={submitting}
      errorMessage={status.type === 'error' ? status.message : undefined}
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
            message: (error as Error).message || 'Unable to create apartment.',
          });
        } finally {
          setSubmitting(false);
        }
      }}
    />
  );
}
