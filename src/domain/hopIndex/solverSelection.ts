import type { HopVariety } from '../../../functions/src/hopIndexSchema';
import type { HopKnowledge, HopYeast } from '../../../functions/src/hopPredictionSchema';
import type { HopSolverIntent, HopSolverPolicy } from '../../../functions/src/hopSolverSchema';

export type HopSearchMode = 'quick' | 'exhaustive';
// Computational budgets, not biological coefficients or confidence weights.
export const HOP_QUICK_LIMITS = { varieties: 24, yeasts: 8, variants: 2048 } as const;
export interface HopSearchCoverage {
  mode: HopSearchMode; fullTotal: number; total: number; limited: boolean;
  varieties: { selected: number; available: number };
  yeasts: { selected: number; available: number };
}

/** Documentary ordering only. Unknowns are not treated as zero aroma or forbidden.
 * Every compatible published programme is retained separately by the solver. */
export function selectHopSearchDomain(input: {
  mode: HopSearchMode; varieties: HopVariety[]; yeasts: HopYeast[]; valid: HopKnowledge[];
  policy: HopSolverPolicy; intent: HopSolverIntent; wanted: string[]; conditions: number; trials: number;
  currentYeast?: string; recipeVarieties: Set<string>; primaryTemperature?: number;
  descriptorFamilies: (varietyId: string) => Set<string>;
}) {
  const {varieties,yeasts,conditions,trials,mode,policy,intent,valid}=input;
  const fullTotal=trials+varieties.length*yeasts.length*conditions;
  let selectedVarieties=varieties,selectedYeasts=yeasts;
  if(mode==='quick'&&fullTotal>HOP_QUICK_LIMITS.variants+trials&&conditions>0){
    const trainedYeasts=new Set<string>(),trainedVarieties=new Set<string>();
    for(const row of valid){
      if(row.kind==='extrapolation'&&row.enabled)row.yeasts.forEach(y=>trainedYeasts.add(y.yeastId));
      if(row.kind==='model'&&row.enabled){trainedYeasts.add(row.scope.yeastId);trainedVarieties.add(row.scope.varietyId);}
      if(row.kind==='trial'){trainedYeasts.add(row.yeastId);row.hops.forEach(h=>trainedVarieties.add(h.varietyId));}
      if(row.kind==='fermentation'&&row.enabled)trainedYeasts.add(row.yeastId);
    }
    const phenols=new Map<string,Set<string>>();
    policy.yeastPhenols.forEach(p=>{const set=phenols.get(p.yeastId)??new Set<string>();set.add(p.status);phenols.set(p.yeastId,set);});
    const operating=new Map((policy.yeastConditions??[]).map(p=>[p.yeastId,p.temperatureC]));
    const yeastRank=(y:HopYeast)=>{
      const statuses=phenols.get(y.id),p=statuses?.size===1?[...statuses][0]:undefined;
      const wantedPof=intent.chemistry.phenols==='seek'?'positive':'negative';
      const pofConflict=!!intent.chemistry.phenols&&!!p&&p!==wantedPof;
      const window=operating.get(y.id),t=input.primaryTemperature;
      const outside=t!==undefined&&window&&(t<window.min||t>window.max);
      return [Number(y.id!==input.currentYeast),Number(pofConflict),Number(!!outside),
        Number(!trainedYeasts.has(y.id)),Number(!!intent.chemistry.phenols&&p!==wantedPof),
        Number(intent.chemistry.thiols==='seek'&&y.betaLyase!=='positive')];
    };
    const varietyRank=(v:HopVariety)=>{
      const families=input.descriptorFamilies(v.id);
      return [intent.avoid.filter(id=>families.has(id)).length,Number(!input.recipeVarieties.has(v.id)),
        -input.wanted.filter(id=>families.has(id)).length,Number(!trainedVarieties.has(v.id))];
    };
    const compare=(a:number[],b:number[])=>{for(let i=0;i<a.length;i++)if(a[i]!==b[i])return a[i]-b[i];return 0;};
    // Rank keys are computed once, rather than repeatedly during Array.sort.
    selectedYeasts=yeasts.map(y=>({y,rank:yeastRank(y)})).sort((a,b)=>compare(a.rank,b.rank)||a.y.id.localeCompare(b.y.id))
      .slice(0,HOP_QUICK_LIMITS.yeasts).map(r=>r.y);
    const varietyLimit=Math.max(1,Math.min(HOP_QUICK_LIMITS.varieties,Math.floor(HOP_QUICK_LIMITS.variants/(Math.max(1,selectedYeasts.length)*conditions))));
    selectedVarieties=varieties.map(v=>({v,rank:varietyRank(v)})).sort((a,b)=>compare(a.rank,b.rank)||a.v.id.localeCompare(b.v.id))
      .slice(0,varietyLimit).map(r=>r.v);
  }
  const total=trials+selectedVarieties.length*selectedYeasts.length*conditions;
  const coverage:HopSearchCoverage={mode,fullTotal,total,limited:total<fullTotal,
    varieties:{selected:selectedVarieties.length,available:varieties.length},
    yeasts:{selected:selectedYeasts.length,available:yeasts.length}};
  return {varieties:selectedVarieties,yeasts:selectedYeasts,coverage};
}
