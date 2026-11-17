import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { choseCreative, choseSansDate, evenementsAgenda, iconesIdees, numeroSemaine, semainesDe } from '../../src/domain/calendrier';
import { fixtureCarnets, ID_EVIER } from '../../src/domain/carnets/fixture';
import { carnetDepuisPhrase, lireCarnet } from '../../src/domain/carnets/modele';
import { mergeUpgradePlans } from '../../src/domain/finance/upgrades';
import { compteurs, genreDe, tiroirDe } from '../../src/ui/atelier/atelierModel';
import type { CreativeItem } from '../../src/types';

const MERCREDI_S47 = '2026-11-18';
const docs = (): CreativeItem[] => {
  const F = fixtureCarnets();
  const date = carnetDepuisPhrase('ZZ TEST — doseur de sucre', { id: 'C-DATE', le: '2026-11-17T10:00:00.000Z', date: MERCREDI_S47 })!;
  return [...F, date, { ...F.find(i => i.id === ID_EVIER)!, id: 'C-DATE-2', date: '2026-11-20' }];
};

describe('lecteurs existants (A6) : un carnet et un carnet-message n’entrent nulle part ailleurs', () => {
  const D = docs();
  it('ModeleCalendrier : ni rangée (posé), ni poche « Sans date », ni agenda', () => {
    for (const d of D) {
      expect(choseCreative(d)).toBeNull();
      expect(choseSansDate(d)).toBeNull();
    }
    expect(evenementsAgenda(D, semainesDe('2026-11-16', 6))).toEqual([]);
  });
  it('tiroirs de l’Atelier : aucun genre, et l’onglet n’affiche que le type de sa rubrique', () => {
    for (const d of D) expect(genreDe(d)).toBeNull();
    expect(tiroirDe('carnet')).toBe('materiel');
    const c = compteurs(D);
    expect(c.tout).toBe(0);
    /* CreativeLabTab : `items.filter(i => i.type === activeSection)`, et activeSection n'est jamais un type du carnet */
    const source = readFileSync(join(process.cwd(), 'src/components/CreativeLabTab.tsx'), 'utf8');
    expect(source).toContain('const currentItems = items.filter(i => i.type === activeSection);');
    expect(source).toMatch(/onglet === 'materiel' \? 'equipment'/);
  });
  it('mergeUpgradePlans : aucun plan né d’un carnet', () => {
    expect(mergeUpgradePlans([], D)).toEqual([]);
  });
  it('compte des tâches (App.tsx) : seulement les `event` non faits', () => {
    const source = readFileSync(join(process.cwd(), 'src/App.tsx'), 'utf8');
    expect(source).toMatch(/\(i\) => i\.type === 'event' && i\.status !== 'done'/);
    expect(D.filter(i => i.type === 'event' && i.status !== 'done')).toHaveLength(0);
  });
});

describe('idée du calendrier (A15, R48)', () => {
  it('carnetDepuisPhrase : type carnet, Idée, phrase en titre, lundi de S47, listes vides ; lireCarnet le relit', () => {
    const c = carnetDepuisPhrase('ZZ TEST — doseur de sucre', { id: 'C-1', le: '2026-11-17T10:00:00.000Z', date: MERCREDI_S47 })!;
    expect(c).toEqual({
      id: 'C-1', type: 'carnet', status: 'idea', title: 'ZZ TEST — doseur de sucre', date: '2026-11-16',
      carnet: { version: 1, creeLe: '2026-11-17T10:00:00.000Z', phrase: 'ZZ TEST — doseur de sucre', criteres: [], facons: [], articles: [], notes: [], photos: [] }
    });
    expect(numeroSemaine(c.date!)).toBe(47);
    expect(lireCarnet(c)).toEqual(c);
  });
  it('sans date : aucun champ date ; phrase vide : refusée ; id et date de création par défaut', () => {
    const c = carnetDepuisPhrase('  doseur  ')!;
    expect(c).not.toHaveProperty('date');
    expect(c.title).toBe('doseur');
    expect(c.id).toMatch(/^CARNET-/);
    expect(c.carnet.creeLe).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(carnetDepuisPhrase('')).toBeNull();
    expect(carnetDepuisPhrase('   ')).toBeNull();
  });
  it('iconesIdees : le carnet daté ouvre Carnets ; choseCreative et choseSansDate : null, daté ou non', () => {
    const c = carnetDepuisPhrase('ZZ TEST — doseur de sucre', { id: 'C-1', date: MERCREDI_S47 })!;
    expect(iconesIdees([c])).toEqual([{ id: 'idee-C-1', lundi: '2026-11-16', numero: 47, genre: 'idee', titre: 'ZZ TEST — doseur de sucre', ouvre: { ecran: 'carnets', id: 'C-1' } }]);
    const sansDate = carnetDepuisPhrase('ZZ TEST — doseur de sucre', { id: 'C-2' })!;
    for (const x of [c, sansDate]) { expect(choseCreative(x)).toBeNull(); expect(choseSansDate(x)).toBeNull(); }
  });
});
