/**
 * Test en ligne du tour 30 (voie fix30), Carnet : règles de calcul et d'état seulement ; aucun réseau, aucun écran.
 */
import { describe, expect, it } from 'vitest';
import { carteEnBarre, lectureIci } from '../../src/ui/carnets/lectureRegles';

describe('T30-1, T30-3 : la carte entière reste dans la vue du lien, sinon la barre repliée', () => {
  it('collé dans ZZ : la carte est dans ZZ, la barre ailleurs (autre carnet ou liste)', () => {
    expect(lectureIci({ carnetDuLien: 'ZZ', idOuvert: 'ZZ' })).toBe(true);
    expect(lectureIci({ carnetDuLien: 'ZZ', idOuvert: 'AUTRE' })).toBe(false);
    expect(lectureIci({ carnetDuLien: 'ZZ', idOuvert: null })).toBe(false);
  });
  it('collé depuis la liste : la carte est dans la liste, puis dans le carnet où l’article est rangé ; la barre dans un autre', () => {
    expect(lectureIci({ carnetDuLien: null, idOuvert: null })).toBe(true);
    expect(lectureIci({ carnetDuLien: null, carnetDuMessage: 'NEUF', idOuvert: 'NEUF' })).toBe(true);
    expect(lectureIci({ carnetDuLien: null, carnetDuMessage: 'NEUF', idOuvert: 'AUTRE' })).toBe(false);
  });
  it('le carnet du message prime sur le carnet gardé ; inconnu : la carte reste', () => {
    expect(lectureIci({ carnetDuLien: 'ZZ', carnetDuMessage: 'AUTRE', idOuvert: 'AUTRE' })).toBe(true);
    expect(lectureIci({ carnetDuLien: undefined, idOuvert: 'X' })).toBe(true);
  });
  it('en barre si repliée ou hors de sa vue', () => {
    expect(carteEnBarre(false, true)).toBe(false);
    expect(carteEnBarre(true, true)).toBe(true);
    expect(carteEnBarre(false, false)).toBe(true);
  });
});

/* ---------- T30-4, T30-6 : le prix classe en francs, les longueurs dans une même unité ---------- */
import { tableau, valeurDe } from '../../src/domain/carnets/comparer';
import { prixEnChf } from '../../src/domain/carnets/prixUnitaire';
import type { Article } from '../../src/domain/carnets/modele';

const art = (id: string, o: Partial<Article>): Article => ({ id, valeurs: {}, lecture: 'lue', nom: id, ...o });
const donnees = (articles: Article[]) => ({ criteres: [], facons: [], articles, choix: undefined }) as never;

describe('T30-4 : un article en euros se classe au prix en francs, le critère est dit', () => {
  const kiber = art('Kibernetik', { prixCentimes: 30200, devise: 'CHF' });
  const monk = art('Brew Monk', { prixCentimes: 14700 / 0.93, devise: 'EUR', change: { taux: 0.93, date: '2026-11-22', source: 'BCE' } });
  it('le prix en CHF d’un article en euros vient du cours lu ; sans cours : inconnu, jamais 0', () => {
    expect(prixEnChf(kiber)).toBe(30200);
    expect(prixEnChf(monk)).toBeCloseTo(14700, 0);
    expect(prixEnChf(art('x', { prixCentimes: 5000, devise: 'EUR' }))).toBeNull();
    expect(prixEnChf(art('y', {}))).toBeNull();
  });
  it('Brew Monk (≈147 CHF) passe devant Kibernetik (302 CHF) même s’il est ajouté après', () => {
    const t = tableau(donnees([kiber, monk]))!;
    expect(t.lignes.map(l => l.articleId)).toEqual(['Brew Monk', 'Kibernetik']);
    expect(t.rangePar).toBe('le prix en CHF');
  });
  it('sans cours, l’offre en euros n’est pas classée au prix (pas de rang deviné)', () => {
    const t = tableau(donnees([kiber, art('Sans cours', { prixCentimes: 5000, devise: 'EUR' })]));
    expect(t?.rangePar ?? null).toBeNull();
  });
});

