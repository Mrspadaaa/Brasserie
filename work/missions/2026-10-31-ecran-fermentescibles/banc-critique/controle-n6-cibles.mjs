// Banc d'actionneurs N6 : la cible « J+ » (`.fer-jin`) mesure 20 × 28 px et est en partie couverte (la boîte du curseur déborde dessus), sous les 24 px de DESIGN.md
// (WCAG 2.5.8) ; la pastille « Annuler » couvre « du grain ».
// Attendu : champs J+ (plateau et ligne) ≥ 24 × 24 px, rien ne les recouvre (ni le curseur) ; sur chaque ligne de « huit », la pastille « Annuler » du moment ne
// couvre aucun texte de la ligne (moment, part, « ferm. ») ni ne mange la barre (≥ 40 px restent).
// Usage : node controle-n6-cibles.mjs <build> [<capture.png>] [clair|cave]   → CIBLES OK | CIBLES ECHEC <raisons>
import { ouvrir, toucher, dormir, capturer } from './banc.mjs';
const [construit, capture, theme = 'clair'] = process.argv.slice(2);
const raisons = [];
const infos = {};
{
  const { nav, p } = await ouvrir(construit, { etat: 'fruit', theme });
  await dormir(1500);
  await toucher(p, '[data-sel="3"] [data-role="nom"]');
  const m = await p.evaluate(() => {
    const r = (e) => { const b = e.getBoundingClientRect(); return { left: b.left, right: b.right, top: b.top, bottom: b.bottom, w: Math.round(b.width * 10) / 10, h: Math.round(b.height * 10) / 10 }; };
    return { jin: r(document.querySelector('.fer-jin')), jl: r(document.querySelector('.fer-jl')), jr: r(document.querySelector('.fer-jr')) };
  });
  infos.fruit = { jin: [m.jin.w, m.jin.h], jl: [m.jl.w, m.jl.h], jr: [Math.round(m.jr.left), Math.round(m.jr.right)], jinDroite: Math.round(m.jin.right) };
  if (m.jin.w < 24 || m.jin.h < 24) raisons.push(`cible J+ du plateau ${m.jin.w} × ${m.jin.h} px (< 24 × 24)`);
  if (m.jl.w < 24 || m.jl.h < 24) raisons.push(`cible J+ de la ligne ${m.jl.w} × ${m.jl.h} px (< 24 × 24)`);
  const recouvre = Math.max(0, m.jin.right - m.jr.left);
  if (recouvre > 0.5) raisons.push(`la boîte du curseur recouvre le champ J+ de ${Math.round(recouvre)} px (sur ${m.jin.w})`);
  // ce qui est sous le centre et sous le bord droit de la cible touchée doit être elle-même
  for (const s of ['.fer-jin', '.fer-jl']) {
    const sous = await p.evaluate((sel) => {
      const e = document.querySelector(sel); const b = e.getBoundingClientRect();
      const mauvais = [];
      for (const [x, y] of [[b.left + b.width / 2, b.top + b.height / 2], [b.right - 2, b.top + b.height / 2]]) { const t = document.elementFromPoint(x, y); if (!(t === e || e.contains(t))) mauvais.push(`${t?.tagName}.${String(t?.className).slice(0, 24)}`); }
      return mauvais;
    }, s);
    if (sous.length) raisons.push(`${s} en partie couverte (sous le doigt : ${sous.join(', ')})`);
  }
  if (capture) { await p.$eval('.fer-jin', (e) => e.scrollIntoView({ block: 'center' })); await dormir(200); await capturer(p, capture.replace('.png', '-fruit.png')); }
  await nav.close();
}
{
  const { nav, p } = await ouvrir(construit, { etat: 'huit', theme });
  await dormir(1500);
  const n = await p.$$eval('[data-sel]', (e) => e.length);
  infos.annuler = [];
  for (let i = 0; i < n; i++) {
    await toucher(p, `[data-role="moment-ligne"][data-ml="${i}"]`);
    await dormir(200);
    const m = await p.evaluate((i) => {
      const li = document.querySelector(`[data-sel="${i}"]`);
      const ann = li?.querySelector('.fer-annm');
      if (!ann) return null;
      const a = ann.getBoundingClientRect();
      const couverts = [];
      li.querySelectorAll('.fer-pc, .fer-mo, .fer-pn, .fer-mf').forEach((e) => {
        const b = e.getBoundingClientRect();
        if (b.width && a.left < b.right - 0.5 && b.left < a.right - 0.5 && a.top < b.bottom - 0.5 && b.top < a.bottom - 0.5) couverts.push(String(e.className).split(' ')[0] + ':' + e.textContent.trim().slice(0, 14));
      });
      const barre = li.querySelector('.fer-bw').getBoundingClientRect();
      // le texte de la part dépasse-t-il de sa boîte (coupé par la pastille) ?
      const pc = li.querySelector('.fer-pc');
      return { nom: li.querySelector('.fer-nom b')?.textContent, couverts, barre: Math.round(barre.width), pc: pc.textContent.replace(/\s+/g, ' ').trim(), pcBord: Math.round(pc.getBoundingClientRect().right), annGauche: Math.round(a.left) };
    }, i);
    infos.annuler.push(m && { nom: m.nom, barre: m.barre, pc: m.pc, couverts: m.couverts });
    if (!m) { raisons.push(`ligne ${i} : la pastille « Annuler » n'apparaît pas`); continue; }
    if (m.couverts.length) raisons.push(`ligne ${m.nom} : « Annuler » couvre ${m.couverts.join(' | ')}`);
    if (m.barre < 40) raisons.push(`ligne ${m.nom} : « Annuler » ne laisse que ${m.barre} px à la barre (< 40)`);
    if (m.pcBord > m.annGauche + 0.5) raisons.push(`ligne ${m.nom} : « ${m.pc} » passe sous « Annuler » (${m.pcBord} > ${m.annGauche})`);
    if (capture && i === n - 2) await capturer(p, capture.replace('.png', '-annuler.png'));
  }
  await nav.close();
}
console.log(JSON.stringify(infos));
console.log(raisons.length ? `CIBLES ECHEC ${[...new Set(raisons)].join(' ; ')}` : 'CIBLES OK');
