import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ApartmentDetailPublic } from "../../../../app/pages/public/ApartmentDetailPublic";
import { apiSuccess, mockFetch, renderWithRoute } from "../../../testUtils";
import { api, routePaths, routes } from "../../../../app/lib/urls";

const mockApartment = {
  id: 1,
  unit_code: "A1",
  yearly_price: 1200000,
  status: "vacant",
  description: "Bright and airy",
  amenities: ["Gym", "Pool"],
  beds: 2,
  baths: 2,
  sqft: 900,
  building: {
    name: "Sunrise Apartments",
    city: "Lagos",
    state: "Lagos",
    address_line1: "123 Main St",
  },
};

describe("ApartmentDetailPublic", () => {
  it("renders apartment details and submits a rental request", async () => {
    const fetchMock = mockFetch([
      {
        match: (url) => url.includes(api.apartmentMedia(1)),
        response: () =>
          apiSuccess([
            { id: 10, url: "https://example.com/1.jpg" },
            { id: 11, url: "https://example.com/2.jpg" },
          ]),
      },
      {
        match: (url) => url.includes(api.apartmentReviews(1)),
        response: () =>
          apiSuccess([
            {
              id: 8,
              rating: 4,
              comment: "Great place",
              author: "Ada",
              created_at: "2024-01-10",
            },
          ]),
      },
      {
        match: (url) => url.includes(api.apartment(1)),
        response: () => apiSuccess(mockApartment),
      },
      {
        match: (url, init) =>
          url.includes(api.publicRentalRequests) && init?.method === "POST",
        response: () => apiSuccess({ id: 99 }),
      },
    ]);

    renderWithRoute(<ApartmentDetailPublic />, {
      route: routes.apartmentPublic(1),
      path: routePaths.apartmentPublic,
    });

    expect(await screen.findByText("Sunrise Apartments - A1")).toBeInTheDocument();
    expect(screen.getByText("Amenities")).toBeInTheDocument();
    expect(screen.getByText("Tenant Reviews")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Submit Rental Request" }));
    await userEvent.type(screen.getByPlaceholderText("John Doe"), "Jane Doe");
    await userEvent.type(screen.getByPlaceholderText("john@example.com"), "jane@example.com");
    await userEvent.type(screen.getByPlaceholderText("(555) 123-4567"), "555-1234");
    await userEvent.type(screen.getByPlaceholderText("Tell us about yourself..."), "Interested in leasing.");

    await userEvent.click(screen.getByRole("button", { name: "Submit Request" }));

    expect(await screen.findByText("Request submitted successfully.")).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalled();
  });
});
