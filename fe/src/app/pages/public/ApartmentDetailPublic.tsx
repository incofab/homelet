import { Link, useParams } from 'react-router';
import {
  MapPin,
  Bed,
  Bath,
  Maximize,
  Star,
  Mail,
  Phone,
  Building2,
} from 'lucide-react';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { StatusBadge } from '../../components/StatusBadge';
import { ImageWithFallback } from '../../components/figma/ImageWithFallback';
import { AppBreadcrumbs } from '../../components/AppBreadcrumbs';
import { useCallback, useMemo, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { apiPost } from '../../lib/api';
import { env } from '../../lib/env';
import { formatMoney, formatStatusLabel, formatDate } from '../../lib/format';
import { useApiQuery } from '../../hooks/useApiQuery';
import { api, routes } from '../../lib/urls';
import { extractRecord } from '../../lib/paginatedData';
import type { PublicApartment } from '../../lib/models';
import { appToast } from '../../lib/toast';

type ApartmentDetailPublicProps = {
  requestMode?: boolean;
};

type RequestApartmentResponse = {
  apartment?: PublicApartment;
  can_request?: boolean;
  unavailable_message?: string | null;
};

export function ApartmentDetailPublic({
  requestMode = false,
}: ApartmentDetailPublicProps) {
  const { id } = useParams();
  const [showRentalForm, setShowRentalForm] = useState(requestMode);
  const [formState, setFormState] = useState({
    name: '',
    email: '',
    phone: '',
    message: '',
  });
  const [formStatus, setFormStatus] = useState<{
    type: 'idle' | 'error' | 'success';
    message?: string;
  }>({ type: 'idle' });
  const [submitting, setSubmitting] = useState(false);

  const selectApartment = useCallback((data: unknown) => {
    const response = data as RequestApartmentResponse;
    return {
      apartment: extractRecord<PublicApartment>(data, 'apartment'),
      can_request: response?.can_request,
      unavailable_message: response?.unavailable_message,
    };
  }, []);
  const apartmentQuery = useApiQuery<unknown, RequestApartmentResponse>(
    id
      ? requestMode
        ? api.publicRentRequestApartment(id)
        : api.publicApartment(id)
      : null,
    {
      enabled: Boolean(id),
      deps: [id, requestMode],
      select: selectApartment,
    },
  );

  const apartment = apartmentQuery.data?.apartment;
  const canRequest = requestMode
    ? apartmentQuery.data?.can_request === true
    : apartment?.status?.toLowerCase?.() === 'vacant';
  const unavailableMessage =
    apartmentQuery.data?.unavailable_message ??
    'This apartment is no longer available for rental requests. Please contact the landlord or manager for another option.';

  const images = useMemo(() => {
    if (apartment?.media && apartment.media.length > 0) {
      return apartment.media.map((item) => item.url);
    }
    return [env.apartmentPlaceholderImage];
  }, [apartment?.media]);

  const title = apartment?.building?.name
    ? `${apartment.building.name} - ${apartment.unit_code ?? 'Unit'}`
    : (apartment?.unit_code ?? 'Apartment');

  const location = [
    apartment?.building?.address_line1,
    apartment?.building?.address_line2,
    apartment?.building?.city,
    apartment?.building?.state,
  ]
    .filter(Boolean)
    .join(', ');

  const beds = apartment?.beds ?? apartment?.bedrooms ?? null;
  const baths = apartment?.baths ?? apartment?.bathrooms ?? null;
  const sqft = apartment?.sqft ?? apartment?.square_feet ?? null;
  const yearlyPrice = apartment?.yearly_price ? apartment.yearly_price : null;

  const handleInputChange =
    (field: string) =>
    (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setFormState((prev) => ({ ...prev, [field]: event.target.value }));
    };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!apartment?.id) return;
    setSubmitting(true);
    setFormStatus({ type: 'idle' });

    try {
      await apiPost(api.publicRentalRequests, {
        apartment_id: apartment.id,
        name: formState.name,
        email: formState.email,
        phone: formState.phone,
        message: formState.message,
      });
      setFormStatus({
        type: 'success',
        message:
          'Request submitted successfully. The landlord or manager will contact you soon.',
      });
      appToast.success('Rental request created successfully.');
      setFormState({ name: '', email: '', phone: '', message: '' });
      setShowRentalForm(false);
    } catch (error) {
      appToast.error((error as Error).message || 'Unable to submit request.');
      setFormStatus({
        type: 'error',
        message: (error as Error).message || 'Unable to submit request.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <AppBreadcrumbs
            items={[
              { label: requestMode ? 'Home' : 'Listings', to: routes.root },
              { label: apartment?.unit_code ?? 'Apartment' },
            ]}
          />
          <Link to={routes.login}>
            <Button variant="ghost">Login</Button>
          </Link>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {apartmentQuery.loading ? (
          <Card>
            <p className="text-muted-foreground">
              Loading apartment details...
            </p>
          </Card>
        ) : apartmentQuery.error || !apartment ? (
          <Card>
            <p className="text-destructive">
              {requestMode
                ? 'We could not find this rental request link. Please ask the landlord or manager to confirm the link.'
                : 'Unable to load apartment details.'}
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Image Gallery */}
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <ImageWithFallback
                    src={images[0]}
                    alt={title}
                    className="w-full h-96 object-cover rounded-lg"
                  />
                </div>
                {images.slice(1, 3).map((img, idx) => (
                  <ImageWithFallback
                    key={idx}
                    src={img}
                    alt={`${title} - ${idx + 2}`}
                    className="w-full h-48 object-cover rounded-lg"
                  />
                ))}
              </div>

              {/* Details */}
              <Card>
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h1 className="text-3xl mb-2">{title}</h1>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPin size={18} />
                      <span>{location || 'Location unavailable'}</span>
                    </div>
                  </div>
                  <StatusBadge
                    status={formatStatusLabel(apartment.status ?? 'vacant')}
                    type="apartment"
                  />
                </div>

                <div className="flex items-center gap-6 py-4 border-y border-border">
                  <div className="flex items-center gap-2">
                    <Bed size={20} className="text-muted-foreground" />
                    <span>{beds ?? '—'} Beds</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Bath size={20} className="text-muted-foreground" />
                    <span>{baths ?? '—'} Baths</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Maximize size={20} className="text-muted-foreground" />
                    <span>{sqft ? `${sqft} sq ft` : '—'}</span>
                  </div>
                </div>

                <div className="mt-6">
                  <h3 className="text-xl mb-3">Description</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {apartment.description || 'No description provided.'}
                  </p>
                </div>
              </Card>

              {/* Amenities */}
              <Card>
                <h3 className="text-xl mb-4">Amenities</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {(apartment.amenities ?? []).length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      Amenities not provided.
                    </p>
                  ) : (
                    apartment.amenities?.map((amenity, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-2 text-sm"
                      >
                        <div className="w-1.5 h-1.5 rounded-full bg-primary"></div>
                        <span>{amenity}</span>
                      </div>
                    ))
                  )}
                </div>
              </Card>

              {/* Reviews */}
              <Card>
                <h3 className="text-xl mb-4">Tenant Reviews</h3>
                <div className="space-y-4">
                  {(apartment.reviews ?? []).length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No reviews yet.
                    </p>
                  ) : (
                    apartment.reviews?.map((review) => (
                      <div
                        key={review.id}
                        className="pb-4 border-b border-border last:border-0 last:pb-0"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span>
                            {review.author ||
                              review.user?.name ||
                              'Verified Tenant'}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            {review.created_at
                              ? formatDate(review.created_at)
                              : ''}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 mb-2">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              size={16}
                              className={
                                i < review.rating
                                  ? 'fill-warning text-warning'
                                  : 'text-muted'
                              }
                            />
                          ))}
                        </div>
                        <p className="text-muted-foreground">
                          {review.comment || ''}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              <Card className="sticky top-24">
                <div className="text-3xl text-primary mb-6">
                  {yearlyPrice
                    ? `${formatMoney(yearlyPrice)}/year`
                    : 'Price unavailable'}
                </div>

                {!canRequest ? (
                  <div className="space-y-3">
                    <h3 className="text-xl">Apartment unavailable</h3>
                    <p className="text-sm text-muted-foreground">
                      {unavailableMessage}
                    </p>
                    <Link to={routes.root}>
                      <Button variant="secondary" className="w-full">
                        View Other Apartments
                      </Button>
                    </Link>
                  </div>
                ) : !showRentalForm ? (
                  <>
                    <Button
                      className="w-full mb-3"
                      onClick={() => setShowRentalForm(true)}
                    >
                      Submit Rental Request
                    </Button>
                    <p className="text-sm text-muted-foreground text-center">
                      Express your interest and we'll get back to you within 24
                      hours
                    </p>
                  </>
                ) : (
                  <form className="space-y-4" onSubmit={handleSubmit}>
                    <h4 className="text-lg">Rental Request Form</h4>
                    <div>
                      <label className="block text-sm mb-2">Full Name</label>
                      <input
                        type="text"
                        className="w-full px-4 py-2 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                        placeholder="John Doe"
                        value={formState.name}
                        onChange={handleInputChange('name')}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm mb-2">Email</label>
                      <input
                        type="email"
                        className="w-full px-4 py-2 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                        placeholder="john@example.com"
                        value={formState.email}
                        onChange={handleInputChange('email')}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm mb-2">Phone</label>
                      <input
                        type="tel"
                        className="w-full px-4 py-2 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                        placeholder="(555) 123-4567"
                        value={formState.phone}
                        onChange={handleInputChange('phone')}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm mb-2">Message</label>
                      <textarea
                        className="w-full px-4 py-2 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                        rows={4}
                        placeholder="Tell us about yourself..."
                        value={formState.message}
                        onChange={handleInputChange('message')}
                      />
                    </div>
                    {formStatus.type === 'error' && (
                      <p className="text-sm text-destructive">
                        {formStatus.message}
                      </p>
                    )}
                    <div className="flex flex-col gap-2">
                      <Button type="submit" disabled={submitting}>
                        {submitting ? 'Submitting...' : 'Submit Request'}
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => setShowRentalForm(false)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </form>
                )}
              </Card>
              {formStatus.type === 'success' && (
                <Card>
                  <p className="text-success">{formStatus.message}</p>
                </Card>
              )}
              <Card>
                <h3 className="text-xl mb-4">Building Contact</h3>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <Building2 size={18} className="mt-0.5 text-primary" />
                    <div>
                      <p className="text-sm text-muted-foreground">Building</p>
                      <p>{apartment.building?.name ?? 'Not provided'}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Mail size={18} className="mt-0.5 text-primary" />
                    <div>
                      <p className="text-sm text-muted-foreground">Email</p>
                      <p>
                        {apartment.building?.contact_email ?? 'Not provided'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Phone size={18} className="mt-0.5 text-primary" />
                    <div>
                      <p className="text-sm text-muted-foreground">Phone</p>
                      <p>
                        {apartment.building?.contact_phone ?? 'Not provided'}
                      </p>
                    </div>
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
