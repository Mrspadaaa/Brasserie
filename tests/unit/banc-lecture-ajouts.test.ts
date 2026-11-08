import { describe, expect, it } from 'vitest';
import { makePoint, type ScanPoint } from '../../functions/src/invoiceControls';
import { ajoutsDuBanc, compterAjouts, lignesEnTrop, mesurerAjouts, renderAjouts } from '../../scripts/banc-lecture-ajouts';
import type { BenchCase, DrawRecord } from '../../scripts/banc-lecture-facture';

// Données fabriquées : aucune valeur d'un vrai document, aucun appel réseau.
const ligne = (n: number, extra: Record<string, unknown> = {}) => ({ id: `line-${n}`, name: `Article ${n}`, kind: 'stock', quantity: 2, unit: 'kg', price: 5, amountTTC: 10, ...extra });
/** Une lecture finale : tout juste et sans point, sauf ce que le test change. */
const lecture = (extra: Record<string, unknown> = {}) => ({
  vendor: 'Fournisseur', date: '', currency: 'CHF', invoiceNumber: 'F-1', orderNumber: '', amountHT: null, tvaAmount: null, tvaRate: null, amountTTC: 10,
  paymentEvidence: 'unknown', items: [ligne(1)], points: [], issues: [], fieldWarnings: [], rejets: [], review: { status: 'checked' }, ...extra,
});
/** La vérité : une date non imprimée, ni commande ni TVA, une ligne dont la quantité est inconnue. */
const verite = (extra: Record<string, unknown> = {}) => ({
  vendor: 'Fournisseur', date: '', currency: 'CHF', invoiceNumber: ['F-1'], orderNumber: '', amountHT: null, tvaAmount: null, amountTTC: 10, tvaRate: null,
  paymentEvidence: ['unknown'], items: [{ name: 'Article 1', quantity: 2, unit: 'kg', price: 5, amountTTC: 10 }], ...extra,
});
/** Un désaccord des lectures sur un champ d'en-tête ; `pese: false` = une majorité a tranché (l'écran ne le montre pas). */
const desaccord = (champ: string, pese: boolean, ligneRang: number | null = null, cellule = champ): ScanPoint => ({
  ...makePoint('lectures-divergentes' as never, 'ecart', champ as never, ligneRang, { regle: 'test', message: 'les lectures diffèrent', unite: 'texte', enjeu: 'info', origine: 'lecture', champs: [cellule] }), source: 'désaccord', pese,
});
/** Une ligne en trop à zéro franc : le total des lignes reste juste, aucun écart de somme ne la signale par ailleurs. */
const enTrop = (extra: Record<string, unknown> = {}) => ligne(2, { name: 'Zébulon', quantity: 1, price: 0, amountTTC: 0, ...extra });
const champs = (list: ReturnType<typeof mesurerAjouts>) => list.map(a => `${a.champ}${a.signalee ? ':S' : ':N'}`).sort();

