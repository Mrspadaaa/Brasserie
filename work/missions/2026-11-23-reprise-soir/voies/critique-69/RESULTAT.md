# RESULTAT critique-69 : 13 problèmes (B 2, m 11, D 0) — corrigés rejoués 22/22 (tenus 13, en partie 7, rouverts 2) — carnet identique non (son carnet Sol touché, voir en tête) — BUGS OK

Paquet en ligne : index-l6sx_rVf.js (curl ?nocache, 25.11 ; onglet mis à jour, vérifié dans avant.json). Le DOSSIER prime sur VOIE.md (index-SSQ_J86L.js).
Tests : sans objet (test d'écran). Registre : `bugs.log` → BUGS OK : 2356 bugs, 553 ouverts.
Coût IA : 14 appels « ranger » (aiTask), ≈ 0,028 CHF, journalisés dans ia-journal.jsonl.

## BLOQUANT EN TÊTE : son carnet « Sol — matières premières + outils » a été touché
Mon mémo de rejeu C67B-5 (« ZZ TEST — c69 mémo : le sol époxy du local a bien tenu… ») a été rangé tout seul dans son carnet Sol, comme le veut la maquette v01-memo. C'était ma faute : j'ai choisi une phrase qui visait son carnet. J'ai ensuite fait ··· › Supprimer sur la note : « Note supprimée » s'affiche, mais la bulle reste (C69-2). En base : `creativeItems/CARNET-PLANNING-T-11` updateTime 2026-11-20 → 2026-11-25T03:12:21Z. Ses 2 notes et son critère sont intacts, et le tableau notes ne contient plus la mienne. Mais le message `creativeItems/MSG-1299ae28-e376-4abc-b014-8730e5ab6708` (titre ZZ TEST — c69 mémo) reste dans son fil.
À faire par le pilote : retirer MSG-1299ae28… (le seul reste ZZ c69), puis revoir le carnet Sol.

## Ses données : le reste est identique
Avant (avant.json) et après (apres.json) : Synthèse 0,00 / 265,40 ; caisse 1 145,00 ; départ 1 145,00 ; Opérations 265,40 / 0,00 / 265,40 ; −463 CHF à dépenser ; cadre 23 nov. 2026 – 3 janv. 2027 ; période 6 sem. ; 16 barres de la frise identiques ; 32 carnets ; liste identique ; Chambre froide identique (texte et 3 documents) ; Houblons citra identique ; 3 413 documents hors ZZ : 1 seul changé (T-11, ci-dessus), aucun manquant. Les 25 entrées neuves sont 2 journaux d'audit et des tombes de mes 8 carnets et de leurs messages. Guet vide à l'ouverture de Chambre froide (LE-1 et BD-1 tiennent). Mes 8 carnets c69 ont été supprimés (« Carnet supprimé » vu ; le Citra « avec son plan », À venir revenu à 11).

## Combien et quels problèmes ? 13
1. **B — C69-1 (C68-1 rouvert en partie)** : la phrase « vapeur » crée aussitôt une « idée » avec la phrase entière en titre (5 lignes d'en-tête) et « Brasserie » seul ; la carte propose seulement « Rattacher à ZZ TEST — trop de vapeur au brassage ? ». Même chose pour la phrase houblon Citra. Tenu pour la tireuse et la boucheuse : titre court, Brasserie › Conditionnement › Tireuse (B1-carte, C2-jecherche, A1-carte, A4-carte).
2. **B — C69-2** : dans son carnet Sol, Supprimer sur la note ZZ affiche « Note supprimée », mais la bulle reste, même après rechargement. Geste sans effet (J6-confirm, J8-sol-recharge).
3. **m — C69-3 (C68-2 en partie)** : la fourchette « 200 à 690 CHF » est juste. Après Retenir, il n'y a plus aucun coût, ni en tête ni au Résolu (D5-retenue, F0-resolu).
4. **m — C69-4** : chaque prix apparaît deux fois en jeton sur les bulles : « 690 CHF 690 CHF », « 540 CHF piste 540 CHF » (E3).
5. **m — C69-5 (C68-7 en partie)** : ce sont bien des options. Mais les condenseurs portent le picto de la hotte, les tuiles n'ont pas de prix, et « plus en stock » est perdu (C6-options, F0).
6. **m — C69-6 (C68-4 en partie)** : la ligne du résolu dit « Résolu · retenu », sans nom ni coût (F6).
7. **m — C69-7 (C68-13 en partie)** : « Réalisés 1 » alors que « 6 résolus 2026 » (F7).
8. **m — C69-8 (C68-9 rouvert)** : dans À faire, aucun coût, seulement Cette semaine et Plus loin. Le malt « avant le 10 décembre » est rangé dans Cette semaine. L'appui long ne fait rien (G1, G2 contre v01-afaire).
9. **m — C69-9** : une tâche datée tapée dans le problème part en Note, jamais dans À faire (E4).
10. **m — C69-10 (C68-11 en partie)** : la jauge et l'état sont bons sur les problèmes neufs. Houblons citra, Chambre froide et Frigo + congel ne sont pas repliés (A4 contre v01-liste).
11. **m — C69-11 (C67B-7 en partie)** : α 13,6 % n'a pas de ✓, et il reste une ligne « Aucune valeur lue pour : vendeur » (K3).
12. **m — C69-12 (C67B-2 en partie)** : la ligne À venir dit « CITRA® (US) · 1 kg » sans le vendeur (K8).
13. **m — C69-13 (C67B-3 en partie)** : plus de débordement (390/390). Mais dans Ses autres valeurs, les arômes tiennent un mot par ligne dans une colonne étroite (K6).

Doutes (non comptés) : la tireuse est rangée sous « Conditionnement » ; « L'IA n'a pas répondu : 1 message rangé tel quel » sur un carnet neuf ; le Relire dit « essayé : condenseur A · condenseur B » alors que B est resté piste. La réponse au « pourquoi » s'est insérée au milieu du texte prérempli, mais mon toucher a placé le curseur, donc c'est peut-être un artefact du test. Le malt est rangé Brasserie › Brassage › Malt et non en matières premières. Le carnet est créé avant OK, mais Annuler reste offert.

## Corrigés rejoués (en regardant)
- Vérifié — en ligne index-l6sx_rVf.js : C67B-1 (1 kg ≈40 CHF à la confirmation, au Choisi et dans À venir), C67B-3 (débordement), C67B-4 (photo seule : « Rattacher à … ? Oui · Nouveau problème · Laisser »), C67B-5 (mémo rangé dans Sol, sans carnet neuf), C67B-6 (la tireuse s'ouvre en problème Noté · Je cherche · Décidé · Résolu), C67B-8 (un seul prix, ≈40 pour 1 kg), C67B-9 (la fiche suivante s'ouvre en haut, K5), C68-3 (Résolu : retenu, options et raison, Brasserie › Brassage), C68-5 (raison sous l'écartée, rien sous la retenue), C68-6 (une seule bulle de veille), C68-8 (Relecture : essayé, pris, pourquoi, catégorie, « Retour au problème »), C68-10 (domaine › Brassage, Conditionnement, Fermentation), C68-12 (OK pose la tâche : À faire passe de 6 à 7).
- En partie : C67B-2 (C69-12), C67B-7 (C69-11), C68-2 (C69-3), C68-4 (C69-6), C68-7 (C69-5), C68-11 (C69-10), C68-13 (C69-7).
- Rouverts : C68-1 (C69-1), C68-9 (C69-8).
- C67-1 à 12 : rejoués par leurs lignes C68. C67-3 tient encore : ··· › Problème change l'écran aussitôt (C1).

## Captures (390, clair)
| capture | thème | largeur | état | problèmes | bloquants |
|---|---|---|---|---|---|
| A1–A4 carte, apres-ok | clair | 390 | 4 phrases neuves | 1 (n° 10) | 0 |
| B1, C2, C3 | clair | 390 | vapeur, Je cherche, domaine | 1 (n° 1) | 1 |
| C6, D4, D5, E3, E4 | clair | 390 | options, écart, retenue, pourquoi, tâche | 4 (n° 3, 4, 5, 9) | 0 |
| F0, F2, F6, F7 | clair | 390 | Résolu, Relire, résolus, Réalisés | 3 (n° 5, 6, 7) | 0 |
| G1, G2 | clair | 390 | À faire, appui long | 1 (n° 8) | 0 |
| K2–K8 | clair | 390 | liens Citra, Comparer, fiche, Choisir, À venir | 3 (n° 11, 12, 13) | 0 |
| J4, J6, J8 | clair | 390 | mémo dans son carnet Sol | 1 (n° 2) | 1 |

## Non couvert (faute de tours)
Retirer un article puis Annuler ; 3 captures à 1280 ; 2 captures en sombre (par le réglage de thème de l'app) ; usage neuf au-delà des 4 phrases (aucun problème neuf mené jusqu'au Résolu) ; Calendrier après Choisir.

## DEMANDE EXECUTANT
1. Retirer `creativeItems/MSG-1299ae28-e376-4abc-b014-8730e5ab6708` (ZZ c69 mémo), puis relever T-11 et la bulle du carnet Sol.
2. Sur un carnet « ZZ TEST — c70 … » neuf : Retirer un article puis Annuler ; 1280 (liste, problème, À faire) ; 2 captures en sombre par le réglage de l'app.

LEÇON PROPOSÉE : une phrase de rejeu ne vise jamais un carnet du brasseur (sol, chambre froide, houblons citra). Le mémo « réussi » se rejoue sur un carnet ZZ créé pour lui.
