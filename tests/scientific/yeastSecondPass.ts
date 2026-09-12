import fixture from '../fixtures/hopScientific/cui-dm303-2015.json';
import { benchmarkPhenols } from './hopBenchmark';

// Independent least-squares candidate implementation. These exploratory fits
// never become production coefficients or override the published full model.
const features = (z: number[], model: string) => {
  if (model === 'constant') return [1];
  const x = [1, ...z];
  if (model !== 'linear') x.push(...z.map(v => v*v));
  if (model === 'full') for (let i=0;i<4;i++) for(let j=i+1;j<4;j++) x.push(z[i]*z[j]);
  return x;
};
function fit(rows: number[][], model: string, column: number) {
  const x = rows.map(r => features(r.slice(0,4),model)), p=x[0].length;
  const m=Array.from({length:p},(_,i)=>Array.from({length:p+1},(_,j)=>x.reduce((s,r,k)=>s+r[i]*(j===p?rows[k][column]:r[j]),0)));
  for(let i=0;i<p;i++){
    let pivot=i;for(let j=i+1;j<p;j++)if(Math.abs(m[j][i])>Math.abs(m[pivot][i]))pivot=j;
    if(Math.abs(m[pivot][i])<1e-12)throw Error('Unidentifiable candidate');
    [m[i],m[pivot]]=[m[pivot],m[i]];const v=m[i][i];m[i]=m[i].map(a=>a/v);
    for(let j=0;j<p;j++)if(j!==i){const a=m[j][i];m[j]=m[j].map((v,k)=>v-a*m[i][k]);}
  }
  return m.map(r=>r[p]);
}
const dot=(a:number[],b:number[])=>a.reduce((s,x,i)=>s+x*b[i],0);
const metrics=(errors:number[])=>({mae:errors.reduce((s,x)=>s+Math.abs(x),0)/errors.length,rmse:Math.sqrt(errors.reduce((s,x)=>s+x*x,0)/errors.length),scored:errors.length});
export function runYeastSecondPass(){
  const published=benchmarkPhenols();
  const v=fixture.reservedValidation,levels=Object.values(fixture.protocol.levels);
  const z=[v.wheatPct,v.mashInC,v.boilMin,v.fermentC].map((n,i)=>(n-levels[i][1])/(n<levels[i][1]?levels[i][1]-levels[i][0]:levels[i][2]-levels[i][1]));
  const candidates=['constant','linear','quadratic','full'].map(model=>({model,parameters:features([0,0,0,0],model).length,
    results:[4,5].map(column=>{
      const errors=fixture.rows.map((held,i)=>dot(features(held.slice(0,4),model),fit(fixture.rows.filter((_,j)=>i!==j),model,column))-held[column]);
      const central=dot(features(z,model),fit(fixture.rows,model,column));
      return {compound:column===4?'4VG':'4VP',unit:'mg/L',internalLeaveOneRunOut:metrics(errors),reservedMeanPrediction:central,reservedMeanAbsoluteError:Math.abs(central-(column===4?v.vgMgL:v.vpMgL))};
    })}));
  const failures:string[]=[];
  const full=candidates.find(c=>c.model==='full')!;
  full.results.forEach((r,i)=>{if(Math.abs(r.reservedMeanPrediction-published.reservedValidation.results[i].predictedMean!)>1e-10)failures.push('Independent OLS disagrees with engine: '+r.compound);});
  // Selection is repeated inside each outer training set. The outer response
  // participates in neither model selection nor coefficient estimation.
  const nested=fixture.rows.map((held,outer)=>{
    const training=fixture.rows.filter((_,j)=>j!==outer);
    const scored=['constant','linear','quadratic','full'].map(model=>{
      try {
        const errors=training.flatMap((row,i)=>[4,5].map(column=>dot(features(row.slice(0,4),model),fit(training.filter((_,j)=>i!==j),model,column))-row[column]));
        return {model,mse:errors.reduce((s,x)=>s+x*x,0)/errors.length};
      } catch { return {model,mse:Infinity}; }
    }).sort((a,b)=>a.mse-b.mse);
    const model=scored[0].model;
    return {model,errors:[4,5].map(column=>dot(features(held.slice(0,4),model),fit(training,model,column))-held[column])};
  });
  return {version:1,scope:'Yeast-only second pass',offline:true,paidAiCalls:0,source:fixture.source,candidates,
    nestedSelection:{criterion:'Mean squared concentration error over both compounds (same mg/L unit), exploratory statistical comparison; not a sensory weighting.',
      selections:Object.fromEntries(candidates.map(c=>[c.model,nested.filter(r=>r.model===c.model).length])),
      results:[0,1].map(i=>({compound:i===0?'4VG':'4VP',unit:'mg/L',...metrics(nested.map(r=>r.errors[i]))})),
      intervalsEvaluated:false,note:'Selection uncertainty has not been calibrated; these central-error diagnostics do not justify narrower production intervals.'},
    interpretation:'Exploratory candidate comparison on one study. Held-out observations never enter each training fit. Choosing a candidate using these diagnostics would require nested selection and an independent validation study. No universal gain or interval coverage is inferred from a held-out mean.',
    productionModel:published,failures};
}
