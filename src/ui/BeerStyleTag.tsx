import React from 'react';

/** Visual families only: the brewer's own style name is always preserved. */
function styleColors(style: string): string {
  const name = style.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  if (/sour|gose|lambic|gueuze|kriek|berliner|fruit/.test(name)) return 'bg-rose-400/15 text-rose-200 border-rose-300/25';
  if (/stout|porter|schwarz|black|noir|brun|brown|dunkel/.test(name)) return 'bg-violet-400/15 text-violet-200 border-violet-300/25';
  if (/\bipa\b|neipa|i\.p\.a|pale ale|hoppy|houblon/.test(name)) return 'bg-emerald-400/15 text-emerald-200 border-emerald-300/25';
  if (/wit|weiz|wheat|blanche|\bble\b/.test(name)) return 'bg-sky-400/15 text-sky-200 border-sky-300/25';
  if (/saison|farmhouse|belg|tripel|triple|abbaye|dubbel/.test(name)) return 'bg-orange-400/15 text-orange-200 border-orange-300/25';
  if (/amber|ambree|red ale|rousse|bock|marzen|vienn/.test(name)) return 'bg-amber-500/15 text-amber-200 border-amber-300/25';
  if (/pils|lager|helles|blond|gold|kolsch/.test(name)) return 'bg-yellow-400/15 text-yellow-200 border-yellow-300/25';
  return 'bg-slate-400/10 text-slate-200 border-slate-300/20';
}

export function BeerStyleTag({ style }: { style?: string }) {
  const label = style?.trim() || 'Style à préciser';
  return <span title={label} className={`inline-block max-w-full truncate align-middle rounded-md border px-2 text-sm font-medium leading-5 ${styleColors(label)}`}>{label}</span>;
}
