import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ApartmentDetailPublic } from '../../../../app/pages/public/ApartmentDetailPublic';
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

const mockApartment = {
  id: 1,
  unit_code: 'A1',
  yearly_price: 1200000,
  status: 'vacant',
  description: 'Bright and airy',
  amenities: ['Gym', 'Pool'],
  beds: 2,
  baths: 2,
  sqft: 900,
  building: {
    id: 4,
    name: 'Sunrise Apartments',
    city: 'Lagos',
    state: 'Lagos',
    address_line1: '123 Main St',
    contact_email: 'leasing@sunrise.test',
    contact_phone: '555-1212',
  },
  media: [
    { id: 10, url: 'https://example.com/1.jpg' },
    { id: 11, url: 'https://example.com/2.jpg' },
  ],
  reviews: [
    {
      id: 8,
      rating: 4,
      comment: 'Great place',
      author: 'Ada',
      created_at: '2024-01-10',
    },
  ],
};

describe('ApartmentDetailPublic', () => {
  it('renders apartment details and submits a rental request', async () => {
    const fetchMock = mockFetch([
      {
        match: (url) => String(url).endsWith(api.publicApartment(1)),
        response: () => apiSuccess({ apartment: mockApartment }),
      },
      {
        match: (url, init) =>
          url.includes(api.publicRentalRequests) && init?.method === 'POST',
        response: () => apiSuccess({ id: 99 }),
      },
    ]);

    renderWithRoute(<ApartmentDetailPublic />, {
      route: routes.apartmentPublic(1),
      path: routePaths.apartmentPublic,
    });

    expect(
      await screen.findByText('Sunrise Apartments - A1'),
    ).toBeInTheDocument();
    expect(screen.getByText('Amenities')).toBeInTheDocument();
    expect(screen.getByText('Tenant Reviews')).toBeInTheDocument();
    expect(screen.getByText('leasing@sunrise.test')).toBeInTheDocument();
    expect(screen.getByText('555-1212')).toBeInTheDocument();

    await userEvent.click(
      screen.getByRole('button', { name: 'Submit Rental Request' }),
    );
    expect(
      screen.queryByLabelText('Apartment to rent'),
    ).not.toBeInTheDocument();
    await userEvent.type(screen.getByPlaceholderText('John Doe'), 'Jane Doe');
    await userEvent.type(
      screen.getByPlaceholderText('john@example.com'),
      'jane@example.com',
    );
    await userEvent.type(
      screen.getByPlaceholderText('(555) 123-4567'),
      '555-1234',
    );
    await userEvent.type(
      screen.getByPlaceholderText('Tell us about yourself...'),
      'Interested in leasing.',
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
    expect(request).toBeTruthy();
    expect(
      request?.[1]?.body ? JSON.parse(String(request[1].body)) : null,
    ).toMatchObject({
      apartment_id: 1,
      name: 'Jane Doe',
    });
  });
});
