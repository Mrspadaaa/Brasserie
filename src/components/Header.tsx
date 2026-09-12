import React, { useState, useRef, useEffect } from 'react';
import {
  Settings,
  Shield,
  User,
  Wrench,
  Search,
  Lightbulb,
  Cloud,
  LogOut,
  MoreVertical,
  Check,
  ChevronDown,
  MessageCircle
} from 'lucide-react';
import { AppConfig, TimeFilterPeriod } from '../types';
import { StorageService } from '../services/storage';
import { IconButton } from './ui/Button';
import { useDensity, useMobileLayout } from '../ui/useViewport';

interface HeaderProps {
  /** Barre compacte du dashboard, extensible avec le texte. */
  compactLayout?: boolean;
  hidePeriod?: boolean;
  config: AppConfig;
  globalTimeFilter: TimeFilterPeriod;
  onChangeGlobalTimeFilter: (p: TimeFilterPeriod) => void;
  onOpenSettings: () => void;
  onOpenCloudConfig?: () => void;
  onOpenAuditLogs: () => void;
  onNavigateToBrewAssistant: () => void;
  onNavigateToCreativeLab: () => void;
  onGoHome: () => void;
  /** Ouvre la recherche universelle (palette). */
  onOpenSearch: () => void;
  onLogout?: () => void;
  pendingTodosCount?: number;
}

const PERIODS: Array<{ key: TimeFilterPeriod; label: string }> = [
  { key: 'all', label: "Tout l'historique" },
  { key: 'this-month', label: 'Ce mois' },
  { key: 'last-month', label: 'Mois dernier' },
  { key: 'year', label: `Exercice ${new Date().getFullYear()}` },
  { key: 'q1', label: '1er trimestre' },
  { key: 'q2', label: '2e trimestre' },
  { key: 'q3', label: '3e trimestre' },
  { key: 'q4', label: '4e trimestre' }
];

