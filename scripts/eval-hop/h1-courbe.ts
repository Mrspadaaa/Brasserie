// Voie h1 (D197) : « trop herbal ». Critère 1 : la courbe simulée de l'herbacé et des agrumes, selon la dose de Cascade au dry hop, contre les mesures E04 (Lafontaine & Shellhammer 2018, H22 ; panel OSU, sur 15).
//   npx vite-node scripts/eval-hop/h1-courbe.ts
// Le simulé est en points de l'axe 0–100 ; le panel est sur 15 : « 15 points du panel = 100 points de l'axe » [convention] (correspondance-familles.json, courbes.ancre).
// On compare donc l'AJOUT (dose − témoin), pour chaque famille : simulé (apres − avant, le dry hop seul sur une bière non houblonnée) contre mesuré (dose − 0 g/L) × 100/15.
// Réglage sur Cascade (la seule série dose/herbacé publiée du catalogue : E04). Pas de seconde source de dose à l'herbacé : voir RESULTAT.md (L20).
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { creerMoteur } from '../../src/domain/hopIndex/v4/moteur';
import { simulerCas, courbeDe, CORRESPONDANCE } from '../../src/domain/hopIndex/v4/profil-simule';
import type { FamilyId } from '../../src/domain/hopIndex/v4/families';

creerMoteur();
const E04 = (JSON.parse(readFileSync(join(process.cwd(), 'src', 'data', 'hopV4', 'comparatifs-dryhop.json'), 'utf8')) as { etudes: { id: string; mesures: { variete?: string; dose_gL?: number; descripteur?: string; valeur?: number }[] }[] })
  .etudes.find((e) => e.id === 'E04')!.mesures;
const DOSES = [2, 3.86, 8, 16];
const mesure = (re: RegExp, d: number) => E04.find((m) => m.variete === 'Cascade' && re.test(m.descripteur ?? '') && m.dose_gL === d)!.valeur!;
const arrondi = (x: number, n = 1) => Math.round(x * 10 ** n) / 10 ** n;

const recette = { name: 'bière non houblonnée (E04)', styleCode: '', volumeL: 20, og: 1.05, boilMin: 60, yeastId: 'fermentis-us05', abv: 4.75, ebc: 6, additions: [] };
export function simule(hop: string, dose: number, f: FamilyId, moment: 'dryPost' | 'dryActive' = 'dryPost'): number {
  const s = simulerCas({ id: 'h1', titre: 'h1', ajouts: [{ id: 'x', houblon: hop, dose_gL: dose, moment, jours: 1 }], levure: 'fermentis-us05', recette: recette as never, complet: false });
  return s.apres[f].centre - s.avant[f].centre;
}

function main() {
  console.log(`K en vigueur : agrumes ${courbeDe('citrus').K}, herbacé ${courbeDe('herbal').K} (famille 'herbace' : ${CORRESPONDANCE.courbes.herbace.familles.join(', ')})\n`);
  console.log('Cascade, dry hop 24 h : ajout (dose − témoin) en points de l\'axe 0–100 ; mesuré = Δ panel × 100/15');
  console.log('dose g/L | agrumes mesuré  simulé  écart | herbacé mesuré  simulé  écart | herbacé/agrumes mesuré  simulé');
  const t = { cit: [] as number[], her: [] as number[] };
  for (const d of DOSES) {
    const mc = ((mesure(/^citrus/, d) - mesure(/^citrus/, 0)) * 100) / 15, mh = ((mesure(/^herbal/, d) - mesure(/^herbal/, 0)) * 100) / 15;
    const sc = simule('beermaverick-cascade', d, 'citrus'), sh = simule('beermaverick-cascade', d, 'herbal');
    t.cit.push(sc - mc); t.her.push(sh - mh);
    console.log(`${String(d).padStart(8)} | ${String(arrondi(mc)).padStart(14)}  ${String(arrondi(sc)).padStart(6)}  ${String(arrondi(sc - mc)).padStart(5)} | ${String(arrondi(mh)).padStart(14)}  ${String(arrondi(sh)).padStart(6)}  ${String(arrondi(sh - mh)).padStart(5)} | ${String(arrondi(mh / mc, 2)).padStart(21)}  ${String(arrondi(sh / sc, 2)).padStart(6)}`);
  }
  const rms = (xs: number[]) => Math.sqrt(xs.reduce((s, x) => s + x * x, 0) / xs.length);
  console.log(`\nécart quadratique moyen : agrumes ${arrondi(rms(t.cit))} pts, herbacé ${arrondi(rms(t.her))} pts (axe 0–100)`);
  const m16 = (((mesure(/^herbal/, 16) - mesure(/^herbal/, 0)) / (mesure(/^herbal/, 8) - mesure(/^herbal/, 0))) - 1) * 100;
  const s16 = (simule('beermaverick-cascade', 16, 'herbal') / simule('beermaverick-cascade', 8, 'herbal') - 1) * 100;
  const c16 = (simule('beermaverick-cascade', 16, 'citrus') / simule('beermaverick-cascade', 8, 'citrus') - 1) * 100;
  console.log(`de 8 à 16 g/L : herbacé mesuré +${arrondi(m16, 0)} %, simulé +${arrondi(s16, 0)} % ; agrumes mesuré −3 % (7,1 → 7,0), simulé +${arrondi(c16, 0)} %`);

  console.log('\nAutres houblons, mêmes conditions (AUCUNE mesure de dose à l\'herbacé publiée : forme seule, pas un jugement) : herbacé simulé / agrumes simulé à 4 puis 16 g/L');
  for (const h of ['beermaverick-citra', 'beermaverick-lotus', 'beermaverick-mosaic', 'beermaverick-east-kent-goldings', 'beermaverick-saaz']) {
    try {
      const r = (d: number) => `${arrondi(simule(h, d, 'herbal'))}/${arrondi(simule(h, d, 'citrus'))}`;
      console.log(`${h.replace('beermaverick-', '').padEnd(20)} 4 g/L ${r(4).padEnd(10)} 16 g/L ${r(16)}`);
    } catch (e) { console.log(h, 'indisponible :', (e as Error).message); }
  }
}
main();
