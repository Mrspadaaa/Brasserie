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
import { ModalShell, StickyActions } from '../ui/ModalShell';
import { inputClass } from '../ui/FormNav';
import { useLiveSelection, useStorageValue } from '../hooks/useLiveData';

interface CreativeLabTabProps {
  onSuccessMessage?: (msg: string) => void;
  /**
   * Ouvre l'assistant de création de recette, prérempli du seul contenu réel
   * de l'idée. Rien d'autre n'est deviné à sa place.
   */
  onDraftRecipe?: (seed: { title: string; description?: string }) => void;
  /** Demande de création émise par le bouton d'action. */
  createRequest?: { kind: string; at: number } | null;
}

export const CreativeLabTab: React.FC<CreativeLabTabProps> = ({
  onSuccessMessage,
  onDraftRecipe,
  createRequest
}) => {
  const [activeSection, setActiveSection] = useState<'equipment' | 'recipe-idea' | 'pricing-test' | 'prospect' | 'event'>('equipment');

  const items = useStorageValue(StorageService.getCreativeItems);

  // Quick addition state
  const [isAdding, setIsAdding] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newCost, setNewCost] = useState<string>('');
  const [newDate, setNewDate] = useState('');
  const [newContact, setNewContact] = useState('');

  /** Le bouton d'action ouvre le formulaire d'ajout de la section courante. */
  React.useEffect(() => {
    if (createRequest?.kind === 'newIdea') setIsAdding(true);
  }, [createRequest?.at]);


  // Interactive Pricing Sandbox Sliders
  const [simFormat, setSimFormat] = useState<'33cl' | '75cl' | 'keg30L'>('75cl');
  const [simPriceTTC, setSimPriceTTC] = useState<number>(7.50);
  const [simCostRaw, setSimCostRaw] = useState<number>(1.20);
  const [simLabor, setSimLabor] = useState<number>(1.00);

  // Pricing calculations:
  const simTvaRate = 0.026;
  const simPriceHT = Math.round((simPriceTTC / (1 + simTvaRate)) * 100) / 100;
  const simCostTotal = simCostRaw + simLabor;
  const simMarginCHF = Math.round((simPriceHT - simCostTotal) * 100) / 100;
  const simMarginPct = simPriceHT > 0 ? Math.round((simMarginCHF / simPriceHT) * 1000) / 10 : 0;
  const breakevenBatchBottles = Math.ceil(50 / Math.max(0.5, simMarginCHF));

  const currentItems = items.filter((i) => i.type === activeSection);
  const totalEquipmentBudget = items
    .filter((i) => i.type === 'equipment' && i.estimatedCost)
    .reduce((sum, i) => sum + (i.estimatedCost || 0), 0);

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
    <div className="space-y-4 animate-in fade-in text-sm">
      {/* 1. Header Banner */}
      <div className="p-4 rounded-3xl bg-gradient-to-br from-ebc-straw/20 via-cave-900 to-cave-950 border border-ebc-straw/40 shadow-xl relative overflow-hidden">
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center space-x-1.5">
              <span className="text-footnote text-ebc-straw uppercase font-black tracking-widest flex items-center">
                <Sparkles className="w-3.5 h-3.5 mr-1" /> Laboratoire d'Idées & Prospections
              </span>
            </div>
            <h3 className="text-base font-black text-cave-50 mt-0.5">
              Atelier R&D de la Brasserie L'Affinée
            </h3>
            <p className="text-sm text-cave-400 mt-0.5">
              Projets matériels, recettes éphémères, prospection commerciale et simulations de tarifs.
            </p>
          </div>
          {activeSection === 'equipment' && (
            <div className="text-right">
              <span className="text-footnote text-cave-400 block">Budget projets :</span>
              <strong className="text-sm font-black text-ebc-straw font-mono">
                {totalEquipmentBudget.toLocaleString('fr-CH')} CHF
              </strong>
            </div>
          )}
        </div>
      </div>

      {/* 2. Sub-navigation Pills */}
      <div className="flex bg-cave-900 p-1 rounded-2xl border border-cave-800 shadow-md overflow-x-auto scrollbar-none space-x-1">
        <button
          onClick={() => setActiveSection('equipment')}
          className={`px-3 py-2 rounded-xl font-bold whitespace-nowrap transition ${
            activeSection === 'equipment' ? 'bg-ebc-straw text-cave-950 shadow' : 'text-cave-400 hover:text-cave-200'
          }`}
        >
          ⚙️ Matériel Futur
        </button>
        <button
          onClick={() => setActiveSection('recipe-idea')}
          className={`px-3 py-2 rounded-xl font-bold whitespace-nowrap transition ${
            activeSection === 'recipe-idea' ? 'bg-ebc-straw text-cave-950 shadow' : 'text-cave-400 hover:text-cave-200'
          }`}
        >
          🍺 Studio Recettes
        </button>
        <button
          onClick={() => setActiveSection('pricing-test')}
          className={`px-3 py-2 rounded-xl font-bold whitespace-nowrap transition ${
            activeSection === 'pricing-test' ? 'bg-ebc-straw text-cave-950 shadow' : 'text-cave-400 hover:text-cave-200'
          }`}
        >
          📊 Simulateur Tarifs
        </button>
        <button
          onClick={() => setActiveSection('prospect')}
          className={`px-3 py-2 rounded-xl font-bold whitespace-nowrap transition ${
            activeSection === 'prospect' ? 'bg-ebc-straw text-cave-950 shadow' : 'text-cave-400 hover:text-cave-200'
          }`}
        >
          🤝 Prospects & Développements
        </button>
        <button
          onClick={() => setActiveSection('event')}
          className={`px-3 py-2 rounded-xl font-bold whitespace-nowrap transition ${
            activeSection === 'event' ? 'bg-ebc-straw text-cave-950 shadow' : 'text-cave-400 hover:text-cave-200'
          }`}
        >
          📅 Événements & To-Do
        </button>
      </div>

      {/* 3. SECTION 1: EQUIPMENT (KANBAN DES INVESTISSEMENTS) */}
      {activeSection === 'equipment' && (
        <div className="space-y-3">
          <button
            onClick={() => setIsAdding(true)}
            className="w-full py-2.5 bg-cave-900 hover:bg-cave-850 text-ebc-straw font-bold rounded-2xl border border-dashed border-cave-700 flex items-center justify-center space-x-1.5 transition"
          >
            <Plus className="w-4 h-4" />
            <span>+ Ajouter un projet de matériel / aménagement</span>
          </button>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {currentItems.map((item) => {
              const statusColors: Record<string, { bg: string; text: string; label: string }> = {
                idea: { bg: 'bg-cave-850', text: 'text-cave-200', label: '💡 Idée' },
                research: { bg: 'bg-water/20', text: 'text-water', label: '🔍 Recherche' },
                quote: { bg: 'bg-ebc-straw/20', text: 'text-ebc-gold', label: '📑 Devis demandé' },
                validated: { bg: 'bg-hop/20', text: 'text-hop', label: '✅ Validé' }
              };
              const s = statusColors[item.status] || statusColors.idea;

              return (
                <div
                  key={item.id}
                  className="p-4 rounded-3xl bg-cave-900 border border-cave-800 space-y-3 shadow-sm flex flex-col justify-between hover:border-cave-700 transition"
                >
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-start">
                      <h4 className="font-bold text-sm text-cave-50">{item.title}</h4>
                      <button
                        onClick={() => handleToggleStatus(item)}
                        className={`text-footnote font-bold px-2 py-0.5 rounded-lg border border-cave-700 ${s.bg} ${s.text} transition`}
                      >
                        {s.label}
                      </button>
                    </div>
                    {item.description && (
                      <p className="text-sm text-cave-400 leading-relaxed">
                        {item.description}
                      </p>
                    )}
                  </div>

                  <div className="pt-2 border-t border-cave-800/80 flex items-center justify-between">
                    <span className="text-ebc-straw font-mono font-bold text-sm">
                      {item.estimatedCost ? `${item.estimatedCost.toLocaleString('fr-CH')} CHF` : 'Budget à définir'}
                    </span>
                    <button
                      onClick={() => setEditing(item)}
                      className="text-cave-500 hover:text-alert p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

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
                    onClick={() => setEditing(item)}
                    className="text-cave-500 hover:text-alert p-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
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

      {/* 5. SECTION 3: INTERACTIVE PRICING SANDBOX (SLIDERS EN DIRECT) */}
      {activeSection === 'pricing-test' && (
        <div className="p-4 rounded-3xl bg-cave-900 border border-cave-800 space-y-4 shadow-sm">
          <div>
            <h4 className="font-bold text-sm text-cave-50">Simulateur Interactif de Rentabilité</h4>
            <p className="text-sm text-cave-400">
              Testez différents barèmes de prix pour vos bouteilles et fûts sans toucher à la compta.
            </p>
          </div>

          {/* Format selector */}
          <div className="flex bg-cave-950 p-1 rounded-xl border border-cave-800">
            <button
              onClick={() => { setSimFormat('33cl'); setSimPriceTTC(4.50); setSimCostRaw(0.70); }}
              className={`flex-1 py-1.5 text-sm font-bold rounded-lg transition ${
                simFormat === '33cl' ? 'bg-ebc-straw text-cave-950' : 'text-cave-400'
              }`}
            >
              Bouteille 33cl
            </button>
            <button
              onClick={() => { setSimFormat('75cl'); setSimPriceTTC(7.50); setSimCostRaw(1.30); }}
              className={`flex-1 py-1.5 text-sm font-bold rounded-lg transition ${
                simFormat === '75cl' ? 'bg-ebc-straw text-cave-950' : 'text-cave-400'
              }`}
            >
              Bouteille 75cl
            </button>
            <button
              onClick={() => { setSimFormat('keg30L'); setSimPriceTTC(120.0); setSimCostRaw(28.0); }}
              className={`flex-1 py-1.5 text-sm font-bold rounded-lg transition ${
                simFormat === 'keg30L' ? 'bg-ebc-straw text-cave-950' : 'text-cave-400'
              }`}
            >
              Fût Inox 30L
            </button>
          </div>

          {/* Sliders */}
          <div className="space-y-3 bg-cave-950/70 p-3.5 rounded-2xl border border-cave-800">
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-cave-200">Prix de Vente Conseillé (TTC) :</span>
                <strong className="text-ebc-straw font-mono text-sm">{simPriceTTC.toFixed(2)} CHF</strong>
              </div>
              <input
                type="range"
                name="sim_price_range"
                autoComplete="off"
                data-form-type="other"
                data-lpignore="true"
                data-1p-ignore="true"
                data-bwignore="true"
                min={simFormat === 'keg30L' ? 80 : 3.0}
                max={simFormat === 'keg30L' ? 180 : 15.0}
                step={simFormat === 'keg30L' ? 5 : 0.25}
                value={simPriceTTC}
                onChange={(e) => setSimPriceTTC(parseFloat(e.target.value))}
                className="w-full accent-ebc-straw cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-cave-200">Coût Matières & Bouteille :</span>
                <strong className="text-alert font-mono text-sm">{simCostRaw.toFixed(2)} CHF</strong>
              </div>
              <input
                type="range"
                name="sim_cost_range"
                autoComplete="off"
                data-form-type="other"
                data-lpignore="true"
                data-1p-ignore="true"
                data-bwignore="true"
                min={simFormat === 'keg30L' ? 15 : 0.4}
                max={simFormat === 'keg30L' ? 50 : 3.5}
                step={simFormat === 'keg30L' ? 1 : 0.1}
                value={simCostRaw}
                onChange={(e) => setSimCostRaw(parseFloat(e.target.value))}
                className="w-full accent-rose-500 cursor-pointer"
              />
            </div>
          </div>

          {/* Live Profitability Output */}
          <div className="grid grid-cols-3 gap-2 bg-gradient-to-br from-cave-950 to-cave-900 p-4 rounded-2xl border border-hop/30 text-center shadow-lg">
            <div>
              <span className="text-footnote text-cave-400 uppercase font-bold">Marge Brute</span>
              <div className="text-xl font-black text-hop mt-1 font-mono">
                +{simMarginCHF.toFixed(2)} CHF
              </div>
              <span className="text-footnote text-cave-500">par unité</span>
            </div>
            <div>
              <span className="text-footnote text-cave-400 uppercase font-bold">% Marge</span>
              <div className="text-xl font-black text-ebc-straw mt-1 font-mono">
                {simMarginPct}%
              </div>
              <span className="text-footnote text-cave-500">sur prix HT</span>
            </div>
            <div>
              <span className="text-footnote text-cave-400 uppercase font-bold">Amortissement</span>
              <div className="text-xl font-black text-water mt-1 font-mono">
                {breakevenBatchBottles}
              </div>
              <span className="text-footnote text-cave-500">unités / 30L</span>
            </div>
          </div>
        </div>
      )}

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
                    onClick={() => setEditing(item)}
                    className="text-cave-500 hover:text-alert p-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
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
                    <h4 className={`font-bold text-sm ${item.status === 'done' ? 'line-through text-cave-500' : 'text-cave-50'}`}>
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
                  onClick={() => setEditing(item)}
                  className="text-cave-500 hover:text-alert p-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Form modal when adding an item */}
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
