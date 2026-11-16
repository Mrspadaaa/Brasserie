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
import { FileText, Tag, Wrench } from 'lucide-react';

/** ks4 : la rangée Matériel · Carnet · Tarifs ; Bières, Contacts et À faire sont les filtres du Carnet. */
type Onglet = 'materiel' | 'carnet' | 'tarifs';
const VERS_ONGLET: Record<CreativeItem['type'], [Onglet, FiltreCarnet]> = {
  equipment: ['materiel', 'tout'], 'pricing-test': ['tarifs', 'tout'], 'recipe-idea': ['carnet', 'bieres'], prospect: ['carnet', 'contacts'], event: ['carnet', 'afaire']
};
const SECTION_DU_FILTRE: Record<FiltreCarnet, CreativeItem['type'] | null> = { tout: null, bieres: 'recipe-idea', contacts: 'prospect', afaire: 'event' };

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

export const CreativeLabTab: React.FC<CreativeLabTabProps> = ({
  onSuccessMessage,
  onDraftRecipe,
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
    onOpenSectionRequestHandled?.();
  }, [openSectionRequest, onOpenSectionRequestHandled]);

  // Quick addition state
  const [isAdding, setIsAdding] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newCost, setNewCost] = useState<string>('');
  const [newDate, setNewDate] = useState('');
  const [newContact, setNewContact] = useState('');
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
    StorageService.addCreativeItem({ id: `CR-${Date.now()}`, type: 'event', title: titre, status: 'todo', date: date || undefined });
    setIsAdding(false);
  };

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
   * Passer d'une idée à une recette.
   *
   * ⚠️ Cette fonction FABRIQUAIT auparavant une recette entière : style deviné
   * d'après le titre, 30 L, OG 1.060, FG 1.015, 35 IBU, 6.5 kg de grain, deux
   * malts et deux houblons génériques, une levure US-05. Aucune de ces valeurs
   * ne venait de l'idée ni du stock. Gaëtan récupérait une recette d'apparence
   * complète, entièrement inventée, sur laquelle il aurait pu brasser.
   *
   * Elle ouvre désormais l'assistant de création avec le seul élément réel :
   * ce que l'idée contient. Tout le reste se saisit.
   */
  const handleConvertToOfficialRecipe = (item: CreativeItem) => {
    onDraftRecipe?.({ title: item.title, description: item.description });
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
  /** Bières (filtre du Carnet) : la liste actuelle, telle qu'en ligne (kb3 sera porté à part). */
  const vueBieres = (
        <div className="space-y-3">
          {/* Un seul + : celui de la barre (b1r) ouvre la même saisie. */}
          <div className="space-y-2.5">
            {currentItems.map((item) => (
              <div
                key={item.id}
                className="p-4 rounded-3xl bg-cave-900 border border-cave-800 space-y-3 shadow-sm hover:border-cave-700 transition"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-bold text-sm text-cave-50 flex items-center">
                      <Beer className="w-4 h-4 text-ebc-straw mr-1.5" />
                      {item.title}
                    </h4>
                    {item.description && (
                      <p className="text-sm text-cave-400 mt-1 leading-relaxed">
                        {item.description}
                      </p>
                    )}
                    {item.notes && (
                      <div className="mt-1 text-footnote text-ebc-gold italic bg-ebc-straw/10 p-1.5 rounded-lg border border-ebc-straw/20 inline-block">
                        🎨 Visuel : {item.notes}
                      </div>
                    )}
                  </div>

                  <button
                    aria-label={`Modifier ${item.title}`} onClick={() => setEditing(item)}
                    className="text-cave-400 hover:text-alert p-1"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                </div>

                {/* PASSERELLE MAGIQUE EN 1 CLIC */}
                <div className="pt-2 border-t border-cave-800/80 flex justify-end">
                  <button
                    onClick={() => handleConvertToOfficialRecipe(item)}
                    className="px-3.5 py-1.5 bg-gradient-to-r from-ebc-straw to-ebc-amber hover:from-ebc-gold text-cave-950 font-black text-sm rounded-xl shadow transition flex items-center space-x-1.5 active:scale-95"
                  >
                    <Sparkles className="w-3.5 h-3.5 mr-1" />
                    <span>Passer dans mes recettes</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
  );

  return (
    <div className="space-y-2 sm:space-y-4 animate-in fade-in text-sm">
      {!mobile&&<div className="finance-heading"><h2 className="text-2xl font-semibold">Atelier R&D</h2></div>}
      <div className="nc-seg" role="group" aria-label="Mon atelier">
        {([['materiel', 'Matériel', Wrench], ['carnet', 'Carnet', FileText], ['tarifs', 'Tarifs', Tag]] as const).map(([cle, nom, Icone]) => <button key={cle} type="button" aria-pressed={onglet === cle} onClick={() => setOnglet(cle)}><Icone size={18} aria-hidden="true" />{nom}</button>)}
      </div>
      {activeSection==='equipment'&&<UpgradeWorkspace createRequest={equipmentCreateRequest} onCreateRequestHandled={()=>setEquipmentCreateRequest(null)}/>}

      {/* kxc (15.11) : la frise des prix pratiqués ; « + Noter » garde une idée de tarif, les idées gardées et l'assistant sous la liste. */}
      {activeSection==='pricing-test'&&<TarifsFrise onNoter={()=>setIsAdding(true)} apres={<>{currentItems.map(item=><button key={item.id} className="finance-row" onClick={()=>setEditing(item)}><span className="finance-row-main">{item.title}</span><Pencil size={18}/></button>)}{assistantBouton}</>}/>}

      {onglet === 'carnet' && <NoteCarnet items={items} filtre={filtre} onFiltre={setFiltre} mode={modeRangerNote()} tarifs={tarifs} bieres={bieres}
        vues={{ bieres: vueBieres, contacts: <ContactsView items={currentItems} adding={isAdding} onAdding={setIsAdding} onCreate={createContact} onConvert={handleConvertToClient} onUpdate={updateContact} onRemove={(item) => handleDelete(item.id)} />, afaire: <TodoTimeline items={currentItems} adding={isAdding} onAdding={setIsAdding} onCreate={createTask} onToggle={handleToggleStatus} onEdit={setEditing} /> }}
        assistant={assistantBouton} onAjouter={(i) => StorageService.addCreativeItem(i)} onMaj={(i) => StorageService.updateCreativeItem(i)} onRetirer={handleDelete}
        onEdit={setEditing} onConvert={handleConvertToClient} focusDemande={focusCarnet} />}

      {/* Form modal when adding an item */}
      {onglet === 'materiel' && assistantBouton}
      {assistantOpen&&<BrewerChat scope={{kind:'app',id:'production-lab'}} label="Mon atelier" phase="Idées et projets de la brasserie" initialOpen hideLauncher onClose={()=>setAssistantOpen(false)} initialQuestion={section===null?'Aide-moi à faire le point sur mes notes, mes idées de bières, mes contacts et mes tâches dans l’atelier. Appuie-toi sur les données enregistrées et indique ce qui manque pour décider.':activeSection==='equipment'?'Aide-moi à prioriser mes projets de matériel enregistrés : besoin pour le brassage, bientôt ou plus tard, devis et coûts manquants, impact sur les prévisions et la trésorerie avec ou sans ces projets. Distingue les achats déjà facturés des intentions, sans inventer de ventes ni de gains.':`Aide-moi à faire le point sur mes ${activeSection==='recipe-idea'?'idées de bières':activeSection==='pricing-test'?'notes de tarifs enregistrées':activeSection==='prospect'?'contacts et débouchés':'événements et tâches'} dans l’atelier. Appuie-toi sur les données enregistrées et indique ce qui manque pour décider.`}/>}
      {isAdding && activeSection !== 'prospect' && activeSection !== 'event' && (
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
