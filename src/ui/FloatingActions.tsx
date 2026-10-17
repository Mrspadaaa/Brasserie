import React from 'react';
import { Beer, ClipboardList, FileText, LoaderCircle, MessageCircle, MessagesSquare, Plus, TrendingUp, Wheat } from 'lucide-react';
import type { FabAction } from '../domain/fabActions';
import { isBrewerWorking, useBrewerJobs } from '../services/brewerJobs';
import { useActionDock, useActionLauncherRegistration } from '../pages/PageShell';
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
 * ⚠️ Le bouton ne flotte plus au-dessus du contenu. Il se pose sur une case que
 * la mise en page réserve hors de toute zone défilante (`ActionDock`, dans
 * `PageShell.tsx`) : à droite de la barre d'onglets, dans le pied d'une page
 * plein écran, ou dans son en-tête quand le clavier est ouvert. Flottant, il
 * recevait le toucher destiné à un champ passé dessous au défilement — la
 * flèche d'un sélecteur, à 390 px. Sans case montée (composant isolé), il garde
 * l'ancien ancrage `anchor` en repli.
 *
 * ⚠️ Le bouton porte son `display` en ligne. Une feuille d'écran le masquait par
 * son nom (`body:has(.recipe-wizard) button[aria-label='Actions rapides']`) : sa
 * case restait vide, et comme la pastille du compagnon change ce nom, le bouton
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
  /** Facture d'achat : lecture du justificatif, puis vérification. */
  onInvoice: () => void;
  onSale: () => void;
  onRecipe: () => void;
  onBrew: () => void;
  /** Ancrage de repli quand aucune case n'est réservée : barre d'onglets, ou pied de page plein écran. */
  anchor: 'nav' | 'page';
  launcherRef?: React.MutableRefObject<HTMLButtonElement | null>;
}

interface Item {
  key: string;
  label: string;
  /** Seconde ligne : ce que l'action vise ici. */
  hint?: string;
  Icon: typeof Plus;
  /** Couleur de rubrique, portée par l'icône seule. */
  tone: string;
  count?: number;
  busy?: boolean;
  run: () => void;
}

/** Position et taille de la case réservée, en px depuis le bas et la droite de la fenêtre. */
interface DockGeometry {
  right: number;
  bottom: number;
  width: number;
  height: number;
}

