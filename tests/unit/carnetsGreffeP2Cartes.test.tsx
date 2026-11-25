// @vitest-environment jsdom
/**
 * Voie greffe-p2, passe 2 (port D451, maquettes2/v01 : cartes Articles, fiche, Comparer) : règles du conditionnement, du compromis au kilo, du bouton
 * Choisir, puis la carte qui glisse (Déplacer, Retirer) et Comparer d'un carnet de matière pesée (kilo rendu, ✓, égaux repliés).
 * Cas neufs aussi (une levure au sachet, une chambre froide), jamais les seuls exemples de la maquette (B23).
 */
import React from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  compromisMatiere, conditionnementsDe, douteSurDispo, libelleChoisir, ligneDuPour, noteImport, poserQuantitePour, puceDoute, textePrixConditionnement, vendeurCourt,
  type ArticleRegle
} from '../../src/ui/carnets/tableauRegles';
import { CarteMatiere } from '../../src/ui/carnets/CarteArticle';
import { Comparer } from '../../src/ui/carnets/Comparer';
import { tableau } from '../../src/domain/carnets/comparer';
import { fixtureCarnets, ID_VENTILATION } from '../../src/domain/carnets/fixture';
import { lireCarnet, type Article, type CarnetDoc } from '../../src/domain/carnets/modele';

afterEach(() => { cleanup(); poserQuantitePour('ZZ TEST — cartes', 1); });

const v = (valeur: string | number, unite?: string) => ({ valeur, ...(unite ? { unite } : {}), origine: 'page' as const });
const CHANGE = { taux: 0.93, date: '2026-11-24', source: 'BCE' as const };

const EN_EUROS: ArticleRegle & { id: string } = {
  id: 'E', nom: 'Pellets T90 (US)', vendeur: 'MotlerHops', pays: 'FR', prixCentimes: 372, devise: 'EUR', taxe: 'ttc', change: CHANGE, conditionnement: { valeur: 50, unite: 'g' },
  offres: [{ valeur: 50, unite: 'g', prixCentimes: 372 }, { valeur: 250, unite: 'g', prixCentimes: 1406 }, { valeur: 500, unite: 'g', prixCentimes: 2497 }, { valeur: 1, unite: 'kg', prixCentimes: 4069 }],
  doute: 'la page dit « en stock », la lecture dit « épuisé »',
  valeurs: { "Taux d'acides alpha": v('13,2', '%'), Récolte: v(2025) }
};
const EN_FRANCS: ArticleRegle & { id: string } = {
  id: 'F', nom: 'Pellets T90 (CH)', vendeur: 'Brau- und Rauchshop', pays: 'CH', prixCentimes: 8000, devise: 'CHF', taxe: 'ht', conditionnement: { valeur: 1, unite: 'kg' },
  prixUnite: { prix: 0.1044, unite: 'g', paliers: [{ des: 1000, prix: 0.08 }, { des: 5000, prix: 0.04914 }, { des: 20000, prix: 0.0391075 }] },
  valeurs: { Alpha: v('13,6', '%') }
};
/** Une levure vendue au sachet (un seul conditionnement) : aucune ligne « au gramme », aucun prix deviné. */
const LEVURE: ArticleRegle & { id: string } = {
  id: 'L', nom: 'Levure sèche de brasserie 11,5 g', vendeur: 'Cave du coin', prixCentimes: 390, devise: 'CHF', conditionnement: { valeur: 11.5, unite: 'g' }, valeurs: {}
};

