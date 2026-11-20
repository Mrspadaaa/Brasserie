// Voie f2, tour 2 (preuve n° 6, T3-8) : trois apports (800 avec bloc finance ; 3 890 et 3 600 sans) dans le jeu de démo LOCAL (dev-local, jamais Firestore) ;
// Opérations « Tout » à 1280 et 390, clair et cave : la barre « Apports » doit dire +8 290,00, comme la section « Apports et prélèvements ».
// Usage : node scripts/with_server.mjs --server "npm run dev -- --port 3106 --strictPort" --port 3106 --env VITE_FIREBASE_API_KEY=fake \
//   -- node work/missions/2026-11-19-bugs-ecrans/voies/f2/banc-apports.mjs
import path from 'node:path';
import { mkdirSync } from 'node:fs';
import { ouvrir, calme } from '../../../../../.claude/skills/webapp-testing/examples/_lanceur.mjs';

const PORT = (process.env.WITH_SERVER_PORTS ?? '3106').split(',')[0];
const SORTIE = path.join(import.meta.dirname, 'captures');
mkdirSync(SORTIE, { recursive: true });
const MODES = [{ id: '390', l: 390, h: 844, mobile: true, echelle: 2 }, { id: '1280', l: 1280, h: 800, mobile: false, echelle: 1 }];
const sortie = [];
let ko = 0;
for (const mode of MODES) {
  for (const theme of ['clair', 'cave']) {
    const { browser, page, journal } = await ouvrir({ largeur: mode.l, hauteur: mode.h, mobile: mode.mobile, echelle: mode.echelle });
    await page.goto(`http://localhost:${PORT}/?dev-local&finance-demo`); await calme(page, 1500);
    await page.evaluate((t) => localStorage.setItem('laffinee.theme', t), theme); await page.reload();
    await page.waitForFunction(() => [...document.querySelectorAll('nav button, nav a, [role=tab]')].some((e) => /^Finances$/.test(e.textContent.trim())), { timeout: 240000 }); await calme(page, 1500);
    // Les trois apports (fixture locale seulement) : dates des 3 derniers jours, catégorie « apports ».
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
    // Périmètre « Tout » : panneau Filtres, puis la pastille.
    await page.evaluate(() => [...document.querySelectorAll('button')].find((e) => e.offsetParent && /^Filtres/.test(e.textContent.trim()))?.click()); await calme(page, 500);
    await page.evaluate(() => [...document.querySelectorAll('.ops-chip')].find((e) => e.textContent.trim() === 'Tout')?.click()); await calme(page, 800);
    await page.evaluate(() => [...document.querySelectorAll('button')].find((e) => e.offsetParent && /^Filtres/.test(e.textContent.trim()))?.click()); await calme(page, 500);
    const m = await page.evaluate(() => {
      const piles = document.querySelector('.ops-piles');


      const titres = [...document.querySelectorAll('.ops-groupe, [class*=groupe]')].map((e) => e.textContent.replace(/\s+/g, ' ').trim()).filter((t) => /^Apports et prélèvements/.test(t)).map((t) => t.slice(0, 80));
      // Les espaces des milliers sont des insécables fines : on les retire avant de compter les « +8290,00 » (la barre Apports ET le titre de la section).
      const net = (document.body.innerText || '').replace(/[\s  ’']/g, '');
      const barre = piles?.textContent.replace(/[\s  ’']/g, '').match(/Apports.*?\+8290,00|\+8290,00.*?Apports/)?.[0] ?? null;
      return { barre: barre ? 'Apports +8290,00 dans le graphe' : null, section: titres.slice(0, 1), total: (net.match(/\+8290,00/g) ?? []).length };
    });
    const bonne = m.total >= 2 && m.barre !== null;
    if (!bonne) ko++;
    sortie.push(`${mode.id} ${theme} : ${JSON.stringify(m)} -> +8 290,00 lu : ${bonne}${journal.erreurs.length ? ' ; erreurs=' + journal.erreurs.slice(0, 2).join(' | ') : ''}`);
    // Deux vues : la barre « Apports » du graphe (haut de page), puis le titre de la section « Apports et prélèvements ».
    await page.evaluate(() => { window.scrollTo(0, 0); document.querySelectorAll('main, [data-page-shell] > main, .overflow-y-auto').forEach((e) => { e.scrollTop = 0; }); document.querySelector('.ops-piles')?.scrollIntoView({ block: 'center' }); });
    await calme(page, 500);
    await page.screenshot({ path: path.join(SORTIE, `operations-apports-${mode.id}-${theme}.png`) });
    await page.evaluate(() => { const t = [...document.querySelectorAll('*')].find((e) => !e.children.length && e.textContent.trim() === 'Apports et prélèvements'); t?.scrollIntoView({ block: 'center' }); });
    await calme(page, 500);
    await page.screenshot({ path: path.join(SORTIE, `operations-apports-${mode.id}-${theme}-section.png`) });
    await browser.close();
  }
}
console.log(sortie.join('\n'));
console.log(ko ? `APPORTS KO (${ko})` : 'APPORTS OK');
process.exit(ko ? 1 : 0);
