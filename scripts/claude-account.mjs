// Human-facing native CLI entry point. Separate profiles; no credential copying.
import { spawn } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { claudeAccountProfile, cliStatus, findClaude, subscriptionEnvironment } from './claude-frontend.mjs';
import { admitClaudeLease, assertTeamOnlyNewClaudeLot } from './claude-coordination.mjs';

export const INTERACTIVE_ARGUMENTS = Object.freeze(['--model', 'claude-opus-5-5', '--effort', 'xhigh']);
const LOGIN_ARGUMENTS = Object.freeze(['auth', 'login', '--claudeai']);

export function accountCommand(input) {
  if (!input.length || input.length > 2) throw new Error('Usage : node scripts/claude-account.mjs team|pro [status|login|chat]');
  const [account, command = 'chat'] = input;
  claudeAccountProfile(account);
  if (!['status', 'login', 'chat'].includes(command)) throw new Error('Commande attendue : status, login ou chat.');
  return { account, command };
}

function settle(lease, outcome) {
  try { lease.release({ outcome }); }
  catch { console.error(`Lease Claude ${lease.leaseId} à vérifier manuellement : node scripts/claude-coordination.mjs status.`); }
}

function runInteractive(launch, exe, args, options, lease) {
  return new Promise((resolveCode, reject) => {
    let child;
    try { child = launch(exe, args, options); }
    catch (error) { reject(Object.assign(error, { processCreated: false })); return; }
    let started = false;
    child.once('spawn', () => {
      started = true;
      try { lease.markRunning(child.pid); }
      catch { console.error(JSON.stringify({ diagnostic: 'claude_lease_update_failed', leaseId: lease.leaseId })); }
    });
    child.once('error', error => {
      // Only a launch that never produced a process frees the lease; otherwise wait for close.
      if (!started && child.pid === undefined) reject(Object.assign(error, { processCreated: false }));
    });
    child.once('close', code => resolveCode(code ?? 1));
  });
}

// Dependencies are injectable for local tests only.
export async function main(input = process.argv.slice(2), dependencies = {}) {
  const { account, command } = accountCommand(input);
  if (command === 'chat') assertTeamOnlyNewClaudeLot(account);
  const env = subscriptionEnvironment(dependencies.env || process.env, { account });
  const exe = (dependencies.findClaude || findClaude)();
  const readStatus = dependencies.cliStatus || cliStatus;
  const launch = dependencies.spawn || spawn;
  if (command === 'status') {
    console.log(JSON.stringify(readStatus(exe, env, account)));
    return;
  }
  // A login is invoked explicitly by the human. Other commands require the
  // selected plan and config directory before opening any model conversation.
  if (command !== 'login') console.log(JSON.stringify(readStatus(exe, env, account)));
  // Same machine-wide admission as batch lots, before any process exists. The TUI
  // cannot declare its files or a later /resume, so it is exclusive; a login
  // only reserves its own profile and never counts as an Opus lot.
  const lease = admitClaudeLease(command === 'login'
    ? { kind: 'login', account }
    : { kind: 'interactive', account, model: INTERACTIVE_ARGUMENTS[1], effort: INTERACTIVE_ARGUMENTS[3] },
  dependencies.coordination);
  // The native TUI handles Ctrl+C itself; this wrapper must survive to release its lease.
  const keepWrapper = () => {};
  process.on('SIGINT', keepWrapper);
  let code;
  try {
    lease.markSpawning();
    if (command === 'login') mkdirSync(claudeAccountProfile(account, env.USERPROFILE || env.HOME).configDirectory, { recursive: true });
    code = await runInteractive(launch, exe, [...(command === 'login' ? LOGIN_ARGUMENTS : INTERACTIVE_ARGUMENTS)], {
      cwd: resolve(dirname(fileURLToPath(import.meta.url)), '..'),
      env, windowsHide: true, stdio: 'inherit',
    }, lease);
  } catch (error) {
    if (error?.processCreated !== true) settle(lease, 'not_started');
    throw error;
  } finally {
    process.off('SIGINT', keepWrapper);
  }
  settle(lease, code === 0 ? 'completed' : 'exited');
  if (code !== 0) { process.exitCode = code; return; }
  if (command === 'login') console.log(JSON.stringify(readStatus(exe, env, account)));
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch(error => { console.error(error.message); process.exitCode = 1; });
}
