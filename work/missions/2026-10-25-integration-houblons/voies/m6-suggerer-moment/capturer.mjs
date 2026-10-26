// Voie m6-suggerer-moment : choisir 60′ ou dry hop dans Suggérer, sur son écran q2b de l'app (son choix : « Ça oui, c'est
// effectivement l'un de mes choix »). Ses mots du 26.10 : « la suggestion doit être pour du 60' comme pour du dryhopping » ;
// « Elle peut aussi être présente pour la suggestion » (l'IA).
// Méthode de m1, m3 et m5 : l'écran Suggérer de l'app tel quel (`?dev-local&etape=houblons`, VITE_HOP_V4=on, fixture locale),
// recette 21C (Nugget 20 g à 60′, Cascade 80 g en dry hop actif), visée « plus d'agrumes » d'un cran (la visée de g1) posée par la
// porte de l'app (`poserVisee`). Chaque variante AJOUTE des nœuds préfixés m6s- (clones des nœuds voisins de l'app, attributs
// data- retirés), retirés après la capture. Rien de l'app n'est caché, déplacé ni réécrit ; l'écran est mesuré avant et après
// chaque ajout (fidelite.json, lu par controle-capture-fidele.mjs).
// Valeurs : celles de g1, telles quelles (voies/g1-suggerer-moments/suggerer-60.json E1 pour 60′ ; suggerer-moments.json pour le
// dry hop actif de la 21C) ; arômes, rôle et stock lus dans les fiches de l'app (`houblon()` de l'adaptateur). « ? » si absent.
// Usage (racine) :
//   node scripts/with_server.mjs --server "npm run dev -- --port 5266 --strictPort" --port 5266 --timeout 120 --env VITE_HOP_V4=on -- node work/missions/2026-10-25-integration-houblons/voies/m6-suggerer-moment/capturer.mjs
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
const ICI = import.meta.dirname;
const RACINE = path.resolve(ICI, '..', '..', '..', '..', '..');
const { ouvrir } = await import(pathToFileURL(path.join(RACINE, '.claude/skills/webapp-testing/examples/_lanceur.mjs')).href);
const IMG = path.join(ICI, 'img');
const ZOOM = path.join(os.tmpdir(), 'm6');
fs.mkdirSync(IMG, { recursive: true });
fs.mkdirSync(ZOOM, { recursive: true });
const base = `http://localhost:${process.env.WITH_SERVER_PORTS}`;
const dormir = (ms) => new Promise((r) => setTimeout(r, ms));
const CLE = 'laffinee_recipe_draft_v1:dev-local:apercu-etape-houblons';
const G1 = path.join(ICI, '..', 'g1-suggerer-moments');

// Les valeurs de g1, telles quelles, pour 60′ (E1 : grammes pour +10 IBU, fonction de l'α seul, sans exclusion : D90 n'y touche pas).
// Le dry hop actif est relu plus bas dans le moteur de l'app (même appel que g1, partie A, sur le commit courant : D90 change le pool).
const E1 = JSON.parse(fs.readFileSync(path.join(G1, 'suggerer-60.json'), 'utf8')).E1.find((x) => x.recette === '21C');
const MOM = JSON.parse(fs.readFileSync(path.join(G1, 'suggerer-moments.json'), 'utf8')).A.find((x) => x.recette === '21C');
const dryG1 = MOM.visees.find((v) => v.visee === 'plus d’agrumes').parMoment.dryActive;
const lireLigne = (t) => ({ nom: t.label.match(/^Ajouter (.+?) · /)[1], g: Number(t.label.match(/· (\d+) g$/)[1]), effets: t.effets });
const VAL = {
  ibuAvant: Math.round(MOM.ibuRecette * 10) / 10, ibuAjoute: E1.ibuAjoute,
  e1: E1.moinsDeGrammes.slice(0, 5),
  g1Dry: { top5: dryG1.top5.map(lireLigne), premierGroupe: dryG1.premierGroupe, groupes: dryG1.groupesDistincts, ajouts: dryG1.ajouts },
};

const { browser, page, journal } = await ouvrir({ largeur: 390, hauteur: 844 });
await page.goto(`${base}/?dev-local&etape=houblons`, { waitUntil: 'networkidle0' });
await page.waitForSelector('[data-ecran="ma-biere"]', { timeout: 120000 });
await page.click('[data-role="dose-plus"]');
await dormir(1500);
await page.evaluate((cle) => {
  const e = JSON.parse(localStorage.getItem(cle));
  const hops = [{ name: 'Nugget', alpha: 13, weightG: 20, stage: 'boil', timeMin: 60 }, { name: 'Cascade', alpha: 6, weightG: 80, stage: 'dryHop', aromaTiming: 'fermentation', aromaContactHours: 72 }];
  for (const r of [e.draft.recipe, e.draft.details]) Object.assign(r, { name: 'Hazy du jeudi', style: '21C', hops, ogTarget: 1.058, colorEbc: 8 });
  e.draft.step = 'houblons'; e.draft.recipe.id = e.draft.details.id = 'REC-A2';
  localStorage.setItem(cle.replace('apercu-etape-houblons', 'new'), JSON.stringify(e));
}, CLE);
await page.goto(`${base}/?dev-local&etape=houblons&recette=vide`, { waitUntil: 'networkidle0' });
await page.waitForSelector('[data-role="ligne-houblon"]', { timeout: 120000 });
await dormir(1500);
// La visée de g1, « plus d'agrumes » d'un cran : ma bière est à 20,5 points d'agrumes, le cran de la 21C à 33,3 (lus par bissection
// sur le sens de l'objectif, data-direction) ; la visée posée à 20,5 + 0,95 cran, par la porte de l'app.
await page.evaluate(async () => { const V = await import('/src/ui/hopIndex/parcours/visee.ts'); V.poserVisee({ citrus: V.enNiveau(20.51 + 33.33 * 0.95) }); });
await dormir(600);
await page.evaluate(() => window.__hopPile.open({ view: 'hopSuggest' }));
await page.waitForSelector('[data-ecran="suggerer"] [data-groupe]:not([data-groupe="levure"]) li', { timeout: 120000 });
await dormir(2500);

