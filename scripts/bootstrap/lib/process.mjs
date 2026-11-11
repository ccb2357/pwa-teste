import { spawn } from 'node:child_process';
import { FoundationError } from './errors.mjs';
export function run(command, argv, { input, cwd, env, timeout = 300000, label = 'Comando', allowFailure = false } = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, argv, { shell: false, cwd, env: env || process.env, stdio: ['pipe', 'pipe', 'pipe'] });
    let stdout = '', stderr = '', exceeded = false;
    const timer = setTimeout(() => { exceeded = true; child.kill('SIGKILL'); }, timeout);
    const capture = (target, chunk) => {
      if (target === 'stdout') stdout += chunk; else stderr += chunk;
      if (stdout.length + stderr.length > 16 * 1024 * 1024) { exceeded = true; child.kill('SIGKILL'); }
    };
    child.stdout.on('data', x => capture('stdout', x)); child.stderr.on('data', x => capture('stderr', x));
    child.on('error', () => { clearTimeout(timer); reject(new FoundationError(`${label}: executável indisponível ou sem permissão.`)); });
    child.on('close', code => {
      clearTimeout(timer);
      if (exceeded) return reject(new FoundationError(`${label}: limite de tempo/saída excedido.`));
      // Never propagate raw output: shared Compose/environment/PDO can expose secrets.
      if (code !== 0 && !allowFailure) return reject(new FoundationError(`${label}: falhou (código ${code ?? 1}). Consulte o diagnóstico privado no ambiente responsável.`));
      resolve({ code, stdout, stderr });
    });
    child.stdin.on('error', () => {}); child.stdin.end(input);
  });
}
export const docker = (argv, options) => run('docker', argv, options);
export function jsonOutput(result, label) { try { return JSON.parse(result.stdout); } catch { throw new FoundationError(`${label}: resposta inválida.`); } }
