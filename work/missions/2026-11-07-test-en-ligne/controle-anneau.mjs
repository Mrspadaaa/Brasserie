// Lot 6, n° 3 : après une navigation (changement d'étape), le conteneur de la page (`main`, tabIndex -1) reçoit le focus par programme et dessine un cadre épais (2 px,
// noir en clair, jaune en cave) autour de tout le contenu. Attendu : aucun anneau sur ce conteneur ; l'anneau d'une commande focalisée au clavier reste.
// Usage : node controle-anneau.mjs <build> [<capture.png>] [clair|cave]   → ANNEAU OK | ANNEAU ECHEC <raisons>
import { ouvrir, dormir, capturer } from '../2026-10-31-ecran-fermentescibles/banc-critique/banc.mjs';
const [construit, capture, theme = 'clair'] = process.argv.slice(2);
const raisons = [];
const { nav, p } = await ouvrir(construit, { theme, url: '/?dev-local&etape=houblons&recette=identite' });
await dormir(3000);
for (const nom of ['Levure', 'Identité']) {
  await p.evaluate((n) => { [...document.querySelectorAll('nav[aria-label="Étapes"] button')].find((b) => b.getAttribute('aria-label') === n)?.click(); }, nom);
  await dormir(1500);
  // Le geste de navigation au clavier : Tab puis Maj+Tab fait naître le mode « focus visible » comme chez le brasseur au clavier.
  await p.keyboard.press('Tab'); await p.keyboard.down('Shift'); await p.keyboard.press('Tab'); await p.keyboard.up('Shift');
  await p.evaluate(() => { const m = document.querySelector('[data-floating-actions-gap^="page"]')?.closest('main'); m?.focus({ preventScroll: true }); });
  await dormir(300);
  const r = await p.evaluate(() => { const m = document.querySelector('[data-floating-actions-gap^="page"]')?.closest('main'); const cs = getComputedStyle(m); return { actif: document.activeElement === m, style: cs.outlineStyle, largeur: cs.outlineWidth, couleur: cs.outlineColor }; });
  if (!r.actif) raisons.push(`${nom} : le conteneur n'a pas le focus (banc cassé)`);
  else if (r.style !== 'none' && parseFloat(r.largeur) > 0 && !/, 0\)$|transparent/.test(r.couleur)) raisons.push(`${nom} : anneau ${r.largeur} ${r.style} ${r.couleur} autour du conteneur`);
  if (capture && nom === 'Levure') await capturer(p, capture);
}
// Une commande focalisée au clavier garde son anneau.
await p.evaluate(() => document.querySelector('nav[aria-label="Étapes"] button')?.focus());
await p.keyboard.press('Tab');
const cmd = await p.evaluate(() => { const a = document.activeElement; const cs = getComputedStyle(a); return { tag: a.tagName, style: cs.outlineStyle, largeur: cs.outlineWidth, ombre: cs.boxShadow !== 'none' }; });
if (cmd.style === 'none' && !cmd.ombre) raisons.push(`l'anneau des commandes a disparu (${cmd.tag})`);
await nav.close();
console.log(raisons.length ? `ANNEAU ECHEC ${raisons.join(' ; ')}` : 'ANNEAU OK');
