import { Input } from '../ui/Input';
import React, { useState } from 'react';
import { Batch, StockItem } from '../types';
import { StockRow } from '../ui/StockRow';
import { EntityList } from '../ui/EntityList';
import { QuantityStepper } from '../ui/QuantityStepper';
import { Units } from '../services/units';
import { FormNav, Field, inputClass } from '../ui/FormNav';
import { Combobox } from '../ui/Combobox';
import { SliderField } from '../ui/SliderField';

/**
 * Banc d'essai de l'écran Stocks.
 *
 * Données fictives mais RÉALISTES : mêmes unités, mêmes ordres de grandeur et
 * mêmes noms allemands que le vrai catalogue. Sert à juger la densité, la
 * lisibilité et le défilement sans avoir à se connecter, et à mesurer le
 * comportement sur des milliers d'entrées.
 */

const CATS = ['Malt', 'Houblon', 'Levure', 'Additif', 'Emballage', 'CIP alcalin'];

const UNIT: Record<string, string> = {
  Malt: 'kg',
  Houblon: 'g',
  Levure: 'sachet',
  Additif: 'g',
  Emballage: 'pièce',
  'CIP alcalin': 'L'
};

const NAMES: Record<string, string[]> = {
  Malt: ['Pilsner Malz', 'Maris Otter', 'Caramünch Typ 2', 'Röstgerste', 'Weizenmalz hell', 'Haferflocken'],
  Houblon: ['Citra 12.4%', 'Idaho 7 12.7%', 'Nelson Sauvin 9.6%', 'Motueka 8.1%', 'Sabro 13.4%'],
  Levure: ['SafAle US-05', 'LALLEMAND Windsor', 'Verdant IPA', 'Safale BE-256'],
  Additif: ['Lactose', 'Protofloc', 'Gypse', 'Acide lactique 80%'],
  Emballage: ['Bouteille 33cl', 'Bouteille 75cl', 'Capsule 26mm', 'Étiquette kraft'],
  'CIP alcalin': ['Soude caustique', 'Star San', 'Acide peracétique']
};

function makeItems(n: number): StockItem[] {
  const out: StockItem[] = [];
  for (let i = 0; i < n; i += 1) {
    const cat = CATS[i % CATS.length];
    const pool = NAMES[cat];
    const withinCat = Math.floor(i / CATS.length);
    const base = pool[withinCat % pool.length];
    const unit = UNIT[cat];
    const scale = unit === 'g' ? 500 : unit === 'pièce' ? 300 : 20;
    out.push({
      id: `X-${i}`,
      ref: `MP-${String(i + 1).padStart(3, '0')}`,
      name: n > 50 ? `${base} #${Math.floor(withinCat / pool.length) + 1}` : base,
      category: cat,
      unit,
      currentStock: Math.round(((i * 37) % scale) * 10) / 10,
      minStock: unit === 'g' ? 100 : unit === 'kg' ? 5 : 2,
      reorder: false,
      supplier: i % 3 === 0 ? 'Brau-Rauchshop' : i % 3 === 1 ? 'Bauhaus' : undefined,
      favorite: i % 11 === 0,
      alphaPct: cat === 'Houblon' ? 12.4 : undefined
    });
  }
  return out;
}

/** Deux brassins planifiés : c'est eux qui donnent son sens à la jauge. */
const BATCHES: Batch[] = [
  {
    id: 'LOT-004',
    name: 'NEIPA Tropicale',
    style: 'NEIPA',
    volumeL: 30,
    brewDate: '15.09.2026',
    status: 'planifie',
    malts: [
      { name: 'Pilsner Malz', weightKg: 6 },
      { name: 'Haferflocken', weightKg: 1.5 }
    ],
    hops: [
      { name: 'Citra 12.4%', alpha: 12.4, weightG: 120, stage: 'dryHop', dayOffset: 3 },
      { name: 'Idaho 7 12.7%', alpha: 12.7, weightG: 80, stage: 'whirlpool', timeMin: 10, tempC: 80 }
    ],
    yeastName: 'Verdant IPA (2 sachets)'
  },
  {
    id: 'LOT-005',
    name: 'Milk Stout #2',
    style: 'Stout',
    volumeL: 30,
    brewDate: '29.09.2026',
    status: 'planifie',
    malts: [
      { name: 'Maris Otter', weightKg: 5 },
      { name: 'Röstgerste', weightKg: 0.5 }
    ],
    hops: [{ name: 'Motueka 8.1%', alpha: 8.1, weightG: 30, stage: 'boil', timeMin: 60 }],
    adjuncts: [{ name: 'Lactose', amount: 500, unit: 'g', step: 'Ébullition' }],
    yeastName: 'LALLEMAND Windsor (1 sachet)'
  }
];