describe('ajouts non signalés — l\'en-tête', () => {
  it('une date lue quand la vérité n\'en a pas et qu\'aucun point ne la vise : ajout NON signalé', () => {
    const ajouts = mesurerAjouts(lecture({ date: '15.10.2026' }), verite());
    expect(champs(ajouts)).toEqual(['date:N']);
    expect(ajouts[0].genre).toBe('entete');
    expect(ajouts[0].precise).toBe(false);
  });

  it('le même ajout est signalé quand un désaccord qui pèse vise la date', () => {
    const ajouts = mesurerAjouts(lecture({ date: '15.10.2026', points: [desaccord('date', true)] }), verite());
    expect(champs(ajouts)).toEqual(['date:S']);
    expect(ajouts[0].via).toContain('lectures-divergentes');
    expect(ajouts[0].precise).toBe(true);
  });

  it('un désaccord qui ne pèse pas (une majorité a tranché) ne signale rien : l\'écran ne le montre pas', () => {
    expect(champs(mesurerAjouts(lecture({ date: '15.10.2026', points: [desaccord('date', false)] }), verite()))).toEqual(['date:N']);
  });

  it('un point sur un AUTRE champ ne signale pas la date', () => {
    expect(champs(mesurerAjouts(lecture({ date: '15.10.2026', points: [desaccord('amountTTC', true)] }), verite()))).toEqual(['date:N']);
  });

  it('un `fieldWarnings` du champ le signale', () => {
    const ajouts = mesurerAjouts(lecture({ date: '15.10.2026', fieldWarnings: [{ field: 'date', message: 'date incertaine' }] }), verite());
    expect(champs(ajouts)).toEqual(['date:S']);
    expect(ajouts[0].via).toContain('fieldWarnings');
  });

  it('la case « numéro » porte aussi le n° de commande : un doute sur le n° de facture signale un n° de commande ajouté (mesure large), pas la mesure étroite', () => {
    const ajouts = mesurerAjouts(lecture({ orderNumber: 'C-9', points: [desaccord('invoiceNumber', true)] }), verite());
    expect(champs(ajouts)).toEqual(['orderNumber:S']);
    expect(ajouts[0].precise).toBe(false);
  });

  it('HT, TVA et taux : ajoutés quand la vérité dit null ; la case « TVA » signalée par un point de TVA', () => {
    const lu = lecture({ amountHT: 9.25, tvaAmount: 0.75, tvaRate: 0.081 });
    expect(champs(mesurerAjouts(lu, verite()))).toEqual(['amountHT:N', 'tvaAmount:N', 'tvaRate:N']);
    expect(champs(mesurerAjouts({ ...lu, points: [desaccord('vat', true)] }, verite()))).toEqual(['amountHT:S', 'tvaAmount:S', 'tvaRate:S']);
  });

  it('le paiement « paid » affirmé sans que la vérité l\'admette est un ajout ; « unknown » n\'en est pas un', () => {
    expect(champs(mesurerAjouts(lecture({ paymentEvidence: 'paid' }), verite()))).toEqual(['paymentEvidence:N']);
    expect(champs(mesurerAjouts(lecture({ paymentEvidence: 'unpaid' }), verite()))).toEqual(['paymentEvidence:N']);
    expect(mesurerAjouts(lecture({ paymentEvidence: 'unknown' }), verite())).toEqual([]);
    expect(mesurerAjouts(lecture({ paymentEvidence: 'paid' }), verite({ paymentEvidence: ['paid', 'unknown'] }))).toEqual([]);
  });

  it('une absence n\'est pas un ajout : champ vide ou null du résultat, vérité pleine ou vide', () => {
    expect(mesurerAjouts(lecture(), verite())).toEqual([]);
    expect(mesurerAjouts(lecture({ date: '' }), verite({ date: '15.10.2026' }))).toEqual([]);
    expect(mesurerAjouts(lecture({ date: null, tvaAmount: null, amountHT: undefined }), verite())).toEqual([]);
    // une valeur lue que la vérité admet (même parmi des alternatives) n'est pas un ajout
    expect(mesurerAjouts(lecture({ tvaAmount: 0.7 }), verite({ tvaAmount: [0.7, null] }))).toEqual([]);
    expect(mesurerAjouts(lecture({ date: '15.10.2026' }), verite({ date: '15.10.2026' }))).toEqual([]);
  });

  it('un champ que la vérité ne juge pas (clé absente) n\'est jamais un ajout ; le fournisseur vide de la vérité est « non jugé »', () => {
    const { date: _date, ...sansDate } = verite();
    expect(mesurerAjouts(lecture({ date: '15.10.2026' }), sansDate)).toEqual([]);
    expect(mesurerAjouts(lecture({ vendor: 'Autre' }), verite({ vendor: '' }))).toEqual([]);
  });

  it('une lecture absente (échec) ne donne rien', () => {
    expect(mesurerAjouts(null, verite())).toEqual([]);
  });
});

describe('ajouts non signalés — les lignes', () => {
  it('une ligne en plus de la vérité, sans point : ajout non signalé', () => {
    const ajouts = mesurerAjouts(lecture({ items: [ligne(1), enTrop()] }), verite());
    expect(champs(ajouts)).toEqual(['items.1:N']);
    expect(ajouts[0].genre).toBe('ligne');
    expect(ajouts[0].rang).toBe(2);
  });

  it('la ligne en trop est repérée par son nom, pas seulement par la queue de la liste', () => {
    const lues = [ligne(1, { name: 'Intrus' }), ligne(2, { name: 'Article 1' })];
    expect(lignesEnTrop(lues, [{ name: 'Article 1' }])).toEqual([0]);
    expect(lignesEnTrop([ligne(1)], [{ name: 'Article 1' }])).toEqual([]);
    expect(lignesEnTrop([], [{ name: 'Article 1' }])).toEqual([]);
  });

  it('une ligne en plus visée par un point qui pèse (rang de la ligne) est signalée ; le point d\'une autre ligne non', () => {
    const lu = (rang: number) => lecture({ items: [ligne(1), enTrop()], points: [desaccord('items', true, rang, `items.${rang}.name`)] });
    expect(champs(mesurerAjouts(lu(2), verite()))).toEqual(['items.1:S']);
    expect(champs(mesurerAjouts(lu(1), verite()))).toEqual(['items.1:N']);
  });

  it('une ligne dite ambiguë par la lecture est signalée', () => {
    const items = [ligne(1), enTrop({ ambiguity: 'peut-être un doublon' })];
    expect(champs(mesurerAjouts(lecture({ items, points: [desaccord('items', true, 2, 'items.2.name')] }), verite()))).toEqual(['items.1:S']);
    expect(champs(mesurerAjouts(lecture({ items }), verite()))).toEqual(['items.1:S']);
  });

  it('un doute sur la liste seule (« Lignes ») est une information, il ne signale pas la ligne en trop', () => {
    const items = [ligne(1), enTrop()];
    const ajouts = mesurerAjouts(lecture({ items, points: [desaccord('items', true, null, 'items')] }), verite());
    expect(champs(ajouts)).toEqual(['items.1:N']);
    expect(ajouts[0].listeSignalee).toBe(true);
  });

  it('le port (D249) n\'est pas une ligne : un port lu en plus n\'est pas un ajout', () => {
    const port = ligne(2, { name: 'Port', kind: 'shipping', quantity: null, price: null, amountTTC: 7 });
    expect(mesurerAjouts(lecture({ items: [ligne(1), port] }), verite())).toEqual([]);
  });

  it('une ligne que la vérité marque invisible existe : la lire n\'est pas un ajout', () => {
    const attendues = [{ name: 'Article 1', quantity: 2, unit: 'kg', price: 5, amountTTC: 10 }, { name: 'Cachée', invisible: true, quantity: 1 }];
    expect(mesurerAjouts(lecture({ items: [ligne(1), ligne(2, { name: 'Cachée' })] }), verite({ items: attendues }))).toEqual([]);
  });

  it('moins de lignes que la vérité : une absence, pas un ajout', () => {
    expect(mesurerAjouts(lecture({ items: [] }), verite())).toEqual([]);
  });
});

