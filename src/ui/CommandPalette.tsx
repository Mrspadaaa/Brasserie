import React, { useEffect, useMemo, useState } from 'react';
import { Command } from 'cmdk';
import {
  Archive, Beer, BookOpen, Boxes, ChevronRight, CirclePlus, ClipboardCheck, Coins, FileText, Gauge, LayoutDashboard, MessageCircle,
  Package, Play, Plus, Receipt, Search, ShoppingCart, Undo2, Users, Wallet, X
} from 'lucide-react';
import { Input } from './Input';
import { searchCommandGroups } from '../services/search';
import { useKeyboardInset } from './useViewport';
import type { PlusCle, PlusMenu, PlusTon } from '../domain/plusEcran';
import {
  CREER, LIBELLE_DESTINATION, LIBELLE_DESTINATION_TROUVEE, LIBELLE_GESTE_LONG, TOUCHE_GESTE, classer, destinationsAllerA, destinationsPourRequete, gestesIci, lireRecents, noterRecent, rang,
  segmentsNombres, surligner, typeDeId, typePrioritaire, type DestinationId, type Geste, type GesteId, type TypeResultat
} from '../components/recherche/modele';

/**
 * Recherche universelle — la recherche r3p2 (« le geste d'abord, au pouce », choisie le 15.11).
 *
 * ⚠️ Ce que ça règle : atteindre un article demandait d'ouvrir Stocks, choisir le bon sous-onglet, faire défiler ; une écriture, d'aller dans
 * Finances et de filtrer. Ici trois lettres suffisent, depuis n'importe où, et le geste utile se fait sans ouvrir la fiche.
 *
 * Téléphone : une feuille posée sur le clavier, le champ collé au clavier. Rien tapé : du plus loin au plus près du pouce, Aller à, Créer,
 * Reprendre, Ici (les gestes de l'écran d'ouverture, ceux du + ). Tapé : le meilleur résultat juste au-dessus du champ, avec ses gestes, les autres
 * montent par pertinence, chacun avec son geste. Ordinateur (⌘K / Ctrl+K) : la palette, la ligne choisie à gauche, son aperçu et ses gestes à droite.
 *
 * La recherche reste insensible aux accents (`services/search.ts`) : le catalogue est majoritairement allemand.
 */

export interface Apercu {
  sousTitre?: string;
  /** Ce que l'app sait de la ligne ; une valeur inconnue n'est pas dans la liste (jamais un 0). */
  chiffres: { label: string; valeur: string }[];
  emplois: { texte: string; valeur?: string; type: TypeResultat }[];
}

export interface CommandItem {
  id: string;
  label: string;
  /** Ligne secondaire : le type et ce qui aide à choisir (α, statut, fournisseur). */
  detail?: string;
  icon?: React.ReactNode;
  /** Termes supplémentaires indexés (référence, style, fournisseur…). */
  keywords?: string[];
  /** Seules les écritures comptables reçoivent ce statut dans l'index. */
  archived?: boolean;
  /** La valeur utile de la ligne : le stock, le montant, le jour de fermentation. */
  valeur?: string;
  /** Les gestes de la ligne, le plus utile d'abord ; seulement ceux que l'app sait faire. */
  gestes?: Geste[];
  /** L'aperçu du 1280, calculé à la demande. */
  apercu?: () => Apercu;
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
  /** L'écran d'ouverture : la pastille, « Ici », « Créer », « Aller à ». Absent : la recherche seule. */
  menu?: PlusMenu;
  /** Un geste « depuis ici » ou une création : la même fonction que la feuille du + . */
  onGeste?: (cle: PlusCle | 'ecran') => void;
  onCompagnon?: () => void;
  onAllerA?: (id: DestinationId) => void;
}

/* --------------------------------------------------------------- traits ---- */

const TON: Record<PlusTon, { texte: string; fond: string }> = {
  finances: { texte: 'text-area-finances', fond: 'bg-area-finances/15' },
  production: { texte: 'text-area-production', fond: 'bg-area-production/15' },
  stocks: { texte: 'text-area-stocks', fond: 'bg-area-stocks/15' },
  clients: { texte: 'text-cave-200', fond: 'bg-cave-850' }
};

const RUBRIQUE_ICONE: Record<string, typeof Boxes> = { Bord: LayoutDashboard, Finances: Wallet, Brassins: Beer, Stocks: Boxes, Clients: Users };

const TYPE_ICONE: Record<TypeResultat, { Icone: typeof Boxes; texte: string }> = {
  article: { Icone: Package, texte: 'text-area-stocks' },
  recette: { Icone: BookOpen, texte: 'text-area-production' },
  brassin: { Icone: Beer, texte: 'text-area-production' },
  ecriture: { Icone: Receipt, texte: 'text-area-finances' },
  client: { Icone: Users, texte: 'text-cave-200' }
};

