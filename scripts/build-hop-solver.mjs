// Reproducible editorial starting points, not a fit or published brew recipe.
import { readFile, writeFile } from 'node:fs/promises';
const source = { title: 'Points de départ et contraintes du solver aromatique', author: 'L’Affinée — hypothèses de formulation assistées par IA', year: 2026, kind: 'judgment', reference: 'docs/hop-solver.md', locator: '8 septembre 2026. Presets de formulation à adapter ; aucune garantie de style, de rendement enzymatique ou d’intensité sensorielle.' };
const p = (min, max, central, note) => ({ range: { min, max }, central, source: { ...source, locator: note + ' ' + source.locator } });
const defaults = Object.fromEntries([
  ['firstWort', 1, 80, 1, [0.5, 1, 2]], ['boil', 1, 100, 1/6, [0.5, 1, 2]],
  ['whirlpool', 3, 80, 1/3, [1, 2, 3]], ['fermentation', 4, 18, 24, [2, 4, 6]], ['postFermentation', 4, 18, 24, [2, 4, 6]],
].map(([phase, dose, temp, hours, doses]) => [phase, { doseGL: p(dose, dose, dose, `Dose proposée pour ${phase}, en g/L.`), temperatureC: p(temp, temp, temp, `Température de contact proposée pour ${phase}, en °C ; pas une mesure de la cuve.`), contactHours: p(hours, hours, hours, `Durée de scénario proposée pour ${phase}, en heures ; pas un optimum.`), searchDosesGL: doses.map(d => p(d, d, d, `Dose candidate pour ${phase}, en g/L ; discrétisation éditoriale du domaine de recherche.`)) }]));
const styles = [
  { id: 'free', name: 'Libre', aliases: [], targets: {}, avoid: [], timings: ['whirlpool','fermentation','postFermentation'], chemistry: {} },
  { id: 'hazy', name: 'IPA fruitée / Hazy', aliases: ['Hazy IPA','NEIPA','New England IPA','Juicy IPA'], targets: { tropical:'high', citrus:'medium', stoneFruit:'medium' }, avoid: ['herbal'], timings: ['whirlpool','fermentation','postFermentation'], chemistry: {} },
  { id: 'westcoast', name: 'IPA agrumes et résine', aliases: ['American IPA','West Coast IPA','IPA'], targets: { citrus:'high', resin:'medium' }, avoid: [], timings: ['whirlpool','postFermentation'], chemistry: {} },
  { id: 'pale', name: 'Pale ale', aliases: ['Pale Ale','American Pale Ale','Blonde Ale'], targets: { citrus:'medium', floral:'low' }, avoid: [], timings: ['whirlpool','postFermentation'], chemistry: {} },
  { id: 'lager', name: 'Lager / Pils', aliases: ['Lager','Pils','Pilsner','Helles','German Pils'], targets: { floral:'medium', spice:'low' }, avoid: ['tropical'], timings: ['boil','whirlpool'], chemistry: { phenols:'avoid' } },
  { id: 'saison', name: 'Saison / blanche épicée', aliases: ['Saison','Witbier','Blanche','Weissbier'], targets: { spice:'medium', citrus:'low' }, avoid: [], timings: ['boil','whirlpool'], chemistry: { phenols:'seek' } },
  { id: 'stout', name: 'Stout / Porter', aliases: ['Stout','Dry Stout','Porter','Robust Porter'], targets: { earthy:'low', herbal:'low' }, avoid: [], timings: ['boil','whirlpool'], chemistry: {} },
].map(s => ({...s, source}));
const models = JSON.parse(await readFile(new URL('../src/data/hopExtrapolationBootstrap.json', import.meta.url)));
const trials = JSON.parse(await readFile(new URL('../src/data/hopTrialBootstrap.json', import.meta.url))).hopKnowledge.filter(k => k.kind === 'trial');
const yeastPhenols = ['lalbrew-verdant-ipa','lalbrew-pomona'].map(yeastId => ({ yeastId, status:'negative', source: models[0].yeasts.find(y=>y.yeastId===yeastId).evidence[0] }));
const weizenSource = {title:'3068 Weihenstephan Weizen — fiche fabricant',author:'Wyeast',year:null,kind:'manufacturer',reference:'https://wyeastlab.com/product/weihenstephan-weizen/',locator:'Consultée le 8 septembre 2026, publication non datée. Caractère phénolique de girofle et esters de banane ; plage 18–24 °C. Pas de mesure β-lyase ni de rendement thiol.'};
const saisonSource = {title:'3724 Belgian Saison — fiche fabricant',author:'Wyeast',year:null,kind:'manufacturer',reference:'https://wyeastlab.com/product/belgian-saison/',locator:'Consultée le 8 septembre 2026, publication non datée. Profil épicé et fruité, plage 21–35 °C, STA1/diastaticus signalé par le fabricant. Le caractère POF n’est pas quantifié ici.'};
const extraYeasts = [
  {id:'wyeast-3068',kind:'yeast',name:'Wyeast 3068 Weihenstephan Weizen',form:'liquide',betaLyase:'unknown',source:weizenSource},
  {id:'wyeast-3724',kind:'yeast',name:'Wyeast 3724 Belgian Saison',form:'liquide',betaLyase:'unknown',source:saisonSource}
];
yeastPhenols.push({yeastId:'wyeast-3068',status:'positive',source:weizenSource});
const yeastConditions = [
  {yeastId:'wyeast-3068',temperatureC:{min:18,max:24},source:weizenSource},
  {yeastId:'wyeast-3724',temperatureC:{min:21,max:35},source:saisonSource,warning:'Wyeast 3724 : souche diastaticus / STA1 signalée par le fabricant. Prévoir une fin de fermentation confirmée, surveiller la densité et maîtriser les contaminations croisées ; l’atténuation peut se prolonger.'}
];
const trialChemistry = trials.filter(t=>t.id !== 'trial-cascade-lafontaine-2018').map(t=>({trialId:t.id, goals:['thiols'], source:t.source}));
const policy = { id:'laffinee-hop-solver', kind:'solver', name:'Formuler le houblonnage', version:'2026-09-08.1', enabled:true, source, defaults, styles, yeastPhenols, yeastConditions, trialChemistry,
  dryHopReviewGL:p(8,8,8,'Repère de revue du dry-hop cumulé, pas seuil de danger : rendement aromatique non linéaire dans l’essai Cascade, DOI 10.1002/jib.517. Ce repère ne garantit ni plateau ni défaut pour une autre bière.') };
await writeFile(new URL('../src/data/hopSolverBootstrap.json', import.meta.url), JSON.stringify([policy,...extraYeasts],null,2)+'\n');
console.log('Guide de formulation écrit ; toutes les valeurs sont attribuées.');
