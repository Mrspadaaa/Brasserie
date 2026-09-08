import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
export const sourceCache = resolve('.codex-remote-attachments/hop-index/public-sources');
export const digest = value => createHash('sha256').update(value).digest('hex');
/** Cache bytes and their actual retrieval date. Never execute downloaded code. */
export async function readHopSource(url, { refresh = process.argv.includes('--refresh') } = {}) {
  await mkdir(sourceCache, { recursive: true });
  const path = resolve(sourceCache, digest(url));
  if (!refresh) {
    try {
      const content = await readFile(path, 'utf8'), metadata = JSON.parse(await readFile(path + '.json', 'utf8'));
      if (metadata.sha256 === digest(content)) return { content, ...metadata };
    } catch { /* First retrieval, or incomplete cache. */ }
  }
  const response = await fetch(url, { signal: AbortSignal.timeout(25000), headers: { 'User-Agent': 'LAffinee-Hop-Reference-Audit/1.0' } });
  if (!response.ok) throw Error(`Source non accessible (${response.status}) : ${url}`);
  const content = await response.text(), metadata = { url, retrievedAt: new Date().toISOString(), sha256: digest(content) };
  await writeFile(path, content); await writeFile(path + '.json', JSON.stringify(metadata, null, 2));
  return { content, ...metadata };
}
