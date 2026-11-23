// @vitest-environment jsdom
/*
 * Tour 25 (23.11, work/missions/2026-11-23-carnet-en-ligne/tour25/RAPPORT.md), la part de l'app :
 *   T25-5 : le même lien collé deux fois dans un carnet ne crée pas deux articles (adresse canonique : sans suivi, sans #, sans « www »)
 *   T25-6 : « Erntejahr 2025 », jamais « 2 025 » (un millésime n'est pas une quantité)
 *   T25-7 : une valeur que le vendeur ne publie pas ne fait pas trois lignes « non publié » : une phrase les dit
 *   T25-9 : « TTC » dit comme « HT »
 * Aucun Gemini, aucun réseau.
 */
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { fixtureCarnets, ID_VENTILATION } from '../../src/domain/carnets/fixture';
import { lireCarnet, lireMessage, type CarnetDoc } from '../../src/domain/carnets/modele';
import { ranger, remplacerRangement, type LigneARanger } from '../../src/domain/carnets/operations';
import { lienCanonique } from '../../src/domain/carnets/lien';
import { magasinMemoire } from '../../src/services/carnetsStore';
import { retourDeMessage } from '../../src/ui/carnets/retourCarnet';
import { texteBandeau } from '../../src/ui/carnets/Bandeau';
import { PrixPastille } from '../../src/ui/carnets/PrixPastille';
import { FicheArticle } from '../../src/ui/carnets/FicheArticle';
import type { ArticleV, ContenuCarnetV } from '../../src/ui/carnets/EtatIA';

afterEach(() => cleanup());
const LE = '2026-11-23T10:00:00.000Z';
const texte = (html: string) => html.replace(/[  ]/g, ' ');

