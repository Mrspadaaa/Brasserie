import React, { useMemo } from 'react';
import type { HopIngredient } from '../../types';
import { nombreFr } from '../../domain/stock/regles';
import { findRecipeHopMatches, rankDocumentaryHopLeads } from '../../domain/hopIndex/recipeGuide';
import aromaFamilies from '../../data/hopRecipeGuideBootstrap.json';
import { useHopCatalogue } from '../hopIndex/useHopCatalogue';
import { COULEURS, COURT, FAMILIES } from '../hopIndex/familyTokens';
import type { FamilyId } from '../../domain/hopIndex/v4/families';
import { normalizeHop } from '../../domain/hopStage';
import { tableauMoments } from './tableauMoments';
import { cleMoteurDe, motSignature, type MotSignature } from './motSignature';
import './recette.css';

/** Familles d'arôme citées par les fiches du catalogue pour chaque variété de la recette ; une variété hors catalogue n'a aucune pastille (l'inconnu n'est pas 0). */
function aromesDesVarietes(noms: string[], varieties: ReturnType<typeof useHopCatalogue>['varieties']) {
  const sortie = new Map<string, { familles: FamilyId[] }>();
  for (const nom of noms) {
    const trouvees = findRecipeHopMatches(nom, varieties).map((m) => m.item);
    const leads = rankDocumentaryHopLeads(trouvees, FAMILIES as unknown as string[], aromaFamilies as Parameters<typeof rankDocumentaryHopLeads>[2]);
    const evidence = leads.flatMap((l) => l.evidence);
    if (!evidence.length) continue;
    const parFamille = new Map<string, number>();
    for (const e of evidence) parFamille.set(e.familyId, (parFamille.get(e.familyId) ?? 0) + 1);
    const familles = [...parFamille].sort((a, b) => b[1] - a[1]).slice(0, 4).map(([f]) => f as FamilyId);
    sortie.set(nom, { familles });
  }
  return sortie;
}

/**
 * Le tableau variété × moment de la maquette r1.
 * `onNom` : le nom souligné en pointillé se touche (il ouvre le détail des ajouts) ; `actions` : les liens discrets posés sur la ligne du total
 * (ce que l'écran d'avant rangeait dans deux cartes repliées).
 */
export function TableauHoublons({ hops, actions, onNom }: { hops: readonly HopIngredient[]; actions?: React.ReactNode; onNom?: (nom: string) => void }) {
  const tableau = useMemo(() => tableauMoments(hops), [hops]);
  const { varieties } = useHopCatalogue();
  const aromes = useMemo(() => aromesDesVarietes(tableau.lignes.map((l) => l.nom), varieties), [tableau.lignes, varieties]);
  // Le mot de la rangée : le descripteur signature de la variété, pris aux fiches du moteur (motSignature.ts), comme l'étape Houblons de l'assistant.
  const mots = useMemo(() => {
    const ajouts = hops.map(normalizeHop);
    const sortie = new Map<string, MotSignature>();
    for (const l of tableau.lignes) {
      const ajout = ajouts.find((h) => h.name?.trim() === l.nom);
      const cle = ajout ? cleMoteurDe(ajout) : null;
      const mot = cle ? motSignature(cle) : null;
      if (mot) sortie.set(l.nom, mot);
    }
    return sortie;
  }, [hops, tableau.lignes]);
  if (!tableau.lignes.length) return <>
    <p className="rc-note px-2.5 pb-2" data-element="r1-houblons-vide">Aucun houblon renseigné.</p>
    {actions && <div className="rc-liens" data-element="r1-houblons-liens">{actions}</div>}
  </>;
  const n = tableau.colonnes.length;
  const grille = { gridTemplateColumns: `minmax(8.5rem,1fr) repeat(${n}, minmax(2.25rem,auto))` } as React.CSSProperties;
  return (
    <div className="rc-hg" style={grille} data-booster="tableau-moments" role="table" aria-label="Houblons par moment">
      <span role="columnheader" />
      {tableau.colonnes.map((c) => <span key={c.key} role="columnheader" className="rc-col">{c.label}</span>)}
      {tableau.lignes.map((l) => {
        const a = aromes.get(l.nom);
        const mot = mots.get(l.nom);
        return (
          <React.Fragment key={l.cle}>
            <div className="rc-hn" role="row">
              <div className="rc-hn1">
                <button type="button" className="rc-hnm" data-houblon={l.cle} title="Détail des ajouts de ce houblon" onClick={() => onNom?.(l.nom)}>{l.nom}</button>
                <span className="rc-al">{l.alpha ? `α ${nombreFr(l.alpha, 1)}` : 'α ?'}</span>
              </div>
              <div className="rc-hn2">
                <span data-role="usage" title="Rôle dans cette recette, d'après les moments d'ajout">{l.role}</span>
                {a && <span className="rc-ar" aria-label={a.familles.map((f) => COURT[f].toLowerCase()).join(', ')}>
                  {a.familles.map((f) => <i key={f} style={{ background: COULEURS[f].base }} />)}
                </span>}
                {mot && (mot.famille
                  ? <span className="rc-mot" data-element="r1-mot" data-hors="false" style={{ '--rc-t': COULEURS[mot.famille].texte, '--rc-b': COULEURS[mot.famille].base } as React.CSSProperties}>{mot.texte}</span>
                  : <span className="rc-mot rc-hf" data-element="r1-mot" data-hors="true" title="Hors des 12 familles d'arôme">{mot.texte}</span>)}
              </div>
            </div>
            {tableau.colonnes.map((c) => {
              const g = l.doses[c.key];
              const cellule = g == null ? null : nombreFr(g, g % 1 ? 1 : 0);
              // CT4-B-5 : la dose dit son unité (« 60 g » sous « 20′ »), en discret ; la cellule sans dose reste vide, jamais « 0 g ».
              const unite = <span className="rc-gu"> g</span>;
              return <span key={c.key} role="cell" className="rc-g">{cellule && (c.key === 'dh' ? <span className="rc-dh">{cellule}{unite}</span> : <>{cellule}{unite}</>)}</span>;
            })}
          </React.Fragment>
        );
      })}
      {/* La ligne du total : les liens à gauche, « 171 g » sous la colonne dry hop. */}
      {(tableau.totalDryHop != null || actions) && <>
        <div className="rc-liens" data-element="r1-houblons-liens" style={{ gridColumn: tableau.totalDryHop != null ? `1 / span ${n}` : '1 / -1' }}>{actions}</div>
        {tableau.totalDryHop != null && <span className="rc-g rc-total" data-element="r1-total-dryhop" title="Total du dry hop"><span className="rc-tl">total </span>{nombreFr(tableau.totalDryHop, 0)} g</span>}
      </>}
    </div>
  );
}