describe('T30-6 : une colonne de longueurs dit une seule unité', () => {
  const col = { nom: 'Hauteur', unite: 'cm' };
  it('mm et m passent en cm ; le nombre est arrondi à 2 décimales', () => {
    expect(valeurDe(art('a', { valeurs: { Hauteur: { valeur: 1800, unite: 'mm', origine: 'page' } } }), col)).toMatchObject({ valeur: 180, unite: 'cm' });
    expect(valeurDe(art('b', { valeurs: { Hauteur: { valeur: 1.435, unite: 'm', origine: 'page' } } }), col)).toMatchObject({ valeur: 143.5, unite: 'cm' });
  });
  it('« 2010 » sans unité, plus de 10 m en cm : lu en mm et dit « 201 cm » ; « 180 » sans unité reste tel quel', () => {
    expect(valeurDe(art('c', { valeurs: { Hauteur: { valeur: 2010, origine: 'page' } } }), col)).toMatchObject({ valeur: 201, unite: 'cm' });
    expect(valeurDe(art('d', { valeurs: { Hauteur: { valeur: 180, origine: 'page' } } }), col)?.unite).toBeUndefined();
  });
  it('ce qui n’est pas une longueur n’est jamais converti (un poids en kg dans une colonne en g : absent)', () => {
    expect(valeurDe(art('e', { valeurs: { Poids: { valeur: 82, unite: 'kg', origine: 'page' } } }), { nom: 'Poids', unite: 'g' })).toBeUndefined();
  });
});

/* ---------- T28-6 (restes) : le rang du prix, la quantité à côté du prix ---------- */
import { placesDe } from '../../src/domain/carnets/comparer';

describe('T28-6 : « 1er pour le prix » se calcule au kilo, la quantité se dit à côté du prix', () => {
  const t = () => tableau(donnees([art('Citra 1 kg', { prixCentimes: 7250 }), art('Hopfen 100 g', { prixCentimes: 900 })]))!;
  it('Citra 1 kg à 72,50 CHF devant Hopfen 100 g à 9,00 CHF (90,00 CHF/kg)', () => {
    const tab = t();
    expect(tab.lignes.map(l => l.articleId)).toEqual(['Citra 1 kg', 'Hopfen 100 g']);
    expect(tab.prixParUnite).toBe('masse');
    const place = placesDe(tab, 'Citra 1 kg').find(p => p.nom === 'prix')!;
    expect(place.rang).toBe(1);
    expect(place.rangColonne).toBe('1er pour le prix au kilo');
    expect(place.unite).toBe('CHF/kg');
    expect(placesDe(tab, 'Hopfen 100 g').find(p => p.nom === 'prix')!.rang).toBe(2);
  });
  it('chaque ligne dit sa quantité et son prix au kilo', () => {
    const [a, b] = t().lignes;
    expect(a).toMatchObject({ quantite: '1 kg', parUnite: '72,50 CHF/kg' });
    expect(b).toMatchObject({ quantite: '100 g', parUnite: '90,00 CHF/kg' });
  });
  it('sans quantité dite : le prix tel quel, aucune quantité inventée', () => {
    const tab = tableau(donnees([art('A', { prixCentimes: 500 }), art('B', { prixCentimes: 300 })]))!;
    expect(tab.prixParUnite).toBeUndefined();
    expect(tab.lignes[0]).toMatchObject({ articleId: 'B' });
    expect(tab.lignes[0].quantite).toBeUndefined();
  });
});

/* ---------- T30-2, T30-5 : Compléter un lien mort, « C'est le bon » gardé ---------- */
import { appliquerEcritures, completerLienMort } from '../../src/domain/carnets/operations';
import { ID_VENTILATION, fixtureCarnets } from '../../src/domain/carnets/fixture';
import { lireCarnet, type CarnetDoc } from '../../src/domain/carnets/modele';
import { avecBon, CLE_BONS, garderBons, lireBons } from '../../src/ui/carnets/lectureRegles';

