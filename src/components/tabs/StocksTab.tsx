import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Plus, ShoppingCart, Copy, Check, Boxes, Beer, Wrench, Hop } from 'lucide-react';
import { HopIndexWorkspace as HopIndexPanel } from '../../ui/hopIndex/HopIndexWorkspace';
import { StockItem, EquipmentItem, KegItem, Batch } from '../../types';
import { StorageService } from '../../services/storage';
import { Units } from '../../services/units';
import { computeStockLevel, shortfall } from '../../domain/stockLevel';
import { nextUniqueRef } from '../../services/refs';
import { EntityList } from '../../ui/EntityList';
import { StockRow } from '../../ui/StockRow';
import { StockDetailSheet } from '../../ui/StockDetailSheet';
import { KegBoard } from '../../ui/KegBoard';
import { EquipmentList } from '../../ui/EquipmentList';
import { Sheet } from '../../ui/Sheet';
import { Button } from '../ui/Button';
import { FormNav, Field, TextInput, inputClass } from '../../ui/FormNav';
import { Combobox } from '../../ui/Combobox';
import { Suggestions } from '../../services/suggestions';
import { InventoryCorrectionSheet } from '../../ui/InventoryCorrectionSheet';
import { INVENTORY_REASONS, InventoryReason } from '../../services/storage';
import { EquipmentSheet } from '../../ui/EquipmentSheet';
import { KegSheet } from '../../ui/KegSheet';
import { useLiveSelection } from '../../hooks/useLiveData';

interface StocksTabProps {
  stocks: {
    rawMaterials: StockItem[];
    cleaning: StockItem[];
    equipment: EquipmentItem[];
    kegs: KegItem[];
  };
  batches: Batch[];
  onOpenQuickAction: () => void;
  /** Remonte le sous-onglet courant : le bouton d'action en dépend. */
  onSubTabChange?: (sub: string) => void;
  /** Demande de création émise par le bouton d'action. */
  createRequest?: { kind: string; at: number } | null;
  onSuccessMessage?: (msg: string) => void;
}

type SubTab = 'stock' | 'courses' | 'futs' | 'materiel' | 'hops';

/**
 * Écran Stocks.
 *
 * Il ne reste **qu'une** liste, virtualisée et groupée par catégorie, pour les
 * matières premières et l'hygiène confondues. La version précédente comptait
 * cinq sous-onglets et cinq fonctions de rendu écrites à la main, chacune avec
 * ses propres unités codées en dur — c'est de là que venait le houblon affiché
 * « 20000g ».
 *
 * L'ordre des groupes suit le déroulé d'un brassage : ce qu'on pèse d'abord,
 * puis ce qu'on ajoute, puis ce qui conditionne, puis ce qui nettoie.
 */
const GROUP_ORDER = [
  'Malt',
  'Houblon',
  'Levure',
  'Sucre',
  'Additif',
  'Emballage',
  'CIP alcalin',
  'CIP acide',
  'Désinfectant',
  'Détergent',
  'Sols',
  'EPI',
  'Consommable'
];

