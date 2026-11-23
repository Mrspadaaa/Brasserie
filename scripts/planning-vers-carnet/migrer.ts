/**
 * Planning → Carnet : simulation par défaut, écriture seulement avec --apply. Aucune IA. Chaque lancement sauve `planning` et la liste
 * des ids de `creativeItems` dans os.tmpdir() avant tout. Écritures préconditionnées (`exists: false`), relues après coup.
 *
 *   npx vite-node scripts/planning-vers-carnet/migrer.ts -- --emulator=127.0.0.1:8080 [--semer] [--apply] [--supprimer-planning]
 *   npx vite-node scripts/planning-vers-carnet/migrer.ts -- --project=brasserie-l-affinee [--apply] [--supprimer-planning]
 *
 * --semer (émulateur seul) : pose les 19 étapes de la fixture et un carnet « ZZ TEST — autre » qui ne doit pas bouger.
 * --supprimer-planning : retire les documents de `planning`, seulement si chaque étape a son carnet et son message relus à l'identique.
 */
import { createRequire } from 'node:module';
import { readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { decode, encode } from '../yeast-catalogue/import-plan.mjs';
import { planMigration, idCarnetPlanning, idMessagePlanning, type TachePlanning } from './correspondance';

const args = process.argv.slice(2);
const opt = (n: string) => args.find(a => a.startsWith(`--${n}=`))?.slice(n.length + 3);
const drapeau = (n: string) => args.includes(`--${n}`);
const emulateur = opt('emulator'), projet = opt('project') ?? (emulateur ? 'brasserie-l-affinee' : undefined);
if (!projet || !/^[-a-z0-9]+$/.test(projet)) throw Error('--project=<id> ou --emulator=<hôte:port> requis');
if (drapeau('semer') && !emulateur) throw Error('--semer : émulateur seulement');
const apply = drapeau('apply'), supprimer = drapeau('supprimer-planning');

let jeton = 'owner';
if (!emulateur) {
  const require = createRequire(import.meta.url), auth = require('firebase-tools/lib/auth.js');
  const compte = auth.getProjectDefaultAccount(process.cwd());
  if (!compte) throw Error('Connexion Firebase CLI requise');
  jeton = (await auth.getAccessToken(compte.tokens.refresh_token, ['https://www.googleapis.com/auth/cloud-platform'])).access_token;
}
const parent = `projects/${projet}/databases/(default)/documents`;
const base = `${emulateur ? `http://${emulateur}` : 'https://firestore.googleapis.com'}/v1/${parent}`;
async function req(url: string, corps?: unknown) {
  const r = await fetch(url, { method: corps ? 'POST' : 'GET', headers: { Authorization: `Bearer ${jeton}`, ...(corps ? { 'Content-Type': 'application/json' } : {}) }, ...(corps ? { body: JSON.stringify(corps) } : {}) });
  if (!r.ok) throw Error(`Firestore HTTP ${r.status} ${await r.text()}`);
  return r.json();
}
type DocRest = { name: string; fields?: Record<string, unknown>; updateTime: string; createTime?: string };
async function tous(collection: string, masque?: string): Promise<DocRest[]> {
  const sortie: DocRest[] = []; let curseur: string | undefined;
  do {
    const r = await req(`${base}/${collection}?pageSize=300${masque ? `&mask.fieldPaths=${masque}` : ''}${curseur ? `&pageToken=${encodeURIComponent(curseur)}` : ''}`);
    sortie.push(...(r.documents ?? [])); curseur = r.nextPageToken;
  } while (curseur);
  return sortie;
}
const idDe = (d: DocRest) => d.name.split('/').at(-1)!;
const lu = (d: DocRest) => decode({ mapValue: { fields: d.fields ?? {} } }) as Record<string, unknown>;
const ecrire = (collection: string, id: string, data: unknown) => ({ update: { name: `${parent}/${collection}/${id}`, fields: (encode(data) as { mapValue: { fields: unknown } }).mapValue.fields }, currentDocument: { exists: false } });

if (drapeau('semer')) {
  const fixture = JSON.parse(readFileSync(join(dirname(fileURLToPath(import.meta.url)), 'fixture-planning.json'), 'utf8')) as TachePlanning[];
  const autre = { id: 'CARNET-ZZ-AUTRE', type: 'carnet', title: 'ZZ TEST — autre carnet', status: 'idea', carnet: { version: 1, creeLe: '2026-11-01T00:00:00.000Z', phrase: 'ZZ TEST — autre carnet', criteres: [], facons: [], articles: [], notes: [], photos: [] } };
  const deja = new Set([...(await tous('planning')).map(idDe), ...(await tous('creativeItems', 'title')).map(idDe)]);
  const writes = [...fixture.filter(t => !deja.has(t.id)).map(t => ecrire('planning', t.id, t)), ...(deja.has(autre.id) ? [] : [ecrire('creativeItems', autre.id, autre)])];
  if (writes.length) await req(`${base}:commit`, { writes });
  console.log(`SEMÉ ${writes.length} documents`);
}

const planning = await tous('planning');
const items = await tous('creativeItems', 'title');
const stamp = new Date().toISOString().replace(/[:.]/g, '-');
const sauvegarde = join(tmpdir(), `affinee-planning-${emulateur ? 'emulateur' : projet}-${stamp}.json`);
writeFileSync(sauvegarde, JSON.stringify({ projet, emulateur: emulateur ?? null, le: stamp, planning, creativeItemsIds: items.map(idDe) }, null, 2));
console.log(`SAUVEGARDE ${sauvegarde} (${planning.length} étapes, ${items.length} creativeItems)`);

const taches = planning.map(d => ({ ...lu(d), id: idDe(d), ...(d.createTime ? { creeLe: d.createTime } : {}) }) as TachePlanning);
const le = new Date().toISOString();
const plan = planMigration(taches, new Set(items.map(idDe)), le);
for (const c of plan.aEcrire) console.log(`  + ${c.tacheId.padEnd(5)} ${c.titre} | ${c.budget ?? '—'} | ${c.dates}${c.date ? ` | semaine du ${c.date}` : ''}${c.fait ? ' | archivé (fait)' : ''}`);
console.log(`PLAN ${plan.aEcrire.length} à écrire (${plan.aEcrire.length * 2} documents), ${plan.dejaLa.length} déjà là, conflits : ${plan.conflits.join(', ') || 'aucun'}`);
if (plan.conflits.length) throw Error('Conflit : rien n’est écrit');

if (apply && plan.aEcrire.length) {
  const writes = plan.aEcrire.flatMap(c => c.docs.map(d => ecrire('creativeItems', d.id, d)));
  await req(`${base}:commit`, { writes });
  console.log(`ÉCRIT ${writes.length} documents`);
}

/* relecture : chaque étape doit avoir son carnet et son message ; ceux écrits ici sont comparés champ à champ */
const attendus = new Map(plan.aEcrire.flatMap(c => c.docs).map(d => [d.id, d]));
let relus = 0, manquants: string[] = [];
for (const t of taches) {
  for (const id of [idCarnetPlanning(t.id), idMessagePlanning(t.id)]) {
    let doc: DocRest | null = null;
    try { doc = await req(`${base}/creativeItems/${id}`); } catch { doc = null; }
    if (!doc) { manquants.push(id); continue; }
    const attendu = attendus.get(id);
    if (apply && attendu && JSON.stringify(lu(doc), Object.keys(lu(doc)).sort()) !== JSON.stringify(attendu, Object.keys(lu(doc)).sort())) throw Error(`Relu différent : ${id}`);
    relus += 1;
  }
}
const autresAvant = items.map(idDe).filter(id => !id.startsWith('CARNET-PLANNING-') && !id.startsWith('MSG-PLANNING-'));
const apres = await tous('creativeItems', 'title');
const autresApres = new Map(apres.map(d => [idDe(d), d.updateTime]));
const autresTouches = items.filter(d => autresAvant.includes(idDe(d)) && autresApres.get(idDe(d)) !== d.updateTime).map(idDe);
console.log(`RELU ${relus}/${taches.length * 2} ; manquants : ${manquants.join(', ') || 'aucun'} ; autres creativeItems touchés : ${autresTouches.join(', ') || 'aucun'} (${autresAvant.length} autres)`);
if (autresTouches.length) throw Error('Un autre document a changé');

if (supprimer) {
  if (manquants.length || !taches.length) throw Error('Suppression refusée : une étape n’a pas son carnet');
  await req(`${base}:commit`, { writes: planning.map(d => ({ delete: d.name, currentDocument: { updateTime: d.updateTime } })) });
  console.log(`SUPPRIMÉ ${planning.length} documents de planning ; reste ${(await tous('planning')).length}`);
}
