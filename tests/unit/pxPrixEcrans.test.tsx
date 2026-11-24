// @vitest-environment jsdom
/**
 * Voie prix-houblon (24.11), côté app : tests ROUGES écrits depuis les règles R39 à R42 et ESCALADER-SUR-MANQUE (DOSSIER.md), avant tout correctif.
 * Ses mots : « Et le prix... » (« dès 0,10 » contre « ≈4 · 3,72 € ») ; « Ça fonctionne même plus » (après Relire : « Page relue », prix « ? », en-tête
 * « prix EUR ») ; « pourquoi il y a pas de bouton pour escaler la lecture ? ». Aucun réseau, aucun Gemini. Les pages lues sont celles que `lireLien` rend
 * (forme réelle des pages 64 et 65 du banc, 24.11).
 *  - R39 : le prix montré dit sa quantité (« 50 g · 3,72 € ») ou son unité (« 0,1044 CHF/g »).
 *  - R40 : le classement compare au même étalon (CHF/kg) ; la colonne des prix dit la monnaie de comparaison (CHF), jamais celle d'un article.
 *  - R42 : « Relire » d'un article lu à prix « dès » sans quantité retrouve un vrai prix, ou dit pourquoi.
 *  - ESCALADER-SUR-MANQUE : un article lu dont un champ attendu manque (prix « ? », nom) montre « Escalader » sur sa fiche et dans Comparer, à côté de Relire.
 */
