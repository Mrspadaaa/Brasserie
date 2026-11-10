// B1 n° 15 : à 1280 × 800, le pied « Retour / Suivant » sort de l'écran dès que le champ s'ouvre (911 / 800) et à huit lignes (926 / 800).
// Attendu : « Suivant » entièrement dans l'écran (collé en bas) au repos, au champ ouvert et à huit lignes, tout en haut de la page ; et à 390 le pied suit toujours le contenu (inchangé).
// Usage : node controle-n15-pied.mjs <build> [<capture.png>] [clair|cave]   → PIED OK | PIED ECHEC <raisons>
import { ouvrir, toucher, dormir, capturer } from './banc.mjs';
const [construit, capture, theme = 'clair'] = process.argv.slice(2);
const raisons = [];
const infos = {};
const PIED = () => {
  const b = [...document.querySelectorAll('button')].find((x) => /^Suivant/.test(x.textContent ?? ''));
  const m = document.querySelector('[data-floating-actions-gap^="page"]')?.closest('main');
  if (m) m.scrollTo({ top: 0, behavior: 'instant' });
  const r = b?.getBoundingClientRect();
  return r ? { bas: Math.round(r.bottom), haut: Math.round(r.top), h: innerHeight } : null;
};
for (const [scene, etat, avant] of [['repos', 'maquette', null], ['ouverture', 'huit', async (p) => { await toucher(p, '[data-role="ajout"]'); }], ['huit', 'huit', null]]) {
  const { nav, p } = await ouvrir(construit, { etat, theme, largeur: 1280 });
  await dormir(2000);
  if (avant) { await avant(p); await dormir(500); }
  const m = await p.evaluate(PIED);
  await dormir(300);
  infos[scene] = m;
  if (!m) raisons.push(`${scene} : pas de bouton Suivant`);
  else if (m.bas > m.h + 0.5) raisons.push(`${scene} : « Suivant » à ${m.bas} px sur ${m.h}`);
  if (capture && scene === 'huit') await capturer(p, capture);
  await nav.close();
}
{
  // 390 : inchangé, le pied suit le contenu (sort de l'écran à huit lignes, atteint en défilant)
  const { nav, p } = await ouvrir(construit, { etat: 'huit', theme });
  await dormir(2000);
  const m = await p.evaluate(() => { const b = [...document.querySelectorAll('button')].find((x) => /^Suivant/.test(x.textContent ?? '')); const pos = getComputedStyle(b.closest('[data-page-end-actions]')).position; return { pos }; });
  infos.t390 = m;
  if (m.pos === 'sticky') raisons.push('390 : le pied est devenu collant (il devait suivre le contenu)');
  await nav.close();
}
console.log(JSON.stringify(infos));
console.log(raisons.length ? `PIED ECHEC ${raisons.join(' ; ')}` : 'PIED OK');
