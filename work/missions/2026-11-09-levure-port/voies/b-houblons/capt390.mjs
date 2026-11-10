// BR-43, BR-45, BR-46 au 390 tactile : « Décider » ouvert, saisies absurdes, défilement latéral, thème cave. Voie b-houblons (09.11).
import { ouvrir, calme } from '../../../../../.claude/skills/webapp-testing/examples/_lanceur.mjs';
import fs from 'node:fs';
const port = process.env.PORT ?? '5654', tag = process.argv[2] ?? 'x';
const out = new URL('./capt/', import.meta.url).pathname.replace(/^\/(\w):/, '$1:');
const rapport = {};
for (const theme of ['clair', 'cave']) {
  const { browser, page } = await ouvrir({ largeur: 390, hauteur: 844, mobile: true });
  await page.evaluateOnNewDocument((t) => localStorage.setItem('laffinee.theme', t), theme);
  try {
    await page.goto(`http://localhost:${port}/?dev-local&etape=houblons`, { waitUntil: 'networkidle0' }); await calme(page, 1500);
    const clic = (t) => page.evaluate((x) => { const b = [...document.querySelectorAll('button,summary')].find((e) => e.innerText.trim().startsWith(x)); if (b) { b.click(); return true; } return false; }, t);
    await page.evaluate(() => [...document.querySelectorAll('h1')].find((h) => h.innerText.includes('Atelier houblons'))?.scrollIntoView({ block: 'start' })); await calme(page, 300);
    await page.screenshot({ path: `${out}${tag}-390-${theme}-entete.png` });
    rapport[theme] = { decider: await clic('Décider') }; await calme(page, 500);
    for (const el of await page.$$('summary')) {
      if (!(await el.evaluate((n) => n.innerText.trim())).startsWith('Régler dose')) continue;
      await el.tap(); await calme(page, 500); rapport[theme].regler = await el.evaluate((n) => n.parentElement.open); break;
    }
    const saisie = {};
    for (const [label, valeur] of [['Masse du réglage', '99999'], ['Temps d’ébullition restant', '99999'], ['Température du réglage', '-1']]) {
      const h = await page.$(`input[aria-label="${label}"]`); if (!h) { saisie[label] = 'champ absent'; continue; }
      await h.click({ clickCount: 3 }); await h.type(valeur); await calme(page, 200);
      saisie[label] = await page.evaluate((l) => { const i = document.querySelector(`input[aria-label="${l}"]`); return { invalide: i.getAttribute('aria-invalid'), message: i.closest('label')?.querySelector('small')?.innerText ?? null }; }, label);
    }
    rapport[theme].saisie = saisie;
    rapport[theme].largeur = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, iw: innerWidth,
      hors: [...document.querySelectorAll('body *')].filter((e) => { const r = e.getBoundingClientRect(); return r.width > 0 && r.right > innerWidth + 1 && getComputedStyle(e).position !== 'fixed'; }).length,
      defile: [...document.querySelectorAll('*')].filter((e) => e.scrollWidth > e.clientWidth + 2 && ['auto', 'scroll'].includes(getComputedStyle(e).overflowX)).map((e) => e.className.toString().slice(0, 30)).slice(0, 5) }));
    await page.evaluate(() => document.querySelector('input[aria-label="Masse du réglage"]')?.scrollIntoView({ block: 'center' })); await calme(page, 300);
    await page.screenshot({ path: `${out}${tag}-390-${theme}-saisie.png` });
  } catch (e) { rapport[theme] = { ...rapport[theme], echec: String(e) }; } finally { await browser.close(); }
}
fs.writeFileSync(`${out}${tag}-390-rapport.json`, JSON.stringify(rapport, null, 1)); console.log(JSON.stringify(rapport, null, 1));