export const StocksTab: React.FC<StocksTabProps> = ({
  stocks,
  batches,
  onOpenQuickAction,
  onSubTabChange,
  createRequest,
  onSuccessMessage
}) => {
  const [subTab, setSubTab] = useState<SubTab>(() =>
    StorageService.getUiState<SubTab>('stocks_subtab', 'stock')
  );
  const tabsRef = useRef<HTMLElement>(null);
  useEffect(() => { tabsRef.current?.querySelector('[aria-current="page"]')?.scrollIntoView({ block: 'nearest', inline: 'nearest' }); }, [subTab]);
  const allItems = useMemo(
    () => [...stocks.rawMaterials, ...stocks.cleaning],
    [stocks.rawMaterials, stocks.cleaning]
  );
  const [selected, setSelected] = useLiveSelection(allItems, 'ref');
  const [creating, setCreating] = useState(false);
  const [copiedSupplier, setCopiedSupplier] = useState<string | null>(null);

  /*
   * Matériel et fûts : ils n'étaient consultables qu'en lecture. Une fiche
   * ouverte à `null` ferme la feuille ; une fiche vide vaut création.
   */
  const [equipmentSheet, setEquipmentSheet] = useLiveSelection(stocks.equipment, 'ref');
  const [kegSheet, setKegSheet] = useLiveSelection(stocks.kegs, 'id');

  const blankEquipment = (): EquipmentItem => ({
    id: `EQ-${Date.now()}`,
    ref: nextUniqueRef('EQ', stocks.equipment.map((e) => e.ref)),
    name: '',
    category: 'Brassage',
    state: 'Neuf'
  });

  const blankKeg = (): KegItem => ({
    id: nextUniqueRef('F', stocks.kegs.map((k) => k.id)),
    capacityL: 30,
    state: 'propre'
  });

  const setCreatingEquipment = (on: boolean) => setEquipmentSheet(on ? blankEquipment() : null);
  const setCreatingKeg = (on: boolean) => setKegSheet(on ? blankKeg() : null);

  /** Toute la liste de courses, tous fournisseurs confondus. */
  const copyEverything = () => {
    if (shoppingBySupplier.length === 0) {
      onSuccessMessage?.('Rien à commander : le stock couvre les brassins planifiés.');
      return;
    }
    const text = [
      `Commande — Brasserie L'Affinée`,
      '',
      ...shoppingBySupplier.flatMap(([supplier, list]) => [
        `${supplier} :`,
        ...list.map((l) => `  - ${l.item.name} : ${Units.format(l.missing, l.item.unit)}`),
        ''
      ])
    ].join('\n');
    navigator.clipboard.writeText(text);
    onSuccessMessage?.(`Liste de ${totalToOrder} articles copiée.`);
  };

  // Le bouton d'action doit savoir où l'on est : il crée ce que l'écran montre.
  useEffect(() => {
    onSubTabChange?.(subTab);
  }, [subTab, onSubTabChange]);

  /**
   * Le bouton d'action a demandé une création : c'est l'écran qui sait quoi
   * ouvrir. L'App n'a pas à connaître les formulaires de chaque onglet.
   */
  useEffect(() => {
    if (!createRequest) return;
    switch (createRequest.kind) {
      case 'newStockItem':
        setCreating(true);
        break;
      case 'newKeg':
        setCreatingKeg(true);
        break;
      case 'newEquipment':
        setCreatingEquipment(true);
        break;
      case 'copyShoppingList':
        copyEverything();
        break;
      default:
        break;
    }
    // `at` change à chaque appui : deux demandes identiques restent distinctes.
  }, [createRequest?.at]);

  useEffect(() => {
    StorageService.setUiState('stocks_subtab', subTab);
  }, [subTab]);

  const typeOf = (item: StockItem): 'rawMaterials' | 'cleaning' =>
    stocks.cleaning.some((c) => c.ref === item.ref) ? 'cleaning' : 'rawMaterials';

  /**
   * Correction d'inventaire — remplace l'ajustement rapide qui vivait sur
   * chaque ligne. On saisit le stock COMPTÉ et un motif ; l'écart est calculé
   * et journalisé. Le stock ne bouge autrement que par achat et par brassage.
   */
  const [correcting, setCorrecting] = useLiveSelection(allItems, 'ref');

  const applyCorrection = (
    item: StockItem,
    countedQty: number,
    reason: InventoryReason,
    note?: string
  ) => {
    const result = StorageService.adjustInventory(typeOf(item), item.ref, countedQty, reason, note);
    if (!result) return;
    onSuccessMessage?.(
      result.delta === 0
        ? `${item.name} : inventaire confirmé.`
        : `${item.name} : ${result.delta > 0 ? '+' : ''}${Units.format(
            result.delta,
            item.unit
          )} — ${INVENTORY_REASONS[reason]}.`
    );
  };

  const criticalCount = useMemo(
    () => allItems.filter((i) => computeStockLevel(i, batches).band === 'rupture').length,
    [allItems, batches]
  );

  /**
   * Liste de courses : ce qui manque pour couvrir les brassins planifiés,
   * regroupé par fournisseur habituel. Entièrement calculé, jamais saisi.
   */
  const shoppingBySupplier = useMemo(() => {
    const map = new Map<string, Array<{ item: StockItem; missing: number }>>();

    allItems.forEach((item) => {
      const missing = shortfall(item, batches);
      const belowMin = item.minStock > 0 && item.currentStock <= item.minStock;
      if (missing <= 0 && !belowMin) return;

      const toOrder =
        missing > 0 ? missing : Units.round(item.minStock - item.currentStock, item.unit);
      if (toOrder <= 0) return;

      const supplier = item.supplier?.trim() || 'Fournisseur à préciser';
      const arr = map.get(supplier) ?? [];
      arr.push({ item, missing: toOrder });
      map.set(supplier, arr);
    });

    return Array.from(map.entries()).sort((a, b) => b[1].length - a[1].length);
  }, [allItems, batches]);

  const totalToOrder = shoppingBySupplier.reduce((n, [, list]) => n + list.length, 0);

  const copyList = (supplier: string, list: Array<{ item: StockItem; missing: number }>) => {
    const text = [
      `Commande — Brasserie L'Affinée`,
      `Fournisseur : ${supplier}`,
      '',
      ...list.map((l) => `- ${l.item.name} : ${Units.format(l.missing, l.item.unit)}`)
    ].join('\n');
    navigator.clipboard.writeText(text);
    setCopiedSupplier(supplier);
    setTimeout(() => setCopiedSupplier(null), 2500);
  };

  const handleCreate = (draft: Partial<StockItem>) => {
    const isCleaning = /CIP|Désinfectant|Détergent|Sols|EPI|Consommable/i.test(
      draft.category || ''
    );
    const ref = nextUniqueRef(
      isCleaning ? 'NT' : 'MP',
      allItems.map((i) => i.ref)
    );
    StorageService.addStockItem(isCleaning ? 'cleaning' : 'rawMaterials', {
      id: `RM-${Date.now()}`,
      ref,
      name: (draft.name || '').trim(),
      category: draft.category || 'Divers',
      unit: draft.unit || 'kg',
      currentStock: draft.currentStock ?? 0,
      minStock: draft.minStock ?? 0,
      reorder: (draft.currentStock ?? 0) <= (draft.minStock ?? 0),
      supplier: draft.supplier?.trim() || undefined
    });
    setCreating(false);
  };

  const tabs: Array<{ id: SubTab; label: string; Icon: typeof Boxes; badge?: number }> = [
    { id: 'stock', label: 'Stock', Icon: Boxes, badge: criticalCount },
    { id: 'courses', label: 'Courses', Icon: ShoppingCart, badge: totalToOrder },
    { id: 'futs', label: 'Fûts', Icon: Beer },
    { id: 'materiel', label: 'Matériel', Icon: Wrench },
    { id: 'hops', label: 'Houblons', Icon: Hop }
  ];

  return (
    <div className="flex flex-col h-[calc(100dvh-8.5rem)] pt-3">
      <nav ref={tabsRef} className="shrink-0 flex gap-1 p-1 rounded-control bg-cave-900 border border-cave-800 mb-3 overflow-x-auto">
        {tabs.map(({ id, label, Icon, badge }) => (
          <button
            key={id}
            onClick={() => setSubTab(id)}
            aria-current={subTab === id ? 'page' : undefined}
            className={`flex-1 min-w-fit px-2 min-h-touch rounded-control flex items-center justify-center gap-1.5
                        text-sm font-medium transition-colors ${
                          subTab === id
                            ? 'bg-ebc-straw text-cave-950'
                            : 'text-cave-400 hover:text-cave-100'
                        }`}
          >
            <Icon className="w-4 h-4 shrink-0" />
            <span>{label}</span>
            {badge !== undefined && badge > 0 && (
              <span
                className={`font-mono text-footnote px-1.5 rounded-full ${
                  subTab === id ? 'bg-cave-950/20' : 'bg-alert text-cave-50'
                }`}
              >
                {badge}
              </span>
            )}
          </button>
        ))}
      </nav>

      {subTab === 'hops' && <HopIndexPanel createRequest={createRequest} onNotice={onSuccessMessage} />}

      {subTab === 'stock' && (
        <EntityList
          className="flex-1"
          items={allItems}
          keyOf={(i) => i.ref}
          groupOf={(i) => i.category}
          groupOrder={GROUP_ORDER}
          searchKeys={['name', 'ref', 'category', 'supplier']}
          isFavorite={(i) => !!i.favorite}
          searchPlaceholder="Chercher un malt, un houblon, une levure…"
          header={
            <Button
              intent="secondary"
              full
              onClick={() => setCreating(true)}
              icon={<Plus className="w-5 h-5" />}
            >
              Ajouter un article
            </Button>
          }
          emptyState={
            <div className="py-12 text-center space-y-3">
              <p className="text-base text-cave-200">Aucun article en stock</p>
              <p className="text-sm text-cave-400 max-w-xs mx-auto leading-relaxed">
                Les articles se créent ici, ou automatiquement en enregistrant un achat.
              </p>
              <Button intent="primary" onClick={() => setCreating(true)}>
                Ajouter le premier article
              </Button>
            </div>
          }
          renderItem={(item) => (
            <StockRow
              item={item}
              batches={batches}
              onOpen={setSelected}
              onQuickAdjust={() => {}}
              onToggleFavorite={(i) => StorageService.toggleFavorite('stockItem', i.ref)}
            />
          )}
        />
      )}

      {subTab === 'courses' && (
        <div className="flex-1 overflow-y-auto space-y-4 pb-4">
          {totalToOrder === 0 ? (
            <div className="py-12 text-center space-y-2">
              <p className="text-base text-cave-200">Rien à commander</p>
              <p className="text-sm text-cave-400 max-w-xs mx-auto leading-relaxed">
                Le stock couvre les brassins planifiés et les seuils minimums.
              </p>
            </div>
          ) : (
            shoppingBySupplier.map(([supplier, list]) => (
              <section key={supplier} className="panel p-4 space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-base font-semibold text-cave-50 truncate">{supplier}</h3>
                  <Button intent="secondary" onClick={() => copyList(supplier, list)}>
                    {copiedSupplier === supplier ? (
                      <>
                        <Check className="w-4 h-4" /> Copié
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" /> Copier
                      </>
                    )}
                  </Button>
                </div>

                <ul>
                  {list.map(({ item, missing }) => (
                    <li
                      key={item.ref}
                      className="flex items-baseline justify-between gap-3 py-2.5
                                 border-b border-cave-800 last:border-0"
                    >
                      <span className="text-base text-cave-200 min-w-0 truncate">{item.name}</span>
                      <span className="font-mono text-base text-ebc-straw shrink-0">
                        {Units.format(missing, item.unit)}
                      </span>
                    </li>
                  ))}
                </ul>
              </section>
            ))
          )}
        </div>
      )}

      {subTab === 'futs' && <KegBoard kegs={stocks.kegs} batches={batches} className="flex-1" />}

      {subTab === 'materiel' && (
        <EquipmentList
          equipment={stocks.equipment}
          onOpen={setEquipmentSheet}
          className="flex-1"
        />
      )}

      {/* Le matériel se modifie et se supprime : il n'était que consultable. */}
      <EquipmentSheet
        item={equipmentSheet}
        onClose={() => setEquipmentSheet(null)}
        onSave={(item) => {
          const exists = stocks.equipment.some((e) => e.ref === item.ref);
          if (exists) StorageService.updateEquipment(item);
          else StorageService.addEquipment(item);
          onSuccessMessage?.(`${item.name} enregistré.`);
        }}
        onDelete={(item) => {
          StorageService.deleteEquipment(item.ref);
          onSuccessMessage?.(`${item.name} supprimé.`);
        }}
      />

      <KegSheet
        keg={kegSheet}
        batches={batches}
        onClose={() => setKegSheet(null)}
        onSave={(keg) => {
          const exists = stocks.kegs.some((k) => k.id === keg.id);
          if (exists) StorageService.updateKeg(keg);
          else StorageService.addKeg(keg);
          onSuccessMessage?.(`Fût ${keg.id} enregistré.`);
        }}
        onDelete={(keg) => {
          StorageService.deleteKeg(keg.id);
          onSuccessMessage?.(`Fût ${keg.id} supprimé.`);
        }}
      />

      <StockDetailSheet
        item={selected}
        batches={batches}
        onClose={() => setSelected(null)}
        onSave={(item) => StorageService.updateStockItem(typeOf(item), item)}
        onDelete={(item) => StorageService.deleteStockItem(typeOf(item), item.ref)}
        onCorrectInventory={(item) => {
          setSelected(null);
          setCorrecting(item);
        }}
        onToggleFavorite={(item) => {
          StorageService.toggleFavorite('stockItem', item.ref);
        }}
      />

      <InventoryCorrectionSheet
        open={Boolean(correcting)}
        item={correcting}
        onClose={() => setCorrecting(null)}
        onConfirm={(qty, reason, note) =>
          correcting && applyCorrection(correcting, qty, reason, note)
        }
      />

      <NewStockItemSheet
        open={creating}
        onClose={() => setCreating(false)}
        onCreate={handleCreate}
      />
    </div>
  );
};