// Le dry hop actif de la 21C, « plus d'agrumes » d'un cran, dans le moteur de l'app : l'appel de g1 (suggerer-moments.ts, partie A,
// `parMoment`), pool des 318 variétés sans stock, un seul moment.
const DRY = await page.evaluate(async () => {
  const { creerMoteur } = await import('/src/domain/hopIndex/v4/moteur.ts');
  const { CATALOGUE } = await import('/src/domain/hopIndex/v4/data.ts');
  const { FAMILIES } = await import('/src/domain/hopIndex/v4/families.ts');
  const m = creerMoteur({ catalogue: CATALOGUE, stock: [] });
  const R = { name: 'Hazy du jeudi (21C)', styleCode: '21C', volumeL: 20, og: 1.058, boilMin: 60, yeastId: 'fermentis-us05', ebc: 8, additions: [
    { id: 'a1', hopKey: 'beermaverick-nugget', moment: 'b60', grams: 20 }, { id: 'a2', hopKey: 'beermaverick-cascade', moment: 'dryActive', grams: 80 }] };
  const r = m.proposeVoies(R, { citrus: 1 }, { maxBuy: 400, limit: 2000, buyLimit: 2000, perHop: 100, moments: ['dryActive'], assemblages: false });
  const aj = r.voies.filter((v) => v.type === 'ajouter');
  return {
    ajouts: aj.length, groupes: new Set(aj.map((v) => v.rank)).size, premierGroupe: aj.filter((v) => v.rank === aj[0].rank).length,
    top5: aj.slice(0, 5).map((v) => ({ label: v.label, effets: Object.fromEntries(FAMILIES.filter((f) => v.effect[f].established).map((f) => [f, Math.round(v.effect[f].central * 10) / 10])) })),
  };
});
Object.assign(VAL, { dry: DRY.top5.map(lireLigne), dryGroupe: DRY.premierGroupe, dryGroupes: DRY.groupes, dryAjouts: DRY.ajouts });
console.log('dry hop actif (moteur courant) :', JSON.stringify({ ajouts: DRY.ajouts, groupes: DRY.groupes, premier: DRY.premierGroupe, top5: VAL.dry.map((h) => `${h.nom} ${h.g} g ${h.effets.citrus}`) }));
console.log('dry hop actif (g1, avant D90) :', JSON.stringify({ ajouts: VAL.g1Dry.ajouts, groupes: VAL.g1Dry.groupes, premier: VAL.g1Dry.premierGroupe, top5: VAL.g1Dry.top5.map((h) => `${h.nom} ${h.g} g ${h.effets.citrus}`) }));

// Les fiches de l'app pour les houblons ajoutés : rôle, arômes cités ou marqués, stock (null : à acheter).
const FICHES = await page.evaluate(async (noms) => {
  const A = await import('/src/ui/hopIndex/parcours/adaptateur.ts');
  const out = {};
  for (const nom of noms) {
    const cle = 'beermaverick-' + nom.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const h = A.houblon(cle);
    out[nom] = h.connu ? { cle, role: h.role.mot, regle: h.role.source === 'règle', alpha: h.alpha?.valeur ?? null, stock: h.stock, familles: Object.fromEntries(Object.entries(h.familles).filter(([, v]) => v.niveau !== 'non décrit').map(([f, v]) => [f, v.niveau])) } : { cle, inconnu: true };
  }
  return out;
}, [...VAL.e1.map((h) => h.nom), ...VAL.dry.map((h) => h.nom)]);
VAL.fiches = FICHES;

const ecranLu = await page.evaluate(() => ({
  onglet: document.querySelector('[data-ecran="suggerer"]')?.closest('body')?.querySelector('[aria-current="page"], [aria-selected="true"]')?.textContent ?? null,
  objectifs: [...document.querySelectorAll('[data-role="objectif"]')].map((o) => o.getAttribute('aria-label')),
  groupes: [...document.querySelectorAll('[data-ecran="suggerer"] [data-groupe]')].map((g) => `${g.getAttribute('data-groupe')} : ${g.querySelector('h3')?.textContent} (${g.querySelectorAll('li').length})`),
  ibu: document.querySelector('[data-role="ibu"]')?.getAttribute('data-valeur'),
}));
console.log('écran :', JSON.stringify(ecranLu));

