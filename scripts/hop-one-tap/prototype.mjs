// Adaptateur : prototype houblons (prototypes/houblons/index.html), page autonome,
// avec le stock de production intégré. Même squelette que la publication en Artifact.
// PROTO_STYLE=<id de style> choisit le style de la recette (défaut : stout-export).
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { productionHopStock, productionCatalogueOnly } from './stock-production.mjs';

export const stock = productionHopStock;
export const catalogueOnly = productionCatalogueOnly;
export const scope = '#app';
export const settleMs = 300;

export function setup({ repo }) {
  const src = fs.readFileSync(path.join(repo, 'prototypes/houblons/index.html'), 'utf8');
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'hop-proto-'));
  const file = path.join(dir, 'index.html');
  fs.writeFileSync(file, `<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><style>:root{padding:env(safe-area-inset-top) 0 env(safe-area-inset-bottom)}body{margin:0}[hidden]{display:none!important}</style></head><body>${src}</body></html>`);
  return { file, dir };
}

export async function open(page, { ctx }) {
  await page.goto('file:///' + ctx.file.replace(/\\/g, '/'), { waitUntil: 'networkidle0' });
  // Style choisi, puis un rendu (toucher neutre sur « Mon stock ») pour l'afficher.
  if (process.env.PROTO_STYLE) { await page.evaluate((s) => { window.__proto.state.style = s; }, process.env.PROTO_STYLE); await page.click('#app [data-act="stock"]'); }
  await page.evaluate(() => document.fonts?.ready);
}

export function teardown(ctx) { fs.rmSync(ctx.dir, { recursive: true, force: true }); }
