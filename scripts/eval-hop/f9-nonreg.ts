// Voie f9 : non-régressions d'une combinaison (MESURE). Tableau avant (actuel) / après, pour chaque combinaison.
//   npx vite-node scripts/eval-hop/f9-nonreg.ts [--rapide]
//  1. phares (L14) : rang de Citra, Nelson Sauvin, Galaxy, Mosaic, Motueka, Idaho 7 dans la liste principale de Suggérer (stock des fixtures : Citra cryo en stock), 10′ et dry hop actif,
//     sur 21C (Nugget 60′, Cascade dry hop), 16D (Nugget 60′) et 22A (sa recette) ;
//  2. Citra cryo n'est pas premier partout (D174) : nombre de cas (style × visée × moment) où il est premier, avant et après ;
//  3. stout S1 (D105) : les 4 houblons à acheter de « plus floral, moins résineux » à 10′ (Goldings ou Celeia attendus, `departage: 'aucun'` comme à f8) et la liste complète identique pour la combinaison « actuel » ;
//  4. usage « arôme » à 60′ (D106) : le palier 60′ (+20 IBU) est identique, voie par voie, avec et sans la typicité (la clé d'une voie d'amertume est inconnue).
import { creerMoteur } from '../../src/domain/hopIndex/v4/moteur';
import type { Recipe, MomentId } from '../../src/domain/hopIndex/v4/recipe';
import type { Voie } from '../../src/domain/hopIndex/v4';
import type { FamilyId } from '../../src/domain/hopIndex/v4/families';
import { s1Recipe } from '../../prototypes/houblons-v4/src/pack/buildPack';
import { COMBINAISONS, R22A, chargerTable, idCourt } from './f9-commun';
import { poserTypicite } from '../../src/domain/hopIndex/v4/typicite';

const rapide = process.argv.includes('--rapide');
const CLE = (id: string) => `beermaverick-${id}`;
const R21C: Recipe = { name: '21C', styleCode: '21C', volumeL: 20, og: 1.058, boilMin: 60, yeastId: 'fermentis-us05', ebc: 8, additions: [{ id: 'a1', hopKey: CLE('nugget'), moment: 'b60', grams: 20 }, { id: 'a2', hopKey: CLE('cascade'), moment: 'dryActive', grams: 80 }] };
const R16D: Recipe = { name: '16D', styleCode: '16D', volumeL: 20, og: 1.066, boilMin: 60, yeastId: 'fermentis-us05', ebc: 70, additions: [{ id: 'a1', hopKey: CLE('nugget'), moment: 'b60', grams: 46 }] };
const CAS: { nom: string; r: Recipe; dir: Partial<Record<FamilyId, number>> }[] = [
  { nom: '21C agrumes', r: R21C, dir: { citrus: 1 } }, { nom: '21C tropicaux', r: R21C, dir: { tropical: 1 } }, { nom: '16D floral', r: R16D, dir: { floral: 1 } },
  { nom: '22A agrumes', r: R22A, dir: { citrus: 1 } }, { nom: '22A tropicaux', r: R22A, dir: { tropical: 1 } },
  ...(rapide ? [] : [{ nom: '16D tropicaux', r: R16D, dir: { tropical: 1 as number } }, { nom: '21C floral', r: R21C, dir: { floral: 1 as number } }, { nom: '22A résineux', r: R22A, dir: { resin: 1 as number } }]),
];
const MOMENTS: [string, MomentId][] = [['10′', 'b10'], ['dry hop actif', 'dryActive']];
const PHARES = ['citra', 'nelson-sauvin', 'galaxy', 'mosaic', 'motueka', 'idaho-7'];
const OUVERT = { limit: 2000, buyLimit: 2000, perHop: 100, assemblages: false } as const;
const liste = (voies: Voie[], moment: MomentId) => {
  const out: string[] = [];
  for (const v of voies.filter((x) => x.type === 'ajouter' && x.actions.length === 1 && x.actions[0].moment === moment)) { const id = v.actions[0].hopKey.replace(/^beermaverick-/, ''); if (!out.includes(id)) out.push(id); }
  return out;
};

