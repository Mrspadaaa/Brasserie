import { describe, expect, it } from 'vitest';
import { analyserTexte, nombresEcrits } from '../../src/domain/carnets/analyseLocale';
import { consequenceApercu, critereQuiTranche, difference, rangePar, statutApres, tableau, texteTranche } from '../../src/domain/carnets/comparer';
import { fixtureCarnets, ID_EMBOUTEILLAGE, ID_EVIER, ID_VENTILATION, PHRASES_ESSAI } from '../../src/domain/carnets/fixture';
import { lireCarnet, type Article, type CarnetDoc, type DonneesCarnet } from '../../src/domain/carnets/modele';

const F = fixtureCarnets();
const carnet = (id: string): CarnetDoc => lireCarnet(F.find(i => i.id === id))!;
const art = (id: string, valeurs: Article['valeurs'], o: Partial<Article> = {}): Article => ({ id, nom: id, valeurs, lecture: 'lue', ...o });
const ex = (valeur: number | boolean, unite?: string) => (unite ? { valeur, unite, origine: 'exemple' as const } : { valeur, origine: 'exemple' as const });
const avec = (c: CarnetDoc, d: Partial<DonneesCarnet>): CarnetDoc => ({ ...c, carnet: { ...c.carnet, ...d } });

describe('Comparer (A9), 12 cas', () => {
  const V = carnet(ID_VENTILATION);

  it('1. 0 article : pas de tableau', () => { expect(tableau(avec(V, { articles: [] }))).toBeNull(); });
  it('2. 1 article : pas de tableau', () => { expect(tableau(avec(V, { articles: V.carnet.articles.slice(0, 1) }))).toBeNull(); });
  it('3. 2 articles : un tableau de 2 lignes, rang 1 et 2', () => {
    const t = tableau(avec(V, { articles: V.carnet.articles.slice(0, 2) }))!;
    expect(t.lignes.map(l => l.rang)).toEqual([1, 2]);
  });
  it('4. fixture Ventilation : tient 80 °C d’abord, puis le débit ; ordre attendu', () => {
    const t = tableau(V)!;
    /* oui d'abord (A1 1800, A2 1200), puis non (A3 1500), puis inconnu (A4 1100), puis le lien sans valeur (A5) */
    expect(t.lignes.map(l => l.articleId)).toEqual(['ZZ-V-A1', 'ZZ-V-A2', 'ZZ-V-A3', 'ZZ-V-A4', 'ZZ-V-A5']);
    expect(rangePar(V)).toBe('tient 80 °C d\'abord, puis le débit');
    expect(t.rangePar).toBe('tient 80 °C d\'abord, puis le débit');
    expect(t.colonnes.map(k => k.nom)).toEqual(['tient 80 °C', 'débit']);
  });
  it('5. un débit inconnu se range après les débits connus ; sa cellule est vide, jamais 0', () => {
    const c = avec(V, { criteres: [V.carnet.criteres[2]], articles: [art('X', {}), art('Y', { 'débit': ex(900, 'm³/h') }), art('Z', { 'débit': ex(1200, 'm³/h') })] });
    const t = tableau(c)!;
    expect(t.lignes.map(l => l.articleId)).toEqual(['Z', 'Y', 'X']);
    expect(t.lignes[2].cellules).toEqual({});
    expect(JSON.stringify(t.lignes[2])).not.toMatch(/"valeur":0/);
  });
  it('6. un article dominé sur 2 caractéristiques comparables porte « moins bien partout »', () => {
    /* A4 (débit 1100, 690 CHF, tient inconnu) face à A3 (1500, 420 CHF) : pire sur débit et prix */
    const t = tableau(V)!;
    expect(t.lignes.find(l => l.articleId === 'ZZ-V-A4')!.moinsBienPartout).toBe(true);
    expect(t.lignes.find(l => l.articleId === 'ZZ-V-A2')!.moinsBienPartout).toBe(false);
  });
  it('7. avec une seule caractéristique comparable : rien', () => {
    const c = avec(V, { criteres: [V.carnet.criteres[2]], articles: [art('P', { 'débit': ex(900, 'm³/h') }), art('Q', { 'débit': ex(1200, 'm³/h') })] });
    expect(tableau(c)!.lignes.every(l => !l.moinsBienPartout)).toBe(true);
  });
  it('8. une façon écartée et un article écarté restent dans le tableau, à la fin, avec leur raison (D-52)', () => {
    const B = carnet(ID_EMBOUTEILLAGE);
    const t = tableau(B)!;
    const fin = t.lignes.slice(-3);
    expect(fin.map(l => l.articleId)).toEqual(['ZZ-B-A2', 'ZZ-B-A4', 'ZZ-B-A6']);
    expect(fin.every(l => l.rang === null && !!l.ecarte?.raison)).toBe(true);
    expect(fin[0].ecarte!.raison).toBe('cadence trop basse pour 300 L');
    const avecFaconEcartee = avec(B, { choix: undefined, articles: [...B.carnet.articles.slice(0, 2), { ...B.carnet.articles[2], faconId: 'ZZ-B-F1' }] });
    const t2 = tableau(avecFaconEcartee)!;
    expect(t2.lignes.at(-1)).toMatchObject({ articleId: 'ZZ-B-A3', rang: null, ecarte: { raison: 'Gravité écartée : trop d’oxygène capté' } });
  });
  it('9. statutApres : idea devient research au 1er article ; validated reste validated', () => {
    const E = carnet(ID_EVIER);
    expect(statutApres('idea', E)).toBe('idea');
    expect(statutApres('idea', avec(E, { articles: [art('A', {})] }))).toBe('research');
    expect(statutApres('validated', avec(E, { articles: [] }))).toBe('validated');
  });
  it('10. difference : un 2e article rend « <nom> rangé, 2e »', () => {
    const avant = avec(V, { articles: V.carnet.articles.slice(0, 1) });
    const apres = avec(V, { articles: V.carnet.articles.slice(0, 2) });
    expect(difference(avant, apres)).toEqual(['Hotte murale 100 cm rangé, 2e']);
  });
  it('11. difference : « fond de bac 38 cm » passé à 60 cm rend « <article> ne passerait plus » (G26)', () => {
    const E = carnet(ID_EVIER);
    const k = { ...E.carnet.criteres[1], texte: 'fond de bac 38 cm' };
    const articles = [art('Évier à poser', { 'fond de bac': ex(40, 'cm') }), art('Évier 1 grand bac', { 'fond de bac': ex(60, 'cm') })];
    const avant = avec(E, { criteres: [E.carnet.criteres[0], k], articles });
    const apres = avec(E, { criteres: [E.carnet.criteres[0], { ...k, texte: 'fond de bac 60 cm' }], articles });
    expect(difference(avant, apres)).toEqual(['Évier à poser ne passerait plus']);
  });
  it('12. aucune différence ne cite un nombre absent des données', () => {
    const E = carnet(ID_EVIER);
    const articles = [art('Évier à poser', { 'fond de bac': ex(40, 'cm') }), art('Évier sur pieds', { 'fond de bac': ex(45, 'cm') }), art('Évier 1 grand bac', { 'fond de bac': ex(60, 'cm') })];
    const cas: [CarnetDoc, CarnetDoc][] = [
      [avec(V, { articles: V.carnet.articles.slice(0, 1) }), avec(V, { articles: V.carnet.articles.slice(0, 3) })],
      [avec(E, { criteres: [{ ...E.carnet.criteres[1], texte: 'fond de bac 38 cm' }], articles }), avec(E, { criteres: [{ ...E.carnet.criteres[1], texte: 'fond de bac 50 cm' }], articles })]
    ];
    for (const [a, b] of cas) {
      const textes = difference(a, b);
      expect(textes.length).toBeGreaterThan(0);
      const donnees = JSON.stringify([a, b]);
      for (const t of textes) for (const n of t.replace(/\d+(?=e\b|er\b)/g, '').match(/\d+/g) ?? []) expect(donnees).toContain(n);
    }
  });
});

