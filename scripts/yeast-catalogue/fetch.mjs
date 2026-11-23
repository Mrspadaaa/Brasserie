import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createRequire } from 'node:module';
const require = createRequire(new URL('../../functions/package.json', import.meta.url));
export const { load } = require('cheerio');
export const cacheDir = resolve('.codex-remote-attachments/yeast-catalogue/cache');
export const sha = text => createHash('sha256').update(text).digest('hex');
export const compact = text => String(text ?? '').replace(/\s+/g, ' ').trim();
export const plain = html => compact(load(html ?? '').text());
const lastRequest = new Map();
export async function get(url, { delay = 2200, refresh = process.argv.includes('--refresh') } = {}) {
  await mkdir(cacheDir, { recursive: true });
  const file = resolve(cacheDir, sha(url)), receiptFile = file + '.json';
  if (!refresh) try {
    const receipt = JSON.parse(await readFile(receiptFile, 'utf8')), body = await readFile(file + '.body', 'utf8');
    if (receipt.url === url && receipt.sha256 === sha(body) && !/Your connection needs to be verified|challenge-error-text/.test(body)) return { body, receipt };
  } catch { /* An absent or corrupt cache is fetched again. */ }
  const host = new URL(url).host, wait = delay - (Date.now() - (lastRequest.get(host) ?? 0));
  if (wait > 0) await new Promise(r => setTimeout(r, wait));
  lastRequest.set(host, Date.now());
  const response = await fetch(url, { signal: AbortSignal.timeout(35000), headers: { 'User-Agent': 'Brasserie-LAffinee-reference-catalogue/1.0' } });
  if (!response.ok) { const error = Error(`HTTP ${response.status}: ${url}`); error.status = response.status; error.retryAfter = response.headers.get('retry-after'); throw error; }
  const body = await response.text();
  if (/Your connection needs to be verified|challenge-error-text/.test(body)) { const error = Error(`Verification required: ${url}`); error.status = 403; throw error; }
  const receipt = { url, finalUrl: response.url, retrievedAt: new Date().toISOString(), sha256: sha(body), etag: response.headers.get('etag'), lastModified: response.headers.get('last-modified') };
  await writeFile(file + '.body', body); await writeFile(receiptFile, JSON.stringify(receipt, null, 2));
  return { body, receipt };
}
export const links = (body, base, predicate) => [...new Set(load(body)('a[href]').map((_i, e) => {
  try { return new URL(e.attribs.href, base).href.split('#')[0]; } catch { return ''; }
}).get().filter(predicate))];
