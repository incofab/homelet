import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { HomeDashboard } from "../../../../app/pages/user/HomeDashboard";
import { apiSuccess, mockFetch, renderWithRoute } from "../../../testUtils";
import { api, routes } from "../../../../app/lib/urls";

describe("HomeDashboard", () => {
  it("renders account shortcuts and platform calls to action", async () => {
    window.localStorage.setItem("homelet_token", "home-token");

    mockFetch([
      {
        match: (url) => url.includes(api.authMe),
        response: () =>
          apiSuccess({
            user: { id: 4, name: "New User" },
            dashboard: "home",
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

    renderWithRoute(<HomeDashboard />, {
      route: routes.homeDashboard,
      path: routes.homeDashboard,
    });

    expect(await screen.findByText("Hello, New")).toBeInTheDocument();
    expect(screen.getByText("Account Shortcuts")).toBeInTheDocument();
    expect(screen.getByText("Profile")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /register a building/i })).toHaveAttribute(
      "href",
      routes.registerBuilding
    );
    expect(screen.getByRole("link", { name: /find an apartment/i })).toHaveAttribute(
      "href",
      routes.root
    );
  });
});
