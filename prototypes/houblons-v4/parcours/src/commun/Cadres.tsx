// Cadres de l'app, importés : PageShell (src/pages/PageShell.tsx) pour Ma bière et pour chaque outil plein
// écran ; Sheet (src/ui/Sheet.tsx) pour la fiche d'un houblon. Rien n'est recopié.
import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { PageShell } from '@app/pages/PageShell';
import { Sheet } from '@app/ui/Sheet';
import { useNavigation } from '../coquille/navigation';
import type { RoutePage } from '../coquille/pages';
import { Onglets, TeteOutil } from './Onglets';
import { Dock } from './Pont';
import './retour.css';
import './feuille.css';

/** Un outil plein écran (D109, D118, D119). Sa tête remplace, pour les outils de la maquette seulement, celle du
 * PageShell de l'app (src/pages/PageShell.tsx, non modifié ; son « ‹ » de 28 px, gris et muet) : elle passe par
 * `mobileHeader`, montrée à toutes les largeurs par retour.css.
 * - Suggérer et Comparer sont des onglets (base v4.10, q2b) : la tête est celle de l'onglet Ma bière, les onglets et la
 *   croix (D119). La question de l'outil reste le titre du cadre ; Comparer la montre en tête de son contenu (D104),
 *   Suggérer non (`questionVisible={false}` : la base v4.10 n'en a pas, D117).
 * - Les autres outils : la croix au même endroit, puis la question.
 * La croix ramène à l'étape Houblons (D118) ; le retour du téléphone et Échap reviennent d'un écran. Le dock (ponts,
 * commandes) sous le pouce. */
export function CadreOutil({ ecran, question, questionVisible = true, elementTete, contexte, dock, children }: {
  ecran: RoutePage; question: string; questionVisible?: boolean; elementTete?: string; contexte?: ReactNode; dock?: ReactNode; children: ReactNode;
}) {
  const { retour } = useNavigation();
  const onglet = ecran === 'suggerer' || ecran === 'comparer' ? ecran : null;
  return (
    <PageShell title={question} onClose={retour} footer={dock ? <Dock>{dock}</Dock> : undefined}
      mobileHeader={<div {...(elementTete ? { 'data-element': elementTete } : {})}>{onglet ? <Onglets actif={onglet} /> : <TeteOutil question={question} />}</div>}
      className={`pq-outil pq-outil-${ecran} pq-cadre-retour`}>
      <div data-ecran={ecran} className="space-y-2">
        {onglet && questionVisible && <h1 className="text-[0.9375rem] font-semibold text-cave-50 leading-tight px-1">{question}</h1>}
        {contexte}
        {children}
      </div>
    </PageShell>
  );
}

/** La page de la recette (comme RecipePage) : nom, style et volume ; actions de la coquille à droite. */
export function CadreRecette({ titre, sousTitre, actions, children }: { titre: string; sousTitre: string; actions: ReactNode; children: ReactNode }) {
  const tete = (
    <div data-page-titlebar className="flex items-center gap-1.5 px-2 py-1">
      <div className="min-w-0 flex-1">
        <h1 className="text-base font-semibold text-cave-50 truncate leading-tight">{titre}</h1>
        <p className="text-xs text-cave-400 truncate leading-tight">{sousTitre}</p>
      </div>
      <div className="flex items-center gap-1 shrink-0">{actions}</div>
    </div>
  );
  // Ma bière est la racine de la maquette : pas de « Fermer ». mobileHeader remplace l'en-tête au téléphone.
  return (
    <PageShell title={titre} subtitle={sousTitre} onClose={() => undefined} mobileHeader={tete} actions={actions} className="pq-recette">
      {children}
    </PageShell>
  );
}

/** Feuille venue du bas (Sheet de l'app) : la fiche d'un houblon au long appui.
 * Surcharge propre à la maquette (Sheet, src/ui/Sheet.tsx, n'est pas modifié, porte B) : sa tête prend celle de g1, la
 * fiche qu'il a choisie (« × rond en haut à droite ») et la croix des outils (D109) : une seule croix ronde de 44 px,
 * icône de 20 px à l'encre, `data-role="retour"` ; le nom en titre, en gras. Le « × » du Sheet est restylé
 * (feuille.css, classe pq-feuille) et marqué ici, une fois la feuille montée dans son portail. Son icône porte
 * `data-role="fermer-fiche"`, le contrat des scripts et de controle-fiche (D25) : un seul bouton, deux marques. */
export function Feuille({ ouverte, titre, sousTitre, onFermer, children, pied }: {
  ouverte: boolean; titre: string; sousTitre?: string; onFermer: () => void; children: ReactNode; pied?: ReactNode;
}) {
  const [repere, setRepere] = useState<HTMLSpanElement | null>(null);
  const refRepere = useCallback((n: HTMLSpanElement | null) => setRepere(n), []);
  useEffect(() => {
    let n = 0, id = 0;
    const marquer = () => {
      const croix = repere?.closest('[role="dialog"]')?.querySelector<HTMLButtonElement>(':scope > header > button[aria-label="Fermer"]');
      if (croix) {
        croix.setAttribute('data-role', 'retour');
        croix.setAttribute('title', 'Fermer la fiche');
        croix.querySelector('svg')?.setAttribute('data-role', 'fermer-fiche');
        return;
      }
      if (++n < 30) id = requestAnimationFrame(marquer);
    };
    marquer();
    return () => cancelAnimationFrame(id);
  }, [repere, ouverte]);
  return (
    <Sheet open={ouverte} onClose={onFermer} title={titre} subtitle={sousTitre} footer={pied} className="pq-feuille">
      <span ref={refRepere} hidden />
      {children}
    </Sheet>
  );
}
