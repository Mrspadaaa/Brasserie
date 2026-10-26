// Voie g2a-departage : preuve « à l'octet près ». voies.ts de HEAD (copié, imports réécrits en chemins absolus) contre voies.ts actuel,
// option de départage par défaut. Lancement : npx vite-node scripts/eval-hop/departage-octet.ts
// La copie de HEAD va dans work/.../g2a-departage/tmp-head/ (vite-node ne charge pas hors de la racine) ; elle n'est pas un livrable.
import { createHash } from 'node:crypto';
import { execSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { creerMoteur } from '../../src/domain/hopIndex/v4/moteur';
import { CATALOGUE } from '../../src/domain/hopIndex/v4/data';
import * as neuf from '../../src/domain/hopIndex/v4/voies';
import type { Recipe } from '../../src/domain/hopIndex/v4/recipe';

const RACINE = resolve('.').split('\\').join('/');
const DOSSIER = `${RACINE}/work/missions/2026-10-25-integration-houblons/voies/g2a-departage/tmp-head`;
const tete = execSync('git show HEAD:src/domain/hopIndex/v4/voies.ts', { maxBuffer: 1 << 26 }).toString('utf8');
mkdirSync(DOSSIER, { recursive: true });
writeFileSync(`${DOSSIER}/voies-head.ts`, tete.split("from './").join(`from '${RACINE}/src/domain/hopIndex/v4/`).split("from '../").join(`from '${RACINE}/src/domain/hopIndex/`));
const head = (await import(/* @vite-ignore */ `${DOSSIER}/voies-head.ts`)) as typeof neuf;

const R21C: Recipe = { name: 'Hazy', styleCode: '21C', volumeL: 20, og: 1.058, boilMin: 60, yeastId: 'fermentis-us05', ebc: 8, additions: [
  { id: 'a1', hopKey: 'beermaverick-nugget', moment: 'b60', grams: 20 }, { id: 'a2', hopKey: 'beermaverick-cascade', moment: 'dryActive', grams: 80 }] };
const R16D: Recipe = { name: 'Stout', styleCode: '16D', volumeL: 20, og: 1.066, boilMin: 60, yeastId: 'fermentis-us05', ebc: 70, additions: [{ id: 'a1', hopKey: 'beermaverick-nugget', moment: 'b60', grams: 46 }] };
const m = creerMoteur({ catalogue: CATALOGUE, stock: [] }), mStock = creerMoteur();
const dirs = [{ citrus: 1 }, { tropical: 1 }, { floral: 1 }, { resin: -1 }, { citrus: 1, resin: -1 }, {}];
const GRAND = { maxBuy: 400, limit: 2000, buyLimit: 2000, perHop: 100 };
const opts = [{}, { leviersLevure: true, assemblages: false }, { ...GRAND, moments: ['dryActive' as const], assemblages: false }, { ...GRAND, moments: ['b10' as const, 'wp' as const], assemblages: true }];
let nb = 0, octets = 0;
const h1 = createHash('sha256'), h2 = createHash('sha256');
for (const mo of [m, mStock]) for (const r of [R21C, R16D]) for (const d of dirs) for (const o of opts) {
  const a = JSON.stringify(mo.dans(() => head.proposeVoies(r, d, o))), b = JSON.stringify(mo.dans(() => neuf.proposeVoies(r, d, o)));
  h1.update(a); h2.update(b); nb++; octets += a.length;
  if (a !== b) { console.log('DIFFERENCE', JSON.stringify(d), JSON.stringify(o)); process.exit(1); }
}
console.log(`${nb} appels identiques (${octets} octets) ; sha256 HEAD ${h1.digest('hex')} ; sha256 actuel ${h2.digest('hex')}`);
