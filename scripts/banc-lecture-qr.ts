/**
 * +Q — le QR-facture comme garde-fou gratuit du banc, voie k5-vision (01.11). Hors ligne : aucun appel, aucune clé.
 *
 * zxing-wasm lit le QR des images du banc (et des PDF, rendus à 3× par pdf.js) ; `parseSwissQr` et `confronterQr` (src/services/qrFacture.ts,
 * voie qr-logique) disent, champ par champ, ce que le QR confirme ou contredit dans une lecture. Pour chaque variante et chaque parcours :
 * un champ que le QR porte (montant, devise, n° de facture, date) et qui DIFFÈRE du résultat interdit le statut `checked` (il devient `disputed`)
 * et le QR propose sa valeur. Le banc compte, avant et après : champs justes, faux verts, alertes ajoutées (justes ou inutiles), champs corrigés
 * ou gâtés par la valeur proposée. Un QR absent ou invalide ne confirme ni ne contredit rien ; plusieurs QR sur une pièce (bulletins) : un champ
 * n'est contredit que si AUCUN QR ne le confirme. Le créancier n'est pas un garde-fou (une raison sociale s'écrit de plusieurs façons).
 *
 * Le tableau ne contient aucune valeur des documents : des comptes, des noms de champs.
 *
 *   npx vite-node --config vitest.config.ts scripts/banc-lecture-qr.ts -- --qr=<sortie du banc>[,<autre>…] [--cas=cas.json,cas-4.json] [--out=<fichier.md>]
 * (la forme `--clé=valeur` : le jugement importé ne prend jamais un argument nu pour un dossier de banc.)
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { confronterQr, parseSwissQr, type LectureQr, type QrFacture } from '../src/services/qrFacture';
import { CAS_FILES, REELS_DIR, casPath, genreOfCase, isNId, loadCases, orderVariants, variantLabel, type BenchCase, type DrawRecord } from './banc-lecture-facture';
import { judgeResult } from './banc-lecture-facture-juger';
import { pathToFileURL } from 'node:url';
import { OutilManquant, loadQrReader, outilsDir, type PdfRenderer, type QrImageReader } from './banc-lecture-bandes';

// ---------------------------------------------------------------------------------------------------------------------
// Le pur : contradictions et correctifs
// ---------------------------------------------------------------------------------------------------------------------
/** Les quatre champs que le QR porte et qui servent de garde-fou, avec leur chemin dans un résultat de lecture. */
export type QrField = 'montant' | 'devise' | 'numero' | 'date';
export const QR_FIELDS: ReadonlyArray<{ field: QrField; path: 'amountTTC' | 'currency' | 'invoiceNumber' | 'date' }> = [
  { field: 'montant', path: 'amountTTC' }, { field: 'devise', path: 'currency' }, { field: 'numero', path: 'invoiceNumber' }, { field: 'date', path: 'date' }
];
export interface QrProposal { field: QrField; path: string; qr: number | string; lecture: number | string | null }

const isoToFr = (iso: string) => { const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso); return m ? `${m[3]}.${m[2]}.${m[1]}` : iso; };

/**
 * Les champs que le QR contredit dans cette lecture : un champ est contredit si au moins un QR valide le contredit et qu'aucun QR valide ne le
 * confirme. Chaque proposition porte la valeur du QR, dans la forme d'un résultat de lecture (date en JJ.MM.AAAA).
 */
export function qrContradictions(qrs: Array<QrFacture | null>, lecture: LectureQr): QrProposal[] {
  const valid = qrs.filter((qr): qr is QrFacture => !!qr && qr.valid);
  if (!valid.length) return [];
  const confrontations = valid.map(qr => confronterQr(qr, lecture));
  const proposals: QrProposal[] = [];
  for (const { field, path: where } of QR_FIELDS) {
    const states = confrontations.map(one => (one as any)[field] as { statut: string; qr: number | string | null; lecture: number | string | null });
    if (states.some(state => state.statut === 'confirme')) continue;
    const against = states.find(state => state.statut === 'contredit');
    if (!against || against.qr === null) continue;
    proposals.push({ field, path: where, qr: field === 'date' ? isoToFr(String(against.qr)) : against.qr, lecture: against.lecture });
  }
  return proposals;
}

