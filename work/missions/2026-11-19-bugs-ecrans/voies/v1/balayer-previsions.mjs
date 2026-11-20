// T3B-10 : balayage. Pose, sur la brasserie de démonstration, une dépense prévue « ZZ TEST — passe 4 achat » (9 CHF) à plusieurs dates
// et une grosse sortie qui met le solde final sous zéro, puis mesure dans Chrome (390) tout recouvrement bulle × texte du graphique.
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
  const aire = (a, b) => Math.max(0, Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x)) * Math.max(0, Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y));
  const chips = [...svg.querySelectorAll('.prv-etq')].map(g => ({ texte: g.querySelector('.prv-tx')?.textContent ?? '', r: box(g.querySelector('.prv-chip')) }));
  const textes = [...svg.querySelectorAll('.prv-fin, .prv-solde, .prv-ax, .prv-et, .prv-nom-ghost, .prv-mois')].map(t => ({ classe: t.getAttribute('class'), texte: t.textContent, r: box(t) }));
  const conflits = [];
  for (const c of chips) for (const t of textes) if (aire(c.r, t.r) > 4) conflits.push(`${c.texte} × ${t.classe} « ${t.texte} » (${Math.round(aire(c.r, t.r))} px²)`);
  for (let i = 0; i < chips.length; i++) for (let j = i + 1; j < chips.length; j++) if (aire(chips[i].r, chips[j].r) > 4) conflits.push(`${chips[i].texte} × ${chips[j].texte}`);
  return { svg: true, chips: chips.map(c => c.texte), fin: svg.querySelector('.prv-fin')?.textContent, reste: [...document.querySelectorAll('.prv-restes')].map(e => e.textContent.trim()), conflits };
};
const rapport = [];
const scenarios = [];
for (const gros of [60000, 130000, 1000000]) for (const jour of ['2026-12-21', '2026-12-25', '2027-01-20']) scenarios.push({ gros, jour });
const { browser, page, journal } = await ouvrir({ largeur: 390, hauteur: 2300, mobile: true, echelle: 1 });
await page.goto(`http://localhost:${PORT}/?dev-local&finance-demo`); await calme(page, 1200);
await page.evaluate(() => [...document.querySelectorAll('nav button, nav a, [role=tab]')].find(e => /^Finances$/.test(e.textContent.trim()))?.click()); await calme(page, 900);
for (const sc of scenarios) {
  await page.evaluate(async (sc) => {
    const { FirestoreRepo } = await import('/src/services/firestoreRepo.ts');
    const at = new Date().toISOString();
    FirestoreRepo.put('financialPlans', 'ZZ-GROS', { id: 'ZZ-GROS', title: 'ZZ TEST — grosse sortie', date: '2026-12-02', amountCents: sc.gros, direction: 'out', category: 'materiel', source: 'manual', status: 'active', createdAt: at });
    FirestoreRepo.put('financialPlans', 'ZZ-NEUF', { id: 'ZZ-NEUF', title: 'ZZ TEST — passe 4 achat', date: sc.jour, amountCents: 900, direction: 'out', category: 'materiel', source: 'manual', status: 'active', createdAt: at });
  }, sc);
  await calme(page, 800);
  await clic(page, 'Prévisions', '[role=tab],button'); await calme(page, 900);
  for (const h of ['90 jours', '12 mois']) {
    await clic(page, h, 'button,[role=tab],[role=radio]'); await calme(page, 700);
    const m = await page.evaluate(mesure);
    console.log(`gros ${sc.gros / 100} · ZZ ${sc.jour} · ${h} : ${JSON.stringify(m)}`);
    if (CAPT && m.conflits?.length) { const el = await page.$('svg.prv-svg'); if (el) await el.screenshot({ path: `${OUT}conflit-${sc.gros}-${sc.jour}-${h.replace(' ', '')}.png` }); }
  }
}
rapport.push(`erreurs: ${journal.erreurs.slice(0, 3).join(' | ')}`);
await browser.close();
console.log(rapport.join('\n'));
