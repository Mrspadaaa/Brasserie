// Voie d60-diagnostic : la borne du pool (POOL_BORNE = 80) et ce qu'elle laisse comme candidats de REMPLACEMENT à 60′ (usage, α). MESURE, ae7c7a8d.
// Lancement (depuis la copie propre) : node_modules/.bin/vite-node dist/d60/d60-pool.ts -- --sortie=<dossier>
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
const COPIE = 'C:/Users/mrspa/AppData/Local/Temp/deploy-63130965';
const args = process.argv.slice(2);
const SORTIE = args.find((a) => a.startsWith('--sortie='))?.split('=')[1] ?? '.';
const { chargerCataloguePlein } = await import(/* @vite-ignore */ `${COPIE}/src/domain/hopIndex/v4/data.ts`);
const { creerMoteur } = await import(/* @vite-ignore */ `${COPIE}/src/domain/hopIndex/v4/moteur.ts`);
const { poserTypicite } = await import(/* @vite-ignore */ `${COPIE}/src/domain/hopIndex/v4/typicite.ts`);
poserTypicite(JSON.parse(readFileSync(join(COPIE, 'src/data/hopV4/typicite-styles.json'), 'utf8')));
const m = creerMoteur({ catalogue: await chargerCataloguePlein(), stock: [] });
const r: any = { name: 'S1', styleCode: '16D', volumeL: 20, og: 1.066, boilMin: 60, yeastId: 'fermentis-us05', ebc: 70, additions: [{ id: 'a1', hopKey: 'beermaverick-nugget', moment: 'b60', grams: 46 }] };
const BIG = { limit: 5000, buyLimit: 5000, perHop: 5000, assemblages: false, moments: [] as string[] };
const out: any = { recette: 'stout S1 (Nugget 46 g à 60′)', demandes: {} };
for (const [nom, dir] of [['plus d’agrumes', { citrus: 1 }], ['plus de tropicaux', { tropical: 1 }], ['bannir résineux', { resin: -1 }]] as const) {
  const lire = (maxBuy: number) => {
    const res = m.proposeVoies(r, dir as any, { ...BIG, maxBuy });
    const rem = res.voies.filter((v: any) => v.type === 'remplacer à IBU égal');
    const usages: Record<string, number> = { bittering: 0, dual: 0, aroma: 0, inconnu: 0 };
    let alphaMin8 = 0;
    for (const v of rem) {
      const ref = m.hopRef(v.actions[0].hopKey);
      usages[ref?.catalogue.purpose ?? 'inconnu']++;
      if ((ref?.alpha?.value ?? 0) >= 8) alphaMin8++;
    }
    return { remplacementsApresProgres: rem.length, parUsage: usages, alphaAu_moins_8: alphaMin8, grammesMedians: rem.map((v: any) => v.actions[0].grams).sort((a: number, b: number) => a - b)[rem.length >> 1] ?? null };
  };
  out.demandes[nom] = { pool80: lire(80), poolTout: lire(400) };
  process.stdout.write(`${nom} : ${JSON.stringify(out.demandes[nom])}\n`);
}
mkdirSync(SORTIE, { recursive: true });
writeFileSync(join(SORTIE, 'd60-pool.json'), `${JSON.stringify(out, null, 1)}\n`);
poserTypicite(null);
