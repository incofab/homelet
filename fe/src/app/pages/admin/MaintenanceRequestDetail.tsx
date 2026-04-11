import { MaintenanceRequestDetailView } from "../../components/MaintenanceRequestDetailView";
import { routes } from "../../lib/urls";

export function MaintenanceRequestDetail() {
  return (
    <MaintenanceRequestDetailView
      backTo={routes.adminMaintenance}
      backLabel="Back to maintenance"
      canUpdateStatus
    />
  );
}
