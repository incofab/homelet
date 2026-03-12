import { useEffect, useState } from "react";
import { LoaderCircle } from "lucide-react";
import { subscribeToApiActivity } from "../lib/api";

export function GlobalLoadingIndicator() {
  const [pendingRequests, setPendingRequests] = useState(0);

  useEffect(() => {
    return subscribeToApiActivity(setPendingRequests);
  }, []);

  if (pendingRequests === 0) {
    return null;
  }

  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-[100]">
      <div className="h-1 bg-primary/80" />
      <div className="mx-auto mt-3 flex w-fit items-center gap-2 rounded-full border border-border bg-background/95 px-4 py-2 text-sm shadow-lg backdrop-blur">
        <LoaderCircle size={16} className="animate-spin text-primary" />
        <span>Loading...</span>
      </div>
    </div>
  );
}
