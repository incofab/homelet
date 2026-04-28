import { useCallback, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { useApiQuery } from '../../hooks/useApiQuery';
import { apiPut } from '../../lib/api';
import { extractRecord } from '../../lib/paginatedData';
import { api, routes } from '../../lib/urls';
import type { Building } from '../../lib/models';
import { BuildingForm } from './BuildingForm';

export function EditBuilding() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<{
    type: 'idle' | 'error';
    message?: string;
  }>({ type: 'idle' });
  const [submitting, setSubmitting] = useState(false);

  const selectBuilding = useCallback(
    (data: unknown) => extractRecord<Building>(data, 'building'),
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

  const building = buildingQuery.data;

  return (
    <BuildingForm
      breadcrumbs={[
        { label: 'Buildings', to: routes.adminBuildings },
        {
          label: building?.name ?? 'Building',
          to: id ? routes.adminBuilding(id) : routes.adminBuildings,
        },
        { label: 'Edit' },
      ]}
      cancelTo={id ? routes.adminBuilding(id) : routes.adminBuildings}
      heading="Edit Building"
      subheading="Update this building's profile and contact details"
      submitLabel="Save Changes"
      loading={buildingQuery.loading}
      submitting={submitting}
      errorMessage={status.type === 'error' ? status.message : undefined}
      initialValues={{
        name: building?.name ?? '',
        addressLine1: building?.address_line1 ?? '',
        addressLine2: building?.address_line2 ?? '',
        city: building?.city ?? '',
        state: building?.state ?? '',
        description: building?.description ?? '',
        contactEmail: building?.contact_email ?? '',
        contactPhone: building?.contact_phone ?? '',
      }}
      onSubmit={async (payload) => {
        if (!id) return;

        setSubmitting(true);
        setStatus({ type: 'idle' });

        try {
          await apiPut(api.building(id), payload);
          navigate(routes.adminBuilding(id));
        } catch (error) {
          setStatus({
            type: 'error',
            message: (error as Error).message || 'Unable to update building.',
          });
        } finally {
          setSubmitting(false);
        }
      }}
    />
  );
}
