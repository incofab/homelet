import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { TenantMaintenance } from "../../../../app/pages/tenant/TenantMaintenance";
import { apiSuccess, mockFetch, renderWithRoute } from "../../../testUtils";
import { api } from "../../../../app/lib/urls";

describe("TenantMaintenance", () => {
  it("renders active requests and history", async () => {
    mockFetch([
      {
        match: (url) => url.includes(api.maintenanceRequests),
        response: () =>
          apiSuccess([
            {
              id: 21,
              title: "Broken AC",
              status: "pending",
              priority: "high",
              created_at: "2024-01-12",
            },
            {
              id: 22,
              title: "Light bulb",
              status: "completed",
              priority: "low",
              created_at: "2024-01-01",
            },
          ]),
      },
      {
        match: (url) => url.includes(api.dashboardTenant),
        response: () => apiSuccess({ active_lease: { apartment_id: 9 } }),
      },
    ]);

    renderWithRoute(<TenantMaintenance />);

    const brokenItems = await screen.findAllByText("Broken AC");
    expect(brokenItems.length).toBeGreaterThan(0);
    expect(screen.getByText("Request History")).toBeInTheDocument();
    expect(screen.getByText("Light bulb")).toBeInTheDocument();
  });
});