import React from 'react';
import { cleanup, fireEvent, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { tableau } from '../../src/domain/carnets/comparer';
import { fixtureCarnets, ID_VENTILATION } from '../../src/domain/carnets/fixture';
import { lireReponse } from '../../src/domain/carnets/ia';
import { lireCarnet, type Article, type CarnetDoc } from '../../src/domain/carnets/modele';
import { ranger, relireArticle } from '../../src/domain/carnets/operations';
import { articleAEscalader } from '../../src/domain/carnets/manques';
import { quantiteArticle, texteParUnite } from '../../src/domain/carnets/prixUnitaire';
import { magasinMemoire } from '../../src/services/carnetsStore';
import { Comparer, colonnesComparer } from '../../src/ui/carnets/Comparer';
import type { ContenuCarnetV } from '../../src/ui/carnets/EtatIA';
import { FicheArticle } from '../../src/ui/carnets/FicheArticle';
import { depuisIA } from '../../src/ui/carnets/lignesRegles';

afterEach(cleanup);
const nop = () => undefined;
const LE = '2026-11-24T10:00:00.000Z';
const espaces = (t: string) => t.replace(/[\s  ]+/g, ' ').trim();

/** Les deux pages, telles que `lireLien` les rend après correctif (valeurs du banc, pages 64 et 65). */
const pageMotler = {
  url: 'https://www.motlerhops.fr/produit/citra-us', domaine: 'motlerhops.fr', statut: 'lue', nom: 'CITRA® (US)', prix: 3.72, devise: 'EUR', taxe: 'ttc', vendeur: 'MotlerHops', luLe: 1,
  conditionnement: { valeur: 50, unite: 'g' },
  offres: [{ valeur: 50, unite: 'g', prix: 3.72 }, { valeur: 250, unite: 'g', prix: 14.06 }, { valeur: 500, unite: 'g', prix: 24.97 }, { valeur: 1, unite: 'kg', prix: 40.69 }],
  change: { taux: 0.93, date: '2026-11-24', source: 'BCE' }
} as never;
const pageBrau = {
  url: 'https://www.brauundrauchshop.ch/citra-136-2', domaine: 'brauundrauchshop.ch', statut: 'lue', nom: 'Citra 13.6%', prix: 104.4, devise: 'CHF', vendeur: 'Brau- und Rauchshop', luLe: 1,
  conditionnement: { valeur: 1, unite: 'kg' }, prixUnite: { prix: 0.1044, unite: 'g', paliers: [{ des: 1000, prix: 0.08 }] },
  offres: [{ valeur: 5, unite: 'kg', prix: 245.7 }, { valeur: 20, unite: 'kg', prix: 782.15 }]
} as never;

/** Un article rangé dans le carnet de la fixture, comme le fait l'app (page → ligne → article), puis relu. */
function articleRange(page: Record<string, unknown>, texteLigne: Record<string, unknown> = {}) {
  const url = page.url as string;
  const lignes = lireReponse({ lignes: [{ sorte: 'article', texte: 'houblon', url, carnetId: ID_VENTILATION, ...texteLigne }] },
    { texte: `houblon ${url}`, carnets: [{ id: ID_VENTILATION, titre: 'Ventilation de la salle' }], depuis: ID_VENTILATION, pages: [page as never], origine: 'exemple' });
  expect(lignes).not.toBeNull();
  const ligne = depuisIA(lignes![0], { carnetId: ID_VENTILATION });
  const etat = fixtureCarnets();
  const r = ranger(etat, { message: { id: 'MSG-PX', texte: `houblon ${url}`, le: LE, depuis: ID_VENTILATION, rangement: 'simulee' }, lignes: [ligne] });
  if (!r.ok) throw new Error(r.raison);
  const m = magasinMemoire(etat);
  m.appliquer(r.ecritures);
  const doc = m.lire().map(i => lireCarnet(i)).find((d): d is CarnetDoc => !!d && d.id === ID_VENTILATION)!;
  return { m, doc, article: doc.carnet.articles.find(a => a.url === url) as Article };
}

/** Un carnet de deux houblons tenus à la main (valeurs du relevé du 24.11), pour Comparer et la fiche. */
function carnet(articles: Partial<Article>[]): CarnetDoc {
  const base = lireCarnet(fixtureCarnets().find(i => i.id === ID_VENTILATION)!)!;
  return {
    ...base, title: 'Houblons citra',
    carnet: {
      ...base.carnet, criteres: [], facons: [], notes: [], photos: [], choix: undefined, sortie: undefined, archive: undefined,
      articles: articles.map((a, i) => ({ id: `A${i + 1}`, domaine: 'exemple.test', url: `https://www.exemple.test/a${i + 1}`, lecture: 'lue', valeurs: {}, ...a }) as Article)
    }
  } as CarnetDoc;
}
const MOTLER: Partial<Article> = { nom: 'CITRA® (US)', vendeur: 'MotlerHops', prixCentimes: 372, devise: 'EUR', taxe: 'ttc', change: { taux: 0.93, date: '2026-11-24', source: 'BCE' }, conditionnement: { valeur: 50, unite: 'g' } } as never;
const BRAU: Partial<Article> = { nom: 'Citra 13.6%', vendeur: 'Brau- und Rauchshop', prixCentimes: 10440, devise: 'CHF', conditionnement: { valeur: 1, unite: 'kg' }, prixUnite: { prix: 0.1044, unite: 'g', paliers: [{ des: 1000, prix: 0.08 }] } } as never;

describe('R39, R40 : la quantité vient du conditionnement lu, pas seulement du nom', () => {
  it('quantiteArticle lit `conditionnement` quand le nom ne dit rien', () => {
    expect(quantiteArticle({ nom: 'Citra 13.6%', conditionnement: { valeur: 50, unite: 'g' } } as never)).toMatchObject({ dim: 'masse', base: 0.05, texte: '50 g' });
    expect(quantiteArticle({ nom: 'Citra 13.6%', conditionnement: { valeur: 1, unite: 'kg' } } as never)).toMatchObject({ dim: 'masse', base: 1, texte: '1 kg' });
  });
  it('le prix au kilo : 3,72 EUR les 50 g valent 74,40 EUR/kg ; 104,40 CHF le kilo restent 104,40 CHF/kg', () => {
    expect(texteParUnite({ nom: 'x', prixCentimes: 372, conditionnement: { valeur: 50, unite: 'g' } } as never, 372, 'EUR')).toMatch(/^74,40\s?EUR\/kg$/);
    expect(texteParUnite({ nom: 'x', prixCentimes: 10440, conditionnement: { valeur: 1, unite: 'kg' } } as never, 10440, 'CHF')).toMatch(/^104,40\s?CHF\/kg$/);
  });
  it('Comparer classe au kilo : MotlerHops (≈69 CHF/kg) devant Brau (104,40 CHF/kg) ; chacun dit sa quantité', () => {
    const t = tableau(carnet([BRAU, MOTLER]))!;
    expect(t.prixParUnite).toBe('masse');
    const m = t.lignes.find(l => l.nom.includes('CITRA'))!, b = t.lignes.find(l => l.nom.includes('Citra 13'))!;
    expect(m.quantite).toBe('50 g');
    /* R49 (C64-2) : un prix donné à l'unité n'a pas de conditionnement « 1 kg » : il se dit « 0,1044 CHF/g · 80,00 CHF/kg dès 1 kg » */
    expect(b.quantite).toBeUndefined();
    expect(b.prixUnite).toMatch(/0,1044\s?CHF\/g/);
    expect(m.rang).toBe(1);
    expect(b.rang).toBe(2);
  });
});

describe('R39 : la page lue arrive dans l\'article avec sa quantité (page → ligne → article)', () => {
  it('MotlerHops : 3,72 EUR pour 50 g, les quatre conditionnements gardés', () => {
    const { article: a } = articleRange(pageMotler as never);
    expect(a).toMatchObject({ prixCentimes: 372, devise: 'EUR', conditionnement: { valeur: 50, unite: 'g' } });
    expect((a as never as { offres: unknown[] }).offres).toHaveLength(4);
    expect(a.prixDes).toBeUndefined();
  });
  it('Brau : 104,40 CHF le kilo, 0,1044 CHF/g et ses paliers gardés', () => {
    const { article: a } = articleRange(pageBrau as never);
    expect(a).toMatchObject({ prixCentimes: 10440, devise: 'CHF', conditionnement: { valeur: 1, unite: 'kg' }, prixUnite: { prix: 0.1044, unite: 'g', paliers: [{ des: 1000, prix: 0.08 }] } });
  });
});

describe('R40 : la colonne des prix dit la monnaie de comparaison', () => {
  it('Comparer : l\'en-tête est « prix » en CHF (au kilo quand on classe au kilo), jamais EUR parce que le premier article est en euros', () => {
    const t = tableau(carnet([MOTLER, BRAU]))!;
    const col = colonnesComparer(t).find(c => c.cle === '__prix')!;
    expect(col.unite, JSON.stringify(col)).toMatch(/^CHF/);
    const c = render(<Comparer titre="Houblons citra" statut="validated" tableau={t as never} onRetour={nop} />).container;
    expect(espaces(c.textContent ?? '')).not.toMatch(/prix\s?EUR/i);
  });
  it('Comparer : la cellule d\'un prix au gramme dit « 0,1044 CHF/g », jamais « 0,10 » seul ; MotlerHops dit « 50 g »', () => {
    const t = tableau(carnet([MOTLER, BRAU]))!;
    const texte = espaces(render(<Comparer titre="Houblons citra" statut="validated" tableau={t as never} onRetour={nop} />).container.textContent ?? '');
    expect(texte).toMatch(/0,1044\s?CHF\/g/);
    expect(texte).toMatch(/50 g/);
    expect(texte).not.toMatch(/dès\s?0,10\b/);
  });
});

describe('R42 : « Relire » d\'un article lu à prix « dès » sans quantité retrouve un vrai prix, ou dit pourquoi', () => {
  /* l'article tel que l'ancienne lecture l'a rangé : « dès 0,10 CHF », sans quantité ; l'écran le cachait (« prix ? ») */
  const ancien = () => articleRange({ ...(pageBrau as object), prix: 0.1, conditionnement: undefined, prixUnite: undefined, offres: undefined, prixDes: true, etapes: [] } as never);
  it('la page relue (conditionnement, prix au kilo) remplace le « dès » : 104,40 CHF le kilo, plus de « dès »', () => {
    const { m, article } = ancien();
    expect(article.prixDes).toBe(true);
    const r = relireArticle(m.lire(), { carnetId: ID_VENTILATION, articleId: article.id, page: pageBrau as never, le: LE });
    expect(r.ok, r.ok ? '' : r.raison).toBe(true);
    if (!r.ok) return;
    const doc = r.ecritures.find((e: { op: string; doc?: { id: string } }) => e.op === 'put' && e.doc?.id === ID_VENTILATION) as { doc: unknown };
    const a = lireCarnet(doc.doc as never)!.carnet.articles.find(x => x.id === article.id)!;
    expect(a).toMatchObject({ prixCentimes: 10440, conditionnement: { valeur: 1, unite: 'kg' } });
    expect(a.prixDes).toBeUndefined();
  });
  it('une page qui ne dit toujours pas la quantité : le refus dit pourquoi (prix « dès » sans quantité), le prix posé par le brasseur ne bouge jamais', () => {
    const { m, article } = ancien();
    const r = relireArticle(m.lire(), { carnetId: ID_VENTILATION, articleId: article.id, page: { ...(pageBrau as object), prix: 0.1, prixDes: true, conditionnement: undefined, prixUnite: undefined, offres: undefined } as never, le: LE });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.raison).toMatch(/dès|quantité|conditionnement/i);
  });
});

