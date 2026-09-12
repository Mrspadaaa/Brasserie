import React, { useState } from 'react';
import { Reading } from '../components/ui/Reading';
import { Stepper } from '../components/ui/Stepper';
import { Button, IconButton } from '../components/ui/Button';
import { Camera, Beer, Settings2 } from 'lucide-react';
import { Header } from '../components/Header';
import { BottomNav } from '../components/BottomNav';
import { defaultConfig } from '../services/storage';

/**
 * Banc d'essai visuel du système de design.
 *
 * Accessible en développement via `?preview=design`. Il ne lit AUCUNE donnée
 * réelle et ne touche ni à l'authentification ni à Firestore : c'est une page
 * purement présentationnelle, qui sert à juger la palette, l'échelle
 * typographique et les composants sans avoir à se connecter.
 */

const Section: React.FC<{ title: string; note?: string; children: React.ReactNode }> = ({
  title,
  note,
  children
}) => (
  <section className="space-y-4">
    <div className="space-y-1">
      <h2 className="text-xl text-cave-50 font-semibold">{title}</h2>
      {note && <p className="text-sm text-cave-400 max-w-prose">{note}</p>}
    </div>
    {children}
  </section>
);

const Swatch: React.FC<{ name: string; value: string; dark?: boolean }> = ({
  name,
  value,
  dark
}) => (
  <div className="flex items-center gap-3">
    <div
      className="w-touch h-touch rounded-control border border-cave-800 shrink-0"
      style={{ background: value }}
    />
    <div className="min-w-0">
      <div className={`text-base ${dark ? 'text-cave-400' : 'text-cave-50'}`}>{name}</div>
      <div className="font-mono text-sm text-cave-600">{value}</div>
    </div>
  </div>
);

