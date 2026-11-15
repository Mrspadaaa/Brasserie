import React, { useEffect, useRef, useState } from 'react';
import { ExternalLink, Wallet } from 'lucide-react';
import { CreativeItem } from '../types';
import { nextClientId } from '../services/refs';
import { StorageService } from '../services/storage';
import { CreativeItemSheet } from '../ui/CreativeItemSheet';
import { UpgradeWorkspace } from '../ui/finance/UpgradeWorkspace';
import { BrewerChat } from '../ui/BrewerChat';
import { useLiveSelection, useStorageValue } from '../hooks/useLiveData';
import { useMobileLayout } from '../ui/useViewport';
import { Ecrire } from '../ui/atelier/Ecrire';
import { EssaiPrix, type TarifGarde } from '../ui/atelier/EssaiPrix';
import { FicheContact } from '../ui/atelier/FicheContact';
import { FicheIdee } from '../ui/atelier/FicheIdee';
import { NoteCarte } from '../ui/atelier/NoteCarte';
import {
  LIBELLE_TIROIR, chf, compteurs, enClient, enEntree, genreDe, tiroirDe, trierNotes,
  type LigneRangee, type Tiroir
} from '../ui/atelier/atelierModel';

export interface CreativeLabSectionRequest {
  section: CreativeItem['type'];
  at: number;
}

interface CreativeLabTabProps {
  onSuccessMessage?: (msg: string) => void;
  /**
   * Ouvre l'assistant de création de recette, prérempli du seul contenu réel
   * de l'idée. Rien d'autre n'est deviné à sa place.
   */
  onDraftRecipe?: (seed: { title: string; description?: string }) => void;
  /** Demande de création émise par le bouton d'action. */
  createRequest?: { kind: string; at: number } | null;
  onCreateRequestHandled?: () => void;
  /** Ouvre une rubrique existante sans créer de note ni d'événement. */
  openSectionRequest?: CreativeLabSectionRequest | null;
  onOpenSectionRequestHandled?: () => void;
}

const FILTRES: Tiroir[] = ['tout', 'biere', 'tarif', 'contact', 'faire'];
const EXEMPLES: Array<{ texte: string; point: string }> = [
  { texte: 'Une saison à l’épeautre pour le printemps', point: 'bg-ebc-amber' },
  { texte: '33 cl à 6, elle me coûte 2,10', point: 'bg-hop' },
  { texte: 'Rappeler Lucie du Café du Midi', point: 'bg-water' }
];
const QUESTION_MATERIEL = 'Aide-moi à prioriser mes projets de matériel enregistrés : besoin pour le brassage, bientôt ou plus tard, devis et coûts manquants, impact sur les prévisions et la trésorerie avec ou sans ces projets. Distingue les achats déjà facturés des intentions, sans inventer de ventes ni de gains.';
const SUJET_QUESTION: Record<Tiroir, string> = {
  tout: 'notes de l’atelier', biere: 'idées de bières', tarif: 'notes de tarifs enregistrées', contact: 'contacts et débouchés', faire: 'événements et tâches', materiel: 'projets de matériel'
};

/**
 * Atelier R&D : « le carnet que l'IA range » (e9na, choisi le 15.11). On note en vrac, le rangement se propose, le brasseur valide ;
 * Bières, Tarifs, Contacts et À faire sont des tiroirs du même carnet ; le Matériel reste la section de la mission Rénovation.
 */
