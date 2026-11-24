/**
 * Voie prix-houblon2 (24.11) : « on doit comparer les bonnes données ». Constat sur le vrai rendu de Comparer (capture cap/comparer-1280.png) : la phrase « Compromis »
 * disait « la 1re, la moins chère : 4,28 EUR de moins que la 2e » en soustrayant 3,72 € (50 g) et 8 € (100 g) : deux sachets de tailles différentes, alors que le tableau
 * classe au kilo (69,19 contre 74,40 CHF/kg). Règle R40 : l'écart se dit au même étalon que le classement.
 */
import { describe, expect, it } from 'vitest';
import { compromisDe, tableau } from '../../src/domain/carnets/comparer';
import { fixtureCarnets, ID_VENTILATION } from '../../src/domain/carnets/fixture';
import { lireCarnet, type Article, type CarnetDoc } from '../../src/domain/carnets/modele';

function carnet(articles: Partial<Article>[]): CarnetDoc {
  const base = lireCarnet(fixtureCarnets().find(i => i.id === ID_VENTILATION)!)!;
  return {
    ...base, title: 'Houblons',
    carnet: { ...base.carnet, criteres: [], facons: [], notes: [], photos: [], choix: undefined, sortie: undefined, archive: undefined,
      articles: articles.map((a, i) => ({ id: `A${i + 1}`, domaine: 'exemple.test', url: `https://www.exemple.test/a${i + 1}`, lecture: 'lue', valeurs: {}, ...a }) as Article) }
  } as CarnetDoc;
}
const change = { taux: 0.93, date: '2026-11-24', source: 'BCE' as const };
const MOTLER: Partial<Article> = { nom: 'CITRA® (US)', prixCentimes: 372, devise: 'EUR', change, conditionnement: { valeur: 50, unite: 'g' } };
const BRAUPARTNER: Partial<Article> = { nom: 'Citra® Hopfenpellets', prixCentimes: 800, devise: 'EUR', change, conditionnement: { valeur: 100, unite: 'g' } };
const BRAU: Partial<Article> = { nom: 'Citra 13.6%', prixCentimes: 10440, devise: 'CHF', conditionnement: { valeur: 1, unite: 'kg' } };

describe('le compromis dit son écart au même étalon que le classement', () => {
  it('3,72 € les 50 g contre 8 € les 100 g : l\'écart est au kilo (5,21 CHF/kg), jamais 4,28 EUR', () => {
    const t = tableau(carnet([MOTLER, BRAUPARTNER]))!;
    expect(t.prixParUnite).toBe('masse');
    const c = compromisDe(t) ?? '';
    expect(c).toMatch(/5,21 CHF\/kg de moins/);
    expect(c).not.toMatch(/4,28/);
  });
  it('trois houblons de tailles différentes : toujours au kilo', () => {
    const c = compromisDe(tableau(carnet([MOTLER, BRAUPARTNER, BRAU]))!) ?? '';
    expect(c).toMatch(/CHF\/kg/);
    expect(c).not.toMatch(/EUR de moins/);
  });
  it('sans quantité, l\'écart reste en prix (deux pièces) : comportement d\'avant inchangé', () => {
    const t = tableau(carnet([{ nom: 'Cuve A', prixCentimes: 10000, devise: 'CHF' }, { nom: 'Cuve B', prixCentimes: 15000, devise: 'CHF' }]))!;
    expect(t.prixParUnite).toBeUndefined();
    expect(compromisDe(t) ?? '').toMatch(/50 CHF de moins/);
  });
});
