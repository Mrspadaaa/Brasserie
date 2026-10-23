// Contrôle d'un panel de mini maquettes v0, sur leurs captures (M14, 23.10).
// L'utilisateur, sur les 56 concepts de Dryhopper (lot 23) : « J'ai l'impression que les mini maquettes sont
// vraiment moins quali ». Vu sur les captures : les 56 partagent le même squelette (titre, ligne de contexte,
// « Au style », une figure, le rail en bas) et beaucoup laissent la moitié de l'écran vide ; les v0 du lot 21
// avaient chacune leur structure, dense. Deux mesures, sur le premier écran de chaque capture (390 × 844) :
//   - REMPLISSAGE (D4 : « pas assez dense » ; « voir un Max d'info au même endroit ») : la part des lignes du
//     premier écran qui portent du contenu (plus de 2 % de pixels qui diffèrent du fond). La médiane du panel
//     atteint --mediane, et au plus --part-vides des captures restent sous --plancher ;
//   - DIVERSITÉ : chaque premier écran réduit en vignette de gris 24 × 52 ; ressemblance d'une paire =
//     1 − écart moyen. La ressemblance moyenne reste sous --sim, et la part de paires presque identiques
//     (au-dessus de --double) sous --part.
// Étalonnage (23.10), sur les deux panels qu'il a jugés :
//   lot 21 v0 (33 captures, « vraiment plus qualitatif ») : médiane 0,62, 1 capture sous 0,50, ressemblance
//   0,88, 0 % de paires presque identiques → PANEL OK ;
//   lot 23 v0 (56 captures, « vraiment moins quali ») : médiane 0,41, 55 sous 0,50, ressemblance 0,92, 2 %
//   → PANEL ECHEC. Mesures figées : temoins/panel-lot21.json et temoins/panel-lot23.json (--mesures=).
// Usage : node controle-panel.mjs <capture.png…> [--mediane=0.55] [--plancher=0.5] [--part-vides=0.2]
//         [--sim=0.9] [--double=0.95] [--part=0.01] [--ecrire-mesures=f.json] | --mesures=f.json
import fs from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2);
const val = (k) => { const a = args.find((x) => x.startsWith(`--${k}=`)); return a ? a.slice(k.length + 3) : null; };
const opt = (k, d) => (val(k) === null ? d : Number(val(k)));
const MEDIANE = opt('mediane', 0.55), PLANCHER = opt('plancher', 0.5), PART_VIDES = opt('part-vides', 0.2);
const SIM = opt('sim', 0.9), DOUBLE = opt('double', 0.95), PART = opt('part', 0.01);

async function mesurer(fichiers) {
  const { default: puppeteer } = await import('puppeteer-core');
  const navigateur = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
  const page = await navigateur.newPage();
  const mesures = [];
  for (const f of fichiers) {
    const m = await page.evaluate(async (url) => {
      const img = new Image();
      await new Promise((ok, ko) => { img.onload = ok; img.onerror = () => ko(new Error('image illisible')); img.src = url; });
      // Le premier écran : la largeur de la capture vaut 390 px CSS, la hauteur 844.
      const L = img.naturalWidth, H = Math.min(img.naturalHeight, Math.round((L * 844) / 390));
      const c = document.createElement('canvas'); c.width = L; c.height = H;
      const x = c.getContext('2d'); x.drawImage(img, 0, 0);
      const d = x.getImageData(0, 0, L, H).data;
      // Le fond : la couleur la plus fréquente (quantifiée par 16).
      const compte = new Map();
      for (let i = 0; i < d.length; i += 4 * 7) { const k = (d[i] >> 4) * 256 + (d[i + 1] >> 4) * 16 + (d[i + 2] >> 4); compte.set(k, (compte.get(k) || 0) + 1); }
      const fond = [...compte.entries()].sort((a, b) => b[1] - a[1])[0][0];
      const fr = ((fond >> 8) & 15) * 16 + 8, fg = ((fond >> 4) & 15) * 16 + 8, fb = (fond & 15) * 16 + 8;
      let pleines = 0;
      for (let y = 0; y < H; y++) {
        let diff = 0;
        for (let xx = 0; xx < L; xx++) { const i = (y * L + xx) * 4; if (Math.abs(d[i] - fr) + Math.abs(d[i + 1] - fg) + Math.abs(d[i + 2] - fb) > 60) diff++; }
        if (diff / L > 0.02) pleines++;
      }
      const v = document.createElement('canvas'); v.width = 24; v.height = 52;
      const vx = v.getContext('2d'); vx.drawImage(c, 0, 0, 24, 52);
      const g = vx.getImageData(0, 0, 24, 52).data;
      const gris = []; for (let i = 0; i < g.length; i += 4) gris.push(Math.round(0.299 * g[i] + 0.587 * g[i + 1] + 0.114 * g[i + 2]));
      return { remplissage: Math.round((1000 * pleines) / H) / 1000, gris };
    }, `data:image/png;base64,${fs.readFileSync(f).toString('base64')}`);
    mesures.push({ id: path.basename(f, '.png').replace(/-390$/, ''), remplissage: m.remplissage, gris: Buffer.from(m.gris).toString('base64') });
  }
  await navigateur.close();
  return mesures;
}

