import { cleanup, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { ChatTenant } from '../../../../app/pages/tenant/ChatTenant';
import { apiSuccess, mockFetch, renderWithRoute } from '../../../testUtils';
import { api } from '../../../../app/lib/urls';

describe('ChatTenant', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  afterEach(() => {
    cleanup();
  });

  it('shows empty message state when no conversations', async () => {
    mockFetch([
      {
        match: (url) => url.includes(api.conversations),
        response: () => apiSuccess([]),
      },
      {
        match: (url) => url.includes(api.dashboardTenant),
        response: () => apiSuccess({ active_lease: { apartment_id: 9 } }),
      },
    ]);

    renderWithRoute(<ChatTenant />);

    expect(await screen.findByText('No messages yet')).toBeInTheDocument();
  });

  it('creates a conversation on first tenant message when none exists yet', async () => {
    const fetchMock = mockFetch([
      {
        match: (url, init) =>
          url.includes(api.conversations) && init?.method === 'GET',
        response: () => apiSuccess([]),
      },
      {
        match: (url) => url.includes(api.dashboardTenant),
        response: () => apiSuccess({ active_lease: { apartment_id: 9 } }),
      },
      {
        match: (url, init) =>
          url.includes(api.conversations) && init?.method === 'POST',
        response: () => apiSuccess({ conversation: { id: 5 } }, 201),
      },
      {
        match: (url, init) =>
          url.includes(api.conversationMessages(5)) && init?.method === 'POST',
        response: () =>
          apiSuccess({ message: { id: 11, body: 'Hello manager' } }, 201),
      },
      {
        match: (url, init) =>
          url.includes(api.conversationMessages(5)) && init?.method === 'GET',
        response: () => apiSuccess([]),
      },
      {
        match: (url, init) =>
          url.includes(api.conversationRead(5)) && init?.method === 'POST',
        response: () => apiSuccess({ updated: 0 }),
      },
    ]);

    renderWithRoute(<ChatTenant />);

    const messageInputs =
      await screen.findAllByPlaceholderText('Type a message...');
    await userEvent.type(messageInputs[0], 'Hello manager');
    await userEvent.click(screen.getAllByRole('button')[0]);

    await waitFor(() => {
      const createConversationRequest = fetchMock.mock.calls.find(
        ([url, init]) =>
          String(url).includes(api.conversations) && init?.method === 'POST',
      );
      expect(createConversationRequest).toBeTruthy();

      const [, createInit] = createConversationRequest!;
      expect(JSON.parse(String(createInit?.body))).toEqual({
        apartment_id: 9,
      });
    });

    await waitFor(() => {
      const sendMessageRequest = fetchMock.mock.calls.find(
        ([url, init]) =>
          String(url).includes(api.conversationMessages(5)) &&
          init?.method === 'POST',
      );
      expect(sendMessageRequest).toBeTruthy();

      const [, sendInit] = sendMessageRequest!;
      expect(JSON.parse(String(sendInit?.body))).toEqual({
        body: 'Hello manager',
      });
    });
  });

  it('shows the conversation name and both message directions', async () => {
    mockFetch([
      {
        match: (url, init) =>
          url.endsWith(api.conversations) && init?.method === 'GET',
        response: () =>
          apiSuccess([
            {
              id: 5,
              title: 'Mary Landlord',
              subtitle: 'B-2 · Palm Court',
              counterpart: {
                id: 12,
                name: 'Mary Landlord',
                names: ['Mary Landlord'],
                count: 1,
              },
            },
          ]),
      },
      {
        match: (url) => url.includes(api.dashboardTenant),
        response: () =>
          apiSuccess({
            active_lease: {
              apartment_id: 9,
              building_name: 'Palm Court',
            },
          }),
      },
      {
        match: (url, init) =>
          url.endsWith(api.conversationMessages(5)) && init?.method === 'GET',
        response: () =>
          apiSuccess([
            {
              id: 1,
              body: 'Welcome to your new home.',
              created_at: '2026-03-23T08:00:00.000Z',
              is_mine: false,
              sender: { id: 12, name: 'Mary Landlord' },
            },
            {
              id: 2,
              body: 'Thank you.',
              created_at: '2026-03-23T08:05:00.000Z',
              is_mine: true,
              sender: { id: 20, name: 'Tenant User' },
            },
          ]),
      },
      {
        match: (url, init) =>
          url.includes(api.conversationRead(5)) && init?.method === 'POST',
        response: () => apiSuccess({ updated: 1 }),
      },
    ]);

    renderWithRoute(<ChatTenant />);

    expect(
      (await screen.findAllByText('Mary Landlord')).length,
    ).toBeGreaterThan(0);
    expect(
      (await screen.findAllByText('B-2 · Palm Court')).length,
    ).toBeGreaterThan(0);
    expect(
      await screen.findByText('Welcome to your new home.'),
    ).toBeInTheDocument();
    expect(await screen.findByText('Thank you.')).toBeInTheDocument();
  });
});
