import React from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, ReferenceLine } from 'recharts';
import { formatCHF } from '../../domain/finance/ledger';

export interface FinanceComparisonPoint {
  month:string;
  label:string;
  expense:number;
  income:number;
  balance:number|null;
}

interface FinanceComparisonChartProps {
  data:readonly FinanceComparisonPoint[];
  cashComplete:boolean;
  cashCents:number|null|undefined;
  selectedMonth?:string|null;
  onSelectMonth?:(month:string)=>void;
}

export function FinanceComparisonChart({data,cashComplete,cashCents,selectedMonth,onSelectMonth}:FinanceComparisonChartProps) {
  const hasBalance=cashComplete&&cashCents!=null;
  const periodDot=(series:'expense'|'income'|'balance',color:string)=>(props:any)=>{
    const cx=Number(props.cx),cy=Number(props.cy),month=props.payload?.month;
    if(!Number.isFinite(cx)||!Number.isFinite(cy)||typeof month!=='string')return null;
    const activate=(event:React.SyntheticEvent<SVGGElement>)=>{event.stopPropagation();onSelectMonth?.(month);};
    return <g data-finance-chart-period={month} data-finance-series={series} aria-hidden="true" onClick={activate} onTouchEnd={activate} style={{cursor:'pointer'}}>
      <circle cx={cx} cy={cy} r={12} fill="transparent" pointerEvents="all"/>
      <circle cx={cx} cy={cy} r={3} fill={color} pointerEvents="none"/>
    </g>;
  };
  const periodLabel=(month:string|number)=>data.find(point=>point.month===String(month))?.label??String(month);
  const compactNumber=(value:number)=>new Intl.NumberFormat('fr-CH',{notation:'compact',maximumFractionDigits:1}).format(Number(value));
  return <div className="finance-chart" data-finance-chart role="group" aria-label="Scénario mensuel à venir en francs suisses : reste dû sur les factures, plans et estimations, avec solde projeté. Sélectionne un mois dans la courbe ou le tableau pour voir les opérations par origine." style={{cursor:'pointer'}}>
    <ResponsiveContainer width="100%" height="100%"><AreaChart data={data} margin={{top:8,right:hasBalance?4:12,left:0,bottom:0}} accessibilityLayer>
      <CartesianGrid stroke="#3D342E" vertical={false}/>
      <XAxis dataKey="month" tick={{fill:'#D8CEC5',fontSize:12}} tickFormatter={value=>periodLabel(value).split(' ')[0].slice(0,4)} minTickGap={28}/>
      <YAxis yAxisId="flows" width={44} tick={{fill:'#D8CEC5',fontSize:12}} tickFormatter={compactNumber}/>
      {hasBalance&&<YAxis yAxisId="balance" orientation="right" width={52} tick={{fill:'#D8CEC5',fontSize:12}} tickFormatter={compactNumber}/>}
      <Tooltip contentStyle={{background:'#221D19',border:'1px solid #574A42',borderRadius:8}} labelFormatter={value=>periodLabel(String(value))} formatter={(value:number,name:string)=>[formatCHF(Math.round(Number(value)*100)),name]}/>
      <Area yAxisId="flows" type="linear" name="Sorties prévues · CHF" dataKey="expense" stroke="#86B9E6" fill="#86B9E6" fillOpacity={.08} dot={periodDot('expense','#86B9E6')} activeDot={{r:7,strokeWidth:2}} isAnimationActive={false}/>
      <Area yAxisId="flows" type="linear" name="Entrées prévues · CHF" dataKey="income" stroke="#A3C97A" fill="#A3C97A" fillOpacity={.08} dot={periodDot('income','#A3C97A')} activeDot={{r:7,strokeWidth:2}} isAnimationActive={false}/>
      {hasBalance&&<Area yAxisId="balance" type="linear" name="Solde estimé · CHF" dataKey="balance" stroke="#D8CEC5" strokeDasharray="5 4" fill="transparent" dot={periodDot('balance','#D8CEC5')} activeDot={{r:7,strokeWidth:2}} isAnimationActive={false}/>}
      {selectedMonth&&<ReferenceLine x={selectedMonth} stroke="#F5F0EA" strokeDasharray="3 3" ifOverflow="extendDomain"/>}
    </AreaChart></ResponsiveContainer>
  </div>;
}
