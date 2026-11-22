// Contrôle d'une série de mini maquettes du compagnon (mission 2026-11-14-compagnon).
// Usage : node work/missions/2026-11-14-compagnon/outils/controle-serie.mjs <dossier de voie> <ids,…> [--complet]
// Pour chaque id : etat.html, <id>-clair.png, <id>-cave.png (> 20 ko), NOTE.md (≤ 14 lignes) ; aucun nom de modèle ou de fournisseur
// d'IA dans le texte (Gemini, Google, Hydrogen, Flash, Pro, Argon, Carbon, 3.8) ; aucun type="number" ; classes préfixées par l'id ;
// aucun appel réseau ; cadres data-cadre="accueil|attente|reponse|erreur" (et, avec --complet : finances|conversations|plafond|urgent|fournisseurs|limites|zero|bureau).
import { existsSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
const [dir, idsArg, opt] = process.argv.slice(2);
if (!dir || !idsArg) { console.log('SERIE ECHEC usage'); process.exit(1); }
const cadres = ['accueil', 'attente', 'reponse', 'erreur', ...(opt === '--complet' ? ['finances', 'conversations', 'plafond', 'urgent', 'fournisseurs', 'limites', 'zero', 'bureau'] : [])];
const ech = [];
for (const id of idsArg.split(',')) {
  const d = join(dir, id);
  for (const f of ['etat.html', `${id}-clair.png`, `${id}-cave.png`, 'NOTE.md']) {
    const p = join(d, f);
    if (!existsSync(p)) ech.push(`${id}: ${f} absent`);
    else if (f.endsWith('.png') && statSync(p).size < 20000) ech.push(`${id}: ${f} trop petite`);
  }
  const p = join(d, 'etat.html');
  if (!existsSync(p)) continue;
  const h = readFileSync(p, 'utf8');
  const texte = h.replace(/<style[\s\S]*?<\/style>/g, '').replace(/<script[\s\S]*?<\/script>/g, '').replace(/<[^>]+>/g, ' ');
  const nom = texte.match(/\b(Gemini|Google|Hydrogen|Flash|Argon|Carbon|Pro)\b|\b3\.8\b/);
  if (nom) ech.push(`${id}: nom de modèle ou fournisseur à l'écran (${nom[0]})`);
  if (/type=["']number["']/.test(h)) ech.push(`${id}: type="number"`);
  if (!new RegExp(`class=["'][^"']*\\b${id}-`).test(h)) ech.push(`${id}: aucune classe préfixée ${id}-`);
  if (/(src|href)=["']https?:\/\//.test(h) || /@import\s+url\(["']?https?:/.test(h)) ech.push(`${id}: appel réseau`);
  for (const c of cadres) if (!new RegExp(`data-cadre=["']${c}["']`).test(h)) ech.push(`${id}: cadre ${c} absent`);
  const note = existsSync(join(d, 'NOTE.md')) ? readFileSync(join(d, 'NOTE.md'), 'utf8').trim().split('\n').length : 0;
  if (note > 14) ech.push(`${id}: NOTE.md ${note} lignes`);
}
console.log(ech.length ? 'SERIE ECHEC\n' + ech.join('\n') : 'SERIE OK');
process.exit(ech.length ? 1 : 0);
