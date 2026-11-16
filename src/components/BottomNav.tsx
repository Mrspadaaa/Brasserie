import React from 'react';
import { LayoutDashboard, Wallet, Beer, Boxes, Users, MessageCircle, CloudOff } from 'lucide-react';
import './navigation/navigation.css';

export type TabType = 'dashboard' | 'finances' | 'production' | 'stocks' | 'clients';

interface BottomNavProps {
  activeTab: TabType;
  onChangeTab: (tab: TabType) => void;
  criticalStockCount: number;
  /** Le compagnon n'est pas joignable : le pied du rail le dit, il n'y a plus de pastille flottante. */
  horsConnexion?: boolean;
}

/**
 * Navigation principale, ancrée sous le pouce.
 *
 * Une barre de 40 px hors zone sûre, extensible quand le texte grandit.
 * Les repères de rubrique restent visibles ; le trait et le fond identifient
 * la destination active. Les cibles restent dans leur propre colonne.
 *
 * À partir de 1024 px (b1, choisi) la même navigation devient un rail de 88 px
 * à gauche : le + en tête (case réservée par `App`), les cinq rubriques dessous,
 * le Compagnon en pied. Même composant, mêmes boutons, mêmes noms : seule la
 * mise en page change, donc aucune action n'est perdue d'une largeur à l'autre.
 *
 * ⚠️ La barre ne porte plus le bouton d'action : il vit dans
 * `FloatingActions`, présent sur les onglets ET sur les pages plein écran.
 * Elle continue de publier sa hauteur — c'est l'ancrage de ce bouton et de la
 * feuille du +. En rail elle publie 0 : rien ne se pose plus au-dessus d'elle.
 */

const TABS: Array<{
  id: TabType;
  label: string;
  Icon: typeof LayoutDashboard;
  accent: string;
  selected: string;
  /** Au rail, le fond de l'onglet actif est celui de sa pastille. */
  pastille: string;
  badge?: boolean;
}> = [
  { id: 'dashboard', label: 'Bord', Icon: LayoutDashboard, accent: 'text-cave-200', selected: 'bg-cave-850', pastille: 'min-[1024px]:bg-cave-850' },
  { id: 'finances', label: 'Finances', Icon: Wallet, accent: 'text-area-finances', selected: 'bg-area-finances/10', pastille: 'min-[1024px]:bg-area-finances/15' },
  { id: 'production', label: 'Brassins', Icon: Beer, accent: 'text-area-production', selected: 'bg-area-production/10', pastille: 'min-[1024px]:bg-area-production/15' },
  { id: 'stocks', label: 'Stocks', Icon: Boxes, accent: 'text-area-stocks', selected: 'bg-area-stocks/10', pastille: 'min-[1024px]:bg-area-stocks/15', badge: true },
  { id: 'clients', label: 'Clients', Icon: Users, accent: 'text-cave-200', selected: 'bg-cave-850', pastille: 'min-[1024px]:bg-cave-850' }
];

