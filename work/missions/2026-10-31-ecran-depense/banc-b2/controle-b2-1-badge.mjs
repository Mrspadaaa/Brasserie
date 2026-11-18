// B2 n° 1 : à 390, le badge « 7 +5 ↳ » de la bande Malts s'empilait sur trois lignes (56 px dans un en-tête de 28) et recouvrait la rangée suivante.
// Attendu, pour chaque en-tête de bande, états 3, 2 et 8, clair et cave, 390 et 1280 : aucun élément de l'en-tête ne dépasse son cadre (haut/bas) et chaque badge
// de compte tient sur une ligne (hauteur ≤ celle de l'en-tête) ; le badge ne recouvre aucun élément de la première rangée visible de sa bande.
// Usage : node controle-b2-1-badge.mjs [<build>] [<dossier captures>]   → BADGE OK | BADGE ECHEC <raisons>
import { demarrer } from './aide-b2.mjs';
const { ouvrir, raisons, cap, verdict } = await demarrer();
const infos = [];
for (const etat of ['3', '2', '8']) for (const mode of ['t390', 'pc1280']) for (const theme of ['clair', 'cave']) {
  const p = await ouvrir(etat, mode, theme);
  const m = await p.evaluate(() => [...document.querySelectorAll('[data-dp-bande-entete]')].filter(e => e.offsetParent).map(e => {
    const r = e.getBoundingClientRect(), nom = e.querySelector('strong')?.innerText ?? '?';
    const enfants = [...e.querySelectorAll('*')].filter(c => c.getBoundingClientRect().height > 0 && !c.closest('i[aria-hidden]')).map(c => ({ c, r: c.getBoundingClientRect() }));
    const sorti = enfants.filter(({ r: q }) => q.bottom > r.bottom + 1 || q.top < r.top - 1).map(({ c, r: q }) => `${(c.dataset && Object.keys(c.dataset)[0]) || c.tagName}:${Math.round(q.height)}px>${Math.round(r.height)}`);
    const compte = e.querySelector('[data-dp-bande-compte]');
    const hc = compte ? compte.getBoundingClientRect().height : 0;
    // Le badge recouvre-t-il la rangée suivante ? On compare son bas au haut du premier élément de rangée du même bloc.
    const suiv = e.parentElement.querySelector('[data-dp-ligne]:not([hidden]) summary, [data-dp-sg-ligne]');
    const cr = compte?.getBoundingClientRect(), sr = suiv && suiv.offsetParent ? suiv.getBoundingClientRect() : null;
    const recouvre = !!(cr && sr && cr.bottom > sr.top + 1 && cr.top < sr.bottom);
    const tous = e.querySelector('[data-dp-mouture-tous]');
    return { nom, hEntete: Math.round(r.height), hCompte: Math.round(hc), texte: compte?.innerText.replace(/\s+/g, ' '), sorti, recouvre, coupe: tous ? tous.scrollWidth > tous.clientWidth : false };
  }));
  infos.push({ etat, mode, theme, m: m.map(x => `${x.nom} ${x.hCompte}/${x.hEntete}${x.recouvre ? ' RECOUVRE' : ''}${x.sorti.length ? ' SORT ' + x.sorti.join(',') : ''}`) });
  for (const x of m) {
    const ou = `${etat} ${mode} ${theme} « ${x.nom} »`;
    if (x.hCompte > x.hEntete) raisons.push(`${ou} : badge « ${x.texte} » ${x.hCompte} px > en-tête ${x.hEntete} px`);
    if (x.sorti.length) raisons.push(`${ou} : déborde de l'en-tête (${x.sorti.join(', ')})`);
    if (x.recouvre) raisons.push(`${ou} : le badge recouvre la rangée suivante`);
    if (x.coupe) raisons.push(`${ou} : « Rattacher les N » est tronqué (…)`);
  }
  if (etat === '3') await cap(p, `1-badge-${etat}-${mode}-${theme}`);
  await p.close();
}
await verdict('BADGE', infos.filter((_, i) => i < 1));
