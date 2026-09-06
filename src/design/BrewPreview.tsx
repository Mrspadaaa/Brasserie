import React, { useState } from 'react';
import { Recipe, Batch, StockItem, AppConfig, WaterSource } from '../types';
import { RecipePage } from '../pages/RecipePage';
import { BrewWizard } from '../pages/BrewWizard';
import { BrewDayPage } from '../pages/BrewDayPage';
import { SaltSolver, WaterState } from '../ui/SaltSolver';
import { PageShell } from '../pages/PageShell';
import { captureSnapshot } from '../domain/recipeSnapshot';
import { defaultConfig } from '../services/storage';
import { BrewingMath, kettleHopGrams } from '../services/brewingMath';

/**
 * Banc d'essai du brassage, sans connexion.
 *
 * La recette est la NEIPA de Brew Your Own citée par Gaëtan, saisie ici avec
 * ses vraies valeurs — 8 ajouts de houblon répartis sur quatre étapes, couleurs
 * EBC et potentiels d'extrait renseignés — pour juger la fiche, l'assistant et
 * le déroulé minuté sur un cas réel plutôt que sur des données rondes.
 */

const CONFIG: AppConfig = defaultConfig;

const NEIPA: Recipe = {
  id: 'REC-DEMO',
  name: 'New England IPA',
  style: 'NEIPA',
  volumeL: 19,
  brewDate: '15.09.2026',
  boilMin: 75,
  ogTarget: 1.061,
  fgTarget: 1.012,
  abvTarget: 6.5,
  ibuTarget: 56,
  totalGristKg: 5.8,
  fermentables: [
    { name: 'US 2-row', weightKg: 4.1, kind: 'grain', use: 'empatage', colorEbc: 4, potentialPpg: 37 },
    { name: 'UK Golden Promise', weightKg: 0.91, kind: 'grain', use: 'empatage', colorEbc: 6, potentialPpg: 38 },
    { name: 'Flaked wheat', weightKg: 0.45, kind: 'grain', use: 'empatage', colorEbc: 4, potentialPpg: 34 },
    { name: 'Flaked oats', weightKg: 0.34, kind: 'grain', use: 'empatage', colorEbc: 2, potentialPpg: 33 }
  ],
  hops: [
    { name: 'Amarillo', alpha: 8.6, weightG: 43, stage: 'firstWort' },
    { name: 'Amarillo', alpha: 8.6, weightG: 43, stage: 'boil', timeMin: 0 },
    { name: 'Citra', alpha: 12, weightG: 28, stage: 'whirlpool', timeMin: 20, tempC: 82 },
    { name: 'Galaxy', alpha: 14, weightG: 28, stage: 'whirlpool', timeMin: 20, tempC: 82 },
    { name: 'Mosaic', alpha: 12.5, weightG: 28, stage: 'whirlpool', timeMin: 20, tempC: 82 },
    { name: 'Citra', alpha: 12, weightG: 85, stage: 'dryHop', dayOffset: 2 },
    { name: 'Galaxy', alpha: 14, weightG: 43, stage: 'dryHop', dayOffset: 6 },
    { name: 'Mosaic', alpha: 12.5, weightG: 43, stage: 'dryHop', dayOffset: 9 }
  ],
  yeast: {
    name: 'Vermont IPA',
    lab: 'GigaYeast',
    strain: 'GY054',
    form: 'liquide',
    qty: 1,
    unit: 'flacon',
    pitchTempC: 18,
    fermTempMinC: 18,
    fermTempMaxC: 21,
    attenuationPct: 80,
    fermentDays: 12,
    notes: 'Équivalence proposée par la recette : White Labs WLP095 (Burlington Ale)'
  },
  mash: {
    steps: [{ name: 'Empâtage', tempC: 67, durationMin: 60 }],
    ratioLPerKg: 3.2,
    mashoutTempC: 76,
    spargeTempC: 76,
    spargeType: 'fly'
  },
  /*
   * ⚠️ LE PLAN D'EAU MODERNE, et non plus le bloc `water` déprécié.
   *
   * Trouvé en testant l'app : le banc d'essai — dont le rôle est justement de
   * juger « la fiche, l'assistant et le déroulé minuté sur un cas réel » —
   * portait encore l'ancienne forme. Le jour de brassage tombait donc sur la
   * branche de repli : il annonçait « 70 % d'osmosée · gypse 2 g » sans un
   * volume, et le contrôle de collecte avant ébullition n'apparaissait jamais,
   * faute de savoir combien d'eau entrait dans la cuve. Le banc validait un
   * chemin que plus aucune recette n'emprunte.
   */
  waterPlan: {
    sourceId: 'w-fribourg',
    diRatioPct: 70,
    targetProfileId: '21C',
    mashWaterL: 18.5,
    spargeWaterL: 12.5,
    // Tous les sels à l'empâtage : la pratique recommandée, et le défaut.
    mash: { gypse: 2, cacl2: 6 },
    sparge: {},
    allSaltsInMash: true,
    acid: { id: 'lactique', mash: 0, sparge: 4.5 },
    /*
     * Les deux eaux FIGÉES — c'est d'elles que la fiche recette redessine sa
     * toile, sans jamais retourner chercher l'analyse de la source.
     * Départ : Villars coupée à 70 % d'osmosée. Moût : plus 2 g de gypse et
     * 6 g de chlorure de calcium dans 31 L.
     */
    startIons: { ca: 27.6, mg: 5.4, na: 2.4, so4: 7.2, cl: 4.2, hco3: 84 },
    wortIons: { ca: 95.4, mg: 5.4, na: 2.4, so4: 43.2, cl: 97.5, hco3: 84 },
    targetPh: 5.4
  },
  fermentation: [
    { kind: 'primaire', name: 'Fermentation primaire', tempC: 18, days: 5 },
    { kind: 'ajout', name: 'Houblonnage à cru', tempC: 19, days: 3, note: 'Fermentation encore active — biotransformation.' },
    { kind: 'garde', name: 'Froid court', tempC: 4, days: 2 }
  ],
  instructions:
    'Mash in all the grains at 152 °F (67 °C) and hold for 60 minutes. Raise to 168 °F (76 °C) to mashout. Fly sparge until 6.5 gallons (25 L) of wort is collected. Boil for 75 minutes. Cool to 180 °F (82 °C) then add the hop stand hops for 20 minutes. Chill to 64 °F (18 °C), oxygenate, pitch.',
  steps: [],
  notes: []
};

