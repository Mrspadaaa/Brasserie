import React from 'react';
import { Plus } from 'lucide-react';
import type { FabAction } from '../domain/fabActions';
import { plusMenuPage, type PlusCle, type PlusMenu, LETTRES } from '../domain/plusEcran';
import { PlusSheet } from '../components/navigation/PlusSheet';
import { isBrewerWorking, useBrewerJobs } from '../services/brewerJobs';
import { useActionDock, useActionLauncherRegistration } from '../pages/PageShell';
import { useRail } from '../components/navigation/useRail';
import './floating-actions.css';

/**
 * Le geste d'action de l'application : un bouton, partout, et tout ce qu'on
 * lance dix fois par semaine.
 *
 * ⚠️ Ce que ça règle : le bouton d'action avait disparu du Tableau de bord et
 * des Finances, et ses fonctions s'étaient dispersées en autant de boutons
 * d'écran — un pour la saisie rapide, un pour le brassin, deux pour l'achat et
 * la vente, trois pour le compagnon. Le brasseur devait savoir quel écran
 * portait quel bouton. Ici, le même geste au même endroit ouvre les six
 * actions, et l'action de l'écran courant reste la première de la liste.
 *
 * ⚠️ Sur les onglets (b1s-a, 15.11 : « le bouton doit toujours être flottant »),
 * le + FLOTTE aux deux largeurs : 56 px, 12 px au-dessus de la barre à droite
 * au téléphone, au coin bas droit du contenu au 1280. La barre n'a plus de case
 * pour lui ; la fin des listes réserve 72 px (`navigation.css`). Une case
 * `ActionDock` reste suivie quand une page ou un écran en réserve une.
 * Sur une page plein écran, il FLOTTE en bas à droite, au-dessus du pied de la
 * page s'il y en a un (#114 : une case de pied coûtait une bande basse sur
 * chaque page). La page réserve en fin de contenu la place du bouton : son
 * dernier champ défile au-dessus de lui au lieu de lui céder son toucher.
 * Clavier ouvert, il passe dans une case de l'en-tête.
 *
 * ⚠️ Le bouton porte son `display` en ligne. Une feuille d'écran le masquait par
 * son nom (`body:has(.recipe-wizard) button[aria-label='Actions rapides']`, règle
 * retirée par #114) : comme la pastille du compagnon change ce nom, le bouton
 * apparaissait ou non selon les réponses en attente. Seules une modale ou une
 * feuille ouverte l'effacent, en masquant la racine (`floating-actions.css`).
 *
 * ⚠️ `data-page-overlay` n'est pas décoratif : `PageShell` rend `inert` toutes
 * les branches voisines de la page plein écran ouverte, et cet attribut est la
 * sortie qu'il prévoit. Sans lui, le bouton serait figé dès l'ouverture d'une
 * fiche recette ou du jour de brassage — précisément là où le compagnon sert.
 */

export interface FloatingActionsProps {
  /** Ce que crée l'écran courant. `null` sur une page plein écran. */
  action: FabAction | null;
  onAction: () => void;
  /** Ce dont parle le compagnon ici : écran ou page en cours. */
  companionLabel: string;
  /** Le menu du + de cet écran (`plusMenuFor`). Absent : dérivé de `action` et des quatre gestes de partout. */
  menu?: PlusMenu;
  /** Le geste choisi dans le menu. Absent : `onAction`, `onInvoice`, `onSale`, `onRecipe`, `onBrew`. */
  onPlus?: (cle: PlusCle | 'ecran') => void;
  /** Le compagnon n'est pas joignable : la ligne Compagnon le dit (plus de pastille flottante). */
  horsConnexion?: boolean;
  /** Facture d'achat : lecture du justificatif, puis vérification. */
  onInvoice?: () => void;
  onSale?: () => void;
  onRecipe?: () => void;
  onBrew?: () => void;
  /** Ancrage de repli quand aucune case n'est réservée : barre d'onglets, ou pied de page plein écran. */
  anchor: 'nav' | 'page';
  launcherRef?: React.MutableRefObject<HTMLButtonElement | null>;
}