const GESTE_ICONE: Record<GesteId, typeof Boxes> = { courses: ShoppingCart, corriger: ClipboardCheck, brasser: Play, mesure: Gauge, piece: FileText };

const CREER_ICONE: Record<string, typeof Plus> = { ecriture: Plus, vente: Coins, recette: BookOpen, brassin: Play };
const CREER_LIBELLE: Record<string, string> = { ecriture: 'Écriture', vente: 'Vente', recette: 'Recette', brassin: 'Brassin' };

const ICONE_ICI: Record<string, typeof Plus> = {
  ecran: CirclePlus, facture: FileText, courses: ShoppingCart, houblon: CirclePlus, article: CirclePlus, fut: CirclePlus, client: CirclePlus, tarif: CirclePlus,
  materiel: CirclePlus, idee: CirclePlus
};

const FOCUS = 'focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-cave-50';

/** Les chiffres en mono, l'unité et les mots en Source Sans : « 1,2 » mono, « kg » non. */
const Nb: React.FC<{ t: string }> = ({ t }) => (
  <>
    {segmentsNombres(t).map((s, i) => s.nombre
      ? <span key={i} className="font-mono tracking-[-0.04em] text-[0.94em] tabular-nums">{s.t}</span>
      : <React.Fragment key={i}>{s.t}</React.Fragment>)}
  </>
);

/** Le texte avec les lettres tapées soulignées. */
const Marque: React.FC<{ t: string; q: string }> = ({ t, q }) => (
  <>
    {surligner(t, q).map((s, i) => s.hit
      ? <mark key={i} className="bg-transparent font-bold text-cave-50 shadow-[inset_0_-2px_0_rgb(var(--mark,242_193_78))]">{s.t}</mark>
      : <React.Fragment key={i}>{s.t}</React.Fragment>)}
  </>
);

function useLarge(): boolean {
  const lire = () => typeof window !== 'undefined' && !!window.matchMedia && window.matchMedia('(min-width: 1024px)').matches;
  const [large, setLarge] = useState(lire);
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const m = window.matchMedia('(min-width: 1024px)');
    const suivre = () => setLarge(m.matches);
    suivre();
    m.addEventListener?.('change', suivre);
    return () => m.removeEventListener?.('change', suivre);
  }, []);
  return large;
}

const Pastille: React.FC<{ menu: PlusMenu }> = ({ menu }) => {
  const rubrique = menu.chemin.split(' › ')[0] || 'Bord';
  const Icone = RUBRIQUE_ICONE[rubrique] ?? Boxes;
  const t = TON[menu.ton];
  return (
    <span data-testid="recherche-pastille" className={`shrink-0 h-[30px] inline-flex items-center gap-1 pl-1.5 pr-2 rounded-[7px] text-sm font-semibold ${t.fond} ${t.texte}`}>
      <Icone size={14} aria-hidden="true" />{rubrique}
    </span>
  );
};

const Touche: React.FC<{ children: React.ReactNode; fort?: boolean }> = ({ children, fort }) => (
  <kbd aria-hidden="true" className={`font-mono text-footnote leading-[18px] px-1.5 rounded border whitespace-nowrap ${fort ? 'border-current' : 'border-cave-700 text-cave-400'}`}>{children}</kbd>
);

/* ------------------------------------------------------------- composant --- */

