import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AdminLayout } from "../../../app/layouts/AdminLayout";
import { api, routes } from "../../../app/lib/urls";
import { setAuthToken } from "../../../app/lib/api";
import { apiSuccess, mockFetch, renderWithRoute } from "../../testUtils";

describe("AdminLayout", () => {
  beforeEach(() => {
    cleanup();
    vi.restoreAllMocks();
    window.localStorage.clear();
    window.localStorage.setItem("tenanta_token", "auth-token");
  });

  it("shows the users navigation item for platform admins only", async () => {
    mockFetch([
      {
        match: (url) => url.includes(api.authMe),
        response: () => apiSuccess({ user: { id: 1, name: "Admin", role: "admin" } }),
      },
    ]);

    renderWithRoute(<AdminLayout />, { route: "/admin", path: "/admin" });

    expect(await screen.findByRole("link", { name: "Users" })).toBeInTheDocument();
    expect(screen.getAllByText("Platform Admin").length).toBeGreaterThan(0);
    expect(screen.queryByRole("link", { name: "Tenants" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Expenses" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Payments" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Maintenance" })).not.toBeInTheDocument();
  });

  it("hides the users navigation item for non-admin users", async () => {
    mockFetch([
      {
        match: (url) => url.includes(api.authMe),
        response: () =>
          apiSuccess({
            user: { id: 2, name: "User", role: "user" },
            dashboard_context: {
              primary_dashboard: "home",
              is_platform_admin: false,
              is_building_user: false,
              has_active_lease: false,
              available_dashboards: ["home"],
            },
          }),
      },
    ]);

    render(
      <MemoryRouter initialEntries={[routes.adminRoot]}>
        <Routes>
          <Route path={`${routes.adminRoot}/*`} element={<AdminLayout />} />
          <Route path={routes.homeDashboard} element={<div>Home dashboard</div>} />
        </Routes>
      </MemoryRouter>,
    );

    expect(await screen.findByText("Home dashboard")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Users" })).not.toBeInTheDocument();
  });

  it("redirects unauthenticated admin routes to login with a redirect target", async () => {
    window.localStorage.clear();
    mockFetch([]);

    render(
      <MemoryRouter initialEntries={[routes.adminUsers]}>
        <Routes>
          <Route path={`${routes.adminRoot}/*`} element={<AdminLayout />} />
          <Route path={routes.login} element={<div>Login page</div>} />
        </Routes>
      </MemoryRouter>,
    );

    expect(await screen.findByText("Login page")).toBeInTheDocument();
  });

  it("redirects users without admin dashboard access away from admin routes", async () => {
    mockFetch([
      {
        match: (url) => url.includes(api.authMe),
        response: () =>
          apiSuccess({
            user: { id: 6, name: "Tenant", role: "tenant" },
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
      <MemoryRouter initialEntries={[routes.adminUsers]}>
        <Routes>
          <Route path={`${routes.adminRoot}/*`} element={<AdminLayout />} />
          <Route path={routes.tenantRoot} element={<div>Tenant dashboard</div>} />
        </Routes>
      </MemoryRouter>,
    );

    expect(await screen.findByText("Tenant dashboard")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Users" })).not.toBeInTheDocument();
  });

  it("shows a tenant dashboard switch when the landlord also has an active lease", async () => {
    mockFetch([
      {
        match: (url) => url.includes(api.authMe),
        response: () =>
          apiSuccess({
            user: { id: 3, name: "Hybrid User", role: "user" },
            dashboard_context: {
              primary_dashboard: "admin",
              is_platform_admin: false,
              is_building_user: true,
              has_active_lease: true,
              available_dashboards: ["admin", "tenant"],
            },
          }),
      },
    ]);

    renderWithRoute(<AdminLayout />, { route: "/admin", path: "/admin" });

    expect(await screen.findByRole("link", { name: "Tenant Dashboard" })).toHaveAttribute(
      "href",
      "/tenant"
    );
  });

  it("uses the landlord sidebar theme and shows the role label", async () => {
    mockFetch([
      {
        match: (url) => url.includes(api.authMe),
        response: () => apiSuccess({ user: { id: 4, name: "Landlord", role: "landlord" } }),
      },
    ]);

    renderWithRoute(<AdminLayout />, { route: "/admin", path: "/admin" });

    expect(await screen.findAllByText("Landlord")).not.toHaveLength(0);
    expect(screen.getByRole("link", { name: "Expenses" })).toHaveAttribute("href", "/admin/expenses");
    expect(screen.getByRole("link", { name: "Maintenance" })).toHaveAttribute("href", "/admin/maintenance");
    expect(screen.getByTestId("admin-sidebar").className).toContain("bg-emerald-950");
  });

  it("uses the manager sidebar theme and shows the role label", async () => {
    mockFetch([
      {
        match: (url) => url.includes(api.authMe),
        response: () => apiSuccess({ user: { id: 5, name: "Manager", role: "manager" } }),
      },
    ]);

    renderWithRoute(<AdminLayout />, { route: "/admin", path: "/admin" });

    expect(await screen.findAllByText("Manager")).not.toHaveLength(0);
    expect(screen.getByRole("link", { name: "Expenses" })).toHaveAttribute("href", "/admin/expenses");
    expect(screen.getByRole("link", { name: "Maintenance" })).toHaveAttribute("href", "/admin/maintenance");
    expect(screen.getByTestId("admin-sidebar").className).toContain("bg-sky-950");
  });

  it("refreshes the sidebar role when the active auth token changes", async () => {
    window.localStorage.setItem("tenanta_token", "admin-token");
    mockFetch([
      {
        match: (url, init) =>
          url.includes(api.authMe) &&
          new Headers(init?.headers).get("Authorization") === "Bearer admin-token",
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
      {
        match: (url, init) =>
          url.includes(api.authMe) &&
          new Headers(init?.headers).get("Authorization") === "Bearer landlord-token",
        response: () =>
          apiSuccess({
            user: { id: 4, name: "Landlord", role: "landlord" },
            dashboard_context: {
              primary_dashboard: "admin",
              is_platform_admin: false,
              is_building_user: true,
              has_active_lease: false,
              available_dashboards: ["admin"],
            },
          }),
      },
    ]);

    renderWithRoute(<AdminLayout />, { route: "/admin", path: "/admin" });

    expect(await screen.findAllByText("Platform Admin")).not.toHaveLength(0);

    setAuthToken("landlord-token");

    expect(await screen.findAllByText("Landlord")).not.toHaveLength(0);
    expect(screen.getByTestId("admin-sidebar").className).toContain("bg-emerald-950");
    expect(screen.queryByRole("link", { name: "Users" })).not.toBeInTheDocument();
  });
});