function main() {
  chargerTable();
  const m = creerMoteur(); // fixtures : le stock du brasseur (Citra cryo en stock)
  const tableau: Record<string, Record<string, string>> = {};
  const cryoPremier: Record<string, number> = {}, citraPremier: Record<string, number> = {};
  for (const c of COMBINAISONS) {
    cryoPremier[c.nom] = 0; citraPremier[c.nom] = 0;
    for (const cas of CAS) {
      const res = m.proposeVoies(cas.r, cas.dir, { ...OUVERT, moments: ['b10', 'dryActive'], intensite: c.intensite, typicite: c.typicite });
      for (const [mnom, moment] of MOMENTS) {
        const ids = liste(res.voies, moment);
        if (ids[0] === 'citra:cryo') cryoPremier[c.nom]++;
        if (ids[0] === 'citra') citraPremier[c.nom]++;
        const l = ids.map((x) => x.replace(/:cryo$/, ''));
        (tableau[`${cas.nom} · ${mnom}`] ??= {})[c.nom] = `${ids[0]} | ${PHARES.map((p) => `${p.slice(0, 5)} ${l.indexOf(p) + 1 || '–'}`).join(' ')}`;
      }
    }
  }
  console.log('== 1. phares : premier de la liste, puis rang des phares (liste principale, fixtures)');
  for (const [cas, parC] of Object.entries(tableau)) { console.log(cas); for (const c of COMBINAISONS) console.log(`   ${c.nom.padEnd(14)} ${parC[c.nom]}`); }
  const nb = CAS.length * MOMENTS.length;
  console.log(`== 2. Citra cryo premier (sur ${nb} listes) : ${COMBINAISONS.map((c) => `${c.nom} ${cryoPremier[c.nom]}`).join(' ; ')} ; Citra premier : ${COMBINAISONS.map((c) => `${c.nom} ${citraPremier[c.nom]}`).join(' ; ')}`);
  console.log('== 3. stout S1 (plus floral, moins résineux), 4 achats à 10′, departage aucun puis défaut');
  for (const c of COMBINAISONS) {
    const aucun = m.proposeVoies(s1Recipe(), { floral: 1, resin: -1 }, { departage: 'aucun', intensite: c.intensite, typicite: c.typicite });
    const defaut = m.proposeVoies(s1Recipe(), { floral: 1, resin: -1 }, { intensite: c.intensite, typicite: c.typicite });
    const achats = (r: typeof aucun) => r.voies.filter((v) => v.domain === 'à acheter' && v.type === 'ajouter' && v.actions[0].moment === 'b10').map((v) => idCourt(v.actions[0].hopKey));
    console.log(`   ${c.nom.padEnd(14)} aucun : ${achats(aucun).join(', ')} | défaut : ${achats(defaut).join(', ')}`);
  }
  const base = m.proposeVoies(s1Recipe(), { floral: 1, resin: -1 }, {});
  console.log(`   liste complète « actuel » = liste sans options : ${JSON.stringify(m.proposeVoies(s1Recipe(), { floral: 1, resin: -1 }, { intensite: false, typicite: false }).voies) === JSON.stringify(base.voies) ? 'identique' : 'DIFFÉRENTE'}`);
  console.log('== 4. palier 60′ (+20 IBU), 22A : avec et sans typicité');
  const sans = m.proposeVoies(R22A, { citrus: 1 }, { palier60: { ibu: 20 }, moments: ['b10'], maxBuy: 0 }).palier60!.voies.map((v) => v.id);
  const avec = m.proposeVoies(R22A, { citrus: 1 }, { palier60: { ibu: 20 }, moments: ['b10'], maxBuy: 0, typicite: true }).palier60!.voies.map((v) => v.id);
  console.log(`   ${sans.length} voies ; même ordre : ${JSON.stringify(sans) === JSON.stringify(avec) ? 'oui' : 'NON'}`);
  poserTypicite(null);
}
main();
