// Trois états : `avant` (ae7c7a8d), `r3` (8e17aa00 : R1 à R3, sans R4) et `apres` (R4 : un amérisant au whirlpool et au dry hop passe après les houblons d'arôme ou de double usage).
// Voie s3 (D195) : la généralisation de a4-general (31 styles de `pharesParStyle`, « plus d'agrumes » et « plus floral », dry hop actif et 10′) AVANT (`saturation: false`, l'ordre d'ae7c7a8d) et APRÈS (défaut),
// avec la règle de l'écran de chaque côté : avant `status !== 'neutre'`, après `estHorsDuStyle` (voulu et minuscule ne sont plus hors du style).
//   npx vite-node scripts/eval-hop/s3-general.ts -- [--sortie=fichier.json]
// Rend : les contradictions carte / liste (carte « Aucune » au-dessus de rangées), le meilleur phare et le phare médian (médiane des rangs des 31 styles), et les cas qui reculent de plus de 20 places.
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
interface Ligne { cle: string; meilleur: number | null; mediane: number | null; tete: string[] }

async function main() {
  chargerTable();
  const m = creerMoteur({ catalogue: await chargerCataloguePlein(), stock: [] });
  const res: Record<string, { bilan: { listes: number; contradictions: number }; lignes: Ligne[]; cartes: string[] }> = {};
  const MODES = [['avant', { saturation: false, usageAuFrais: false }], ['r3', { saturation: true, usageAuFrais: false }], ['apres', {}]] as const;
  for (const [mode, opts] of MODES) {
    const lignes: Ligne[] = [], cartes: string[] = [];
    const bilan = { listes: 0, contradictions: 0 };
    const hors = (v: Voie) => (mode === 'avant' ? v.styleOverflow.some((o) => o.status !== 'neutre') : v.styleOverflow.some(estHorsDuStyle));
    for (const style of Object.keys(PHARES_PAR_STYLE)) {
      const phares = PHARES_PAR_STYLE[style].map(idCourt);
      for (const [dn, f] of DEMANDES) {
        const grand = m.proposeVoies(recette(style), { [f]: 1 }, { limit: 2000, buyLimit: 2000, perHop: 100, assemblages: false, moments: ['b10', 'dryActive'], ...opts });
        const montre = m.proposeVoies(recette(style), { [f]: 1 }, { assemblages: true, ...opts });
        for (const [mn, mo] of MOMENTS) {
          const vus: string[] = [];
          for (const v of grand.voies.filter((x) => x.type === 'ajouter' && x.actions.length === 1 && x.actions[0].moment === mo).sort(compareVoies)) { const id = idCourt(v.actions[0].hopKey); if (!vus.includes(id)) vus.push(id); }
          const rangs = phares.map((p) => vus.indexOf(p) + 1).filter((r) => r > 0);
          lignes.push({ cle: `${style} · ${dn} · ${mn}`, meilleur: rangs.length ? Math.min(...rangs) : null, mediane: mediane(rangs), tete: vus.slice(0, 4) });
        }
        const shown = montre.voies.filter((v: Voie) => v.type !== 'levure');
        const etabli = (v: Voie) => v.effect[f].established && (v.effect[f].central ?? 0) > 0;
        bilan.listes++;
        if (shown.length && shown.some(etabli) && !shown.some((v) => etabli(v) && !hors(v))) { bilan.contradictions++; cartes.push(`${style} · ${dn}`); }
      }
    }
    res[mode] = { bilan, lignes, cartes };
  }
  const reculsDe = (de: 'avant' | 'r3') => res[de].lignes.flatMap((a, i) => {
    const b = res.apres.lignes[i];
    const d = [['meilleur', a.meilleur, b.meilleur], ['médiane', a.mediane, b.mediane]] as const;
    return d.filter(([, x, y]) => x !== null && y !== null && y - x > 20).map(([k, x, y]) => `${a.cle} : ${k} ${x} → ${y} (${a.tete.join(', ')} → ${b.tete.join(', ')})`);
  });
  const med = (mode: 'avant' | 'r3' | 'apres', k: 'meilleur' | 'mediane') => mediane(res[mode].lignes.map((l) => l[k]).filter((x): x is number => x !== null));
  const synthese = {
    contradictions: { avant: res.avant.bilan.contradictions, r3: res.r3.bilan.contradictions, apres: res.apres.bilan.contradictions, sur: res.avant.bilan.listes },
    meilleurPhare: { avant: med('avant', 'meilleur'), r3: med('r3', 'meilleur'), apres: med('apres', 'meilleur') },
    phareMedian: { avant: med('avant', 'mediane'), r3: med('r3', 'mediane'), apres: med('apres', 'mediane') },
    reculsDePlusDe20PlacesDepuisR3: reculsDe('r3'),
    reculsDePlusDe20PlacesDepuisAvant: reculsDe('avant'),
    cartesEnContradiction: { avant: res.avant.cartes, r3: res.r3.cartes, apres: res.apres.cartes },
  };
  if (sortie) writeFileSync(sortie, `${JSON.stringify({ synthese, res }, null, 1)}\n`);
  console.log(JSON.stringify(synthese, null, 1));
  poserTypicite(null);
}
void main();