/** Position et taille de la case réservée, en px depuis le bas et la droite de la fenêtre. */
interface DockGeometry {
  right: number;
  bottom: number;
  width: number;
  height: number;
}

/** Suit la case réservée : sa taille, et sa place quand la page se déplace (clavier, pied qui change). */
function useDockGeometry(element: HTMLElement | undefined): DockGeometry | null {
  const [geometry, setGeometry] = React.useState<DockGeometry | null>(null);
  React.useLayoutEffect(() => {
    if (!element) { setGeometry(null); return; }
    const measure = () => {
      const rect = element.getBoundingClientRect();
      // Case masquée (un écran docke le bouton lui-même) : on ne la suit pas.
      if (!(rect.width > 0 && rect.height > 0)) { setGeometry(null); return; }
      const root = document.documentElement;
      const next: DockGeometry = {
        right: Math.max(0, Math.round(root.clientWidth - rect.right)),
        bottom: Math.max(0, Math.round(root.clientHeight - rect.bottom)),
        width: Math.round(rect.width),
        height: Math.round(rect.height)
      };
      setGeometry((previous) => previous && previous.right === next.right && previous.bottom === next.bottom &&
        previous.width === next.width && previous.height === next.height ? previous : next);
    };
    measure();
    const frame = requestAnimationFrame(measure);
    const observer = typeof ResizeObserver === 'undefined' ? undefined : new ResizeObserver(measure);
    observer?.observe(element);
    if (element.parentElement) observer?.observe(element.parentElement);
    // Une page qui se relève au-dessus du clavier déplace sa case sans la redimensionner.
    const page = element.closest<HTMLElement>('[data-page-shell]');
    if (page) observer?.observe(page);
    const viewport = typeof window !== 'undefined' ? window.visualViewport : undefined;
    window.addEventListener('resize', measure);
    viewport?.addEventListener('resize', measure);
    return () => {
      cancelAnimationFrame(frame);
      observer?.disconnect();
      window.removeEventListener('resize', measure);
      viewport?.removeEventListener('resize', measure);
    };
  }, [element]);
  return geometry;
}

