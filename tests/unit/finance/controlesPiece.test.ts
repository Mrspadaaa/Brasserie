// Voie c1 (09.11) : les dix contrôles de robustesse d'une pièce lue, sur les quatre pièces pièges en lectures simulées anonymisées (L13 : écrits avant le module).
import { describe, expect, it } from 'vitest';
import {
  cleGs1Valide, codeBarresDeLigne, compterArticles, controlesEnEchec, controlesPiece, estHorsArticle, payeEffectif, rattacherRemises, type ControlePiece, type LectureControlee,
} from '../../../src/domain/finance/controlesPiece';
import {
  DEPENSE_SUN1, DEPENSE_SUN2, DEPENSE_TACHE, LIGNES_COPIE, LIGNES_TACHE_23, LIGNES_TACHE_29, MONTANTS_COPIE, SOMME_COPIE, SOMME_TACHE_23, SOMME_TACHE_29,
  copieAsLue, eanFaux, eanValide, sun1, sun2, tacheAsLue, tacheComplete,
} from './controlesPiece.pieces';

const FIABLES = { eanFiables: true };
const par = (liste: ControlePiece[]) => Object.fromEntries(liste.map(c => [c.id, c])) as Record<ControlePiece['id'], ControlePiece>;
const somme = (montants: number[]) => Math.round(montants.reduce((s, m) => s + m * 100, 0)) / 100;

describe('les fixtures disent vrai (vérité du pilote)', () => {
  it('les sommes de la vérité', () => {
    expect(somme(LIGNES_TACHE_29.map(l => l.amountTTC!))).toBe(SOMME_TACHE_29);
    expect(somme(LIGNES_TACHE_23.map(l => l.amountTTC!))).toBe(SOMME_TACHE_23);
    expect(somme(MONTANTS_COPIE)).toBe(SOMME_COPIE);
    expect(LIGNES_COPIE).toHaveLength(22);
    expect(somme(sun2().items.map(l => l.amountTTC!))).toBe(149.25);
  });
});

describe('la liste : dix contrôles, toujours dans le même ordre', () => {
  it('ids et ordre', () => {
    expect(controlesPiece(tacheComplete()).map(c => c.id)).toEqual([
      'comptage-montants', 'comptage-ean', 'cle-ean', 'brut-rabais', 'tva-par-taux', 'paiement', 'doublon', 'hors-articles', 'prix-plausible', 'photo-incomplete',
    ]);
  });
  it('une lecture vide : tout est non vérifiable, rien n\'est « bon » ni 0 (l\'inconnu n\'est jamais 0)', () => {
    const liste = controlesPiece({ items: [] });
    expect(liste.map(c => c.ok)).toEqual(Array(10).fill(null));
    expect(controlesEnEchec(liste)).toEqual([]);
    liste.forEach(c => expect(c.ecart).toBeUndefined());
  });
});

describe('2 — clé EAN (GS1, modulo 10)', () => {
  it('vecteurs publiés', () => {
    expect(cleGs1Valide('4006381333931')).toBe(true);
    expect(cleGs1Valide('5901234123457')).toBe(true);
    expect(cleGs1Valide('96385074')).toBe(true);
    expect(cleGs1Valide('4006381333932')).toBe(false);
    expect(cleGs1Valide('400638133393')).toBe(false); // 12 chiffres dont la clé ne tombe pas juste
    expect(cleGs1Valide('abc')).toBe(false);
  });
  it('un EAN faux repéré sur sa ligne, les bons passent', () => {
    const lecture = sun1();
    lecture.items[1] = { ...lecture.items[1], reference: eanFaux(lecture.items[1].reference!) };
    const c = par(controlesPiece(lecture, FIABLES))['cle-ean'];
    expect(c.ok).toBe(false);
    expect(c.lignes).toEqual([2]);
    expect(c.trouve).toContain('1 invalide');
    expect(c.geste).toMatchObject({ type: 'ouvrir-ligne', lignes: [2] });
  });
  it('tous valides : ok ; aucun code : non vérifiable', () => {
    expect(par(controlesPiece(sun1(), FIABLES))['cle-ean'].ok).toBe(true);
    expect(par(controlesPiece({ items: [{ name: 'X', amountTTC: 1 }] }))['cle-ean'].ok).toBeNull();
  });
  it('un numéro d\'article de 8 chiffres n\'est jamais pris pour un EAN-8 ; un champ ean explicite oui', () => {
    expect(codeBarresDeLigne({ reference: '12345678' })).toBeNull();
    expect(codeBarresDeLigne({ ean: '96385074' })).toBe('96385074');
    expect(codeBarresDeLigne({ reference: '4006 3813 3393 1' })).toBe('4006381333931');
    expect(codeBarresDeLigne({ evidence: 'PINCEAU 4006381333931 4.55' })).toBe('4006381333931');
    expect(codeBarresDeLigne({ evidence: 'PINCEAU 40063813339311 4.55' })).toBeNull();
  });
  it('un EAN bien formé à 13 chiffres de la construction des fixtures', () => {
    expect(cleGs1Valide(eanValide('761230000000'))).toBe(true);
  });
});

