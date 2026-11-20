// Voie s2, tour 2 (critique k3) — points 11 et 12 mesurés sur le vrai rendu, et les deux preuves demandées. Fixtures dev-local en mémoire, jamais Firestore.
// Usage : node scripts/with_server.mjs --server "npm run dev -- --port 3105 --strictPort" --port 3105 --timeout 180 -- node work/missions/2026-11-19-bugs-ecrans/voies/s2/capturer-k3.mjs <suffixe>
//   <suffixe> : « avant » (code non corrigé) ou « apres » ; il nomme les captures stocks-malts-<thème>-390-<suffixe>.png.
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const suffixe = process.argv[2] ?? 'apres';
const racine = process.cwd();
const dossier = path.join(racine, 'work/missions/2026-11-19-bugs-ecrans/voies/s2/captures');
const { ouvrir, calme } = await import(pathToFileURL(path.join(racine, '.claude/skills/webapp-testing/examples/_lanceur.mjs')).href);
const url = 'http://localhost:3105/?dev-local';
const dormir = (ms) => new Promise((r) => setTimeout(r, ms));

const fixtures = [
  { id: 's2-levure-perimee', ref: 'LEV-S2-1', name: 'Safale US-05 (test s2)', category: 'Levure', unit: 'sachet', currentStock: 2, minStock: 1, reorder: false,
    yeastLot: { productId: 'US-05', lotNumber: 'S2-A', expiresOn: '2026-10-01' } },
  { id: 's2-levure-dix-jours', ref: 'LEV-S2-2', name: 'Lalvin Kveik (test s2)', category: 'Levure', unit: 'sachet', currentStock: 1, minStock: 1, reorder: false,
    yeastLot: { productId: 'KVEIK', lotNumber: 'S2-B', expiresOn: '2026-11-30' } },
  { id: 's2-malt-pilsner', ref: 'MAL-S2-1', name: 'Pilsner Malz', category: 'Malt', unit: 'kg', currentStock: 25, minStock: 10, reorder: false },
];
const aller = (page, libelle) => page.evaluate((l) => {
  const el = [...document.querySelectorAll('button,a,[role=tab]')].find((e) => e.textContent.trim() === l && e.offsetParent !== null);
  if (!el) throw new Error(`onglet introuvable : ${l}`);
  el.click();
}, libelle);
const theme = (page, t) => page.evaluate((x) => { if (x === 'cave') document.documentElement.setAttribute('data-theme', 'cave'); else document.documentElement.removeAttribute('data-theme'); }, t);
async function semer(page) {
  await page.goto(url, { waitUntil: 'networkidle0' });
  await calme(page, 1500);
  await page.evaluate(async (items) => {
    const m = await import('/src/services/firestoreRepo.ts');
    items.forEach((it) => m.FirestoreRepo.put('stockItems', it.id, it));
  }, fixtures);
  await calme(page, 1000);
}
// Mesure de chaque ligne à repère : le repère couvre-t-il la barre ou sa coupure ? le deuxième rang est-il coupé ?
const mesurer = (page) => page.evaluate(() => [...document.querySelectorAll('.stock-liste[data-rayon]')].map((a) => {
  const rp = a.querySelector('.l1-rp'), n1 = a.querySelector('.l1-n1'), n2 = a.querySelector('.l1-n2'), kg = a.querySelector('.l1-kg'), cut = a.querySelector('.l1-cut');
  const r = (e) => { const b = e?.getBoundingClientRect(); return b ? { x: Math.round(b.left), y: Math.round(b.top), w: Math.round(b.width), h: Math.round(b.height) } : null; };
  const coupe = (x, y) => !!(x && y && x.x < y.x + y.w && y.x < x.x + x.w && x.y < y.y + y.h && y.y < x.y + x.h);
  const rpR = r(rp), kgR = r(kg), cutR = r(cut);
  const fond = rp ? getComputedStyle(rp).backgroundColor : null;
  const opaque = !!fond && !/^rgba\(\s*\d+,\s*\d+,\s*\d+,\s*0\s*\)$/.test(fond) && fond !== 'transparent';
  return {
    nom: n1?.textContent, repere: rp?.textContent ?? null, rangDeux: n2?.textContent ?? null,
    repereOpaque: rp ? opaque : null, repereSurBarre: coupe(rpR, kgR), repereSurCoupure: coupe(rpR, cutR),
    rangDeuxCoupe: n2 ? n2.scrollWidth > n2.clientWidth : null, repereDansLeRangDuNom: rp && n1 ? Math.abs((rpR.y + rpR.h / 2) - (r(n1).y + r(n1).h / 2)) < 14 : null,
    rpR, n1R: r(n1), n2R: r(n2),
  };
}));

