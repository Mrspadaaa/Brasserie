// Contrôle CAL-PASSE (20.11, tour 5) : le passé du Calendrier et de la période se modifie, au doigt, sur un vrai rendu Chrome à 390 tactile.
// Ses mots : « il est vraiment très compliqué voir impossible de modifier les graph dans le passé pareil pour le diagramme de temps en haut, je peux pas
// le reculer ??? » ; « il y a un point ?? Qui pose problème qui prend le dessus » ; « C'est en fait pas le bonne version du calendrier » ;
// « Toujours très compliqué de reculer le graph.... » ; « Pareil pour l'agrandir vers le futur... ».
//
// node scripts/agents/controle-cal-passe.mjs <url de base> <dossier de captures>      → CAL-PASSE OK | CAL-PASSE ECHEC (code ≠ 0)
//   <url de base> : `http://localhost:5625` (le banc `/?preview=calendrier`, données simulées, et l'app `/?dev-local&finance-demo`).
// Critères (390 × 844, isMobile + hasTouch, gestes CDP `Input.dispatchTouchEvent`, jamais element.click ; clair puis cave) :
//   a   glisser la poignée de début de la fenêtre de la frise du haut de 4 semaines vers le passé : l'étiquette « Fenêtre : S47 – S52 » recule de 3 à 8 semaines
//   a2  frise de période (feuille « Période », Calendrier ET Finances) : les deux poignées ont leur zone de prise de 44 px ENTIÈRE dans l'écran,
//       tenir la poignée de début au bord recule la période d'un mois au moins, tenir celle de fin l'agrandit vers le futur
//   b   glisser une barre de brassin de 4 semaines vers le passé : sa semaine recule de 3 à 8, puis « Annuler » la remet
//   c   le curseur de lecture (rond pointillé) n'est jamais sous le doigt au départ du glisser de la fenêtre et ne reste pas après le toucher d'une poignée
//   d   le menu de période est entier dans l'écran à 390, 844 × 340 et 1280, et les durées ne se chevauchent pas (CT4A-15)
//   e   pendant et après le glisser d'une barre, l'étiquette de durée ne recouvre ni la barre glissée ni son nom
//   f   aucune ligne en double dans une rangée (même libellé deux fois)
// Les critères d'une autre voie restent rouges tant qu'elle n'a pas commité : le pilote rejoue le contrôle à la fin.
import { createRequire } from 'node:module';
import { mkdirSync } from 'node:fs';

const req = createRequire(new URL('../../package.json', import.meta.url));
const puppeteer = req('puppeteer-core');
const BASE = (process.argv[2] ?? 'http://localhost:5625').replace(/\/$/, '');
const OUT = process.argv[3] ?? '.';
/** `CAL_PASSE_SEUL=b1` : ne rejoue que les critères de la voie S (tour rapide d'un développeur) ; sans, le contrôle entier. */
const SEUL = (process.env.CAL_PASSE_SEUL ?? '').split(',').filter(Boolean);
mkdirSync(OUT, { recursive: true });
const CHROME = process.env.CHROME ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const z = ms => new Promise(r => setTimeout(r, ms));
const { fixtureCalendrier } = await import(new URL('../parcours/fixtures/calendrier.mjs', import.meta.url).href);

/** Regex du contrôle : exercées par `--test-regex` (jamais une barre inverse perdue en silence). */
export const RE = {
  fenetre: /Fenêtre\s*:\s*S(\d+)\s*[–-]\s*S(\d+)/,
  semaine: /^S(\d+)$/,
};
if (process.argv.includes('--test-regex')) {
  const ok = [
    RE.fenetre.exec('Fenêtre : S47 – S52')?.slice(1).join(',') === '47,52',
    RE.fenetre.exec('Fenêtre : S47 – S13 2027')?.slice(1).join(',') === '47,13',
    RE.semaine.exec('S51')?.[1] === '51', !RE.semaine.test('S51 · 14 déc.'),
  ];
  console.log(ok.every(Boolean) ? `REGEX OK ${ok.length}/${ok.length}` : `REGEX ECHEC ${ok.join(',')}`);
  process.exit(ok.every(Boolean) ? 0 : 1);
}

const echecs = [], lignes = [];
const verdict = (nom, theme, ok, mesure) => {
  const l = `${ok ? 'OK    ' : 'ECHEC '} ${nom} (${theme}) : ${mesure}`;
  lignes.push(l); if (!ok) echecs.push(l); console.log(l);
};
const modulo = n => ((n % 53) + 53) % 53;
const inter = (a, b) => Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left)) * Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top));

const navigateur = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--lang=fr-CH'] });
const CFG = { m390: { w: 390, h: 844, tactile: true }, p844: { w: 844, h: 340, tactile: true }, d1280: { w: 1280, h: 800, tactile: false } };

