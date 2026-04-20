import { beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RentalRequestsList } from '../../../../app/pages/admin/RentalRequestsList';
import { apiSuccess, mockFetch, renderWithRoute } from '../../../testUtils';
import { api } from '../../../../app/lib/urls';

describe('RentalRequestsList', () => {
  beforeEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('shows rental request cards', async () => {
    mockFetch([
      {
        match: (url) => url.includes(api.rentalRequests),
        response: () =>
          apiSuccess([
            {
              id: 44,
              name: 'Sam Lee',
              email: 'sam@example.com',
              phone: '555-0100',
              status: 'new',
              message: 'Interested in viewing',
              created_at: '2024-01-14',
              apartment: { unit_code: 'C3', building: { name: 'Riverside' } },
            },
          ]),
      },
    ]);

    renderWithRoute(<RentalRequestsList />);

    expect(await screen.findByText('Sam Lee')).toBeInTheDocument();
    expect(screen.getByText('Interested in viewing')).toBeInTheDocument();
    expect(screen.getByText('C3 · Riverside')).toBeInTheDocument();
  });

  it('approves a contacted request through the workflow dialog', async () => {
    const fetchMock = mockFetch([
      {
        match: (url, init) =>
          url.includes(api.rentalRequests) &&
          (!init?.method || init.method === 'GET'),
        response: () =>
          apiSuccess([
            {
              id: 55,
              name: 'Sam Lee',
              email: 'sam@example.com',
              phone: '5550100',
              status: 'contacted',
              apartment: {
                id: 3,
                unit_code: 'C3',
                yearly_price: 2400000,
                building: { id: 8, name: 'Riverside' },
              },
            },
          ]),
      },
      {
        match: (url, init) =>
          url.includes(api.buildingApartments(8)) &&
          (!init?.method || init.method === 'GET'),
        response: () =>
          apiSuccess([
            {
              id: 3,
              unit_code: 'C3',
              yearly_price: 2400000,
              status: 'occupied',
            },
            {
              id: 4,
              unit_code: 'D4',
              yearly_price: 2100000,
              status: 'vacant',
            },
          ]),
      },
      {
        match: (url, init) =>
          url.includes(api.rentalRequestApprove(55)) && init?.method === 'POST',
        response: () =>
          apiSuccess(
            {
              rental_request: { id: 55, status: 'approved' },
              tenant: { id: 7, name: 'Sam Lee' },
              lease: { id: 10, status: 'active' },
              payment: null,
            },
            201,
          ),
      },
    ]);

    renderWithRoute(<RentalRequestsList />);

    expect((await screen.findAllByText('Sam Lee')).length).toBeGreaterThan(0);
    await userEvent.click(
      screen.getAllByRole('button', { name: 'Approve' })[0],
    );
    expect(
      await screen.findByText('Confirm tenant details'),
    ).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Continue' }));
    await userEvent.selectOptions(
      await screen.findByLabelText('Apartment to assign'),
      '4',
    );
    await userEvent.click(screen.getByRole('button', { name: 'Continue' }));
    expect(screen.getByText('First payment')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Continue' }));
    expect(screen.getByText('Welcome message')).toBeInTheDocument();
    await userEvent.click(
      screen.getByRole('button', { name: 'Approve and Send Welcome Message' }),
    );

    await waitFor(() => {
      const request = fetchMock.mock.calls.find(
        ([url, init]) =>
          String(url).includes(api.rentalRequestApprove(55)) &&
          init?.method === 'POST',
      );

      expect(request).toBeTruthy();
      expect(JSON.parse(String(request?.[1]?.body))).toMatchObject({
        start_date: expect.any(String),
        apartment_id: 4,
        rent_amount: 2100000,
        record_payment: false,
      });
    });
  });

  it('rejects a request through the rejection dialog', async () => {
    const fetchMock = mockFetch([
      {
        match: (url, init) =>
          url.includes(api.rentalRequests) &&
          (!init?.method || init.method === 'GET'),
        response: () =>
          apiSuccess([
            {
              id: 61,
              name: 'Sam Lee',
              email: 'sam@example.com',
              phone: '5550100',
              status: 'new',
              apartment: {
                unit_code: 'C3',
                building: { name: 'Riverside' },
              },
            },
          ]),
      },
      {
        match: (url, init) =>
          url.includes(api.rentalRequestReject(61)) && init?.method === 'POST',
        response: () =>
          apiSuccess({ rental_request: { id: 61, status: 'rejected' } }),
      },
    ]);

    renderWithRoute(<RentalRequestsList />);

    expect((await screen.findAllByText('Sam Lee')).length).toBeGreaterThan(0);
    await userEvent.click(screen.getByRole('button', { name: 'Reject' }));
    await userEvent.type(
      screen.getByLabelText('Rejection Reason'),
      'Unit unavailable',
    );
    await userEvent.click(
      screen.getByRole('button', { name: 'Reject Request' }),
    );

    await waitFor(() => {
      const request = fetchMock.mock.calls.find(
        ([url, init]) =>
          String(url).includes(api.rentalRequestReject(61)) &&
          init?.method === 'POST',
      );

      expect(request).toBeTruthy();
      expect(JSON.parse(String(request?.[1]?.body))).toMatchObject({
        rejection_reason: 'Unit unavailable',
      });
    });
  });

  it('shows plain guidance when there are no rental requests', async () => {
    mockFetch([
      {
        match: (url) => url.includes(api.rentalRequests),
        response: () => apiSuccess([]),
      },
    ]);

    renderWithRoute(<RentalRequestsList />);

    expect(await screen.findByText('No rental requests')).toBeInTheDocument();
    expect(
      screen.getByText(
        'No one has applied yet. Share a rental request link from a vacant apartment to invite the next tenant.',
      ),
    ).toBeInTheDocument();
  });
});
