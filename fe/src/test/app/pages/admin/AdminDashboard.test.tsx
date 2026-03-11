import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AdminDashboard } from "../../../../app/pages/admin/AdminDashboard";
import { apiSuccess, mockFetch, renderWithRoute } from "../../../testUtils";
import { api } from "../../../../app/lib/urls";

const dashboardPayload = {
  counts: {
    buildings: 3,
    apartments: 24,
    vacant: 5,
    occupied: 19,
  },
  expiring_leases_next_90_days: 0,
  total_income_paid: 1200000,
  pending_payments: 0,
};

describe("AdminDashboard", () => {
  it("renders dashboard metrics and empty states", async () => {
    mockFetch([
      {
        match: (url) => url.includes(api.dashboardAdmin),
        response: () => apiSuccess(dashboardPayload),
      },
      {
        match: (url) => url.includes(api.payments),
        response: () => apiSuccess([]),
      },
    ]);

    renderWithRoute(<AdminDashboard />);

    expect(await screen.findByText("Dashboard")).toBeInTheDocument();
    expect(screen.getByText("No payment data yet")).toBeInTheDocument();
    expect(screen.getByText("No expiring leases")).toBeInTheDocument();
    expect(screen.getByText("No pending payments")).toBeInTheDocument();
  });
});