const RAIL = '(min-width: 1024px)';

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onChangeTab,
  criticalStockCount,
  horsConnexion = false
}) => {
  const navigationRef = React.useRef<HTMLElement | null>(null);
  React.useLayoutEffect(() => {
    const navigation = navigationRef.current;
    if (!navigation) return;
    const root = document.documentElement;
    const property = '--main-navigation-height';
    const previousValue = root.style.getPropertyValue(property);
    const previousPriority = root.style.getPropertyPriority(property);
    const rail = typeof window.matchMedia === 'function' ? window.matchMedia(RAIL) : null;
    const publishHeight = () => {
      // En rail, la barre n'occupe plus le bas de l'écran : ce qui s'y pose (toast, pied de page) repart du bord.
      const height = rail?.matches ? '0px' : `${navigation.getBoundingClientRect().height}px`;
      if (root.style.getPropertyValue(property) !== height) root.style.setProperty(property, height);
      // Le rail démarre sous l'en-tête, quelle que soit sa hauteur (zone sûre comprise).
      const header = document.querySelector('header');
      const top = header ? Math.round(header.getBoundingClientRect().bottom) : 37;
      if (root.style.getPropertyValue('--rail-top') !== `${top}px`) root.style.setProperty('--rail-top', `${top}px`);
    };
    publishHeight();
    // La boîte complète comprend la zone sûre, même si seule sa marge change.
    const observer = new ResizeObserver(publishHeight);
    observer.observe(navigation, { box: 'border-box' });
    const header = document.querySelector('header');
    if (header) observer.observe(header);
    rail?.addEventListener?.('change', publishHeight);
    return () => {
      observer.disconnect();
      rail?.removeEventListener?.('change', publishHeight);
      if (previousValue) root.style.setProperty(property, previousValue, previousPriority);
      else root.style.removeProperty(property);
      root.style.removeProperty('--rail-top');
    };
  }, []);
  return (
    <nav
      ref={navigationRef}
      aria-label="Navigation principale"
      className="nav-principale fixed bottom-0 inset-x-0 z-40 bg-cave-900 select-none pb-safe"
    >
      <span aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-px bg-cave-800 min-[1024px]:hidden" />
      <div className="max-w-md mx-auto flex overflow-x-auto overscroll-x-contain scrollbar-none
                      min-[1024px]:max-w-none min-[1024px]:flex-col min-[1024px]:items-center min-[1024px]:gap-1.5 min-[1024px]:overflow-visible">
        {TABS.map(({ id, label, Icon, accent, selected, pastille, badge }) => {
          const active = activeTab === id;
          const stockLabel = badge && criticalStockCount > 0
            ? `${label}, ${criticalStockCount} ${criticalStockCount === 1 ? 'article' : 'articles'} à commander`
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
                          min-[1024px]:flex-none min-[1024px]:w-[84px] min-[1024px]:min-w-0 min-[1024px]:min-h-0 min-[1024px]:px-0 min-[1024px]:py-0 min-[1024px]:gap-[3px]
                          min-[1024px]:bg-transparent min-[1024px]:hover:bg-transparent
                          ${accent} ${active ? selected : 'hover:bg-cave-850'}`}
            >
              {active && (
                <span aria-hidden="true" className="pointer-events-none absolute top-0 w-8 max-w-full h-0.5 bg-current rounded-full min-[1024px]:hidden" />
              )}

              <span aria-hidden="true"
                className={`inline-flex max-w-full flex-wrap items-center justify-center gap-x-1
                            min-[1024px]:w-14 min-[1024px]:h-[30px] min-[1024px]:rounded-2xl min-[1024px]:flex-nowrap ${active ? pastille : ''}`}>
                <Icon className="w-4 h-4 shrink-0 min-[1024px]:w-5 min-[1024px]:h-5" />
                {badge && criticalStockCount > 0 && (
                  <span
                    className="min-w-4 min-h-4 max-w-full break-all px-1
                               bg-attention text-cave-950 rounded-full
                               text-xs leading-4 font-semibold font-mono
                               flex items-center justify-center
                               min-[1024px]:absolute min-[1024px]:-top-1 min-[1024px]:left-[46px] min-[1024px]:min-w-[18px] min-[1024px]:min-h-[18px]"
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

      {/* Pied du rail : le Compagnon et son état. Au téléphone, il est dans la feuille du +. */}
      <button
        type="button"
        onClick={() => window.dispatchEvent(new Event('brewer-companion-open'))}
        aria-label={horsConnexion ? 'Compagnon brasseur, hors connexion' : 'Compagnon brasseur'}
        className="hidden min-[1024px]:flex absolute inset-x-0 bottom-0 flex-col items-center gap-0.5 px-1 py-3
                   text-footnote leading-4 text-cave-400 text-center hover:bg-cave-850
                   focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-cave-50"
      >
        {horsConnexion ? <CloudOff size={16} aria-hidden="true" /> : <MessageCircle size={16} aria-hidden="true" />}
        <span>Compagnon</span>
        {horsConnexion && <span>hors connexion</span>}
      </button>
    </nav>
  );
};
