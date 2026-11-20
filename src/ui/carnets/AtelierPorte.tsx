import React, { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { FileText, Tag, Wrench } from 'lucide-react';
import type { CreativeLabSectionRequest } from '../../components/CreativeLabTab';
import { useMobileLayout } from '../useViewport';
import '../atelier/atelier.css';
import './atelier-porte.css';

/**
 * h1 (20.11, CPL-1, CARNET-PLANNING) : Brassins › Atelier, une seule porte du Carnet. « Mais et le carnet ??? » ; « ça correspond pas du
 * tout à ce que j'ai choisi ??? ». La rangée Matériel · Carnet · Tarifs (ks4) reste ; Carnet monte CarnetsVue (son choix ra+p5f, le même
 * composant, le même magasin que Stocks › Matériel › Carnets) ; Matériel monte l'UpgradeWorkspace d'À venir comme Stocks (figé h05-9) ;
 * Tarifs reste tel quel (vue parallèle à trancher par le pilote : CreativeLabTab sur sa seule rubrique, sa rangée masquée ici).
 * L'ancien carnet (NoteCarnet : Tout, Bières, Contacts, À faire, « Réfléchir à mes projets ») n'a plus aucune porte ; ses données restent.
 */
const CarnetsVue = lazy(() => import('./CarnetsVue').then(({ CarnetsVue }) => ({ default: CarnetsVue })));
const UpgradeWorkspace = lazy(() => import('../finance/UpgradeWorkspace').then(({ UpgradeWorkspace }) => ({ default: UpgradeWorkspace })));
const CreativeLabTab = lazy(() => import('../../components/CreativeLabTab').then(({ CreativeLabTab }) => ({ default: CreativeLabTab })));

export type OngletAtelier = 'materiel' | 'carnet' | 'tarifs';

/** Où mène une demande adressée à l'Atelier : le matériel et les tarifs à leur rubrique ; tout le reste (idée, contact, tâche, carnet) au Carnet. */
export function ongletDeDemande(section: CreativeLabSectionRequest['section'] | undefined): OngletAtelier {
  return section === 'equipment' ? 'materiel' : section === 'pricing-test' ? 'tarifs' : 'carnet';
}

/** Ce qui a été tapé au Calendrier avant « Plus de détails › » d'une fête : remis dans le champ du carnet, jamais perdu. */
export function texteDeSaisie(d: CreativeLabSectionRequest | null | undefined): string | undefined {
  const titre = d?.saisie?.titre?.trim();
  const c = d?.saisie?.centimes;
  if (!titre && !c) return undefined;
  const jour = d?.date && /^\d{4}-\d{2}-\d{2}$/.test(d.date) ? `semaine du ${d.date.slice(8, 10)}.${d.date.slice(5, 7)}` : '';
  const montant = c ? `CHF ${(Math.abs(c) / 100).toLocaleString('fr-CH', { minimumFractionDigits: Math.abs(c) % 100 ? 2 : 0 })}` : '';
  return [titre, jour, montant].filter(Boolean).join(' · ');
}

export interface AtelierPorteProps {
  demande?: CreativeLabSectionRequest | null;
  onDemandeTraitee?: () => void;
  createRequest?: { kind: string; at: number } | null;
  onCreateRequestHandled?: () => void;
  onSuccessMessage?: (msg: string) => void;
  onDraftRecipe?: (seed: { title: string; description?: string }) => void;
  onOpenRecipe?: (recipeId: string) => void;
  /** « À venir » / « Réalisés » d'un carnet : leur place réelle, Stocks › Matériel. */
  onVoirMateriel?: (seg: 'avenir' | 'realises') => void;
}

const ONGLETS = [['materiel', 'Matériel', Wrench], ['carnet', 'Carnet', FileText], ['tarifs', 'Tarifs', Tag]] as const;

export function AtelierPorte(p: AtelierPorteProps) {
  const mobile = useMobileLayout();
  const [onglet, setOnglet] = useState<OngletAtelier>(() => ongletDeDemande(p.demande?.section));
  const ongletRef = useRef(onglet);
  ongletRef.current = onglet;
  const [carnetOuvert, setCarnetOuvert] = useState<{ id: string; at: number } | null>(null);
  const [focusChamp, setFocusChamp] = useState<number | null>(null);
  const [texteDepart, setTexteDepart] = useState<{ texte: string; at: number } | null>(() => {
    const t = texteDeSaisie(p.demande);
    return t ? { texte: t, at: p.demande!.at } : null;
  });
  const [vueMateriel, setVueMateriel] = useState<'future' | 'completed'>('future');
  const [besoin, setBesoin] = useState<{ kind: string; at: number } | null>(null);
  const [demandeTarifs, setDemandeTarifs] = useState<{ kind: string; at: number } | null>(null);
  const traitee = useRef<number | null>(null);
  const creee = useRef<number | null>(null);

  /* Une seule passe pour la demande d'écran et la demande de création : « Noter une idée » envoie les deux au même rendu. */
  useEffect(() => {
    let cible = ongletRef.current;
    if (p.demande && traitee.current !== p.demande.at) {
      traitee.current = p.demande.at;
      cible = ongletDeDemande(p.demande.section);
      setOnglet(cible);
      const t = texteDeSaisie(p.demande);
      if (t) setTexteDepart({ texte: t, at: p.demande.at });
      p.onDemandeTraitee?.();
    }
    if (p.createRequest?.kind === 'newIdea' && creee.current !== p.createRequest.at) {
      creee.current = p.createRequest.at;
      if (cible === 'carnet') { setFocusChamp(Date.now()); p.onCreateRequestHandled?.(); }
      else if (cible === 'materiel') { setVueMateriel('future'); setBesoin(p.createRequest); p.onCreateRequestHandled?.(); }
      else setDemandeTarifs(p.createRequest);
    }
  }, [p.demande?.at, p.createRequest?.at]); // eslint-disable-line react-hooks/exhaustive-deps

  /* Tarifs : CreativeLabTab ouvert sur sa seule rubrique ; la demande est stable pour qu'il ne la rejoue pas. */
  const rubriqueTarifs = useMemo<CreativeLabSectionRequest>(() => ({ section: 'pricing-test', at: 0 }), []);
  const attente = (texte: string) => <div role="status" className="py-3 text-sm text-cave-400">{texte}</div>;

  return (
    <div className="atp space-y-2 sm:space-y-4 text-sm">
      {!mobile && <div className="finance-heading"><h2 className="text-2xl font-semibold">Atelier R&amp;D</h2></div>}
      <div className="nc-seg" role="group" aria-label="Mon atelier">
        {ONGLETS.map(([cle, nom, Icone]) => (
          <button key={cle} type="button" aria-pressed={onglet === cle} onClick={() => setOnglet(cle)}><Icone size={18} aria-hidden="true" />{nom}</button>
        ))}
      </div>

      {onglet === 'carnet' && (
        <Suspense fallback={attente('Chargement du carnet…')}>
          <CarnetsVue key={texteDepart?.at ?? 0} className="atp-carnets" ouvrir={carnetOuvert} focusChamp={focusChamp}
            {...(texteDepart ? { texteInitial: texteDepart.texte } : {})}
            onVoirAVenir={() => p.onVoirMateriel?.('avenir')} onVoirRealises={() => p.onVoirMateriel?.('realises')} onMessage={p.onSuccessMessage} />
        </Suspense>
      )}

      {onglet === 'materiel' && (
        <Suspense fallback={attente('Chargement du matériel…')}>
          <UpgradeWorkspace vue={vueMateriel} onVue={setVueMateriel} createRequest={besoin} onCreateRequestHandled={() => setBesoin(null)}
            onOpenCarnet={(id) => { setCarnetOuvert({ id, at: Date.now() }); setOnglet('carnet'); }} />
        </Suspense>
      )}

      {onglet === 'tarifs' && (
        <div className="atp-tarifs">
          <Suspense fallback={attente('Chargement des tarifs…')}>
            <CreativeLabTab openSectionRequest={rubriqueTarifs} onSuccessMessage={p.onSuccessMessage} onDraftRecipe={p.onDraftRecipe}
              onOpenRecipe={p.onOpenRecipe} createRequest={demandeTarifs} onCreateRequestHandled={() => { setDemandeTarifs(null); p.onCreateRequestHandled?.(); }} />
          </Suspense>
        </div>
      )}
    </div>
  );
}
