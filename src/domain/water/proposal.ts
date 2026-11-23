import type { SaltId, WaterSource } from '../../types';
import { SALT_IDS } from './substances';
import { calculateWaterTreatment, type TreatmentInput } from './treatment';
import type { RaBand } from './mashPh';

/** One preparation proposal for recommendation, dosing, recalculation and save.
 * A retained dose is a constraint; a disabled salt always wins over saved doses. */
export function completeWaterProposal(source:WaterSource,input:TreatmentInput,band:RaBand,
  disabled:SaltId[]=[],retained?:TreatmentInput['saltSplit']) {
  const clean=(d:Partial<Record<SaltId,number>>)=>Object.fromEntries(Object.entries(d).filter(([id])=>!disabled.includes(id as SaltId)));
  let treatment=calculateWaterTreatment(source,{...input,doses:clean(input.doses),saltSplit:undefined},band);
  const split=structuredClone(treatment.split);
  for(const side of ['mash','sparge'] as const) {
    Object.assign(split[side],clean(retained?.[side]??{}));
    for(const id of disabled)delete split[side][id];
  }
  const doses=Object.fromEntries(SALT_IDS.map(id=>[id,(split.mash[id]??0)+(split.sparge[id]??0)]).filter(([,v])=>Number(v)>0));
  if(retained&&Object.values(retained).some(side=>Object.keys(side).length))
    treatment=calculateWaterTreatment(source,{...input,doses,saltSplit:split},band);
  const mashRoL=input.mashWaterL*input.diRatioPct/100;
  const spargeRoL=input.spargeWaterL*(input.spargeDiRatioPct??input.diRatioPct)/100;
  return {diRatioPct:input.diRatioPct,spargeDiRatioPct:input.spargeDiRatioPct,doses,split:treatment.split,
    acid:{id:input.acidId,mash:treatment.mashAcid.amount,sparge:treatment.spargeAcid.amount},
    volumes:{mashRoL,spargeRoL,totalRoL:mashRoL+spargeRoL,
      tapL:input.mashWaterL+input.spargeWaterL-mashRoL-spargeRoL,totalL:input.mashWaterL+input.spargeWaterL},
    treatment};
}
