/** La navigation du Carnet : rouvrir au rechargement (L-50), ouvrir sur demande, onglet touché, retour du téléphone (L-13), retour qui s'efface ;
 *  sortie de CarnetsVue.tsx (effets tels quels, dans leur ordre). */
import { useEffect, useRef } from 'react';
import { lireCarnets, type CarnetDoc } from '../../domain/carnets/modele';
import type { CreativeItem } from '../../types';
import type { Boite, CarnetsVueProps, Etat, Retour, RetourNeuf, Vue } from './carnetsTypes';
import type { EcritureCarnet } from '../../domain/carnets/operations';
import { avecMarque, lireMarque, marqueOrpheline, mourir, nouveauJeton, reculerSansRouvrir, vivre } from './histoireCarnet';

/** L-50 : le carnet ouvert, gardé le temps de la session du navigateur (rechargement compris). */
const CLE_OUVERT = 'laffinee.carnet.ouvert';
const lireSession = (k: string): string | null => { try { return sessionStorage.getItem(k); } catch { return null; } };
const ecrireSession = (k: string, v: string | null) => { try { if (v) sessionStorage.setItem(k, v); else sessionStorage.removeItem(k); } catch { /* sans stockage : rien n'est gardé */ } };
/** L-13 : l'écran d'où l'on vient : la fiche, Comparer, Choisir, Renommer et Supprimer remontent au carnet ; le carnet, à la liste. */
function vueParente(v: Vue): Vue {
  if (v.sorte === 'liste' || v.sorte === 'carnet' || v.sorte === 'relecture') return { sorte: 'liste' };
  return { sorte: 'carnet', id: v.id };
}

export interface NavigationV {
  p: Pick<CarnetsVueProps, 'ouvrir' | 'focusChamp' | 'racine' | 'onRetourOrigine'>; items: CreativeItem[]; vue: Vue; setVue: Etat<Vue>; setRetour: (r: RetourNeuf | null) => void;
  champRef: Boite<HTMLTextAreaElement | null>; edition: string | null; setEdition: Etat<string | null>; setTexte: Etat<string>; ouvert: CarnetDoc | null;
  idOuvert: string | null; setNoteSupprimee: Etat<{ id: string; inverse: EcritureCarnet[] } | null>; retour: Retour | null;
}

