// Verse un rapport de test au format commun (defauts.jsonl à côté de RAPPORT.md) dans work/missions/BUGS.md.
// Usage : node scripts/agents/verser-jsonl.mjs <dossier du rapport> <préfixe> "<titre de section>" [état par défaut]
// Ajoute la ligne Sources (empreinte comprise) et une section avec une ligne par défaut ; rejoue controle-bugs ensuite.
import fs from 'node:fs';
import path from 'node:path';
import { empreinte as empreinteDe } from './controle-bugs.mjs';

const [dossier, prefixe, titre, etatDefaut = 'ouvert — présent'] = process.argv.slice(2);
if (!dossier || !prefixe || !titre) { console.error('usage : verser-jsonl.mjs <dossier> <préfixe> "<titre>" [état]'); process.exit(2); }
const RACINE = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1')), '../..');
const registre = path.join(RACINE, 'work/missions/BUGS.md');
const rapport = path.join(dossier, 'RAPPORT.md');
const lignes = fs.readFileSync(path.join(dossier, 'defauts.jsonl'), 'utf8').split(/\r?\n/).filter((l) => l.trim()).map((l) => JSON.parse(l));
const c = (x) => String(x ?? '').replace(/\|/g, '/').replace(/\r?\n/g, ' ');
const empreinte = empreinteDe(rapport);
const rel = path.relative(RACINE, rapport).replace(/\\/g, '/');
let s = fs.readFileSync(registre, 'utf8');
if (s.includes(`| ${rel} |`)) { console.error(`déjà versé : ${rel}`); process.exit(1); }
const ancre = s.indexOf('\n', s.lastIndexOf('\n| ', s.indexOf('\n## Bugs')));
s = s.slice(0, ancre + 1) + `| ${rel} | ${prefixe} | ${lignes.length} | 0 | ${empreinte} |\n` + s.slice(ancre + 1);
const rangs = lignes.map((d) => `| ${d.id} | ${c(titre)} | ${c(d.ecran)} | ${c(d.geste)} → observé : ${c(d.observe)} ; attendu : ${c(d.attendu)} | ${c(d.gravite)} | ${d.etat ?? etatDefaut} |   | ${c(d.source)} ; ${c(d.regle)} ; capture ${c(d.capture)} |`);
s = s.trimEnd() + `\n\n## ${titre} (\`${rel}\`)\n\n| id | source | écran | constat | gravité | état | commit | note |\n|---|---|---|---|---|---|---|---|\n` + rangs.join('\n') + '\n';
fs.writeFileSync(registre, s);
console.log(`${lignes.length} lignes versées (${prefixe}), empreinte ${empreinte}`);
