// Voie ct4b : mesures du rendu (échouent avant correctif, passent après). Fixture simulée, jamais Firestore réel.
// Usage (serveur Vite déjà lancé avec VITE_HOP_V4=on) : WITH_SERVER_PORTS=3141 node .../mesure.mjs [15|13|12|14|all]
// 15 : largeur du cadre de l'éditeur à 1280, identique à chaque étape. 13 : hauteur utile à 844×340. 12 : le + ne recouvre rien en fin de défilement à 390.
// 14 : Recettes à 1280, colonne gauche non vide.
import puppeteer from 'puppeteer-core';

const port = (process.env.WITH_SERVER_PORTS || '3141').split(',')[0];
const quoi = process.argv[2] || 'all';
const attendre = (ms) => new Promise((r) => setTimeout(r, ms));
const navigateur = await puppeteer.launch({ executablePath: process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
const recette = {
  id: 'ct4b-fixture', name: 'ZZ TEST — American IPA', style: '21A', volumeL: 30, boilMin: 60, ogTarget: 1.066, colorEbc: 14, efficiencyPct: 75,
  fermentables: [{ name: 'Pilsner', kind: 'grain', use: 'empatage', weightKg: 6.2, potentialPpg: 37, colorEbc: 3 }],
  mash: { steps: [{ name: 'Empâtage', tempC: 66, durationMin: 60 }], mashoutEnabled: false },
  hops: [{ name: 'Nugget', alpha: 13, weightG: 20, stage: 'boil', timeMin: 60 }, { name: 'Citra', alpha: 12, weightG: 60, stage: 'boil', timeMin: 20 }, { name: 'Citra', alpha: 12, weightG: 80, stage: 'dryHop', timeMin: 4320 }],
  yeast: { name: 'SafAle US-05', form: 'sèche', qty: 11.5, unit: 'g', pitchTempC: 19 },
  fermentation: [{ name: 'Primaire', tempC: 19, days: 10 }], createdAt: '2026-11-19T10:00:00.000Z', updatedAt: '2026-11-19T10:00:00.000Z',
};

async function toucher(page, re, sel = 'button,[role=button],[role=tab],summary,a') {
  const c = await page.evaluate((src, s) => {
    const r = new RegExp(src, 'i');
    const b = [...document.querySelectorAll(s)].find((x) => r.test((x.getAttribute('aria-label') || x.textContent || '').trim()) && x.getClientRects().length);
    if (!b) return null; b.scrollIntoView({ block: 'center' }); const q = b.getBoundingClientRect(); return { x: q.x + q.width / 2, y: q.y + q.height / 2 };
  }, re.source, sel);
  if (!c) return false; await page.mouse.click(c.x, c.y); return true;
}

async function ouvrir(w, h, mobile) {
  const contexte = await navigateur.createBrowserContext(); const page = await contexte.newPage();
  await page.setViewport({ width: w, height: h, deviceScaleFactor: 1, isMobile: mobile, hasTouch: mobile });
  await page.evaluateOnNewDocument((th) => { localStorage.setItem('laffinee.theme', th); }, process.env.THEME || 'clair');
  await page.goto(`http://localhost:${port}/?dev-local`, { waitUntil: 'domcontentloaded', timeout: 120000 });
  await page.waitForFunction(() => !!document.querySelector('[aria-label="Actions rapides"]'), { timeout: 170000 });
  await attendre(1500);
  await page.evaluate(async (r) => { const { StorageService } = await import('/src/services/storage.ts'); StorageService.saveRecipes([r]); }, recette);
  await attendre(600);
  return { page, contexte };
}

async function versRecettes(page) {
  for (let k = 0; k < 6; k++) {
    await toucher(page, /^(Production|Brassins)$/); await attendre(1200);
    if (await toucher(page, /^Recettes/, 'button,[role=button],[role=tab],a')) break;
    await attendre(2500);
  }
  await attendre(1500);
}

async function versEditeur(page) {
  await versRecettes(page);
  if (!(await toucher(page, /ZZ TEST — American IPA/, 'button,a,[role=button]'))) throw new Error('recette introuvable');
  await attendre(1000);
  if (!(await toucher(page, /^Modifier/, 'button'))) throw new Error('Modifier introuvable');
  await page.waitForFunction(() => [...document.querySelectorAll('button')].some((b) => /^Suivant/.test(b.textContent.trim())), { timeout: 90000 });
  await attendre(1500);
}

const sortie = {};
const essayer = async (nom, f) => { for (let i = 1; i <= 3; i++) { try { sortie[nom] = await f(); return; } catch (e) { sortie[nom] = `essai ${i} : ${String(e?.message ?? e).slice(0, 100)}`; } } };

try {
  if (quoi === '15' || quoi === 'all') await essayer('15', async () => {
    const { page, contexte } = await ouvrir(1280, 900, false);
    await versEditeur(page);
    const largeurs = [];
    for (let i = 1; i <= 7; i++) {
      largeurs.push(await page.evaluate(() => Math.round(document.querySelector('.recipe-wizard > main > div').getBoundingClientRect().width)));
      if (i < 7) { await toucher(page, /^Suivant/, 'button'); await attendre(1800); }
    }
    await contexte.close();
    const distinctes = [...new Set(largeurs)];
    return { largeurs, verdict: distinctes.length === 1 ? 'OK cadre constant' : 'KO le cadre change' };
  });
  if (quoi === '13' || quoi === 'all') await essayer('13', async () => {
    const { page, contexte } = await ouvrir(844, 340, true);
    await versEditeur(page);
    const m = await page.evaluate(() => {
      const r = (s) => { const e = document.querySelector(s); if (!e) return null; const q = e.getBoundingClientRect(); return [Math.round(q.top), Math.round(q.bottom)]; };
      const main = document.querySelector('.recipe-wizard > main');
      const rangee = document.querySelector('[data-page-end-actions]');
      const q = main.getBoundingClientRect(); const e = rangee ? rangee.getBoundingClientRect() : null;
      const metrics = document.querySelector('.recipe-metrics'); const mq = metrics?.getBoundingClientRect();
      return { header: r('.recipe-wizard > header'), main: [Math.round(q.top), Math.round(q.bottom)], rangee: e && [Math.round(e.top), Math.round(e.bottom)], metrics: mq && [Math.round(mq.top), Math.round(mq.bottom), getComputedStyle(metrics.parentElement).position], vh: innerHeight };
    });
    // Hauteur utile : la zone qui défile, moins la rangée Retour/Suivant si elle reste collée au bas de l'écran.
    const collee = m.rangee && m.rangee[0] > m.main[0];
    const utile = (m.main[1] - m.main[0]) - (collee && await page.evaluate(() => getComputedStyle(document.querySelector('[data-page-end-actions]')).position === 'sticky') ? m.rangee[1] - m.rangee[0] : 0);
    const bas = utile, haut = 0;
    await contexte.close();
    return { ...m, utile, verdict: utile >= 260 ? 'OK zone de défilement non rognée' : 'KO rangée collée : hauteur utile trop faible' };
  });
  if (quoi === '12' || quoi === 'all') await essayer('12', async () => {
    const { page, contexte } = await ouvrir(390, 844, true);
    await versEditeur(page);
    await page.evaluate(() => { [...document.querySelectorAll('*')].filter((n) => n.scrollHeight > n.clientHeight + 20 && /auto|scroll/.test(getComputedStyle(n).overflowY)).forEach((n) => { n.scrollTop = n.scrollHeight; }); });
    await attendre(600);
    const m = await page.evaluate(() => {
      const fab = document.querySelector('.floating-actions > button, .floating-actions');
      const f = fab?.getBoundingClientRect();
      const tuile = [...document.querySelectorAll('button,summary,div')].filter((x) => /^Matériel/.test((x.textContent || '').trim()) && x.getClientRects().length && x.getBoundingClientRect().height < 120).pop();
      const t = tuile?.getBoundingClientRect();
      const coupe = f && t ? !(f.right < t.left || f.left > t.right || f.bottom < t.top || f.top > t.bottom) : null;
      return { fab: f && [Math.round(f.left), Math.round(f.top), Math.round(f.right), Math.round(f.bottom)], tuile: t && [Math.round(t.left), Math.round(t.top), Math.round(t.right), Math.round(t.bottom)], recouvre: coupe };
    });
    await contexte.close();
    return { ...m, verdict: m.recouvre === false ? 'OK le + ne recouvre pas Matériel en fin de page' : 'KO ou indéterminé' };
  });
  if (quoi === '14' || quoi === 'all') await essayer('14', async () => {
    const { page, contexte } = await ouvrir(1280, 900, false);
    await versRecettes(page);
    const m = await page.evaluate(() => {
      const g = document.querySelector('.rcp-col-g'), d = document.querySelector('.rcp-col-d'), e = document.querySelector('.rcp-ecran');
      const q = (n) => { const b = n?.getBoundingClientRect(); return b && [Math.round(b.left), Math.round(b.top), Math.round(b.width), Math.round(b.height)]; };
      return { ecran: q(e), gauche: q(g), droite: q(d), colonnes: e ? getComputedStyle(e).gridTemplateColumns : null };
    });
    await contexte.close();
    return { ...m, verdict: m.droite && m.gauche && Math.abs(m.droite[0] - m.gauche[0]) < 8 ? 'OK une seule colonne' : 'KO colonne gauche vide à côté de la liste' };
  });
  // Tour 2, point 5 : aperçu d'une recette à 844 × 340 ; la ligne « OG · IBU › » et la dernière ligne du besoin se lisent sans défiler, au-dessus du pied.
  if (quoi === '5' || quoi === 'all') await essayer('5', async () => {
    const { page, contexte } = await ouvrir(844, 340, true);
    await versRecettes(page);
    if (!(await toucher(page, /ZZ TEST — American IPA/, 'button,a,[role=button]'))) throw new Error('recette introuvable');
    await attendre(1200);
    const m = await page.evaluate(() => {
      const pied = document.querySelector('.rcp-pied')?.getBoundingClientRect();
      const bas = (s) => { const e = [...document.querySelectorAll(s)].pop(); return e ? Math.round(e.getBoundingClientRect().bottom) : null; };
      return { pied: pied && Math.round(pied.top), derniereLigne: bas('.rcp-ingr'), ogIbu: bas('.rcp-detail'), vh: innerHeight };
    });
    await contexte.close();
    return { ...m, verdict: m.pied && m.ogIbu && m.derniereLigne && m.ogIbu <= m.pied && m.derniereLigne <= m.pied ? 'OK la ligne OG · IBU et le dernier ingrédient sont au-dessus du pied' : 'KO coupé sous le pied' };
  });
  // Tour 2, point 6 : à 1280, la liste du Récap (.rc2) a la largeur du cadre des autres étapes.
  if (quoi === '6' || quoi === 'all') await essayer('6', async () => {
    const { page, contexte } = await ouvrir(1280, 900, false);
    await versEditeur(page);
    for (let i = 1; i < 7; i++) { await toucher(page, /^Suivant/, 'button'); await attendre(1800); }
    const m = await page.evaluate(() => { const c = document.querySelector('.recipe-wizard > main > div')?.getBoundingClientRect().width, r = document.querySelector('.rc2')?.getBoundingClientRect().width; return { cadre: Math.round(c), liste: Math.round(r) }; });
    await contexte.close();
    return { ...m, verdict: m.liste >= m.cadre - 40 ? 'OK la liste du Récap remplit le cadre' : 'KO la liste du Récap est plus étroite que le cadre' };
  });
  // Tour 2, point 7 : à chaque état de défilement (pas de 120 px, le + au repos), aucun texte ni bouton passe sous le +. Écran : 390 (THEME), 844 ou 1280 via TAILLE.
  if (quoi === '7' || quoi === 'all') await essayer('7', async () => {
    const [w, h, mobile] = process.env.TAILLE === '844' ? [844, 340, true] : process.env.TAILLE === '1280' ? [1280, 900, false] : [390, 844, true];
    const { page, contexte } = await ouvrir(w, h, mobile);
    await versEditeur(page);
    const touches = [];
    for (let etape = 1; etape <= 7; etape++) {
      const total = await page.evaluate(() => { const c = [...document.querySelectorAll('*')].filter((n) => n.scrollHeight > n.clientHeight + 20 && /auto|scroll/.test(getComputedStyle(n).overflowY)).sort((a, b) => b.scrollHeight - a.scrollHeight)[0] || document.scrollingElement; window.__c = c; c.scrollTop = 0; return c.scrollHeight - c.clientHeight; });
      for (let pos = 0; pos <= total + 119; pos += 120) {
        await page.evaluate((p) => { window.__c.scrollTop = p; }, Math.min(pos, total));
        await attendre(700);
        const trouvees = await page.evaluate(() => {
          const fab = document.querySelector('.floating-actions'); const b = fab?.querySelector('button'); if (!b || fab.dataset.floatingActionsMasque === 'true') return null;
          const f = b.getBoundingClientRect(); const visible = (el, q) => { const x = (Math.max(q.left, f.left) + Math.min(q.right, f.right)) / 2, y = (Math.max(q.top, f.top) + Math.min(q.bottom, f.bottom)) / 2; const top = document.elementsFromPoint(x, y).filter((e) => !e.closest('.floating-actions'))[0]; return !!top && (el.contains(top) || top.contains(el)); };
          const dedans = (q) => q.width > 0 && q.height > 0 && !(q.right <= f.left + 1 || q.left >= f.right - 1 || q.bottom <= f.top + 1 || q.top >= f.bottom - 1);
          const sortie = new Set(); const marche = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
          for (let n = marche.nextNode(); n; n = marche.nextNode()) {
            const t = (n.textContent || '').trim(); if (!t) continue; const el = n.parentElement; if (!el || el.closest('.floating-actions') || el.closest('script,style,.sr-only')) continue;
            if (getComputedStyle(el).visibility === 'hidden' || !el.getClientRects().length) continue;
            const r = document.createRange(); r.selectNodeContents(n);
            if ([...r.getClientRects()].some((q) => dedans(q) && visible(el, q))) { const c = el.closest('[hidden]'); if (!c) sortie.add(`${el.tagName.toLowerCase()}.${String(el.className).split(' ')[0]} « ${t.slice(0, 32)} »`); }
          }
          for (const el of document.querySelectorAll('button,input,select,textarea,summary,a[href]')) {
            if (el.closest('.floating-actions') || !el.getClientRects().length) continue;
            const q = el.getBoundingClientRect(); if (dedans(q) && visible(el, q) && getComputedStyle(el).visibility !== 'hidden') sortie.add(`${el.tagName.toLowerCase()}.${String(el.className).split(' ')[0]}<${String(el.parentElement?.className).split(' ')[0]}[cadre] « ${(el.getAttribute('aria-label') || el.textContent || el.getAttribute('type') || '').trim().slice(0, 28)} » @${Math.round(q.left)},${Math.round(q.top)},${Math.round(q.right)},${Math.round(q.bottom)} + @${Math.round(f.left)},${Math.round(f.top)},${Math.round(f.right)},${Math.round(f.bottom)}`);
          }
          return [...sortie];
        });
        if (trouvees && trouvees.length) touches.push({ etape, pos: Math.min(pos, total), trouvees });
      }
      if (etape < 7) { await toucher(page, /^Suivant/, 'button'); await attendre(1800); }
    }
    await contexte.close();
    const plats = [...new Set(touches.flatMap((t) => t.trouvees.map((x) => `étape ${t.etape} : ${x}`)))];
    return { recouvrements: plats.slice(0, 40), nombre: plats.length, verdict: plats.length === 0 ? 'OK rien sous le + à aucun défilement' : 'KO le + recouvre du texte ou un bouton' };
  });
} finally { await navigateur.close(); }
console.log(JSON.stringify(sortie, null, 1));
