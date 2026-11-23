// Voie f8 (D118, D191) : les houblons de Double IPA que le brasseur attend, dans les 10 premiers de Suggérer au dry hop.
//   npx vite-node scripts/eval-hop/f8-d191.ts [--mode=aucun|k1|k2|k3|k3k1|defaut] [--source=dryhop|principale] [--pool=80|400] [--plein] [--liste]
// Recette : 22A, 24 L, OG 1,081, levure Verdant IPA, Lotus au dry hop (sa recette du 27.10 ; ajouts SUPPOSÉS : le bilan d'IBU n'est pas dans la capture).
// Contrôle : pour « plus d'agrumes » et « plus de tropicaux », au dry hop (actif, puis après fermentation), au moins 4 de ses 6 houblons
// (El Dorado, Mosaic, Mandarina Bavaria, Calypso, Pacific Jade, Idaho 7) sont dans les 10 premiers HOUBLONS de la liste. Sortie : D191 OK / D191 ECHEC.
//  - source « dryhop » : les groupes du vrai dry hop (option `dryHop`, g2b), pool entier : la liste que la clé d'intensité range avant le débordement ;
//  - source « principale » : les voies d'ajout au dry hop de la liste principale (pool `--pool`, 80 en production).
import { CATALOGUE, chargerCataloguePlein } from '../../src/domain/hopIndex/v4/data';
import { creerMoteur } from '../../src/domain/hopIndex/v4/moteur';
import type { FamilyId } from '../../src/domain/hopIndex/v4/families';
import type { Recipe, MomentId } from '../../src/domain/hopIndex/v4/recipe';
import type { Departage } from '../../src/domain/hopIndex/v4/departage';
import type { Voie } from '../../src/domain/hopIndex/v4';
import { compareVoies } from '../../src/domain/hopIndex/v4/voies';

const args = process.argv.slice(2);
const arg = (k: string, d: string) => args.find((a) => a.startsWith(`--${k}=`))?.split('=')[1] ?? d;
const mode = arg('mode', 'defaut') as Departage | 'defaut';
const source = arg('source', 'dryhop');
const POOL = Number(arg('pool', '80')); // 80 : la borne de production (POOL_BORNE) ; 400 : tout le pool
const liste = args.includes('--liste');
const SES_SIX = ['el-dorado', 'mosaic', 'mandarina-bavaria', 'calypso', 'pacific-jade', 'idaho-7'];
const R22A: Recipe = { name: '22A Double IPA', styleCode: '22A', volumeL: 24, og: 1.081, boilMin: 60, yeastId: 'lalbrew-verdant-ipa', ebc: 10, additions: [
  { id: 'a1', hopKey: 'beermaverick-columbus', moment: 'b60', grams: 40 }, { id: 'a2', hopKey: 'beermaverick-columbus', moment: 'b10', grams: 40 },
  { id: 'a3', hopKey: 'beermaverick-lotus', moment: 'dryActive', grams: 100 }] };
const VISEES: [string, FamilyId][] = [['plus d’agrumes', 'citrus'], ['plus de tropicaux', 'tropical']];
const MOMENTS: [string, MomentId][] = [['dry hop actif', 'dryActive'], ['dry hop après', 'dryPost']];

async function main() {
  const catalogue = args.includes('--plein') ? await chargerCataloguePlein() : CATALOGUE;
  const m = creerMoteur({ catalogue, stock: [] });
  let reussi = true;
  for (const [nom, f] of VISEES) {
    const opts = { maxBuy: source === 'dryhop' ? 1 : POOL, limit: 2000, buyLimit: 2000, perHop: 100, assemblages: false, moments: ['dryActive', 'dryPost'] as MomentId[],
      ...(source === 'dryhop' ? { dryHop: true } : {}), ...(mode === 'defaut' ? {} : { departage: mode }) };
    const res = m.proposeVoies(R22A, { [f]: 1 }, opts);
    for (const [mnom, moment] of MOMENTS) {
      const voies: Voie[] = source === 'dryhop' ? (moment === 'dryActive' ? res.dryHop!.actif : res.dryHop!.apres)
        : res.voies.filter((v) => v.type === 'ajouter' && v.actions.length === 1 && v.actions[0].moment === moment).sort(compareVoies);
      const houblons: string[] = [];
      for (const v of voies) { const id = v.actions[0].hopKey.replace(/^beermaverick-/, '').replace(/:cryo$/, ''); if (!houblons.includes(id)) houblons.push(id); }
      const dix = houblons.slice(0, 10);
      const dedans = SES_SIX.filter((s) => dix.includes(s));
      const rangs = SES_SIX.map((s) => `${s} ${houblons.indexOf(s) + 1 || '–'}`).join(', ');
      const ok = dedans.length >= 4;
      reussi &&= ok;
      console.log(`${ok ? 'ok    ' : 'ECHEC '} ${nom} · ${mnom} : ${dedans.length}/6 dans les 10 premiers (${houblons.length} houblons) ; rangs : ${rangs}`);
      if (liste) console.log('        10 premiers :', dix.join(', '));
    }
  }
  console.log(reussi ? 'D191 OK' : 'D191 ECHEC');
}
void main();
