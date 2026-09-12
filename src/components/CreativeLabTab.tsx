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
import confetti from 'canvas-confetti';
import { CreativeItem, Recipe, Client } from '../types';
import { StorageService } from '../services/storage';
import { CreativeItemSheet } from '../ui/CreativeItemSheet';
import { UpgradeWorkspace } from '../ui/finance/UpgradeWorkspace';
import { CreativePricing } from '../ui/finance/CreativePricing';
import { BrewerChat } from '../ui/BrewerChat';
import { Pencil } from 'lucide-react';
import { ModalShell, StickyActions } from '../ui/ModalShell';
import { inputClass } from '../ui/FormNav';
import { useLiveSelection, useStorageValue } from '../hooks/useLiveData';
import { ViewNavigation } from '../ui/ViewNavigation';
import { useMobileLayout } from '../ui/useViewport';

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
}

export const CreativeLabTab: React.FC<CreativeLabTabProps> = ({
  onSuccessMessage,
  onDraftRecipe,
  createRequest,
  onCreateRequestHandled
}) => {
  const mobile = useMobileLayout();
  const [activeSection, setActiveSection] = useState<'equipment' | 'recipe-idea' | 'pricing-test' | 'prospect' | 'event'>('equipment');
  const [assistantOpen,setAssistantOpen] = useState(false);

  const items = useStorageValue(StorageService.getCreativeItems);

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
    if (createRequest?.kind === 'newIdea') { if(activeSection==='equipment')setEquipmentCreateRequest(createRequest);else setIsAdding(true); onCreateRequestHandled?.(); }
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
  const handleConvertToClient = (item: CreativeItem) => {
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
      notes: item.description
    };

    const currentClients = StorageService.getClients();
    StorageService.saveClients([newClient, ...currentClients]);

    // Update creative item status to validated
    StorageService.updateCreativeItem({ ...item, status: 'validated' });

    try {
      confetti({ particleCount: 50, spread: 60, origin: { y: 0.8 }, colors: ['#3B82F6', '#10B981'] });
    } catch {}

    if (onSuccessMessage) {
      onSuccessMessage(`Prospect "${item.title}" converti en compte Client CRM (${newClientId}) ! 👥`);
    }
  };

  return (
    <div className="space-y-2 sm:space-y-4 animate-in fade-in text-sm">
      {!mobile&&<div className="finance-heading"><h2 className="text-2xl font-semibold">Idées et projets</h2></div>}
      <ViewNavigation<typeof activeSection> label="Vue de l’atelier" value={activeSection} onChange={setActiveSection} options={[{value:'equipment',label:'Projets de matériel',shortLabel:'Matériel'},{value:'recipe-idea',label:'Idées de bières',shortLabel:'Bières'},{value:'pricing-test',label:'Essais de tarifs',shortLabel:'Tarifs'},{value:'prospect',label:'Contacts'},{value:'event',label:'À faire'}]}>
      <div className="creative-nav" role="group" aria-label="Mon atelier">
        {([['equipment','Matériel'],['recipe-idea','Bières'],['pricing-test','Tarifs'],['prospect','Contacts'],['event','À faire']] as const).map(([key,label])=><button key={key} aria-pressed={activeSection===key} onClick={()=>setActiveSection(key)}>{label}</button>)}
      </div>
      </ViewNavigation>
      {activeSection==='equipment'&&<UpgradeWorkspace createRequest={equipmentCreateRequest} onCreateRequestHandled={()=>setEquipmentCreateRequest(null)}/>}

      {/* 4. SECTION 2: RECIPE STUDIO & PASSERELLE EN 1 CLIC */}
      {activeSection === 'recipe-idea' && (
        <div className="space-y-3">
          <button
            onClick={() => setIsAdding(true)}
            className="w-full py-2.5 bg-cave-900 hover:bg-cave-850 text-ebc-straw font-bold rounded-2xl border border-dashed border-cave-700 flex items-center justify-center space-x-1.5 transition"
          >
            <Plus className="w-4 h-4" />
            <span>+ Noter une idée de bière / style décalé</span>
          </button>

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
                      <div className="mt-1 text-footnote text-ebc-gold/90 italic bg-ebc-straw/10 p-1.5 rounded-lg border border-ebc-straw/20 inline-block">
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
                    <span>Transférer dans mes Recettes Officielles</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeSection==='pricing-test'&&<><CreativePricing/><button className="finance-action secondary w-full" onClick={()=>setIsAdding(true)}><Plus size={18}/>Garder une idée de tarif</button>{currentItems.map(item=><button key={item.id} className="finance-row" onClick={()=>setEditing(item)}><span className="finance-row-main">{item.title}</span><Pencil size={18}/></button>)}</>}

      {/* 6. SECTION 4: PROSPECTS & PASSERELLE CRM EN 1 CLIC */}
      {activeSection === 'prospect' && (
        <div className="space-y-3">
          <button
            onClick={() => setIsAdding(true)}
            className="w-full py-2.5 bg-cave-900 hover:bg-cave-850 text-ebc-straw font-bold rounded-2xl border border-dashed border-cave-700 flex items-center justify-center space-x-1.5 transition"
          >
            <Plus className="w-4 h-4" />
            <span>+ Noter un contact / bistrot intéressé</span>
          </button>

          <div className="space-y-2.5">
            {currentItems.map((item) => (
              <div
                key={item.id}
                className="p-4 rounded-3xl bg-cave-900 border border-cave-800 space-y-3 shadow-sm hover:border-cave-700 transition"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-bold text-sm text-cave-50 flex items-center">
                      <span className="text-base mr-1.5">🍽️</span>
                      {item.title}
                    </h4>
                    {item.contactName && (
                      <div className="text-sm text-cave-200 font-semibold mt-0.5">
                        Contact : {item.contactName} · {item.contactPhone || 'Sans tél'}
                      </div>
                    )}
                    {item.notes && (
                      <p className="text-sm text-cave-400 mt-1 leading-relaxed bg-cave-950/60 p-2 rounded-xl border border-cave-800">
                        {item.notes}
                      </p>
                    )}
                  </div>

                  <button
                    aria-label={`Modifier ${item.title}`} onClick={() => setEditing(item)}
                    className="text-cave-400 hover:text-alert p-1"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                </div>

                {/* PASSERELLE MAGIQUE CRM EN 1 CLIC */}
                <div className="pt-2 border-t border-cave-800/80 flex items-center justify-between">
                  {item.contactPhone && (
                    <a
                      href={`tel:${item.contactPhone}`}
                      className="text-sm text-cave-200 hover:text-hop font-bold flex items-center"
                    >
                      <Phone className="w-3 h-3 mr-1 text-hop" /> Appeler
                    </a>
                  )}
                  <button
                    onClick={() => handleConvertToClient(item)}
                    className="px-3.5 py-1.5 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-400 text-cave-950 font-black text-sm rounded-xl shadow transition flex items-center space-x-1.5 active:scale-95 ml-auto"
                  >
                    <UserCheck className="w-3.5 h-3.5 mr-1" />
                    <span>Convertir en Client CRM</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 7. SECTION 5: EVENTS & TO-DO */}
      {activeSection === 'event' && (
        <div className="space-y-3">
          <button
            onClick={() => setIsAdding(true)}
            className="w-full py-2.5 bg-cave-900 hover:bg-cave-850 text-ebc-straw font-bold rounded-2xl border border-dashed border-cave-700 flex items-center justify-center space-x-1.5 transition"
          >
            <Plus className="w-4 h-4" />
            <span>+ Ajouter un événement / marché artisanal</span>
          </button>

          <div className="space-y-2">
            {currentItems.map((item) => (
              <div
                key={item.id}
                className="p-3.5 bg-cave-900 border border-cave-800 rounded-2xl flex items-center justify-between"
              >
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => handleToggleStatus(item)}
                    className="text-cave-400 hover:text-hop"
                  >
                    {item.status === 'done' ? (
                      <CheckCircle2 className="w-5 h-5 text-hop" />
                    ) : (
                      <Circle className="w-5 h-5" />
                    )}
                  </button>
                  <div>
                    <h4 className={`font-bold text-sm ${item.status === 'done' ? 'line-through text-cave-400' : 'text-cave-50'}`}>
                      {item.title}
                    </h4>
                    {item.date && (
                      <span className="text-footnote text-cave-400 flex items-center mt-0.5">
                        <Calendar className="w-3 h-3 mr-1 text-ebc-straw" /> {item.date}
                      </span>
                    )}
                  </div>
                </div>

                <button
                  aria-label={`Modifier ${item.title}`} onClick={() => setEditing(item)}
                  className="text-cave-400 hover:text-alert p-1"
                >
                  <Pencil className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Form modal when adding an item */}
      <button className="finance-assistant" onClick={()=>setAssistantOpen(true)}><Sparkles size={19}/><span><strong>Réfléchir à mes projets</strong><small>Avec Gemini</small></span><ArrowRight size={18}/></button>
      {assistantOpen&&<BrewerChat scope={{kind:'app',id:'production-lab'}} label="Mon atelier" phase="Idées et projets de la brasserie" initialOpen hideLauncher onClose={()=>setAssistantOpen(false)} initialQuestion={activeSection==='equipment'?'Aide-moi à prioriser mes projets de matériel enregistrés : besoin pour le brassage, bientôt ou plus tard, devis et coûts manquants, impact sur les prévisions et la trésorerie avec ou sans ces projets. Distingue les achats déjà facturés des intentions, sans inventer de ventes ni de gains.':`Aide-moi à faire le point sur mes ${activeSection==='recipe-idea'?'idées de bières':activeSection==='pricing-test'?'notes de tarifs enregistrées':activeSection==='prospect'?'contacts et débouchés':'événements et tâches'} dans l’atelier. Appuie-toi sur les données enregistrées et indique ce qui manque pour décider.`}/>}
      {isAdding && (
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
              <input
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
              <textarea
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
                  <input
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
              {activeSection === 'event' && (
                <div>
                  <label className="text-cave-200 font-semibold block mb-1 text-xs sm:text-sm">Date (JJ.MM.AAAA)</label>
                  <input
                    type="text"
                    name="creative_item_date"
                    autoComplete="off"
                    autoCorrect="off"
                    spellCheck={false}
                    data-form-type="other"
                    data-lpignore="true"
                    data-1p-ignore="true"
                    data-bwignore="true"
                    placeholder="ex: 15.06.2026"
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className={`${inputClass} font-mono`}
                  />
                </div>
              )}
              {activeSection === 'prospect' && (
                <div>
                  <label className="text-cave-200 font-semibold block mb-1 text-xs sm:text-sm">Téléphone du contact</label>
                  <input
                    type="text"
                    name="creative_contact_tel"
                    autoComplete="off"
                    autoCorrect="off"
                    spellCheck={false}
                    data-form-type="other"
                    data-lpignore="true"
                    data-1p-ignore="true"
                    data-bwignore="true"
                    inputMode="tel"
                    placeholder="026 408 33 33"
                    value={newContact}
                    onChange={(e) => setNewContact(e.target.value)}
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
