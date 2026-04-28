import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { UsersList } from "../../../../app/pages/admin/UsersList";
import { api, routes } from "../../../../app/lib/urls";
import { apiSuccess, mockFetch, renderWithRoute } from "../../../testUtils";

const mockNavigate = vi.fn();

vi.mock("react-router", async () => {
  const actual = await vi.importActual<typeof import("react-router")>("react-router");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe("UsersList", () => {
  beforeEach(() => {
    cleanup();
    vi.restoreAllMocks();
    mockNavigate.mockReset();
    window.localStorage.clear();
  });

  it("renders users from the admin users API", async () => {
    mockFetch([
      {
        match: (url) => url.includes(api.authMe),
        response: () => apiSuccess({ user: { id: 1, name: "Admin", role: "admin" } }),
      },
      {
        match: (url, init) => url.includes(api.users) && (!init?.method || init.method === "GET"),
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
                {
                  id: 2,
                  name: "James User",
                  email: "james@example.com",
                  phone: "5551112222",
                  role: "user",
                },
              ],
            },
          }),
      },
    ]);

    renderWithRoute(<UsersList />, { route: routes.adminUsers, path: "/admin/users" });

    expect(await screen.findByText(/Jane Admin/i)).toBeInTheDocument();
    expect(screen.getByText("jane@example.com")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Impersonate" })).toBeInTheDocument();
    expect(screen.getByText("Unavailable")).toBeInTheDocument();
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

  it("allows an admin to impersonate a non admin user", async () => {
    window.localStorage.setItem("homelet_token", "admin-token");

    mockFetch([
      {
        match: (url) => url.includes(api.authMe),
        response: () => apiSuccess({ user: { id: 1, name: "Admin", role: "admin" } }),
      },
      {
        match: (url, init) => url.includes(api.users) && (!init?.method || init.method === "GET"),
        response: () =>
          apiSuccess({
            users: {
              data: [
                {
                  id: 5,
                  name: "Tenant User",
                  email: "tenant@example.com",
                  phone: "1234567890",
                  role: "user",
                },
              ],
            },
          }),
      },
      {
        match: (url, init) =>
          url.includes(api.userImpersonate(5)) && init?.method === "POST",
        response: () =>
          apiSuccess({
            token: "impersonated-token",
            dashboard: "tenant",
            user: { id: 5, name: "Tenant User", role: "user" },
            impersonation: {
              impersonator: { id: 1, name: "Admin" },
              impersonated_user: { id: 5, name: "Tenant User" },
            },
          }),
      },
    ]);

    renderWithRoute(<UsersList />, { route: routes.adminUsers, path: "/admin/users" });

    await userEvent.click(await screen.findByRole("button", { name: "Impersonate" }));

    expect(window.localStorage.getItem("homelet_token")).toBe("impersonated-token");
    expect(window.localStorage.getItem("homelet_impersonation")).toContain("Tenant User");
    expect(mockNavigate).toHaveBeenCalledWith(routes.tenantRoot);
  });
});
