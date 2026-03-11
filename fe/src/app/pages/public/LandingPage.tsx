import { Link } from "react-router";
import { Search, MapPin, Building2, DollarSign, Home } from "lucide-react";
import { useMemo } from "react";
import { Button } from "../../components/Button";
import { Card } from "../../components/Card";
import { StatusBadge } from "../../components/StatusBadge";
import { EmptyState } from "../../components/EmptyState";
import { ImageWithFallback } from "../../components/figma/ImageWithFallback";
import { getAuthToken } from "../../lib/api";
import { env } from "../../lib/env";
import { formatMoney, formatStatusLabel } from "../../lib/format";
import { PaginatedData } from "../../lib/paginatedData";
import { useApiQuery } from "../../hooks/useApiQuery";
import { api, routes } from "../../lib/urls";
import type { PublicApartment, PublicBuildingForSale, UserProfile } from "../../lib/models";

type AuthenticatedUser = UserProfile & {
  role?: string;
};

export function LandingPage() {
  const authToken = useMemo(() => getAuthToken(), []);
  const apartmentsQuery = useApiQuery<PublicApartment[]>(api.publicApartments);
  const buildingsQuery = useApiQuery<PublicBuildingForSale[]>(api.publicBuildingsForSale);
  const userQuery = useApiQuery<{ user: AuthenticatedUser }>(api.authMe, {
    enabled: Boolean(authToken),
  });
  const currentUser = userQuery.data?.user;
  const dashboardRoute = currentUser?.role?.toLowerCase?.() === "tenant" ? routes.tenantRoot : routes.adminRoot;
  const shouldShowPublicAuthActions = !authToken;

  const featuredApartments = useMemo(() => {
    const list = PaginatedData.from<PublicApartment>(apartmentsQuery.data, "apartments").items;

    return list.map((apt) => {
      const beds = apt.beds ?? apt.bedrooms ?? null;
      const baths = apt.baths ?? apt.bathrooms ?? null;
      const sqft = apt.sqft ?? apt.square_feet ?? null;
      const location = [apt.building?.city, apt.building?.state].filter(Boolean).join(", ");
      const monthly = apt.yearly_price ? apt.yearly_price / 12 : null;
      const image = apt.media?.[0]?.url ?? env.placeholderImage;

      return {
        id: apt.id,
        name: apt.building?.name ? `${apt.building.name} - ${apt.unit_code ?? "Unit"}` : apt.unit_code ?? "Apartment",
        building: apt.building?.name ?? "",
        location: location || "Location unavailable",
        price: monthly ? `${formatMoney(monthly)}/mo` : "—",
        beds: beds ?? "—",
        baths: baths ?? "—",
        sqft: sqft ? `${sqft} sq ft` : "—",
        status: formatStatusLabel(apt.status ?? "vacant"),
        image,
      };
    });
  }, [apartmentsQuery.data]);

  const buildingsForSale = useMemo(() => {
    const list = PaginatedData.from<PublicBuildingForSale>(buildingsQuery.data, "buildings").items;

    return list.map((building) => {
      const location = [building.city, building.state].filter(Boolean).join(", ");
      const units = building.units ?? building.apartments_count ?? null;
      const occupancy = building.occupancy_rate;
      const image = building.media?.[0]?.url ?? env.placeholderImage;
      return {
        id: building.id,
        name: building.name,
        location: location || "Location unavailable",
        units: units ?? "—",
        price: building.sale_price ? formatMoney(building.sale_price) : "—",
        occupancy: occupancy ? `${Math.round(occupancy)}%` : "—",
        image,
      };
    });
  }, [buildingsQuery.data]);

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <header className="bg-primary text-primary-foreground">
        <nav className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Home size={28} />
            <span className="text-2xl">{env.appName}</span>
          </div>
          <div className="flex items-center gap-4">
            <Link to={routes.registerBuilding}>
              <Button variant="ghost" className="text-primary-foreground hover:bg-primary-foreground/10">
                Register Building
              </Button>
            </Link>
            {shouldShowPublicAuthActions ? (
              <>
                <Link to={routes.login}>
                  <Button variant="ghost" className="text-primary-foreground hover:bg-primary-foreground/10">
                    Login
                  </Button>
                </Link>
                <Link to={routes.register}>
                  <Button variant="secondary">Get Started</Button>
                </Link>
              </>
            ) : (
              <Link to={dashboardRoute}>
                <Button variant="secondary">
                  {userQuery.loading ? "Loading..." : "Go to Dashboard"}
                </Button>
              </Link>
            )}
          </div>
        </nav>

        <div className="max-w-7xl mx-auto px-4 py-16 lg:py-24">
          <div className="max-w-3xl">
            <h1 className="text-4xl lg:text-6xl mb-6">{env.appTagline}</h1>
            <p className="text-xl lg:text-2xl text-primary-foreground/90 mb-8">
              Browse available apartments across premium locations. Seamless rentals, transparent pricing.
            </p>

            {/* Search Bar */}
            <div className="bg-card rounded-lg p-4 shadow-lg">
              <div className="flex flex-col lg:flex-row gap-4">
                <div className="flex-1 relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
                  <input
                    type="text"
                    placeholder="Enter location..."
                    className="w-full pl-12 pr-4 py-3 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
                  />
                </div>
                <Button size="lg" className="lg:w-auto">
                  <Search size={20} className="mr-2" />
                  Search
                </Button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Available Apartments */}
      <section className="max-w-7xl mx-auto px-4 py-16">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl mb-2">Available Apartments</h2>
            <p className="text-muted-foreground">Browse our latest vacancies</p>
          </div>
        </div>

        {apartmentsQuery.loading ? (
          <Card>
            <p className="text-muted-foreground">Loading apartments...</p>
          </Card>
        ) : featuredApartments.length === 0 ? (
          <EmptyState
            icon={<Home size={32} className="text-muted-foreground" />}
            title="No public listings yet"
            description="Public apartments will appear here once they are available."
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredApartments.map((apt) => (
              <Link key={apt.id} to={routes.apartmentPublic(apt.id)}>
                <Card hover className="h-full">
                  <ImageWithFallback
                    src={apt.image}
                    alt={apt.name}
                    className="w-full h-48 object-cover rounded-lg mb-4"
                  />
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-lg">{apt.name}</h3>
                      <StatusBadge status={apt.status} type="apartment" />
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin size={16} />
                      <span>{apt.location}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>{apt.beds} bed · {apt.baths} bath</span>
                      <span>{apt.sqft}</span>
                    </div>
                    <div className="text-2xl text-primary">{apt.price}</div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Buildings For Sale */}
      <section className="bg-muted py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="mb-8">
            <h2 className="text-3xl mb-2">Buildings For Sale</h2>
            <p className="text-muted-foreground">Investment opportunities for property managers</p>
          </div>

          {buildingsQuery.loading ? (
            <Card>
              <p className="text-muted-foreground">Loading buildings...</p>
            </Card>
          ) : buildingsForSale.length === 0 ? (
            <EmptyState
              icon={<Building2 size={32} className="text-muted-foreground" />}
              title="No listings for sale"
              description="Buildings marked for sale will show up here when available."
            />
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {buildingsForSale.map((building) => (
                <Card key={building.id} hover>
                  <div className="flex flex-col md:flex-row gap-6">
                    <ImageWithFallback
                      src={building.image}
                      alt={building.name}
                      className="w-full md:w-64 h-48 object-cover rounded-lg"
                    />
                    <div className="flex-1 space-y-4">
                      <div>
                        <h3 className="text-xl mb-2">{building.name}</h3>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <MapPin size={16} />
                          <span>{building.location}</span>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground">Units</p>
                          <p className="text-lg">{building.units}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Occupancy</p>
                          <p className="text-lg">{building.occupancy}</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between pt-4 border-t border-border">
                        <div className="flex items-center gap-2">
                          <DollarSign size={20} className="text-primary" />
                          <span className="text-xl text-primary">{building.price}</span>
                        </div>
                        <Button>View Details</Button>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
