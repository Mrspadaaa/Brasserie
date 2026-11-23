// Voie f2-affinage-a-b1-c-d : le rapport des houblons phares (L14), avant et après chaque correctif (A, B1, C). Déterministe : ni durée ni date.
//   npx vite-node scripts/eval-hop/f2-phares.ts -- --etat=<nom> [--sortie=<dossier>]   (sortie : phares-<nom>.json ; l'empreinte sha256 est imprimée sans le nom)
// Ce que le brasseur reconnaît : où sont ses houblons phares, dans Suggérer (liste par défaut et classement entier) et dans Substituer (60′ et dry hop).
// Recettes : la 21C (Nugget 20 g à 60′, Cascade 80 g en dry hop actif) et la stout 16D (Nugget 46 g à 60′), 20 L, stock des fixtures du prototype (Citra cryo 65 g).
import { createHash } from 'node:crypto';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { CATALOGUE } from '../../src/domain/hopIndex/v4/data';
import { creerMoteur } from '../../src/domain/hopIndex/v4/moteur';
import type { Recipe } from '../../src/domain/hopIndex/v4/recipe';
import type { Voie } from '../../src/domain/hopIndex/v4';
import type { FamilyId } from '../../src/domain/hopIndex/v4/families';
import { getStyleScale } from '../../src/domain/hopIndex/v4/style/scale';

const args = process.argv.slice(2);
const opt = (nom: string) => args.find((a) => a.startsWith(`--${nom}=`))?.slice(nom.length + 3);
const ETAT = opt('etat') ?? 'courant';
const SORTIE = resolve(opt('sortie') ?? 'work/missions/2026-10-25-integration-houblons/voies/f2-affinage-a-b1-c-d/phares');
const CLE = (id: string) => `beermaverick-${id}`;
const R21C: Recipe = { name: '21C', styleCode: '21C', volumeL: 20, og: 1.058, boilMin: 60, yeastId: 'fermentis-us05', ebc: 8, additions: [
  { id: 'a1', hopKey: CLE('nugget'), moment: 'b60', grams: 20 }, { id: 'a2', hopKey: CLE('cascade'), moment: 'dryActive', grams: 80 }] };
const R16D: Recipe = { name: '16D', styleCode: '16D', volumeL: 20, og: 1.066, boilMin: 60, yeastId: 'fermentis-us05', ebc: 70, additions: [{ id: 'a1', hopKey: CLE('nugget'), moment: 'b60', grams: 46 }] };
const VISEES: { nom: string; r: Recipe; dir: Partial<Record<FamilyId, number>> }[] = [
  { nom: '21C plus d’agrumes', r: R21C, dir: { citrus: 1 } }, { nom: '16D plus floral', r: R16D, dir: { floral: 1 } }, { nom: '16D moins de résineux', r: R16D, dir: { resin: -1 } }];
const PHARES = ['citra', 'nelson-sauvin', 'galaxy', 'mosaic', 'motueka', 'idaho-7', 'strata', 'simcoe', 'cascade', 'hallertau-blanc'];
const CITRA = CLE('citra'), CRYO = `${CLE('citra')}:cryo`;
const FIX = () => creerMoteur();
const OUVERT = { limit: 2000, buyLimit: 2000, perHop: 100, assemblages: false } as const;
for (const p of PHARES) if (!CATALOGUE.some((h) => h.id === CLE(p))) throw new Error(`phare absent du catalogue : ${p}`);

const sur = (vs: Voie[], k: string) => { const i = vs.findIndex((v) => v.actions.some((a) => a.hopKey === k)); return i < 0 ? null : i + 1; };
const nomDe = (k: string) => CATALOGUE.find((h) => h.id === k.replace(/:cryo$/, ''))?.name ?? k;

