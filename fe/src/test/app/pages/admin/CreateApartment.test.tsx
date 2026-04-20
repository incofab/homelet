import { cleanup, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
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
  beforeEach(() => {
    cleanup();
    mockNavigate.mockClear();
  });

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
      type: 'custom',
      yearly_price: 1200000,
      status: 'maintenance',
      is_public: true,
    });
  });

  it('creates multiple apartments with basic details', async () => {
    const fetchMock = mockFetch([
      {
        match: (url, init) =>
          url.includes(api.buildingApartments(5)) && init?.method === 'POST',
        response: () =>
          apiSuccess({
            apartment: { id: 55, unit_code: 'Unit 301' },
            apartments: [
              { id: 55, unit_code: 'Unit 301' },
              { id: 56, unit_code: 'Unit 302' },
            ],
            created_count: 2,
          }),
      },
    ]);

    renderWithRoute(<CreateApartment />, {
      route: routes.adminBuildingApartmentsNew(5),
      path: `${routes.adminRoot}/${routePaths.adminBuildingApartmentsNew}`,
    });

    await userEvent.click(
      screen.getByRole('button', { name: 'Multiple apartments' }),
    );
    await userEvent.type(
      screen.getAllByPlaceholderText('e.g., Unit 302')[0],
      'Unit 301',
    );
    await userEvent.type(
      screen.getAllByPlaceholderText('1200000')[0],
      '1000000',
    );
    await userEvent.type(
      screen.getAllByPlaceholderText('e.g., Unit 302')[1],
      'Unit 302',
    );
    await userEvent.type(
      screen.getAllByPlaceholderText('1200000')[1],
      '1200000',
    );

    await userEvent.click(
      screen.getByRole('button', { name: 'Create Apartments' }),
    );

    expect(mockNavigate).toHaveBeenCalledWith(
      routes.adminBuildingApartments(5),
    );
    const request = fetchMock.mock.calls.find(
      ([url, init]) =>
        String(url).includes(api.buildingApartments(5)) &&
        init?.method === 'POST',
    );
    const requestBody = request?.[1]?.body
      ? JSON.parse(String(request[1].body))
      : null;
    expect(requestBody).toMatchObject({
      apartments: [
        {
          unit_code: 'Unit 301',
          yearly_price: 1000000,
          type: 'custom',
          status: 'vacant',
          is_public: true,
        },
        {
          unit_code: 'Unit 302',
          yearly_price: 1200000,
          type: 'custom',
          status: 'vacant',
          is_public: true,
        },
      ],
    });
  });

  it('prefills the create form when duplicating an apartment', async () => {
    const fetchMock = mockFetch([
      {
        match: (url, init) =>
          url.includes(api.apartment(12)) &&
          (!init?.method || init.method === 'GET'),
        response: () =>
          apiSuccess({
            apartment: {
              id: 12,
              unit_code: 'Unit 12',
              type: 'two_bedroom',
              yearly_price: 1500000,
              floor: '3',
              status: 'vacant',
              is_public: true,
              description: 'Copied details',
              amenities: ['Parking'],
            },
          }),
      },
      {
        match: (url, init) =>
          url.includes(api.buildingApartments(5)) && init?.method === 'POST',
        response: () =>
          apiSuccess({ apartment: { id: 58, unit_code: 'Unit 13' } }),
      },
    ]);

    renderWithRoute(<CreateApartment />, {
      route: `${routes.adminBuildingApartmentsNew(5)}?duplicateFrom=12`,
      path: `${routes.adminRoot}/${routePaths.adminBuildingApartmentsNew}`,
    });

    expect(await screen.findByDisplayValue('Unit 12')).toBeInTheDocument();
    expect(screen.getByDisplayValue('1500000')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Copied details')).toBeInTheDocument();

    await userEvent.clear(screen.getByPlaceholderText('e.g., Unit 302'));
    await userEvent.type(
      screen.getByPlaceholderText('e.g., Unit 302'),
      'Unit 13',
    );
    await userEvent.click(
      screen.getByRole('button', { name: 'Create Duplicate' }),
    );

    expect(mockNavigate).toHaveBeenCalledWith(routes.adminApartment(58));
    const request = fetchMock.mock.calls.find(
      ([url, init]) =>
        String(url).includes(api.buildingApartments(5)) &&
        init?.method === 'POST',
    );
    const requestBody = request?.[1]?.body
      ? JSON.parse(String(request[1].body))
      : null;
    expect(requestBody).toMatchObject({
      unit_code: 'Unit 13',
      type: 'two_bedroom',
      yearly_price: 1500000,
      description: 'Copied details',
      amenities: ['Parking'],
    });
  });
});
