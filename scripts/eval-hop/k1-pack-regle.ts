// Voie k1-substituer-60 (D196) : met à jour dans le pack du prototype (prototypes/houblons-v4/data) le seul champ `regle` (RANKING) que D196 a changé,
// sans régénérer le reste du pack (`npm run pack` relirait aussi voies.ts, que la voie s3 modifie en même temps). Même écriture que build-pack.ts : JSON.stringify + '\n'.
//   npx vite-node scripts/eval-hop/k1-pack-regle.ts            : écrit
//   npx vite-node scripts/eval-hop/k1-pack-regle.ts -- --test  : vérifie seulement que l'aller-retour JSON des fichiers actuels est à l'octet près (sinon rien n'est écrit)
import fs from 'node:fs';
import path from 'node:path';
import { RANKING } from '../../src/domain/hopIndex/v4/substitution';

const seulementTest = process.argv.includes('--test');
const dossier = path.resolve('prototypes/houblons-v4/data');
let remplaces = 0;
/** Remplace tout tableau `regle` d'un objet `substitution` (meta.substitution du pack, ou celui de pack-fiches). */
function pose(x: unknown): void {
  if (Array.isArray(x)) { x.forEach(pose); return; }
  if (!x || typeof x !== 'object') return;
  const o = x as Record<string, unknown>;
  if (Array.isArray(o.regle) && o.regle.length === RANKING.length && o.regle.every((l) => typeof l === 'string')) { o.regle = [...RANKING]; remplaces++; }
  for (const v of Object.values(o)) pose(v);
}
for (const f of ['pack-mini-protos.json', 'pack-fiches.json']) {
  const p = path.join(dossier, f);
  const brut = fs.readFileSync(p, 'utf8');
  const sansCR = brut.replace(/\r\n/g, '\n');
  const obj = JSON.parse(sansCR);
  if (JSON.stringify(obj) + '\n' !== sansCR) { console.log(`${f} : l'aller-retour JSON change le fichier, rien n'est écrit`); process.exitCode = 1; continue; }
  const avant = remplaces;
  if (seulementTest) { console.log(`${f} : aller-retour identique`); continue; }
  pose(obj);
  fs.writeFileSync(p, JSON.stringify(obj) + '\n');
  console.log(`${f} : ${remplaces - avant} règle(s) mise(s) à jour`);
}
