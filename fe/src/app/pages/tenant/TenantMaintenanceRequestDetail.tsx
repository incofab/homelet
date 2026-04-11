import { MaintenanceRequestDetailView } from "../../components/MaintenanceRequestDetailView";
import { routes } from "../../lib/urls";

export function TenantMaintenanceRequestDetail() {
  return (
    <MaintenanceRequestDetailView
      backTo={routes.tenantMaintenance}
      backLabel="Back to maintenance"
    />
  );
}