export const CommandPalette: React.FC<CommandPaletteProps> = ({ open, onOpenChange, groups, menu, onGeste, onCompagnon, onAllerA }) => {
  const [query, setQuery] = useState('');
  const [includeArchives, setIncludeArchives] = useState(false);
  const [contexte, setContexte] = useState(true);
  const [courant, setCourant] = useState<string>('');
  const [curseur, setCurseur] = useState(0);
  const [recents, setRecents] = useState<string[]>([]);
  const large = useLarge();
  const clavier = useKeyboardInset();

  useEffect(() => {
    if (open) { setRecents(lireRecents()); return; }
    setQuery(''); setIncludeArchives(false); setContexte(true); setCourant(''); setCurseur(0);
  }, [open]);

  const requete = query.trim();
  const prioritaire = contexte ? typePrioritaire(menu) : undefined;

  const resultats = useMemo(() => {
    if (!open) return { items: [] as CommandItem[], total: 0, visible: 0, archives: 0 };
    // LR1-NOTE-5 : le montant d'une écriture (« 17,50 CHF ») se cherche comme son nom. Seules les écritures : la valeur d'un
    // article est son stock (« 12 kg »), et « 12 » ne doit pas ramener tout le rayon.
    const indexes = groups.map(g => ({ ...g, items: g.items.map(it => (it.valeur && typeDeId(it.id) === 'ecriture' ? { ...it, keywords: [...(it.keywords ?? []), it.valeur] } : it)) }));
    const r = searchCommandGroups(indexes, query, includeArchives);
    let archives = 0;
    if (requete && !includeArchives) archives = searchCommandGroups(indexes, query, true).total - r.total;
    return { items: classer(r.groups.flatMap(g => g.items), query, prioritaire), total: r.total, visible: r.visible, archives };
  }, [open, groups, query, requete, includeArchives, prioritaire]);

  const ici = useMemo(() => (menu && contexte ? gestesIci(menu) : []), [menu, contexte]);
  const allerA = useMemo(() => (menu && onAllerA ? destinationsAllerA(menu, ici) : []), [menu, onAllerA, ici]);
  const reprendre = useMemo(() => {
    const parId = new Map(groups.flatMap(g => g.items).map(it => [it.id, it] as const));
    return recents.map(id => parId.get(id)).filter((it): it is CommandItem => !!it);
  }, [groups, recents]);

  /* k1 : taper « atelier » ou « carnet » propose aussi la destination ; elle passe devant si son libellé répond au moins aussi bien. */
  const destinations = useMemo(() => (requete && onAllerA ? destinationsPourRequete(requete) : []), [requete, onAllerA]);
  const destDevant = destinations.length > 0 && destinations[0].rang >= (resultats.items[0] ? rang(resultats.items[0].label, query) : 0);
  const connue = courant.startsWith('go-') ? destinations.some(d => `go-${d.id}` === courant) : resultats.items.some(it => it.id === courant);
  const valeur = connue ? courant : destDevant ? `go-${destinations[0].id}` : (resultats.items[0]?.id ?? courant);
  const rubrique = menu ? menu.chemin.split(' › ')[0] : '';
  const actif = valeur.startsWith('go-') ? undefined : resultats.items.find(it => it.id === valeur);
  const gestesActif = actif?.gestes ?? [];

  const fermer = () => onOpenChange(false);
  const choisir = (item: CommandItem) => { noterRecent(item.id); item.onSelect(); fermer(); };
  const faire = (item: CommandItem, g: Geste) => { noterRecent(item.id); g.run(); fermer(); };
  const lancerIci = (cle: PlusCle | 'ecran') => { onGeste?.(cle); fermer(); };
  const aller = (id: DestinationId) => { onAllerA?.(id); fermer(); };

  // ⌘K / Ctrl+K bascule ; Échap ferme ; Alt + lettre fait le geste de la ligne choisie (1280).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'k' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); onOpenChange(!open); return; }
      if (!open) return;
      if (e.key === 'Escape') { e.preventDefault(); onOpenChange(false); return; }
      if (large && e.altKey && !e.metaKey && !e.ctrlKey && actif && /^Key[A-Z]$/.test(e.code)) {
        const g = gestesActif.find(x => TOUCHE_GESTE[x.id] === e.code.slice(3));
        if (g) { e.preventDefault(); noterRecent(actif.id); g.run(); onOpenChange(false); }
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onOpenChange, large, actif, gestesActif]);

  useEffect(() => { setCurseur(0); }, [actif?.id]);

  /* r3p2 : le champ est actif, clavier levé, dès l'ouverture. `autoFocus` seul ne suffit pas au toucher : le toucher qui a ouvert
     la recherche laisse le focus sur la loupe (le brasseur tapait « cit » dans le vide). On le reprend après le premier rendu. */
  useEffect(() => {
    if (!open) return;
    const prendre = () => {
      const champ = document.querySelector<HTMLInputElement>('[data-page-overlay] [cmdk-input]');
      if (champ && document.activeElement !== champ) champ.focus();
    };
    const a = requestAnimationFrame(prendre), b = window.setTimeout(prendre, 120);
    return () => { cancelAnimationFrame(a); window.clearTimeout(b); };
  }, [open]);

  if (!open) return null;

  const total = resultats.total + destinations.length;
  const nombre = resultats.visible < resultats.total
    ? `${resultats.visible} sur ${total.toLocaleString('fr-CH')} résultats · précise la recherche`
    : `${total.toLocaleString('fr-CH')} résultat${total > 1 ? 's' : ''}`;

  /** Retour arrière sur un champ vide : on sort du contexte (« hors de Stocks »). Tab bascule les archives au 1280. → entre dans les gestes. */
  const surTouche = (e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !query && contexte && menu) { setContexte(false); return; }
    if (!large) return;
    if (e.key === 'Tab' && !e.shiftKey) { e.preventDefault(); setIncludeArchives(v => !v); return; }
    if (!requete || !actif) return;
    const n = gestesActif.length;
    if (e.key === 'ArrowRight' && n) { e.preventDefault(); e.stopPropagation(); setCurseur(c => Math.min(n, c + 1 || 1)); return; }
    if (e.key === 'ArrowLeft' && curseur) { e.preventDefault(); e.stopPropagation(); setCurseur(0); return; }
    if (curseur > 0 && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
      e.preventDefault(); e.stopPropagation();
      setCurseur(c => Math.max(0, Math.min(n, c + (e.key === 'ArrowDown' ? 1 : -1))));
      return;
    }
    if (curseur > 0 && e.key === 'Enter') { e.preventDefault(); e.stopPropagation(); faire(actif, gestesActif[curseur - 1]); }
  };

  const champ = (
    <Command.Input
      asChild
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
      autoFocus
      enterKeyHint="go"
      placeholder="Faire, chercher, aller…"
      className={`min-w-0 flex-1 h-full bg-transparent text-cave-50 text-base placeholder-cave-400 focus:outline-none ${large ? '' : 'leading-[38px] py-0 resize-none'}`}
    ><Input type="search" /></Command.Input>
  );

  const bascule = (
    <button
      type="button"
      role="checkbox"
      aria-checked={includeArchives}
      aria-label="Inclure les archives (écritures comptables)"
      onClick={() => setIncludeArchives(v => !v)}
      className={`${FOCUS} shrink-0 ${large ? 'h-[30px] px-2.5 gap-1.5 text-sm' : 'h-[38px] w-9 justify-center'} inline-flex items-center rounded-[10px] border ${includeArchives ? 'border-cave-50 bg-cave-850 text-cave-50' : 'border-cave-600 text-cave-200'}`}
    >
      <Archive size={large ? 14 : 18} aria-hidden="true" />
      {large && <>Archives <Touche>Tab</Touche></>}
    </button>
  );

  const puceArchives = resultats.archives > 0 && !includeArchives ? (
    <button
      type="button"
      onClick={() => setIncludeArchives(true)}
      className={`${FOCUS} ${large ? 'self-start ml-2.5 mt-2' : 'self-center my-1'} h-8 inline-flex items-center gap-1.5 px-3.5 rounded-2xl border-[1.5px] border-dashed border-cave-600 text-sm text-cave-200`}
    >
      <Archive size={15} aria-hidden="true" className="text-cave-400" />
      <span><Nb t={String(resultats.archives)} /> de plus dans les archives</span>
    </button>
  ) : null;

  /* ----- résultat : le titre surligné, le détail avec des chiffres mono ----- */
  const titre = (it: CommandItem, grand?: boolean) => {
    const type = typeDeId(it.id);
    const T = type ? TYPE_ICONE[type] : undefined;
    return (
      <>
        {T ? <T.Icone size={grand ? 20 : 18} aria-hidden="true" className={`shrink-0 ${T.texte}`} /> : it.icon && <span className="shrink-0 text-cave-400">{it.icon}</span>}
        <span className="min-w-0 flex-1 flex flex-col gap-px">
          <span className="flex items-center gap-2">
            <span className={`truncate font-semibold text-cave-50 ${grand ? 'text-base' : 'text-sm'}`}><Marque t={it.label} q={query} /></span>
            {it.archived && <span className="shrink-0 rounded bg-cave-800 px-1.5 py-0.5 text-xs text-cave-400">Archivée</span>}
          </span>
          {(it.detail || it.valeur) && (
            <span className={`truncate text-cave-200 ${grand ? 'text-sm' : 'text-footnote'}`}>
              {it.detail && <Nb t={it.detail} />}
              {it.detail && it.valeur && <span className={large ? 'hidden' : ''}> · </span>}
              {it.valeur && <span className={large ? 'hidden' : ''}><Nb t={it.valeur} /></span>}
            </span>
          )}
        </span>
      </>
    );
  };

  const nomOption = (it: CommandItem) => (it.detail ? `${it.label} — ${it.detail}` : it.label);

  const chip = (it: CommandItem, g: Geste, primaire?: boolean) => {
    const I = GESTE_ICONE[g.id];
    return (
      <button
        key={g.id}
        type="button"
        onClick={() => faire(it, g)}
        className={`${FOCUS} shrink-0 h-8 inline-flex items-center gap-1.5 px-2.5 rounded-2xl border text-sm ${primaire ? 'bg-ebc-straw text-cave-950 border-transparent font-semibold' : 'border-cave-600 text-cave-50 bg-cave-900'}`}
      >
        <I size={14} aria-hidden="true" />{g.label}
      </button>
    );
  };

  const optionClasse = `${FOCUS} min-w-0 flex-1 flex items-center gap-2.5 cursor-pointer rounded-control data-[selected=true]:bg-cave-850`;

  /** Le téléphone : une ligne par résultat, son geste à droite ; le meilleur en carte, ses deux gestes au pouce. */
  const ligneTelephone = (it: CommandItem, i: number) => {
    const gs = it.gestes ?? [];
    if (i === 0) {
      return (
        <div key={it.id} className="mt-1.5 rounded-xl border border-cave-600 bg-cave-850 p-2 pl-2.5 flex items-center gap-2.5">
          <Command.Item value={it.id} aria-label={nomOption(it)} onSelect={() => choisir(it)} className={`${optionClasse} min-h-[44px]`}>{titre(it, true)}</Command.Item>
          {[...gs].reverse().map((g, k, tous) => chip(it, g, k === tous.length - 1))}
        </div>
      );
    }
    return (
      <div key={it.id} className="flex items-center gap-2.5 min-h-[48px] px-1 py-0.5 border-b border-cave-800">
        <Command.Item value={it.id} aria-label={nomOption(it)} onSelect={() => choisir(it)} className={`${optionClasse} min-h-[44px]`}>{titre(it)}</Command.Item>
        {gs[0] && chip(it, gs[0])}
      </div>
    );
  };

  /** Une rangée des zones « Aller à / Créer / Reprendre / Ici » : un bouton simple au téléphone, un élément cmdk au 1280. */
  const zoneVide = (
    <div className="flex flex-col gap-3 px-2.5 pb-2.5">
      {allerA.length > 0 && (
        <section aria-label="Aller à">
          <h2 className="text-footnote font-semibold text-cave-400 mb-1 ml-0.5">Aller à</h2>
          <div className="flex flex-wrap gap-x-0.5">
            {allerA.map(id => (
              <button key={id} type="button" onClick={() => aller(id)} className={`${FOCUS} h-[30px] inline-flex items-center gap-1 px-1.5 rounded-md text-sm text-cave-50`}>
                {LIBELLE_DESTINATION[id]}<ChevronRight size={12} aria-hidden="true" className="text-cave-400" />
              </button>
            ))}
          </div>
        </section>
      )}
      {onGeste && (
        <section aria-label="Créer">
          <h2 className="text-footnote font-semibold text-cave-400 mb-1 ml-0.5">Créer</h2>
          <div className="grid grid-cols-5 gap-1.5">
            {CREER.map(cle => {
              const I = CREER_ICONE[cle];
              return (
                <button key={cle} type="button" onClick={() => lancerIci(cle)} className={`${FOCUS} h-[54px] flex flex-col items-center justify-center gap-1 rounded-[10px] bg-cave-850 text-footnote text-cave-50`}>
                  <I size={18} aria-hidden="true" className="text-cave-200" />{CREER_LIBELLE[cle]}
                </button>
              );
            })}
            {onCompagnon && (
              <button type="button" onClick={() => { onCompagnon(); fermer(); }} className={`${FOCUS} h-[54px] flex flex-col items-center justify-center gap-1 rounded-[10px] bg-cave-850 text-footnote text-cave-50`}>
                <MessageCircle size={18} aria-hidden="true" className="text-cave-200" />Compagnon
              </button>
            )}
          </div>
        </section>
      )}
      {reprendre.length > 0 && (
        <section aria-label="Reprendre">
          <h2 className="text-footnote font-semibold text-cave-400 mb-1 ml-0.5">Reprendre</h2>
          {reprendre.map(it => {
            const type = typeDeId(it.id);
            const T = type ? TYPE_ICONE[type] : undefined;
            return (
              <button key={it.id} type="button" onClick={() => choisir(it)} className={`${FOCUS} w-full h-9 flex items-center gap-2.5 px-1 text-sm text-cave-50 border-b border-cave-800 last:border-b-0`}>
                {T && <T.Icone size={16} aria-hidden="true" className={`shrink-0 ${T.texte}`} />}
                <span className="truncate">{it.label}</span>
                {it.valeur && <span className="ml-auto text-cave-200 text-footnote"><Nb t={it.valeur} /></span>}
              </button>
            );
          })}
        </section>
      )}
      {ici.length > 0 && (
        <section aria-label="Ici">
          <h2 className="text-footnote font-semibold text-cave-400 mb-1 ml-0.5">Ici</h2>
          <div className="grid grid-cols-2 gap-1.5">
            {ici.map(l => {
              const I = ICONE_ICI[l.cle] ?? CirclePlus;
              return (
                <button
                  key={l.cle}
                  type="button"
                  aria-label={l.hint ? `${l.label} — ${l.hint}` : l.label}
                  onClick={() => lancerIci(l.cle)}
                  className={`${FOCUS} h-11 flex items-center gap-2 px-2.5 rounded-[10px] border text-sm font-semibold whitespace-nowrap overflow-hidden ${l.primaire ? 'bg-ebc-straw text-cave-950 border-transparent' : 'border-cave-600 text-cave-50'}`}
                >
                  <I size={18} aria-hidden="true" className={`shrink-0 ${l.primaire ? '' : TON[l.ton].texte}`} />
                  <span className="truncate">{l.label}</span>
                </button>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );

  /** Rien trouvé : trois sorties, au pouce, le champ toujours au clavier. */
  const sorties = (
    <div className="px-2.5 pb-2.5">
      <p className="m-0 mb-1.5 ml-1 text-sm text-cave-50">Rien pour « {requete} ».</p>
      {resultats.archives > 0 && !includeArchives && (
        <button type="button" onClick={() => setIncludeArchives(true)} className={`${FOCUS} w-full h-11 flex items-center gap-2.5 px-1 text-sm text-cave-50 border-b border-cave-800`}>
          <Archive size={16} aria-hidden="true" className="text-cave-400" />Chercher aussi dans les archives
        </button>
      )}
      {menu?.action && onGeste && contexte && (
        <button type="button" onClick={() => lancerIci('ecran')} className={`${FOCUS} w-full h-11 flex items-center gap-2.5 px-1 text-sm text-cave-50 border-b border-cave-800`}>
          <CirclePlus size={16} aria-hidden="true" className="text-cave-400" />{menu.action.label}
        </button>
      )}
      <button type="button" onClick={() => setQuery('')} className={`${FOCUS} w-full h-11 flex items-center gap-2.5 px-1 text-sm text-cave-50`}>
        <Undo2 size={16} aria-hidden="true" className="text-cave-400" />{menu && contexte ? `Effacer : revoir les gestes de ${rubrique}` : 'Effacer la recherche'}
      </button>
    </div>
  );

  /** Une destination trouvée en tapant : « Aller à · Carnet · Atelier R&D », comme la zone Aller à (k1). */
  const ligneDestination = (id: DestinationId, telephone: boolean) => (
    <Command.Item
      key={`go-${id}`}
      value={`go-${id}`}
      onSelect={() => aller(id)}
      className={telephone
        ? `${optionClasse} min-h-[48px] px-1 border-b border-cave-800`
        : 'min-h-11 px-2.5 rounded-lg flex items-center gap-2.5 cursor-pointer data-[selected=true]:bg-cave-850 data-[selected=true]:shadow-[inset_3px_0_0_rgb(var(--ebc-straw-rgb,17_17_17))]'}
    >
      <ChevronRight size={18} aria-hidden="true" className="shrink-0 text-cave-400" />
      <span className="min-w-0 truncate text-sm text-cave-50">Aller à · <span className="font-semibold"><Marque t={LIBELLE_DESTINATION_TROUVEE[id] ?? LIBELLE_DESTINATION[id]} q={query} /></span></span>
    </Command.Item>
  );
  const phrase = <span className="sr-only" role="status">{requete ? nombre : ''}</span>;

  /* ------------------------------------------------------------ 1280 ------ */
  if (large) {
    const aperçu = actif?.apercu?.();
    const type = actif ? typeDeId(actif.id) : undefined;
    const TA = type ? TYPE_ICONE[type] : undefined;
    return (
      <div
        data-page-overlay
        className="fixed inset-0 z-[100] flex items-start justify-center pt-[72px] palette-voile"
        onPointerDown={(e) => { if (e.target === e.currentTarget) fermer(); }}
      >
        <Command
          label="Recherche universelle"
          shouldFilter={false}
          loop
          value={valeur}
          onValueChange={setCourant}
          onKeyDownCapture={surTouche}
          className="w-[900px] max-w-[calc(100vw-32px)] panel shadow-lift overflow-hidden"
        >
          <div className="h-[54px] flex items-center gap-2.5 px-3.5 border-b border-cave-800 text-[17px]">
            <Search size={16} aria-hidden="true" className="shrink-0 text-cave-400" />
            {menu && contexte && <Pastille menu={menu} />}
            {champ}
            {requete && <span aria-hidden="true" className="shrink-0 text-sm text-cave-400">{nombre}</span>}
            {phrase}
            {bascule}
            <button type="button" aria-label="Fermer la recherche" onClick={fermer} className={`${FOCUS} shrink-0 rounded border border-cave-600 px-1.5 text-footnote font-mono leading-[18px] text-cave-400`}>Échap</button>
          </div>

          <div className={requete && actif ? 'grid grid-cols-[1fr_360px]' : ''}>
            <Command.List className="max-h-[480px] min-h-[200px] overflow-y-auto overscroll-contain p-1.5 flex flex-col">
              {requete ? (
                <>
                  <Command.Empty className="px-3 py-6">{sorties}</Command.Empty>
                  {destDevant && destinations.map(d => ligneDestination(d.id, false))}
                  {resultats.items.map(it => (
                    <Command.Item
                      key={it.id}
                      value={it.id}
                      aria-label={nomOption(it)}
                      onSelect={() => choisir(it)}
                      className="min-h-11 px-2.5 rounded-lg flex items-center gap-2.5 cursor-pointer data-[selected=true]:bg-cave-850 data-[selected=true]:shadow-[inset_3px_0_0_rgb(var(--ebc-straw-rgb,17_17_17))]"
                    >
                      {titre(it)}
                      {it.valeur ? <span className="shrink-0 text-sm text-cave-50"><Nb t={it.valeur} /></span>
                        : it.gestes?.[0] ? <span className="shrink-0 text-sm text-cave-200">{it.gestes[0].label}</span> : null}
                    </Command.Item>
                  ))}
                  {!destDevant && destinations.map(d => ligneDestination(d.id, false))}
                  {puceArchives}
                </>
              ) : (
                <>
                  {ici.map(l => {
                    const I = ICONE_ICI[l.cle] ?? CirclePlus;
                    return (
                      <Command.Item key={`ici-${l.cle}`} value={`ici-${l.cle}`} onSelect={() => lancerIci(l.cle)} className="min-h-10 px-2.5 rounded-lg flex items-center gap-2.5 cursor-pointer data-[selected=true]:bg-cave-850">
                        <I size={18} aria-hidden="true" className={TON[l.ton].texte} />
                        <span className="text-sm font-semibold text-cave-50">{l.label}</span>
                        {l.hint && <span className="text-footnote text-cave-400">{l.hint}</span>}
                      </Command.Item>
                    );
                  })}
                  {onGeste && CREER.map(cle => {
                    const I = CREER_ICONE[cle];
                    return (
                      <Command.Item key={`cre-${cle}`} value={`cre-${cle}`} onSelect={() => lancerIci(cle)} className="min-h-10 px-2.5 rounded-lg flex items-center gap-2.5 cursor-pointer data-[selected=true]:bg-cave-850">
                        <I size={18} aria-hidden="true" className="text-cave-200" />
                        <span className="text-sm text-cave-50">Créer · {CREER_LIBELLE[cle].toLowerCase()}</span>
                      </Command.Item>
                    );
                  })}
                  {onCompagnon && (
                    <Command.Item value="cre-compagnon" onSelect={() => { onCompagnon(); fermer(); }} className="min-h-10 px-2.5 rounded-lg flex items-center gap-2.5 cursor-pointer data-[selected=true]:bg-cave-850">
                      <MessageCircle size={18} aria-hidden="true" className="text-cave-200" />
                      <span className="text-sm text-cave-50">Compagnon brasseur</span>
                    </Command.Item>
                  )}
                  {allerA.map(id => (
                    <Command.Item key={id} value={`go-${id}`} onSelect={() => aller(id)} className="min-h-10 px-2.5 rounded-lg flex items-center gap-2.5 cursor-pointer data-[selected=true]:bg-cave-850">
                      <ChevronRight size={16} aria-hidden="true" className="text-cave-400" />
                      <span className="text-sm text-cave-50">Aller à · {LIBELLE_DESTINATION[id]}</span>
                    </Command.Item>
                  ))}
                  {reprendre.map(it => (
                    <Command.Item key={`rep-${it.id}`} value={`rep-${it.id}`} onSelect={() => choisir(it)} className="min-h-10 px-2.5 rounded-lg flex items-center gap-2.5 cursor-pointer data-[selected=true]:bg-cave-850">
                      {titre(it)}
                    </Command.Item>
                  ))}
                </>
              )}
            </Command.List>

            {requete && actif && (
              <aside aria-label="Aperçu de la ligne choisie" className="border-l border-cave-800 bg-cave-850/60 p-3.5 flex flex-col overflow-y-auto max-h-[480px]">
                <h3 className="m-0 text-[17px] font-semibold text-cave-50 flex items-center gap-2">
                  {TA && <TA.Icone size={18} aria-hidden="true" className={TA.texte} />}
                  <span className="truncate">{actif.label}</span>
                </h3>
                {aperçu?.sousTitre && <p className="m-0 mt-0.5 mb-3 ml-[26px] text-sm text-cave-200"><Nb t={aperçu.sousTitre} /></p>}
                {aperçu && aperçu.chiffres.length > 0 && (
                  <dl className="grid grid-cols-3 gap-2 m-0 mb-3">
                    {aperçu.chiffres.map(c => (
                      <div key={c.label} className="flex flex-col gap-0.5 text-footnote text-cave-400">
                        <dt>{c.label}</dt>
                        <dd className="m-0 text-xl text-cave-50"><Nb t={c.valeur} /></dd>
                      </div>
                    ))}
                  </dl>
                )}
                {aperçu && aperçu.emplois.length > 0 && (
                  <ul className="list-none p-0 m-0 mb-3 flex flex-col gap-1">
                    {aperçu.emplois.map((e, i) => {
                      const TE = TYPE_ICONE[e.type];
                      return (
                        <li key={i} className="h-8 flex items-center gap-2 px-2.5 rounded-lg bg-cave-900 border border-cave-800 text-footnote text-cave-50">
                          <TE.Icone size={14} aria-hidden="true" className={TE.texte} /><span className="truncate"><Nb t={e.texte} /></span>
                          {e.valeur && <span className="ml-auto text-cave-200 shrink-0"><Nb t={e.valeur} /></span>}
                        </li>
                      );
                    })}
                  </ul>
                )}
                <ul className="list-none p-0 m-0 mt-auto pt-2 border-t border-cave-800 flex flex-col gap-0.5">
                  <li className={`h-[34px] flex items-center gap-2.5 px-2 rounded-lg text-sm ${curseur === 0 ? 'bg-ebc-straw text-cave-950 font-semibold' : 'text-cave-50'}`}>
                    {TA && <TA.Icone size={16} aria-hidden="true" />}Ouvrir la fiche<span className="ml-auto"><Touche fort={curseur === 0}>↵</Touche></span>
                  </li>
                  {gestesActif.map((g, i) => {
                    const I = GESTE_ICONE[g.id];
                    return (
                      <li key={g.id}>
                        <button type="button" onClick={() => faire(actif, g)} className={`${FOCUS} w-full h-[34px] flex items-center gap-2.5 px-2 rounded-lg text-sm text-left ${curseur === i + 1 ? 'bg-ebc-straw text-cave-950 font-semibold' : 'text-cave-50 hover:bg-cave-850'}`}>
                          <I size={16} aria-hidden="true" />{LIBELLE_GESTE_LONG[g.id]}<span className="ml-auto"><Touche fort={curseur === i + 1}>Alt {TOUCHE_GESTE[g.id]}</Touche></span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </aside>
            )}
          </div>

          <div className="h-[34px] flex items-center gap-[18px] px-3.5 border-t border-cave-800 text-footnote text-cave-400">
            <span className="inline-flex items-center gap-1.5"><Touche>↑↓</Touche>objet</span>
            {requete && gestesActif.length > 0 && <span className="inline-flex items-center gap-1.5"><Touche>→</Touche>ses gestes</span>}
            <span className="inline-flex items-center gap-1.5"><Touche>↵</Touche>{curseur ? 'faire' : 'ouvrir'}</span>
            {menu && contexte && <span className="inline-flex items-center gap-1.5"><Touche>⌫</Touche>sur vide : hors de {rubrique}</span>}
          </div>
        </Command>
      </div>
    );
  }

  /* ------------------------------------------------------------ téléphone -- */
  const meilleurs = resultats.items;
  return (
    <div
      data-page-overlay
      className="fixed inset-0 z-[100] palette-voile"
      onPointerDown={(e) => { if (e.target === e.currentTarget) fermer(); }}
    >
      <Command
        label="Recherche universelle"
        shouldFilter={false}
        loop
        value={valeur}
        onValueChange={setCourant}
        onKeyDownCapture={surTouche}
        style={{ bottom: clavier, maxHeight: `calc(100dvh - ${clavier}px - 48px)` }}
        className="absolute inset-x-0 flex flex-col panel !rounded-b-none !border-b-0 !rounded-t-[14px] shadow-lift overflow-hidden"
      >
        <div aria-hidden="true" className="h-3.5 grid place-items-center shrink-0"><span className="w-9 h-1 rounded-sm bg-cave-600" /></div>
        {phrase}
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain flex flex-col justify-end">
          {requete ? (
            meilleurs.length === 0 && destinations.length === 0 ? sorties : (
              <Command.List className="px-2.5 pb-1.5 [&_[cmdk-list-sizer]]:flex [&_[cmdk-list-sizer]]:flex-col-reverse">
                {destDevant && destinations.map(d => ligneDestination(d.id, true))}
                {meilleurs.map(ligneTelephone)}
                {!destDevant && destinations.map(d => ligneDestination(d.id, true))}
                {puceArchives}
              </Command.List>
            )
          ) : zoneVide}
        </div>
        <div className="shrink-0 h-[52px] flex items-center gap-1.5 px-2 border-t border-cave-800 bg-cave-900">
          <div className="flex-1 min-w-0 h-[38px] flex items-center gap-1.5 pl-1 pr-2.5 rounded-[10px] bg-cave-850">
            {menu && contexte && <Pastille menu={menu} />}
            {champ}
            {requete && <span aria-hidden="true" className="shrink-0 text-footnote text-cave-400"><Nb t={String(total)} /></span>}
          </div>
          {bascule}
          <button type="button" aria-label="Fermer la recherche" onClick={fermer} className={`${FOCUS} shrink-0 h-[38px] w-9 grid place-items-center rounded-[10px] text-cave-200`}>
            <X size={18} aria-hidden="true" />
          </button>
        </div>
      </Command>
    </div>
  );
};