export function useNavigationCarnet({ p, items, vue, setVue, setRetour, champRef, edition, setEdition, setTexte, ouvert, idOuvert, setNoteSupprimee, retour }: NavigationV) {
  /* L-50 (M1-24, M2-9) : au rechargement, le carnet ouvert se rouvre (l'onglet est gardé par l'app) ; la session du navigateur le tient, le
     temps que le magasin ait lu ses carnets. Une ouverture demandée (À venir, Calendrier) ou l'onglet touché l'emportent. */
  const aRouvrir = useRef<string | null>(lireSession(CLE_OUVERT));
  /* CA13-2 : le carnet ouvert depuis un autre écran (À venir) y ramène au retour du téléphone, au lieu de la liste des carnets */
  const origine = useRef<string | null>(null);
  const retourOrigine = useRef(p.onRetourOrigine);
  retourOrigine.current = p.onRetourOrigine;
  useEffect(() => {
    if (!p.ouvrir) return;
    aRouvrir.current = null; origine.current = p.ouvrir.depuis ? p.ouvrir.id : null;
    setVue({ sorte: 'carnet', id: p.ouvrir.id }); setRetour(null);
  }, [p.ouvrir?.at]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (p.focusChamp) champRef.current?.focus(); }, [p.focusChamp]);
  useEffect(() => { if (p.racine && !edition) { aRouvrir.current = null; setVue({ sorte: 'liste' }); } }, [p.racine]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    const id = aRouvrir.current;
    if (!id || !lireCarnets(items, { archives: true }).some(x => x.id === id)) return;
    aRouvrir.current = null;
    setVue(v => (v.sorte === 'liste' ? { sorte: 'carnet', id } : v));
  }, [items]);
  useEffect(() => { if (!aRouvrir.current) ecrireSession(CLE_OUVERT, 'id' in vue ? vue.id : null); }, [vue]);
  // P12 : la note en modification a disparu (supprimée, ou autre vue) : le mode se referme et le texte qu'il avait mis dans le champ part.
  useEffect(() => {
    if (edition && !(ouvert && vue.sorte === 'carnet' && ouvert.carnet.notes.some(n => n.id === edition))) { setEdition(null); setTexte(''); }
  }, [edition, ouvert, vue.sorte]);
  // P34 : la note supprimée appartient au carnet ouvert ; un autre carnet, ou la liste, ne garde pas son bandeau.
  useEffect(() => { setNoteSupprimee(null); }, [idOuvert]);
  // Le carnet ouvert a disparu (supprimé ailleurs) : retour à la liste.
  useEffect(() => { if (idOuvert && !ouvert) setVue({ sorte: 'liste' }); }, [idOuvert, ouvert]);
  /* L-13 (CA12-M1-4, M2-7) : le retour du téléphone remonte d'un écran (article, Comparer, Choisir, Renommer, Supprimer → carnet ; carnet →
     liste) au lieu de quitter l'app. Comme Plus (App.tsx) : une entrée d'historique à la même profondeur, marquée ; la pile des pages
     (useFullScreenRoute) n'en voit rien. Quitter le carnet par son bouton retire l'entrée (`back`), sans rien dépiler d'autre.
     CA13-2 : la marque porte le carnet et le jeton de ce Carnet monté. Le Carnet démonté (onglet changé) retire son entrée si elle est
     encore au sommet ; sinon elle reste orpheline, et y revenir rouvre ce carnet (App), que ce Carnet adopte au lieu d'en poser une autre. */
  const histoire = useRef({ pousse: false, retourInterne: false, jeton: nouveauJeton(), monte: false });
  useEffect(() => {
    const h = histoire.current;
    if (vue.sorte !== 'liste' && !h.pousse) {
      const marque = { id: 'id' in vue ? vue.id : 'relecture', jeton: h.jeton };
      if (marqueOrpheline(window.history.state)) window.history.replaceState(avecMarque(window.history.state, marque), '');
      else window.history.pushState(avecMarque(window.history.state, marque), '');
      h.pousse = true;
    } else if (vue.sorte === 'liste' && h.pousse) { h.pousse = false; h.retourInterne = true; reculerSansRouvrir(); }
  }, [vue.sorte]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    const h = histoire.current;
    h.monte = true; vivre(h.jeton);
    const surRetour = () => {
      if (h.retourInterne) { h.retourInterne = false; return; }
      /* une page posée sur le carnet (Plus) se ferme : l'entrée du carnet est retrouvée, rien à remonter */
      if (!h.pousse || lireMarque(window.history.state)?.jeton === h.jeton) return;
      h.pousse = false;
      setVue(v => {
        if (v.sorte === 'carnet' && v.id === origine.current && retourOrigine.current) { origine.current = null; retourOrigine.current(); }
        return vueParente(v);
      });
    };
    window.addEventListener('popstate', surRetour);
    return () => {
      window.removeEventListener('popstate', surRetour);
      h.monte = false; mourir(h.jeton);
      /* démonté pour de bon (pas le double montage de StrictMode) : son entrée, encore au sommet, part avec lui */
      setTimeout(() => {
        if (h.monte || !h.pousse) return;
        h.pousse = false;
        if (lireMarque(window.history.state)?.jeton === h.jeton) reculerSansRouvrir();
      }, 0);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  // Un retour « ✓ … · Annuler » reste au moins 8 s (Q18 : 5 s au moins), puis s'efface.
  useEffect(() => { if (!retour) return; const t = setTimeout(() => setRetour(null), 8000); return () => clearTimeout(t); }, [retour]);
}