/** Création d'un article : le strict minimum, le reste se complète depuis la fiche. */
const NewStockItemSheet: React.FC<{
  open: boolean;
  onClose: () => void;
  onCreate: (draft: Partial<StockItem>) => void;
}> = ({ open, onClose, onCreate }) => {
  const [draft, setDraft] = useState<Partial<StockItem>>({
    unit: 'kg',
    currentStock: 0,
    minStock: 0
  });

  useEffect(() => {
    if (open) setDraft({ unit: 'kg', currentStock: 0, minStock: 0 });
  }, [open]);

  // Catégories et unités proposées d'après ce qui existe DÉJÀ en stock,
  // complétées par les catégories métier connues. Rien d'inventé.
  const categoryOptions = Array.from(
    new Set([...Suggestions.knownCategories(), ...GROUP_ORDER])
  ).map((c) => ({ value: c, label: c }));
  const unitOptions = Suggestions.knownUnits().map((u) => ({ value: u, label: u }));

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Nouvel article"
      subtitle="La référence est attribuée automatiquement"
      footer={
        <div className="flex gap-3">
          <Button intent="secondary" full onClick={onClose}>
            Annuler
          </Button>
          <Button
            intent="primary"
            full
            disabled={!draft.name?.trim()}
            onClick={() => onCreate(draft)}
          >
            Créer l'article
          </Button>
        </div>
      }
    >
      <FormNav
        className="space-y-4"
        onSubmit={() => draft.name?.trim() && onCreate(draft)}
      >
        <Field label="Nom" htmlFor="new-name">
          <TextInput
            id="new-stock-item"
            name="stock_creation_item_title"
            placeholder="Malt Pale Ale, Houblon Citra…"
            value={draft.name || ''}
            onChange={(name) => setDraft({ ...draft, name })}
          />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Catégorie">
            <Combobox
              value={draft.category || ''}
              onChange={(category) => setDraft({ ...draft, category })}
              options={categoryOptions}
              placeholder="Malt, Houblon…"
              allowCreate
              onCreate={(category) => setDraft({ ...draft, category })}
              createLabel={(v) => `Nouvelle catégorie « ${v} »`}
            />
          </Field>

          <Field label="Unité">
            <Combobox
              value={draft.unit || ''}
              onChange={(unit) => setDraft({ ...draft, unit })}
              options={unitOptions}
              placeholder="kg, g…"
              allowCreate
              onCreate={(unit) => setDraft({ ...draft, unit })}
              createLabel={(v) => `Nouvelle unité « ${v} »`}
            />
          </Field>
        </div>

        <p className="text-sm text-cave-400 leading-relaxed">
          Le stock démarre à zéro. Il se remplit en enregistrant un achat, ou directement depuis
          la fiche de l'article.
        </p>
      </FormNav>
    </Sheet>
  );
};
