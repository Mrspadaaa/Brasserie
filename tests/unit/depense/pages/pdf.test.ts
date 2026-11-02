/**
 * Voie n2-pages, P4 : les pages deviennent un seul justificatif PDF (jsPDF réel, encodeur de pages simulé). Environnement Node : jsPDF y reçoit de vrais `Uint8Array`
 * (sous jsdom, un tableau d'octets d'un autre « monde » n'est pas reconnu) ; le repli de l'encodeur par défaut est dans `encodeur.test.ts` (jsdom).
 * T-P1 N pages dans l'ordre · T-P2 la réduction par niveaux · T-P3 le rejet · T-P4 les formats · T-P5 l'empreinte des pages.
 */
import { describe, expect, it } from 'vitest';
import { createHash } from 'node:crypto';
import { assemblerPdf, empreinteDePage, empreinteDesPages, NIVEAUX, PLAFOND_PDF_OCTETS } from '../../../../src/services/pagesJustificatif';

/** Un JPEG minimal que jsPDF sait mesurer (SOI, SOF0 3 composantes, EOI), complété par `octets` octets de remplissage après l'EOI. */
const jpegFactice = (largeur: number, hauteur: number, marque: number, octets = 0): Uint8Array => {
  const tete = [0xff, 0xd8, 0xff, 0xc0, 0x00, 0x11, 0x08, hauteur >> 8, hauteur & 255, largeur >> 8, largeur & 255, 0x03, 0x01, 0x22, 0x00, 0x02, 0x11, 0x01, 0x03, 0x11, 0x01, 0xff, 0xd9];
  const sortie = new Uint8Array(tete.length + octets);
  sortie.set(tete); sortie.fill(marque, tete.length);
  return sortie;
};
const page = (nom: string, contenu = nom) => new File([contenu], nom, { type: 'image/jpeg' });
/** Lit un File assemblé, en latin1 (les octets du PDF). */
const octetsDe = async (file: File) => new TextDecoder('latin1').decode(await file.arrayBuffer());
const pagesDuPdf = (pdf: string) => (pdf.match(/\/Type \/Page\b/g) ?? []).length;

describe('T-P1 un PDF d\'une page par image, dans l\'ordre', () => {
  it('3 images → /Type /Page compté 3 fois ; les marqueurs d\'image sont dans l\'ordre d\'ajout', async () => {
    const encoder = vi.fn(async (file: File) => ({ octets: jpegFactice(40, 60, file.name === 'a.jpg' ? 0x41 : file.name === 'b.jpg' ? 0x42 : 0x43, 20), largeur: 40, hauteur: 60 }));
    const sortie = await assemblerPdf([page('a.jpg'), page('b.jpg'), page('c.jpg')], { encoder });
    const pdf = await octetsDe(sortie.file);
    expect(sortie.file.type).toBe('application/pdf');
    expect(sortie.file.name).toBe('Justificatif-3-pages.pdf');
    expect(pagesDuPdf(pdf)).toBe(3);
    expect(sortie.reduite).toBe(false);
    const ordre = ['A', 'B', 'C'].map(m => pdf.indexOf(m.repeat(20)));
    expect(ordre.every(i => i > 0)).toBe(true);
    expect([...ordre].sort((x, y) => x - y)).toEqual(ordre);
    expect(sortie.octets).toBe(sortie.file.size);
  });
});

describe('T-P2 / T-P3 la réduction par niveaux, puis le rejet', () => {
  /** Un encodeur dont le poids suit l'échelle : 2 Mo par page au premier niveau, puis moins. */
  const poids = [2_200_000, 1_200_000, 700_000, 400_000];
  const encodeurParNiveau = (table: number[]) => vi.fn(async (_f: File, niveau: { cote: number; qualite: number }) => ({ octets: jpegFactice(40, 60, 0x44, table[NIVEAUX.findIndex(n => n.cote === niveau.cote)]), largeur: 40, hauteur: 60 }));
  it('T-P2 : trois pages de 2,2 Mo (6,6 Mo) → le niveau suivant qui tient, reduite:true, PDF ≤ 3,9 Mo', async () => {
    const encoder = encodeurParNiveau(poids);
    const sortie = await assemblerPdf([page('a.jpg'), page('b.jpg'), page('c.jpg')], { encoder });
    expect(sortie.reduite).toBe(true);
    expect(sortie.octets).toBeLessThanOrEqual(PLAFOND_PDF_OCTETS);
    expect(NIVEAUX.length).toBe(4);
    expect(encoder.mock.calls.some(([, n]) => n.cote === NIVEAUX[1].cote)).toBe(true);
    expect(encoder.mock.calls.some(([, n]) => n.cote === NIVEAUX[2].cote)).toBe(false);
  });
  it('T-P3 : aucun niveau ne tient → rejet clair, dit avant toute lecture', async () => {
    const encoder = encodeurParNiveau([4_000_000, 4_000_000, 4_000_000, 4_000_000]);
    await expect(assemblerPdf([page('a.jpg'), page('b.jpg')], { encoder })).rejects.toThrow(/trop lourdes pour le Drive même réduites : retire une page/);
    expect(encoder.mock.calls.length).toBe(NIVEAUX.length * 2);
  });
});

describe('T-P4 une page par format d\'image', () => {
  it('une page paysage et une portrait → deux MediaBox différentes (largeur 210 mm)', async () => {
    const encoder = async (file: File) => file.name === 'large.jpg'
      ? { octets: jpegFactice(80, 40, 0x50), largeur: 80, hauteur: 40 } : { octets: jpegFactice(40, 80, 0x51), largeur: 40, hauteur: 80 };
    const pdf = await octetsDe((await assemblerPdf([page('large.jpg'), page('haut.jpg')], { encoder })).file);
    const boites = [...pdf.matchAll(/\/MediaBox \[0 0 ([\d.]+) ([\d.]+)\]/g)].map(m => [Number(m[1]), Number(m[2])]);
    expect(boites).toHaveLength(2);
    expect(boites[0][0]).toBeGreaterThan(boites[0][1]);
    expect(boites[1][0]).toBeLessThan(boites[1][1]);
    expect(Math.min(...boites[0])).toBeCloseTo(210 / 25.4 * 72 / 2, 0);
  });
});

describe('T-P5 l\'empreinte des pages : octets bruts, ordre, déterministe', () => {
  const sha = (octets: Buffer | Uint8Array) => createHash('sha256').update(octets).digest();
  it('= sha256 de la concaténation des sha256 bruts (la formule du serveur) ; autre ordre → autre ; deux appels → égaux', async () => {
    const [a, b, c] = [page('a.jpg', 'page A'), page('b.jpg', 'page B'), page('c.jpg', 'page C')];
    const hex = await Promise.all([a, b, c].map(empreinteDePage));
    expect(hex[0]).toBe(sha(Buffer.from('page A')).toString('hex'));
    const attendu = createHash('sha256').update(Buffer.concat(['page A', 'page B', 'page C'].map(t => sha(Buffer.from(t))))).digest('hex');
    expect(await empreinteDesPages(hex)).toBe(attendu);
    expect(await empreinteDesPages(hex)).toBe(await empreinteDesPages(hex));
    expect(await empreinteDesPages([...hex].reverse())).not.toBe(attendu);
    const surLesChaines = createHash('sha256').update(hex.join('')).digest('hex');
    expect(attendu).not.toBe(surLesChaines);
  });
});