describe('3 (contrat 09.11) — EAN « non vérifié » tant que les codes ne sont pas lus à 90 % (mesuré au banc), sans drapeau', () => {
  it('par défaut : cle-ean et comptage-ean rendent ok null, sans écart, sans ligne, sans geste, même avec des codes faux et un mauvais compte', () => {
    const lecture = tacheAsLue();
    lecture.items = lecture.items.map(l => ({ ...l, reference: eanFaux(l.reference!) })); // chaque code a un chiffre faux : le cas BAUHAUS du banc (21 invalides sur 25)
    const c = par(controlesPiece(lecture));
    for (const id of ['cle-ean', 'comptage-ean'] as const) {
      expect(c[id].ok, id).toBeNull();
      expect(c[id].ecart, id).toBeUndefined();
      expect(c[id].lignes, id).toBeUndefined();
      expect(c[id].geste, id).toEqual({ type: 'rien', libelle: '' });
      expect(c[id].note, id).toContain('Non vérifié');
    }
    expect(c['cle-ean'].trouve).toContain('23 codes lus, 23 invalides'); // ce qui a été lu reste dit
    expect(controlesEnEchec(controlesPiece(lecture)).map(x => x.id)).not.toContain('cle-ean');
    expect(controlesEnEchec(controlesPiece(lecture)).map(x => x.id)).not.toContain('comptage-ean');
  });
  it('quand le banc a mesuré 90 % et que le contexte le dit : le drapeau revient', () => {
    const lecture = tacheAsLue(); lecture.items[0] = { ...lecture.items[0], reference: eanFaux(lecture.items[0].reference!) };
    expect(par(controlesPiece(lecture, FIABLES))['cle-ean']).toMatchObject({ ok: false, lignes: [1] });
  });
});

describe('5 (contrat 09.11) — rabais : sous-ligne rattachée à l\'article, hors du compte d\'articles', () => {
  it('Sun Store 2 : 3 articles ; les deux rabais sont sous Vaccin grippe et Vaccin covid, nets 26,00 et 73,25', () => {
    const { articles, orphelines } = rattacherRemises(sun2().items);
    expect(articles.map(a => a.rang)).toEqual([1, 3, 4]);
    expect(articles.map(a => a.remises)).toEqual([[2], [], [5]]);
    expect(articles.map(a => a.netCts)).toEqual([2600, 5000, 7325]);
    expect(orphelines).toEqual([]);
  });
  it('une remise sans article au-dessus est orpheline (remise globale) ; un article sans montant a un net inconnu, pas 0', () => {
    const items = [{ name: 'Rabais fidélité', kind: 'discount', amountTTC: -2 }, { name: 'A', amountTTC: null, price: null, quantity: 3 }, { name: 'Rabais', kind: 'discount', amountTTC: -1 }];
    const { articles, orphelines } = rattacherRemises(items);
    expect(orphelines).toEqual([1]);
    expect(articles).toEqual([{ rang: 2, remises: [3], netCts: null }]);
  });
  it('le contrôle brut-rabais le dit : sous-lignes, jamais articles ; le nombre d\'articles à comparer est celui de rattacherRemises', () => {
    const c = par(controlesPiece(sun2()))['brut-rabais'];
    expect(c.note).toContain('3 articles');
    expect(c.note).toContain('sous-lignes de leur article');
    expect(rattacherRemises(sun2().items).articles).toHaveLength(sun2().printedItemCount!);
  });
});

