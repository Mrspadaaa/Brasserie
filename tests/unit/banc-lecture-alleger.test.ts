import { afterEach, describe, expect, it } from 'vitest';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { ALLEGEES, allegerOctets, preparerAllegement, type EncodeurBanc } from '../../scripts/banc-lecture-alleger';
import { BudgetStop, Budget, FAULT_PLAN, loadCaseFiles, type BenchCase } from '../../scripts/banc-lecture-facture';
import { NIVEAUX_PHOTO, PAGE_OCTETS_MAX } from '../../src/services/pagesJustificatif';

// Données fabriquées : des octets sans image, un encodeur factice. Aucun vrai document, aucun réseau.
const MO = 1024 * 1024;
const gros = (mo: number) => Buffer.alloc(Math.round(mo * MO), 7);
const jpeg = (octets: number) => Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe0]), Buffer.alloc(octets, 1), Buffer.from([0xff, 0xd9])]);

describe('allègement des photos du banc — les niveaux de l\'app', () => {
  it('les niveaux sont ceux de `allegerPhoto` : 4096 à 0,85 puis 3200 à 0,85, puis les niveaux du PDF', () => {
    expect(NIVEAUX_PHOTO.slice(0, 2)).toEqual([{ cote: 4096, qualite: 0.85 }, { cote: 3200, qualite: 0.85 }]);
    expect(NIVEAUX_PHOTO.length).toBeGreaterThan(2);
    expect(PAGE_OCTETS_MAX).toBe(4 * MO);
  });

  it('une image légère, un PDF ou un type inconnu repartent tels quels, sans appeler l\'encodeur', async () => {
    let appels = 0;
    const encoder: EncodeurBanc = async () => { appels++; return { octets: jpeg(10), largeur: 1, hauteur: 1 }; };
    expect((await allegerOctets(gros(1), 'image/jpeg', encoder)).niveau).toBeNull();
    expect((await allegerOctets(gros(6), 'application/pdf', encoder)).niveau).toBeNull();
    expect((await allegerOctets(gros(6), 'image/gif', encoder)).niveau).toBeNull();
    expect(appels).toBe(0);
  });

  it('une photo de plus de 4 Mo : le premier niveau sous 4 Mo gagne, dans l\'ordre', async () => {
    const vus: string[] = [];
    // le premier niveau (4096) donne encore 5 Mo, le deuxième (3200) tient
    const encoder: EncodeurBanc = async (_octets, niveau) => { vus.push(`${niveau.cote}@${niveau.qualite}`); return { octets: jpeg(niveau.cote === 4096 ? 5 * MO : 3 * MO), largeur: niveau.cote, hauteur: niveau.cote }; };
    const alleg = await allegerOctets(gros(8), 'image/jpeg', encoder);
    expect(vus).toEqual(['4096@0.85', '3200@0.85']);
    expect(alleg.niveau).toEqual({ cote: 3200, qualite: 0.85 });
    expect(alleg.file.mimeType).toBe('image/jpeg');
    expect(Buffer.from(alleg.file.data, 'base64').length).toBeLessThanOrEqual(PAGE_OCTETS_MAX);
    expect(alleg.apres).toBeLessThan(alleg.avant);
  });

  it('le premier niveau qui tient arrête la recherche', async () => {
    const vus: number[] = [];
    const encoder: EncodeurBanc = async (_o, niveau) => { vus.push(niveau.cote); return { octets: jpeg(2 * MO), largeur: 1, hauteur: 1 }; };
    expect((await allegerOctets(gros(7), 'image/png', encoder)).niveau).toEqual({ cote: 4096, qualite: 0.85 });
    expect(vus).toEqual([4096]);
  });

  it('aucun niveau ne tient, ou l\'encodeur échoue : l\'original, refusé comme aujourd\'hui', async () => {
    const trop: EncodeurBanc = async () => ({ octets: jpeg(5 * MO), largeur: 1, hauteur: 1 });
    const casse: EncodeurBanc = async () => { throw new Error('illisible'); };
    for (const encoder of [trop, casse]) {
      const alleg = await allegerOctets(gros(8), 'image/jpeg', encoder);
      expect(alleg.niveau).toBeNull();
      expect(alleg.apres).toBe(alleg.avant);
    }
  });
});

