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
        created_at: "2026-04-10T10:00:00.000000Z",
        recorder: { id: 9, name: "John Manager" },
        category: { id: 4, building_id: 2, name: "Repairs", color: "#2563EB" },
        permissions: {
          can_update: true,
          can_delete: true,
          update_denial_reason: null,
          delete_denial_reason: null,
        },
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
              created_at: "2026-04-12T10:30:00.000000Z",
              recorder: { id: 9, name: "John Manager" },
              category: { id: 4, building_id: 2, name: "Repairs", color: "#2563EB" },
              permissions: {
                can_update: true,
                can_delete: true,
                update_denial_reason: null,
                delete_denial_reason: null,
              },
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
    expect(screen.getByLabelText("Building")).toHaveValue("2");
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

    const [, requestInit] = fetchMock.mock.calls.find(
      ([url, init]) => String(url).includes(api.expenses) && init?.method === "POST"
    ) ?? [null, null];

    expect(requestInit?.body).toContain("\"building_id\":2");
  });

  it("can edit and delete expenses when the API allows those actions", async () => {
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
        created_at: "2026-04-10T10:00:00.000000Z",
        recorder: { id: 9, name: "John Manager" },
        category: { id: 4, building_id: 2, name: "Repairs", color: "#2563EB" },
        permissions: {
          can_update: true,
          can_delete: true,
          update_denial_reason: null,
          delete_denial_reason: null,
        },
      },
    ];

    const fetchMock = mockFetch([
      {
        match: (url) => url.includes(api.buildings),
        response: () => apiSuccess({ data: [{ id: 2, name: "Sunrise Apartments" }] }),
      },
      {
        match: (url) => url.includes(`${api.expenses}?building_id=2`),
        response: () => apiSuccess({ data: expensesPayload }),
      },
      {
        match: (url) => url.includes(api.buildingExpenseCategories(2)),
        response: () =>
          apiSuccess({
            categories: [{ id: 4, building_id: 2, name: "Repairs", color: "#2563EB" }],
          }),
      },
      {
        match: (url, init) => url.includes(api.expense(1)) && init?.method === "PUT",
        response: async () => {
          expensesPayload = [
            {
              ...expensesPayload[0],
              title: "Generator overhaul",
            },
          ];

          return apiSuccess({ expense: expensesPayload[0] });
        },
      },
      {
        match: (url, init) => url.includes(api.expense(1)) && init?.method === "DELETE",
        response: async () => {
          expensesPayload = [];
          return apiSuccess({});
        },
      },
    ]);

    renderWithRoute(<ExpensesList />, {
      route: routes.adminExpenses,
      path: "/admin/expenses",
    });

    expect(await screen.findByText("Generator service")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Edit" }));
    const titleInput = screen.getByLabelText("Title");
    await userEvent.clear(titleInput);
    await userEvent.type(titleInput, "Generator overhaul");
    await userEvent.click(screen.getByRole("button", { name: "Save Changes" }));

    await waitFor(() => {
      expect(
        fetchMock.mock.calls.some(
          ([url, init]) => String(url).includes(api.expense(1)) && init?.method === "PUT"
        )
      ).toBe(true);
    });

    const confirmMock = globalThis.confirm;
    globalThis.confirm = () => true;

    try {
      await userEvent.click(await screen.findByRole("button", { name: "Delete" }));

      await waitFor(() => {
        expect(
          fetchMock.mock.calls.some(
            ([url, init]) => String(url).includes(api.expense(1)) && init?.method === "DELETE"
          )
        ).toBe(true);
      });
    } finally {
      globalThis.confirm = confirmMock;
    }
  });

  it("normalizes ISO expense dates in the edit form", async () => {
    mockFetch([
      {
        match: (url) => url.includes(api.buildings),
        response: () => apiSuccess({ data: [{ id: 2, name: "Sunrise Apartments" }] }),
      },
      {
        match: (url) => url.includes(`${api.expenses}?building_id=2`),
        response: () =>
          apiSuccess({
            data: [
              {
                id: 1,
                building_id: 2,
                expense_category_id: 4,
                recorded_by: 9,
                title: "Generator service",
                vendor_name: "PowerFix Ltd",
                amount: 120000,
                expense_date: "2026-04-10T00:00:00.000000Z",
                payment_method: "bank_transfer",
                created_at: "2026-04-10T10:00:00.000000Z",
                recorder: { id: 9, name: "John Manager" },
                category: { id: 4, building_id: 2, name: "Repairs", color: "#2563EB" },
                permissions: {
                  can_update: true,
                  can_delete: true,
                  update_denial_reason: null,
                  delete_denial_reason: null,
                },
              },
            ],
          }),
      },
      {
        match: (url) => url.includes(api.buildingExpenseCategories(2)),
        response: () =>
          apiSuccess({
            categories: [{ id: 4, building_id: 2, name: "Repairs", color: "#2563EB" }],
          }),
      },
    ]);

    renderWithRoute(<ExpensesList />, {
      route: routes.adminExpenses,
      path: "/admin/expenses",
    });

    expect(await screen.findByText("Generator service")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Edit" }));

    expect(screen.getByLabelText("Expense Date")).toHaveValue("2026-04-10");
  });

  it("hides action controls when an expense cannot be changed", async () => {
    mockFetch([
      {
        match: (url) => url.includes(api.buildings),
        response: () => apiSuccess({ data: [{ id: 2, name: "Sunrise Apartments" }] }),
      },
      {
        match: (url) => url.includes(`${api.expenses}?building_id=2`),
        response: () =>
          apiSuccess({
            data: [
              {
                id: 1,
                building_id: 2,
                recorded_by: 9,
                title: "Generator service",
                amount: 120000,
                expense_date: "2026-04-10",
                created_at: "2026-04-10T10:00:00.000000Z",
                recorder: { id: 9, name: "John Manager" },
                permissions: {
                  can_update: false,
                  can_delete: false,
                  update_denial_reason:
                    "An expense can only be edited while it remains the latest recorded expense for the building.",
                  delete_denial_reason:
                    "An expense can only be deleted while it remains the latest recorded expense for the building.",
                },
              },
            ],
          }),
      },
    ]);

    renderWithRoute(<ExpensesList />, {
      route: routes.adminExpenses,
      path: "/admin/expenses",
    });

    expect(await screen.findByText("Generator service")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Edit" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Delete" })).not.toBeInTheDocument();
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
    expect(screen.getByLabelText("Building")).toHaveValue("2");
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
