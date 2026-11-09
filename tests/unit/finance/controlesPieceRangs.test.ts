// d2 : les contrôles de la pièce (c1) mis en rangées du bloc de l'écran Dépense. Les deux valeurs, le verdict, le geste ; un non vérifiable n'a pas de rangée. Lectures simulées anonymisées (`controlesPiece.pieces.ts`).
import { describe, expect, it } from 'vitest';
import { controlesPiece } from '../../../src/domain/finance/controlesPiece';
import { notePaiement, rangsDePiece, renvoiDuGeste } from '../../../src/ui/finance/controlesPieceRangs';
import { DEPENSE_TACHE, sun1, sun2, tacheAsLue, tacheComplete, copieAsLue, DEPENSE_SUN1 } from './controlesPiece.pieces';

const rangs = (l: Parameters<typeof controlesPiece>[0], ctx: Parameters<typeof controlesPiece>[1] = {}, o = { nRemises: 0, sommeEnEcart: false }) => rangsDePiece(controlesPiece(l, ctx), o);
const par = (r: ReturnType<typeof rangs>, cle: string) => r.find(x => x.cle === cle);

describe('d2 — du contrôle de la pièce à la rangée du bloc', () => {
  it('le geste mène à un renvoi : ajouter et rechercher → la recherche ; une ligne désignée → cette ligne ; la photo ; le total ; le doublon', () => {
    expect(renvoiDuGeste({ type: 'ajouter', libelle: '' })).toBe('manquante');
    expect(renvoiDuGeste({ type: 'rechercher', libelle: '' })).toBe('manquante');
    expect(renvoiDuGeste({ type: 'ouvrir-ligne', libelle: '', lignes: [3] })).toBe('lignes');
    expect(renvoiDuGeste({ type: 'ouvrir-ligne', libelle: '' })).toBe('fausse');
    expect(renvoiDuGeste({ type: 'relire-photo', libelle: '' })).toBe('photo');
    expect(renvoiDuGeste({ type: 'saisir-autre', libelle: '' })).toBe('total');
    expect(renvoiDuGeste({ type: 'voir-doublon', libelle: '' })).toBe('doublon');
    expect(renvoiDuGeste({ type: 'rien', libelle: '' })).toBe('liste');
  });

  it('BAUHAUS taché, photo tachée : la rangée « Photo » est une pastille d\'erreur, son geste est de relire la photo ; « Lignes hors articles » : « Montant en EUR » est écarté, donc concorde', () => {
    const r = rangs(tacheComplete());
    expect(par(r, 'photo-incomplete')).toMatchObject({ verdict: 'ecart', valeurs: 'incomplète', renvoi: 'photo' });
    expect(par(r, 'photo-incomplete')!.detail).toBe('bas du ticket taché');
    expect(par(r, 'photo-incomplete')!.geste).toMatch(/^Reprendre une photo/);
    expect(par(r, 'hors-articles')).toBeUndefined(); // « Montant en EUR » est bien écarté : rien à signaler, sur la ligne des contrôles discrets
    expect(par(r, 'verifies')).toMatchObject({ verdict: 'ok', valeurs: 'rien à signaler' });
    expect(par(r, 'verifies')!.texte).toBe('Lignes hors articles');
  });

  it('un non vérifiable n\'a pas de rangée : Sun Store 1 sans TVA détaillée, sans prix connus', () => {
    const r = rangs(sun1());
    expect(par(r, 'prix-plausible')).toBeUndefined();
    expect(r.every(x => x.verdict !== 'inconnu')).toBe(true);
  });

  it('codes EAN : non fiables par défaut (aucune rangée) ; fiables : « 23 / 29 », −6, la recherche', () => {
    const l = tacheAsLue();
    expect(par(rangs(l), 'comptage-ean')).toBeUndefined();
    const fiable = rangsDePiece(controlesPiece(l, { eanFiables: true }), { nRemises: 0, sommeEnEcart: true });
    expect(par(fiable, 'comptage-ean')).toMatchObject({ verdict: 'ecart', valeurs: '23 / 29', ecart: '−6', renvoi: 'manquante' });
    expect(par(fiable, 'cle-ean')).toBeUndefined();
    expect(par(fiable, 'verifies')!.texte).toContain('Clé EAN'); // clés toutes valides : rien à signaler, sur la ligne discrète
  });

  it('brut − rabais : seulement avec des remises, jamais en double de « Somme ≠ imprimé » ; dit brut − rabais et total (149,25 / 149,25)', () => {
    const l = sun2();
    expect(par(rangs(l), 'brut-rabais')).toBeUndefined();
    const avec = rangs(l, {}, { nRemises: 2, sommeEnEcart: false });
    expect(par(avec, 'brut-rabais')).toMatchObject({ verdict: 'ok', valeurs: '149,25 / 149,25' });
    const faux = { ...l, amountTTC: 140 };
    expect(par(rangs(faux, {}, { nRemises: 2, sommeEnEcart: true }), 'brut-rabais')).toBeUndefined();
    expect(par(rangs(faux, {}, { nRemises: 2, sommeEnEcart: false }), 'brut-rabais')).toMatchObject({ verdict: 'ecart', renvoi: 'fausse', ecart: '+9,25' });
  });

  it('doublon : une pièce identique saisie → pastille avec la dépense ; aucune dépense identique → pas de rangée (un « aucun doublon » n\'apprend rien)', () => {
    const l = copieAsLue();
    expect(par(rangs(l), 'doublon')).toBeUndefined();
    const r = rangs(l, { depenses: [DEPENSE_TACHE] });
    expect(par(r, 'doublon')).toMatchObject({ verdict: 'ecart', renvoi: 'doublon', refs: ['tx-tache'] });
  });

  it('paiement partagé : la note passe sous « Payé » (Sun Store : terminal 163,85 = 14,60 + 149,25), sans drapeau', () => {
    const lect = sun1();
    const liste = controlesPiece(lect, { depenses: [{ ...DEPENSE_SUN1, id: 'tx-autre', total: 149.25, heure: '09:14' }] });
    expect(notePaiement(liste)).toMatch(/Paiement partagé/);
    expect(liste.find(c => c.id === 'paiement')!.ok).not.toBe(false);
  });
});
