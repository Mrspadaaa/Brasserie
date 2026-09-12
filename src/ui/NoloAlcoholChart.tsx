import React from 'react';
import type {NoloBound} from '../../functions/src/noloCore';
const number=(n:number)=>n.toLocaleString('fr-FR',{minimumFractionDigits:2,maximumFractionDigits:2});
// Compare at display precision before moving outward: .29 * 100 is not exactly 29.
const outward=(n:number,upper=false)=>{
  const rounded=Number(n.toFixed(2));
  if(upper&&rounded<n)return rounded+.01;
  if(!upper&&rounded>n)return rounded-.01;
  return rounded;
};
export const noloDisplayRangeLabel=(r:NoloBound)=>r.max===null
  ? r.min>0?'≥ '+number(outward(r.min))+' % vol.':'Données manquantes'
  : number(outward(r.min))+'–'+number(outward(r.max,true))+' % vol.';

/** The horizontal interval represents calculated bounds, never a statistical error bar. */
export function BoundGraph({bound,target,label='Projection au conditionnement',compact=false}:{bound:NoloBound;target:number;label?:string;compact?:boolean}) {
  const upper=Math.max(1,Math.ceil(Math.max(bound.max??0,bound.min,target)));
  const x=(value:number)=>16+408*Math.max(0,Math.min(1,value/upper));
  const color=bound.kind==='measurement'?'#6E9B5B':bound.kind==='experimental'?'#5B8AA6':'#9A8A7E';
  const confidence={low:'faible',medium:'moyenne',high:'élevée'}[bound.confidence];
  return <figure aria-label={label} className="space-y-1" data-nolo-min={bound.min} data-nolo-max={bound.max??'unknown'}>
    <p className={compact?'text-xs text-cave-400':'text-sm text-cave-400'}>{label}</p>
    <figcaption className={compact?'reading text-base':'font-mono text-xl text-cave-50'}>{noloDisplayRangeLabel(bound)}</figcaption>
    {bound.max!==null&&<>
      <svg viewBox="0 0 440 80" className={compact?'w-full max-w-md block':'w-full'} role="img" aria-label="Échelle d’alcool et cible" data-nolo-scale-max={upper}>
        <title>{noloDisplayRangeLabel(bound)} ; cible au maximum {number(target)} % vol.</title>
        <desc>Trait bleu : plage calculée sous hypothèses. Vert : analyse fournie. Doré : limite choisie. Les graduations sont en pourcentage d’alcool par volume.</desc>
        <line x1="16" y1="42" x2="424" y2="42" stroke="#3D342E" strokeWidth="2"/>
        <line x1={x(target)} y1="27" x2={x(target)} y2="52" stroke="#F2C14E" strokeWidth="2"/>
        <text x={Math.max(84,Math.min(356,x(target)))} y="20" textAnchor="middle" fill="#F2C14E" fontSize="22">Cible {number(target)} %</text>
        <g stroke={color} strokeWidth="3">
          <line data-nolo-band x1={x(bound.min)} y1="42" x2={x(bound.max)} y2="42"/>
          <line x1={x(bound.min)} y1="36" x2={x(bound.min)} y2="48"/>
          <line x1={x(bound.max)} y1="36" x2={x(bound.max)} y2="48"/>
        </g>
        <text x="16" y="74" fill="#9A8A7E" fontSize="22">0 %</text>
        <text x="424" y="74" textAnchor="end" fill="#9A8A7E" fontSize="22">{upper.toLocaleString('fr-FR')} %</text>
      </svg>
      <p className="text-xs text-cave-400">{compact?(bound.kind==='measurement'?'Analyse fournie':bound.kind==='experimental'?'Estimation · incertitude expérimentale non chiffrée':'Bornes physiques · pas une prédiction'):<>{bound.kind==='measurement'?'Analyse fournie':bound.kind==='experimental'?'Projection conditionnelle · incertitude expérimentale non chiffrée':'Bornes physiques · pas une prédiction'} · confiance {confidence}</>}</p>
    </>}
  </figure>;
}
