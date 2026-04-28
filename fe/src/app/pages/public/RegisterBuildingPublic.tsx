import { Link, useLocation, useNavigate } from 'react-router';
import { useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { Home } from 'lucide-react';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { Input } from '../../components/Input';
import { BuildingRegistrationSuccess } from '../../components/BuildingRegistrationSuccess';
import { AppBreadcrumbs } from '../../components/AppBreadcrumbs';
import { apiPost, getAuthToken } from '../../lib/api';
import { env } from '../../lib/env';
import { api, routeForDashboard, routes, withRedirect } from '../../lib/urls';
import type {
  BuildingRegistrationRequestResponse,
  PlatformAdminContacts,
} from '../../lib/responses';

export function RegisterBuildingPublic() {
  const location = useLocation();
  const navigate = useNavigate();
  const authToken = useMemo(() => getAuthToken(), []);
  const signUpRoute = withRedirect(
    routes.register,
    `${location.pathname}${location.search}`,
  );
  const [formState, setFormState] = useState({
    name: '',
    address_line1: '',
    address_line2: '',
    city: '',
    state: '',
    country: env.defaultCountry,
    description: '',
    for_sale: false,
    sale_price: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<{
    type: 'idle' | 'error' | 'success';
    message?: string;
  }>({
    type: 'idle',
  });
  const [submittedRequestId, setSubmittedRequestId] = useState<number | null>(
    null,
  );
  const [adminContacts, setAdminContacts] =
    useState<PlatformAdminContacts | null>(null);

  useEffect(() => {
    if (!authToken) {
      navigate(signUpRoute, { replace: true });
    }
  }, [authToken, navigate, signUpRoute]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setStatus({ type: 'idle' });

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
        sale_price:
          formState.for_sale && formState.sale_price
            ? Number(formState.sale_price)
            : null,
      };
      const data = await apiPost<BuildingRegistrationRequestResponse>(
        api.buildingRegistrationRequests,
        payload,
      );
      setSubmittedRequestId(data.request.id);
      setAdminContacts(data.admin_contacts ?? null);
      setStatus({
        type: 'success',
        message:
          'Your building registration request has been submitted for admin approval.',
      });
    } catch (error) {
      setStatus({
        type: 'error',
        message:
          (error as Error).message || 'Unable to submit registration request.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (!authToken) {
    return null;
  }

  return (
    <div className="min-h-screen bg-muted flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-3xl">
        <div className="flex items-center justify-between mb-6">
          <AppBreadcrumbs
            items={[
              { label: 'Home', to: routes.root },
              { label: 'Register Building' },
            ]}
          />
          <div className="flex items-center gap-2">
            <Home size={24} className="text-primary" />
            <span className="text-xl text-primary">{env.appName}</span>
          </div>
        </div>

        <Card className="p-8">
          <div className="mb-6">
            <h1 className="text-3xl mb-2">Register Your Building</h1>
            <p className="text-muted-foreground">
              Share your building details and we will review the request within
              24-48 hours.
            </p>
          </div>

          {status.type === 'success' ? (
            <BuildingRegistrationSuccess
              requestId={submittedRequestId}
              adminContacts={adminContacts}
              actions={
                <Link to={routeForDashboard()}>
                  <Button>Go to Dashboard</Button>
                </Link>
              }
            />
          ) : (
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div className="space-y-4">
                <h2 className="text-xl">Building Details</h2>
                <Input
                  label="Building Name"
                  placeholder="Sunrise Apartments"
                  required
                  value={formState.name}
                  onChange={(event) =>
                    setFormState((prev) => ({
                      ...prev,
                      name: event.target.value,
                    }))
                  }
                />
                <Input
                  label="Address Line 1"
                  placeholder="12 Main Street"
                  required
                  value={formState.address_line1}
                  onChange={(event) =>
                    setFormState((prev) => ({
                      ...prev,
                      address_line1: event.target.value,
                    }))
                  }
                />
                <Input
                  label="Address Line 2"
                  placeholder="Suite 4"
                  value={formState.address_line2}
                  onChange={(event) =>
                    setFormState((prev) => ({
                      ...prev,
                      address_line2: event.target.value,
                    }))
                  }
                />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Input
                    label="City"
                    placeholder="Lagos"
                    required
                    value={formState.city}
                    onChange={(event) =>
                      setFormState((prev) => ({
                        ...prev,
                        city: event.target.value,
                      }))
                    }
                  />
                  <Input
                    label="State"
                    placeholder="Lagos"
                    required
                    value={formState.state}
                    onChange={(event) =>
                      setFormState((prev) => ({
                        ...prev,
                        state: event.target.value,
                      }))
                    }
                  />
                  <Input
                    label="Country"
                    placeholder="NG"
                    required
                    value={formState.country}
                    onChange={(event) =>
                      setFormState((prev) => ({
                        ...prev,
                        country: event.target.value,
                      }))
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm mb-2">Description</label>
                  <textarea
                    className="w-full px-4 py-2 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    rows={4}
                    placeholder="Describe the building and amenities"
                    value={formState.description}
                    onChange={(event) =>
                      setFormState((prev) => ({
                        ...prev,
                        description: event.target.value,
                      }))
                    }
                  />
                </div>
                <div className="flex items-center gap-3">
                  <input
                    id="for-sale"
                    type="checkbox"
                    checked={formState.for_sale}
                    onChange={(event) =>
                      setFormState((prev) => ({
                        ...prev,
                        for_sale: event.target.checked,
                      }))
                    }
                    className="h-4 w-4"
                  />
                  <label htmlFor="for-sale" className="text-sm">
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
                      setFormState((prev) => ({
                        ...prev,
                        sale_price: event.target.value,
                      }))
                    }
                  />
                ) : null}
              </div>

              {status.type === 'error' ? (
                <p className="text-sm text-destructive">{status.message}</p>
              ) : null}

              <div className="flex flex-col sm:flex-row gap-3">
                <Button type="submit" disabled={submitting}>
                  {submitting ? 'Submitting...' : 'Submit Request'}
                </Button>
                <Link to={routes.root}>
                  <Button type="button" variant="secondary">
                    Cancel
                  </Button>
                </Link>
              </div>
            </form>
          )}
        </Card>
      </div>
    </div>
  );
}