const STOCK: StockItem[] = [
  { id: '1', ref: 'MP-001', name: 'US 2-row', category: 'Malt', unit: 'kg', currentStock: 12, minStock: 5, reorder: false, colorEbc: 4, potentialPpg: 37, favorite: true },
  { id: '2', ref: 'MP-002', name: 'UK Golden Promise', category: 'Malt', unit: 'kg', currentStock: 0.4, minStock: 2, reorder: true, colorEbc: 6, potentialPpg: 38 },
  { id: '3', ref: 'MP-003', name: 'Flaked oats', category: 'Malt', unit: 'kg', currentStock: 3, minStock: 1, reorder: false, colorEbc: 2, potentialPpg: 33 },
  { id: '4', ref: 'MP-010', name: 'Citra', category: 'Houblon', unit: 'g', currentStock: 250, minStock: 100, reorder: false, alphaPct: 12 },
  { id: '5', ref: 'MP-011', name: 'Galaxy', category: 'Houblon', unit: 'g', currentStock: 80, minStock: 100, reorder: true, alphaPct: 14 },
  { id: '6', ref: 'MP-012', name: 'Röstgerste', category: 'Malt', unit: 'kg', currentStock: 2, minStock: 1, reorder: false, colorEbc: 1300, potentialPpg: 25 },
  { id: '7', ref: 'MP-020', name: 'Verdant IPA', category: 'Levure', unit: 'sachet', currentStock: 2, minStock: 1, reorder: false, yeastLab: 'LALLEMAND', yeastStrain: 'Verdant', yeastForm: 'sèche', yeastAttenuationPct: 78, yeastTempMinC: 18, yeastTempMaxC: 23 }
];

