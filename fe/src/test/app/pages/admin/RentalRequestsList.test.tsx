import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { RentalRequestsList } from "../../../../app/pages/admin/RentalRequestsList";
import { apiSuccess, mockFetch, renderWithRoute } from "../../../testUtils";
import { api } from "../../../../app/lib/urls";

describe("RentalRequestsList", () => {
  it("shows rental request cards", async () => {
    mockFetch([
      {
        match: (url) => url.includes(api.rentalRequests),
        response: () =>
          apiSuccess([
            {
              id: 44,
              name: "Sam Lee",
              email: "sam@example.com",
              phone: "555-0100",
              status: "new",
              message: "Interested in viewing",
              created_at: "2024-01-14",
              apartment: { unit_code: "C3", building: { name: "Riverside" } },
            },
          ]),
      },
    ]);

    renderWithRoute(<RentalRequestsList />);

    expect(await screen.findByText("Sam Lee")).toBeInTheDocument();
    expect(screen.getByText("Interested in viewing")).toBeInTheDocument();
    expect(screen.getByText("C3 · Riverside")).toBeInTheDocument();
  });
});
