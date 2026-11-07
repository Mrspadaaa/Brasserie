// B2 n° 16 : ligne « Hallertauer Blanc CH » : la sous-rangée « stock : Hallertauer Blanc DE [Hallertauer Blanc CH] [⇄] » passait sur trois lignes, le ⇄ seul en bas.
// Attendu, 390 clair et cave : chaque barre sous une rangée (`data-dp-barre`) tient sur deux lignes au plus (≤ 2 positions verticales distinctes de ses éléments) et le bouton ⇄ n'est
// jamais seul sur sa ligne quand il y a plus d'une ligne ; à 1280 : une seule ligne. Aucun texte rogné par « … » sur le nom de l'article gardé.
// Usage : node controle-b2-16-stock-bis.mjs [<build>] [<dossier captures>]   → STOCKBIS OK | STOCKBIS ECHEC <raisons>
import { demarrer, ouvrirLigne, dormir } from './aide-b2.mjs';
const { ouvrir, raisons, cap, verdict } = await demarrer();
const infos = [];
const lire = p => p.evaluate(() => [...document.querySelectorAll('[data-dp-ligne] [data-dp-barre]')].filter(b => b.offsetParent).map(b => {
  const els = [...b.querySelectorAll('[data-dp-stock-bis], button')]; const centre = e => { const r = e.getBoundingClientRect(); return (r.top + r.bottom) / 2; };
  // Une ligne = un groupe d'éléments dont les centres verticaux sont à moins de 12 px.
  const tops = []; for (const c of els.map(centre).sort((x, y) => x - y)) if (!tops.length || c - tops[tops.length - 1] > 12) tops.push(c);
  const autre = els.find(e => e.getAttribute('aria-label') === 'Choisir un autre article');
  const seul = autre ? els.filter(e => Math.abs(centre(e) - centre(autre)) <= 12).length === 1 : false;
  return { nom: b.closest('[data-dp-ligne]').querySelector('[data-dp-nom]')?.textContent.slice(0, 24), lignes: tops.length, hauteur: Math.round(b.getBoundingClientRect().height), seul: seul && tops.length > 1, texte: b.innerText.replace(/\s+/g, ' ').slice(0, 70) };
}));
for (const [mode, theme] of [['t390', 'clair'], ['t390', 'cave'], ['pc1280', 'clair']]) {
  const p = await ouvrir('3', mode, theme);
  await p.evaluate(() => document.querySelectorAll('details').forEach(d => { d.open = false; })); await dormir(200);
  const barres = await lire(p);
  infos.push({ mode, theme, barres: barres.map(b => `${b.nom}: ${b.lignes} ligne(s) ${b.hauteur}px`) });
  for (const b of barres) {
    const max = mode === 'pc1280' ? 1 : 2;
    if (b.lignes > max) raisons.push(`${mode} ${theme} « ${b.nom} » : la barre sur ${b.lignes} lignes (${b.hauteur} px) : « ${b.texte} »`);
    if (b.seul) raisons.push(`${mode} ${theme} « ${b.nom} » : le ⇄ est seul sur sa ligne`);
  }
  await p.evaluate(() => [...document.querySelectorAll('[data-dp-ligne]')].find(a => a.querySelector('summary')?.innerText.includes('Hallertauer'))?.scrollIntoView({ block: 'center' })); await dormir(300);
  await cap(p, `16-stock-${mode}-${theme}`);
  await p.close();
}
await verdict('STOCKBIS', infos);
