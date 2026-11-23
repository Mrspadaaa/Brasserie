// Les PDF du banc portent-ils un QR-facture ? pdf.js rend chaque page à 3× (≈ 216 dpi), zxing la lit. Sortie sans valeur.
// Lancer : deux dossiers de os.tmpdir(), l'un avec `zxing-wasm@3.1.5`, l'autre avec `pdfjs-dist@4.10.38 @napi-rs/canvas@0.1.65` (banc seul,
// hors de l'app), puis `node pdf-qr.mjs <zxing> <pdf> <H13-reels> <fichiers.pdf…>`.
import { readFileSync } from 'node:fs'; import path from 'node:path'; import { pathToFileURL } from 'node:url';
const [zxDir, pdfDir, reels, ...fichiers] = process.argv.slice(2);
const imp = (d, p) => import(pathToFileURL(path.join(d, 'node_modules', p)).href);
const { readBarcodes, prepareZXingModule } = await imp(zxDir, 'zxing-wasm/dist/es/reader/index.js');
prepareZXingModule({ overrides: { wasmBinary: readFileSync(path.join(zxDir, 'node_modules/zxing-wasm/dist/reader/zxing_reader.wasm')).buffer }, fireImmediately: true });
const pdfjs = await imp(pdfDir, 'pdfjs-dist/legacy/build/pdf.mjs');
const { createCanvas } = await imp(pdfDir, '@napi-rs/canvas/index.js').catch(() => import(pathToFileURL(path.join(pdfDir, 'node_modules/@napi-rs/canvas/index.js')).href));
const verites = {};
for (const f of ['cas.json', 'cas-2.json', 'cas-3.json', 'cas-4.json']) { try { const c = JSON.parse(readFileSync(path.join(reels, f), 'utf8')); for (const x of Array.isArray(c) ? c : (c.cases || c.cas)) verites[x.id] = x.expected; } catch {} }
for (const f of fichiers) {
  const doc = path.basename(f).match(/^(doc\d+)/)[1], v = verites[doc] ?? {};
  const pdf = await pdfjs.getDocument({ data: new Uint8Array(readFileSync(f)), isEvalSupported: false }).promise;
  const t0 = performance.now(); const trouves = [];
  for (let n = 1; n <= pdf.numPages; n++) {
    const page = await pdf.getPage(n), vp = page.getViewport({ scale: 3 });
    const canvas = createCanvas(Math.ceil(vp.width), Math.ceil(vp.height)), ctx = canvas.getContext('2d');
    ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, canvas.width, canvas.height);
    await page.render({ canvasContext: ctx, viewport: vp }).promise;
    const res = await readBarcodes(new Blob([canvas.toBuffer('image/png')]), { formats: ['QRCode'], tryHarder: true, maxNumberOfSymbols: 4 });
    for (const r of res.filter(r => r.isValid)) trouves.push({ n, text: r.text });
  }
  const parts = trouves.map(({ n, text }) => {
    const l = text.split(/\r?\n/); if (l[0] !== 'SPC') return `page ${n} : QR non suisse`;
    const m = l[18] === '' ? null : Number(l[18]);
    const montant = m === null ? 'absent' : typeof v.amountTTC === 'number' ? (Math.abs(m - v.amountTTC) < 0.005 ? 'juste' : 'FAUX') : 'sans vérité';
    const devise = l[19] ? (l[19] === v.currency ? 'juste' : 'FAUX') : 'absente';
    const s1o = {}; if ((l[31] ?? '').startsWith('//S1/')) { const p = l[31].slice(5).split('/'); for (let i = 0; i + 1 < p.length; i += 2) s1o[p[i]] = p[i + 1]; } const cn = s => String(s ?? '').toLowerCase().replace(/[^a-z0-9]/g, ''); const dm = /^(\d{2})\.(\d{2})\.(\d{4})$/.exec(v.date ?? ''); const s1 = 'S1 ' + (Object.keys(s1o).join('+') || 'non') + ', n° facture ' + (s1o['10'] ? (cn(s1o['10']) === cn(v.invoiceNumber) ? 'juste' : 'FAUX') : 'absent') + ', date ' + (s1o['11'] ? (dm && s1o['11'].slice(0, 6) === dm[3].slice(2) + dm[2] + dm[1] ? 'juste' : 'FAUX') : 'absente') + ', TVA ' + (s1o['32'] ? 'présente' : 'absente');
    return `page ${n} : QR-facture suisse (réf. ${l[27] || '—'}, ${s1}) : montant ${montant}, devise ${devise}`;
  });
  console.log(`${path.basename(f)} : ${pdf.numPages} page(s), ${trouves.length} QR (${Math.round(performance.now() - t0)} ms)${parts.length ? '\n  ' + parts.join('\n  ') : ''}`);
}