/** La lecture du résultat telle que `confronterQr` la lit. */
export const lectureOf = (result: any): LectureQr => ({ vendor: result?.vendor ?? '', date: result?.date ?? '', currency: result?.currency ?? '', invoiceNumber: result?.invoiceNumber ?? '', amountTTC: result?.amountTTC ?? null } as LectureQr);

/**
 * Le résultat sous le garde-fou : le statut `checked` ou `corrected` devient `disputed` dès qu'un champ est contredit, une phrase générique est
 * ajoutée aux constats, et `qrProposals` garde les valeurs du QR. Les valeurs du résultat ne sont PAS remplacées (la proposition se voit, l'utilisateur
 * décide) ; `withProposals` rend la copie où elles le sont, pour compter ce que vaudrait leur adoption.
 */
export function guardWithQr(result: any, proposals: QrProposal[]): any {
  if (!proposals.length) return result;
  const status = result?.review?.status;
  const downgraded = status === 'checked' || status === 'corrected' ? 'disputed' : status;
  const finding = `Le QR-facture ne s’accorde pas avec la lecture (${proposals.map(item => item.field).join(', ')}).`;
  return { ...result, review: { ...(result.review ?? {}), status: downgraded, findings: [...(result.review?.findings ?? []), finding] }, qrProposals: proposals.map(({ field, qr }) => ({ field, valeur: qr })) };
}
export function withProposals(result: any, proposals: QrProposal[]): any {
  const copy = { ...result };
  for (const item of proposals) copy[item.path] = item.qr;
  return copy;
}

// ---------------------------------------------------------------------------------------------------------------------
// Le décompte, avant et après
// ---------------------------------------------------------------------------------------------------------------------
export interface QrCount {
  draws: number; withQr: number; judged: number; rightBefore: number; rightAfter: number; fvBefore: number; fvAfter: number;
  alerts: number; alertsRight: number; alertsUseless: number; fixed: number; broken: number;
}
const blank = (): QrCount => ({ draws: 0, withQr: 0, judged: 0, rightBefore: 0, rightAfter: 0, fvBefore: 0, fvAfter: 0, alerts: 0, alertsRight: 0, alertsUseless: 0, fixed: 0, broken: 0 });

/**
 * Rejoue le garde-fou sur les parcours d'une sortie du banc. `qrByDoc` : les QR lus de chaque pièce (absent ou vide = pièce sans QR, rien ne change).
 * Par variante : champs justes avant et APRÈS adoption de la valeur proposée, faux verts avant (`checked` avec un champ faux) et après (le statut
 * abaissé, valeurs inchangées), alertes ajoutées (justes : la lecture avait un champ faux ; inutiles : la lecture était juste), champs corrigés / gâtés.
 */
export function replayQr(records: DrawRecord[], cases: BenchCase[], qrByDoc: Map<string, QrFacture[]>): Map<string, QrCount> {
  const expectedOf = new Map(cases.map(c => [c.id, c.expected]));
  const out = new Map<string, QrCount>();
  for (const record of records) {
    const expected = expectedOf.get(record.doc);
    if (!expected) continue;
    const qrs = qrByDoc.get(record.doc) ?? [];
    for (const [variant, run] of Object.entries(record.variants)) {
      const count = out.get(variant) ?? blank();
      out.set(variant, count);
      count.draws++;
      if (!run.result) continue;
      if (qrs.some(qr => qr.valid)) count.withQr++;
      const before = judgeResult(run.result, expected), proposals = qrContradictions(qrs, lectureOf(run.result));
      const guarded = guardWithQr(run.result, proposals), after = judgeResult(withProposals(run.result, proposals), expected);
      count.judged += before.judged; count.rightBefore += before.right; count.rightAfter += after.right;
      const wasChecked = run.result.review?.status === 'checked';
      if (wasChecked && before.wrong.length) count.fvBefore++;
      if (guarded.review?.status === 'checked' && before.wrong.length) count.fvAfter++;
      if (proposals.length && (run.result.review?.status === 'checked' || run.result.review?.status === 'corrected')) {
        count.alerts++;
        if (before.wrong.length) count.alertsRight++; else count.alertsUseless++;
      }
      count.fixed += before.wrong.filter(route => !after.wrong.includes(route)).length;
      count.broken += after.wrong.filter(route => !before.wrong.includes(route)).length;
    }
  }
  return out;
}

