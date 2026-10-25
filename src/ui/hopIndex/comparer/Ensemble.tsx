// Les étapes ensemble (D107). cmc2d (« Ajouter un ? Explicatif pour ces données. Utiliser les pastilles comme c'etait de
// base ») : le tableau de la maquette de base (captures/base-jouable.png) : le moment choisi dans une pastille noire,
// chaque valeur avec sa petite barre à la couleur de la famille de la pastille, et le trait gris de ta référence (ton
// Nugget) au même moment ; nos cinq moments, les nombres et les ★ gardés. Barres (D68) : « Au style », la règle D67 au
// moment (la plus grande barre de la ligne remplit sa piste ; sous 0,05 cran : « ~0 », sans barre) ; « Absolu », brutes,
// sur une échelle fixe (0 à 4 crans) commune à tous les moments. cmc2i : le « ? » explicatif est au bout de la barre des
// moments, son signe dessiné en SVG au centre de son rond.
import { termes } from './hote';
import { useEffect, useRef, useState } from 'react';
import { COULEURS, COURT, nombre } from './commun';
import { CONDITIONS } from './cas';
import { ETAPES, type CodeEtape, type ColonneLue, type Critere, type Etapes } from './calcul';

const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(' ');
const txt = (x: number) => (Math.abs(x) < 0.05 ? '~0' : `~${x < 0 ? '-' : ''}${nombre(Math.abs(x), 1)}`);
const pc = (x: number) => `${(Math.max(0, Math.min(1, x)) * 100).toFixed(1)}%`;
const ECHELLE_ABSOLUE = 4;

export function EtapesEnsemble({ cols, etapes, reference, nomReference, moment, onMoment, critere, absolu = false }: {
  prefixe?: string; positions?: number[]; cols: ColonneLue[]; etapes: Etapes; reference: string | null; nomReference: string | null;
  moment: CodeEtape | null; onMoment?: (m: CodeEtape) => void; critere: Critere; absolu?: boolean;
}) {
  const f = critere.famille;
  const val = (cle: string, code: CodeEtape) => etapes[cle]?.[code]?.crans[f] ?? null;
  const top = (code: CodeEtape) => {
    const vs = cols.map((c) => { const v = val(c.cle, code); return v == null ? -Infinity : v * critere.sens; });
    const t = [...vs].sort((a, b) => b - a);
    return t[0] > -Infinity && (cols.length < 2 || t[0] - t[1] >= 0.05) ? cols[vs.indexOf(t[0])].cle : null;
  };
  // L'échelle d'une ligne : au style, le plus fort apport de ce moment (houblons et référence) ; en Absolu, fixe.
  const echelle = (code: CodeEtape) => (absolu ? ECHELLE_ABSOLUE
    : Math.max(0.05, ...[...cols.map((c) => c.cle), ...(reference ? [reference] : [])].map((k) => Math.abs(val(k, code) ?? 0))));
  const lab = (nom: string, code: CodeEtape, v: number | null) =>
    `${nom} ${ETAPES.find((e) => e.code === code)!.dit}, ${nombre(CONDITIONS.doseGL)} g/L : ${COURT[f].toLowerCase()} ${v == null ? 'inconnu' : `${txt(v)} cran`}`;
  const couleur = COULEURS[f];
  return (
    <section className="p3-ens cmc-ens" data-element="d107-etapes x3b-cuve-jour-apres-jour y1b-face-a-ta-stout" aria-label={`Aux étapes : ${COURT[f].toLowerCase()} gagné par chaque houblon, à chaque moment ; à gauche, ${nomReference ?? `ta ${termes().biere}`}`}>
      {ETAPES.map((e) => {
        const t = top(e.code), k = echelle(e.code), vr = reference ? val(reference, e.code) : 0;
        return (
          <div key={e.code} role="button" tabIndex={0} onClick={() => onMoment?.(e.code)} className={cx('pq-comparer-grille-tab p3-ens-l', e.code === moment && 'p3-ens-on', e.code === 'dryActive' && 'p3-ens-froid')}>
            <span className="p3-ens-g">
              <b className={e.code === moment ? 'cmc-ens-pastille' : undefined}>{e.court}</b>
              <span className="p3-ens-ref" {...(e.code === 'b60' ? (reference ? { 'data-reference': 'houblon', 'data-houblon': reference, 'data-element': 'd107-reference' } : { 'data-reference': 'biere', 'data-element': 'd107-reference' }) : {})}>
                <span data-etape={e.code} data-nature="simule" title={lab(nomReference ?? `ta ${termes().biere}`, e.code, vr)}>{vr == null ? '?' : txt(vr)}</span>
              </span>
            </span>
            {cols.map((c) => {
              const v = val(c.cle, e.code);
              const barre = v != null && Math.abs(v) >= 0.05;
              return (
                <span key={c.cle} className={cx('p3-ens-v cmc-ens-v', t === c.cle && 'p3-ens-top')} style={{ color: c.couleur }}>
                  <span data-etape={e.code} data-houblon={c.cle} data-nature="simule" {...(v == null ? { 'data-inconnu': '' } : {})} aria-label={lab(c.houblon.nom, e.code, v)} title={lab(c.houblon.nom, e.code, v)}>
                    {`${v == null ? '?' : txt(v)}${t === c.cle ? '★' : ''}`}
                  </span>
                  <span className={cx('cmc-ens-pis', v == null && 'cmc-ens-inc')} aria-hidden="true">
                    {barre && <i className="cmc-ens-b" style={{ width: pc(Math.abs(v!) / k), background: couleur.base }} />}
                    {vr != null && Math.abs(vr) >= 0.05 && <i className="cmc-ens-ref" style={{ left: pc(Math.abs(vr) / k) }} />}
                  </span>
                </span>
              );
            })}
          </div>
        );
      })}
    </section>
  );
}

