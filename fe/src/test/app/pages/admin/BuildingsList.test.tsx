import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { BuildingsList } from '../../../../app/pages/admin/BuildingsList';

const renderPage = () =>
  render(
    <MemoryRouter>
      <BuildingsList />
    </MemoryRouter>,
  );

describe('BuildingsList', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders buildings when API returns wrapped payload', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(
        async () =>
          new Response(
            JSON.stringify({
              success: true,
              message: 'OK',
              data: {
                buildings: [
                  {
                    id: 1,
                    name: 'Skyline Tower',
                    city: 'Lagos',
                    state: 'Lagos',
                    apartments_count: 10,
                    occupied_count: 7,
                  },
                ],
              },
              errors: null,
            }),
            { status: 200 },
          ),
      ),
    );

    renderPage();

    expect(await screen.findByText('Skyline Tower')).toBeInTheDocument();
    expect(screen.getByText('Lagos, Lagos')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'View' })).toHaveAttribute(
      'href',
      '/admin/buildings/1',
    );
    expect(screen.getByRole('link', { name: 'Apartments' })).toHaveAttribute(
      'href',
      '/admin/buildings/1/apartments',
    );
    expect(screen.getByRole('link', { name: 'Tenants' })).toHaveAttribute(
      'href',
      '/admin/buildings/1/tenants',
    );
  });

  it('renders empty state when no buildings', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(
        async () =>
          new Response(
            JSON.stringify({
              success: true,
              message: 'OK',
              data: { buildings: [] },
              errors: null,
            }),
            { status: 200 },
          ),
      ),
    );

    renderPage();

    expect(await screen.findByText('No buildings yet')).toBeInTheDocument();
  });
});
