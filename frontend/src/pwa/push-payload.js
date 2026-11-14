/* eslint no-control-regex: "off" -- Reject control bytes in untrusted push destinations. */
import { technicalPath } from './policy.js';
export function pushDestination(value, origin) {
  if (typeof value === 'string' && value.startsWith(origin + '/')) value = value.slice(origin.length);
  if (typeof value !== 'string' || value.length > 512 || !value.startsWith('/') || value.startsWith('//') || /[\\\x00-\x20]/.test(value)) return new URL('/', origin).href;
  try { const decoded = decodeURIComponent(value); if (decoded.startsWith('//') || /[\\\x00-\x20]/.test(decoded)) return new URL('/', origin).href; const url = new URL(value, origin); return url.origin === origin && !technicalPath(url.pathname) ? url.href : new URL('/', origin).href; } catch { return new URL('/', origin).href; }
}
export function pushNotification(payload, origin) {
  const data = payload && typeof payload === 'object' ? payload : {};
  const title = typeof data.title === 'string' && data.title ? data.title.slice(0, 100) : 'Notificação';
  const options = { body: typeof data.body === 'string' ? data.body.slice(0, 240) : 'Abra o aplicativo para conferir.', icon: '/icons/icon-192.png', data: { url: pushDestination(data.data?.url, origin) } };
  if (typeof data.tag === 'string') options.tag = data.tag.slice(0, 64);
  if (typeof data.image === 'string' && /\.(png|jpe?g|webp)$/i.test(data.image)) { const image = pushDestination(data.image, origin); if (image !== new URL('/', origin).href) options.image = image; }
  return { title, options };
}
