#!/usr/bin/env node
// D368 : avant un déploiement, le paquet de production doit porter les écrans Houblons allumés (`VITE_HOP_V4=on`, D71 à D74).
// Le 02.11, des déploiements construits sans la variable les ont éteints en ligne sans que personne le voie.
// D378 (08.11, « Baisse à 20 et go ») : l'enrichissement des fiches par l'IA est allumé (`VITE_ENRICHISSEMENT_IA=production`).
// Usage : node scripts/check-build-flags.mjs [dist]  → sort 1 si un drapeau manque ou porte une autre valeur. `VITE_ENRICHISSEMENT_IA=eteinte`
// au build est un choix exprès : le contrôle l'accepte et le dit.
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const dist = process.argv[2] ?? 'dist';
const assets = join(dist, 'assets');
const textes = readdirSync(assets).filter(f => f.endsWith('.js')).map(f => [f, readFileSync(join(assets, f), 'utf8')]);
const valeursDe = (nom) => textes.flatMap(([f, t]) => [...t.matchAll(new RegExp(`${nom}:([^,}]*)`, 'g'))].map(m => `${f} → ${m[1]}`));
const DRAPEAUX = [
  { nom: 'VITE_HOP_V4', attendu: ['"on"'], dit: 'écrans Houblons allumés' },
  { nom: 'VITE_ENRICHISSEMENT_IA', attendu: ['"production"', '"eteinte"'], dit: 'enrichissement des fiches (production ou éteint exprès)' },
];
let ok = true;
for (const d of DRAPEAUX) {
  const v = valeursDe(d.nom);
  const bon = v.length > 0 && v.every(x => d.attendu.some(a => x.endsWith(a)));
  ok &&= bon;
  console.log(bon ? `DRAPEAUX OK — ${d.dit} (${v.join(' ; ')})` : `DRAPEAUX ECHEC — ${d.nom} absent ou inattendu dans ${dist} (${v.join(' ; ') || 'drapeau introuvable'})`);
}
process.exit(ok ? 0 : 1);
