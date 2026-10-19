// Lot 20 · les fiches g1 de Citra, Cascade, Galaxy et Idaho 7, par le moteur du prototype (hopSheet),
// avec le même contexte que buildPack (recettes S1, S4, S5 ; base d'IBU S1). Citra T-90 n'est pas dans
// pack-fiches.json (seul Citra cryo y est) : sa fiche sort ainsi du même calcul que les autres.
// Usage (depuis prototypes/houblons-v4) : npx vite-node <ce fichier>
import fs from 'node:fs';
import { hopSheet, hopRole, NO_GOUTS } from '../../../../../../prototypes/houblons-v4/src/engine';
import { s1Recipe, buildAll } from '../../../../../../prototypes/houblons-v4/src/pack/buildPack';

const CLES = ['beermaverick-citra', 'beermaverick-cascade', 'beermaverick-galaxy', 'beermaverick-idaho-7'];
const { pack } = buildAll();
const sc = (pack as unknown as { scenarios: Record<string, { recipe: Parameters<typeof hopSheet>[1]['ibuBase'] }> }).scenarios;
const ctx = { recipes: ['S1', 'S4', 'S5'].map((scenario) => ({ scenario, recipe: sc[scenario].recipe })), ibuBase: s1Recipe(), gouts: NO_GOUTS };
const fiches = CLES.map((k) => ({ ...hopSheet(k, ctx), role: hopRole(k) }));
const out = new URL('./fiches-h.json', import.meta.url);
fs.writeFileSync(out, JSON.stringify({ _: 'hopSheet du prototype, 19.10.2026, même contexte que buildPack', fiches }, null, 1));
console.log('écrit fiches-h.json : ' + fiches.map((f) => f.name).join(', '));
