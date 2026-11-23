import { sources as s } from './sources.mjs';
/** Published Table 2, original run order, not digitized from a plot. */
export const phenolStudy={
 id:'cui-2015-dm303',name:'4VG et 4VP — expérience DM303',yeastId:'doemens-dm303',source:s.cui,
 scope:'DM303, 11 °P, 8 millions de cellules/mL, 10 hL dans une cuve de 20 hL. Mash-in : 37 °C/20 min, 44 °C/30 min ou 52 °C/40 min ; puis 65 °C/70 min, 72 °C/15 min et mash-out 78 °C, rampes 1 °C/min. Même moût, houblonnage, oxygénation et fin de fermentation que le protocole publié.',
 limitations:[
  'Reproduction locale de l’étude, jamais prédiction automatique de la recette ni d’une autre souche.',
  '4VG et 4VP chimiques en mg/L : aucune conversion en intensité sensorielle.',
  'Intervalle nominal pour UNE nouvelle observation du même procédé ; résidus supposés indépendants, gaussiens et de variance constante. Pas de couverture garantie pour une autre bière.',
  'Le mash-in modifie température ET durée : trois protocoles discrets, pas de causalité thermique isolée.',
  'Interpolation limitée à l’enveloppe convexe Box–Behnken ; les coins de la boîte ne sont pas documentés.',
  'Validation publiée : moyennes de trois répétitions ; données individuelles et variance indisponibles.'
 ],
 levels:{wheatPct:[40,45,50],mashInC:[37,44,52],boilMin:[70,90,110],fermentC:[16,18,20]},
 mashHoldMin:[20,30,40],wortPlato:11,pitchMillionCellsMl:8,
 observations:[
  [0,1,0,1,2.106,1.295],
  [0,1,-1,0,1.959,.952],
  [0,-1,1,0,2.065,1.059],
  [1,0,0,1,2.006,1.003],
  [0,0,0,0,2.296,1.324],
  [0,-1,-1,0,2.191,1.187],
  [0,0,0,0,2.367,1.197],
  [1,-1,0,0,2.089,1.069],
  [0,0,0,0,2.476,1.468],
  [-1,-1,0,0,2.261,1.256],
  [-1,0,1,0,2.321,1.309],
  [0,0,1,1,2.319,1.321],
  [-1,0,0,-1,2.256,1.249],
  [-1,0,-1,0,2.292,1.287],
  [0,-1,0,-1,2.084,1.076],
  [0,0,0,0,2.319,1.372],
  [-1,0,0,1,2.401,1.396],
  [0,0,-1,1,2.368,1.373],
  [1,0,1,0,1.953,.947],
  [0,0,1,-1,2.078,1.091],
  [1,0,0,-1,1.878,.859],
  [0,-1,0,1,2.221,1.209],
  [-1,1,0,0,2.203,1.198],
  [0,0,0,0,2.205,1.294],
  [1,1,0,0,1.764,.765],
  [0,0,-1,-1,2.097,1.082],
  [0,1,0,-1,1.901,.908],
  [1,0,-1,0,1.827,.821],
  [0,1,1,0,2.117,1.109]
 ].map(r=>({coded:r.slice(0,4),vgMgL:r[4],vpMgL:r[5]})),
 prediction:{coverage:.95,criticalT:2.145,df:14,source:s.nist},
 validation:{wheatPct:40,mashInC:44,boilMin:88,fermentC:19.5,n:3,vgMgL:2.418,vpMgL:1.402}
};
