// Native Claude Code subscription bridge. No SDK, token extraction or API proxy.
import { spawn, spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, openSync, closeSync, unlinkSync, readdirSync, readFileSync, writeFileSync, realpathSync, statSync, mkdtempSync, mkdirSync, copyFileSync, rmSync } from 'node:fs';
import { basename, dirname, extname, isAbsolute, join, relative, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';

export const MAX_BRIEF_BYTES = 24 * 1024;
const MAX_FILES = 12;
const MAX_TEXT_BYTES = 128 * 1024;
const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
const MAX_TOTAL_SOURCE_BYTES = 32 * 1024 * 1024;

export function subscriptionEnvironment(source = process.env) {
  const env = { ...source };
  for (const key of Object.keys(env)) {
    if (/^ANTHROPIC_/i.test(key)
      || /^CLAUDE_CODE_(USE_(BEDROCK|VERTEX|FOUNDRY|ANTHROPIC_AWS|MANTLE)|SIMPLE|PROVIDER_MANAGED_BY_HOST)$/i.test(key)
      || /^CLAUDECODE$/i.test(key)) delete env[key];
  }
  env.CLAUDE_CODE_EFFORT_LEVEL = 'max';
  return env;
}

export function subscriptionStatus(status) {
  if (!status.loggedIn || status.authMethod !== 'claude.ai' || status.apiKeySource || status.apiProvider !== 'firstParty') {
    throw new Error('Une session native claude.ai est requise ; connexion API refusée.');
  }
  if (status.subscriptionType !== 'pro') throw new Error('Une session Claude Pro est requise.');
  return { loggedIn: true, authMethod: status.authMethod, subscriptionType: status.subscriptionType };
}

export function parseLauncherOptions(input) {
  const values = new Map();
  const files = [];
  const switches = new Set(['--diagnose', '--dry-run', '--with-luna']);
  const valued = new Set(['--cwd', '--brief', '--output', '--mode', '--allow-file', '--max-turns']);
  for (let i = 0; i < input.length; i++) {
    const name = input[i];
    if (switches.has(name)) {
      if (values.has(name)) throw new Error(`Option répétée : ${name}`);
      values.set(name, true);
    } else if (valued.has(name)) {
      const value = input[++i];
      if (!value || value.startsWith('--')) throw new Error(`Valeur manquante pour ${name}.`);
      if (name === '--allow-file') files.push(value);
      else {
        if (values.has(name)) throw new Error(`Option répétée : ${name}`);
        values.set(name, value);
      }
    } else throw new Error(`Option inconnue : ${name}`);
  }
  const mode = values.get('--mode') || 'review';
  if (!['review', 'edit'].includes(mode)) throw new Error('Mode attendu : review ou edit.');
  const rawTurns = values.get('--max-turns') || String(mode === 'edit' ? 12 : 4);
  if (!/^[1-9]\d*$/.test(rawTurns) || !Number.isSafeInteger(Number(rawTurns))) throw new Error('--max-turns doit être un entier positif sûr.');
  if (files.length > MAX_FILES) throw new Error(`Au plus ${MAX_FILES} fichiers explicites par mission.`);
  if (values.has('--diagnose') && values.has('--dry-run')) throw new Error('Choisir --diagnose ou --dry-run.');
  if (!values.has('--diagnose') && (!values.get('--brief') || !values.get('--output'))) {
    throw new Error('--brief et --output sont requis. Vérifier dans Claude > Usage que les crédits supplémentaires sont désactivés.');
  }
  return {
    cwd: resolve(values.get('--cwd') || process.cwd()), mode, files,
    maxTurns: Number(rawTurns), brief: values.get('--brief'), output: values.get('--output'),
    luna: !!values.get('--with-luna'), dryRun: !!values.get('--dry-run'), diagnose: !!values.get('--diagnose'),
  };
}

export function readBrief(path, maxBytes = MAX_BRIEF_BYTES) {
  const bytes = readFileSync(resolve(path));
  if (bytes.length > maxBytes) throw new Error(`Brief trop long : ${bytes.length} octets ; maximum ${maxBytes}. Réduire le brief sans tronquer.`);
  let brief;
  try { brief = new TextDecoder('utf-8', { fatal: true }).decode(bytes); }
  catch { throw new Error('Brief invalide : UTF-8 requis.'); }
  if (!brief.trim() || brief.includes('\0')) throw new Error('Brief invalide : texte non vide et sans octet nul requis.');
  return brief;
}

function inside(root, path) {
  const rest = relative(root, path);
  return !!rest && !rest.startsWith('..') && !isAbsolute(rest);
}

export function describeSources(cwd, files, mode = 'review') {
  if (!['review', 'edit'].includes(mode)) throw new Error('Mode attendu : review ou edit.');
  if (mode === 'edit' && !files.length) throw new Error('Une liste explicite de fichiers est requise pour modifier.');
  if (files.length > MAX_FILES) throw new Error(`Au plus ${MAX_FILES} fichiers explicites par mission.`);
  const root = realpathSync(cwd);
  const seen = new Set();
  let total = 0;
  return files.map((file, index) => {
    if (typeof file !== 'string' || !file.trim() || /[\r\n\0*?\[\]{}]/.test(file)) throw new Error(`Chemin de fichier invalide : ${file}`);
    if (mode === 'edit' && (isAbsolute(file) || /[()!:]/.test(file))) throw new Error(`Chemin de modification non borné : ${file}`);
    const candidate = resolve(root, file);
    if (!isAbsolute(file) && !inside(root, candidate)) throw new Error(`Chemin relatif hors du dossier de travail : ${file}`);
    const source = realpathSync(candidate);
    if (!isAbsolute(file) && !inside(root, source)) throw new Error(`Lien sortant du dossier de travail : ${file}`);
    if (mode === 'edit' && !inside(root, source)) throw new Error(`Chemin de modification non borné : ${file}`);
    const key = process.platform === 'win32' ? source.toLowerCase() : source;
    if (seen.has(key)) throw new Error(`Fichier répété : ${file}`);
    seen.add(key);
    const info = statSync(source);
    if (!info.isFile()) throw new Error(`Fichier ordinaire requis : ${file}`);
    const image = /\.(?:png|jpe?g|webp|gif|avif)$/i.test(extname(source));
    const cap = image ? MAX_IMAGE_BYTES : MAX_TEXT_BYTES;
    if (info.size > cap) throw new Error(`Fichier trop gros : ${file} (${info.size} octets ; maximum ${cap}).`);
    total += info.size;
    if (total > MAX_TOTAL_SOURCE_BYTES) throw new Error(`Fichiers fournis trop volumineux : ${total} octets ; maximum ${MAX_TOTAL_SOURCE_BYTES}.`);
    const staged = inside(root, source) ? relative(root, source).replaceAll('\\', '/') : `attachments/${String(index + 1).padStart(2, '0')}-${basename(source)}`;
    return { source, staged, size: info.size, digest: createHash('sha256').update(readFileSync(source)).digest('hex') };
  });
}

export function stageSources(directory, sources) {
  for (const file of sources) {
    const target = resolve(directory, file.staged);
    mkdirSync(dirname(target), { recursive: true });
    copyFileSync(file.source, target);
    if (hashFile(target) !== file.digest) throw new Error(`Le fichier ${file.source} a changé pendant sa copie ; relancer la mission.`);
  }
}

function hashFile(path) { return createHash('sha256').update(readFileSync(path)).digest('hex'); }

export function applyStagedEdits(directory, sources) {
  const changed = sources.filter(file => hashFile(resolve(directory, file.staged)) !== file.digest);
  for (const file of changed) {
    if (hashFile(file.source) !== file.digest) throw new Error(`Conflit : ${file.source} a changé pendant la mission. Copies conservées dans ${directory}.`);
  }
  for (const file of changed) copyFileSync(resolve(directory, file.staged), file.source);
  return changed.map(file => file.source);
}

export function checkedOutputPath(output, brief, sources) {
  const destination = resolve(output);
  const key = path => {
    const canonical = existsSync(path) ? realpathSync(path) : resolve(path);
    return process.platform === 'win32' ? canonical.toLowerCase() : canonical;
  };
  if ([resolve(brief), ...sources.map(file => file.source)].some(path => key(path) === key(destination))) {
    throw new Error('Le fichier de sortie ne peut pas écraser le brief ou un fichier fourni.');
  }
  return destination;
}

function shellQuote(value) { return `'${value.replaceAll('\\', '/').replaceAll("'", "'\"'\"'")}'`; }

export function lunaRelayCommand(cwd, directory) {
  const relay = join(dirname(fileURLToPath(import.meta.url)), 'luna-review.mjs');
  return `node ${shellQuote(relay)} --tasks ${shellQuote(join(directory, 'luna-tasks.json'))} --output-dir ${shellQuote(join(directory, 'luna'))} --cwd ${shellQuote(cwd)}`;
}

export function claudeArguments({ mode = 'review', files = [], luna = false, maxTurns = mode === 'edit' ? 12 : 4, relayCommand } = {}) {
  if (!['review', 'edit'].includes(mode)) throw new Error('Mode attendu : review ou edit.');
  if (!Number.isSafeInteger(maxTurns) || maxTurns < 1) throw new Error('--max-turns doit être un entier positif sûr.');
  if (mode === 'edit' && !files.length) throw new Error('Une liste explicite de fichiers est requise pour modifier.');
  if (luna && !relayCommand) throw new Error('Commande Luna ciblée requise.');
  const allowed = [];
  const tools = [];
  if (files.length || luna || mode === 'edit') tools.push('Read');
  if (mode === 'edit') {
    tools.push('Edit', 'Write');
    for (const file of files) {
      if (isAbsolute(file) || !file || /(^|\/)\.\.($|\/)|[\\*?\[\]{}()!:\r\n]/.test(file)) throw new Error(`Chemin de modification non borné : ${file}`);
      // Claude Code consults Edit(path) for both Edit and Write.
      allowed.push(`Edit(./${file})`);
    }
  }
  if (luna) {
    if (!tools.includes('Write')) tools.push('Write');
    tools.push('Bash');
    allowed.push('Edit(./luna-tasks.json)', `Bash(${relayCommand})`);
  }
  // In dontAsk mode, listing Read in --tools does not approve its use.
  // --restricted confines it to the isolated mission directory.
  if (tools.includes('Read')) allowed.unshift('Read');
  const args = ['--print', '--safe-mode', '--restricted', '--model', 'claude-opus-5-5', '--effort', 'max',
    '--output-format', 'json', '--no-session-persistence', '--permission-mode', 'dontAsk',
    '--permission-prompts', 'none', '--strict-mcp-config', '--mcp-config', '{"mcpServers":{}}',
    '--disallowedTools', 'mcp__*', '--max-turns', String(maxTurns), '--tools', tools.join(',')];
  if (allowed.length) args.push('--allowedTools', ...allowed);
  return args;
}

export function classifyClaudeOutcome({ code, response, errorText = '' }) {
  const subtype = String(response?.subtype || '').toLowerCase();
  if (/max[_ -]?turns/.test(subtype)) return 'turn_budget_reached';
  if (code === 0 && response && !response.is_error && !subtype.startsWith('error')) return 'completed';
  const detail = [subtype, response?.result, errorText].filter(Boolean).join(' ').toLowerCase();
  if (/max[_ -]?turns|maximum (?:number of )?(?:agentic )?turns|turn limit|tour[s]? maximum|budget de tours/.test(detail)) return 'turn_budget_reached';
  if (/usage limit|quota|rate limit|you.ve (?:hit|reached) (?:your |the )?(?:(?:session|weekly|opus|sonnet|individual) )?limit|spend limit|credit limit|limite d.utilisation/.test(detail)) return 'quota_reached';
  return 'claude_error';
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

function cliStatus(exe, env) {
  const version = spawnSync(exe, ['--version'], { encoding: 'utf8', windowsHide: true, env });
  const numbers = version.stdout?.match(/(\d+)\.(\d+)\.(\d+)/)?.slice(1).map(Number);
  if (version.status !== 0 || !numbers || numbers[0] < 2 || (numbers[0] === 2 && (numbers[1] < 1 || (numbers[1] === 1 && numbers[2] < 280)))) {
    throw new Error('Claude Code 2.1.280 ou ultérieur est requis pour Opus 5.5.');
  }
  const auth = spawnSync(exe, ['auth', 'status', '--json'], { encoding: 'utf8', windowsHide: true, env });
  if (auth.status !== 0) throw new Error('Connexion Claude indisponible. Utiliser claude auth login --claudeai.');
  return { version: numbers.join('.'), ...subscriptionStatus(JSON.parse(auth.stdout)), model: 'claude-opus-5-5', effort: 'max' };
}

function acquireClaudeLock() {
  const lock = join(tmpdir(), 'laffinee-claude-frontend.lock');
  if (existsSync(lock)) {
    const previous = Number(readFileSync(lock, 'utf8'));
    try { process.kill(previous, 0); throw new Error('Une revue Claude est déjà active.'); }
    catch (error) { if (error.code !== 'ESRCH') throw error; unlinkSync(lock); }
  }
  const handle = openSync(lock, 'wx'); writeFileSync(handle, String(process.pid)); closeSync(handle);
  return () => unlinkSync(lock);
}

async function main() {
  const options = parseLauncherOptions(process.argv.slice(2));
  const env = subscriptionEnvironment();
  if (options.diagnose) {
    console.log(JSON.stringify({ ...cliStatus(findClaude(), env), cwd: options.cwd }));
    return;
  }
  const brief = readBrief(options.brief);
  const sources = describeSources(options.cwd, options.files, options.mode);
  if (options.luna && sources.some(file => file.staged === 'luna-tasks.json' || file.staged.startsWith('luna/'))) {
    throw new Error('Les fichiers fournis ne doivent pas occuper luna-tasks.json ou luna/.');
  }
  const output = checkedOutputPath(options.output, options.brief, sources);
  const exe = findClaude();
  const status = cliStatus(exe, env);
  const previewDirectory = join(tmpdir(), 'laffinee-claude-preview');
  if (options.dryRun) {
    const relay = options.luna ? lunaRelayCommand(options.cwd, previewDirectory) : undefined;
    console.log(JSON.stringify({
      ...status, dryRun: true, cwd: options.cwd, mode: options.mode,
      maxTurns: options.maxTurns, briefBytes: Buffer.byteLength(brief),
      files: sources.map(({ source, staged, size }) => ({ source, staged, size })),
      args: claudeArguments({ mode: options.mode, files: sources.map(file => file.staged),
        luna: options.luna, maxTurns: options.maxTurns, relayCommand: relay }),
      output,
    }));
    return;
  }
  const release = acquireClaudeLock();
  let directory;
  let keepDirectory = false;
  try {
    directory = mkdtempSync(join(tmpdir(), 'laffinee-claude-input-'));
    stageSources(directory, sources);
    const relay = options.luna ? lunaRelayCommand(options.cwd, directory) : undefined;
    const args = claudeArguments({ mode: options.mode, files: sources.map(file => file.staged),
      luna: options.luna, maxTurns: options.maxTurns, relayCommand: relay });
    const lines = [
      'Mission unique. Réponds brièvement et clairement en français, avec les preuves utiles.',
      'N’explore pas le dépôt. Les fichiers nommés ci-dessous sont les seules entrées prévues pour cette mission.',
      options.mode === 'edit'
        ? 'Modifie seulement les fichiers nommés. Ce sont des copies ; le lanceur reporte les changements si les originaux sont inchangés.'
        : 'Revue en lecture seule ; ne modifie aucun fichier du projet.',
      ...sources.map(file => 'Fichier fourni : ' + file.staged + ' (' + file.size + ' octets).'),
    ];
    if (options.luna) {
      lines.push('Relais Luna facultatif : écris 1 à 9 missions {id,prompt} dans luna-tasks.json, puis exécute exactement : '
        + relay + '. Lis les résultats dans luna/. Une seule consultation Claude.');
    }
    if (!sources.length && !options.luna) lines.push('Tout le contexte utile est dans le brief. Aucun outil n’est disponible.');
    const prompt = lines.join('\n') + '\n\n' + brief;
    console.log(JSON.stringify({ ...status, mode: options.mode, maxTurns: options.maxTurns,
      briefBytes: Buffer.byteLength(brief), providedFiles: sources.map(file => file.staged),
      output }));
    const child = spawn(exe, args, { cwd: directory, env, windowsHide: true, stdio: ['pipe', 'pipe', 'pipe'] });
    let result = '', errorText = '';
    child.stdout.setEncoding('utf8'); child.stdout.on('data', chunk => { result += chunk; });
    child.stderr.setEncoding('utf8'); child.stderr.on('data', chunk => { errorText += chunk; });
    child.stdin.end(prompt);
    const code = await new Promise((done, reject) => { child.on('error', reject); child.on('close', done); });
    writeFileSync(output, result, 'utf8');
    let response;
    try { response = JSON.parse(result); } catch { /* stderr can contain the quota reason */ }
    const outcome = classifyClaudeOutcome({ code, response, errorText });
    if (outcome !== 'completed') {
      if (options.mode === 'edit') keepDirectory = true;
      const label = outcome === 'turn_budget_reached' ? 'Budget de ' + options.maxTurns + ' tours atteint'
        : outcome === 'quota_reached' ? 'Quota Claude atteint' : 'Claude n’a pas terminé';
      throw new Error('[' + outcome + '] ' + label + '. Résultat : ' + output + '.'
        + (keepDirectory ? ' Copies : ' + directory + '.' : '') + ' ' + String(response?.result || errorText).slice(-500));
    }
    const changedFiles = options.mode === 'edit' ? applyStagedEdits(directory, sources) : [];
    console.log(JSON.stringify({ completed: true, output, turns: response.num_turns,
      maxTurns: options.maxTurns, models: Object.keys(response.modelUsage || {}), changedFiles }));
  } catch (error) {
    if (options.mode === 'edit') keepDirectory = true;
    throw error;
  } finally {
    try { if (directory && !keepDirectory) rmSync(directory, { recursive: true, force: true }); }
    finally { release(); }
  }
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch(error => { console.error(error.message); process.exitCode = 1; });
}
