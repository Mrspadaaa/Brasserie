// T3B-10 : mesure, dans un vrai Chrome, les recouvrements entre les bulles (.prv-chip) et les textes du graphique Prévisions
// (solde final .prv-fin, soldes de marche .prv-solde, graduations .prv-ax, « aujourd'hui » .prv-et, nom du pointillé .prv-nom-ghost, mois).
// Usage : node scripts/with_server.mjs --server "npm run dev" --port 3110 --env PORT=3110 -- node <ce fichier> 3110 [capturer]
import { ouvrir, calme } from '../../../../../.claude/skills/webapp-testing/examples/_lanceur.mjs';
import fs from 'node:fs';
const PORT = process.argv[2] ?? '3110', CAPT = process.argv[3] === 'capturer';
const OUT = new URL('./captures/', import.meta.url).pathname.replace(/^\/(\w:)/, '$1');
if (CAPT) fs.mkdirSync(OUT, { recursive: true });
const clic = (page, t, sel = '[role=tab],button,a,[role=button]') => page.evaluate((t, sel) => { const e = [...document.querySelectorAll(sel)].filter(e => e.offsetParent && e.textContent.trim().replace(/\s+/g, ' ').startsWith(t)); if (!e.length) return false; e[0].click(); return true; }, t, sel);
const mesure = () => {
  const svg = document.querySelector('svg.prv-svg'); if (!svg) return { svg: false };
  const box = (e) => { const r = e.getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height }; };
  const touche = (a, b) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
  const aire = (a, b) => Math.max(0, Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x)) * Math.max(0, Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y));
  const chips = [...svg.querySelectorAll('.prv-etq')].map(g => ({ texte: g.querySelector('.prv-tx')?.textContent ?? '', r: box(g.querySelector('.prv-chip')) }));
  const textes = [...svg.querySelectorAll('.prv-fin, .prv-solde, .prv-ax, .prv-et, .prv-nom-ghost, .prv-mois')].map(t => ({ classe: t.getAttribute('class'), texte: t.textContent, r: box(t) }));
  const conflits = [];
  for (const c of chips) for (const t of textes) if (touche(c.r, t.r) && aire(c.r, t.r) > 4) conflits.push(`${c.texte} × ${t.classe} « ${t.texte} » (${Math.round(aire(c.r, t.r))} px²)`);
  for (let i = 0; i < chips.length; i++) for (let j = i + 1; j < chips.length; j++) if (aire(chips[i].r, chips[j].r) > 4) conflits.push(`${chips[i].texte} × ${chips[j].texte}`);
  return { svg: true, chips: chips.length, conflits };
};
const rapport = [];
for (const [largeur, mobile, hauteur] of [[390, true, 2300], [1280, false, 1500]]) for (const theme of ['clair', 'cave']) {
  const { browser, page, journal } = await ouvrir({ largeur, hauteur, mobile, echelle: 1 });
  await page.goto(`http://localhost:${PORT}/?dev-local&finance-demo=reel`); await calme(page, 1500);
  await page.evaluate((t) => localStorage.setItem('laffinee.theme', t), theme); await page.reload(); await calme(page, 1500);
  await page.evaluate(() => [...document.querySelectorAll('nav button, nav a, [role=tab]')].find(e => /^Finances$/.test(e.textContent.trim()))?.click()); await calme(page, 1200);
  await clic(page, 'Prévisions', '[role=tab],button'); await calme(page, 900);
  for (const h of ['30 jours', '90 jours', '12 mois']) {
    await clic(page, h, 'button,[role=tab],[role=radio]'); await calme(page, 900);
    const m = await page.evaluate(mesure);
    rapport.push(`${largeur} ${theme} ${h} : ${JSON.stringify(m)}`);
    if (CAPT) { const el = await page.$('svg.prv-svg'); if (el) await el.screenshot({ path: `${OUT}previsions-${largeur}-${theme}-${h.replace(' ', '')}.png` }); }
  }
  rapport.push(`erreurs ${largeur} ${theme}: ${journal.erreurs.slice(0, 2).join(' | ')}`);
  await browser.close();
}
console.log(rapport.join('\n'));