export const CreativeLabTab: React.FC<CreativeLabTabProps> = ({
  onSuccessMessage, onDraftRecipe, createRequest, onCreateRequestHandled, openSectionRequest, onOpenSectionRequestHandled
}) => {
  const mobile = useMobileLayout();
  const [tiroir, setTiroir] = useState<Tiroir>(() => (openSectionRequest ? tiroirDe(openSectionRequest.section) : 'tout'));
  const handledSectionRequest = useRef<CreativeLabSectionRequest | null>(null);
  const [assistantOpen, setAssistantOpen] = useState(false);
  const [amorce, setAmorce] = useState<{ texte: string; at: number } | null>(null);
  const [equipmentCreateRequest, setEquipmentCreateRequest] = useState<{ kind: string; at: number } | null>(null);
  const [toast, setToast] = useState<{ texte: string; ids: string[] } | null>(null);

  const items = useStorageValue(StorageService.getCreativeItems);
  const config = useStorageValue(StorageService.getConfig);
  const tva = config.fiscal.isTvaRegistered ? config.fiscal.tvaNormalRate : 0;
  const [editing, setEditing] = useLiveSelection(items, 'id');
  const [fiche, setFiche] = useLiveSelection(items, 'id');
  const [contact, setContact] = useLiveSelection(items, 'id');
  const recettes = useStorageValue(StorageService.getRecipes).map(r => r.name);
  const conversions = useRef(new Set<string>());

  useEffect(() => {
    if (!openSectionRequest) return;
    const handled = handledSectionRequest.current;
    if (handled?.section === openSectionRequest.section && handled.at === openSectionRequest.at) return;
    handledSectionRequest.current = openSectionRequest;
    setTiroir(tiroirDe(openSectionRequest.section));
    onOpenSectionRequestHandled?.();
  }, [openSectionRequest, onOpenSectionRequestHandled]);

  /** Le bouton d'action : un projet de matériel dans son tiroir, sinon le champ « Noter en vrac » prend la main. */
  useEffect(() => {
    if (createRequest?.kind !== 'newIdea') return;
    if (tiroir === 'materiel') setEquipmentCreateRequest(createRequest);
    else setAmorce({ texte: '', at: createRequest.at });
    onCreateRequestHandled?.();
  }, [createRequest?.at]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 7000);
    return () => clearTimeout(t);
  }, [toast]);

  const nb = compteurs(items);
  const notes = trierNotes(items.filter(i => genreDe(i)));
  const visibles = tiroir === 'tout' ? notes : notes.filter(i => genreDe(i) === tiroir);
  const vide = nb.tout === 0 && tiroir !== 'materiel' && tiroir !== 'tarif';

  const garder = (nouvelles: CreativeItem[], texte: string) => {
    nouvelles.forEach(n => StorageService.addCreativeItem(n));
    setToast({ texte, ids: nouvelles.map(n => n.id) });
  };
  const rangerLignes = (lignes: LigneRangee[]) => {
    const base = Date.now();
    garder(lignes.map((l, i) => enEntree(l, `CR-${base + i}`)), lignes.length > 1 ? `${lignes.length} notes gardées dans l’Atelier` : 'Note gardée dans l’Atelier');
  };
  const garderTarif = (t: TarifGarde) => {
    const e = enEntree({ genre: 'tarif', titre: `${t.format} à ${chf(t.prix)} CHF`, description: t.format, targetPrice: t.prix, estimatedCost: t.cout }, `CR-${Date.now()}`);
    garder([e], 'Tarif gardé dans l’Atelier');
  };
  const annuler = () => { toast?.ids.forEach(id => StorageService.deleteCreativeItem(id)); setToast(null); };

  const cocher = (item: CreativeItem) => StorageService.updateCreativeItem({ ...item, status: item.status === 'done' ? 'todo' : 'done' });
  const etapeSuivante = (item: CreativeItem) => {
    const flux: Partial<Record<CreativeItem['status'], CreativeItem['status']>> = { idea: 'research', research: 'quote', quote: 'validated', validated: 'idea' };
    StorageService.updateCreativeItem({ ...item, status: flux[item.status] ?? 'idea' });
  };
  /** Une idée de bière s'ouvre en fiche ; les autres notes, directement en édition. */
  const ouvrir = (item: CreativeItem) => (item.type === 'recipe-idea' ? setFiche(item) : item.type === 'prospect' ? setContact(item) : setEditing(item));
  /**
   * Prospect → fiche client. BE-22 : un double toucher créait deux fiches ; le verrou est synchrone (le rendu n'a pas le temps de masquer le bouton),
   * et un contact déjà converti ne se convertit pas deux fois. Un contact ou un numéro absent reste vide : jamais un faux numéro.
   */
  const convertir = (item: CreativeItem) => {
    if (conversions.current.has(item.id)) return;
    if (StorageService.getCreativeItems().find(i => i.id === item.id)?.status === 'validated') { onSuccessMessage?.(`« ${item.title} » est déjà un client : rien n’a été recréé.`); return; }
    conversions.current.add(item.id);
    const id = nextClientId(StorageService.getClients().map(c => c.id));
    StorageService.saveClients([enClient(item, id), ...StorageService.getClients()]);
    StorageService.updateCreativeItem({ ...item, status: 'validated' });
    setContact(null);
    onSuccessMessage?.(`Prospect « ${item.title} » converti en client (${id}).`);
  };
  /**
   * Passer d'une idée à une recette : l'assistant de création s'ouvre avec le seul contenu réel de l'idée.
   * (Une version ancienne fabriquait une recette entière : style, volume, malts, houblons inventés. Jamais.)
   */
  const enRecette = (item: CreativeItem) => { setFiche(null); onDraftRecipe?.({ title: item.title, description: item.description }); };

  const question = tiroir === 'materiel'
    ? QUESTION_MATERIEL
    : `Aide-moi à faire le point sur mes ${SUJET_QUESTION[tiroir]} dans l’atelier. Appuie-toi sur les données enregistrées et indique ce qui manque pour décider.`;

  return (
    <div className="animate-in fade-in space-y-3 text-sm">
      {!mobile && <div className="finance-heading"><h2 className="text-2xl font-semibold">Atelier R&D</h2></div>}

      <Ecrire primaire={tiroir !== 'tarif'} amorce={amorce} onReflechir={() => setAssistantOpen(true)} onRanger={rangerLignes} />

      {!vide && (
        <div role="group" aria-label="Tiroirs du carnet" className="-mx-3 flex gap-1.5 overflow-x-auto px-3 [scrollbar-width:none] [mask-image:linear-gradient(to_right,#000_calc(100%-28px),transparent)]">
          {FILTRES.map(f => (
            <button key={f} type="button" aria-pressed={tiroir === f} onClick={() => setTiroir(f)}
              className={`relative inline-flex min-h-8 shrink-0 items-center gap-1 rounded-full border px-3 text-sm after:absolute after:inset-x-0 after:top-1/2 after:h-11 after:-translate-y-1/2 after:content-[''] ${tiroir === f ? 'border-cave-50 bg-cave-850 font-semibold text-cave-50' : 'border-cave-700 bg-cave-850 text-cave-200'}`}>
              {LIBELLE_TIROIR[f]} <b className="font-mono text-xs font-semibold">{nb[f]}</b>
            </button>
          ))}
          <button type="button" aria-pressed={tiroir === 'materiel'} onClick={() => setTiroir('materiel')}
            className={`relative mr-6 inline-flex min-h-8 shrink-0 items-center gap-1 rounded-full border px-3 text-sm after:absolute after:inset-x-0 after:top-1/2 after:h-11 after:-translate-y-1/2 after:content-[''] ${tiroir === 'materiel' ? 'border-cave-50 bg-cave-850 font-semibold text-cave-50' : 'border-cave-700 bg-cave-850 text-cave-200'}`}>
            Matériel <ExternalLink className="h-3 w-3" aria-hidden="true" />
          </button>
        </div>
      )}

      {tiroir === 'materiel' && <UpgradeWorkspace createRequest={equipmentCreateRequest} onCreateRequestHandled={() => setEquipmentCreateRequest(null)} />}

      {tiroir === 'tarif' && <EssaiPrix tva={tva} onGarder={garderTarif} />}

      {tiroir !== 'materiel' && visibles.length > 0 && (
        <div className="flex flex-col gap-2">
          {tiroir === 'tarif' && <p className="mx-0.5 text-xs text-cave-400">Tarifs gardés</p>}
          {visibles.map(i => <NoteCarte key={i.id} item={i} tva={tva} onOuvrir={ouvrir} onCocher={cocher} onEnRecette={enRecette} />)}
        </div>
      )}

      {tiroir !== 'materiel' && tiroir !== 'tout' && tiroir !== 'tarif' && visibles.length === 0 && nb.tout > 0 && (
        <p className="px-1 text-sm text-cave-400">Rien dans {LIBELLE_TIROIR[tiroir]} pour l’instant. Note-le ci-dessus.</p>
      )}

      {vide && (
        <section className="mt-3 flex flex-col gap-2.5 rounded-2xl border border-cave-800 bg-cave-900 px-3 py-4">
          <h2 className="text-lg font-semibold text-cave-50">Ton carnet est vide</h2>
          <p className="text-sm text-cave-200">Écris comme ça vient. Le rangement se propose dans Bières, Tarifs, Contacts ou À faire ; tu valides.</p>
          <div className="flex flex-col gap-1.5">
            {EXEMPLES.map(e => (
              <button key={e.texte} type="button" onClick={() => setAmorce({ texte: e.texte, at: Date.now() })}
                className="flex min-h-11 items-center gap-2.5 rounded-control border border-dashed border-cave-700 px-3 text-left text-sm text-cave-200">
                <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${e.point}`} aria-hidden="true" />« {e.texte} »
              </button>
            ))}
          </div>
          <button type="button" onClick={() => setTiroir('tarif')} className="relative inline-flex min-h-8 items-center gap-1 self-start text-sm font-semibold text-cave-50 after:absolute after:inset-x-0 after:top-1/2 after:h-11 after:-translate-y-1/2 after:content-['']">
            <Wallet className="h-4 w-4" aria-hidden="true" />Essayer un prix de vente
          </button>
          <button type="button" onClick={() => setTiroir('materiel')} className="relative inline-flex min-h-8 items-center gap-1 self-start text-sm font-semibold text-cave-50 after:absolute after:inset-x-0 after:top-1/2 after:h-11 after:-translate-y-1/2 after:content-['']">
            <ExternalLink className="h-4 w-4" aria-hidden="true" />Projets de matériel : dans Rénovation
          </button>
        </section>
      )}

      {toast && (
        <div role="status" className="fixed inset-x-3 bottom-[52px] z-[46] flex items-center justify-between gap-2 rounded-control bg-cave-50 px-3 py-2.5 text-sm text-[rgb(var(--cave-950))]">
          {/* Bandeau sombre en clair, clair en cave : le texte prend la couleur de la surface (--cave-950), pas celle de l'encre. */}
          <span>{toast.texte}</span>
          <button type="button" onClick={annuler} className="relative min-h-7 px-1 font-semibold underline after:absolute after:left-0 after:right-0 after:top-1/2 after:h-11 after:-translate-y-1/2 after:content-['']">Annuler</button>
        </div>
      )}

      {assistantOpen && <BrewerChat scope={{ kind: 'app', id: 'production-lab' }} label="Mon atelier" phase="Idées et projets de la brasserie" initialOpen hideLauncher onClose={() => setAssistantOpen(false)} initialQuestion={question} />}

      <FicheIdee item={fiche} tva={tva} carnet={items} recettes={recettes} onClose={() => setFiche(null)} onEtape={etapeSuivante} onEnRecette={enRecette}
        onModifier={i => { setFiche(null); setEditing(i); }}
        onSupprimer={i => { StorageService.deleteCreativeItem(i.id); setFiche(null); onSuccessMessage?.(`« ${i.title} » supprimé.`); }} />

      <FicheContact item={contact} onClose={() => setContact(null)} onModifier={i => { setContact(null); setEditing(i); }} onConvertir={convertir} />

      {/* Fiche d'édition : elle porte aussi la suppression, avec confirmation nommée. */}
      <CreativeItemSheet item={editing} onClose={() => setEditing(null)}
        onSave={u => { StorageService.updateCreativeItem(u); onSuccessMessage?.(`« ${u.title} » mis à jour.`); }}
        onDelete={i => { StorageService.deleteCreativeItem(i.id); onSuccessMessage?.(`« ${i.title} » supprimé.`); }} />
    </div>
  );
};
