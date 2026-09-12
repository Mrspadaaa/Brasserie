/** Synthetic, memory-only fixtures for mobile QA. This module is removed from production. */
import type { Recipe, Transaction } from '../types';
import type { CollectionName } from '../services/firestoreRepo';
import { defaultConfig } from '../services/storage';
import { todayISO } from '../domain/finance/ledger';
import { estimateBrewBudget } from '../domain/finance/brewBudget';

export function financeDemoEntries() {
  const today=todayISO(), year=Number(today.slice(0,4)), month=today.slice(0,7), at=new Date().toISOString();
  const entries:Array<{name:CollectionName;id:string;data:any}>=[];
  const add=(name:CollectionName,id:string,data:any)=>entries.push({name,id,data});
  add('config','app',{...defaultConfig,company:{...defaultConfig.company,name:'Brasserie · Démonstration'},fiscal:{...defaultConfig.fiscal,isTvaRegistered:false}});
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
