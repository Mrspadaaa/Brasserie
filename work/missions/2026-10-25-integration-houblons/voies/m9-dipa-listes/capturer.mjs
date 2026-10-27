// Voie m9-dipa-listes (D191) : « pour la double IPA, les houblons d'agrume sont pas vraiment ceux attendu. Je m'attendais à des
// houblon plus typé IPA El dorado, mosaic. Mandarina Bavaria, calypso, Pacifique jade ou même idao7 » (27.10).
// L'écran Suggérer de l'APP, rendu par la copie propre (645c17f4), sur sa recette neipa v3, pour les quatre combinaisons de f9 (A
// l'actuel, B intensité A3, C typicité, D les deux), visées « plus d'agrumes » et « plus de tropicaux » d'un cran, au dry hop actif.
// Les rangées sont celles que l'app rend (ecran.mjs : moteur de l'app, options de f9) ; elles sont comparées aux dix premiers de
// listes.json (f9) et doivent concorder, sinon le script s'arrête. Les rangs de ses six viennent de listes.json, tels quels.
// Chaque vignette AJOUTE (L26 : classes m9r-, code dans une fonction, sans remplacement de chaîne) :
//   - « Tes six » : ses six houblons, toujours dans le même ordre, leur rang dans la liste et l'écart au rang de A ;
//   - le surlignage de ceux qui tombent dans les rangées de l'écran (une classe m9r- posée, retirée après la capture).
// Rien de l'app n'est caché, déplacé ni réécrit ; l'écran est mesuré avant et après l'ajout (fidelite.json, lu par
// controle-capture-fidele.mjs).
// Usage (depuis la copie propre C:/Users/mrspa/AppData/Local/Temp/deploy-63130965) :
//   node scripts/with_server.mjs --server "npm run dev -- --port 5291 --strictPort" --port 5291 --timeout 150 --env VITE_HOP_V4=on -- node <ce fichier>
// M9_SEULE=citrus:A3 pour une seule vignette (fidelite.json n'est alors pas réécrit).
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { COMBOS, ouvrirEcran } from './ecran.mjs';

const ICI = import.meta.dirname;
const IMG = path.join(ICI, 'img');
const ZOOM = path.join(os.tmpdir(), 'm9');
fs.mkdirSync(IMG, { recursive: true });
fs.mkdirSync(ZOOM, { recursive: true });
const dormir = (ms) => new Promise((r) => setTimeout(r, ms));
const L = JSON.parse(fs.readFileSync(path.join(ICI, '..', 'f9-intensite-typicite', 'listes.json'), 'utf8'));
const MOMENT = 'dry hop actif';
const SIX = [
  { id: 'el-dorado', nom: 'El Dorado' }, { id: 'mosaic', nom: 'Mosaic' }, { id: 'mandarina-bavaria', nom: 'Mandarina' },
  { id: 'calypso', nom: 'Calypso' }, { id: 'pacific-jade', nom: 'Pacific Jade' }, { id: 'idaho-7', nom: 'Idaho 7' },
];
const COLONNES = [
  { combo: 'actuel', lettre: 'a' }, { combo: 'A3', lettre: 'b' }, { combo: 'typicité', lettre: 'c' }, { combo: 'A3 + typicité', lettre: 'd' },
];
const QUESTIONS = [{ famille: 'citrus', fichier: 'agrumes' }, { famille: 'tropical', fichier: 'tropicaux' }];
const question = (combo, famille) => L.combinaisons.find((c) => c.combinaison === combo).questions.find((q) => q.famille === famille && q.moment === MOMENT);
// Un houblon absent de la liste : Calypso hors du pool de 80 ; un houblon qui ne cite pas la famille visée ne peut pas y paraître (f9).
const pourquoiAbsent = (id, famille) => (id === 'pacific-jade' && famille === 'tropical' ? 'ne cite pas' : 'hors des 80');

// La mesure de l'écran de l'app : nœuds visibles hors ajouts, et ses blocs (data-role, data-etat, data-element, data-groupe, titres).
const MESURE = () => {
  const ecran = document.querySelector('[data-ecran="suggerer"]');
  const visible = (e) => { const r = e.getBoundingClientRect(); const s = getComputedStyle(e); return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.opacity !== '0'; };
  const tous = [...ecran.querySelectorAll('*')].filter((e) => !e.closest('.m9r-ajout')).filter(visible);
  const blocs = new Set();
  for (const e of tous) {
    for (const a of ['data-role', 'data-etat', 'data-element', 'data-groupe']) { const v = e.getAttribute(a); if (v) blocs.add(`${a.slice(5)}:${v}`); }
    if (/^(H1|H2|H3|SUMMARY)$/.test(e.tagName)) blocs.add(`${e.tagName.toLowerCase()}:${e.textContent.trim().slice(0, 40)}`);
  }
  const ajouts = [...ecran.querySelectorAll('.m9r-ajout *')].filter(visible).length;
  return { noeudsHorsRangs: tous.length, blocs: [...blocs].sort(), ajouts };
};

