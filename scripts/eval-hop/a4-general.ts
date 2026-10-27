// Voie a4 : la règle se vérifie sur des cas que le brasseur n'a jamais nommés (L14). Pour les 31 styles de `pharesParStyle` (les houblons que les guides de style citent, écrits avant tout classement) et deux demandes
// par style (« plus d'agrumes », « plus floral »), au dry hop actif et à 10′ : le rang du meilleur phare et la médiane des phares, dans la liste principale (pool de 80, comme l'écran) ; et la cohérence carte / liste.
//   npx vite-node scripts/eval-hop/a4-general.ts -- [--sortie=fichier.json]
// Carte / liste : l'écran dit « Aucune voie houblon » (carte) quand aucune des voies montrées n'a d'effet établi sur la famille sans « hors style » (`styleOverflow` non vide). On compte les listes MONTRÉES (défaut : 4 achats, 10 du
// stock) où la carte dirait « Aucune » alors que des rangées sont montrées, avec la règle d'aujourd'hui de l'écran (tout `styleOverflow` compte) et avec le neutre exclu.
import { writeFileSync } from 'node:fs';
import { chargerCataloguePlein } from '../../src/domain/hopIndex/v4/data';
import type { FamilyId } from '../../src/domain/hopIndex/v4/families';
import { creerMoteur } from '../../src/domain/hopIndex/v4/moteur';
import type { MomentId, Recipe } from '../../src/domain/hopIndex/v4/recipe';
import type { Voie } from '../../src/domain/hopIndex/v4';
import { compareVoies } from '../../src/domain/hopIndex/v4/voies';
import { PHARES_PAR_STYLE } from '../../tests/unit/hopIndexV4/pharesParStyle';
import { chargerTable, idCourt } from './f9-commun';
import { poserTypicite } from '../../src/domain/hopIndex/v4/typicite';

const sortie = process.argv.find((a) => a.startsWith('--sortie='))?.split('=')[1];
const recette = (style: string): Recipe => ({ name: style, styleCode: style, volumeL: 24, og: 1.06, boilMin: 60, yeastId: 'fermentis-us05', ebc: 10, additions: [{ id: 'a1', hopKey: 'beermaverick-nugget', moment: 'b60', grams: 20 }] });
const mediane = (xs: number[]) => { if (!xs.length) return null; const s = [...xs].sort((a, b) => a - b); const m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };
const DEMANDES: [string, FamilyId][] = [['plus d’agrumes', 'citrus'], ['plus floral', 'floral']];
const MOMENTS: [string, MomentId][] = [['dry hop actif', 'dryActive'], ['10′', 'b10']];

async function main() {
  chargerTable();
  const m = creerMoteur({ catalogue: await chargerCataloguePlein(), stock: [] });
  const lignes: Record<string, unknown>[] = [];
  const bilan = { listes: 0, contradictionAujourdhui: 0, contradictionNeutreExclu: 0 };
  for (const style of Object.keys(PHARES_PAR_STYLE)) {
    const phares = PHARES_PAR_STYLE[style].map(idCourt);
    for (const [dn, f] of DEMANDES) {
      const grand = m.proposeVoies(recette(style), { [f]: 1 }, { limit: 2000, buyLimit: 2000, perHop: 100, assemblages: false, moments: ['b10', 'dryActive'] });
      const montre = m.proposeVoies(recette(style), { [f]: 1 }, { assemblages: true });
      for (const [mn, mo] of MOMENTS) {
        const vus: string[] = [];
        for (const v of grand.voies.filter((x) => x.type === 'ajouter' && x.actions.length === 1 && x.actions[0].moment === mo).sort(compareVoies)) { const id = idCourt(v.actions[0].hopKey); if (!vus.includes(id)) vus.push(id); }
        const rangs = phares.map((p) => vus.indexOf(p) + 1).filter((r) => r > 0);
        lignes.push({ style, demande: dn, moment: mn, houblons: vus.length, meilleur: rangs.length ? Math.min(...rangs) : null, mediane: mediane(rangs), phares: rangs.length, tete: vus.slice(0, 4) });
      }
      // Cohérence carte / liste, sur ce que l'écran montre (voies de houblon, hors levure).
      const shown = montre.voies.filter((v: Voie) => v.type !== 'levure');
      const etabli = (v: Voie) => v.effect[f].established && (v.effect[f].central ?? 0) > 0;
      const dit = (vs: Voie[]) => !vs.some(etabli);
      const aujourdhui = shown.filter((v) => !v.styleOverflow.length), neutreExclu = shown.filter((v) => !v.styleOverflow.some((o) => o.status !== 'neutre'));
      bilan.listes++;
      if (shown.length && shown.some(etabli) && dit(aujourdhui)) bilan.contradictionAujourdhui++;
      if (shown.length && shown.some(etabli) && dit(neutreExclu)) bilan.contradictionNeutreExclu++;
      lignes.push({ style, demande: dn, carte: { voiesMontrees: shown.length, avecEffet: shown.filter(etabli).length, sansHorsStyleAujourdhui: aujourdhui.filter(etabli).length, sansHorsStyleNeutreExclu: neutreExclu.filter(etabli).length } });
    }
  }
  if (sortie) writeFileSync(sortie, `${JSON.stringify({ bilan, lignes }, null, 1)}\n`);
  console.log(JSON.stringify(bilan));
  poserTypicite(null);
}
void main();