// ---------------------------------------------------------------------------------------------------------------------
// Les QR des pièces (outils hors de l'app)
// ---------------------------------------------------------------------------------------------------------------------
/**
 * Les paramètres d'ouverture d'un PDF pour le QR : ceux du banc QR du 01.11 (`pdf-qr.mjs`) et `verbosity: 0`. SURTOUT PAS `standardFontDataUrl` :
 * avec lui, pdf.js rend la page du QR de doc9 sans le QR (0 texte lu) alors que sans lui zxing le lit (page 3, vérifié le 01.11). Aucune valeur.
 */
export const QR_PDF_OPEN_OPTIONS = { isEvalSupported: false, verbosity: 0 } as const;
export interface PdfjsLike { getDocument: (params: any) => { promise: Promise<any> } }
/** Le rendu d'une page de PDF en PNG à l'échelle demandée (fond blanc), avec pdf.js et un canvas : les modules sont passés en argument (testable sans outil). */
export function makePdfRenderer(pdfjs: PdfjsLike, createCanvas: (width: number, height: number) => any): PdfRenderer {
  const open = (pdf: Buffer) => pdfjs.getDocument({ data: new Uint8Array(pdf), ...QR_PDF_OPEN_OPTIONS }).promise;
  return {
    pages: async pdf => (await open(pdf)).numPages,
    render: async (pdf, page, scale) => {
      const one = await (await open(pdf)).getPage(page), viewport = one.getViewport({ scale });
      const canvas = createCanvas(Math.ceil(viewport.width), Math.ceil(viewport.height)), context = canvas.getContext('2d');
      context.fillStyle = '#fff'; context.fillRect(0, 0, canvas.width, canvas.height);
      await one.render({ canvasContext: context, viewport }).promise;
      return canvas.toBuffer('image/png');
    }
  };
}
/** Le rendu réel (pdf.js legacy + @napi-rs/canvas du dossier d'outils) ; outil absent → `OutilManquant`. */
export async function loadQrPdfRenderer(): Promise<PdfRenderer> {
  const load = async (outil: string, relative: string) => {
    try { return await import(/* @vite-ignore */ pathToFileURL(path.join(outilsDir(), 'node_modules', relative)).href); } catch (error: any) { throw new OutilManquant(outil, String(error?.code ?? error?.message ?? error).slice(0, 80)); }
  };
  const pdfjs = await load('pdfjs-dist', 'pdfjs-dist/legacy/build/pdf.mjs'), canvas = await load('@napi-rs/canvas', '@napi-rs/canvas/index.js');
  return makePdfRenderer(pdfjs, canvas.createCanvas ?? canvas.default?.createCanvas);
}

