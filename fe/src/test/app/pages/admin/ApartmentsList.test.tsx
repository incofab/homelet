import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ApartmentsList } from '../../../../app/pages/admin/ApartmentsList';
import { apiSuccess, mockFetch, renderWithRoute } from '../../../testUtils';
import { api, routePaths, routes } from '../../../../app/lib/urls';

describe('ApartmentsList', () => {
  it('renders apartments for a building', async () => {
    mockFetch([
      {
        match: (url) => url.includes(api.buildingApartments(10)),
        response: () =>
          apiSuccess([
            {
              id: 5,
              unit_code: 'Unit 5A',
              beds: 2,
              baths: 2,
              sqft: 900,
              yearly_price: 1200000,
              status: 'vacant',
              tenant: { name: '—' },
            },
          ]),
      },
      {
        match: (url) => url.includes(api.building(10)),
        response: () => apiSuccess({ id: 10, name: 'Harbor Point' }),
      },
    ]);

    renderWithRoute(<ApartmentsList />, {
      route: routes.adminBuildingApartments(10),
      path: `${routes.adminRoot}/${routePaths.adminBuildingApartments}`,
    });

    expect(await screen.findByText('Apartments')).toBeInTheDocument();
    expect(screen.getByText('Harbor Point units')).toBeInTheDocument();
    expect(screen.getByText('Unit 5A')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Duplicate/i })).toHaveAttribute(
      'href',
      `${routes.adminBuildingApartmentsNew(10)}?duplicateFrom=5`,
    );
  });
});
