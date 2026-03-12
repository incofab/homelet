import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { BuildingDetailPublic } from '../../../../app/pages/public/BuildingDetailPublic';
import { apiSuccess, mockFetch, renderWithRoute } from '../../../testUtils';
import { api, routePaths, routes } from '../../../../app/lib/urls';

describe('BuildingDetailPublic', () => {
  it('renders public building details, contacts, and apartments', async () => {
    mockFetch([
      {
        match: (url) => url.includes(api.publicBuilding(8)),
        response: () =>
          apiSuccess({
            building: {
              id: 8,
              name: 'Harbor Point',
              address_line1: '12 Ocean Drive',
              city: 'Lagos',
              state: 'Lagos',
              description: 'Waterfront apartments',
              contact_email: 'hello@harbor.test',
              contact_phone: '555-6767',
              apartments: [
                {
                  id: 18,
                  unit_code: 'A2',
                  yearly_price: 2400000,
                  status: 'vacant',
                },
              ],
            },
          }),
      },
    ]);

    renderWithRoute(<BuildingDetailPublic />, {
      route: routes.buildingPublic(8),
      path: routePaths.buildingPublic,
    });

    expect(await screen.findByText('Harbor Point')).toBeInTheDocument();
    expect(screen.getByText('hello@harbor.test')).toBeInTheDocument();
    expect(screen.getByText('555-6767')).toBeInTheDocument();
    expect(screen.getByText('A2')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /a2/i })).toHaveAttribute(
      'href',
      routes.apartmentPublic(18),
    );
  });
});
