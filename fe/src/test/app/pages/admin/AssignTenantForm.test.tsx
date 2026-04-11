import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { AssignTenantForm } from '../../../../app/pages/admin/AssignTenantForm';
import { apiSuccess, mockFetch } from '../../../testUtils';
import { api } from '../../../../app/lib/urls';

const today = () => new Date().toISOString().slice(0, 10);

describe('AssignTenantForm', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  afterEach(() => {
    cleanup();
  });

  it('sends payment details when recording payment during tenant assignment', async () => {
    const fetchMock = mockFetch([
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
        response: () => apiSuccess({ apartment: { id: 1 }, payment: { id: 7 } }, 201),
      },
    ]);

    render(
      <AssignTenantForm
        apartments={[
          {
            id: 1,
            unit_code: 'A1',
            yearly_price: 1200000,
            status: 'vacant',
          },
        ]}
        defaultApartmentId={1}
      />,
    );

    await userEvent.click(screen.getByRole('button', { name: 'Assign Tenant' }));
    await userEvent.type(
      screen.getByPlaceholderText('08012345678 or jane@example.com'),
      '08012345678',
    );
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'OK' })).not.toBeDisabled();
    });
    await userEvent.click(screen.getByRole('button', { name: 'OK' }));
    await userEvent.type(await screen.findByLabelText('Lease Start Date'), '2026-04-01');
    expect(screen.getByLabelText('Lease Due Date')).toHaveValue('2027-04-01');
    await userEvent.click(screen.getByRole('checkbox', { name: 'Record payment now' }));
    await userEvent.clear(screen.getByLabelText('Payment Amount'));
    await userEvent.type(screen.getByLabelText('Payment Amount'), '600000');
    await userEvent.type(screen.getByLabelText('Transaction Reference'), 'PAY-001');
    await userEvent.click(screen.getByRole('button', { name: 'Add Tenant' }));

    await waitFor(() => {
      const assignRequest = fetchMock.mock.calls.find(
        ([url, init]) =>
          String(url).includes(api.apartmentAssignTenant(1)) &&
          !String(url).includes(api.apartmentAssignTenantLookup(1)) &&
          init?.method === 'POST',
      );

      expect(assignRequest).toBeTruthy();

      const [, init] = assignRequest!;
      const body = JSON.parse(String(init?.body));

      expect(body.record_payment).toBe(true);
      expect(body.payment_amount).toBe(600000);
      expect(body.payment_date).toBe(today());
      expect(body.payment_due_date).toBe('2026-04-01');
      expect(body.payment_status).toBe('paid');
      expect(body.payment_reference).toBe('PAY-001');
    });
  });
});
