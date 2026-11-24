/** Montre la lecture (sans IA) de liens du banc : `npx tsx <ce fichier> 22 61 34`. */
import fs from 'node:fs';
import path from 'node:path';
import { lireLien } from '../../../../../functions/src/lireLien';
import { fetchRejoue, BANC } from '../../../../../scripts/banc-liens';

const caps = new Map<number, any>();
for (const f of ['capture.json', 'capture-ajout.json']) {
  const p = path.join(BANC, 'pages', f);
  if (fs.existsSync(p)) for (const c of JSON.parse(fs.readFileSync(p, 'utf8')).pages) if (c) caps.set(c.n, c);
}
for (const arg of process.argv.slice(2)) {
  const n = Number(arg);
  const c = caps.get(n);
  const l = await lireLien(c.lien, { fetchPage: fetchRejoue(c, n), maintenant: 1, cours: async () => ({ taux: 0.93, date: '2026-11-23' }) as any });
  console.log(`--- ${n} ${c.lien.slice(0, 80)}`);
  console.log(JSON.stringify({ statut: l.statut, nom: l.nom, prix: l.prix, devise: l.devise, valeurs: l.valeurs, etapes: l.etapes, livraison: l.livraison }, null, 1));
}