/** `fixture` : les entrées de `fixtureCalendrier` (la fixture du parcours : Hefe, Fruty, Ttt…), posées comme le fait le parcours (`?dev-local&finance-demo=parcours-calendrier`). */
async function page(cfgNom, theme, url, attente, fixture = null) {
  /* la fixture du parcours (b1, b2) se joue dans un profil NEUF : la période réglée par les critères d'avant (a2 recule le début de 110 jours) y fait sortir Hefe de la vue */
  const ctx = fixture ? (navigateur.createBrowserContext ? await navigateur.createBrowserContext() : await navigateur.createIncognitoBrowserContext()) : navigateur;
  const c = CFG[cfgNom], p = await ctx.newPage();
  await p.setViewport({ width: c.w, height: c.h, isMobile: c.tactile, hasTouch: c.tactile, deviceScaleFactor: 1 });
  await p.evaluateOnNewDocument(t => { try { localStorage.setItem('laffinee.theme', t); } catch { /* sans stockage */ } }, theme);
  if (fixture) await p.evaluateOnNewDocument(j => { try { if (!localStorage.getItem('parcours-calendrier:fixture')) localStorage.setItem('parcours-calendrier:fixture', j); } catch { /* sans stockage */ } }, JSON.stringify(fixture));
  await p.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: theme === 'cave' ? 'dark' : 'light' }]);
  p.cdp = await p.createCDPSession(); p.cfg = c;
  p.recharger = async () => { await p.goto(url, { waitUntil: 'domcontentloaded', timeout: 180000 }); await p.waitForSelector(attente, { timeout: 120000 }); await z(1500); };
  await p.recharger();
  return p;
}
/* Gestes : touchStart, touchMove, touchEnd par CDP (un vrai doigt, pas element.click). */
const doigt = (p, type, x, y) => p.cdp.send('Input.dispatchTouchEvent', { type, touchPoints: type === 'touchEnd' ? [] : [{ x, y, id: 1, radiusX: 4, radiusY: 4, force: 1 }] });
async function taper(p, x, y) { await doigt(p, 'touchStart', x, y); await z(70); await doigt(p, 'touchEnd'); await z(500); }
/** Glisse de (dx, dy) ; `tenir` ms au bout, doigt posé ; `lever:false` laisse le doigt posé (état « pendant »). */
async function glisser(p, x, y, dx, dy = 0, { tenir = 0, lever = true } = {}) {
  await doigt(p, 'touchStart', x, y); await z(180);
  for (let i = 1; i <= 12; i++) { await doigt(p, 'touchMove', x + (dx * i) / 12, y + (dy * i) / 12); await z(25); }
  if (tenir) await z(tenir);
  if (lever) { await doigt(p, 'touchEnd'); await z(600); }
}
const rect = (p, sel) => p.evaluate(s => { const e = document.querySelector(s); if (!e) return null; const b = e.getBoundingClientRect(); return { left: b.left, right: b.right, top: b.top, bottom: b.bottom, width: b.width, height: b.height }; }, sel);
const attendreCalme = async p => { await z(600); };
const photo = async (p, nom) => { try { await p.screenshot({ path: `${OUT}/${nom}.png` }); } catch { /* la capture ne bloque pas */ } };
const fenetreSemaines = p => p.evaluate(src => {
  const g = document.querySelector('.ent-cadre[role="group"]'); const m = g && new RegExp(src).exec(g.getAttribute('aria-label') || '');
  return m ? { d: Number(m[1]), f: Number(m[2]), w: g.getBoundingClientRect().width } : null;
}, RE.fenetre.source);
const centreVisible = r => ({ x: (Math.max(r.left, 0) + Math.min(r.right, 390)) / 2, y: (r.top + r.bottom) / 2 });
const entree = (p, sel) => p.evaluate(s => { const e = document.querySelector(s); e?.scrollIntoView({ block: 'center' }); }, sel);