describe('1 — comptage indépendant (montants et EAN comptés à part, contre les lignes lues)', () => {
  it('BAUHAUS taché, 29 lues : 29 = 29', () => {
    const c = par(controlesPiece(tacheComplete(), FIABLES));
    expect(c['comptage-montants']).toMatchObject({ ok: true, attendu: '29 montants', trouve: '29 lignes avec montant' });
    expect(c['comptage-ean'].ok).toBe(true);
  });
  it('BAUHAUS taché, la vraie lecture (23 lues, 23 « annoncées ») : la colonne en compte 29, six manquent ; « annoncé = lu » ne disait rien (circulaire)', () => {
    const lecture = tacheAsLue();
    expect(lecture.printedLineCount).toBe(lecture.items.length); // le défaut 1 du banc : le compte annoncé est le compte transcrit
    const c = par(controlesPiece(lecture, FIABLES));
    expect(c['comptage-montants']).toMatchObject({ ok: false, ecart: 6, unite: 'lignes', sens: 'manque' });
    expect(c['comptage-montants'].geste.type).toBe('ajouter');
    expect(c['comptage-ean']).toMatchObject({ ok: false, ecart: 6 });
  });
  it('des lignes en trop : ouvrir et retirer', () => {
    const lecture = tacheComplete(); lecture.countedAmounts = 27;
    const c = par(controlesPiece(lecture))['comptage-montants'];
    expect(c).toMatchObject({ ok: false, ecart: 2, sens: 'exces' });
    expect(c.geste.type).toBe('ouvrir-ligne');
  });
  it('un comptage non fourni : non vérifiable, jamais « 0 attendu »', () => {
    const lecture = tacheComplete(); lecture.countedAmounts = null; lecture.countedEans = undefined;
    const c = par(controlesPiece(lecture));
    expect(c['comptage-montants']).toMatchObject({ ok: null, attendu: '—' });
    expect(c['comptage-ean'].ok).toBeNull();
  });
});

describe('3 — brut − rabais = total ; les rabais sont des remises, jamais des articles', () => {
  it('Sun Store 2 : 151,83 − 2,58 = 149,25 ; 3 articles et 2 remises', () => {
    const lecture = sun2();
    expect(compterArticles(lecture.items)).toMatchObject({ articles: 3, remises: 2, horsArticles: 0 });
    const c = par(controlesPiece(lecture))['brut-rabais'];
    expect(c.ok).toBe(true);
    expect(c.trouve).toBe('brut 151,83 − rabais 2,58 = 149,25');
    expect(c.note).toContain('3 articles');
    expect(c.note).toContain('2 remises');
  });
  it('un rabais lu positif (kind other) ferait un faux total : l\'écart est vu', () => {
    const lecture = sun2(); lecture.items[1] = { ...lecture.items[1], kind: 'other', price: 0.68, amountTTC: 0.68 };
    const c = par(controlesPiece(lecture))['brut-rabais'];
    expect(c.ok).toBe(false);
    expect(c.ecart).toBe(1.36);
    expect(c.sens).toBe('exces');
  });
  it('BAUHAUS taché, 29 lues : écart 74,45 sur la pièce, la ligne à ajouter', () => {
    const c = par(controlesPiece(tacheComplete()))['brut-rabais'];
    expect(c).toMatchObject({ ok: false, ecart: 74.45, unite: 'CHF', sens: 'manque', attendu: 'total 352,05' });
    expect(c.trouve).toBe('brut 277,60 = 277,60');
    expect(c.geste.type).toBe('ajouter');
    expect(c.geste.libelle).toContain('74,45');
  });
  it('BAUHAUS taché, la vraie lecture (23) : 117,65, dont 43,20 sont sur la photo ; copie : 215,40 vérité, 155,40 lu', () => {
    expect(par(controlesPiece(tacheAsLue()))['brut-rabais'].ecart).toBe(117.65);
    const copie = par(controlesPiece(copieAsLue()))['brut-rabais'];
    expect(copie).toMatchObject({ ok: false, ecart: 155.4 });
    const vraie = copieAsLue(); vraie.items = LIGNES_COPIE;
    expect(par(controlesPiece(vraie))['brut-rabais'].ecart).toBe(215.4);
  });
  it('un montant en trop : la ligne coupable est désignée (une ligne dont le montant est l\'écart)', () => {
    const lecture = tacheComplete(); lecture.amountTTC = 277.6 - 14.9;
    const c = par(controlesPiece(lecture))['brut-rabais'];
    expect(c).toMatchObject({ ok: false, ecart: 14.9, sens: 'exces' });
    expect(c.lignes).toEqual([25]);
    expect(c.geste).toMatchObject({ type: 'ouvrir-ligne', lignes: [25] });
  });
  it('arrondi à 5 centimes toléré', () => {
    const lecture = tacheComplete(); lecture.amountTTC = 277.65;
    expect(par(controlesPiece(lecture))['brut-rabais'].ok).toBe(true);
  });
  it('une ligne sans montant n\'est pas comptée 0 : le contrôle ne se dit pas bon', () => {
    const lecture = tacheComplete(); lecture.amountTTC = 277.6 - 8.9;
    lecture.items[26] = { ...lecture.items[26], price: null, amountTTC: null };
    const c = par(controlesPiece(lecture))['brut-rabais'];
    expect(c.ok).toBeNull();
    expect(c.note).toContain('sans montant');
  });
});

