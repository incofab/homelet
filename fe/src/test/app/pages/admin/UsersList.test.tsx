import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { UsersList } from "../../../../app/pages/admin/UsersList";
import { api, routes } from "../../../../app/lib/urls";
import { apiSuccess, mockFetch, renderWithRoute } from "../../../testUtils";

describe("UsersList", () => {
  beforeEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("renders users from the admin users API", async () => {
    mockFetch([
      {
        match: (url) => url.includes(api.authMe),
        response: () => apiSuccess({ user: { id: 1, name: "Admin", role: "admin" } }),
      },
      {
        match: (url) => url.includes(api.users),
        response: () =>
          apiSuccess({
            users: {
              data: [
                {
                  id: 1,
                  name: "Jane Admin",
                  email: "jane@example.com",
                  phone: "1234567890",
                  role: "admin",
                },
              ],
            },
          }),
      },
    ]);

    renderWithRoute(<UsersList />, { route: routes.adminUsers, path: "/admin/users" });

    expect(await screen.findByText(/Jane Admin/i)).toBeInTheDocument();
    expect(screen.getByText("jane@example.com")).toBeInTheDocument();
  });

  it("redirects non-admin users away from the page", async () => {
    mockFetch([
      {
        match: (url) => url.includes(api.authMe),
        response: () => apiSuccess({ user: { id: 2, name: "User", role: "user" } }),
      },
    ]);

    render(
      <MemoryRouter initialEntries={[routes.adminUsers]}>
        <Routes>
          <Route path="/admin/users" element={<UsersList />} />
          <Route path="/admin" element={<div>Admin dashboard</div>} />
        </Routes>
      </MemoryRouter>
    );

    expect(await screen.findByText(/admin dashboard/i)).toBeInTheDocument();
    expect(screen.queryByText(/search users/i)).not.toBeInTheDocument();
  });
});
