// Essai des outils réels de k5 sur une image FABRIQUÉE (aucune pièce du brasseur, aucun réseau, aucun appel payé) : jimp découpe une longue page en bandes
// sur des rangées vides, puis recadre une zone (marge, agrandissement). Lancer :
//   npx vite-node --config vitest.config.ts work/missions/2026-11-01-banc-lecture/voies/k5-vision/essai-outils.ts
import { grayOf, imageSize, inkRows, inkedCuts, jimpBander, loadJimp, planBands } from '../../../../../scripts/banc-lecture-bandes';
import { boxToPixels, jimpCropper } from '../../../../../scripts/banc-lecture-zoom';

const Jimp = await loadJimp();
// 600 × 2400 px (rapport 4), fond blanc, une « ligne de texte » de 14 px noire tous les 60 px sur 70 % de la largeur
const page = new Jimp({ width: 600, height: 2400, color: 0xffffffff });
for (let y = 0; y < 2400; y++) if (y % 60 >= 20 && y % 60 < 34) for (let x = 60; x < 480; x++) page.bitmap.data.writeUInt32BE(0x000000ff, (y * 600 + x) * 4);
const jpeg: Buffer = await page.getBuffer('image/jpeg', { quality: 95 });
const file = { mimeType: 'image/jpeg', data: jpeg.toString('base64') };
console.log('taille lue sans outil :', JSON.stringify(imageSize(jpeg)));

const bands = await jimpBander()([file], 'essai');
if (!bands) throw new Error('ECHEC : une image haute doit être coupée.');
console.log(`bandes : ${bands.length}, hauteurs ${bands.map(band => band.bottom - band.top).join(', ')}, coupes forcées ${bands.filter(band => band.forced).length}`);
let bad = 0;
for (const band of bands) {
  const decoded = await Jimp.read(Buffer.from(band.file.data, 'base64'));
  const rows = inkRows(grayOf(decoded.bitmap));
  const edges = [rows[0], rows[rows.length - 1]];
  if (decoded.bitmap.height > 840) bad++;
  if (band.k > 1 && edges[0] > 0.003) bad++;
  if (band.k < band.n && edges[1] > 0.003) bad++;
}
const plan = planBands(inkRows(grayOf(page.bitmap)), 600);
console.log('rangées encrées traversées par le plan :', inkedCuts(plan, inkRows(grayOf(page.bitmap))).length, '; bandes hors norme ou bord encré :', bad);

const crop = await jimpCropper()([file], 1, [100, 100, 130, 500], 'essai');
if (!crop) throw new Error('ECHEC : recadrage absent.');
const out = await Jimp.read(Buffer.from(crop.file.data, 'base64'));
const expected = boxToPixels([100, 100, 130, 500], 600, 2400);
console.log(`recadrage : ${out.bitmap.width} × ${out.bitmap.height} px (attendu ${expected.outW} × ${expected.outH}), agrandi ×${expected.scale}`);
console.log(bad === 0 && out.bitmap.width === expected.outW && out.bitmap.height === expected.outH ? 'OUTILS OK' : 'OUTILS ECHEC');
