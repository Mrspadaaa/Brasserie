/**
 * Allègement des photos du banc, comme l'app (voie k7-ajouts, 08.11, option (c) du pilote).
 *
 * Le serveur refuse un justificatif de plus de 4 Mo (`validateInvoiceFile`) ; l'app ne l'envoie jamais tel quel : `allegerPhoto`
 * (`src/services/pagesJustificatif.ts`) réencode en JPEG une image de plus de `PAGE_OCTETS_MAX`, par les niveaux de `NIVEAUX_PHOTO` (côté long
 * 4096 à 0,85, puis 3200 à 0,85, puis les niveaux du PDF) ; le premier niveau sous 4 Mo gagne. Le banc envoyait l'original : doc15 (8,3 Mo) et
 * doc21 (6,5 Mo) étaient refusés, aucun appel possible. Ici : les MÊMES niveaux (importés de l'app, jamais recopiés), le même ordre, le même
 * gabarit (fond blanc, côté long ramené à `cote`, jamais agrandi) ; un PDF, une image légère ou une image qu'aucun niveau ne fait tenir
 * repartent tels quels (le refus d'aujourd'hui, avec son poids).
 *
 * Outil : `@napi-rs/canvas` du dossier d'outils du banc (`outilsDir()`, hors dépôt), comme le rendu des PDF ; sharp n'est pas installé. Le canvas
 * décode la photo, applique l'orientation EXIF qu'il connaît (le navigateur de l'app l'applique toujours : `imageOrientation: 'from-image'`) et
 * encode en JPEG. Les copies vivent en mémoire (jamais dans le dépôt, jamais sur disque ici) : `os.tmpdir()` n'est utilisé que pour l'échantillon
 * demandé par `--alleger-essai`.
 *
 * Le banc appelle `preparerAllegement(cases)` avant de lire un fichier (`runBench`, `--estimer`) ; `loadCaseFiles` consulte ensuite `ALLEGEES`.
 *
 *   npx vite-node --config vitest.config.ts scripts/banc-lecture-alleger.ts -- --alleger-essai=doc15[,doc21]   (écrit la copie allégée dans os.tmpdir(), dit le poids et les dimensions)
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { NIVEAUX_PHOTO, PAGE_OCTETS_MAX } from '../src/services/pagesJustificatif';
import { SCAN_MAX_BYTES, type InvoiceFile } from '../functions/src/invoiceScanCore';
import { OutilManquant, outilsDir } from './banc-lecture-bandes';
import type { BenchCase } from './banc-lecture-facture';

// Pas d'import d'exécution de `banc-lecture-facture` : il importe ce module (`loadCaseFiles`), un cycle lirait ses constantes avant leur initialisation.
const MIME_PAR_EXTENSION: Record<string, string> = { '.pdf': 'application/pdf', '.png': 'image/png', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg' };
const mimeOfPath = (file: string, fallback: string) => MIME_PAR_EXTENSION[path.extname(file).toLowerCase()] ?? fallback;
const caseFiles = (c: Pick<BenchCase, 'file' | 'files'>): string[] => (c.files?.length ? c.files : [c.file]);

export type Niveau = { cote: number; qualite: number };
/** Un encodeur : l'image (octets), un niveau → le JPEG et ses dimensions. */
export type EncodeurBanc = (octets: Buffer, niveau: Niveau) => Promise<{ octets: Buffer; largeur: number; hauteur: number }>;
export interface Allegee { file: InvoiceFile; niveau: Niveau | null; avant: number; apres: number; largeur?: number; hauteur?: number }

/** Les photos allégées, par chemin absolu du fichier d'origine. Rempli par `preparerAllegement`, lu par `loadCaseFiles`. */
export const ALLEGEES = new Map<string, InvoiceFile>();

const TYPES_IMAGE = ['image/jpeg', 'image/png', 'image/webp'];
export const racineDuDepot = fileURLToPath(new URL('../', import.meta.url));

/** Même logique que `allegerPhoto` : légère, PDF ou type inconnu → telle quelle ; sinon le premier niveau de `NIVEAUX_PHOTO` sous 4 Mo ; aucun ne tient → telle quelle. */
export async function allegerOctets(octets: Buffer, mimeType: string, encoder: EncodeurBanc, niveaux: ReadonlyArray<Niveau> = NIVEAUX_PHOTO): Promise<Allegee> {
  const origine: InvoiceFile = { mimeType, data: octets.toString('base64') };
  if (octets.length <= PAGE_OCTETS_MAX || !TYPES_IMAGE.includes(mimeType)) return { file: origine, niveau: null, avant: octets.length, apres: octets.length };
  try {
    for (const niveau of niveaux) {
      const sortie = await encoder(octets, niveau);
      if (sortie.octets.length <= PAGE_OCTETS_MAX && sortie.octets.length <= SCAN_MAX_BYTES)
        return { file: { mimeType: 'image/jpeg', data: sortie.octets.toString('base64') }, niveau, avant: octets.length, apres: sortie.octets.length, largeur: sortie.largeur, hauteur: sortie.hauteur };
    }
  } catch { /* illisible ici : l'original, refusé comme aujourd'hui */ }
  return { file: origine, niveau: null, avant: octets.length, apres: octets.length };
}

