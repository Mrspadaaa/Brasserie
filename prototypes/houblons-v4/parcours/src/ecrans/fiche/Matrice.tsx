// La liste sous le radar de g1, devenue la matrice de flb5b (« La matrice nettoyée », D130) : le bandeau noir
// « Lui seul : … » (data-role="hors-16d", ses mots que ses remplaçants ne disent pas), puis la grille : ses mots en
// lignes (picto de leur famille à sa couleur, ◇ hors des 12 familles), « lui » entre deux règles noires (rond noir et
// « 2/2 », point creux « 1/2 » pour une catégorie de Hopsteiner, D136), ses quatre remplaçants de u4 en colonnes, noms verticaux et score,
// un seul gris (rond plein : il le dit aussi ; rien : il ne le dit pas). Au-dessus, la ligne des familles non décrites
// en pictos « ? » à leur couleur. Données : donnees-matrice.ts. Classes préfixées pq-fiche-mx- (L26).
import { useState } from 'react';
import { COULEURS, COURT, Picto } from '../../commun';
import type { HoublonLu } from '../../moteur';
import type { RecetteParcours } from '../../etat/types';
import type { FamilyId } from '../../../../../../src/domain/hopIndex/v4';
import { Autres } from './briques';
import { matrice } from './donnees-matrice';

/** Les familles que ses fiches ne décrivent pas : leur picto suivi d'un « ? » à leur couleur (flb5b, sous le radar). */
export function NonDecrites({ familles }: { familles: FamilyId[] }) {
  if (!familles.length) return null;
  const texte = `${familles.length} non décrite${familles.length > 1 ? 's' : ''} : ${familles.map((f) => COURT[f]).join(', ')}`;
  return (
    <p data-element="g1-non-decrites" role="img" aria-label={texte} className="pq-fiche-mx-nd">
      {familles.map((f) => (
        <span key={f} data-famille={f} className="pq-fiche-mx-nd1">
          <Picto famille={f} taille={15} />
          <i aria-hidden="true" style={{ color: COULEURS[f].texte }}>?</i>
        </span>
      ))}
    </p>
  );
}

export function Matrice({ h, cle, recette, seuleFiche }: { h: HoublonLu; cle: string; recette: RecetteParcours; seuleFiche: string | null }) {
  const m = matrice(recette, cle);
  const { N, colonnes, lignes, seul } = m;
  const [legende, setLegende] = useState(false);
  const idLegende = `pq-fiche-mx-leg-${cle}`;
  const dansRecette = recette.additions.some((a) => a.hopKey === cle);
  const score = (c: (typeof colonnes)[number]) => (c.max > c.min ? `${c.min}–${c.max}` : String(c.min));
  return (
    <div data-element="g1-familles g1-sans-famille" data-role="fiche-arome" aria-label={`Ses mots, face à ses ${colonnes.length} remplaçants`} className="pq-fiche-mx">
      {seul.length > 0
        ? <p data-role="hors-16d" data-houblon={cle} className="pq-fiche-mx-q">Lui seul : <b>{seul.join(', ')}</b></p>
        : <p className="pq-fiche-mx-q">Lui seul : <b>aucun mot</b>, ses remplaçants disent aussi les siens</p>}
      <div id={idLegende} data-role="legende" hidden={!legende} className="pq-fiche-mx-leg">
        <p>Lignes : ses mots, traduits ; ◇ hors des 12 familles. Colonnes : lui, puis ses {colonnes.length} premiers remplaçants de Substituer{dansRecette ? ', à son ajout' : ', hors de ma recette'} (score sur 100).</p>
        <p>Noir : il le dit{N > 1 ? ` (${N}/${N} : ses ${N} fiches)` : ''}. Gris : le remplaçant le dit aussi. Vide : non. Creux : Hopsteiner le range dans cette famille, sans mot qui le décrive.</p>
        <p>autres : la part de ses mots hors des 12 familles.</p>
      </div>
      <div className="pq-fiche-mx-g pq-fiche-mx-ent">
        <span className="pq-fiche-mx-coin">
          {/* La légende de flb5b, derrière un « ? » discret (D89), dépliée dans le flux sous le bandeau. */}
          <button type="button" data-role="legende-bouton" aria-expanded={legende} aria-controls={idLegende} aria-label="Lire la légende de la grille"
            onClick={() => setLegende((v) => !v)} onKeyDown={(e) => { if (e.key === 'Escape' && legende) { e.stopPropagation(); setLegende(false); } }}
            className="pq-fiche-mx-aide">?</button>
          {seuleFiche && <span data-role="fiche-seule">1 seule fiche : {seuleFiche}</span>}
          <Autres h={h} largeur={56} petit />
        </span>
        <span className="pq-fiche-mx-lui">lui</span>
        {colonnes.map((c) => (
          <span key={c.cle} data-houblon-cle={c.cle} data-min={c.min} data-max={c.max} className="pq-fiche-mx-rn"
            title={c.max > c.min ? 'une composante inconnue : de son pire cas au meilleur' : undefined}>
            <i>{c.nom}</i><b>{score(c)}</b>
          </span>
        ))}
      </div>
      {lignes.map((l) => {
        const plein = l.fiches.length === N;
        return (
          <div key={l.mot} data-mot={l.mot} data-seul={l.seul || undefined} {...(l.famille ? { 'data-famille': l.famille } : {})}
            className={`pq-fiche-mx-g pq-fiche-mx-l${l.seul ? ' pq-fiche-mx-seul' : ''}`}>
            <span className="pq-fiche-mx-m">
              {l.famille ? <Picto famille={l.famille} taille={14} /> : <i role="img" aria-label="hors des 12 familles" className="pq-fiche-mx-hf" />}
              <b style={{ color: l.famille ? COULEURS[l.famille].texte : undefined }}>{l.mot}</b>
            </span>
            <span className="pq-fiche-mx-lui">
              {/* D136 (« Que veux dire classé ? C'est pas du tout clair ») : la catégorie de Hopsteiner compte une fiche, comme
                  au radar (« 1/2 ») ; le point creux dit qu'elle range le houblon dans la famille sans mot qui le décrive. */}
              {l.classe
                ? (
                  <>
                    <i role="img" aria-label="Hopsteiner le range dans cette famille, sans mot qui le décrive" title="Hopsteiner le range dans cette famille, sans mot qui le décrive"
                      className="pq-fiche-mx-d pq-fiche-mx-dc" />
                    {N > 1 && <span className="pq-fiche-mx-n">1/{N}</span>}
                  </>
                )
                : (
                  <>
                    <i role="img" aria-label={`${l.fiches.join(', ')}`} className={`pq-fiche-mx-d${plein ? ' pq-fiche-mx-d2' : ''}`} />
                    {/* g1 : rien à une seule fiche, jamais « 1/1 ». */}
                    {N > 1 && <span className="pq-fiche-mx-n">{l.fiches.length}/{N}</span>}
                  </>
                )}
            </span>
            {colonnes.map((c) => (
              <span key={c.cle} className="pq-fiche-mx-rc">
                {l.chez.includes(c.cle) && <i role="img" aria-label={`${c.nom} le dit aussi`} className="pq-fiche-mx-o" />}
              </span>
            ))}
          </div>
        );
      })}
    </div>
  );
}
