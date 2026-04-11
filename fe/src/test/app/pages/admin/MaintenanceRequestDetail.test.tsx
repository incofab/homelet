import { cleanup, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MaintenanceRequestDetail } from '../../../../app/pages/admin/MaintenanceRequestDetail';
import { apiSuccess, mockFetch, renderWithRoute } from '../../../testUtils';
import { api, routePaths, routes } from '../../../../app/lib/urls';

describe('MaintenanceRequestDetail', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it('renders the selected maintenance request with uploaded images', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);

    const fetchMock = mockFetch([
      {
        match: (url, init) =>
          url.includes(api.maintenanceRequest(7)) &&
          (!init?.method || init.method === 'GET'),
        response: () =>
          apiSuccess({
            maintenance_request: {
              id: 7,
              title: 'Leaky faucet',
              description: 'Water is leaking under the sink.',
              status: 'open',
              priority: 'high',
              created_at: '2024-01-12',
              tenant: { name: 'Jane Doe' },
              apartment: { unit_code: 'B2', building: { name: 'Skyline' } },
              media: [{ id: 33, url: 'https://example.com/leaky-faucet.jpg' }],
            },
          }),
      },
      {
        match: (url, init) =>
          url.includes(api.maintenanceRequest(7)) && init?.method === 'PUT',
        response: () =>
          apiSuccess({
            maintenance_request: {
              id: 7,
              title: 'Leaky faucet',
              description: 'Water is leaking under the sink.',
              status: 'in_progress',
              priority: 'high',
              created_at: '2024-01-12',
              tenant: { name: 'Jane Doe' },
              apartment: { unit_code: 'B2', building: { name: 'Skyline' } },
              media: [{ id: 33, url: 'https://example.com/leaky-faucet.jpg' }],
            },
          }),
      },
    ]);

    renderWithRoute(<MaintenanceRequestDetail />, {
      route: routes.adminMaintenanceRequest(7),
      path: `${routes.adminRoot}/${routePaths.adminMaintenanceRequest}`,
    });

    expect(await screen.findByText('Leaky faucet')).toBeInTheDocument();
    expect(
      screen.getByText('Water is leaking under the sink.'),
    ).toBeInTheDocument();
    expect(screen.getByText('B2 · Skyline')).toBeInTheDocument();
    expect(screen.getByAltText('Maintenance request image 1')).toHaveAttribute(
      'src',
      'https://example.com/leaky-faucet.jpg',
    );
    expect(screen.getByRole('button', { name: 'Mark Open' })).toBeDisabled();

    await userEvent.click(
      screen.getByRole('button', { name: 'Start Progress' }),
    );

    expect(window.confirm).toHaveBeenCalledWith(
      'Update this maintenance request to In Progress?',
    );
    const updateRequest = fetchMock.mock.calls.find(
      ([url, init]) =>
        String(url).includes(api.maintenanceRequest(7)) &&
        init?.method === 'PUT',
    );
    expect(updateRequest).toBeTruthy();
    expect(
      updateRequest?.[1]?.body
        ? JSON.parse(String(updateRequest[1].body))
        : null,
    ).toMatchObject({
      status: 'in_progress',
    });
  });

  it('does not update status when the confirmation is cancelled', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(false);

    const fetchMock = mockFetch([
      {
        match: (url, init) =>
          url.includes(api.maintenanceRequest(7)) &&
          (!init?.method || init.method === 'GET'),
        response: () =>
          apiSuccess({
            maintenance_request: {
              id: 7,
              title: 'Leaky faucet',
              description: 'Water is leaking under the sink.',
              status: 'open',
              priority: 'high',
              created_at: '2024-01-12',
              tenant: { name: 'Jane Doe' },
              apartment: { unit_code: 'B2', building: { name: 'Skyline' } },
              media: [],
            },
          }),
      },
    ]);

    renderWithRoute(<MaintenanceRequestDetail />, {
      route: routes.adminMaintenanceRequest(7),
      path: `${routes.adminRoot}/${routePaths.adminMaintenanceRequest}`,
    });

    expect(await screen.findByText('Leaky faucet')).toBeInTheDocument();

    await userEvent.click(
      screen.getByRole('button', { name: 'Start Progress' }),
    );

    const updateRequest = fetchMock.mock.calls.find(
      ([url, init]) =>
        String(url).includes(api.maintenanceRequest(7)) &&
        init?.method === 'PUT',
    );
    expect(window.confirm).toHaveBeenCalled();
    expect(updateRequest).toBeFalsy();
  });
});
