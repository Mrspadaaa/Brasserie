// Voie h1 (D197) : les 124 cas d'a4-general / s3-general (31 styles de `pharesParStyle` × « plus d'agrumes » et « plus floral » × dry hop actif et 10′) AVANT la règle (`defautVegetal: false`, l'ordre de HEAD) et APRÈS (défaut).
// Trois états : `avant` ; `apres` (la règle dans le moteur, l'écran lit toujours `estHorsDuStyle` d'aujourd'hui, qui ne connaît pas `defaut`) ; `apresEcran` (la règle, et l'écran qui compte aussi `defaut` comme « hors du style »).
//   npx vite-node scripts/eval-hop/h1-general.ts -- [--sortie=fichier.json]
// Rend : les contradictions carte / liste, le meilleur phare et le phare médian, le nombre de propositions montrées, les cas qui reculent de plus de 20 places, et les cas où la tête (4 premiers) change.
import { writeFileSync } from 'node:fs';
import { chargerCataloguePlein } from '../../src/domain/hopIndex/v4/data';
import type { FamilyId } from '../../src/domain/hopIndex/v4/families';
import { creerMoteur } from '../../src/domain/hopIndex/v4/moteur';
import type { MomentId, Recipe } from '../../src/domain/hopIndex/v4/recipe';
import type { Voie } from '../../src/domain/hopIndex/v4';
import { compareVoies } from '../../src/domain/hopIndex/v4/voies';
import { estHorsDuStyle } from '../../src/ui/hopIndex/suggerer/voies';
import { PHARES_PAR_STYLE } from '../../tests/unit/hopIndexV4/pharesParStyle';
import { chargerTable, idCourt } from './f9-commun';
import { poserTypicite } from '../../src/domain/hopIndex/v4/typicite';

const sortie = process.argv.find((a) => a.startsWith('--sortie='))?.split('=')[1];
const recette = (style: string): Recipe => ({ name: style, styleCode: style, volumeL: 24, og: 1.06, boilMin: 60, yeastId: 'fermentis-us05', ebc: 10, additions: [{ id: 'a1', hopKey: 'beermaverick-nugget', moment: 'b60', grams: 20 }] });
const mediane = (xs: number[]) => { if (!xs.length) return null; const s = [...xs].sort((a, b) => a - b); const m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };
const DEMANDES: [string, FamilyId][] = [['plus d’agrumes', 'citrus'], ['plus floral', 'floral']];
const MOMENTS: [string, MomentId][] = [['dry hop actif', 'dryActive'], ['10′', 'b10']];
interface Ligne { cle: string; meilleur: number | null; mediane: number | null; tete: string[]; montrees: number }
type Mode = 'avant' | 'apres' | 'apresEcran';
const horsEcran = (o: { status: string; voulu?: true; minuscule?: true; defaut?: true }) => estHorsDuStyle(o) || (!!o.defaut && !o.voulu && !o.minuscule);

