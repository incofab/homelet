import { MaintenanceRequestDetailView } from '../../components/MaintenanceRequestDetailView';
import { routes } from '../../lib/urls';

export function TenantMaintenanceRequestDetail() {
  return (
    <MaintenanceRequestDetailView
      parentTo={routes.tenantMaintenance}
      parentLabel="Maintenance"
    />
  );
}
