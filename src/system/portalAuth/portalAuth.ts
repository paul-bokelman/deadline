const DEFAULT_PORTAL_EMAIL = 'conner.work@aol.com';
const PORTAL_RESET_URL = 'http://identity.corp.internal/reset-password';

let portalLoginEmail = DEFAULT_PORTAL_EMAIL;
let pendingResetEmail = DEFAULT_PORTAL_EMAIL;
let portalPassword: string | null = null;

export const getPortalResetUrl = (): string => PORTAL_RESET_URL;

export const hasPortalPassword = (): boolean => portalPassword !== null;

export const getPortalLoginEmail = (): string => portalLoginEmail;

export const requestPortalPasswordReset = (email: string): void => {
  const normalized = email.trim().toLowerCase();
  if (!normalized) return;
  pendingResetEmail = normalized;
};

export const setPortalPassword = (password: string): void => {
  portalPassword = password;
  portalLoginEmail = pendingResetEmail;
};

export const validatePortalCredentials = (
  email: string,
  password: string
): boolean => {
  if (!portalPassword) return false;
  return (
    email.trim().toLowerCase() === portalLoginEmail &&
    password === portalPassword
  );
};