async function main() {
  chargerTable();
  const m = creerMoteur({ catalogue: await chargerCataloguePlein(), stock: [] });
  const res: Record<Mode, { bilan: { listes: number; contradictions: number; montrees: number }; lignes: Ligne[]; cartes: string[]; teteMontree: Record<string, string[]> }> = {} as never;
  const MODES: [Mode, object][] = [['avant', { defautVegetal: false }], ['apres', {}], ['apresEcran', {}]];
  for (const [mode, opts] of MODES) {
    const lignes: Ligne[] = [], cartes: string[] = [], teteMontree: Record<string, string[]> = {};
    const bilan = { listes: 0, contradictions: 0, montrees: 0 };
    const hors = (v: Voie) => v.styleOverflow.some(mode === 'apresEcran' ? horsEcran : estHorsDuStyle);
    for (const style of Object.keys(PHARES_PAR_STYLE)) {
      const phares = PHARES_PAR_STYLE[style].map(idCourt);
      for (const [dn, f] of DEMANDES) {
        const grand = m.proposeVoies(recette(style), { [f]: 1 }, { limit: 2000, buyLimit: 2000, perHop: 100, assemblages: false, moments: ['b10', 'dryActive'], ...opts });
        const montre = m.proposeVoies(recette(style), { [f]: 1 }, { assemblages: true, ...opts });
        const shown = montre.voies.filter((v: Voie) => v.type !== 'levure');
        teteMontree[`${style} · ${dn}`] = shown.slice(0, 4).map((v) => v.actions.map((a) => `${idCourt(a.hopKey)}@${a.moment}:${a.grams}`).join('+'));
        for (const [mn, mo] of MOMENTS) {
          const vus: string[] = [];
          for (const v of grand.voies.filter((x) => x.type === 'ajouter' && x.actions.length === 1 && x.actions[0].moment === mo).sort(compareVoies)) { const id = idCourt(v.actions[0].hopKey); if (!vus.includes(id)) vus.push(id); }
          const rangs = phares.map((p) => vus.indexOf(p) + 1).filter((r) => r > 0);
          lignes.push({ cle: `${style} · ${dn} · ${mn}`, meilleur: rangs.length ? Math.min(...rangs) : null, mediane: mediane(rangs), tete: vus.slice(0, 4), montrees: shown.length });
        }
        const etabli = (v: Voie) => v.effect[f].established && (v.effect[f].central ?? 0) > 0;
        bilan.listes++; bilan.montrees += shown.length;
        if (shown.length && shown.some(etabli) && !shown.some((v) => etabli(v) && !hors(v))) { bilan.contradictions++; cartes.push(`${style} · ${dn}`); }
      }
    }
    res[mode] = { bilan, lignes, cartes, teteMontree };
  }
  const reculs = res.avant.lignes.flatMap((a, i) => {
    const b = res.apres.lignes[i];
    return ([['meilleur', a.meilleur, b.meilleur], ['médiane', a.mediane, b.mediane]] as const)
      .filter(([, x, y]) => x !== null && y !== null && y - x > 20).map(([k, x, y]) => `${a.cle} : ${k} ${x} → ${y} (${a.tete.join(', ')} → ${b.tete.join(', ')})`);
  });
  const teteChange = res.avant.lignes.flatMap((a, i) => { const b = res.apres.lignes[i]; return a.tete.join() === b.tete.join() ? [] : [`${a.cle} : ${a.tete.join(', ')} → ${b.tete.join(', ')}`]; });
  const montreeChange = Object.keys(res.avant.teteMontree).filter((k) => res.avant.teteMontree[k].join() !== res.apres.teteMontree[k].join()).map((k) => `${k} : ${res.avant.teteMontree[k].join(' | ')} → ${res.apres.teteMontree[k].join(' | ')}`);
  const med = (mode: Mode, k: 'meilleur' | 'mediane') => mediane(res[mode].lignes.map((l) => l[k]).filter((x): x is number => x !== null));
  const synthese = {
    cas: res.avant.lignes.length,
    listes: res.avant.bilan.listes,
    contradictions: { avant: res.avant.bilan.contradictions, apres: res.apres.bilan.contradictions, apresEcran: res.apresEcran.bilan.contradictions },
    voiesMontreesEnTout: { avant: res.avant.bilan.montrees, apres: res.apres.bilan.montrees },
    meilleurPhare: { avant: med('avant', 'meilleur'), apres: med('apres', 'meilleur') },
    phareMedian: { avant: med('avant', 'mediane'), apres: med('apres', 'mediane') },
    reculsDePlusDe20Places: reculs,
    casOuLaTeteDesPharesChange: teteChange.length,
    teteDesPharesChange: teteChange,
    listesMontreesOuLes4PremieresChangent: montreeChange.length,
    montreeChange,
    cartesEnContradiction: { avant: res.avant.cartes, apres: res.apres.cartes, apresEcran: res.apresEcran.cartes },
  };
  if (sortie) writeFileSync(sortie, `${JSON.stringify({ synthese, res }, null, 1)}\n`);
  console.log(JSON.stringify(synthese, null, 1));
  poserTypicite(null);
}
void main();
