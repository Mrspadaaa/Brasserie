// Étape Houblons (route ma-biere), reprise de la base v4.10 que le brasseur a choisie (consolide/index.html,
// capture consolide-390.png ; D105) : « Houblons 3/7 » et le style ; le bandeau IBU · OG · EBC ; la frise verticale
// du brassin, chaque ajout posé à son moment avec sa carte, son repère glissé par 5′ ; la levure dans la frise ;
// « Ajouter — houblon… » et les ajouts rapides ; « Résineux trop marqué › » et les 12 familles en deux colonnes,
// « › » ouvrant l'onglet Ma bière. Moteur en direct ; ce qui vient de changer porte un repère discret au retour
// d'un outil. Classes propres préfixées pq-ma-biere- (L26).
import { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronRight } from 'lucide-react';
import type { InputElement } from '../../Input';
import { PageShell } from '../../../pages/PageShell';
import { WizardStepRail } from '../../WizardStepBar';
import { Pont, type Echelle } from './commun';
import { BoutonLegende, PanneauLegende, useLegende } from './LegendeGroupe';
import { ActionsCoquille, useOuvrir } from './hote';
import { useNavigation } from './hote';
import { useBiere, useRecette } from './hote';
import type { RecetteParcours } from '../parcours/types';
import { donnees, houblon, lireBiere, style } from '../parcours/adaptateur';
import { Ajouter } from './Ajouter';
import { Alerte, Bandeau, NomFamille, PisteBase, nomLevureBase } from './Base';
import { Frise } from './Frise';
import { Lentille } from './Lentille';
import { useRepere } from './repere';
import './ma-biere.css';
import './rail.css';

/** Les sept étapes de BrewWizard (src/pages/BrewWizard.tsx, STEPS), Houblons la 3e. */
const ETAPES = [
  { id: 'identite', label: 'Identité' },
  { id: 'fermentescibles', label: 'Fermentescibles', shortLabel: 'Malts/sucres' },
  { id: 'houblons', label: 'Houblons' },
  { id: 'levure', label: 'Levure' },
  { id: 'paliers', label: 'Paliers' },
  { id: 'eau', label: 'Eau et sels', shortLabel: 'Eau' },
  { id: 'recap', label: 'Récapitulatif', shortLabel: 'Récap.' },
];
const ETAPE_HOUBLONS = 2;

/** D121 : la variante du profil qui ouvre l'analyse. B, son choix (24.10, soir : « La meilleure ») ; A et C pour la planche
 * (drapeau ?d121=a|c). */
const D121: 'a' | 'b' | 'c' = (() => { const v = typeof location === 'undefined' ? null : new URLSearchParams(location.search).get('d121'); return v === 'a' || v === 'c' ? v : 'b'; })();

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

/** Les ajouts entrés depuis cette étape (base : l.nouveau) : leur carte dit ce qu'ils font bouger (« floral +1 »). */
const NOUVEAUX = new Set<string>();

