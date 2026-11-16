// p2 (jeu en ligne 4, bloquants 1 et 2) : les règles pures. Deux tickets Sun Store lus comme deux pages d'une dépense : la vérification retire les deux lignes de la page 1 et ramène le total de 163,85 à 149,25 ;
// le terminal affiche 163,85. Ses mots (09.11) : « quand 2 totaux sont incorrectes, ça le marque pas en rouge ». Jamais une coche verte sur une donnée que la vérification a retirée sans décision.
import { describe, expect, it } from 'vitest';
import { controlesCroises, estTotalFaux, resumeDuBloc, type EntreeControles } from '../../../src/ui/finance/controlesCroises';

/** Sun Store, après la vérification : 5 lignes (page 2) = 149,25 ; total corrigé 163,85 → 149,25 ; TWINT 163,85 au terminal, aucun reçu imprimé. */
const entree = (o: Partial<EntreeControles> = {}): EntreeControles => ({
  lignesCents: 14925, nLignes: 5, nAjoutes: 0, ajoutsCents: 0, totalCents: 14925, attendus: 5, attendusIndependant: 5, nRabais: 2, payeCents: null, terminalCents: 16385, moyen: 'TWINT', qte: { ok: true, valeur: '3/3' }, photo: true, ...o,
});
const retirees = { n: 2, cents: 1460, sansMontant: 0 };
const rang = (e: EntreeControles, cle: string) => controlesCroises(e).rangs.find(r => r.cle === cle);

describe('p2 bloquant 1 : une ligne ou une valeur retirée par la vérification attend sa décision', () => {
  it('deux lignes lues puis retirées (14,60) : une rangée rouge qui dit ce qui a été retiré et mène à « Les garder »', () => {
    const r = rang(entree({ retirees }), 'retirees')!;
    expect(r).toMatchObject({ verdict: 'ecart', texte: '2 lignes lues puis retirées', valeurs: '14,60', geste: 'Les garder', renvoi: 'perdues' });
    expect(estTotalFaux(r)).toBe(true);
  });
  it('tant qu’elles attendent : ni « Articles lus = comptés » ni « Somme = imprimé » en vert, le bloc est en drapeau', () => {
    const c = controlesCroises(entree({ retirees }));
    expect(c.drapeau).toBe(true);
    for (const cle of ['articles', 'somme']) expect(c.rangs.find(r => r.cle === cle)!.verdict).not.toBe('ok');
    expect(c.rangs.find(r => r.cle === 'qte')!.verdict).not.toBe('ok');
    expect(c.rangs.some(r => /=\s*(imprimé|comptés)/.test(r.texte) && r.verdict === 'ok')).toBe(false);
  });
  it('l’en-tête dit le pire point : « 2 lignes retirées · 14,60 CHF »', () => {
    const c = controlesCroises(entree({ retirees }));
    expect(resumeDuBloc(c.resume, c.rangs)).toBe('2 lignes retirées · 14,60 CHF');
  });
  it('une ligne retirée sans montant lu : ambre (aucun total touché), jamais un 0', () => {
    const r = rang(entree({ retirees: { n: 1, cents: 0, sansMontant: 1 } }), 'retirees')!;
    expect(r).toMatchObject({ verdict: 'ecart', texte: '1 ligne lue puis retirée', valeurs: 'montant non lu', geste: 'La garder' });
    expect(estTotalFaux(r)).toBe(false);
  });
  it('le total changé par la vérification (163,85 → 149,25) : rangée rouge, geste « Remettre 163,85 », et « Somme = imprimé » n’est pas vert', () => {
    const c = controlesCroises(entree({ totalCorrige: { avantCents: 16385, apresCents: 14925 } }));
    const t = c.rangs.find(r => r.cle === 'total-corrige')!;
    expect(t).toMatchObject({ verdict: 'ecart', valeurs: '163,85 → 149,25', geste: 'Remettre 163,85', renvoi: 'reprendre-total' });
    expect(estTotalFaux(t)).toBe(true);
    expect(c.rangs.find(r => r.cle === 'somme')!.verdict).not.toBe('ok');
  });
  it('la TVA changée par la vérification (0,37 → 0,00) : ambre, « Remettre 0,37 »', () => {
    const t = rang(entree({ tvaCorrigee: { avantCents: 37, apresCents: 0 } }), 'tva-corrigee')!;
    expect(t).toMatchObject({ verdict: 'ecart', valeurs: '0,37 → 0,00', geste: 'Remettre 0,37', renvoi: 'reprendre-tva' });
    expect(estTotalFaux(t)).toBe(false);
  });
  it('rien en attente : aucune rangée ajoutée, les coches vertes reviennent', () => {
    const c = controlesCroises(entree());
    expect(c.rangs.some(r => ['retirees', 'total-corrige', 'tva-corrigee'].includes(r.cle))).toBe(false);
    expect(c.rangs.find(r => r.cle === 'somme')!.verdict).toBe('ok');
    expect(c.rangs.find(r => r.cle === 'articles')!.verdict).toBe('ok');
  });
});

