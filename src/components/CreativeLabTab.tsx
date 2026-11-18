import { Input, Textarea } from '../ui/Input';
import React, { useState } from 'react';
import { parseDecimal } from '../ui/numericInput';
import { nextClientId } from '../services/refs';
import { NumberInput } from '../ui/NumberInput';
import { 
  X,
  Lightbulb, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  Circle, 
  Sparkles, 
  ArrowRight, 
  Calendar, 
  Phone, 
  Coins, 
  Sliders, 
  Beer, 
  Layers, 
  UserCheck 
} from 'lucide-react';
import { CreativeItem, Recipe, Client } from '../types';
import { StorageService } from '../services/storage';
import { CreativeItemSheet } from '../ui/CreativeItemSheet';
import { UpgradeWorkspace } from '../ui/finance/UpgradeWorkspace';
import { BrewerChat } from '../ui/BrewerChat';
import { Pencil } from 'lucide-react';
import { ModalShell, StickyActions } from '../ui/ModalShell';
import { inputClass } from '../ui/FormNav';
import { useLiveSelection, useStorageValue } from '../hooks/useLiveData';
import { ViewNavigation } from '../ui/ViewNavigation';
import { useMobileLayout } from '../ui/useViewport';
import { ContactsView, type NouveauContact } from '../ui/atelier/ContactsView';
import { TodoTimeline } from '../ui/atelier/TodoTimeline';
import { NoteCarnet, type FiltreCarnet } from '../ui/atelier/NoteCarnet';
import { modeRangerNote } from '../config/rangerNoteIA';
import { TarifsFrise } from '../ui/atelier/TarifsFrise';
import { IdeesBieres, IdeesPrix } from '../ui/atelier/LigneOuverte';
import { brouillonDeLIdee } from '../domain/atelier/ideesBieres';
import { defaultBrewVolume } from '../domain/brewEquipment';
import { FileText, Tag, Wrench } from 'lucide-react';

/** ks4 : la rangée Matériel · Carnet · Tarifs ; Bières, Contacts et À faire sont les filtres du Carnet. */
type Onglet = 'materiel' | 'carnet' | 'tarifs';
const VERS_ONGLET: Record<CreativeItem['type'], [Onglet, FiltreCarnet]> = {
  equipment: ['materiel', 'tout'], 'pricing-test': ['tarifs', 'tout'], 'recipe-idea': ['carnet', 'bieres'], prospect: ['carnet', 'contacts'], event: ['carnet', 'afaire'],
  /* Carnet d'idées (Stocks › Matériel › Carnets) : jamais dans un tiroir de l'Atelier ; une demande de ces types ouvre le matériel, sans les lister. */
  carnet: ['materiel', 'tout'], 'carnet-message': ['materiel', 'tout']
};
const SECTION_DU_FILTRE: Record<FiltreCarnet, CreativeItem['type'] | null> = { tout: null, bieres: 'recipe-idea', contacts: 'prospect', afaire: 'event' };

export interface CreativeLabSectionRequest {
  section: CreativeItem['type'];
  at: number;
  /** Rubrique « À faire » seulement : ouvre la pose d'une tâche, la perle sur ce jour (aaaa-mm-jj), par exemple la semaine touchée au Calendrier. */
  date?: string;
  /** Rubrique « À faire », depuis « Plus de détails › » d'une fête au Calendrier : le nom et le montant déjà tapés (centimes, absolu, et son sens). */
  saisie?: { titre?: string; centimes?: number; direction?: 'in' | 'out' };
}

interface CreativeLabTabProps {
  onSuccessMessage?: (msg: string) => void;
  /**
   * Ouvre l'assistant de création de recette, prérempli du seul contenu réel
   * de l'idée. Rien d'autre n'est deviné à sa place.
   */
  onDraftRecipe?: (seed: { title: string; description?: string }) => void;
  /** kb3 : ouvre la page d'une recette. Absent (ProductionTab ne le passe pas encore) : « En recette » s'affiche sans le bouton « Ouvrir la recette ». */
  onOpenRecipe?: (recipeId: string) => void;
  /** Demande de création émise par le bouton d'action. */
  createRequest?: { kind: string; at: number } | null;
  onCreateRequestHandled?: () => void;
  /** Ouvre une rubrique existante sans créer de note ni d'événement. */
  openSectionRequest?: CreativeLabSectionRequest | null;
  onOpenSectionRequestHandled?: () => void;
}

