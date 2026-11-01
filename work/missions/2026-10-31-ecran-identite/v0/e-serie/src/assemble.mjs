// Assemble les pages v0/eN/etat.html : éléments communs (en-tête, fil, bandeau, pied, +) tels qu'à l'app,
// puis le corps propre du concept. Classes préfixées par l'id (L26), assemblage par split/join (pas de replace).
// Usage : node assemble.mjs e1 [e2 …]
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ici = path.dirname(fileURLToPath(import.meta.url));
const SORTIE = 'C:/Users/mrspa/.codex/worktrees/openai-clean-start/Brasserie/work/missions/2026-10-31-ecran-identite/v0';
const sub = (s, id) => s.split('PX-').join(id + '-').split('PXID').join(id);
const lire = (f) => fs.readFileSync(path.join(ici, f), 'utf8');

const BASE_CSS = `
:root{--page:#FFFFFF;--panneau:#F5F5F5;--surf:#EBEBEB;--bord:#DDDDDD;--bordm:#BFBFBF;--trait:#9E9E9E;--t3:#666666;--t2:#333333;--t1:#111111;
--hop:#567F45;--hopt:#3F6B2E;--eau:#4F7E9B;--eaut:#2F5F7D;--al:#C8382F;--alt:#A8291F;--att:#9C7020;--attt:#7F5B10;
--straw:#F2C14E;--gold:#E0A02E;--goldt:#7A5A12;--amber:#C87A2C;
--sans:"Source Sans 3",system-ui,-apple-system,"Segoe UI",sans-serif;--mono:"IBM Plex Mono",ui-monospace,Consolas,monospace}
*{box-sizing:border-box;margin:0;padding:0}
html{background:var(--page)}
body{background:var(--page);color:var(--t2);font:400 14px/18px var(--sans);-webkit-tap-highlight-color:transparent}
::selection{background:#F2C14E66}
button{font:inherit;color:inherit;background:none;border:0;cursor:pointer}
input{font:inherit;color:inherit}
svg{display:block;flex:none}
[hidden]{display:none!important}
:focus-visible{outline:2px solid var(--t1);outline-offset:2px;border-radius:6px}
.PX-m{font-family:var(--mono);font-variant-numeric:tabular-nums}
.PX-app{max-width:390px;margin:0 auto;min-height:844px;position:relative;overflow-x:hidden}
.PX-hd{display:flex;align-items:center;height:44px;padding:0 6px 0 2px;gap:2px}
.PX-back{width:32px;height:32px;display:grid;place-items:center;color:var(--t1)}
.PX-ttl{font:600 18px/22px var(--sans);color:var(--t1);padding-left:4px}
.PX-ttl span{font-weight:400;color:var(--t3)}
.PX-sp{flex:1}
.PX-ab{font-size:14px;color:var(--t1);text-decoration:underline;text-underline-offset:3px;height:32px;padding:0 6px}
.PX-ic{width:32px;height:32px;display:grid;place-items:center;color:var(--t2)}
.PX-tabs{display:flex;justify-content:space-between;padding:0 8px;border-bottom:1px solid var(--bord)}
.PX-tab{font-size:14px;line-height:18px;color:var(--t3);display:flex;flex-direction:column;gap:5px;padding:4px 0 8px;white-space:nowrap}
.PX-tab i{display:block;height:4px;border-radius:2px;background:var(--bord)}
.PX-tab.PX-on{color:var(--t1);font-weight:600}
.PX-tab.PX-on i{background:var(--t1)}
.PX-band{margin:8px 8px 0;height:40px;border:1px solid var(--bord);border-radius:20px;background:var(--panneau);display:flex;align-items:center;justify-content:space-between;padding:0 12px;gap:6px}
.PX-band span{display:inline-flex;align-items:baseline;gap:4px;font-size:12px;color:var(--t3);white-space:nowrap}
.PX-band b{font:600 16px/20px var(--mono);font-variant-numeric:tabular-nums;color:var(--t1)}
.PX-ibu{align-items:center!important}
.PX-trk{position:relative;width:44px;height:8px;border-radius:4px;background:var(--surf);margin-left:2px;align-self:center}
.PX-trk::before{content:"";position:absolute;left:18px;width:20px;top:0;bottom:0;border-radius:4px;background:var(--bordm)}
.PX-trk::after{content:"";position:absolute;left:33px;top:-4px;width:2px;height:16px;background:var(--t1);border-radius:1px}
.PX-ebc{width:10px;height:10px;border-radius:50%;background:var(--gold);align-self:center}
body.PX-neuve .PX-band,body.PX-neuve .PX-ab{display:none}
.PX-fab{position:fixed;right:max(12px,calc(50vw - 183px));bottom:16px;width:52px;height:52px;border-radius:50%;background:#111;color:#fff;display:grid;place-items:center;box-shadow:0 8px 24px -12px rgba(0,0,0,.5);z-index:5}
.PX-pied{display:flex;gap:8px;align-items:center;padding:12px 76px 20px 8px}
.PX-btn2{height:32px;padding:0 10px;border:1px solid var(--bordm);border-radius:10px;font-size:14px;color:var(--t1);background:var(--page)}
.PX-btn1{height:32px;padding:0 12px;border-radius:10px;font-size:14px;font-weight:600;color:#fff;background:#111}
.PX-leg{position:absolute;z-index:6;left:8px;right:8px;background:var(--page);border:1px solid var(--bordm);border-radius:16px;padding:10px 12px;box-shadow:0 8px 24px -12px rgba(0,0,0,.35);font-size:14px;line-height:19px;color:var(--t2)}
.PX-leg[hidden]{display:none}
.PX-leg p+p{margin-top:6px}
.PX-q{width:28px;height:28px;border-radius:50%;border:1px solid var(--bordm);font-size:14px;font-weight:600;color:var(--t2);display:inline-grid;place-items:center;flex:none}
.PX-etats{max-width:374px;margin:0 auto 40px;padding-top:12px;border-top:1px dashed var(--bordm)}
.PX-etats h2{font:600 14px/18px var(--sans);color:var(--t1);margin-bottom:6px}
.PX-etats div{display:flex;flex-wrap:wrap;gap:6px;padding-right:64px}
.PX-etats button{height:28px;padding:0 10px;border-radius:14px;border:1px solid var(--bordm);font-size:14px}
.PX-etats button[aria-pressed="true"]{background:#111;color:#fff;border-color:#111}
@media (prefers-reduced-motion:reduce){*{transition:none!important;animation:none!important}}
`;

