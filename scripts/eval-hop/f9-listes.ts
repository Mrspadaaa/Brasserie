// Voie f9 : les listes pour la page de mini maquettes. MESURE seulement (aucune donnée réelle, aucun appel Gemini).
//   npx vite-node scripts/eval-hop/f9-listes.ts [--plein]      écrit work/missions/2026-10-25-integration-houblons/voies/f9-intensite-typicite/listes.json
// Pour chacune des 4 combinaisons (actuel, A3, typicité, A3 + typicité) et chaque question (plus d'agrumes, plus de tropicaux ; dry hop actif, dry hop après fermentation, whirlpool) :
// les 10 premiers de la LISTE PRINCIPALE (celle que l'écran lit, pool de 80 comme en production) avec nom, α, dose, apport par famille et raison, le rang de ses six, et les barres
// de la bière (12 familles, repère central et plage) APRÈS l'ajout du premier, avec la bande du style.
// Recette : sa vraie recette (neipa v3, 22A) ; Lotus 84 g à 40′ lu comme 30′ (le moteur n'a pas de moment à 40′).
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { FAMILIES } from '../../src/domain/hopIndex/v4/families';
import { poserTypicite } from '../../src/domain/hopIndex/v4/typicite';
import type { Voie } from '../../src/domain/hopIndex/v4/voies';
import type { MomentId } from '../../src/domain/hopIndex/v4/recipe';
import { COMBINAISONS, R22A, SES_SIX, VISEES, chargerTable, idCourt, listePrincipale, moteurPlein } from './f9-commun';

const SORTIE = join(process.cwd(), 'work', 'missions', '2026-10-25-integration-houblons', 'voies', 'f9-intensite-typicite', 'listes.json');
const QUESTIONS: [string, MomentId][] = [['dry hop actif', 'dryActive'], ['dry hop après fermentation', 'dryPost'], ['whirlpool', 'wp']];
const r1 = (x: number) => Math.round(x * 10) / 10;

async function main() {
  chargerTable();
  const m = await moteurPlein(process.argv.includes('--plein'));
  const alphaDe = (varietyId: string) => { const a = m.catalogue.find((c) => c.id === varietyId)?.alpha; return a ? r1((a[0] + a[1]) / 2) : null; };
  const raison = (v: Voie, f: string) => {
    const o = v.departage?.origine ?? [];
    const e = v.effect[f as keyof Voie['effect']];
    const parts = [`distance à la visée ${v.distance.total ?? 'inconnue'}`];
    if (v.typicite) parts.push(v.typicite.palier === null ? `typicité inconnue (${v.typicite.raison})` : `typicité ${['', 'rare', 'courant', 'typé'][v.typicite.palier]}${v.typicite.part !== null ? `, ${r1(v.typicite.part * 100)} % des recettes du style (ou d'un voisin × 0,5)` : ''}${v.typicite.concentration !== null ? `, ${Math.round(v.typicite.concentration * 100)} % de ses recettes dans la famille du style` : ''}`);
    if (e?.intensite) parts.push(e.intensite.radar === null ? 'intensité inconnue : effet neutre (×1)' : `intensité radar ${e.intensite.radar}/5 : effet ×${e.intensite.facteur}`);
    const radar = o.find((x) => x?.startsWith('radar'));
    if (radar) parts.push('départage : radar Beer Maverick puis fiches');
    return parts.join(' ; ');
  };
  const sortie: unknown[] = [];
  for (const c of COMBINAISONS) {
    const questions: unknown[] = [];
    for (const [nom, f] of VISEES) {
      const res = m.proposeVoies(R22A, { [f]: 1 }, { maxBuy: 80, limit: 2000, buyLimit: 2000, perHop: 100, assemblages: false, moments: ['wp', 'dryActive', 'dryPost'], intensite: c.intensite, typicite: c.typicite });
      for (const [mnom, moment] of QUESTIONS) {
        const voies = listePrincipale(res, moment);
        const vus: string[] = [];
        const uniques = voies.filter((v) => { const id = idCourt(v.actions[0].hopKey); if (vus.includes(id)) return false; vus.push(id); return true; });
        const dix = uniques.slice(0, 10);
        const premier = dix[0];
        questions.push({
          question: nom, famille: f, moment: mnom,
          dix: dix.map((v, i) => ({
            rang: i + 1, houblon: v.actions[0].hopName, id: idCourt(v.actions[0].hopKey), alphaPct: alphaDe(v.actions[0].hopKey.replace(/:cryo$/, '')), grammes: v.actions[0].grams, gPerL: v.actions[0].gramsPerLitre,
            apport: Object.fromEntries(FAMILIES.map((x) => [x, v.effect[x].central])), raison: raison(v, f),
            typicite: v.typicite ?? null, intensite: v.effect[f].intensite ?? null,
          })),
          sesSix: Object.fromEntries(SES_SIX.map((s) => [s, vus.indexOf(s) + 1 || null])), nbHoublons: uniques.length,
          barresApresLePremier: premier ? {
            houblon: premier.actions[0].hopName,
            familles: Object.fromEntries(FAMILIES.map((x) => { const p = premier.after?.[x]; const b = res.style.families[x]; return [x, { central: p?.central ?? null, min: p?.range?.min ?? null, max: p?.range?.max ?? null, statut: p?.status ?? null, bandeStyle: b?.band ?? null, statutStyle: b?.status ?? null }]; })),
          } : null,
        });
      }
    }
    sortie.push({ combinaison: c.nom, intensite: c.intensite, typicite: c.typicite, questions });
  }
  const doc = {
    _: 'Listes de la voie f9 pour la page de mini maquettes (MESURE). Données de typicité : Beer Analytics, CC BY-SA 4.0 (https://www.beer-analytics.com), table dérivée src/data/hopV4/typicite-styles.json. Radar : Beer Maverick.',
    recette: { nom: R22A.name, style: R22A.styleCode, volumeL: R22A.volumeL, og: R22A.og, ajouts: R22A.additions, note: 'Lotus 84 g à 15 % α, 40′ d’ébullition lu comme 30′ (le moteur n’a pas de moment à 40′) ; aucun dry hop dans la recette du fichier.' },
    ses_six: SES_SIX, liste: 'principale (pool de 80, comme l’écran)', combinaisons: sortie,
  };
  writeFileSync(SORTIE, `${JSON.stringify(doc, null, 1)}\n`);
  poserTypicite(null);
  console.log(`listes.json écrit : ${COMBINAISONS.length} combinaisons × ${VISEES.length * QUESTIONS.length} questions`);
}
void main();
