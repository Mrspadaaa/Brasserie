// Captures de l'étape Houblons (banc ?dev-local&etape=houblons, drapeau v4 éteint : bilan + atelier V5.5), 390 tactile et 1280,
// deux thèmes. Usage : PORT=5654 node capt.mjs <tag> [grammes]. Voie b-houblons (09.11).
import { ouvrir, calme } from '../../../../../.claude/skills/webapp-testing/examples/_lanceur.mjs';
import fs from 'node:fs';
const port = process.env.PORT ?? '5654', tag = process.argv[2] ?? 'x', grammes = process.argv[3];
const out = new URL('./capt/', import.meta.url).pathname.replace(/^\/(\w):/, '$1:');
const rapport = {};
const debordements = (page) => page.evaluate(() => {
  const iw = innerWidth; const pires = [];
  for (const el of document.querySelectorAll('body *')) {
    const r = el.getBoundingClientRect();
    if (r.width > 0 && r.right > iw + 1 && getComputedStyle(el).position !== 'fixed') pires.push(`${el.tagName.toLowerCase()}.${String(el.className).slice(0, 40)} droite=${Math.round(r.right)} « ${(el.innerText ?? '').slice(0, 30).replace(/\n/g, ' ')} »`);
  }
  const defile = [...document.querySelectorAll('*')].filter((e) => e.scrollWidth > e.clientWidth + 2 && ['auto', 'scroll'].includes(getComputedStyle(e).overflowX)).length;
  return { sw: document.documentElement.scrollWidth, iw, hors: pires.slice(0, 8), nbHors: pires.length, defilantes: defile };
});
const vers = (page, texte) => page.evaluate((t) => {
  const el = [...document.querySelectorAll('h1,h2,h3,h4,button,summary,legend')].find((e) => e.innerText.trim().startsWith(t));
  if (el) el.scrollIntoView({ block: 'start' }); return !!el;
}, texte);
const clic = async (page, texte) => {
  const ok = await page.evaluate((t) => { const b = [...document.querySelectorAll('button')].find((x) => x.innerText.trim().startsWith(t) && !x.disabled);
    if (b) { b.click(); return true; } return false; }, texte);
  await calme(page, 500); return ok;
};
for (const [largeur, mobile] of [[390, true], [1280, false]]) for (const theme of ['clair', 'cave']) {
  const k = `${largeur}-${theme}`; rapport[k] = {};
  const { browser, page, journal } = await ouvrir({ largeur, hauteur: largeur === 390 ? 844 : 900, mobile });
  await page.evaluateOnNewDocument((t) => localStorage.setItem('laffinee.theme', t), theme);
  try {
    await page.goto(`http://localhost:${port}/?dev-local&etape=houblons`, { waitUntil: 'networkidle0' });
    await calme(page, 1500);
    if (grammes) {
      const ok = await page.evaluate((g) => { const i = [...document.querySelectorAll('input')].find((x) => x.value === '46'); if (!i) return false;
        const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set; set.call(i, g); i.dispatchEvent(new Event('input', { bubbles: true })); i.dispatchEvent(new Event('change', { bubbles: true })); i.blur(); return true; }, grammes);
      rapport[k].grammes = ok; await calme(page, 600);
    }
    await vers(page, 'Amertume'); await calme(page, 300);
    await page.screenshot({ path: `${out}${tag}-${k}-bilan.png` });
    rapport[k].bilan = await page.evaluate(() => document.querySelector('.hop-recipe-snapshot')?.innerText.replace(/\n+/g, ' | '));
    const chipVu = await page.evaluate(() => { const b = document.querySelector('.hop-stage-tabs [aria-checked=true]'); if (!b) return null; const s = getComputedStyle(b); return { c: s.color, f: s.backgroundColor }; });
    rapport[k].segment = chipVu;
    await vers(page, 'Houblons V5.5'); await calme(page, 300);
    await page.screenshot({ path: `${out}${tag}-${k}-atelier.png` });
    rapport[k].atelier = await debordements(page);
    for (const onglet of ['Décider', 'Explorer', 'Historique']) {
      rapport[k][onglet] = { clic: await clic(page, onglet) };
      await vers(page, 'Houblons V5.5'); await calme(page, 300);
      await page.screenshot({ path: `${out}${tag}-${k}-${onglet}.png` });
      Object.assign(rapport[k][onglet], await debordements(page));
    }
    // BR-43 / BR-46 : saisies absurdes dans « Décider » (Régler dose, matière et emploi), puis défilement latéral ?
    await clic(page, 'Décider'); await clic(page, 'Régler dose');
    const saisie = {};
    for (const [label, valeur] of [['Masse du réglage', '99999'], ['Temps d’ébullition restant', '99999'], ['Température du réglage', '-1']]) {
      const h = await page.$(`input[aria-label="${label}"]`);
      if (!h) { saisie[label] = 'champ absent'; continue; }
      await h.click({ clickCount: 3 }); await h.type(valeur); await calme(page, 200);
      saisie[label] = await page.evaluate((l) => { const i = document.querySelector(`input[aria-label="${l}"]`); return { invalide: i.getAttribute('aria-invalid'), message: i.closest('label')?.querySelector('small')?.innerText ?? null }; }, label);
    }
    rapport[k].saisie = { saisie, ...(await debordements(page)) };
    await vers(page, 'Houblons'); await page.evaluate(() => document.querySelector('input[aria-label="Masse du réglage"]')?.scrollIntoView({ block: 'center' })); await calme(page, 300);
    await page.screenshot({ path: `${out}${tag}-${k}-saisie.png` });
    await clic(page, 'Ma bière');
    const dossier = await clic(page, 'Créer un dossier local');
    rapport[k].dossier = { clic: dossier, alertes: await page.evaluate(() => [...document.querySelectorAll('[role=alert],[role=status]')].map((e) => e.innerText.trim()).filter(Boolean)) };
    await page.screenshot({ path: `${out}${tag}-${k}-dossier.png` });
    rapport[k].erreurs = journal.erreurs.slice(0, 3);
  } catch (e) { rapport[k].echec = String(e); } finally { await browser.close(); }
}
fs.writeFileSync(`${out}${tag}-rapport.json`, JSON.stringify(rapport, null, 1));
console.log(JSON.stringify(rapport, null, 1).slice(0, 6000));
