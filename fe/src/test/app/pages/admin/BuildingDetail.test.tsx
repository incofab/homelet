import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { BuildingDetail } from '../../../../app/pages/admin/BuildingDetail';
import { apiSuccess, mockFetch, renderWithRoute } from '../../../testUtils';
import { api, routePaths, routes } from '../../../../app/lib/urls';

const buildingPayload = {
  id: 1,
  name: 'Skyline Tower',
  city: 'Lagos',
  state: 'Lagos',
  description: 'High-rise building',
  units: 10,
  occupied_count: 7,
  managers: [],
};

const apartmentsPayload = [
  {
    id: 9,
    unit_code: 'A1',
    yearly_price: 1200000,
    status: 'vacant',
  },
];

describe('BuildingDetail', () => {
  beforeEach(() => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
  });

  it('renders building details and lets users add a tenant', async () => {
    const fetchMock = mockFetch([
      {
        match: (url) => url.includes(api.buildingApartments(1)),
        response: () => apiSuccess(apartmentsPayload),
      },
      {
        match: (url) => String(url).endsWith(api.building(1)),
        response: () => apiSuccess(buildingPayload),
      },
      {
        match: (url) => String(url).endsWith(api.buildingMedia(1)),
        response: () =>
          apiSuccess([
            {
              id: 21,
              url: 'https://example.com/cover.jpg',
            },
            {
              id: 22,
              url: 'https://example.com/gallery.jpg',
            },
          ]),
      },
      {
        match: (url, init) =>
          String(url).endsWith(api.buildingMediaItem(1, 21)) &&
          init?.method === 'DELETE',
        response: () => apiSuccess(null),
      },
      {
        match: (url, init) =>
          String(url).endsWith(api.buildingMedia(1)) &&
          init?.method === 'POST',
        response: () =>
          apiSuccess({
            media: {
              id: 23,
              url: 'https://example.com/new-upload.jpg',
            },
          }, 201),
      },
      {
        match: (url, init) =>
          url.includes(api.apartmentAssignTenantLookup(9)) &&
          init?.method === 'POST',
        response: () =>
          apiSuccess({
            exists: false,
            requires_name: true,
            tenant: null,
          }),
      },
      {
        match: (url, init) =>
          url.includes(api.apartmentAssignTenant(9)) && init?.method === 'POST',
        response: () => apiSuccess({ apartment: { id: 9 } }, 201),
      },
    ]);

    renderWithRoute(<BuildingDetail />, {
      route: routes.adminBuilding(1),
      path: `${routes.adminRoot}/${routePaths.adminBuilding}`,
    });

    expect(await screen.findByText('Skyline Tower')).toBeInTheDocument();
    expect(screen.getByAltText('Skyline Tower')).toHaveAttribute(
      'src',
      'https://example.com/cover.jpg',
    );
    expect(screen.getByText('A1')).toBeInTheDocument();
    expect(screen.getByText('No managers assigned.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Edit building' })).toHaveAttribute(
      'href',
      routes.adminBuildingEdit(1),
    );
    expect(screen.getByRole('link', { name: 'View Tenants' })).toHaveAttribute(
      'href',
      routes.adminBuildingTenants(1),
    );
    expect(screen.getByRole('button', { name: 'Add Image' })).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: 'Delete' })).toHaveLength(2);

    const uploadInput = screen.getByLabelText('Building Images upload');
    const file = new File(['image'], 'building-upload.jpg', {
      type: 'image/jpeg',
    });
    await userEvent.upload(uploadInput, file);
    await waitFor(() => {
      const uploadRequest = fetchMock.mock.calls.find(
        ([url, init]) =>
          String(url).endsWith(api.buildingMedia(1)) &&
          init?.method === 'POST',
      );

      expect(uploadRequest).toBeTruthy();
      expect(uploadRequest?.[1]?.body).toBeInstanceOf(FormData);
      expect((uploadRequest?.[1]?.body as FormData).get('file')).toBe(file);
    });

    await userEvent.click(screen.getAllByRole('button', { name: 'Delete' })[0]);
    expect(window.confirm).toHaveBeenCalledWith(
      expect.stringContaining('"action": "delete_image"'),
    );
    await waitFor(() => {
      const deleteRequest = fetchMock.mock.calls.find(
        ([url, init]) =>
          String(url).endsWith(api.buildingMediaItem(1, 21)) &&
          init?.method === 'DELETE',
      );

      expect(deleteRequest).toBeTruthy();
    });

    await userEvent.click(screen.getByRole('button', { name: 'Add Tenant' }));
    await userEvent.type(
      screen.getByPlaceholderText('08012345678 or jane@example.com'),
      'mary@example.com',
    );
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'OK' })).not.toBeDisabled();
    });
    await userEvent.click(screen.getByRole('button', { name: 'OK' }));
    await userEvent.type(
      screen.getByPlaceholderText('Jane Doe'),
      'Mary Tenant',
    );
    await userEvent.type(
      await screen.findByLabelText('Tenant Phone'),
      '08012345678',
    );
    await userEvent.type(
      screen.getByLabelText('Lease Start Date'),
      '2026-05-01',
    );
    await userEvent.click(
      screen.getByRole('button', { name: 'Add Tenant to Building' }),
    );

    await waitFor(() => {
      const lookupRequest = fetchMock.mock.calls.find(
        ([url, init]) =>
          String(url).includes(api.apartmentAssignTenantLookup(9)) &&
          init?.method === 'POST',
      );
      const request = fetchMock.mock.calls.find(
        ([url, init]) =>
          String(url).includes(api.apartmentAssignTenant(9)) &&
          !String(url).includes(api.apartmentAssignTenantLookup(9)) &&
          init?.method === 'POST',
      );

      expect(lookupRequest).toBeTruthy();
      expect(request).toBeTruthy();
      expect(JSON.parse(String(request?.[1]?.body))).toMatchObject({
        tenant_email: 'mary@example.com',
        tenant_phone: '08012345678',
        tenant_name: 'Mary Tenant',
      });
    });
  });
});
