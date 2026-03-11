import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ChatAdmin } from "../../../../app/pages/admin/ChatAdmin";
import { apiSuccess, mockFetch, renderWithRoute } from "../../../testUtils";
import { api } from "../../../../app/lib/urls";

describe("ChatAdmin", () => {
  it("shows empty state when no conversations", async () => {
    mockFetch([
      {
        match: (url) => url.includes(api.conversations),
        response: () => apiSuccess([]),
      },
    ]);

    renderWithRoute(<ChatAdmin />);

    expect(await screen.findByText("No conversations")).toBeInTheDocument();
  });
});
