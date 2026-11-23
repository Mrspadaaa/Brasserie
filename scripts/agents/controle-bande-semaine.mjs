// Contrôle CAL-BANDE-SEMAINE (17.11) : « je veux juste la semaine, et les +/- que je puisse afficher avec un bouton, pareil pour les petites icônes »
// Au repos, la bande des semaines (#fh) ne montre que les semaines (S47, S48…) : aucun nombre, aucune icône visible.
// Un bouton (.mt-b ou [data-bascule-mouvements]) affiche les + et − (et les icônes) ; après lui, la bande montre des nombres signés.
// Passe 8 (CRITIQUE7 n° 2, 1280 × 800 : « on lit donc de fausses semaines ») : chaque semaine de la bande (S47…) a son centre dans la colonne
// de la frise de la même semaine (#fb .col[data-col], 2 px près). --large joue 1280 × 800 en largeur. Une page à deux cadres (pub/calendrier.html)
// se lit dans la vue visible (celle au centre de l'écran).
// node scripts/agents/controle-bande-semaine.mjs <page.html> [--paysage | --large] [...]  → BANDE OK | BANDE ECHEC
import { createRequire } from 'module'; import path from 'path'; import { pathToFileURL } from 'url';
const req = createRequire('C:/Users/mrspa/Documents/Brasserie/.claude/worktrees/optimistic-ptolemy-2d1278/package.json');
const pp = req('puppeteer-core');
const args = process.argv.slice(2); const large = args.includes('--large'), pays = args.includes('--paysage') || large; const fichiers = args.filter((a) => !a.startsWith('--'));
if (!fichiers.length) { console.log('usage : <page.html> [--paysage]'); process.exit(2); }
const nav = await pp.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new' });
let ko = 0;
for (const f of fichiers) {
  const p = await nav.newPage(); await p.setViewport(large ? { width: 1280, height: 800, isLandscape: true } : pays ? { width: 844, height: 390, isMobile: true, hasTouch: true, isLandscape: true } : { width: 390, height: 844, isMobile: true, hasTouch: true });
  await p.goto(pathToFileURL(path.resolve(f)).href, { waitUntil: 'load' }); await new Promise((r) => setTimeout(r, 400));
  const src = await p.evaluate(() => { const e = document.elementFromPoint(innerWidth / 2, innerHeight / 2); return e && e.tagName === 'IFRAME' ? e.src : null; });
  const fr = src ? p.frames().find((x) => x.url() === src) : p.mainFrame();
  const aligne = await fr.evaluate(() => { const fh = document.querySelector('#fh'); if (!fh) return { n: 0, fautes: ['pas de bande'] }; const fautes = []; let n = 0;
    for (const e of fh.querySelectorAll('*')) { if (e.children.length || !/^S\d+$/.test(e.textContent.trim())) continue; const r = e.getBoundingClientRect(); if (!r.width) continue;
      const w = +e.textContent.trim().slice(1), c = document.querySelector('#fb .col[data-col="' + w + '"]'); if (!c) continue; n++; const q = c.getBoundingClientRect(), x = (r.left + r.right) / 2;
      if (x < q.left - 2 || x > q.right + 2) fautes.push('S' + w + ' à x ' + Math.round(x) + ', colonne ' + Math.round(q.left) + '–' + Math.round(q.right)); }
    return { n, fautes, W: innerWidth }; });
  const lire = () => fr.evaluate(() => { const fh = document.querySelector('#fh, [data-bande-semaines]'); if (!fh) return null;
    const icones = [...fh.querySelectorAll('svg')].filter((s) => s.getBoundingClientRect().width > 0 && getComputedStyle(s).visibility !== 'hidden').length;
    return { txt: fh.innerText.replace(/\s+/g, ' ').trim(), icones }; });
  const a = await lire();
  const btn = await fr.$('.mt-b, [data-bascule-mouvements]');
  let b = null; if (btn) { await btn.click().catch(() => {}); await new Promise((r) => setTimeout(r, 250)); b = await lire(); }
  const reposOk = a && /^(S\d{1,2})( S\d{1,2})*$/.test(a.txt) && a.icones === 0;
  const boutonOk = !!btn && b && /[+−-]\d/.test(b.txt);
  const alignOk = aligne.n > 0 && !aligne.fautes.length;
  const bon = reposOk && boutonOk && alignOk; if (!bon) ko++;
  console.log(`${bon ? 'ok' : 'KO'} ${path.basename(f)} : repos « ${a ? a.txt.slice(0, 70) : 'pas de bande'} » (${a ? a.icones : 0} icône(s))${reposOk ? '' : ' ← la semaine seule au repos'} ; bouton ${btn ? 'présent' : 'absent'}${boutonOk ? ', ± montre les mouvements' : ' ← un bouton doit afficher les + et −'} ; ${aligne.n} semaine(s) sur leur colonne (vue de ${aligne.W} px)${alignOk ? '' : ' ← décalées : ' + aligne.fautes.slice(0, 4).join(', ')}`);
  await p.close();
}
await nav.close(); console.log(ko ? 'BANDE ECHEC' : 'BANDE OK'); process.exit(ko ? 1 : 0);
