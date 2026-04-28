import { fireEvent, screen, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { RegisterBuildingRequest } from '../../../../app/pages/admin/RegisterBuildingRequest';
import { api, routes } from '../../../../app/lib/urls';
import { apiSuccess, mockFetch, renderWithRoute } from '../../../testUtils';

describe('RegisterBuildingRequest', () => {
  it('shows approval guidance and admin contacts after submission', async () => {
    const fetchMock = mockFetch([
      {
        match: (url, init) =>
          url.includes(api.buildingRegistrationRequests) &&
          init?.method === 'POST',
        response: () =>
          apiSuccess(
            {
              request: {
                id: 87,
                status: 'pending',
              },
              admin_contacts: {
                email: 'approvals@homelet.test',
                phone: '+234 700 000 0000',
                whatsapp: '+234 701 000 0000',
                support_hours: 'Weekdays, 9 AM - 5 PM WAT',
              },
            },
            201,
          ),
      },
    ]);

    renderWithRoute(<RegisterBuildingRequest />, {
      route: routes.adminBuildingRequestNew,
      path: routes.adminBuildingRequestNew,
    });

    fireEvent.change(screen.getByPlaceholderText('e.g., Skyline Tower'), {
      target: { value: 'Skyline Tower' },
    });
    fireEvent.change(screen.getByPlaceholderText('123 Main Street'), {
      target: { value: '123 Main Street' },
    });
    const locationFields = screen.getAllByPlaceholderText('Lagos');
    fireEvent.change(locationFields[0], {
      target: { value: 'Lagos' },
    });
    fireEvent.change(locationFields[1], {
      target: { value: 'Lagos' },
    });

    fireEvent.click(screen.getByRole('button', { name: /submit request/i }));

    expect(await screen.findByText('Request submitted')).toBeInTheDocument();
    expect(screen.getByText('Reference ID: 87')).toBeInTheDocument();
    expect(screen.getByText('approvals@homelet.test')).toBeInTheDocument();
    expect(
      screen.getByText('Support hours: Weekdays, 9 AM - 5 PM WAT'),
    ).toBeInTheDocument();

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
  });
});
