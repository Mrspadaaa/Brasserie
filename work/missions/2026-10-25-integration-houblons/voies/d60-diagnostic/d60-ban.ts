// Voie d60-diagnostic : le bannissement D194 coupe-t-il APRÈS la coupe d'affichage ? Pour chaque cas « bannir », les voies gardées par le moteur (limit 10, buyLimit 4, perHop 2),
// puis ce qu'`exclue` retire à l'écran, sans que la place soit rendue. MESURE, ae7c7a8d. Lancement (copie propre) : vite-node dist/d60/d60-ban.ts -- --sortie=<dossier>
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
const COPIE = 'C:/Users/mrspa/AppData/Local/Temp/deploy-63130965';
const args = process.argv.slice(2);
const SORTIE = args.find((a) => a.startsWith('--sortie='))?.split('=')[1] ?? '.';
const { chargerCataloguePlein, STOCK } = await import(/* @vite-ignore */ `${COPIE}/src/domain/hopIndex/v4/data.ts`);
const { creerMoteur } = await import(/* @vite-ignore */ `${COPIE}/src/domain/hopIndex/v4/moteur.ts`);
const { poserTypicite } = await import(/* @vite-ignore */ `${COPIE}/src/domain/hopIndex/v4/typicite.ts`);
poserTypicite(JSON.parse(readFileSync(join(COPIE, 'src/data/hopV4/typicite-styles.json'), 'utf8')));
const plein = await chargerCataloguePlein();
const MOTEURS: [string, any][] = [['sans stock', creerMoteur({ catalogue: plein, stock: [] })], ['stock fixture', creerMoteur({ catalogue: plein, stock: STOCK })]];
type R = any;
const recettes: Record<string, R> = {
  'stout S1 (16D)': { name: 'S1', styleCode: '16D', volumeL: 20, og: 1.066, boilMin: 60, yeastId: 'fermentis-us05', ebc: 70, additions: [{ id: 'a1', hopKey: 'beermaverick-nugget', moment: 'b60', grams: 46 }] },
  '21C hazy': { name: 'Hazy', styleCode: '21C', volumeL: 20, og: 1.058, boilMin: 60, yeastId: 'fermentis-us05', ebc: 8, additions: [{ id: 'a1', hopKey: 'beermaverick-nugget', moment: 'b60', grams: 20 }, { id: 'a2', hopKey: 'beermaverick-cascade', moment: 'dryActive', grams: 80 }] },
  'pale ale 18B': { name: 'PA', styleCode: '18B', volumeL: 20, og: 1.052, boilMin: 60, yeastId: 'fermentis-us05', ebc: 8, additions: [{ id: 'a1', hopKey: 'beermaverick-magnum-us', moment: 'b60', grams: 14 }, { id: 'a2', hopKey: 'beermaverick-cascade', moment: 'b10', grams: 20 }, { id: 'a3', hopKey: 'beermaverick-cascade', moment: 'dryActive', grams: 40 }] },
};
const DEM: [string, Record<string, number>][] = [['bannir résineux', { resin: -1 }], ['tropicaux + bannir résineux', { tropical: 1, resin: -1 }]];
const bannis = ['resin'];
const out: any[] = [];
for (const [rn, r] of Object.entries(recettes)) for (const [sn, m] of MOTEURS) for (const [dn, dir] of DEM) {
  const res = m.proposeVoies(r, dir, { assemblages: true });
  const enleve = (v: any) => bannis.some((f) => v.effect[f].established && (v.effect[f].central ?? 0) < 0);
  const types = res.voies.filter((v: any) => v.type === 'ajouter' || v.type === 'assemblage' || v.type === 'remplacer à IBU égal' || (v.type === 'remplacer à masse égale' && enleve(v)));
  const exclue = (v: any) => [...new Set(v.actions.filter((a: any) => a.op !== 'retirer').map((a: any) => a.hopKey))].some((k: any) => { const ref = m.hopRef(k); const d = ref && m.describeFamilies(ref.varietyId); return !!d && bannis.some((f) => d[f].level !== 'non décrit'); });
  const retirees = types.filter(exclue);
  const par = (xs: any[]) => { const o: Record<string, number> = {}; for (const v of xs) { const k = `${v.type}@${v.actions[0].moment}`; o[k] = (o[k] ?? 0) + 1; } return o; };
  const ligne = { recette: rn, stock: sn, demande: dn, gardeesParLeMoteur: res.voies.length, typesGardes: types.length, retireesParExclue: retirees.length, montrees: types.length - retirees.length, retireesParType: par(retirees), montreesParType: par(types.filter((v: any) => !exclue(v))) };
  out.push(ligne);
  process.stdout.write(`${rn} | ${sn} | ${dn} : gardées ${ligne.gardeesParLeMoteur}, types ${ligne.typesGardes}, retirées par exclue ${ligne.retireesParExclue}, montrées ${ligne.montrees} ; retirées ${JSON.stringify(ligne.retireesParType)} ; montrées ${JSON.stringify(ligne.montreesParType)}\n`);
}
mkdirSync(SORTIE, { recursive: true });
writeFileSync(join(SORTIE, 'd60-ban.json'), `${JSON.stringify(out, null, 1)}\n`);
poserTypicite(null);
