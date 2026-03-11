import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PaymentsList } from "../../../../app/pages/admin/PaymentsList";
import { apiSuccess, mockFetch, renderWithRoute } from "../../../testUtils";
import { api } from "../../../../app/lib/urls";

describe("PaymentsList", () => {
  it("renders payment rows", async () => {
    mockFetch([
      {
        match: (url) => url.includes(api.payments),
        response: () =>
          apiSuccess([
            {
              id: 101,
              amount: 150000,
              status: "paid",
              payment_date: "2024-01-10",
              due_date: "2024-01-05",
              method: "Card",
              tenant: { name: "Jane Doe" },
              apartment: { unit_code: "A2" },
            },
          ]),
      },
    ]);

    renderWithRoute(<PaymentsList />);

    expect(await screen.findByText("Jane Doe")).toBeInTheDocument();
    expect(screen.getByText("A2")).toBeInTheDocument();
    expect(screen.getByText("Card")).toBeInTheDocument();
  });
});
