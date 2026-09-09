import fixture from '../fixtures/nolo-scientific.json';
import pack from '../../src/data/noloBootstrap.json';
import { assertNoloScience,type NoloConfig } from '../../functions/src/noloSchema';
import { evaluateNolo,type NoloInput } from '../../functions/src/noloCore';
const science=pack.find(p=>p.kind==='noloScience');assertNoloScience(science);
const r=(x:number)=>({min:x,max:x});
function input():NoloInput {return {volumeL:24,yeastId:science!.la01.yeastId,yeastName:'LA-01',dryHop:false,
  mash:fixture.la01.mash,fermentation:[{kind:'primaire',tempC:20,days:2}],
  config:{version:1,enabled:true,targetAbvPct:.5,process:'restricted',orientation:'balanced',wort:{ogPlato:null,sugarsGL:{},sugarsComplete:false},operations:[],measurements:[],equipment:[],stabilization:{method:'',validationReference:'',storage:''}}};}
export function runNoloBenchmark(){
  const failures:string[]=[];
  const rows=fixture.la01.points.map(p=>{const i=input();i.config.wort.ogPlato=r(p.plato);const result=evaluateNolo(i,science);const point=result.manufacturerEstimate!;
    if(!point.applicable||result.packagedAbv.max!==null||result.status!=='indeterminate')failures.push('LA-01 : portée de la régression ou incertitude falsifiée.');
    return {plato:p.plato,expected:p.abv,actual:point.range.min,error:point.range.min-p.abv};});
  const rmse=Math.sqrt(rows.reduce((s,r)=>s+r.error*r.error,0)/rows.length);if(rmse>1e-12)failures.push('Reproduction LA-01 incorrecte.');
  const spent=fixture.spent2024.trials.map(t=>{const i=input();i.config.process='secondRunnings';i.yeastId=t.strain;i.yeastName=t.strain;
    i.volumeL=fixture.spent2024.volumeML/1000;i.config.wort={ogPlato:r(fixture.spent2024.ogPlato),sugarsGL:Object.fromEntries(Object.entries(fixture.spent2024.sugarsGL).map(([s,v])=>[s,r(v)])),sugarsComplete:false};
    const result=evaluateNolo(i,science);if(result.packagedAbv.max!==null)failures.push(t.strain+' : profil incomplet devenu résultat numérique.');
    return {strain:t.strain,observedAbv:t.abv,stage:'before-priming',predicted:null,status:result.status};});
  const cold=fixture.cold2022.trials.map(t=>{const i=input();i.yeastId=t.strain;i.yeastName=t.strain;i.config.process='coldContact';i.fermentation=[{kind:'primaire',tempC:1,days:t.hours/24}];
    const result=evaluateNolo(i,science);if(result.packagedAbv.max!==null)failures.push('Contact froid : transfert entre souches/protocoles non établi.');
    return {strain:t.strain,hours:t.hours,observedAbv:t.abv,predicted:null};});
  for(const ph of fixture.stability2026.ph)for(const co2Vol of fixture.stability2026.co2Vol){const i=input();i.config.measurements=[{id:'p',stage:'packaged',date:'2026-09-09',method:'fixture',ph,co2Vol}];
    if(evaluateNolo(i,science).stability.status!=='unverified')failures.push('Certification de conservation fabriquée.');}
  return {engine:'nolo-mass-balance-v1',failures,
    reproduction:{study:'LA-01 / Fermentis 2022',unit:'% vol.',n:rows.length,meanError:rows.reduce((s,r)=>s+r.error,0)/rows.length,rmse,intervalWidth:null,coverage:null,indeterminatePackaging:rows.length,rows},
    external:{spent:{unit:'% vol.',n:spent.length,meanError:null,rmse:null,intervalWidth:null,coverage:null,indeterminate:spent.length,rows:spent},
      cold:{unit:'% vol.',n:cold.length,meanError:null,rmse:null,intervalWidth:null,coverage:null,indeterminate:cold.length,rows:cold}},
    qualitative:{weizen2026:'Conclusions seules, pas de tableau numérique accessible.',stability2026:'Six combinaisons pH/CO₂ : aucune conservation certifiée.',contradictionsPreserved:['YAN 2024 : méthodes 4,47 contre tableau 41,47 mg/L','US-05 2024 : 0,54 % avant resucrage, donc pas ≤0,5 %','Bilan incomplet des sucres 2024 : aucun ajustement forcé','Tdel8 139 h et A15 66 h : durées différentes']},
    conclusion:'La relation fabricant est reproduite. Aucune précision prédictive externe n’est revendiquée sur les cas sans modèle applicable. Les bornes physiques resserrent les scénarios analysés, sans fournir une couverture statistique validée.'};
}