describe('4 — TVA recalculée par taux : total × t / (100 + t), à 0,05 près', () => {
  it('Sun Store 1 : 14,60 × 2,6 / 102,6 = 0,37', () => {
    const c = par(controlesPiece(sun1()))['tva-par-taux'];
    expect(c.ok).toBe(true);
    expect(c.trouve).toBe('2,6 % : 0,37 imprimée, 0,37 recalculée');
  });
  it('Sun Store 2 : taux 0 %, TVA 0', () => {
    expect(par(controlesPiece(sun2()))['tva-par-taux'].ok).toBe(true);
  });
  it('une TVA mal lue (0,57 au lieu de 0,37) : drapeau, écart 0,20', () => {
    const lecture = sun1(); lecture.vat = [{ code: 'A', rate: 0.026, base: 14.23, amount: 0.57 }];
    const c = par(controlesPiece(lecture))['tva-par-taux'];
    expect(c).toMatchObject({ ok: false, ecart: 0.2, unite: 'CHF' });
    expect(c.geste.type).toBe('relire-photo');
  });
  it('deux taux : le TTC de chaque taux vient des lignes de son code', () => {
    const lecture: LectureControlee = {
      amountTTC: 210.7, vat: [{ code: 'A', rate: 0.081, base: 100, amount: 8.1 }, { code: 'B', rate: 0.026, base: 100, amount: 2.6 }],
      items: [{ name: 'a', amountTTC: 108.1, vatCode: 'A' }, { name: 'b', amountTTC: 102.6, vatCode: 'B' }],
    };
    const c = par(controlesPiece(lecture))['tva-par-taux'];
    expect(c.ok).toBe(true);
    expect(c.trouve).toBe('8,1 % : 8,10 imprimée, 8,10 recalculée · 2,6 % : 2,60 imprimée, 2,60 recalculée');
    lecture.vat![1] = { code: 'B', rate: 0.026, base: 100, amount: 2.9 };
    expect(par(controlesPiece(lecture))['tva-par-taux']).toMatchObject({ ok: false, ecart: 0.3 });
  });
  it('deux taux et une ligne sans code : non vérifiable, jamais deviné', () => {
    const lecture: LectureControlee = {
      amountTTC: 210.7, vat: [{ code: 'A', rate: 0.081, amount: 8.1 }, { code: 'B', rate: 0.026, amount: 2.6 }],
      items: [{ name: 'a', amountTTC: 108.1, vatCode: 'A' }, { name: 'b', amountTTC: 102.6, vatCode: '' }],
    };
    expect(par(controlesPiece(lecture))['tva-par-taux'].ok).toBeNull();
  });
  it('un seul taux lu au pied (tvaRate / tvaAmount), sans tableau', () => {
    const c = par(controlesPiece({ amountTTC: 108.1, tvaRate: 0.081, tvaAmount: 8.1, items: [] }))['tva-par-taux'];
    expect(c.ok).toBe(true);
  });
});

