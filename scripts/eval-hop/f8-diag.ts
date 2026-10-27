// Voie f8 : pourquoi les houblons de Double IPA du brasseur sont loin dans « plus d'agrumes » / « plus de tropicaux » au dry hop ? Une ligne par houblon : les clés du rang, dans l'ordre.
//   npx vite-node scripts/eval-hop/f8-diag.ts [--f=citrus|tropical] [--moment=dryActive|dryPost|b10] [--mode=aucun|k3k1]
import { CATALOGUE } from '../../src/domain/hopIndex/v4/data';
import { creerMoteur } from '../../src/domain/hopIndex/v4/moteur';
import type { FamilyId } from '../../src/domain/hopIndex/v4/families';
import type { Recipe, MomentId } from '../../src/domain/hopIndex/v4/recipe';
import { compareVoies } from '../../src/domain/hopIndex/v4/voies';

const args = process.argv.slice(2);
const val = (k: string, d: string) => args.find((a) => a.startsWith(`--${k}=`))?.split('=')[1] ?? d;
const f = val('f', 'citrus') as FamilyId, moment = val('moment', 'dryActive') as MomentId, mode = val('mode', 'aucun');
const SIX = ['el-dorado', 'mosaic', 'mandarina-bavaria', 'calypso', 'pacific-jade', 'idaho-7'];
const R22A: Recipe = { name: '22A Double IPA', styleCode: '22A', volumeL: 24, og: 1.081, boilMin: 60, yeastId: 'lalbrew-verdant-ipa', ebc: 10, additions: [
  { id: 'a1', hopKey: 'beermaverick-columbus', moment: 'b60', grams: 40 }, { id: 'a2', hopKey: 'beermaverick-columbus', moment: 'b10', grams: 40 },
  { id: 'a3', hopKey: 'beermaverick-lotus', moment: 'dryActive', grams: 100 }] };
const m = creerMoteur({ catalogue: CATALOGUE, stock: [] });
const res = m.proposeVoies(R22A, { [f]: 1 }, { maxBuy: 400, limit: 2000, buyLimit: 2000, perHop: 100, assemblages: false, moments: [moment], ...(mode === 'defaut' ? {} : { departage: mode as never }) });
const voies = res.voies.filter((v) => v.type === 'ajouter' && v.actions.length === 1 && v.actions[0].moment === moment).sort(compareVoies);
console.log(`style ${res.style.code} ; ${voies.length} voies ; direction`, JSON.stringify(res.direction.map((d) => [d.family, d.crans, d.delta])));
const ligne = (v: (typeof voies)[number], i: number) => `${String(i + 1).padStart(3)} ${v.actions[0].hopKey.replace('beermaverick-', '').padEnd(20)} conf ${v.conflicts.length} | débord ${v.overflowRang ?? v.overflowTotal} (${v.styleOverflow.map((o) => `${o.family}+${o.crans}`).join(' ')}) | dist ${v.distance.total} | cle ${JSON.stringify(v.departage?.cle ?? null)} | côté ${v.sideTotal} | g ${v.actions[0].grams}`;
voies.slice(0, 12).forEach((v, i) => console.log(ligne(v, i)));
console.log('--- ses six');
voies.forEach((v, i) => { if (SIX.includes(v.actions[0].hopKey.replace('beermaverick-', ''))) console.log(ligne(v, i)); });
console.log('--- bande du style', JSON.stringify(Object.fromEntries(Object.entries(res.style.families).map(([k, x]) => [k, `${x.status} ${x.band}`]))));