// Les rangées de l'écran (hors levure), dans l'ordre affiché.
const RANGEES = () => [...document.querySelectorAll('[data-ecran="suggerer"] section[data-groupe]:not([data-groupe="levure"]) li[data-id]')]
  .map((l) => ({ nom: l.querySelector('.pq-suggerer-nom')?.textContent ?? '?', cles: [...l.querySelectorAll('[data-houblon]')].map((n) => n.getAttribute('data-houblon')) }));

// L'ajout, dans la page rendue.
function injecter(V) {
  const ecran = document.querySelector('[data-ecran="suggerer"]');
  const cartes = ecran.querySelector('section[aria-label="Objectifs"]');
  if (!document.querySelector('style.m9r-ajout')) {
    const st = document.createElement('style');
    st.className = 'm9r-ajout';
    st.textContent = `
.m9r-six { margin: 10px 0 2px; display: grid; gap: 6px; font-family: inherit; }
.m9r-six-t { display: flex; align-items: baseline; gap: 8px; font-size: 15px; font-weight: 700; color: rgb(var(--cave-50)); }
.m9r-six-t small { font-size: 14px; font-weight: 400; color: rgb(var(--cave-400)); }
.m9r-grille { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 6px; }
.m9r-puce { display: grid; gap: 1px; padding: 6px 9px 7px; border-radius: 10px; border: 1.5px solid rgb(var(--cave-700)); background: rgb(var(--cave-950)); min-width: 0; }
.m9r-puce-nom { font-size: 14px; font-weight: 600; color: rgb(var(--cave-200)); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.m9r-puce-l2 { display: flex; align-items: baseline; gap: 6px; }
.m9r-rang { font: 800 22px/1.05 ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; font-variant-numeric: tabular-nums; color: rgb(var(--cave-50)); letter-spacing: -.02em; }
.m9r-rang sup { font-size: 13px; font-weight: 700; letter-spacing: 0; margin-left: 1px; }
.m9r-ecart { font: 700 14px/1 system-ui, sans-serif; font-variant-numeric: tabular-nums; white-space: nowrap; }
.m9r-monte { color: #1a7f37; }
.m9r-baisse { color: #b42318; }
.m9r-egal { color: rgb(var(--cave-400)); font-weight: 600; }
.m9r-absent { border-style: dashed; background: transparent; }
.m9r-absent .m9r-rang { color: rgb(var(--cave-400)); }
.m9r-absent .m9r-pourquoi { font-size: 14px; color: rgb(var(--cave-400)); white-space: nowrap; }
.m9r-ici { border-color: #e8590c; background: #fff1e8; }
.m9r-ici .m9r-puce-nom { color: #9a3a06; }
/* Ses six dans les rangées de l'écran : une bande orange à gauche et le nom surligné (le orange de sa capture). */
li.m9r-surligne { box-shadow: inset 5px 0 0 #e8590c; }
.m9r-surligne-nom { background: linear-gradient(transparent 58%, #ffc9a8 58%); }
`;
    document.head.appendChild(st);
  }
  const bloc = document.createElement('section');
  bloc.className = 'm9r-ajout m9r-six';
  bloc.setAttribute('aria-label', `Tes six : ${V.six.map((s) => `${s.nom} ${s.rang ? `${s.rang}e` : s.pourquoi}`).join(', ')}`);
  const puce = (s) => {
    if (!s.rang) return `<div class="m9r-puce m9r-absent"><span class="m9r-puce-nom">${s.nom}</span><span class="m9r-puce-l2"><span class="m9r-rang">—</span><span class="m9r-pourquoi">${s.pourquoi}</span></span></div>`;
    const d = s.rangA ? s.rangA - s.rang : null;
    const ecart = V.reference ? '' : d == null ? '' : d > 0 ? `<span class="m9r-ecart m9r-monte">▲ ${d}</span>` : d < 0 ? `<span class="m9r-ecart m9r-baisse">▼ ${-d}</span>` : '<span class="m9r-ecart m9r-egal">=</span>';
    return `<div class="m9r-puce${s.ici ? ' m9r-ici' : ''}"><span class="m9r-puce-nom">${s.nom}</span><span class="m9r-puce-l2"><span class="m9r-rang">${s.rang}<sup>e</sup></span>${ecart}</span></div>`;
  };
  bloc.innerHTML = `<div class="m9r-six-t">Tes six<small>${V.reference ? 'rang dans la liste' : 'rang, et l’écart à l’actuel'}</small></div><div class="m9r-grille">${V.six.map(puce).join('')}</div>`;
  cartes.after(bloc);
  // Le surlignage des rangées où tombent ses six.
  for (const li of ecran.querySelectorAll('section[data-groupe]:not([data-groupe="levure"]) li[data-id]')) {
    const noms = [...li.querySelectorAll('.pq-suggerer-nom[data-houblon]')].filter((n) => V.ids.some((id) => n.getAttribute('data-houblon').endsWith(id)));
    if (!noms.length) continue;
    li.classList.add('m9r-surligne');
    for (const n of noms) n.classList.add('m9r-surligne-nom');
  }
}
const retirer = () => {
  document.querySelectorAll('.m9r-ajout').forEach((n) => n.remove());
  document.querySelectorAll('.m9r-surligne, .m9r-surligne-nom').forEach((n) => n.classList.remove('m9r-surligne', 'm9r-surligne-nom'));
};

