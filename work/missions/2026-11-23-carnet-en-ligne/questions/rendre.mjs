// Rend les images de la page des questions du Carnet (img/<id>.png), à 390 px (×2).
//  - « actuel » : recadrages des captures en ligne du tour 12 (M1, M4) et de la contre-épreuve du Calendrier ;
//  - variantes : la vraie app (build de port-carnet, fixture du banc carnet, ?dev-local), retouchée dans le DOM, anneau rose pointillé
//    sur ce qui change. Rien n'est écrit ailleurs que dans img/.
//   Q_BUILD=<copie du build> node work/missions/2026-11-23-carnet-en-ligne/questions/rendre.mjs
import path from 'node:path';
import fs from 'node:fs';
import os from 'node:os';
import { ouvrir, page, carnets, unCarnet, attendre, toucher, saisir, ICI } from './app.mjs';

const IMG = path.join(ICI, 'img');
const MISSION = path.resolve(ICI, '..');
const CAL = path.resolve(MISSION, '..', '2026-11-23-calendrier-en-ligne');
fs.mkdirSync(IMG, { recursive: true });
const faits = [];
const H = 1700;

// Outils posés dans la page : anneau rose, clones, textes.
const OUTILS = `
window.__q = {
  ring(el, pad = 4) { const r = el.getBoundingClientRect(); const d = document.createElement('div');
    d.className = 'q-ring'; Object.assign(d.style, { position: 'fixed', left: (r.left - pad) + 'px', top: (r.top - pad) + 'px', width: (r.width + 2 * pad) + 'px',
      height: (r.height + 2 * pad) + 'px', border: '2.5px dashed #e0287d', borderRadius: '10px', zIndex: 99999, pointerEvents: 'none' }); document.body.appendChild(d); },
  html(s) { const t = document.createElement('template'); t.innerHTML = s.trim(); return t.content.firstElementChild; },
  mots(el) { return (el.innerText || '').split(/\\s+/).filter((w) => /[\\p{L}\\d]/u.test(w)).length; },
  min14(racine) { for (const e of racine.querySelectorAll('*')) { const f = parseFloat(getComputedStyle(e).fontSize); if (f < 14) e.style.setProperty('font-size', '14px', 'important'); } }
};`;
async function outils(p) { await p.addScriptTag({ content: OUTILS }); await p.addStyleTag({ content: '*{caret-color:transparent!important} .q-cache{display:none!important}' }); }

/** Capture la bande [haut de `de` − pad ; bas de `a` + pad] de la page. */
async function cliche(p, id, de, a = de, { pad = 10, haut = 0, bas = 0, ecrire = true, hauteur = 0 } = {}) {
  const r = await p.evaluate((d, b) => {
    const pr = (s) => [...document.querySelectorAll(s)].filter((e) => e.getBoundingClientRect().height > 0);
    const A = pr(d)[0], B = pr(b).at(-1); if (!A || !B) return null;
    return { y0: A.getBoundingClientRect().top, y1: B.getBoundingClientRect().bottom };
  }, de, a);
  if (!r) throw new Error(`${id} : ${de} / ${a} introuvable`);
  const y = Math.max(0, r.y0 - pad - haut), h = hauteur || Math.min(H - y, r.y1 - r.y0 + 2 * pad + haut + bas);
  if (ecrire) await p.screenshot({ path: path.join(IMG, `${id}.png`), clip: { x: 0, y, width: 390, height: h } });
  faits.push(id);
}
const nettoyer = (p) => p.evaluate(() => document.querySelectorAll('.q-ring').forEach((e) => e.remove()));

/** Recadre une capture en ligne (390 px de large) entre y0 et y1. */
async function recadrer(nav, id, fichier, y0, y1) {
  const p = await nav.newPage();
  await p.setViewport({ width: 390, height: 900, deviceScaleFactor: 2 });
  const src = 'file:///' + fichier.split(path.sep).join('/');
  const tmp = path.join(os.tmpdir(), `q-recadre-${id}.html`); fs.writeFileSync(tmp, `<body style="margin:0"><div id="c" style="width:390px;height:${y1 - y0}px;overflow:hidden;background:url('${src}') 0 ${-y0}px / 390px auto no-repeat"></div></body>`);
  await p.goto('file:///' + tmp.split(path.sep).join('/'), { waitUntil: 'load' });
  await attendre(200);
  await (await p.$('#c')).screenshot({ path: path.join(IMG, `${id}.png`) });
  await p.close(); faits.push(id);
}

