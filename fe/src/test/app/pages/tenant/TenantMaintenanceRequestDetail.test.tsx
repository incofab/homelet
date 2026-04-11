import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { TenantMaintenanceRequestDetail } from "../../../../app/pages/tenant/TenantMaintenanceRequestDetail";
import { apiSuccess, mockFetch, renderWithRoute } from "../../../testUtils";
import { api, routePaths, routes } from "../../../../app/lib/urls";

describe("TenantMaintenanceRequestDetail", () => {
  it("renders the tenant maintenance request detail", async () => {
    mockFetch([
      {
        match: (url) => url.includes(api.maintenanceRequest(21)),
        response: () =>
          apiSuccess({
            maintenance_request: {
              id: 21,
              title: "Broken AC",
              description: "The AC is not cooling.",
              status: "in_progress",
              priority: "medium",
              created_at: "2024-01-12",
              tenant: { name: "Jane Doe" },
              apartment: { unit_code: "A1", building: { name: "Harbor Point" } },
              media: [],
            },
          }),
      },
    ]);

    renderWithRoute(<TenantMaintenanceRequestDetail />, {
      route: routes.tenantMaintenanceRequest(21),
      path: `${routes.tenantRoot}/${routePaths.tenantMaintenanceRequest}`,
    });

    expect(await screen.findByText("Broken AC")).toBeInTheDocument();
    expect(screen.getByText("The AC is not cooling.")).toBeInTheDocument();
    expect(screen.getByText("A1 · Harbor Point")).toBeInTheDocument();
    expect(screen.getByText("No images uploaded.")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Mark Open" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Start Progress" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Mark Resolved" })).not.toBeInTheDocument();
  });
});
