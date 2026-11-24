/** Sortie compacte : `npx tsx <ce fichier> 6 34` : nom | prix | valeurs (nom=valeur unité) | étapes (nom: détail). */
import fs from 'node:fs';
import path from 'node:path';
import { lireLien } from '../../../../../functions/src/lireLien';
import { fetchRejoue, BANC } from '../../../../../scripts/banc-liens';

const caps = new Map<number, any>();
for (const f of ['capture.json', 'capture-ajout.json']) {
  const p = path.join(BANC, 'pages', f);
  if (fs.existsSync(p)) for (const c of JSON.parse(fs.readFileSync(p, 'utf8')).pages) if (c) caps.set(c.n, c);
}
const sansEtapes = process.argv.includes('--sans-etapes');
for (const arg of process.argv.slice(2).filter((a) => /^\d+$/.test(a))) {
  const n = Number(arg);
  const c = caps.get(n);
  const l = await lireLien(c.lien, { fetchPage: fetchRejoue(c, n), maintenant: 1, cours: async () => ({ taux: 0.93, date: '2026-11-23' }) as any });
  console.log(`--- ${n} ${l.statut} | ${l.nom ?? ''} | ${l.prix ?? ''} ${l.devise ?? ''} | liv ${JSON.stringify(l.livraison ?? null)}`);
  for (const v of l.valeurs ?? []) console.log(`   ${v.nom} = ${v.valeur}${v.unite ? ' [' + v.unite + ']' : ''}`);
  if (!sansEtapes) for (const e of l.etapes ?? []) console.log(`   (${e.nom}/${e.statut}) ${e.detail ?? ''}`);
}
