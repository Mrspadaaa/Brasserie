// « Ajouter — houblon… » et les ajouts rapides (base v4.10) : un champ texte qui filtre le stock, puis deux
// houblons du stock prêts à poser d'un toucher (« + ») à 10 g et 10′ : nom, α, usage, dose, IBU ajouté (moteur),
// bande des familles, moment, ♡. Sans recherche, ceux du stock qui portent le plus la famille visée par la
// dégustation (« plus floral »). Un houblon ajouté se pose sur la frise, où son moment se glisse.
import { useMemo, useState } from 'react';
import { Heart, Plus } from 'lucide-react';
import { COULEURS, nombre } from '../../commun';
import { useOuvrir } from '../../coquille/ouvrir';
import { useNavigation } from '../../coquille/navigation';
import { useGestes } from '../../etat/EtatParcours';
import { nouvelId, placer } from '../../etat/operations';
import type { RecetteParcours } from '../../etat/types';
import { VISEE } from '../../donnees/cas';
import { houblon, ibuAjout, style } from '../../moteur';
import { STOCK } from '../../../../src/engine';
import { AlphaLu, Usage } from '../fiche/briques';
import { useGestesFiche } from '../fiche/gestes';
import { BoutonLegende, CleFamilles, PanneauLegende, useLegende } from './LegendeGroupe';

const DOSE = 10, MINUTES = 10;
const AIMES = new Set<string>();

