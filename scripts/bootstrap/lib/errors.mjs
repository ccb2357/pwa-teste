export class FoundationError extends Error {
  constructor(message, code = 1) { super(message); this.code = code; }
}
export function requireThat(condition, message, code = 1) {
  if (!condition) throw new FoundationError(message, code);
}
