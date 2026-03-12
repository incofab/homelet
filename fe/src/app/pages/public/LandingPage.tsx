import { Link } from 'react-router';
import { Search, MapPin, Building2, DollarSign, Home } from 'lucide-react';
import { useMemo } from 'react';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { EmptyState } from '../../components/EmptyState';
import { ImageWithFallback } from '../../components/figma/ImageWithFallback';
import { getAuthToken } from '../../lib/api';
import { env } from '../../lib/env';
import { formatMoney } from '../../lib/format';
import { PaginatedData } from '../../lib/paginatedData';
import { useApiQuery } from '../../hooks/useApiQuery';
import { api, routes } from '../../lib/urls';
import type { PublicBuilding, UserProfile } from '../../lib/models';

type AuthenticatedUser = UserProfile & {
  role?: string;
};

export function LandingPage() {
  const authToken = useMemo(() => getAuthToken(), []);
  const buildingsQuery = useApiQuery<PublicBuilding[]>(api.publicBuildings);
  const userQuery = useApiQuery<{ user: AuthenticatedUser }>(api.authMe, {
    enabled: Boolean(authToken),
  });
  const currentUser = userQuery.data?.user;
  const dashboardRoute =
    currentUser?.role?.toLowerCase?.() === 'tenant'
      ? routes.tenantRoot
      : routes.adminRoot;
  const shouldShowPublicAuthActions = !authToken;

  const publicBuildings = useMemo(() => {
    const list = PaginatedData.from<PublicBuilding>(
      buildingsQuery.data,
      'buildings',
    ).items;

    return list.map((building) => {
      const location = [building.address_line1, building.city, building.state]
        .filter(Boolean)
        .join(', ');
      const image = building.media?.[0]?.url ?? env.placeholderImage;
      return {
        id: building.id,
        name: building.name,
        location: location || 'Location unavailable',
        contactEmail: building.contact_email ?? 'Not provided',
        contactPhone: building.contact_phone ?? 'Not provided',
        publicApartments:
          building.public_apartments_count ?? building.apartments?.length ?? 0,
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
              <Button
                variant="ghost"
                className="text-primary-foreground hover:bg-primary-foreground/10"
              >
                Register Building
              </Button>
            </Link>
            {shouldShowPublicAuthActions ? (
              <>
                <Link to={routes.login}>
                  <Button
                    variant="ghost"
                    className="text-primary-foreground hover:bg-primary-foreground/10"
                  >
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
                  {userQuery.loading ? 'Loading...' : 'Go to Dashboard'}
                </Button>
              </Link>
            )}
          </div>
        </nav>

        <div className="max-w-7xl mx-auto px-4 py-16 lg:py-24">
          <div className="max-w-3xl">
            <h1 className="text-4xl lg:text-6xl mb-6">{env.appTagline}</h1>
            <p className="text-xl lg:text-2xl text-primary-foreground/90 mb-8">
              Browse available apartments across premium locations. Seamless
              rentals, transparent pricing.
            </p>

            {/* Search Bar */}
            <div className="bg-card rounded-lg p-4 shadow-lg">
              <div className="flex flex-col lg:flex-row gap-4">
                <div className="flex-1 relative">
                  <MapPin
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                    size={20}
                  />
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

      {/* Public Buildings */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="mb-8">
            <h2 className="text-3xl mb-2">Buildings</h2>
            <p className="text-muted-foreground">
              Browse buildings and contact property teams directly
            </p>
          </div>

          {buildingsQuery.loading ? (
            <Card>
              <p className="text-muted-foreground">Loading buildings...</p>
            </Card>
          ) : publicBuildings.length === 0 ? (
            <EmptyState
              icon={<Building2 size={32} className="text-muted-foreground" />}
              title="No public buildings yet"
              description="Buildings with public apartment listings will show up here when available."
            />
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {publicBuildings.map((building) => (
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
                          <p className="text-sm text-muted-foreground">
                            Contact Email
                          </p>
                          <p className="text-lg break-all">
                            {building.contactEmail}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">
                            Contact Phone
                          </p>
                          <p className="text-lg">{building.contactPhone}</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between pt-4 border-t border-border">
                        <div className="flex items-center gap-2">
                          <DollarSign size={20} className="text-primary" />
                          <span className="text-xl text-primary">
                            {building.publicApartments} public apartments
                          </span>
                        </div>
                        <Link to={routes.buildingPublic(building.id)}>
                          <Button>View Details</Button>
                        </Link>
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
