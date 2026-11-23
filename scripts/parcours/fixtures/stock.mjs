// Fixture du PARCOURS STOCK (21.11) — « ZZ TEST », données simulées ; rien de la vraie brasserie (jamais seedData.ts).
// Elle part de la fixture des chaînes (rayons, manques : `fixtureChaines`, lue sans être modifiée) et y ajoute ce que la chasse du Stock a
// vu chez le brasseur (CHASSE-*.md) :
//   • un houblon vendu en paquet, au nom de facture : « ZZ TEST Cryo Hops Citra 25g », 1 Pck, α 24,8 %, sans seuil (STC-2, STC-17, STM-1) ;
//   • un brassin planifié qui en veut 40 g, lié PAR `stockItemRef` (le manque de Cryo) ;
//   • un malt lié par `stockItemRef` à une recette, à côté du Caramünch lié par le NOM (STM-10 : renommer ne doit pas lui faire perdre son manque) ;
//   • de quoi remplir les rayons comme chez lui : 19 malts (EBC connu sur la plupart, inconnu sur quelques-uns), 22 houblons, 11 levures dont 4 « Autres »
//     (kveik : colonne « Autres » du mur), Dextrose et Sucre de resucrage (Sucre), Bouteille 33 cl (200 pièces), un article de Nettoyage vide (STE-9).
// Sortie : { entrees, ids }.
import { fixtureChaines } from './chaines.mjs';

export const IDS = {
  cryo: 'ZZ-CRYO', nomCryo: 'ZZ TEST Cryo Hops Citra 25g',
  malt: 'ZZ-CARA', nomMalt: 'ZZ TEST Caramünch Typ 2',   // lié par le nom (B-ZZ-MANQUE)
  maltRef: 'ZZ-REF', nomMaltRef: 'ZZ TEST Malt lié par référence', // lié par stockItemRef (B-ZZ-REF)
  nbMalts: 17 /* + Dextrose et Sucre de resucrage, rangés par l'app dans le rayon Malts : 19 */, nbHoublons: 22, nbLevures: 11, nbAutres: 4
};