describe('5 — paiement : montant reçu ≠ total, et paiement partagé (le terminal est une information)', () => {
  it('Sun Store 1 : reçu 14,60 = total ; le terminal 163,85 = 14,60 + 149,25 (Sun Store 2, même jour)', () => {
    const c = par(controlesPiece(sun1(), { depenses: [DEPENSE_SUN2] }))['paiement'];
    expect(c.ok).toBe(true);
    expect(c.trouve).toBe('payé 14,60 (TWINT)');
    expect(c.note).toContain('Paiement partagé : 163,85 au terminal = 14,60 + 149,25');
    expect(c.refs).toEqual(['tx-sun2']);
  });
  it('Sun Store 2 : 149,25 + 14,60 (Sun Store 1) = 163,85', () => {
    const c = par(controlesPiece(sun2(), { depenses: [DEPENSE_SUN1] }))['paiement'];
    expect(c.ok).toBe(true);
    expect(c.note).toContain('163,85 au terminal = 149,25 + 14,60');
  });
  it('sans l\'autre ticket saisi : le terminal reste une information, pas un drapeau', () => {
    const c = par(controlesPiece(sun1(), { depenses: [] }))['paiement'];
    expect(c.ok).toBe(true);
    expect(c.note).toContain('plus que le total');
    expect(controlesEnEchec(controlesPiece(sun1())).map(x => x.id)).not.toContain('paiement');
  });
  it('un autre fournisseur ou un autre jour n\'explique rien', () => {
    const autres = [{ ...DEPENSE_SUN2, vendor: 'Autre Pharmacie' }, { ...DEPENSE_SUN2, id: 'x2', date: '2026-11-06' }];
    expect(par(controlesPiece(sun1(), { depenses: autres }))['paiement'].refs).toBeUndefined();
  });
  it('BAUHAUS : reçu 352,05 = total', () => {
    expect(par(controlesPiece(tacheComplete()))['paiement']).toMatchObject({ ok: true, trouve: 'payé 352,05 (TWINT)' });
  });
  it('reçu inférieur au total : drapeau ; supérieur : drapeau', () => {
    const bas = tacheComplete(); bas.amountPaid = 300;
    expect(par(controlesPiece(bas))['paiement']).toMatchObject({ ok: false, ecart: 52.05, sens: 'manque' });
    const haut = tacheComplete(); haut.amountPaid = 400;
    expect(par(controlesPiece(haut))['paiement']).toMatchObject({ ok: false, ecart: 47.95, sens: 'exces' });
  });
  it('montant reçu non lu : non vérifiable ; terminal égal au total : vaut paiement ; terminal différent : non vérifiable avec sa note', () => {
    const non = tacheComplete(); non.amountPaid = null; non.terminalAmount = null;
    expect(par(controlesPiece(non))['paiement']).toMatchObject({ ok: null, trouve: 'montant payé non lu' });
    const egal = tacheComplete(); egal.amountPaid = null;
    expect(par(controlesPiece(egal))['paiement']).toMatchObject({ ok: true });
    const autre = sun1(); autre.amountPaid = null;
    const c = par(controlesPiece(autre, { depenses: [DEPENSE_SUN2] }))['paiement'];
    expect(c.ok).toBeNull();
    expect(c.note).toContain('163,85');
  });
});

describe('6 — doublon : même fournisseur, même date et heure, même total', () => {
  it('BAUHAUS copie contre le taché (02.11.2026 12:31, 352,05)', () => {
    const c = par(controlesPiece(copieAsLue(), { depenses: [DEPENSE_TACHE] }))['doublon'];
    expect(c.ok).toBe(false);
    expect(c.refs).toEqual(['tx-tache']);
    expect(c.trouve).toContain('même heure 12:31');
    expect(c.trouve).toContain('352,05');
    expect(c.geste.type).toBe('voir-doublon');
  });
  it('le fournisseur se reconnaît malgré la forme juridique et la casse', () => {
    const c = par(controlesPiece(copieAsLue(), { depenses: [{ ...DEPENSE_TACHE, vendor: 'BRICO FICTIF' }] }))['doublon'];
    expect(c.ok).toBe(false);
  });
  it('une autre heure : ce n\'est pas un doublon ; une heure inconnue d\'un côté : probable, dit', () => {
    expect(par(controlesPiece(copieAsLue(), { depenses: [{ ...DEPENSE_TACHE, heure: '16:02' }] }))['doublon'].ok).toBe(true);
    const sans = par(controlesPiece(copieAsLue(), { depenses: [{ ...DEPENSE_TACHE, heure: undefined }] }))['doublon'];
    expect(sans.ok).toBe(false);
    expect(sans.trouve).toContain('heure non comparable');
  });
  it('un autre total, un autre jour, un autre fournisseur : aucun doublon', () => {
    const ctx = { depenses: [{ ...DEPENSE_TACHE, total: 14.6 }, { ...DEPENSE_TACHE, id: 'b', date: '2026-11-03' }, { ...DEPENSE_TACHE, id: 'c', vendor: 'Autre' }] };
    expect(par(controlesPiece(copieAsLue(), ctx))['doublon'].ok).toBe(true);
  });
  it('Sun Store 1 et 2 ne sont pas des doublons l\'un de l\'autre', () => {
    expect(par(controlesPiece(sun1(), { depenses: [DEPENSE_SUN2] }))['doublon'].ok).toBe(true);
  });
  it('date ou total absents : non vérifiable', () => {
    const l = copieAsLue(); l.date = '';
    expect(par(controlesPiece(l, { depenses: [DEPENSE_TACHE] }))['doublon'].ok).toBeNull();
  });
  it('la date de brouillon au format AAAA-MM-JJ se compare à une lecture JJ.MM.AAAA', () => {
    const l = copieAsLue(); l.date = '2026-11-02';
    expect(par(controlesPiece(l, { depenses: [DEPENSE_TACHE] }))['doublon'].ok).toBe(false);
  });
});