describe('p2 bloquant 2 : le terminal qui diffère du total est un « Payé ≠ imprimé » rouge', () => {
  it('terminal 163,85, total 149,25, aucun reçu : rouge, écart signé +14,60, drapeau « 14,60 CHF payés en plus », « Comparer à la photo »', () => {
    const e = entree();
    const p = rang(e, 'paye')!;
    expect(p).toMatchObject({ verdict: 'ecart', texte: 'Payé · TWINT ≠ imprimé', valeurs: '163,85 / 149,25', ecart: '+14,60', geste: 'Comparer à la photo', renvoi: 'photo' });
    expect(estTotalFaux(p)).toBe(true);
    const c = controlesCroises(e);
    expect(c.drapeau).toBe(true);
    expect(resumeDuBloc(c.resume, c.rangs)).toBe('14,60 CHF payés en plus');
  });
  it('sans justificatif : le geste mène au règlement, jamais à une photo absente', () => {
    expect(rang(entree({ photo: false }), 'paye')).toMatchObject({ geste: 'Voir le règlement', renvoi: 'reglement' });
  });
  it('terminal inférieur au total : « en moins »', () => {
    const c = controlesCroises(entree({ terminalCents: 10000 }));
    expect(c.rangs.find(r => r.cle === 'paye')).toMatchObject({ verdict: 'ecart', ecart: '−49,25', resume: '49,25 CHF payés en moins' });
  });
  it('le manque du terminal est exactement les lignes retirées : le geste est « Les garder »', () => {
    expect(rang(entree({ retirees }), 'paye')).toMatchObject({ verdict: 'ecart', geste: 'Les garder · 14,60 retirés', renvoi: 'perdues' });
  });
  it('paiement partagé expliqué par d’autres dépenses : la rangée le dit, elle ne passe pas au rouge', () => {
    const p = rang(entree({ partageExplique: true, notePaye: 'Paiement partagé : 163,85 au terminal = 149,25 + 14,60 (1 autre dépense du même fournisseur, même jour)' }), 'paye')!;
    expect(p.verdict).toBe('inconnu');
    expect(p.note).toMatch(/Paiement partagé/);
  });
  it('terminal égal au total (payé effectif lu) : vert comme avant ; terminal non lu : « montant non lu », jamais 0', () => {
    expect(rang(entree({ payeCents: 14925, terminalCents: 14925 }), 'paye')!.verdict).toBe('ok');
    expect(rang(entree({ terminalCents: null }), 'paye')).toMatchObject({ verdict: 'inconnu', valeurs: 'montant non lu' });
  });
});

describe('p2 : les lignes retirées que le brasseur a gardées', () => {
  it('7 lignes lues pour 5 comptées par la 3.8 (qui ne les avait pas lues), 2 gardées : « Articles lus 5 · dont 2 gardées », neutre, ni rouge ni vert', () => {
    const a = rang(entree({ nLignes: 7, lignesCents: 16385, totalCents: 16385, gardees: 2, payeCents: 16385, terminalCents: 16385 }), 'articles')!;
    expect(a).toMatchObject({ verdict: 'inconnu', texte: 'Articles lus', valeurs: '5 · 2 rabais · dont 2 gardées' });
    const c = controlesCroises(entree({ nLignes: 7, lignesCents: 16385, totalCents: 16385, gardees: 2, payeCents: 16385, terminalCents: 16385, tvaCorrigee: { avantCents: 37, apresCents: 0 } }));
    expect(resumeDuBloc(c.resume, c.rangs)).toBe('TVA 0,37 changée en 0,00'); // jamais « 2 articles en trop » : ce sont les lignes gardées
  });
  it('un surplus plus grand que ce qui a été gardé reste un écart', () => {
    expect(rang(entree({ nLignes: 9, lignesCents: 16385, totalCents: 16385, gardees: 2 }), 'articles')!.verdict).toBe('ecart');
  });
});

describe('p2 : le total remis, les lignes encore retirées', () => {
  it('somme 149,25 pour un total remis à 163,85 : le manque est les 14,60 retirés, le geste est « Les garder · 14,60 retirés »', () => {
    const e = entree({ totalCents: 16385, retirees, payeCents: 16385, terminalCents: 16385 });
    expect(rang(e, 'somme')).toMatchObject({ verdict: 'ecart', geste: 'Les garder · 14,60 retirés', renvoi: 'perdues' });
  });
});
