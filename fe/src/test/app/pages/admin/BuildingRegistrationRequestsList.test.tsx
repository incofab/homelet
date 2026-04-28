import { cleanup, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { BuildingRegistrationRequestsList } from '../../../../app/pages/admin/BuildingRegistrationRequestsList';
import { api } from '../../../../app/lib/urls';
import { apiSuccess, mockFetch, renderWithRoute } from '../../../testUtils';

describe('BuildingRegistrationRequestsList', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it('renders paginated registration requests', async () => {
    mockFetch([
      {
        match: (url) => url.includes(api.authMe),
        response: () =>
          apiSuccess({
            dashboard_context: {
              is_platform_admin: false,
              is_building_user: true,
              has_active_lease: false,
              primary_dashboard: 'admin',
              available_dashboards: ['admin', 'home'],
            },
          }),
      },
      {
        match: (url) =>
          url.includes(`${api.buildingRegistrationRequests}?status=pending`),
        response: () =>
          apiSuccess({
            requests: {
              data: [
                {
                  id: 1,
                  name: 'Skyline Tower',
                  status: 'pending',
                  city: 'Lagos',
                  state: 'Lagos',
                  country: 'NG',
                  owner_name: 'Jane Doe',
                  owner_email: 'jane@example.com',
                },
              ],
              current_page: 1,
              last_page: 1,
              total: 1,
            },
          }),
      },
    ]);

    renderWithRoute(<BuildingRegistrationRequestsList />);

    expect(await screen.findByText('Skyline Tower')).toBeInTheDocument();
    expect(screen.getByText('Jane Doe')).toBeInTheDocument();
  });

  it('loads the selected landlord request status without using the admin endpoint', async () => {
    const fetchMock = mockFetch([
      {
        match: (url) => url.includes(api.authMe),
        response: () =>
          apiSuccess({
            dashboard_context: {
              is_platform_admin: false,
              is_building_user: true,
              has_active_lease: false,
              primary_dashboard: 'admin',
              available_dashboards: ['admin', 'home'],
            },
          }),
      },
      {
        match: (url) =>
          url.includes(`${api.buildingRegistrationRequests}?status=pending`),
        response: () =>
          apiSuccess({
            requests: {
              data: [
                {
                  id: 1,
                  name: 'Pending Tower',
                  status: 'pending',
                  city: 'Lagos',
                  state: 'Lagos',
                  country: 'NG',
                },
              ],
              current_page: 1,
              last_page: 1,
              total: 1,
            },
          }),
      },
      {
        match: (url) =>
          url.includes(`${api.buildingRegistrationRequests}?status=approved`),
        response: () =>
          apiSuccess({
            requests: {
              data: [
                {
                  id: 2,
                  name: 'Approved Tower',
                  status: 'approved',
                  city: 'Abuja',
                  state: 'FCT',
                  country: 'NG',
                },
              ],
              current_page: 1,
              last_page: 1,
              total: 1,
            },
          }),
      },
    ]);

    renderWithRoute(<BuildingRegistrationRequestsList />);

    expect(await screen.findByText('Pending Tower')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Approved' }));

    expect(await screen.findByText('Approved Tower')).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining(
        `${api.buildingRegistrationRequests}?status=approved`,
      ),
      expect.any(Object),
    );
    expect(fetchMock).not.toHaveBeenCalledWith(
      expect.stringContaining(api.adminBuildingRegistrationRequests),
      expect.any(Object),
    );
  });
});
