import React, { useMemo } from 'react';
import { StockItem } from '../types';
import { Units } from '../services/units';
import { Combobox, ComboOption } from './Combobox';

/**
 * Choix d'un ingrédient DANS LE STOCK, avec création à la volée.
 *
 * ⚠️ Ce que ça règle, mot pour mot : « pour les levures c'est n'importe quoi,
 * je peux pas en ajouter des nouvelles ». Les listes d'ingrédients étaient des
 * `<select>` alimentés par le stock existant : une levure ou un houblon jamais
 * acheté était inatteignable, et il fallait quitter le brassin, aller créer
 * l'article, revenir, tout ressaisir.
 *
 * Ici, taper un nom inconnu propose « + Ajouter ». L'article est créé à
 * **stock zéro** — parce qu'on ne l'a pas encore acheté, et qu'écrire une
 * quantité qu'on n'a pas fausserait la liste de courses.
 *
 * Chaque option affiche le stock réel : c'est l'information qui décide si on
 * peut brasser aujourd'hui.
 */

interface IngredientPickerProps {
  /** Catégories de stock proposées : ['Malt'], ['Houblon'], ['Levure']… */
  categories: string[];
  items: StockItem[];
  value: string;
  onChange: (name: string, item?: StockItem) => void;
  /** Création d'un article absent du stock. */
  onCreate: (name: string) => void;
  placeholder?: string;
  id?: string;
  /** Nom accessible. À défaut, le placeholder. */
  ariaLabel?: string;
}

export const IngredientPicker: React.FC<IngredientPickerProps> = ({
  categories,
  items,
  value,
  onChange,
  onCreate,
  placeholder = 'Chercher dans le stock…',
  id,
  ariaLabel
}) => {
  const pool = useMemo(
    () => items.filter((i) => categories.some((c) => i.category.toLowerCase() === c.toLowerCase())),
    [items, categories]
  );

  const options: ComboOption[] = useMemo(
    () =>
      pool.map((i) => ({
        value: i.name,
        label: i.name,
        detail: [
          i.currentStock > 0
            ? `${Units.format(i.currentStock, i.unit)} en stock`
            : 'stock épuisé',
          i.alphaPct ? `${i.alphaPct} % AA` : null,
          i.colorEbc != null ? `${i.colorEbc} EBC` : null,
          i.supplier
        ]
          .filter(Boolean)
          .join(' · '),
        favorite: i.favorite
      })),
    [pool]
  );

  return (
    <Combobox
      id={id}
      value={value}
      onChange={(name) => onChange(name, pool.find((i) => i.name === name))}
      options={options}
      placeholder={placeholder}
      ariaLabel={ariaLabel}
      allowCreate
      onCreate={onCreate}
      createLabel={(v) => `Créer « ${v} » (stock à zéro)`}
    />
  );
};
