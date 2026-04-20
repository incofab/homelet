import { useEffect, useState } from "react";
import { AUTH_TOKEN_CHANGED_EVENT, getAuthToken } from "../lib/api";

export function useAuthToken() {
  const [authToken, setAuthTokenState] = useState(() => getAuthToken());

  useEffect(() => {
    const syncToken = () => {
      setAuthTokenState(getAuthToken());
    };

    window.addEventListener(AUTH_TOKEN_CHANGED_EVENT, syncToken);
    window.addEventListener("storage", syncToken);

    return () => {
      window.removeEventListener(AUTH_TOKEN_CHANGED_EVENT, syncToken);
      window.removeEventListener("storage", syncToken);
    };
  }, []);

  return authToken;
}
