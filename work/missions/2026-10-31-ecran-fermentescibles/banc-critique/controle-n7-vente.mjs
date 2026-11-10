// Banc d'actionneurs N7 : « Encaisser une vente », le message jaune « La connexion Google ne peut pas être préparée » a un contraste de 1,32:1 sur fond clair.
// Attendu : texte du message ≥ 4,5:1 contre son fond réel, thèmes clair et cave (les requêtes sortantes sont bloquées par le banc : la préparation échoue, le message s'affiche).
// Usage : node controle-n7-vente.mjs <build> [<capture.png>]   → VENTE OK | VENTE ECHEC <raisons>
import { ouvrir, dormir, capturer } from './banc.mjs';
const [construit, capture] = process.argv.slice(2);
const raisons = [];
const mesures = {};
for (const theme of ['clair', 'cave']) {
  const { nav, p } = await ouvrir(construit, { url: '/?dev-local', theme });
  await dormir(2500);
  await (await p.$('[aria-label^="Actions rapides"]')).tap(); await dormir(600);
  const h = await p.evaluateHandle(() => [...document.querySelectorAll('[role=menuitem]')].find((b) => /Encaisser une vente/.test(b.textContent ?? '')));
  await h.asElement().tap(); await dormir(2500);
  const m = await p.evaluate(() => {
    const e = [...document.querySelectorAll('[role=alert]')].find((x) => /connexion Google/i.test(x.textContent ?? ''));
    if (!e) return null;
    const num = (s) => (s.match(/-?\d*\.?\d+/g) ?? []).map(Number);
    const lire = (s) => { const n = num(s); return { r: n[0], g: n[1], b: n[2], a: n.length > 3 ? n[3] : 1 }; };
    const sur = (f, b) => ({ r: f.r * f.a + b.r * (1 - f.a), g: f.g * f.a + b.g * (1 - f.a), b: f.b * f.a + b.b * (1 - f.a), a: 1 });
    const pile = [];
    for (let n = e; n; n = n.parentElement) { const c = getComputedStyle(n).backgroundColor; if (!/rgba?\(0, 0, 0, 0\)|transparent/.test(c)) { pile.push(lire(c)); if (pile[pile.length - 1].a >= 1) break; } }
    let b = pile.length && pile[pile.length - 1].a >= 1 ? pile.pop() : { r: 255, g: 255, b: 255, a: 1 };
    while (pile.length) b = sur(pile.pop(), b);
    const t = sur(lire(getComputedStyle(e).color), b);
    const lum = (c) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }; return 0.2126 * f(c.r) + 0.7152 * f(c.g) + 0.0722 * f(c.b); };
    const x = lum(t), y = lum(b);
    return Math.round(((Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05)) * 100) / 100;
  });
  mesures[theme] = m;
  if (m === null) raisons.push(`${theme} : le message de connexion n'apparaît pas (rien à mesurer)`);
  else if (m < 4.5) raisons.push(`${theme} : contraste ${m}`);
  if (capture) await capturer(p, capture.replace('.png', `-${theme}.png`));
  await nav.close();
}
console.log(JSON.stringify(mesures));
console.log(raisons.length ? `VENTE ECHEC ${raisons.join(' ; ')}` : 'VENTE OK');
