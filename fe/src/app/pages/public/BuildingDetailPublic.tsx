import { Link, useParams } from 'react-router';
import { ArrowLeft, Mail, MapPin, Phone, Home } from 'lucide-react';
import { useCallback } from 'react';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { ImageWithFallback } from '../../components/figma/ImageWithFallback';
import { useApiQuery } from '../../hooks/useApiQuery';
import { env } from '../../lib/env';
import { formatMoney, formatStatusLabel } from '../../lib/format';
import { extractRecord } from '../../lib/paginatedData';
import { api, routes } from '../../lib/urls';
import { StatusBadge } from '../../components/StatusBadge';
import type { Building, PublicApartment } from '../../lib/models';

type PublicBuildingDetail = Building & {
  apartments?: PublicApartment[];
};

export function BuildingDetailPublic() {
  const { id } = useParams();
  const selectBuilding = useCallback(
    (data: unknown) => extractRecord<PublicBuildingDetail>(data, 'building'),
    [],
  );

  const buildingQuery = useApiQuery<unknown, PublicBuildingDetail>(
    id ? api.publicBuilding(id) : null,
    {
      enabled: Boolean(id),
      deps: [id],
      select: selectBuilding,
    },
  );

  const building = buildingQuery.data;
  const location = [
    building?.address_line1,
    building?.address_line2,
    building?.city,
    building?.state,
  ]
    .filter(Boolean)
    .join(', ');
  const image = building?.media?.[0]?.url ?? env.placeholderImage;
  const apartments = building?.apartments ?? [];

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b border-border sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link to={routes.root}>
            <Button variant="ghost">
              <ArrowLeft size={20} className="mr-2" />
              Back to Listings
            </Button>
          </Link>
          <Link to={routes.login}>
            <Button variant="ghost">Login</Button>
          </Link>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {buildingQuery.loading ? (
          <Card>
            <p className="text-muted-foreground">Loading building details...</p>
          </Card>
        ) : buildingQuery.error || !building ? (
          <Card>
            <p className="text-destructive">Unable to load building details.</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <ImageWithFallback
                  src={image}
                  alt={building.name}
                  className="w-full h-80 object-cover rounded-lg mb-6"
                />
                <div className="space-y-4">
                  <div>
                    <h1 className="text-3xl mb-2">{building.name}</h1>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPin size={18} />
                      <span>{location || 'Location unavailable'}</span>
                    </div>
                  </div>
                  <p className="text-muted-foreground">
                    {building.description || 'No description provided.'}
                  </p>
                </div>
              </Card>

              <Card>
                <h2 className="text-xl mb-4">Available Apartments</h2>
                {apartments.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No public apartments are available in this building yet.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {apartments.map((apartment) => (
                      <Link
                        key={apartment.id}
                        to={routes.apartmentPublic(apartment.id)}
                      >
                        <div className="flex items-center justify-between rounded-lg border border-border p-4 hover:bg-muted transition-colors">
                          <div>
                            <p className="mb-1">
                              {apartment.unit_code ?? 'Unit'}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {apartment.yearly_price
                                ? `${formatMoney(apartment.yearly_price / 12)}/mo`
                                : 'Price unavailable'}
                            </p>
                          </div>
                          <StatusBadge
                            status={formatStatusLabel(
                              apartment.status ?? 'vacant',
                            )}
                            type="apartment"
                          />
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </Card>
            </div>

            <div className="space-y-6">
              <Card>
                <h2 className="text-xl mb-4">Contact Building</h2>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <Mail size={18} className="mt-0.5 text-primary" />
                    <div>
                      <p className="text-sm text-muted-foreground">Email</p>
                      <p>{building.contact_email ?? 'Not provided'}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Phone size={18} className="mt-0.5 text-primary" />
                    <div>
                      <p className="text-sm text-muted-foreground">Phone</p>
                      <p>{building.contact_phone ?? 'Not provided'}</p>
                    </div>
                  </div>
                </div>
              </Card>

              <Card>
                <div className="flex items-center gap-3">
                  <Home size={20} className="text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Public apartments
                    </p>
                    <p className="text-2xl">{apartments.length}</p>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
