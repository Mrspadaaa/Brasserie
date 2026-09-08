import { readFile, writeFile } from 'node:fs/promises';
const source = { title:'Impact of static dry-hopping rate on the sensory and analytical profiles of beer', author:'Scott R. Lafontaine et Thomas H. Shellhammer', year:2018, kind:'research', reference:'https://onlinelibrary.wiley.com/doi/full/10.1002/jib.517', locator:'Tableau 3 et protocole. Un lot Cascade 2015, cônes broyés en sacs, Wyeast 1728 puis clarification ; 24 h à 13,3–15 °C. Moyennes du panel sur 0–15, sans dispersion entre brassins publiée pour cette courbe.' };
const assessment = { title:'Interpolation locale des doses Cascade 2015', author:'L’Affinée — reconstruction explicite, non modèle des auteurs', year:2026, kind:'judgment', reference:'docs/hop-solver.md', locator:'Interpolation linéaire des cinq moyennes ; conversion affine 0–15 vers l’indice local 0–100, convention non validée de correspondance sensorielle. Marge symétrique : plus grand écart absolu en laissant chacune des trois doses intérieures hors de l’interpolation. Ce contrôle entre doses corrélées n’est pas une validation sur des brassins indépendants, ni une couverture 95 %.' };
const doses = [0,2,3.86,8,16];
const outputs = [['citrus',[1.9,4.4,5.8,7.1,7]],['herbal',[2.5,4.3,5.7,7.4,10.4]]].map(([id,means]) => {
  const errors = means.slice(1,-1).map((mean,j) => { const i=j+1; return mean - (means[i-1]+(means[i+1]-means[i-1])*(doses[i]-doses[i-1])/(doses[i+1]-doses[i-1])); });
  const radius=Math.max(...errors.map(Math.abs))*100/15;
  return {target:`axis:${id}`,axisVersion:'local-1',envelope:null,doseCurve:{points:means.map((value,i)=>({doseGL:doses[i],value:value*100/15})),source, residual:{range:{min:-radius,max:radius},source:assessment},method:assessment.locator}};
});
const model={id:'cascade-dose-lafontaine2018',kind:'model',name:'Cascade × Wyeast 1728 · courbes de dose observées',version:'lafontaine-dose-local-1',enabled:true,confidence:'low',source:assessment,scope:{varietyId:'cascade-cones-lafontaine',yeastId:'wyeast-1728',timing:'postFermentation',form:'cone',doseGL:{min:0,max:16},temperatureC:{min:13.3,max:15},contactHours:{min:24,max:24},matrixId:'cascade-static-dose-2015',notes:source.locator+' Fermentation 19,4–20 °C, moût 11,3 °P, bière 4,75 % vol ; iso-humulones ajoutées après filtration. Autres lots, pellets, matrices et souches hors domaine. La baisse 8→16 g/L des moyennes agrumes reste conservée, sans prétendre établir une baisse réelle significative.'},outputs};
await writeFile(new URL('../src/data/hopDoseStudyBootstrap.json',import.meta.url),JSON.stringify([model],null,2)+'\n');
console.log('Deux courbes publiées et leurs marges de reconstruction écrites.');
const experimental=JSON.parse(await readFile(new URL('../src/data/hopExtrapolationLegacyBootstrap.json',import.meta.url)));
experimental[0].version='2026-09-08.2';
const transferSource={...assessment,title:'Transfert exploratoire de formes de réponse à la dose',locator:'Les moyennes sont centrées sur le témoin à 0 g/L, puis divisées par le plus grand accroissement observé de cet axe. Mélange convexe avec l’ancienne réponse de saturation. Poids de transfert 0–1 : les deux formes restent plausibles ; repère central 0,5, jugement non ajusté. Erreur relative : plus grand résidu absolu d’interpolation entre doses intérieures divisé par l’accroissement maximal observé. Aucune validation indépendante du transfert entre houblons, souches ou matrices.'};
experimental[0].doseReferences=[['citrus',[1.9,4.4,5.8,7.1,7]],['herbal',[2.5,4.3,5.7,7.4,10.4]]].map(([axisId,means])=>{
  const increment=Math.max(...means)-means[0];
  const errors=means.slice(1,-1).map((m,j)=>{const i=j+1;return m-(means[i-1]+(means[i+1]-means[i-1])*(doses[i]-doses[i-1])/(doses[i+1]-doses[i-1]))});
  const error=Math.max(...errors.map(Math.abs))/increment;
  return {axisId,timings:['fermentation','postFermentation'],points:means.map((v,i)=>({doseGL:doses[i],value:(v-means[0])/increment})),source:transferSource,evidence:source,
    transferWeight:{range:{min:0,max:1},central:.5,source:transferSource},relativeError:{range:{min:error,max:error},central:error,source:transferSource},
    limitations:['Un seul lot Cascade 2015, cônes, bière clarifiée sans levure. Le transfert vers une autre variété, une levure active ou une autre forme reste une hypothèse de faible confiance.','Les répétitions du panel ne constituent pas des brassins indépendants. Aucun intervalle 95 % n’est déduit de ces cinq doses.','Aucune prolongation de la courbe au-delà de 16 g/L. Température et contact continuent à être traités par les hypothèses du modèle, pas par une nouvelle loi mesurée.']};
});
await writeFile(new URL('../src/data/hopExtrapolationBootstrap.json',import.meta.url),JSON.stringify(experimental,null,2)+'\n');
console.log('Transfert prudent des formes de dose ajouté aux hypothèses v2.');
