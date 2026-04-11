import { cleanup, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import { PaymentsList } from "../../../../app/pages/admin/PaymentsList";
import { apiSuccess, mockFetch, renderWithRoute } from "../../../testUtils";
import { api } from "../../../../app/lib/urls";

describe("PaymentsList", () => {
  afterEach(() => {
    cleanup();
  });

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

  it("loads tenants once when the record payment dialog opens", async () => {
    const fetchMock = mockFetch([
      {
        match: (url) => url.includes(api.payments),
        response: () => apiSuccess([]),
      },
      {
        match: (url) => url.includes(api.tenants),
        response: () =>
          apiSuccess({
            tenants: {
              data: [
                {
                  id: 41,
                  name: "Jane Doe",
                  email: "jane@example.com",
                  active_lease: { id: 77, status: "active" },
                },
              ],
            },
          }),
      },
    ]);

    renderWithRoute(<PaymentsList />);

    await userEvent.click(screen.getAllByRole("button", { name: "Record Payment" })[0]);

    expect(await screen.findByRole("option", { name: "Jane Doe (jane@example.com)" })).toBeInTheDocument();

    await waitFor(() => {
      const tenantCalls = fetchMock.mock.calls.filter(([url]) =>
        String(url).includes(api.tenants)
      );

      expect(tenantCalls).toHaveLength(1);
    });
  });
});