describe('T25-5 : la même adresse n\'est qu\'un article', () => {
  const LIEN = 'https://www.bierbrauzubehoer.ch/speidels-braumeister/braumeister-von-speidel/1680/braumeister-20liter-automatisch';
  it('l\'adresse canonique oublie le suivi, le #, « www », le / final et l\'ordre des paramètres', () => {
    expect(lienCanonique(`${LIEN}/?utm_source=x&gclid=abc#avis`)).toBe(lienCanonique(LIEN));
    expect(lienCanonique('http://BierBrauZubehoer.ch/p?b=2&a=1')).toBe(lienCanonique('https://www.bierbrauzubehoer.ch/p/?a=1&b=2'));
    expect(lienCanonique('https://hopfenmarkt.ch/produkt/hopfen/mosaic?groesse=50-g')).not.toBe(lienCanonique('https://hopfenmarkt.ch/produkt/hopfen/mosaic?groesse=100-g'));
    expect(lienCanonique('pas une adresse')).toBeNull();
  });

  const article = (url: string): LigneARanger => ({ carnetId: ID_VENTILATION, sorte: 'article', url, domaine: 'bierbrauzubehoer.ch', nom: 'Braumeister 20Liter', prixCentimes: 100000, devise: 'CHF', lecture: 'lue', origine: 'page' });
  const msg = (id: string) => ({ id, texte: LIEN, le: LE, depuis: ID_VENTILATION, rangement: 'locale' as const });
  const ok = (r: ReturnType<typeof ranger>) => { if (!r.ok) throw new Error(r.raison); return r; };
  const articles = (items: ReturnType<typeof fixtureCarnets>) => (lireCarnet(items.find(i => i.id === ID_VENTILATION)) as CarnetDoc).carnet.articles.filter(a => lienCanonique(a.url ?? '') === lienCanonique(LIEN));

  it('le second collage ne crée rien ; son effet renvoie au premier article, que l\'annulation ne retire pas', () => {
    const m = magasinMemoire(fixtureCarnets());
    m.appliquer(ok(ranger(m.lire(), { message: msg('M1'), lignes: [article(LIEN)] })).ecritures);
    expect(articles(m.lire()).length).toBe(1);
    const premier = articles(m.lire())[0];
    const r2 = ok(ranger(m.lire(), { message: msg('M2'), lignes: [article(`${LIEN}?utm_campaign=zz`)] }));
    m.appliquer(r2.ecritures);
    expect(articles(m.lire()).length).toBe(1);
    const e = lireMessage(m.lire().find(i => i.id === 'M2'))!.carnetMessage.effets.find(x => x.cible === 'article');
    expect(e).toMatchObject({ id: premier.id, existant: true });
    /* « Annuler » le second message : le premier article reste */
    m.appliquer(r2.inverse);
    expect(articles(m.lire()).length).toBe(1);
  });

  it('la réécriture de l\'IA (remplacerRangement) du second message ne retire pas le premier et ne le double pas', () => {
    const m = magasinMemoire(fixtureCarnets());
    m.appliquer(ok(ranger(m.lire(), { message: msg('M1'), lignes: [article(LIEN)] })).ecritures);
    m.appliquer(ok(ranger(m.lire(), { message: msg('M2'), lignes: [article(LIEN)] })).ecritures);
    m.appliquer(ok(remplacerRangement(m.lire(), { messageId: 'M2', lignes: [article(LIEN)], rangement: 'ia' })).ecritures);
    expect(articles(m.lire()).length).toBe(1);
  });

  it('le bandeau dit « déjà dans ce carnet », et rien n\'est annoncé comme rangé', () => {
    const m = magasinMemoire(fixtureCarnets());
    m.appliquer(ok(ranger(m.lire(), { message: msg('M1'), lignes: [article(LIEN)] })).ecritures);
    const r2 = ok(ranger(m.lire(), { message: msg('M2'), lignes: [article(LIEN)] }));
    m.appliquer(r2.ecritures);
    const retour = retourDeMessage(m.lire(), 'M2', LIEN, ID_VENTILATION, r2.inverse);
    expect(retour?.bandeau).toMatchObject({ sorte: 'doublon' });
    expect(texteBandeau(retour!.bandeau)).toBe('✓ Déjà dans ce carnet : rien de plus rangé');
  });

  it('un autre carnet reste libre d\'avoir le même lien', () => {
    const m = magasinMemoire(fixtureCarnets());
    m.appliquer(ok(ranger(m.lire(), { message: msg('M1'), lignes: [article(LIEN)] })).ecritures);
    const autre = fixtureCarnets().map(i => lireCarnet(i)).find((c): c is CarnetDoc => !!c && c.id !== ID_VENTILATION)!;
    const r = ok(ranger(m.lire(), { message: msg('M3'), lignes: [{ ...article(LIEN), carnetId: autre.id } as LigneARanger] }));
    m.appliquer(r.ecritures);
    const dans = (id: string) => (lireCarnet(m.lire().find(i => i.id === id)) as CarnetDoc).carnet.articles.filter(a => lienCanonique(a.url ?? '') === lienCanonique(LIEN)).length;
    expect(dans(autre.id)).toBe(1);
    expect(dans(ID_VENTILATION)).toBe(1);
  });
});

const base: ArticleV = {
  id: 'A1', nom: 'Mosaic Hopfenpellets', url: 'https://hopfenmarkt.ch/produkt/hopfen/mosaic', domaine: 'hopfenmarkt.ch', vendeur: 'Hopfenmarkt',
  prixCentimes: 725, devise: 'CHF', taxe: 'ttc', lecture: 'lue', dispo: 'en stock', livraison: { prixCentimes: 490, devise: 'CHF' },
  valeurs: { 'Land der Ernte': { valeur: 'USA', origine: 'page' }, Erntejahr: { valeur: '2025', origine: 'page' }, Alpha: { valeur: '11.4%', origine: 'page' }, Hopfenform: { valeur: 'Pellets', origine: 'page' } }
};