const BATCH: Batch = {
  id: 'LOT-DEMO',
  name: 'New England IPA',
  style: 'NEIPA',
  volumeL: 19,
  brewDate: '15.09.2026',
  status: 'planifie',
  recipeRef: NEIPA.id,
  recipeSnapshot: captureSnapshot(NEIPA)
};

const SAMPLE_WATER: WaterSource = {
  id: 'w-fribourg',
  name: 'Villars-sur-Glâne (Réseau Fribourg)',
  ca: 92,
  mg: 18,
  na: 8,
  so4: 24,
  cl: 14,
  hco3: 280,
  ph: 7.4,
  note: 'Analyse communale 2026'
};

type View = 'recette' | 'assistant' | 'brassage' | 'eau';

export const BrewPreview: React.FC = () => {
  const initialView = (new URLSearchParams(location.search).get('view') as View) || 'recette';
  const [view, setView] = useState<View>(initialView);
  const [previewRecipe, setPreviewRecipe] = useState(NEIPA);
  const [batch, setBatch] = useState(BATCH);
  const [waterSource, setWaterSource] = useState<WaterSource>(SAMPLE_WATER);
  const [waterState, setWaterState] = useState<WaterState>({
    diRatioPct: 70,
    styleCode: 'NEIPA',
    doses: { gypse: 2, cacl2: 6 },
    disabled: [],
    acidId: 'lactique',
    mashWaterL: 18.5,
    spargeWaterL: 12.5
  });
  /*
   * ⚠️ La décision « pas de rinçage » est un ÉTAT à part, jamais déduite du
   * volume : le déduire faisait disparaître l'onglet Rinçage au premier
   * caractère effacé, et la frappe suivante écrasait le volume d'empâtage.
   */
  const [noSparge, setNoSparge] = useState(false);

  /** Les volumes que le grain et l'installation commandent, comme dans l'assistant. */
  const waterVolumes = BrewingMath.waterVolumes(
    NEIPA.totalGristKg ?? 0,
    NEIPA.volumeL,
    defaultConfig.brewhouses[0],
    noSparge ? 'none' : 'batch',
    NEIPA.boilMin,
    kettleHopGrams(NEIPA.hops)
  );
  const [journal, setJournal] = useState<string[]>([]);

  const log = (msg: string) => setJournal((j) => [msg, ...j].slice(0, 6));

  return (
    <div className="min-h-screen bg-cave-950 text-cave-200 font-sans">
      <div className="max-w-3xl mx-auto px-4 py-6 space-y-4">
        <header className="space-y-2">
          <h1 className="text-xl font-semibold text-cave-50">Brassage — banc d’essai</h1>
          <p className="text-sm text-cave-400 leading-relaxed">
            La NEIPA de Brew Your Own, avec ses huit ajouts de houblon sur quatre moments.
            Les chiffres affichés sont calculés, pas saisis.
          </p>
          <div className="flex gap-2">
            {(['recette', 'assistant', 'brassage', 'eau'] as View[]).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`flex-1 min-h-touch rounded-control border text-sm capitalize transition-colors ${
                  view === v
                    ? 'bg-ebc-straw text-cave-950 border-ebc-straw'
                    : 'bg-cave-900 border-cave-700 text-cave-400'
                }`}
              >
                {v}
              </button>
            ))}
          </div>
        </header>

        {journal.length > 0 && (
          <ul className="panel p-3 space-y-1">
            {journal.map((l, i) => (
              <li key={i} className="text-sm text-hop font-mono">
                {l}
              </li>
            ))}
          </ul>
        )}
      </div>

      {view === 'recette' && (
        <RecipePage
          recipe={previewRecipe}
          batches={[{ ...batch, og: '1.058', status: 'fermentation' }]}
          config={CONFIG}
          onClose={() => log('Fermeture demandée')}
          onEdit={() => setView('assistant')}
          onDuplicate={() => log('Duplication')}
          onDelete={() => log('Suppression')}
          onBrew={() => setView('brassage')}
          onOpenBatch={() => setView('brassage')}
        />
      )}

      {view === 'assistant' && (
        <BrewWizard
          seed={{ recipe: previewRecipe }}
          stockItems={STOCK}
          config={CONFIG}
          knownStyles={['NEIPA', 'Stout', 'Saison', 'Pilsner']}
          onClose={() => setView('recette')}
          onCreateStockItem={(name, category, unit) => {
            log(`Article créé : ${name} (${category}, ${unit})`);
            const created: StockItem = {
              id: name,
              ref: `MP-${STOCK.length + 1}`,
              name,
              category,
              unit,
              currentStock: 0,
              minStock: 0,
              reorder: false
            };
            STOCK.push(created);
            return created;
          }}
          /* Le banc écrit dans son stock en mémoire : on peut donc vérifier que
             la fiche retrouvée SURVIT, en rouvrant l'assistant. */
          onLearnIngredient={(name, facts) => {
            const item = STOCK.find((s) => s.name.toLowerCase() === name.toLowerCase());
            if (!item) return;
            const retenus = Object.entries(facts).filter(
              ([cle, v]) => v != null && (item as unknown as Record<string, unknown>)[cle] == null
            );
            if (retenus.length === 0) return;
            Object.assign(item, Object.fromEntries(retenus));
            log(`Fiche retenue pour ${name} : ${retenus.map(([k]) => k).join(', ')}`);
          }}
          onSaveWaterSource={(w) => log(`Analyse « ${w.name} » enregistrée.`)}
          onSave={(r, brew) => {
            setPreviewRecipe(r);
            log(`Enregistré : ${r.name} · ${r.hops.length} houblons · ${brew ? 'brassin lancé' : 'recette seule'}`);
            setView(brew ? 'brassage' : 'recette');
          }}
        />
      )}

      {view === 'brassage' && (
        <BrewDayPage
          batch={batch}
          config={CONFIG}
          stockItems={STOCK}
          onClose={() => setView('recette')}
          onSave={(b) => setBatch(b)}
          onFinish={(b) => {
            log(`Brassage clôturé · OG ${b.og ?? '—'} · statut ${b.status}`);
            setBatch(b);
            setView('recette');
          }}
        />
      )}

      {view === 'eau' && (
        <PageShell
          title="Traitement de l’eau"
          subtitle="Atelier sels minéraux & profil de brassage"
          onClose={() => setView('recette')}
        >
          <SaltSolver
            source={waterSource}
            onSourceChange={setWaterSource}
            beerEbc={9.4}
            beerVolumeL={NEIPA.volumeL}
            /* La NEIPA du banc d'essai, telle que l'assistant la passerait. */
            brew={{
              grist: NEIPA.fermentables,
              totalGristKg: NEIPA.totalGristKg,
              hops: NEIPA.hops,
              ibu: NEIPA.ibuTarget ?? null,
              og: NEIPA.ogTarget ?? null,
              volumes: waterVolumes,
              boilMin: NEIPA.boilMin
            }}
            onMashRatioChange={(lPerKg) => {
              const v = BrewingMath.waterVolumes(
                NEIPA.totalGristKg ?? 0,
                NEIPA.volumeL,
                { ...defaultConfig.brewhouses[0], mashRatioLPerKg: lPerKg },
                noSparge ? 'none' : 'batch',
                NEIPA.boilMin,
                kettleHopGrams(NEIPA.hops)
              );
              setWaterState((s) => ({
                ...s,
                mashWaterL: v.mashWaterL,
                spargeWaterL: v.spargeWaterL
              }));
            }}
            state={waterState}
            onChange={(s) => setWaterState(s)}
            noSparge={noSparge}
            onNoSpargeChange={(off) => {
              setNoSparge(off);
              setWaterState((s) => ({ ...s, spargeWaterL: off ? 0 : 12.5 }));
            }}
          />
        </PageShell>
      )}
    </div>
  );
};
