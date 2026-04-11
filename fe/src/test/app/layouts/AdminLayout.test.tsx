import { cleanup, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AdminLayout } from "../../../app/layouts/AdminLayout";
import { api } from "../../../app/lib/urls";
import { apiSuccess, mockFetch, renderWithRoute } from "../../testUtils";

describe("AdminLayout", () => {
  beforeEach(() => {
    cleanup();
    vi.restoreAllMocks();
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
        response: () => apiSuccess({ user: { id: 2, name: "User", role: "user" } }),
      },
    ]);

    renderWithRoute(<AdminLayout />, { route: "/admin", path: "/admin" });

    await waitFor(() => {
      expect(screen.queryByRole("link", { name: "Users" })).not.toBeInTheDocument();
    });
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
});
