import { useNavigate } from 'react-router';
import { useState } from 'react';
import { apiPost } from '../../lib/api';
import { api, routes } from '../../lib/urls';
import type { CreateBuildingResponse } from '../../lib/responses';
import { BuildingForm } from './BuildingForm';

export function CreateBuilding() {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<{
    type: 'idle' | 'error';
    message?: string;
  }>({
    type: 'idle',
  });

  return (
    <BuildingForm
      backTo={routes.adminBuildings}
      cancelTo={routes.adminBuildings}
      heading="Add New Building"
      subheading="Create a new property in your portfolio"
      submitLabel="Create Building"
      submitting={submitting}
      errorMessage={status.type === 'error' ? status.message : undefined}
      initialValues={{
        name: '',
        addressLine1: '',
        addressLine2: '',
        city: '',
        state: '',
        description: '',
        contactEmail: '',
        contactPhone: '',
      }}
      onSubmit={async (payload) => {
        setSubmitting(true);
        setStatus({ type: 'idle' });

        try {
          const data = await apiPost<CreateBuildingResponse>(api.buildings, payload);
          navigate(routes.adminBuilding(data.building.id));
        } catch (error) {
          setStatus({
            type: 'error',
            message: (error as Error).message || 'Unable to create building.',
          });
        } finally {
          setSubmitting(false);
        }
      }}
    />
  );
}
