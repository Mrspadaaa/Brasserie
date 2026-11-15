OK — 8 mini maquettes de l'outil d'analyse (a1a–a1h), exemple et état honnête, PANEL OK

## Concepts (une ligne chacun ; chaque concept sert les trois questions, la dominante en premier)
- `a1a` froid — **le passé accroché** : p5b telle quelle, tournée vers le passé (30 j, chaque opération une étiquette à sa marche, prévu en pointillé, « pas prévu » en orange ; cartes Réel · Prévu · Même jour 2025). Entrée : Synthèse › « Revoir le mois ».
- `a1b` froid — **les tuiles de g2c en outil** : 12 mois teintés gagné/perdu, règle de budget au pied de chaque tuile, 2025 au coin, 13e case +2 016,00 contre −840,00. Entrée : Annuel › « Mois par mois » (bouton de g6).
- `a1c` tiède — **deux années superposées** : cumul gagné 2026 sur 2025, écart teinté (+2 856,00), prévu pointillé ; l'écart décomposé par catégorie. Placement : 5e onglet « Comparer ».
- `a1d` tiède — **la règle du budget** : une règle par catégorie (mois en colonnes dedans, trait « aujourd'hui », dépassement hachuré rouge, encoche 2025) ; brassins prévu → réel (Pale Ale 57,42 → 64,26). Entrée : Prévisions › « Budget tenu ? ».
- `a1e` tiède — **la cascade du mois** : caisse du 1er → ventes → chaque catégorie → caisse du 31, prévu en cadre pointillé, 2025 en trait gris ; frise teintée des 12 mois pour choisir. Entrée : Synthèse, toucher le mois.
- `a1f` chaud — **l'anneau des deux années** : l'année en horloge, gagné dehors, perdu dedans, 2026 dehors / 2025 dedans, mois hors budget en pastille orange. Entrée : Annuel, toucher le résultat.
- `a1g` chaud — **les verres** : un verre par mois rempli des ventes, trait du coût, mousse = gagné, vide hachuré = perdu, encoche du prévu, trait gris 2025. Entrée : Annuel › « Mois par mois ».
- `a1h` chaud — **le relevé qui se dessine** : le temps descend l'écran, la caisse en barre qui s'allonge ou se ronge (l'escalier couché), chaque mois ouvert par gagné · prévu · 2025. Entrée : Opérations, bascule liste / dessiné.

Exigences du brief : reprise de p5b telle quelle sur le passé = a1a ; part des tuiles g2c = a1b (et a1g) ; deux années superposées = a1c (et a1f). Chaque `etat.html` a une 2e figure : **ses données aujourd'hui** (départ 100,00 à confirmer au 08.01, vente 5 695,00 le 10.11, 5 achats « −27,68 au moins », travaux 5 500,00 à part, aucune prévision, 2025 vide) : « rien noté » hachuré, jamais 0 ; solde « ≤ 267,32 ».

## Fichiers écrits
`p6/a1a/` … `p6/a1h/` : chacun `etat.html` (statique, classes préfixées `a1x-`), `NOTE.md`, `a1x-haut.png`, `a1x-page.png`, `a1x-1280.png`. Ce fichier. Générateurs hors dépôt (scratchpad) : `gen/commun.mjs`, `gen/donnees.mjs`, `gen/a1a.mjs` … `gen/a1h.mjs`, `gen/cap1280.mjs`, `gen/notes.mjs`. Rien dans `src/`, aucun commit, pas de stash ; `git status` : seul `p6/` neuf.

## Sorties décisives
- `verifier-page.mjs <etat.html> --min-images 0 --captures p6/<id>/<id>` ×8 : `PAGE OK (0 images chargées, 390 px, sans erreur)`.
- `cap1280.mjs` ×8 : `1280 débord 0 · texte < 12 px 0 · erreurs 0`.
- `controle-panel.mjs p6/a1?/a1?-haut.png` : `8 captures · remplissage médian 0,69, 0 sous 0,50 · ressemblance moyenne 0,87 · paires presque identiques 0/28 (0 %)` → `PANEL OK`.
- `mots-premier-ecran.mjs p6 a1a…a1h --page=etat.html --max=60 --sans-donnees --sans-coquille --profil=sans-houblons` : 56 · 48 · 42 · 59 · 42 · 49 · 46 · 55 → `MOTS OK`. (Sans `--sans-donnees`, chiffres comptés : 64 à 108, ECHEC — le brief dit « 60 mots hors chiffres ».)

## Captures (toutes ouvertes)
`p6/<id>/<id>-haut.png`, `<id>-page.png` (premier écran + état honnête), `<id>-1280.png` (a1c ouverte à 1280 ; les autres mesurées : débord 0).

## Prédiction
Il ira d'abord à a1a (« c'est p5b mais sur mes vrais chiffres ») et à a1b ; a1d répond le mieux à « est-ce que je respecte mon budget » ; a1g ou a1f peuvent le frapper, ou le perdre par leurs marques à apprendre.

DÉCISION À PRENDRE : (1) le placement (Synthèse, Annuel › Mois par mois, 5e onglet « Comparer », Prévisions › Budget tenu ?, bascule dans Opérations) — à lui montrer avec les concepts ; (2) les maquettes posent des **ventes prévues** (900,00/mois, exemple) pour tracer un « prévu » du solde : `FinancialPlan.direction: 'in'` le permet, mais l'app n'en a pas aujourd'hui ; sans elles, le prévu ne porte que les dépenses (a1d tient seul sans ventes prévues).

Écarts au brief : skills `impeccable` et `ui-design-system` non chargés (boosters-ux chargé et suivi) ; B5, B6, B7, B13 non mesurés (v0) ; « Même jour 2025 3 340,00 » de a1a est un solde d'exemple approché, sans tracé 2025 dessiné.

CONNAISSANCE : `FinancialPlan` porte `direction: 'in' | 'out'` (src/domain/finance/types.ts l. 97) : des ventes prévues sont possibles, donc un « prévu » du solde complet aussi.
LEÇON PROPOSÉE : un socle partagé entre concepts doit réserver ses noms de classe : `a1d-f` (remplissage d'une règle) a pris le cadre d'écran `.<p>-f` du socle (844 px), bug vu seulement sur la capture (L26 : un nom par rôle, liste des noms du socle dans le générateur).
