import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { AdminDashboard } from '../../../../app/pages/admin/AdminDashboard';
import { apiSuccess, mockFetch, renderWithRoute } from '../../../testUtils';
import { api } from '../../../../app/lib/urls';

const dashboardPayload = {
  counts: {
    buildings: 3,
    apartments: 24,
    vacant: 5,
    occupied: 19,
    tenants: 18,
  },
  expiring_leases_next_90_days: 0,
  total_income_paid: 1200000,
  pending_payments: 0,
  overdue_payments: 4,
  maintenance_requests: 7,
};

describe('AdminDashboard', () => {
  it('renders stats-only platform admin dashboard', async () => {
    mockFetch([
      {
        match: (url) => url.includes(api.authMe),
        response: () =>
          apiSuccess({
            user: { id: 1, name: 'Admin', role: 'admin' },
            dashboard_context: {
              primary_dashboard: 'admin',
              is_platform_admin: true,
              is_building_user: false,
              has_active_lease: false,
              available_dashboards: ['admin'],
            },
          }),
      },
      {
        match: (url) => url.includes(api.dashboardAdmin),
        response: () => apiSuccess(dashboardPayload),
      },
      {
        match: (url) => url.includes(api.payments),
        response: () => apiSuccess([]),
      },
    ]);

    renderWithRoute(<AdminDashboard />);

    expect(await screen.findByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Total Tenants')).toBeInTheDocument();
    expect(screen.getByText('Overdue Payments')).toBeInTheDocument();
    expect(screen.getByText('Maintenance Requests')).toBeInTheDocument();
    expect(screen.queryByText('Revenue Trend')).not.toBeInTheDocument();
    expect(screen.queryByText('Pending Payments')).not.toBeInTheDocument();
  });

  it('renders landlord-manager quick access on the dashboard', async () => {
    mockFetch([
      {
        match: (url) => url.includes(api.authMe),
        response: () =>
          apiSuccess({
            user: { id: 2, name: 'Owner', role: 'user' },
            dashboard_context: {
              primary_dashboard: 'admin',
              is_platform_admin: false,
              is_building_user: true,
              has_active_lease: false,
              available_dashboards: ['admin'],
            },
          }),
      },
      {
        match: (url) => url.includes(api.dashboardAdmin),
        response: () => apiSuccess(dashboardPayload),
      },
      {
        match: (url) => url.includes(api.payments),
        response: () => apiSuccess([]),
      },
    ]);

    renderWithRoute(<AdminDashboard />);

    expect(
      await screen.findByRole('link', { name: 'View Buildings' }),
    ).toHaveAttribute('href', '/admin/buildings');
    expect(
      screen.getByRole('link', { name: 'Register Building' }),
    ).toHaveAttribute('href', '/admin/building-requests/new');
    expect(screen.getByRole('link', { name: 'View Units' })).toHaveAttribute(
      'href',
      '/admin/buildings',
    );
    expect(
      screen.getByRole('link', { name: 'Choose Building' }),
    ).toHaveAttribute('href', '/admin/buildings');
    expect(screen.getByRole('link', { name: 'View Tenants' })).toHaveAttribute(
      'href',
      '/admin/tenants',
    );
    expect(
      screen.getByRole('link', { name: 'Rental Requests' }),
    ).toHaveAttribute('href', '/admin/rental-requests');
    expect(
      screen.getByRole('link', { name: 'Record Payment' }),
    ).toHaveAttribute('href', '/admin/payments');
    expect(screen.getByRole('link', { name: 'View Payments' })).toHaveAttribute(
      'href',
      '/admin/payments',
    );
    expect(
      await screen.findByRole('link', {
        name: /Tenants View tenant records and lease status/i,
      }),
    ).toHaveAttribute('href', '/admin/tenants');
    expect(
      screen.getByRole('link', {
        name: /Payments List payments and record new collections/i,
      }),
    ).toHaveAttribute('href', '/admin/payments');
    expect(
      screen.getByRole('link', {
        name: /Expenses Record operating costs and track spend by building/i,
      }),
    ).toHaveAttribute('href', '/admin/expenses');
    expect(
      screen.getByRole('link', {
        name: /Maintenance Track open issues and update request status/i,
      }),
    ).toHaveAttribute('href', '/admin/maintenance');
    expect(screen.getByText('Revenue Trend')).toBeInTheDocument();
  });
});
