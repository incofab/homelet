import { cleanup, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ApartmentDetail } from '../../../../app/pages/admin/ApartmentDetail';
import { apiSuccess, mockFetch, renderWithRoute } from '../../../testUtils';
import { api, routePaths, routes } from '../../../../app/lib/urls';
import { appToast } from '../../../../app/lib/toast';

vi.mock('../../../../app/lib/toast', () => ({
  appToast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}));

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
  beforeEach(() => {
    window.localStorage.clear();
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    Object.defineProperty(window.navigator, 'clipboard', {
      configurable: true,
      value: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    });
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('renders apartment details and can assign a tenant', async () => {
    const fetchMock = mockFetch([
      {
        match: (url) => url.includes(api.apartmentMedia(1)),
        response: () =>
          apiSuccess([
            {
              id: 31,
              url: 'https://example.com/apartment-1.jpg',
            },
          ]),
      },
      {
        match: (url, init) =>
          String(url).endsWith(api.apartmentMediaItem(1, 31)) &&
          init?.method === 'DELETE',
        response: () => apiSuccess(null),
      },
      {
        match: (url) => url.includes(api.apartment(1)),
        response: () => apiSuccess(apartmentPayload),
      },
      {
        match: (url, init) =>
          url.includes(api.apartmentAssignTenantLookup(1)) &&
          init?.method === 'POST',
        response: () =>
          apiSuccess({
            exists: true,
            requires_name: false,
            tenant: {
              id: 99,
              name: 'Jane Tenant',
              email: 'jane@example.com',
              phone: '08012345678',
            },
          }),
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

    expect(
      await screen.findByRole('heading', { name: 'A1' }),
    ).toBeInTheDocument();
    expect(screen.getAllByText('Harbor Point').length).toBeGreaterThan(0);
    expect(screen.getByText('No amenities listed.')).toBeInTheDocument();
    expect(screen.getByText('Next best action')).toBeInTheDocument();
    expect(screen.getByText('Share rental request link')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'WhatsApp' })).toHaveAttribute(
      'href',
      expect.stringContaining('https://wa.me/'),
    );
    expect(screen.getByRole('link', { name: 'SMS' })).toHaveAttribute(
      'href',
      expect.stringContaining('sms:?&body='),
    );
    expect(screen.getByRole('link', { name: 'Email' })).toHaveAttribute(
      'href',
      expect.stringContaining('mailto:?subject='),
    );
    expect(
      screen.getByRole('button', { name: 'Assign Tenant' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Record Payment' }),
    ).toBeDisabled();
    expect(
      screen.getByRole('button', { name: 'Add Image' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Delete' })).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: 'Edit apartment' }),
    ).toHaveAttribute('href', routes.adminApartmentEdit(1));

    await userEvent.click(screen.getByRole('button', { name: 'Copy Link' }));
    expect(window.navigator.clipboard.writeText).toHaveBeenCalledWith(
      expect.stringContaining(routes.rentRequest(1)),
    );
    expect(appToast.success).toHaveBeenCalledWith('Link copied to clipboard.');

    await userEvent.click(screen.getByRole('button', { name: 'Delete' }));
    expect(window.confirm).toHaveBeenCalledWith(
      expect.stringContaining('"action": "delete_image"'),
    );
    await waitFor(() => {
      const deleteRequest = fetchMock.mock.calls.find(
        ([url, init]) =>
          String(url).endsWith(api.apartmentMediaItem(1, 31)) &&
          init?.method === 'DELETE',
      );

      expect(deleteRequest).toBeTruthy();
    });

    await userEvent.click(
      screen.getByRole('button', { name: 'Assign Tenant' }),
    );
    await userEvent.type(
      screen.getByPlaceholderText('08012345678 or jane@example.com'),
      '08012345678',
    );
    await waitFor(() => {
      const lookupRequest = fetchMock.mock.calls.find(
        ([url, init]) =>
          String(url).includes(api.apartmentAssignTenantLookup(1)) &&
          init?.method === 'POST',
      );

      expect(lookupRequest).toBeTruthy();
    });
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'OK' })).not.toBeDisabled();
    });
    await userEvent.click(screen.getByRole('button', { name: 'OK' }));
    await userEvent.type(
      await screen.findByLabelText('Lease Start Date'),
      '2026-04-01',
    );
    expect(
      screen.getByRole('button', { name: 'Change Tenant' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Assign Tenant' }),
    ).toBeInTheDocument();
  });

  it('renders current tenant details for occupied apartments', async () => {
    mockFetch([
      {
        match: (url) => url.includes(api.apartmentMedia(1)),
        response: () => apiSuccess([]),
      },
      {
        match: (url) => url.includes(api.apartment(1)),
        response: () =>
          apiSuccess({
            ...apartmentPayload,
            status: 'occupied',
            current_tenant: {
              id: 99,
              name: 'Jane Tenant',
              email: 'jane@example.com',
              phone: '08012345678',
              lease_id: 77,
              lease_start: '2026-01-01',
              lease_end: '2027-01-01',
              lease_status: 'active',
              rent_amount: 1200000,
            },
          }),
      },
      {
        match: (url) => url.includes(api.tenants),
        response: () =>
          apiSuccess({
            tenants: {
              data: [
                {
                  id: 99,
                  name: 'Jane Tenant',
                  email: 'jane@example.com',
                  active_lease: { id: 77, status: 'active' },
                },
              ],
            },
          }),
      },
    ]);

    renderWithRoute(<ApartmentDetail />, {
      route: routes.adminApartment(1),
      path: `${routes.adminRoot}/${routePaths.adminApartment}`,
    });

    expect(await screen.findByText('Jane Tenant')).toBeInTheDocument();
    expect(screen.getByText('jane@example.com')).toBeInTheDocument();
    expect(screen.getAllByText('08012345678').length).toBeGreaterThan(0);
    expect(screen.getByText('1 Jan 2026')).toBeInTheDocument();
    expect(screen.getByText('1 Jan 2027')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Copy Link' })).toBeDisabled();
    expect(
      screen.getByRole('button', { name: 'Assign Tenant' }),
    ).toBeDisabled();

    await userEvent.click(
      screen.getByRole('button', { name: 'Record Payment' }),
    );
    expect(
      await screen.findByRole('option', {
        name: 'Jane Tenant (jane@example.com)',
      }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText('Tenant Lease')).toHaveValue('77');
    expect(screen.getByLabelText('Amount')).toHaveValue(1200000);
  });

  it('does not delete apartment image when confirmation is cancelled', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(false);

    const fetchMock = mockFetch([
      {
        match: (url) => url.includes(api.apartmentMedia(1)),
        response: () =>
          apiSuccess([
            {
              id: 31,
              url: 'https://example.com/apartment-1.jpg',
            },
          ]),
      },
      {
        match: (url) => url.includes(api.apartment(1)),
        response: () => apiSuccess(apartmentPayload),
      },
    ]);

    renderWithRoute(<ApartmentDetail />, {
      route: routes.adminApartment(1),
      path: `${routes.adminRoot}/${routePaths.adminApartment}`,
    });

    expect(
      await screen.findByRole('heading', { name: 'A1' }),
    ).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Delete' }));

    const deleteRequest = fetchMock.mock.calls.find(
      ([url, init]) =>
        String(url).endsWith(api.apartmentMediaItem(1, 31)) &&
        init?.method === 'DELETE',
    );

    expect(window.confirm).toHaveBeenCalled();
    expect(deleteRequest).toBeFalsy();
  });
});
