import { PORTAL_DEFAULT_EMAIL } from '@/data/contacts';
import { registerOnReboot } from '@/system/lifecycle';

let portalLoginEmail = PORTAL_DEFAULT_EMAIL;
let pendingResetEmail = PORTAL_DEFAULT_EMAIL;
let portalPassword: string | null = null;

registerOnReboot(() => {
  portalLoginEmail = PORTAL_DEFAULT_EMAIL;
  pendingResetEmail = PORTAL_DEFAULT_EMAIL;
  portalPassword = null;
});

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
