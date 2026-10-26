// Voie t1-traduction (D160, 26.10) : aucun mot anglais affiché depuis les nouvelles sources. Constat du pilote, sur Substituer de
// Magnum (US) à 60′ : « lui seul : muscade, no distinct aroma characteristics » et, pour Magnum (GR), « net, clean bitterness ».
// Pour les 318 houblons du catalogue, chaque mot que montrent « lui seul » (matrice de la fiche, Substituer, Suggérer), « Ses mots »
// de Comparer, la feuille Sources et « autres » est en français, ou un mot laissé tel quel (liste ci-dessous, avec sa raison).
// Une phrase qui n'est pas un arôme (amertume, intensité, « aucun arôme distinct ») ne se montre dans aucune de ces listes.
// L'oracle ne lit pas l'anglais : un mot montré doit être le résultat d'une traduction (valeur de la table) ou un mot gardé.
import { describe, expect, it } from 'vitest';
import { CATALOGUE } from '../../../src/domain/hopIndex/v4/data';
import { sesMots } from '../../../src/ui/hopIndex/comparer/calcul';
import { autresDe } from '../../../src/ui/hopIndex/fiche/autres';
import { motsFiche } from '../../../src/ui/hopIndex/fiche/donnees-matrice';
import { bas, estNonArome, tableFr } from '../../../src/ui/hopIndex/fiche/traduction';
import { speciauxDe } from '../../../src/ui/hopIndex/maBiere/legende-bande';
import { motsHors as horsSubstituer } from '../../../src/ui/hopIndex/substituer/donnees';
import { motsHors as horsSuggerer } from '../../../src/ui/hopIndex/suggerer/hors16d';

/** Mots écrits pareil en français et en anglais, noms propres (cépage, plat, boisson) et « dank » (terme de brasseur, 18 houblons,
 * laissé tel quel : cerveau/metier/descripteurs-hors-familles). Un autre mot montré tel quel est une traduction oubliée. */
const GARDES = new Set([
  'orange', 'rose', 'caramel', 'cannabis', 'curry', 'cognac', 'eucalyptus', 'menthol', 'hibiscus', 'magnolia', 'kiwi', 'mojito', 'potpourri',
  'nectarine', 'nectar', 'melon', 'floral', 'kumquat', 'gazpacho', 'toffee', 'sauvignon blanc', 'dank', 'noble', 'cassis', 'fruit', 'barrique',
]);
// Des mots qui n'existent qu'en anglais : s'ils sortent d'un écran, personne ne les a traduits.
const ANGLAIS = /\b(with|of|the|and|aroma|notes?|tones?|bitter\w*|intensity|characteristics|strong|slightly|very|sweet|lemon|lime|tea|wine|grapes?|pepper|spic(e|es|y)|herbal|woody|earthy|berries|fresh|green|pine|mint|honey|candied|dried)\b/;

const traduits = () => new Set([...tableFr()].filter(([k, v]) => k !== v).map(([, v]) => bas(v)));
const IDS = CATALOGUE.map((h) => h.id);

/** Tous les mots que montrent les écrans pour un houblon, avec l'écran qui les montre. */
function montres(id: string): { ecran: string; mot: string }[] {
  const out: { ecran: string; mot: string }[] = [];
  for (const m of motsFiche(id)) out.push({ ecran: 'matrice et feuille Sources', mot: m.mot });
  for (const m of sesMots([id])[id] ?? []) out.push({ ecran: 'Ses mots (Comparer)', mot: m.mot });
  for (const m of horsSubstituer(id).hors) out.push({ ecran: 'lui seul (Substituer)', mot: m.mot });
  for (const m of horsSuggerer(id)) out.push({ ecran: 'lui seul (Suggérer)', mot: m.mot });
  for (const m of autresDe(id)?.mots ?? []) out.push({ ecran: 'autres (fiche)', mot: m.mot });
  // s2 (D170, 26.10) : la carte dépliée de Ma bière (« orange · lemon », « tropical fruits » sur Lotus) : ses mots précis par famille
  // (legende-bande.tsx, speciauxDe) et ses mots hors des 12 familles. Ce chemin-là n'appelait pas la table : il manquait à ce contrôle.
  const carte = speciauxDe(id);
  for (const mots of Object.values(carte.precis)) for (const m of mots ?? []) out.push({ ecran: 'carte de Ma bière (mots par famille)', mot: m });
  for (const m of carte.sans) out.push({ ecran: 'carte de Ma bière (◇)', mot: m.mot });
  return out;
}

describe('D160 : les mots montrés sont en français', () => {
  const fr = traduits();
  it('317 houblons à contrôler (c6 : Equinox est Ekuanot)', () => { expect(IDS.length).toBe(317); });
  it('chaque mot montré par la matrice, Ses mots, lui seul, Sources et autres est une traduction ou un mot gardé', () => {
    const fautes = new Map<string, Set<string>>();
    for (const id of IDS) for (const x of montres(id)) {
      const k = bas(x.mot);
      if (fr.has(k) || GARDES.has(k)) continue;
      (fautes.get(k) ?? fautes.set(k, new Set()).get(k)!).add(x.ecran);
    }
    expect([...fautes].map(([mot, ecrans]) => `${mot} (${[...ecrans].join(', ')})`)).toEqual([]);
  });
  it('aucun mot montré ne contient un mot qui n\'existe qu\'en anglais', () => {
    const fautes = new Set<string>();
    for (const id of IDS) for (const x of montres(id)) if (ANGLAIS.test(bas(x.mot))) fautes.add(bas(x.mot));
    expect([...fautes]).toEqual([]);
  });
  it('une phrase qui n\'est pas un arôme ne se montre nulle part (amertume, intensité, aucun arôme distinct)', () => {
    const fautes = new Set<string>();
    for (const id of IDS) for (const x of montres(id)) if (estNonArome(x.mot)) fautes.add(`${bas(x.mot)} (${x.ecran})`);
    expect([...fautes]).toEqual([]);
  });
  it('le tri reconnaît les phrases du constat et ne prend pas un arôme pour une phrase', () => {
    for (const p of ['no distinct aroma characteristics', 'clean bitterness', 'Good for bittering', 'net', 'medium intensity', 'very mild']) expect(estNonArome(p)).toBe(true);
    for (const a of ['muscade', 'lemon', 'white wine', 'pine', 'tropical fruit', 'dank', 'strong zesty aroma']) expect(estNonArome(a)).toBe(false);
  });
  it('la carte de Lotus : « orange · citron », plus de « lemon » ni de « tropical fruits »', () => {
    const mots = Object.values(speciauxDe('beermaverick-lotus').precis).flat().map((m) => bas(m ?? ''));
    expect(mots).toContain('citron');
    expect(mots.some((m) => /lemon|tropical/.test(m))).toBe(false);
  });
  it('Magnum (US) et Magnum (GR) : plus de phrase anglaise, leurs mots d\'arôme restent', () => {
    for (const id of ['beermaverick-magnum-us', 'beermaverick-magnum-gr']) {
      const mots = montres(id).map((x) => bas(x.mot));
      expect(mots.some((m) => /aroma characteristics|bitterness|^net$|^clean$/.test(m))).toBe(false);
    }
    expect(montres('beermaverick-magnum-us').map((x) => bas(x.mot))).toContain('muscade');
  });
});
