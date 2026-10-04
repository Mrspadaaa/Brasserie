import test from 'node:test';
import assert from 'node:assert/strict';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { claudeAccountProfile, subscriptionEnvironment, validateClaudeAccountProfile, parseLauncherOptions } from './claude-frontend.mjs';
import { accountCommand } from './claude-account.mjs';

test('Team retains its current native directory and Pro uses a separate directory', () => {
  const home = join(tmpdir(), 'account-routing-fixture');
  const team = claudeAccountProfile('team', home);
  const pro = claudeAccountProfile('pro', home);
  assert.equal(team.configDirectory, join(home, '.claude'));
  assert.equal(pro.configDirectory, join(home, '.claude-pro'));
  assert.notEqual(team.configDirectory, pro.configDirectory);
  assert.throws(() => claudeAccountProfile('unknown', home), /team ou pro/);
});

test('profile routing affects only the child and cannot inherit the other login or token', () => {
  const home = join(tmpdir(), 'account-env-fixture');
  const parent = { USERPROFILE: home, CLAUDE_CONFIG_DIR: 'old-profile',
    CLAUDE_CODE_OAUTH_TOKEN: 'PRIVATE_TEST_VALUE', ANTHROPIC_API_KEY: 'PRIVATE_TEST_API' };
  const team = subscriptionEnvironment(parent, { account: 'team' });
  const pro = subscriptionEnvironment(parent, { account: 'pro' });
  assert.equal(team.CLAUDE_CONFIG_DIR, undefined); // Preserve the original default account/settings layout.
  assert.equal(pro.CLAUDE_CONFIG_DIR, join(home, '.claude-pro'));
  for (const child of [team, pro]) {
    assert.equal(child.CLAUDE_CODE_OAUTH_TOKEN, undefined);
    assert.equal(child.ANTHROPIC_API_KEY, undefined);
    assert.equal(child.CLAUDE_CODE_EFFORT_LEVEL, 'xhigh');
  }
  assert.equal(parent.CLAUDE_CONFIG_DIR, 'old-profile');
  assert.equal(parent.CLAUDE_CODE_OAUTH_TOKEN, 'PRIVATE_TEST_VALUE');
});

test('matching email and organisation cannot conceal the wrong subscription or directory', () => {
  const home = join(tmpdir(), 'account-validation-fixture');
  const team = claudeAccountProfile('team', home);
  const pro = claudeAccountProfile('pro', home);
  const identity = { email: 'same@example.test', orgId: 'same-organisation' };
  validateClaudeAccountProfile({ ...identity, subscriptionType: 'team', configDirectory: team.configDirectory }, team);
  assert.throws(() => validateClaudeAccountProfile({ ...identity, subscriptionType: 'pro', configDirectory: team.configDirectory }, team), /abonnement team attendu/);
  assert.throws(() => validateClaudeAccountProfile({ ...identity, subscriptionType: 'team', configDirectory: pro.configDirectory }, team), /Répertoire/);
  assert.throws(() => validateClaudeAccountProfile({ ...identity, subscriptionType: 'team' }, team), /Répertoire/);
});

test('batch launcher defaults to Team and requires an explicit Pro selection', () => {
  assert.equal(parseLauncherOptions(['--brief', 'b', '--output', 'o']).account, 'team');
  assert.equal(parseLauncherOptions(['--account', 'pro', '--diagnose']).account, 'pro');
  assert.throws(() => parseLauncherOptions(['--account', 'auto', '--diagnose']), /team ou pro/);
  assert.deepEqual(accountCommand(['team']), { account: 'team', command: 'chat' });
  assert.deepEqual(accountCommand(['pro', 'login']), { account: 'pro', command: 'login' });
  assert.deepEqual(accountCommand(['pro', 'status']), { account: 'pro', command: 'status' });
  assert.throws(() => accountCommand(['pro', 'login', '--console']), /Usage/);
});
