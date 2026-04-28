import { cleanup, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { RegisterPage } from '../../../../app/pages/public/RegisterPage';
import { apiSuccess, mockFetch, renderWithRoute } from '../../../testUtils';
import { api, routes } from '../../../../app/lib/urls';

const mockNavigate = vi.fn();

vi.mock('react-router', async () => {
  const actual =
    await vi.importActual<typeof import('react-router')>('react-router');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('RegisterPage', () => {
  beforeEach(() => {
    mockNavigate.mockReset();
    window.localStorage.clear();
  });

  afterEach(() => {
    cleanup();
  });

  it('registers a user and routes a new user to the home dashboard', async () => {
    mockFetch([
      {
        match: (url, init) =>
          url.includes(api.authRegister) && init?.method === 'POST',
        response: () =>
          apiSuccess({
            user: {
              id: 2,
              name: 'Platform User',
              email: 'user@example.com',
              role: 'user',
            },
            dashboard: 'home',
            token: 'user-token',
          }),
      },
    ]);

    renderWithRoute(<RegisterPage />);

    await userEvent.type(
      screen.getByPlaceholderText('Jane Doe'),
      'Platform User',
    );
    await userEvent.type(
      screen.getByPlaceholderText('1234567890'),
      '080 123 4567',
    );
    await userEvent.type(
      screen.getByPlaceholderText('you@example.com'),
      'user@example.com',
    );
    await userEvent.type(
      screen.getByPlaceholderText('Create a password'),
      'secret',
    );
    await userEvent.type(
      screen.getByPlaceholderText('Confirm your password'),
      'secret',
    );
    await userEvent.click(screen.getByRole('button', { name: 'Sign Up' }));

    expect(window.localStorage.getItem('homelet_token')).toBe('user-token');
    expect(mockNavigate).toHaveBeenCalledWith(routes.homeDashboard);
  });

  it('preserves a building registration redirect after signup', async () => {
    mockFetch([
      {
        match: (url, init) =>
          url.includes(api.authRegister) && init?.method === 'POST',
        response: () =>
          apiSuccess({
            user: {
              id: 3,
              name: 'Owner User',
              email: 'owner@example.com',
              role: 'user',
            },
            dashboard: 'home',
            token: 'owner-token',
          }),
      },
    ]);

    renderWithRoute(<RegisterPage />, {
      route: `${routes.register}?redirect=${encodeURIComponent(
        routes.registerBuilding,
      )}`,
      path: routes.register,
    });

    await userEvent.type(screen.getByPlaceholderText('Jane Doe'), 'Owner User');
    await userEvent.type(
      screen.getByPlaceholderText('1234567890'),
      '08012345678',
    );
    await userEvent.type(
      screen.getByPlaceholderText('you@example.com'),
      'owner@example.com',
    );
    await userEvent.type(
      screen.getByPlaceholderText('Create a password'),
      'secret123',
    );
    await userEvent.type(
      screen.getByPlaceholderText('Confirm your password'),
      'secret123',
    );
    await userEvent.click(screen.getByRole('button', { name: 'Sign Up' }));

    expect(mockNavigate).toHaveBeenCalledWith(routes.registerBuilding);
  });
});
