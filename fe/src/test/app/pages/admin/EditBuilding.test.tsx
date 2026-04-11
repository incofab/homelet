import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { EditBuilding } from '../../../../app/pages/admin/EditBuilding';
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

describe('EditBuilding', () => {
  it('loads the building and submits updates', async () => {
    const fetchMock = mockFetch([
      {
        match: (url) => String(url).endsWith(api.building(12)),
        response: () =>
          apiSuccess({
            building: {
              id: 12,
              name: 'Old Name',
              address_line1: '12 Marina Road',
              city: 'Lagos',
              state: 'Lagos',
              description: 'Old description',
              contact_email: 'old@example.com',
              contact_phone: '08010000000',
            },
          }),
      },
      {
        match: (url, init) =>
          String(url).endsWith(api.building(12)) && init?.method === 'PUT',
        response: () =>
          apiSuccess({
            building: {
              id: 12,
              name: 'New Name',
            },
          }),
      },
    ]);

    renderWithRoute(<EditBuilding />, {
      route: routes.adminBuildingEdit(12),
      path: `${routes.adminRoot}/${routePaths.adminBuildingEdit}`,
    });

    expect(await screen.findByDisplayValue('Old Name')).toBeInTheDocument();

    const nameInput = screen.getByDisplayValue('Old Name');
    await userEvent.clear(nameInput);
    await userEvent.type(nameInput, 'New Name');
    await userEvent.click(screen.getByRole('button', { name: 'Save Changes' }));

    const request = fetchMock.mock.calls.find(
      ([url, init]) =>
        String(url).endsWith(api.building(12)) && init?.method === 'PUT',
    );

    expect(request).toBeTruthy();
    expect(JSON.parse(String(request?.[1]?.body))).toMatchObject({
      name: 'New Name',
      address_line1: '12 Marina Road',
    });
    expect(mockNavigate).toHaveBeenCalledWith(routes.adminBuilding(12));
  });
});
