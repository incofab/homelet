import { cleanup, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import { TenantDetail } from '../../../../app/pages/admin/TenantDetail';
import { apiSuccess, mockFetch, renderWithRoute } from '../../../testUtils';
import { api, routePaths, routes } from '../../../../app/lib/urls';

describe('TenantDetail', () => {
  afterEach(() => {
    cleanup();
  });

  it('renders lease history and can extend an active lease', async () => {
    let tenantPayload = {
      tenant: {
        id: 1,
        name: 'Jane Doe',
        email: 'jane@example.com',
        phone: '08012345678',
      },
      leases: [
        {
          id: 13,
          apartment_id: 7,
          tenant_id: 1,
          rent_amount: 1100000,
          start_date: '2025-01-01',
          end_date: '2025-12-31',
          status: 'expired',
          apartment: {
            unit_code: 'A-3',
            building: { id: 3, name: 'Harbor Point' },
          },
        },
        {
          id: 15,
          apartment_id: 7,
          tenant_id: 1,
          rent_amount: 1200000,
          start_date: '2026-01-01',
          end_date: '2026-12-31',
          status: 'active',
          apartment: {
            unit_code: 'A-3',
            building: { id: 3, name: 'Harbor Point' },
          },
        },
      ],
      payments: [],
      balance: {
        total_lease_rent: 2300000,
        total_paid: 0,
        outstanding_balance: 2300000,
      },
    };

    const fetchMock = mockFetch([
      {
        match: (url) => url.includes(api.tenant(1)),
        response: () => apiSuccess(tenantPayload),
      },
      {
        match: (url, init) =>
          url.includes(api.leaseExtend(15)) && init?.method === 'PUT',
        response: async () => {
          tenantPayload = {
            ...tenantPayload,
            leases: tenantPayload.leases.map((lease) =>
              lease.id === 15 ? { ...lease, end_date: '2027-06-30' } : lease,
            ),
          };

          return apiSuccess({
            lease: tenantPayload.leases[0],
            apartment: { id: 7, unit_code: 'A-3' },
          });
        },
      },
    ]);

    renderWithRoute(<TenantDetail />, {
      route: routes.adminTenant(1),
      path: `${routes.adminRoot}/${routePaths.adminTenant}`,
    });

    expect(
      await screen.findByRole('heading', { name: 'Jane Doe' }),
    ).toBeInTheDocument();
    expect(screen.getAllByText('A-3 · Harbor Point')).toHaveLength(2);
    expect(screen.getByText('Outstanding Balance')).toBeInTheDocument();
    expect(screen.getByText(/Paid ₦0 of ₦2,300,000/)).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: 'Renew Lease' })).toHaveLength(
      1,
    );
    expect(
      screen.getAllByText(/Lease #/).map((node) => node.textContent),
    ).toEqual(['Lease #15', 'Lease #13']);

    await userEvent.click(screen.getByRole('button', { name: 'Extend Lease' }));
    await userEvent.type(screen.getByLabelText('Or Extend By Months'), '6');
    await userEvent.click(
      screen.getByRole('button', { name: 'Save Extension' }),
    );

    await waitFor(() => {
      const extendCalls = fetchMock.mock.calls.filter(
        ([url, init]) =>
          String(url).includes(api.leaseExtend(15)) && init?.method === 'PUT',
      );

      expect(extendCalls).toHaveLength(1);
    });

    expect(await screen.findByText('30 Jun 2027')).toBeInTheDocument();
  });

  it('can renew an expired lease and record first payment', async () => {
    let tenantPayload = {
      tenant: {
        id: 1,
        name: 'Jane Doe',
        email: 'jane@example.com',
        phone: '08012345678',
      },
      leases: [
        {
          id: 21,
          apartment_id: 9,
          tenant_id: 1,
          rent_amount: 700000,
          start_date: '2024-01-01',
          end_date: '2024-12-31',
          status: 'expired',
          apartment: {
            unit_code: 'B-0',
            building: { id: 4, name: 'Harbor Point' },
          },
        },
        {
          id: 22,
          apartment_id: 7,
          tenant_id: 1,
          rent_amount: 950000,
          start_date: '2025-01-01',
          end_date: '2025-12-31',
          status: 'expired',
          apartment: {
            unit_code: 'B-1',
            building: { id: 4, name: 'Harbor Point' },
          },
        },
      ],
      payments: [],
      balance: {
        total_lease_rent: 1650000,
        total_paid: 0,
        outstanding_balance: 1650000,
      },
    };

    const fetchMock = mockFetch([
      {
        match: (url) => url.includes(api.tenant(1)),
        response: () => apiSuccess(tenantPayload),
      },
      {
        match: (url, init) =>
          url.includes(api.leaseRenew(22)) && init?.method === 'POST',
        response: async () => {
          tenantPayload = {
            ...tenantPayload,
            leases: [
              {
                ...tenantPayload.leases[0],
                status: 'expired',
              },
              {
                ...tenantPayload.leases[1],
                status: 'expired',
              },
              {
                id: 23,
                apartment_id: 7,
                tenant_id: 1,
                rent_amount: 1000000,
                start_date: '2026-01-01',
                end_date: '2026-12-31',
                status: 'active',
                apartment: {
                  unit_code: 'B-1',
                  building: { id: 4, name: 'Harbor Point' },
                },
              },
            ],
            payments: [
              {
                id: 8,
                amount: 500000,
                status: 'paid',
                payment_date: '2026-01-01',
                method: 'manual',
              },
            ],
            balance: {
              total_lease_rent: 2650000,
              total_paid: 500000,
              outstanding_balance: 2150000,
            },
          };

          return apiSuccess(
            {
              previous_lease: tenantPayload.leases[0],
              lease: tenantPayload.leases[1],
              payment: tenantPayload.payments[0],
              apartment: { id: 7, unit_code: 'B-1' },
            },
            201,
          );
        },
      },
    ]);

    renderWithRoute(<TenantDetail />, {
      route: routes.adminTenant(1),
      path: `${routes.adminRoot}/${routePaths.adminTenant}`,
    });

    expect(await screen.findByText('B-1 · Harbor Point')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Renew Lease' }));
    expect(screen.getByLabelText('Renewal End Date')).toHaveValue('2027-01-01');
    await userEvent.clear(screen.getByLabelText('New Rent Amount'));
    await userEvent.type(screen.getByLabelText('New Rent Amount'), '1000000');
    await userEvent.click(
      screen.getByRole('checkbox', {
        name: 'Record first payment for the renewed lease',
      }),
    );
    await userEvent.type(screen.getByLabelText('Payment Amount'), '500000');
    expect(screen.getByLabelText('Payment Due Date')).toHaveValue('2026-01-01');
    await userEvent.click(
      screen.getByRole('button', { name: 'Create Renewal' }),
    );

    await waitFor(() => {
      const renewCalls = fetchMock.mock.calls.filter(
        ([url, init]) =>
          String(url).includes(api.leaseRenew(22)) && init?.method === 'POST',
      );

      expect(renewCalls).toHaveLength(1);
    });

    expect(await screen.findByText('Lease #23')).toBeInTheDocument();
    expect(screen.getByText('₦500,000')).toBeInTheDocument();
    expect(screen.getByText('₦2,150,000')).toBeInTheDocument();
  });
});