const CHROME = `
<header class="PX-coque">
 <div class="PX-hd">
  <button class="PX-back" aria-label="Retour"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.13" stroke-linecap="round" stroke-linejoin="round"><path d="M15 5l-7 7 7 7"/></svg></button>
  <h1 class="PX-ttl">Identité <span>1/7</span></h1>
  <span class="PX-sp"></span>
  <button class="PX-ab">Abandonner</button>
  <button class="PX-ic" aria-label="Coller une recette trouvée"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.92" stroke-linecap="round" stroke-linejoin="round"><path d="M9 4h6v3H9z"/><path d="M15 5h2a2 2 0 0 1 2 2v3M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h5"/><path d="M14 16h7M18 13l3 3-3 3"/></svg></button>
  <button class="PX-ic" aria-label="Thème"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.92" stroke-linecap="round" stroke-linejoin="round"><path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/></svg></button>
 </div>
 <nav class="PX-tabs" aria-label="Étapes">
  <span class="PX-tab PX-on">Identité<i></i></span><span class="PX-tab">Malts/sucres<i></i></span><span class="PX-tab">Houblons<i></i></span><span class="PX-tab">Levure<i></i></span><span class="PX-tab">Paliers<i></i></span><span class="PX-tab">Eau<i></i></span><span class="PX-tab">Récap.<i></i></span>
 </nav>
 <div class="PX-band" aria-label="Mesures de la recette">
  <span>Grain <b>8,6 kg</b></span><span>OG <b>1,080</b></span><span class="PX-ibu">IBU <b>~93</b><i class="PX-trk"></i></span><span class="PX-ibu">EBC <i class="PX-ebc"></i><b>9,5</b></span>
 </div>
</header>`;

const PIED = `
<div class="PX-pied"><button class="PX-btn2" disabled>Retour</button><button class="PX-btn1">Suivant — Malts/sucres</button></div>
<button class="PX-fab" aria-label="Actions rapides"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.60" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg></button>`;

const ETATS = `
<section class="PX-etats" aria-label="Cas limites">
 <h2>Cas limites (démo)</h2>
 <div>
  <button data-booster="etat" data-etat="" aria-pressed="true">neipa v3</button>
  <button data-booster="etat" data-etat="neuve">Recette neuve</button>
  <button data-booster="etat" data-etat="plein">Fermenteur plein</button>
  <button data-booster="etat" data-etat="nolo">NOLO coché</button>
  <button data-booster="etat" data-etat="long">Ébullition 90 min</button>
 </div>
</section>`;

