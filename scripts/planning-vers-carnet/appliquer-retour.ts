/**
 * Décision (a), 20.11 (retour.ts) : retire les 11 « À faire » `CR-PLANNING-*` de l'ancien carnet de l'Atelier et rend au Carnet les idées des
 * travaux archivées pour eux. Simulation par défaut ; --apply écrit, préconditionné (`updateTime` de chaque document lu), puis relit.
 * Sauvegarde de `creativeItems` dans os.tmpdir() avant tout.
 *   npx vite-node scripts/planning-vers-carnet/appliquer-retour.ts -- --project=brasserie-l-affinee [--apply]
 */
import { createRequire } from 'node:module';
import { writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { decode, encode } from '../yeast-catalogue/import-plan.mjs';
import type { CreativeItem } from '../../src/types';
import { planRetour } from './retour';

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
  const s: DocRest[] = []; let c: string | undefined;
  do { const r = await req(`${base}/creativeItems?pageSize=300${c ? `&pageToken=${encodeURIComponent(c)}` : ''}`); s.push(...(r.documents ?? [])); c = r.nextPageToken; } while (c);
  return s;
}
const idDe = (d: DocRest) => d.name.split('/').at(-1)!;
const lu = (d: DocRest) => decode({ mapValue: { fields: d.fields ?? {} } }) as unknown as CreativeItem;

const avant = await tous();
const copie = join(tmpdir(), `affinee-retour-avant-${new Date().toISOString().replace(/[:.]/g, '-')}.json`);
writeFileSync(copie, JSON.stringify(avant, null, 2));
console.log(`SAUVEGARDE ${copie} (${avant.length} creativeItems)`);
const majs = new Map(avant.map(d => [idDe(d), d.updateTime]));
const plan = planRetour(avant.map(lu));
console.log(`PLAN désarchiver ${plan.desarchiver.map(d => d.id).join(', ') || 'aucune'} ; retirer ${plan.retirer.join(', ') || 'aucun'}`);
if (apply && (plan.desarchiver.length || plan.retirer.length)) {
  const champs = (v: unknown) => (encode(v) as { mapValue: { fields: unknown } }).mapValue.fields;
  const writes = [
    ...plan.desarchiver.map(d => ({ update: { name: `${parent}/creativeItems/${d.id}`, fields: champs(d) }, currentDocument: { updateTime: majs.get(d.id)! } })),
    ...plan.retirer.map(id => ({ delete: `${parent}/creativeItems/${id}`, currentDocument: { updateTime: majs.get(id)! } }))
  ];
  await req(`${base}:commit`, { writes });
  const apres = new Map((await tous()).map(d => [idDe(d), d]));
  const faux = plan.desarchiver.filter(d => { const a = apres.get(d.id); return !a || !!(lu(a).carnet as { archive?: unknown } | undefined)?.archive; }).map(d => d.id);
  const restes = plan.retirer.filter(id => apres.has(id));
  const ecrits = new Set([...plan.desarchiver.map(d => d.id), ...plan.retirer]);
  const touches = avant.filter(d => !ecrits.has(idDe(d)) && apres.get(idDe(d))?.updateTime !== d.updateTime).map(idDe);
  console.log(`ÉCRIT ${writes.length} ; encore archivées : ${faux.join(', ') || 'aucune'} ; encore là : ${restes.join(', ') || 'aucun'} ; autres touchés : ${touches.join(', ') || 'aucun'}`);
  if (faux.length || restes.length) throw Error('Relecture différente');
}
