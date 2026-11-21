// Fixture du parcours Carnet — « données simulées », rien ne vient de la vraie brasserie. Elle imite le Carnet tel que le brasseur le
// tient (20.11) :
//   • les 19 étapes de son Planning portées en carnets par le code même de l'app (`planMigration`, scripts/planning-vers-carnet), dont
//     5 « faites » (T-6 à T-10 : archivées « Fait au Planning ») ;
//   • les carnets génériques de la fixture du banc (Ventilation, Évier, Embouteillage, Frigo, Densimètre, Extraction : « ZZ TEST — … »,
//     origine « exemple », liens `exemple.invalid`), avec leurs messages ; le Frigo est dans À venir, l'Embouteillage est réalisé
//     (dépense payée liée : Finances) ;
//   • un brassin au Calendrier et une dépense aux Finances (repris de la fixture du Calendrier).
// La note en vrac et le lien collé ne sont PAS dans la fixture : le parcours les tape au doigt ; l'IA est la réponse SIMULÉE de
// `iaSimulee.ts` (banc `?dev-local` : jamais Gemini).
//
// Les documents du Carnet sont fabriqués par le code de l'app (esbuild + node sur un petit script écrit dans os.tmpdir()), pas recopiés
// à la main : la forme suit le modèle courant. Sortie : { entrees: [{ name, id, data }], ids }.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fixtureCalendrier } from './calendrier.mjs';

export const FAITS = ['T-6', 'T-7', 'T-8', 'T-9', 'T-10'];

const ASSISTANT = (racine, sortie, aujourdhui) => {
  const r = racine.replace(/\\/g, '/');
  return [
    `import { readFileSync, writeFileSync } from 'node:fs';`,
    `import { fixtureCarnets, fixturePlanRealise } from '${r}/src/domain/carnets/fixture';`,
    `import { planMigration } from '${r}/scripts/planning-vers-carnet/correspondance';`,
    `const planning = JSON.parse(readFileSync('${r}/scripts/planning-vers-carnet/fixture-planning.json', 'utf8'));`,
    `const faits = ${JSON.stringify(FAITS)};`,
    `const taches = planning.map((t: any) => (faits.includes(t.id) ? { ...t, completed: true } : t));`,
    `const planningDocs = planMigration(taches, new Set(), '${aujourdhui}T12:00:00.000Z').aEcrire.flatMap((c: any) => c.docs);`,
    `const r = fixturePlanRealise();`,
    `writeFileSync('${sortie.replace(/\\/g, '/')}', JSON.stringify({ planning: planningDocs, generiques: r.items, plans: r.plans, transactions: r.transactions, payments: r.payments, nbGeneriques: fixtureCarnets().length }));`
  ].join('\n');
};

/** `racine` : le dossier du code (l'arbre de travail) dont on lit le modèle ; `aujourdhui` : ISO du jour. */
export function fixtureCarnet(racine, aujourdhui) {
  const dossier = fs.mkdtempSync(path.join(os.tmpdir(), 'parcours-carnet-fx-'));
  const sortie = path.join(dossier, 'docs.json');
  const script = path.join(dossier, 'fabriquer.ts');
  fs.writeFileSync(script, ASSISTANT(racine, sortie, aujourdhui));
  // esbuild empaquette le script et le code de l'app (vite-node refuse un fichier hors de la racine), puis node le joue
  const paquet = path.join(dossier, 'fabriquer.mjs');
  const b = spawnSync('npx', ['esbuild', script, '--bundle', '--platform=node', '--format=esm', `--outfile=${paquet}`, '--log-level=error'], { cwd: racine, encoding: 'utf8', shell: true, maxBuffer: 1 << 26 });
  if (b.status !== 0) throw new Error(`fixture du Carnet : esbuild en échec : ${(b.stdout + b.stderr).slice(-700)}`);
  const r = spawnSync(process.execPath, [paquet], { cwd: racine, encoding: 'utf8', maxBuffer: 1 << 26 });
  if (r.status !== 0 || !fs.existsSync(sortie)) throw new Error(`fixture du Carnet : fabrication en échec : ${(r.stdout + r.stderr).slice(-700)}`);
  const lu = JSON.parse(fs.readFileSync(sortie, 'utf8'));
  fs.rmSync(dossier, { recursive: true, force: true });

  const entrees = [];
  const add = (name, id, data) => entrees.push({ name, id, data: { ...data, id } });
  for (const d of lu.planning) add('creativeItems', d.id, d);
  for (const d of lu.generiques) add('creativeItems', d.id, d);
  for (const d of lu.plans) add('financialPlans', d.id, d);
  for (const d of lu.transactions) add('transactions', d.id, d);
  for (const d of lu.payments) add('financialPayments', d.id, d);

  // un brassin au Calendrier et une dépense aux Finances (le Calendrier et les Finances ont leur vie, le Carnet ne doit pas la perdre)
  const cal = fixtureCalendrier(aujourdhui);
  const garde = new Set(['batches:B-FRUTY', 'recipes:R-B-FRUTY', 'transactions:F-BROUWLAND', 'financialProfiles:current']);
  for (const e of cal.entrees) if (garde.has(`${e.name}:${e.id}`)) entrees.push(e);

  const titres = (liste) => liste.filter((d) => d.type === 'carnet').map((d) => d.title);
  return {
    entrees,
    ids: {
      planning: lu.planning.filter((d) => d.type === 'carnet').map((d) => d.id),
      planningFaits: lu.planning.filter((d) => d.type === 'carnet' && d.carnet?.archive).map((d) => d.id),
      titresPlanning: titres(lu.planning),
      titresGeneriques: titres(lu.generiques),
      nbCarnetsPlanning: lu.planning.filter((d) => d.type === 'carnet').length,
      nbCarnetsGeneriques: lu.generiques.filter((d) => d.type === 'carnet').length,
      brassin: 'B-FRUTY', depense: 'F-BROUWLAND'
    }
  };
}
