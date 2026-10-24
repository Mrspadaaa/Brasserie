// D79 (19.10, soir) : pas d'étiquette « ma bière » qui ne sert à rien au-dessus des voies. Les mots du
// brasseur, sur p1 du lot 15 : « bien aussi, mais manque assi quelque bouton et le "ma bière" en haut
// sert é rien » (l'en-tête « ma bière » entre les flèches moins et plus, au-dessus des voies).
// Règle, sur la page des voies : aucun élément visible dont le texte est seulement « ma bière »
// (« ma bière ? » compris) entre le bas des réponses ([data-role="reponse"]) et le haut de la
// première voie visible ([data-voie]). Le repère de ma bière dans une piste reste permis.
// Usage : node controle-ma-biere.mjs <dossier> [ids…] [--page=etat-b.html] ; imprime MA-BIERE OK,
// ou MA-BIERE ECHEC et la liste.
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import puppeteer from 'puppeteer-core';

const args = process.argv.slice(2);
const dir = path.resolve(args.find((a) => !a.startsWith('--')) || '.');
const only = args.filter((a) => !a.startsWith('--')).slice(1);
const pg = (args.find((a) => a.startsWith('--page=')) || '--page=etat-b.html').slice(7);
const ids = (only.length ? only : fs.readdirSync(dir).filter((d) => fs.existsSync(path.join(dir, d, pg)))).sort();
const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
const problems = [];
for (const id of ids) {
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
  await page.goto(pathToFileURL(path.join(dir, id, pg)).href, { waitUntil: 'networkidle0', timeout: 30000 });
  await new Promise((r) => setTimeout(r, 300));
  const r = await page.evaluate(() => {
    const vis = (e) => { const b = e.getBoundingClientRect(); const cs = getComputedStyle(e); return b.width > 0 && b.height > 0 && cs.visibility !== 'hidden' && cs.display !== 'none'; };
    const top = (e) => e.getBoundingClientRect().top + scrollY, bas = (e) => e.getBoundingClientRect().bottom + scrollY;
    const rep = [...document.querySelectorAll('[data-role="reponse"]')].filter(vis);
    const voie = [...document.querySelectorAll('[data-voie]')].filter(vis).sort((a, b) => top(a) - top(b))[0];
    const de = rep.length ? Math.max(...rep.map(bas)) : 0, a = voie ? top(voie) : Infinity;
    const seul = (e) => /^ma bière\s*\??$/i.test((e.textContent || '').trim()) && ![...e.children].some((c) => /^ma bière/i.test((c.textContent || '').trim()));
    return [...document.querySelectorAll('body *')].filter((e) => vis(e) && seul(e) && top(e) >= de - 2 && bas(e) <= a + 2)
      .map((e) => ({ tag: e.tagName.toLowerCase(), cls: e.getAttribute('class') || '', y: Math.round(top(e)) }));
  });
  await page.close();
  if (r.length) problems.push(id + ' ' + pg + ' : étiquette « ma bière » au-dessus des voies (' + r.map((x) => x.tag + (x.cls ? '.' + x.cls : '') + ' à ' + x.y + ' px').join(', ') + ')');
  console.log(id + ' · ' + r.length + ' étiquette(s)');
}
await browser.close();
if (problems.length) { console.log('MA-BIERE ECHEC ' + problems.length + ' problème(s)'); for (const x of problems) console.log('  ' + x); process.exit(1); }
console.log('MA-BIERE OK');
