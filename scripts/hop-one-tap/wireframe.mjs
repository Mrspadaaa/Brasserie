// Adaptateur : fils de fer houblons (docs/besoins/fils-de-fer-houblons.html), témoin positif.
// DIRECTION=A (liste sur l'étape, 0 toucher) ou B (liste en un toucher). Plein écran à 390 × 844.
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { productionHopStock, productionCatalogueOnly } from './stock-production.mjs';

export const stock = productionHopStock;
export const catalogueOnly = productionCatalogueOnly;
export const scope = '#phone';
export const settleMs = 300;
const direction = process.env.DIRECTION === 'B' ? 'B' : 'A';

export function setup({ repo }) {
  const src = fs.readFileSync(path.join(repo, 'docs/besoins/fils-de-fer-houblons.html'), 'utf8');
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'hop-one-tap-fdf-'));
  const file = path.join(dir, 'page.html');
  // Même squelette que la publication en Artifact.
  fs.writeFileSync(file, `<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"></head><body style="margin:0">${src}</body></html>`);
  return { file, dir };
}

export async function open(page, { ctx }) {
  await page.goto('file:///' + ctx.file.replace(/\\/g, '/'), { waitUntil: 'load' });
  await page.click('#dir' + direction);
  await page.click('#reset');
  await page.click('#full');
}

export function teardown(ctx) { fs.rmSync(ctx.dir, { recursive: true, force: true }); }
