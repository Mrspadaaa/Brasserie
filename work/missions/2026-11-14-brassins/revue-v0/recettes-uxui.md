# Recettes, séries v0 r1 et r2 : revue UX/UI (rv-uxui-recettes, 15.11)

Regard : hiérarchie, premier plan, gestes comptés, états, saisie au téléphone, cibles, coup d'œil ; Nielsen en bref. 46 captures ouvertes (r1a à r2d), plus e6a et e1a. Cible mesurée sur capture ×2 (780 px = 390 css). Base : PROBLEMES.md § Recettes (n° 1 à 9).

## r1a
Lignée : 19 lignes de 57 px, versions regroupées (n° 1, 4), comparer v3/v2 sans cocher (n° 9). Coup d'œil net, deux thèmes et 1280 tiennent. Mais Brasser n'est pas sur la ligne : déplier puis toucher (2 gestes) ; pas de champ de recherche ouvert (acquis e6a), seulement une loupe ; aucun signe de stock (n° 7). En-tête 1280 différent de 390 (« Brassins (4) », « Atelier R&D »). Nielsen : cohérence.
Verdict : CORRIGER

## r1b
Recherche en mots, phrase comprise en pastilles : bon pour n° 3 et n° 6. Mais la liste au repos répète chaque version (Helles ×4, NEIPA ×3) : le contraire de compact (n° 1). L'index des lettres fait ~20 px de large, sous 44. Pas de Brasser sur la ligne. Le + flottant disparaît en geste et en recette. Métier : « levure US à adapter » pour US-05, levure Fermentis vendue partout en Suisse, sonne faux.
Verdict : CORRIGER

## r1c
Phrase-réponse « 6 du moment / 35 en tout », champ qui fouille aussi les Archives, action sur la carte (Préparer, Rebrasser) : premier plan court et juste. Défauts : l'archivage seul à 6 mois déplace ses recettes sans geste (Nielsen, contrôle) ; « Annuler » est loin, au tiroir. Onglets empilés de ~22 px, sous 44. Puce qui répète le nom (Stout Stout, Saison Saison). 1280 coupe « 5,… ». « vous » au vide, « tu » ailleurs.
Verdict : CORRIGER

## r1d
▶ sur la ligne : brasser en un toucher (n° 5), disque de 44 px, lecteur qui suit le lot. Risques : un lot créé par mégarde (Nielsen, prévention d'erreur) ; trois couches en bas (lecteur, + flottant, barre) se chevauchent ; Modifier et Comparer cachés au glissement. L'alcool en grand à droite prend la place du stock (n° 7). « Cuve à choisir : F1, F2, F3 occupées » ne propose rien. Pochette Stout lisible, données honnêtes.
Verdict : CORRIGER

## r2a
La seule qui répond à « puis-je la brasser ? » au premier coup d'œil : phrase-réponse, fermenteur libre, Brasser ou Aux besoins sur la ligne, 28 autres pliées (n° 1, 5, 7, 8). Valeur fausse : Citra 250 g demandés, 100 g réservés au LOT-019, donc 0 libre et il manque 250 g, pas 150. Boutons de 35 px de haut, sous 44. Versions non regroupées (n° 4). Pale Ale en retard non signalée.
Verdict : CORRIGER

## r2b
Comparer d'un toucher, « seulement ce qui change » et « Pareil : … » : la meilleure réponse au n° 9. Mais retrouver une recette connue (n° 3, 80 % des cas) passe par cinq puces ou un lien « Les 35 recettes » en pied ; aucun champ. Le pourcentage de proximité est opaque au coup d'œil. Puce rouge « − Mosaic » se lit comme une erreur. Brasser à 35 px. Bonne fiche ouverte, pas une entrée.
Verdict : CORRIGER

## r2c
Bien pour n° 4 et n° 6 : « neipa v3 » dit V1, levure WLP066 remplacée avec ses effets, rien n'entre sans accord, chaque rangement s'annule. Mais le premier plan est une boîte de réception : le carnet lui-même n'est qu'un lien sous le pli à 390 ; retrouver ou brasser une recette connue n'y est pas (n° 3, 5). 1280 : colonne gauche vide. « Saaz, en g » illisible en soi.
Verdict : ÉCARTER

## r2d
Belle roue, nette en clair, mais elle sert l'exploration (les 20 %), pas le cas courant : retrouver par le nom, brasser. Elle prend deux tiers de l'écran (n° 1, 8). Douze couleurs et deux anneaux qui disent le même compte : D77, « très compliqué à voir les différence avec les couleurs ». « Herbe » et « Herbacé » se confondent. En cave, l'anneau pâle éblouit. Ni champ, ni Brasser, ni stock.
Verdict : ÉCARTER

## Classement
1. r2a : seule à répondre au stock et au verbe brasser sur la ligne ; corriger le manque Citra et les cibles.
2. r1a : lignée compacte et comparer sans cocher ; manque Brasser sur la ligne et le champ ouvert.
3. r1d : brasser en un toucher ; trop de couches en bas, risque de lot par mégarde.
4. r1c : carnet court et recherche dans les Archives ; archivage seul à rendre visible et annulable.
5. r2b : meilleure comparaison ; pas d'entrée pour retrouver une recette connue.
6. r1b : recherche en mots ; liste longue et index trop étroit.
7. r2c : boîte d'import utile, mais le carnet passe au second plan.
8. r2d : exploration par le goût, trop grande et trop colorée pour l'entrée.

## Greffes
- Ligne « prête · il manque X » et Aux besoins (r2a) → chaque ligne de r1a et de r1d.
- Lignée, « Ce qui change depuis la v2 » (r1a) → r2a : une ligne par recette, version en tête.
- Champ ouvert qui fouille aussi les Archives (r1c) et phrase comprise en pastilles (r1b) → r2a et r1a, sous la phrase-réponse.
- Comparer « seulement ce qui change », « Pareil : … » (r2b) → « Comparer v3 et v2 » de r1a.
- ▶ qui crée le lot, puis Annuler et dates Demain / Sam. (r1d) → Brasser de r2a quand tout est en stock (la feuille seulement s'il manque).
- Rebrasser sur une recette écoulée (r1c) → r2a.
- Une ligne « À regarder · 3 » et la feuille d'import avec effets de levure (r2c) → r2a, en tête du carnet, repliée.
- « Son goût » en barre et « D'où il vient » (r2d) → recette ouverte de r1a.
- Vide à trois sources Photo / Lien / Texte (r2c) → vide de r2a.
