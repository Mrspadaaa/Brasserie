// B1 n° 1 et n° 13 (promesse de menu sans menu) et n° 11 (une famille ne s'appelle pas comme un produit) ; lot 4, « Juste régler le problème ».
// n° 1 : la pastille du moment du plateau (« empâtage ⌄ ») avait un chevron de menu et écrivait au premier toucher. Attendu : plus de chevron (le dessin de la pastille de la ligne,
//        ⇄, qui dit « ça tourne »), l'étiquette dit « Toucher : <moment suivant> », et le toucher laisse « Annuler ».
// n° 13 : la bascule « Grain ⇄ » : cinq familles à l'aveugle. Attendu : l'étiquette et l'infobulle disent la famille suivante.
// n° 11 : « Lactose · [Lactose] » : l'étiquette de famille ne répète pas le nom de la ligne, et aucune famille ne porte le nom d'un article du stock.
// Usage : node controle-n1-n13-n11.mjs <build> [<capture.png>] [clair|cave]   → PASTILLES OK | PASTILLES ECHEC <raisons>
import { ouvrir, toucher, dormir, verdict, capturer } from './banc.mjs';
const [construit, capture, theme = 'clair'] = process.argv.slice(2);
const { nav, p } = await ouvrir(construit, { etat: 'huit', theme });
await dormir(1000);
const raisons = [];
const infos = {};
// n° 1
await toucher(p, '[data-sel="0"] [data-role="nom"]');
const pil = await p.$eval('.fer-bmo', (e) => ({ chevron: !!e.querySelector('svg:not(.fer-tour)'), tour: !!e.querySelector('.fer-tour'), label: e.getAttribute('aria-label'), motAvant: e.textContent.trim() }));
infos.pastille = pil;
if (pil.chevron) raisons.push('n° 1 : la pastille du plateau a encore un chevron de menu');
if (!/Toucher : /.test(pil.label)) raisons.push(`n° 1 : l'étiquette ne dit pas ce que fait le toucher (« ${pil.label} »)`);
await toucher(p, '.fer-bmo');
const apres = await p.evaluate(() => ({ menu: !!document.querySelector('[role=menu]'), annuler: !!document.querySelector('[data-role="annuler-moment"]'), mot: document.querySelector('.fer-bmo').textContent.trim() }));
if (apres.mot === pil.motAvant) raisons.push('n° 1 : le toucher ne change rien (ni menu ni moment)');
if (!apres.menu && !apres.annuler) raisons.push('n° 1 : le toucher écrit sans « Annuler » ni menu');
// n° 13
const fam = await p.$eval('[data-role="fam"]', (e) => ({ label: e.getAttribute('aria-label'), title: e.getAttribute('title'), texte: e.textContent.trim() }));
infos.fam = fam;
if (!/Toucher : \S/.test(fam.label) || !/Toucher : \S/.test(fam.title ?? '')) raisons.push(`n° 13 : la bascule ne dit pas la famille suivante (« ${fam.label} » / « ${fam.title} »)`);
// n° 11 : toutes les familles, par bascules
const familles = [];
for (let k = 0; k < 6; k++) { familles.push(await p.$eval('[data-role="fam"]', (e) => e.textContent.trim())); await toucher(p, '[data-role="fam"]'); }
const articles = await p.evaluate(() => [...document.querySelectorAll('[data-sel] [data-role="nom"]')].map((e) => e.textContent.trim()));
const stock = new Set(articles.map((a) => a.toLowerCase()));
infos.familles = [...new Set(familles)];
for (const f of new Set(familles)) if (stock.has(f.toLowerCase())) raisons.push(`n° 11 : la famille « ${f} » porte le nom d'un article (${f})`);
const tags = await p.$$eval('[data-sel]', (els) => els.map((li) => ({ nom: li.querySelector('.fer-nom b')?.textContent.trim(), tag: li.querySelector('.fer-tag')?.textContent.trim() })));
for (const t of tags) if (t.tag && t.tag.toLowerCase() === t.nom.toLowerCase()) raisons.push(`n° 11 : la ligne « ${t.nom} » répète son nom en étiquette`);
infos.tags = tags.filter((t) => t.tag);
if (capture) { await p.$eval('[data-sel="7"]', (e) => e.scrollIntoView({ block: 'center' })); await dormir(200); await capturer(p, capture); }
await verdict(nav, 'PASTILLES', raisons, infos);
