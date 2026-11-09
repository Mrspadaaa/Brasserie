// d2, retouches de la critique (VERDICT.md, 09.11) sur les règles pures du bloc : le geste quand le compte concorde et la somme non (bloquant 2), les mots « comptés », « justes ».
import { describe, expect, it } from 'vitest';
import { controlesCroises, estTotalFaux, montantDeLaLigneManquante, resumeDuBloc, type EntreeControles, type RangControle } from '../../../src/ui/finance/controlesCroises';

const entree = (o: Partial<EntreeControles> = {}): EntreeControles => ({
  lignesCents: 19665, nLignes: 22, nAjoutes: 0, ajoutsCents: 0, totalCents: 35205, attendus: 22, attendusIndependant: 22, payeCents: 35205, moyen: 'TWINT', qte: { ok: true, valeur: '22/22' }, ...o,
});
const rang = (e: EntreeControles, cle: string) => controlesCroises(e).rangs.find(r => r.cle === cle)!;

describe('d2 — le geste suit la cause (critique, bloquant 2)', () => {
  it('p1 copie : 22 comptées = 22 lues et une somme fausse, une ligne suspecte (rang 7) : « Ouvrir la ligne suspecte », cette ligne, jamais la plus grosse', () => {
    const s = rang(entree({ ligneSuspecte: 7, photo: true }), 'somme');
    expect(s).toMatchObject({ verdict: 'ecart', geste: 'Ouvrir la ligne suspecte', renvoi: 'lignes', lignes: [7] });
  });
  it('p1 copie : aucune ligne suspecte, un justificatif : « Comparer à la photo » (renvoi photo)', () => {
    expect(rang(entree({ ligneSuspecte: null, photo: true }), 'somme')).toMatchObject({ geste: 'Comparer à la photo', renvoi: 'photo' });
  });
  it('p1 copie : ni ligne suspecte ni justificatif : la liste, dite « Voir la liste » (le geste ne promet pas une photo absente)', () => {
    expect(rang(entree(), 'somme')).toMatchObject({ geste: 'Voir la liste', renvoi: 'liste' });
  });
  it('p1 : « Vérifier les montants » et le renvoi « montants » n’existent plus', () => {
    for (const e of [entree(), entree({ photo: true }), entree({ ligneSuspecte: 3 })]) {
      const s = rang(e, 'somme');
      expect(s.geste).not.toBe('Vérifier les montants');
      expect(s.renvoi).not.toBe('montants');
    }
  });
  it('tache : 23 lues pour 29 comptées : des lignes manquent, le geste ajoute la ligne (plus la recherche, p1)', () => {
    const e = entree({ nLignes: 23, lignesCents: 23440, attendus: 23, attendusIndependant: 29 });
    expect(rang(e, 'somme')).toMatchObject({ geste: 'Ajouter la ligne manquante', renvoi: 'manquante' });
    expect(rang(e, 'articles')).toMatchObject({ renvoi: 'manquante' });
  });
  it('sans comptage indépendant (annonce seule), le compte ne prouve pas que rien ne manque : la recherche reste le geste', () => {
    expect(rang(entree({ attendusIndependant: null }), 'somme').renvoi).toBe('manquante');
  });
  it('lignes en trop (somme au-dessus du total) : « Voir la ligne en trop » inchangé', () => {
    expect(rang(entree({ lignesCents: 40000 }), 'somme').renvoi).toBe('fausse');
  });
});

describe('d2 — les mots (critique, 5 et 6)', () => {
  it('le comptage vient de la colonne des montants : « comptés », jamais « imprimés »', () => {
    expect(rang(entree({ nLignes: 23, attendusIndependant: 29 }), 'articles')).toMatchObject({ texte: 'Articles lus ≠ comptés', valeurs: '23 / 29', ecart: '−6' });
    expect(rang(entree({ totalCents: 19665 }), 'articles')).toMatchObject({ texte: 'Articles lus = comptés', verdict: 'ok' });
  });
  it('« Qté × prix » dit ce qu\'il prouve : « 22/22 justes » et jamais « incomplet »', () => {
    const q = rang(entree(), 'qte');
    expect(q.valeurs).toBe('22/22 justes');
    expect(q.valeurs).not.toMatch(/incomplet/);
    expect(q.verdict).toBe('inconnu');
  });
  it('Qté × prix, tout concorde : vert, « 22/22 justes »', () => {
    const q = rang(entree({ totalCents: 19665 }), 'qte');
    expect(q).toMatchObject({ verdict: 'ok', valeurs: '22/22 justes' });
  });
});

