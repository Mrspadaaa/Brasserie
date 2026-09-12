import React from 'react';
import { LayoutDashboard, Wallet, Beer, Boxes, Users, Plus, ClipboardList } from 'lucide-react';
import { FabAction } from '../domain/fabActions';
import { useMobileLayout } from '../ui/useViewport';

export type TabType = 'dashboard' | 'finances' | 'production' | 'stocks' | 'clients';

interface BottomNavProps {
  activeTab: TabType;
  onChangeTab: (tab: TabType) => void;
  /** Ce que crée le bouton ici — dépend de l'onglet ET du sous-onglet. */
  action: FabAction;
  onAction: () => void;
  /** Appui long : la saisie rapide, quel que soit l'écran. */
  onOpenQuickAction: () => void;
  criticalStockCount: number;
  hideAction?: boolean;
}

/**
 * Navigation principale, ancrée sous le pouce.
 *
 * Une barre de 40 px hors zone sûre, extensible quand le texte grandit.
 * Les repères de rubrique restent visibles ; le trait et le fond identifient
 * la destination active. Les cibles restent dans leur propre colonne.
 */

const TABS: Array<{
  id: TabType;
  label: string;
  Icon: typeof LayoutDashboard;
  accent: string;
  selected: string;
  badge?: boolean;
}> = [
  { id: 'dashboard', label: 'Bord', Icon: LayoutDashboard, accent: 'text-cave-200', selected: 'bg-cave-850' },
  { id: 'finances', label: 'Finances', Icon: Wallet, accent: 'text-area-finances', selected: 'bg-area-finances/10' },
  { id: 'production', label: 'Brassins', Icon: Beer, accent: 'text-area-production', selected: 'bg-area-production/10' },
  { id: 'stocks', label: 'Stocks', Icon: Boxes, accent: 'text-area-stocks', selected: 'bg-area-stocks/10', badge: true },
  { id: 'clients', label: 'Clients', Icon: Users, accent: 'text-cave-200', selected: 'bg-cave-850' }
];

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onChangeTab,
  action,
  onAction,
  onOpenQuickAction,
  criticalStockCount,
  hideAction = false
}) => {
  const mobile = useMobileLayout();
  const navigationRef = React.useRef<HTMLElement | null>(null);
  React.useLayoutEffect(() => {
    const navigation = navigationRef.current;
    if (!navigation) return;
    const root = document.documentElement;
    const property = '--main-navigation-height';
    const previousValue = root.style.getPropertyValue(property);
    const previousPriority = root.style.getPropertyPriority(property);
    const publishHeight = () => {
      const height = `${navigation.getBoundingClientRect().height}px`;
      if (root.style.getPropertyValue(property) !== height) root.style.setProperty(property, height);
    };
    publishHeight();
    // La boîte complète comprend la zone sûre, même si seule sa marge change.
    const observer = new ResizeObserver(publishHeight);
    observer.observe(navigation, { box: 'border-box' });
    return () => {
      observer.disconnect();
      if (previousValue) root.style.setProperty(property, previousValue, previousPriority);
      else root.style.removeProperty(property);
    };
  }, []);
  const pressTimer = React.useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const longPressed = React.useRef(false);
  const pressOrigin = React.useRef({ x: 0, y: 0 });
  const cancelPress = () => { clearTimeout(pressTimer.current); pressTimer.current = undefined; };
  React.useEffect(() => cancelPress, [action.intent, hideAction]);
  const openQuickActions = () => {
    cancelPress();
    if (longPressed.current) return;
    longPressed.current = true;
    onOpenQuickAction();
  };
  return (
  <>
    <div
      className="fixed right-3 z-40 flex items-center gap-2"
      style={{ bottom: 'calc(var(--main-navigation-height, 2.5rem) + .5rem)', ...(activeTab === 'finances' && !mobile || hideAction ? { display: 'none' } : {}) }}
    >
      <span
        className="hidden sm:block px-2 py-1 rounded-control bg-cave-850
                   border border-cave-700 text-2xs text-cave-200 shadow-lift"
        aria-hidden
      >
        {action.label}
      </span>
      <button
        type="button"
        onClick={(event) => { if (event.detail === 0 || !longPressed.current) onAction(); longPressed.current = false; }}
        onPointerDown={(event) => {
          cancelPress(); longPressed.current = false;
          if (event.button !== 0 || event.isPrimary === false) return;
          pressOrigin.current = { x: event.clientX, y: event.clientY };
          pressTimer.current = setTimeout(openQuickActions, 550);
        }}
        onPointerMove={(event) => {
          if (Math.hypot(event.clientX - pressOrigin.current.x, event.clientY - pressOrigin.current.y) > 10) cancelPress();
        }}
        onPointerUp={cancelPress}
        onPointerCancel={cancelPress}
        onPointerLeave={cancelPress}
        onContextMenu={(event) => {
          event.preventDefault();
          openQuickActions();
        }}
        aria-label={action.label}
        aria-description="Appui long pour ouvrir les autres saisies rapides."
        aria-haspopup={action.intent === 'copyShoppingList' ? undefined : 'dialog'}
        title={`${action.label} · Appui long : saisie rapide`}
        className="w-8 h-8 rounded-control shrink-0
                   bg-ebc-straw text-cave-950 shadow-lift
                   flex items-center justify-center select-none touch-manipulation [-webkit-touch-callout:none]
                   motion-safe:transition-transform motion-safe:active:scale-95
                   focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cave-50"
      >
        {action.intent === 'copyShoppingList' ? (
          <ClipboardList className="w-4 h-4" strokeWidth={2.5} aria-hidden="true" />
        ) : (
          <Plus className="w-4 h-4" strokeWidth={2.5} aria-hidden="true" />
        )}
      </button>
    </div>
    <nav
      ref={navigationRef}
      aria-label="Navigation principale"
      className="fixed bottom-0 inset-x-0 z-40 bg-cave-900 select-none pb-safe"
    >
      <span aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-px bg-cave-800" />
      <div className="max-w-md mx-auto flex overflow-x-auto overscroll-x-contain scrollbar-none">
        {TABS.map(({ id, label, Icon, accent, selected, badge }) => {
          const active = activeTab === id;
          const stockLabel = badge && criticalStockCount > 0
            ? `${label}, ${criticalStockCount} ${criticalStockCount === 1 ? 'article' : 'articles'} au seuil ou en dessous`
            : undefined;
          return (
            <button
              key={id}
              type="button"
              onClick={() => onChangeTab(id)}
              aria-current={active ? 'page' : undefined}
              aria-label={stockLabel}
              className={`relative min-h-10 min-w-max flex-1 px-1 py-0.5 flex flex-col items-center justify-center gap-0.5
                          transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-cave-50
                          ${accent} ${active ? selected : 'hover:bg-cave-850'}`}
            >
              {active && (
                <span aria-hidden="true" className="pointer-events-none absolute top-0 w-8 max-w-full h-0.5 bg-current rounded-full" />
              )}

              <span aria-hidden="true" className="inline-flex max-w-full flex-wrap items-center justify-center gap-x-1">
                <Icon className="w-4 h-4 shrink-0" />
                {badge && criticalStockCount > 0 && (
                  <span
                    className="min-w-4 min-h-4 max-w-full break-all px-1
                               bg-attention text-cave-950 rounded-full
                               text-xs leading-4 font-semibold font-mono
                               flex items-center justify-center"
                  >
                    {criticalStockCount}
                  </span>
                )}
              </span>

              <span className={`w-full whitespace-nowrap text-xs leading-4 ${active ? 'font-semibold text-cave-50' : 'font-medium text-cave-200'}`}>{label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  </>
);
};
