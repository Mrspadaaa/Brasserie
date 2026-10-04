// Human-facing native CLI entry point. Separate profiles; no credential copying.
import { spawn } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { claudeAccountProfile, cliStatus, findClaude, subscriptionEnvironment } from './claude-frontend.mjs';

export function accountCommand(input) {
  if (!input.length || input.length > 2) throw new Error('Usage : node scripts/claude-account.mjs team|pro [status|login|chat]');
  const [account, command = 'chat'] = input;
  claudeAccountProfile(account);
  if (!['status', 'login', 'chat'].includes(command)) throw new Error('Commande attendue : status, login ou chat.');
  return { account, command };
}

export async function main(input = process.argv.slice(2)) {
  const { account, command } = accountCommand(input);
  const env = subscriptionEnvironment(process.env, { account });
  const exe = findClaude();
  if (command === 'status') {
    console.log(JSON.stringify(cliStatus(exe, env, account)));
    return;
  }
  // A login is invoked explicitly by the human. Other commands require the
  // selected plan and config directory before opening any model conversation.
  if (command === 'login') mkdirSync(claudeAccountProfile(account, env.USERPROFILE || env.HOME).configDirectory, { recursive: true });
  else console.log(JSON.stringify(cliStatus(exe, env, account)));
  const args = command === 'login'
    ? ['auth', 'login', '--claudeai']
    : ['--model', 'claude-opus-5-5', '--effort', 'xhigh'];
  const code = await new Promise((resolveCode, reject) => {
    const child = spawn(exe, args, {
      cwd: resolve(dirname(fileURLToPath(import.meta.url)), '..'),
      env, windowsHide: true, stdio: 'inherit',
    });
    child.once('error', reject);
    child.once('close', code => resolveCode(code ?? 1));
  });
  if (code !== 0) { process.exitCode = code; return; }
  if (command === 'login') console.log(JSON.stringify(cliStatus(exe, env, account)));
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch(error => { console.error(error.message); process.exitCode = 1; });
}
