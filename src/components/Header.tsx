import type { Transaction } from '../types';
import React from 'react';
import { Search } from 'lucide-react';
import { IconButton } from './ui/Button';
import { StorageService } from '../services/storage';
import { useDensity, useMobileLayout } from '../ui/useViewport';
import { PastillePeriode } from './periode/PastillePeriode';
import type { Periode, PeriodeEntree } from './periode/periode';

interface HeaderProps {
  /** Barre compacte de l'application, extensible avec le texte. */
  compactLayout?: boolean;
  /** Stocks, à partir de 900 px : la barre prend la largeur de l'écran (1264 px au lieu de 896), comme le contenu de l'onglet (verdict 5cdcd12e n° 3). */
  large?: boolean;
  hidePeriod?: boolean;
  /** LA période de l'application (m3r-a) : la même pastille sur chaque écran. */
  globalTimeFilter: PeriodeEntree;
  onChangeGlobalTimeFilter: (p: Periode) => void;
  /** Dates des écritures, pour les comptes de la grille. */
  /** Les opérations de l'app : la frise de la période en dessine les dépenses. */
  transactions?: Transaction[];
  /** Dit que la période vaut pour toute l'app (toast). */
  onAnnoncePeriode?: (message: string) => void;
  /** Ouvre (ou ferme) la page « Plus » : le duo d'avatars prend la place du ⋮ (m3). */
  onOpenPlus?: () => void;
  plusOpen?: boolean;
  onGoHome: () => void;
  /** Ouvre la recherche universelle (palette). */
  onOpenSearch: () => void;
  pendingTodosCount?: number;
  /** Anciens réglages du menu ⋮, passés aux aperçus (DesignPreview) : ils vivent maintenant dans la page Plus et sont ignorés ici. */
  config?: unknown;
  onOpenSettings?: () => void;
  onOpenCloudConfig?: () => void;
  onOpenAuditLogs?: () => void;
  onNavigateToBrewAssistant?: () => void;
  onNavigateToCreativeLab?: () => void;
  onLogout?: () => void;
}

/**
 * En-tête (m3, choisi) : l'identité qui ramène à l'accueil, la pastille de période, la loupe, et le duo d'avatars G/A qui ouvre
 * la page « Plus » (qui saisit, thème, outils, journal, connexions, réglages, déconnexion). Le menu ⋮ et le thème ne sont plus ici.
 * Les dimensions suivent les jetons compacts ; la même barre sur tous les écrans.
 */
export const Header: React.FC<HeaderProps> = ({
  compactLayout = false,
  large = false,
  hidePeriod = false,
  globalTimeFilter,
  onChangeGlobalTimeFilter,
  transactions,
  onAnnoncePeriode,
  onOpenPlus,
  plusOpen = false,
  onOpenSearch,
  onGoHome,
  pendingTodosCount = 0
}) => {
  const courant = StorageService.getCurrentUser();
  const autre = courant === 'Gaëtan' ? 'Aricia' : 'Gaëtan';
  const compact = useDensity() !== 'comfortable';
  const mobile = useMobileLayout();

  /* V-a : en-tête opaque. Un fond à 95 % et un flou laissaient voir à travers lui ce qui défile dessous (fantôme gris sous « L'Affinée » à 390). */
  return (
    <header className="sticky top-0 z-40 bg-cave-950 border-b border-cave-800 pt-safe">
      {/* La disposition compacte démarre à 36 px et grandit avec le texte. */}
      <div
        className={`app-titlebar max-w-4xl ${large ? 'min-[900px]:max-w-[1264px]' : ''} mx-auto px-2 flex items-center ${
          compactLayout ? 'min-h-9 flex-wrap gap-1 py-0.5' : compact || mobile ? 'h-12 gap-2' : 'h-16 gap-2'
        }`}
      >
        {/* Identité — ramène à l'accueil. `min-w-0` : sans lui, un élément de flex refuse de descendre sous la largeur de son contenu
            et toute la page glissait latéralement (442 px pour 430). */}
        <button
          onClick={onGoHome}
          className={`flex items-center text-left group min-w-0 ${compactLayout ? 'min-h-7 shrink-0 gap-1 pr-1' : 'gap-2.5 min-h-touch pr-2'}`}
          aria-label="Retour au tableau de bord"
        >
          <span
            className={`rounded-control bg-ebc-straw text-cave-950 flex items-center justify-center shrink-0 ${
              compactLayout ? 'w-7 h-7 text-sm' : compact ? 'w-9 h-9 text-base' : 'w-10 h-10 text-lg'
            }`}
          >
            🍺
          </span>
          <span className="app-brand-name min-w-0 hidden xs:block">
            <span className={`block font-semibold text-cave-50 leading-tight truncate group-hover:text-ebc-straw transition-colors ${compactLayout ? 'text-sm' : 'text-base'}`}>
              L'Affinée
            </span>
            <span className={`${compactLayout ? 'hidden' : 'hidden sm:block'} text-sm text-cave-400 leading-tight truncate`}>
              Villars-sur-Glâne
            </span>
          </span>
        </button>

        <div className="flex-1" />

        {/* data-periode-entete (écran Brassins, e6a/q9) : la liste des brassins porte sa propre période, `liste.css` masque la pastille de l'en-tête là seulement. */}
        {!hidePeriod && (
          <span data-periode-entete className="contents">
            <PastillePeriode periode={globalTimeFilter} onChoisir={onChangeGlobalTimeFilter} transactions={transactions} onAnnonce={onAnnoncePeriode} />
          </span>
        )}
        {/* Recherche universelle. Au clavier c'est ⌘K / Ctrl+K ; au doigt, cette loupe est le seul chemin — d'où sa place en clair. */}
        <IconButton label="Rechercher (⌘K)" onClick={onOpenSearch} intent="secondary" className={compactLayout ? 'min-h-7 min-w-7' : ''}>
          <Search className={compactLayout ? 'w-4 h-4' : 'w-5 h-5'} />
        </IconButton>
        {/* Le duo d'avatars : qui saisit (devant) et l'autre. Il ouvre la page « Plus ». */}
        <button
          type="button"
          onClick={onOpenPlus}
          aria-label={`Plus : saisie au nom de ${courant}`}
          aria-pressed={plusOpen}
          data-plus-duo
          className={`relative shrink-0 h-9 w-[52px] rounded-[14px] ${plusOpen ? 'ring-2 ring-ebc-straw' : ''}`}
        >
          <span aria-hidden="true" className="absolute right-1 top-[6px] h-6 w-6 rounded-full bg-cave-800 text-cave-50 grid place-items-center text-xs font-bold ring-2 ring-cave-950">{autre === 'Gaëtan' ? 'G' : 'A'}</span>
          {/* Lettre = couleur de la page (blanc en clair, cave en cave) sur l'aplat d'encre : `text-cave-950` reste une encre sombre en clair (themes.css). */}
          <span aria-hidden="true" style={{ color: 'rgb(var(--cave-950))' }} className="absolute left-1 top-[6px] h-6 w-6 rounded-full bg-cave-50 grid place-items-center text-xs font-bold ring-2 ring-cave-950">{courant === 'Gaëtan' ? 'G' : 'A'}</span>
          {pendingTodosCount > 0 && <span aria-hidden="true" className="absolute right-0.5 top-0.5 h-2 w-2 rounded-full bg-ebc-straw" />}
        </button>
      </div>
    </header>
  );
};