describe('conditionnements : ce que vend le vendeur, au prix de chaque conditionnement', () => {
  it('un vendeur en euros : quatre sachets, le kilo rendu de chacun, la ligne de la quantité choisie', () => {
    const l = conditionnementsDe(EN_EUROS, 0.93);
    expect(l.map(x => x.libelle)).toEqual(['50 g', '250 g', '500 g', '1 kg']);
    expect(l.map(x => textePrixConditionnement(x))).toEqual(['3,72 €', '14,06 €', '24,97 €', '40,69 €']);
    expect(l.every(x => x.chfKg?.estime)).toBe(true);
    expect(ligneDuPour(l, EN_EUROS, 1, 0.93)?.libelle).toBe('1 kg');
    expect(ligneDuPour(l, EN_EUROS, 0.04, 0.93)).toBeNull();
  });
  it('un vendeur au gramme : la ligne « au gramme » dit le prix d’un gramme, jamais un « 1 kg » inventé', () => {
    const l = conditionnementsDe(EN_FRANCS);
    expect(l.map(x => x.libelle)).toEqual(['au gramme', '1 kg', '5 kg', '20 kg']);
    expect(textePrixConditionnement(l[0])).toBe('0,1044');
    expect(textePrixConditionnement(l[1])).toBe('80,00');
    expect(Math.round(l[0].chfKg!.chf)).toBe(104);
    expect(Math.round(l[3].chfKg!.chf)).toBe(39);
    expect(l.every(x => !x.chfKg!.estime)).toBe(true);
  });
  it('un sachet unique, ou aucun conditionnement lisible : une ligne, ou aucune (l’inconnu n’est pas 0)', () => {
    expect(conditionnementsDe(LEVURE).map(x => x.libelle)).toEqual(['12 g']);
    expect(conditionnementsDe({ id: 'X', nom: 'Pellets', valeurs: {} })).toEqual([]);
  });
  it('la note d’import ne se dit que pour un prix converti, et dit si le port est lu', () => {
    expect(noteImport(EN_EUROS, 1, 0.93)).toBe("TVA d'import 8,1 % comptée · port non lu");
    expect(noteImport(EN_FRANCS, 1)).toBeNull();
    const avecPort = { ...EN_EUROS, livraison: { gratuite: true } } as ArticleRegle;
    expect(noteImport(avecPort, 1, 0.93)).toBe("TVA d'import 8,1 % comptée · port compté");
  });
});

describe('compromis au kilo, puce du doute, bouton Choisir', () => {
  it('le moins cher au kilo rendu, ce qu’on perd en α, la dispo douteuse', () => {
    const t = compromisMatiere([EN_EUROS, EN_FRANCS], 1, 0.93);
    expect(t).toBe('MotlerHops, 39 CHF de moins au kilo ; tu perds 0,4 point d’α et la dispo est douteuse.');
  });
  it('sans α lu des deux côtés ni doute, seul l’écart de prix est dit ; un seul prix connu : rien', () => {
    const sansAlpha = (a: ArticleRegle & { id: string }) => ({ ...a, valeurs: {}, doute: undefined });
    expect(compromisMatiere([sansAlpha(EN_EUROS), sansAlpha(EN_FRANCS)], 1, 0.93)).toBe('MotlerHops, 39 CHF de moins au kilo.');
    expect(compromisMatiere([EN_EUROS, { ...EN_FRANCS, prixCentimes: undefined, prixUnite: undefined, offres: undefined }], 1, 0.93)).toBeNull();
    expect(compromisMatiere([EN_EUROS], 1, 0.93)).toBeNull();
  });
  it('un doute D450 : « dispo ? » s’il porte sur le stock, « à vérifier » sinon, rien sans doute', () => {
    expect(douteSurDispo('la lecture dit « épuisé »')).toBe(true);
    expect(puceDoute('la lecture dit « épuisé »')).toBe('dispo ?');
    expect(puceDoute('deux lectures, deux prix')).toBe('à vérifier');
    expect(puceDoute(undefined)).toBeNull();
    expect(puceDoute('  ')).toBeNull();
  });
  it('le bouton dit le vendeur et la quantité (matière), la valeur de tête (mesure), sinon Choisir', () => {
    expect(libelleChoisir({ vendeur: 'MotlerHops', pourKg: 1 })).toBe('Choisir · MotlerHops, 1 kg');
    expect(libelleChoisir({ vendeur: 'Brau', pourKg: 5 })).toBe('Choisir · Brau, 5 kg');
    expect(libelleChoisir({ tete: '4,06 m³' })).toBe('Choisir la 4,06 m³');
    expect(libelleChoisir({})).toBe('Choisir');
  });
  it('le nom court d’un vendeur', () => {
    expect(vendeurCourt({ vendeur: 'Brau- und Rauchshop' })).toBe('Brau');
    expect(vendeurCourt({ vendeur: 'MotlerHops' })).toBe('MotlerHops');
    expect(vendeurCourt({ nom: 'Sans vendeur' })).toBe('Sans vendeur');
  });
});

