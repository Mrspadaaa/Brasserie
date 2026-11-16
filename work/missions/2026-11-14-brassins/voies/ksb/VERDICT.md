OK — 9 problèmes, 2 bloquants

Version : arbre de travail non commité de la branche (port sb), captures `voies/sb/captures/` de 22:31-22:32.
Sa question : « combien et quels problèmes il y a ? ». Paires ouvertes : 11 captures de l'app, 11 de ses maquettes (c2a cave sans paire app).

| capture | thème | largeur | état | problèmes | bloquants |
|---|---|---|---|---|---|
| d1b-repos-app-390-clair | clair | 390 | repos | 2 (d1b 1, 3) | 0 |
| d1b-geste-app-390-clair | clair | 390 | geste (21) | 2 (d1b 1, 3) | 0 |
| d1b-loin-app-390-clair | clair | 390 | loin (28) | 3 (d1b 1, 2, 3) | 0 |
| d1b-conflit-app-390-clair | clair | 390 | conflit (15) | 2 (d1b 1, 3) | 0 |
| d1b-repos-app-390-cave | cave | 390 | repos | 2 (d1b 1, 3) | 0 |
| d1b-repos-app-1280-clair | clair | 1280 | repos | 1 (d1b 1) | 0 |
| c2a-repos-app-390-clair | clair | 390 | repos | 2 (c2a 1, 3) | 1 |
| c2a-repos-app-1280-clair | clair | 1280 | repos | 3 (c2a 1, 2, 3) | 2 |
| c2a-geste-app-390-clair | clair | 390 | geste = d1b ouverte (lecture du pilote) | 0 | 0 |
| c2a-apres-app-390-clair | clair | 390 | après « Planifier » | 2 (c2a 1, 4) | 1 |
| c2a-vide-app-390-clair | clair | 390 | vide | 2 (c2a 5, 6) | 0 |

## d1b — CONFORME

Il la reconnaît d'un coup d'œil : damier de trois semaines, bandes de cuve, cône du dry hop, bouteille, thermomètre de garde, « 1er » en tirets, raison du jour, conflit en ocre avec « Prendre … le premier libre » et « Planifier quand même » en gris, ‹ grisé avant la semaine courante. Phrase prédite : « Oui c'est ça. » Trois retouches, aucune bloquante.

1. Tous les états, ligne du stock : l'app énumère chaque malt par son nom complet (« ZZ Malt Pilsner, ZZ Malt Munich, ZZ Saaz, ZZ Levure US-05 ») et passe sur deux lignes, à 390 comme à 1280 ; sa maquette dit « malts, Saaz, Hallertau, US-05 » sur une ligne. Correction : regrouper les malts en « malts » (le port le fait déjà dans la carte après) et garder la levure au nom court.
2. État loin (28), phrase de raison : l'app dit « La cuve est libre depuis le 18, vide 10 jours. » ; sa maquette dit ce qui se passe à la cave ce jour (« la NEIPA est en garde depuis le 19 »). L'événement est connu (thermomètre sur le 19). Correction : ajouter à la raison l'événement de cave en cours au jour choisi.
3. Tous les états à 390, en-tête : la ligne « 24 L · cuve de 72 L · le stock se réserve à la planification » est sortie de l'en-tête, sous le trait, en corps plus grand ; sa maquette la tient en sous-titre gris, collée au titre, dans l'en-tête. Correction : sous-titre dans l'en-tête, sous le titre, corps du sous-titre de la maquette.

## c2a — CORRIGER

Les cartes, la pastille à trois traits, le mot, la ligne levure · dernier lot, le tri, le titre à deux couleurs et le vide sont là. Phrase prédite : « Pourquoi les styles sont en gris ? Et sur l'ordi c'est une petite colonne, j'avais deux colonnes. »

1. [B] Repos (390 et 1280) et après, pastille de style : sa maquette met le style dans une pastille de couleur (Stout lavande, Saison orange, NEIPA vert, Pilsner jaune, APA vert), sur chaque carte et sur la carte du lot neuf ; l'app écrit le style en petit gris (« American Pale Ale », « New England IPA ») et la carte après n'en a aucun. Élément de sa maquette changé. Correction : la pastille de style de l'app (celle des cartes Brassins, « APA »), à côté du nom, sur chaque carte et sur la carte après.
2. [B] Repos 1280 : sa maquette est une grille de deux colonnes (« c2a est la meilleure de la série ») ; l'app ouvre une boîte d'environ 520 px, une colonne, trois cartes et demie, la quatrième coupée au bord. Correction : à 1280, une feuille assez large pour que la container query de 640 px donne deux colonnes (ou la page), cinq à six cartes visibles.
3. Repos, ligne de cuve : l'app écrit « La cuve est libre mer. 18.11 » en texte nu ; sa maquette a le picto de cuve à gauche (« Conditionner › » est écarté en ACCORD 8, le picto ne l'est pas). Correction : le picto cuve de la maquette en tête de ligne.
4. Après « Planifier », rangée du stock : « Malts, ZZ Saaz 60 g, ZZ Levure US-05, 1 sachet » se coupe entre « 1 » et « sachet » ; sa maquette dit « Malts, Citra 100 g, Verdant IPA » (levure sans quantité). Correction : levure au nom seul comme la maquette, ou quantité insécable.
5. Vide, aperçu « Ce que Brasser montrera » : chaque effet porte un ↶, alors que l'après n'en a aucun (ACCORD 4). L'écran promet un geste qui n'existe pas. Correction : retirer les ↶ de l'aperçu tant que l'après ne les a pas.
6. Vide, picto « Cuve libre » : une caisse en perspective ; sa maquette a le picto de cuve (le même que la ligne « F3 libre »). Correction : reprendre le picto cuve.

## Doutes (non comptés)
- Contenant de c2a : sa maquette est une page sous l'onglet (en-tête de l'app, onglets, barre du bas) ; l'app l'ouvre en feuille « Nouveau brassin » par le +. Non déclaré en ACCORD. Il a choisi r2a pour Recettes, donc c2a ne peut pas prendre cet onglet : la feuille se défend, mais c'est au pilote de le dire.
- Chiffres du banc : toutes les cartes affichent 6,6 % et 24 L (abvTarget par défaut de `banc.mjs`), et la Blonde de soif porte OG 1,048 avec 6,6 % (environ 4,7 % attendus). C'est la fixture, pas le port, mais le banc ne permet pas de juger les chiffres des cartes. Une fixture par recette, cohérente, est à prévoir.
- Après, liste e6a (hors OWNS du port) : puce « Tous 5 » contre « 6 brassins » en tête. Valeur fausse si les deux comptent la même chose ; à vérifier.
- Après : le bandeau « Compagnon hors connexion · mode local » couvre le nom de la deuxième carte (banc local).
- Les ↶ par effet de la carte après, la ligne « F3 … Conditionner › » et « réservée » : écarts déclarés en ACCORD 1, 4, 8, 9, non comptés.
- La carte Stout « Brasser ZZ-021 » (brassin déjà prévu) n'apparaît dans aucune capture (sous le pli).
- Captures d1b de 22:31, plus anciennes que `FeuilleBrasser.tsx` (22:34) et `QuickActionModal.tsx` (22:33), changés pour le jour figé. Défauts vus maintenus, à reconfirmer.

## Captures manquantes
- c2a repos 390 cave (sa maquette existe), d1b 1280 cave, c2a vide et après en cave.
- d1b : stock déplié (geste), semaine suivante (›), jour figé dans Chrome. c2a : carte « Brasser ZZ-021 » ; un brassin à l'écran à 1280 après correction du point 2.
