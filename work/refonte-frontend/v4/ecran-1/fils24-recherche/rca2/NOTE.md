# rca2 — les pastilles comptent

- **Chaleur** : tiède (la forme de l'approche : pastilles de critères en clair, ici en facettes).
- **Idée** : chaque pastille porte, avant qu'on la touche, le nombre de houblons qu'elle laisserait avec les autres critères. Arôme (les 12 pictos et leur compte ; la famille posée se règle « marquée » ou « citée aussi », à la grammaire des cases), mot (les mots précis de la famille, puis les mots hors des 12 : noble, tabac, caramel, délicat), α en bandes, usage, origine, stock. Une pastille à 0 se voit avant d'être touchée.
- **Cas** : on vient du « + » de Comparer (Nugget, Motueka) ; Floral marquée + aromatique → 15 houblons (Celeia, Contessa, Liberty, Saphir, Triskel, Willamette… ; lavande, rose, fleur de sureau) ; « en stock 0 » : il faudra acheter (D21) ; « citée aussi » en ouvrirait 49, dont 3 en stock.
- **D'où, où** : du + de Comparer ; + ajoute à la comparaison ; appui long → fiche.
- **Réactif** : chaque toucher recalcule toutes les facettes et la liste (318 houblons, en direct dans la page).
- **Ce qui tient** : répond à « qu'est-ce que je perds si j'ajoute ce critère ? » sans essayer ; dit tout de suite que rien n'est en stock.
- **Ce qui casse** : le panneau prend la moitié de l'écran (la liste commence à 470 px) ; les chiffres partout peuvent faire « tableau » ; pas de moment (l'usage le porte ici).

## Contrôles (joués une fois sur les quatre, 24.10 soir)
- `concepts.mjs rca1 rca2 rca3 rca4` → CONCEPTS-BIEN-4 ; `controle-pictos-trait --page=etat.html` → TRAIT OK.
- `controle-commun --sans=mots,au-style --page=etat.html` : survol, blocs, contraste, fiche, standard, trait, légende, parlant, brutes OK ; COULEURS ECHEC sur rca3 seul (1 teinte franche mesurée : la requête est tropicale, orangée ; ses pictos de famille au trait sont trop fins pour la mesure).
- Écarts, avec leur raison : `mots` sauté (consigne de la v0) ; `au-style` sauté : une recherche ne montre aucune intensité de famille, seulement « décrite / marquée » par les fiches, sans échelle à lire face à un style.
- `controle-panel` sur les quatre captures : remplissage médian 0,60, ressemblance moyenne 0,86, 0 paire presque identique → PANEL OK.

## Données
`proto-data.json` (318 variétés) ; familles et mots par `describeFamilies` et `familyWords` du moteur (`prototypes/houblons-v4/src/engine/hops.ts`) ; rôle par `hopRole` (fournisseur, sinon règle rôle-α v1) ; α du lot pour les 16 articles de stock. Mots anglais restés dans `tagsFr` traduits (« loganberry » → « mûre de Logan ») ou retirés (« pleasant »). Rien d'inventé : l'inconnu reste « ? » (α, huile).
Commun aux quatre : appui long (550 ms, la carte fonce) ou survol long → fiche avec silhouette en pics ; « ? » ouvre la légende ; champ `type="search"`, jamais `type="number"`. La page est figée après son premier rendu (listes présentes dans le HTML) ; le script la refait au chargement.
