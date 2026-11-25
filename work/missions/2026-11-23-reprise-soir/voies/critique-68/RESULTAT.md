# RESULTAT critique-68 : 13 problèmes (B 4, m 9, D 4) — corrigés rejoués 12/12 C67 (tenus 2, C67-1 en partie) ; C66-4 non rejoué — carnet identique oui — BUGS OK

Paquet en ligne : index-BRxcNYiQ.js (curl ?nocache, 25.11 ; l'onglet servi BVBC77LE jusqu'à la mise à jour du SW, aucun avis « Nouvelle version » vu). Le DOSSIER prime sur VOIE.md (index-SSQ_J86L.js).
Tests : sans objet (test d'écran). Registre : `bugs.log` → BUGS OK : 2343 bugs, 562 ouverts.
Coût IA : 7 appels « ranger » (aiTask), ≈ 0,014 CHF, journalisés dans ia-journal.jsonl.

## Ses données : identiques
Avant (avant.json) et après (apres.json) : Synthèse 0,00 / 265,40 ; caisse 1 145,00 ; départ 1 145,00 ; Opérations 265,40 / 0,00 / 265,40 ; −463 CHF à dépenser ; cadre 23 nov. 2026 – 3 janv. 2027 ; période 6 sem. ; 16 barres de la frise identiques ; 32 carnets ; Chambre froide identique (texte et 3 documents) ; 3 392 documents Firestore hors ZZ, aucun changé ni manquant. Les 9 entrées neuves du cache sont des tombes (sans document) de mes 2 carnets et 7 notes supprimés. Guet vide à l'ouverture de Chambre froide (LE-1 et BD-1 tiennent). Tout ZZ c68 retiré (2 carnets supprimés, « Carnet supprimé » vu ; liste sans c68).

## Combien et quels problèmes ? 13
1. **B — C68-1 (C67-2 rouvert)** — carte « rangé pour toi » de la vapeur : la phrase entière en titre, « Brasserie » sans sous-catégorie, « nouveau carnet · idée », aucune tâche (cap/B3-carte.png contre v01-saisie). Pour les caisses Vetropack, la carte donne bien Brasserie › Conditionnement et une tâche : le défaut dépend de la phrase.
2. **B — C68-2 (C67-4 rouvert)** — « ≈ 1 430 CHF » en tête : 690 + 540 + 200, trois options exclusives additionnées, encore après avoir écarté la hotte (C6-options, D3-ecartee). Valeur fausse.
3. **B — C68-3 (C67-5 rouvert)** — Résolu : « Rangé : À ranger » alors que le carnet est dans Brasserie ; ni la retenue (« Fermé grâce à »), ni les options pas prises (F0-resolu contre v01-resolu). « ira dans Réalisés » est là.
4. **B — C68-4** — ligne du résolu dans « résolus 2026 » : « Résolu · à comparer · 540 CHF » (condenseur B, hors stock, jamais choisi), alors que la hotte à 200 CHF est retenue (F6-resolus-ligne).
5. **m — C68-5 (C67-7 rouvert)** — raison d'écart tapée « il faut refaire l'électricité » : jamais affichée (D7, D8). La moitié « pas de raison sous la retenue » tient.
6. **m — C68-6 (C67-9 rouvert)** — un toucher sur Veille : une bulle d'abord, puis deux « veille demandée » après écarter puis reprendre l'option (D10).
7. **m — C68-7 (C67-8 rouvert)** — les condenseurs A et B deviennent des articles, sous l'en-tête « Hotte + extracteur… aucun article encore » ; B, « pas trouvé », est classé 1er ; picto de hotte sur les condenseurs (C6).
8. **m — C68-8 (C67-10 rouvert)** — Relecture : pas de ligne « essayé », « problème » recopie le titre, catégorie « À ranger » ; ‹ ramène à la liste (F2, F4 contre v01-relecture).
9. **m — C68-9 (C67-11 rouvert)** — À faire : aucun coût, seulement « Cette semaine 8 » et « Plus loin 4 », tout « au Planning » ; appui long de 1,6 s au toucher : rien (G1, H8 contre v01-afaire).
10. **m — C68-10 (C67-12 rouvert)** — domaine ▾ : Local, Brasserie, Meuble, Outils, Papiers seulement (C4-domaine).
11. **m — C68-11 (C67-1 en partie)** — une seule rangée, chaque entrée du ▾ atteinte (Recompter, Fûts vus ; A1, A3) : tenu. Mais les problèmes « Je cherche » de l'arbre n'ont ni jauge, ni état, ni dernier pas (seul le Décidé en a), et Houblons citra et Chambre froide ne sont pas repliés (H3 contre v01-liste).
12. **m — C68-12** — OK sur une carte avec « Tâche proposée » ne pose pas la tâche : À faire reste à 12 ; il faut rouvrir le carnet et toucher À faire (H1, H5b). Pas pratique.
13. **m — C68-13** — « Réalisés 0 » avec 6 résolus et « ira dans Réalisés » (F0, F6).

Doutes (non comptés) : l'aperçu de la réponse au « pourquoi » annonce « va atterrir ici · Articles : Pourquoi… » (E3), mais la phrase est finalement rangée « pourquoi » ; état Décidé gardé alors que la seule option est écartée (D8) ; chaque note ZZ propose « Rattacher à Hotte recyclage ? » (son carnet, pertinent mais répété ; jamais accepté) ; à 1280, colonne étroite au centre (L0).

## Corrigés rejoués
- C67-3 : vérifié — en ligne index-BRxcNYiQ.js (··· › Problème change l'écran aussitôt, cap/C2-probleme-aussitot.png).
- C67-6 : vérifié — en ligne index-BRxcNYiQ.js (la tâche Vetropack « avant vendredi » va dans À faire, À venir reste 11, aucun ZZ au Calendrier).
- C67-1 en partie (rangée tenue ; jauge et repli : C68-11). Rouverts : C67-2, 4, 5, 7, 8, 9, 10, 11, 12 (C68-1 à C68-10).
- C66-4 (Choisir 1 kg) : **non rejoué**, faute de tours (voir DEMANDE).

## Captures
| capture | thème | largeur | état | problèmes | bloquants |
|---|---|---|---|---|---|
| A1, A3 | clair | 390 | Matériel ▾, Recompter | 0 | 0 |
| B3-carte | clair | 390 | carte rangé pour toi | 1 (n° 1) | 1 |
| C2, C4, C6, C7 | clair | 390 | problème, domaine, options | 4 (n° 2, 7, 10, 11) | 1 |
| D3, D7, D8, D10 | clair | 390 | écarter, raison, veille | 3 (n° 2, 5, 6) | 1 |
| E3, E5 | clair | 390 | pourquoi | 0 (doute) | 0 |
| F0, F2, F4, F6 | clair | 390 | Résolu, Relire, résolus | 4 (n° 3, 4, 8, 13) | 2 |
| G1, H1, H3, H5b, H8 | clair | 390 | À faire, arbre, tâche | 3 (n° 9, 11, 12) | 0 |
| L0, L1, L2 | clair | 1280 | liste, problème, À faire | 0 (doute) | 0 |
| N0, N1 | « sombre » | 390 | liste, problème | non obtenu : l'émulation prefers-color-scheme ne change pas le thème de l'app | — |

## DEMANDE EXECUTANT (non joué ici, faute de tours)
1. Sur ZZ TEST : photo seule (À ranger), mémo, carnet houblons avec les 2 liens Citra (motlerhops, brauundrauchshop) : prix, Comparer, Choisir 1 kg jusqu'à À venir (rejeu C66-4), Retirer un article puis Annuler ; usage neuf avec achat daté au Calendrier.
2. 2 captures en sombre par le réglage de thème de l'app (pas l'émulation du média).
3. Ménage ZZ et relevé avant/après (etat.mjs) ; captures à ouvrir par le critique.

LEÇON PROPOSÉE : une voie de test d'écran chiffre ses tours par geste dès le départ (≈ 1 tour par geste, plus 10 de ménage) et coupe le DOSSIER en deux voies quand il dépasse le plafond ; ici, 100 tours n'ont couvert que le problème et À faire.
