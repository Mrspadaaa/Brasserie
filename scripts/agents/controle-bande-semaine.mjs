// Contrôle CAL-BANDE-SEMAINE (17.11) : « je veux juste la semaine, et les +/- que je puisse afficher avec un bouton, pareil pour les petites icônes »
// Au repos, la bande des semaines (#fh) ne montre que les semaines (S47, S48…) : aucun nombre, aucune icône visible.
// Un bouton (.mt-b ou [data-bascule-mouvements]) affiche les + et − (et les icônes) ; après lui, la bande montre des nombres signés.
// node scripts/agents/controle-bande-semaine.mjs <page.html> [--paysage] [...]  → BANDE OK | BANDE ECHEC
import { createRequire } from 'module'; import path from 'path'; import { pathToFileURL } from 'url';
const req = createRequire('C:/Users/mrspa/Documents/Brasserie/.claude/worktrees/optimistic-ptolemy-2d1278/package.json');
const pp = req('puppeteer-core');
const args = process.argv.slice(2); const pays = args.includes('--paysage'); const fichiers = args.filter((a) => !a.startsWith('--'));
if (!fichiers.length) { console.log('usage : <page.html> [--paysage]'); process.exit(2); }
const nav = await pp.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new' });
let ko = 0;
for (const f of fichiers) {
  const p = await nav.newPage(); await p.setViewport(pays ? { width: 844, height: 390, isMobile: true, hasTouch: true } : { width: 390, height: 844, isMobile: true, hasTouch: true });
  await p.goto(pathToFileURL(path.resolve(f)).href, { waitUntil: 'load' }); await new Promise((r) => setTimeout(r, 400));
  const lire = () => p.evaluate(() => { const fh = document.querySelector('#fh, [data-bande-semaines]'); if (!fh) return null;
    const icones = [...fh.querySelectorAll('svg')].filter((s) => s.getBoundingClientRect().width > 0 && getComputedStyle(s).visibility !== 'hidden').length;
    return { txt: fh.innerText.replace(/\s+/g, ' ').trim(), icones }; });
  const a = await lire();
  const btn = await p.$('.mt-b, [data-bascule-mouvements]');
  let b = null; if (btn) { await btn.click().catch(() => {}); await new Promise((r) => setTimeout(r, 250)); b = await lire(); }
  const reposOk = a && /^(S\d{1,2})( S\d{1,2})*$/.test(a.txt) && a.icones === 0;
  const boutonOk = !!btn && b && /[+−-]\d/.test(b.txt);
  const bon = reposOk && boutonOk; if (!bon) ko++;
  console.log(`${bon ? 'ok' : 'KO'} ${path.basename(f)} : repos « ${a ? a.txt.slice(0, 70) : 'pas de bande'} » (${a ? a.icones : 0} icône(s))${reposOk ? '' : ' ← la semaine seule au repos'} ; bouton ${btn ? 'présent' : 'absent'}${boutonOk ? ', ± montre les mouvements' : ' ← un bouton doit afficher les + et −'}`);
  await p.close();
}
await nav.close(); console.log(ko ? 'BANDE ECHEC' : 'BANDE OK'); process.exit(ko ? 1 : 0);
