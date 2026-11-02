// Sonde jetable : quelles lectures du dépôt portent controls.sum.base === 'HT' (comptes et chemins seulement).
import { readFileSync } from 'node:fs';
const REELS = 'work/finalisation-tickets-2026-10-08/H13-reels';
for (const f of ['banc-f5-F', 'banc-k5-A', 'banc-k5-B2', 'banc-k5-C']) {
  const j = JSON.parse(readFileSync(`${REELS}/${f}/results.json`, 'utf8'));
  const marche = (o, chemin) => {
    if (!o || typeof o !== 'object') return;
    if (o.controls?.sum?.base === 'HT') console.log(f, chemin.join('.'), 'status', o.controls.sum.status, 'items', o.items?.length);
    for (const [k, v] of Object.entries(o)) if (v && typeof v === 'object' && chemin.length < 8) marche(v, [...chemin, k]);
  };
  marche(j, []);
}
