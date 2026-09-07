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
 * Chaque onglet occupe toute la hauteur de la barre (64 px + zone sûre), soit
 * bien au-delà des 48 px requis — l'app se manipule à une main dans la cuverie.
 * Les libellés passent de 10 px à 12 px : ils sont épaulés par une icône, mais
 * 10 px restait illisible en lumière faible.
 *
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
  criticalStockCount
}) => (
  <>
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
