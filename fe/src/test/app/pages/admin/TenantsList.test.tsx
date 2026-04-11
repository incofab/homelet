import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { TenantsList } from '../../../../app/pages/admin/TenantsList';
import { apiSuccess, mockFetch, renderWithRoute } from '../../../testUtils';
import { api, routePaths, routes } from '../../../../app/lib/urls';

describe('TenantsList', () => {
  it('renders tenants from the API', async () => {
    mockFetch([
      {
        match: (url) => url.includes(api.tenants),
        response: () =>
          apiSuccess({
            tenants: [
              {
                id: 1,
                name: 'Jane Doe',
                email: 'jane@example.com',
                current_lease: {
                  id: 99,
                  status: 'active',
                  next_due_date: '2026-12-31',
                  days_remaining: 60,
                  apartment: { unit_code: 'A-12' },
                },
              },
            ],
          }),
      },
    ]);

    renderWithRoute(<TenantsList />);

    expect(await screen.findByText('Jane Doe')).toBeInTheDocument();
    expect(screen.getByText('jane@example.com')).toBeInTheDocument();
    expect(screen.getByText('A-12')).toBeInTheDocument();
    expect(screen.getByText('2 months')).toBeInTheDocument();
    expect(screen.getByText('31 Dec 2026')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Jane Doe' })).toHaveAttribute(
      'href',
      routes.adminTenant(1),
    );
  });

  it('renders building-scoped tenants', async () => {
    mockFetch([
      {
        match: (url) => String(url).endsWith(api.building(9)),
        response: () =>
          apiSuccess({
            building: {
              id: 9,
              name: 'Sunrise Court',
            },
          }),
      },
      {
        match: (url) => String(url).endsWith(api.buildingTenants(9)),
        response: () =>
          apiSuccess({
            tenants: [
              {
                id: 3,
                name: 'Mark Tenant',
                current_lease: {
                  id: 32,
                  status: 'expired',
                  next_due_date: '2026-03-20',
                  days_exceeded: 21,
                  apartment: { unit_code: 'B-4' },
                },
              },
            ],
          }),
      },
    ]);

    renderWithRoute(<TenantsList />, {
      route: routes.adminBuildingTenants(9),
      path: `${routes.adminRoot}/${routePaths.adminBuildingTenants}`,
    });

    expect(
      await screen.findByText('Sunrise Court Tenants'),
    ).toBeInTheDocument();
    expect(screen.getByText('Mark Tenant')).toBeInTheDocument();
    expect(screen.getByText('B-4')).toBeInTheDocument();
    expect(screen.getByText('3 weeks')).toBeInTheDocument();
  });
});