export function fixtureStock(aujourdhui) {
  const base = fixtureChaines(aujourdhui, { sansJour: true, rayons: true, manques: true }).entrees;
  const entrees = [...base];
  const add = (name, id, data) => entrees.push({ name, id, data: { ...data, id } });
  const article = (id, name, category, unit, currentStock, extra = {}) => add('stockItems', id, { id, ref: id, name, category, unit, currentStock, reorder: true, ...extra });
  const dans = (n) => { const d = new Date(Date.parse(`${aujourdhui}T12:00:00Z`) + n * 86400000); return `${String(d.getUTCDate()).padStart(2, '0')}.${String(d.getUTCMonth() + 1).padStart(2, '0')}.${d.getUTCFullYear()}`; };

  // l'EBC des trois malts de base
  for (const [id, ebc] of [['ZZ-PILS', 3.5], ['ZZ-MUNICH', 17], ['ZZ-CARA', 120]]) { const e = entrees.find((x) => x.name === 'stockItems' && x.id === id); if (e) e.data.colorEbc = ebc; }

  // Cryo : un paquet de 25 g, nom de facture, pas de seuil
  article(IDS.cryo, IDS.nomCryo, 'Houblon', 'Pck', 1, { supplier: 'ZZ TEST Hopfen', pricePerUnit: 9.9, alphaPct: 24.8 });
  // un malt lié par référence, 2 kg au stock, un brassin qui en veut 8
  article(IDS.maltRef, IDS.nomMaltRef, 'Malt', 'kg', 2, { supplier: 'ZZ TEST', pricePerUnit: 2.1, colorEbc: 9 });

  const clone = (name, id) => structuredClone(entrees.find((x) => x.name === name && x.id === id));
  const batchModele = clone('batches', 'B-ZZ-MANQUE'); const recetteModele = clone('recipes', 'R-ZZ-BRUNE');
  const poser = (idRecette, idLot, nom, jours, fermentables, hops) => {
    const rs = { ...recetteModele.data, id: idRecette, name: nom, fermentables, hops };
    delete rs.recipeSnapshot;
    add('recipes', idRecette, rs);
    add('batches', idLot, { ...batchModele.data, id: idLot, name: nom, recipeRef: idRecette, plannedBrewDate: dans(jours), recipeSnapshot: { ...rs } });
  };
  poser('R-ZZ-CRYO', 'B-ZZ-CRYO', 'ZZ TEST Cryo Pale', 20,
    [{ name: 'ZZ TEST Malt pilsner', weightKg: 10, kind: 'grain' }],
    [{ name: IDS.nomCryo, stockItemRef: IDS.cryo, weightG: 40, stage: 'whirlpool', time: 15 }]);
  poser('R-ZZ-REF', 'B-ZZ-REF', 'ZZ TEST Réf', 12,
    [{ name: IDS.nomMaltRef, stockItemRef: IDS.maltRef, weightKg: 8, kind: 'grain' }],
    [{ name: 'ZZ TEST Citra', weightG: 50, stage: 'boil', time: 60 }]);

  // 19 malts : 3 de la chaîne + Munich… ; les autres, EBC connu sauf un sur quatre
  const nomsMalts = ['Pale Ale', 'Vienna', 'Wheat', 'Carapils', 'Cara Clair', 'Melanoidin', 'Biscuit', 'Special B', 'Chocolat', 'Black', 'Roasted Barley', 'Flocons d’avoine', 'Seigle', 'Smoked', 'Acidulé', 'Maris Otter'];
  const dejaMalts = base.filter((e) => e.name === 'stockItems' && /^Malt/i.test(e.data.category)).length + 1; // + Malt lié par référence
  nomsMalts.slice(0, Math.max(0, IDS.nbMalts - dejaMalts)).forEach((n, i) => article(`ZZ-M${i}`, `ZZ TEST ${n}`, 'Malt', 'kg', 5 + i * 3, { supplier: 'ZZ TEST', ...(i % 4 === 3 ? {} : { colorEbc: 4 + i * 11 }) }));
  // 22 houblons (3 de la chaîne + Cryo)
  const nomsH = ['Cascade', 'Centennial', 'Simcoe', 'Amarillo', 'Galaxy', 'Nelson Sauvin', 'Motueka', 'Hallertau', 'Tettnang', 'Magnum', 'Columbus', 'Chinook', 'Idaho 7', 'Strata', 'Azacca', 'El Dorado', 'Styrian Golding', 'Fuggle'];
  const dejaH = base.filter((e) => e.name === 'stockItems' && /^Houblon/i.test(e.data.category)).length + 1;
  nomsH.slice(0, Math.max(0, IDS.nbHoublons - dejaH)).forEach((n, i) => article(`ZZ-H${i}`, `ZZ TEST ${n}`, 'Houblon', 'g', 100 + i * 40, { supplier: 'ZZ TEST', alphaPct: 4 + (i % 9) }));
  // 11 levures : 7 reconnues, 4 « Autres » (kveik)
  const reconnues = ['Verdant', 'Nottingham', 'Windsor', 'WB-06', 'SafLager W-34/70', 'S-04'];
  const dejaL = base.filter((e) => e.name === 'stockItems' && /^Levure/i.test(e.data.category)).length;
  reconnues.slice(0, Math.max(0, IDS.nbLevures - IDS.nbAutres - dejaL)).forEach((n, i) => article(`ZZ-L${i}`, `ZZ TEST ${n}`, 'Levure', 'sachet', 2 + i, { supplier: 'ZZ TEST', yeastLot: { expiresOn: `${Number(aujourdhui.slice(0, 4)) + 1}-0${1 + i}-15` } }));
  ['Voss', 'Hornindal', 'Oslo', 'Framgarden'].forEach((n, i) => article(`ZZ-K${i}`, `ZZ TEST Kveik ${n}`, 'Levure', 'sachet', 1 + i, { supplier: 'ZZ TEST' }));
  // une famille vide : Nettoyage sans article tient une tuile « 0/0 » dans Recompter (STE-9) ; on ne pose rien dedans
  return {
    entrees,
    ids: { ...IDS, comptes: {
      malts: entrees.filter((e) => e.name === 'stockItems' && /^Malt/i.test(e.data.category)).length,
      houblons: entrees.filter((e) => e.name === 'stockItems' && /^Houblon/i.test(e.data.category)).length,
      levures: entrees.filter((e) => e.name === 'stockItems' && /^Levure/i.test(e.data.category)).length
    } }
  };
}