describe('T30-2 : « Compléter » un lien mort écrit l’article que le brasseur dit', () => {
  const carnet = (articles: Article[] = []): CarnetDoc => {
    const b = lireCarnet(fixtureCarnets().find(i => i.id === ID_VENTILATION))!;
    return { ...b, carnet: { ...b.carnet, articles: [...articles, ...b.carnet.articles] } };
  };
  const URL_MORT = 'https://brewtools.example/p/7712213';
  const apres = (c: CarnetDoc, args: Parameters<typeof completerLienMort>[1]) => {
    const r = completerLienMort([c], args);
    if (!r.ok) return { r, c: null };
    return { r, c: appliquerEcritures([c], r.ecritures).find(d => d.id === c.id) as CarnetDoc };
  };
  it('l’article du message prend le nom et le prix en francs, reste « introuvable », provenance « vous »', () => {
    const c = carnet([{ id: 'AM', url: URL_MORT, domaine: 'brewtools.example', lecture: 'a-lire', valeurs: {}, messageId: 'M1' }]);
    const { c: n } = apres(c, { messageId: 'M1', url: URL_MORT, nom: 'Brew Monk B40', prixCentimes: 14700 });
    expect(n!.carnet.articles.find(a => a.id === 'AM')).toMatchObject({ nom: 'Brew Monk B40', prixCentimes: 14700, devise: 'CHF', lecture: 'introuvable', origine: 'vous' });
  });
  it('lien déjà dans le carnet (collé une première fois : le message n’a plus d’article) : c’est cet article-là qu’on complète, sans doublon', () => {
    const c = carnet([{ id: 'AVIEUX', url: URL_MORT, domaine: 'brewtools.example', lecture: 'a-lire', valeurs: {}, messageId: 'M-AVANT' }]);
    const avant = c.carnet.articles.length;
    const { c: n } = apres(c, { messageId: 'M-NEUF', url: URL_MORT, nom: 'Brew Monk B40' });
    expect(n!.carnet.articles).toHaveLength(avant);
    expect(n!.carnet.articles.find(a => a.id === 'AVIEUX')).toMatchObject({ nom: 'Brew Monk B40', lecture: 'introuvable' });
  });
  it('aucun article nulle part : il est créé dans le carnet du lien, jamais un toast « Article introuvable. »', () => {
    const c = carnet();
    const { r, c: n } = apres(c, { messageId: 'M2', url: URL_MORT, carnetId: c.id, nom: 'Brew Monk B40', prixCentimes: 14700 });
    expect(r.ok).toBe(true);
    expect(n!.carnet.articles.find(a => a.messageId === 'M2')).toMatchObject({ nom: 'Brew Monk B40', url: URL_MORT, domaine: 'brewtools.example', lecture: 'introuvable' });
  });
  it('sans nom ou avec un prix illisible : refusé, rien d’écrit', () => {
    const c = carnet();
    expect(completerLienMort([c], { messageId: 'M3', url: URL_MORT, carnetId: c.id, nom: '   ' }).ok).toBe(false);
    expect(completerLienMort([c], { messageId: 'M3', url: URL_MORT, carnetId: c.id, nom: 'X', prixCentimes: -5 }).ok).toBe(false);
  });
});

describe('T30-5 : la réponse « C’est le bon » est gardée', () => {
  it('une réponse par message, sans doublon ; relue après rechargement', () => {
    let b = avecBon({}, 'M1', 'prix');
    b = avecBon(b, 'M1', 'prix');
    b = avecBon(b, 'M1', 'photo');
    expect(b).toEqual({ M1: ['prix', 'photo'] });
    const mem: Record<string, string> = {};
    const stock = { getItem: (k: string) => mem[k] ?? null, setItem: (k: string, v: string) => { mem[k] = v; } };
    garderBons(stock, b);
    expect(lireBons(stock)).toEqual({ M1: ['prix', 'photo'] });
  });
  it('un stockage illisible ou absent : aucune réponse, jamais d’erreur', () => {
    expect(lireBons({ getItem: () => '{pas du json' })).toEqual({});
    expect(lireBons({ getItem: () => '[1,2]' })).toEqual({});
    expect(lireBons(undefined)).toEqual({});
    expect(CLE_BONS).toContain('carnets');
  });
});

/* ---------- T30-8, T30-12 : carte dense, prix à deux décimales ---------- */
import { prixTexte } from '../../src/domain/carnets/comparer';
import { luEnBref, VALEURS_VUES_MAX, valeursLues } from '../../src/ui/carnets/CarteArticle';

