import React, { useEffect, useMemo, useState } from 'react';
import { Command } from 'cmdk';
import { X } from 'lucide-react';
import { searchCommandGroups } from '../services/search';
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
  /** Seules les écritures comptables reçoivent ce statut dans l'index. */
  archived?: boolean;
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
  const [query, setQuery] = useState('');
  const [includeArchives, setIncludeArchives] = useState(false);

  useEffect(() => {
    if (!open) {
      setQuery('');
      setIncludeArchives(false);
    }
  }, [open]);

  // ⌘K sur Mac, Ctrl+K ailleurs. On bascule plutôt qu'on ouvre : le même
  // raccourci referme, ce qui évite d'avoir à viser Échap.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onOpenChange(!open);
      }
      if (open && e.key === 'Escape') {
        e.preventDefault();
        onOpenChange(false);
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onOpenChange]);

  const results = useMemo(
    () => open ? searchCommandGroups(groups, query, includeArchives) : { groups: [], total: 0, visible: 0 },
    [open, groups, query, includeArchives]
  );

  const coarse = useCoarsePointer();
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center
                 px-3 pt-[6dvh] sm:px-4 sm:pt-[12vh] bg-cave-950/80 backdrop-blur-sm"
      onPointerDown={(e) => {
        if (e.target === e.currentTarget) onOpenChange(false);
      }}
    >
      <Command
        label="Recherche universelle"
        shouldFilter={false}
        loop
        className="w-full max-w-xl panel shadow-lift overflow-hidden"
      >
        <div className="flex items-center border-b border-cave-800">
          <Command.Input
            value={query}
            onValueChange={setQuery}
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
            className="min-w-0 flex-1 min-h-touch px-4 bg-transparent text-cave-50 text-base
                       placeholder-cave-400 focus:outline-none"
          />
          <button type="button" aria-label="Fermer la recherche" onClick={() => onOpenChange(false)} className="min-h-touch min-w-touch flex items-center justify-center text-cave-400 hover:text-cave-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-ebc-straw">
            <X className="h-5 w-5" />
          </button>
        </div>

        <label className="min-h-touch px-4 flex items-center gap-3 border-b border-cave-800 text-sm text-cave-200 cursor-pointer">
          <input
            type="checkbox"
            checked={includeArchives}
            onChange={event => setIncludeArchives(event.target.checked)}
            className="h-4 w-4 accent-amber-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-400"
          />
          <span>Inclure les archives <span className="text-cave-400">· écritures comptables</span></span>
        </label>

        <Command.List className="max-h-[55dvh] overflow-y-auto overscroll-contain py-2">
          <Command.Empty className="px-4 py-8 text-center space-y-1">
            <p className="text-base text-cave-200">Rien ne correspond</p>
            <p className="text-sm text-cave-400">
              Cherche un nom, une référence ou un fournisseur, avec ou sans accents.
            </p>
          </Command.Empty>

          {results.groups.map((group) => (
            <Command.Group
              key={group.heading}
              heading={group.heading}
              className="px-2 [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5
                         [&_[cmdk-group-heading]]:text-sm [&_[cmdk-group-heading]]:text-cave-400"
            >
              {group.items.map((item) => (
                <Command.Item
                  key={item.id}
                  value={item.id}
                  onSelect={() => {
                    item.onSelect();
                    onOpenChange(false);
                  }}
                  className="min-h-touch px-2 rounded-control flex items-center gap-3
                             cursor-pointer text-cave-50
                             data-[selected=true]:bg-cave-850"
                >
                  {item.icon && <span className="shrink-0 text-cave-400">{item.icon}</span>}
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2">
                      <span className="text-base truncate">{item.label}</span>
                      {item.archived && <span className="shrink-0 rounded bg-cave-800 px-1.5 py-0.5 text-xs text-cave-400">Archivée</span>}
                    </span>
                    {item.detail && (
                      <span className="block text-sm text-cave-400 truncate">{item.detail}</span>
                    )}
                  </span>
                </Command.Item>
              ))}
            </Command.Group>
          ))}
        </Command.List>

        <div className="border-t border-cave-800 px-4 py-2 flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
          <span className="text-sm text-cave-400" role="status">
            {results.visible < results.total
              ? `${results.visible} sur ${results.total.toLocaleString('fr-CH')} résultats · précise la recherche`
              : `${results.total.toLocaleString('fr-CH')} résultat${results.total > 1 ? 's' : ''}`}
          </span>
          <span className="hidden sm:inline text-sm text-cave-400">↑↓ parcourir · ↵ ouvrir · Échap fermer</span>
        </div>
      </Command>
    </div>
  );
};
