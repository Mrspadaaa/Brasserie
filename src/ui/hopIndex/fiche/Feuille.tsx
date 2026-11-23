// Feuille venue du bas (Sheet de l'app) : la fiche d'un houblon au long appui (T13, #173 ; venue de la maquette, Cadres.tsx).
// Surcharge propre aux outils houblons v4 (Sheet, src/ui/Sheet.tsx, n'est pas modifié) : sa tête prend celle de g1, la
// fiche qu'il a choisie (« × rond en haut à droite ») et la croix des outils (D109) : une seule croix ronde de 44 px,
// icône de 20 px à l'encre, `data-role="retour"` ; le nom en titre, en gras. Le « × » du Sheet est restylé
// (feuille.css, classe pq-feuille) et marqué ici, une fois la feuille montée dans son portail. Son icône porte
// `data-role="fermer-fiche"`, le contrat des scripts et de controle-fiche (D25) : un seul bouton, deux marques.
import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { Sheet } from '../../Sheet';
import './feuille.css';

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
