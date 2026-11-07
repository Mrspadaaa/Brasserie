// Garde du n° 7 : la réserve ajoutée en bas de page ne change AUCUN écran au repos. Étape Houblons (et Identité), en haut de page, clair puis cave :
// la capture du build de HEAD et celle du build corrigé doivent être identiques à l'octet près.
// Usage : node controle-repos-houblons.mjs <build HEAD> <build après> [<dossier de captures>]   → REPOS OK | REPOS ECHEC <raisons>
import fs from 'node:fs'; import crypto from 'node:crypto';
import { ouvrir, dormir } from './banc.mjs';
const [head, apres, dossier] = process.argv.slice(2);
const raisons = [];
const sha = (b) => crypto.createHash('sha1').update(b).digest('hex').slice(0, 10);
for (const theme of ['clair', 'cave']) {
  for (const etape of ['houblons', 'identite']) {
    const prises = [];
    for (const [nom, build] of [['head', head], ['apres', apres]]) {
      const { nav, p } = await ouvrir(build, { theme, url: etape === 'houblons' ? '/?dev-local&etape=houblons' : '/?dev-local&etape=houblons&recette=identite' });
      await dormir(3500);
      const png = await p.screenshot();
      if (dossier) fs.writeFileSync(`${dossier}/repos-${etape}-${theme}-${nom}.png`, png);
      prises.push(png);
      await nav.close();
    }
    if (sha(prises[0]) !== sha(prises[1])) raisons.push(`${etape} ${theme} : la capture change (${sha(prises[0])} → ${sha(prises[1])})`);
  }
}
console.log(raisons.length ? `REPOS ECHEC ${raisons.join(' ; ')}` : 'REPOS OK');
