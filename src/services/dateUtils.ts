import { TimeFilterPeriod } from '../types';

export const DateUtils = {
  /**
   * Parse a date string in "DD.MM.YYYY" or ISO format into a Date object.
   */
  parseDate(dateStr?: string): Date | null {
    if (!dateStr) return null;
    
    // Check for DD.MM.YYYY
    const parts = dateStr.split('.');
    if (parts.length === 3) {
      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1; // 0-indexed
      const year = parseInt(parts[2], 10);
      if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
        return new Date(year, month, day);
      }
    }

    // Try native Date parsing
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? null : d;
  },

  /**
   * Check if a given date falls within a chosen TimeFilterPeriod.
   * Uses reference year 2026 if current year is not yet 2026 or aligns with dataset.
   */
  isDateInPeriod(dateStr?: string, period: TimeFilterPeriod = 'all'): boolean {
    if (period === 'all') return true;
    const d = this.parseDate(dateStr);
    if (!d) return true; // Keep entries with unparseable dates in view

    const now = new Date();
    // Default to the year of the record if it's 2026, or current year
    const targetYear = d.getFullYear();
    const curYear = now.getFullYear();
    const effectiveYear = targetYear === 2026 ? 2026 : curYear;
    
    const y = d.getFullYear();
    const m = d.getMonth(); // 0 to 11

    // If filter is for specific year
    if (period === 'year') {
      return y === effectiveYear;
    }

    // Direct Activity Month Filters (Sûr & Pratique)
    if (period === 'm-04') return y === 2026 && m === 3;
    if (period === 'm-01') return y === 2026 && m === 0;

    // Quarters
    if (period === 'q1') return y === effectiveYear && m >= 0 && m <= 2;
    if (period === 'q2') return y === effectiveYear && m >= 3 && m <= 5;
    if (period === 'q3') return y === effectiveYear && m >= 6 && m <= 8;
    if (period === 'q4') return y === effectiveYear && m >= 9 && m <= 11;

    // Monthly comparisons relative to real system clock
    if (period === 'this-month') {
      return y === now.getFullYear() && m === now.getMonth();
    }

    if (period === 'last-month') {
      const curM = now.getMonth();
      const lastM = curM === 0 ? 11 : curM - 1;
      const lastY = curM === 0 ? now.getFullYear() - 1 : now.getFullYear();
      return y === lastY && m === lastM;
    }

    return true;
  },

  /**
   * Human readable label for period
   */
  getPeriodLabel(period: TimeFilterPeriod): string {
    const map: Record<TimeFilterPeriod, string> = {
      'm-04': 'Avril 2026 (Matières & Brassage)',
      'm-01': 'Janvier 2026 (Travaux & Rénovation)',
      'this-month': 'Ce mois en cours',
      'last-month': 'Mois dernier',
      'q1': '1er Trimestre (T1 2026)',
      'q2': '2ème Trimestre (T2 2026)',
      'q3': '3ème Trimestre (T3 2026)',
      'q4': '4ème Trimestre (T4 2026)',
      'year': 'Exercice 2026 (Complet)',
      'all': 'Tout l’historique'
    };
    return map[period] || 'Période';
  }
};
