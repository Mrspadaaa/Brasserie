# Fiche d'un houblon, au long appui (voie p1-ma-biere, 23.10)

## Base

- Fiche g1 (« la v1 est la meilleure ») et fiche courte type Citra cryo (« Ça c'est très bien ») :
  `base/consolide/fiche.html`, captures `base/captures/consolide-fiche-390.png` et
  `fils13-carte-fiche/captures/g1-fiche-citra-390.png`.

## Idées reprises

- α écrit comme sur les lignes : la valeur du lot d'abord (« α 13 % lot · fiches 9,5–16 % », D93 B3), l'usage en
  mot, le stock en grammes (le détail du stock va dans la fiche, pas sur la ligne).
- Familles citées avec les pictos de la page, « 2/4 » (fiches qui la citent), et les mots des fiches (3 au plus).
- Silhouette h4 à 12 axes, sans légende écrite : rayon au nombre de fiches (D72), secteurs hachurés pour les
  familles non décrites (D65).
- Part « autres » dessinée (forme grise) avec les mots sans famille (D100, L14).
- Geste « goût » : « j'aime » / « pas pour moi » (D20), gardé en mémoire pendant la session.
- « ma bière » : la dose, le moment et l'IBU de ce houblon dans la recette, s'il y est.

## Écarts

- Pas de table des IBU par moment (barrée par le brasseur : « Inutile ») ; pas de bouton « Ajouter à 10′ »
  (« palace holder ? ») : la fiche n'agit pas sur la recette.
- Fermeture par « × » (Sheet de l'app), par Échap et par « ‹ » (bouton ajouté dans la feuille).

## Pour l'app

- Emploi depuis un autre écran : `const f = useFiche();` puis `<span {...f.appui(cle, onCourt)} {...f.nom(cle)}>` sur
  la carte (appui long) et sur le nom (survol), et `{f.rendu}` dans l'écran. Ma bière passe par la route
  `#/fiche/<houblon>` (export par défaut de `index.tsx`).
- `data-role="fiche"` est posé sur la feuille après son ouverture (portail) : dans l'app, `Sheet` devrait accepter
  des attributs `data-*`. Le « click » qui suit un appui long est avalé (350 ms) pour ne pas refermer la feuille.
- Les goûts s'écriront dans Dexie (préférences du brasseur), et les mots des fiches viendront du catalogue réel.