describe('T25-9 : « TTC » dit comme « HT »', () => {
  it('la pastille de prix : « CHF TTC » quand la page le dit, « CHF HT » toujours, rien sinon', () => {
    expect(texte(renderToStaticMarkup(<PrixPastille article={base} />))).toContain('CHF TTC');
    expect(texte(renderToStaticMarkup(<PrixPastille article={{ ...base, taxe: 'ht' }} />))).toContain('CHF HT');
    const sans = texte(renderToStaticMarkup(<PrixPastille article={{ ...base, taxe: undefined }} />));
    expect(sans).not.toContain('TTC');
    expect(sans).not.toContain(' HT');
  });
  it('le port reste dit à côté', () => {
    expect(texte(renderToStaticMarkup(<PrixPastille article={base} />))).toContain('port 4,90 CHF');
  });
});

const carnetDe = (articles: ArticleV[], criteres: string[] = []): ContenuCarnetV => ({
  creeLe: LE, phrase: 'x', facons: [], notes: [], photos: [], articles,
  criteres: criteres.map((nom, i) => ({ id: `K${i}`, texte: nom, origine: 'vous' as const, caracteristique: { nom, sens: 'plus' as const } }))
});
/* le carnet compare aussi un autre article, qui publie ces valeurs : c'est lui qui fait exister les colonnes (comme au test en ligne) */
const autre = (criteres: string[]): ArticleV => ({ id: 'A2', nom: 'Autre', prixCentimes: 90000, devise: 'CHF', lecture: 'lue', valeurs: Object.fromEntries(criteres.map((n, i) => [n, { valeur: 10 + i, unite: 'kg', origine: 'page' as const }])) });
const fiche = (a: ArticleV, criteres: string[] = []) => {
  const { container } = render(<FicheArticle article={a} carnet={carnetDe(criteres.length ? [a, autre(criteres)] : [a], criteres)} titreCarnet="ZZ" onRetour={() => undefined} onVeille={() => undefined} />);
  return container.textContent!.replace(/[  ]/g, ' ');
};

describe('T25-6 : un millésime n\'est pas une quantité', () => {
  it('« Erntejahr 2025 » et jamais « 2 025 » ; une vraie quantité garde son espace', () => {
    const t = fiche({ ...base, valeurs: { ...base.valeurs, Volume: { valeur: 2500, unite: 'l', origine: 'page' } } });
    expect(t).toContain('Erntejahr2025');
    expect(t).not.toContain('2 025');
    expect(t).toContain('2 500');
  });
  it('« Récolte », « Année », « Millésime », « Jahrgang » aussi', () => {
    for (const nom of ['Récolte', 'Année', 'Millésime', 'Jahrgang']) {
      const t = fiche({ ...base, valeurs: { [nom]: { valeur: '2025', origine: 'page' }, Alpha: base.valeurs.Alpha, Forme: base.valeurs.Hopfenform, Pays: base.valeurs['Land der Ernte'] } });
      expect(t, nom).not.toContain('2 025');
    }
  });
});

describe('T25-7 : ce que le vendeur ne publie pas se dit une fois', () => {
  it('trois colonnes du carnet sans valeur : une phrase, aucune ligne « non publié » par colonne', () => {
    const a: ArticleV = { ...base, valeurs: { Volume: { valeur: '20', unite: 'Liter', origine: 'page' } } };
    const t = fiche(a, ['Malzmenge', 'Max. Malzmenge', 'Stromanschluss']);
    expect(t.match(/non publié/gi)?.length).toBe(1);
    expect(t).toContain('Non publié par le vendeur');
    for (const nom of ['Malzmenge', 'Max. Malzmenge', 'Stromanschluss']) expect(t).toContain(nom);
  });
  it('rien d\'absent : aucune phrase', () => {
    const t = fiche(base);
    expect(t).not.toContain('non publié');
    expect(t).not.toContain('Non publié');
  });
});