describe('ESCALADER-SUR-MANQUE : un champ attendu manque → « Escalader » à côté de « Relire »', () => {
  const sansPrix: Partial<Article> = { nom: 'Citra 13.6%', vendeur: 'Brau- und Rauchshop' };
  it('la règle : prix absent, nom absent ou lecture douteuse ; jamais sur un article complet ni sur un article sans lien', () => {
    expect(articleAEscalader({ ...sansPrix, lecture: 'lue', url: 'https://x.test/a', valeurs: {} } as never)).toContain('prix');
    expect(articleAEscalader({ prixCentimes: 10, lecture: 'lue', url: 'https://x.test/a', valeurs: {} } as never)).toContain('nom');
    expect(articleAEscalader({ nom: 'A', prixCentimes: 100, lecture: 'lue', url: 'https://x.test/a', valeurs: { Alpha: { valeur: 13.6, origine: 'page' } } } as never)).toEqual([]);
    expect(articleAEscalader({ ...sansPrix, lecture: 'lue', valeurs: {} } as never)).toEqual([]);
    expect(articleAEscalader({ ...sansPrix, lecture: 'a-lire', url: 'https://x.test/a', valeurs: {} } as never)).toEqual([]);
  });
  it('Comparer : la cellule « prix ? » montre Relire ET Escalader ; Escalader appelle onEscalader(articleId)', () => {
    const t = tableau(carnet([MOTLER, { ...sansPrix }]))!;
    const onEscalader = vi.fn();
    const c = render(<Comparer titre="Houblons citra" statut="validated" tableau={t as never} onRetour={nop} onRelire={nop} onEscalader={onEscalader} />).container;
    const bouton = c.querySelector('[data-booster="escalader"]') as HTMLElement | null;
    expect(bouton, 'bouton Escalader dans la cellule du prix').not.toBeNull();
    expect(c.querySelector('.cn-relire-cellule')).not.toBeNull();
    fireEvent.click(bouton!);
    expect(onEscalader).toHaveBeenCalledWith('A2');
  });
  it('fiche : l\'offre sans prix montre Relire ET Escalader', () => {
    const k = carnet([{ ...sansPrix }]);
    const c = render(<FicheArticle article={(k.carnet as unknown as ContenuCarnetV).articles[0]} carnet={k.carnet as unknown as ContenuCarnetV} titreCarnet={k.title} onRetour={nop} onVeille={nop} onRelire={nop} onEscalader={nop} />).container;
    expect(c.querySelector('[data-booster="escalader"]')).not.toBeNull();
    expect(c.querySelector('.cn-relire-prix')).not.toBeNull();
  });
  it('un article complet ne montre pas Escalader', () => {
    const t = tableau(carnet([MOTLER, BRAU]))!;
    const c = render(<Comparer titre="Houblons citra" statut="validated" tableau={t as never} onRetour={nop} onRelire={nop} onEscalader={nop} />).container;
    expect(c.querySelector('[data-booster="escalader"]')).toBeNull();
  });
});