describe('la carte qui glisse : Déplacer, Retirer, le conditionnement qui fait le prix', () => {
  const carte = (extra: Partial<React.ComponentProps<typeof CarteMatiere>> = {}) => render(
    <CarteMatiere article={{ ...EN_EUROS, lecture: 'lue', domaine: 'boutique-exemple.test', dispo: 'en stock' } as never} rang={1} taux={0.93} pour={1} onOuvrir={() => {}} {...extra} />
  );
  it('le kilo rendu au gros, α, la dispo et son doute, le conditionnement choisi dessous', () => {
    carte();
    expect(screen.getByLabelText(/CHF le kilo/).textContent).toContain('≈41');
    expect(screen.getByText('α', { exact: false }).textContent).toContain('13,2');
    expect(screen.getByText('dispo ?')).toBeTruthy();
    expect(screen.getByText('40,69 €')).toBeTruthy();
  });
  it('sans actions, aucun Déplacer ni Retirer ; avec elles, deux boutons qui appellent la bonne action', () => {
    const { unmount } = carte();
    expect(screen.queryByText('Retirer')).toBeNull();
    unmount();
    const onRetirer = vi.fn(), onDeplacer = vi.fn();
    carte({ actions: { onRetirer, onDeplacer } });
    fireEvent.click(screen.getByText('Retirer'));
    fireEvent.click(screen.getByText('Déplacer'));
    expect(onRetirer).toHaveBeenCalledTimes(1);
    expect(onDeplacer).toHaveBeenCalledTimes(1);
  });
  it('toucher le gros prix déplie « Conditionnement de … » ; toucher 5 kg pose la quantité du carnet', () => {
    const onPour = vi.fn();
    carte({ onPour });
    fireEvent.click(screen.getByLabelText(/CHF le kilo/));
    expect(screen.getByText(/le choix fait le prix/)).toBeTruthy();
    fireEvent.click(screen.getByLabelText('Pour 1 kg'));
    expect(onPour).toHaveBeenCalledWith(1);
    expect(screen.queryByLabelText('Pour 250 g')).toBeNull();
  });
  it('un sachet unique : le prix au kilo ne se déplie pas (rien à choisir)', () => {
    render(<CarteMatiere article={{ ...LEVURE, lecture: 'lue' } as never} rang={null} pour={1} onOuvrir={() => {}} />);
    expect((screen.getByLabelText(/CHF le kilo|prix au kilo/) as HTMLButtonElement).disabled).toBe(true);
  });
});

/* ---------------------------------------------------------------------------------------------------------- Comparer */

function carnetDe(titre: string, articles: Partial<Article>[]): CarnetDoc {
  const base = lireCarnet(fixtureCarnets().find(i => i.id === ID_VENTILATION)!)!;
  return { ...base, id: titre, title: titre, carnet: { ...base.carnet, criteres: [], facons: [], notes: [], photos: [], choix: undefined, sortie: undefined, archive: undefined,
    articles: articles.map(a => ({ domaine: 'boutique-exemple.test', lecture: 'lue', valeurs: {}, ...a }) as Article) } } as CarnetDoc;
}
const HOUBLONS = carnetDe('ZZ TEST — cartes', [EN_EUROS as Partial<Article>, EN_FRANCS as Partial<Article>].map((a, i) => ({ ...a, dispo: 'en stock', url: `https://boutique-exemple.test/${i}` })));
const CHAMBRES = carnetDe('ZZ TEST — chambres', [
  { id: 'C1', nom: 'Chambre froide 4,06 m³', vendeur: 'ggmgastro', pays: 'DE', dispo: 'en stock', prixCentimes: 298751, devise: 'CHF', valeurs: { Volume: v(4.06, 'm³'), Tension: v('230 V'), Puissance: v('550 W') } },
  { id: 'C2', nom: 'Chambre froide 2,6 m³', vendeur: 'ggmgastro', pays: 'DE', dispo: 'en stock', prixCentimes: 269774, devise: 'CHF', valeurs: { Volume: v(2.6, 'm³'), Tension: v('230 V'), Puissance: v('550 W') } }
]);
const comparer = (doc: CarnetDoc, articles?: boolean) => render(
  <Comparer titre={doc.title} statut={doc.status as never} critere={doc.carnet.criteres[0] as never} tableau={tableau(doc) as never} taux={0.93}
    {...(articles ? { articles: doc.carnet.articles as never } : {})} onRetour={() => {}} onChoisir={() => {}} />
);

