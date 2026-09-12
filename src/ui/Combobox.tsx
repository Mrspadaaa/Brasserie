import React, { useState, useMemo, useRef, useEffect, useId, useCallback } from 'react';
import { createSearch, runSearch } from '../services/search';
import { ChevronDown, Check, Plus, Star } from 'lucide-react';
import { inputClass } from './FormNav';
import { useCoarsePointer, useKeyboardInset } from './useViewport';

/**
 * Autocomplétion — remplace les `<select>` natifs et les `datalist`.
 *
 * ⚠️ Pourquoi ne pas garder `datalist` : son rendu diffère d'un navigateur à
 * l'autre, il n'accepte que du texte brut (impossible d'y montrer le stock
 * disponible), il ne donne aucun retour au clavier, et il est cassé sur Safari
 * mobile. Les `<select>` natifs, eux, ne se cherchent pas au clavier : avec
 * trois cents articles, c'est inutilisable sur ordinateur.
 *
 * Ce composant marche des deux côtés :
 *   ORDINATEUR — on tape, ↑ ↓ parcourent, Entrée choisit, Échap ferme.
 *                Tab ferme et passe au champ suivant en conservant la saisie.
 *   TÉLÉPHONE  — la liste s'ouvre au toucher, les options font 48 px,
 *                et chacune affiche son stock réel.
 *
 * La recherche est floue (fuse.js) : « caramunch » trouve « Caramünch »,
 * « rostgerste » trouve « Röstgerste ». Sur des noms allemands, c'est la
 * différence entre trouver et renoncer.
 */

export interface ComboOption {
  /** Valeur retournée à la sélection. */
  value: string;
  /** Ce qu'on lit. */
  label: string;
  /** Ligne secondaire — typiquement le stock disponible. */
  detail?: string;
  favorite?: boolean;
  /** Groupe d'appartenance, affiché en en-tête. */
  group?: string;
  keywords?: string;
}

const DEFAULT_SEARCH_KEYS: Array<keyof ComboOption> = ['label', 'detail', 'keywords'];

interface ComboboxProps {
  value: string;
  onChange: (value: string) => void;
  options: ComboOption[];
  placeholder?: string;
  id?: string;
  disabled?: boolean;
  /**
   * Autorise une valeur absente de la liste, proposée en dernière entrée
   * (« + Ajouter "…" »). Sans ça, impossible de créer un article inédit sans
   * quitter le formulaire.
   */
  allowCreate?: boolean;
  onCreate?: (label: string) => void;
  createLabel?: (input: string) => string;
  /** Clés indexées par la recherche floue. Par défaut : label et detail. */
  searchKeys?: Array<keyof ComboOption>;
  /**
   * En dessous de ce nombre d'options, la recherche textuelle n'apporte rien :
   * sur téléphone la liste s'ouvre alors SANS clavier. Au-delà, taper reste le
   * seul moyen raisonnable d'atteindre un article parmi trois cents.
   */
  searchThreshold?: number;
  /**
   * Nom accessible du champ.
   *
   * ⚠️ Sans lui, la liste n'avait AUCUN nom : le `placeholder` ne fait pas un
   * nom accessible fiable, et ici il est doublement inutilisable puisqu'il est
   * remplacé par le libellé de l'option choisie dès qu'on sélectionne — le nom
   * du champ changerait donc à chaque choix. À défaut, on retombe sur le
   * `placeholder` d'origine, qui vaut toujours mieux que rien.
   */
  ariaLabel?: string;
  /** Search the whole catalogue, then bound the rendered suggestions. */
  maxResults?: number;
}

