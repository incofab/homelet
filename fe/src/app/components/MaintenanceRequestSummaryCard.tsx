import { Link } from "react-router";
import { Card } from "./Card";
import { StatusBadge } from "./StatusBadge";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { env } from "../lib/env";
import { formatDate, formatStatusLabel } from "../lib/format";
import type { MaintenanceRequest } from "../lib/models";

interface MaintenanceRequestSummaryCardProps {
  request: MaintenanceRequest;
  to: string;
  showContext?: boolean;
}

const priorityClassName = (priority?: string) => {
  const normalized = priority?.toLowerCase?.();

  if (normalized === "high") {
    return "bg-destructive/10 text-destructive";
  }

  if (normalized === "medium") {
    return "bg-warning/10 text-warning";
  }

  return "bg-muted text-muted-foreground";
};

export function MaintenanceRequestSummaryCard({
  request,
  to,
  showContext = false,
}: MaintenanceRequestSummaryCardProps) {
  const thumbnail = request.media?.[0]?.url ?? env.placeholderImage;
  const priority = request.priority ?? "low";

  return (
    <Link to={to} className="block">
      <Card hover>
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-1 items-start gap-4">
            <ImageWithFallback
              src={thumbnail}
              alt={`${request.title ?? "Maintenance request"} thumbnail`}
              className="h-20 w-20 shrink-0 rounded-lg object-cover"
            />
            <div className="min-w-0 flex-1">
              <h3 className="mb-1 text-lg">{request.title ?? "Maintenance request"}</h3>
              {showContext ? (
                <p className="text-sm text-muted-foreground">
                  {request.tenant?.name ?? "Tenant"} · {request.apartment?.unit_code ?? "Unit"} · {request.apartment?.building?.name ?? "Building"}
                </p>
              ) : null}
              <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
                <span className="text-muted-foreground">
                  Submitted: {request.created_at ? formatDate(request.created_at) : "—"}
                </span>
                <span className={`rounded px-2 py-1 text-xs ${priorityClassName(priority)}`}>
                  {formatStatusLabel(priority)} Priority
                </span>
              </div>
            </div>
          </div>
          <StatusBadge status={formatStatusLabel(request.status)} type="maintenance" />
        </div>
      </Card>
    </Link>
  );
}
