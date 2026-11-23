// c8 : composes-houblon.json sort du chunk des outils (budget B5) et arrive à part. Avant l'arrivée, pendant, après ;
// jamais un faux zéro ; l'ouverture d'un outil attend les composés avec le chunk (en parallèle) ; un échec n'est pas mémorisé.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import fichier from '../../../src/data/hopV4/composes-houblon.json';
import { ComposesAbsents, DONNEES_COMPOSES, chargerComposes, composesCharges, installerComposes, oublierComposes, siComposesArrivent } from '../../../src/domain/hopIndex/v4/composes';
import { DONNEES_POUVOIR, source } from '../../../src/domain/hopIndex/v4/pouvoir';
import { importerOutilsEtComposes, chargerOutils, oublierOutils, outilsCharges, type Outils } from '../../../src/ui/hopIndex/chargement';
import { huile, compose } from '../../../src/ui/hopIndex/comparer/valeurs';
import { huilesDe } from '../../../src/ui/hopIndex/substituer/donnees';

/** Une promesse qu'on résout à la main : l'arrivée du morceau réseau. */
function differe<T>() {
  let ok!: (v: T) => void; let ko!: (e: unknown) => void;
  const p = new Promise<T>((a, b) => { ok = a; ko = b; });
  return { p, ok, ko };
}
const cleSource = Object.keys((fichier as unknown as { sources: Record<string, unknown> }).sources)[0];
const cleVariete = Object.keys((fichier as unknown as { varietes: Record<string, unknown> }).varietes)[0];

beforeEach(() => { oublierComposes(); oublierOutils(); });
// Les autres fichiers de test comptent sur les composés en synchrone (contexte Vitest) : on les remet.
afterEach(() => { installerComposes(fichier); oublierOutils(); });

describe('composés : avant l\'arrivée', () => {
  it('rien n\'est chargé, les tables sont absentes (jamais vides ni à 0), et le calcul le dit au lieu d\'inventer', () => {
    expect(composesCharges()).toBeNull();
    expect(Object.keys(DONNEES_COMPOSES)).toEqual([]);
    expect((DONNEES_POUVOIR as { varietes?: unknown }).varietes).toBeUndefined();
    expect(() => source(cleSource)).toThrow(ComposesAbsents);
  });
  it('Comparer et Substituer rendent « inconnu » (null), jamais 0, sur les seules valeurs du catalogue', () => {
    // Seules les sources du catalogue (BM, HS) parlent : aucune fiche de composés, donc aucune référence de composes-houblon.json.
    const refsCatalogue = (v: { refs: string[] } | null) => v === null || v.refs.every((r) => r === 'BM' || r === 'HS');
    expect(refsCatalogue(huile(cleVariete))).toBe(true);
    expect(refsCatalogue(compose(cleVariete, 'linalol'))).toBe(true);
    expect(compose(cleVariete, '3MH')).toBeNull();
    const h = huilesDe(cleVariete);
    expect(Object.values(h).every((v) => v === null || (Array.isArray(v) && v.every((x) => x > 0)))).toBe(true);
    expect(h.farnesene).toBeNull();
  });
});

describe('composés : pendant le chargement', () => {
  it('un seul chargement partagé ; l\'abonné attend ; l\'état reste « absent » tant que le morceau n\'est pas là', async () => {
    const d = differe<unknown>();
    const importer = vi.fn(() => d.p);
    const abonne = vi.fn();
    siComposesArrivent(abonne);
    const a = chargerComposes(importer), b = chargerComposes(importer);
    expect(importer).toHaveBeenCalledTimes(1);
    await Promise.resolve();
    expect(composesCharges()).toBeNull();
    expect(abonne).not.toHaveBeenCalled();
    d.ok({ default: fichier });
    await Promise.all([a, b]);
  });
  it('l\'ouverture d\'un outil n\'est pas rendue avant les composés, mais n\'attend pas plus longtemps que le plus lent des deux morceaux', async () => {
    const fauxOutils = { moteur: {} } as unknown as Outils;
    const dFichier = differe<unknown>(); const dOutils = differe<Outils>();
    const ouverture = vi.fn();
    const p = chargerOutils(() => importerOutilsEtComposes(() => dOutils.p, () => dFichier.p)).then(ouverture);
    // Les deux morceaux sont demandés ensemble (parallèle) ; les outils arrivent les premiers : rien n'est rendu.
    dOutils.ok(fauxOutils);
    await new Promise((r) => setTimeout(r, 20));
    expect(outilsCharges()).toBeNull();
    expect(ouverture).not.toHaveBeenCalled();
    expect(composesCharges()).toBeNull();
    // Le fichier arrive : l'outil s'ouvre, composés posés.
    dFichier.ok({ default: fichier });
    await p;
    expect(outilsCharges()).toBe(fauxOutils);
    expect(composesCharges()).not.toBeNull();
  });
});

describe('composés : après l\'arrivée', () => {
  it('les données sont là, l\'identité de l\'objet n\'a pas changé (les références prises avant les voient), l\'abonné est appelé une fois', async () => {
    const avant = DONNEES_POUVOIR;
    const abonne = vi.fn();
    const desabonne = vi.fn();
    siComposesArrivent(abonne);
    const hors = siComposesArrivent(desabonne); hors();
    await chargerComposes(async () => ({ default: fichier }));
    expect(composesCharges()).toBe(DONNEES_COMPOSES);
    expect(DONNEES_POUVOIR).toBe(avant);
    expect(abonne).toHaveBeenCalledTimes(1);
    expect(desabonne).not.toHaveBeenCalled();
    expect(source(cleSource).cle).toBe(cleSource);
    expect(huile(cleVariete)).not.toBeNull();
    // Déjà là : un abonné est appelé tout de suite, et un second chargement n'importe plus rien.
    const tard = vi.fn(); siComposesArrivent(tard); expect(tard).toHaveBeenCalledTimes(1);
    const importer = vi.fn(); await chargerComposes(importer); expect(importer).not.toHaveBeenCalled();
  });
  it('un échec réseau n\'est pas mémorisé : rien n\'est posé, le suivant réessaie', async () => {
    const importer = vi.fn<() => Promise<unknown>>().mockRejectedValueOnce(new Error('réseau')).mockResolvedValueOnce({ default: fichier });
    await expect(chargerComposes(importer)).rejects.toThrow('réseau');
    expect(composesCharges()).toBeNull();
    expect(() => source(cleSource)).toThrow(ComposesAbsents);
    await chargerComposes(importer);
    expect(importer).toHaveBeenCalledTimes(2);
    expect(composesCharges()).not.toBeNull();
  });
  it('un échec du fichier fait échouer l\'ouverture sans la mémoriser : l\'ouverture suivante réessaie', async () => {
    const fauxOutils = { moteur: {} } as unknown as Outils;
    await expect(chargerOutils(() => importerOutilsEtComposes(async () => fauxOutils, async () => { throw new Error('hors ligne'); }))).rejects.toThrow('hors ligne');
    expect(outilsCharges()).toBeNull();
    await chargerOutils(() => importerOutilsEtComposes(async () => fauxOutils, async () => ({ default: fichier })));
    expect(outilsCharges()).toBe(fauxOutils);
  });
});