/** Le contenu de l'étape : le même dans la maquette (sous sa coquille) et dans l'app (sous le wizard, T12). */
export function EtapeHoublonsContenu({ bandeau = true }: { /** Faux dans le wizard : le bandeau d'informations est celui des autres étapes (t12c). */ bandeau?: boolean } = {}) {
  const recette = useRecette();
  const biere = useBiere();
  const ouvrir = useOuvrir();
  const { route, aller } = useNavigation();
  const sc = style(recette.styleCode);
  const [echelle, setEchelle] = useState<Echelle>('style');
  const [legende, basculerLegende] = useLegende();
  // Ma bière est à l'écran sur sa route et sous la fiche ; la coquille ne la monte pas sous un outil plein écran.
  const { avant, effacer } = useRepere(recette, route.ecran === 'ma-biere' || route.ecran === 'fiche');
  const biereAvant = useMemo(() => (avant ? lireBiere(avant) : null), [avant]);
  const reperes = useMemo(() => reperesDe(avant, recette), [avant, recette]);
  // Ce qui vient de changer sur l'étape (base : majIbu, apercu) : la recette d'avant le dernier geste, pour les points
  // « avant » des barres du profil ; l'écart du total d'IBU écrit au-dessus de l'IBU pendant 2 s (« +2 », « −60 »).
  const recetteRef = useRef(recette); recetteRef.current = recette;
  // D40 point 8 : une recette vide à l'ouverture (sa page cas-k2) dit le décompte « 1 au style · 11 non situées », sans
  // l'alerte ; vidée par « retirer », l'étape garde l'alerte de sa base (capture etat-etape-retirer-choisie).
  const videOuverture = useRef(recette.additions.length === 0);
  const [avantLocal, setAvantLocal] = useState<RecetteParcours | null>(null);
  const biereAvantLocal = useMemo(() => (avantLocal ? lireBiere(avantLocal) : null), [avantLocal]);
  const geste = () => { effacer(); setAvantLocal(recetteRef.current); };
  const ibuArrondi = Math.round(biere.ibu.valeur);
  const ibuPrec = useRef(ibuArrondi);
  const [ecart, setEcart] = useState<number | null>(null);
  useEffect(() => {
    const d = ibuArrondi - ibuPrec.current;
    ibuPrec.current = ibuArrondi;
    if (!d) return;
    setEcart(d);
    const t = window.setTimeout(() => setEcart(null), 2000);
    return () => window.clearTimeout(t);
  }, [ibuArrondi]);
  const champ = useRef<InputElement>(null);
  const [, majNouveaux] = useState(0);
  // Les deux colonnes de la base : familles attendues et fruitées à gauche, le reste à droite.
  const moitie = Math.ceil(sc.order.length / 2);
  const colonnes = [sc.order.slice(0, moitie), sc.order.slice(moitie)];

  return (
      <div data-ecran="ma-biere" data-etat="etat-etape-repos-1280" className="pq-ma-biere space-y-1">
        {bandeau && (
          <div data-etat={document.body.dataset.cas === 'k3' ? 'etat-etape-cas-k3' : undefined}>
            <Bandeau biere={biere} avant={biereAvant} element="etape-bandeau" ecart={ecart} />
          </div>
        )}

        <Frise recette={recette} biere={biere} reperes={reperes} nouveaux={NOUVEAUX} onGeste={geste}
          ouvrirChamp={() => champ.current?.focus({ preventScroll: true })} />

        <Ajouter recette={recette} onGeste={geste} champRef={champ} onAjout={(id) => { NOUVEAUX.add(id); majNouveaux((x) => x + 1); }} />

        {/* D121 (« Seul bouton qui ouvre vraiment l'analyse. Peut, être amélioré ») : tout le bloc du profil ouvre l'onglet
            Ma bière d'un toucher (l'alerte, une famille, une barre), et l'entrée dit où elle mène. Les commandes du bloc
            (« ? », « + floral », Au style / Absolu) gardent leur geste. Variante de la version : A ; B et C sur la planche
            variantes-d121/ (drapeau ?d121=b|c). */}
        <section data-element="etape-profil" data-role="profil" data-etat="etat-etape-pied-profil" data-variante-d121={D121}
          aria-label={`Profil de ma bière, ${echelle === 'style' ? `au style ${sc.code}` : 'absolu'} ; toucher pour ouvrir l'analyse`}
          onClick={(e) => { if (!(e.target as Element).closest('button, a, input, [role="radiogroup"], [role="radio"], [data-role="legende"]')) aller({ ecran: 'biere' }); }}
          className={`pq-ma-biere-profil pq-ma-biere-profil-${D121} space-y-1`}>
          <div className="flex items-center gap-2">
            {D121 === 'c'
              ? <button type="button" data-role="pont-biere" onClick={() => aller({ ecran: 'biere' })} className="min-w-0 flex items-center gap-1.5 text-left">
                  <Alerte biere={biere} ordre={sc.order} /><span className="pq-ma-biere-profil-mot shrink-0">· détail</span><ChevronRight className="w-4 h-4 shrink-0" aria-hidden="true" />
                </button>
              : !recette.additions.length && videOuverture.current
                ? <p data-role="decompte" className="text-base text-cave-200">{`${sc.order.filter((f) => biere.profil[f].valeur && !biere.profil[f].horsStyle).length} au style · ${sc.order.filter((f) => !biere.profil[f].valeur).length} non situées`}</p>
                : <Alerte biere={biere} ordre={sc.order} long />}
            {D121 === 'a' && (
              <button type="button" data-role="pont-biere" data-etat="etat-etape-analyse" aria-label="Ouvrir l'analyse : l'onglet Ma bière" onClick={() => aller({ ecran: 'biere' })}
                className="pq-ma-biere-pont-analyse ml-auto shrink-0 inline-flex items-center gap-0.5 h-8 pl-3.5 pr-2 rounded-full text-sm font-semibold">
                analyse<ChevronRight className="w-4 h-4" aria-hidden="true" />
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <BoutonLegende ouverte={legende} onBasculer={basculerLegende} groupe="le profil de ma bière" controle="pq-ma-biere-legende-profil" />
            <Pont nom="floral" principal={false} onClick={() => ouvrir({ ecran: 'suggerer' })}>+ floral</Pont>
            <span className="ml-auto" />
            <Lentille label="Échelle" marques="e" value={echelle} onChange={setEchelle} options={[{ value: 'style', label: 'Au style' }, { value: 'absolu', label: 'Absolu' }]} />
          </div>
          <PanneauLegende id="pq-ma-biere-legende-profil" ouverte={legende}>
            <p><b>Barre</b> : la zone grise est le style {sc.code} ; le pointillé, au-dessus du style.</p>
            <p><b>Point plein</b> : dégusté{(() => { const d = donnees().degustation?.tasting.date; return d ? ` le ${d.slice(8, 10)}.${d.slice(5, 7)}` : ''; })()}. <b>Rond</b> : prévu, simulé (~). <b>Hachuré</b> : non situé, jamais zéro.</p>
            <p><b>Toucher le profil</b> : l'analyse dans l'onglet Ma bière (barres au style, visées, radar).</p>
            <p><b>Rail</b> : glisser la pastille d’un ajout (« 60′ ») : ébullition par 5′, whirlpool en °C, à froid de J+0 à J+14.</p>
          </PanneauLegende>
          <div className="grid grid-cols-2 gap-x-4">
            {colonnes.map((c, k) => (
              <div key={k} className="space-y-0.5">
                {c.map((f) => (
                  <div key={f} data-famille-profil={f} className="grid grid-cols-[minmax(0,5.5rem)_1fr] items-center gap-1.5 min-h-[1.5rem]">
                    <NomFamille x={biere.profil[f]} petit />
                    <PisteBase x={biere.profil[f]} avant={(biereAvantLocal ?? biereAvant)?.profil[f]} echelle={echelle} fine />
                  </div>
                ))}
              </div>
            ))}
          </div>
          {D121 === 'b' && (
            <button type="button" data-role="pont-biere" data-etat="etat-etape-analyse" onClick={() => aller({ ecran: 'biere' })}
              className="pq-ma-biere-pont-analyse w-full h-11 inline-flex items-center justify-center gap-1 rounded-full text-base font-semibold">
              Ouvrir l'analyse de ma bière<ChevronRight className="w-4 h-4" aria-hidden="true" />
            </button>
          )}
        </section>
      </div>
  );
}

/** La page de la maquette : l'étape sous une coquille qui imite le wizard (D116 : le vrai fil d'étapes de l'app). */
export default function MaBiere() {
  const recette = useRecette();
  // D116 (« Il faudra remplacer tout ça par le vrai Stepper de la vrai app ») : le fil d'étapes de l'app, importé tel
  // quel (src/ui/WizardStepBar.tsx) et posé comme BrewWizard : au téléphone, le nom de l'étape et sa position dans la
  // rangée du titre, le fil seul sur son rang (showLabels, compactLabels) ; à l'ordinateur, le fil dans « progress ».
  // Le badge « 16D hypothèse » (une note de concepteur de la base) est retiré. Seule l'étape Houblons existe dans la
  // maquette : toucher une autre étape ne fait rien.
  const surEtape = (id: string) => { if (id === 'houblons') document.querySelector('[data-page-shell] main')?.scrollTo({ top: 0 }); };
  const tete = (
    <div data-element="etape-titre" className="pq-ma-biere-tete px-2 bg-cave-950">
      {/* « Text header inutile » (24.10, soir, sur « Houblons 3/7 ») : le nom de l'étape est retiré ; le fil d'étapes dessous
          le dit déjà (Houblons en gras). */}
      <div data-page-titlebar className="flex items-center justify-end gap-1.5">
        <span className="flex items-center gap-1 shrink-0"><ActionsCoquille /></span>
      </div>
      <WizardStepRail steps={ETAPES} currentIndex={ETAPE_HOUBLONS} onSelect={surEtape} showLabels compactLabels />
    </div>
  );
  return (
    <PageShell title={`Modifier « ${recette.name} »`} subtitle={ETAPES[ETAPE_HOUBLONS].label} onClose={() => undefined}
      mobileHeader={tete} className="pq-recette"
      actions={<span data-element="etape-titre" className="flex items-center gap-2"><ActionsCoquille /></span>}
      progress={<WizardStepRail steps={ETAPES} currentIndex={ETAPE_HOUBLONS} onSelect={surEtape} showLabels />}>
      <EtapeHoublonsContenu />
    </PageShell>
  );
}
