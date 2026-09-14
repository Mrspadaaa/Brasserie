import React from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { formatCHF } from '../../domain/finance/ledger';

export interface FinanceComparisonPoint {
  label:string;
  expense:number;
  balance:number|null;
}

interface FinanceComparisonChartProps {
  data:readonly FinanceComparisonPoint[];
  cashComplete:boolean;
  cashCents:number|null|undefined;
}

export function FinanceComparisonChart({data,cashComplete,cashCents}:FinanceComparisonChartProps) {
  return <div className="finance-chart" role="img" aria-label="Évolution mensuelle, montants exacts dans le tableau suivant"><ResponsiveContainer width="100%" height="100%"><AreaChart data={data} margin={{top:8,right:12,left:0,bottom:0}}><CartesianGrid stroke="#3D342E" vertical={false}/><XAxis dataKey="label" tick={{fill:'#D8CEC5',fontSize:12}} tickFormatter={v=>v.split(' ')[0].slice(0,4)} minTickGap={28}/><YAxis width={48} tick={{fill:'#D8CEC5',fontSize:12}}/><Tooltip contentStyle={{background:'#221D19',border:'1px solid #574A42',borderRadius:8}} formatter={(v:number,name:string)=>[formatCHF(Math.round(v*100)),name==='expense'?'Sorties prévues':'Trésorerie']}/><Area type="linear" dataKey="expense" stroke="#86B9E6" fill="#86B9E6" fillOpacity={.08} isAnimationActive={false}/>{cashComplete&&cashCents!=null&&<Area type="linear" dataKey="balance" stroke="#D8CEC5" strokeDasharray="5 4" fill="transparent" isAnimationActive={false}/>}</AreaChart></ResponsiveContainer></div>;
}