// ---------- Suggérer ----------
const suggerer = VISEES.map(({ nom, r, dir }) => {
  const m = FIX();
  const defaut = m.proposeVoies(r, dir, { assemblages: true, palier60: { ibu: 10 }, dryHop: true });
  const entier = m.proposeVoies(r, dir, { ...OUVERT, palier60: { ibu: 10 }, dryHop: true });
  const ligne = (k: string) => ({
    voies: { defaut: sur(defaut.voies, k), classementEntier: sur(entier.voies.filter((v) => v.type === 'ajouter' || v.type.startsWith('remplacer')), k) },
    palier60: { defaut: sur(defaut.palier60!.voies, k), classementEntier: sur(entier.palier60!.voies, k), sur: entier.palier60!.voies.length },
    dryHopActif: { defaut: sur(defaut.dryHop!.actif, k), classementEntier: sur(entier.dryHop!.actif, k), sur: entier.dryHop!.actif.length },
  });
  const tete = (vs: Voie[]) => vs.slice(0, 5).map((v) => `${v.rank} ${v.actions[0].hopName}`);
  return {
    visee: nom, evalues: { defaut: defaut.evaluated, classementEntier: entier.evaluated },
    houblonsDistinctsDansLaListeParDefaut: new Set(defaut.voies.flatMap((v) => v.actions.map((a) => a.hopKey.replace(/:cryo$/, '')))).size,
    phares: Object.fromEntries(PHARES.map((p) => [nomDe(CLE(p)), ligne(CLE(p))])),
    citra: { simple: ligne(CITRA), cryo: ligne(CRYO) },
    palier60Tete: tete(defaut.palier60!.voies), dryHopActifTete: tete(defaut.dryHop!.actif),
  };
});

// ---------- Substituer : où sont les phares quand l'original est Nugget (60′ et dry hop) ; et les remplaçants de chaque phare (tête de 5) ----------
const substituer = [{ code: '21C', r: R21C }, { code: '16D', r: R16D }].flatMap(({ code, r }) => (['b60', 'dryActive'] as const).map((moment) => {
  const res = FIX().substitutes(CLE('nugget'), { moment, grams: r.additions[0].grams, recipe: r, style: getStyleScale(code), stockFirst: false });
  const tous = res.remplacants;
  const ligne = (k: string) => { const s = tous.find((x) => x.key === k); return s ? { rang: tous.indexOf(s) + 1, score: s.score, palier: s.palier, doseG: s.dose.grams, demotion: s.amertumeDeconseillee ? true : false } : null; };
  return { recette: code, original: 'Nugget', moment, phares: Object.fromEntries(PHARES.map((p) => [nomDe(CLE(p)), ligne(CLE(p))])), citra: { simple: ligne(CITRA), cryo: ligne(CRYO) }, tete10: tous.slice(0, 10).map((s) => `${s.name} ${s.score}`) };
}));
const sansStock = creerMoteur({ catalogue: CATALOGUE, stock: [] });
const remplacantsDesPhares = PHARES.map((p) => ({ phare: nomDe(CLE(p)), ...Object.fromEntries((['b60', 'dryActive'] as const).map((moment) => [moment, sansStock.substitutes(CLE(p), { moment }).remplacants.slice(0, 5).map((s) => `${s.name} ${s.score}`)])) }));

const sortie = { etat: ETAT, recettes: '21C (Nugget 20 g 60′, Cascade 80 g dry hop actif) et 16D (Nugget 46 g 60′), 20 L, stock des fixtures (Citra cryo 65 g, α 24,8 %)', suggerer, substituer, remplacantsDesPhares };
const json = JSON.stringify(sortie, null, 1) + '\n';
mkdirSync(SORTIE, { recursive: true });
writeFileSync(join(SORTIE, `phares-${ETAT}.json`), json);
const s0 = suggerer[0];
process.stdout.write(`21C défaut : ${s0.houblonsDistinctsDansLaListeParDefaut} houblons ; 60′ tête ${s0.palier60Tete.slice(0, 3).join(' | ')} ; Citra cryo au 60′ : ${s0.citra.cryo.palier60.defaut}/${s0.citra.cryo.palier60.sur} ; Citra simple au 60′ : ${s0.citra.simple.palier60.classementEntier}\n`
  + `sha256 ${createHash('sha256').update(JSON.stringify({ ...sortie, etat: '' }, null, 1)).digest('hex')} (sans le nom de l’état)\n`);
