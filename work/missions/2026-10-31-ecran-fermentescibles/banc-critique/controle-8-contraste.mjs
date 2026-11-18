// Critique B1 n° 8 : thème sombre, ligne choisie : « empâtage ⇄ » gris sur le voile de la teinte du malt, contraste faible.
// Attendu : le texte du moment, de la part et de « kg » de la ligne (choisie ou non), dans les deux thèmes, a un contraste d'au moins 4,5 contre son fond réel
// (les fonds translucides composés sur les parents), pour chaque teinte de malt de la scène « couleurs » et de la scène « huit ».
// Usage : node controle-8-contraste.mjs <build> [<capture.png>]   → CONTRASTE OK | CONTRASTE ECHEC <raisons>
import { ouvrir, toucher, verdict, capturer, dormir } from './banc.mjs';
const [construit, capture] = process.argv.slice(2);
const raisons = [];
const mesures = {};
const MESURE = () => {
  const num = (s) => (s.match(/-?\d*\.?\d+/g) ?? []).map(Number);
  const lire = (s) => { const n = num(s); return { r: n[0], g: n[1], b: n[2], a: n.length > 3 ? n[3] : 1 }; };
  const sur = (f, b) => ({ r: f.r * f.a + b.r * (1 - f.a), g: f.g * f.a + b.g * (1 - f.a), b: f.b * f.a + b.b * (1 - f.a), a: 1 });
  const fond = (e) => {
    const pile = [];
    for (let n = e; n; n = n.parentElement) { const c = getComputedStyle(n).backgroundColor; if (c && !/rgba?\(0, 0, 0, 0\)|transparent/.test(c)) { pile.push(lire(c)); if (pile[pile.length - 1].a >= 1) break; } }
    let b = pile.length && pile[pile.length - 1].a >= 1 ? pile.pop() : { r: 255, g: 255, b: 255, a: 1 };
    while (pile.length) b = sur(pile.pop(), b);
    return b;
  };
  const lum = (c) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }; return 0.2126 * f(c.r) + 0.7152 * f(c.g) + 0.0722 * f(c.b); };
  const rapport = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
  const sortie = [];
  document.querySelectorAll('.fer-li').forEach((li, i) => {
    const sel = li.getAttribute('aria-current') === 'true';
    for (const [nom, q] of [['moment', '.fer-mo'], ['part', '.fer-pc'], ['kg', '.fer-kg small'], ['nom', '.fer-nom b']]) {
      const e = li.querySelector(q);
      if (!e) continue;
      const f = fond(e), t = lire(getComputedStyle(e).color), tc = sur(t, f);
      sortie.push({ ligne: i, nom: li.querySelector('.fer-nom b')?.textContent, sel, quoi: nom, ratio: Math.round(rapport(tc, f) * 100) / 100 });
    }
  });
  return sortie;
};
for (const theme of ['cave', 'clair']) {
  for (const etat of ['couleurs', 'huit']) {
    const { nav, p } = await ouvrir(construit, { etat, theme });
    const n = await p.$$eval('[data-sel]', (e) => e.length);
    for (const i of [...new Set([0, Math.min(3, n - 1), n - 1])]) {
      await toucher(p, `[data-sel="${i}"] [data-role="nom"]`);
      const m = await p.evaluate(MESURE);
      for (const x of m.filter((y) => y.sel || y.ligne === i)) {
        const cle = `${theme}/${etat}/${x.nom}/${x.quoi}${x.sel ? '*' : ''}`;
        mesures[cle] = Math.min(mesures[cle] ?? 99, x.ratio);
        if (x.ratio < 4.5) raisons.push(`${cle}${x.sel ? ' (choisie)' : ''} : contraste ${x.ratio}`);
      }
      if (capture && theme === 'cave' && etat === 'couleurs' && i === 0) { await dormir(150); await capturer(p, capture); }
    }
    await nav.close();
  }
}
const uniques = [...new Set(raisons)];
console.log(JSON.stringify(Object.fromEntries(Object.entries(mesures).filter(([c]) => /moment/.test(c)))));
console.log(uniques.length ? `CONTRASTE ECHEC ${uniques.slice(0, 12).join(' ; ')}${uniques.length > 12 ? ` ; … (${uniques.length})` : ''}` : 'CONTRASTE OK');
