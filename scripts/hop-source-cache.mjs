import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
/** Dossier du cache : HOP_SOURCE_CACHE s'il est posé, sinon celui du dépôt courant. */
export const sourceCache = resolve(process.env.HOP_SOURCE_CACHE || '.codex-remote-attachments/hop-index/public-sources');
export const digest = value => createHash('sha256').update(value).digest('hex');
/** Mode hors ligne : `--offline` ou HOP_SOURCE_OFFLINE=1. Aucun téléchargement, aucune écriture dans le cache. */
export const offlineMode = () => process.argv.includes('--offline') || process.env.HOP_SOURCE_OFFLINE === '1';
/**
 * Cache bytes and their actual retrieval date. Never execute downloaded code.
 * Hors ligne : une page absente ou altérée (reçu sha256 différent) lève une erreur ; `fetch` n'est jamais appelé et le cache
 * n'est ni créé ni écrit (il peut être celui d'un autre dépôt, en lecture seule).
 * Options : `cache` (dossier, sinon HOP_SOURCE_CACHE), `offline`, `refresh`.
 */
export async function readHopSource(url, { refresh = process.argv.includes('--refresh'), offline = offlineMode(), cache = sourceCache } = {}) {
  const path = resolve(cache, digest(url));
  if (offline) {
    if (refresh) throw Error('--offline et --refresh s’excluent : aucun téléchargement hors ligne.');
    let content, metadata;
    try { content = await readFile(path, 'utf8'); metadata = JSON.parse(await readFile(path + '.json', 'utf8')); }
    catch { throw Error(`Hors ligne : source absente du cache (${cache}) : ${url}`); }
    if (metadata.sha256 !== digest(content)) throw Error(`Hors ligne : reçu sha256 différent du contenu en cache : ${url}`);
    return { content, ...metadata };
  }
  await mkdir(cache, { recursive: true });
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
