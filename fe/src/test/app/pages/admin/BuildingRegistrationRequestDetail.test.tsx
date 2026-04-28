import { cleanup, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { BuildingRegistrationRequestDetail } from '../../../../app/pages/admin/BuildingRegistrationRequestDetail';
import { apiSuccess, mockFetch, renderWithRoute } from '../../../testUtils';
import { api } from '../../../../app/lib/urls';

describe('BuildingRegistrationRequestDetail', () => {
  afterEach(() => {
    cleanup();
  });

  it('shows pending building details with approve and reject actions', async () => {
    mockFetch([
      {
        match: (url) => url.includes(api.authMe),
        response: () =>
          apiSuccess({
            dashboard_context: {
              is_platform_admin: true,
              is_building_user: false,
              has_active_lease: false,
              primary_dashboard: 'admin',
              available_dashboards: ['admin', 'home'],
            },
          }),
      },
      {
        match: (url) => url.includes(api.adminBuildingRegistrationRequest(7)),
        response: () =>
          apiSuccess({
            request: {
              id: 7,
              name: 'Harbor Court',
              status: 'pending',
              address_line1: '12 Marina Road',
              address_line2: null,
              city: 'Lagos',
              state: 'Lagos',
              country: 'NG',
              description: 'Waterfront apartments',
              for_sale: false,
              sale_price: null,
              owner_name: 'Jane Owner',
              owner_email: 'jane@example.com',
              owner_phone: '08012345678',
            },
          }),
      },
    ]);

    renderWithRoute(<BuildingRegistrationRequestDetail />, {
      route: '/admin/building-requests/7',
      path: '/admin/building-requests/:id',
    });

    expect(await screen.findByText('Harbor Court')).toBeInTheDocument();
    expect(screen.getByText('Waterfront apartments')).toBeInTheDocument();
    expect(screen.getByText('Jane Owner')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Approve Request' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Reject Request' }),
    ).toBeInTheDocument();
  });

  it('shows landlord request details without approval actions', async () => {
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
        match: (url) => url.includes(api.buildingRegistrationRequest(7)),
        response: () =>
          apiSuccess({
            request: {
              id: 7,
              name: 'Harbor Court',
              status: 'pending',
              address_line1: '12 Marina Road',
              address_line2: null,
              city: 'Lagos',
              state: 'Lagos',
              country: 'NG',
              description: 'Waterfront apartments',
              for_sale: false,
              sale_price: null,
              owner_name: 'Jane Owner',
              owner_email: 'jane@example.com',
              owner_phone: '08012345678',
            },
          }),
      },
    ]);

    renderWithRoute(<BuildingRegistrationRequestDetail />, {
      route: '/admin/building-requests/7',
      path: '/admin/building-requests/:id',
    });

    expect(await screen.findByText('Harbor Court')).toBeInTheDocument();
    expect(
      screen.getByText('This request is pending platform admin review.'),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Approve Request' }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Reject Request' }),
    ).not.toBeInTheDocument();
  });
});