describe('ajouts non signalés — les valeurs de ligne', () => {
  const veriteSansQuantite = (extra: Record<string, unknown> = {}) => verite({ items: [{ name: 'Article 1', quantity: null, unit: 'kg', price: null, amountTTC: 10, ...extra }] });

  it('une quantité et un prix lus quand la vérité dit null : ajouts non signalés', () => {
    expect(champs(mesurerAjouts(lecture({ items: [ligne(1, { amountTTC: 10 })] }), veriteSansQuantite()))).toEqual(['items.0.price:N', 'items.0.quantity:N']);
  });

  it('un point qui pèse et vise la case (quantité × prix ≠ montant) signale la quantité et le prix de cette ligne', () => {
    const lu = lecture({ items: [ligne(1, { quantity: 3, price: 5, amountTTC: 10 })] });
    const ajouts = mesurerAjouts({ ...lu, points: [{ ...makePoint('ligne-montant', 'ecart', 'items', 1, { regle: 'C1', message: 'Ligne 1 : quantité × prix ≠ montant', unite: 'centimes', enjeu: 'argent', champs: ['items.1.quantity', 'items.1.price', 'items.1.amountTTC'] }) }] }, veriteSansQuantite());
    expect(champs(ajouts)).toEqual(['items.0.price:S', 'items.0.quantity:S']);
  });

  it('une valeur que la vérité donne, ou une clé non jugée, n\'est pas un ajout', () => {
    expect(mesurerAjouts(lecture(), verite())).toEqual([]);
    const { quantity: _q, ...sansQuantite } = { name: 'Article 1', quantity: null, unit: 'kg', price: 5, amountTTC: 10 };
    expect(mesurerAjouts(lecture(), verite({ items: [sansQuantite] }))).toEqual([]);
  });

  it('une quantité absente du résultat quand la vérité dit null : rien (l\'inconnu n\'est jamais 0)', () => {
    expect(mesurerAjouts(lecture({ items: [ligne(1, { quantity: null, price: null })] }), veriteSansQuantite())).toEqual([]);
  });
});

describe('ajouts non signalés — le banc', () => {
  const cas = (expected: Record<string, unknown>): BenchCase => ({ id: 'docX', file: 'x.jpg', mimeType: 'image/jpeg', expected });
  const run = (result: unknown) => ({ ids: [], calls: 1, ms: 1, costMicroChf: 0, costUnknown: 0, result });
  const record = (variants: Record<string, unknown>): DrawRecord => ({ doc: 'docX', tirage: 1, readings: [], variants: variants as DrawRecord['variants'] });

  it('compte par variante : signalé, non signalé, et sous un statut « vérifié »', () => {
    const records = [record({
      Csv8: run(lecture({ date: '15.10.2026', paymentEvidence: 'paid', points: [desaccord('date', true)], review: { status: 'checked' } })),
      A: run(lecture({ date: '15.10.2026', review: { status: 'disputed' } })),
      B: run(null),
    })];
    const tirages = ajoutsDuBanc(records, [cas(verite())]);
    const compte = compterAjouts(tirages);
    expect(compte.Csv8).toMatchObject({ tirages: 1, ajouts: 2, nonSignales: 1, sousVert: 1 });
    expect(compte.A).toMatchObject({ ajouts: 1, nonSignales: 1, sousVert: 0 });
    expect(compte.B).toBeUndefined();
  });

  it('le tableau publiable ne contient aucune valeur de la pièce', () => {
    const tirages = ajoutsDuBanc([record({ Csv8: run(lecture({ date: '15.10.2026', invoiceNumber: 'F-1', orderNumber: 'ZZ-SECRET-42' })) })], [cas(verite())]);
    const table = renderAjouts(tirages, ['banc-fictif']);
    expect(table).not.toContain('15.10.2026');
    expect(table).not.toContain('ZZ-SECRET-42');
    expect(table).toContain('orderNumber');
    expect(table).toContain('date');
  });

  it('un cas inconnu est une erreur, pas un silence', () => {
    expect(() => ajoutsDuBanc([record({ Csv8: run(lecture()) })], [{ ...cas(verite()), id: 'autre' }])).toThrow(/Cas inconnu/);
  });
});