describe('T30-12 : le prix dit toujours ses deux décimales dès qu’il en a', () => {
  it('72,50 CHF, 1 450 CHF, 0,05 CHF, 7,25 EUR', () => {
    expect(prixTexte(7250)).toBe('72,50 CHF');
    expect(prixTexte(145000)).toMatch(/^1\s?450 CHF$/);
    expect(prixTexte(5)).toBe('0,05 CHF');
    expect(prixTexte(725, 'EUR')).toBe('7,25 EUR');
    expect(prixTexte(undefined)).toBeNull();
  });
});

describe('T30-8 : la ligne d’article ne déroule pas ses caractéristiques', () => {
  const valeurs = Object.fromEntries(['Volume', 'Hauteur', 'Largeur', 'Profondeur', 'Poids', 'Puissance', 'Bruit', 'Classe'].map((n, i) => [n, { valeur: i + 1, unite: 'cm', origine: 'page' as const }]));
  it('au plus trois caractéristiques en ligne, le reste se compte', () => {
    const l = valeursLues(valeurs);
    expect(l).toHaveLength(8);
    expect(l.slice(0, VALEURS_VUES_MAX)).toHaveLength(3);
    expect(VALEURS_VUES_MAX).toBeLessThanOrEqual(3);
  });
  it('« lu sur la page » ne répète pas les noms : « nom, prix, photo, 8 caractéristiques »', () => {
    expect(luEnBref(['nom', 'prix', 'photo', ...Object.keys(valeurs)], valeurs)).toEqual(['nom', 'prix', 'photo', '8 caractéristiques']);
    expect(luEnBref(['nom', 'Volume'], { Volume: {} })).toEqual(['nom', '1 caractéristique']);
    expect(luEnBref(['nom', 'prix'], {})).toEqual(['nom', 'prix']);
  });
});

/* ---------- T30-9, T30-10, T30-11, T30-13, T30-14 : les étapes et les libellés en mots du brasseur ---------- */
import { lignesEtapes } from '../../src/domain/carnets/lecture';
import { libelleFrancais } from '../../functions/src/lienLibelles';
import { valeurFrancaise } from '../../functions/src/lienValeurs';
import { lireLien } from '../../functions/src/lireLien';
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

describe('T30-10 : l’étape en cours se voit jusqu’au rangement', () => {
  const six = ['page', 'donnees', 'prix', 'photos', 'caract', 'controle'].map(nom => ({ nom, statut: 'trouve' as const }));
  it('page lue, six étapes trouvées : l’étape « Rangement » tourne, ce n’est pas « 6 sur 6 » muet', () => {
    const l = lignesEtapes(six, { rangement: true });
    expect(l.at(-1)).toMatchObject({ cle: 'rangement', statut: 'en-cours' });
    expect(l.filter(x => x.statut === 'trouve')).toHaveLength(6);
  });
  it('fini : plus d’étape « Rangement » ; lien mort : jamais', () => {
    expect(lignesEtapes(six, { rangement: true, fini: true }).some(x => x.cle === 'rangement')).toBe(false);
    expect(lignesEtapes([{ nom: 'page', statut: 'absent', detail: 'introuvable' }], { rangement: true }).some(x => x.cle === 'rangement')).toBe(false);
    expect(lignesEtapes(six).some(x => x.cle === 'rangement')).toBe(false);
  });
});

describe('T30-13, T30-14 : libellé et valeur en français', () => {
  it('« Height without extension legs » : « Hauteur sans pieds d’extension »', () => {
    expect(libelleFrancais('Height without extension legs')).toBe('Hauteur sans pieds d’extension');
    expect(libelleFrancais('Height with extension legs')).toBe('Hauteur avec pieds d’extension');
  });
  it('« Hopfenpellets Typ 90 » : « Pellets type 90 » ; le français ne bouge pas', () => {
    expect(valeurFrancaise('Hopfenpellets Typ 90')).toBe('Pellets type 90');
    expect(valeurFrancaise('Pellets type 90')).toBe('Pellets type 90');
    expect(valeurFrancaise('Mehrzweckhopfen')).toBe('Houblon mixte');
  });
});

