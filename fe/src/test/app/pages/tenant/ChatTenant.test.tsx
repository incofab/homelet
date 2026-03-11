import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ChatTenant } from "../../../../app/pages/tenant/ChatTenant";
import { apiSuccess, mockFetch, renderWithRoute } from "../../../testUtils";
import { api } from "../../../../app/lib/urls";

describe("ChatTenant", () => {
  it("shows empty message state when no conversations", async () => {
    mockFetch([
      {
        match: (url) => url.includes(api.conversations),
        response: () => apiSuccess([]),
      },
    ]);

    renderWithRoute(<ChatTenant />);

    expect(await screen.findByText("No messages yet")).toBeInTheDocument();
  });
});
