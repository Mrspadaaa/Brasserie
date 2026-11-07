// B2 n° 20 : état `difficile` : le message disait « Réessaie » alors que le bouton dit « Relire » : deux mots pour un geste.
// Attendu, 390 clair et cave, 1280 : le message d'échec (rôle alert) nomme le bouton « Relire » et ne contient plus « Réessaie » ; le bouton « Relire » est là ; le reste du message (partie lue,
// photo plus nette, saisie à la main) est inchangé.
// Usage : node controle-b2-20-relire.mjs [<build>] [<dossier captures>]   → RELIRE OK | RELIRE ECHEC <raisons>
import { demarrer } from './aide-b2.mjs';
const { ouvrir, raisons, cap, verdict } = await demarrer();
const infos = [];
for (const [mode, theme] of [['t390', 'clair'], ['t390', 'cave'], ['pc1280', 'clair']]) {
  const p = await ouvrir('difficile', mode, theme);
  const m = await p.evaluate(() => ({ message: document.querySelector('[role="alert"]')?.innerText.replace(/\s+/g, ' ').trim() ?? null, boutons: [...document.querySelectorAll('button')].map(b => b.innerText.trim()).filter(t => /^(Relire|Réessayer|Saisir à la main)$/.test(t)) }));
  infos.push({ mode, theme, ...m });
  const ou = `${mode} ${theme}`;
  if (!m.message) raisons.push(`${ou} : aucun message d'échec`);
  else {
    if (/Réessaie/i.test(m.message)) raisons.push(`${ou} : le message dit encore « Réessaie » : « ${m.message} »`);
    if (!/Relire/.test(m.message)) raisons.push(`${ou} : le message ne nomme pas « Relire » : « ${m.message} »`);
    if (!/la partie 2 sur 3 n'a pas été lue/.test(m.message) || !/photo plus nette/.test(m.message) || !/à la main/.test(m.message)) raisons.push(`${ou} : le reste du message a changé : « ${m.message} »`);
  }
  if (!m.boutons.includes('Relire')) raisons.push(`${ou} : bouton « Relire » absent (${m.boutons.join(', ')})`);
  await cap(p, `20-relire-${mode}-${theme}`);
  await p.close();
}
await verdict('RELIRE', infos.slice(0, 1));
