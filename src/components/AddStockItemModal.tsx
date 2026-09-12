import { Input } from '../ui/Input';
import React, { useState } from 'react';
import { X, Plus, Package } from 'lucide-react';
import { StockItem } from '../types';
import { StorageService } from '../services/storage';
import { nextUniqueRef } from '../services/refs';
import { TextInput } from '../ui/TextInput';

interface AddStockItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdded: (item: StockItem) => void;
}

export const AddStockItemModal: React.FC<AddStockItemModalProps> = ({
  isOpen,
  onClose,
  onAdded
}) => {
  if (!isOpen) return null;

  const [name, setName] = useState('');
  const [category, setCategory] = useState('Malt');
  const [unit, setUnit] = useState('kg');
  const [currentStock, setCurrentStock] = useState<number>(0);
  const [minStock, setMinStock] = useState<number>(1);
  const [maxStock, setMaxStock] = useState<number>(25);
  const [supplier, setSupplier] = useState('Brau-Rauchshop');
  const [alphaPct, setAlphaPct] = useState<string>('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const isCleaning = category.includes('CIP') || category.includes('Désinfectant') || category.includes('EPI') || category.includes('Détergent') || category.includes('Sols');
    const type = isCleaning ? 'cleaning' : 'rawMaterials';
    const prefix = isCleaning ? 'NT' : 'MP';
    // Référence séquentielle, jamais aléatoire : depuis Firestore la référence
    // est l'identifiant du document, une collision effacerait un article existant.
    const stocks = StorageService.getStocks();
    const ref = nextUniqueRef(prefix, [
      ...stocks.rawMaterials.map((i) => i.ref),
      ...stocks.cleaning.map((i) => i.ref)
    ]);

    const newItem: StockItem = {
      id: `STOCK-${Date.now()}`,
      ref,
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

    StorageService.addStockItem(type, newItem);
    onAdded(newItem);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-cave-950/80 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-md bg-cave-900 border border-cave-800 rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-cave-800 bg-cave-900/60">
          <div className="flex items-center space-x-2">
            <Package className="w-5 h-5 text-ebc-straw" />
            <h3 className="font-bold text-base text-cave-50">Ajouter un article en stock</h3>
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
            <TextInput
              name="stock_item_label"
              required
              placeholder="ex: Malt Munich Typ 2, Houblon Simcoe..."
              value={name}
              onChange={setName}
              className="w-full bg-cave-850 border border-cave-700 rounded-xl p-2.5 text-cave-50 font-medium focus:border-ebc-straw focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-cave-200 font-semibold block mb-1">Catégorie</label>
              <select
                name="stock_category"
                autoComplete="off"
                data-form-type="other"
                value={category}
                onChange={(e) => {
                  const cat = e.target.value;
                  setCategory(cat);
                  if (cat === 'Houblon') setUnit('g');
                  else if (cat === 'Levure') setUnit('sachet');
                  else if (cat === 'Malt' || cat === 'Sucre') setUnit('kg');
                  else if (cat.includes('CIP') || cat.includes('Désinfectant')) setUnit('L');
                }}
                className="w-full bg-cave-850 border border-cave-700 rounded-xl p-2.5 text-cave-50"
              >
                <option value="Malt">🌾 Malt & Céréales</option>
                <option value="Houblon">🌿 Houblon</option>
                <option value="Levure">🧬 Levure</option>
                <option value="Sucre">🍬 Sucre / Lactose</option>
                <option value="CIP alcalin">🧼 CIP Alcalin (Soude)</option>
                <option value="CIP acide">🧪 CIP Acide (Phosphorique)</option>
                <option value="Désinfectant">🧴 Désinfectant (Star San/Peracétique)</option>
                <option value="EPI">🧤 EPI & Consommables</option>
              </select>
            </div>

            <div>
              <label className="text-cave-200 font-semibold block mb-1">Unité</label>
              <select
                name="stock_unit"
                autoComplete="off"
                data-form-type="other"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full bg-cave-850 border border-cave-700 rounded-xl p-2.5 text-cave-50 font-mono"
              >
                <option value="kg">kg</option>
                <option value="g">g</option>
                <option value="sachet">sachet</option>
                <option value="L">Litre (L)</option>
                <option value="boîte">boîte</option>
                <option value="rouleau">rouleau</option>
              </select>
            </div>
          </div>

          {/* Quantities: Stock actuel, Stock min, Stock max */}
          <div className="grid grid-cols-3 gap-2 bg-cave-950/70 p-3 rounded-2xl border border-cave-800">
            <div>
              <label className="text-footnote text-cave-400 font-semibold uppercase block mb-1">Stock Actuel</label>
              <Input
                type="text"
                inputMode="decimal"
                name="stock_current_qty"
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
              <Input
                type="text"
                inputMode="decimal"
                name="stock_min_threshold"
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
              <Input
                type="text"
                inputMode="decimal"
                name="stock_max_capacity"
                autoComplete="off"
                autoCorrect="off"
                spellCheck={false}
                data-form-type="other"
                data-lpignore="true"
                data-1p-ignore="true"
                data-bwignore="true"
                placeholder="ex: 25"
                value={maxStock}
                onChange={(e) => setMaxStock(parseFloat(e.target.value.replace(',', '.')) || 0)}
                className="w-full bg-cave-850 border border-cave-700 rounded-xl p-2 text-center text-hop font-bold font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-cave-200 font-semibold block mb-1">Fournisseur</label>
              <TextInput
                name="stock_vendor_label"
                value={supplier}
                onChange={setSupplier}
                placeholder="Brau-Rauchshop, Landi..."
                className="w-full bg-cave-850 border border-cave-700 rounded-xl p-2.5 text-cave-50"
              />
            </div>

            {category === 'Houblon' ? (
              <div>
                <label className="text-cave-200 font-semibold block mb-1">% Acides Alpha</label>
                <Input
                  type="text"
                  inputMode="decimal"
                  name="stock_alpha_acid"
                  autoComplete="off"
                  autoCorrect="off"
                  spellCheck={false}
                  data-form-type="other"
                  data-lpignore="true"
                  data-1p-ignore="true"
                  data-bwignore="true"
                  placeholder="ex: 12.5"
                  value={alphaPct}
                  onChange={(e) => setAlphaPct(e.target.value)}
                  className="w-full bg-cave-850 border border-cave-700 rounded-xl p-2.5 text-cave-50 font-mono"
                />
              </div>
            ) : (
              <div />
            )}
          </div>

          <div className="flex space-x-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 bg-cave-850 hover:bg-cave-800 text-cave-200 font-bold rounded-xl transition"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 bg-gradient-to-r from-ebc-straw to-ebc-amber hover:from-ebc-gold text-cave-950 font-bold rounded-xl shadow-lg transition flex items-center justify-center space-x-1"
            >
              <Plus className="w-4 h-4 mr-1" />
              <span>Créer l'article</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
