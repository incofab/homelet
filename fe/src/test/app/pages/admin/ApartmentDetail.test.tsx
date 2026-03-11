import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ApartmentDetail } from "../../../../app/pages/admin/ApartmentDetail";
import { apiSuccess, mockFetch, renderWithRoute } from "../../../testUtils";
import { api, routePaths, routes } from "../../../../app/lib/urls";

const apartmentPayload = {
  id: 1,
  unit_code: "A1",
  building: { id: 10, name: "Harbor Point" },
  beds: 2,
  baths: 2,
  sqft: 950,
  yearly_price: 1200000,
  status: "vacant",
  description: "Bright unit",
  amenities: [],
};

describe("ApartmentDetail", () => {
  it("renders apartment details and vacant state", async () => {
    mockFetch([
      {
        match: (url) => url.includes(api.apartmentMedia(1)),
        response: () => apiSuccess([]),
      },
      {
        match: (url) => url.includes(api.apartment(1)),
        response: () => apiSuccess(apartmentPayload),
      },
    ]);

    renderWithRoute(<ApartmentDetail />, {
      route: routes.adminApartment(1),
      path: `${routes.adminRoot}/${routePaths.adminApartment}`,
    });

    expect(await screen.findByText("A1")).toBeInTheDocument();
    expect(screen.getByText("Harbor Point")).toBeInTheDocument();
    expect(screen.getByText("No amenities listed.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Assign Tenant" })).toBeInTheDocument();
  });
});
