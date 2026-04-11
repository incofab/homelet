import { cleanup, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import { TenantMaintenance } from "../../../../app/pages/tenant/TenantMaintenance";
import { apiSuccess, mockFetch, renderWithRoute } from "../../../testUtils";
import { api, routes } from "../../../../app/lib/urls";

describe("TenantMaintenance", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders active requests and history", async () => {
    mockFetch([
      {
        match: (url) => url.includes(api.maintenanceRequests),
        response: () =>
          apiSuccess([
            {
              id: 21,
              title: "Broken AC",
              status: "pending",
              priority: "high",
              created_at: "2024-01-12",
              media: [{ id: 101, url: "https://example.com/broken-ac.jpg" }],
            },
            {
              id: 22,
              title: "Light bulb",
              status: "completed",
              priority: "low",
              created_at: "2024-01-01",
              media: [{ id: 102, url: "https://example.com/light-bulb.jpg" }],
            },
          ]),
      },
      {
        match: (url) => url.includes(api.dashboardTenant),
        response: () => apiSuccess({ active_lease: { apartment_id: 9 } }),
      },
    ]);

    renderWithRoute(<TenantMaintenance />);

    const brokenItems = await screen.findAllByText("Broken AC");
    expect(brokenItems.length).toBeGreaterThan(0);
    expect(screen.getByText("Request History")).toBeInTheDocument();
    expect(screen.getByText("Light bulb")).toBeInTheDocument();
    expect(screen.getAllByAltText("Broken AC thumbnail")[0]).toHaveAttribute("src", "https://example.com/broken-ac.jpg");
    expect(screen.getAllByRole("link", { name: /Broken AC/i })[0]).toHaveAttribute("href", routes.tenantMaintenanceRequest(21));
  });

  it("creates a maintenance request and uploads selected images", async () => {
    const fetchMock = mockFetch([
      {
        match: (url, init) =>
          url.includes(api.maintenanceRequests) &&
          !url.includes("/media") &&
          (init?.method === undefined || init.method === "GET"),
        response: () =>
          apiSuccess([
            {
              id: 21,
              title: "Broken AC",
              status: "pending",
              priority: "high",
              created_at: "2024-01-12",
            },
          ]),
      },
      {
        match: (url) => url.includes(api.dashboardTenant),
        response: () => apiSuccess({ active_lease: { apartment_id: 9 } }),
      },
      {
        match: (url, init) =>
          url.includes(api.maintenanceRequests) &&
          !url.includes("/media") &&
          init?.method === "POST",
        response: () =>
          apiSuccess({
            maintenance_request: {
              id: 77,
              title: "Leaking sink",
              status: "open",
            },
          }, 201),
      },
      {
        match: (url, init) =>
          url.includes(api.maintenanceRequestMedia(77)) &&
          init?.method === "POST",
        response: () =>
          apiSuccess({
            media: {
              id: 101,
              url: "https://example.com/issue.jpg",
            },
          }, 201),
      },
    ]);

    renderWithRoute(<TenantMaintenance />);

    await userEvent.click(await screen.findByRole("button", { name: "New Request" }));
    await userEvent.type(screen.getByPlaceholderText("Brief description of the issue"), "Leaking sink");
    await userEvent.type(
      screen.getByPlaceholderText("Please provide as much detail as possible..."),
      "Water is leaking under the kitchen sink.",
    );
    await userEvent.selectOptions(screen.getByLabelText("Priority Level"), "high");

    const fileInput = screen.getByLabelText("Maintenance request images");
    const file = new File(["image"], "issue.jpg", { type: "image/jpeg" });
    await userEvent.upload(fileInput, file);

    expect(screen.getByText("1 image selected")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Submit Request" }));

    await waitFor(() => {
      const createRequest = fetchMock.mock.calls.find(
        ([url, init]) =>
          String(url).includes(api.maintenanceRequests) &&
          !String(url).includes("/media") &&
          init?.method === "POST",
      );
      const mediaRequest = fetchMock.mock.calls.find(
        ([url, init]) =>
          String(url).includes(api.maintenanceRequestMedia(77)) &&
          init?.method === "POST",
      );

      expect(createRequest).toBeTruthy();
      expect(mediaRequest).toBeTruthy();
      expect(createRequest?.[1]?.body ? JSON.parse(String(createRequest[1].body)) : null).toMatchObject({
        apartment_id: 9,
        title: "Leaking sink",
        priority: "high",
      });
      expect(mediaRequest?.[1]?.body).toBeInstanceOf(FormData);
      expect((mediaRequest?.[1]?.body as FormData).get("file")).toBe(file);
      expect((mediaRequest?.[1]?.body as FormData).get("collection")).toBe("images");
    });

    expect(await screen.findByText("Maintenance request submitted.")).toBeInTheDocument();
  });
});