export const DesignPreview: React.FC = () => {
  const [malt, setMalt] = useState(18.5);
  const [hops, setHops] = useState(75);
  const [bottles, setBottles] = useState(65);

  return (
    <div className="min-h-screen bg-cave-950 text-cave-200 font-sans">
      <div className="max-w-2xl mx-auto px-5 py-10 space-y-12">
        <header className="space-y-2 pb-6 border-b border-cave-800">
          <h1 className="text-2xl text-cave-50 font-bold">Système de design</h1>
          <p className="text-base text-cave-400">
            Brasserie L'Affinée — palette dérivée de l'échelle EBC, plancher typographique à
            14 px, cibles tactiles à 48 px minimum.
          </p>
        </header>

        <Section
          title="Fond"
          note="Charbon chaud dérivé du malt torréfié. L'ancien fond était un bleu-noir qui donnait à l'app une allure de tableau de bord de développeur — une cave n'est pas bleue."
        >
          <div className="grid grid-cols-2 gap-4">
            <Swatch name="Fond de page" value="#12100E" />
            <Swatch name="Surface" value="#1A1613" />
            <Swatch name="Surface haute" value="#221D19" />
            <Swatch name="Bordure" value="#2C2521" />
            <Swatch name="Texte secondaire" value="#9A8A7E" dark />
            <Swatch name="Texte courant" value="#D8CEC5" />
          </div>
        </Section>

        <Section
          title="Échelle EBC"
          note="La référence normalisée des brasseurs pour décrire la couleur d'un moût. Réservée au produit et à l'état des brassins : jamais pour une alerte."
        >
          <div className="grid grid-cols-2 gap-4">
            <Swatch name="Paille" value="#F2C14E" />
            <Swatch name="Or" value="#E0A02E" />
            <Swatch name="Ambre" value="#C87A2C" />
            <Swatch name="Cuivre" value="#A0522D" />
            <Swatch name="Brun" value="#6B3A1E" />
            <Swatch name="Stout" value="#3B1F14" />
          </div>
        </Section>

        <Section
          title="Sémantique"
          note="Volontairement hors de l'échelle bière, pour qu'un rouge de rupture ne se confonde jamais avec une couleur de bière."
        >
          <div className="grid grid-cols-3 gap-4">
            <Swatch name="Rupture" value="#D6453D" />
            <Swatch name="Disponible" value="#6E9B5B" />
            <Swatch name="Eau" value="#5B8AA6" />
          </div>
        </Section>

        <Section
          title="Typographie"
          note="Source Sans 3 pour ce qui se dit, IBM Plex Mono pour ce qui se mesure. Le plancher passe de 10 px à 14 px."
        >
          <div className="panel p-5 space-y-4">
            <div className="text-3xl reading text-ebc-straw">1.062</div>
            <div className="text-2xl text-cave-50 font-semibold">Milk Stout</div>
            <div className="text-xl text-cave-50">Journal des brassins</div>
            <div className="text-lg text-cave-50">Titre de carte</div>
            <div className="text-base text-cave-200">
              Texte courant, seize pixels. C'est la taille à laquelle on lit une phrase à bout
              de bras, dans une cave, sans plisser les yeux.
            </div>
            <div className="text-sm text-cave-400">
              Texte secondaire, quatorze pixels — le plancher.
            </div>
            <div className="text-footnote text-cave-600">
              Mention légale, douze pixels, réservée aux notes de bas de page.
            </div>
          </div>
        </Section>

        <Section
          title="Lectures"
          note="Le geste central de l'app est de lire une mesure. On la présente comme un densimètre l'affiche : le nombre en grand, l'unité petite, l'écart à la cible en dessous."
        >
          <div className="panel p-5 grid grid-cols-2 gap-6">
            <Reading label="Densité actuelle" value="1.032" size="lg" tone="beer" delta="cible 1.018" deltaTone="neutral" />
            <Reading label="Jours en cuve" value="12" unit="j" size="lg" delta="+4 avant garde" deltaTone="water" />
            <Reading label="Malt Pale Ale" value="18.5" unit="kg" tone="good" delta="min. 5 kg" />
            <Reading label="Houblon Citra" value="0" unit="g" tone="alert" delta="rupture" deltaTone="alert" />
            <Reading label="Alcool" value="" emptyHint="fin de fermentation" />
            <Reading label="Solde disponible" value="2 611.61" unit="CHF" tone="good" />
          </div>
        </Section>

        <Section
          title="Compteurs tactiles"
          note="56 px de côté. L'appui long accélère : ajouter 25 kg de malt ne doit pas demander cinquante taps. La valeur est aussi un champ, pour saisir directement une grosse quantité."
        >
          <div className="panel p-5 space-y-6">
            <Stepper label="Malt Pale Ale reçu" value={malt} onChange={setMalt} unit="kg" />
            <Stepper label="Houblon Citra reçu" value={hops} onChange={setHops} unit="g" />
            <Stepper label="Bouteilles 33 cl" value={bottles} onChange={setBottles} unit="btl" />
            <p className="text-sm text-cave-400">
              Stock après réception : <span className="font-mono text-cave-50">18.5 kg</span> →{' '}
              <span className="font-mono text-hop">{(18.5 + malt).toFixed(1)} kg</span>
            </p>
          </div>
        </Section>

        <Section
          title="Actions"
          note="Une seule action principale par écran. Les libellés disent ce qui va se passer, et le même mot revient dans la confirmation."
        >
          <div className="panel p-5 space-y-3">
            <Button intent="primary" full size="lg" icon={<Camera className="w-5 h-5" />}>
              Scanner une facture
            </Button>
            <Button intent="secondary" full icon={<Beer className="w-5 h-5" />}>
              Lancer le brassage
            </Button>
            <Button intent="danger" full>
              Annuler l'achat
            </Button>
            <div className="flex gap-2 pt-2">
              <IconButton label="Réglages">
                <Settings2 className="w-5 h-5" />
              </IconButton>
              <IconButton label="Prendre une photo">
                <Camera className="w-5 h-5" />
              </IconButton>
              <span className="self-center text-sm text-cave-400">
                Cibles tactiles complètes malgré la petite icône
              </span>
            </div>
          </div>
        </Section>

        <Section
          title="Coquille de l'application"
          note="En-tête et navigation réels, rendus avec des données fictives. L'ancien en-tête entassait sept boutons de 32 px ; il n'en reste que trois, à 48 px."
        >
          <div className="rounded-panel border border-cave-800 overflow-hidden bg-cave-950">
            <Header
              config={defaultConfig}
              globalTimeFilter="all"
              onChangeGlobalTimeFilter={() => {}}
              onOpenSettings={() => {}}
              onOpenCloudConfig={() => {}}
              onOpenAuditLogs={() => {}}
              onNavigateToBrewAssistant={() => {}}
              onNavigateToCreativeLab={() => {}}
              onGoHome={() => {}}
          onOpenSearch={() => {}}
              onLogout={() => {}}
              pendingTodosCount={2}
            />
            <div className="h-40 flex items-center justify-center text-cave-600 text-sm">
              contenu de l'écran
            </div>
            <div className="relative h-24">
              <div className="absolute inset-0">
                <BottomNav
                  activeTab="dashboard"
                  onChangeTab={() => {}}
                  action={{ intent: 'quickAction', label: 'Saisie rapide' }}
                  onAction={() => {}}
                  onOpenQuickAction={() => {}}
                  criticalStockCount={8}
                />
              </div>
            </div>
          </div>
        </Section>

        <Section title="Avant / après" note="Ce que ces choix changent concrètement.">
          <div className="panel p-5 space-y-4 text-base">
            {[
              ['Plancher typographique', '10 px', '14 px'],
              ['Texte courant', '12 px', '16 px'],
              ['Cible tactile minimale', '24 px', '48 px'],
              ['Compteurs', '24 px', '56 px'],
              ['Rayons de bordure distincts', '5', '3'],
              ['Fond', 'bleu-noir', 'charbon chaud']
            ].map(([quoi, avant, apres]) => (
              <div key={quoi} className="flex items-baseline justify-between gap-4 border-b border-cave-800 pb-3 last:border-0">
                <span className="text-cave-200">{quoi}</span>
                <span className="font-mono text-sm shrink-0">
                  <span className="text-cave-600 line-through">{avant}</span>
                  <span className="text-cave-600"> → </span>
                  <span className="text-hop">{apres}</span>
                </span>
              </div>
            ))}
          </div>
        </Section>
      </div>
    </div>
  );
};
