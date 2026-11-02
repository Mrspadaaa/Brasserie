#!/usr/bin/env node
// D368 : avant un déploiement, le paquet de production doit porter les écrans Houblons allumés (`VITE_HOP_V4=on`, D71 à D74).
// Le 02.11, des déploiements construits sans la variable les ont éteints en ligne sans que personne le voie.
// Usage : node scripts/check-build-flags.mjs [dist]  → sort 1 si un paquet porte `VITE_HOP_V4:void 0` ou n'en porte aucun.
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const dist = process.argv[2] ?? 'dist';
const assets = join(dist, 'assets');
const valeurs = readdirSync(assets).filter(f => f.endsWith('.js'))
  .flatMap(f => [...readFileSync(join(assets, f), 'utf8').matchAll(/VITE_HOP_V4:([^,}]*)/g)].map(m => `${f} → ${m[1]}`));
const allume = valeurs.length > 0 && valeurs.every(v => v.endsWith('"on"'));
console.log(allume ? `DRAPEAUX OK — écrans Houblons allumés (${valeurs.join(' ; ')})`
  : `DRAPEAUX ECHEC — écrans Houblons éteints dans ${dist} (${valeurs.join(' ; ') || 'drapeau introuvable'}) : construire avec VITE_HOP_V4=on`);
process.exit(allume ? 0 : 1);
