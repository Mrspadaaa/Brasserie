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
    // la Chambre froide : le doc d'un carnet « à comparer » du banc (Ventilation), vidé, avec les deux articles sans prix
    `const base: any = fixtureCarnets().find((d: any) => /Ventilation/.test(d.title));`,
    `const chambre = { ...base, id: ${JSON.stringify(CHAMBRE_FROIDE.id)}, title: ${JSON.stringify(CHAMBRE_FROIDE.titre)}, carnet: { ...base.carnet, creeLe: '2026-11-20T08:00:00.000Z', phrase: 'chambre froide pour les fûts', criteres: [], facons: [], notes: [], photos: [], messages: [], articles: ${JSON.stringify(CHAMBRE_FROIDE.articles)} } };`,
    `r.items.push(chambre);`,
    `writeFileSync('${sortie.replace(/\\/g, '/')}', JSON.stringify({ planning: planningDocs, generiques: r.items, plans: r.plans, transactions: r.transactions, payments: r.payments, nbGeneriques: fixtureCarnets().length }));`
  ].join('\n');
};

// ───────────── « ZZ TEST — Chambre froide » : le carnet des captures 02 à 04 du brasseur (21.11) ─────────────
// Deux articles « en stock » SANS prix, dix caractéristiques lues en TEXTE (pas de nombre ni d'unité), dont « Épaisseur de l&apos;isolation »
// (l'entité brute lue dans le JSON-LD du vendeur, CRP-2) et « Couleur : » (deux-points recopiés, CRB-4) ; les noms portent le préfixe
// « Chambre froide - » du carnet (CRB-9). Ni critère, ni façon, ni note : « rien encore » au premier plan (CRB-7). Données simulées :
// valeurs d'exemple, domaine `exemple.invalid` ; rien n'est lu sur un vrai site.
export const CHAMBRE_FROIDE = {
  id: 'ZZ-CARNET-CHAMBRE-FROIDE',
  titre: 'ZZ TEST — Chambre froide',
  /** Le prix d'une page de vendeur tel que le JSON-LD l'écrit : « 4'890.00 » (apostrophe suisse), jamais un nombre. Voir tests/unit/carnetsLireLien.test.ts. */
  prixPublie: "4'890.00",
  articles: [
    { id: 'ZZ-CF-A1', nom: 'Chambre froide - 1800 x 1500 mm - 4,06 m³ - groupe frigorifique inclus', dims: '1800 x 1500 x 2100 mm', interieur: '1700 x 1400 x 2000 mm', volume: '4,06 m³' },
    { id: 'ZZ-CF-A2', nom: 'Chambre froide - 1500 x 1200 mm - 2,6 m³ - groupe frigorifique inclus', dims: '1500 x 1200 x 2100 mm', interieur: '1400 x 1100 x 2000 mm', volume: '2,6 m³' }
  ].map((a, i) => ({
    id: a.id, url: `https://exemple.invalid/zz-test-chambre-froide-${i + 1}`, domaine: 'exemple.invalid', nom: a.nom,
    vendeur: 'Froid Exemple', pays: 'CH', dispo: 'en stock', lecture: 'lue', origine: 'exemple',
    valeurs: Object.fromEntries([
      ['Dimensions du produit', a.dims], ['Dimensions intérieures (L x P x H)', a.interieur], ['Exécution/équipement', 'groupe frigorifique inclus'],
      ['Couleur :', 'blanc RAL 9010'], ['Performance', 'A+'], ['Épaisseur du matériel', '80 mm'], ['Largeur de la porte', '800 mm'],
      ['Hauteur de la porte', '1900 mm'], ["Épaisseur de l&apos;isolation", '80 mm PIR'], ['Volume utile', a.volume]
    ].map(([nom, valeur]) => [nom, { valeur, origine: 'exemple', luLe: '2026-11-21T08:00:00.000Z' }]))
  }))
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
      chambreFroide: CHAMBRE_FROIDE.titre,
      brassin: 'B-FRUTY', depense: 'F-BROUWLAND'
    }
  };
}
