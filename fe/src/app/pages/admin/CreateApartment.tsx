import { Link, useNavigate, useParams } from "react-router";
import { ArrowLeft } from "lucide-react";
import { useState } from "react";
import type { FormEvent } from "react";
import { Button } from "../../components/Button";
import { Card } from "../../components/Card";
import { Input } from "../../components/Input";
import { apiPost } from "../../lib/api";
import { api, routes } from "../../lib/urls";
import type { CreateApartmentResponse } from "../../lib/responses";

export function CreateApartment() {
  const { buildingId } = useParams();
  const navigate = useNavigate();
  const [formState, setFormState] = useState({
    unit: "",
    bedrooms: "",
    bathrooms: "",
    sqft: "",
    monthlyRent: "",
    description: "",
    amenities: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<{ type: "idle" | "error"; message?: string }>({ type: "idle" });

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!buildingId) return;
    setSubmitting(true);
    setStatus({ type: "idle" });

    try {
      const monthly = Number(formState.monthlyRent || 0);
      const yearly_price = Number.isNaN(monthly) ? 0 : monthly * 12;
      const amenities = formState.amenities
        .split("\n")
        .map((item) => item.trim())
        .filter(Boolean);

      const data = await apiPost<CreateApartmentResponse>(api.buildingApartments(buildingId), {
        unit_code: formState.unit,
        type: "custom",
        yearly_price,
        description: formState.description,
        floor: "",
        status: "vacant",
        is_public: false,
        amenities,
      });

      navigate(routes.adminApartment(data.apartment.id));
    } catch (error) {
      setStatus({ type: "error", message: (error as Error).message || "Unable to create apartment." });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center gap-4">
        <Link to={routes.adminBuildingApartments(buildingId ?? "")}>
          <Button variant="ghost" size="sm">
            <ArrowLeft size={20} className="mr-2" />
            Back
          </Button>
        </Link>
      </div>

      <div>
        <h1 className="text-3xl mb-2">Add New Apartment</h1>
        <p className="text-muted-foreground">Create a new unit in this building</p>
      </div>

      <Card>
        <form className="space-y-6" onSubmit={handleSubmit}>
          <Input
            label="Unit Number"
            placeholder="e.g., Unit 302"
            required
            value={formState.unit}
            onChange={(event) => setFormState((prev) => ({ ...prev, unit: event.target.value }))}
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Input
              label="Bedrooms"
              type="number"
              placeholder="2"
              required
              value={formState.bedrooms}
              onChange={(event) => setFormState((prev) => ({ ...prev, bedrooms: event.target.value }))}
            />
            <Input
              label="Bathrooms"
              type="number"
              placeholder="2"
              required
              value={formState.bathrooms}
              onChange={(event) => setFormState((prev) => ({ ...prev, bathrooms: event.target.value }))}
            />
            <Input
              label="Square Feet"
              type="number"
              placeholder="1200"
              required
              value={formState.sqft}
              onChange={(event) => setFormState((prev) => ({ ...prev, sqft: event.target.value }))}
            />
          </div>

          <Input
            label="Monthly Rent"
            type="number"
            placeholder="2500"
            required
            value={formState.monthlyRent}
            onChange={(event) => setFormState((prev) => ({ ...prev, monthlyRent: event.target.value }))}
          />

          <div>
            <label className="block text-sm mb-2">Description</label>
            <textarea
              className="w-full px-4 py-2 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              rows={4}
              placeholder="Describe the apartment features..."
              value={formState.description}
              onChange={(event) => setFormState((prev) => ({ ...prev, description: event.target.value }))}
            />
          </div>

          <div>
            <label className="block text-sm mb-2">Amenities (one per line)</label>
            <textarea
              className="w-full px-4 py-2 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              rows={6}
              placeholder="Hardwood Floors\nStainless Steel Appliances\nIn-Unit Washer/Dryer"
              value={formState.amenities}
              onChange={(event) => setFormState((prev) => ({ ...prev, amenities: event.target.value }))}
            />
          </div>

          <div>
            <label className="block text-sm mb-2">Apartment Images</label>
            <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary transition-colors cursor-pointer">
              <p className="text-muted-foreground">Click to upload or drag and drop</p>
              <p className="text-sm text-muted-foreground mt-1">Multiple images allowed, PNG/JPG up to 10MB each</p>
            </div>
          </div>

          {status.type === "error" && <p className="text-sm text-destructive">{status.message}</p>}

          <div className="flex items-center gap-4 pt-4">
            <Button type="submit" disabled={submitting}>Create Apartment</Button>
            <Link to={routes.adminBuildingApartments(buildingId ?? "")}>
              <Button type="button" variant="ghost">Cancel</Button>
            </Link>
          </div>
        </form>
      </Card>
    </div>
  );
}
