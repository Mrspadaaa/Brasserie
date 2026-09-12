// Bounded research receipts. Public pages only; failures are recorded, never bypassed.
// No extracted forum opinion becomes a numerical model.
import { writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { readHopSource, sourceCache } from './hop-source-cache.mjs';
const sources = [
  'https://brewingscience.de/index.php/brewingscience/article/view/241',
  'https://www.nature.com/articles/s41467-024-46346-0',
  'https://www.barthhaas.com/company/news/news-article/bh/barthhaas-issues-hop-harvest-guide-2023',
  'https://www.lallemandbrewing.com/en/africa/resources/whats-new/practical-tips-for-thiol-boosting-recipes/',
  'https://www.lallemandbrewing.com/en/global/resources/whats-new/which-factors-influence-thiol-release-new-osu-thiol-research-published/',
  'https://brulosophy.com/2021/03/01/biotransformation-impact-of-dry-hopping-neipa-at-high-krausen-when-fermented-with-imperial-yeast-a24-dry-hop-exbeeriment-results/',
  'https://homebrewtalk.com/threads/biotransformation-hop-schedule.649715/',
  'https://aussiehomebrewer.com/threads/dry-hop-hop-creep-and-d-rest.101168/'
];
const receipts = [];
for (const url of sources) {
  try {
    const { content, ...receipt } = await readHopSource(url);
    receipts.push({ ...receipt, characters: content.length });
    console.log(`Source conservée : ${new URL(url).hostname}`);
  } catch (e) { receipts.push({ url, unavailable: e.message }); console.log(e.message); }
}
await writeFile(resolve(sourceCache, 'literature-manifest.json'), JSON.stringify(receipts, null, 2));
