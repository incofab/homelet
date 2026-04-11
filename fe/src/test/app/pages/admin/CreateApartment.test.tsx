import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { CreateApartment } from '../../../../app/pages/admin/CreateApartment';
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

describe('CreateApartment', () => {
  it('creates an apartment and routes to the detail page', async () => {
    const fetchMock = mockFetch([
      {
        match: (url, init) =>
          url.includes(api.buildingApartments(5)) && init?.method === 'POST',
        response: () =>
          apiSuccess({ apartment: { id: 55, unit_code: 'Unit 302' } }),
      },
    ]);

    renderWithRoute(<CreateApartment />, {
      route: routes.adminBuildingApartmentsNew(5),
      path: `${routes.adminRoot}/${routePaths.adminBuildingApartmentsNew}`,
    });

    await userEvent.type(
      screen.getByPlaceholderText('e.g., Unit 302'),
      'Unit 302',
    );
    await userEvent.type(screen.getByPlaceholderText('1200000'), '1200000');
    await userEvent.selectOptions(
      screen.getByLabelText('Status'),
      'maintenance',
    );
    await userEvent.type(
      screen.getByPlaceholderText('Describe the apartment features...'),
      'Nice unit',
    );

    await userEvent.click(
      screen.getByRole('button', { name: 'Create Apartment' }),
    );

    expect(mockNavigate).toHaveBeenCalledWith(routes.adminApartment(55));
    const request = fetchMock.mock.calls.find(
      ([url, init]) =>
        String(url).includes(api.buildingApartments(5)) &&
        init?.method === 'POST',
    );
    const requestBody = request?.[1]?.body
      ? JSON.parse(String(request[1].body))
      : null;
    expect(requestBody).toMatchObject({
      unit_code: 'Unit 302',
      yearly_price: 1200000,
      status: 'maintenance',
      is_public: true,
    });
  });
});
