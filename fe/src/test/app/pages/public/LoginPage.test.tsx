import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { LoginPage } from '../../../../app/pages/public/LoginPage';
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

describe('LoginPage', () => {
  it('signs in and routes tenants to their dashboard', async () => {
    mockFetch([
      {
        match: (url, init) =>
          url.includes(api.authLogin) && init?.method === 'POST',
        response: () =>
          apiSuccess({
            user: {
              id: 1,
              name: 'Jane Tenant',
              email: 'jane@example.com',
              role: 'user',
            },
            dashboard: 'tenant',
            token: 'tenant-token',
          }),
      },
    ]);

    renderWithRoute(<LoginPage />);

    await userEvent.type(
      screen.getByPlaceholderText('you@example.com or 08012345678'),
      '08012345678',
    );
    await userEvent.type(
      screen.getByPlaceholderText('Enter your password'),
      'secret',
    );
    await userEvent.click(screen.getByRole('button', { name: 'Sign In' }));

    expect(window.localStorage.getItem('tenanta_token')).toBe('tenant-token');
    expect(mockNavigate).toHaveBeenCalledWith(routes.tenantRoot);
  });
});