const seule = process.env.M9_SEULE;
const mesures = [];
const concordance = [];
for (const Q of QUESTIONS) {
  let reference = null;
  const qA = question('actuel', Q.famille);
  for (const C of COLONNES) {
    if (seule && seule !== `${Q.famille}:${C.combo}` && C.combo !== 'actuel') continue;
    const q = question(C.combo, Q.famille);
    const { browser, page, journal, visee } = await ouvrirEcran({ combo: C.combo, famille: Q.famille });
    // Concordance : les rangées de l'app, rangées par leur rang f9, doivent être les premiers de listes.json.
    const rangees = await page.evaluate(RANGEES);
    const f9 = q.dix.map((d) => d.houblon);
    const vus = rangees.map((r) => r.nom);
    const tri = [...vus].sort((x, y) => f9.indexOf(x) - f9.indexOf(y));
    const ok = tri.every((n, i) => n === f9[i]);
    concordance.push({ famille: Q.famille, combinaison: C.combo, app: vus, f9: f9.slice(0, vus.length), concorde: ok });
    console.log(`${Q.fichier} ${C.combo} : app ${vus.join(', ')} | f9 ${f9.slice(0, vus.length).join(', ')} ${ok ? 'CONCORDE' : 'DIFFÈRE'}`);
    if (!ok) { await browser.close(); throw new Error('les rangées de l’app ne concordent pas avec listes.json'); }
    const cles = rangees.flatMap((r) => r.cles);
    const V = {
      reference: C.combo === 'actuel',
      ids: SIX.map((s) => s.id),
      six: SIX.map((s) => ({ ...s, rang: q.sesSix[s.id], rangA: qA.sesSix[s.id], pourquoi: pourquoiAbsent(s.id, Q.famille), ici: cles.some((k) => k.endsWith(s.id)) })),
    };
    const avant = await page.evaluate(MESURE);
    await page.evaluate(injecter, V);
    await page.mouse.move(1, 1);
    await dormir(500);
    const apres = await page.evaluate(MESURE);
    if (C.combo === 'actuel') reference = apres;
    // La vue : l'écran jusqu'au bas de la dernière rangée de houblon (la levure et la barre Comparer, inchangées, restent dessous).
    const haut = await page.evaluate(() => { const e = document.querySelector('[data-ecran="suggerer"]'); let sc = e; while (sc && !(sc.scrollHeight > sc.clientHeight + 5 && /(auto|scroll)/.test(getComputedStyle(sc).overflowY))) sc = sc.parentElement; return Math.ceil(sc ? sc.scrollHeight + (innerHeight - sc.clientHeight) : document.documentElement.scrollHeight); });
    await page.setViewport({ width: 390, height: Math.min(haut, 4000), deviceScaleFactor: 2, isMobile: true, hasTouch: true });
    await dormir(800);
    const bas = await page.evaluate(() => Math.ceil(document.querySelector('[data-ecran="suggerer"] section[data-groupe="levure"] h3')?.getBoundingClientRect().bottom ?? innerHeight));
    const image = `${Q.fichier}-${C.lettre}.png`;
    await page.screenshot({ path: path.join(IMG, image), clip: { x: 0, y: 0, width: 390, height: Math.min(bas + 14, haut) } });
    const z = await page.evaluate(() => { const r = document.querySelector('.m9r-six').getBoundingClientRect(); return { y: r.top, h: r.height }; });
    await page.screenshot({ path: path.join(ZOOM, `zoom-${image}`), clip: { x: 0, y: Math.max(0, z.y - 20), width: 390, height: z.h + 40 } });
    await page.evaluate(retirer);
    const erreurs = journal.erreurs.filter((e) => !/Firestore|firebase|net::ERR/i.test(e));
    mesures.push({ image, colonne: C.lettre, combinaison: C.combo, question: `plus de ${Q.fichier}, ${MOMENT}`, visee, avant: { noeudsHorsRangs: avant.noeudsHorsRangs, blocs: avant.blocs }, apres: { noeudsHorsRangs: apres.noeudsHorsRangs, blocs: apres.blocs }, ajouts: apres.ajouts, reference: { blocs: reference.blocs }, rangees: vus, six: V.six, erreurs });
    console.log(`  ${image} : ${avant.noeudsHorsRangs} → ${apres.noeudsHorsRangs} nœuds de l'app, ${apres.ajouts} ajoutés, ${bas} px ; ${erreurs.length ? 'erreurs : ' + erreurs.slice(0, 2).join(' | ') : 'aucune erreur de page'}`);
    await browser.close();
  }
}
if (!seule) fs.writeFileSync(path.join(ICI, 'fidelite.json'), JSON.stringify({ lecture: "Écran Suggérer de l'app (copie 645c17f4), neipa v3, dry hop actif, mesuré sans puis avec l'ajout m9r-, même état.", recette: L.recette, concordance, mesures }, null, 1) + '\n');
console.log('CAPTURES', IMG);
void COMBOS;