const ROW = 'w-full flex items-center gap-2 px-2 py-1 min-h-touch-lg text-left text-2xs text-cave-200 ' +
  'hover:bg-cave-850 focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-cave-50';

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
  action, onAction, companionLabel, onInvoice, onSale, onRecipe, onBrew, anchor, launcherRef
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
  const { dock } = useActionDock();
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

  const groups: Item[][] = [];
  if (action) {
    groups.push([{
      key: 'screen', label: action.label, hint: 'Sur cet écran',
      Icon: action.intent === 'copyShoppingList' ? ClipboardList : Plus,
      tone: 'text-ebc-straw', run: onAction
    }]);
  }
  groups.push([
    {
      key: 'companion', label: 'Compagnon brasseur', hint: companionLabel,
      // `hop` dit « disponible, validé » : DESIGN.md le refuse pour un assistant.
      Icon: busy ? LoaderCircle : MessageCircle, tone: 'text-cave-200',
      count: waiting, busy,
      run: () => window.dispatchEvent(new Event('brewer-companion-open'))
    },
    ...(jobs.length ? [{
      key: 'inbox', label: `Mes conversations · ${jobs.length}`,
      Icon: MessagesSquare, tone: 'text-cave-400',
      run: () => window.dispatchEvent(new Event('brewer-inbox-open'))
    }] : [])
  ]);
  groups.push([
    { key: 'invoice', label: 'Entrer une facture', hint: 'Document, puis vérification', Icon: FileText, tone: 'text-area-finances', run: onInvoice },
    { key: 'sale', label: 'Encaisser une vente', Icon: TrendingUp, tone: 'text-area-finances', run: onSale }
  ]);
  groups.push([
    { key: 'recipe', label: 'Créer une recette', Icon: Wheat, tone: 'text-area-production', run: onRecipe },
    { key: 'brew', label: 'Lancer un brassin', hint: 'À partir d’une recette existante', Icon: Beer, tone: 'text-area-production', run: onBrew }
  ]);

  React.useEffect(() => {
    if (!open) return;
    const outside = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('pointerdown', outside);
    return () => document.removeEventListener('pointerdown', outside);
  }, [open]);

  React.useEffect(() => {
    if (open) menuRef.current?.querySelector<HTMLButtonElement>('button')?.focus();
  }, [open]);

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Escape') { event.preventDefault(); close(); return; }
    // La tabulation referme le menu ; le focus revient alors sur le bouton,
    // qui suit les lignes dans l'ordre du document.
    if (event.key === 'Tab') { setOpen(false); return; }
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

  /* Sur sa case, le bouton en prend la place exacte ; sans case, l'ancien ancrage sert de repli. */
  const fallbackBottom = anchor === 'page'
    ? 'calc(var(--page-footer-height, 0px) + .5rem)'
    : 'calc(var(--main-navigation-height, 2.5rem) + .5rem)';
  const iconSize = geometry ? Math.min(32, Math.round(Math.min(geometry.width, geometry.height) * 0.55)) : 32;
  /* Dans une rangée qui porte déjà l'action principale de la page, pas de second aplat paille. */
  const quiet = !!dock?.quiet;

  return (
    <div
      ref={rootRef}
      data-page-overlay
      data-floating-actions-dock={dock?.kind ?? 'none'}
      data-floating-actions-docked={geometry ? 'true' : 'false'}
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
      {open && (
        <div
          ref={menuRef}
          id={menuId}
          role="menu"
          aria-label="Actions rapides"
          onKeyDown={onKeyDown}
          className={`absolute right-0 w-[15rem] max-w-[calc(100vw-1.5rem)] overflow-hidden
                      rounded-panel border border-cave-700 bg-cave-900 shadow-lift
                      ${placement === 'top' ? 'bottom-full mb-1.5' : 'top-full mt-1.5'}`}
        >
          {/* Les lignes portent `tabIndex={-1}` : le clavier parcourt le menu aux
              flèches, et la tabulation le referme pour rendre la main au bouton. */}
          {groups.map((group, index) => (
            <div key={group[0].key} className={index ? 'border-t border-cave-800' : undefined}>
              {group.map(({ key, label, hint, Icon, tone, count, busy, run }) => (
                <button key={key} type="button" role="menuitem" tabIndex={-1} className={ROW} onClick={choose(run)}>
                  <Icon size={16} aria-hidden="true"
                    className={`shrink-0 ${tone} ${busy ? 'motion-safe:animate-spin' : ''}`} />
                  <span className="min-w-0 flex-1">
                    {label}
                    {hint && <span className="block text-footnote text-cave-400">{hint}</span>}
                  </span>
                  {!!count && (
                    <span className="shrink-0 min-w-4 px-1 rounded-full bg-attention text-cave-950
                                     font-mono text-footnote leading-4 font-semibold">
                      {count}
                    </span>
                  )}
                </button>
              ))}
            </div>
          ))}
        </div>
      )}

      {/*
        La case fixe la taille : 64 px de large partout — la commande qu'on vise
        ganté, en pénombre, une main sur la cuve —, à la hauteur de la barre qui
        la porte (40 px sur les onglets, 44 px en pied de page). Clavier ouvert,
        la case compacte (en-tête, ou pied si l'hôte masque l'en-tête) la réduit
        à 40×32. L'atelier de l'eau la docke lui-même près de ses onglets, à 40 px.
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
        onClick={() => {
          if (open) { close(false); return; }
          const rect = buttonRef.current?.getBoundingClientRect();
          setPlacement(rect && rect.top < window.innerHeight / 2 ? 'bottom' : 'top');
          setOpen(true);
        }}
        // En ligne : aucune règle d'écran ne retire le bouton de sa case (voir en tête).
        style={{ display: 'flex' }}
        className={`relative rounded-full items-center justify-center select-none touch-manipulation [-webkit-touch-callout:none]
                   motion-safe:transition-transform motion-safe:active:scale-95
                   focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cave-50
                   ${quiet
                     ? 'bg-cave-850 text-ebc-straw ring-1 ring-inset ring-ebc-straw/60'
                     : 'bg-ebc-straw text-cave-950 shadow-lift'}`}
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