export const FloatingActions: React.FC<FloatingActionsProps> = ({
  action, onAction, companionLabel, menu: menuProp, onPlus, horsConnexion = false, onInvoice, onSale, onRecipe, onBrew, anchor, launcherRef
}) => {
  const [open, setOpen] = React.useState(false);
  /* Docké en haut d'écran — atelier de l'eau, en-tête clavier ouvert — le menu s'ouvre vers le bas. */
  const [placement, setPlacement] = React.useState<'top' | 'bottom'>('top');
  const rootRef = React.useRef<HTMLDivElement>(null);
  const buttonRef = React.useRef<HTMLButtonElement>(null);
  const menuRef = React.useRef<HTMLDivElement>(null);
  const menuId = React.useId();
  const { jobs } = useBrewerJobs();
  useActionLauncherRegistration();
  const { dock: reserved, pageFooter } = useActionDock();
  // Sur une page plein écran, la case des onglets reste montée sous la page :
  // le bouton ne la suit pas, il flotte au-dessus de la page.
  const dock = anchor === 'page' && reserved?.kind === 'nav' ? null : reserved;
  const geometry = useDockGeometry(dock?.element);

  // Mêmes comptes que la boîte des conversations, pour que la pastille du
  // bouton et le résumé de l'écran ne racontent jamais deux choses.
  const working = jobs.filter(isBrewerWorking).length;
  const waiting = jobs.filter((job) => !job.readAt && ['done', 'error'].includes(job.status)).length +
    jobs.filter((job) => job.sendError).length;
  /** Une question tourne, et aucune réponse n'attend d'être lue. */
  const busy = working > 0 && waiting === 0;

  const close = (focusButton = true) => {
    setOpen(false);
    if (focusButton) buttonRef.current?.focus();
  };

  // Le menu disparaît avant la nouvelle surface : son opener doit rester connecté.
  const choose = (run: () => void) => () => { close(); run(); };

  /* Le menu : celui de l'écran quand l'App le donne ; sinon l'action reçue et les quatre gestes de partout. */
  const menu: PlusMenu = menuProp ?? plusMenuPage({}, action);
  const lancer = (cle: PlusCle | 'ecran') => {
    if (onPlus) return onPlus(cle);
    ({ ecran: onAction, facture: onInvoice, vente: onSale, recette: onRecipe, brassin: onBrew } as Record<string, (() => void) | undefined>)[cle]?.();
  };
  const choisir = (cle: PlusCle | 'ecran') => choose(() => lancer(cle));
  const compagnon = {
    horsConnexion, attente: waiting, occupe: busy, contexte: companionLabel, conversations: jobs.length
  };
  const ouvrirCompagnon = () => choose(() => window.dispatchEvent(new Event('brewer-companion-open')))();
  const ouvrirConversations = () => choose(() => window.dispatchEvent(new Event('brewer-inbox-open')))();
  /* Au 1280 la feuille devient une liste à lettres sous le + du rail ; ailleurs, une feuille au-dessus de la barre. */
  const rail = useRail() && anchor === 'nav';
  const forme = rail ? 'liste' : 'feuille';
  const lettres: Record<string, PlusCle | 'ecran' | 'compagnon'> = { C: 'compagnon', N: 'ecran' };
  (Object.keys(LETTRES) as PlusCle[]).forEach((cle) => { lettres[LETTRES[cle]] = cle; });

  React.useEffect(() => {
    if (!open) return;
    const outside = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('pointerdown', outside);
    return () => document.removeEventListener('pointerdown', outside);
  }, [open]);

  /* Le focus va à la première ligne à l'ouverture ; l'anneau ne se voit que si le + a été activé au clavier
     (un toucher ou un clic ne laisse pas d'anneau noir sur « Sur cet écran »). */
  const ouvertAuClavier = React.useRef(false);
  React.useEffect(() => {
    if (open) menuRef.current?.querySelector<HTMLButtonElement>('button')?.focus({ focusVisible: ouvertAuClavier.current } as FocusOptions);
  }, [open]);

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Escape') { event.preventDefault(); close(); return; }
    // La tabulation referme le menu ; le focus revient alors sur le bouton,
    // qui suit les lignes dans l'ordre du document.
    if (event.key === 'Tab') { setOpen(false); return; }
    // Une lettre lance son geste, même si l'écran ne le montre pas (b1r : « une lettre reste active »).
    if (event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
      const cle = lettres[event.key.toUpperCase()];
      if (cle && (cle !== 'ecran' || menu.action)) {
        event.preventDefault();
        if (cle === 'compagnon') ouvrirCompagnon(); else choisir(cle)();
        return;
      }
    }
    const items = [...(menuRef.current?.querySelectorAll<HTMLButtonElement>('button') ?? [])];
    const current = items.indexOf(event.target as HTMLButtonElement);
    const target: Record<string, number | undefined> = {
      ArrowDown: current + 1,
      ArrowUp: current - 1,
      Home: 0,
      End: items.length - 1
    };
    const next = target[event.key];
    if (next === undefined || !items.length) return;
    event.preventDefault();
    items[(next + items.length) % items.length].focus();
  };

  /* Sur sa case, le bouton en prend la place exacte ; sans case, il flotte (48 px, `floating-actions.css`),
     décollé de 16 px du bas — zone sûre ou pied de la page compris. */
  const fallbackBottom = anchor === 'page'
    ? 'calc(var(--page-footer-height, 0px) + 1rem)'
    : 'calc(var(--main-navigation-height, 2.5rem) + 12px)';
  /* b1s-a (15.11, « le bouton doit toujours être flottant ») : sur les onglets, le + est un carré arrondi de 56 px à
     12 px au-dessus de la barre (24 px du coin au 1280), icône 28 ; sur une page plein écran, la forme de sa case (BX-4). */
  const iconSize = geometry ? Math.min(32, Math.round(Math.min(geometry.width, geometry.height) * 0.55)) : anchor === 'nav' ? 28 : 22;
  /* Flottant juste au-dessus d'un pied qui porte déjà l'action principale de la page : pas de second aplat paille. */
  const quiet = !geometry && anchor === 'page' && pageFooter;
  /* Le + reste le carré de b1s-b2 sur chaque écran, Brassins compris : « + Brassin » (e11a, `court` de `fabActions.ts`) n'est plus écrit sur le bouton ;
     le nom de l'action est « Nouveau brassin », en tête de la pile. */

  return (
    <div
      ref={rootRef}
      data-page-overlay
      data-floating-actions-dock={dock?.kind ?? 'none'}
      data-floating-actions-docked={geometry ? 'true' : 'false'}
      data-floating-actions-anchor={anchor}
      data-floating-actions-tone={quiet ? 'quiet' : 'primary'}
      className="floating-actions fixed z-[51]"
      style={{
        '--floating-actions-bottom': geometry ? `${geometry.bottom}px` : fallbackBottom,
        ...(geometry ? {
          '--floating-actions-right': `${geometry.right}px`,
          '--floating-actions-width': `${geometry.width}px`,
          '--floating-actions-height': `${geometry.height}px`
        } : {}),
        '--floating-actions-icon': `${iconSize}px`
      } as React.CSSProperties}
    >
      {open && anchor === 'nav' && <div aria-hidden="true" className="plus-voile z-[-1]" onPointerDown={() => close(false)} />}
      {open && (
        <div
          ref={menuRef}
          id={menuId}
          role="menu"
          aria-label="Actions rapides"
          data-plus-forme={anchor === 'nav' ? forme : 'page'}
          data-plus-ecran={menu.ecran}
          onKeyDown={onKeyDown}
          data-sens={anchor === 'page' && placement === 'bottom' ? 'bas' : 'haut'}
          className="plus-pile"
        >
          {/* Les lignes portent `tabIndex={-1}` : le clavier parcourt le menu aux flèches, et la tabulation le referme
              pour rendre la main au bouton. */}
          <PlusSheet menu={menu} forme={anchor === 'nav' ? forme : 'feuille'} compagnon={compagnon}
            onChoisir={choisir} onCompagnon={ouvrirCompagnon} onConversations={ouvrirConversations} />
        </div>
      )}

      {/*
        La case fixe la taille : 64 × 40 px à droite des onglets — la commande
        qu'on vise ganté, en pénombre, une main sur la cuve. Clavier ouvert, la
        case de l'en-tête la réduit à 40×32. L'atelier de l'eau la docke lui-même
        près de ses onglets, à 40 px. Flottant sur une page : rond de 48 px.
      */}
      <button
        ref={(node) => { buttonRef.current = node; if (launcherRef) launcherRef.current = node; }}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        aria-label={waiting
          ? `Actions rapides · ${waiting} ${waiting > 1 ? 'réponses' : 'réponse'} du compagnon`
          : 'Actions rapides'}
        title="Actions rapides"
        onKeyDown={(event) => { if (event.key === 'Escape' && open) { event.preventDefault(); close(); } }}
        onClick={(event) => {
          if (open) { close(false); return; }
          ouvertAuClavier.current = event.detail === 0;
          const rect = buttonRef.current?.getBoundingClientRect();
          setPlacement(rect && rect.top < window.innerHeight / 2 ? 'bottom' : 'top');
          setOpen(true);
        }}
        // En ligne : aucune règle d'écran ne retire le bouton de sa case (voir en tête).
        style={{ display: 'flex' }}
        className={`relative rounded-full items-center justify-center select-none touch-manipulation [-webkit-touch-callout:none]
                   motion-safe:transition-transform motion-safe:active:scale-95
                   focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cave-50
                   ${open
                     ? 'bg-cave-850 text-cave-50 border border-cave-700'
                     : quiet
                       ? 'bg-cave-850 text-ebc-straw ring-1 ring-inset ring-ebc-straw/60'
                       : 'bg-ebc-straw text-cave-950'} shadow-lift`}
      >
        <Plus strokeWidth={2.5} aria-hidden="true"
          className={`floating-actions-icon motion-safe:transition-transform ${open ? 'rotate-45' : ''}`} />
        {waiting > 0 && (
          <span aria-hidden="true"
            className="absolute -top-1 -right-1 min-w-4 min-h-4 px-1 rounded-full
                       bg-attention text-cave-950 font-mono text-footnote leading-4 font-semibold
                       flex items-center justify-center">
            {waiting}
          </span>
        )}
      </button>
    </div>
  );
};
