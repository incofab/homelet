import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { BuildingDetail } from '../../../../app/pages/admin/BuildingDetail';
import { apiSuccess, mockFetch, renderWithRoute } from '../../../testUtils';
import { api, routePaths, routes } from '../../../../app/lib/urls';

const buildingPayload = {
  id: 1,
  name: 'Skyline Tower',
  city: 'Lagos',
  state: 'Lagos',
  description: 'High-rise building',
  units: 10,
  occupied_count: 7,
  managers: [],
};

const apartmentsPayload = [
  {
    id: 9,
    unit_code: 'A1',
    yearly_price: 1200000,
    status: 'vacant',
  },
];

describe('BuildingDetail', () => {
  it('renders building details and lets users add a tenant', async () => {
    const fetchMock = mockFetch([
      {
        match: (url) => url.includes(api.buildingApartments(1)),
        response: () => apiSuccess(apartmentsPayload),
      },
      {
        match: (url) => url.includes(api.building(1)),
        response: () => apiSuccess(buildingPayload),
      },
      {
        match: (url, init) =>
          url.includes(api.apartmentAssignTenant(9)) && init?.method === 'POST',
        response: () => apiSuccess({ apartment: { id: 9 } }, 201),
      },
    ]);

    renderWithRoute(<BuildingDetail />, {
      route: routes.adminBuilding(1),
      path: `${routes.adminRoot}/${routePaths.adminBuilding}`,
    });

    expect(await screen.findByText('Skyline Tower')).toBeInTheDocument();
    expect(screen.getByText('A1')).toBeInTheDocument();
    expect(screen.getByText('No managers assigned.')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Add Tenant' }));
    await userEvent.type(
      screen.getByPlaceholderText('Jane Doe'),
      'Mary Tenant',
    );
    await userEvent.type(
      screen.getByPlaceholderText('jane@example.com'),
      'mary@example.com',
    );
    await userEvent.type(
      screen.getByLabelText('Lease Start Date'),
      '2026-05-01',
    );
    await userEvent.click(
      screen.getByRole('button', { name: 'Add Tenant to Building' }),
    );

    await waitFor(() => {
      const request = fetchMock.mock.calls.find(
        ([url, init]) =>
          String(url).includes(api.apartmentAssignTenant(9)) &&
          init?.method === 'POST',
      );

      expect(request).toBeTruthy();
    });
  });
});
