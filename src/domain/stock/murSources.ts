// Les sources réelles du mur du stock : catalogue des houblons (Beer Maverick), table de typicité par style (Beer Analytics, CC BY-SA 4.0),
// type des malts (Beer Analytics), profils de levures du dépôt. Ce module est chargé avec le mur seulement (morceau à part).
import typicite from '../../data/hopV4/typicite-styles.json';
import fermentescibles from '../../data/fermentables/fermentescibles.json';
import { YEAST_RECIPE_PROFILES } from '../../data/yeastRecipeProfiles';
import { catalogue } from '../hopIndex/v4/data';
import { varieteDe } from '../hopIndex/v4/donneesApp';
import { slugBeerAnalytics } from '../fermentables/noms';
import type { StockItem } from '../../types';
import type { ColonneLevure, SourcesMur, TypeMalt } from './murDonnees';

const T = typicite as unknown as { parts: Record<string, Record<string, number>>; auFrais?: { parts: Record<string, number> } };
let parHoublon: Map<string, Record<string, number>> | null = null;
/** `parts[code][houblon]` retourné en `houblon → {code: part}` : un seul parcours, gardé. */
const partsDe = (id: string): Record<string, number> | null => {
  if (!parHoublon) {
    parHoublon = new Map();
    for (const [code, m] of Object.entries(T.parts)) for (const [h, p] of Object.entries(m)) { const o = parHoublon.get(h) ?? {}; o[code] = p; parHoublon.set(h, o); }
  }
  return parHoublon.get(id) ?? null;
};

const TYPE_M1: Record<string, TypeMalt> = { 'Base Malt': 'base', 'Caramel/Crystal Malt': 'caramel', Roasted: 'torrefies', Toasted: 'speciaux', 'Adjunct Malt': 'speciaux', 'Unmalted Adjunct': 'speciaux', 'Other Malt': 'speciaux' };
const FE = (fermentescibles as unknown as { fermentescibles: Record<string, { type?: string }> }).fermentescibles;

const lisse = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]/g, '');
const STYLE_VERS_COLONNE: Record<string, ColonneLevure> = { weissbier: 'ble', witbier: 'ble', 'american-wheat': 'ble', 'hazy-ipa': 'ipa', 'clean-ale': 'ipa', 'english-ale': 'anglaise', lager: 'lager' };
/** L6 : le premier style du profil de la levure ; à défaut, des mots du nom. Rien de reconnu : « Autres » (le gris dit : type non connu). */
function colonneLevure(i: StockItem): ColonneLevure | null {
  const n = lisse(`${i.name} ${i.yeastStrain ?? ''}`);
  for (const p of YEAST_RECIPE_PROFILES) {
    const code = lisse(p.yeastId.split('-').slice(1).join(''));
    if (code.length >= 3 && n.includes(code)) { const c = STYLE_VERS_COLONNE[p.styles[0]]; if (c) return c; }
  }
  if (/kveik|kviek/.test(n)) return 'autres';
  if (/w3470|saflager|2124|lager|pilsner/.test(n)) return 'lager';
  if (/wb06|weiss|wheat|hefe|witbier/.test(n)) return 'ble';
  if (/us05|chico|verdant|hazy|vermont|conan|ipa/.test(n)) return 'ipa';
  if (/nottingham|s04|english|british|wlp002|1968|1098/.test(n)) return 'anglaise';
  return null;
}
const milieu = (v: unknown): number | null => { const m = /(\d{2,3})\s*%?\s*[-–]\s*(\d{2,3})/.exec(String(v ?? '')); return m ? (+m[1] + +m[2]) / 2 : null; };

export const sourcesDeLApp: SourcesMur = {
  houblon(i) {
    const r = varieteDe(i.name, catalogue());
    if (!('h' in r)) return { id: null, role: null, origine: i.origin ?? null, arome: null };
    const h = r.h;
    return { id: h.id, role: h.purpose ?? null, origine: i.origin ?? h.origin ?? null, arome: h.bm?.arome ?? null };
  },
  parts: partsDe,
  auFrais: (id) => T.auFrais?.parts[id] ?? null,
  typeMalt(i) { const s = slugBeerAnalytics(i.name); const t = s ? FE[s]?.type : null; return t ? TYPE_M1[t] ?? null : null; },
  colonneLevure,
  attenuation(i) {
    if (Number.isFinite(i.yeastAttenuationPct)) return i.yeastAttenuationPct!;
    const f = i.fiche?.remplis?.yeastAttenuationPct?.valeur;
    return typeof f === 'number' && Number.isFinite(f) ? f : milieu(f);
  },
};
