// La grille de dégustation m4, sous le radar (sa base v4.10 : grilleDegustation ; « Radar: m4 h4 très bien », 19.10 ;
// « attention à pas surchargé en texte ») : les quatre notes écrites une seule fois en tête de colonne ; chaque rangée a
// quatre pastilles, de l'anneau (pas senti) au gros point (marqué). Rien de coché : pas goûté (inconnu, D65). Un toucher
// note la famille, le retoucher revient à « pas goûté » ; le radar au-dessus se redessine. La note au-dessus du style
// passe à l'orangé, rien d'autre ne s'écrit. Classes préfixées pq-biere- (L26).
import { COURT, Picto, ROUE } from '../../commun';
import type { FamilyId } from '../../../../../../src/domain/hopIndex/v4';
import { NIVEAUX_DEGUSTATION, auDessus, type Note } from '@app/ui/hopIndex/maBiere/RadarBiere';

export function GrilleDegustation({ notes, haut, attendues, noter }: {
  notes: Record<FamilyId, Note>;
  haut: Record<FamilyId, number>;
  attendues: FamilyId[];
  noter: (f: FamilyId, n: Note) => void;
}) {
  return (
    <div className="pq-biere-deg" role="group" data-role="degustation" aria-label="Ma dégustation : une note par famille">
      <div className="pq-biere-deg-rang pq-biere-deg-tete" aria-hidden="true">
        <span />
        {NIVEAUX_DEGUSTATION.map((mot) => <span key={mot}>{mot}</span>)}
      </div>
      {ROUE.map((f) => {
        const v = notes[f];
        return (
          <div key={f} className="pq-biere-deg-rang" data-role="note" data-famille={f} role="radiogroup" aria-label={COURT[f]}>
            <span className={`pq-biere-deg-nom ${attendues.includes(f) ? 'pq-biere-deg-attendue' : ''}`}>
              <Picto famille={f} taille={13} nomme={false} />
              <span className="truncate">{COURT[f]}</span>
            </span>
            {NIVEAUX_DEGUSTATION.map((mot, n) => {
              const coche = v === n;
              return (
                <button key={mot} type="button" role="radio" aria-checked={coche}
                  className={`pq-biere-deg-n pq-biere-deg-n${n} ${coche && auDessus(n as Note, haut[f]) ? 'pq-biere-deg-trop' : ''}`}
                  aria-label={`${COURT[f]} : ${mot}${coche ? ' (retoucher : pas goûté)' : ''}`}
                  onClick={() => noter(f, coche ? null : (n as Note))}>
                  <i />
                </button>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}
