import { buildSync } from 'esbuild';
import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { performance } from 'node:perf_hooks';

const root = resolve(import.meta.dirname, '..');
const out = resolve(root, 'node_modules/.water-compare');
mkdirSync(out, {recursive:true});
const load = async (name, entry) => {
  const outfile=resolve(out,name+'.mjs');
  buildSync({entryPoints:[resolve(root,entry)],bundle:true,platform:'node',format:'esm',outfile});
  return import(pathToFileURL(outfile).href);
};
const W=await load('water','src/domain/water/index.ts');
const S=await load('styles','src/domain/waterStyles.ts');
const P=await load('practice','src/domain/water/practice.ts');
const M=await load('minerals','src/domain/water/mineralSolver.ts');
const L=await load('lsq','src/domain/water/lsq.ts');
// Explicit baseline, reproducible after future commits (no copy of old code).
const baseline=process.argv.find(a=>a.startsWith('--baseline='))?.slice(11) ?? '6c4c409';
const source=execFileSync('git',['show',`${baseline}:src/domain/water.ts`],{cwd:root,encoding:'utf8'});
const oldFile=resolve(out,'old.mjs');
buildSync({stdin:{contents:source,loader:'ts',resolveDir:resolve(root,'src/domain')},bundle:true,platform:'node',format:'esm',outfile:oldFile});
const old=await import(pathToFileURL(oldFile).href);
const zero={ca:0,mg:0,na:0,so4:0,cl:0,hco3:0};
const angles={ca:49,mg:1.1,na:1.9,so4:7.1,cl:1.3,hco3:157.4};
// Historical profiles are test fixtures from the baseline, NOT current city analyses.
const waters=[['Osmosée',zero],['Angles',angles],['Fribourg (indicatif)',{ca:85,mg:14,na:8,so4:28,cl:22,hco3:250}],
 ...old.TARGET_PROFILES.slice(0,7).map(w=>[w.name,w]),
 ['Dure synthétique',{ca:180,mg:30,na:30,so4:60,cl:80,hco3:400}],
 ['Salée synthétique',{ca:40,mg:10,na:180,so4:80,cl:280,hco3:80}]];