for (const theme of ['clair', 'cave']) {
  const banc = await page('m390', theme, `${BASE}/?preview=calendrier`, '[data-ent-periode]');
  const sel = { poignee: '[data-poignee="debut"]' };
  /* b1 (CAL-PASSE voie S, R2-1, 21.11) : le geste EXACT de la critique, sur la fixture du parcours (Hefe, brassin « pas brassé » : barre de 24 à 52 px en 3 mois à 390).
     Le doigt est posé AU MILIEU de la barre courte, tenu au bord gauche de la frise : la barre se DÉPLACE vers le passé (« S44 → S40 »), jamais sa fin tirée
     (« pas brassée · prête le 1 nov. » : une date de fin fausse écrite par un geste qui voulait déplacer). La zone du bord ne mange pas le corps d'une barre courte.
     Annuler remet la barre. */
  try {
    const hefe = await page('m390', theme, `${BASE}/?dev-local&finance-demo=parcours-calendrier`, 'nav button', fixtureCalendrier(new Date().toISOString().slice(0, 10)).entrees);
    if (!(await hefe.$('[data-calendrier]'))) {
      const nav = await hefe.evaluate(() => { const b = [...document.querySelectorAll('nav button')].find(x => /Calendrier/.test(x.innerText)); if (!b) return null; const r = b.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; });
      if (nav) await taper(hefe, nav.x, nav.y);
    }
    await hefe.waitForSelector('[data-calendrier]', { timeout: 60000 }); await z(900);
    const menu = await rect(hefe, '[data-ent-periode]'); await taper(hefe, menu.left + menu.width / 2, menu.top + menu.height / 2);
    const trois = await hefe.evaluate(() => { const e = [...document.querySelectorAll('[data-menu-periode] button')].find(x => (x.textContent || '').trim() === '3 mois'); if (!e) return null; const r = e.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; });
    if (trois) { await taper(hefe, trois.x, trois.y); await z(900); }
    const lire = () => hefe.evaluate(() => { const b = document.querySelector('[data-barre][data-titre="Hefe"]'); return b ? { label: b.getAttribute('aria-label'), sem: b.getAttribute('data-semaine') } : null; });
    const avant = await lire();
    await hefe.evaluate(() => { document.querySelector('[data-barre][data-titre="Hefe"]')?.scrollIntoView({ block: 'center' }); }); await z(400);
    const hb = await rect(hefe, '[data-barre][data-titre="Hefe"]'), fr = await rect(hefe, '[data-frise]');
    if (!avant || !hb || !fr) verdict('b1', theme, false, `Hefe ou la frise introuvable (${JSON.stringify({ avant, hb: !!hb, fr: !!fr })})`);
    else {
      const x0 = (hb.left + hb.right) / 2, y0 = (hb.top + hb.bottom) / 2, bord = Math.max(fr.left, 0) + 8;
      const prise = await hefe.evaluate(([x, y]) => { const e = document.elementFromPoint(x, y); return e ? `${e.tagName}.${String(e.className?.baseVal ?? e.className).slice(0, 24)}${e.closest('[data-bord]') ? ' [BORD]' : ''}` : null; }, [x0, y0]);
      const num = s => { const m = RE.semaine.exec(s ?? ''); return m ? Number(m[1]) : null; };
      await doigt(hefe, 'touchStart', x0, y0); await z(180);
      for (let i = 1; i <= 10; i++) { await doigt(hefe, 'touchMove', x0 + ((bord - x0) * i) / 10, y0); await z(25); }
      let visee = null, recul = 0;
      for (let t = 0; t < 30 && recul < 2; t++) { await z(300); visee = await hefe.evaluate(() => document.querySelector('[data-ici]')?.textContent ?? null); const n = num((/S(\d+)/.exec(visee ?? '') ?? [])[0]); if (n !== null && num(avant.sem) !== null) recul = modulo(num(avant.sem) - n); }
      await photo(hefe, `b1-${theme}-pendant`);
      await doigt(hefe, 'touchEnd'); await z(900);
      await photo(hefe, `b1-${theme}-apres`);
      const bandeau = await hefe.evaluate(() => { const l = document.body.innerText.split('\n').map(s => s.trim()).filter(s => /^Hefe :/.test(s)); return l[0] ?? null; });
      const apres = await lire();
      const annule = await hefe.evaluate(() => { const b = [...document.querySelectorAll('button')].find(x => /^Annuler$/.test((x.textContent || '').trim())); if (!b) return null; const q = b.getBoundingClientRect(); return { x: q.left + q.width / 2, y: q.top + q.height / 2 }; });
      let retour = null;
      if (annule) { await taper(hefe, annule.x, annule.y); await z(700); retour = (await lire())?.label ?? null; }
      const deplace = /^Hefe : S\d+ → S\d+/.test(bandeau ?? ''), prete = /prête le [^,]+/.exec(avant.label ?? '')?.[0], preteApres = /prête le [^,]+/.exec(apres?.label ?? '')?.[0];
      verdict('b1', theme, !!visee && recul >= 2 && deplace && !!annule && retour === avant.label,
        `Hefe (largeur ${Math.round(hb.width)} px, doigt au milieu sur ${prise}) tenue au bord gauche : bulle « ${visee} » (recul visé ${recul} sem., 2 au moins) ; bandeau « ${bandeau} » (« Hefe : S44 → S40 » attendu, jamais « prête le … » seul) ; fin avant « ${prete} », après « ${preteApres ?? 'hors de la vue'} » ; Annuler ${annule ? (retour === avant.label ? 'remet la barre' : `ne la remet pas (« ${retour} »)`) : 'ABSENT'}`);
    }
    await hefe.close();
  } catch (e) { verdict('b1', theme, false, `erreur : ${e.message}`); }
  /* b2 (CAL-PASSE voie S2, R2-2, 21.11) : le geste EXACT de la critique (390, 3 mois, bord droit de Hefe tiré de 2 colonnes, doigt tenu) : la durée tirée
     (« pas brassée · prête le … ») se lit en entier SANS couvrir le texte d'une autre ligne (« Jhhh −45 J34 / 34 »), et le nom de la barre tirée reste lisible.
     Sans place libre dans la frise, elle se lit dans la bande basse (`[data-duree-bas]`). */
  try {
    const hb2 = await page('m390', theme, `${BASE}/?dev-local&finance-demo=parcours-calendrier`, 'nav button', fixtureCalendrier(new Date().toISOString().slice(0, 10)).entrees);
    if (!(await hb2.$('[data-calendrier]'))) {
      const nav = await hb2.evaluate(() => { const b = [...document.querySelectorAll('nav button')].find(x => /Calendrier/.test(x.innerText)); if (!b) return null; const r = b.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; });
      if (nav) await taper(hb2, nav.x, nav.y);
    }
    await hb2.waitForSelector('[data-calendrier]', { timeout: 60000 }); await z(900);
    const menu = await rect(hb2, '[data-ent-periode]'); await taper(hb2, menu.left + menu.width / 2, menu.top + menu.height / 2);
    const trois = await hb2.evaluate(() => { const e = [...document.querySelectorAll('[data-menu-periode] button')].find(x => (x.textContent || '').trim() === '3 mois'); if (!e) return null; const r = e.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; });
    if (trois) { await taper(hb2, trois.x, trois.y); await z(900); }
    await hb2.evaluate(() => { document.querySelector('[data-barre][data-titre="Hefe"]')?.scrollIntoView({ block: 'center' }); }); await z(400);
    const b = await rect(hb2, '[data-barre][data-titre="Hefe"]'), col = await hb2.evaluate(() => { const s = [...document.querySelectorAll('[data-bande-semaines] [data-semaine]')]; return s.length > 1 ? s[1].getBoundingClientRect().x - s[0].getBoundingClientRect().x : 28; });
    if (!b) verdict('b2', theme, false, 'Hefe introuvable');
    else {
      const x0 = b.right - 3, y0 = (b.top + b.bottom) / 2;
      /* les textes de la frise (hors la barre de Hefe) lus AVANT le geste : aucun ne doit disparaître ni être couvert pendant le geste */
      const avantT = await hb2.evaluate(() => {
        const o = []; const w = document.createTreeWalker(document.querySelector('[data-frise]'), NodeFilter.SHOW_TEXT); const hefe = document.querySelector('[data-barre][data-titre="Hefe"]');
        for (let n = w.nextNode(); n; n = w.nextNode()) {
          const p = n.parentElement, t = (n.textContent || '').replace(/\s+/g, ' ').trim(), s = p && getComputedStyle(p);
          if (!t || !p || s.visibility === 'hidden' || s.display === 'none' || (hefe && hefe.contains(p))) continue;
          const g = document.createRange(); g.selectNodeContents(n); const r = g.getBoundingClientRect(); if (r.width > 0 && r.height > 0) o.push(t);
        }
        return o;
      });
      await doigt(hb2, 'touchStart', x0, y0); await z(180);
      for (let i = 1; i <= 12; i++) { await doigt(hb2, 'touchMove', x0 + (2 * col * i) / 12, y0); await z(25); }
      await z(500);
      const m = await hb2.evaluate((avantT) => {
        const vu = e => { const s = getComputedStyle(e); return s.visibility !== 'hidden' && s.display !== 'none'; };
        const texte = e => { const g = document.createRange(); g.selectNodeContents(e); return g.getBoundingClientRect(); };
        const hefe = document.querySelector('[data-barre][data-titre="Hefe"]');
        const duree = hefe && [...hefe.querySelectorAll('[data-duree]')].find(vu);
        const bas = document.querySelector('[data-duree-bas]');
        /* tout texte de la frise (un nœud de texte = une boîte rendue), hors la barre de Hefe et sa durée : noms, montants, jours, durées des autres lignes */
        const autres = []; const marche = document.createTreeWalker(document.querySelector('[data-frise]'), NodeFilter.SHOW_TEXT);
        for (let n = marche.nextNode(); n; n = marche.nextNode()) {
          const t = (n.textContent || '').replace(/\s+/g, ' ').trim(), p = n.parentElement;
          if (!t || !p || !vu(p) || (duree && duree.contains(p)) || (hefe && hefe.contains(p))) continue;
          const g = document.createRange(); g.selectNodeContents(n); const r = g.getBoundingClientRect();
          if (r.width > 0 && r.height > 0) autres.push({ t, r });
        }
        let couvre = null;
        if (duree) { const r = duree.getBoundingClientRect(); for (const x of autres) if (Math.min(r.right, x.r.right) - Math.max(r.left, x.r.left) > 1 && Math.min(r.bottom, x.r.bottom) - Math.max(r.top, x.r.top) > 1) couvre = x.t.slice(0, 40); }
        const hefeNom = [...document.querySelectorAll('[data-frise] .cal-lbl')].some(e => vu(e) && /^Hefe/.test((e.textContent || '').trim())) || (!!hefe && /Hefe/.test(hefe.textContent || ''));
        const apres = autres.map(x => x.t), manquants = avantT.filter(t => { const i = apres.indexOf(t); if (i < 0) return true; apres.splice(i, 1); return false; });
        const dureeLue = duree ? (duree.textContent || '').trim() : bas ? (bas.textContent || '').trim() : null;
        const rb = bas?.getBoundingClientRect(); const barres = [...document.querySelectorAll('[data-frise] .cal-barre')].map(e => e.getBoundingClientRect());
        const surFrise = rb ? barres.some(q => Math.min(rb.right, q.right) - Math.max(rb.left, q.left) > 1 && Math.min(rb.bottom, q.bottom) - Math.max(rb.top, q.top) > 1) : false;
        return { dureeLue, dansFrise: !!duree, dansBas: !!bas, couvre, hefeNom, manquants, surFrise };
      }, avantT);
      await photo(hb2, `b2-${theme}-pendant`);
      await doigt(hb2, 'touchEnd'); await z(700);
      verdict('b2', theme, !!m.dureeLue && !m.couvre && m.hefeNom && m.manquants.length === 0 && !m.surFrise,
        `Hefe : bord droit tiré de 2 colonnes (390, 3 mois) : durée « ${m.dureeLue} » lue ${m.dansFrise ? 'dans la frise' : m.dansBas ? 'dans la bande basse' : 'NULLE PART'} ; couvre ${m.couvre ? `« ${m.couvre} »` : 'aucune étiquette'} ; nom de Hefe ${m.hefeNom ? 'lisible' : 'ILLISIBLE'} ; textes des autres lignes (${avantT.length} avant le geste) ${m.manquants.length ? `DISPARUS : ${m.manquants.slice(0, 4).join(' | ')}` : 'tous présents'} ; bande basse ${m.surFrise ? 'sur une barre' : 'libre'}`);
      const annule = await hb2.evaluate(() => { const e = [...document.querySelectorAll('button')].find(x => /^Annuler$/.test((x.textContent || '').trim())); if (!e) return null; const q = e.getBoundingClientRect(); return { x: q.left + q.width / 2, y: q.top + q.height / 2 }; });
      if (annule) { await taper(hb2, annule.x, annule.y); await z(500); }
    }
    await hb2.close();
  } catch (e) { verdict('b2', theme, false, `erreur : ${e.message}`); }
  if (SEUL.length) { await banc.close(); continue; }


  /* a : la fenêtre de la frise recule de 4 semaines */
  try {
    await banc.evaluate(() => window.scrollTo(0, 0)); await z(300);
    const avant = await fenetreSemaines(banc), pg = await rect(banc, sel.poignee);
    if (!avant || !pg) verdict('a', theme, false, 'fenêtre ou poignée de début introuvable');
    else {
      const unite = avant.w / (modulo(avant.f - avant.d) + 1), c = centreVisible(pg);
      await glisser(banc, c.x, c.y, -4 * unite);
      const apres = await fenetreSemaines(banc), recul = apres ? modulo(avant.d - apres.d) : -1;
      await photo(banc, `a-${theme}-apres`);
      verdict('a', theme, recul >= 3 && recul <= 8, `S${avant.d} → ${apres ? `S${apres.d}` : 'absente'} : recul ${recul} sem. (3 à 8 attendues), poignée x ${Math.round(pg.left)}–${Math.round(pg.right)}`);
    }
  } catch (e) { verdict('a', theme, false, `erreur : ${e.message}`); }

  /* c : le rond pointillé (curseur de lecture) est VRAIMENT ouvert (un glisser de lecture, posé sur la poignée de début), puis il n'est jamais sous le doigt au
     départ du glisser de la fenêtre (elementFromPoint sur les deux poignées), et il se ferme dès que la poignée est touchée */
  try {
    await banc.recharger();
    const pg = await rect(banc, sel.poignee), pf = await rect(banc, '[data-poignee="fin"]'), cb = await rect(banc, '.ent-cb');
    if (!pg || !pf || !cb) verdict('c', theme, false, 'courbe ou poignées introuvables');
    else {
      const yc = (cb.top + cb.bottom) / 2, cd = centreVisible(pg), cf = centreVisible(pf);
      /* départ loin des deux zones de prise (une prise tire la fenêtre au lieu de lire), arrivée sur la poignée de début : le rond s'y pose */
      const libre = [60, 120, 250, 300, 340].find(x => x < pg.left - 6 || x > pf.right + 6 || (x > pg.right + 6 && x < pf.left - 6));
      const lu = () => banc.evaluate(() => !!document.querySelector('.ent-curseur, [data-curseur]'));
      await glisser(banc, libre ?? 340, yc, cd.x - (libre ?? 340), 0);
      let ouvert = await lu();
      if (!ouvert) { await z(800); await glisser(banc, 340, yc, cd.x - 340, 0); ouvert = await lu(); }
      const sous = (x, y) => banc.evaluate((px, py) => { const e = document.elementFromPoint(px, py); return { dans: !!e?.closest('.ent-curseur, [data-curseur]'), nom: e ? `${e.tagName}.${String(e.className?.baseVal ?? e.className).slice(0, 30)}` : null }; }, x, y);
      const sd = await sous(cd.x, cd.y), sf = await sous(cf.x, cf.y);
      await photo(banc, `c-${theme}-ouvert`);
      await glisser(banc, cd.x, cd.y, 8);
      const reste = await banc.evaluate(() => { const e = document.querySelector('.ent-curseur, [data-curseur]'); if (!e) return null; const b = e.getBoundingClientRect(); return b.width > 0 ? { x: b.left, y: b.top, w: b.width } : null; });
      await photo(banc, `c-${theme}-apres`);
      verdict('c', theme, ouvert && !sd.dans && !sf.dans && !reste, `curseur ${ouvert ? 'ouvert' : 'NON OUVERT (rien de mesuré)'} par le glisser de lecture ; sous le doigt de départ : poignée début ${sd.nom}${sd.dans ? ' (CURSEUR)' : ''}, poignée fin ${sf.nom}${sf.dans ? ' (CURSEUR)' : ''} ; après la poignée : ${reste ? `reste à x ${Math.round(reste.x)}` : 'fermé'}`);
    }
  } catch (e) { verdict('c', theme, false, `erreur : ${e.message}`); }

  /* b et e : glisser une barre de brassin de 4 semaines vers le passé */
  try {
    await banc.recharger();
    /* la frise ne montre que sa fenêtre : pour reculer une barre de 4 semaines, le brasseur recule d'abord la fenêtre (le passé est visible), puis glisse */
    await banc.evaluate(() => window.scrollTo(0, 0)); await z(300);
    { const av = await fenetreSemaines(banc), pg0 = await rect(banc, sel.poignee); if (av && pg0) { const c0 = centreVisible(pg0); await glisser(banc, c0.x, c0.y, -4 * (av.w / (modulo(av.f - av.d) + 1))); } }
    const info = await banc.evaluate(() => {
      const barres = [...document.querySelectorAll('[data-frise] [data-chose][data-rangee="brassins"]')].filter(x => x.querySelector('[data-bord]') && x.getBoundingClientRect().left > 4);
      /* la barre déplaçable qui commence le plus à droite : c'est elle qui a la place de reculer de 4 semaines sans quitter l'écran */
      const b = [...barres].sort((p, q) => q.getBoundingClientRect().left - p.getBoundingClientRect().left)[0];
      if (!b) return null;
      b.scrollIntoView({ block: 'center' });
      const r = b.getBoundingClientRect(), y = r.top + r.height / 2;
      let x = null;
      for (let t = r.right - 8; t >= r.left + 12; t -= 3) {
        const e = document.elementFromPoint(t, y);
        if (e && e.closest('[data-barre]') === b && !e.closest('[data-jalon], [data-bord], [data-grip]')) { x = t; break; }
      }
      const f = document.querySelector('[data-frise]');
      return { id: b.getAttribute('data-chose'), titre: b.getAttribute('data-titre'), sem: b.getAttribute('data-semaine'), x, y, lc: parseFloat(f?.getAttribute('data-largeur-colonne')) || 390 / 7, gauche: r.left, droite: r.right };
    });
    if (!info || info.x === null) verdict('b', theme, false, `barre de brassin introuvable ou sans prise (${JSON.stringify(info)})`);
    else {
      await z(300);
      const semaineDe = () => banc.evaluate(id => document.querySelector(`[data-chose="${id}"]`)?.getAttribute('data-semaine') ?? null, info.id);
      const num = s => { const m = RE.semaine.exec(s ?? ''); return m ? Number(m[1]) : null; };
      const dx = -Math.min(4 * info.lc, info.x - 4);
      await glisser(banc, info.x, info.y, dx);
      await photo(banc, `b-${theme}-apres`);
      const apres = await semaineDe(), recul = apres === null ? -1 : modulo(num(info.sem) - num(apres));
      /* « Annuler » remet la semaine */
      const annule = await banc.evaluate(() => { const b = [...document.querySelectorAll('button')].find(x => /^Annuler$/.test((x.textContent || '').trim())); if (!b) return null; const q = b.getBoundingClientRect(); return { x: q.left + q.width / 2, y: q.top + q.height / 2 }; });
      let retour = null;
      if (annule) { await taper(banc, annule.x, annule.y); await z(500); retour = await semaineDe(); }
      verdict('b', theme, recul >= 3 && recul <= 8 && retour === info.sem, `${info.titre} ${info.sem} → ${apres} : recul ${recul} sem. (3 à 8) ; Annuler ${annule ? `→ ${retour}` : 'ABSENT'}`);
    }
  } catch (e) { verdict('b', theme, false, `erreur : ${e.message}`); }

  /* b0 (CAL-PASSE N1 n° 1, 21.11) : le geste EXACT du brasseur, SANS reculer la fenêtre avant. Une barre de brassin du début de la vue par défaut est tenue puis
     tirée jusqu'au bord gauche de la frise et y reste : la fenêtre recule d'elle-même (défilement automatique), la bulle « lâcher ici » dit la semaine visée ;
     lâcher quand elle a reculé de 4 semaines ou plus : la semaine de la barre recule d'autant ; Annuler la remet. */
  try {
    await banc.recharger();
    await banc.evaluate(() => window.scrollTo(0, 0)); await z(300);
    const info = await banc.evaluate(() => {
      const barres = [...document.querySelectorAll('[data-frise] [data-chose][data-rangee="brassins"]')].filter(x => x.querySelector('[data-bord]') && x.getBoundingClientRect().width > 0);
      const b = [...barres].sort((p, q) => p.getBoundingClientRect().left - q.getBoundingClientRect().left)[0];
      if (!b) return null;
      b.scrollIntoView({ block: 'center' });
      const r = b.getBoundingClientRect(), y = r.top + r.height / 2;
      let x = null;
      for (let t = r.left + 6; t <= r.right - 8; t += 2) { const e = document.elementFromPoint(t, y); if (e && e.closest('[data-barre]') === b && !e.closest('[data-jalon], [data-bord], [data-grip]')) { x = t; break; } }
      return { id: b.getAttribute('data-chose'), titre: b.getAttribute('data-titre'), sem: b.getAttribute('data-semaine'), x, y, gauche: r.left };
    });
    if (!info || info.x === null) verdict('b0', theme, false, `barre du début de la vue introuvable ou sans prise (${JSON.stringify(info)})`);
    else {
      const num = s => { const m = RE.semaine.exec(s ?? ''); return m ? Number(m[1]) : null; };
      const ici = () => banc.evaluate(() => document.querySelector('[data-ici]')?.textContent ?? null);
      await z(300);
      await doigt(banc, 'touchStart', info.x, info.y); await z(180);
      for (let i = 1; i <= 10; i++) { await doigt(banc, 'touchMove', info.x + ((6 - info.x) * i) / 10, info.y); await z(25); }
      let visee = null, recul = 0;
      for (let t = 0; t < 40 && recul < 4; t++) { await z(300); visee = await ici(); const n = num((/S(\d+)/.exec(visee ?? '') ?? [])[0]); if (n !== null && num(info.sem) !== null) recul = modulo(num(info.sem) - n); }
      await photo(banc, `b0-${theme}-pendant`);
      await doigt(banc, 'touchEnd'); await z(900);
      await photo(banc, `b0-${theme}-apres`);
      const apres = await banc.evaluate(id => document.querySelector(`[data-chose="${id}"]`)?.getAttribute('data-semaine') ?? null, info.id);
      const sem = apres === null ? -1 : modulo(num(info.sem) - num(apres));
      const annule = await banc.evaluate(() => { const b = [...document.querySelectorAll('button')].find(x => /^Annuler$/.test((x.textContent || '').trim())); if (!b) return null; const q = b.getBoundingClientRect(); return { x: q.left + q.width / 2, y: q.top + q.height / 2 }; });
      let retour = null;
      if (annule) { await taper(banc, annule.x, annule.y); await z(600); retour = await banc.evaluate(id => document.querySelector(`[data-chose="${id}"]`)?.getAttribute('data-semaine') ?? null, info.id); }
      verdict('b0', theme, !!visee && recul >= 4 && (sem >= 4 || apres === null) && !!annule && retour === info.sem,
        `${info.titre} ${info.sem} tenue au bord gauche : bulle « ${visee} » (recul visé ${recul} sem., 4 au moins) ; après le lâcher ${apres ?? 'hors de la vue (fenêtre reculée moins que la cible)'} (recul ${sem}) ; Annuler ${annule ? `→ ${retour}` : 'ABSENT'}`);
    }
  } catch (e) { verdict('b0', theme, false, `erreur : ${e.message}`); }


  /* e : le BORD d'une barre tiré au doigt (la plainte, capture 2-etiquette-sur-barre : « J0 / 55 · prête 13 févr. » posée sur la barre et son nom), puis le corps d'une barre :
     pendant et après, la durée tirée ne recouvre ni la barre ni son nom, et tient dans l'écran */
  for (const geste of ['bord', 'barre']) {
    try {
      await banc.recharger();
      const mesure = id => banc.evaluate(i => {
        const barre = document.querySelector(`[data-chose="${i}"]`); if (!barre) return null;
        const r = b => { const q = b.getBoundingClientRect(); return { left: q.left, right: q.right, top: q.top, bottom: q.bottom }; };
        const d = barre.querySelector('[data-duree]'), lbl = barre.nextElementSibling, nom = lbl?.querySelector('.cal-lbl-t');
        const sous = document.querySelector(`[data-phrase-sous="${i}"]`);
        return { barre: r(barre), haute: barre.classList.contains('cal-barre-2l'), duree: d ? r(d) : null, dureeIn: !!d && (d.classList.contains('cal-duree-in') || d.getAttribute('data-place') === 'dedans'), place: d?.getAttribute('data-place') ?? null, texte: (d ?? sous)?.textContent?.trim() ?? null, sous: sous ? r(sous) : null, W: innerWidth,
          nom: nom ? r(nom) : null, nomVisible: lbl ? getComputedStyle(lbl).visibility !== 'hidden' : null, cote: [...(lbl?.classList ?? [])].find(c => /^cal-lbl-(dedans|droite|gauche)$/.test(c)) ?? null };
      }, id);
      const ch = await banc.evaluate(g => {
        const barres = [...document.querySelectorAll('[data-frise] [data-chose][data-rangee="brassins"]')].filter(b => b.querySelector('[data-bord]'));
        /* une barre d'une ligne dont le nom est DANS la barre (la plainte, capture 2), sinon la première déplaçable qui a de la place */
        const dedans = barres.find(b => !b.classList.contains('cal-barre-2l') && b.nextElementSibling?.classList.contains('cal-lbl-dedans'));
        const b = dedans ?? barres[0];
        if (!b) return null;
        b.scrollIntoView({ block: 'center' });
        const r = b.getBoundingClientRect(), y = r.top + r.height / 2;
        let x = null;
        if (g === 'bord') { const bd = b.querySelector('[data-bord]').getBoundingClientRect(); x = bd.left + bd.width / 2; }
        else for (let t = r.left + 14; t <= r.right - 8; t += 3) {
          const e = document.elementFromPoint(t, y);
          if (e && e.closest('[data-barre]') === b && !e.closest('[data-jalon], [data-bord], [data-grip]')) { x = t; break; }
        }
        const touche = x === null ? null : document.elementFromPoint(x, y);
        return { id: b.getAttribute('data-chose'), titre: b.getAttribute('data-titre'), x, y, droite: r.right, lc: parseFloat(document.querySelector('[data-frise]')?.getAttribute('data-largeur-colonne')) || 390 / 7, dedans: !!dedans,
          prise: touche ? `${touche.tagName}.${String(touche.className?.baseVal ?? touche.className).slice(0, 24)}` : null };
      }, geste);
      if (!ch || ch.x === null) { verdict(`e ${geste}`, theme, false, `barre introuvable ou sans prise (${JSON.stringify(ch)})`); continue; }
      await z(300);
      /* une colonne vers le futur si elle tient dans l'écran, sinon vers le passé */
      const dx = ch.droite + ch.lc <= 380 ? ch.lc : -ch.lc;
      await glisser(banc, ch.x, ch.y, dx, 0, { lever: false });
      await z(300);
      const pend = await mesure(ch.id);
      await photo(banc, `e-${geste}-${theme}-pendant`);
      await doigt(banc, 'touchEnd'); await z(700);
      await photo(banc, `e-${geste}-${theme}-apres`);
      const apr = await mesure(ch.id);
      /* la phrase du repos vit dans la barre haute (CRITIQUE-9 n° 3, choisi) : seul le nom compte alors ; une durée tirée en dehors de la barre ne la recouvre jamais */
      const sur = m => !m ? null : { barre: (m.duree && !m.haute && !m.dureeIn) || m.sous ? Math.round(inter(m.duree ?? m.sous, m.barre)) : 0, nom: m.nom && m.nomVisible && (m.duree ?? m.sous) ? Math.round(inter(m.duree ?? m.sous, m.nom)) : 0,
        ecran: m.duree ? m.duree.left >= 0 && m.duree.right <= m.W : true };
      const sp = sur(pend), sa = sur(apr);
      const ok = !!pend?.texte && sp.barre === 0 && sp.nom === 0 && sp.ecran && sa.nom === 0 && sa.ecran;
      verdict(`e ${geste}`, theme, ok, pend?.texte ? `${ch.titre} (prise ${ch.prise}, nom ${ch.dedans ? 'dans la barre' : pend.cote}) pendant « ${pend.texte} » (posée ${pend.place ?? 'au repos, dans la barre'}) : ∩ barre ${sp.barre} px², ∩ nom ${sp.nom} px², dans l'écran ${sp.ecran ? 'oui' : 'NON'} ; après : ∩ barre ${sa.barre} px², ∩ nom ${sa.nom} px²` : 'étiquette de durée absente pendant le glisser');
    } catch (err) { verdict(`e ${geste}`, theme, false, `erreur : ${err.message}`); }
  }

  /* f : aucune ligne en double dans une rangée, en 6 semaines puis en 20 */
  try {
    for (const vue of ['6 sem.', '20 sem.']) {
      await banc.recharger();
      if (vue !== '6 sem.') {
        const b = await rect(banc, '[data-ent-periode]'); await taper(banc, b.left + b.width / 2, b.top + b.height / 2);
        const cible = await banc.evaluate(t => { const e = [...document.querySelectorAll('[data-menu-periode] button')].find(x => (x.textContent || '').trim().startsWith(t)); if (!e) return null; const q = e.getBoundingClientRect(); return { x: q.left + q.width / 2, y: q.top + q.height / 2 }; }, '20');
        if (cible) { await taper(banc, cible.x, cible.y); await z(900); }
      }
      const doubles = await banc.evaluate(() => {
        const lu = new Map();
        for (const b of document.querySelectorAll('[data-frise] [data-chose]')) {
          const l = b.nextElementSibling?.classList?.contains('cal-lbl') ? b.nextElementSibling.textContent.replace(/\s+/g, ' ').trim() : '';
          if (!l) continue;
          const cle = `${b.getAttribute('data-rangee')}|${l}`;
          lu.set(cle, (lu.get(cle) ?? 0) + 1);
        }
        return [...lu].filter(([, n]) => n > 1).map(([k, n]) => `${k} ×${n}`);
      });
      verdict('f', theme, doubles.length === 0, `${vue} : ${doubles.length ? `lignes en double ${doubles.join(' ; ')}` : 'aucune ligne en double'}`);
    }
  } catch (e) { verdict('f', theme, false, `erreur : ${e.message}`); }

  /* d : le menu de période dans l'écran (390, 844 × 340, 1280), durées sans chevauchement */
  for (const [nom, c] of Object.entries(CFG)) {
    let p = null;
    try {
      p = nom === 'm390' ? banc : await page(nom, theme, `${BASE}/?preview=calendrier`, '[data-ent-periode]');
      await p.recharger();
      const b = await rect(p, '[data-ent-periode]');
      if (c.tactile) await taper(p, b.left + b.width / 2, b.top + b.height / 2); else { await p.mouse.click(b.left + b.width / 2, b.top + b.height / 2); await z(500); }
      await z(500);
      const m = await p.evaluate(() => {
        const e = document.querySelector('[data-menu-periode]'); if (!e) return null;
        const q = e.getBoundingClientRect();
        const seg = [...e.querySelectorAll('.ent-seg')].map(s => [...s.querySelectorAll('button')].map(x => { const r = x.getBoundingClientRect(); return { left: r.left, right: r.right, top: r.top, bottom: r.bottom, t: (x.textContent || '').trim() }; }));
        return { left: q.left, right: q.right, W: innerWidth, seg };
      });
      await photo(p, `d-${theme}-${nom}`);
      if (!m) verdict('d', `${theme} ${nom}`, false, 'menu absent');
      else {
        let chevauche = [];
        for (const g of m.seg) for (let i = 0; i < g.length; i++) for (let j = i + 1; j < g.length; j++) if (inter(g[i], g[j]) > 1) chevauche.push(`${g[i].t}/${g[j].t}`);
        verdict('d', `${theme} ${nom}`, m.left >= 0 && m.right <= m.W && chevauche.length === 0, `menu x ${m.left.toFixed(0)}–${m.right.toFixed(0)} sur ${m.W} ; chevauchements : ${chevauche.join(', ') || 'aucun'}`);
      }
    } catch (e) { verdict('d', `${theme} ${nom}`, false, `erreur : ${e.message}`); }
    if (nom !== 'm390' && p) await p.close();
  }
  await banc.close();

  /* a2 : la frise de période, feuille « Période » du Calendrier ET de Finances */
  for (const ecran of ['Calendrier', 'Finances']) {
    /* une page neuve par écran : la période est une seule pour toute l'app et se garde au rechargement, le geste d'un écran ne doit pas fausser l'autre */
    const app = await page('m390', theme, `${BASE}/?dev-local&finance-demo`, '[data-periode-pastille]');
    try {
      await app.recharger();
      await app.evaluate(t => [...document.querySelectorAll('button')].find(b => (b.getAttribute('aria-label') || b.textContent).trim().startsWith(t))?.click(), ecran);
      await z(2500);
      /* Finances montre sa propre frise quand une plage est posée ; la feuille de la pastille porte la même `Frise` dans les deux écrans */
      if (ecran === 'Finances') { await app.evaluate(() => [...document.querySelectorAll('[role="tab"], button')].find(b => (b.textContent || '').trim() === 'Opérations')?.click()); await z(2500); }
      const enLigne = await app.evaluate(() => [...document.querySelectorAll('.ops-h')].map(h => { const q = h.getBoundingClientRect(); return { left: q.left, right: q.right }; }));
      const propre = enLigne.length;
      const horsEcran = enLigne.filter(h => h.left < 0 || h.right > 390);
      const bouton = await rect(app, '.pr-ce');
      await taper(app, bouton.left + bouton.width / 2, bouton.top + bouton.height / 2); await z(1200);
      const poignees = await app.evaluate(() => [...document.querySelectorAll('[role="dialog"] .ops-h')].map(h => { const q = h.getBoundingClientRect(); return { q: h.getAttribute('aria-label'), left: q.left, right: q.right, top: q.top, bottom: q.bottom, v: Number(h.getAttribute('aria-valuenow')) }; }));
      const du = poignees.find(h => h.q === 'Début'), au = poignees.find(h => h.q === 'Fin');
      if (!du || !au) { verdict('a2', `${theme} ${ecran}`, false, 'poignées de la frise de période introuvables'); continue; }
      const dedans = h => h.right - h.left >= 44 - 0.5 && h.left >= 0 && h.right <= 390;
      const valeur = async q => app.evaluate(l => Number(document.querySelector(`[role="dialog"] .ops-h[aria-label="${l}"]`)?.getAttribute('aria-valuenow')), q);
      const cDu = { x: (du.left + du.right) / 2, y: (du.top + du.bottom) / 2 }, cAu = { x: (au.left + au.right) / 2, y: (au.top + au.bottom) / 2 };
      const v0 = du.v, f0 = au.v;
      await glisser(app, cDu.x, cDu.y, -14, 0, { tenir: 1700 });
      const v1 = await valeur('Début');
      await photo(app, `a2-${theme}-${ecran}-debut`);
      await app.recharger();
      await app.evaluate(t => [...document.querySelectorAll('button')].find(b => (b.getAttribute('aria-label') || b.textContent).trim().startsWith(t))?.click(), ecran); await z(2500);
      const b2 = await rect(app, '.pr-ce'); await taper(app, b2.left + b2.width / 2, b2.top + b2.height / 2); await z(2200);
      const au2 = await rect(app, '[role="dialog"] .ops-h[aria-label="Fin"]');
      await glisser(app, au2 ? (au2.left + au2.right) / 2 : cAu.x, au2 ? (au2.top + au2.bottom) / 2 : cAu.y, 14, 0, { tenir: 1700 });
      const f1 = await valeur('Fin');
      await photo(app, `a2-${theme}-${ecran}-fin`);
      const recule = v0 - v1, avance = f1 - f0;
      verdict('a2', `${theme} ${ecran}`, dedans(du) && dedans(au) && recule >= 15 && avance >= 15 && horsEcran.length === 0,
        `poignée début x ${du.left.toFixed(0)}–${du.right.toFixed(0)}, fin x ${au.left.toFixed(0)}–${au.right.toFixed(0)} (44 px entiers dans 0–390 attendus) ; tenue 1,7 s : début recule de ${recule} j, fin avance de ${avance} j (15 j au moins) ; frise propre à l'écran : ${propre ? `oui, ${propre} poignées, ${horsEcran.length} hors écran` : 'non, par la feuille de la pastille'}`);
    } catch (e) { verdict('a2', `${theme} ${ecran}`, false, `erreur : ${e.message}`); }
    await app.close();
  }
}

await navigateur.close();
console.log(echecs.length === 0 ? 'CAL-PASSE OK' : `CAL-PASSE ECHEC : ${echecs.length} critère(s) en échec sur ${lignes.length}`);
process.exit(echecs.length === 0 ? 0 : 1);
