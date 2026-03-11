import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { BuildingDetail } from "../../../../app/pages/admin/BuildingDetail";
import { apiSuccess, mockFetch, renderWithRoute } from "../../../testUtils";
import { api, routePaths, routes } from "../../../../app/lib/urls";

const buildingPayload = {
  id: 1,
  name: "Skyline Tower",
  city: "Lagos",
  state: "Lagos",
  description: "High-rise building",
  units: 10,
  occupied_count: 7,
  managers: [],
};

describe("BuildingDetail", () => {
  it("renders building details with empty sections", async () => {
    mockFetch([
      {
        match: (url) => url.includes(api.buildingApartments(1)),
        response: () => apiSuccess([]),
      },
      {
        match: (url) => url.includes(api.building(1)),
        response: () => apiSuccess(buildingPayload),
      },
    ]);

    renderWithRoute(<BuildingDetail />, {
      route: routes.adminBuilding(1),
      path: `${routes.adminRoot}/${routePaths.adminBuilding}`,
    });

    expect(await screen.findByText("Skyline Tower")).toBeInTheDocument();
    expect(screen.getByText("No apartments yet")).toBeInTheDocument();
    expect(screen.getByText("No managers assigned.")).toBeInTheDocument();
  });
});
