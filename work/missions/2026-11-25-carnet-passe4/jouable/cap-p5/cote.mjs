// Preuve : chaque écran du jouable p5 à côté de sa mini maquette (ou de son choix figé du 17.11). node .../cap-p5/cote.mjs
import puppeteer from 'puppeteer-core'; import fs from 'fs'; import path from 'path'; import { fileURLToPath, pathToFileURL } from 'url';
const ICI = path.dirname(fileURLToPath(import.meta.url)), MINI = path.resolve(ICI, '../../mini/cap'), FIG = 'C:/Users/mrspa/.codex/worktrees/openai-clean-start/Brasserie/work/missions/2026-11-17-carnet-retouches/maquettes/page2/img';
export const PAIRES = [['S-liste', '01-liste'], ['S-ranger-glisse', '03-glisse'], ['S-ranger-repos', '04-range'], ['S-noter', '05-noter'], ['S-rangee', '06-rangee'], ['O-organise', '07-organise'], ['O-change', '08-change'],
  ['S-notes-ecrit', '09-notes-ecrit'], ['S-ia-lit', '10-ia-lit'], ['S-notes-ligne', '11-notes-ligne'], ['O-decider', '13-retenu'], ['O-resoudre', '15-resoudre'], ['O-resolu', '16-resolu'], ['O-afaire', '17-afaire'],
  ['O-options-a-6', '19-options-6'], ['h04-7', '20-comparer'], ['h01-6', '22-article'], ['v09-3', '23-choisi'], ['h05-9', '24-avenir'], ['O-comparer-caracteristiques', '26-chambre-comparer'], ['O-relecture', '30-relecture'], ['S-memo', '31-memo'], ['S-ia-echec', '33-ia-echec']];
const src = m => fs.existsSync(path.join(MINI, m + '.png')) ? path.join(MINI, m + '.png') : path.join(FIG, m + '.webp');
const mode = process.argv[2] || 'cote';
fs.mkdirSync(path.join(ICI, 'cote'), { recursive: true });
const b = await puppeteer.connect({ browserURL: 'http://127.0.0.1:9222', defaultViewport: null });
const p = await b.newPage();
async function planche(nom, imgs, labels) {
  await p.setViewport({ width: imgs.length * 400, height: 880, deviceScaleFactor: 1 });
  const html = '<body style="margin:0;background:#444;display:flex;gap:10px;font:13px sans-serif;color:#fff">' + imgs.map((x, i) => `<figure style="margin:0;width:390px"><div>${labels[i]}</div><img src="${pathToFileURL(x).href}" style="width:390px;height:844px;object-fit:cover;object-position:top"></figure>`).join('') + '</body>';
  const f = path.join(ICI, 'cote', '_tmp.html'); fs.writeFileSync(f, html); await p.goto(pathToFileURL(f).href); await new Promise(r => setTimeout(r, 400));
  await p.screenshot({ path: path.join(ICI, 'cote', nom + '.png') });
}
if (mode === 'cote') for (const [m, j] of PAIRES) await planche(j + '__' + m, [src(m), path.join(ICI, j + '.png')], ['sa version : ' + m, 'jouable p5 : ' + j]);
else { const L = process.argv.slice(3); await planche('_voir', L.map(j => fs.existsSync(path.join(ICI, j + '.png')) ? path.join(ICI, j + '.png') : src(j)), L); }
fs.unlinkSync(path.join(ICI, 'cote', '_tmp.html')); await p.close(); b.disconnect(); console.log('fait');