// Modèle commun : mêmes nombres que l'app (BrewWizard evaporationHint, RecipeInstallationChoice), aucun inventé.
const MODELE = `
const M = { F: 30, C: 45, CU: 35, TAUX: 0.10, LIBRE: 20 };
const S = { nom: 'neipa v3', style: 'Double IPA', ref: '22A', V: 24, B: 60, nolo: false, neuve: false };
const fr = (n, d = 0) => (Number.isFinite(n) ? n.toFixed(d).replace('.', ',') : '—');
function calc(s) {
  const ok = Number.isFinite(s.V) && s.V > 0 && Number.isFinite(s.B);
  if (!ok) return { ok: false };
  const k = Math.min(0.9, M.TAUX * s.B / 60);
  const pre = s.V / (1 - k), ev = pre - s.V, libre = M.F - s.V;
  return { ok: true, pre, ev, libre, pct: libre / M.F * 100, conseil: M.F * (1 - M.LIBRE / 100), plein: s.V >= M.F, serre: libre / M.F * 100 < M.LIBRE, cuveHors: pre > M.CU };
}
const ETATS = {
  '': () => Object.assign(S, { nom: 'neipa v3', style: 'Double IPA', ref: '22A', V: 24, B: 60, nolo: false, neuve: false }),
  neuve: () => Object.assign(S, { nom: '', style: '', ref: '', V: 30, B: 60, nolo: false, neuve: true }),
  plein: () => Object.assign(S, { nom: 'neipa v3', style: 'Double IPA', ref: '22A', V: 31, B: 60, nolo: false, neuve: false }),
  nolo: () => Object.assign(S, { nom: 'neipa v3', style: 'Double IPA', ref: '22A', V: 24, B: 60, nolo: true, neuve: false }),
  long: () => Object.assign(S, { nom: 'neipa v3', style: 'Double IPA', ref: '22A', V: 24, B: 90, nolo: false, neuve: false }),
};
function poserEtat(nom) {
  (ETATS[nom] || ETATS[''])();
  document.body.classList.toggle('PXID-neuve', S.neuve);
  document.querySelectorAll('[data-booster="etat"]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.etat === (nom || ''))));
  rendre();
}
function brancherCommun() {
  document.querySelectorAll('[data-booster="etat"]').forEach((b) => b.addEventListener('click', () => poserEtat(b.dataset.etat)));
  const qb = document.querySelector('[data-role="legende-bouton"]'), lg = document.querySelector('[data-role="legende"]');
  if (qb && lg) {
    qb.addEventListener('click', () => { const o = lg.hidden; lg.hidden = !o; qb.setAttribute('aria-expanded', String(o)); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') { lg.hidden = true; qb.setAttribute('aria-expanded', 'false'); } });
  }
  const lireHash = () => { const h = (location.hash || '').slice(1); poserEtat(ETATS[h] ? h : ''); };
  addEventListener('hashchange', lireHash);
  lireHash();
}
// Glisser : appelle f(fraction 0..1) pendant le geste ; retour visible sous le doigt (classe PXID-tient).
function glisser(el, axe, f) {
  el.style.touchAction = 'none';
  const lire = (e) => { const r = el.getBoundingClientRect(); return axe === 'y' ? 1 - (e.clientY - r.top) / r.height : (e.clientX - r.left) / r.width; };
  el.addEventListener('pointerdown', (e) => { el.setPointerCapture(e.pointerId); el.classList.add('PXID-tient'); f(Math.max(0, Math.min(1, lire(e)))); });
  el.addEventListener('pointermove', (e) => { if (el.hasPointerCapture(e.pointerId)) f(Math.max(0, Math.min(1, lire(e)))); });
  const fin = (e) => { el.classList.remove('PXID-tient'); if (el.hasPointerCapture(e.pointerId)) el.releasePointerCapture(e.pointerId); };
  el.addEventListener('pointerup', fin); el.addEventListener('pointercancel', fin);
}
function lireNombre(t) { const n = Number(String(t).replace(',', '.').replace(/[^0-9.]/g, '')); return String(t).trim() === '' ? NaN : n; }
`;

for (const id of process.argv.slice(2)) {
  const titre = lire(`${id}.titre.txt`).trim();
  const css = lire(`${id}.css`), corps = lire(`${id}.html`), js = lire(`${id}.js`);
  const html = `<!doctype html>
<html lang="fr" data-theme="clair">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Identité 1/7 · ${id} · ${titre}</title>
<!-- Lot v0 Identité, série e (l'échelle du matériel), concept ${id}. Page statique, données de démonstration : « neipa v3 », Double IPA 22A, 24 L, 60 min, cuve Royal Catering 45 L, fermenteur 30 L. Estimations marquées ~ (évaporation de repli 10 %/h, conseil de 20 % d'espace libre, limite utile 35 L à vérifier). -->
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Source+Sans+3:ital,wght@0,400;0,600;0,700;1,400&family=IBM+Plex+Mono:wght@400;500;600&display=swap">
<style>${sub(BASE_CSS, id)}
${sub(css, id)}</style>
</head>
<body>
<div class="${id}-app">
${sub(CHROME, id)}
<main class="${id}-zone">
${sub(corps, id)}
</main>
${sub(PIED, id)}
</div>
${sub(ETATS, id)}
<script>
(() => {
${sub(MODELE, id)}
${sub(js, id)}
brancherCommun();
})();
</script>
</body>
</html>
`;
  fs.mkdirSync(path.join(SORTIE, id), { recursive: true });
  fs.writeFileSync(path.join(SORTIE, id, 'etat.html'), html);
  console.log('écrit', id);
}
