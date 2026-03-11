import { useParams, Link } from "react-router";
import { ArrowLeft, Plus, Search } from "lucide-react";
import { Button } from "../../components/Button";
import { Card } from "../../components/Card";
import { StatusBadge } from "../../components/StatusBadge";
import { EmptyState } from "../../components/EmptyState";
import { useApiQuery } from "../../hooks/useApiQuery";
import { formatMoney, formatStatusLabel } from "../../lib/format";
import { api, routes } from "../../lib/urls";
import { PaginatedData, extractRecord } from "../../lib/paginatedData";
import { useCallback } from "react";
import type { Apartment, Building } from "../../lib/models";

export function ApartmentsList() {
  const { buildingId } = useParams();
  const selectApartments = useCallback(
    (data: unknown) => PaginatedData.from<Apartment>(data, "apartments"),
    []
  );
  const selectBuilding = useCallback(
    (data: unknown) => extractRecord<Building>(data, "building"),
    []
  );
  const apartmentsQuery = useApiQuery<unknown, PaginatedData<Apartment>>(buildingId ? api.buildingApartments(buildingId) : null, {
    enabled: Boolean(buildingId),
    deps: [buildingId],
    select: selectApartments,
  });
  const buildingQuery = useApiQuery<unknown, Building>(buildingId ? api.building(buildingId) : null, {
    enabled: Boolean(buildingId),
    deps: [buildingId],
    select: selectBuilding,
  });

  const apartments = apartmentsQuery.data?.items ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link to={routes.adminBuilding(buildingId ?? "")}>
          <Button variant="ghost" size="sm">
            <ArrowLeft size={20} className="mr-2" />
            Back to Building
          </Button>
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl mb-2">Apartments</h1>
          <p className="text-muted-foreground">{buildingQuery.data?.name ?? "Building"} units</p>
        </div>
        <Link to={routes.adminBuildingApartmentsNew(buildingId ?? "")}>
          <Button>
            <Plus size={20} className="mr-2" />
            Add Apartment
          </Button>
        </Link>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
        <input
          type="text"
          placeholder="Search apartments..."
          className="w-full pl-12 pr-4 py-3 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      <Card>
        {apartmentsQuery.loading ? (
          <p className="text-muted-foreground">Loading apartments...</p>
        ) : apartments.length === 0 ? (
          <EmptyState
            icon={<Plus size={28} className="text-muted-foreground" />}
            title="No apartments yet"
            description="Add apartments to start leasing units."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4">Unit</th>
                  <th className="text-left py-3 px-4">Beds/Baths</th>
                  <th className="text-left py-3 px-4">Sq Ft</th>
                  <th className="text-left py-3 px-4">Rent</th>
                  <th className="text-left py-3 px-4">Tenant</th>
                  <th className="text-left py-3 px-4">Status</th>
                  <th className="text-left py-3 px-4"></th>
                </tr>
              </thead>
              <tbody>
                {apartments.map((apt) => (
                  <tr key={apt.id} className="border-b border-border last:border-0 hover:bg-muted/50">
                    <td className="py-3 px-4">{apt.unit_code ?? "Unit"}</td>
                    <td className="py-3 px-4 text-muted-foreground">
                      {apt.beds ?? apt.bedrooms ?? "—"} / {apt.baths ?? apt.bathrooms ?? "—"}
                    </td>
                    <td className="py-3 px-4 text-muted-foreground">{apt.sqft ?? apt.square_feet ?? "—"}</td>
                    <td className="py-3 px-4">
                      {apt.yearly_price ? `${formatMoney(apt.yearly_price / 12)}/mo` : "—"}
                    </td>
                    <td className="py-3 px-4 text-muted-foreground">{apt.tenant?.name || "—"}</td>
                    <td className="py-3 px-4">
                      <StatusBadge status={formatStatusLabel(apt.status ?? "vacant")} type="apartment" />
                    </td>
                    <td className="py-3 px-4">
                      <Link to={routes.adminApartment(apt.id)}>
                        <Button variant="ghost" size="sm">View</Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
