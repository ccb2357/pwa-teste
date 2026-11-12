const blank = () => ({ city: '', date: [], email: '', phone: '', checked: false, language: 'JavaScript', count: 0 });
export function cleanDraft(value) {
  const data = blank();
  if (!value || typeof value !== 'object') return data;
  for (const [key, limit] of [['city', 200], ['email', 320], ['phone', 64]]) if (typeof value[key] === 'string') data[key] = value[key].slice(0, limit);
  if (Array.isArray(value.date)) data.date = value.date.filter(v => typeof v === 'string' && Number.isFinite(Date.parse(v))).slice(0, 1);
  data.checked = value.checked === true;
  if (['JavaScript', 'PHP', 'SQL'].includes(value.language)) data.language = value.language;
  if (Number.isSafeInteger(value.count) && value.count >= 0) data.count = value.count;
  return data;
}
export function draftStorage(storage, slug) {
  const key = `pwa:${slug}:hello-draft`;
  return {
    restore() {
      try { const raw = storage.getItem(key); if (!raw) return blank(); const saved = JSON.parse(raw); storage.removeItem(key); return Date.now() - saved.at < 24 * 60 * 60 * 1000 ? cleanDraft(saved.data) : blank(); }
      catch { return blank(); }
    },
    save(data) {
      const safe = cleanDraft(data);
      for (const name of Object.keys(safe)) if (Object.hasOwn(data, name) && JSON.stringify(data[name]) !== JSON.stringify(safe[name])) throw new Error('Rascunho não pode ser preservado integralmente.');
      storage.setItem(key, JSON.stringify({ at: Date.now(), data: safe }));
    },
  };
}
