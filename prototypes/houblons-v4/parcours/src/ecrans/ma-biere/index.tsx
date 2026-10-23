// Étape Houblons (route ma-biere), reprise de la base v4.10 que le brasseur a choisie (consolide/index.html,
// capture consolide-390.png ; D105) : « Houblons 3/7 » et le style ; le bandeau IBU · OG · EBC ; la frise verticale
// du brassin, chaque ajout posé à son moment avec sa carte, son repère glissé par 5′ ; la levure dans la frise ;
// « Ajouter — houblon… » et les ajouts rapides ; « Résineux trop marqué › » et les 12 familles en deux colonnes,
// « › » ouvrant l'onglet Ma bière. Moteur en direct ; ce qui vient de changer porte un repère discret au retour
// d'un outil. Classes propres préfixées pq-ma-biere- (L26).
import { useMemo, useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { CadreRecette, Legende, Pont, type Echelle } from '../../commun';
import { ActionsCoquille, useOuvrir } from '../../coquille/ouvrir';
import { useNavigation } from '../../coquille/navigation';
import { useBiere, useRecette } from '../../etat/EtatParcours';
import type { RecetteParcours } from '../../etat/types';
import { houblon, lireBiere, style } from '../../moteur';
import { Ajouter } from './Ajouter';
import { Alerte, Bandeau, NomFamille, PisteBase, nomLevureBase } from './Base';
import { Frise } from './Frise';
import { Lentille } from './Lentille';
import { useRepere } from './repere';
import './ma-biere.css';

/** Ce qui a changé depuis que Ma bière a été quittée : par ajout, et la levure (__levure). */
function reperesDe(avant: RecetteParcours | null, recette: RecetteParcours): Record<string, string> {
  if (!avant) return {};
  const r: Record<string, string> = {};
  for (const a of recette.additions) {
    const b = avant.additions.find((x) => x.id === a.id);
    if (!b) r[a.id] = 'nouveau';
    else if (b.hopKey !== a.hopKey) r[a.id] = `à la place de ${houblon(b.hopKey).nom}`;
    else if (JSON.stringify(a) !== JSON.stringify(b)) r[a.id] = 'changé';
  }
  if (avant.yeastId !== recette.yeastId) r.__levure = `à la place de ${nomLevureBase(avant.yeastId)}`;
  return r;
}

export default function MaBiere() {
  const recette = useRecette();
  const biere = useBiere();
  const ouvrir = useOuvrir();
  const { route, aller } = useNavigation();
  const sc = style(recette.styleCode);
  const [echelle, setEchelle] = useState<Echelle>('style');
  // Ma bière est à l'écran sur sa route et sous la fiche ; la coquille ne la monte pas sous un outil plein écran.
  const { avant, effacer } = useRepere(recette, route.ecran === 'ma-biere' || route.ecran === 'fiche');
  const biereAvant = useMemo(() => (avant ? lireBiere(avant) : null), [avant]);
  const reperes = useMemo(() => reperesDe(avant, recette), [avant, recette]);
  // Les deux colonnes de la base : familles attendues et fruitées à gauche, le reste à droite.
  const moitie = Math.ceil(sc.order.length / 2);
  const colonnes = [sc.order.slice(0, moitie), sc.order.slice(moitie)];

  const titre = (
    <span className="inline-flex items-center gap-2" data-element="etape-titre">
      <span className="inline-flex items-center gap-1 h-8 pl-2.5 pr-1 rounded-full border border-cave-700 text-sm text-cave-50 whitespace-nowrap">
        {sc.code}<span className="px-2 py-0.5 rounded-full bg-cave-800 text-xs text-cave-200">hypothèse</span>
      </span>
    </span>
  );
  return (
    <CadreRecette titre="Houblons 3/7" sousTitre="" actions={<>{titre}<ActionsCoquille /></>}>
      <div data-ecran="ma-biere" className="pq-ma-biere space-y-2 pb-4">
        <Bandeau biere={biere} avant={biereAvant} element="etape-bandeau" />

        <Frise recette={recette} biere={biere} reperes={reperes} onGeste={effacer} />

        <Ajouter recette={recette} onGeste={effacer} />

        <section data-element="etape-profil" data-role="profil" aria-label={`Profil de ma bière, ${echelle === 'style' ? `au style ${sc.code}` : 'absolu'}`}
          className="pt-2 border-t border-cave-700 space-y-1.5">
          <div className="flex items-center gap-2">
            <Alerte biere={biere} ordre={sc.order} />
            <span className="ml-auto shrink-0"><Pont nom="floral" principal={false} onClick={() => ouvrir({ ecran: 'suggerer' })}>+ floral</Pont></span>
            <button type="button" data-role="pont-biere" aria-label="Ouvrir l'onglet Ma bière" onClick={() => aller({ ecran: 'biere' })}
              className="shrink-0 w-11 h-9 inline-flex items-center justify-center rounded-full bg-cave-50" style={{ color: 'rgb(var(--cave-950))' }}><ChevronRight className="w-4 h-4" aria-hidden="true" /></button>
          </div>
          <div className="flex items-center gap-2">
            <Legende>
              <p><b>Barre</b> : la zone grise est le style {sc.code} ; le pointillé, au-dessus du style.</p>
              <p><b>Point plein</b> : dégusté le 18.10. <b>Rond</b> : prévu, simulé (~). <b>Hachuré</b> : non situé, jamais zéro.</p>
              <p><b>Frise</b> : glisser le repère d’un ajout (« 60′ ») vers le bas, par 5′, jusqu’au dry hop en jours.</p>
              <p><b>Traits sous la bande</b> : ce que l’ajout fait bouger dans ma bière, en crans du style.</p>
            </Legende>
            <span className="ml-auto" />
            <Lentille label="Échelle" marques="e" value={echelle} onChange={setEchelle} options={[{ value: 'style', label: 'Au style' }, { value: 'absolu', label: 'Absolu' }]} />
          </div>
          <div className="grid grid-cols-2 gap-x-4">
            {colonnes.map((c, k) => (
              <div key={k} className="space-y-1">
                {c.map((f) => (
                  <div key={f} className="grid grid-cols-[minmax(0,5.5rem)_1fr] items-center gap-1.5 min-h-[1.75rem]">
                    <NomFamille x={biere.profil[f]} petit />
                    <PisteBase x={biere.profil[f]} avant={biereAvant?.profil[f]} echelle={echelle} fine />
                  </div>
                ))}
              </div>
            ))}
          </div>
        </section>
      </div>
    </CadreRecette>
  );
}
