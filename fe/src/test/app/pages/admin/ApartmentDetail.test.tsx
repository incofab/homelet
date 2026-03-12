import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { ApartmentDetail } from '../../../../app/pages/admin/ApartmentDetail';
import { apiSuccess, mockFetch, renderWithRoute } from '../../../testUtils';
import { api, routePaths, routes } from '../../../../app/lib/urls';

const apartmentPayload = {
  id: 1,
  unit_code: 'A1',
  building: { id: 10, name: 'Harbor Point' },
  beds: 2,
  baths: 2,
  sqft: 950,
  yearly_price: 1200000,
  status: 'vacant',
  description: 'Bright unit',
  amenities: [],
};

describe('ApartmentDetail', () => {
  it('renders apartment details and can assign a tenant', async () => {
    const fetchMock = mockFetch([
      {
        match: (url) => url.includes(api.apartmentMedia(1)),
        response: () => apiSuccess([]),
      },
      {
        match: (url) => url.includes(api.apartment(1)),
        response: () => apiSuccess(apartmentPayload),
      },
      {
        match: (url, init) =>
          url.includes(api.apartmentAssignTenant(1)) && init?.method === 'POST',
        response: () => apiSuccess({ apartment: { id: 1 } }, 201),
      },
    ]);

    renderWithRoute(<ApartmentDetail />, {
      route: routes.adminApartment(1),
      path: `${routes.adminRoot}/${routePaths.adminApartment}`,
    });

    expect(await screen.findByText('A1')).toBeInTheDocument();
    expect(screen.getByText('Harbor Point')).toBeInTheDocument();
    expect(screen.getByText('No amenities listed.')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Assign Tenant' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: 'Edit apartment' }),
    ).toHaveAttribute('href', routes.adminApartmentEdit(1));

    await userEvent.click(
      screen.getByRole('button', { name: 'Assign Tenant' }),
    );
    await userEvent.type(
      screen.getByPlaceholderText('Jane Doe'),
      'Jane Tenant',
    );
    await userEvent.type(
      screen.getByPlaceholderText('jane@example.com'),
      'jane@example.com',
    );
    await userEvent.type(
      screen.getByLabelText('Lease Start Date'),
      '2026-04-01',
    );
    await userEvent.clear(screen.getByPlaceholderText('1200000'));
    await userEvent.type(screen.getByPlaceholderText('1200000'), '1200000');
    await userEvent.click(
      screen.getByRole('button', { name: 'Assign Tenant' }),
    );

    await waitFor(() => {
      const request = fetchMock.mock.calls.find(
        ([url, init]) =>
          String(url).includes(api.apartmentAssignTenant(1)) &&
          init?.method === 'POST',
      );

      expect(request).toBeTruthy();
    });
  });
});
