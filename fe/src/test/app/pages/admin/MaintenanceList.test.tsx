import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { MaintenanceList } from "../../../../app/pages/admin/MaintenanceList";
import { apiSuccess, mockFetch, renderWithRoute } from "../../../testUtils";
import { api, routes } from "../../../../app/lib/urls";

describe("MaintenanceList", () => {
  it("renders maintenance requests", async () => {
    mockFetch([
      {
        match: (url) => url.includes(api.maintenanceRequests),
        response: () =>
          apiSuccess([
            {
              id: 7,
              title: "Leaky faucet",
              status: "pending",
              priority: "high",
              created_at: "2024-01-12",
              tenant: { name: "Jane Doe" },
              apartment: { unit_code: "B2", building: { name: "Skyline" } },
              media: [{ id: 33, url: "https://example.com/leaky-faucet.jpg" }],
            },
          ]),
      },
    ]);

    renderWithRoute(<MaintenanceList />);

    expect(await screen.findByText("Leaky faucet")).toBeInTheDocument();
    expect(screen.getByText("Jane Doe · B2 · Skyline")).toBeInTheDocument();
    expect(screen.getByAltText("Leaky faucet thumbnail")).toHaveAttribute("src", "https://example.com/leaky-faucet.jpg");
    expect(screen.getByRole("link", { name: /Leaky faucet/i })).toHaveAttribute("href", routes.adminMaintenanceRequest(7));
  });
});