describe('7 — lignes hors articles : devise, règlement, sous-total ; jamais comptées dans les lignes', () => {
  it('BAUHAUS taché : « Montant en EUR 370,92 » et TWINT écartés par la lecture, aucun dans les lignes', () => {
    const c = par(controlesPiece(tacheComplete()))['hors-articles'];
    expect(c.ok).toBe(true);
    expect(c.trouve).toBe('2 lignes écartées : Montant en EUR 370,92 · TWINT 352,05');
  });
  it('la ligne « Montant en EUR » entrée dans les lignes : drapeau, à retirer, et elle n\'est comptée ni dans le brut ni dans les comptages', () => {
    const lecture = tacheComplete();
    lecture.items.push({ name: 'Montant en EUR', kind: 'other', quantity: 1, price: 370.92, amountTTC: 370.92 });
    const c = par(controlesPiece(lecture));
    expect(c['hors-articles']).toMatchObject({ ok: false, lignes: [30], ecart: 1 });
    expect(c['hors-articles'].geste).toMatchObject({ type: 'ouvrir-ligne', lignes: [30] });
    expect(c['comptage-montants'].ok).toBe(true);
    expect(c['brut-rabais'].ecart).toBe(74.45);
  });
  it('sous-totaux, règlement et devise reconnus par leur désignation ; un article qui y ressemble reste un article', () => {
    for (const nom of ['Montant en EUR', 'Sous-total', 'Zwischensumme', 'TOTAL', 'TWINT', 'Total EFT', 'Espèces', 'Rückgeld', 'VISA 1234', 'EUR 12.00', 'Payé']) expect(estHorsArticle({ name: nom }), nom).toBe(true);
    for (const nom of ['Visage crème', 'Totalreiniger', 'Eurolux 5 W', 'Twinkle LED', 'Cashew 200 g', 'Summerale', 'Payer-papier']) expect(estHorsArticle({ name: nom }), nom).toBe(false);
  });
  it('la lecture ne dit pas ce qu\'elle a écarté et rien ne fuit : non vérifiable', () => {
    const l = tacheComplete(); l.ignoredLines = undefined;
    expect(par(controlesPiece(l))['hors-articles'].ok).toBeNull();
    l.ignoredLines = [];
    expect(par(controlesPiece(l))['hors-articles']).toMatchObject({ ok: true, trouve: 'aucune ligne hors articles' });
  });
});

