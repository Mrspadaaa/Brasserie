import React, { useEffect, useMemo } from 'react';
import { Command } from 'cmdk';
import { normalize } from '../services/search';
import { useCoarsePointer } from './useViewport';

/**
 * Recherche universelle — ⌘K / Ctrl+K.
 *
 * ⚠️ Ce que ça règle : atteindre un article demandait d'ouvrir Stocks, choisir
 * le bon sous-onglet, faire défiler ; une écriture, d'aller dans Finances et de
 * filtrer. Avec des milliers d'entrées, la navigation par onglets devient le
 * goulot d'étranglement. Ici, trois lettres suffisent, depuis n'importe où.
 *
 * C'est l'outil du clavier — donc de l'ordinateur, où Gaëtan fait la
 * comptabilité. Sur téléphone il reste atteignable à la loupe, mais la
 * navigation au pouce reste la voie principale : on ne remplace pas l'une par
 * l'autre.
 *
 * La recherche est insensible aux accents (`services/search.ts`), parce que le
 * catalogue est majoritairement allemand.
 */

export interface CommandItem {
  id: string;
  label: string;
  /** Ligne secondaire : stock disponible, montant, statut. */
  detail?: string;
  icon?: React.ReactNode;
  /** Termes supplémentaires indexés (référence, style, fournisseur…). */
  keywords?: string[];
  onSelect: () => void;
}

export interface CommandGroup {
  heading: string;
  items: CommandItem[];
}

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groups: CommandGroup[];
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  open,
  onOpenChange,
  groups
}) => {
  // ⌘K sur Mac, Ctrl+K ailleurs. On bascule plutôt qu'on ouvre : le même
  // raccourci referme, ce qui évite d'avoir à viser Échap.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onOpenChange(!open);
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onOpenChange]);

  /**
   * Filtre insensible aux accents. Celui de cmdk compare les chaînes brutes :
   * « rostgerste » n'y trouverait pas « Röstgerste ».
   */
  const filter = useMemo(
    () => (value: string, search: string, keywords?: string[]) => {
      const haystack = normalize([value, ...(keywords ?? [])].join(' '));
      const needle = normalize(search);
      if (!needle) return 1;
      // Un mot entier au début pèse plus qu'une occurrence au milieu.
      if (haystack.startsWith(needle)) return 1;
      return haystack.includes(needle) ? 0.5 : 0;
    },
    []
  );

  const coarse = useCoarsePointer();
  if (!open) return null;

  const total = groups.reduce((n, g) => n + g.items.length, 0);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center
                 px-4 pt-[12vh] bg-cave-950/80 backdrop-blur-sm"
      onPointerDown={(e) => {
        if (e.target === e.currentTarget) onOpenChange(false);
      }}
    >
      <Command
        label="Recherche universelle"
        filter={filter}
        loop
        className="w-full max-w-xl panel shadow-lift overflow-hidden"
      >
        <div className="border-b border-cave-800">
          <Command.Input
            name="universal_command_search_query"
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            data-form-type="other"
            data-lpignore="true"
            data-1p-ignore="true"
            data-bwignore="true"
            autoFocus={!coarse}
            placeholder="Article, recette, brassin, client, écriture…"
            className="w-full min-h-touch px-4 bg-transparent text-cave-50 text-base
                       placeholder-cave-600 focus:outline-none"
          />
        </div>

        <Command.List className="max-h-[60vh] overflow-y-auto overscroll-contain py-2">
          <Command.Empty className="px-4 py-8 text-center space-y-1">
            <p className="text-base text-cave-200">Rien ne correspond</p>
            <p className="text-sm text-cave-500">
              La recherche tolère les fautes et les accents manquants.
            </p>
          </Command.Empty>

          {groups.map((group) => (
            <Command.Group
              key={group.heading}
              heading={group.heading}
              className="px-2 [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5
                         [&_[cmdk-group-heading]]:text-sm [&_[cmdk-group-heading]]:text-cave-500"
            >
              {group.items.map((item) => (
                <Command.Item
                  key={item.id}
                  value={`${item.label} ${item.detail ?? ''}`}
                  keywords={item.keywords}
                  onSelect={() => {
                    item.onSelect();
                    onOpenChange(false);
                  }}
                  className="min-h-touch px-2 rounded-control flex items-center gap-3
                             cursor-pointer text-cave-100
                             data-[selected=true]:bg-cave-850"
                >
                  {item.icon && <span className="shrink-0 text-cave-400">{item.icon}</span>}
                  <span className="min-w-0 flex-1">
                    <span className="block text-base truncate">{item.label}</span>
                    {item.detail && (
                      <span className="block text-sm text-cave-500 truncate">{item.detail}</span>
                    )}
                  </span>
                </Command.Item>
              ))}
            </Command.Group>
          ))}
        </Command.List>

        <div className="border-t border-cave-800 px-4 py-2 flex items-center justify-between">
          <span className="text-sm text-cave-600">
            {total.toLocaleString('fr-CH')} entrée{total > 1 ? 's' : ''}
          </span>
          <span className="text-sm text-cave-600">↑↓ parcourir · ↵ ouvrir · Échap fermer</span>
        </div>
      </Command>
    </div>
  );
};
