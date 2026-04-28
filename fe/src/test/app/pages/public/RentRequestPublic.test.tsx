import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { RentRequestPublic } from '../../../../app/pages/public/RentRequestPublic';
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

const apartment = {
  id: 7,
  unit_code: 'B2',
  yearly_price: 1400000,
  status: 'vacant',
  description: 'Ready to move in',
  building: {
    id: 2,
    name: 'Harbor Court',
    city: 'Lagos',
    state: 'Lagos',
    contact_email: 'manager@harbor.test',
    contact_phone: '08012345678',
  },
  media: [],
  reviews: [],
};

describe('RentRequestPublic', () => {
  it('opens the direct rental request form and submits for the selected apartment', async () => {
    const fetchMock = mockFetch([
      {
        match: (url) => String(url).endsWith(api.publicRentRequestApartment(7)),
        response: () =>
          apiSuccess({
            apartment,
            can_request: true,
            unavailable_message: null,
          }),
      },
      {
        match: (url, init) =>
          String(url).includes(api.publicRentalRequests) &&
          init?.method === 'POST',
        response: () => apiSuccess({ rental_request: { id: 31 } }, 201),
      },
    ]);

    renderWithRoute(<RentRequestPublic />, {
      route: routes.rentRequest(7),
      path: routePaths.rentRequest,
    });

    expect(await screen.findByText('Harbor Court - B2')).toBeInTheDocument();
    expect(screen.getByText('Rental Request Form')).toBeInTheDocument();

    await userEvent.type(screen.getByPlaceholderText('John Doe'), 'Ada Okafor');
    await userEvent.type(
      screen.getByPlaceholderText('john@example.com'),
      'ada@example.com',
    );
    await userEvent.type(
      screen.getByPlaceholderText('(555) 123-4567'),
      '08055551234',
    );
    await userEvent.click(
      screen.getByRole('button', { name: 'Submit Request' }),
    );

    expect(
      await screen.findByText(
        'Request submitted successfully. The landlord or manager will contact you soon.',
      ),
    ).toBeInTheDocument();
    expect(appToast.success).toHaveBeenCalledWith(
      'Rental request created successfully.',
    );
    const request = fetchMock.mock.calls.find(
      ([url, init]) =>
        String(url).includes(api.publicRentalRequests) &&
        init?.method === 'POST',
    );
    expect(
      request?.[1]?.body ? JSON.parse(String(request[1].body)) : null,
    ).toMatchObject({
      apartment_id: 7,
      name: 'Ada Okafor',
    });
  });

  it('shows a friendly unavailable message when the apartment cannot receive requests', async () => {
    mockFetch([
      {
        match: (url) => String(url).endsWith(api.publicRentRequestApartment(7)),
        response: () =>
          apiSuccess({
            apartment: { ...apartment, status: 'occupied' },
            can_request: false,
            unavailable_message:
              'This apartment is no longer available for rental requests. Please contact the landlord or manager for another option.',
          }),
      },
    ]);

    renderWithRoute(<RentRequestPublic />, {
      route: routes.rentRequest(7),
      path: routePaths.rentRequest,
    });

    expect(
      await screen.findByText('Apartment unavailable'),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        'This apartment is no longer available for rental requests. Please contact the landlord or manager for another option.',
      ),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Submit Request' }),
    ).not.toBeInTheDocument();
  });
});
