import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { CreateBuilding } from '../../../../app/pages/admin/CreateBuilding';
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

describe('CreateBuilding', () => {
  it('submits the form and navigates to the new building', async () => {
    const fetchMock = mockFetch([
      {
        match: (url, init) =>
          url.includes(api.buildings) && init?.method === 'POST',
        response: () =>
          apiSuccess({ building: { id: 123, name: 'Skyline Tower' } }),
      },
    ]);

    renderWithRoute(<CreateBuilding />);

    await userEvent.type(
      screen.getByPlaceholderText('e.g., Skyline Tower'),
      'Skyline Tower',
    );
    await userEvent.type(
      screen.getByPlaceholderText('123 Main Street'),
      '123 Main Street',
    );
    const lagosFields = screen.getAllByPlaceholderText('Lagos');
    await userEvent.type(lagosFields[0], 'Lagos');
    await userEvent.type(lagosFields[1], 'Lagos');
    await userEvent.type(
      screen.getByPlaceholderText('leasing@example.com'),
      'leasing@skyline.test',
    );
    await userEvent.type(
      screen.getByPlaceholderText('+1 555 0100'),
      '555-2000',
    );

    await userEvent.click(
      screen.getByRole('button', { name: 'Create Building' }),
    );

    expect(mockNavigate).toHaveBeenCalledWith(routes.adminBuilding(123));
    const request = fetchMock.mock.calls.find(
      ([url, init]) =>
        String(url).includes(api.buildings) && init?.method === 'POST',
    );
    const requestBody = request?.[1]?.body
      ? JSON.parse(String(request[1].body))
      : null;
    expect(requestBody).toMatchObject({
      contact_email: 'leasing@skyline.test',
      contact_phone: '555-2000',
    });
  });
});
