// B1 n° 10 : un écran, trois noms. Sa maquette : « Fermentescibles 2/7 » en titre, « Malts/sucres » dans le fil, à 390 comme à 1280.
// Attendu aux deux largeurs : le titre visible est « Fermentescibles 2/7 » (pas « Nouvelle recette ») et le fil écrit « Malts/sucres » (pas « Fermentescibles »).
// Usage : node controle-n10-nom.mjs <build> [<capture.png>] [clair|cave]   → NOM OK | NOM ECHEC <raisons>
import { ouvrir, dormir, capturer } from './banc.mjs';
const [construit, capture, theme = 'clair'] = process.argv.slice(2);
const raisons = [];
const infos = {};
for (const largeur of [390, 1280]) {
  const { nav, p } = await ouvrir(construit, { etat: 'maquette', theme, largeur });
  await dormir(1000);
  const m = await p.evaluate(() => {
    const visible = (e) => { const b = e.getBoundingClientRect(); return b.width > 0 && b.height > 0 && getComputedStyle(e).visibility !== 'hidden'; };
    const titres = [...document.querySelectorAll('h1, .recipe-titlebar p')].filter(visible).map((e) => e.textContent.replace(/\s+/g, ' ').trim());
    const fil = [...document.querySelectorAll('nav[aria-label="Étapes"] button')].filter(visible).map((b) => (b.querySelector('span')?.textContent ?? '').trim());
    return { titres, fil };
  });
  infos[largeur] = m;
  if (!m.titres.some((t) => t.replace(/\s+/g, '').startsWith('Fermentescibles2/7'))) raisons.push(`${largeur} : titre « ${m.titres.join(' | ')} » au lieu de « Fermentescibles 2/7 »`);
  if (!m.fil.includes('Malts/sucres')) raisons.push(`${largeur} : le fil dit « ${m.fil.join(' | ')} » (pas « Malts/sucres »)`);
  if (capture) await capturer(p, capture.replace('.png', `-${largeur}.png`));
  await nav.close();
}
console.log(JSON.stringify(infos));
console.log(raisons.length ? `NOM ECHEC ${raisons.join(' ; ')}` : 'NOM OK');