/** Les textes SPC lus sur les fichiers d'un cas (images : zxing ; PDF : pdf.js à 3× puis zxing). Un fichier absent de ce poste : rien. */
export type QrSource = (c: BenchCase) => Promise<string[]>;
export function zxingSource(deps: { reader?: QrImageReader; renderer?: PdfRenderer } = {}): QrSource {
  let reader = deps.reader, renderer = deps.renderer;
  return async c => {
    reader ??= await loadQrReader();
    const texts: string[] = [];
    for (const name of c.files?.length ? c.files : [c.file]) {
      const full = path.isAbsolute(name) ? name : path.join(path.resolve(REELS_DIR, '../../..'), name);
      if (!existsSync(full)) continue;
      const bytes = readFileSync(full);
      if (/\.pdf$/i.test(name) || c.mimeType === 'application/pdf') {
        renderer ??= await loadQrPdfRenderer();
        const pages = await renderer.pages(bytes);
        for (let page = 1; page <= pages; page++) texts.push(...await reader(await renderer.render(bytes, page, 3)));
      } else texts.push(...await reader(bytes));
    }
    return texts;
  };
}
/** Les QR-factures valides ou non d'une pièce, lus depuis ses textes : les textes qui ne sont pas un SPC sont écartés. */
export const qrOfTexts = (texts: string[]): QrFacture[] => texts.map(text => parseSwissQr(text)).filter((qr): qr is QrFacture => !!qr);

// ---------------------------------------------------------------------------------------------------------------------
// Tableau publiable : aucune valeur des documents
// ---------------------------------------------------------------------------------------------------------------------
/** Ce que le QR d'une pièce dit, comparé à la vérité (juste / faux / absent par champ) : des états, jamais les valeurs. */
export function qrAgainstTruth(qrs: QrFacture[], expected: Record<string, any>): Record<QrField, 'juste' | 'faux' | 'absent'> {
  const valid = qrs.filter(qr => qr.valid);
  const alt = (value: unknown): any[] => (Array.isArray(value) ? value : [value]);
  const canon = (value: unknown) => String(value ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '');
  const verdict = (carries: boolean, ok: boolean): 'juste' | 'faux' | 'absent' => (carries ? (ok ? 'juste' : 'faux') : 'absent');
  const montants = valid.map(qr => qr.montant).filter((value): value is number => value !== null);
  const devises = valid.map(qr => qr.devise).filter(Boolean);
  const numeros = valid.map(qr => qr.s1?.numero).filter((value): value is string => !!value);
  const dates = valid.map(qr => qr.s1?.date?.debut).filter((value): value is string => !!value).map(isoToFr);
  return {
    montant: verdict(montants.length > 0, montants.some(value => alt(expected.amountTTC).some(want => typeof want === 'number' && Math.abs(want - value) < 0.005))),
    devise: verdict(devises.length > 0, devises.some(value => alt(expected.currency).some(want => canon(want) === canon(value)))),
    numero: verdict(numeros.length > 0, numeros.some(value => alt(expected.invoiceNumber).some(want => canon(want) === canon(value)))),
    date: verdict(dates.length > 0, dates.some(value => alt(expected.date).includes(value)))
  };
}

