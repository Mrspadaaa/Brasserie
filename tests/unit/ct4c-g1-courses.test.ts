// CT4C-1 (critique de vision, tour 4) : Courses au repos disait « 0 à commander cette semaine · 8 manquent » : la phrase se contredisait.
// Rien dans l'horizon choisi : le manque d'abord, puis « rien » pour l'horizon. Les autres cas ne changent pas.
import { describe, expect, it } from 'vitest';
import { vueHorizon } from '../../src/domain/stock/horizon';
import { phraseRepliee } from '../../src/ui/stock/ChiffreACommander';
import type { ArticleACommander } from '../../src/domain/stockLevel';
import type { Batch, StockItem } from '../../src/types';

const article = (ref: string, sources: ArticleACommander['sources'] = []): ArticleACommander => ({
  item: { id: ref, ref, name: ref, category: 'Malt', unit: 'kg', currentStock: 0, minStock: 2, reorder: true } as StockItem,
  missing: 2, rupture: true, auMoins: false, sources
});
const AUJ = '2026-11-20';

describe('CT4C-1 : la ligne de Courses ne se contredit plus', () => {
  it('aucun brassin, 8 sous le seuil : « 8 manquent · rien cette semaine », jamais « 0 à commander »', () => {
    const vue = vueHorizon(Array.from({ length: 8 }, (_, i) => article(`A${i}`)), [], AUJ);
    const p = phraseRepliee(vue, 'brassin', 8);
    expect(p).toBe('8 manquent · rien cette semaine');
    expect(p).not.toMatch(/^0 /);
  });
  it('au seuil compris : « 6 manquent · 2 au seuil · rien cette semaine »', () => {
    const vue = vueHorizon(Array.from({ length: 8 }, (_, i) => article(`A${i}`)), [], AUJ);
    expect(phraseRepliee(vue, 'brassin', 6)).toBe('6 manquent · 2 au seuil · rien cette semaine');
  });
  it('des articles dans l\'horizon : la phrase d\'avant reste (« 1 à commander … · 3 manquent »)', () => {
    const brassin = { id: 'B1', name: 'Saison', status: 'planifie', plannedBrewDate: AUJ } as unknown as Batch;
    const dated = article('D', [{ genre: 'brassin', nom: 'Saison', date: AUJ } as ArticleACommander['sources'][number]]);
    const vue = vueHorizon([dated, article('E'), article('F')], [brassin], AUJ);
    expect(phraseRepliee(vue, 'brassin', 3)).toMatch(/^1 à commander (avant S\d+|cette semaine) · 3 manquent$/);
    expect(phraseRepliee(vue, 'tout', 3)).toBe('3 manquent');
  });
  it('rien du tout : « Rien à commander »', () => {
    expect(phraseRepliee(vueHorizon([], [], AUJ), 'brassin', 0)).toBe('Rien à commander');
  });
});
