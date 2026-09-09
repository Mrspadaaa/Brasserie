import type { estimateMashPh } from './mashPh';
/** The estimate's own stated band is used; no extra pH tolerance is invented. */
export function mashPhDiagnostic(estimate:ReturnType<typeof estimateMashPh>|null|undefined,target:number) {
  if(!estimate?.known||estimate.limited)return {status:'unknown' as const,message:'pH d’empâtage à mesurer ou à titrer ; modèle non applicable.'};
  const delta=estimate.phPredicted-target;
  const outside=Math.abs(delta)>estimate.uncertainty;
  return {status:outside?'outside' as const:'unverified' as const,delta,
    message:'pH estimé '+estimate.phPredicted.toFixed(2).replace('.',',')+' ± '+estimate.uncertainty.toString().replace('.',',')+
      ' ; consigne '+target.toString().replace('.',',')+'. '+(outside?'Consigne hors de la plage estimée. Mesurer puis titrer la maische avant de corriger.':'À mesurer au brassage.'),
    limitation:'Les acides calculés neutralisent l’alcalinité ; ces doses ne garantissent pas la consigne de pH.'};
}