describe('allègement des photos du banc — branché dans la lecture des fichiers', () => {
  let dossier = '';
  afterEach(() => { ALLEGEES.clear(); if (dossier) rmSync(dossier, { recursive: true, force: true }); dossier = ''; });

  it('une photo de 5 Mo (fichier dans os.tmpdir()) passe par `loadCaseFiles` allégée, au lieu d\'être refusée ; la légère reste intacte', async () => {
    dossier = mkdtempSync(path.join(tmpdir(), 'banc-alleger-test-'));
    const lourde = path.join(dossier, 'lourde.jpg'), legere = path.join(dossier, 'legere.jpg');
    writeFileSync(lourde, jpeg(5 * MO)); writeFileSync(legere, jpeg(1000));
    const cas = (id: string, file: string): BenchCase => ({ id, file, mimeType: 'image/jpeg', expected: {} });
    const cases = [cas('lourde', lourde), cas('legere', legere)];
    // sans allègement : refusé par le contrôle du serveur
    expect(() => loadCaseFiles(cases[0], false)).toThrow(/4 Mo/);
    const lignes: string[] = [];
    const faites = await preparerAllegement(cases, async () => ({ octets: jpeg(2 * MO), largeur: 3072, hauteur: 4096 }), line => lignes.push(line));
    expect(faites).toHaveLength(1);
    expect(lignes.join('\n')).toContain('lourde');
    expect(lignes.join('\n')).not.toContain(dossier);
    const [fichier] = loadCaseFiles(cases[0], false);
    expect(Buffer.from(fichier.data, 'base64').length).toBeLessThanOrEqual(4 * MO);
    expect(loadCaseFiles(cases[1], false)[0].data).toBe(jpeg(1000).toString('base64'));
  });

  it('un fichier absent est ignoré (jamais lu pour rien)', async () => {
    const faites = await preparerAllegement([{ id: 'x', file: path.join(tmpdir(), 'banc-absent-jamais.jpg'), mimeType: 'image/jpeg', expected: {} }], async () => { throw new Error('ne doit pas être appelé'); }, () => undefined);
    expect(faites).toEqual([]);
  });
});

describe('budget et simulation du passage payant (k7)', () => {
  it('--budget-chf est un plafond de CUMUL : 1,2 CHF alors que 8,65 sont déjà journalisés arrête la passe au premier appel', () => {
    expect(() => new Budget(1.2e6, 8.65e6, 1.2e6).reserve(1000)).toThrow(BudgetStop);
    // le bon réglage d'une passe d'environ 1 CHF : le cumul + 1,2 et le plafond de passe 1,2
    expect(() => new Budget(9.85e6, 8.65e6, 1.2e6).reserve(1000)).not.toThrow();
    expect(() => new Budget(9.85e6, 8.65e6, 1.2e6).reserve(1.3e6)).toThrow(BudgetStop);
  });

  it('la simulation glisse un faux vert que la production ne peut pas voir : une date plausible, la même dans les deux lectures, sur une pièce par ailleurs vérifiée', () => {
    const faute = FAULT_PLAN.find(item => item.id === 'date-plausible-propre');
    expect(faute).toBeDefined();
    expect(faute!.doc).toBe('doc13');
    expect(faute!.edits).toEqual([{ path: 'date', value: '14.03.2026' }]);
    // les deux lectures de chaque variante principale (A, C, Csv8) : le vote ne peut pas diverger
    for (const famille of ['f1', 'f2', 'l1', 'l2', 'e1', 'e2']) expect(faute!.families).toContain(famille);
  });
});
