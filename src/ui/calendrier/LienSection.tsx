import React from 'react';
import { CalendarDays, ChevronRight } from 'lucide-react';

/**
 * E44, choix « calendriers-section » (16.11, ses mots : « Finances fb-fin · Brassins ok · Matériel ok · Stocks ok · Agenda ok », S1 : « Un général avec
 * son Tab Mais aussi un spécifique aux thématiques, finance, stock, brassage ECT... ? ») : chaque section a son calendrier, le même que le général
 * mais réglé sur ses rangées (`RANGEES_SECTION` de CalendrierTab). Ce lien est l'entrée posée dans la section ; l'App la prend (`EVENEMENT_CALENDRIER`)
 * et monte `CalendrierTab section=…`. Une ligne, un toucher, rien d'autre ; la rangée de couleur ne vient pas d'une maquette de l'entrée (à dessiner).
 */
export type SectionCalendrier = 'finances' | 'brassins' | 'materiel' | 'stocks' | 'agenda';

export const EVENEMENT_CALENDRIER = 'affinee:ouvrir-calendrier';

/** Le nom de la section tel que le brasseur le dit ; Finances est « l'argent » (fb-fin : le calendrier réglé sur l'argent). */
export const NOM_SECTION: Record<SectionCalendrier, string> = {
  finances: 'Argent', brassins: 'Brassins', materiel: 'Matériel', stocks: 'Stocks', agenda: 'Agenda'
};

const LIBELLE: Record<SectionCalendrier, string> = {
  finances: 'Calendrier de l’argent', brassins: 'Calendrier des brassins', materiel: 'Calendrier du matériel', stocks: 'Calendrier des stocks', agenda: 'Calendrier de l’agenda'
};

export function ouvrirCalendrierSection(section: SectionCalendrier): void {
  window.dispatchEvent(new CustomEvent<{ section: SectionCalendrier }>(EVENEMENT_CALENDRIER, { detail: { section } }));
}

export function lireSection(event: Event): SectionCalendrier | null {
  const s = (event as CustomEvent<{ section?: string }>).detail?.section;
  return s === 'finances' || s === 'brassins' || s === 'materiel' || s === 'stocks' || s === 'agenda' ? s : null;
}

export function LienSection({ section, className }: { section: SectionCalendrier; className?: string }) {
  return (
    <button type="button" data-lien-calendrier={section} onClick={() => ouvrirCalendrierSection(section)}
      className={`flex min-h-11 w-full items-center gap-2 rounded-panel border border-cave-800 px-3 text-left text-sm font-semibold text-cave-200 hover:bg-cave-850 ${className ?? ''}`}>
      <CalendarDays size={16} className="shrink-0 text-cave-400" aria-hidden="true" />
      <span className="min-w-0 flex-1 truncate">{LIBELLE[section]}</span>
      <ChevronRight size={16} className="shrink-0 text-cave-400" aria-hidden="true" />
    </button>
  );
}
