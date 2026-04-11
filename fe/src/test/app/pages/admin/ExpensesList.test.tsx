import { cleanup, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import { ExpensesList } from "../../../../app/pages/admin/ExpensesList";
import { api, routes } from "../../../../app/lib/urls";
import { apiSuccess, mockFetch, renderWithRoute } from "../../../testUtils";

describe("ExpensesList", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders expenses and can record a new expense", async () => {
    let expensesPayload = [
      {
        id: 1,
        building_id: 2,
        expense_category_id: 4,
        recorded_by: 9,
        title: "Generator service",
        vendor_name: "PowerFix Ltd",
        amount: 120000,
        expense_date: "2026-04-10",
        payment_method: "bank_transfer",
        reference: "EXP-100",
        description: "Quarterly generator servicing",
        recorder: { id: 9, name: "John Manager" },
        category: { id: 4, building_id: 2, name: "Repairs", color: "#2563EB" },
      },
    ];

    const fetchMock = mockFetch([
      {
        match: (url) => url.includes(api.buildings),
        response: () =>
          apiSuccess({
            data: [
              { id: 2, name: "Sunrise Apartments" },
            ],
          }),
      },
      {
        match: (url) => url.includes(`${api.expenses}?building_id=2`),
        response: () => apiSuccess({ data: expensesPayload }),
      },
      {
        match: (url) => url.includes(api.buildingExpenseCategories(2)),
        response: () =>
          apiSuccess({
            categories: [
              { id: 4, building_id: 2, name: "Repairs", color: "#2563EB" },
            ],
          }),
      },
      {
        match: (url, init) => url.includes(api.expenses) && init?.method === "POST",
        response: async () => {
          expensesPayload = [
            {
              id: 2,
              building_id: 2,
              expense_category_id: 4,
              recorded_by: 9,
              title: "Diesel purchase",
              vendor_name: "Fuel Depot",
              amount: 80000,
              expense_date: "2026-04-12",
              payment_method: "cash",
              reference: "EXP-101",
              recorder: { id: 9, name: "John Manager" },
              category: { id: 4, building_id: 2, name: "Repairs", color: "#2563EB" },
            },
            ...expensesPayload,
          ];

          return apiSuccess({ expense: expensesPayload[0] }, 201);
        },
      },
    ]);

    renderWithRoute(<ExpensesList />, {
      route: routes.adminExpenses,
      path: "/admin/expenses",
    });

    expect(await screen.findByText("Generator service")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Record Expense" }));
    await userEvent.selectOptions(screen.getByLabelText("Building"), "2");
    await userEvent.type(screen.getByLabelText("Title"), "Diesel purchase");
    await userEvent.type(screen.getByLabelText("Vendor"), "Fuel Depot");
    await userEvent.type(screen.getByLabelText("Amount"), "80000");
    await userEvent.type(screen.getByLabelText("Reference"), "EXP-101");
    await userEvent.selectOptions(screen.getByLabelText("Payment Method"), "cash");
    await userEvent.click(screen.getByRole("button", { name: "Save Expense" }));

    await waitFor(() => {
      const expenseCalls = fetchMock.mock.calls.filter(([url, init]) =>
        String(url).includes(api.expenses) && init?.method === "POST"
      );

      expect(expenseCalls).toHaveLength(1);
    });
  });

  it("can create expense categories for a building", async () => {
    const fetchMock = mockFetch([
      {
        match: (url) => url.includes(api.buildings),
        response: () =>
          apiSuccess({
            data: [
              { id: 2, name: "Sunrise Apartments" },
            ],
          }),
      },
      {
        match: (url) => url.includes(`${api.expenses}?building_id=2`),
        response: () => apiSuccess({ data: [] }),
      },
      {
        match: (url) => url.includes(api.buildingExpenseCategories(2)),
        response: () =>
          apiSuccess({
            categories: [],
          }),
      },
      {
        match: (url, init) =>
          url.includes(api.buildingExpenseCategories(2)) && init?.method === "POST",
        response: () => apiSuccess({ category: { id: 7, building_id: 2, name: "Utilities" } }, 201),
      },
    ]);

    renderWithRoute(<ExpensesList />, {
      route: routes.adminExpenses,
      path: "/admin/expenses",
    });

    expect(await screen.findAllByRole("heading", { name: "Expenses" })).not.toHaveLength(0);
    await userEvent.click(screen.getByRole("button", { name: "Manage Categories" }));
    await userEvent.selectOptions(screen.getByLabelText("Building"), "2");
    await userEvent.type(screen.getByLabelText("Category Name"), "Utilities");
    await userEvent.click(screen.getByRole("button", { name: "Add Category" }));

    await waitFor(() => {
      const categoryCalls = fetchMock.mock.calls.filter(([url, init]) =>
        String(url).includes(api.buildingExpenseCategories(2)) && init?.method === "POST"
      );

      expect(categoryCalls).toHaveLength(1);
    });
  });
});