const source = val('mesures');
const fichiers = args.filter((a) => !a.startsWith('--')).map((f) => path.resolve(f));
if (!source && fichiers.length < 2) { console.log('PANEL ECHEC : deux captures au moins'); process.exit(1); }
const mesures = source ? JSON.parse(fs.readFileSync(source, 'utf8')).mesures : await mesurer(fichiers);
if (val('ecrire-mesures')) fs.writeFileSync(val('ecrire-mesures'), `${JSON.stringify({ maj: new Date().toISOString().slice(0, 10), mesures })}\n`);

const gris = new Map(mesures.map((m) => [m.id, [...Buffer.from(m.gris, 'base64')]]));
const ressemblance = (a, b) => 1 - a.reduce((s, v, i) => s + Math.abs(v - b[i]), 0) / a.length / 255;
const paires = [];
for (let i = 0; i < mesures.length; i++) for (let j = i + 1; j < mesures.length; j++) paires.push({ a: mesures[i].id, b: mesures[j].id, s: ressemblance(gris.get(mesures[i].id), gris.get(mesures[j].id)) });
const moyenne = paires.reduce((s, p) => s + p.s, 0) / paires.length;
const doubles = paires.filter((p) => p.s >= DOUBLE);
const tries = [...mesures].sort((a, b) => a.remplissage - b.remplissage);
const mediane = tries[Math.floor(tries.length / 2)].remplissage;
const vides = tries.filter((m) => m.remplissage < PLANCHER);
const r2 = (n) => n.toFixed(2).replace('.', ',');
const pc = (n) => `${Math.round(100 * n)} %`;
console.log(`${mesures.length} captures · remplissage médian ${r2(mediane)}, ${vides.length} sous ${r2(PLANCHER)} · ressemblance moyenne ${r2(moyenne)} · paires presque identiques ${doubles.length}/${paires.length} (${pc(doubles.length / paires.length)})`);
const echecs = [];
if (mediane < MEDIANE) echecs.push(`REMPLISSAGE : médiane ${r2(mediane)} < ${r2(MEDIANE)} (lot 21 : 0,62) ; les plus vides : ${vides.slice(0, 8).map((m) => `${m.id} ${r2(m.remplissage)}`).join(', ')}`);
if (vides.length / mesures.length > PART_VIDES) echecs.push(`REMPLISSAGE : ${pc(vides.length / mesures.length)} des premiers écrans sous ${r2(PLANCHER)}, ${pc(PART_VIDES)} au plus`);
if (moyenne >= SIM) echecs.push(`DIVERSITÉ : ressemblance moyenne ${r2(moyenne)} ≥ ${r2(SIM)} (lot 21 : 0,88) : le panel partage un même squelette`);
if (doubles.length / paires.length > PART) echecs.push(`DIVERSITÉ : ${pc(doubles.length / paires.length)} de paires presque identiques (≥ ${r2(DOUBLE)}), ${pc(PART)} au plus ; par exemple ${doubles.slice(0, 5).map((p) => `${p.a}~${p.b}`).join(', ')}`);
for (const e of echecs) console.log(`  - ${e}`);
console.log(echecs.length ? 'PANEL ECHEC' : 'PANEL OK');
process.exitCode = echecs.length ? 1 : 0;
