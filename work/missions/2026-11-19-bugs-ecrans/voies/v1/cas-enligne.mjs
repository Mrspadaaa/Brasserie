// T3B-10, preuve 5 du tour 2 : le cas du constat. Banc `finance-demo=reel`, plan « ZZ TEST — achat » de 9 CHF au 25.12, solde final amené vers −703,68
// par une sortie d'ajustement « ZZ TEST — ajustement » (données du banc local, jamais Firestore). Écran Prévisions ENTIER, 90 jours, 390 clair et cave,
// et 12 mois (point 27). Mesure : recouvrement bulle × tout texte du graphique, en px² et en distance minimale.
// Usage : node scripts/with_server.mjs --server "npm run dev" --port 3114 --env PORT=3114 -- node <ce fichier> 3114
import { ouvrir, calme } from '../../../../../.claude/skills/webapp-testing/examples/_lanceur.mjs';
import fs from 'node:fs';
const PORT = process.argv[2] ?? '3114';
const OUT = new URL('./captures/', import.meta.url).pathname.replace(/^\/(\w:)/, '$1');
fs.mkdirSync(OUT, { recursive: true });
const clic = (page, t, sel) => page.evaluate((t, sel) => { const e = [...document.querySelectorAll(sel)].filter(e => e.offsetParent && e.textContent.trim().replace(/\s+/g, ' ').startsWith(t)); if (!e.length) return false; e[0].click(); return true; }, t, sel);
const mesure = () => {
  const svg = document.querySelector('svg.prv-svg'); if (!svg) return { svg: false };
  const box = (e) => { const r = e.getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height }; };
  const aire = (a, b) => Math.max(0, Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x)) * Math.max(0, Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y));
  const ecart = (a, b) => Math.max(0, Math.max(a.x - (b.x + b.w), b.x - (a.x + a.w))) + Math.max(0, Math.max(a.y - (b.y + b.h), b.y - (a.y + a.h)));
  const chips = [...svg.querySelectorAll('.prv-etq')].map(g => ({ texte: g.querySelector('.prv-tx')?.textContent ?? '', r: box(g.querySelector('.prv-chip')) }));
  const textes = [...svg.querySelectorAll('.prv-fin, .prv-solde, .prv-ax, .prv-et, .prv-nom-ghost, .prv-mois')].map(t => ({ classe: t.getAttribute('class'), texte: t.textContent, r: box(t) }));
  const conflits = [], proches = [];
  for (const c of chips) for (const t of textes) { const a = aire(c.r, t.r); if (a > 0) conflits.push(`${c.texte} × ${t.classe} « ${t.texte} » (${Math.round(a)} px²)`); if (t.classe.includes('prv-fin') || t.classe.includes('prv-solde')) proches.push(`${c.texte} / « ${t.texte} » : ${Math.round(ecart(c.r, t.r))} px`); }
  const mois = textes.filter(t => t.classe.includes('prv-mois')).map(t => t.r).sort((p, q) => p.x - q.x);
  const moisTouchent = mois.slice(1).filter((m, i) => m.x - (mois[i].x + mois[i].w) < 3).length;
  return { svg: true, bulles: chips.map(c => c.texte), fin: svg.querySelector('.prv-fin')?.textContent, conflits, proches, moisNommes: mois.length, moisQuiSeTouchent: moisTouchent };
};
for (const theme of ['clair', 'cave']) {
  const { browser, page, journal } = await ouvrir({ largeur: 390, hauteur: 844, mobile: true, echelle: 1 });
  await page.goto(`http://localhost:${PORT}/?dev-local&finance-demo=reel`); await calme(page, 1500);
  await page.evaluate((t) => localStorage.setItem('laffinee.theme', t), theme); await page.reload(); await calme(page, 1500);
  await page.evaluate(() => [...document.querySelectorAll('nav button, nav a, [role=tab]')].find(e => /^Finances$/.test(e.textContent.trim()))?.click()); await calme(page, 1200);
  await clic(page, 'Prévisions', '[role=tab],button'); await calme(page, 900);
  await clic(page, '90 jours', 'button,[role=tab],[role=radio]'); await calme(page, 800);
  const poser = (id, titre, date, cents) => page.evaluate(async (id, titre, date, cents) => {
    const { FirestoreRepo } = await import('/src/services/firestoreRepo.ts');
    FirestoreRepo.put('financialPlans', id, { id, title: titre, date, amountCents: cents, direction: 'out', category: 'materiel', source: 'manual', status: 'active', createdAt: new Date().toISOString() });
  }, id, titre, date, cents);
  await poser('ZZ-ACHAT', 'ZZ TEST — achat', '2026-12-25', 900); await calme(page, 900);
  let m = await page.evaluate(mesure);
  const nombre = (t) => Number(String(t ?? '').replace(/[^\d,−-]/g, '').replace('−', '-').replace(',', '.'));
  const courant = nombre(m.fin);
  // amener le solde final vers −703,68 : une sortie d'ajustement le 02.12
  const cible = -703.68, delta = Math.round((courant - cible) * 100);
  if (delta > 0) { await poser('ZZ-AJUST', 'ZZ TEST — ajustement', '2026-12-02', delta); await calme(page, 900); }
  await clic(page, '90 jours', 'button,[role=tab],[role=radio]'); await calme(page, 800);
  m = await page.evaluate(mesure);
  console.log(`390 ${theme} 90 jours (solde avant ajustement ${courant}) :`, JSON.stringify(m));
  await page.screenshot({ path: `${OUT}previsions-cas-enligne-390-${theme}.png`, fullPage: true });
  await clic(page, '12 mois', 'button,[role=tab],[role=radio]'); await calme(page, 900);
  const m12 = await page.evaluate(mesure);
  console.log(`390 ${theme} 12 mois :`, JSON.stringify(m12));
  const el = await page.$('svg.prv-svg'); if (el) await el.screenshot({ path: `${OUT}previsions-390-${theme}-12mois-k2.png` });
  console.log(`erreurs ${theme}:`, journal.erreurs.slice(0, 2).join(' | '));
  await browser.close();
}