describe('p1 — le geste « Ajouter la ligne manquante » et son montant', () => {
  it('le texte du geste et le renvoi concordent : articles et somme en défaut de lignes disent « Ajouter la ligne manquante », renvoi manquante', () => {
    const e = entree({ nLignes: 23, lignesCents: 23440, attendus: 23, attendusIndependant: 29 });
    for (const cle of ['articles', 'somme']) expect(rang(e, cle)).toMatchObject({ geste: 'Ajouter la ligne manquante', renvoi: 'manquante' });
  });
  it('exactement un article manque (écart −1) et la somme est sous le total : le montant préparé est le manque, en CHF', () => {
    const e = entree({ nLignes: 21, lignesCents: 28000, totalCents: 35205, attendus: 22, attendusIndependant: 22 });
    expect(controlesCroises(e).ecartArticles).toBe(-1);
    expect(montantDeLaLigneManquante(controlesCroises(e))).toBe(72.05);
  });
  it('deux articles manquent, ou le total n’est pas imprimé, ou la somme dépasse : aucun montant deviné (inconnu, jamais 0)', () => {
    expect(montantDeLaLigneManquante(controlesCroises(entree({ nLignes: 20, attendus: 22, attendusIndependant: 22 })))).toBeUndefined();
    expect(montantDeLaLigneManquante(controlesCroises(entree({ nLignes: 21, totalCents: null })))).toBeUndefined();
    expect(montantDeLaLigneManquante(controlesCroises(entree({ nLignes: 21, lignesCents: 40000, totalCents: 35205 })))).toBeUndefined();
  });
});

describe('p1 — le rouge des totaux faux et l’en-tête qui dit le problème', () => {
  const r = (cle: string, verdict: RangControle['verdict']): RangControle => ({ cle, verdict, texte: cle, valeurs: '' });
  it('articles, somme et payé en écart sont des totaux faux ; lectures, Qté × prix, contrôles de la pièce non', () => {
    for (const cle of ['articles', 'somme', 'paye']) expect(estTotalFaux(r(cle, 'ecart')), cle).toBe(true);
    for (const cle of ['lectures', 'qte', 'perdues', 'une-lecture', 'comptage-ean', 'prix-plausible', 'tva-par-taux']) expect(estTotalFaux(r(cle, 'ecart')), cle).toBe(false);
    for (const cle of ['articles', 'somme', 'paye']) { expect(estTotalFaux(r(cle, 'ok'))).toBe(false); expect(estTotalFaux(r(cle, 'inconnu'))).toBe(false); }
  });
  it('2 pages, un désaccord de lecture : l’en-tête dit « 1 désaccord de lecture », pas « Lectures · 2 pages »', () => {
    const lectures: RangControle = { cle: 'lectures', verdict: 'ecart', texte: 'Lectures · 2 pages', valeurs: '2/2 · 1 désaccord', resume: '1 désaccord de lecture' };
    expect(resumeDuBloc('', [r('articles', 'inconnu'), lectures])).toBe('1 désaccord de lecture');
    expect(resumeDuBloc('74,45 CHF manquants', [r('somme', 'ecart'), lectures])).toBe('74,45 CHF manquants');
  });
  it('sans résumé propre, une rangée en écart garde son libellé ; une rangée juste ne dit rien', () => {
    expect(resumeDuBloc('', [r('qte', 'ecart'), r('paye', 'ok')])).toBe('qte');
  });
});