/** Le « ? » explicatif des étapes : petit et rond comme celui d'en haut ; une feuille courte au toucher. */
export function AideEtapes({ nomReference, famille }: { nomReference: string | null; famille: string }) {
  const [ouvert, setOuvert] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    if (!ouvert) return;
    const k = (e: KeyboardEvent) => { if (e.key === 'Escape') setOuvert(false); };
    const hors = (e: PointerEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOuvert(false); };
    document.addEventListener('keydown', k); document.addEventListener('pointerdown', hors);
    return () => { document.removeEventListener('keydown', k); document.removeEventListener('pointerdown', hors); };
  }, [ouvert]);
  return (
    <span ref={ref} className="cmc-aide">
      <button type="button" data-role="aide-etapes" aria-expanded={ouvert} aria-label="Lire ces nombres" onClick={(e) => { e.stopPropagation(); setOuvert((o) => !o); }}
        className="cmc-aide-b"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M8.5 8.5a3.5 3.5 0 1 1 5 3.2c-1 .5-1.5 1.2-1.5 2.3v.5M12 19.5v.01" /></svg></button>
      {ouvert && (
        <div className="cmc-aide-f" role="dialog" aria-label="Les étapes, expliquées" data-role="aide-etapes-feuille">
          <p><b>Le nombre</b> : ce que le houblon apporte en {famille} (la pastille), posé à ce moment, à {nombre(CONDITIONS.doseGL)} g/L, en crans du style.</p>
          <p><b>★</b> : le meilleur de l’étape.</p>
          <p><b>À gauche, en gris</b> : {nomReference ? `ton ${nomReference}` : `ta ${termes().biere}`} au même moment ; son trait gris dans chaque barre.</p>
          <p><b>~</b> : simulé. <b>~0</b> : moins de 0,05 cran.</p>
          <p><b>Au style</b> : chaque ligne à l’échelle de son plus fort apport, face à ta {termes().style}. <b>Absolu</b> : valeurs brutes, même échelle à tous les moments.</p>
          <p>Toucher une ligne la pose sur le radar et les rangées ; dry hop : {CONDITIONS.jours} j de contact.</p>
          <p><b>Par famille</b> : la barre de chaque houblon face à ta {termes().style} (zone pâle), le trait noir de ta {termes().biere}, l’orangé au-dessus de la {termes().style}, l’écart chiffré face au retenu.</p>
        </div>
      )}
    </span>
  );
}
