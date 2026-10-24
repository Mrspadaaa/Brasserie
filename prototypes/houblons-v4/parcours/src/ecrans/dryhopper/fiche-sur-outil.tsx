// La fiche d'un houblon posée sur l'outil ouvert (ARCHITECTURE.md : « aucune route : Sheet posée sur la page
// ouverte »), sans quitter l'outil ni perdre son brouillon. Appui long (useAppuiLong) au doigt, survol long à
// l'ordinateur. Le composant de la fiche est celui de la voie p1 (src/ecrans/fiche), importé.
// Une entrée d'historique est poussée : le retour du téléphone, « ‹ » ou Échap de la fiche la referment.
// BESOIN SOCLE (RESULTAT.md) : un crochet commun useFiche() ; ici, la clé de profondeur de navigation.tsx est relue.
import { useCallback, useEffect, useRef, useState } from 'react';
import { useAppuiLong } from '../../commun';
import Fiche from '../fiche';

const CLE_NAV = 'affinee-parcours';
const SURVOL_MS = 650;

export function useFicheSurOutil(cle: string) {
  const [ouverte, setOuverte] = useState(false);
  const ouverteRef = useRef(false);
  ouverteRef.current = ouverte;
  useEffect(() => {
    const lire = () => { if (!(history.state && history.state.pqFiche)) setOuverte(false); };
    window.addEventListener('popstate', lire);
    return () => window.removeEventListener('popstate', lire);
  }, []);
  const ouvrir = useCallback(() => {
    if (ouverteRef.current) return;
    const n = history.state && typeof history.state[CLE_NAV] === 'number' ? (history.state[CLE_NAV] as number) : 0;
    history.pushState({ [CLE_NAV]: n + 1, pqFiche: cle }, '', location.hash);
    setOuverte(true);
  }, [cle]);
  const minuterie = useRef<number | null>(null);
  const annuler = () => { if (minuterie.current != null) window.clearTimeout(minuterie.current); minuterie.current = null; };
  useEffect(() => annuler, []);
  const appui = useAppuiLong(ouvrir);
  const declencheur = {
    ...appui,
    // r7 : armé au mouvement de la souris, pas à l'entrée seule (un écran ouvert sous une souris immobile n'ouvre rien).
    onPointerMove: (e: React.PointerEvent) => { appui.onPointerMove?.(e); if (e.pointerType === 'mouse' && !e.buttons && minuterie.current == null) minuterie.current = window.setTimeout(() => { minuterie.current = null; ouvrir(); }, SURVOL_MS); },
    onPointerLeave: () => { annuler(); appui.onPointerLeave(); },
    'data-role': 'ouvrir-fiche',
    'data-houblon': cle,
  };
  return { declencheur, feuille: ouverte ? <Fiche houblon={cle} /> : null };
}
