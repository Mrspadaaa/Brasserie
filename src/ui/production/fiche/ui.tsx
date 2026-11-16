import React from 'react';

/** Pièces communes de la fiche portée (e1a, e2a, e4c) : la trousse de la maquette en Tailwind aux jetons de l'app. */

export type Ton = 'hop' | 'water' | 'attention' | 'alert' | 'gold' | 'copper' | 'neutre';
const TONS: Record<Ton, string> = {
  hop: 'bg-hop/15 border-hop/50 text-hop',
  water: 'bg-water/15 border-water/50 text-water',
  attention: 'bg-attention/15 border-attention/50 text-attention',
  alert: 'bg-alert/15 border-alert/50 text-alert',
  gold: 'bg-ebc-gold/15 border-ebc-gold/50 text-ebc-amber',
  copper: 'bg-ebc-copper/15 border-ebc-copper/50 text-ebc-copper',
  neutre: 'bg-cave-850 border-cave-700 text-cave-200'
};
export const TON_BLOC: Record<Ton, string> = {
  hop: 'bg-hop/10 border-hop/55', water: 'bg-water/10 border-water/55', attention: 'bg-attention/10 border-attention/50',
  alert: 'bg-alert/10 border-alert/50', gold: 'bg-ebc-gold/10 border-ebc-gold/55', copper: 'bg-ebc-copper/10 border-ebc-copper/55',
  neutre: 'bg-cave-850 border-cave-700'
};

export const Pastille: React.FC<{ ton?: Ton; className?: string; children: React.ReactNode }> = ({ ton = 'neutre', className = '', children }) => (
  <span className={`inline-flex items-center gap-1 min-h-6 px-2 rounded-full border text-xs ${TONS[ton]} ${className}`}>{children}</span>
);

export const Panneau: React.FC<{ className?: string; label?: string; children: React.ReactNode }> = ({ className = '', label, children }) => (
  <section aria-label={label} className={`rounded-xl border border-cave-800 bg-cave-900 ${className}`}>{children}</section>
);

export const Mono: React.FC<{ className?: string; children: React.ReactNode }> = ({ className = '', children }) => (
  <span className={`font-mono tabular-nums ${className}`}>{children}</span>
);

/** Titre-réponse (id-display). */
export const Titre: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <h2 className={`text-2xl font-semibold leading-tight text-cave-50 ${className}`}>{children}</h2>
);

/** Bouton de 44 px de cible tactile (par pseudo-élément) et 32 à 40 px visibles. */
export const Cible: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & { ton?: 'sec' | 'prim' | 'danger'; plein?: boolean }> =
  ({ ton = 'sec', plein, className = '', children, ...rest }) => (
    <button type="button" {...rest}
      className={`relative min-h-10 px-3 rounded-control text-sm font-semibold inline-flex items-center justify-center gap-1 after:content-[''] after:absolute after:inset-x-0 after:top-1/2 after:h-11 after:-translate-y-1/2 disabled:opacity-50 ${plein ? 'w-full' : ''} ${
        ton === 'prim' ? 'bg-ebc-straw text-cave-950' : ton === 'danger' ? 'border border-alert/50 text-alert' : 'bg-cave-850 text-cave-50 border border-cave-700'} ${className}`}>
      {children}
    </button>
  );

export const Puce: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & { actif?: boolean }> = ({ actif, className = '', children, ...rest }) => (
  <button type="button" aria-pressed={!!actif} {...rest}
    className={`relative min-h-8 px-3 rounded-full border text-sm inline-flex items-center justify-center gap-1 after:content-[''] after:absolute after:inset-x-0 after:top-1/2 after:h-11 after:-translate-y-1/2 ${actif ? 'border-hop bg-hop/15 text-cave-50 font-semibold' : 'border-cave-700 bg-cave-950 text-cave-200'} ${className}`}>
    {children}
  </button>
);

export interface Grad { at: number; text: string; cible?: boolean }
export interface Segment { de: number; a: number; ton: 'hop' | 'attention' | 'alert' }
const SEG: Record<Segment['ton'], string> = { hop: 'bg-hop/55', attention: 'bg-attention/55', alert: 'bg-alert/55' };

/**
 * Curseur m2 : un rail, une cible en bande (jamais un point), des graduations posées sur les bonnes valeurs, un pouce de 24 px.
 * La saisie est un `input[type=range]` transparent de 44 px de haut : tactile, clavier et lecteurs d'écran.
 */
export const Curseur: React.FC<{
  label: string; min: number; max: number; step?: number; value: number; onChange: (v: number) => void;
  cible?: [number, number] | null; grads?: Grad[]; segments?: Segment[]; format?: (v: number) => string;
  /** Graduations de jours (« di 15 », « lu 16 ») : police du texte, pas la chasse fixe, pour que les mots ne se collent pas. */
  gradsSans?: boolean;
}> = ({ label, min, max, step = 1, value, onChange, cible, grads = [], segments, format, gradsSans }) => {
  const pct = (v: number) => `${Math.max(0, Math.min(100, ((v - min) / (max - min)) * 100))}%`;
  return (
    <div className="relative pt-5" data-curseur>
      <div className={`absolute inset-x-0 top-0 h-5 text-xs text-cave-400 ${gradsSans ? 'font-sans' : 'font-mono'}`} aria-hidden="true">
        {grads.map(g => <span key={g.at} className={`absolute whitespace-nowrap ${g.cible ? 'font-semibold text-hop' : ''}`} style={{ left: pct(g.at), transform: g.at <= min ? 'none' : g.at >= max ? 'translateX(-100%)' : 'translateX(-50%)' }}>{g.text}</span>)}
      </div>
      <div className="relative h-11">
        {segments
          ? <div className="absolute inset-x-0 top-[14px] h-2 flex gap-0.5 rounded-sm overflow-hidden" aria-hidden="true">
              {segments.map((s, i) => <i key={i} className={`flex-1 ${SEG[s.ton]}`} />)}
            </div>
          : <div className="absolute inset-x-0 top-[17px] h-1.5 rounded-full bg-cave-800" aria-hidden="true" />}
        {cible && <div className="absolute top-[13px] h-3 rounded-sm border border-hop bg-hop/30" aria-hidden="true" style={{ left: pct(cible[0]), width: `calc(${pct(cible[1])} - ${pct(cible[0])})` }} />}
        <span className="absolute top-[18px] -translate-x-1/2 -translate-y-1/2 pointer-events-none" aria-hidden="true" style={{ left: pct(value) }}>
          <i className="absolute left-1/2 -top-3 h-3 w-0.5 -translate-x-1/2 bg-hop" />
          <b className="block h-6 w-6 rounded-full border-2 border-cave-950 bg-hop ring-2 ring-hop/60" />
        </span>
        <input type="range" min={min} max={max} step={step} value={value} aria-label={label}
          aria-valuetext={format ? format(value) : undefined}
          onChange={e => onChange(Number(e.target.value))}
          className="absolute inset-0 h-11 w-full cursor-pointer opacity-0" />
      </div>
    </div>
  );
};

export const Pas: React.FC<{ onMoins: () => void; onPlus: () => void; moins: string; plus: string; gauche?: React.ReactNode; chevrons?: boolean }> = ({ onMoins, onPlus, moins, plus, chevrons }) => (
  <span className="flex gap-3">
    <Cible aria-label={moins} onClick={onMoins} className="w-10 px-0 text-lg">{chevrons ? '‹' : '−'}</Cible>
    <Cible aria-label={plus} onClick={onPlus} className="w-10 px-0 text-lg">{chevrons ? '›' : '+'}</Cible>
  </span>
);
