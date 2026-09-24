// Native Claude Code subscription bridge. No SDK, token extraction or API proxy.
import { spawn, spawnSync } from 'node:child_process';
import { existsSync, openSync, closeSync, unlinkSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { isAbsolute, join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';

export function subscriptionEnvironment(source = process.env) {
  const env = { ...source };
  for (const key of Object.keys(env)) {
    if (/^(ANTHROPIC_(API_KEY|AUTH_TOKEN|BASE_URL)|CLAUDE_CODE_(USE_BEDROCK|USE_VERTEX|USE_FOUNDRY)|CLAUDECODE)$/.test(key)) delete env[key];
  }
  env.CLAUDE_CODE_EFFORT_LEVEL = 'max';
  return env;
}

export function subscriptionStatus(status) {
  if (!status.loggedIn || status.authMethod !== 'claude.ai' || status.apiKeySource || status.apiProvider !== 'firstParty') {
    throw new Error('Une session native claude.ai est requise ; connexion API refusée.');
  }
  if (!['pro', 'max', 'team', 'enterprise'].includes(status.subscriptionType)) throw new Error('Abonnement Claude non confirmé.');
  return { loggedIn: true, authMethod: status.authMethod, subscriptionType: status.subscriptionType };
}

export function claudeArguments({ cwd, mode = 'review', files = [], luna = false }) {
  if (!['review', 'edit'].includes(mode)) throw new Error('Mode attendu : review ou edit.');
  const allowed = ['Read', 'Glob', 'Grep'];
  if (luna) allowed.push('Bash(node scripts/luna-review.mjs *)');
  if (mode === 'edit') {
    if (!files.length) throw new Error('Une liste explicite de fichiers est requise pour modifier.');
    for (const file of files) {
      const absolute = resolve(cwd, file);
      if (isAbsolute(file) || !absolute.startsWith(resolve(cwd) + (process.platform === 'win32' ? '\\' : '/')) || /[*?()[\]{}]/.test(file)) {
        throw new Error(`Chemin de modification non borné : ${file}`);
      }
      const rule = file.replaceAll('\\', '/');
      allowed.push(`Edit(./${rule})`, `Write(./${rule})`);
    }
  }
  return ['--print', '--safe-mode', '--model', 'claude-opus-5-5', '--effort', 'max',
    '--output-format', 'json', '--no-session-persistence', '--strict-mcp-config',
    '--mcp-config', '{"mcpServers":{}}', '--tools', ['Read', 'Glob', 'Grep', ...(mode === 'edit' ? ['Edit', 'Write'] : []), ...(luna ? ['Bash'] : [])].join(','),
    '--allowedTools', ...allowed];
}

function findClaude() {
  if (process.env.CLAUDE_CLI_PATH && existsSync(process.env.CLAUDE_CLI_PATH)) return process.env.CLAUDE_CLI_PATH;
  const located = spawnSync(process.platform === 'win32' ? 'where.exe' : 'which', ['claude'], { encoding: 'utf8', windowsHide: true });
  const onPath = located.stdout?.trim().split(/\r?\n/).find(path => existsSync(path) && /(?:\.exe)?$/.test(path) && !/\.(?:cmd|ps1)$/.test(path));
  if (onPath) return onPath;
  const packages = join(process.env.LOCALAPPDATA || '', 'Packages');
  if (existsSync(packages)) {
    for (const pkg of readdirSync(packages).filter(name => /^Claude_/.test(name))) {
      const root = join(packages, pkg, 'LocalCache', 'Roaming', 'Claude', 'claude-code');
      if (!existsSync(root)) continue;
      const versions = readdirSync(root).sort((a, b) => b.localeCompare(a, undefined, { numeric: true }));
      for (const version of versions) { const exe = join(root, version, 'claude.exe'); if (existsSync(exe)) return exe; }
    }
  }
  throw new Error('Claude Code introuvable. Installer le CLI natif ou fournir CLAUDE_CLI_PATH.');
}

async function main() {
  const input = process.argv.slice(2);
  const get = name => { const i = input.indexOf(name); return i < 0 ? undefined : input[i + 1]; };
  const cwd = resolve(get('--cwd') || process.cwd());
  const env = subscriptionEnvironment();
  const exe = findClaude();
  const version = spawnSync(exe, ['--version'], { encoding: 'utf8', windowsHide: true, env });
  const numbers = version.stdout?.match(/(\d+)\.(\d+)\.(\d+)/)?.slice(1).map(Number);
  if (version.status !== 0 || !numbers || numbers[0] < 2 || (numbers[0] === 2 && (numbers[1] < 1 || (numbers[1] === 1 && numbers[2] < 280)))) {
    throw new Error('Claude Code 2.1.280 ou ultérieur est requis pour Opus 5.5.');
  }
  const auth = spawnSync(exe, ['auth', 'status', '--json'], { encoding: 'utf8', windowsHide: true, env });
  if (auth.status !== 0) throw new Error('Connexion Claude indisponible. Utiliser claude auth login --claudeai.');
  const status = subscriptionStatus(JSON.parse(auth.stdout));
  const diagnosis = { version: numbers.join('.'), ...status, model: 'claude-opus-5-5', effort: 'max', cwd };
  if (input.includes('--diagnose')) { console.log(JSON.stringify(diagnosis)); return; }
  const briefFile = get('--brief');
  const output = get('--output');
  if (!briefFile || !output) throw new Error('--brief et --output sont requis. Vérifier dans Claude > Usage que les crédits supplémentaires sont désactivés.');
  const mode = get('--mode') || 'review';
  const files = input.flatMap((arg, i) => arg === '--allow-file' ? [input[i + 1]] : []);
  const args = claudeArguments({ cwd, mode, files, luna: input.includes('--with-luna') });
  const lock = join(tmpdir(), 'laffinee-claude-frontend.lock');
  if (existsSync(lock)) {
    const previous = Number(readFileSync(lock, 'utf8'));
    try { process.kill(previous, 0); throw new Error('Une revue Claude est déjà active.'); }
    catch (error) { if (error.code !== 'ESRCH') throw error; unlinkSync(lock); }
  }
  const lockHandle = openSync(lock, 'wx'); writeFileSync(lockHandle, String(process.pid)); closeSync(lockHandle);
  try {
  console.log(JSON.stringify({ ...diagnosis, mode, writableFiles: files, output: resolve(output) }));
  const child = spawn(exe, args, { cwd, env, windowsHide: true, stdio: ['pipe', 'pipe', 'pipe'] });
  let result = '', errorText = '';
  child.stdout.setEncoding('utf8'); child.stdout.on('data', chunk => { result += chunk; });
  child.stderr.setEncoding('utf8'); child.stderr.on('data', chunk => { errorText += chunk; });
  child.stdin.end(readFileSync(resolve(briefFile), 'utf8'));
  const code = await new Promise((done, reject) => { child.on('error', reject); child.on('close', done); });
  writeFileSync(resolve(output), result, 'utf8');
  // Quota errors may arrive as a valid JSON result with empty stderr. Keep the
  // native reason visible instead of reporting only an unhelpful exit code.
  let response;
  try { response = JSON.parse(result); }
  catch { throw new Error(`Réponse Claude illisible (code ${code}) ; résultat conservé dans ${resolve(output)}. ${errorText.slice(-1200)}`); }
  if (code !== 0) throw new Error(`Claude a terminé avec le code ${code}. ${response.result || errorText.slice(-1200)}`);
  if (response.is_error) throw new Error(`Claude n'a pas terminé : ${response.result || response.subtype}`);
  console.log(JSON.stringify({ completed: true, output: resolve(output), turns: response.num_turns, models: Object.keys(response.modelUsage || {}) }));
  } finally { unlinkSync(lock); }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch(error => { console.error(error.message); process.exitCode = 1; });
}
