/**
 * Pose les états du 20.11 (etats.ts) sur les idées portées du Planning. Simulation par défaut ; --apply écrit, préconditionné (`updateTime`
 * pour une idée qui change, `exists: false` pour un message neuf), puis relit. Sauvegarde de `creativeItems` dans os.tmpdir() avant tout.
 *   npx vite-node scripts/planning-vers-carnet/appliquer-etats.ts -- --project=brasserie-l-affinee [--apply]
 */
import { createRequire } from 'node:module';
import { writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { decode, encode } from '../yeast-catalogue/import-plan.mjs';
import type { CreativeItem } from '../../src/types';
import { planEtats } from './etats';

const args = process.argv.slice(2);
const projet = args.find(a => a.startsWith('--project='))?.slice(10);
if (!projet || !/^[-a-z0-9]+$/.test(projet)) throw Error('--project=<id> requis');
const apply = args.includes('--apply');
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
type DocRest = { name: string; fields?: Record<string, unknown>; updateTime: string };
async function tous(): Promise<DocRest[]> {
  const sortie: DocRest[] = []; let curseur: string | undefined;
  do { const r = await req(`${base}/creativeItems?pageSize=300${curseur ? `&pageToken=${encodeURIComponent(curseur)}` : ''}`); sortie.push(...(r.documents ?? [])); curseur = r.nextPageToken; } while (curseur);
  return sortie;
}
const idDe = (d: DocRest) => d.name.split('/').at(-1)!;
const lu = (d: DocRest) => decode({ mapValue: { fields: d.fields ?? {} } }) as CreativeItem;

const avant = await tous();
const sauvegarde = join(tmpdir(), `affinee-creativeItems-etats-${new Date().toISOString().replace(/[:.]/g, '-')}.json`);
writeFileSync(sauvegarde, JSON.stringify(avant, null, 2));
console.log(`SAUVEGARDE ${sauvegarde} (${avant.length} creativeItems)`);
const majs = new Map(avant.map(d => [idDe(d), d.updateTime]));
const plan = planEtats(avant.map(lu), new Date().toISOString());
plan.lignes.forEach(l => console.log(`  ${l}`));
console.log(`PLAN ${plan.ecritures.length} écritures ; déjà faits : ${plan.dejaFait.join(', ') || 'aucun'} ; absents : ${plan.absents.join(', ') || 'aucun'}`);
if (plan.absents.length) throw Error('Idée absente : rien n’est écrit');
if (apply && plan.ecritures.length) {
  const writes = plan.ecritures.map(w => {
    if (w.op !== 'put') throw Error('suppression inattendue');
    const maj = majs.get(w.doc.id);
    return { update: { name: `${parent}/creativeItems/${w.doc.id}`, fields: (encode(w.doc) as { mapValue: { fields: unknown } }).mapValue.fields }, currentDocument: maj ? { updateTime: maj } : { exists: false } };
  });
  await req(`${base}:commit`, { writes });
  const apres = new Map((await tous()).map(d => [idDe(d), d]));
  for (const w of plan.ecritures) if (w.op === 'put') {
    const d = apres.get(w.doc.id);
    const cles = Object.keys(w.doc).sort();
    if (!d || JSON.stringify(lu(d), cles) !== JSON.stringify(w.doc, cles)) throw Error(`Relu différent : ${w.doc.id}`);
  }
  const touches = avant.filter(d => !plan.ecritures.some(w => w.op === 'put' && w.doc.id === idDe(d)) && apres.get(idDe(d))?.updateTime !== d.updateTime).map(idDe);
  console.log(`ÉCRIT ${writes.length}, relus à l'identique ; autres touchés : ${touches.join(', ') || 'aucun'}`);
}
