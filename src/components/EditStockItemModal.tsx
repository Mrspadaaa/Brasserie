import React, { useState, useEffect } from 'react';
import { X, Save, Trash2, Package } from 'lucide-react';
import { StockItem } from '../types';
import { StorageService } from '../services/storage';

interface EditStockItemModalProps {
  isOpen: boolean;
  item: StockItem | null;
  type: 'rawMaterials' | 'cleaning';
  onClose: () => void;
  onSaved: () => void;
}

export const EditStockItemModal: React.FC<EditStockItemModalProps> = ({
  isOpen,
  item,
  type,
  onClose,
  onSaved
}) => {
  if (!isOpen || !item) return null;

  const [name, setName] = useState(item.name);
  const [category, setCategory] = useState(item.category);
  const [unit, setUnit] = useState(item.unit);
  const [currentStock, setCurrentStock] = useState<number>(item.currentStock);
  const [minStock, setMinStock] = useState<number>(item.minStock);
  const [maxStock, setMaxStock] = useState<number>(item.maxStock || 25);
  const [supplier, setSupplier] = useState(item.supplier || '');
  const [alphaPct, setAlphaPct] = useState<string>(item.alphaPct ? item.alphaPct.toString() : '');

  useEffect(() => {
    setName(item.name);
    setCategory(item.category);
    setUnit(item.unit);
    setCurrentStock(item.currentStock);
    setMinStock(item.minStock);
    setMaxStock(item.maxStock || 25);
    setSupplier(item.supplier || '');
    setAlphaPct(item.alphaPct ? item.alphaPct.toString() : '');
  }, [item]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: StockItem = {
      ...item,
      name: name.trim(),
      category,
      unit,
      currentStock,
      minStock,
      maxStock: maxStock > 0 ? maxStock : undefined,
      reorder: currentStock <= minStock,
      supplier: supplier.trim(),
      alphaPct: alphaPct ? parseFloat(alphaPct) : undefined
    };

    StorageService.updateStockItem(type, updated);
    onSaved();
    onClose();
  };

  const handleDelete = () => {
    if (confirm(`Supprimer définitivement l'article ${item.name} du stock ?`)) {
      StorageService.deleteStockItem(type, item.ref);
      onSaved();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-cave-950/80 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-md bg-cave-900 border border-cave-800 rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-cave-800 bg-cave-900/60">
          <div className="flex items-center space-x-2">
            <Package className="w-5 h-5 text-ebc-straw" />
            <div>
              <span className="text-footnote text-cave-500 font-mono font-bold">{item.ref}</span>
              <h3 className="font-bold text-base text-cave-50">Modifier l'article</h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-3 text-cave-400 hover:text-cave-200 bg-cave-850 rounded-full transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} autoComplete="off" className="p-5 overflow-y-auto space-y-3.5 text-sm">
          <div>
            <label className="text-cave-200 font-semibold block mb-1">Désignation de l'article</label>
            <input
              type="text"
              name="edit_stock_item_label"
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
              data-form-type="other"
              data-lpignore="true"
              data-1p-ignore="true"
              data-bwignore="true"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-cave-850 border border-cave-700 rounded-xl p-2.5 text-cave-50 font-medium focus:border-ebc-straw focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-cave-200 font-semibold block mb-1">Catégorie</label>
              <input
                type="text"
                name="edit_stock_category"
                autoComplete="off"
                autoCorrect="off"
                spellCheck={false}
                data-form-type="other"
                data-lpignore="true"
                data-1p-ignore="true"
                data-bwignore="true"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-cave-850 border border-cave-700 rounded-xl p-2.5 text-cave-50"
              />
            </div>
            <div>
              <label className="text-cave-200 font-semibold block mb-1">Unité</label>
              <input
                type="text"
                name="edit_stock_unit"
                autoComplete="off"
                autoCorrect="off"
                spellCheck={false}
                data-form-type="other"
                data-lpignore="true"
                data-1p-ignore="true"
                data-bwignore="true"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full bg-cave-850 border border-cave-700 rounded-xl p-2.5 text-cave-50 font-mono"
              />
            </div>
          </div>

          {/* Quantities: Stock actuel, Min, Max */}
          <div className="grid grid-cols-3 gap-2 bg-cave-950/70 p-3 rounded-2xl border border-cave-800">
            <div>
              <label className="text-footnote text-cave-400 font-semibold uppercase block mb-1">Stock Actuel</label>
              <input
                type="text"
                inputMode="decimal"
                name="edit_stock_current_qty"
                autoComplete="off"
                autoCorrect="off"
                spellCheck={false}
                data-form-type="other"
                data-lpignore="true"
                data-1p-ignore="true"
                data-bwignore="true"
                required
                value={currentStock}
                onChange={(e) => setCurrentStock(parseFloat(e.target.value.replace(',', '.')) || 0)}
                className="w-full bg-cave-850 border border-cave-700 rounded-xl p-2 text-center text-cave-50 font-bold font-mono"
              />
            </div>
            <div>
              <label className="text-footnote text-alert font-semibold uppercase block mb-1">Seuil Mini</label>
              <input
                type="text"
                inputMode="decimal"
                name="edit_stock_min_threshold"
                autoComplete="off"
                autoCorrect="off"
                spellCheck={false}
                data-form-type="other"
                data-lpignore="true"
                data-1p-ignore="true"
                data-bwignore="true"
                required
                value={minStock}
                onChange={(e) => setMinStock(parseFloat(e.target.value.replace(',', '.')) || 0)}
                className="w-full bg-cave-850 border border-cave-700 rounded-xl p-2 text-center text-alert font-bold font-mono"
              />
            </div>
            <div>
              <label className="text-footnote text-hop font-semibold uppercase block mb-1">Stock Max</label>
              <input
                type="text"
                inputMode="decimal"
                name="edit_stock_max_capacity"
                autoComplete="off"
                autoCorrect="off"
                spellCheck={false}
                data-form-type="other"
                data-lpignore="true"
                data-1p-ignore="true"
                data-bwignore="true"
                value={maxStock}
                onChange={(e) => setMaxStock(parseFloat(e.target.value.replace(',', '.')) || 0)}
                className="w-full bg-cave-850 border border-cave-700 rounded-xl p-2 text-center text-hop font-bold font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-cave-200 font-semibold block mb-1">Fournisseur</label>
              <input
                type="text"
                name="edit_stock_vendor_ref"
                autoComplete="off"
                autoCorrect="off"
                spellCheck={false}
                data-form-type="other"
                data-lpignore="true"
                data-1p-ignore="true"
                data-bwignore="true"
                value={supplier}
                onChange={(e) => setSupplier(e.target.value)}
                className="w-full bg-cave-850 border border-cave-700 rounded-xl p-2.5 text-cave-50"
              />
            </div>

            {category === 'Houblon' ? (
              <div>
                <label className="text-cave-200 font-semibold block mb-1">% Alpha</label>
                <input
                  type="text"
                  inputMode="decimal"
                  name="edit_stock_alpha"
                  autoComplete="off"
                  autoCorrect="off"
                  spellCheck={false}
                  data-form-type="other"
                  data-lpignore="true"
                  data-1p-ignore="true"
                  data-bwignore="true"
                  value={alphaPct}
                  onChange={(e) => setAlphaPct(e.target.value)}
                  className="w-full bg-cave-850 border border-cave-700 rounded-xl p-2.5 text-cave-50 font-mono"
                />
              </div>
            ) : (
              <div />
            )}
          </div>

          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={handleDelete}
              className="px-3 py-2.5 bg-alert/10 hover:bg-alert/20 text-alert border border-alert/30 font-bold rounded-xl transition flex items-center"
            >
              <Trash2 className="w-4 h-4 mr-1" /> Supprimer
            </button>

            <div className="flex space-x-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 bg-cave-850 hover:bg-cave-800 text-cave-200 font-bold rounded-xl transition"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 bg-gradient-to-r from-ebc-straw to-ebc-amber hover:from-ebc-gold text-cave-950 font-bold rounded-xl shadow-lg transition flex items-center space-x-1"
              >
                <Save className="w-4 h-4 mr-1" />
                <span>Enregistrer</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
