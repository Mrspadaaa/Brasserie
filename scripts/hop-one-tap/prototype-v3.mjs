// Adaptateur : prototype houblons v3 (prototypes/houblons-v3/index.html), page autonome avec
// le stock de production intégré. Même squelette que la publication en Artifact.
// PROTO_STYLE=<id de style BJCP> choisit le style (défaut : foreign-extra-stout).
// V3_STATE=compare3 ouvre la comparaison de 3 houblons du stock ; V3_STATE=questions ouvre « Mes questions ».
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { productionHopStock, productionCatalogueOnly } from './stock-production.mjs';

export const stock = productionHopStock;
export const catalogueOnly = productionCatalogueOnly;
export const scope = '#app';
export const settleMs = 300;

export function setup({ repo }) {
  const src = fs.readFileSync(path.join(repo, 'prototypes/houblons-v3/index.html'), 'utf8');
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'hop-proto-v3-'));
  const file = path.join(dir, 'index.html');
  fs.writeFileSync(file, `<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"></head><body>${src}</body></html>`);
  return { file, dir };
}

export async function open(page, { ctx }) {
  await page.goto('file:///' + ctx.file.replace(/\\/g, '/'), { waitUntil: 'networkidle0' });
  if (process.env.PROTO_STYLE) await page.evaluate((s) => window.__v3.setStyle(s), process.env.PROTO_STYLE);
  if (process.env.V3_STATE === 'compare3') await page.evaluate(() => window.__v3.compare(['target', 'galaxy', 'nelson-sauvin']));
  if (process.env.V3_STATE === 'questions') await page.evaluate(() => window.__v3.openQuestions());
  await page.evaluate(() => document.fonts?.ready);
}

export function teardown(ctx) { fs.rmSync(ctx.dir, { recursive: true, force: true }); }