describe('Comparer d’un carnet de matière pesée (articles passés)', () => {
  it('« Prix au kilo, rendu » en barres, le meilleur coché, « Selon la quantité », le compromis, le bouton à la quantité du carnet', () => {
    const { container } = comparer(HOUBLONS, true);
    expect(container.querySelector('.cn-barres')?.textContent).toContain('Prix au kilo, rendu');
    expect([...container.querySelectorAll('.cn-barre-val')].map(e => e.textContent)).toEqual(['≈41', '80']);
    expect(container.querySelector('.cn-cote-a-cote')?.textContent).toContain('le meilleur coché');
    expect(container.querySelector('.cn-quantite-phrase')?.textContent).toContain('1 et 5 kg, MotlerHops ; 20 kg, Brau (39 CHF/kg).');
    expect(container.querySelector('.cn-compromis')?.textContent).toContain('39 CHF de moins au kilo');
    expect(screen.getByRole('button', { name: 'Choisir · MotlerHops, 1 kg' })).toBeTruthy();
    expect(container.querySelector('tr.cn-ligne-epinglee td.cn-meilleur')?.textContent).toContain('≈41');
  });
  it('sans les articles, le tableau reste celui d’avant : ni barres au kilo, ni « Selon la quantité »', () => {
    const { container } = comparer(HOUBLONS, false);
    expect(container.querySelector('.cn-quantite-phrase')).toBeNull();
    expect(container.querySelector('.cn-cote-a-cote')).toBeNull();
    expect(screen.getByRole('button', { name: 'Choisir' })).toBeTruthy();
  });
});

describe('Comparer sans critère : ce qui diffère d’abord, les égaux repliés sur place', () => {
  it('« n identiques » se déplie ; les lignes gardent leur place dans le tableau ; le prix reste en vue', () => {
    const { container } = comparer(CHAMBRES);
    const lignes = () => [...container.querySelectorAll('tbody tr')].map(r => ({ txt: r.querySelector('th')?.textContent ?? '', cache: (r as HTMLElement).hidden }));
    const replie = lignes();
    expect(replie.find(l => /Tension/.test(l.txt))?.cache).toBe(true);
    expect(replie.find(l => /Puissance/.test(l.txt))?.cache).toBe(true);
    expect(replie.find(l => /prix/i.test(l.txt))?.cache).toBe(false);
    expect(container.querySelector('thead th')?.textContent).toMatch(/\d différents?/); // R73-11 (25.11) : « 2 différents », accordé
    const bouton = container.querySelector('.cn-cmp-identiques-bouton') as HTMLElement;
    expect(bouton.textContent).toMatch(/\d identiques/);
    fireEvent.click(bouton);
    expect(lignes().filter(l => l.cache)).toEqual([]);
  });
  it('un seul égal ne se replie pas (rien à gagner)', () => {
    const doc = carnetDe('ZZ TEST — un égal', [
      { id: 'A', nom: 'Cuve 100 L', vendeur: 'x', prixCentimes: 10000, devise: 'CHF', valeurs: { Volume: v(100, 'L'), Tension: v('230 V') } },
      { id: 'B', nom: 'Cuve 200 L', vendeur: 'y', prixCentimes: 15000, devise: 'CHF', valeurs: { Volume: v(200, 'L'), Tension: v('230 V') } }
    ]);
    const { container } = comparer(doc);
    expect(container.querySelector('.cn-cmp-identiques')).toBeNull();
  });
});