const { nav, entrees, fermer } = await ouvrir();
try {
  // ---------- Captures réelles (en ligne, tour 12)
  const M1 = (f) => path.join(MISSION, 'M1', 'captures', f), M4 = (f) => path.join(MISSION, 'M4', f);
  await recadrer(nav, 'q1-actuel-avenir', M1('48-a-venir-apres-choix-placer.png'), 432, 530);
  await recadrer(nav, 'q1-actuel-choisi', M1('43-choisi-vue.png'), 140, 330);
  await recadrer(nav, 'q1b-actuel', M1('29-quand-prix-estime.png'), 552, 708);
  await recadrer(nav, 'q2-actuel', M1('51-recherche-evier.png'), 126, 336);
  await recadrer(nav, 'q3-actuel', M1('01-carnet-liste-repos.png'), 150, 722);
  await recadrer(nav, 'q4-actuel-carnet', M1('29-quand-prix-estime.png'), 552, 708);
  await recadrer(nav, 'q4-actuel-avenir', M4('47-avenir-zz-ouvert.png'), 348, 506);
  await recadrer(nav, 'q4-actuel-modifier', path.join(CAL, 'contre-epreuve', 'L38-modifier.png'), 358, 612);
  await recadrer(nav, 'q4-actuel-fiche', M4('28-date-touchee.png'), 440, 566);
  await recadrer(nav, 'q5-actuel', M1('29-quand-prix-estime.png'), 136, 708);
  await recadrer(nav, 'q6-actuel', M1('43-choisi-vue.png'), 136, 622);

  // ---------- Calendrier : la feuille (puces + frise partagée), source de la frise injectée ailleurs
  const c = await page(nav, entrees, { h: H }); await outils(c);
  await toucher(c, 'nav button', 'Calendrier'); await attendre(800);
  await toucher(c, 'button', 'Actions rapides'); await toucher(c, '[role=menuitem]', '^Prévoir un achat'); await attendre(600);
  await toucher(c, '[role=dialog] button', '^1 mois$'); await attendre(500);
  const FRISE = await c.evaluate(() => {
    const f = document.querySelector('[role=dialog] .cal-f-duree');
    const fige = (el) => { for (const e of [el, ...el.querySelectorAll('*')]) { const cs = getComputedStyle(e); for (const k of ['background-color', 'border-top-color', 'border-bottom-color', 'border-left-color', 'border-right-color', 'color', 'fill', 'stroke']) e.style.setProperty(k, cs.getPropertyValue(k)); } };
    fige(f); const puces = [...document.querySelectorAll('[role=dialog] button')].find((b) => b.innerText.trim() === "Aujourd'hui")?.parentElement;
    return { frise: f.outerHTML, puces: puces.outerHTML };
  });
  await c.keyboard.press('Escape'); await attendre(500);
  // Modifier, variantes B et C : la feuille du Calendrier telle quelle (puces + frise), sans la rangée de jours.
  await toucher(c, 'button', 'Actions rapides'); await toucher(c, '[role=menuitem]', '^Poser une fête'); await attendre(600);
  await toucher(c, '[role=dialog] button', '^3 mois$'); await attendre(600);
  const quandLigne = `[role=dialog] p, [role=dialog] div`;
  await c.evaluate(() => {
    const d = document.querySelector('[role=dialog]');
    for (const e of d.querySelectorAll('*')) if (e.childElementCount === 0 && e.textContent.trim() === 'Ajouter') e.textContent = 'Modifier';
    const f = d.querySelector('.cal-f-duree'); window.__q.ring(f, 6);
  });
  await c.evaluate(() => { const d = document.querySelector('[role=dialog]'); const q = [...d.querySelectorAll('*')].find((e) => /^Quand/.test(e.innerText || '') && e.childElementCount < 6 && e.getBoundingClientRect().height < 40); q?.setAttribute('data-q', 'quand'); d.querySelector('.cal-f-duree').setAttribute('data-q', 'frise'); });
  await cliche(c, 'q4-b-modifier', '[data-q=quand]', '[data-q=frise]', { pad: 12 });
  await nettoyer(c);
  await c.evaluate(() => { const d = document.querySelector('[role=dialog]'); const pu = [...d.querySelectorAll('button')].find((b) => b.innerText.trim() === "Aujourd'hui").parentElement; pu.classList.add('q-cache'); window.__q.ring(d.querySelector('.cal-f-duree'), 6); });
  await cliche(c, 'q4-c-modifier', '[data-q=quand]', '[data-q=frise]', { pad: 12 });
  // La frise seule, pour la fiche (B, C) : la bande « Durée … » + frise.
  await nettoyer(c);
  await cliche(c, 'q4-frise-seule', '[data-q=frise]', '[data-q=frise]', { pad: 8, haut: 30 });
  await c.close();
  void quandLigne;

  // ---------- Liste des carnets : recherche (Q-2), tailles (Q-3)
  const L = await page(nav, entrees, { h: H }); await outils(L);
  await carnets(L);
  await L.waitForSelector('.cn-liste .cn-carnet-titre'); await attendre(400);
  await cliche(L, 'q3-a-liste', '.cn-filtre', '.cn-filtre', { pad: 10, hauteur: 560 });
  await L.evaluate(() => window.__q.min14(document.querySelector('[data-carnets]')));
  await cliche(L, 'q3-b-liste', '.cn-filtre', '.cn-filtre', { pad: 10, hauteur: 560 });
  await L.reload({ waitUntil: 'networkidle2' }); await L.waitForSelector('nav button'); await outils(L); await carnets(L);

  const chercher = async (mot) => { await saisir(L, '[data-carnets] input.cn-recherche', mot); await nettoyer(L); };
  const bas = '.cn-liste > section:last-of-type';
  // A : aujourd'hui (titres des carnets en cours)
  await chercher('évier'); await cliche(L, 'q2-a-evier', '.cn-filtre', bas, { pad: 12 });
  await chercher('froide'); await cliche(L, 'q2-a-froide', '.cn-filtre', bas, { pad: 12 });
  // B : + les Faits, en groupe à part
  const ajouterGroupe = (titre, compte, mut, lignes, cls) => L.evaluate((t, n, m, ls, k) => {
    const modele = document.querySelector('.cn-liste .cn-groupe-bloc');
    const g = modele.cloneNode(true); g.classList.add('q-ajout');
    const chip = g.querySelector('.cn-groupe'); chip.firstChild.textContent = t + ' '; chip.querySelector('.cn-mono').textContent = n;
    if (k) { chip.className = 'cn-groupe ' + k; }
    const mu = g.querySelector('.cn-entete-groupe .cn-mut'); if (mu) mu.textContent = m;
    const cartes = g.querySelector('.cn-cartes'); const bloc = cartes.querySelector('.cn-carnet-bloc'); cartes.innerHTML = '';
    for (const [titre, cite] of ls) {
      const b = bloc.cloneNode(true); b.querySelector('.cn-carnet-titre').textContent = titre;
      b.querySelectorAll('.cn-carnet-tx > :not(.cn-carnet-titre)').forEach((x) => x.remove());
      if (cite) { const s = document.createElement('span'); s.className = 'cn-cite cn-deux-lignes'; s.innerHTML = cite; b.querySelector('.cn-carnet-tx').appendChild(s); }
      cartes.appendChild(b);
    }
    document.querySelector('.cn-liste').appendChild(g); window.__q.ring(g, 3);
  }, titre, compte, mut, lignes, cls);
  const FAITS_EVIER = [['Achat & installation évier principal + douchette', null], ['Refaire évier — bloqué (attendre vis pieds)', null]];
  await chercher('évier'); await ajouterGroupe('Fait', '2', 'du Planning', FAITS_EVIER, 'cn-statut-done');
  await cliche(L, 'q2-b-evier', '.cn-filtre', bas, { pad: 12 });
  await L.evaluate(() => document.querySelectorAll('.q-ajout').forEach((e) => e.remove()));
  await chercher('froide'); await cliche(L, 'q2-b-froide', '.cn-filtre', bas, { pad: 12 });
  // C : + le texte des articles et des notes, la ligne trouvée citée sous la carte
  await chercher('évier'); await ajouterGroupe('Fait', '2', 'du Planning', FAITS_EVIER, 'cn-statut-done');
  await cliche(L, 'q2-c-evier', '.cn-filtre', bas, { pad: 12 });
  await L.evaluate(() => document.querySelectorAll('.q-ajout').forEach((e) => e.remove()));
  await chercher('froide');
  await L.evaluate(() => {
    // dans le groupe existant (À comparer), la carte trouvée par un article, puis un groupe Choisi
    const cartes = document.querySelector('.cn-liste .cn-cartes'); const b = cartes.querySelector('.cn-carnet-bloc').cloneNode(true);
    b.querySelector('.cn-carnet-titre').textContent = 'ZZ TEST — Prix en euros';
    b.querySelectorAll('.cn-carnet-tx > :not(.cn-carnet-titre)').forEach((x) => x.remove());
    const s = document.createElement('span'); s.className = 'cn-cite cn-deux-lignes'; s.innerHTML = 'article : Chambre <b>froide</b> 1500 x 1200 mm'; b.querySelector('.cn-carnet-tx').appendChild(s);
    cartes.appendChild(b); const n = document.querySelector('.cn-liste .cn-groupe .cn-mono'); n.textContent = '2'; window.__q.ring(b, 2);
  });
  await ajouterGroupe('Choisi', '1', '', [['ZZ TEST — Frigo de garde pour fûts', 'article : Chambre <b>froide</b> en kit 2 m³']], null);
  await cliche(L, 'q2-c-froide', '.cn-filtre', bas, { pad: 12 });
  await L.close();

  // ---------- Carnet « Frigo + congel » : pastilles de prix (Q-1b), Quand (Q-4), 40 mots (Q-5)
  const F = await page(nav, entrees, { h: H }); await outils(F);
  await carnets(F); await unCarnet(F, '^Frigo');
  const quand = 'section.cn-quand';
  await cliche(F, 'q1b-a', quand, quand, { pad: 8 });
  const puceDevant = (txt, ou) => F.evaluate((t, o) => {
    const row = [...document.querySelectorAll('section.cn-quand [role=group]')].find((g) => /Prix estimé/.test(g.innerText));
    const modele = [...row.querySelectorAll('button.cn-puce')][0]; const b = modele.cloneNode(true); b.innerHTML = t; b.classList.add('q-ajout');
    if (o === 'debut') row.insertBefore(b, modele); else row.appendChild(b); window.__q.ring(b, 3);
  }, txt, ou);
  await puceDevant('400 CHF <span style="opacity:.7;font-weight:400">· budget</span>', 'debut');
  await cliche(F, 'q1b-b', quand, quand, { pad: 8 });
  await nettoyer(F); await F.evaluate(() => document.querySelectorAll('.q-ajout').forEach((e) => e.remove()));
  await puceDevant('Autre…', 'fin');
  await cliche(F, 'q1b-c', quand, quand, { pad: 8 });
  await nettoyer(F); await F.evaluate(() => document.querySelectorAll('.q-ajout').forEach((e) => e.remove()));

  // Q-5 : au repos, aujourd'hui (B) puis replié (A)
  const motsB = await F.evaluate(() => window.__q.mots(document.querySelector('.cn-page.cn-ouvert')));
  await cliche(F, 'q5-b', '.cn-tete', quand, { pad: 10 });
  await F.evaluate(() => {
    const s = document.querySelector('section.cn-quand');
    for (const k of s.children) k.classList.add('q-cache');
    const tete = s.querySelector('.cn-rubrique-tete').cloneNode(true); tete.classList.remove('q-cache'); tete.classList.add('q-ajout');
    tete.querySelector('.cn-mut').textContent = '· cette semaine · prix ?';
    const ch = document.createElement('span'); ch.textContent = '›'; Object.assign(ch.style, { marginLeft: 'auto', fontSize: '22px', opacity: '.6', paddingRight: '6px' });
    tete.style.display = 'flex'; tete.style.width = '100%'; tete.style.flexBasis = '100%'; tete.style.alignItems = 'center'; tete.style.minHeight = '48px'; tete.appendChild(ch);
    s.appendChild(tete); window.__q.ring(tete, 3);
  });
  const motsA = await F.evaluate(() => window.__q.mots(document.querySelector('.cn-page.cn-ouvert')));
  await cliche(F, 'q5-a', '.cn-tete', quand, { pad: 10, bas: 40 });
  await nettoyer(F); await F.evaluate(() => { document.querySelectorAll('.q-ajout').forEach((e) => e.remove()); document.querySelectorAll('.q-cache').forEach((e) => e.classList.remove('q-cache')); });

  // Q-4, lieu « Carnet › Quand » : B puces + frise partagée ; C frise seule
  await F.evaluate((fr) => {
    const s = document.querySelector('section.cn-quand'); const h = s.querySelector('.cn-horizons');
    const f = window.__q.html(fr); f.classList.add('q-ajout'); f.style.margin = '6px 0 4px'; f.style.flexBasis = '100%'; f.style.width = '100%'; h.after(f); window.__q.ring(f, 4);
    for (const g of s.querySelectorAll('[role=group]')) if (/Prix estimé/.test(g.innerText)) g.classList.add('q-cache');
    s.querySelector('.cn-quand-cal')?.classList.add('q-cache');
  }, FRISE.frise);
  await cliche(F, 'q4-b-carnet', quand, quand, { pad: 8 });
  await nettoyer(F);
  await F.evaluate(() => { const s = document.querySelector('section.cn-quand'); s.querySelector('.cn-horizons').classList.add('q-cache'); window.__q.ring(s.querySelector('.q-ajout'), 4); });
  await cliche(F, 'q4-c-carnet', quand, quand, { pad: 8 });
  await F.close();

  // ---------- Carnet choisi « Frigo de garde » : Commander (Q-6) ; carnet ouvert à 12 et 14 px (Q-3)
  const G = await page(nav, entrees, { h: H }); await outils(G);
  await carnets(G); await unCarnet(G, 'Frigo de garde');
  await G.evaluate(() => document.querySelector('.cn-defile').scrollTo(0, 0)); await attendre(300);
  const info = await G.evaluate(() => {
    const p = document.querySelector('.cn-page.cn-ouvert'); const kids = [...p.children].map((e) => (e.className || e.tagName) + ' «' + (e.innerText || '').replace(/\s+/g, ' ').slice(0, 50) + '»');
    return kids.join('\n');
  });
  fs.writeFileSync(path.join(process.env.TEMP || '.', 'q-frigo-garde.txt'), info);
  const tableau = '.cn-page.cn-ouvert section:has(table), .cn-page.cn-ouvert [class*=tab]';
  await G.evaluate(() => {
    const p = document.querySelector('.cn-page.cn-ouvert');
    const art = [...p.querySelectorAll('section')].find((s) => /Articles/.test(s.innerText) && /Comparer/.test(s.innerText)); art?.setAttribute('data-q', 'articles');
    const choisi = [...p.children].find((e) => /Choisi :/.test(e.innerText || '')); choisi?.setAttribute('data-q', 'choisi');
  });
  await cliche(G, 'q3-a-carnet', '[data-q=articles]', '[data-q=articles]', { pad: 8, bas: -120 });
  await G.evaluate(() => window.__q.min14(document.querySelector('[data-carnets]')));
  await cliche(G, 'q3-b-carnet', '[data-q=articles]', '[data-q=articles]', { pad: 8, bas: -120 });
  await G.reload({ waitUntil: 'networkidle2' }); await G.waitForSelector('nav button'); await outils(G); await carnets(G); await unCarnet(G, 'Frigo de garde');
  await G.evaluate(() => { document.querySelector('.cn-defile').scrollTo(0, 0); const p = document.querySelector('.cn-page.cn-ouvert'); [...p.children].find((e) => /Choisi :/.test(e.innerText || ''))?.setAttribute('data-q', 'choisi'); });
  await attendre(300);
  await cliche(G, 'q6-a', '.cn-tete', '[data-q=choisi]', { pad: 10 });
  await G.evaluate(() => {
    const ch = document.querySelector('[data-q=choisi]');
    const d = document.createElement('div'); d.className = 'q-ajout';
    Object.assign(d.style, { display: 'flex', alignItems: 'center', gap: '10px', margin: '10px 0 4px', padding: '10px 12px', border: '1px solid #d9d4c7', borderRadius: '12px', background: '#fff', fontSize: '15px' });
    d.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2f5e2a" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 8 12 3 3 8v8l9 5 9-5z"/><path d="M3 8l9 5 9-5M12 13v8"/></svg><span style="flex:1;line-height:1.3"><b>Commandé le 23 nov.</b><br><span style="color:#5c5c5c">attendu vers le 7 déc. · 2 sem.</span></span><span style="border:1.5px solid #2f5e2a;color:#2f5e2a;border-radius:999px;padding:6px 12px;font-weight:600">Reçu</span>';
    ch.after(d); window.__q.ring(d, 3);
  });
  await cliche(G, 'q6-b', '.cn-tete', '.q-ajout', { pad: 10 });
  await G.close();

  // ---------- À venir : le prix du plan (Q-1), « Fixer la date » (Q-4)
  const A = await page(nav, entrees, { h: H }); await outils(A);
  await toucher(A, 'nav button', 'Stocks'); await toucher(A, 'button', '^Matériel'); await toucher(A, 'button', '^À venir'); await attendre(500);
  const carte = '.kh-carnet section .rounded-panel';
  const prix = (html) => A.evaluate((h) => { const s = [...document.querySelectorAll('.kh-carnet span.font-mono')].find((e) => /CHF/.test(e.innerText)); const p = s.parentElement; p.innerHTML = h; window.__q.ring(p, 3); }, html);
  await A.evaluate(() => { const b = [...document.querySelectorAll('.kh-carnet button')].find((e) => /Fixer la date/.test(e.innerText)); b?.closest('div')?.setAttribute('data-q', 'boutons'); });
  const garde = await A.evaluate(() => document.querySelector('.kh-carnet span.font-mono').parentElement.innerHTML);
  await prix('<span class="font-mono text-cave-50">4 900 CHF TTC</span> · Froid Léman · <span style="color:#2f5e2a;font-weight:600">choisi</span>');
  await cliche(A, 'q1-a', carte, '[data-q=boutons]', { pad: 8 });
  await nettoyer(A);
  await prix('<span class="font-mono text-cave-50">500 CHF TTC</span> estimé<br><span style="color:#2f5e2a;font-weight:600">choisi 4 900 CHF</span> · Froid Léman');
  await cliche(A, 'q1-b', carte, '[data-q=boutons]', { pad: 8 });
  await nettoyer(A);
  await prix('<span class="font-mono text-cave-50">450 CHF TTC</span> · changé le 18 nov.<br><span style="color:#5c5c5c">avant : choisi 4 900 le 16 nov., estimé 500</span>');
  await cliche(A, 'q1-c', carte, '[data-q=boutons]', { pad: 8 });
  await nettoyer(A);
  await A.evaluate((g) => { document.querySelector('.kh-carnet span.font-mono').parentElement.innerHTML = g; }, garde);
  await toucher(A, 'button', '^Fixer la date'); await attendre(600);
  await A.evaluate((F) => {
    const mo = document.querySelector('.kh-mo'); const pu = window.__q.html(F.puces); const fr = window.__q.html(F.frise);
    const box = document.createElement('div'); box.className = 'q-ajout'; box.style.margin = '8px 0'; box.append(pu, fr); mo.after(box); mo.classList.add('q-cache'); window.__q.ring(box, 4);
  }, FRISE);
  await cliche(A, 'q4-b-avenir', '[data-q=boutons]', '.q-ajout', { pad: 8 });
  await nettoyer(A);
  await A.evaluate(() => { const box = document.querySelector('.q-ajout'); box.firstElementChild.classList.add('q-cache'); window.__q.ring(box, 4); });
  await cliche(A, 'q4-c-avenir', '[data-q=boutons]', '.q-ajout', { pad: 8 });
  await A.close();

  // ---------- Fiche du Calendrier (Q-4, B et C) : la bulle en ligne + la frise qui s'ouvre au toucher de la pastille
  const P = await nav.newPage();
  await P.setViewport({ width: 390, height: 900, deviceScaleFactor: 2 });
  const fiche = 'file:///' + M4('28-date-touchee.png').split(path.sep).join('/');
  const frise = 'file:///' + path.join(IMG, 'q4-frise-seule.png').split(path.sep).join('/');
  const tmpf = path.join(os.tmpdir(), 'q-fiche.html'); fs.writeFileSync(tmpf, `<body style="margin:0;background:#fff"><div id="c" style="width:390px;position:relative">
    <div style="height:126px;background:url('${fiche}') 0 -440px / 390px auto no-repeat"></div>
    <div style="position:absolute;left:78px;top:30px;width:296px;height:38px;border:2.5px dashed #e0287d;border-radius:10px"></div>
    <div style="font:15px 'Source Sans 3','Segoe UI',sans-serif;color:#5c5c5c;padding:2px 16px">un toucher sur la date ouvre :</div>
    <img src="${frise}" style="display:block;width:390px">
  </div></body>`);
  await P.goto('file:///' + tmpf.split(path.sep).join('/'), { waitUntil: 'load' });
  await attendre(300);
  await (await P.$('#c')).screenshot({ path: path.join(IMG, 'q4-b-fiche.png') }); faits.push('q4-b-fiche');
  await P.close();

  fs.writeFileSync(path.join(ICI, 'mots.json'), JSON.stringify({ q5a: motsA, q5b: motsB }));
  console.log(`${faits.length} images ; mots Q-5 : A ${motsA}, B ${motsB}`);
} finally { await fermer(); }
