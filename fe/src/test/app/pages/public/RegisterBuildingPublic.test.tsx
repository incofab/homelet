import { fireEvent, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { RegisterBuildingPublic } from '../../../../app/pages/public/RegisterBuildingPublic';
import { api, routes, withRedirect } from '../../../../app/lib/urls';
import { apiSuccess, mockFetch, renderWithRoute } from '../../../testUtils';

const mockNavigate = vi.fn();

vi.mock('react-router', async () => {
  const actual =
    await vi.importActual<typeof import('react-router')>('react-router');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('RegisterBuildingPublic', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
    window.localStorage.clear();
  });

  it('redirects guests to signup with a return path', () => {
    renderWithRoute(<RegisterBuildingPublic />, {
      route: routes.registerBuilding,
      path: routes.registerBuilding,
    });

    expect(mockNavigate).toHaveBeenCalledWith(
      withRedirect(routes.register, routes.registerBuilding),
      { replace: true },
    );
  });

  it('shows approval guidance and admin contacts after submission', async () => {
    window.localStorage.setItem('homelet_token', 'owner-token');
    const fetchMock = mockFetch([
      {
        match: (url, init) =>
          url.includes(api.buildingRegistrationRequests) &&
          init?.method === 'POST',
        response: () =>
          apiSuccess(
            {
              request: {
                id: 42,
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

    renderWithRoute(<RegisterBuildingPublic />, {
      route: routes.registerBuilding,
      path: routes.registerBuilding,
    });

    fireEvent.change(screen.getByPlaceholderText('Sunrise Apartments'), {
      target: { value: 'Sunrise Apartments' },
    });
    fireEvent.change(screen.getByPlaceholderText('12 Main Street'), {
      target: { value: '12 Main Street' },
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
    expect(
      screen.getByText(
        /please wait for approval before the building is added/i,
      ),
    ).toBeInTheDocument();
    expect(screen.getByText('Reference ID: 42')).toBeInTheDocument();
    expect(screen.getByText('approvals@homelet.test')).toBeInTheDocument();
    expect(screen.getByText('+234 700 000 0000')).toBeInTheDocument();
    expect(screen.getByText('+234 701 000 0000')).toBeInTheDocument();
    expect(
      screen.getByText('Support hours: Weekdays, 9 AM - 5 PM WAT'),
    ).toBeInTheDocument();

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
  });
});
