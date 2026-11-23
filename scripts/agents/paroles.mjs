// Contrôle des paroles du jour (16.11, « … ni pour plus perdre mes retours... ») : chaque message consigné par le hook
// .claude/hooks/paroles.mjs dans ~/.claude/paroles/AAAA-MM-JJ.md doit se retrouver dans SPEC-BRASSEUR.md.
// Comparaison sur une sous-chaîne : la plus longue ligne du message (60 premiers caractères), espaces, apostrophes,
// guillemets et casse normalisés. Une image seule ne se compare pas : listée « à verser avec sa lecture ».
//   node scripts/agents/systeme.mjs paroles [AAAA-MM-JJ] [--dir <dossier>] [--spec <SPEC.md>]
//   node scripts/agents/paroles.mjs        (mêmes options)
// Sortie : PAROLES OK / PAROLES ECHEC (code 1), avec la liste des absents.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { lireJournal } from '../../.claude/hooks/paroles.mjs';

const RACINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const SPEC = path.join(RACINE, 'work/refonte-frontend/v4/SPEC-BRASSEUR.md');
const BRIEF = 1500; // au-delà, probablement le brief d'une session lancée par une autre, pas un message du brasseur

export const normaliser = (t) => String(t ?? '')
  .replace(/[   ]/g, ' ').replace(/[’‘`]/g, "'").replace(/[«»“”]/g, '"')
  .replace(/\s+/g, ' ').trim().toLowerCase();

export function fragment(texte) {
  const lignes = String(texte).replace(/\[image jointe\]/g, '').split('\n').map(normaliser).filter(Boolean);
  if (!lignes.length) return null;
  const longue = lignes.reduce((a, b) => (b.length > a.length ? b : a));
  return longue.replace(/^["'\s]+/, '').slice(0, 60).trim();
}

export function absents(messages, spec) {
  const s = normaliser(spec);
  const res = { absents: [], images: [], briefs: [] };
  for (const m of messages) {
    const f = fragment(m.texte);
    if (!f) { res.images.push(m); continue; }
    if (s.includes(f)) continue;
    (m.texte.length > BRIEF ? res.briefs : res.absents).push({ ...m, fragment: f });
  }
  return res;
}

export function main(argv) {
  const opt = (nom, d) => { const i = argv.indexOf(nom); return i >= 0 ? argv[i + 1] : d; };
  const n = new Date();
  const p2 = (x) => String(x).padStart(2, '0');
  const jour = argv.find((a) => /^\d{4}-\d{2}-\d{2}$/.test(a)) ?? `${n.getFullYear()}-${p2(n.getMonth() + 1)}-${p2(n.getDate())}`;
  const dossier = path.resolve(opt('--dir', process.env.PAROLES_DIR || path.join(os.homedir(), '.claude', 'paroles')));
  const fichier = path.join(dossier, `${jour}.md`);
  if (!fs.existsSync(fichier)) { console.log(`PAROLES OK — aucun journal pour ${jour} (${fichier}) : hook installé ? aucun message ?`); return 0; }
  const messages = lireJournal(fs.readFileSync(fichier, 'utf8'));
  const r = absents(messages, fs.readFileSync(path.resolve(opt('--spec', SPEC)), 'utf8'));
  const court = (t) => t.replace(/\s+/g, ' ').slice(0, 110);
  console.log(`paroles ${jour} : ${messages.length} message(s), ${r.absents.length} absent(s) de SPEC-BRASSEUR.md`);
  for (const m of r.absents) console.log(`  - ${m.heure} · ${m.titre} · « ${court(m.texte)} »`);
  for (const m of r.images) console.log(`  ? ${m.heure} · ${m.titre} · image seule, à verser avec sa lecture`);
  for (const m of r.briefs) console.log(`  ? ${m.heure} · ${m.titre} · message long (${m.texte.length} car.), brief probable : à vérifier`);
  console.log(r.absents.length ? 'PAROLES ECHEC' : 'PAROLES OK');
  return r.absents.length ? 1 : 0;
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) process.exitCode = main(process.argv.slice(2));
