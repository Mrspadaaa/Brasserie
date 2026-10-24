# rca4 — la carte α × huile

- **Chaleur** : chaude (forme libre : la liste devient une carte).
- **Idée** : les 32 houblons « fruit de la passion » posés par leur α (largeur) et leur huile totale (hauteur : fade en bas, intense en haut), chacun en croix de ses plages publiées ; le critère α est une bande qu'on glisse au doigt par ses deux bords ; les noms de la bande sont rangés à droite, reliés à leur point ; la liste dessous suit la bande, du plus intense au plus fade.
- **Cas** : α 8–12 + dry hop → 11 houblons (Melba 2–4, Tango, Strata, Ariana, Hallertau Blanc en stock, NZH-107…). Galaxy en haut à droite (huile 1,8–5, α 17,2 du lot, hors de sa plage 11–16) et Saaz (CZ) en repère gris en bas à gauche (huile 0,4–1) : « hyper aromatique » contre « fade » se voit sans lire (D131 ter). Vienna Gold sans huile publiée : sur la ligne « ? », jamais à zéro.
- **D'où, où** : du champ de l'étape (la requête en tête) ; + ajoute à la recette ; appui long sur un point ou une ligne → fiche.
- **Réactif** : le glisser d'un bord refait la bande, les noms et la liste à chaque pas de 0,5 ; dry hop et en stock en pastilles comptées.
- **Ce qui tient** : un coup d'œil dit où sont les houblons forts et faibles pour cet arôme, et ce qui reste dans ma plage d'α.
- **Ce qui casse** : l'huile totale n'est qu'un indice d'intensité (pas l'arôme de la famille) ; à 30 points, les plages se croisent ; un seul critère glissé (α) ; le repère Saaz est un choix de cette maquette.

## Contrôles (joués une fois sur les quatre, 24.10 soir)
- `concepts.mjs rca1 rca2 rca3 rca4` → CONCEPTS-BIEN-4 ; `controle-pictos-trait --page=etat.html` → TRAIT OK.
- `controle-commun --sans=mots,au-style --page=etat.html` : survol, blocs, contraste, fiche, standard, trait, légende, parlant, brutes OK ; COULEURS ECHEC sur rca3 seul (1 teinte franche mesurée : la requête est tropicale, orangée ; ses pictos de famille au trait sont trop fins pour la mesure).
- Écarts, avec leur raison : `mots` sauté (consigne de la v0) ; `au-style` sauté : une recherche ne montre aucune intensité de famille, seulement « décrite / marquée » par les fiches, sans échelle à lire face à un style.
- `controle-panel` sur les quatre captures : remplissage médian 0,60, ressemblance moyenne 0,86, 0 paire presque identique → PANEL OK.

## Données
`proto-data.json` (318 variétés) ; familles et mots par `describeFamilies` et `familyWords` du moteur (`prototypes/houblons-v4/src/engine/hops.ts`) ; rôle par `hopRole` (fournisseur, sinon règle rôle-α v1) ; α du lot pour les 16 articles de stock. Mots anglais restés dans `tagsFr` traduits (« loganberry » → « mûre de Logan ») ou retirés (« pleasant »). Rien d'inventé : l'inconnu reste « ? » (α, huile).
Commun aux quatre : appui long (550 ms, la carte fonce) ou survol long → fiche avec silhouette en pics ; « ? » ouvre la légende ; champ `type="search"`, jamais `type="number"`. La page est figée après son premier rendu (listes présentes dans le HTML) ; le script la refait au chargement.