describe('p1 — « Articles lus » : une valeur courte, « annoncé » en note', () => {
  it('l’annonce seule (sans comptage indépendant) : valeur « 5 · 2 rabais », note « annoncé par la lecture »', () => {
    const e = entree({ nLignes: 7, nRabais: 2, attendus: 7, attendusIndependant: null, totalCents: 19665, lignesCents: 19665, payeCents: 19665 });
    expect(rang(e, 'articles')).toMatchObject({ verdict: 'inconnu', texte: 'Articles lus', valeurs: '5 · 2 rabais', note: 'annoncé par la lecture' });
  });
});

describe('p1 relance (VERDICT-4) — payé, ligne ajoutée à remplir, photo au-delà de −1, en-tête = le pire point', () => {
  it('1 : un payé qui concorde dit à quoi il est comparé : « Payé = imprimé · TWINT » (sans moyen : « Payé = imprimé »)', () => {
    expect(rang(entree(), 'paye').texte).toBe('Payé = imprimé · TWINT');
    expect(rang(entree({ moyen: null }), 'paye').texte).toBe('Payé = imprimé');
  });
  const moins1 = (o: Partial<EntreeControles> = {}) => entree({ nLignes: 21, lignesCents: 28000, totalCents: 35205, attendus: 22, attendusIndependant: 22, ...o });
  it('2 : une ligne ajoutée et pas remplie : Articles et Somme disent « Remplir la ligne ajoutée » (renvoi ajoutee, son rang), jamais un 2e ajout', () => {
    const e = moins1({ ajouteeAVide: 22 });
    for (const cle of ['articles', 'somme']) expect(rang(e, cle), cle).toMatchObject({ geste: 'Remplir la ligne ajoutée', renvoi: 'ajoutee', lignes: [22] });
    for (const cle of ['articles', 'somme']) expect(rang(moins1(), cle).renvoi, cle).toBe('manquante');
  });
  it('3 : plus d’un article manque (−6) et un justificatif : « Comparer à la photo » sur Articles et Somme ; sans justificatif : ajouter ; à −1 : ajouter', () => {
    const e = entree({ nLignes: 23, lignesCents: 23440, attendus: 23, attendusIndependant: 29 });
    for (const cle of ['articles', 'somme']) expect(rang({ ...e, photo: true }, cle), cle).toMatchObject({ geste: 'Comparer à la photo', renvoi: 'photo' });
    for (const cle of ['articles', 'somme']) expect(rang(e, cle), cle).toMatchObject({ geste: 'Ajouter la ligne manquante', renvoi: 'manquante' });
    for (const cle of ['articles', 'somme']) expect(rang(moins1({ photo: true }), cle), cle).toMatchObject({ geste: 'Ajouter la ligne manquante', renvoi: 'manquante' });
  });
  it('4 : le résumé de l’en-tête est le pire point seul : « 117,65 CHF manquants », « 2 articles manquants », « 3,00 CHF en trop »', () => {
    expect(controlesCroises(entree({ nLignes: 23, lignesCents: 23440, attendus: 23, attendusIndependant: 29 })).resume).toBe('117,65 CHF manquants');
    expect(controlesCroises(entree({ nLignes: 20, lignesCents: 35205, attendus: 22, attendusIndependant: 22 })).resume).toBe('2 articles manquants');
    expect(controlesCroises(entree({ lignesCents: 35505 })).resume).toBe('3,00 CHF en trop');
  });
  it('4 : l’en-tête ne garde que ce pire point ; sans écart de total, le premier autre point par son résumé', () => {
    const lectures: RangControle = { cle: 'lectures', verdict: 'ecart', texte: 'Lectures', valeurs: '3/3 · 25 désaccords', resume: '25 désaccords de lecture' };
    const prix: RangControle = { cle: 'prix-plausible', verdict: 'ecart', texte: 'Prix connus', valeurs: '1 ligne à revoir' };
    expect(resumeDuBloc('155,40 CHF manquants', [prix, lectures])).toBe('155,40 CHF manquants');
    expect(resumeDuBloc('', [prix, lectures])).toBe('Prix connus 1 ligne à revoir');
  });
});
