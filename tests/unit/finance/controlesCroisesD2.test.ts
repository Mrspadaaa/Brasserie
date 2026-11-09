// d2, retouches de la critique (VERDICT.md, 09.11) sur les règles pures du bloc : le geste quand le compte concorde et la somme non (bloquant 2), les mots « comptés », « justes ».
import { describe, expect, it } from 'vitest';
import { controlesCroises, type EntreeControles } from '../../../src/ui/finance/controlesCroises';

const entree = (o: Partial<EntreeControles> = {}): EntreeControles => ({
  lignesCents: 19665, nLignes: 22, nAjoutes: 0, ajoutsCents: 0, totalCents: 35205, attendus: 22, attendusIndependant: 22, payeCents: 35205, moyen: 'TWINT', qte: { ok: true, valeur: '22/22' }, ...o,
});
const rang = (e: EntreeControles, cle: string) => controlesCroises(e).rangs.find(r => r.cle === cle)!;

describe('d2 — le geste suit la cause (critique, bloquant 2)', () => {
  it('copie : 22 comptées = 22 lues et une somme fausse : « Vérifier les montants », pas « Chercher la ligne manquante »', () => {
    const s = rang(entree(), 'somme');
    expect(s.verdict).toBe('ecart');
    expect(s.geste).toBe('Vérifier les montants');
    expect(s.renvoi).toBe('montants');
  });
  it('tache : 23 lues pour 29 comptées : une ligne manque, la recherche reste le geste', () => {
    const e = entree({ nLignes: 23, lignesCents: 23440, attendus: 23, attendusIndependant: 29 });
    expect(rang(e, 'somme')).toMatchObject({ geste: 'Chercher la ligne manquante', renvoi: 'manquante' });
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
