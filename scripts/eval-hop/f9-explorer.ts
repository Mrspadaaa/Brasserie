// Voie f9 : exploration du RANG (MESURE seulement). Un appel de proposeVoies par (intensité, famille) rend les voies avec leur typicité et leur clé ;
// le script les RE-RANGE avec plusieurs comparateurs (position de la typicité, de la clé radar) pour voir lequel place ses six dans les 10 premiers.
//   npx vite-node scripts/eval-hop/f9-explorer.ts [--pool=80|400] [--plein]
import { poserTypicite } from '../../src/domain/hopIndex/v4/typicite';
import type { Voie } from '../../src/domain/hopIndex/v4/voies';
import { chargerTable, moteurPlein, R22A, VISEES, MOMENTS_DRY, SES_SIX, idCourt, houblonsDe, rangs } from './f9-commun';

const args = process.argv.slice(2);
const POOL = Number((args.find((a) => a.startsWith('--pool=')) ?? '--pool=80').split('=')[1]);
type Cmp = (a: Voie, b: Voie) => number;
const t = (v: Voie) => v.typicite?.palier ?? null;
const cmpNullDernier = (x: number | null, y: number | null) => (x === y ? 0 : x === null ? 1 : y === null ? -1 : y - x);
const dist = (a: Voie, b: Voie) => (a.distance.total ?? 99) - (b.distance.total ?? 99);
const deb = (a: Voie, b: Voie) => (a.overflowRang ?? a.overflowTotal) - (b.overflowRang ?? b.overflowTotal);
const citee = (a: Voie, b: Voie) => cmpNullDernier(a.departage?.cle[0] ?? null, b.departage?.cle[0] ?? null);
const radar = (a: Voie, b: Voie) => cmpNullDernier(a.departage?.cle[1] ?? null, b.departage?.cle[1] ?? null);
const reste = (a: Voie, b: Voie) => { for (let i = 2; i < (a.departage?.cle.length ?? 0); i++) { const c = cmpNullDernier(a.departage!.cle[i], b.departage!.cle[i]); if (c) return c; } return 0; };
const typ: Cmp = (a, b) => cmpNullDernier(t(a), t(b));
const COMPARATEURS: Record<string, Cmp> = {
  'actuel (dist, citée, radar, k1)': (a, b) => deb(a, b) || dist(a, b) || citee(a, b) || radar(a, b) || reste(a, b),
  'typ avant débord': (a, b) => typ(a, b) || deb(a, b) || dist(a, b) || citee(a, b) || radar(a, b) || reste(a, b),
  'typ après dist, avant radar': (a, b) => deb(a, b) || dist(a, b) || citee(a, b) || typ(a, b) || radar(a, b) || reste(a, b),
  'typ après radar': (a, b) => deb(a, b) || dist(a, b) || citee(a, b) || radar(a, b) || typ(a, b) || reste(a, b),
  'citée, typ, radar avant débord': (a, b) => citee(a, b) || typ(a, b) || radar(a, b) || deb(a, b) || dist(a, b) || reste(a, b),
  'citée, radar, typ avant débord': (a, b) => citee(a, b) || radar(a, b) || typ(a, b) || deb(a, b) || dist(a, b) || reste(a, b),
  'distance, typ, radar (sans débord)': (a, b) => dist(a, b) || citee(a, b) || typ(a, b) || radar(a, b) || reste(a, b),
};

async function main() {
  chargerTable();
  const m = await moteurPlein(args.includes('--plein'));
  for (const intensite of [false, true]) for (const [nom, f] of VISEES) {
    const res = m.proposeVoies(R22A, { [f]: 1 }, { maxBuy: POOL, limit: 2000, buyLimit: 2000, perHop: 100, assemblages: false, moments: ['dryActive', 'dryPost'], dryHop: true, intensite, typicite: true });
    for (const [mnom, moment] of MOMENTS_DRY) {
      const listes: [string, Voie[]][] = [
        ['principale', res.voies.filter((v) => v.type === 'ajouter' && v.actions.length === 1 && v.actions[0].moment === moment)],
        ['groupe dry hop', moment === 'dryActive' ? res.dryHop!.actif : res.dryHop!.apres],
      ];
      for (const [src, voies] of listes) for (const [cn, cmp] of Object.entries(COMPARATEURS)) {
        const hs = houblonsDe([...voies].sort((a, b) => cmp(a, b) || a.label.localeCompare(b.label, 'fr')));
        const dedans = SES_SIX.filter((s) => hs.slice(0, 10).includes(s)).length;
        console.log(`A3=${intensite ? 'oui' : 'non'} | ${nom} | ${mnom} | ${src} (${hs.length}) | ${cn} : ${dedans}/6 | ${rangs(hs)}`);
        if (cn.startsWith('typ après dist') || cn.startsWith('citée, typ')) console.log('      top10 :', hs.slice(0, 10).join(', '));
      }
    }
  }
  poserTypicite(null);
  void idCourt;
}
void main();