describe('T30-9 : « N caractéristiques », sans « mesures » ni « ailleurs dans la page » seul', () => {
  const BANC = path.join(__dirname, '../../work/missions/2026-11-23-carnet-en-ligne/banc-liens/pages');
  const page = (n: number) => zlib.gunzipSync(fs.readFileSync(path.join(BANC, String(n).padStart(2, '0') + '.html.gz'))).toString('utf8');
  const reseau = (html: string): typeof fetch => (async (input: string | URL | Request) => {
    const u = String(input instanceof Request ? input.url : input);
    return u.endsWith('/robots.txt') ? new Response('', { status: 404 }) : new Response(html, { status: 200, headers: { 'content-type': 'text/html' } });
  }) as typeof fetch;
  it('galaxus : l’étape dit le nombre de caractéristiques, rien d’autre', async () => {
    const p = await lireLien('https://www.galaxus.ch/de/s2/product/kibernetik-ks240l-242-l-kuehlschrank-freistehend-49548562', { fetchPage: reseau(page(59)), maintenant: 1, cours: null });
    const d = p.etapes?.find(x => x.nom === 'caract')?.detail ?? '';
    expect(d).toMatch(/^\d+ caractéristiques?/);
    expect(d).not.toMatch(/mesure/);
    expect(d).not.toMatch(/ailleurs dans la page$/);
  });
  it('IA : « rien de plus à lire », jamais « lite » ni « fort »', () => {
    /* le texte vit dans lienIA.ts ; il est vérifié sur la source pour ne pas appeler Gemini (jamais dans un test unitaire) */
    const src = fs.readFileSync(path.join(__dirname, '../../functions/src/lienIA.ts'), 'utf8');
    expect(src).toContain("'rien de plus à lire'");
    expect(src).not.toMatch(/\[direct \? 'modèle fort' : 'lite'\]/);
  });
});

/* ---------- T28-12, T28-13 (restes) : un article déjà rangé se lit en français ---------- */
import { valeursEnFrancais } from '../../src/domain/carnets/modele';

describe('T28-12, T28-13 : les noms et valeurs déjà rangés se disent en français à la lecture', () => {
  const v = (valeur: string | number, unite?: string, origine: 'page' | 'vous' = 'page') => ({ valeur, ...(unite ? { unite } : {}), origine });
  it('libellés anglais du fermenteur et du houblon', () => {
    const r = valeursEnFrancais({ 'Full volume': v('30', 'L'), 'Height with extension legs': v('1.435', 'm'), 'Top opening': v('20', 'cm'), 'Dump valve size': v('2', 'in'), 'Total oil': v('1.8ml'), Farnesene: v('7', '%'), Beta: v('4.5', '%') });
    expect(Object.keys(r)).toEqual(['Volume total', 'Hauteur avec pieds d’extension', 'Ouverture supérieure', 'Taille de la vanne de vidange', 'Huiles totales', 'Farnésène', 'Bêta']);
  });
  it('valeurs allemandes et décimales à la suisse : « Kühlschrank ohne Gefrierfach », « 143.50 cm » → « 143,5 cm »', () => {
    const r = valeursEnFrancais({ Typ: v('Kühlschrank ohne Gefrierfach'), 'Höhe': v('143.50', 'cm'), Hopfentyp: v('Mehrzweckhopfen'), Alpha: v('11.4', '%') });
    expect(r['Type'] ?? r['Typ']).toMatchObject({ valeur: 'Réfrigérateur sans compartiment congélateur' });
    expect(r['Hauteur']).toMatchObject({ valeur: '143,5', unite: 'cm' });
    expect(Object.values(r).find(x => x.valeur === 'Houblon mixte')).toBeTruthy();
    expect(Object.values(r).find(x => x.unite === '%')?.valeur).toBe('11,4');
  });
  it('ce que le brasseur a écrit, un nombre, un oui-non : jamais touchés ; le français repasse tel quel', () => {
    const entree = { Hauteur: v(143.5, 'cm'), 'Tient 80 °C': { valeur: true, origine: 'page' as const }, 'Full volume': v('à moi', undefined, 'vous') };
    const r = valeursEnFrancais(entree);
    expect(r['Hauteur']).toMatchObject({ valeur: 143.5, unite: 'cm' });
    expect(r['Tient 80 °C']).toMatchObject({ valeur: true });
    expect(r['Full volume']).toMatchObject({ valeur: 'à moi' });
    expect(valeursEnFrancais({ Volume: v('30', 'L') })).toEqual({ Volume: v('30', 'L') });
  });
});
