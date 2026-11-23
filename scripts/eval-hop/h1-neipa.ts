// Voie h1 (D197), critère 3 : la neipa saturée (22A, Lotus 78 g à 15′ + 144 g au dry hop actif), « plus d'agrumes » : la tête de Suggérer avant (`defautVegetal: false`, l'ordre de HEAD) et après la règle.
// Pour chaque voie de tête : l'effet sur les agrumes et sur l'herbacé / le végétal (points 0–100, le simulé V5.5), le débordement de l'herbacé / du végétal en crans, la dose, le moment.
//   npx vite-node scripts/eval-hop/h1-neipa.ts -- [--n=14] [--demande=citrus] [--moment=dryActive,wp]
import { chargerCataloguePlein } from '../../src/domain/hopIndex/v4/data';
import { creerMoteur } from '../../src/domain/hopIndex/v4/moteur';
import type { FamilyId } from '../../src/domain/hopIndex/v4/families';
import type { MomentId } from '../../src/domain/hopIndex/v4/recipe';
import { SATUREE } from './h1-commun';
import type { Voie } from '../../src/domain/hopIndex/v4';
import { poserTypicite } from '../../src/domain/hopIndex/v4/typicite';
import { chargerTable, idCourt } from './f9-commun';

const arg = (k: string, d: string) => process.argv.find((a) => a.startsWith(`--${k}=`))?.split('=')[1] ?? d;
const crans = Number(arg('crans', '1')), n = Number(arg('n', '14')), demande = arg('demande', 'citrus') as FamilyId, moments = arg('moment', 'dryActive,wp').split(',') as MomentId[];
const r1 = (x: number | null | undefined) => (x == null ? '  ?' : String(Math.round(x * 10) / 10));
const vegetal = (v: Voie) => v.styleOverflow.filter((o) => o.family === 'herbal' || o.family === 'green');

async function main() {
  chargerTable();
  const m = creerMoteur({ catalogue: await chargerCataloguePlein(), stock: [] });
  for (const [nom, opts] of [['AVANT (defautVegetal: false, ordre de HEAD)', { defautVegetal: false }], ['APRÈS (règle h1, défaut)', {}]] as const) {
    const res = m.proposeVoies(SATUREE, { [demande]: crans }, { assemblages: true, moments, ...(process.argv.includes('--grand') ? { limit: 60, buyLimit: 60, perHop: 3 } : {}), ...opts } as never);
    const voies = res.voies.filter((v) => v.type !== 'levure');
    console.log(`--- ${nom} : ${voies.length} voies, ${demande} aux moments ${moments.join('+')}`);
    console.log('rang type                   voie                                       agrumes herbacé végétal | herbacé hors bande (crans) rang');
    for (const v of voies.slice(0, n)) {
      const veg = vegetal(v);
      console.log(`${String(v.rank).padStart(3)} ${v.type.padEnd(22)} ${v.actions.map((a) => `${a.op === 'retirer' ? '−' : ''}${idCourt(a.hopKey)}@${a.moment}:${a.grams}`).join(' + ').padEnd(42)} ${r1(v.effect[demande].central).padStart(7)} ${r1(v.effect.herbal.central).padStart(7)} ${r1(v.effect.green.central).padStart(7)} | ${(veg.map((o) => `${o.family}${o.crans}${o.voulu ? 'V' : ''}${o.minuscule ? 'm' : ''}`).join(' ') || '–').padEnd(26)} ${r1(v.overflowRang ?? v.overflowTotal)}`);
    }
    const t4 = voies.slice(0, 4), connus = t4.filter((v) => v.effect.herbal.central !== null);
    const hors = t4.filter((v) => vegetal(v).some((o) => !o.voulu && !o.minuscule));
    console.log(`  4 premières voies : herbacé connu sur ${connus.length}/4 (${connus.map((v) => r1(v.effect.herbal.central)).join(', ') || '–'} pts ; ${4 - connus.length} inconnu${4 - connus.length > 1 ? 's' : ''}, jamais compté 0) ; ${hors.length}/4 sortent de la bande en herbacé/végétal`);
  }
  poserTypicite(null);
}
void main();
