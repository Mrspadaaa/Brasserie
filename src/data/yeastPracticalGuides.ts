import type { HopSource } from '../../functions/src/hopIndexSchema';
import type { HopYeast } from '../../functions/src/hopPredictionSchema';

export interface YeastPracticalNote {
  id: string;
  title: string;
  detail: string;
  phase: 'preparation' | 'fermentation' | 'storage';
  source: HopSource;
}
interface YeastPracticalGuide { form: HopYeast['form']; notes: YeastPracticalNote[]; directPitchTemperatureC?: { min: number; max: number } }
const source = (author: string, title: string, reference: string): HopSource => ({ kind: 'manufacturer', author, title, reference, year: null, locator: 'Fiche produit consultée le 12 septembre 2026' });
const us05 = source('Fermentis', 'SafAle US-05 — usage et conservation', 'https://fermentis.com/en/product/safale-us-05/');
const w68 = source('Fermentis', 'SafAle W-68 — usage et conservation', 'https://fermentis.com/en/product/safale-w-68/');
const weizen = source('Wyeast', '3068 — Weihenstephan Weizen', 'https://wyeastlab.com/product/weihenstephan-weizen/');
const bavarian = source('Wyeast', '3638 — Bavarian Wheat', 'https://wyeastlab.com/product/bavarian-wheat/');
const wit = source('Wyeast', '3944 — Belgian Witbier', 'https://wyeastlab.com/product/belgian-witbier/');
const london = source('Wyeast', '1318 — London Ale III', 'https://wyeastlab.com/product/london-ale-iii/');
const wheatNotes = (s: HopSource): YeastPracticalNote[] => [
  { id: 'headspace', title: 'Place pour la mousse', phase: 'fermentation', detail: 'Wyeast demande 33 % d’espace libre dans le fermenteur pour cette souche à forte remontée de levure.', source: s },
  { id: 'sulfur', title: 'Soufre pendant la fermentation', phase: 'fermentation', detail: 'Une production de soufre est décrite comme habituelle ; Wyeast indique sa dissipation pendant la maturation, sans délai garanti.', source: s },
  { id: 'suspension', title: 'Levure encore en suspension', phase: 'fermentation', detail: 'Son caractère poudreux peut maintenir la levure en suspension après l’atténuation. L’aspect trouble seul ne détermine pas l’avancement.', source: s },
];

/** Product-specific manufacturer protocols, not defaults for every yeast or a repitched culture. */
export const YEAST_PRACTICAL_GUIDES: Record<string, YeastPracticalGuide> = {
  'fermentis-us05': { form: 'sèche', notes: [
    { id: 'direct-pitch', title: 'Ensemencement direct', phase: 'preparation', detail: 'Répartir progressivement à la surface du moût, à la température de fermentation ou au-dessus, en évitant les amas.', source: us05 },
    { id: 'rehydrate', title: 'Réhydratation possible', phase: 'preparation', detail: 'Autre méthode fabricant : au moins 10 fois le poids de levure en eau stérile ou moût houblonné bouilli, à 25–29 °C. Attendre 15–30 min, remuer doucement puis ensemencer.', source: us05 },
    { id: 'storage', title: 'Stockage et sachet ouvert', phase: 'storage', detail: 'Moins de 6 mois : sous 24 °C ; au-delà : sous 15 °C. Une fois ouvert, refermer, conserver à 4 °C et utiliser sous 7 jours. Vérifier la date du lot ; écarter un sachet mou ou endommagé.', source: us05 },
  ] },
  'fermentis-w68': { form: 'sèche', directPitchTemperatureC: { min: 20, max: 32 }, notes: [
    { id: 'direct-pitch', title: 'Ensemencement direct', phase: 'preparation', detail: 'La notice indique 20–32 °C pour l’ajout direct à la surface du moût, sans amas. Cette plage de préparation est distincte des 18–26 °C de fermentation.', source: w68 },
    { id: 'rehydrate', title: 'Réhydratation possible', phase: 'preparation', detail: 'Autre méthode fabricant : au moins 10 fois le volume de levure en eau ou moût, à 20–28 °C ; attendre 15–30 min, remuer doucement puis ensemencer. La notice exprime ici un volume, sans conversion en poids.', source: w68 },
    { id: 'storage', title: 'Stockage et sachet ouvert', phase: 'storage', detail: 'Moins de 6 mois : sous 25 °C ; au-delà : sous 15 °C. Une fois ouvert, refermer, conserver à 4 °C et utiliser sous 7 jours. Vérifier la date du lot ; écarter un sachet mou ou endommagé.', source: w68 },
  ] },
  'wyeast-3068': { form: 'liquide', notes: wheatNotes(weizen) },
  'wyeast-3638': { form: 'liquide', notes: wheatNotes(bavarian) },
  'wyeast-3944': { form: 'liquide', notes: [
    { id: 'headspace', title: 'Place pour la mousse', phase: 'fermentation', detail: 'Wyeast demande 33 % d’espace libre dans le fermenteur pour cette souche à forte remontée de levure.', source: wit },
  ] },
  'wyeast-1318': { form: 'liquide', notes: [
    { id: 'late-hops', title: 'Ajouts tardifs et Hazy IPA', phase: 'fermentation', detail: 'Wyeast décrit une association avec les houblons tropicaux en ajouts tardifs et à cru. Son fruité peut compléter le houblon ; aucun gain de biotransformation n’est chiffré.', source: london },
    { id: 'flocculation', title: 'Floculation et trouble', phase: 'fermentation', detail: 'La fiche indique une forte floculation et cite aussi les NEIPA/Hazy IPA. Ces indications ne promettent donc pas une bière limpide à une date donnée.', source: london },
  ] },
};
