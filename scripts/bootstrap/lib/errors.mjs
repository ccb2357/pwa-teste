export class FoundationError extends Error {
  constructor(message, code = 1) { super(message); this.code = code; }
}
export function requireThat(condition, message, code = 1) {
  if (!condition) throw new FoundationError(message, code);
}
export function httpFailure(output) {
  const reasons = {
    'http-connection': 'falha de conexão HTTP', 'http-status': 'status HTTP diferente de 200',
    'no-store': 'cabeçalho Cache-Control sem no-store', 'status-contract': 'JSON ou Content-Type diferente do esperado',
    'html-contract': 'HTML sem os textos Backend OK e Banco OK', 'origin-status': 'API falhou com Origin',
    'csrf-status': 'CSRF não retornou 204', 'csrf-token-missing': 'cookie XSRF-TOKEN ausente',
    'csrf-cookie-domain': 'cookie com Domain explícito', 'invalid-json': 'resposta JSON inválida',
    'unexpected-error': 'erro interno no verificador',
  };
  try {
    const d = JSON.parse(output);
    if (d.status !== 'error' || !Object.hasOwn(reasons, d.reason)) throw new Error();
    const endpoint = ['/up', '/status', '/api/v1/status', '/sanctum/csrf-cookie'].includes(d.path) ? d.path : 'não identificado';
    const number = (value, max) => Number.isInteger(value) && value >= 0 && value <= max ? value : 0;
    return `Verificação HTTP/CSRF: ${endpoint}; ${reasons[d.reason]}; HTTP ${number(d.http_status, 599)}; curl ${number(d.curl_errno, 999)}; origem nº ${number(d.origin_index, 1000)} (0 = sem Origin).`;
  } catch {
    return 'Verificação HTTP/CSRF falhou sem diagnóstico estruturado. Confira se verify-http.php foi atualizado e está acessível no PHP-FPM.';
  }
}