const EBC={'01A':5,'05B':7,'05D':7,'04A':8,'06C':45,'08B':60,'10A':8,'11C':20,'13C':50,'15B':80,'16A':70,'20C':90,'18B':14,'21A':12,'21B':70,'21C':10,'23A':6,'27':6,'24A':6,'24C':16,'25B':8,'26C':9,'26D':40,'NA-BLONDE':8,'NA-IPA':10,'NA-WEISS':8,'NA-STOUT':70,'NA-LAGER':6,'—':15};
const rows=[];
let violations=0, iterations=0;
for(const [waterName,start] of waters) for(const style of S.STYLE_WATERS) {
 const ratio=(style.ratio.min+style.ratio.max)/2;
 const target=W.rebalanceRatio(S.midpoint(style),ratio);
 const ranges=Object.fromEntries(Object.entries(style.ions).map(([ion,r])=>[ion,{min:Math.min(r.min,target[ion]),max:Math.max(r.max,target[ion])}]));
 const input={start,target,ranges,totalWaterL:30,mashWaterL:20,targetRa:W.targetRaForColor(EBC[style.code]),ratio};
 const before=old.solveSalts(input);
 for(const mode of ['minimum','target','modest']) {
  const t0=performance.now();
  const r=W.solveSalts({...input,mineralTargetMode:mode});
  const ms=performance.now()-t0;
  const goal=P.mineralTarget(target,ranges,mode);
  const weights=style.ions.na.min>=40?[1,.5,8,2,2]:M.ION_WEIGHTS;
  // Lower bound for MINERALS ONLY, holding this plan's alkaline salts fixed.
  // This is not a proof of a global optimum over alkalinity, acid and minerals.
  const alk=Object.fromEntries(Object.entries(r.doses).filter(([id])=>W.ALKALINE_SALTS.includes(id)));
  const fixed=W.addIons(start,W.ionsFromSalts(alk,30));
  const A=M.TASTE_IONS.map(ion=>M.FLAVOUR_SALTS.map(id=>(W.saltIons(id)[ion]??0)/30));
  const room=M.TASTE_IONS.map(ion=>Math.max(0,ranges[ion].max-fixed[ion]));
  const k=M.FLAVOUR_SALTS.map(id=>id==='kcl'?524.4/30:0);
  const fit=L.constrainedLeastSquares(A.map((r,i)=>r.map(v=>v*Math.sqrt(weights[i]))),M.TASTE_IONS.map((ion,i)=>(goal[ion]-fixed[ion])*Math.sqrt(weights[i])),[...A,k],[...room,50]);
  const lowerBound=Math.sqrt(fit.squaredError/weights.reduce((s,v)=>s+v,0));
  const error=M.mineralError(r.achievedWort,goal,weights);
  const excess=M.TASTE_IONS.filter(ion=>r.achievedWort[ion]>Math.max(start[ion],ranges[ion].max)+.15);
  if(excess.length || (r.doses.kcl??0)*524.4/30>50+1e-6) violations++;
  if(r.issues?.some(i=>i.code==='iteration')) iterations++;
  rows.push({water:waterName,style:style.code,mode,error,oldError:M.mineralError(before.achievedWort,goal,weights),lowerBound,gap:error-lowerBound,
   salts:Object.keys(r.doses).length,ms,ra:W.residualAlkalinity(r.achievedMash),oldRa:W.residualAlkalinity(before.achievedMash),raTarget:input.targetRa.min,
   convergence:r.convergence,issues:r.issues,doses:r.doses,ions:r.achievedWort,oldDoses:before.doses,excess});
 }
}
const target={ca:100,mg:25,na:15,so4:100,cl:111,hco3:0};
const ranges=Object.fromEntries(Object.entries(target).map(([ion,v])=>[ion,{min:0,max:Math.max(100,v*1.5)}]));
const reference=W.solveSalts({start:angles,target,ranges,totalWaterL:30,mashWaterL:30,mineralTargetMode:'target'});
const times=[];
for(let i=0;i<30;i++) {
 const style=S.styleByCode('05D'), t0=performance.now();
 W.minimalDilution({source:waters[2][1],target:S.midpoint(style),ranges:style.ions,totalWaterL:30,mashWaterL:20,spargeWaterL:10,targetRa:W.targetRaForColor(7),acid:'lactique',beerVolumeL:25});
 times.push(performance.now()-t0);
}
times.sort((a,b)=>a-b);
const aggregates=['minimum','target','modest'].map(mode=>{
 const rs=rows.filter(r=>r.mode===mode);
 return {mode,cases:rs.length,meanError:rs.reduce((s,r)=>s+r.error,0)/rs.length,meanSalts:rs.reduce((s,r)=>s+r.salts,0)/rs.length,
  nearBound:rs.filter(r=>r.gap<3).length,worseThanOld:rs.filter(r=>r.error>r.oldError+0.1).length,
  meanMg:rs.reduce((s,r)=>s+r.ions.mg,0)/rs.length,meanNa:rs.reduce((s,r)=>s+r.ions.na,0)/rs.length};
});
const result={baseline,reference,aggregates,violations,iterations,dilutionMs:{median:times[15],p95:times[28],max:times[29]},rows};
mkdirSync(resolve(root,'docs'),{recursive:true});
writeFileSync(resolve(root,'docs/water-solver-comparison.json'),JSON.stringify({
 ...result, rows: undefined,
 compromises: rows.filter(r=>r.convergence==='bounded' || (r.mode==='minimum' && r.error>r.oldError+1))
},null,2)+'\n');
const csv=['water,style,mode,error_ppm,old_error_ppm,conditional_lower_bound_ppm,gap_ppm,salts,ms,ra,doses',
 ...rows.map(r=>[r.water,r.style,r.mode,r.error.toFixed(3),r.oldError.toFixed(3),r.lowerBound.toFixed(3),r.gap.toFixed(3),r.salts,r.ms.toFixed(2),r.ra,JSON.stringify(r.doses)].map(v=>'"'+String(v).replaceAll('"','""')+'"').join(','))].join('\n');
writeFileSync(resolve(root,'docs/water-solver-comparison.csv'),csv+'\n');
console.log(JSON.stringify({...result,rows:undefined},null,2));
if(violations || M.TASTE_IONS.some(ion=>Math.abs(reference.achievedWort[ion]-target[ion])>=3)) process.exitCode=1;
