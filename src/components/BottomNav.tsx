import React from 'react';
import { LayoutDashboard, Wallet, Beer, Boxes, Users, Plus, ClipboardList } from 'lucide-react';
import { FabAction } from '../domain/fabActions';

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
}

/**
 * Navigation principale, ancrée sous le pouce.
 *
 * Chaque onglet occupe toute la hauteur de la barre (64 px + zone sûre), soit
 * bien au-delà des 48 px requis — l'app se manipule à une main dans la cuverie.
 * Les libellés passent de 10 px à 12 px : ils sont épaulés par une icône, mais
 * 10 px restait illisible en lumière faible.
 *
 * Le bouton d'action mesure 56 px et conserve son action contextuelle.
 */

const TABS: Array<{
  id: TabType;
  label: string;
  Icon: typeof LayoutDashboard;
  badge?: boolean;
}> = [
  { id: 'dashboard', label: 'Bord', Icon: LayoutDashboard },
  { id: 'finances', label: 'Finances', Icon: Wallet },
  { id: 'production', label: 'Brassins', Icon: Beer },
  { id: 'stocks', label: 'Stocks', Icon: Boxes, badge: true },
  { id: 'clients', label: 'Clients', Icon: Users }
];

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onChangeTab,
  action,
  onAction,
  onOpenQuickAction,
  criticalStockCount
}) => (
  <>
    <div
      className="fixed right-4 z-40 flex items-center gap-2"
      style={{ bottom: 'calc(6rem + env(safe-area-inset-bottom, 0px))' }}
    >
      <span
        className="hidden sm:block px-3 py-1.5 rounded-control bg-cave-850/95 backdrop-blur-sm
                   border border-cave-700 text-sm text-cave-200 shadow-lift"
        aria-hidden
      >
        {action.label}
      </span>
      <button
        type="button"
        onClick={onAction}
        onContextMenu={(event) => {
          event.preventDefault();
          onOpenQuickAction();
        }}
        aria-label={action.label}
        className="w-touch-lg h-touch-lg rounded-full shrink-0
                   bg-ebc-straw text-cave-950 shadow-lift
                   flex items-center justify-center
                   transition-transform active:scale-95
                   focus-visible:outline-2 focus-visible:outline-offset-4"
      >
        {action.intent === 'copyShoppingList' ? (
          <ClipboardList className="w-7 h-7" strokeWidth={2.5} />
        ) : (
          <Plus className="w-7 h-7" strokeWidth={2.5} />
        )}
      </button>
    </div>
    <nav
      aria-label="Navigation principale"
      className="fixed bottom-0 inset-x-0 z-40 bg-cave-900/95 backdrop-blur-xl
                 border-t border-cave-800 select-none pb-safe"
    >
      <div className="max-w-md mx-auto grid grid-cols-5">
        {TABS.map(({ id, label, Icon, badge }) => {
          const active = activeTab === id;
          return (
            <button
              key={id}
              onClick={() => onChangeTab(id)}
              aria-current={active ? 'page' : undefined}
              className={`relative h-16 flex flex-col items-center justify-center gap-1
                          transition-colors ${
                            active ? 'text-ebc-straw' : 'text-cave-400 hover:text-cave-200'
                          }`}
            >
              {active && (
                <span className="absolute top-0 w-10 h-0.5 bg-ebc-straw rounded-full" />
              )}

              <span className="relative">
                <Icon className="w-6 h-6" />
                {badge && criticalStockCount > 0 && (
                  <span
                    className="absolute -top-1.5 -right-2.5 min-w-[1.15rem] h-[1.15rem] px-1
                               bg-alert text-cave-50 rounded-full
                               text-footnote font-semibold font-mono
                               flex items-center justify-center"
                    aria-label={`${criticalStockCount} articles en rupture`}
                  >
                    {criticalStockCount}
                  </span>
                )}
              </span>

              <span className="text-footnote font-medium">{label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  </>
);
