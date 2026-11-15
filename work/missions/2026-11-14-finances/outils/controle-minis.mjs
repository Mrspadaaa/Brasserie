// Contrôle d'une série de mini maquettes de sous-vues (mission 2026-11-14-finances, 14.11 soir).
// Usage : node work/missions/2026-11-14-finances/outils/controle-minis.mjs <dossier de voie> <ids séparés par des virgules>
// Pour chaque id : etat.html, <id>.png (390 px à l'échelle 2, donc 780 px de large, ≥ 20 ko), NOTE.md (≤ 10 lignes) ;
// aucun type="number" ; classes préfixées par l'id ; aucun appel réseau. Chaque vue (ids <voie><vue>-x) a au moins 4 variantes.
import { existsSync, readFileSync, statSync, openSync, readSync, closeSync } from 'node:fs';
import { join } from 'node:path';
const [dir, idsArg, motifsArg = '', minArg = ''] = process.argv.slice(2);
// motifs : 'pa=justificatif|pièce;mo=(<input[\s\S]*){3}' (regex par vue, sur etat.html) ; min : 'ap:1,fo:1' (4 par défaut).
const motifs = Object.fromEntries(motifsArg.split(';').filter(Boolean).map(x => [x.slice(0, x.indexOf('=')), new RegExp(x.slice(x.indexOf('=') + 1), 'i')]));
const mins = Object.fromEntries(minArg.split(',').filter(Boolean).map(x => x.split(':')).map(([k, n]) => [k, Number(n)]));
const cle = id => id.replace(/^m\d/, '').replace(/-[a-z0-9]+$/, '');
if (!dir || !idsArg) { console.log('MINIS ECHEC usage'); process.exit(1); }
const ech = [];
const ids = idsArg.split(',');
const largeur = p => { const b = Buffer.alloc(24); const fd = openSync(p, 'r'); readSync(fd, b, 0, 24, 0); closeSync(fd); return b.readUInt32BE(16); };
for (const id of ids) {
  const d = join(dir, id);
  for (const f of ['etat.html', `${id}.png`, 'NOTE.md']) {
    const p = join(d, f);
    if (!existsSync(p)) { ech.push(`${id}: ${f} absent`); continue; }
    if (f.endsWith('.png')) {
      if (statSync(p).size < 20000) ech.push(`${id}: ${f} trop petite`);
      const w = largeur(p); if (w !== 780) ech.push(`${id}: ${f} large de ${w} px (780 attendus)`);
    }
  }
  const p = join(d, 'etat.html');
  if (!existsSync(p)) continue;
  const h = readFileSync(p, 'utf8');
  if (motifs[cle(id)] && !motifs[cle(id)].test(h)) ech.push(`${id}: motif « ${motifs[cle(id)].source} » absent`);
  if (/type=["']number["']/.test(h)) ech.push(`${id}: type="number"`);
  if (!new RegExp(`class=["'][^"']*\\b${id}-`).test(h)) ech.push(`${id}: aucune classe préfixée ${id}-`);
  if (/https?:\/\/(?!localhost)/.test(h.replace(/xmlns(:\w+)?="[^"]*"/g, ''))) ech.push(`${id}: appel réseau`);
  const note = existsSync(join(d, 'NOTE.md')) ? readFileSync(join(d, 'NOTE.md'), 'utf8').trim().split('\n').length : 0;
  if (note > 10) ech.push(`${id}: NOTE.md ${note} lignes`);
}
const vues = {};
for (const id of ids) { const v = id.replace(/-[a-z0-9]+$/, ''); vues[v] = (vues[v] || 0) + 1; }
for (const [v, n] of Object.entries(vues)) { const m = mins[cle(v + '-x')] ?? 4; if (n < m) ech.push(`${v}: ${n} variantes (${m} au moins)`); }
console.log(ech.length ? `MINIS ECHEC\n${ech.join('\n')}` : `MINIS OK (${ids.length} maquettes, ${Object.keys(vues).length} vues)`);
process.exit(ech.length ? 1 : 0);
