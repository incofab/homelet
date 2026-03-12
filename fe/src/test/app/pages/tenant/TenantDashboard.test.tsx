import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { TenantDashboard } from "../../../../app/pages/tenant/TenantDashboard";
import { apiSuccess, mockFetch, renderWithRoute } from "../../../testUtils";
import { api } from "../../../../app/lib/urls";

describe("TenantDashboard", () => {
  it("renders tenant overview data", async () => {
    mockFetch([
      {
        match: (url) => url.includes(api.dashboardTenant),
        response: () =>
          apiSuccess({
            active_lease: {
              id: 1,
              status: "active",
              rent_amount: 1200000,
              start_date: "2024-01-01",
              end_date: "2024-12-31",
              apartment: { unit_code: "Unit 4B", building: { name: "Harbor Point" } },
            },
            days_to_expiry: 200,
            last_payment: { id: 10, status: "paid", payment_date: "2024-01-05", amount: 200000 },
          }),
      },
      {
        match: (url) => url.includes(api.tenantPayments),
        response: () =>
          apiSuccess({
            payments: {
              data: [
                { id: 10, amount: 200000, status: "paid", payment_date: "2024-01-05" },
              ],
            },
          }),
      },
      {
        match: (url) => url.includes(api.authMe),
        response: () => apiSuccess({ id: 2, name: "Alex Smith" }),
      },
    ]);

    renderWithRoute(<TenantDashboard />);

    expect(await screen.findByText("Welcome Back, Alex!")).toBeInTheDocument();
    expect(screen.getByText("Unit 4B")).toBeInTheDocument();
    expect(screen.getByText("₦12,000.00")).toBeInTheDocument();
    expect(screen.getByText("Recent Payments")).toBeInTheDocument();
    expect(screen.getByText("Payment #10")).toBeInTheDocument();
  });
});