const sorties = [];
// 1. Stocks à 390 tactile : points 11 et 12, thèmes clair et cave.
{
  const { browser, page, journal } = await ouvrir({ largeur: 390, hauteur: 844, mobile: true, echelle: 2 });
  try {
    await semer(page);
    await aller(page, 'Stocks');
    for (const t of ['clair', 'cave']) {
      await theme(page, t); await calme(page, 700);
      const mesures = await mesurer(page);
      await page.screenshot({ path: path.join(dossier, `stocks-malts-${t}-390-${suffixe}.png`), fullPage: true });
      // Preuve 7 : Stocks › Levures défilé à 390, pour voir si le bouton « + » ou l'infobulle couvrent la dernière ligne.
      await page.evaluate(() => {
        const h = [...document.querySelectorAll('h2,h3')].find((e) => /^Levures/.test(e.textContent.trim()));
        h?.scrollIntoView({ block: 'start' });
        window.scrollBy(0, 40);
      });
      await calme(page, 500);
      if (suffixe === 'apres') await page.screenshot({ path: path.join(dossier, `stocks-levures-390-${t}-defile.png`) });
      sorties.push({ vue: `stocks-390-${t}`, mesures, erreurs: journal.erreurs.length });
    }
  } finally { await browser.close(); }
}
// 2. Stocks à 1280 : le repère de malt reste dans sa colonne, rien ne change.
{
  const { browser, page } = await ouvrir({ largeur: 1280, hauteur: 800, mobile: false, echelle: 1 });
  try {
    await semer(page);
    await aller(page, 'Stocks');
    for (const t of ['clair', 'cave']) {
      await theme(page, t); await calme(page, 700);
      const mesures = await mesurer(page);
      await page.screenshot({ path: path.join(dossier, `stocks-malts-${t}-1280-${suffixe}.png`), fullPage: true });
      sorties.push({ vue: `stocks-1280-${t}`, mesures });
    }
  } finally { await browser.close(); }
}
// 3. Preuve 7 (suite) : au Bord, toucher la case de « Marché d'Automne… » : agit-elle ? (1280 clair, avant puis après le toucher.)
if (suffixe === 'apres') {
  const { browser, page } = await ouvrir({ largeur: 1280, hauteur: 800, mobile: false, echelle: 1 });
  try {
    await semer(page);
    await aller(page, 'Bord');
    await theme(page, 'clair'); await calme(page, 800);
    const etat = () => page.evaluate(() => {
      const l = [...document.querySelectorAll('label')].find((e) => /Marché d.Automne/.test(e.textContent));
      const c = l?.querySelector('input[type=checkbox]');
      return l ? { texte: l.textContent.replace(/\s+/g, ' ').trim(), coche: c.checked, compteur: document.querySelector('#dashboard-agenda')?.parentElement?.textContent.match(/\d+ à faire/)?.[0] ?? null } : null;
    });
    const avant = await etat();
    await page.evaluate(() => document.querySelector('#dashboard-agenda')?.scrollIntoView({ block: 'center' }));
    await dormir(400);
    await page.screenshot({ path: path.join(dossier, 'bord-agenda-case-1280-clair-avant.png') });
    await page.evaluate(() => { [...document.querySelectorAll('label')].find((e) => /Marché d.Automne/.test(e.textContent))?.querySelector('input').click(); });
    await dormir(800);
    const apres = await etat();
    await page.screenshot({ path: path.join(dossier, 'bord-agenda-case-1280-clair-apres.png') });
    sorties.push({ vue: 'bord-case', avant, apres });
  } finally { await browser.close(); }
}
console.log(JSON.stringify(sorties, null, 1));
