// Briques d'un houblon, dans le langage de Ma bière, partagées par la fiche et par les écrans qui l'importent :
// l'α écrit « lot » d'abord (data-source, D87, D93 B3), l'usage en mot (data-usage comme hopRole, D90), les
// familles qu'un ajout fait bouger avec leur intensité en crans du style (data-famille, data-crans, D80), et la
// part « autres » des mots sans famille (data-role="autres", D100). Classes propres préfixées pq-fiche- (L26).
import { Package } from 'lucide-react';
import { COULEURS, COURT, Picto, nombre, plage } from '../../commun';
import type { HoublonLu } from '../../moteur';
import { hopRole, type FamilyId } from '../../../../src/engine';

/** « lot » quand l'α vient du lot en stock (il fait la dose), « fiches » quand c'est le milieu de la plage variétale. */
export const sourceAlpha = (h: HoublonLu): 'lot' | 'fiches' | null =>
  !h.alpha ? null : /^plage/.test(h.alpha.source) ? 'fiches' : 'lot';

/** α comme sur les voies : la valeur (lot d'abord), puis la plage des fiches ; « ≠ » si le lot en sort.
 * ligne : « α 13 % 9,5–16 » ; colonne : la plage dessous ; fiche : « α 13 % lot · fiches 9,5–16 % ». */
export function AlphaLu({ h, mode = 'ligne', balise = h.cle }: { h: HoublonLu; mode?: 'ligne' | 'colonne' | 'fiche' | 'court'; balise?: string }) {
  const src = sourceAlpha(h);
  if (!h.alpha || !src) {
    return <span data-role="alpha" data-houblon={balise} data-source="fiches" className="font-mono text-sm text-cave-400" title="α inconnu">α ?</span>;
  }
  const { valeur, plage: p, horsFiches } = h.alpha;
  const grand = mode === 'fiche';
  const plageLot = src === 'lot' && p && mode !== 'court' ? (
    <span className={`font-mono text-xs ${horsFiches ? 'text-attention' : 'text-cave-400'} ${mode === 'colonne' ? 'block' : ''}`}>
      {mode === 'fiche' && <span className="font-sans">fiches </span>}{horsFiches ? '≠ ' : ''}{plage(p[0], p[1])}{mode === 'fiche' ? ' %' : ''}
    </span>
  ) : null;
  return (
    <span data-role="alpha" data-houblon={balise} data-source={src}
      className={`${mode === 'colonne' ? 'inline-block leading-tight' : 'inline-flex items-baseline gap-1'} whitespace-nowrap`}>
      <span className={`font-mono ${grand ? 'text-xl font-semibold text-cave-50' : 'text-sm text-cave-50'}`}>
        α{' '}{src === 'fiches' && p ? plage(p[0], p[1]) : nombre(valeur, 1)}{' '}%
      </span>
      {mode === 'fiche' && <span className="text-xs text-cave-400">{src === 'lot' ? 'lot' : 'fiches'}</span>}
      {mode === 'fiche' && plageLot && <span aria-hidden="true" className="text-cave-600">·</span>}
      {plageLot}
    </span>
  );
}

/** Usage en mot, jamais en picto seul (D90) : data-usage et data-source comme hopRole. */
export function Usage({ h }: { h: HoublonLu }) {
  const r = hopRole(h.cle);
  const valeur = r.value ?? 'inconnu';
  const mot = r.value === 'double' ? 'mixte' : r.value ?? 'usage ?';
  return (
    <span data-role="usage" data-usage={valeur} data-source={/^fournisseur/.test(r.source) ? 'fournisseur' : 'règle'} title={r.source}
      className="inline-flex items-center h-5 px-1.5 rounded-full bg-cave-800 text-xs text-cave-200 whitespace-nowrap">{mot}</span>
  );
}

/** Le stock en icône seule (D23 ter) ; le détail est dans la fiche. */
export function StockIcone({ h }: { h: HoublonLu }) {
  if (h.stock == null || h.stock <= 0) return null;
  return <Package role="img" aria-label="en stock" className="w-3.5 h-3.5 text-cave-400 shrink-0" />;
}

/** Intensité d'une famille au style, en crans (0–3 dans la bande, 4 au-dessus, −1 en dessous) : picto et pips. */
export function Intensite({ famille, crans, signe }: { famille: FamilyId; crans: number; signe: 1 | -1 }) {
  const c = Math.max(-1, Math.min(4, Math.round(crans)));
  const au = c >= 4;
  return (
    <span data-famille={famille} data-crans={String(crans)} title={`${COURT[famille]} : ${c} cran${c > 1 ? 's' : ''} du style`}
      className="inline-flex items-center gap-0.5 h-5 pl-0.5 pr-1 rounded-full border border-cave-800 bg-cave-850">
      <Picto famille={famille} taille={14} />
      <span aria-hidden="true" className="font-mono text-2xs leading-none" style={{ color: COULEURS[famille].texte }}>{signe > 0 ? '+' : '−'}</span>
      <span aria-hidden="true" className="inline-flex items-center gap-px">
        {[1, 2, 3].map((i) => (
          <i key={i} className="block w-1 h-2.5 rounded-sm"
            style={{ background: i <= c ? (au ? '#c2410c' : COULEURS[famille].base) : 'rgb(var(--cave-800))' }} />
        ))}
        {au && <i className="block w-1 h-2.5 rounded-sm" style={{ background: '#c2410c' }} />}
      </span>
    </span>
  );
}

/** Part des mots des fiches sans famille (L14, D100) : une forme grise, neutre, à sa part réelle. */
export function Autres({ h, largeur = 56, petit = false, balise = h.nom }: { h: HoublonLu; largeur?: number; petit?: boolean; balise?: string }) {
  const part = h.partSansFamille;
  if (part == null || part <= 0) return null;
  const pc = Math.round(part * 100);
  return (
    <span className={`inline-flex items-center gap-1 ${petit ? 'text-2xs' : 'text-xs'} text-cave-400 whitespace-nowrap`}>
      <i data-role="autres" data-houblon={balise} data-part={part.toFixed(2)} role="img" aria-label={`autres : ${pc} % des mots sans famille`}
        className="pq-fiche-autres block h-2 rounded-sm" style={{ width: Math.max(24, Math.round(largeur * part)) }} />
      autres {pc} %
    </span>
  );
}
