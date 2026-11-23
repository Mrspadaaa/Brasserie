import { TimeFilterPeriod } from '../types';

/** Calendar dates, independent of UTC parsing and the selected record's year. */
export const DateUtils = {
  parseDate(value?: string): Date | null {
    if (!value) return null;
    const swiss = /^(\d{1,2})\.(\d{1,2})\.(\d{4})$/.exec(value.trim());
    const iso = /^(\d{4})-(\d{2})-(\d{2})(?:T.*)?$/.exec(value.trim());
    if (!swiss && !iso) return null;
    const [year, month, day] = swiss
      ? [Number(swiss[3]), Number(swiss[2]), Number(swiss[1])]
      : [Number(iso![1]), Number(iso![2]), Number(iso![3])];
    const date = new Date(year, month - 1, day, 12);
    return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day ? date : null;
  },
  isDateInPeriod(value?: string, period: TimeFilterPeriod = 'all', reference = new Date()): boolean {
    if (period === 'all') return true;
    const date = this.parseDate(value);
    if (!date) return false;
    const year = date.getFullYear(), month = date.getMonth();
    if (period.startsWith('year-')) return year === Number(period.slice(5));
    if (period.startsWith('month-')) return `${year}-${String(month + 1).padStart(2, '0')}` === period.slice(6);
    if (period === 'year') return year === reference.getFullYear();
    if (period === 'm-04' || period === 'm-01') return year === reference.getFullYear() && month === (period === 'm-04' ? 3 : 0);
    if (/^q[1-4]$/.test(period)) return year === reference.getFullYear() && Math.floor(month / 3) === Number(period[1]) - 1;
    const anchor = period === 'last-month' ? new Date(reference.getFullYear(), reference.getMonth() - 1, 1) : reference;
    return year === anchor.getFullYear() && month === anchor.getMonth();
  },
  getPeriodLabel(period: TimeFilterPeriod): string {
    if (period.startsWith('year-')) return `Exercice ${period.slice(5)}`;
    if (period.startsWith('month-')) {
      const date = this.parseDate(`${period.slice(6)}-01`);
      return date ? date.toLocaleDateString('fr-CH', { month: 'long', year: 'numeric' }) : 'Période à choisir';
    }
    const year = new Date().getFullYear();
    const labels: Record<string, string> = { all: 'Tout l’historique', 'this-month': 'Ce mois', 'last-month': 'Mois dernier', year: `Exercice ${year}`, 'm-04': `Avril ${year}`, 'm-01': `Janvier ${year}`, q1: `1er trimestre ${year}`, q2: `2e trimestre ${year}`, q3: `3e trimestre ${year}`, q4: `4e trimestre ${year}` };
    return labels[period] ?? 'Période à choisir';
  }
};