describe('8 — prix plausible : écart de plus de ×2 contre le stock ou les achats passés', () => {
  const connus = (prix: number, extra = {}) => ({ prixConnus: [{ nom: 'Article C01', prix, source: 'achat' as const, ...extra }] });
  it('BAUHAUS copie : 66,95 lu pour un article connu à 6,95 (×9,6)', () => {
    const c = par(controlesPiece(copieAsLue(), connus(6.95)))['prix-plausible'];
    expect(c.ok).toBe(false);
    expect(c.lignes).toEqual([1]);
    expect(c.trouve).toContain('66,95 contre 6,95 connu (×9,6)');
    expect(c.geste).toMatchObject({ type: 'ouvrir-ligne', lignes: [1] });
  });
  it('la même ligne bien lue : aucun écart, dit sobrement', () => {
    const l = copieAsLue(); l.items = LIGNES_COPIE;
    const c = par(controlesPiece(l, connus(6.95)))['prix-plausible'];
    expect(c.ok).toBe(true);
    expect(c.trouve).toContain('1 prix comparé');
  });
  it('exactement ×2 n\'est pas signalé ; au-delà oui, dans les deux sens', () => {
    const l = copieAsLue(); l.items = LIGNES_COPIE;
    expect(par(controlesPiece(l, connus(13.9)))['prix-plausible'].ok).toBe(true);
    expect(par(controlesPiece(l, connus(14)))['prix-plausible'].ok).toBe(false);
    expect(par(controlesPiece(l, connus(3.4)))['prix-plausible'].ok).toBe(false);
  });
  it('rapprochement par EAN ou référence, pas seulement par nom', () => {
    const l = copieAsLue();
    const ean = l.items[0].reference!;
    const c = par(controlesPiece(l, { prixConnus: [{ nom: 'Autre désignation', ean, prix: 6.95, source: 'stock' }] }))['prix-plausible'];
    expect(c.ok).toBe(false);
  });
  it('une unité différente n\'est pas comparée ; rien de connu : non vérifiable', () => {
    const l = copieAsLue(); l.items[0] = { ...l.items[0], unit: 'kg' };
    expect(par(controlesPiece(l, connus(6.95, { unite: 'g' })))['prix-plausible'].ok).toBeNull();
    expect(par(controlesPiece(l))['prix-plausible']).toMatchObject({ ok: null, trouve: 'aucun prix connu à comparer' });
  });
  it('une ligne à quantité : le prix unitaire se déduit du montant', () => {
    const l: LectureControlee = { items: [{ name: 'Houblon test', quantity: 5, unit: 'kg', price: null, amountTTC: 250 }] };
    const c = par(controlesPiece(l, { prixConnus: [{ nom: 'Houblon test', prix: 20, unite: 'kg', source: 'stock' }] }))['prix-plausible'];
    expect(c.ok).toBe(false); // 50 contre 20 : ×2,5
  });
});

describe('9 — photo incomplète : un drapeau de la lecture, jamais deviné', () => {
  it('BAUHAUS taché : zone coupée ou tachée', () => {
    const c = par(controlesPiece(tacheComplete()))['photo-incomplete'];
    expect(c.ok).toBe(false);
    expect(c.trouve).toBe('zone des montants coupée, pliée ou tachée : bas du ticket taché');
    expect(c.geste.type).toBe('relire-photo');
  });
  it('lisible : ok ; non dit : non vérifiable', () => {
    expect(par(controlesPiece(sun1()))['photo-incomplete'].ok).toBe(true);
    const l = sun1(); l.photoIncomplete = null;
    expect(par(controlesPiece(l))['photo-incomplete'].ok).toBeNull();
  });
});

describe('le drapeau : au moins un contrôle en échec', () => {
  it('Sun Store 1 et 2 : aucun échec (le terminal n\'est pas un drapeau), les CHF concordent', () => {
    expect(controlesEnEchec(controlesPiece(sun1(), { depenses: [DEPENSE_SUN2] }))).toEqual([]);
    expect(controlesEnEchec(controlesPiece(sun2(), { depenses: [DEPENSE_SUN1] }))).toEqual([]);
  });
  it('BAUHAUS taché (vraie lecture) : comptage, brut − rabais et photo ; copie : brut − rabais, doublon et prix', () => {
    expect(controlesEnEchec(controlesPiece(tacheAsLue())).map(c => c.id)).toEqual(['comptage-montants', 'brut-rabais', 'photo-incomplete']);
    expect(controlesEnEchec(controlesPiece(tacheAsLue(), FIABLES)).map(c => c.id)).toEqual(['comptage-montants', 'comptage-ean', 'brut-rabais', 'photo-incomplete']);
    const copie = controlesPiece(copieAsLue(), { depenses: [DEPENSE_TACHE], prixConnus: [{ nom: 'Article C01', prix: 6.95, source: 'achat' }] });
    expect(controlesEnEchec(copie).map(c => c.id)).toEqual(['brut-rabais', 'doublon', 'prix-plausible']);
  });
  it('tout ok est pur : la lecture d\'entrée n\'est pas modifiée', () => {
    const lecture = tacheAsLue(); const avant = JSON.stringify(lecture);
    controlesPiece(lecture, { depenses: [DEPENSE_TACHE] });
    expect(JSON.stringify(lecture)).toBe(avant);
  });
});

