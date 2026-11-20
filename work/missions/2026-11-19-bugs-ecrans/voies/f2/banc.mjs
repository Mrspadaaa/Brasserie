// Voie f2 : T3-9 (844×340, Opérations : le graphe ne doit pas remplir l'écran) + captures 390 / 1280 / 844×340, clair et cave.
// Usage : node scripts/with_server.mjs --server "npm run dev -- --port 3106 --strictPort" --port 3106 --env VITE_FIREBASE_API_KEY=fake \
//   -- node work/missions/2026-11-19-bugs-ecrans/voies/f2/banc.mjs [avant]
import path from 'node:path';
import { mkdirSync } from 'node:fs';
import { ouvrir, calme } from '../../../../../.claude/skills/webapp-testing/examples/_lanceur.mjs';

const PORT = (process.env.WITH_SERVER_PORTS ?? '3106').split(',')[0];
const SUFFIXE = process.argv[2] === 'avant' ? 'avant' : 'apres';
const SORTIE = path.join(import.meta.dirname, 'captures');
mkdirSync(SORTIE, { recursive: true });
const MODES = [
  { id: '390', l: 390, h: 844, mobile: true, echelle: 2 },
  { id: '844x340', l: 844, h: 340, mobile: true, echelle: 2 },
  { id: '1280', l: 1280, h: 800, mobile: false, echelle: 1 },
];
const sortie = [];
let ko = 0;
for (const mode of MODES) {
  for (const theme of ['clair', 'cave']) {
    const { browser, page, journal } = await ouvrir({ largeur: mode.l, hauteur: mode.h, mobile: mode.mobile, echelle: mode.echelle });
    await page.goto(`http://localhost:${PORT}/?dev-local&finance-demo`); await calme(page, 1500);
    await page.evaluate((t) => localStorage.setItem('laffinee.theme', t), theme); await page.reload(); await page.waitForFunction(() => [...document.querySelectorAll('nav button, nav a, [role=tab]')].some((e) => /^Finances$/.test(e.textContent.trim())), { timeout: 240000 }); await calme(page, 1500);
    await page.evaluate(() => [...document.querySelectorAll('nav button, nav a, [role=tab]')].find((e) => /^Finances$/.test(e.textContent.trim()))?.click()); await calme(page, 1200);
    await page.evaluate(() => [...document.querySelectorAll('[role=tab],button')].filter((e) => e.offsetParent && e.textContent.trim().startsWith('Opérations'))[0]?.click()); await calme(page, 1200);
    const m = await page.evaluate(() => {
      const piles = document.querySelector('.ops-piles')?.getBoundingClientRect();
      const ligne = document.querySelector('.ops-groupe .ops-row');
      const lr = ligne?.getBoundingClientRect();
      return { h: innerHeight, pilesBas: piles ? Math.round(piles.bottom) : null, pilesHaut: piles ? Math.round(piles.top) : null,
        ligneHaut: lr ? Math.round(lr.top) : null, ligneBas: lr ? Math.round(lr.bottom) : null };
    });
    // Une opération visible sans défiler : sa ligne commence au-dessus du bas de l'écran.
    const visible = m.ligneHaut !== null && m.ligneHaut < m.h - 24;
    if (mode.id === '844x340' && !visible) ko++;
    // k3 n° 13 : au repos, le + flottant ne couvre ni un montant ni un bouton de la colonne de droite (« +720,00 », « + pièce »). On mesure la borne droite du texte et des boutons de la liste contre le bord gauche du +.
    if (mode.id === '844x340') {
      const fab = await page.evaluate(() => {
        const b = document.querySelector('button[aria-label="Actions rapides"]'); const r = b?.getBoundingClientRect();
        const liste = [...document.querySelectorAll('.ops > :not(.ops-bande) *')].filter((e) => e.offsetParent && !e.children.length && e.textContent.trim());
        const droite = Math.max(0, ...liste.map((e) => Math.round(e.getBoundingClientRect().right)));
        const boutons = [...document.querySelectorAll('.ops > :not(.ops-bande) button')].filter((e) => e.offsetParent).map((e) => Math.round(e.getBoundingClientRect().right));
        return { fabGauche: r ? Math.round(r.left) : null, droiteListe: droite, droiteBoutons: Math.max(0, ...boutons) };
      });
      const libre = fab.fabGauche !== null && fab.droiteListe <= fab.fabGauche && fab.droiteBoutons <= fab.fabGauche;
      if (!libre) ko++;
      sortie.push(`${mode.id} ${theme} : + à x=${fab.fabGauche} ; liste jusqu'à x=${fab.droiteListe}, boutons jusqu'à x=${fab.droiteBoutons} -> le + ne couvre rien : ${libre}`);
    }
    sortie.push(`${mode.id} ${theme} : ${JSON.stringify(m)} -> opération visible sans défiler : ${visible}`);
    await page.screenshot({ path: path.join(SORTIE, `operations-${mode.id}-${theme}-${SUFFIXE}.png`) });
    if (journal.erreurs.length) sortie.push(`  erreurs : ${journal.erreurs.slice(0, 2).join(' | ')}`);
    await browser.close();
  }
}
console.log(sortie.join('\n'));
console.log(ko ? `T3-9 KO (${ko})` : 'T3-9 OK');
process.exit(ko ? 1 : 0);
