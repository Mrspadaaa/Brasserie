import type { Recipe } from '../../src/types';
/** User reproduction. The optional oat numbers are synthetic QA inputs, not a
 * manufacturer's analysis and never imported into production. */
export const fruty = (complete = false): Recipe => ({
  id:'qa-fruty', name:'Fruty', style:'Fruit Lambic',
  styleRef:{guideId:'styles-bjcp-2021',version:'2026-09-09.1',styleId:'fruit-lambic'},
  volumeL:24, ogTarget:null, fgTarget:null, abvTarget:.5, boilMin:60, efficiencyPct:75, totalGristKg:2.9,
  nolo:{version:1,enabled:true,targetAbvPct:.5,process:'restricted',orientation:'free',wort:{ogPlato:null,sugarsGL:{},sugarsComplete:false},operations:[],measurements:[],equipment:[],stabilization:{method:'',validationReference:'',storage:''}},
  fermentables:[{name:'Malt Maris Otter',weightKg:1,kind:'grain',use:'empatage',colorEbc:5,potentialPpg:37,fermentabilityPct:100},
    {name:"Flocons d'Avoine",weightKg:1.9,kind:'grain',use:'empatage',fermentabilityPct:100,...(complete?{colorEbc:2,potentialPpg:33}:{})}],
  hops:[{name:'Ariana',weightG:144,alpha:0,stage:'dryHop'}],
  yeast:{name:'Levure Safale US-05',lab:'Fermentis',form:'sèche',qty:1,unit:'sachet',pitchTempC:24,fermTempMinC:12,fermTempMaxC:22,attenuationPct:81,fermentDays:5},
  mash:{ratioLPerKg:3,steps:[{name:'Saccharification',tempC:67,durationMin:60}],mashoutTempC:76,spargeTempC:76,spargeType:'batch'},
  fermentation:[{kind:'primaire',name:'Fermentation primaire',tempC:19,days:10},{kind:'garde',name:'Maturation',tempC:4,days:5}],
  brewhouse:{id:'bh-30',name:'Royal Catering · cuve 45 L',volumeL:24,efficiencyPct:75,boilOffRatePct:10,deadSpaceL:1.5,mashRatioLPerKg:3,
    equipment:{kettleCapacityL:45,kettleWorkingL:35,workingVolumeConfirmed:false,spargeCapacityL:18,fermenterCapacityL:30,fermenterHeadspacePct:20,roPackL:5,boilOffLPerHour:3,grainAbsorptionLPerKg:.96,grainDisplacementLPerKg:.67,coolingShrinkagePct:4,heatingRateCPerMin:.433333333333}},
  waterPlan:{sourceId:'reseau',sourceSnapshot:{id:'reseau',name:'Réseau — Villars-sur-Glâne',ca:85,mg:14,na:8,so4:28,cl:22,hco3:250,ph:7.4,note:'Valeurs de départ, à remplacer par l’analyse du distributeur.',updatedAt:'2026-09-05T10:31:52.207Z'},
    treatmentVersion:2,diRatioPct:50,targetProfileId:'23A',mashWaterL:8.7,spargeWaterL:22.5,allSaltsInMash:true,mash:{gypse:1.2,cacl2:2.8},sparge:{},acid:{id:'lactique',mash:.9,sparge:4.1},disabled:['kcl'],targetPh:5.4},
  steps:[],notes:[]
});
