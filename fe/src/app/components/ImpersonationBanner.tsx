import { useEffect, useState } from "react";
import { Button } from "./Button";
import { getImpersonationState } from "../lib/impersonation";
import { useAuthSession } from "../hooks/useAuthSession";

export function ImpersonationBanner() {
  const [impersonation, setImpersonation] = useState(() => getImpersonationState());
  const { stopImpersonation, stoppingImpersonation } = useAuthSession();

  useEffect(() => {
    const syncState = () => {
      setImpersonation(getImpersonationState());
    };

    syncState();
    window.addEventListener("storage", syncState);

    return () => {
      window.removeEventListener("storage", syncState);
    };
  }, []);

  if (!impersonation) {
    return null;
  }

  const handleStopImpersonation = async () => {
    const stopped = await stopImpersonation();

    if (stopped) {
      setImpersonation(null);
    }
  };

  return (
    <div className="sticky top-0 z-[60] border-b border-red-800 bg-red-700 text-white">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-3 lg:flex-row lg:items-center lg:justify-between lg:px-8">
        <p className="text-sm font-medium">
          You are impersonating {impersonation.impersonatedUserName}
        </p>
        <Button
          variant="secondary"
          onClick={handleStopImpersonation}
          className="bg-white text-red-700 hover:bg-red-50"
        >
          {stoppingImpersonation ? "Stopping..." : "Stop Impersonate"}
        </Button>
      </div>
    </div>
  );
}
