// Voie v3, BK3-1 : Opérations « Tout » avec trois apports (jeu de démo LOCAL) : les étiquettes de montant du graphe
// (1) restent dans le cadre du graphe, (2) ne se recouvrent pas, (3) ne sont traversées par aucun pointillé (.ops-sep).
// Usage : node scripts/with_server.mjs --server "npm run dev -- --port 3124 --strictPort" --port 3124 --env VITE_FIREBASE_API_KEY=fake \
//   -- node work/missions/2026-11-19-bugs-ecrans/voies/v3/banc-bk31.mjs [avant|apres]
import path from 'node:path';
import { mkdirSync } from 'node:fs';
import { ouvrir, calme } from '../../../../../.claude/skills/webapp-testing/examples/_lanceur.mjs';

const PORT = (process.env.WITH_SERVER_PORTS ?? '3134').split(',')[0];
const QUAND = process.argv[2] ?? 'apres';
const SORTIE = path.join(import.meta.dirname, 'captures');
mkdirSync(SORTIE, { recursive: true });
const MODES = [{ id: '360', l: 360, h: 780, mobile: true, echelle: 2 }, { id: '390', l: 390, h: 844, mobile: true, echelle: 2 }, { id: '1280', l: 1280, h: 800, mobile: false, echelle: 1 }];
let ko = 0; const SEULS = (process.env.MODES ?? '').split(',').filter(Boolean);
for (const mode of MODES.filter((m) => !SEULS.length || SEULS.includes(m.id))) {
  for (const theme of ['clair', 'cave']) {
    const { browser, page, journal } = await ouvrir({ largeur: mode.l, hauteur: mode.h, mobile: mode.mobile, echelle: mode.echelle });
    await page.goto(`http://localhost:${PORT}/?dev-local&finance-demo`, { waitUntil: 'domcontentloaded' }); await calme(page, 1500);
    await page.evaluate((t) => localStorage.setItem('laffinee.theme', t), theme); await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => [...document.querySelectorAll('nav button, nav a, [role=tab]')].some((e) => /^Finances$/.test(e.textContent.trim())), { timeout: 240000 }); await calme(page, 1500);
    await page.evaluate(async () => {
      const m = await import('/src/services/storage.ts');
      const jour = (d) => { const x = new Date(); x.setDate(x.getDate() - d); return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`; };
      const base = { tvaAmount: 0, tvaRate: 0, subcategory: '', category: 'apports' };
      const neuves = [
        { ...base, id: 'ZZ-APPORT-1', date: jour(1), description: 'ZZ TEST apport 1', amountHT: 800, amountTTC: 800, finance: { version: 1, kind: 'contribution', amountCents: 80000 } },
        { ...base, id: 'ZZ-APPORT-2', date: jour(2), description: 'ZZ TEST apport 2', amountHT: 3890, amountTTC: 3890 },
        { ...base, id: 'ZZ-APPORT-3', date: jour(3), description: 'ZZ TEST apport 3', amountHT: 3600, amountTTC: 3600 },
      ];
      m.StorageService.saveTransactions([...m.StorageService.getTransactions(), ...neuves]);
    });
    await calme(page, 800);
    await page.evaluate(() => [...document.querySelectorAll('nav button, nav a, [role=tab]')].find((e) => /^Finances$/.test(e.textContent.trim()))?.click()); await calme(page, 1200);
    await page.evaluate(() => [...document.querySelectorAll('[role=tab],button')].filter((e) => e.offsetParent && e.textContent.trim().startsWith('Opérations'))[0]?.click()); await calme(page, 1200);
    await page.evaluate(() => [...document.querySelectorAll('button')].find((e) => e.offsetParent && /^Filtres/.test(e.textContent.trim()))?.click()); await calme(page, 500);
    await page.evaluate(() => [...document.querySelectorAll('.ops-chip')].find((e) => e.textContent.trim() === 'Tout')?.click()); await calme(page, 800);
    await page.evaluate(() => [...document.querySelectorAll('button')].find((e) => e.offsetParent && /^Filtres/.test(e.textContent.trim()))?.click()); await calme(page, 500);
    const m = await page.evaluate(() => {
      const piles = document.querySelector('.ops-piles');
      if (!piles) return { erreur: 'pas de graphe' };
      const cadre = piles.parentElement.getBoundingClientRect();
      const r = (e) => { const b = e.getBoundingClientRect(); return { x: b.left, y: b.top, w: b.width, h: b.height, d: b.right, bas: b.bottom }; };
      // La boîte réelle du texte (Range), pas celle de l'élément : le texte déborde de sa colonne sans agrandir `b`.
      const texte = (e) => { const g = document.createRange(); g.selectNodeContents(e); const b = g.getBoundingClientRect(); return { x: b.left, y: b.top, d: b.right, bas: b.bottom }; };
      const etiquettes = [...piles.querySelectorAll('.ops-pile')].map((p) => {
        const b = [...p.querySelectorAll('b')].find((e) => e.offsetParent && e.getBoundingClientRect().width > 0 && getComputedStyle(e).display !== 'none' && !e.closest('.ops-nom-pile')) ?? p.querySelector('b');
        const visible = [...p.querySelectorAll('b')].filter((e) => e.getBoundingClientRect().width > 0);
        const tb = visible.length ? texte(visible[0]) : null;
        return { cle: p.dataset.pile, texte: visible[0]?.textContent ?? null, boite: tb, colonne: r(p) };
      });
      const seps = [...piles.querySelectorAll('.ops-sep')].map(r);
      const defauts = [];
      for (const e of etiquettes) {
        if (!e.boite) continue;
        if (e.boite.x < cadre.left + 1 || e.boite.d > cadre.right - 1) defauts.push(`${e.cle} « ${e.texte} » hors du cadre (${Math.round(e.boite.x)}–${Math.round(e.boite.d)} pour ${Math.round(cadre.left)}–${Math.round(cadre.right)})`);
        for (const s of seps) if (e.boite.d > s.x && e.boite.x < s.d && e.boite.bas > s.y && e.boite.y < s.bas) defauts.push(`${e.cle} « ${e.texte} » traversé par un pointillé`);
      }
      for (let i = 0; i < etiquettes.length; i += 1) for (let j = i + 1; j < etiquettes.length; j += 1) {
        const a = etiquettes[i].boite, b = etiquettes[j].boite;
        if (a && b && a.d > b.x + 0.5 && a.x < b.d - 0.5 && a.bas > b.y && a.y < b.bas) defauts.push(`${etiquettes[i].cle} et ${etiquettes[j].cle} se recouvrent`);
      }
      return { n: etiquettes.length, textes: etiquettes.map((e) => e.texte), tailleColonne: Math.round(etiquettes[0]?.colonne.w ?? 0), defauts };
    });
    const bon = !m.erreur && m.defauts.length === 0;
    if (!bon) ko++;
    console.log(`${QUAND} ${mode.id} ${theme} : ${JSON.stringify(m)} -> ${bon ? 'OK' : 'DEFAUT'}${journal.erreurs.length ? ' ; erreurs=' + journal.erreurs.slice(0, 2).join(' | ') : ''}`);
    await page.evaluate(() => { document.querySelector('.ops-piles')?.scrollIntoView({ block: 'center' }); });
    await calme(page, 500);
    await page.screenshot({ path: path.join(SORTIE, `bk31-graphe-${mode.id}-${theme}-${QUAND}.png`) });
    await browser.close();
  }
}
console.log(ko ? `BK31 KO (${ko})` : 'BK31 OK');
process.exit(ko ? 1 : 0);
