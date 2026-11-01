// Banc QR-facture (01.11) : zxing-wasm lit le QR suisse de chaque image du banc, sans IA. Sortie sans aucune valeur de ses documents :
// seulement « trouvé, juste, faux, absent » par champ, contre la vérité écrite (cas*.json).
// Lancer : `npm install zxing-wasm@3.1.5` dans un dossier de os.tmpdir() (jamais dans la jonction node_modules), puis
// `node banc-qr.mjs <ce dossier> work/finalisation-tickets-2026-10-08/H13-reels`.
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
const [zxDir, reels] = process.argv.slice(2);
const { readBarcodes, prepareZXingModule } = await import(pathToFileURL(path.join(zxDir, 'node_modules/zxing-wasm/dist/es/reader/index.js')).href);
prepareZXingModule({ overrides: { wasmBinary: readFileSync(path.join(zxDir, 'node_modules/zxing-wasm/dist/reader/zxing_reader.wasm')).buffer }, fireImmediately: true });
const verites = {};
for (const f of ['cas.json', 'cas-2.json', 'cas-3.json', 'cas-4.json']) {
  let c; try { c = JSON.parse(readFileSync(path.join(reels, f), 'utf8')); } catch { continue; }
  for (const x of Array.isArray(c) ? c : (c.cases || c.cas)) verites[x.id] = x.expected || x.attendu;
}
const canon = s => String(s ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '');
const spc = text => {
  const l = text.split(/\r?\n/);
  if (l[0] !== 'SPC') return null;
  const s1 = {}; const bk = l[31] ?? '';
  if (bk.startsWith('//S1/')) { const p = bk.slice(5).split('/'); for (let i = 0; i + 1 < p.length; i += 2) s1[p[i]] = p[i + 1]; }
  return { version: l[1], iban: l[3], nom: l[5], montant: l[18] === '' ? null : Number(l[18]), devise: l[19], refType: l[27], ref: l[28], message: l[29], s1 };
};
const iso = d => { const m = /^(\d{2})\.(\d{2})\.(\d{4})$/.exec(d ?? ''); return m ? `${m[3].slice(2)}${m[2]}${m[1]}` : null; };
const images = readdirSync(reels).filter(f => /^doc\d+.*\.(jpe?g|png)$/i.test(f)).sort((a, b) => parseInt(a.slice(3)) - parseInt(b.slice(3)));
for (const f of images) {
  const doc = f.match(/^(doc\d+)/)[1], v = verites[doc] ?? {};
  const t0 = performance.now();
  const res = await readBarcodes(new Blob([readFileSync(path.join(reels, f))]), { formats: ['QRCode'], tryHarder: true, tryRotate: true, tryInvert: true, tryDownscale: true, maxNumberOfSymbols: 8 });
  const ms = Math.round(performance.now() - t0);
  const qr = res.filter(r => r.isValid), suisses = qr.map(r => spc(r.text)).filter(Boolean);
  if (!qr.length) { console.log(`${f} : aucun QR (${ms} ms)`); continue; }
  const parts = suisses.map((q, i) => {
    const juge = (nom, ok) => `${nom} ${ok === null ? 'absent' : ok ? 'juste' : 'FAUX'}`;
    const montant = q.montant === null ? null : typeof v.amountTTC === 'number' ? Math.abs(q.montant - v.amountTTC) < 0.005 : null;
    const devise = q.devise ? q.devise === v.currency : null;
    const nom = q.nom ? (canon(v.vendor).includes(canon(q.nom).slice(0, 8)) || canon(q.nom).includes(canon(v.vendor).slice(0, 8))) : null;
    const num = q.s1['10'] ? canon(q.s1['10']) === canon(v.invoiceNumber) : null;
    const date = q.s1['11'] ? q.s1['11'].slice(0, 6) === iso(v.date) : null;
    return `QR ${i + 1} (v${q.version}, réf. ${q.refType || '—'}, S1 ${Object.keys(q.s1).length ? Object.keys(q.s1).join('+') : 'non'}) : ${[juge('montant', montant), juge('devise', devise), juge('créancier', nom), juge('n° facture', num), juge('date', date)].join(', ')}`;
  });
  console.log(`${f} : ${qr.length} QR, ${suisses.length} QR-facture suisse(s) (${ms} ms)${parts.length ? '\n  ' + parts.join('\n  ') : ''}`);
}
