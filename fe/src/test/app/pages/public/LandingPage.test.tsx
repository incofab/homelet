import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { LandingPage } from '../../../../app/pages/public/LandingPage';
import { env } from '../../../../app/lib/env';
import { api, routes } from '../../../../app/lib/urls';

const renderPage = () =>
  render(
    <MemoryRouter>
      <LandingPage />
    </MemoryRouter>,
  );

describe('LandingPage', () => {
  beforeEach(() => {
    cleanup();
    vi.restoreAllMocks();
    window.localStorage.clear();
  });

  it('renders public listings from the API', async () => {
    const mockFetch = vi.fn(async (input: RequestInfo | URL) => {
      const url = input.toString();

      if (url.includes(api.publicBuildings)) {
        return new Response(
          JSON.stringify({
            success: true,
            message: 'OK',
            data: {
              buildings: {
                data: [
                  {
                    id: 2,
                    name: 'Riverside Complex',
                    address_line1: '77 River Road',
                    city: 'Portland',
                    state: 'OR',
                    contact_email: 'hello@riverside.test',
                    contact_phone: '555-2200',
                    public_apartments_count: 4,
                  },
                ],
              },
            },
            errors: null,
          }),
          { status: 200 },
        );
      }

      return new Response(JSON.stringify({ success: true, data: [] }), {
        status: 200,
      });
    });

    vi.stubGlobal('fetch', mockFetch);

    renderPage();

    expect(
      await screen.findByText('Buildings with available apartments'),
    ).toBeInTheDocument();
    expect(await screen.findByText('Riverside Complex')).toBeInTheDocument();
    expect(await screen.findByText('hello@riverside.test')).toBeInTheDocument();
    expect(screen.getByText('4 available apartments')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /view details/i })).toHaveAttribute(
      'href',
      routes.buildingPublic(2),
    );
  });

  it('shows empty states when no listings are available', async () => {
    const mockFetch = vi.fn(
      async () =>
        new Response(
          JSON.stringify({
            success: true,
            message: 'OK',
            data: [],
            errors: null,
          }),
          { status: 200 },
        ),
    );

    vi.stubGlobal('fetch', mockFetch);

    renderPage();

    expect(
      await screen.findByText('No available apartments yet'),
    ).toBeInTheDocument();
  });

  it('replaces login actions with a dashboard link for authenticated users', async () => {
    window.localStorage.setItem(env.authTokenKey, 'tenant-token');

    const mockFetch = vi.fn(async (input: RequestInfo | URL) => {
      const url = input.toString();

      if (url.includes(api.authMe)) {
        return new Response(
          JSON.stringify({
            success: true,
            message: 'OK',
            data: {
              user: {
                id: 7,
                name: 'Ada Tenant',
              },
              dashboard: 'tenant',
            },
            errors: null,
          }),
          { status: 200 },
        );
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: 'OK',
          data: [],
          errors: null,
        }),
        { status: 200 },
      );
    });

    vi.stubGlobal('fetch', mockFetch);

    renderPage();

    expect(
      await screen.findByRole('link', { name: /go to dashboard/i }),
    ).toHaveAttribute('href', '/tenant');
    expect(screen.queryAllByRole('link', { name: /^login$/i })).toHaveLength(0);
    expect(
      screen.queryAllByRole('link', { name: /get started/i }),
    ).toHaveLength(0);
  });
});
