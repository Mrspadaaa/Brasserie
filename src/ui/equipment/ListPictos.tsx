import React from 'react';

/**
 * Pictos du matériel (za3) : une silhouette par appareil, tracée en deux couches comme la maquette — l'ombre épaisse
 * (`--ombre`) puis le trait d'encre. Une machine inconnue prend la clé à molette, jamais un dessin inventé.
 * Exporté pour la fiche : même dessin dans la liste et dans le détail.
 */
export type PictoKind =
  | 'cuve' | 'ferm' | 'pompe' | 'plaques' | 'ph' | 'dens' | 'refr' | 'caps' | 'bal' | 'frigo' | 'desh' | 'hotte' | 'moulin' | 'cle';

const forme = (kind: PictoKind): React.ReactNode => {
  switch (kind) {
    case 'cuve': return <><path d="M5 7.5h14V18a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2z" /><path d="M4 7.5h16M8.5 5h7" /><path d="M19 16h2.5v2.5" /><path d="M3 10.5h2M19 10.5h2" /></>;
    case 'ferm': return <><path d="M7 3h10v9l-5 5-5-5z" /><path d="M12 17v2.5M8.3 13.3 6.5 21M15.7 13.3 17.5 21" /></>;
    case 'pompe': return <><circle cx="9" cy="13" r="5.5" /><circle cx="9" cy="13" r="1.6" /><path d="M9 7.5h7V4.5h4.5" /><path d="M3.5 20.5h11" /></>;
    case 'plaques': return <><rect x="3.5" y="4" width="3" height="16" rx=".6" /><path d="M9 5v14M11.5 5v14M14 5v14M16.5 5v14" /><rect x="18.5" y="4" width="2.5" height="16" rx=".6" /><path d="M5 2v2M5 20v2" /></>;
    case 'ph': return <><rect x="8" y="2.5" width="8" height="12" rx="2" /><rect x="10" y="5" width="4" height="3.2" rx=".6" /><path d="M10.5 14.5v5a1.5 1.5 0 0 0 3 0v-5" /></>;
    case 'dens': return <><path d="M7 3v16a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V3M5.5 3h13" /><path d="M12 4.5V12" /><ellipse cx="12" cy="15.5" rx="2" ry="3" /><path d="M7 9.5h3M14 9.5h3" /></>;
    case 'refr': return <><path d="M2.5 9.5h4v5h-4z" /><path d="M6.5 10.5h10l4.5-1.5v6l-4.5-1.5h-10" /><path d="M10 10.5V8M13 10.5V8" /></>;
    case 'caps': return <><path d="M10 21.5v-8l1-2v-3h2v3l1 2v8z" /><path d="M9 4.5h6V8H9z" /><path d="M9 6.2 3 9M15 6.2l6 2.8" /></>;
    case 'bal': return <><rect x="3" y="11" width="18" height="9" rx="1.5" /><path d="M5 7.5h14M12 7.5V11" /><rect x="8.5" y="14" width="7" height="3" rx=".6" /></>;
    case 'frigo': return <><rect x="6" y="2.5" width="12" height="19" rx="1.5" /><path d="M6 9h12M9 5v2M9 11.5v4" /></>;
    case 'desh': return <><rect x="5" y="3" width="14" height="18" rx="2" /><path d="M8 7h8M8 9.5h8" /><path d="M12 13s-2 2.3-2 3.5a2 2 0 0 0 4 0c0-1.2-2-3.5-2-3.5z" /></>;
    case 'hotte': return <><path d="M10 2.5h4V9l5.5 6h-15L10 9z" /><path d="M3.5 15h17" /><path d="M8.5 18c1-1 0-1.5 1-2.5M12 18c1-1 0-1.5 1-2.5M15.5 18c1-1 0-1.5 1-2.5" /></>;
    case 'moulin': return <><path d="M5 3h14l-4 7H9z" /><circle cx="9.5" cy="14.5" r="2.5" /><circle cx="14.5" cy="14.5" r="2.5" /><path d="M7 20.5h10" /></>;
    default: return <path d="M14.5 6.5a4 4 0 0 0 5 5L12 19a2.1 2.1 0 0 1-3-3l7.5-7.5a4 4 0 0 1-2-2z" />;
  }
};

const REGLES: [RegExp, PictoKind][] = [
  [/ph[\s-]*metre|ph[\s-]*meter/, 'ph'],
  [/densim/, 'dens'],
  [/refractom/, 'refr'],
  [/pompe/, 'pompe'],
  [/refroidisseur|plaques|echangeur/, 'plaques'],
  [/ferment/, 'ferm'],
  [/ebullition|chaudiere|marmite|cuve/, 'cuve'],
  [/capsul/, 'caps'],
  [/balance/, 'bal'],
  [/frigo|refrigerat|chambre froide/, 'frigo'],
  [/dehumid|deshumid/, 'desh'],
  [/hotte/, 'hotte'],
  [/moulin/, 'moulin'],
];

const sansAccent = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

/** Le dessin d'un appareil d'après son nom ; la clé à molette quand le nom ne dit rien. */
export function pictoKindOf(name: string | undefined): PictoKind {
  const n = sansAccent(name ?? '');
  return REGLES.find(([re]) => re.test(n))?.[1] ?? 'cle';
}

export const EquipmentPicto: React.FC<{ name?: string; kind?: PictoKind; className?: string }> = ({ name, kind, className }) => {
  const k = kind ?? pictoKindOf(name);
  return (
    <svg className={`mt-sil ${className ?? ''}`} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <g className="mt-ombre">{forme(k)}</g>
      <g className="mt-outil">{forme(k)}</g>
    </svg>
  );
};