export const StockPreview: React.FC = () => {
  const [count, setCount] = useState(24);
  const [items, setItems] = useState(() => makeItems(24));
  const [qty, setQty] = useState(18.5);
  const [cat, setCat] = useState('Malt');
  const [fournisseur, setFournisseur] = useState('');
  const [co2, setCo2] = useState(2.3);
  const [nom, setNom] = useState('');
  const [journal, setJournal] = useState<string[]>([]);

  const regen = (n: number) => {
    setCount(n);
    setItems(makeItems(n));
  };

  const adjust = (item: StockItem, delta: number) => {
    setItems((prev) =>
      prev.map((i) =>
        i.ref === item.ref
          ? { ...i, currentStock: Units.round(Math.max(0, i.currentStock + delta), i.unit) }
          : i
      )
    );
  };

  const toggleFav = (item: StockItem) => {
    setItems((prev) => prev.map((i) => (i.ref === item.ref ? { ...i, favorite: !i.favorite } : i)));
  };

  return (
    <div className="h-screen bg-cave-950 text-cave-200 font-sans">
      <div className="max-w-md mx-auto px-4 py-6 flex flex-col h-full">
        <header className="shrink-0 space-y-3 pb-4">
          <h1 className="text-xl font-semibold text-cave-50">Écran Stocks</h1>
          <p className="text-sm text-cave-400 leading-relaxed">
            Une seule carte pour toutes les catégories. L'unité de l'article pilote le format et
            les paliers — le houblon s'affiche bien en grammes.
          </p>
          <div className="flex gap-2">
            {[24, 200, 5000].map((n) => (
              <button
                key={n}
                onClick={() => regen(n)}
                className={`flex-1 min-h-touch rounded-control border text-sm transition-colors ${
                  count === n
                    ? 'bg-ebc-straw text-cave-950 border-ebc-straw'
                    : 'bg-cave-900 border-cave-700 text-cave-400'
                }`}
              >
                {n.toLocaleString('fr-CH')}
              </button>
            ))}
          </div>
        </header>

        <section className="shrink-0 panel p-4 mb-4">
          <QuantityStepper
            label="Compteur — paliers adaptés à l'unité"
            value={qty}
            initialValue={18.5}
            onChange={setQty}
            unit="kg"
            projection={
              <>
                <span className="font-mono text-cave-400">18.5 kg</span>
                <span className="text-cave-600"> ➔ </span>
                <span className="font-mono text-hop">{Units.format(qty, 'kg')}</span>
              </>
            }
          />
        </section>

        {/* Banc d'essai clavier : Entrée enchaîne les champs, l'autocomplétion
            se pilote aux flèches, le curseur reste saisissable au chiffre. */}
        <section className="shrink-0 panel p-4 mb-4 space-y-4">
          <h2 className="text-base font-semibold text-cave-50">Saisie au clavier</h2>

          <FormNav
            className="space-y-4"
            onSubmit={() =>
              setJournal((j) => [`Validé : ${nom || '(sans nom)'} · ${cat} · ${fournisseur || '—'}`, ...j].slice(0, 3))
            }
          >
            <Field label="Nom de l'article" htmlFor="kb-nom">
              <Input
                id="kb-title"
                name="preview_stock_item_label"
                type="text"
                autoComplete="off"
                autoCorrect="off"
                spellCheck={false}
                data-form-type="other"
                data-lpignore="true"
                data-1p-ignore="true"
                data-bwignore="true"
                className={inputClass}
                placeholder="Tape puis appuie sur Entrée"
                value={nom}
                onChange={(e) => setNom(e.target.value)}
              />
            </Field>

            <Field label="Catégorie">
              <Combobox
                value={cat}
                onChange={setCat}
                options={CATS.map((c) => ({ value: c, label: c }))}
                placeholder="Malt, Houblon…"
              />
            </Field>

            <Field label="Fournisseur">
              <Combobox
                value={fournisseur}
                onChange={setFournisseur}
                options={[
                  { value: 'Brau-Rauchshop', label: 'Brau-Rauchshop', detail: '26 achats enregistrés', favorite: true },
                  { value: 'Bauhaus', label: 'Bauhaus', detail: '4 achats enregistrés' },
                  { value: 'Landi', label: 'Landi', detail: '3 achats enregistrés' }
                ]}
                placeholder="Chercher un fournisseur…"
                allowCreate
                onCreate={setFournisseur}
                createLabel={(v) => `Nouveau fournisseur « ${v} »`}
              />
            </Field>

            <p className="text-sm text-cave-600">
              Entrée passe au champ suivant · Ctrl+Entrée valide
            </p>
          </FormNav>

          <SliderField
            label="Carbonatation visée"
            value={co2}
            onChange={setCo2}
            min={1.5}
            max={3.5}
            step={0.1}
            unit="vol"
            readout={co2 < 2 ? 'Stout, ale douce' : co2 < 2.7 ? 'Lager, pale ale' : 'Blanche, saison'}
            marks={[
              { value: 1.5, label: '1.5' },
              { value: 2.5, label: '2.5' },
              { value: 3.5, label: '3.5' }
            ]}
          />

          {journal.length > 0 && (
            <ul className="space-y-1 pt-2 border-t border-cave-800">
              {journal.map((l, i) => (
                <li key={i} className="text-sm text-hop font-mono">{l}</li>
              ))}
            </ul>
          )}
        </section>

        <EntityList
          className="flex-1"
          items={items}
          keyOf={(i) => i.ref}
          groupOf={(i) => i.category}
          groupOrder={CATS}
          searchKeys={['name', 'ref', 'category', 'supplier']}
          isFavorite={(i) => !!i.favorite}
          searchPlaceholder="Chercher un malt, un houblon…"
          renderItem={(item) => (
            <StockRow
              item={item}
              batches={BATCHES}
              onOpen={() => {}}
              onQuickAdjust={adjust}
              onToggleFavorite={toggleFav}
            />
          )}
        />
      </div>
    </div>
  );
};