/** Ferme un panneau au clic extérieur et à la touche Échap. */
function useDismiss(onDismiss: () => void) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const onPointer = (e: PointerEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onDismiss();
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onDismiss();
    document.addEventListener('pointerdown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [onDismiss]);
  return ref;
}

/**
 * En-tête.
 *
 * L'ancienne version entassait sept boutons icônes de 32 px, une puce
 * utilisateur et un sélecteur de période à défilement horizontal — le tout sous
 * une étiquette « PÉRIODE : » en capitales. Sur un téléphone tenu à une main,
 * rien n'était atteignable de façon fiable.
 *
 * Il ne reste que ce qui sert en permanence : l'identité (retour à l'accueil),
 * la période affichée — qui est un vrai réglage de lecture, pas une décoration —
 * et un menu unique pour le reste. Trois cibles, toutes à 48 px.
 */
export const Header: React.FC<HeaderProps> = ({
  compactLayout = false,
  hidePeriod = false,
  config,
  globalTimeFilter,
  onChangeGlobalTimeFilter,
  onOpenSettings,
  onOpenCloudConfig,
  onOpenAuditLogs,
  onNavigateToBrewAssistant,
  onNavigateToCreativeLab,
  onOpenSearch,
  onGoHome,
  onLogout,
  pendingTodosCount = 0
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [periodOpen, setPeriodOpen] = useState(false);
  const currentUser = StorageService.getCurrentUser();
  /* Au doigt, l'en-tête se resserre : les cibles restent à 48 px, la marge part. */
  const compact = useDensity() !== 'comfortable';
  const mobile = useMobileLayout();

  const menuRef = useDismiss(() => setMenuOpen(false));
  const periodRef = useDismiss(() => setPeriodOpen(false));

  const activePeriod = PERIODS.find((p) => p.key === globalTimeFilter) ?? PERIODS[0];

  const menuItem =
    'w-full min-h-touch px-4 flex items-center gap-3 text-base text-cave-200 ' +
    'hover:bg-cave-850 active:bg-cave-800 transition-colors text-left';

  return (
    <header className="sticky top-0 z-40 bg-cave-950/95 backdrop-blur-md border-b border-cave-800 pt-safe">
      {/*
        ⚠️ `h-16` était FIXE, alors que `PageShell` et `Sheet` se plient déjà à la
        densité. Sur un téléphone, cet en-tête plus les pastilles de
        sous-navigation plus la rangée de titre mangeaient près du tiers de
        l'écran avant la première carte. `h-12` vaut exactement 48 px : la
        hauteur des cibles tactiles qu'il contient, plancher du système de
        design. On rend la marge morte, pas la surface utile.
      */}
      <div
        className={`max-w-4xl mx-auto px-3 flex items-center ${
          compactLayout ? 'min-h-9 flex-wrap gap-1 py-0.5' : compact || mobile ? 'h-12 gap-2' : 'h-16 gap-2'
        }`}
      >
        {/* Identité — ramène à l'accueil */}
        {/*
          ⚠️ `min-w-0` : sans lui, un élément de flex refuse de descendre sous la
          largeur de son contenu (`min-width: auto`). L'en-tête réclamait donc
          442 px pour 430 disponibles sur un téléphone courant : le bouton Menu
          était rogné de 8 px et TOUTE la page glissait latéralement. Les
          `truncate` posés à l'intérieur ne servaient à rien tant que le bouton
          lui-même ne pouvait pas rétrécir.
        */}
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
          <span className="min-w-0 hidden xs:block">
            <span className={`block font-semibold text-cave-50 leading-tight truncate group-hover:text-ebc-straw transition-colors ${compactLayout ? 'text-sm' : 'text-base'}`}>
              L'Affinée
            </span>
            <span className={`${compactLayout ? 'hidden' : 'hidden sm:block'} text-sm text-cave-400 leading-tight truncate`}>
              Villars-sur-Glâne
            </span>
          </span>
        </button>

        <div className="flex-1" />

        {/* Période : dans le menu sur téléphone, visible sur grand écran. */}
        <div className="relative" ref={periodRef} style={hidePeriod || mobile ? { display: 'none' } : undefined}>
          <button
            onClick={() => setPeriodOpen((o) => !o)}
            aria-expanded={periodOpen}
            className={`${compactLayout ? 'min-h-7 px-2' : 'min-h-touch px-3'} rounded-control border border-cave-700 bg-cave-900
                       text-cave-50 flex items-center gap-1.5 hover:border-cave-600 transition-colors`}
          >
            <span className="text-sm max-w-[7.5rem] truncate">{activePeriod.label}</span>
            <ChevronDown className={`w-4 h-4 shrink-0 transition-transform ${periodOpen ? 'rotate-180' : ''}`} />
          </button>

          {periodOpen && (
            <div className="absolute right-0 mt-2 w-56 panel shadow-lift overflow-hidden py-1">
              {PERIODS.map((p) => (
                <button
                  key={p.key}
                  onClick={() => {
                    onChangeGlobalTimeFilter(p.key);
                    setPeriodOpen(false);
                  }}
                  className={`${menuItem} justify-between ${
                    p.key === globalTimeFilter ? 'text-ebc-straw' : ''
                  }`}
                >
                  {p.label}
                  {p.key === globalTimeFilter && <Check className="w-4 h-4 shrink-0" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Recherche universelle. Au clavier c'est ⌘K / Ctrl+K ; au doigt,
            cette loupe est le seul chemin — d'où sa place en clair, hors menu. */}
        <IconButton label="Rechercher (⌘K)" onClick={onOpenSearch} intent="secondary" className={compactLayout ? 'min-h-7 min-w-7' : ''}>
          <Search className={compactLayout ? 'w-4 h-4' : 'w-5 h-5'} />
        </IconButton>
        <div id="brewer-mobile-header" className={`sm:hidden empty:hidden ${compactLayout ? '[&_button]:h-7 [&_button]:w-7 [&_button]:min-h-7 [&_button]:min-w-7 [&_button]:p-0 [&_svg]:h-4 [&_svg]:w-4' : ''}`}/>

        {/* Tout le reste vit derrière un seul bouton */}
        <div className="relative" ref={menuRef}>
          <IconButton
            label="Menu"
            className={compactLayout ? 'min-h-7 min-w-7' : ''}
            onClick={() => setMenuOpen((o) => !o)}
            aria-expanded={menuOpen}
            intent="secondary"
          >
            <MoreVertical className={compactLayout ? 'w-4 h-4' : 'w-5 h-5'} />
            {pendingTodosCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-ebc-straw" />
            )}
          </IconButton>

          {menuOpen && (
            <div className="absolute right-0 mt-2 w-64 panel shadow-lift max-h-[calc(100dvh-5rem)] overflow-y-auto overscroll-contain py-1">
              {mobile && !hidePeriod && <label className="block px-4 py-2 text-sm text-cave-200">Période de l’application
                <select aria-label="Période de l’application" className="mt-2 w-full min-h-touch rounded-control bg-cave-950 text-cave-50 px-2" value={globalTimeFilter}
                  onChange={event => onChangeGlobalTimeFilter(event.target.value as TimeFilterPeriod)}>{PERIODS.map(period => <option key={period.key} value={period.key}>{period.label}</option>)}</select>
              </label>}
              <button className={menuItem} onClick={() => { window.dispatchEvent(new Event('brewer-inbox-open')); setMenuOpen(false); }}><MessageCircle className="w-5 h-5 text-cave-400 shrink-0"/>Mes conversations</button>
              <button
                onClick={() => {
                  StorageService.setCurrentUser(currentUser === 'Gaëtan' ? 'Aricia' : 'Gaëtan');
                  setMenuOpen(false);
                }}
                className={menuItem}
              >
                <User className="w-5 h-5 text-cave-400 shrink-0" />
                <span className="flex-1">
                  Saisie au nom de <span className="text-ebc-straw">{currentUser}</span>
                </span>
              </button>

              <div className="my-1 border-t border-cave-800" />

              <button
                onClick={() => {
                  onNavigateToBrewAssistant();
                  setMenuOpen(false);
                }}
                className={menuItem}
              >
                <Wrench className="w-5 h-5 text-cave-400 shrink-0" />
                Assistant de brassage
              </button>

              <button
                onClick={() => {
                  onNavigateToCreativeLab();
                  setMenuOpen(false);
                }}
                className={menuItem}
              >
                <Lightbulb className="w-5 h-5 text-cave-400 shrink-0" />
                <span className="flex-1">Atelier R&D</span>
                {pendingTodosCount > 0 && (
                  <span className="font-mono text-sm text-ebc-straw shrink-0">
                    {pendingTodosCount}
                  </span>
                )}
              </button>

              <div className="my-1 border-t border-cave-800" />

              <button
                onClick={() => {
                  onOpenAuditLogs();
                  setMenuOpen(false);
                }}
                className={menuItem}
              >
                <Shield className="w-5 h-5 text-cave-400 shrink-0" />
                Journal des modifications
              </button>

              {onOpenCloudConfig && (
                <button
                  onClick={() => {
                    onOpenCloudConfig();
                    setMenuOpen(false);
                  }}
                  className={menuItem}
                >
                  <Cloud className="w-5 h-5 text-cave-400 shrink-0" />
                  Connexions cloud et IA
                </button>
              )}

              <button
                onClick={() => {
                  onOpenSettings();
                  setMenuOpen(false);
                }}
                className={menuItem}
              >
                <Settings className="w-5 h-5 text-cave-400 shrink-0" />
                Réglages
              </button>

              {onLogout && (
                <>
                  <div className="my-1 border-t border-cave-800" />
                  <button
                    onClick={() => {
                      onLogout();
                      setMenuOpen(false);
                    }}
                    className={`${menuItem} text-alert hover:bg-alert/10`}
                  >
                    <LogOut className="w-5 h-5 shrink-0" />
                    Se déconnecter
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
