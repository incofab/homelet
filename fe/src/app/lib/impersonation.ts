export interface ImpersonationState {
  originalToken: string;
  impersonatorId: number;
  impersonatorName: string;
  impersonatedUserId: number;
  impersonatedUserName: string;
}

const IMPERSONATION_STORAGE_KEY = "tenanta_impersonation";
export const IMPERSONATION_CHANGED_EVENT = "tenanta:impersonation-changed";

const dispatchImpersonationChanged = () => {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(IMPERSONATION_CHANGED_EVENT));
};

export const getImpersonationState = (): ImpersonationState | null => {
  if (typeof window === "undefined") return null;

  const raw = window.localStorage.getItem(IMPERSONATION_STORAGE_KEY);

  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as ImpersonationState;
  } catch (error) {
    window.localStorage.removeItem(IMPERSONATION_STORAGE_KEY);
    dispatchImpersonationChanged();
    return null;
  }
};

export const setImpersonationState = (state: ImpersonationState) => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(IMPERSONATION_STORAGE_KEY, JSON.stringify(state));
  dispatchImpersonationChanged();
};

export const clearImpersonationState = () => {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(IMPERSONATION_STORAGE_KEY);
  dispatchImpersonationChanged();
};
