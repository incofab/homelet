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
});
