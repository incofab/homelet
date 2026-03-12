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
});
