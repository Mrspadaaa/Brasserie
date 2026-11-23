/** Synthetic, memory-only fixtures for mobile QA. This module is removed from production. */
import type { Recipe, Transaction } from '../types';
import type { CollectionName } from '../services/firestoreRepo';
import { defaultConfig } from '../services/storage';
import { todayISO } from '../domain/finance/ledger';
import { estimateBrewBudget } from '../domain/finance/brewBudget';

/** `?finance-demo=reel` : le second jeu, qui imite les états de la vraie app du brasseur (voir `financeDemoReel`). Sans paramètre : la brasserie complète. */
export function financeDemoEntries(jeu?:string) {
  const choisi=jeu??(typeof location!=='undefined'?new URLSearchParams(location.search).get('finance-demo')??'':'');
  if(choisi==='reel')return financeDemoReel();
  const today=todayISO(), year=Number(today.slice(0,4)), month=today.slice(0,7), at=new Date().toISOString();
  const entries:Array<{name:CollectionName;id:string;data:any}>=[];
  const add=(name:CollectionName,id:string,data:any)=>entries.push({name,id,data});
  /* Caisse (uv) : brasserie complète avec l'IBAN d'EXEMPLE public du guide SIX (jamais un vrai), deux clients, trois tarifs, un brassin conditionné. Tout est de démonstration. */
  add('config','app',{...defaultConfig,company:{...defaultConfig.company,name:'Brasserie · Démonstration',uid:'CHE-123.456.789',iban:'CH93 0076 2011 6238 5295 7',adresse:{rue:'Rue de la Démo',numero:'1',npa:'1700',localite:'Fribourg',pays:'CH'}},fiscal:{...defaultConfig.fiscal,isTvaRegistered:false}});
  add('clients','CL-DEMO-1',{id:'CL-DEMO-1',name:'Café du Bourg',type:'Pro',contact:'',phone:'',email:'',notes:'Démonstration',favorite:true});
  add('clients','CL-DEMO-2',{id:'CL-DEMO-2',name:'Martin Rey',type:'Privé',contact:'',phone:'',email:'',notes:'Démonstration',adresse:{rue:'Chemin des Fixtures',numero:'4',npa:'1700',localite:'Fribourg',pays:'CH'},address:'Chemin des Fixtures 4, 1700 Fribourg'});
  [['Pale Ale 33 cl',5],['Pale Ale 75 cl',10],['Pale Ale Fût 20 L',160]].forEach(([product,priceHT])=>add('tarifs',String(product).toLowerCase().replace(/[^a-z0-9]+/g,'-'),{product,costIngredients:0,costLabor:0,costFixed:0,costTotal:0,priceHT,marginCHF:0,marginPercent:0}));
  add('batches','DEMO-LOT-CAISSE',{id:'DEMO-LOT-CAISSE',name:'Pale Ale',style:'Pale Ale',volumeL:30,brewDate:`${month}-05`,status:'conditionne',volumePackagedL:27,packaging:{bottles33:96,bottles75:24,kegIds:['DEMO-FUT-1']}});
  add('kegs','DEMO-FUT-1',{id:'DEMO-FUT-1',capacityL:20,state:'full',batchRef:'DEMO-LOT-CAISSE'});
  const stocks=[{id:'DEMO-MALT',ref:'DEMO-MALT',name:'Pilsner',category:'Malt',unit:'kg',currentStock:3,minStock:2,reorder:false}];
  stocks.forEach(s=>add('stockItems',s.ref,{...s,kind:'rawMaterials'}));
  const recipe={id:'DEMO-PALE',name:'Pale Ale de septembre',style:'Pale Ale',volumeL:30,brewDate:`${month}-20`,fermentables:[{name:'Pilsner',weightKg:6,kind:'grain',use:'empatage',stockItemRef:'DEMO-MALT'}],hops:[],yeast:{name:'',qty:0,unit:'sachet',form:'sèche'},ogTarget:1.05,fgTarget:1.01,abvTarget:5.2,ibuTarget:28,colorEbc:8,boilMin:60,efficiencyPct:72,totalGristKg:6,carboTarget:'2.4 vol'} as Recipe;
  add('recipes',recipe.id,recipe);
  const tx=(id:string,title:string,amount:number,category:Transaction['category'],vendor:string,date=today):Transaction=>({id,date,description:title,amountHT:amount,amountTTC:amount,tvaAmount:0,tvaRate:0,category,subcategory:'',finance:{version:1,kind:category==='recettes'?'income':'expense',amountCents:Math.round(amount*100),vendor,lines:[],paymentStatus:'unpaid',dueDate:`${month}-25`,recordedAt:at}});
  const records=[tx('DEMO-T1','Malt et houblons · Pale Ale',186.8,'brassage','Comptoir du brasseur'),tx('DEMO-T2','Loyer de l’atelier',400,'chargesFixes','Atelier'),tx('DEMO-T3','Nettoyant alcalin',42,'nettoyage','Comptoir du brasseur'),tx('DEMO-T4','Joints de la cuve',28.6,'materiel','Inox & Co'),tx('DEMO-T5','Électricité',68,'chargesFixes','Énergie'),tx('DEMO-T6','Vente au marché',720,'recettes','Marché du village')];
  records[0].finance!.lines=[{id:'malt',description:'Pilsner',kind:'ingredient',quantity:25,unit:'kg',stockItemRef:'DEMO-MALT',amountCents:18680}];
  for(const record of records){add('transactions',record.id,record);if(record.id!=='DEMO-T2')add('financialPayments',`PAI-${record.id}`,{id:`PAI-${record.id}`,transactionId:record.id,date:today,amountCents:record.finance!.amountCents,direction:record.category==='recettes'?'in':'out',method:'bank',recordedAt:at});}
  for(let i=1;i<=6;i++){const d=new Date(year,Number(month.slice(5))-1-i,5),date=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-05`;const row=tx(`DEMO-H${i}`,'Petits achats courants',25+i*3,'divers','Quincaillerie',date);add('transactions',row.id,row);add('financialPayments',`PAI-${row.id}`,{id:`PAI-${row.id}`,transactionId:row.id,date,amountCents:row.finance!.amountCents,direction:'out',method:'bank',recordedAt:at});}
  const historic=[tx('DEMO-ARCHIVE-MALT','Malt de la saison passée',120,'brassage','Ancien fournisseur',`${year-1}-09-12`),tx('DEMO-ARCHIVE-DUE','Solde atelier · ancienne année',60,'chargesFixes','Atelier',`${year-1}-12-20`),tx('DEMO-ARCHIVE-SALE','Fête du village · ancienne édition',800,'recettes','Comité du village',`${year-2}-06-01`)];
  for(const record of historic){record.finance!.recordedAt=`${record.date}T12:00:00.000Z`;record.finance!.dueDate=record.date;add('transactions',record.id,record);if(record.id!=='DEMO-ARCHIVE-DUE')add('financialPayments',`PAI-${record.id}`,{id:`PAI-${record.id}`,transactionId:record.id,date:record.date,amountCents:record.finance!.amountCents,direction:record.category==='recettes'?'in':'out',method:'bank',recordedAt:record.finance!.recordedAt});}
  add('financialProfiles','current',{id:'current',canton:'FR',legalForm:'sole-proprietor',vatRegistered:false,accounting:'simplified',annualProductionL:1200,historyCompleteFrom:`${year}-01-01`,openingCash:{date:`${year}-01-01`,amountCents:400000,confirmed:true}});
  add('financialPlans','DEMO-LOYER',{id:'DEMO-LOYER',title:'Loyer de l’atelier',date:`${month}-25`,amountCents:40000,direction:'out',category:'chargesFixes',source:'recurring',status:'active',costAllocation:'fixed',recurrence:{frequency:'monthly'},vendor:'Atelier',createdAt:at});
  add('creativeItems','DEMO-HOTTE',{id:'DEMO-HOTTE',type:'equipment',title:'Hotte de brassage',description:'Évacuer la vapeur pendant l’ébullition.',status:'quote',estimatedCost:800,notes:'Exemple fictif : livraison et pose à chiffrer.'});
  const fermenterMonth=new Date(Date.UTC(year,Number(month.slice(5))+1,1)).toISOString().slice(0,7);
  add('financialPlans','DEMO-FERMENTEUR',{id:'DEMO-FERMENTEUR',title:'Fermenteur supplémentaire',date:`${fermenterMonth}-01`,amountCents:75000,direction:'out',category:'materiel',source:'equipment',status:'active',createdAt:at,upgrade:{version:1,timing:'next',stage:'research',budgetKnown:true,purchaseCents:70000,deliveryCents:5000,datePrecision:'month',estimateSource:'estimate',purpose:'Enchaîner les brassins sans attendre une cuve libre.'}});
  add('financialPlans','DEMO-CUVERIE',{id:'DEMO-CUVERIE',title:'Système de brassage plus performant',date:'',amountCents:0,direction:'out',category:'materiel',source:'equipment',status:'draft',createdAt:at,upgrade:{version:1,timing:'later',stage:'idea',budgetKnown:false,datePrecision:'month',estimateSource:'estimate',purpose:'À étudier quand le volume vendu justifiera l’investissement.'}});
  records[1].finance!.planId='DEMO-LOYER';records[1].finance!.occurrenceId=`DEMO-LOYER:${month}-25`;
  const estimate=estimateBrewBudget({recipe,stockItems:stocks,batches:[],transactions:records,brewDate:`${month}-20`,netVolumeL:27,settings:{costs:{energy:{enabled:true,amountTTC:8},cleaning:{enabled:true,amountTTC:3},packaging:{enabled:true,amountTTC:24},beerTax:{enabled:true,amountTTC:6.84}},annualVolumeL:1200,annualFixedCHF:4800,annualDepreciationCHF:360,includeFixed:true,includeDepreciation:true},now:at});
  add('financialPlans','DEMO-BUDGET',{id:'DEMO-BUDGET',title:recipe.name,date:`${month}-20`,amountCents:Math.round(estimate.cashRequiredTTC*100),direction:'out',category:'brassage',source:'brew',status:'active',brewEstimate:estimate,createdAt:at});
  add('equipment','DEMO-CUVE',{id:'DEMO-CUVE',ref:'DEMO-CUVE',name:'Cuve de fermentation',category:'Fermentation',state:'Bon',purchasePrice:1800,purchaseDate:`${year-1}-02-01`});
  add('financialAssets','DEMO-IMMO',{id:'DEMO-IMMO',name:'Cuve de fermentation',equipmentRef:'DEMO-CUVE',acquisitionDate:`${year-1}-02-01`,inServiceDate:`${year-1}-02-01`,acquisitionCents:180000,businessUsePct:100,category:'tanks',method:'declining',ratePct:20,openingYear:year,openingValueCents:144000,openingConfirmed:true,firstYearFraction:1});
  return {entries,source:'seed' as const,counts:entries.reduce<Record<string,number>>((sum,e)=>({...sum,[e.name]:(sum[e.name]??0)+1}),{})};
}

/**
 * Le second jeu (`?finance-demo=reel`, voie f2, CP-1) : les ÉTATS que la vraie app montre et que la brasserie complète ne montrait pas. Rien n'est réel : noms, montants et IBAN d'exemple.
 * Une seule vente (10 × « Bière · 75 cl », TWINT, ligne libre) ; deux dépenses du jour (travaux, divers) ; AUCUN solde de départ ; un brassin conditionné sans chiffrage (coût du litre inconnu) ;
 * deux brassins planifiés dont un seul achat est connu (partiel) le même jour ; deux anciens tarifs sans format ni bière ; un nom de bière brut (« Ssr »).
 */
function financeDemoReel() {
  const today=todayISO(), year=Number(today.slice(0,4)), month=today.slice(0,7), at=new Date().toISOString();
  const entries:Array<{name:CollectionName;id:string;data:any}>=[];
  const add=(name:CollectionName,id:string,data:any)=>entries.push({name,id,data});
  const ajouter=(iso:string,jours:number)=>{const d=new Date(`${iso}T12:00:00Z`);d.setUTCDate(d.getUTCDate()+jours);return d.toISOString().slice(0,10);};
  add('config','app',{...defaultConfig,company:{...defaultConfig.company,name:'Brasserie · Démonstration',uid:'CHE-123.456.789',iban:'CH93 0076 2011 6238 5295 7',adresse:{rue:'Rue de la Démo',numero:'1',npa:'1700',localite:'Fribourg',pays:'CH'}},fiscal:{...defaultConfig.fiscal,isTvaRegistered:false}});
  add('clients','CL-REEL-1',{id:'CL-REEL-1',name:'Restaurant du Lac',type:'Pro',contact:'',phone:'',email:'',notes:'Démonstration',favorite:false});
  /* Deux anciens tarifs : ni bière ni format écrits (le libellé porte « (0 hl) »), un prix à zéro saisi à la main. */
  add('tarifs','amber-ale-50-cl-0-hl',{product:'Amber Ale 50 cl (0 hl)',costIngredients:0,costLabor:0,costFixed:0,costTotal:0,priceHT:0,marginCHF:0,marginPercent:0});
  add('tarifs','amber-ale-33-cl-0-hl',{product:'Amber Ale 33 cl (0 hl)',costIngredients:0,costLabor:0,costFixed:0,costTotal:0,priceHT:0,marginCHF:0,marginPercent:0});
  /* Un tarif posé (75 cl de « Ssr » à 9,50) : un prix connu face à un coût inconnu, l'aiguille de c7c sans sa pente. */
  add('tarifs','ssr-75-cl',{product:'Ssr 75 cl',biere:'Ssr',format:{id:'75cl',volumeL:0.75},priceHT:9.5});
  const snap=(name:string,malt:string,levure:string)=>({name,style:'Amber Ale',volumeL:30,fermentables:[{name:malt,weightKg:5,kind:'grain',use:'empatage',stockItemRef:`REEL-${malt}`}],hops:[{name:'Cascade',weightG:60,timing:'ébullition',minutes:60}],yeast:{name:levure,qty:1,unit:'sachet',form:'sèche',stockItemRef:`REEL-${levure}`},ogTarget:1.05,fgTarget:1.01,abvTarget:5.2,ibuTarget:30,colorEbc:20,boilMin:60,efficiencyPct:72,totalGristKg:5});
  add('batches','REEL-LOT-1',{id:'REEL-LOT-1',name:'Ssr',style:'Amber Ale',volumeL:30,volumeBrewedL:30,brewDate:ajouter(today,-45),bottlingDate:ajouter(today,-25),status:'conditionne',volumePackagedL:15,packaging:{bottles33:0,bottles75:20,kegIds:[]},recipeSnapshot:snap('Ssr','Munich','US05'),malts:[],hops:[]});
  add('batches','REEL-LOT-2',{id:'REEL-LOT-2',name:'Ssr',style:'Amber Ale',volumeL:30,brewDate:'',plannedBrewDate:ajouter(today,5),status:'planifie',recipeSnapshot:snap('Ssr','Munich','US05'),malts:[],hops:[]});
  add('batches','REEL-LOT-3',{id:'REEL-LOT-3',name:'Pale test',style:'Pale Ale',volumeL:30,brewDate:'',plannedBrewDate:ajouter(today,3),status:'planifie',recipeSnapshot:snap('Pale test','Vienna','Nottingham'),malts:[],hops:[]});
  const stocks=[{id:'REEL-US05',ref:'REEL-US05',name:'US05',category:'Levure',unit:'sachet',currentStock:0,minStock:1,reorder:true},{id:'REEL-Munich',ref:'REEL-Munich',name:'Munich',category:'Malt',unit:'kg',currentStock:0,minStock:2,reorder:true},{id:'REEL-Vienna',ref:'REEL-Vienna',name:'Vienna',category:'Malt',unit:'kg',currentStock:0,minStock:2,reorder:true},{id:'REEL-Nottingham',ref:'REEL-Nottingham',name:'Nottingham',category:'Levure',unit:'sachet',currentStock:0,minStock:1,reorder:true}];
  stocks.forEach(s=>add('stockItems',s.ref,{...s,kind:'rawMaterials'}));
  const tx=(id:string,title:string,amount:number,category:Transaction['category'],vendor:string,extra:Partial<NonNullable<Transaction['finance']>>={}):Transaction=>({id,date:today,description:title,amountHT:amount,amountTTC:amount,tvaAmount:0,tvaRate:0,category,subcategory:category==='recettes'?'Vente directe':'',finance:{version:1,kind:category==='recettes'?'income':'expense',amountCents:Math.round(amount*100),vendor,lines:[],paymentStatus:'paid',recordedAt:at,...extra}});
  const vente=tx('REC-REEL-1','Vente 10 × Bière · 75 cl — Restaurant du Lac',5695,'recettes','Restaurant du Lac');
  vente.finance!.lines=[{id:'REC-REEL-1-0',description:'Bière · 75 cl',kind:'other',quantity:10,unit:'pièce',unitPriceCents:56950,amountCents:569500}];
  const sorties=[tx('REEL-T1','Local et travaux',5500,'renovation','Entreprise du coin'),tx('REEL-T2','Achats divers',250.2,'divers','Quincaillerie'),tx('REEL-T3','Levure US05',2.4,'brassage','Comptoir du brasseur'),tx('REEL-T4','Malt Vienna',12.8,'brassage','Comptoir du brasseur')];
  sorties[2].finance!.lines=[{id:'l-levure',description:'US05',kind:'ingredient',quantity:1,unit:'sachet',stockItemRef:'REEL-US05',amountCents:240}];
  sorties[3].finance!.lines=[{id:'l-vienna',description:'Vienna',kind:'ingredient',quantity:1,unit:'kg',stockItemRef:'REEL-Vienna',amountCents:1280}];
  for(const record of [vente,...sorties]){add('transactions',record.id,record);add('financialPayments',`PAI-${record.id}`,{id:`PAI-${record.id}`,transactionId:record.id,date:today,amountCents:record.finance!.amountCents,direction:record.category==='recettes'?'in':'out',method:record.category==='recettes'?'twint':'bank',recordedAt:at});}
  /* Profil sans solde de départ ni volume annuel : « inconnu » reste inconnu (jamais 0). */
  add('financialProfiles','current',{id:'current',canton:'FR',legalForm:'sole-proprietor',vatRegistered:false,accounting:'simplified'});
  return {entries,source:'seed' as const,counts:entries.reduce<Record<string,number>>((sum,e)=>({...sum,[e.name]:(sum[e.name]??0)+1}),{})};
}
