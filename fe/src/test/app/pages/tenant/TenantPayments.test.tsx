import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { TenantPayments } from "../../../../app/pages/tenant/TenantPayments";
import { apiSuccess, mockFetch, renderWithRoute } from "../../../testUtils";
import { api } from "../../../../app/lib/urls";

describe("TenantPayments", () => {
  it("renders payment history", async () => {
    mockFetch([
      {
        match: (url) => url.includes(api.tenantPayments),
        response: () =>
          apiSuccess([
            {
              id: 11,
              amount: 150000,
              status: "paid",
              payment_date: "2024-01-10",
              method: "Card",
            },
          ]),
      },
      {
        match: (url) => url.includes(api.dashboardTenant),
        response: () => apiSuccess({ last_payment: { amount: 150000, payment_date: "2024-01-10" } }),
      },
    ]);

    renderWithRoute(<TenantPayments />);

    expect(await screen.findByText("Payment History")).toBeInTheDocument();
    expect(screen.getByText("#11")).toBeInTheDocument();
    expect(screen.getByText("Card")).toBeInTheDocument();
  });
});
