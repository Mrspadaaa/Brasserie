import {fullRecipe} from './fullRecipe';
import type {Recipe,SaltId} from '../../src/types';
/** Synthetic regression grist; production recipes are supplied privately at QA runtime. */
export function nuageWater(pct=100,all=false):Recipe {
  return {...structuredClone(fullRecipe),name:'QA eau hefeweisse',style:'Hefeweisse',volumeL:24,efficiencyPct:75,boilMin:60,
    fermentables:[
      {name:'Wheat Malt Pale',weightKg:2.9,colorEbc:4,potentialPpg:35.6},
      {name:'Pilsner',weightKg:1.5,colorEbc:3.5,potentialPpg:35.2},
      {name:'Munich Type 1',weightKg:.45,colorEbc:15,potentialPpg:34.3},
      {name:'CARAHELL',weightKg:.2,colorEbc:25,potentialPpg:31},
      {name:'Oat Flakes',weightKg:.15,colorEbc:4.925,potentialPpg:29.6}
    ].map(g=>({...g,kind:'grain' as const,use:'empatage' as const})),
    hops:[],waterPlan:{sourceId:'qa-source',sourceSnapshot:{id:'qa-source',name:'Source indicative',ca:85,mg:14,na:8,so4:28,cl:22,hco3:250,ph:7.4,note:'Valeurs de départ, à remplacer par l’analyse du distributeur.'},
      diRatioPct:pct,mashWaterL:18.2,spargeWaterL:15.4,allSaltsInMash:false,autoTreatment:false,mash:{},sparge:{},
      targetProfileId:'—',targetName:'Ronde et douce',targetIons:{ca:60,cl:80,so4:40},targetPh:5.4,
      disabled:all?[]:['epsom','mgcl2','nacl','nahco3','caco3','chaux','kcl'] as SaltId[],
      acid:{id:'lactique',mash:0,sparge:0}}
  };
}