const ratio = (a: number, b: number) => `${a} / ${b}`;
export function renderQr(sources: Array<{ dir: string; records: DrawRecord[] }>, cases: BenchCase[], qrByDoc: Map<string, QrFacture[]>, rawTexts: Map<string, string[]>): string {
  const lines = ['# +Q — le QR-facture comme garde-fou (hors ligne, aucun appel)', '',
    `Sorties rejouées : ${sources.map(source => source.dir).join(', ')}. Aucune valeur des documents ici : des comptes et des noms de champs.`,
    'Règle : un champ porté par le QR (montant, devise, n° de facture, date) qui diffère du résultat interdit `checked` (il devient `disputed`) et le QR propose sa valeur. Plusieurs QR sur une pièce : un champ n’est contredit que si aucun ne le confirme. Un QR absent ou invalide ne change rien.', '',
    '## Les QR par pièce (lus par zxing ; PDF rendus à 3×)', '', '| document | genre | textes QR lus | QR-facture suisses | valides | montant | devise | n° facture | date |', '|---|---|---|---|---|---|---|---|---|'];
  for (const c of cases) {
    const qrs = qrByDoc.get(c.id) ?? [], truth = qrAgainstTruth(qrs, c.expected), texts = rawTexts.get(c.id)?.length ?? 0;
    lines.push(`| ${c.id} | ${genreOfCase(c)} | ${texts} | ${qrs.length} | ${qrs.filter(qr => qr.valid).length} | ${truth.montant} | ${truth.devise} | ${truth.numero} | ${truth.date} |`);
  }
  for (const source of sources) {
    const counts = replayQr(source.records, cases, qrByDoc);
    lines.push('', `## Avant et après — ${source.dir}`, '',
      '| variante | parcours (avec QR) | champs justes avant → après | faux verts avant → après | alertes ajoutées (justes / inutiles) | champs corrigés / gâtés |', '|---|---|---|---|---|---|');
    for (const id of orderVariants(counts.keys())) {
      if (isNId(id)) continue;
      const c = counts.get(id)!;
      lines.push(`| ${variantLabel(id)} | ${c.draws} (${c.withQr}) | ${ratio(c.rightBefore, c.judged)} → ${ratio(c.rightAfter, c.judged)} | ${c.fvBefore} → ${c.fvAfter} | ${c.alerts} (${c.alertsRight} / ${c.alertsUseless}) | ${c.fixed} / ${c.broken} |`);
    }
  }
  lines.push('', '## Lecture honnête', '',
    '- « Faux verts après » garde les valeurs du résultat et ne change que le statut : c’est ce que le QR interdit. « Champs justes après » adopte la valeur proposée par le QR, pour dire ce qu’elle vaudrait ; la production ne la remplace pas sans l’accord de l’utilisateur.',
    '- Un QR ne couvre que les pièces qui en portent un (factures suisses avec bulletin) ; une alerte « inutile » est un QR qui diffère d’un résultat juste (un montant de bulletin autre que le total, par exemple) : elle se lit dans la colonne des alertes.',
    '- Peu de pièces : un compte de 0 ou de 1 est un indice, pas une mesure.', '');
  return lines.join('\n');
}

// ---------------------------------------------------------------------------------------------------------------------
async function main() {
  const args = process.argv.slice(2).filter(arg => arg !== '--');
  const value = (flag: string) => args.find(arg => arg.startsWith(`${flag}=`))?.slice(flag.length + 1);
  const dirs = (value('--qr') ?? '').split(',').map(item => item.trim()).filter(Boolean).map(item => path.resolve(item));
  if (!dirs.length) throw new Error('--qr=<sortie du banc>[,<autre>] manquant.');
  const sources = dirs.map(dir => ({ dir: path.basename(dir), records: (JSON.parse(readFileSync(path.join(dir, 'results.json'), 'utf8')) as { records: DrawRecord[] }).records }));
  const casNames = value('--cas')?.split(',').map(item => item.trim()).filter(Boolean);
  const cases = loadCases(casNames ? casNames.map(casPath) : CAS_FILES).filter(c => sources.some(source => source.records.some(record => record.doc === c.id)));
  const source = zxingSource(), qrByDoc = new Map<string, QrFacture[]>(), rawTexts = new Map<string, string[]>();
  for (const c of cases) {
    const texts = await source(c);
    rawTexts.set(c.id, texts);
    qrByDoc.set(c.id, qrOfTexts(texts));
  }
  const table = renderQr(sources, cases, qrByDoc, rawTexts);
  const out = value('--out');
  if (out) writeFileSync(path.resolve(out), table);
  console.log(table);
  console.log(`QR LU — ${cases.length} pièces, ${[...qrByDoc.values()].reduce((sum, list) => sum + list.length, 0)} QR-factures suisses, aucun appel.`);
}
const isMain = () => !process.env.VITEST && process.argv.some(arg => arg.startsWith('--qr='));
if (isMain()) main().then(() => process.exit(0), error => { console.error(error instanceof OutilManquant ? error.message : `QR ECHEC : ${error instanceof Error ? error.message : String(error)}`); process.exit(1); });
