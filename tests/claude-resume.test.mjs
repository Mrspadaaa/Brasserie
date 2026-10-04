import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseLauncherOptions, claudeArguments } from '../scripts/claude-frontend.mjs';
test('le pont reprend le même UUID avec ses copies et permissions bornées', () => {
  const uuid = 'f90e0c16-852c-4914-ad90-86f5021b427b';
  const options = parseLauncherOptions(['--brief', 'brief.md', '--output', 'out.json', '--resume', uuid]);
  assert.equal(options.resume, uuid);
  const args = claudeArguments({ mode: 'edit', files: ['src/ui/Example.tsx'], expert: true, resume: uuid });
  assert.equal(args[args.indexOf('--resume') + 1], uuid);
  assert(args.includes('--restricted')); assert(args.includes('--safe-mode')); assert(args.includes('--permission-prompts'));
  assert.throws(() => parseLauncherOptions(['--brief', 'brief.md', '--output', 'out.json', '--resume', '../other']), /UUID/);
});
