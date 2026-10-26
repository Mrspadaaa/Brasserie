# rca3 — les presque

- **Chaleur** : tiède (la forme de l'approche : les critères en clair deviennent les colonnes de la liste).
- **Idée** : chaque houblon montre les critères qu'il coche (point noir) et, pour celui qui manque, sa vraie valeur en orangé (« 17,2 » sous α < 12, le chariot sous en stock). Ceux à un critère près sont rangés par le critère qui les bloque, avec « lâcher » : on voit ce qu'on gagne à le lâcher.
- **Cas** (l'exemple du brief, vrai) : Tropicaux, « fruit de la passion », α < 12, dry hop, en stock → 1 seul tout coché : Hallertau Blanc (30 g, α 9,5 du lot, « vin blanc », « groseille à maquereau » hors des 12). À un près : Motueka (pas de « passion »), Galaxy (α 17,2) et Citra cryo (α 24,8) en stock, puis 20 à acheter (Melba, Tango…). Galaxy face aux autres : sa barre d'huile 1,8–5 et « passion ananas pêche » ; Saaz n'est pas dans la requête.
- **D'où, où** : du champ de l'étape (titre « Ajouter — houblon ») ; appui long → fiche ; α réglable par − / +.
- **Réactif** : − / + sur α, toucher une pastille ou « lâcher » refait groupes et comptes.
- **Ce qui tient** : répond à « souvent pas présent » (D21) : ce que j'ai presque, et pourquoi.
- **Ce qui casse** : les pictos de famille au trait restent fins : COULEURS ECHEC (1 teinte franche mesurée, l'orangé tropical) ; pas de + sur la ligne (l'ajout passe par la fiche) ; les colonnes à 40 px sont justes pour le doigt.

## Contrôles (joués une fois sur les quatre, 24.10 soir)
- `concepts.mjs rca1 rca2 rca3 rca4` → CONCEPTS-BIEN-4 ; `controle-pictos-trait --page=etat.html` → TRAIT OK.
- `controle-commun --sans=mots,au-style --page=etat.html` : survol, blocs, contraste, fiche, standard, trait, légende, parlant, brutes OK ; COULEURS ECHEC sur rca3 seul (1 teinte franche mesurée : la requête est tropicale, orangée ; ses pictos de famille au trait sont trop fins pour la mesure).
- Écarts, avec leur raison : `mots` sauté (consigne de la v0) ; `au-style` sauté : une recherche ne montre aucune intensité de famille, seulement « décrite / marquée » par les fiches, sans échelle à lire face à un style.
- `controle-panel` sur les quatre captures : remplissage médian 0,60, ressemblance moyenne 0,86, 0 paire presque identique → PANEL OK.

## Données
`proto-data.json` (318 variétés) ; familles et mots par `describeFamilies` et `familyWords` du moteur (`prototypes/houblons-v4/src/engine/hops.ts`) ; rôle par `hopRole` (fournisseur, sinon règle rôle-α v1) ; α du lot pour les 16 articles de stock. Mots anglais restés dans `tagsFr` traduits (« loganberry » → « mûre de Logan ») ou retirés (« pleasant »). Rien d'inventé : l'inconnu reste « ? » (α, huile).
Commun aux quatre : appui long (550 ms, la carte fonce) ou survol long → fiche avec silhouette en pics ; « ? » ouvre la légende ; champ `type="search"`, jamais `type="number"`. La page est figée après son premier rendu (listes présentes dans le HTML) ; le script la refait au chargement.