describe('limite 1 (b1, 09.11) — payé = montant du terminal quand il égale le total et qu’aucun reçu n’est imprimé', () => {
  const sansRecu = () => { const l = tacheComplete(); l.amountPaid = null; return l; }; // BAUHAUS : une seule ligne « TWINT 352,05 », rangée au terminal
  it('BAUHAUS : payé 352,05 lu au terminal, concorde avec le total', () => {
    expect(payeEffectif({ ...sansRecu(), documentType: 'receipt' })).toEqual({ cts: 35205, source: 'terminal' });
    const c = par(controlesPiece({ ...sansRecu(), documentType: 'receipt' }))['paiement'];
    expect(c.ok).toBe(true);
    expect(c.trouve).toBe('payé 352,05 (TWINT) · lu au terminal, aucun reçu imprimé');
  });
  it('un reçu imprimé l’emporte sur le terminal', () => {
    const l = tacheComplete(); l.amountPaid = 352.05; l.terminalAmount = 352.05;
    expect(payeEffectif(l)).toEqual({ cts: 35205, source: 'recu' });
  });
  it('terminal différent du total (le piège Sun Store, 163,85 pour 14,60) : jamais le payé', () => {
    const l = sun1(); l.amountPaid = null;
    expect(payeEffectif(l)).toBeNull();
    expect(par(controlesPiece(l, { depenses: [DEPENSE_SUN2] }))['paiement'].ok).toBeNull();
  });
  it('seulement un ticket de caisse : une facture dont le terminal égale le total n’y gagne pas de payé', () => {
    expect(payeEffectif({ ...sansRecu(), documentType: 'invoice' })).toBeNull();
    expect(payeEffectif({ ...sansRecu(), documentType: 'receipt' })).not.toBeNull();
  });
  it('ni terminal ni reçu : null, jamais 0', () => {
    const l = tacheComplete(); l.amountPaid = null; l.terminalAmount = null;
    expect(payeEffectif(l)).toBeNull();
    expect(par(controlesPiece(l))['paiement']).toMatchObject({ ok: null, trouve: 'montant payé non lu' });
  });
});

describe('limite 2 (b1, 09.11) — le comptage des montants ne lève un drapeau que confirmé par la 3.8 ou par brut − rabais', () => {
  it('sunstore-1 : deux Flash-Lite comptent 3 pour 2 lignes justes, brut − rabais concorde : aucun drapeau', () => {
    const l = sun1(); l.countedAmounts = 3;
    const c = par(controlesPiece(l, { depenses: [DEPENSE_SUN2] }));
    expect(c['brut-rabais'].ok).toBe(true);
    expect(c['comptage-montants']).toMatchObject({ ok: null, attendu: '3 montants', trouve: '2 lignes avec montant' });
    expect(c['comptage-montants'].ecart).toBeUndefined();
    expect(c['comptage-montants'].geste.type).toBe('rien');
    expect(controlesEnEchec(controlesPiece(l, { depenses: [DEPENSE_SUN2] }))).toEqual([]);
  });
  it('confirmé par la 3.8 : le drapeau revient, même quand les CHF concordent', () => {
    const l = sun1(); l.countedAmounts = 3; l.countedAmountsConfirmed = true;
    expect(par(controlesPiece(l))['comptage-montants']).toMatchObject({ ok: false, ecart: 1, sens: 'manque' });
  });
  it('confirmé par brut − rabais (tache, 23 lignes sur 29) : drapeau ; sans écart de CHF et sans 3.8 : non vérifié', () => {
    expect(par(controlesPiece(tacheAsLue()))['comptage-montants'].ok).toBe(false);
    const l = tacheComplete(); l.amountTTC = 277.6; l.countedAmounts = 28; // les CHF concordent : le 28 d’une lecture seule n’est pas confirmé
    expect(par(controlesPiece(l))['comptage-montants'].ok).toBeNull();
  });
  it('un comptage qui concorde reste « ok », confirmé ou non', () => {
    expect(par(controlesPiece(sun1()))['comptage-montants'].ok).toBe(true);
  });
});
