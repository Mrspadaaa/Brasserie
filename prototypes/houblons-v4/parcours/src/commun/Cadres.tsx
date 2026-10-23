// Cadres de l'app, importés : PageShell (src/pages/PageShell.tsx) pour Ma bière et pour chaque outil plein
// écran ; Sheet (src/ui/Sheet.tsx) pour la fiche d'un houblon. Rien n'est recopié.
import type { ReactNode } from 'react';
import { PageShell } from '@app/pages/PageShell';
import { Sheet } from '@app/ui/Sheet';
import { useNavigation } from '../coquille/navigation';
import type { RoutePage } from '../coquille/pages';
import { Dock } from './Pont';

/** Un outil plein écran : en-tête « ‹ » suivi de sa question, puis sa ligne de contexte et son contenu ; le dock
 * (ponts, commandes) sous le pouce. « ‹ » et le retour du téléphone reviennent à l'écran d'avant. */
export function CadreOutil({ ecran, question, contexte, dock, children }: {
  ecran: RoutePage; question: string; contexte?: ReactNode; dock?: ReactNode; children: ReactNode;
}) {
  const { retour } = useNavigation();
  return (
    <PageShell title={question} onClose={retour} footer={dock ? <Dock>{dock}</Dock> : undefined} className={`pq-outil pq-outil-${ecran}`}>
      <div data-ecran={ecran} className="space-y-2">
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

/** Feuille venue du bas (Sheet de l'app) : la fiche d'un houblon au long appui. */
export function Feuille({ ouverte, titre, sousTitre, onFermer, children, pied }: {
  ouverte: boolean; titre: string; sousTitre?: string; onFermer: () => void; children: ReactNode; pied?: ReactNode;
}) {
  return <Sheet open={ouverte} onClose={onFermer} title={titre} subtitle={sousTitre} footer={pied}>{children}</Sheet>;
}
