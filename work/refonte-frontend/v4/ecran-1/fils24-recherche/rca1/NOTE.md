# rca1 — le champ de l'étape s'ouvre en recherche

- **Chaleur** : froide (la plus proche de l'app : étape Houblons de la maquette du soir, rail replié, cartes d'ajout rapide).
- **Idée** : on tape dans « Ajouter — houblon… » ; le mot devient une pastille dans le champ (« cassis », à la couleur et au picto de sa famille, Petits fruits) ; dessous, les critères en pastilles (dose et moment 60′ / 10′ / dry hop, toute la famille, aromatique ou double, α ≤ 10, en stock), chacune avec le nombre qu'elle laisserait ; la liste suit, en cartes d'ajout rapide (+, α, usage, IBU au moment choisi, 12 cases, puce de moment, cœur), en stock en tête.
- **Cas** : Stout export 16D, « cassis » → 17 houblons (Idaho 7 en stock, 20 g, α 12,7 du lot ; Bramling Cross, Brewer's Gold, Bullion, Endeavour… à acheter). Le mot précis souligné à sa famille, les mots hors des 12 au losange (« fruit sucré », « mûre de Logan », « vanille »).
- **D'où, où** : du champ de l'étape ; + ajoute à la recette au moment choisi ; appui long → fiche ; cœur.
- **Réactif** : chaque pastille et chaque lettre refont la liste et les comptes, sans bouton « Rechercher ». Entrée : le mot tapé devient pastille.
- **Ce qui tient** : rien de neuf à apprendre ; l'IBU suit le moment (Tinseth, 10 g, 20 L, DI 1,066 ; en plage si l'α est une plage) ; le stock reste une icône.
- **Ce qui casse** : la liste est longue à 17 (on voit 6 cartes) ; le rail replié perd la vue du brassin pendant la recherche ; Galaxy et Saaz ne sont pas dans ce cas.

## Contrôles (joués une fois sur les quatre, 24.10 soir)
- `concepts.mjs rca1 rca2 rca3 rca4` → CONCEPTS-BIEN-4 ; `controle-pictos-trait --page=etat.html` → TRAIT OK.
- `controle-commun --sans=mots,au-style --page=etat.html` : survol, blocs, contraste, fiche, standard, trait, légende, parlant, brutes OK ; COULEURS ECHEC sur rca3 seul (1 teinte franche mesurée : la requête est tropicale, orangée ; ses pictos de famille au trait sont trop fins pour la mesure).
- Écarts, avec leur raison : `mots` sauté (consigne de la v0) ; `au-style` sauté : une recherche ne montre aucune intensité de famille, seulement « décrite / marquée » par les fiches, sans échelle à lire face à un style.
- `controle-panel` sur les quatre captures : remplissage médian 0,60, ressemblance moyenne 0,86, 0 paire presque identique → PANEL OK.

## Données
`proto-data.json` (318 variétés) ; familles et mots par `describeFamilies` et `familyWords` du moteur (`prototypes/houblons-v4/src/engine/hops.ts`) ; rôle par `hopRole` (fournisseur, sinon règle rôle-α v1) ; α du lot pour les 16 articles de stock. Mots anglais restés dans `tagsFr` traduits (« loganberry » → « mûre de Logan ») ou retirés (« pleasant »). Rien d'inventé : l'inconnu reste « ? » (α, huile).
Commun aux quatre : appui long (550 ms, la carte fonce) ou survol long → fiche avec silhouette en pics ; « ? » ouvre la légende ; champ `type="search"`, jamais `type="number"`. La page est figée après son premier rendu (listes présentes dans le HTML) ; le script la refait au chargement.
