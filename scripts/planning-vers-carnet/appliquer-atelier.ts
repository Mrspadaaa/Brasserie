/**
 * Porte le Planning dans Brassins › Atelier › Carnet et Matériel › À venir (atelier.ts). La collection `planning` est supprimée : les étapes
 * viennent de sa sauvegarde (`--sauvegarde=<json de migrer.ts>`), comparée à la fixture. Simulation par défaut ; --apply écrit, préconditionné
 * (`exists: false` pour un neuf, `updateTime` pour une idée qui change), puis relit. Sauvegarde de `creativeItems` et `financialPlans` avant tout.
 *   npx vite-node scripts/planning-vers-carnet/appliquer-atelier.ts -- --project=brasserie-l-affinee --sauvegarde=<fichier> [--apply]
 */
import { createRequire } from 'node:module';
import { readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { decode, encode } from '../yeast-catalogue/import-plan.mjs';
import type { CreativeItem } from '../../src/types';
import type { TachePlanning } from './correspondance';
import { planAtelier } from './atelier';

const args = process.argv.slice(2);
const opt = (n: string) => args.find(a => a.startsWith(`--${n}=`))?.slice(n.length + 3);
const projet = opt('project'), fichier = opt('sauvegarde');
if (!projet || !/^[-a-z0-9]+$/.test(projet) || !fichier) throw Error('--project=<id> et --sauvegarde=<json> requis');
const apply = args.includes('--apply');
type DocRest = { name: string; fields?: Record<string, unknown>; updateTime: string; createTime?: string };
const idDe = (d: DocRest) => d.name.split('/').at(-1)!;
const lu = (d: DocRest) => decode({ mapValue: { fields: d.fields ?? {} } }) as Record<string, unknown>;

/* les étapes : la sauvegarde du Planning, qui doit dire exactement la fixture testée */
const sauve = JSON.parse(readFileSync(fichier, 'utf8')) as { planning: DocRest[] };
const taches = sauve.planning.map(d => ({ ...lu(d), id: idDe(d), ...(d.createTime ? { creeLe: d.createTime } : {}) }) as TachePlanning);
const fixture = JSON.parse(readFileSync(join(dirname(fileURLToPath(import.meta.url)), 'fixture-planning.json'), 'utf8')) as TachePlanning[];
const cle = (t: TachePlanning) => JSON.stringify([t.id, t.category, t.cost, t.description, t.startDate, t.endDate, t.isMilestone === true, t.completed === true]);
if (taches.length !== 19 || taches.map(cle).sort().join() !== fixture.map(cle).sort().join()) throw Error('La sauvegarde ne correspond pas à la fixture testée');

const require = createRequire(import.meta.url), auth = require('firebase-tools/lib/auth.js');
const compte = auth.getProjectDefaultAccount(process.cwd());
if (!compte) throw Error('Connexion Firebase CLI requise');
const jeton = (await auth.getAccessToken(compte.tokens.refresh_token, ['https://www.googleapis.com/auth/cloud-platform'])).access_token;
const parent = `projects/${projet}/databases/(default)/documents`, base = `https://firestore.googleapis.com/v1/${parent}`;
async function req(url: string, corps?: unknown) {
  const r = await fetch(url, { method: corps ? 'POST' : 'GET', headers: { Authorization: `Bearer ${jeton}`, ...(corps ? { 'Content-Type': 'application/json' } : {}) }, ...(corps ? { body: JSON.stringify(corps) } : {}) });
  if (!r.ok) throw Error(`Firestore HTTP ${r.status} ${await r.text()}`);
  return r.json();
}
async function tous(col: string): Promise<DocRest[]> {
  const s: DocRest[] = []; let c: string | undefined;
  do { const r = await req(`${base}/${col}?pageSize=300${c ? `&pageToken=${encodeURIComponent(c)}` : ''}`); s.push(...(r.documents ?? [])); c = r.nextPageToken; } while (c);
  return s;
}

const items = await tous('creativeItems'), plans = await tous('financialPlans');
const copie = join(tmpdir(), `affinee-atelier-avant-${new Date().toISOString().replace(/[:.]/g, '-')}.json`);
writeFileSync(copie, JSON.stringify({ creativeItems: items, financialPlans: plans }, null, 2));
console.log(`SAUVEGARDE ${copie} (${items.length} creativeItems, ${plans.length} financialPlans)`);
const majs = new Map(items.map(d => [idDe(d), d.updateTime]));
const plan = planAtelier(taches, items.map(d => lu(d) as unknown as CreativeItem), new Set([...items, ...plans].map(idDe)), new Date().toISOString());
plan.lignes.forEach(l => console.log(`  ${l}`));
console.log(`PLAN ${plan.atelier.length} À faire de l'Atelier, ${plan.plans.length} achats À venir, ${plan.carnet.length} idées du Carnet mises à jour`);

if (apply) {
  const champs = (v: unknown) => (encode(v) as { mapValue: { fields: unknown } }).mapValue.fields;
  const writes = [
    ...plan.atelier.map(i => ({ update: { name: `${parent}/creativeItems/${i.id}`, fields: champs(i) }, currentDocument: { exists: false } })),
    ...plan.plans.map(p => ({ update: { name: `${parent}/financialPlans/${p.id}`, fields: champs(p) }, currentDocument: { exists: false } })),
    ...plan.carnet.map(w => {
      if (w.op !== 'put') throw Error('suppression inattendue');
      const maj = majs.get(w.doc.id);
      if (!maj) throw Error(`idée absente : ${w.doc.id}`);
      return { update: { name: `${parent}/creativeItems/${w.doc.id}`, fields: champs(w.doc) }, currentDocument: { updateTime: maj } };
    })
  ];
  if (writes.length) await req(`${base}:commit`, { writes });
  const apresI = new Map((await tous('creativeItems')).map(d => [idDe(d), d])), apresP = new Map((await tous('financialPlans')).map(d => [idDe(d), d]));
  const pareil = (d: DocRest | undefined, v: object) => !!d && JSON.stringify(lu(d), Object.keys(v).sort()) === JSON.stringify(v, Object.keys(v).sort());
  const faux = [...plan.atelier.filter(i => !pareil(apresI.get(i.id), i)).map(i => i.id), ...plan.plans.filter(p => !pareil(apresP.get(p.id), p)).map(p => p.id),
    ...plan.carnet.filter(w => w.op === 'put' && !pareil(apresI.get(w.doc.id), w.doc)).map(w => (w as { doc: CreativeItem }).doc.id)];
  const ecrits = new Set(writes.map(w => w.update.name.split('/').at(-1)));
  const touches = [...items.filter(d => !ecrits.has(idDe(d)) && apresI.get(idDe(d))?.updateTime !== d.updateTime), ...plans.filter(d => !ecrits.has(idDe(d)) && apresP.get(idDe(d))?.updateTime !== d.updateTime)].map(idDe);
  console.log(`ÉCRIT ${writes.length} ; relus différents : ${faux.join(', ') || 'aucun'} ; autres touchés : ${touches.join(', ') || 'aucun'}`);
  if (faux.length) throw Error('Relecture différente');
}
