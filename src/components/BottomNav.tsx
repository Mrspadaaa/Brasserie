import React from 'react';
import { LayoutDashboard, Wallet, Beer, Boxes, Users } from 'lucide-react';

export type TabType = 'dashboard' | 'finances' | 'production' | 'stocks' | 'clients';

interface BottomNavProps {
  activeTab: TabType;
  onChangeTab: (tab: TabType) => void;
  criticalStockCount: number;
}

/**
 * Navigation principale, ancrée sous le pouce.
 *
 * Une barre de 40 px hors zone sûre, extensible quand le texte grandit.
 * Les repères de rubrique restent visibles ; le trait et le fond identifient
 * la destination active. Les cibles restent dans leur propre colonne.
 *
 * ⚠️ La barre ne porte plus le bouton d'action : il vit dans
 * `FloatingActions`, présent sur les onglets ET sur les pages plein écran.
 * Elle continue de publier sa hauteur — c'est l'ancrage de ce bouton.
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
  criticalStockCount
}) => {
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
  return (
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
  );
};
