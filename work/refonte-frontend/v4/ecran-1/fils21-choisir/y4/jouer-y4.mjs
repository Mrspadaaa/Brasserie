// y4 · preuve du geste au doigt : balayer les cartes de levure. Plan K4 (Citra 3 j puis Idaho 7 5 j), dry hop
// actif : le pouce part de la carte US-05 et glisse vers la gauche ; à mi-chemin (doigt gardé), le profil est
// entre US-05 et Pomona ; lâché, la carte Pomona se cale ; un second balayage mène à Verdant ; puis « après ».
// Usage : node jouer-y4.mjs  →  captures/y4-avant.png, y4-pendant.png, y4-apres.png, y4/geste-y4.json
import { ouvrir, preuve, attendre } from '../y1/socle/jouer.mjs';

const J = await ouvrir('y4/etat.html');
const avant = await J.releve();
await J.capture('y4-avant');
const z = await J.boite('#cartes');
const y = z.y + z.h / 2, x0 = z.x + z.w / 2 + 60;
await J.glisser([[x0, y], [x0 - 160, y]], { garder: true, pas: 14, delai: 18 });
const pendant = await J.releve();
await J.capture('y4-pendant');
for (let k = 1; k <= 8; k++) { await J.p.touchscreen.touchMove(x0 - 160 - (k * 40) / 8, y); await attendre(18); }
await J.lever(); await attendre(300);
const apres = await J.releve();
await J.capture('y4-apres');
await J.glisser([[x0, y], [x0 - 210, y]], { pas: 14, delai: 18 }); await attendre(300);
const verdant = await J.releve();
const m = await J.boite('[data-mom="dryPost"]'); await J.toucher(m.cx, m.cy);
const apresFerm = await J.releve();
await J.capture('y4-apres-fermentation');
preuve('y4', 'geste-y4', { avant, pendant, apres, verdant, apresFerm, erreurs: J.erreurs });
const L = (n, v) => console.log(n.padEnd(9), v.levure.padEnd(8), v.moment.padEnd(6), 'agrumes', String(v.crans.citrus).padEnd(4), 'floral', String(v.crans.floral).padEnd(4), 'barre agrumes', String(v.largeurs.citrus).padStart(3) + ' px', 'rail', String(v.tx).padStart(5), '|', v.change.slice(0, 70));
L('avant', avant); L('pendant', pendant); L('après', apres); L('verdant', verdant); L('après f.', apresFerm);
console.log('bio Pomona :', apres.bio);
console.log('erreurs', J.erreurs.length ? J.erreurs : 'aucune');
await J.fermer();
