import { ouvrir, calme } from '../../../../.claude/skills/webapp-testing/examples/_lanceur.mjs';
const PORT = process.argv[2] ?? '3000'; const OUT = new URL('./cap/', import.meta.url).pathname.replace(/^\/(\w:)/, '$1');
const clic = (page, t, sel='[role=tab],button,a,[role=button]') => page.evaluate((t, sel) => { const e=[...document.querySelectorAll(sel)].filter(e=>e.offsetParent && e.textContent.trim().replace(/\s+/g,' ').startsWith(t)); if(!e.length) return false; e[0].click(); return true; }, t, sel);
const r = [];
for (const [largeur, mobile, hauteur] of [[390, true, 2300], [1280, false, 1500]]) for (const theme of ['clair', 'cave']) {
  const { browser, page, journal } = await ouvrir({ largeur, hauteur, mobile, echelle: 1 });
  await page.goto(`http://localhost:${PORT}/?dev-local&finance-demo=reel`); await calme(page, 1500);
  await page.evaluate((t) => localStorage.setItem('laffinee.theme', t), theme); await page.reload(); await calme(page, 1500);
  await page.evaluate(() => [...document.querySelectorAll('nav button, nav a, [role=tab]')].find(e=>/^Finances$/.test(e.textContent.trim()))?.click()); await calme(page, 1200);
  const shot = async (n) => { await calme(page, 900); await page.screenshot({ path: `${OUT}${n}-${largeur}-${theme}.png` }); r.push(n+' '+largeur+' '+theme); };
  for (const [o, n] of [['Synthèse','syn'],['Opérations','ops'],['Prévisions','prev'],['Annuel','ann']]) { await clic(page, o, '[role=tab],button'); await shot(n); }
  if (theme === 'clair') {
    await clic(page, 'Opérations', '[role=tab],button'); await calme(page, 600);
    r.push('… ' + await page.evaluate(() => { const b=[...document.querySelectorAll('button')].find(e=>e.offsetParent&&e.textContent.trim()==='...'||e.textContent.trim()==='…'); if(!b) return 'absent'; b.click(); return b.getAttribute('aria-label')||'ok'; }));
    await shot('ops-plage');
    await page.keyboard.press('Escape'); await clic(page, 'Synthèse', '[role=tab],button'); await calme(page, 600);
    r.push('analyse ' + await page.evaluate(() => { const b=document.querySelector('[data-ligne=analyse]'); if(!b) return 'absent'; b.click(); return 'ok'; }));
    await shot('analyse');
    await page.reload(); await calme(page, 1500);
    await page.evaluate(() => [...document.querySelectorAll('nav button, nav a, [role=tab]')].find(e=>/^Finances$/.test(e.textContent.trim()))?.click()); await calme(page, 800);
    r.push('plus ' + await page.evaluate(() => { const b=[...document.querySelectorAll('button')].filter(e=>e.offsetParent&&/^\+$|Ajouter|Nouvelle/.test((e.getAttribute('aria-label')||e.textContent).trim())).pop(); if(!b) return 'absent'; b.click(); return b.getAttribute('aria-label')||b.textContent; }));
    await shot('plus-menu');
    r.push('menu: ' + await page.evaluate(() => [...document.querySelectorAll('[role=menu] *,[role=dialog] button')].map(e=>e.textContent.trim()).filter(Boolean).slice(0,12).join(' / ')));
  }
  r.push(`erreurs ${largeur} ${theme}: ${journal.erreurs.slice(0,3).join(' | ')}`);
  await browser.close();
}
console.log(r.join('\n'));
