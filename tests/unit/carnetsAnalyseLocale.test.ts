import { describe, expect, it } from 'vitest';
import { analyserTexte, decouper, genreLocal, nombresEcrits, prixDe, PUCES_VA_DANS, quantitesDe, urlsDe, vaDansDe } from '../../src/domain/carnets/analyseLocale';
import { PHRASES_ESSAI } from '../../src/domain/carnets/fixture';

describe('R13 « Va dans » (g5:v02-10) : la puce préchoisie par l’aperçu local', () => {
  it('Ce qui compte · Note · Façon, dans l’ordre de la maquette ; critère, note, rien pour un lien, un prix ou une note en vrac', () => {
    expect(PUCES_VA_DANS.map(p => p.libelle)).toEqual(['Ce qui compte', 'Note', 'Façon']);
    expect(vaDansDe('un fût de 30 L couché doit entrer dans le bac')).toBe('critere');
    expect(vaDansDe('demander à Marc s’il revend le sien')).toBe('note');
    expect(vaDansDe('https://inox-riviera.ch/evier-2-bacs')).toBeNull();
    expect(vaDansDe('évier 2 bacs 480 CHF')).toBeNull();
    expect(vaDansDe('appeler Marc\nacheter une douchette')).toBeNull();
    expect(vaDansDe('   ')).toBeNull();
  });
});

describe('analyse locale (A4), 30 phrases', () => {
  it('il y a bien 30 phrases, dont les trois notes de son téléphone', () => {
    expect(PHRASES_ESSAI).toHaveLength(30);
    expect(PHRASES_ESSAI.filter(p => /Sol local|Ajoute|prochain brassage/.test(p.texte))).toHaveLength(3);
  });

  it.each(PHRASES_ESSAI.map(p => [p.texte.split('\n')[0], p] as const))('« %s » : URL et prix exacts, aucun nombre inventé', (_, p) => {
    expect(urlsDe(p.texte).map(u => u.url)).toEqual(p.urls ?? []);
    const prix = prixDe(p.texte);
    if (p.centimes === undefined) expect(prix).toBeNull();
    else { expect(prix?.centimes).toBe(p.centimes); expect(prix?.devise).toBe(p.devise ?? 'CHF'); }

    const lignes = analyserTexte(p.texte);
    const prixLus = lignes.map(l => l.prixCentimes).filter((c): c is number => c !== undefined);
    if (p.centimes === undefined) {
      for (const l of lignes) expect(l).not.toHaveProperty('prixCentimes');
    } else expect(prixLus).toEqual([p.centimes]);
    expect(lignes.map(l => l.url).filter(Boolean)).toEqual(p.urls ?? []);

    const ecrits = nombresEcrits(p.texte);
    for (const l of lignes) {
      if (l.prixCentimes !== undefined) expect(ecrits).toContain(l.prixCentimes / 100);
      for (const q of l.quantites) expect(ecrits).toContain(q.valeur);
    }
  });

  it('« 1\'450.– » donne 145000 centimes ; formats suisses', () => {
    expect(prixDe('1\'450.–')?.centimes).toBe(145000);
    expect(prixDe('1 450 CHF')?.centimes).toBe(145000);
    expect(prixDe('CHF 690.-')?.centimes).toBe(69000);
    expect(prixDe('Fr. 45.50')?.centimes).toBe(4550);
    expect(prixDe('120 €')).toMatchObject({ centimes: 12000, devise: 'EUR' });
    expect(prixDe('1’450.– net')?.centimes).toBe(145000);
    expect(prixDe('2 bacs de 40 cm')).toBeNull();
  });

  it('URL : point final, parenthèse, www., domaine .ch sans schéma ; un courriel n’est pas un lien', () => {
    expect(urlsDe('voir https://a.ch/x.').map(u => u.url)).toEqual(['https://a.ch/x']);
    expect(urlsDe('(https://a.ch/x)').map(u => u.url)).toEqual(['https://a.ch/x']);
    expect(urlsDe('https://fr.wikipedia.org/wiki/Bière_(boisson)').map(u => u.url)).toEqual(['https://fr.wikipedia.org/wiki/Bière_(boisson)']);
    expect(urlsDe('chez inox-pro.ch').map(u => u.domaine)).toEqual(['inox-pro.ch']);
    expect(urlsDe('écrire à vente@inox-pro.ch')).toEqual([]);
    expect(urlsDe('www.exemple.invalid')[0].domaine).toBe('exemple.invalid');
  });

  it('quantités : liste fermée d’unités ; rien dans un lien ni dans un prix', () => {
    expect(quantitesDe('hotte 1 800 m³/h, 58 dB, 2,5 kW, 80°C').map(q => [q.valeur, q.unite])).toEqual([[1800, 'm³/h'], [58, 'dB'], [2.5, 'kW'], [80, '°C']]);
    expect(quantitesDe('https://exemple.invalid/hotte-120-cm 690 CHF')).toEqual([]);
    expect(quantitesDe('2 bacs, 3 fûts, 4 becs').map(q => q.unite)).toEqual(['bacs', 'fûts', 'becs']);
    expect(quantitesDe('2 couches de 3 m')).toEqual([]);
  });

  it('découpe et genre : achats, question, à faire, conseil, note', () => {
    expect(decouper('- un\n• deux ; trois\n\n')).toEqual(['un', 'deux', 'trois']);
    expect(genreLocal('Plus gros seau ?')).toBe('question');
    expect(genreLocal('acheter des joints')).toBe('a-acheter');
    expect(genreLocal('Nettoyer la cuve')).toBe('a-faire');
    expect(genreLocal('penser à purger')).toBe('conseil');
    expect(genreLocal('Houblon')).toBe('note');
    const l = analyserTexte('fond de bac 38 cm minimum')[0];
    expect(l).toMatchObject({ sorte: 'critere', quantites: [{ valeur: 38, unite: 'cm', texte: '38' }], origine: 'locale' });
    expect(analyserTexte('douchette à 45.50 CHF')[0].sorte).toBe('article');
  });
});
