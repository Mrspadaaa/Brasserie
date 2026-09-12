import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { sha } from './yeast-catalogue/fetch.mjs';
const dir = resolve('.codex-remote-attachments/yeast-catalogue/pdf'); await mkdir(dir, { recursive: true });
const sources = [
  ['omega', 'Omega Yeast', 'https://cdn.shopify.com/s/files/1/0800/8505/7790/files/Probrew_Strain_Directory-WEB.pdf?v=1786394512'],
  ['whc', 'WHC Lab', 'https://cdn.shopify.com/s/files/1/0891/5124/2579/files/brewing-distilling-product-catalogue-2026-v1.0.pdf?v=1772640074'],
  ['yeast-bay', 'The Yeast Bay', 'https://www.theyeastbay.com/s/TYB_StrainGuide_2025.pdf'],
  ['doemens', 'Doemens', 'https://doemens.org/uploads/2026/02/brochure-yeast-bank-and-mircorganism-collection-2026.pdf'],
  ['vlb', 'VLB Berlin', 'https://www.vlb-berlin.org/sites/default/files/2022-12/List%20of%20brewers%20yeast%20strains%20and%20prices_2023.pdf'],
  ['maurivin', 'AB Biotek / Maurivin', 'https://www.maurivin.com/perch/resources/maurivin-catalogue-november-2025-en-repro-web.pdf'],
];
for (const [id, name, url] of sources) {
  try {
    const file = resolve(dir, id + '.pdf'), meta = resolve(dir, id + '.json');
    if (!process.argv.includes('--refresh')) try { const r = JSON.parse(await readFile(meta)); if (r.sha256 === sha(await readFile(file))) { console.log(`${id}: cached`); continue; } } catch {}
    const response = await fetch(url, { signal: AbortSignal.timeout(45000) }); if (!response.ok) throw Error(`HTTP ${response.status}`);
    const body = Buffer.from(await response.arrayBuffer()); if (!body.subarray(0, 5).equals(Buffer.from('%PDF-'))) throw Error('Not a PDF');
    const receipt = { id, name, url, retrievedAt: new Date().toISOString(), sha256: sha(body), etag: response.headers.get('etag'), lastModified: response.headers.get('last-modified') };
    await writeFile(file, body); await writeFile(meta, JSON.stringify(receipt, null, 2)); console.log(`${id}: ${body.length} bytes`);
  } catch (e) { console.log(`${id}: ${e.message}`); await writeFile(resolve(dir, id + '.error.json'), JSON.stringify({ url, error: e.message, checkedAt: new Date().toISOString() })); }
}
