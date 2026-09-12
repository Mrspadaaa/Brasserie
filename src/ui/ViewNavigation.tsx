import React from 'react';
import { ChevronDown } from 'lucide-react';
import { useMobileLayout } from './useViewport';

/** Keep destinations visible on phones, with one-tap access and horizontal overflow only. */
export function ViewNavigation<T extends string>({ label, value, options, onChange, children, panelIdPrefix }: {
  label: string;
  value: T;
  options: ReadonlyArray<{ value: NoInfer<T>; label: string; shortLabel?: string }>;
  onChange: (value: T) => void;
  children: React.ReactNode;
  panelIdPrefix?: string;
}) {
  const mobile = useMobileLayout();
  const navigation = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    const strip = navigation.current;
    const selected = strip?.querySelector<HTMLButtonElement>('[aria-pressed="true"], [aria-selected="true"]');
    if (!strip || !selected) return;
    // Reveal the restored destination without scrolling the page away from its content.
    const left = selected.offsetLeft - 4;
    const right = selected.offsetLeft + selected.offsetWidth + 4;
    if (left < strip.scrollLeft) strip.scrollLeft = left;
    else if (right > strip.scrollLeft + strip.clientWidth) strip.scrollLeft = right - strip.clientWidth;
  }, [value, mobile]);
  if (!mobile) return <>{children}</>;
  return <div ref={navigation} role={panelIdPrefix ? 'tablist' : 'group'} aria-label={label}
    className="relative min-w-0 flex gap-0.5 overflow-x-auto overscroll-x-contain scrollbar-none rounded-control border border-cave-800 bg-cave-900 p-1">
    {options.map((option, index) => <button key={option.value} type="button"
      role={panelIdPrefix ? 'tab' : undefined}
      aria-label={option.label}
      aria-pressed={panelIdPrefix ? undefined : value === option.value}
      aria-selected={panelIdPrefix ? value === option.value : undefined}
      aria-controls={panelIdPrefix ? `${panelIdPrefix}${option.value}` : undefined}
      tabIndex={panelIdPrefix && value !== option.value ? -1 : 0}
      onClick={() => onChange(option.value)}
      onKeyDown={event => {
        if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
        event.preventDefault();
        const next = event.key === 'Home' ? 0 : event.key === 'End' ? options.length - 1
          : (index + (event.key === 'ArrowRight' ? 1 : options.length - 1)) % options.length;
        onChange(options[next].value);
        navigation.current?.querySelectorAll('button')[next]?.focus({ preventScroll: true });
      }}
      className={`min-h-touch min-w-max flex-1 shrink-0 whitespace-nowrap rounded-lg px-1.5 text-sm font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-water ${value === option.value ? 'bg-ebc-straw text-cave-950' : 'text-cave-200 hover:bg-cave-850'}`}>
      {option.shortLabel ?? option.label}
    </button>)}
  </div>;
}

/** Secondary information is available on demand, without adding a second screen. */
export function MobileDetails({ title, summary, children, className = '' }: {
  title: string; summary?: React.ReactNode; children: React.ReactNode; className?: string;
}) {
  const mobile = useMobileLayout();
  if (!mobile) return <>{children}</>;
  return <details className={`group/view rounded-control border border-cave-800 bg-cave-900/50 ${className}`}>
    <summary className="list-none min-h-touch px-3 flex items-center gap-2 cursor-pointer rounded-control focus-visible:outline focus-visible:outline-2 focus-visible:outline-water">
      <span className="min-w-0 flex-1 text-sm font-medium text-cave-200">{title}{summary && <span className="block text-xs font-normal text-cave-400 mt-0.5">{summary}</span>}</span>
      <ChevronDown className="h-4 w-4 shrink-0 text-cave-400 group-open/view:rotate-180" aria-hidden="true"/>
    </summary>
    <div className="px-3 pb-3 space-y-3 min-w-0">{children}</div>
  </details>;
}
