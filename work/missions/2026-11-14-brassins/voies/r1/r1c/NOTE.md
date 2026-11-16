# r1c — Le carnet court

Chaleur : froide (les idées retenues, affinées : phrase-réponse e6a, champ e6a, cartes compactes, pied d'action).
Idée : le carnet s'archive de lui-même
Ce qui change : 6 recettes du moment, chacune parlée en recette et non en lot : métro des versions, stock (« prête » ou « manque Citra 250 g »), « dernière : LOT-019, en cuve » ; barre de gauche à la couleur de la bière ; le reste dort aux Archives (29), rangé seul après 6 mois.
Geste : « dunkel » tapé : puces « Compris : Dunkel (nom) · brune (couleur) », « Au carnet : aucune », la Dunkel trouvée aux Archives (prête, 5,2 %) avec « Brasser » et « Remettre au carnet », puis « Aussi brunes » (Porter v2, Brown Ale v1).
Problèmes résolus : n° 1 (6 cartes, le reste au tiroir), n° 3 (un champ qui fouille aussi les Archives, et dit ce qu'il a compris), n° 4 (métro des versions), n° 7 (stock sur chaque carte), n° 8 (fiche : grain en barre, houblon, levure, visée).

- Repos : « 6 recettes du moment » et « 35 en tout » ; barre d'état à gauche (cuve, retard, garde, conditionnée, écoulée, bientôt rangée) ; action directe sur la carte (Préparer, Rebrasser) ; tiroir « Archives · 29 » en onglets empilés, la règle en une phrase, « Cette semaine : Helles v4 rangée · Annuler ».
- Recette : la Dunkel sortie du tiroir, onglet « dans Archives depuis sept. 2025 », malts en barre aux couleurs EBC, « La brasser la remet au carnet » ; pied « ★ Garder au carnet » et « Brasser la Dunkel ».
- Vide : la règle en une phrase, « Nouvelle recette », reprise de l'idée de l'Atelier, deux cartes d'exemple estompées.
- Données : réelles (DONNEES-COMMUNES) : NEIPA LOT-019 en F1, densité 1,018 ; Pale Ale prévue le 08.11 ; Pils en garde 2 °C ; Stout conditionnée le 06.11, 5,9 % ; Saison écoulée, 6,1 %. Fictives (exemple) : West Coast IPA, les 29 archives, la Dunkel entière (LOT-008, mars 2025, 5,2 %, Munich 70 % / Pilsner 25 % / Carafa III 5 %, Hallertau Mittelfrüh 30 g à 60 min, W-34/70 à 12 °C, OG 1,052, FG 1,012), Porter v2, Brown Ale v1, Helles v4 rangée.
- Écart : la règle des 6 mois est une proposition (seuil à régler) ; α du lot non montré (« à lire au stock »). Données fictives ajoutées à la passe : stocks de Brown Ale (levure S-04) et Porter (2 achats), versions des recettes hors DONNEES-COMMUNES.

## Passe de correction (15.11, revues artiste, brasseur, UX, critique)
- 1280 : grille en 2 colonnes, états en `white-space: normal` ; plus de « 5,… » coupé.
- Les cartes ne doublent plus Brassins : version, stock, dernière en une ligne courte ; barre EBC (or, ambre, paille, stout) au lieu de l'état du lot.
- Fin de section `padding-bottom: 104px` : le tiroir passe au-dessus de « + Recette » (capture `r1c-repos-390-fin.png`).
- Vide : « ce que tu brasses » ; « (exemple) » retiré.
- Doublons « Stout Stout », « Saison Saison », « Dunkel Dunkel » retirés (pastilles de style ôtées ; « Munich Dunkel » dans la ligne de la fiche).
- Chiffres à virgule hors mono (`tabular-nums`, espace insécable) : « 5,2 % », « 70 % », « 1,052 » sans virgule large.
- Tiroir : tout le bloc (tête et onglets) est un seul bouton ; onglets `aria-hidden`, décor.
- « Rangée cette semaine : Helles v4 · Annuler » remonté sous la phrase, avant le champ.
- Greffe artiste : puces « Compris » sous le champ au geste.
