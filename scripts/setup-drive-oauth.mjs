// Reuse Firebase's Google web client, preserving its existing private file grants.
// Dry-run by default. Secrets move between Google APIs, never to disk/output.
import { createRequire } from 'node:module';
import { randomBytes } from 'node:crypto';
const require = createRequire(import.meta.url), auth = require('firebase-tools/lib/auth.js');
const project = process.argv.find(value => value.startsWith('--project='))?.slice(10);
if (!project || !/^[a-z][a-z0-9-]+$/.test(project)) throw Error('Explicit --project=<project> required');
const apply = process.argv.includes('--apply');
const account = auth.getProjectDefaultAccount(process.cwd());
if (!account) throw Error('Firebase CLI sign-in required');
const token = await auth.getAccessToken(account.tokens.refresh_token, ['https://www.googleapis.com/auth/cloud-platform']);
async function request(url, body, allowMissing = false) {
  const response = await fetch(url, { method: body ? 'POST' : 'GET', headers: { Authorization: `Bearer ${token.access_token}`, ...(body ? { 'Content-Type': 'application/json' } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}) });
  if (allowMissing && response.status === 404) return null;
  if (!response.ok) throw Error(`Google configuration HTTP ${response.status}`);
  return response.json();
}
const provider = await request(`https://identitytoolkit.googleapis.com/admin/v2/projects/${project}/defaultSupportedIdpConfigs/google.com`);
if (!provider.enabled || !provider.clientId || !provider.clientSecret) throw Error('Google sign-in provider is incomplete');
const base = `https://secretmanager.googleapis.com/v1/projects/${project}/secrets`;
const previous = await request(`${base}/DRIVE_OAUTH_CONFIG/versions/latest:access`, undefined, true);
const old = previous?.payload?.data ? JSON.parse(Buffer.from(previous.payload.data, 'base64').toString('utf8')) : null;
if (old?.clientId === provider.clientId && old?.clientSecret === provider.clientSecret && Buffer.from(old?.encryptionKey || '', 'base64').length === 32) {
  console.log('Drive OAuth server configuration is already current.');
} else if (!apply) {
  console.log('Ready: same Firebase Google client; encrypted offline grants; server secret will be created/updated. Run with --apply.');
} else {
  if (!await request(`${base}/DRIVE_OAUTH_CONFIG`, undefined, true)) await request(`${base}?secretId=DRIVE_OAUTH_CONFIG`, { replication: { userManaged: { replicas: [{ location: 'europe-west6' }] } } });
  const value = { clientId: provider.clientId, clientSecret: provider.clientSecret, encryptionKey: old?.encryptionKey || randomBytes(32).toString('base64') };
  await request(`${base}/DRIVE_OAUTH_CONFIG:addVersion`, { payload: { data: Buffer.from(JSON.stringify(value)).toString('base64') } });
  console.log('Drive OAuth server configuration saved in Secret Manager. No secrets written locally.');
}
