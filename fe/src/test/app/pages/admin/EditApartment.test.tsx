import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { EditApartment } from '../../../../app/pages/admin/EditApartment';
import { apiSuccess, mockFetch, renderWithRoute } from '../../../testUtils';
import { api, routePaths, routes } from '../../../../app/lib/urls';

const mockNavigate = vi.fn();

vi.mock('react-router', async () => {
  const actual =
    await vi.importActual<typeof import('react-router')>('react-router');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('EditApartment', () => {
  it('loads the apartment and updates status and visibility', async () => {
    const fetchMock = mockFetch([
      {
        match: (url, init) =>
          url.includes(api.apartment(12)) &&
          (!init?.method || init.method === 'GET'),
        response: () =>
          apiSuccess({
            apartment: {
              id: 12,
              unit_code: 'B4',
              building: { id: 5, name: 'Harbor Point' },
              yearly_price: 960000,
              status: 'vacant',
              is_public: false,
              description: 'Corner unit',
              amenities: ['Parking'],
            },
          }),
      },
      {
        match: (url, init) =>
          url.includes(api.apartment(12)) && init?.method === 'PUT',
        response: () => apiSuccess({ apartment: { id: 12, unit_code: 'B4' } }),
      },
    ]);

    renderWithRoute(<EditApartment />, {
      route: routes.adminApartmentEdit(12),
      path: `${routes.adminRoot}/${routePaths.adminApartmentEdit}`,
    });

    expect(await screen.findByDisplayValue('B4')).toBeInTheDocument();
    expect(screen.getByDisplayValue('960000')).toBeInTheDocument();

    await userEvent.selectOptions(screen.getByLabelText('Status'), 'occupied');
    await userEvent.click(screen.getByRole('checkbox'));
    await userEvent.click(screen.getByRole('button', { name: 'Save Changes' }));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith(routes.adminApartment(12));
    });

    const request = fetchMock.mock.calls.find(
      ([url, init]) =>
        String(url).includes(api.apartment(12)) && init?.method === 'PUT',
    );
    const requestBody = request?.[1]?.body
      ? JSON.parse(String(request[1].body))
      : null;
    expect(requestBody).toMatchObject({
      unit_code: 'B4',
      yearly_price: 960000,
      status: 'occupied',
      is_public: true,
    });
  });
});
