import { useEffect, useRef, useSyncExternalStore } from 'react';

/**
 * Ce qu'une page plein écran met en tête du menu du « + » (b1r, 15.11 : « certaines actions doivent toujours être possible, juste
 * celle de l'écran actuel sont plus mis en avant. Et le bouton doit toujours être flottant »).
 *
 * ⚠️ Ce que ça règle : l'App ne connaît le menu que des onglets (`plusMenuFor`) ; sur une page plein écran — l'assistant de
 * recette — le « + » ne montrait que « Partout ». La page déclare ici ses actions (`usePlusPage`), le « + » les lit : la même
 * forme que `ActionDock` de `PageShell` (registre de module lu par `useSyncExternalStore`), la dernière page montée parle et
 * son retrait rend la main à la précédente. Une page sans déclaration ne change rien au menu.
 *
 * Les `lancer` passent par une référence : la page peut les refaire à chaque rendu (fermetures sur son état) sans que la
 * déclaration, donc le menu, soit republiée ; seuls les libellés, les ids et l'étape courante la republient.
 */

export type PlusPageGenre = 'ajouter' | 'enregistrer' | 'exporter' | 'supprimer' | 'brasser' | 'modifier' | 'dupliquer';

export interface PlusPageAction {
  id: string;
  label: string;
  hint?: string;
  genre: PlusPageGenre;
  lancer: () => void;
}

/** « Aller à » : une rangée de pastilles, une par étape, l'étape courante marquée. */
export interface PlusPageEtapes {
  courant: string;
  options: Array<{ id: string; label: string; court?: string }>;
  aller: (id: string) => void;
}

export interface PlusPageDeclaration {
  /** Le nom de la page dans « Sur … » (« Assistant · Houblons »). */
  titre: string;
  /** Contre le + d'abord : la première est la plus proche du pouce. */
  actions: PlusPageAction[];
  etapes?: PlusPageEtapes;
  /** Une page posée sur un onglet (la barre reste là, Fournisseurs) : ses actions montent aussi du + des onglets, à la place de celles de l'onglet. */
  surOnglets?: boolean;
}

interface Entree { decl: PlusPageDeclaration }

const entrees: Entree[] = [];
const ecouteurs = new Set<() => void>();
let instantane: PlusPageDeclaration | null = null;

const publier = () => {
  const suivant = entrees.length ? entrees[entrees.length - 1].decl : null;
  if (suivant === instantane) return;
  instantane = suivant;
  ecouteurs.forEach(l => l());
};
const abonner = (l: () => void) => { ecouteurs.add(l); return () => { ecouteurs.delete(l); }; };
const lire = () => instantane;

/** Ce que la page montée en dernier met en tête du « + » ; `null` : rien. */
export function usePlusPageActions(): PlusPageDeclaration | null {
  return useSyncExternalStore(abonner, lire, lire);
}

/** Déclare les actions de la page tant qu'elle est montée (`null` : rien à déclarer). */
export function usePlusPage(declaration: PlusPageDeclaration | null): void {
  const derniere = useRef(declaration);
  derniere.current = declaration;
  const signature = declaration ? JSON.stringify([
    declaration.titre,
    declaration.actions.map(a => [a.id, a.label, a.hint, a.genre]),
    declaration.etapes ? [declaration.etapes.courant, declaration.etapes.options] : null,
    declaration.surOnglets ?? false
  ]) : '';
  useEffect(() => {
    const d = derniere.current;
    if (!d) return;
    const entree: Entree = {
      decl: {
        titre: d.titre,
        ...(d.surOnglets ? { surOnglets: true } : {}),
        actions: d.actions.map(a => ({ ...a, lancer: () => derniere.current?.actions.find(x => x.id === a.id)?.lancer() })),
        ...(d.etapes ? { etapes: { ...d.etapes, aller: (id: string) => derniere.current?.etapes?.aller(id) } } : {})
      }
    };
    entrees.push(entree);
    publier();
    return () => { entrees.splice(entrees.indexOf(entree), 1); publier(); };
  }, [signature]);
}