export const Combobox: React.FC<ComboboxProps> = ({
  value,
  onChange,
  options,
  placeholder = 'Rechercher…',
  id,
  disabled = false,
  allowCreate = false,
  onCreate,
  createLabel = (s) => `Ajouter « ${s} »`,
  searchKeys = DEFAULT_SEARCH_KEYS,
  searchThreshold = 8,
  ariaLabel,
  maxResults = Infinity
}) => {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const listId = `${inputId}-list`;

  const [open, setOpen] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  /** La liste se déplie vers le haut quand le clavier occupe le bas. */
  const [flipUp, setFlipUp] = useState(false);

  const wrapRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const openedByTouchRef = useRef(false);

  const coarse = useCoarsePointer();
  const keyboardInset = useKeyboardInset();

  const selected = options.find((o) => o.value === value);

  /**
   * Ce que le champ AFFICHE quand il est fermé.
   *
   * ⚠️ LE BUG « je peux pas créer de nouveau style ». Le champ affichait
   * `selected?.label`, c'est-à-dire l'option de la liste qui porte la valeur
   * courante. Or une valeur qu'on vient de CRÉER n'est, par définition, pas
   * dans la liste : `selected` valait `undefined` et le champ redevenait vide,
   * placeholder compris. Le style était bel et bien enregistré — mais rien à
   * l'écran ne le disait, alors on retapait, et on recréait.
   *
   * Une liste qui autorise la création doit donc savoir montrer une valeur
   * qu'elle ne connaît pas : à défaut d'option correspondante, on affiche la
   * valeur elle-même.
   */
  const libelle = selected?.label ?? value ?? '';

  // Index insensible aux accents (voir services/search.ts).
  const fuse = useMemo(
    () => createSearch(options, searchKeys as string[]),
    [options, searchKeys]
  );

  const matches = useMemo(() => {
    const q = query.trim();
    const base = q ? runSearch(fuse, q) : options;
    // Les épinglés remontent, sauf pendant une recherche où la pertinence prime.
    return q
      ? base
      : [...base].sort((a, b) => (a.favorite === b.favorite ? 0 : a.favorite ? -1 : 1));
  }, [query, fuse, options]);
  const results = matches.slice(0, maxResults);

  const canCreate =
    allowCreate &&
    query.trim().length > 1 &&
    !options.some((o) => o.label.toLowerCase() === query.trim().toLowerCase());

  const rowCount = results.length + (canCreate ? 1 : 0);

  // Referme au clic extérieur.
  useEffect(() => {
    if (!open) return;
    const onPointer = (e: PointerEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
        setIsTyping(false);
        setQuery('');
        openedByTouchRef.current = false;
      }
    };
    document.addEventListener('pointerdown', onPointer);
    return () => document.removeEventListener('pointerdown', onPointer);
  }, [open]);

  /*
   * Déplier vers le haut quand le bas manque.
   *
   * ⚠️ Sans ça, la liste s'ouvrait systématiquement sous le champ — donc sous
   * le clavier dès que celui-ci était ouvert. On voyait le champ, on ne voyait
   * jamais les options.
   */
  useEffect(() => {
    if (!open || !wrapRef.current) return;
    const rect = wrapRef.current.getBoundingClientRect();
    const visibleBottom = window.innerHeight - keyboardInset;
    const below = visibleBottom - rect.bottom;
    const above = rect.top;
    setFlipUp(below < 200 && above > below);
  }, [open, keyboardInset, rowCount]);

  // Garde l'option active dans le champ de vision pendant la navigation clavier.
  useEffect(() => {
    if (!open || !listRef.current) return;
    const el = listRef.current.querySelector<HTMLElement>(`[data-index="${active}"]`);
    el?.scrollIntoView({ block: 'nearest' });
  }, [active, open]);

  useEffect(() => setActive(0), [query]);

  /*
   * Distinguer un APPUI d'un DÉFILEMENT.
   *
   * ⚠️ La panne que ça règle : les options se choisissaient sur `pointerdown`,
   * avec `preventDefault()`, pour éviter que le champ ne perde le focus avant
   * l'aboutissement du clic. Correct à la souris — fatal au doigt : un geste de
   * défilement COMMENCE par un `pointerdown` sur une option. Le
   * `preventDefault()` annulait le défilement, et la sélection partait
   * immédiatement sur l'option touchée en premier. Autrement dit, essayer de
   * faire défiler la liste choisissait un article au hasard et refermait tout.
   *
   * On ne retient donc le `preventDefault` que pour la souris, et on ne valide
   * qu'au relâchement, si le doigt n'a pas bougé.
   */
  const press = useRef<{ x: number; y: number; index: number } | null>(null);
  const cancelledClick = useRef(false);
  /** Au-delà de ce déplacement, le geste était un défilement, pas un choix. */
  const DRAG_TOLERANCE_PX = 12;

  const onOptionPointerDown = useCallback((e: React.PointerEvent, index: number) => {
    press.current = { x: e.clientX, y: e.clientY, index };
    cancelledClick.current = false;
    // À la souris uniquement : garder le focus dans le champ de recherche.
    if (e.pointerType === 'mouse') e.preventDefault();
  }, []);

  const onOptionPointerUp = (e: React.PointerEvent, index: number) => {
    const start = press.current;
    press.current = null;
    if (!start || start.index !== index) {
      cancelledClick.current = true;
      return;
    }
    const travelled = Math.hypot(e.clientX - start.x, e.clientY - start.y);
    cancelledClick.current = travelled > DRAG_TOLERANCE_PX;
  };

  const onOptionClick = (e: React.MouseEvent, index: number) => {
    e.preventDefault();
    e.stopPropagation();
    // Keep the list mounted until click: closing on pointerup can send the
    // following mobile click to the navigation button underneath it.
    if (!cancelledClick.current) commit(index);
  };

  const onOptionPointerCancel = () => {
    press.current = null;
    cancelledClick.current = true;
  };

  const commit = (index: number) => {
    openedByTouchRef.current = false;
    if (canCreate && index === results.length) {
      onCreate?.(query.trim());
      setQuery('');
      setOpen(false);
      setIsTyping(false);
      inputRef.current?.blur();
      return;
    }
    const opt = results[index];
    if (!opt) return;
    onChange(opt.value);
    setQuery('');
    setOpen(false);
    setIsTyping(false);
    inputRef.current?.blur();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        if (!open) {
          setOpen(true);
          openedByTouchRef.current = true;
          if (!coarse) setIsTyping(true);
        } else {
          setActive((a) => (a + 1) % Math.max(1, rowCount));
        }
        break;

      case 'ArrowUp':
        e.preventDefault();
        if (open) setActive((a) => (a - 1 + rowCount) % Math.max(1, rowCount));
        break;

      case 'Enter':
        if (open && rowCount > 0) {
          // On absorbe l'Entrée : elle choisit l'option, elle ne doit pas
          // remonter à FormNav qui ferait sauter au champ suivant.
          e.preventDefault();
          e.stopPropagation();
          commit(active);
        }
        break;

      case 'Escape':
        if (open) {
          e.preventDefault();
          e.stopPropagation();
          setOpen(false);
          setIsTyping(false);
          setQuery('');
          openedByTouchRef.current = false;
          inputRef.current?.blur();
        }
        break;

      case 'Tab':
        // Tab ferme la liste et laisse le focus poursuivre normalement.
        setOpen(false);
        setIsTyping(false);
        openedByTouchRef.current = false;
        break;

      default:
        break;
    }
  };

  const isReadOnly = disabled || (coarse && !isTyping);
  const inputMode = coarse && !isTyping ? 'none' : 'search';

  const handleFieldFocus = () => {
    if (disabled) return;
    if (!open) {
      setOpen(true);
      openedByTouchRef.current = true;
      if (!coarse) {
        setIsTyping(true);
      }
    }
  };

  const handleFieldClick = () => {
    if (disabled) return;
    if (!open) {
      // 1er clic sur mobile : ouvre la liste SANS ouvrir le clavier
      setOpen(true);
      openedByTouchRef.current = false;
      if (!coarse) {
        setIsTyping(true);
      }
    } else if (openedByTouchRef.current) {
      // Le clic provient du même geste que le focus initial d'ouverture
      openedByTouchRef.current = false;
    } else if (coarse && !isTyping) {
      // 2ème clic (reclick délibéré) sur le champ déjà ouvert : active la saisie et ouvre le clavier
      setIsTyping(true);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 10);
    }
  };

  return (
    <div ref={wrapRef} className="relative">
      <div className="relative">
        <input
          ref={inputRef}
          id={inputId}
          name={`filter_${inputId}`}
          type="search"
          role="combobox"
          aria-label={ariaLabel ?? placeholder}
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={open && rowCount > 0 ? `${inputId}-opt-${active}` : undefined}
          disabled={disabled}
          readOnly={isReadOnly}
          inputMode={inputMode}
          enterKeyHint="search"
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          data-form-type="other"
          data-lpignore="true"
          data-1p-ignore="true"
          data-bwignore="true"
          className={`${inputClass} pr-11`}
          placeholder={libelle || placeholder}
          value={open && (isTyping || !coarse) ? query : libelle}
          onFocus={handleFieldFocus}
          onClick={handleFieldClick}
          onChange={(e) => {
            setQuery(e.target.value);
            if (!open) setOpen(true);
          }}
          onKeyDown={handleKeyDown}
        />

        {Boolean(query && (isTyping || !coarse)) && (
          <button
            type="button"
            tabIndex={-1}
            aria-label="Effacer la recherche"
            onClick={(e) => {
              e.stopPropagation();
              setQuery('');
              inputRef.current?.focus();
            }}
            className="absolute right-10 top-0 bottom-0 w-8 flex items-center justify-center
                       text-cave-400 hover:text-cave-50 text-xs transition-colors"
          >
            ✕
          </button>
        )}

        <button
          type="button"
          tabIndex={-1}
          aria-label={open ? 'Fermer la liste' : 'Ouvrir la liste'}
          disabled={disabled}
          onClick={() => {
            if (open) {
              setOpen(false);
              setIsTyping(false);
              setQuery('');
              inputRef.current?.blur();
            } else {
              setOpen(true);
              if (!coarse) {
                setIsTyping(true);
                inputRef.current?.focus();
              }
            }
          }}
          className="absolute right-0 top-0 bottom-0 w-11 flex items-center justify-center
                     text-cave-400 hover:text-cave-50 transition-colors"
        >
          <ChevronDown
            className={`w-5 h-5 transition-transform ${open ? 'rotate-180' : ''}`}
          />
        </button>
      </div>

      {open && (
        <ul
          ref={listRef}
          id={listId}
          role="listbox"
          style={{
            // La liste ne descend jamais sous le clavier : sa hauteur se cale
            // sur l'espace réellement visible.
            maxHeight: keyboardInset > 0 ? 'min(18rem, 40vh)' : '18rem'
          }}
          className={`absolute z-50 left-0 right-0 overflow-y-auto overscroll-contain
                      panel shadow-lift py-1
                      ${flipUp ? 'bottom-full mb-1' : 'top-full mt-1'}`}
        >
          {rowCount === 0 && (
            <li className="px-4 py-3 text-sm text-cave-400">
              {query ? `Rien ne correspond à « ${query} »` : 'Aucune option'}
            </li>
          )}
          {matches.length > results.length && <li role="presentation" className="px-4 py-2 text-sm text-cave-400">
            {matches.length} résultats · précise le nom pour affiner.
          </li>}

          {results.map((opt, i) => {
            const isActive = i === active;
            const isSelected = opt.value === value;
            return (
              <li
                key={opt.value}
                id={`${inputId}-opt-${i}`}
                data-index={i}
                role="option"
                aria-selected={isSelected}
                onPointerDown={(e) => onOptionPointerDown(e, i)}
                onPointerUp={(e) => onOptionPointerUp(e, i)}
                onPointerCancel={onOptionPointerCancel}
                onClick={(e) => onOptionClick(e, i)}
                // Le survol ne surligne qu'à la souris : au doigt, il se
                // déclencherait à chaque option traversée en défilant.
                onPointerEnter={(e) => e.pointerType === 'mouse' && setActive(i)}
                className={`min-h-touch px-4 py-2 flex items-center gap-3 cursor-pointer
                            ${isActive ? 'bg-cave-850' : ''}`}
              >
                {opt.favorite && <Star className="w-4 h-4 fill-ebc-straw text-ebc-straw shrink-0" />}

                <span className="min-w-0 flex-1">
                  <span className="block text-base text-cave-50 truncate">{opt.label}</span>
                  {opt.detail && (
                    <span className="block text-sm text-cave-400 truncate">{opt.detail}</span>
                  )}
                </span>

                {isSelected && <Check className="w-5 h-5 text-ebc-straw shrink-0" />}
              </li>
            );
          })}

          {canCreate && (
            <li
              id={`${inputId}-opt-${results.length}`}
              data-index={results.length}
              role="option"
              aria-selected={false}
              onPointerDown={(e) => onOptionPointerDown(e, results.length)}
              onPointerUp={(e) => onOptionPointerUp(e, results.length)}
              onPointerCancel={onOptionPointerCancel}
              onClick={(e) => onOptionClick(e, results.length)}
              onPointerEnter={(e) => e.pointerType === 'mouse' && setActive(results.length)}
              className={`min-h-touch px-4 py-2 flex items-center gap-3 cursor-pointer
                          border-t border-cave-800 text-ebc-straw
                          ${active === results.length ? 'bg-cave-850' : ''}`}
            >
              <Plus className="w-5 h-5 shrink-0" />
              <span className="text-base truncate">{createLabel(query.trim())}</span>
            </li>
          )}
        </ul>
      )}
    </div>
  );
};