// La mesure de l'écran de l'app : nœuds visibles hors ajouts, et ses blocs (data-role, data-etat, data-element, titres).
const MESURE = () => {
  const ecran = document.querySelector('[data-ecran="suggerer"]');
  const visible = (e) => { const r = e.getBoundingClientRect(); const s = getComputedStyle(e); return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.opacity !== '0'; };
  const tous = [...ecran.querySelectorAll('*')].filter((e) => !e.closest('.m6s-ajout')).filter(visible);
  const blocs = new Set();
  for (const e of tous) {
    for (const a of ['data-role', 'data-etat', 'data-element', 'data-groupe']) { const v = e.getAttribute(a); if (v) blocs.add(`${a.slice(5)}:${v}`); }
    if (/^(H1|H2|H3|SUMMARY)$/.test(e.tagName)) blocs.add(`${e.tagName.toLowerCase()}:${e.textContent.trim().slice(0, 40)}`);
  }
  const ajouts = [...ecran.querySelectorAll('.m6s-ajout *')].filter(visible).length;
  return { noeudsHorsRangs: tous.length, blocs: [...blocs].sort(), ajouts };
};

// Les ajouts, dans la page rendue (L26 : classes m6s-, code dans une fonction, aucun remplacement de chaîne).
function injecter(nom, V) {
  const ecran = document.querySelector('[data-ecran="suggerer"]');
  const graphe = ecran.querySelector('[data-role="graphe"]');
  const cartes = ecran.querySelector('section[aria-label="Objectifs"]');
  // Le premier groupe de voies de l'app (« Ajouter · 10′ » depuis D90), son modèle ; la levure reste en dernier.
  const secLevure = graphe.querySelector('section[data-groupe="levure"]');
  const sec0 = graphe.querySelector('section[data-groupe]:not([data-groupe="levure"])');
  const idsApp = [...graphe.querySelectorAll('section[data-groupe]:not([data-groupe="levure"]) li[data-id]')].map((l) => l.getAttribute('data-id'));
  const nApp = (m) => idsApp.filter((i) => i.includes(`@${m}:`)).length;
  const cadre = !!sec0.querySelector(':scope > div .pq-sg-bar');
  const fr = (x, d = 1) => (Math.round(x * 10 ** d) / 10 ** d).toLocaleString('fr-CH', { maximumFractionDigits: d });
  const ROUE = ['citrus', 'tropical', 'melon', 'stoneFruit', 'pomeFruit', 'berries', 'floral', 'green', 'herbal', 'spice', 'earthy', 'resin'];
  const COURT = { citrus: 'Agrumes', tropical: 'Tropicaux', melon: 'Melon', stoneFruit: 'Noyau', pomeFruit: 'Pépins', berries: 'Baies', floral: 'Floral', green: 'Végétal', herbal: 'Herbacé', spice: 'Épicé', earthy: 'Terreux', resin: 'Résineux' };
  const USAGE = { dual: 'mixte', bittering: 'amer', aroma: 'arôme' };
  const ibuApres = V.ibuAvant + V.ibuAjoute;
  // Un clone d'un nœud de l'app, sans ses attributs data- ni id (il n'est pas l'app ; ses classes donnent le même dessin).
  const nettoyer = (n) => { for (const e of [n, ...n.querySelectorAll('*')]) for (const a of [...e.attributes]) if (a.name.startsWith('data-') || a.name === 'id') e.removeAttribute(a.name); return n; };
  const cloner = (n) => nettoyer(n.cloneNode(true));
  const DRY_SVG = '<svg width="12" height="14" viewBox="0 0 14 16" aria-hidden="true"><path d="M2 1 H12 V9 L7 15 L2 9 Z" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"></path><circle cx="5.5" cy="7" r="1.2" fill="currentColor"></circle><circle cx="8.5" cy="4.5" r="1.2" fill="currentColor"></circle></svg>';
  const STAR = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 1.5l1.5 4.2 4.2 1.5-4.2 1.5L8 12.9 6.5 8.7 2.3 7.2l4.2-1.5z" fill="currentColor"></path></svg>';

  if (!document.querySelector('style.m6s-ajout')) {
    const st = document.createElement('style');
    st.className = 'm6s-ajout';
    st.textContent = `
.m6s-dose { margin-left: 2px; font: 700 14px/1 system-ui, sans-serif; font-variant-numeric: tabular-nums; color: rgb(var(--cave-50)); white-space: nowrap; }
.m6s-ibu { font: 700 14px/1 ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; color: rgb(var(--cave-200)); white-space: nowrap; margin-left: 4px; }
.m6s-fane { opacity: .75; }
.m6s-autres { padding: 6px 10px 8px 12px; font-size: 14px; line-height: 1.3; color: rgb(var(--cave-200)); border-top: 1px solid rgb(var(--cave-800)); }
.m6s-autres b { color: rgb(var(--cave-50)); }
/* M2 : la carte « Plus d'amertume », dans la forme des cartes q2b, couchée sur la largeur. */
.m6s-carte { flex-direction: row !important; align-items: center; gap: 10px !important; min-height: 0 !important; padding-block: 7px !important; background: linear-gradient(160deg, rgb(var(--cave-950)), #e9ebef) !important; border: 0; text-align: left; width: 100%; font: inherit; color: inherit; cursor: pointer; }
.m6s-carte-on { box-shadow: 0 0 0 2.5px rgb(var(--cave-50)) inset; }
.m6s-carte-t { display: grid; gap: 3px; min-width: 0; }
.m6s-carte-t > span:first-child { display: flex; align-items: center; gap: 5px; font-size: 14px; font-weight: 700; color: #3c414c; line-height: 1.1; white-space: nowrap; }
.m6s-carte .pq-sg-verdict.m6s-propose { color: #3c414c; }
.m6s-carte .pq-sg-verdict { font-size: 19px; }
.m6s-carte-d { margin-left: auto; display: grid; justify-items: end; gap: 2px; }
.m6s-carte-d b { font: 700 15px/1 ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; font-variant-numeric: tabular-nums; color: rgb(var(--cave-50)); white-space: nowrap; }
.m6s-carte-d small { font-size: 14px; color: rgb(var(--cave-400)); white-space: nowrap; }
.m6s-piste { position: relative; display: block; width: 96px; height: 18px; }
.m6s-piste i { position: absolute; display: block; }
.m6s-piste .m6s-p-fond { left: 0; right: 0; top: 6px; height: 6px; border-radius: 3px; background: rgb(var(--cave-950)); box-shadow: inset 0 0 0 1px #c9ccd3; }
.m6s-piste .m6s-p-style { top: 6px; height: 6px; background: #d5d8df; border-radius: 3px; }
.m6s-piste .m6s-p-barre { top: 6px; height: 6px; border-radius: 3px; background: #3c414c; }
.m6s-piste .m6s-p-avant { top: 2px; bottom: 2px; width: 2px; background: rgb(var(--cave-50)); border-radius: 1px; }
.m6s-piste .m6s-p-visee { top: 0; bottom: 0; width: 0; border-left: 2px dashed rgb(var(--cave-50)); }
/* M3 : les trois puces « Quand ? ». */
.m6s-quand { display: flex; align-items: center; gap: 5px; flex-wrap: wrap; padding: 2px 0 0; }
.m6s-quand > span { font-size: 14px; font-weight: 700; color: rgb(var(--cave-200)); margin-right: 2px; }
.m6s-puce { display: inline-flex; align-items: center; gap: 5px; height: 32px; padding: 0 10px; border-radius: 16px; border: 1.5px solid rgb(var(--cave-50)); background: rgb(var(--cave-950)); font: 600 14px/1 system-ui, sans-serif; color: rgb(var(--cave-50)); white-space: nowrap; }
.m6s-puce b { font: 700 14px/1 ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; color: rgb(var(--cave-400)); }
.m6s-puce svg { flex: none; }
/* F : la frise du brassin. */
.m6s-frise { position: relative; height: 100px; margin: 2px 0 0; font-family: system-ui, sans-serif; }
.m6s-f-ligne { position: absolute; left: 4px; right: 4px; top: 46px; height: 3px; border-radius: 2px; background: rgb(var(--cave-50)); }
.m6s-f-coupe { position: absolute; top: 38px; width: 2px; height: 19px; background: rgb(var(--cave-50)); }
.m6s-f-zone { position: absolute; top: 78px; font-size: 14px; color: rgb(var(--cave-400)); white-space: nowrap; transform: translateX(-50%); }
.m6s-f-sienne { position: absolute; top: 40px; width: 15px; height: 15px; margin-left: -7.5px; border-radius: 50%; background: rgb(var(--cave-50)); border: 2.5px solid rgb(var(--cave-950)); box-sizing: border-box; }
.m6s-f-sien { position: absolute; top: 58px; font-size: 14px; font-weight: 700; color: rgb(var(--cave-50)); white-space: nowrap; }
.m6s-f-voie { position: absolute; top: 3px; height: 30px; transform: translateX(-50%); display: inline-flex; align-items: center; gap: 4px; padding: 0 8px; border-radius: 15px; border: 1.5px dashed rgb(var(--cave-600)); background: rgb(var(--cave-950)); font: 600 14px/1 system-ui, sans-serif; color: rgb(var(--cave-50)); white-space: nowrap; }
.m6s-f-voie b { font: 800 14px/1 ui-monospace, Menlo, Consolas, monospace; }
.m6s-f-voie::after { content: ""; position: absolute; left: 50%; top: 100%; width: 1.5px; height: 9px; background: rgb(var(--cave-600)); }
.m6s-f-amer { border-style: solid; border-color: #3c414c; }
/* La puce IA (forme de Substituer, voie i2) et sa phrase. */
.m6s-ia { display: inline-flex; align-items: center; gap: 5px; height: 28px; padding: 0 10px 0 8px; border-radius: 13px; border: 1px dashed #8a8a8a; background: #fff; color: #444; font: 600 14px/1 system-ui, sans-serif; white-space: nowrap; }
.m6s-ia svg { width: 12px; height: 12px; color: #0072B2; flex: none; }
.m6s-phrase { display: block; margin: 3px 0 2px; font-size: 14px; line-height: 1.3; color: #333; font-weight: 400; }
.m6s-phrase i { font-style: normal; font-size: 14px; font-weight: 700; letter-spacing: .04em; color: #0072B2; margin-right: 3px; }
/* Le détail d'une rangée, au toucher. */
.m6s-det { margin: 2px 6px 6px 8px; padding: 6px 9px 7px; border-radius: 8px; background: rgb(var(--cave-900)); font-size: 14px; line-height: 1.35; color: rgb(var(--cave-50)); display: grid; gap: 2px; }
.m6s-det b { font-variant-numeric: tabular-nums; }
.m6s-det .m6s-src { font-size: 14px; color: rgb(var(--cave-400)); }
.m6s-li-on .m6s-det { box-shadow: inset 3px 0 0 rgb(var(--cave-50)); }
`;
    document.head.appendChild(st);
  }
  const marque = (n, cle) => { n.classList.add('m6s-ajout'); n.setAttribute('data-m6s', cle); return n; };

  // Les modèles, pris aux voisins : une rangée (Belma, 10′, sa barre), sa case d'objectif, une case d'extra, le séparateur.
  const li0 = sec0.querySelector('li');
  const caseObj = li0.querySelector('[data-role="cible"]');
  const caseExtra = li0.querySelector('[data-role="extra"]');
  const separe = li0.querySelector('.pq-suggerer-separe');
  const caseDe = (f, niveau, opts) => {
    const c = cloner(opts.objectif ? caseObj : caseExtra);
    c.querySelector('use')?.setAttribute('href', `#p-${f}`);
    c.classList.toggle('pq-suggerer-case-marquee', !!opts.objectif && niveau === 'marqué');
    c.classList.toggle('pq-suggerer-case-pale', niveau === 'cité');
    c.setAttribute('aria-label', opts.label);
    // Un trait par cran (+1 cran ici) ; les crans vides comptés du groupe de l'app ne valent pas pour ce groupe.
    c.querySelectorAll('.pq-suggerer-trait-vide').forEach((n) => n.remove());
    if (opts.sansTrait) { c.querySelector('.flex.items-end')?.remove(); c.classList.add('m6s-fane'); }
    return c;
  };
  const rangee = ({ nom, alpha, usage, regle, cases, dose, barre, cleLigne }) => {
    const li = cloner(li0);
    li.classList.add('m6s-li');
    li.setAttribute('data-m6s-li', cleLigne);
    const p = li.querySelector('.pq-sg-l1');
    const u = p.querySelector('.pq-suggerer-usage');
    u.textContent = usage ?? '?'; if (!regle) u.classList.remove('pq-suggerer-usage-regle'); u.setAttribute('aria-label', `usage : ${usage ?? 'inconnu'}`);
    p.querySelector('.pq-suggerer-nom').textContent = nom;
    p.querySelector('.pq-suggerer-alpha').textContent = alpha == null ? '?' : `${fr(alpha)}%`;
    p.querySelector('.pq-sg-hors16d')?.remove();
    const c = li.querySelector('[aria-label="Effet sur les familles"]');
    c.replaceChildren(...cases);
    // La dose : la case « 40 g » de l'app sur la ligne du nom (depuis D90), sinon un ajout à la même place.
    const caseDose = [...p.children].find((s) => s.classList.contains('font-mono') && /\sg$/.test(s.textContent.trim()));
    if (caseDose && dose) caseDose.textContent = dose; else if (caseDose) caseDose.remove(); else if (dose) p.insertAdjacentHTML('beforeend', `<b class="m6s-dose pq-sg-sur-axe">${dose}</b>`);
    // La barre de la rangée (à droite de l'axe) : son effet, sa couleur, la zone jusqu'au haut du style.
    const bars = li.querySelectorAll('.pq-sg-bar');
    bars.forEach((b, i) => { if (i > 0) b.remove(); });
    const bar = bars[0], zone = li.querySelector('.pq-sg-zt');
    if (bar) {
      bar.style.width = `${barre.largeur}%`; bar.setAttribute('aria-label', barre.aria);
      if (barre.couleur) { bar.style.setProperty('--pq-c', barre.couleur); zone?.style.setProperty('--pq-c', barre.couleur); }
      if (barre.zone != null && zone) zone.style.width = `${barre.zone}%`;
    }
    for (const b of li.querySelectorAll('button')) b.setAttribute('aria-label', b.getAttribute('aria-label').replace('Belma', nom));
    return li;
  };
  const familles = (n) => ROUE.filter((f) => V.fiches[n]?.familles?.[f]);
  // Stock : la fiche de l'app ; null = pas au stock, l'icône de l'app (le chariot) reste ; inconnu : pas d'icône.
  const stock = (li, n) => { if (V.fiches[n]?.stock != null || V.fiches[n]?.inconnu) [...li.querySelector('.pq-sg-l1').children].find((s) => s.querySelector('svg') && !s.classList.contains('pq-sg-noms'))?.remove(); return li; };

  // Un groupe, cloné du premier groupe de l'app (« Ajouter · 10′ ») : titre, moment, une précision, ses rangées (barre par rangée).
  // Deux grammaires de l'app : le cadre « = même effet » (dose au titre, la barre une fois au-dessus) et la liste « Ajouter » (dose et
  // barre par rangée). Le groupe ajouté suit celle du modèle.
  const groupe = ({ cle, titre, dose, moment, dry: estDry, barre, rangs, pied }) => {
    const s = marque(cloner(sec0), cle);
    const h = s.querySelector('h3');
    const t = h.children[0], m = h.querySelector('.pq-suggerer-moment');
    t.querySelector('span:last-child').textContent = titre;
    const d = [...h.children].find((n) => n !== t && n !== m);
    if (d && dose) d.textContent = dose; else if (d) d.remove(); else if (dose) t.insertAdjacentHTML('afterend', `<span class="pq-sg-sur-axe font-semibold text-cave-200">${dose}</span>`);
    if (estDry) { m.classList.add('gap-1'); m.innerHTML = `${DRY_SVG}${moment}`; } else m.textContent = moment;
    const bg = s.querySelector(':scope > div .pq-sg-bar');
    if (bg) {
      const zone = s.querySelector(':scope > div .pq-sg-zt'), lab = s.querySelector(':scope > div .pq-sg-lab');
      bg.style.width = `${barre.largeur}%`; bg.setAttribute('aria-label', barre.aria);
      if (lab) { lab.textContent = barre.texte; lab.style.setProperty('--pq-k', `${barre.largeur}%`); }
      if (barre.couleur) { bg.style.setProperty('--pq-c', barre.couleur); zone?.style.setProperty('--pq-c', barre.couleur); if (lab) lab.style.color = barre.couleur; }
      if (barre.zone != null && zone) zone.style.width = `${barre.zone}%`;
    }
    const ul = s.querySelector('ul');
    ul.replaceChildren(...rangs);
    if (pied) ul.insertAdjacentHTML('beforeend', `<li class="m6s-autres">${pied}</li>`);
    return s;
  };

  // Le groupe 60′ : les 5 premiers de E1 (moins de grammes pour +10 IBU), dose par rangée, la barre d'IBU une fois.
  const g60 = () => groupe({
    cle: 'g60', titre: 'Amérisant', dose: `+${V.ibuAjoute} IBU`, moment: '60′',
    barre: { largeur: 25, zone: 80, couleur: '#3c414c', texte: `+${V.ibuAjoute} IBU`, aria: `IBU ${fr(V.ibuAvant)} → ${fr(V.ibuAvant + V.ibuAjoute)}, style 25–60` },
    rangs: V.e1.map((h) => stock(rangee({
      nom: h.nom, alpha: h.alpha, usage: USAGE[h.usage] ?? null, dose: `${fr(h.g)} g`, cleLigne: `60-${h.nom}`,
      barre: { largeur: 25, zone: 80, couleur: '#3c414c', aria: `IBU ${fr(V.ibuAvant)} → ${fr(V.ibuAvant + V.ibuAjoute)}, style 25–60` },
      cases: [
        ...familles(h.nom).map((f) => caseDe(f, V.fiches[h.nom].familles[f], { sansTrait: true, label: `${COURT[f]} : ${V.fiches[h.nom].familles[f]} par les fiches` }))],
    }), h.nom)),
    pied: `<b>${fr(Math.min(...V.e1.map((h) => h.g)))} à ${fr(Math.max(...V.e1.map((h) => h.g)))} g</b> pour +${V.ibuAjoute} IBU ; à 60′, l'arôme ne monte pas.`,
  });
  // Le groupe du dry hop actif : les 5 premiers de g1 (ex æquo à 40 g, +42 en agrumes), puis le reste du groupe d'ex æquo.
  const gDry = () => groupe({
    cle: 'gdry', titre: cadre ? 'même effet' : 'Dry hop', dose: cadre ? `${V.dry[0].g} g` : null, moment: 'actif', dry: true,
    barre: { largeur: Math.round(V.dry[0].effets.citrus), texte: '+1 cran', aria: `Agrumes +${fr(V.dry[0].effets.citrus / 33.33)} cran` },
    rangs: V.dry.map((h) => stock(rangee({
      nom: h.nom, alpha: V.fiches[h.nom]?.alpha ?? null, usage: V.fiches[h.nom]?.role ?? null, regle: !!V.fiches[h.nom]?.regle, cleLigne: `dry-${h.nom}`,
      dose: cadre ? null : `${h.g} g`, barre: { largeur: Math.round(h.effets.citrus), aria: `Agrumes +${fr(h.effets.citrus / 33.33)} cran` },
      cases: [caseDe('citrus', V.fiches[h.nom]?.familles?.citrus ?? 'cité', { objectif: true, label: `Agrumes +${fr(h.effets.citrus / 33.33)} cran` }), cloner(separe),
        ...ROUE.filter((f) => f !== 'citrus' && h.effets[f] >= 0.5 * 33.33).map((f) => caseDe(f, V.fiches[h.nom]?.familles?.[f] ?? 'cité', { label: `${COURT[f]} +${fr(h.effets[f] / 33.33)} cran` }))],
    }), h.nom)),
    pied: V.dryGroupe > V.dry.length ? `<b>+ ${V.dryGroupe - V.dry.length} autres</b> au même effet, rangés par ordre alphabétique.` : `<b>+ ${V.dryAjouts - V.dry.length} autres</b> plus loin.`,
  });

  // M2 : la carte, clonée de la carte d'objectif de l'app.
  const carte = () => {
    const c = marque(document.createElement('button'), 'carte');
    c.type = 'button';
    c.className = `${cartes.querySelector('[data-role="objectif"]').className} m6s-ajout m6s-carte`;
    c.setAttribute('data-m6s-ouvre', 'g60');
    c.setAttribute('aria-label', `Plus d'amertume, proposé : +${V.ibuAjoute} IBU à 60′ (${fr(V.ibuAvant)} → ${fr(V.ibuAvant + V.ibuAjoute)}, style 25–60), aucune visée posée`);
    const x = (v) => `${((v - 0) / 70) * 100}%`;
    c.innerHTML = `<span class="m6s-carte-t"><span>Plus d'amertume</span>
      <span class="pq-sg-verdict m6s-propose leading-none">+${V.ibuAjoute} IBU</span></span>
      <span class="m6s-piste" aria-hidden="true"><i class="m6s-p-fond"></i><i class="m6s-p-style" style="left:${x(25)};width:calc(${x(60)} - ${x(25)})"></i><i class="m6s-p-barre" style="left:${x(V.ibuAvant)};width:calc(${x(V.ibuAvant + V.ibuAjoute)} - ${x(V.ibuAvant)})"></i><i class="m6s-p-avant" style="left:${x(V.ibuAvant)}"></i><i class="m6s-p-visee" style="left:${x(V.ibuAvant + V.ibuAjoute)}"></i></span>
      <span class="m6s-carte-d"><b>${Math.round(V.ibuAvant)} → ${Math.round(V.ibuAvant + V.ibuAjoute)}</b><small>IBU · style 25–60</small></span>`;
    return c;
  };
  const puceIA = () => { const b = document.createElement('button'); b.type = 'button'; b.className = 'm6s-ia pq-sg-sur-axe'; b.setAttribute('aria-label', 'Ordre de l’IA prêt. Toucher pour l’appliquer.'); b.innerHTML = `${STAR}ordre IA prêt`; return b; };

  const posees = [];
  const poser = (n, avant) => { (avant ? avant.parentNode : graphe).insertBefore(n, avant ?? null); posees.push(n); return n; };
  const groupesM1 = () => { poser(gDry(), secLevure); poser(g60(), secLevure); };

  if (nom === 'm1') groupesM1();
  if (nom === 'm2' || nom === 'm2-ouverte') { const c = carte(); cartes.appendChild(c); posees.push(c); }
  if (nom.startsWith('m1m2')) { const c = carte(); cartes.appendChild(c); posees.push(c); groupesM1(); }
  if (nom === 'm3') {
    groupesM1();
    const q = marque(document.createElement('div'), 'quand');
    q.className += ' m6s-quand'; q.setAttribute('role', 'group'); q.setAttribute('aria-label', 'Quand ? Les trois moments sont montrés');
    q.innerHTML = `<span>Quand ?</span>
      <button type="button" class="m6s-puce" aria-pressed="true">60′ <b>${V.e1.length}</b></button>
      <button type="button" class="m6s-puce" aria-pressed="true">10′ et whirlpool <b>${idsApp.length}</b></button>
      <button type="button" class="m6s-puce" aria-pressed="true">${DRY_SVG}dry hop <b>${V.dryGroupe}</b></button>`;
    cartes.after(q); posees.push(q);
  }
  if (nom === 'f') {
    groupesM1();
    // La frise du brassin : ses deux ajouts (Nugget 60′, Cascade actif) en points noirs, les voies proposées au-dessus.
    const X = { b60: 6, b10: 33, wp: 50, actif: 70, apres: 90 };
    const fz = marque(document.createElement('div'), 'frise');
    fz.className += ' m6s-frise'; fz.setAttribute('role', 'group'); fz.setAttribute('aria-label', 'Le brassin : Nugget 20 g à 60′ et Cascade 80 g en dry hop actif ; voies à 60′, 10′, whirlpool et dry hop actif');
    fz.innerHTML = `<i class="m6s-f-ligne"></i><i class="m6s-f-coupe" style="left:calc(${X.wp + 9}% - 1px)"></i>
      <span class="m6s-f-sienne" style="left:${X.b60 + 1}%"></span><span class="m6s-f-sien" style="left:${X.b60 + 4}%">Nugget 20 g</span>
      <span class="m6s-f-sienne" style="left:${X.actif}%"></span><span class="m6s-f-sien" style="left:${X.actif + 3}%">Cascade 80 g</span>
      <button type="button" class="m6s-f-voie m6s-f-amer" style="left:${X.b60 + 10}%" data-m6s-ouvre="g60">IBU <b>+${V.ibuAjoute}</b></button>
      <button type="button" class="m6s-f-voie" style="left:${X.b10}%" aria-label="${nApp('b10')} voies à 10′">10′ <b>${nApp('b10')}</b></button>
      <button type="button" class="m6s-f-voie" style="left:${X.wp}%" aria-label="${nApp('wp')} voies au whirlpool">wp <b>${nApp('wp')}</b></button>
      <button type="button" class="m6s-f-voie" style="left:${X.actif + 13}%" aria-label="${V.dryGroupe} voies au dry hop actif, au même effet">${DRY_SVG}<b>${V.dryGroupe}</b></button>
      <span class="m6s-f-zone" style="left:${(X.b60 + X.wp + 9) / 2}%">ébullition · whirlpool</span><span class="m6s-f-zone" style="left:${(X.wp + 9 + 100) / 2}%">fermentation</span>`;
    cartes.after(fz); posees.push(fz);
  }
  if (nom.includes('ia')) {
    const s = posees.find((n) => n.getAttribute('data-m6s') === 'gdry');
    s.querySelector('h3').appendChild(puceIA());
  }

  // Les touchers : la carte ouvre (pose) le groupe 60′ en tête de la liste ; une rangée ouvre son détail ou la phrase de l'IA.
  const detail60 = (h) => `<span>cohumulone <b>${h.cohu == null ? '?' : `${fr(h.cohu)} %`}</b> · β <b>${h.beta == null ? '?' : `${fr(h.beta)} %`}</b></span>
    <span><b>${fr(h.g)} g à 60′</b> → IBU <b>${fr(V.ibuAvant)} → ${fr(V.ibuAvant + V.ibuAjoute)}</b> (style 25–60)</span>
    <span class="m6s-src">${V.fiches[h.nom]?.stock == null ? 'à acheter' : `stock ${fr(V.fiches[h.nom].stock, 0)} g`} · dose g1 (E1, 20 L)</span>`;
  const phraseIA = (n) => {
    const m = familles(n).filter((f) => V.fiches[n].familles[f] === 'marqué').map((f) => COURT[f].toLowerCase());
    return `<i>IA</i>Ses fiches marquent ${m.length ? m.join(', ').replace(/, ([^,]+)$/, ' et $1') : '?'} ; au dry hop actif, la levure peut en tirer du fruit.`;
  };
  window.__m6sClic = (ev) => {
    const t = ev.target.closest?.('[data-m6s-ouvre], [data-m6s-li]');
    if (!t || !t.closest('.m6s-ajout')) return;
    ev.stopPropagation(); ev.preventDefault();
    if (t.matches('[data-m6s-ouvre]')) {
      t.classList.toggle('m6s-carte-on');
      if (!posees.some((n) => n.getAttribute('data-m6s') === 'g60')) poser(g60(), sec0);
      return;
    }
    const cle = t.getAttribute('data-m6s-li');
    t.classList.add('m6s-li-on');
    if (cle.startsWith('60-')) {
      const h = V.e1.find((x) => `60-${x.nom}` === cle);
      const d = document.createElement('div'); d.className = 'm6s-ajout m6s-det'; d.innerHTML = detail60(h);
      t.querySelector('.min-w-0').appendChild(d);
    } else {
      const n = cle.slice(4);
      const p = document.createElement('span'); p.className = 'm6s-ajout m6s-phrase'; p.innerHTML = phraseIA(n);
      t.querySelector('[aria-label="Effet sur les familles"]').after(p);
    }
  };
  if (!window.__m6sEcoute) { window.__m6sEcoute = true; ecran.addEventListener('click', (ev) => window.__m6sClic(ev), true); }
  return { posees: posees.length };
}

