import { Link } from "react-router";
import { ArrowLeft } from "lucide-react";
import { useState } from "react";
import type { FormEvent } from "react";
import { Button } from "../../components/Button";
import { Card } from "../../components/Card";
import { Input } from "../../components/Input";
import { apiPost } from "../../lib/api";
import { env } from "../../lib/env";
import { api, routes } from "../../lib/urls";
import type { BuildingRegistrationRequestResponse } from "../../lib/responses";

export function RegisterBuildingRequest() {
  const [formState, setFormState] = useState({
    name: "",
    address_line1: "",
    address_line2: "",
    city: "",
    state: "",
    country: env.defaultCountry,
    description: "",
    for_sale: false,
    sale_price: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<{ type: "idle" | "error" | "success"; message?: string }>({
    type: "idle",
  });
  const [submittedRequestId, setSubmittedRequestId] = useState<number | null>(null);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setStatus({ type: "idle" });

    try {
      const payload = {
        name: formState.name,
        address_line1: formState.address_line1,
        address_line2: formState.address_line2 || null,
        city: formState.city,
        state: formState.state,
        country: formState.country,
        description: formState.description || null,
        for_sale: formState.for_sale,
        sale_price: formState.for_sale && formState.sale_price ? Number(formState.sale_price) : null,
      };
      const data = await apiPost<BuildingRegistrationRequestResponse>(
        api.buildingRegistrationRequests,
        payload
      );
      setSubmittedRequestId(data.request.id);
      setStatus({
        type: "success",
        message: "Your building registration request is pending admin approval.",
      });
    } catch (error) {
      setStatus({
        type: "error",
        message: (error as Error).message || "Unable to submit registration request.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center gap-4">
        <Link to={routes.adminBuildings}>
          <Button variant="ghost" size="sm">
            <ArrowLeft size={20} className="mr-2" />
            Back
          </Button>
        </Link>
      </div>

      <div>
        <h1 className="text-3xl mb-2">Register Building</h1>
        <p className="text-muted-foreground">
          Submit your building details for approval before it goes live.
        </p>
      </div>

      <Card>
        {status.type === "success" ? (
          <div className="space-y-4">
            <div className="rounded-lg border border-success/20 bg-success/10 p-4">
              <p className="text-success">{status.message}</p>
              {submittedRequestId ? (
                <p className="text-sm text-muted-foreground mt-2">
                  Reference ID: {submittedRequestId}
                </p>
              ) : null}
            </div>
            <div className="flex items-center gap-3">
              <Link to={routes.adminBuildings}>
                <Button>Return to Buildings</Button>
              </Link>
              <Link to={routes.adminBuildingRequests}>
                <Button variant="secondary">View Requests</Button>
              </Link>
            </div>
          </div>
        ) : (
          <form className="space-y-6" onSubmit={handleSubmit}>
            <Input
              label="Building Name"
              placeholder="e.g., Skyline Tower"
              required
              value={formState.name}
              onChange={(event) => setFormState((prev) => ({ ...prev, name: event.target.value }))}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                label="Street Address"
                placeholder="123 Main Street"
                required
                value={formState.address_line1}
                onChange={(event) =>
                  setFormState((prev) => ({ ...prev, address_line1: event.target.value }))
                }
              />
              <Input
                label="City"
                placeholder="Lagos"
                required
                value={formState.city}
                onChange={(event) => setFormState((prev) => ({ ...prev, city: event.target.value }))}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Input
                label="State"
                placeholder="Lagos"
                required
                value={formState.state}
                onChange={(event) => setFormState((prev) => ({ ...prev, state: event.target.value }))}
              />
              <Input
                label="Country"
                placeholder="NG"
                required
                value={formState.country}
                onChange={(event) =>
                  setFormState((prev) => ({ ...prev, country: event.target.value }))
                }
              />
              <Input
                label="Address Line 2"
                placeholder="Suite 4"
                value={formState.address_line2}
                onChange={(event) =>
                  setFormState((prev) => ({ ...prev, address_line2: event.target.value }))
                }
              />
            </div>

            <div>
              <label className="block text-sm mb-2">Description</label>
              <textarea
                className="w-full px-4 py-2 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                rows={4}
                placeholder="Describe the building and its amenities..."
                value={formState.description}
                onChange={(event) =>
                  setFormState((prev) => ({ ...prev, description: event.target.value }))
                }
              />
            </div>

            <div className="flex items-center gap-3">
              <input
                id="admin-for-sale"
                type="checkbox"
                checked={formState.for_sale}
                onChange={(event) =>
                  setFormState((prev) => ({ ...prev, for_sale: event.target.checked }))
                }
                className="h-4 w-4"
              />
              <label htmlFor="admin-for-sale" className="text-sm">
                This building is for sale
              </label>
            </div>

            {formState.for_sale ? (
              <Input
                label="Sale Price"
                type="number"
                placeholder="120000000"
                required
                value={formState.sale_price}
                onChange={(event) =>
                  setFormState((prev) => ({ ...prev, sale_price: event.target.value }))
                }
              />
            ) : null}

            {status.type === "error" ? (
              <p className="text-sm text-destructive">{status.message}</p>
            ) : null}

            <div className="flex items-center gap-4 pt-4">
              <Button type="submit" disabled={submitting}>
                {submitting ? "Submitting..." : "Submit Request"}
              </Button>
              <Link to={routes.adminBuildings}>
                <Button type="button" variant="ghost">
                  Cancel
                </Button>
              </Link>
            </div>
          </form>
        )}
      </Card>
    </div>
  );
}