describe('G8 et G9, calcul local (A13, R44, R45)', () => {
  it('critereQuiTranche sur Ventilation : le critère sans caractéristique et les deux façons ouvertes', () => {
    const t = critereQuiTranche(carnet(ID_VENTILATION))!;
    expect(t.critere.texte).toBe('plus de condensation au plafond');
    expect(t.entre).toEqual(['Hotte inox + extracteur', 'Extracteur mural seul']);
    expect(texteTranche(t)).toBe('Le critère « plus de condensation au plafond » peut trancher entre Hotte inox + extracteur et Extracteur mural seul');
  });
  it('un seul candidat : null ; une façon écartée n’est jamais proposée', () => {
    const V = carnet(ID_VENTILATION);
    expect(critereQuiTranche(avec(V, { facons: V.carnet.facons.slice(0, 1), articles: V.carnet.articles.slice(0, 1) }))).toBeNull();
    const ecartee = avec(V, { facons: [V.carnet.facons[0], { ...V.carnet.facons[1], etat: 'ecartee' }], articles: [] });
    expect(critereQuiTranche(ecartee)).toBeNull();
    const trois = avec(V, { facons: [{ ...V.carnet.facons[0], etat: 'ecartee' }, ...V.carnet.facons.slice(1), { id: 'F3', nom: 'Ouvrir la fenêtre', etat: 'ouverte', origine: 'vous' }] });
    expect(critereQuiTranche(trois)!.entre).toEqual(['Extracteur mural seul', 'Ouvrir la fenêtre']);
  });
  it('sans façons : les deux premiers articles, sur un critère inconnu pour les deux', () => {
    const B = carnet(ID_EMBOUTEILLAGE);
    const c = avec(B, { facons: [], choix: undefined, criteres: [B.carnet.criteres[0], { id: 'K2', texte: 'nettoyage facile', caracteristique: { nom: 'nettoyage', sens: 'oui-non' }, origine: 'vous' }] });
    const t = critereQuiTranche(c)!;
    expect(t.critere.id).toBe('K2');
    expect(t.entre).toEqual(['Isobarique 4 becs pré-évacuation', 'Isobarique 4 becs pré-évacuation']);
  });
  it('consequenceApercu sur Évier : « fond de bac 38 cm minimum »', () => {
    expect(consequenceApercu(carnet(ID_EVIER), analyserTexte('fond de bac 38 cm minimum'))).toBe('les articles seront rangés sur le fond de bac, 38 cm au moins');
  });
  it('sens « moins » : « au plus » ; sans nombre : sans nombre ; sans voisine : null', () => {
    const E = carnet(ID_EVIER);
    const moins = avec(E, { criteres: [{ ...E.carnet.criteres[1], caracteristique: { nom: 'fond de bac', unite: 'cm', sens: 'moins' } }] });
    expect(consequenceApercu(moins, analyserTexte('fond de bac 38 cm maximum'))).toBe('les articles seront rangés sur le fond de bac, 38 cm au plus');
    expect(consequenceApercu(E, analyserTexte('il faut un fond de bac profond'))).toBe('les articles seront rangés sur le fond de bac');
    expect(consequenceApercu(E, analyserTexte('appeler le plombier'))).toBeNull();
    expect(consequenceApercu(carnet(ID_VENTILATION), analyserTexte('fond de bac 38 cm minimum'))).toBeNull();
  });
  it('aucun nombre absent de la phrase tapée, sur les 30 phrases de A4 et les 4 carnets', () => {
    const carnets = [ID_VENTILATION, ID_EVIER, ID_EMBOUTEILLAGE, 'ZZ-CARNET-FRIGO'].map(carnet);
    let rendus = 0;
    for (const p of PHRASES_ESSAI) for (const c of carnets) {
      const t = consequenceApercu(c, analyserTexte(p.texte));
      if (!t) continue;
      rendus += 1;
      const ecrits = nombresEcrits(p.texte);
      for (const n of t.replace(/°C|m³\/h|m³/g, '').match(/\d+(?:[.,]\d+)?/g) ?? []) expect(ecrits).toContain(Number(n.replace(',', '.')));
    }
    expect(rendus).toBeGreaterThan(3);
  });
});
