// Reproducible curated import, never a live AI request or a DB write.
import { readFileSync, writeFileSync } from 'node:fs';
import { sources as s } from './fermentation-science/sources.mjs';
import { science } from './fermentation-science/evidence.mjs';
const fact=(min,max,source)=>({range:{min,max},source});
const param=(min,max,central)=>({...fact(min,max,s.editorial),central});
const rows=[
 {id:'fermentis-us05',key:'us05',name:'Fermentis SafAle US-05',form:'sèche',styles:['Pale Ale','IPA'],goals:['clean'],temp:[18,26],dose:[50,80],primary:[18,20,19],finish:[20,22,21],days:[5,8,6],pof:'negative',aroma:'Profil de fermentation discret et équilibré, pour laisser s’exprimer malt et houblon.'},
 {id:'yeast-fermentis-saflager-w-34-70',key:'lager',name:'Fermentis SafLager W-34/70',form:'sèche',styles:['Lager','Pils'],goals:['clean'],temp:[12,18],aa:[80,84],dose:[80,120],primary:[12,14,14],finish:[16,18,17],days:[7,14,10],pof:'negative',aroma:'Lager au profil net ; la maturation se contrôle séparément de l’atténuation.'},
 {id:'lalbrew-voss',key:'voss',name:'LalBrew Voss',form:'sèche',styles:['Kveik','Pale Ale'],goals:['fruit','clean'],temp:[25,40],aa:[76,82],dose:[50,100],primary:[30,35,30],finish:[30,35,30],days:[3,6,4],pof:'negative',aroma:'Orange et agrumes sur un profil relativement neutre ; chaleur surtout documentée comme levier de vitesse.'},
 {id:'lalbrew-abbaye',key:'abbaye',name:'LalBrew Abbaye',form:'sèche',styles:['Ale belge','Dubbel','Tripel'],goals:['fruit','phenolic'],temp:[17,25],dose:[50,100],primary:[20,23,21],finish:[22,24,23],days:[4,8,6],pof:'positive',aroma:'Fruits secs à plus basse température, registre plus tropical et épicé à plus haute température.'},
 {id:'lalbrew-belle-saison',key:'saison',name:'LalBrew Belle Saison',form:'sèche',styles:['Saison'],goals:['phenolic','fruit'],temp:[20,35],aa:[86,94],dose:[50,100],primary:[20,24,22],finish:[24,28,25],days:[4,7,5],restDays:[4,10,6],pof:'positive',aroma:'Fruit et épices, activité diastatique : surveiller la poursuite lente de l’atténuation.'},
 {id:'lalbrew-verdant-ipa',key:'verdant',name:'LalBrew Verdant IPA',form:'sèche',styles:['IPA','Pale Ale'],goals:['fruit','thiols'],temp:[18,25],aa:[75,82],dose:[50,100],primary:[18,21,20],finish:[20,22,21],days:[4,7,5],pof:'negative',aroma:'Abricot, fruits tropicaux et agrumes documentés ; étudiée aussi dans un protocole Cascade.'},
 {id:'lalbrew-pomona',key:'pomona',name:'LalBrew Pomona',form:'sèche',styles:['IPA','Pale Ale'],goals:['fruit'],temp:[18,22],aa:[75,84],dose:[50,100],primary:[18,21,20],finish:[20,22,21],days:[4,7,5],pof:'negative',aroma:'Pêche, agrumes et fruits tropicaux documentés ; aucune teneur en lactones déduite.'},
 {id:'lalbrew-nottingham',key:'nottingham',name:'LalBrew Nottingham',form:'sèche',styles:['Ale','IPA'],goals:['clean','thiols'],temp:[10,25],aa:[78,83],dose:[50,100],primary:[18,22,20],finish:[20,23,22],days:[4,8,5],pof:'negative',aroma:'Fermentation relativement discrète ; thiols étudiés avec Cascade, sans promesse pour tout houblon.'},
 {id:'yeast-omega-9188919542014',key:'bananza',name:'Omega Yeast Bananza OYL-400',form:'liquide',styles:['Weissbier moderne','Ale fruitée'],goals:['banana','fruit'],temp:[18,22],aa:[76,82],primary:[19,21,20],finish:[20,22,21],days:[4,8,6],pof:'negative',aroma:'Banane et poire avec expression phénolique retirée ; option documentée pour éviter le girofle levurien.'}
];
const labels={banana:'Banane en avant',fruit:'Fruits et esters',clean:'Profil net et discret',phenolic:'Girofle et épices',thiols:'Thiols et fruits du houblon'};
const catalogue=JSON.parse(readFileSync(new URL('../src/data/yeastCatalogueBootstrap.json',import.meta.url),'utf8'));
const guides=rows.flatMap(r=>{
 const source=s[r.key], existing=catalogue.find(y=>y.id===r.id&&y.kind==='yeast');
 if(!existing)throw Error('Référence catalogue absente : '+r.id);
 const {catalogue:_large,...identity}=existing;
 return [{...identity,form:r.form},{
  id:'fermentation-science-'+r.id,kind:'fermentation',name:r.name+' · conduite documentée',version:'2026.09.08.1',enabled:true,source:s.editorial,
  yeastId:r.id,aliases:[r.name,...(existing.catalogue?.aliases??[]).slice(0,10)],styles:r.styles,
  aroma:{summary:r.aroma,banana:r.key==='bananza'?r.aroma:'La banane n’est pas un objectif quantifié pour cette conduite.',phenols:r.pof==='positive'?'POF+ : phénols levuriens possibles, intensité non calculée.':'POF− selon le fabricant ; absence de girofle dans la bière non certifiée par une analyse.',pof:r.pof,source},
  temperatureC:fact(...r.temp,source),...(r.aa?{attenuationPct:fact(...r.aa,source)}:{}),...(r.dose?{dryPitchGHL:fact(...r.dose,source)}:{}),
  plans:r.goals.map(goal=>({
   goal,name:labels[goal],rationale:goal==='thiols'?'Souche étudiée avec Cascade. Point de départ dans la fenêtre fabricant ; le triplet et ses données décident de ce qui est quantifiable.':r.aroma+' Les sous-plages sont des propositions à comparer sur ton moût.',source:s.editorial,
   pitchTemperatureC:param(...r.primary),
   phases:[
    {id:'active',name:'Fermentation principale',kind:'primaire',temperatureC:param(...r.primary),days:param(...r.days),completeWhen:r.key==='lager'?'Préparer le repos vers 65–75 % du chemin vers la DF attendue, pendant que la levure est active. Les jours ne déclenchent pas la montée.':'Suivre la baisse de densité ; passer au repos lorsque la fermentation approche sa fin attendue.'},
    {id:'finish',name:r.key==='saison'?'Fin lente et maturation':'Fin de fermentation et repos',kind:'reposDiacetyle',temperatureC:param(...r.finish),days:param(...(r.restDays??[2,5,3])),completeWhen:'Densité cohérente et stable après le dernier ajout fermentescible ou houblonnage ; contrôler VDK et défauts résiduels. Prolonger au besoin avant refroidissement ou conditionnement.'}
   ],
   notes:[
    {text:'Température de la bière, pas de l’air. Les jours sont un budget de planification, confiance faible ; aucun refroidissement ou conditionnement automatique.',source:s.editorial},
    {text:r.aroma,source},
    ...(goal==='thiols'?[{text:'Le maximum de thiols d’un essai ne garantit pas le maximum de fruits tropicaux. Rester dans la fenêtre fabricant.',source:s.thiolTemp}]:[]),
    ...(r.key==='lager'?[{text:'Le repère 65–75 % s’applique à la progression vers l’atténuation finale prévue ; hausse de 2–4 °C documentée, à garder compatible avec la souche.',source:s.lagering}]:[]),
    ...(r.key==='saison'?[{text:'La consommation des dextrines peut continuer après la principale ; recontrôler après un dry hop.',source:s.saison}]:[])
   ]
  }))
 }];
});
writeFileSync(new URL('../src/data/fermentationScienceBootstrap.json',import.meta.url),JSON.stringify([science,...guides],null,2)+'\n');
console.log(rows.length+' guides, '+science.levers.length+' leviers, '+science.compounds.length+' composés/familles, '+science.phenolStudy.observations.length+' essais.');
