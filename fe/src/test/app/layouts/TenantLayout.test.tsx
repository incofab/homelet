import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { TenantLayout } from "../../../app/layouts/TenantLayout";
import { api, routes } from "../../../app/lib/urls";
import { apiSuccess, mockFetch } from "../../testUtils";

describe("TenantLayout", () => {
  beforeEach(() => {
    cleanup();
    vi.restoreAllMocks();
    window.localStorage.clear();
    window.localStorage.setItem("tenanta_token", "tenant-token");
  });

  it("renders tenant routes for users with tenant dashboard access", async () => {
    mockFetch([
      {
        match: (url) => url.includes(api.authMe),
        response: () =>
          apiSuccess({
            user: { id: 7, name: "Tenant", role: "tenant" },
            dashboard_context: {
              primary_dashboard: "tenant",
              is_platform_admin: false,
              is_building_user: false,
              has_active_lease: true,
              available_dashboards: ["tenant"],
            },
          }),
      },
    ]);

    render(
      <MemoryRouter initialEntries={[routes.tenantRoot]}>
        <Routes>
          <Route path={routes.tenantRoot} element={<TenantLayout />}>
            <Route index element={<div>Tenant dashboard page</div>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );

    expect(await screen.findByText("Tenant dashboard page")).toBeInTheDocument();
  });

  it("redirects users without tenant access to their primary dashboard", async () => {
    mockFetch([
      {
        match: (url) => url.includes(api.authMe),
        response: () =>
          apiSuccess({
            user: { id: 1, name: "Admin", role: "admin" },
            dashboard_context: {
              primary_dashboard: "admin",
              is_platform_admin: true,
              is_building_user: false,
              has_active_lease: false,
              available_dashboards: ["admin"],
            },
          }),
      },
    ]);

    render(
      <MemoryRouter initialEntries={[routes.tenantRoot]}>
        <Routes>
          <Route path={routes.tenantRoot} element={<TenantLayout />} />
          <Route path={routes.adminRoot} element={<div>Admin dashboard</div>} />
        </Routes>
      </MemoryRouter>,
    );

    expect(await screen.findByText("Admin dashboard")).toBeInTheDocument();
  });

  it("redirects unauthenticated tenant routes to login", async () => {
    window.localStorage.clear();
    mockFetch([]);

    render(
      <MemoryRouter initialEntries={[routes.tenantPayments]}>
        <Routes>
          <Route path={`${routes.tenantRoot}/*`} element={<TenantLayout />} />
          <Route path={routes.login} element={<div>Login page</div>} />
        </Routes>
      </MemoryRouter>,
    );

    expect(await screen.findByText("Login page")).toBeInTheDocument();
  });
});
