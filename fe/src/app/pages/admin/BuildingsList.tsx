import { Link } from "react-router";
import { useCallback } from "react";
import { Plus, Search, MapPin, Home } from "lucide-react";
import { Button } from "../../components/Button";
import { Card } from "../../components/Card";
import { ImageWithFallback } from "../../components/figma/ImageWithFallback";
import { EmptyState } from "../../components/EmptyState";
import { useApiQuery } from "../../hooks/useApiQuery";
import { env } from "../../lib/env";
import { PaginatedData } from "../../lib/paginatedData";
import { api, routes } from "../../lib/urls";
import type { Building } from "../../lib/models";

export function BuildingsList() {
  const selectBuildings = useCallback(
    (data: unknown) => PaginatedData.from<Building>(data, "buildings"),
    []
  );
  const buildingsQuery = useApiQuery<unknown, PaginatedData<Building>>(api.buildings, {
    select: selectBuildings,
  });
  const buildings = buildingsQuery.data?.items ?? [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl mb-2">Buildings</h1>
          <p className="text-muted-foreground">Manage your property portfolio</p>
        </div>
        <Link to={routes.adminBuildingRequestNew}>
          <Button>
            <Plus size={20} className="mr-2" />
            Register Building
          </Button>
        </Link>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
        <input
          type="text"
          placeholder="Search buildings..."
          className="w-full pl-12 pr-4 py-3 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      {/* Buildings Grid */}
      {buildingsQuery.loading ? (
        <Card>
          <p className="text-muted-foreground">Loading buildings...</p>
        </Card>
      ) : buildings.length === 0 ? (
        <EmptyState
          icon={<Home size={32} className="text-muted-foreground" />}
          title="No buildings yet"
          description="Submit a registration request to add your first building."
          action={
            <Link to={routes.adminBuildingRequestNew}>
              <Button>Register Building</Button>
            </Link>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {buildings.map((building) => {
            const units = building.units ?? building.apartments_count ?? 0;
            const occupied = building.occupied_count ?? 0;
            const occupancyRate = units > 0 ? Math.round((occupied / units) * 100) : null;
            const location = [building.city, building.state].filter(Boolean).join(", ") || "Location unavailable";
            const image = building.media?.[0]?.url ?? env.placeholderImage;

            return (
              <Link key={building.id} to={routes.adminBuilding(building.id)}>
                <Card hover className="h-full">
                  <ImageWithFallback
                    src={image}
                    alt={building.name}
                    className="w-full h-48 object-cover rounded-lg mb-4"
                  />
                  <div className="space-y-3">
                    <h3 className="text-xl">{building.name}</h3>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin size={16} />
                      <span>{location}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-4 pt-3 border-t border-border">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Units</p>
                        <div className="flex items-center gap-1">
                          <Home size={16} className="text-primary" />
                          <span>{units || "—"}</span>
                        </div>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Occupancy</p>
                        <span className={
                          occupancyRate === null
                            ? "text-muted-foreground"
                            : occupancyRate >= 90
                              ? "text-success"
                              : occupancyRate >= 75
                                ? "text-warning"
                                : "text-destructive"
                        }>
                          {occupancyRate === null ? "—" : `${occupancyRate}%`}
                        </span>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Managers</p>
                        <span>{building.managers_count ?? "—"}</span>
                      </div>
                    </div>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
