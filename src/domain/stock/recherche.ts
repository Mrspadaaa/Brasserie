// Voie vd, ST-V4 (14.11, verdict bdd71433 n° 4) : la recherche du Stock lit des mots, pas des ressemblances. « cit » ramenait Acide lactique, Sels de brassage et
// Détergent CIP (flou de Fuse sur toute la fiche) ; « citra » plaçait Caramel 120 avant Citra. Règle, du plus sûr au plus large, on s'arrête au premier niveau non vide :
//   1. chaque mot tapé commence un mot du nom, du fournisseur, de la souche ou de la référence (« cit » → Citra ; « brouw » → Brouwland) ;
//   2. à défaut, chaque mot tapé se trouve dans ces mêmes champs ou dans la catégorie (« unich » → Munich) ;
//   3. à défaut seulement, la recherche floue de l'app (fautes de frappe : « casacde » → Cascade), passée par l'appelant.
// Les accents ne comptent pas (« caramunch » trouve « Caramünch »).
import type { StockItem } from '../../types';
import { normalize } from '../../services/search';

const MOTS = /[^a-z0-9]+/;
const decoupe = (s: string): string[] => normalize(s).split(MOTS).filter(Boolean);

/** Les champs où l'on cherche d'abord : ce que le brasseur lit sur la ligne. */
const champsPremiers = (i: StockItem): string[] => [i.name, i.supplier ?? '', i.yeastStrain ?? '', i.yeastLab ?? '', i.ref, ...(i.nomsFacture ?? [])];

export type RechercheFloue = (requete: string) => ReadonlyArray<StockItem>;

export function rechercherStock(items: ReadonlyArray<StockItem>, requete: string, flou?: RechercheFloue): StockItem[] {
  const mots = decoupe(requete);
  if (mots.length === 0) return [];
  const niveau1 = items.filter((i) => {
    const m = champsPremiers(i).flatMap(decoupe);
    return mots.every((t) => m.some((w) => w.startsWith(t)));
  });
  if (niveau1.length) return niveau1;
  const niveau2 = items.filter((i) => {
    const texte = normalize([...champsPremiers(i), i.category].join(' '));
    return mots.every((t) => texte.includes(t));
  });
  if (niveau2.length) return niveau2;
  return flou ? [...flou(requete)] : [];
}
