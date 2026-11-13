import { apiRequest } from './api.js';
export const pushApi = (path, options) => apiRequest('/api/v1/push/' + path, options);
export function applicationKey(value) {
  const bytes = Uint8Array.from(atob(value.replace(/-/g, '+').replace(/_/g, '/')), char => char.charCodeAt(0));
  if (bytes.length !== 65) throw new Error('Chave pública inválida.');
  return bytes;
}
export async function subscriptionFingerprint(subscription) {
  const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(subscription.endpoint));
  return [...new Uint8Array(bytes)].map(value => value.toString(16).padStart(2, '0')).join('');
}
export function sameApplicationKey(subscription, expected) {
  const actual = subscription.options?.applicationServerKey;
  if (!actual) return true;
  const bytes = new Uint8Array(actual), wanted = applicationKey(expected);
  return bytes.length === wanted.length && bytes.every((value, index) => value === wanted[index]);
}
export async function activeRegistration() {
  const registration = await navigator.serviceWorker.getRegistration('/');
  if (!registration?.active) throw new Error('Abra o build e aguarde a preparação da PWA.');
  return registration;
}
