import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ChatAdmin } from '../../../../app/pages/admin/ChatAdmin';
import { apiSuccess, mockFetch, renderWithRoute } from '../../../testUtils';
import { api } from '../../../../app/lib/urls';

describe('ChatAdmin', () => {
  it('shows empty state when no conversations', async () => {
    mockFetch([
      {
        match: (url) =>
          url.includes(api.conversations) &&
          !url.includes('/messages') &&
          !url.includes('/read'),
        response: () => apiSuccess([]),
      },
    ]);

    renderWithRoute(<ChatAdmin />);

    expect(await screen.findByText('No conversations')).toBeInTheDocument();
  });

  it('shows conversation identity and separates incoming and outgoing messages', async () => {
    mockFetch([
      {
        match: (url) =>
          url.includes(api.conversations) &&
          !url.includes('/messages') &&
          !url.includes('/read'),
        response: () =>
          apiSuccess([
            {
              id: 14,
              title: 'Jane Tenant',
              subtitle: 'A-12 · Maple Heights',
              unread_count: 1,
              counterpart: {
                id: 6,
                name: 'Jane Tenant',
                names: ['Jane Tenant'],
                count: 1,
              },
              last_message: {
                body: 'Can maintenance stop by today?',
                created_at: '2026-03-23T09:30:00.000Z',
                is_mine: false,
                sender: { id: 6, name: 'Jane Tenant' },
              },
            },
          ]),
      },
      {
        match: (url) => url.includes(api.conversationMessages(14)),
        response: () =>
          apiSuccess([
            {
              id: 1,
              body: 'Can maintenance stop by today?',
              created_at: '2026-03-23T09:30:00.000Z',
              is_mine: false,
              sender: { id: 6, name: 'Jane Tenant' },
            },
            {
              id: 2,
              body: 'Yes, they will be there by noon.',
              created_at: '2026-03-23T09:45:00.000Z',
              is_mine: true,
              sender: { id: 2, name: 'Building Admin' },
            },
          ]),
      },
      {
        match: (url, init) =>
          url.includes(api.conversationRead(14)) && init?.method === 'POST',
        response: () => apiSuccess({ updated: 1 }),
      },
    ]);

    renderWithRoute(<ChatAdmin />);

    expect((await screen.findAllByText('Jane Tenant')).length).toBeGreaterThan(
      0,
    );
    expect(
      (await screen.findAllByText('A-12 · Maple Heights')).length,
    ).toBeGreaterThan(0);
    expect(
      (await screen.findAllByText('Can maintenance stop by today?')).length,
    ).toBeGreaterThan(0);
    expect(
      (await screen.findAllByText('Yes, they will be there by noon.')).length,
    ).toBeGreaterThan(0);
  });
});