const VARIANTES = [
  { nom: 'a', image: 'a-actuel.png' },
  { nom: 'm1', image: 'm1-groupes-60-dryhop.png' },
  { nom: 'm2', image: 'm2-carte-amertume.png' },
  { nom: 'm2-ouverte', image: 'm2-carte-touchee.png', toucher: '.m6s-carte' },
  { nom: 'm1m2', image: 'm1m2.png' },
  { nom: 'm1m2-polaris', image: 'm1m2-polaris-touche.png', toucher: '[data-m6s-li="60-Polaris"] .pq-suggerer-nom' },
  { nom: 'm3', image: 'm3-puces-quand.png' },
  { nom: 'f', image: 'f-frise-brassin.png' },
  { nom: 'm1m2-ia', image: 'm1m2-ia.png' },
  { nom: 'm1m2-ia-phrase', image: 'm1m2-ia-phrase.png', toucher: '[data-m6s-li="dry-Galaxy"] .pq-suggerer-nom' },
];
const hauteurContenu = () => page.evaluate(() => { const e = document.querySelector('[data-ecran="suggerer"]'); let sc = e; while (sc && !(sc.scrollHeight > sc.clientHeight + 5 && /(auto|scroll)/.test(getComputedStyle(sc).overflowY))) sc = sc.parentElement; return sc ? sc.scrollHeight + (innerHeight - sc.clientHeight) : document.documentElement.scrollHeight; });
const vue = (h) => page.setViewport({ width: 390, height: h, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
const mesures = [];
let reference = null;
const seule = process.env.M6_SEULE;
for (const v of VARIANTES) {
  if (seule && v.nom !== 'a' && !seule.split(',').includes(v.nom)) continue;
  const avant = await page.evaluate(MESURE);
  if (v.nom !== 'a') await page.evaluate(injecter, v.nom, VAL);
  await page.mouse.move(1, 1);
  if (v.toucher) { await page.evaluate((s) => document.querySelector(s).click(), v.toucher); }
  await dormir(400);
  const apres = await page.evaluate(MESURE);
  if (v.nom === 'a') reference = apres;
  const haut = Math.min(Math.ceil(await hauteurContenu()), 6000);
  await vue(haut);
  await dormir(700);
  await page.screenshot({ path: path.join(IMG, v.image) });
  // Recadrage des ajouts pour la relecture (L12), hors du dossier de la voie.
  const zones = await page.evaluate(() => [...document.querySelectorAll('[data-m6s]')].map((n) => { const r = n.getBoundingClientRect(); return { y: r.top, b: r.bottom }; }));
  if (zones.length) {
    const y0 = Math.max(0, Math.min(...zones.map((z) => z.y)) - 60), y1 = Math.min(haut, Math.max(...zones.map((z) => z.b)) + 20);
    await page.screenshot({ path: path.join(ZOOM, `zoom-${v.image}`), clip: { x: 0, y: y0, width: 390, height: Math.min(y1 - y0, 1400) } });
  }
  await vue(844);
  await dormir(400);
  mesures.push({ image: v.image, colonne: v.nom, toucher: v.toucher ?? null, avant: { noeudsHorsRangs: avant.noeudsHorsRangs, blocs: avant.blocs }, apres: { noeudsHorsRangs: apres.noeudsHorsRangs, blocs: apres.blocs }, ajouts: apres.ajouts, reference: { blocs: reference.blocs } });
  console.log(v.image, `${avant.noeudsHorsRangs} → ${apres.noeudsHorsRangs} nœuds de l'app, ${apres.ajouts} ajoutés, ${haut} px de haut`);
  // Un toucher d'une variante laisse un écouteur : la page est rechargée à neuf pour la suivante, sans rien laisser.
  await page.evaluate(() => document.querySelectorAll('.m6s-ajout').forEach((n) => n.remove()));
  await dormir(200);
}
if (!seule) fs.writeFileSync(path.join(ICI, 'fidelite.json'), JSON.stringify({ lecture: "Écran Suggérer de l'app (21C, plus d'agrumes d'un cran), mesuré sans puis avec les ajouts m6s-, même état.", ecran: ecranLu, valeurs: VAL, mesures }, null, 1) + '\n');
const erreurs = journal.erreurs.filter((e) => !/Firestore|firebase|net::ERR/i.test(e));
console.log(erreurs.length ? 'erreurs de page : ' + erreurs.slice(0, 3).join(' | ') : 'aucune erreur de page');
await browser.close();
console.log('CAPTURES', IMG);