export const CreativeLabTab: React.FC<CreativeLabTabProps> = ({
  onSuccessMessage,
  onOpenRecipe,
  createRequest,
  onCreateRequestHandled,
  openSectionRequest,
  onOpenSectionRequestHandled
}) => {
  const mobile = useMobileLayout();
  const [onglet, setOnglet] = useState<Onglet>(() => VERS_ONGLET[openSectionRequest?.section ?? 'equipment'][0]);
  const [filtre, setFiltre] = useState<FiltreCarnet>(() => VERS_ONGLET[openSectionRequest?.section ?? 'equipment'][1]);
  const [focusCarnet, setFocusCarnet] = useState(0);
  /** La rubrique de l'ancien code (ajout, assistant) ; `null` : le Carnet sous « Tout ». */
  const section: CreativeItem['type'] | null = onglet === 'materiel' ? 'equipment' : onglet === 'tarifs' ? 'pricing-test' : SECTION_DU_FILTRE[filtre];
  const activeSection: CreativeItem['type'] = section ?? 'recipe-idea';
  const setActiveSection = (s: CreativeItem['type']) => { const [o, f] = VERS_ONGLET[s]; setOnglet(o); setFiltre(f); };
  const handledSectionRequest = React.useRef<CreativeLabSectionRequest | null>(null);
  const [assistantOpen,setAssistantOpen] = useState(false);
  const [dateDepart, setDateDepart] = useState<string | undefined>(undefined);
  /** Le nom et le montant tapés au Calendrier (lot A, n° 3) : le nom remplit « Quoi », le montant part avec la tâche posée ; oubliés à la fermeture. */
  const [saisieDepart, setSaisieDepart] = useState<CreativeLabSectionRequest['saisie']>(undefined);

  const items = useStorageValue(StorageService.getCreativeItems);
  /** Carnet (ks4) : Tarifs pour le prix deviné, bières connues (recettes et tarifs) pour la case Bière. */
  const tarifs = useStorageValue(StorageService.getTarifs);
  const recettes = useStorageValue(StorageService.getRecipes);
  const bieres = React.useMemo(() => [...new Set([...recettes.map((r) => r.name), ...tarifs.map((t) => t.biere ?? '')].map((b) => b?.trim()).filter((b): b is string => Boolean(b)))].sort((a, b) => a.localeCompare(b, 'fr')), [recettes, tarifs]);

  React.useEffect(() => {
    if (!openSectionRequest) return;
    const handled = handledSectionRequest.current;
    if (handled?.section === openSectionRequest.section && handled.at === openSectionRequest.at) return;
    handledSectionRequest.current = openSectionRequest;
    setActiveSection(openSectionRequest.section);
    if (openSectionRequest.section === 'event' && openSectionRequest.date) { setDateDepart(openSectionRequest.date); setSaisieDepart(openSectionRequest.saisie); setIsAdding(true); }
    else { setDateDepart(undefined); setSaisieDepart(undefined); }
    onOpenSectionRequestHandled?.();
  }, [openSectionRequest, onOpenSectionRequestHandled]);

  // Quick addition state
  const [isAdding, setIsAdding] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newCost, setNewCost] = useState<string>('');
  const [newDate, setNewDate] = useState('');
  const [newContact, setNewContact] = useState('');
  /** Change à chaque « Noter » de la frise (Tarifs) : la ligne neuve reçoit le focus même si elle est déjà ouverte. */
  const [signalNoter, setSignalNoter] = useState(0);
  const [equipmentCreateRequest,setEquipmentCreateRequest]=useState<{kind:string;at:number}|null>(null);

  /** Le bouton d'action ouvre le formulaire d'ajout de la section courante. */
  React.useEffect(() => {
    if (createRequest?.kind === 'newIdea') { if(activeSection==='equipment')setEquipmentCreateRequest(createRequest);else if(section===null)setFocusCarnet(Date.now());else setIsAdding(true); onCreateRequestHandled?.(); }
  }, [createRequest?.at]);


  const currentItems = items.filter(i => i.type === activeSection);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const newItem: CreativeItem = {
      id: `CR-${Date.now()}`,
      type: activeSection,
      title: newTitle.trim(),
      description: newDescription.trim() || undefined,
      status: activeSection === 'event' ? 'todo' : 'idea',
      estimatedCost: newCost ? parseDecimal(newCost) ?? undefined : undefined,
      date: newDate.trim() || undefined,
      contactName: newContact.trim() || undefined
    };

    StorageService.addCreativeItem(newItem);
    setNewTitle('');
    setNewDescription('');
    setNewCost('');
    setNewDate('');
    setNewContact('');
    setIsAdding(false);
  };

  /** Contacts (kc1) : lieu = titre, personne, numéro, note ; un numéro absent reste absent. */
  const createContact = (c: NouveauContact) => {
    StorageService.addCreativeItem({ id: `CR-${Date.now()}`, type: 'prospect', title: c.lieu.trim(), status: 'idea', contactName: c.personne.trim() || undefined, contactPhone: c.numero.trim() || undefined, notes: c.note.trim() || undefined });
    setIsAdding(false);
  };
  /** Contacts (kc1) : « Ajouter le numéro » et « Modifier » passent par la feuille de la maquette, mêmes champs que l'ajout. */
  const updateContact = (item: CreativeItem, c: NouveauContact) => {
    StorageService.updateCreativeItem({ ...item, title: c.lieu.trim(), contactName: c.personne.trim() || undefined, contactPhone: c.numero.trim() || undefined, notes: c.note.trim() || undefined });
  };
  /** À faire (kd4) : une tâche posée sur le fil ; date `JJ.MM.AAAA`, ou aucune (« sans date »). */
  const createTask = (titre: string, date: string) => {
    /* le montant tapé au Calendrier : recette d'une fête (+) ou coût (−), comme l'écrit la feuille rapide (versEnregistrement) */
    const c = saisieDepart?.centimes;
    const montant = c && c > 0 ? (saisieDepart?.direction === 'in' ? { estimatedRevenue: c / 100 } : { estimatedCost: c / 100 }) : {};
    StorageService.addCreativeItem({ id: `CR-${Date.now()}`, type: 'event', title: titre, status: 'todo', date: date || undefined, ...montant });
    setSaisieDepart(undefined);
    setIsAdding(false);
  };
  React.useEffect(() => { if (!isAdding) setSaisieDepart(undefined); }, [isAdding]);
  const montantDepart = saisieDepart?.centimes && saisieDepart.centimes > 0
    ? `${saisieDepart.direction === 'in' ? '+' : '−'}${(saisieDepart.centimes / 100).toLocaleString('fr-CH', { maximumFractionDigits: 2 })} CHF`
    : undefined;

  const handleToggleStatus = (item: CreativeItem) => {
    let nextStatus: CreativeItem['status'] = 'idea';
    if (item.type === 'event') {
      nextStatus = item.status === 'done' ? 'todo' : 'done';
    } else {
      const flow: Record<string, CreativeItem['status']> = {
        idea: 'research',
        research: 'quote',
        quote: 'validated',
        validated: 'idea'
      };
      nextStatus = flow[item.status] || 'idea';
    }

    const updated = { ...item, status: nextStatus };
    StorageService.updateCreativeItem(updated);
  };

  /** Entrée en cours d'édition. Ouvre la fiche, qui porte aussi la suppression. */
  const [editing, setEditing] = useLiveSelection(items, 'id');

  const handleDelete = (id: string) => {
    StorageService.deleteCreativeItem(id);
  };

  const handleSaveEdit = (updated: CreativeItem) => {
    StorageService.updateCreativeItem(updated);
    onSuccessMessage?.(`« ${updated.title} » mis à jour.`);
  };

  /**
   * Passer d'une idée à une recette (kb3 : « Brouillon créé dans Recettes »), sans quitter l'Atelier.
   *
   * ⚠️ Une ancienne version FABRIQUAIT une recette entière (style deviné, 30 L, OG 1.060, 35 IBU, 6.5 kg de grain, deux malts, deux houblons,
   * une levure US-05) : rien de cela ne venait de l'idée. Le brouillon n'a que ce que l'idée dit : nom, style, degré visé s'il est posé, et un
   * mot (couleur, phare, saison) dans les notes de création ; ni grain, ni houblon, ni levure. Le volume est celui que l'assistant propose à
   * une recette neuve. L'idée garde l'identifiant de la recette (champ `recetteId`) : « En recette » ne dépend plus du nom.
   * Rend l'identifiant de la recette créée.
   */
  const passerEnBrouillon = (item: CreativeItem): string | null => {
    const cfg = StorageService.getConfig();
    const profil = cfg.brewhouses?.find((b) => b.id === cfg.activeBrewhouseId) ?? cfg.brewhouses?.[0];
    const id = `REC-${Date.now().toString(36).toUpperCase()}`;
    StorageService.addRecipe(brouillonDeLIdee(item, id, defaultBrewVolume(profil)));
    StorageService.updateCreativeItem({ ...item, recetteId: id } as CreativeItem);
    return id;
  };

  // PASSERELLE MAGIQUE 2: Convertir un prospect en vrai Client CRM
  const convertingIds = React.useRef(new Set<string>());
  /** `true` : une fiche Clients vient d'être créée (le message, sans confettis, est dit par la vue Contacts). */
  const handleConvertToClient = (item: CreativeItem): boolean => {
    /* BE-22 : un double toucher créait deux fiches. Le verrou est synchrone (le rendu n'a pas le temps de masquer le bouton) ; un contact déjà converti ne se convertit pas deux fois. */
    if (convertingIds.current.has(item.id)) return false;
    const dejaConverti = StorageService.getCreativeItems().find(i => i.id === item.id)?.status === 'validated';
    if (dejaConverti) return false;
    convertingIds.current.add(item.id);
    const newClientId = nextClientId(StorageService.getClients().map(c => c.id));
    const newClient: Client = {
      id: newClientId,
      name: item.title,
      type: 'Pro',
      // Un contact et un numéro absents restent VIDES. La version précédente
      // écrivait « Responsable » et « +41 26 000 00 00 » — un faux numéro
      // suisse qu'on aurait fini par composer.
      contact: item.contactName || '',
      phone: item.contactPhone || '',
      email: '',
      // Statut et CA sont dérivés des ventes réelles : rien à initialiser ici.
      notes: item.notes || item.description
    };

    const currentClients = StorageService.getClients();
    StorageService.saveClients([newClient, ...currentClients]);

    // Update creative item status to validated
    StorageService.updateCreativeItem({ ...item, status: 'validated' });

    // Pas de confettis ni de toast global : la vue Contacts dit « … est dans Clients » au bas de l'écran (maquette kc1).
    return true;
  };

  const assistantBouton = <button className="finance-assistant" onClick={()=>setAssistantOpen(true)}><Sparkles size={19}/><span><strong>Réfléchir à mes projets</strong><small>Avec Gemini</small></span><ArrowRight size={18}/></button>;
  /**
   * Bières (filtre du Carnet), kb3 : la ligne s'ouvre sur place. « Passer dans mes recettes » crée le brouillon dans Recettes sans quitter
   * l'Atelier (toast « Brouillon créé dans Recettes · Ouvrir »). « En recette » : la recette créée par l'idée (identifiant), ou une recette de même nom.
   */
  const vueBieres = (
    <IdeesBieres idees={currentItems} recettes={recettes} ajout={isAdding} onAjout={setIsAdding} onCreer={(i) => StorageService.addCreativeItem(i)}
      onMaj={(i) => StorageService.updateCreativeItem(i)} onPasser={passerEnBrouillon} onOuvrirRecette={onOpenRecipe} onSupprimer={(i) => handleDelete(i.id)} />
  );

  return (
    <div className="space-y-2 sm:space-y-4 animate-in fade-in text-sm">
      {!mobile&&<div className="finance-heading"><h2 className="text-2xl font-semibold">Atelier R&D</h2></div>}
      <div className="nc-seg" role="group" aria-label="Mon atelier">
        {([['materiel', 'Matériel', Wrench], ['carnet', 'Carnet', FileText], ['tarifs', 'Tarifs', Tag]] as const).map(([cle, nom, Icone]) => <button key={cle} type="button" aria-pressed={onglet === cle} onClick={() => { setOnglet(cle); setIsAdding(false); }}><Icone size={18} aria-hidden="true" />{nom}</button>)}
      </div>
      {activeSection==='equipment'&&<UpgradeWorkspace createRequest={equipmentCreateRequest} onCreateRequestHandled={()=>setEquipmentCreateRequest(null)}/>}

      {/* kxc (15.11) : la frise des prix pratiqués ; « + Noter » garde une idée de tarif, les idées gardées et l'assistant sous la liste. */}
      {/* kb3 : la ligne d'une idée de prix s'ouvre sur place (prix − / +, au litre, format, pour qui, coût) ; « + Noter » ouvre la ligne neuve. */}
      {activeSection==='pricing-test'&&<TarifsFrise onNoter={()=>{setIsAdding(true);setSignalNoter(Date.now());}} apres={<IdeesPrix idees={currentItems} ajout={isAdding} onAjout={setIsAdding} onCreer={(i)=>StorageService.addCreativeItem(i)} onMaj={(i)=>StorageService.updateCreativeItem(i)} onSupprimer={(i)=>handleDelete(i.id)} signal={signalNoter} apres={assistantBouton}/>}/>}

      {onglet === 'carnet' && <NoteCarnet items={items} filtre={filtre} onFiltre={(f) => { setFiltre(f); setIsAdding(false); }} mode={modeRangerNote()} tarifs={tarifs} bieres={bieres}
        vues={{ bieres: vueBieres, contacts: <ContactsView items={currentItems} adding={isAdding} onAdding={setIsAdding} onCreate={createContact} onConvert={handleConvertToClient} onUpdate={updateContact} onRemove={(item) => handleDelete(item.id)} />, afaire: <TodoTimeline items={currentItems} adding={isAdding} onAdding={setIsAdding} onCreate={createTask} onToggle={handleToggleStatus} onEdit={setEditing} dateDepart={dateDepart} {...(saisieDepart?.titre ? { titreDepart: saisieDepart.titre } : {})} {...(montantDepart ? { montantDepart } : {})} /> }}
        assistant={assistantBouton} onAjouter={(i) => StorageService.addCreativeItem(i)} onMaj={(i) => StorageService.updateCreativeItem(i)} onRetirer={handleDelete}
        onEdit={setEditing} onConvert={handleConvertToClient} onTarifs={() => { setOnglet('tarifs'); setIsAdding(false); }} focusDemande={focusCarnet} />}

      {/* Form modal when adding an item */}
      {onglet === 'materiel' && assistantBouton}
      {assistantOpen&&<BrewerChat scope={{kind:'app',id:'production-lab'}} label="Mon atelier" phase="Idées et projets de la brasserie" initialOpen hideLauncher onClose={()=>setAssistantOpen(false)} initialQuestion={section===null?'Aide-moi à faire le point sur mes notes, mes idées de bières, mes contacts et mes tâches dans l’atelier. Appuie-toi sur les données enregistrées et indique ce qui manque pour décider.':activeSection==='equipment'?'Aide-moi à prioriser mes projets de matériel enregistrés : besoin pour le brassage, bientôt ou plus tard, devis et coûts manquants, impact sur les prévisions et la trésorerie avec ou sans ces projets. Distingue les achats déjà facturés des intentions, sans inventer de ventes ni de gains.':`Aide-moi à faire le point sur mes ${activeSection==='recipe-idea'?'idées de bières':activeSection==='pricing-test'?'notes de tarifs enregistrées':activeSection==='prospect'?'contacts et débouchés':'événements et tâches'} dans l’atelier. Appuie-toi sur les données enregistrées et indique ce qui manque pour décider.`}/>}
      {isAdding && activeSection !== 'prospect' && activeSection !== 'event' && activeSection !== 'recipe-idea' && activeSection !== 'pricing-test' && (
        <ModalShell open={isAdding} onClose={() => setIsAdding(false)} size="md">
          <div className="flex justify-between items-center px-4 sm:px-5 py-3.5 border-b border-cave-800 bg-cave-900/90 shrink-0">
            <h4 className="font-bold text-base text-cave-50">Nouvelle note / piste</h4>
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              aria-label="Fermer"
              className="p-2 text-cave-400 hover:text-cave-200 bg-cave-850 rounded-full transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleCreate} autoComplete="off" className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3.5 text-sm overscroll-contain">
            <div>
              <label className="text-cave-200 font-semibold block mb-1 text-xs sm:text-sm">Titre de la note / piste</label>
              <Input
                type="text"
                name="creative_item_title"
                autoComplete="off"
                autoCorrect="off"
                spellCheck={false}
                data-form-type="other"
                data-lpignore="true"
                data-1p-ignore="true"
                data-bwignore="true"
                required
                placeholder="ex: Embouteilleuse, Bière d'Hiver, Bistrot..."
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className={`${inputClass} font-bold`}
              />
            </div>

            <div>
              <label className="text-cave-200 font-semibold block mb-1 text-xs sm:text-sm">Description & Détails</label>
              <Textarea
                name="creative_item_notes"
                autoComplete="off"
                autoCorrect="off"
                spellCheck={false}
                data-form-type="other"
                data-lpignore="true"
                data-1p-ignore="true"
                data-bwignore="true"
                rows={2}
                placeholder="Détails, notes, profil arômatique, contacts..."
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                className={inputClass}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {activeSection === 'equipment' && (
                <div>
                  <label className="text-cave-200 font-semibold block mb-1 text-xs sm:text-sm">Budget estimé (CHF)</label>
                  <Input
                    type="text"
                    name="creative_item_budget"
                    autoComplete="off"
                    autoCorrect="off"
                    spellCheck={false}
                    data-form-type="other"
                    data-lpignore="true"
                    data-1p-ignore="true"
                    data-bwignore="true"
                    inputMode="decimal"
                    placeholder="ex: 1200"
                    value={newCost}
                    onChange={(e) => setNewCost(e.target.value)}
                    className={`${inputClass} font-mono`}
                  />
                </div>
              )}
            </div>

            <StickyActions>
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="flex-1 py-2.5 bg-cave-850 hover:bg-cave-800 text-cave-200 rounded-xl font-bold transition text-sm"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 bg-gradient-to-r from-ebc-straw to-ebc-amber hover:from-ebc-gold text-cave-950 font-bold rounded-xl shadow transition text-sm"
              >
                Enregistrer
              </button>
            </StickyActions>
          </form>
        </ModalShell>
      )}

      {/* Fiche d'édition : c'est elle qui porte aussi la suppression, avec
          confirmation nommée. La corbeille des cartes l'ouvre. */}
      <CreativeItemSheet
        item={editing}
        onClose={() => setEditing(null)}
        onSave={handleSaveEdit}
        onDelete={(item) => {
          handleDelete(item.id);
          onSuccessMessage?.(`« ${item.title} » supprimé.`);
        }}
      />
    </div>
  );
};