export function Ajouter({ recette, onGeste }: { recette: RecetteParcours; onGeste: () => void }) {
  const gestes = useGestes();
  const ouvrir = useOuvrir();
  const { route } = useNavigation();
  const fiche = useGestesFiche((cle) => { if (route.ecran !== 'fiche') ouvrir({ ecran: 'fiche', houblon: cle }); });
  const [cherche, setCherche] = useState('');
  const [legende, basculerLegende] = useLegende();
  const [, maj] = useState(0);
  const sc = style(recette.styleCode);
  const liste = useMemo(() => {
    const dans = new Set(recette.additions.map((a) => a.hopKey));
    const cles = [...new Set(STOCK.filter((s) => s.grams > 0).map((s) => s.key))].filter((k) => !dans.has(k));
    const poids = (k: string) => { const n = houblon(k).familles[VISEE.famille]; return n.niveau === 'marqué' ? 2 : n.niveau === 'cité' ? 1 : 0; };
    const q = cherche.trim().toLowerCase();
    return cles.map((k) => houblon(k))
      .filter((h) => !q || h.nom.toLowerCase().includes(q))
      .sort((x, y) => poids(y.cle) - poids(x.cle) || x.nom.localeCompare(y.nom, 'fr'))
      .slice(0, 3)
      .map((h) => {
        const ajout = placer({ id: nouvelId(recette, h.cle), hopKey: h.cle, grams: DOSE, moment: 'b10' }, { type: 'ebullition', minutes: MINUTES }, recette);
        return { h, ajout, ibu: ibuAjout(ajout, { ...recette, additions: [...recette.additions, ajout] }).ibu };
      });
  }, [recette, cherche]);
  return (
    <section data-element="etape-ajouter" aria-label="Ajouter un houblon" className="space-y-1">
      <div className="flex items-center gap-1">
        <input type="text" inputMode="search" value={cherche} onChange={(e) => setCherche(e.target.value)} placeholder="Ajouter — houblon…"
          aria-label="Ajouter un houblon : chercher dans le stock"
          className="flex-1 min-w-0 h-10 px-4 rounded-full border border-cave-700 bg-cave-900 text-base text-cave-50 placeholder:text-cave-400" />
        {liste.length > 0 && <BoutonLegende ouverte={legende} onBasculer={basculerLegende} groupe="les icônes des ajouts rapides" controle="pq-ma-biere-legende-rapides" />}
      </div>
      <ul className="space-y-1">
        {liste.map(({ h, ajout, ibu }) => (
          <li key={h.cle} data-role="ajout-rapide" {...fiche.appui(h.cle)}
            className="flex items-center gap-2 pl-1.5 pr-1 py-1 rounded-lg bg-cave-900 border border-cave-800">
            <span onPointerDown={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()}>
              <button type="button" data-role="ajout-rapide-plus" aria-label={`Ajouter ${h.nom}, ${DOSE} g à ${MINUTES}′`}
                onClick={() => { onGeste(); gestes.ajouter('recette', ajout); }}
                className="w-9 h-9 inline-flex items-center justify-center rounded-full bg-cave-50" style={{ color: 'rgb(var(--cave-950))' }}><Plus className="w-4 h-4" aria-hidden="true" /></button>
            </span>
            <span className="flex-1 min-w-0 space-y-0.5">
              <span className="flex items-center gap-1.5 min-w-0">
                <span data-houblon={h.cle} {...fiche.nom(h.cle)} className="font-semibold text-base text-cave-50 underline decoration-dotted decoration-cave-600 underline-offset-4 truncate">{h.nom}</span>
                <AlphaLu h={h} mode="court" />
                <Usage h={h} />
              </span>
              <span className="flex items-center gap-2">
                <span className="font-mono text-sm text-cave-200">{DOSE}<span className="font-sans text-cave-400">{' '}g</span> {ibu ? `+${nombre(ibu.valeur)}` : '?'}<span className="font-sans text-cave-400">{' '}IBU</span></span>
                <span role="img" aria-label={`Arômes de ${h.nom}`} className="ml-auto inline-flex gap-px">
                  {sc.order.map((f) => {
                    const n = h.familles[f].niveau;
                    return <i key={f} className="block w-2 h-2.5 rounded-sm" style={{ background: n === 'non décrit' ? 'rgb(var(--cave-800))' : COULEURS[f].base, opacity: n === 'cité' ? 0.55 : 1 }} />;
                  })}
                </span>
              </span>
            </span>
            <span className="inline-flex items-center justify-center min-w-[3rem] h-8 px-2 rounded-full border-2 border-dashed border-cave-600 font-mono text-sm font-semibold text-cave-50">{MINUTES}′</span>
            <span onPointerDown={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()}>
              <button type="button" aria-pressed={AIMES.has(h.cle)} aria-label={`J'aime ${h.nom}`}
                onClick={() => { if (AIMES.has(h.cle)) AIMES.delete(h.cle); else AIMES.add(h.cle); maj((x) => x + 1); }}
                className="w-7 h-8 inline-flex items-center justify-center text-cave-400"><Heart className={`w-4 h-4 ${AIMES.has(h.cle) ? 'fill-current text-alert' : ''}`} aria-hidden="true" /></button>
            </span>
          </li>
        ))}
        {!liste.length && <li className="px-2 text-sm text-cave-400">aucun houblon du stock à ce nom</li>}
      </ul>
      <PanneauLegende id="pq-ma-biere-legende-rapides" ouverte={legende && liste.length > 0}>
        <p><b>Ajouts rapides</b> : deux houblons du stock qui portent le plus le floral, prêts à poser à {MINUTES}′.</p>
        <p><b>+</b> : ajouter {DOSE} g à {MINUTES}′ ; <b>+n IBU</b> : ce qu'il ajoute à ma bière. <b>{MINUTES}′ en pointillé</b> : le moment proposé, réglable ensuite sur la frise. <b>♡</b> : le garder en tête.</p>
        <p><b>Bande</b> : les 12 familles d'arômes du houblon ; vive, marquée ; pâle, citée ; grise, non décrite.</p>
        <CleFamilles ordre={sc.order} />
        <p><b>α</b> : l'acide alpha ; le mot suivant, l'usage (amer, aromatique, mixte).</p>
      </PanneauLegende>
    </section>
  );
}
