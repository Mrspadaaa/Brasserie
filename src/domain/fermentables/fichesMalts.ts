import table from '../../data/malts/weyermann.json';
import { deduireValeursMalt } from '../ingredientFacts';
import { nombreFr } from '../nombreAffiche';
import { fabricantEcrit } from '../stock/ficheCle';
import { slugBeerAnalytics } from './noms';

/**
 * La fiche PUBLIÉE d'un malt courant (TL-10) : couleur (plage d'EBC) et extrait lus dans le catalogue « Brewery » de Weyermann (récolte 2026,
 * `src/data/malts/weyermann.json`), reliés au nom du stock par la table des noms (`noms.ts`, même identifiant Beer Analytics).
 * Le PPG et l'EBC unique se déduisent par la règle du dépôt (`deduireValeursMalt`, D302/CF-4), jamais par une seconde formule.
 *
 * Honnêteté : un nom absent de la table, ou ambigu (« Münchner Malz » : type 1 ou type 2), reste INCONNU (`null`) ; l'inconnu n'est jamais 0.
 * Un malt d'un autre malteur portant le même nom courant reçoit les valeurs de référence de la fiche Weyermann : elles servent de repère
 * tant que le brasseur n'a pas saisi les siennes (une valeur saisie prime toujours ; l'appelant ne remplit que les trous).
 */
export interface FichePubliee {
  produit: string;
  ebcMin: number;
  ebcMax: number;
  /** Milieu de la plage (déduit). */
  colorEbc: number;
  /** « Tel quel » (humidité retirée) ; absent quand la fiche ne publie pas d'extrait. */
  potentialPpg?: number;
  source: string;
  url: string;
  deduit: { colorEbc?: string; potentialPpg?: string };
  /** T4-5 : le nom ne dit pas le type (« Munich » : type 1 ou 2) ; la plage couvre les fiches possibles et la valeur centrale n'est qu'un repère. */
  ambigu?: string;
}

interface Brut { produit: string; ebcMin: number; ebcMax: number; extraitSec: number | null; humidite: number | null }
const MALTS = table.malts as Record<string, Brut>;
const SOURCE = `${table.source.nom}`;

/** « 2,5–4,5 EBC » : la plage telle que le malteur la publie, à la virgule. */
export const plageEbc = (f: Pick<FichePubliee, 'ebcMin' | 'ebcMax'>): string => {
  const n = (v: number) => nombreFr(v, 1).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return f.ebcMin === f.ebcMax ? n(f.ebcMin) : `${n(f.ebcMin)}–${n(f.ebcMax)}`;
};

/** « Munich » sans type : l'union des fiches Type 1 et Type 2 (plage large), extrait et humidité seulement quand les deux fiches s'accordent ; absent d'une des deux : rien. */
function munichSansType(): Brut | undefined {
  const a = MALTS['munich-light-malt'], b = MALTS['munich-dark-malt'];
  if (!a || !b) return undefined;
  return { produit: 'Munich Malt Type 1 et 2', ebcMin: Math.min(a.ebcMin, b.ebcMin), ebcMax: Math.max(a.ebcMax, b.ebcMax),
    extraitSec: a.extraitSec === b.extraitSec ? a.extraitSec : null,
    humidite: a.humidite !== null && b.humidite !== null ? (a.humidite + b.humidite) / 2 : null };
}

export function fichePubliee(nom: string): FichePubliee | null {
  // Un nom qui écrit un AUTRE malteur (« Castle Pilsner Malz ») n'est pas une fiche Weyermann : inconnu. « Weyermann » écrit devant le nom est retiré.
  const fabricant = fabricantEcrit(nom ?? '');
  if (fabricant && fabricant !== 'weyermann') return null;
  const slug = slugBeerAnalytics(fabricant ? nom.replace(/weyermann\S*/gi, ' ').replace(/\s+/g, ' ').trim() : (nom ?? ''));
  const sansType = slug === 'munich-malt';
  const brut = slug ? (sansType ? munichSansType() : MALTS[slug]) : undefined;
  if (!brut) return null;
  const d = deduireValeursMalt({
    colorEbcMin: brut.ebcMin, colorEbcMax: brut.ebcMax,
    ...(brut.extraitSec !== null ? { extractPct: brut.extraitSec } : {}),
    ...(brut.humidite !== null ? { moisturePct: brut.humidite } : {}),
  });
  if (d.colorEbc === undefined) return null;
  return {
    produit: brut.produit, ebcMin: brut.ebcMin, ebcMax: brut.ebcMax, colorEbc: d.colorEbc,
    ...(d.potentialPpg !== undefined ? { potentialPpg: d.potentialPpg } : {}),
    source: SOURCE, url: table.source.url, deduit: d.deduit,
    ...(sansType ? { ambigu: 'type 1 ou 2 : le nom ne le dit pas, valeur centrale à confirmer sur le sac' } : {}),
  };
}

/** Même forme que `ValeursTrouvees` (services/enrichissementCatalogues) : prêt pour `patchDeTrous` (par : « catalogue »), qui ne remplit que les champs vides. */
export interface ValeursCatalogueMalt {
  valeurs: { colorEbc: number; potentialPpg?: number };
  source: string;
  url: string;
  deduit: { colorEbc?: string; potentialPpg?: string };
  nom: string;
}

export function valeursDeCatalogueMalt(nom: string): ValeursCatalogueMalt | undefined {
  const f = fichePubliee(nom);
  // Un nom sans type (« Munich ») n'écrit rien dans une fiche de stock : la plage se lit, la valeur centrale ne s'inscrit pas.
  if (!f || f.ambigu) return undefined;
  return {
    valeurs: { colorEbc: f.colorEbc, ...(f.potentialPpg !== undefined ? { potentialPpg: f.potentialPpg } : {}) },
    source: f.source, url: f.url, deduit: f.deduit, nom: f.produit,
  };
}
