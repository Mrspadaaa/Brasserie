// D89 (19.10, soir) : la légende derrière un bouton discret. Les mots du brasseur, sur l8b : « Tu peux
// même mettre un peu plus d'icone et autre, mais il faut un bouton légende un peu caché pour pas que ça
// gêne ». Révision de « pas de légende écrite » (ligne « Légende bis » de DEFAUTS-RECURRENTS).
// Règle :
//   - un bouton [data-role="legende-bouton"], aria-expanded="false" au repos, discret : 32 × 32 px au
//     plus, un signe au plus (« ? » ou un picto), sans fond plein coloré ;
//   - une légende [data-role="legende"] invisible au repos ; le bouton touché l'ouvre (visible,
//     aria-expanded="true") et elle explique quelque chose (8 mots au moins) ; Échap la referme.
// Témoin intégré : --temoin ouvre la légende avant de mesurer (doit échouer).
// Usage : node controle-legende.mjs <dossier> [ids…] [--page=etat-b.html] [--temoin] ; imprime
// LEGENDE OK, ou LEGENDE ECHEC et la liste.
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import puppeteer from 'puppeteer-core';

const args = process.argv.slice(2);
const dir = path.resolve(args.find((a) => !a.startsWith('--')) || '.');
const only = args.filter((a) => !a.startsWith('--')).slice(1);
const pg = (args.find((a) => a.startsWith('--page=')) || '--page=etat-b.html').slice(7);
const temoin = args.includes('--temoin');
const ids = (only.length ? only : fs.readdirSync(dir).filter((d) => fs.existsSync(path.join(dir, d, pg)))).sort();
const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
const problems = [];
const etat = () => {
  const vis = (e) => { if (!e) return false; const b = e.getBoundingClientRect(); const cs = getComputedStyle(e); return !e.closest('[hidden]') && b.width > 0 && b.height > 0 && cs.visibility !== 'hidden' && cs.display !== 'none' && Number(cs.opacity) > 0.05; };
  const b = document.querySelector('[data-role="legende-bouton"]');
  const l = document.querySelector('[data-role="legende"]');
  const r = b && b.getBoundingClientRect();
  const cs = b && getComputedStyle(b);
  const m = cs && /rgba?\(([^)]+)\)/.exec(cs.backgroundColor);
  const p = m ? m[1].split(',').map(Number) : [255, 255, 255, 0];
  const fondPlein = p.length > 3 && p[3] === 0 ? false : Math.max(p[0], p[1], p[2]) - Math.min(p[0], p[1], p[2]) > 40;
  return {
    bouton: !!b, boutonVu: vis(b), w: r ? Math.round(r.width) : 0, h: r ? Math.round(r.height) : 0,
    signes: b ? b.textContent.replace(/\s+/g, '').length : 0, fondPlein, expanded: b ? b.getAttribute('aria-expanded') : null,
    legende: !!l, legendeVue: vis(l), mots: l ? (l.innerText || '').split(/\s+/).filter((w) => /\p{L}/u.test(w)).length : 0,
  };
};
for (const id of ids) {
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
  await page.goto(pathToFileURL(path.join(dir, id, pg)).href, { waitUntil: 'networkidle0', timeout: 30000 });
  await new Promise((r) => setTimeout(r, 300));
  if (temoin) await page.evaluate(() => { const l = document.querySelector('[data-role="legende"]'); if (l) { l.hidden = false; l.removeAttribute('hidden'); } });
  const a = await page.evaluate(etat);
  const f = [];
  if (!a.bouton) f.push('pas de bouton [data-role="legende-bouton"]');
  else {
    if (!a.boutonVu) f.push('bouton de légende invisible');
    if (a.w > 32 || a.h > 32) f.push('bouton de ' + a.w + ' × ' + a.h + ' px, pas discret (32 au plus)');
    if (a.signes > 1) f.push('bouton écrit (' + a.signes + ' signes)');
    if (a.fondPlein) f.push('bouton sur un fond coloré plein');
    if (a.expanded !== 'false') f.push('aria-expanded au repos : ' + a.expanded);
  }
  if (!a.legende) f.push('pas de [data-role="legende"]');
  else if (a.legendeVue) f.push('légende visible au repos');
  if (a.bouton && a.boutonVu && a.legende && !a.legendeVue) {
    await page.click('[data-role="legende-bouton"]');
    await new Promise((r) => setTimeout(r, 400));
    const o = await page.evaluate(etat);
    if (!o.legendeVue) f.push('le bouton n\'ouvre pas la légende');
    if (o.expanded !== 'true') f.push('aria-expanded ouvert : ' + o.expanded);
    if (o.legendeVue && o.mots < 8) f.push('légende de ' + o.mots + ' mots');
    await page.keyboard.press('Escape');
    await new Promise((r) => setTimeout(r, 400));
    const e = await page.evaluate(etat);
    if (e.legendeVue) f.push('Échap ne referme pas la légende');
    console.log(id + ' · bouton ' + a.w + ' × ' + a.h + ' px · légende ' + o.mots + ' mots');
  } else console.log(id + ' · ' + f.length + ' faute(s)');
  await page.close();
  for (const x of f) problems.push(id + ' ' + pg + ' : ' + x);
}
await browser.close();
if (problems.length) { console.log('LEGENDE ECHEC ' + problems.length + ' problème(s)'); for (const x of problems) console.log('  ' + x); process.exit(1); }
console.log('LEGENDE OK');