/** L'encodeur réel : `@napi-rs/canvas` du dossier d'outils. Outil absent → `OutilManquant`. */
export async function encodeurCanvasBanc(): Promise<EncodeurBanc> {
  const full = path.join(outilsDir(), 'node_modules', '@napi-rs/canvas/index.js');
  let canvasModule: any;
  try { canvasModule = await import(/* @vite-ignore */ pathToFileURL(full).href); } catch (error: any) { throw new OutilManquant('@napi-rs/canvas', String(error?.code ?? error?.message ?? error).slice(0, 80)); }
  const { createCanvas, loadImage } = canvasModule.default ?? canvasModule;
  return async (octets, niveau) => {
    const image = await loadImage(octets);
    const echelle = Math.min(1, niveau.cote / Math.max(image.width, image.height));
    const largeur = Math.max(1, Math.round(image.width * echelle)), hauteur = Math.max(1, Math.round(image.height * echelle));
    const canvas = createCanvas(largeur, hauteur), contexte = canvas.getContext('2d');
    contexte.fillStyle = '#ffffff'; contexte.fillRect(0, 0, largeur, hauteur);
    contexte.drawImage(image, 0, 0, largeur, hauteur);
    return { octets: canvas.toBuffer('image/jpeg', Math.round(niveau.qualite * 100)), largeur, hauteur };
  };
}

/** Les fichiers des cas qui dépassent 4 Mo : leurs copies allégées entrent dans `ALLEGEES`. Aucun fichier absent, léger ou PDF n'est lu pour rien ; l'encodeur n'est chargé qu'au premier besoin. */
export async function preparerAllegement(cases: readonly BenchCase[], encoder?: EncodeurBanc, log: (line: string) => void = line => console.log(line)): Promise<Allegee[]> {
  const faites: Allegee[] = [];
  let enc = encoder;
  for (const c of cases) for (const name of caseFiles(c)) {
    const full = path.isAbsolute(name) ? name : path.join(racineDuDepot, name);
    if (ALLEGEES.has(full) || !existsSync(full)) continue;
    const mimeType = mimeOfPath(name, c.mimeType);
    const octets = readFileSync(full);
    if (octets.length <= PAGE_OCTETS_MAX || !TYPES_IMAGE.includes(mimeType)) continue;
    enc ??= await encodeurCanvasBanc();
    const alleg = await allegerOctets(octets, mimeType, enc);
    faites.push(alleg);
    if (alleg.niveau) {
      ALLEGEES.set(full, alleg.file);
      log(`Allégée comme l'app : ${c.id}, ${(alleg.avant / 1048576).toFixed(1).replace('.', ',')} Mo → ${(alleg.apres / 1048576).toFixed(1).replace('.', ',')} Mo (côté long ${alleg.niveau.cote}, qualité ${alleg.niveau.qualite}) ; copie en mémoire, aucune écriture.`);
    } else log(`Non allégée : ${c.id} (${(alleg.avant / 1048576).toFixed(1).replace('.', ',')} Mo) : aucun niveau ne la fait tenir sous 4 Mo, refus comme aujourd'hui.`);
  }
  return faites;
}

async function essai(ids: string[]) {
  const { casPath, loadCases } = await import('./banc-lecture-facture');
  const cases = loadCases(['cas.json', 'cas-2.json', 'cas-3.json', 'cas-4.json', 'cas-5.json', 'cas-6.json'].map(casPath).filter(file => existsSync(file))).filter(c => ids.includes(c.id));
  const enc = await encodeurCanvasBanc(), dir = path.join(tmpdir(), 'banc-alleger-essai');
  mkdirSync(dir, { recursive: true });
  for (const c of cases) {
    const full = path.join(racineDuDepot, caseFiles(c)[0]);
    const alleg = await allegerOctets(readFileSync(full), mimeOfPath(full, c.mimeType), enc);
    const target = path.join(dir, `${c.id}.jpg`);
    writeFileSync(target, Buffer.from(alleg.file.data, 'base64'));
    console.log(`${c.id} : ${(alleg.avant / 1048576).toFixed(2)} Mo → ${(alleg.apres / 1048576).toFixed(2)} Mo, niveau ${alleg.niveau ? `${alleg.niveau.cote}@${alleg.niveau.qualite}` : 'aucun'}, ${alleg.largeur ?? '?'}×${alleg.hauteur ?? '?'} → ${target}`);
  }
}
const lancer = !process.env.VITEST && process.argv.some(arg => arg.startsWith('--alleger-essai='));
if (lancer) essai((process.argv.find(arg => arg.startsWith('--alleger-essai=')) ?? '').slice('--alleger-essai='.length).split(',').filter(Boolean)).then(() => process.exit(0), error => { console.error(`ALLEGER ECHEC : ${error instanceof Error ? error.message : String(error)}`); process.exit(1); });
