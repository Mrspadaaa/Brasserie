# Registre — refonte frontend houblons

## Objectif

Comprendre les vrais besoins houblons du brasseur, retrouver ce qui s'est perdu,
écrire de vraies specs, poser des garde-fous, puis livrer un prototype HTML
houblons hors de l'app. Prompt : `work/refonte-frontend/prompt-session.md`.
Aucun code de l'app avant la porte B. Issue de suivi : #119.

Plafond de quota hebdomadaire : 80 %. Langue specs/architecture : anglais
ASD-STE100 (D2).

## État

| Phase | État | Livrables |
|---|---|---|
| 1. Besoins réels | **fini** : 7 gates sur 7 (`GATES-phase1.md`), commit local `b675bfe8` | `docs/besoins/corpus-demandes.md` (165), `banque-de-questions.md` (30), `parcours-cles.md` (U1 à U7) |
| 2. Ce qui s'est perdu | **fini** : 8 gates sur 8 (`GATES-phase2.md`), commit local `7912f834` | `docs/qualite/ce-qui-s-est-perdu.md`, captures `docs/qualite/captures/versions/` ; travail `work/refonte-frontend/phase2/` |
| Fils de fer (D12) | publiés en privé, parcours joué par script (A et B) | `docs/besoins/fils-de-fer-houblons.html`, https://claude.ai/artifact/FxHJbe7oaam8TeYTvvbxBW |
| 3. Causes racines | **fini** : 5 gates sur 5 (`GATES-phase3.md`), commit local `e6507df7` | `docs/qualite/causes-racines.md` ; preuves brutes `work/refonte-frontend/phase3/preuves.md` |
| Porte A | résumé publié dans #119 le 18.10 01:08, non bloquante (D13) ; aucune correction reçue | |
| 4. Garde-fous | **fini** : 14 gates sur 14 (`GATES-phase4.md`), commit local `557c5dc3` | `docs/qualite/garde-fous.md`, `protocole-revue-ux.md`, `hooks-settings.json` ; `scripts/check-hop-one-tap.mjs`, `check-hop-ux-rules.mjs`, `check-hop-budget.mjs`, `check-issue-closure.mjs`, `scripts/hop-one-tap/` ; `.claude/hooks/guards.mjs` (inactif) ; `tests/fixtures/production/` ; banc `?catalogue=production` |
| 5. Tickets | **fini** : 60 issues classées (18 gardées, 1 réécrite, 41 fermées comme caduques), épopée #122 et tickets #123 à #129 | `docs/qualite/revision-tickets.md`, journal `phase5/journal-github.json` |
| 6. Specs, architecture | **fini** : 7 gates sur 7 (`GATES-phase6.md`), commit local `9ab977ff` | `docs/specs/houblons.md`, `docs/specs/glossary.md`, `docs/architecture/README.md`, `docs/architecture/hop-logic.md` ; faits relevés `phase6/faits-architecture.md` |
| 7. Visuels, critique | **fini** : haute fidélité = écrans du prototype ; critique Fable à l'aveugle, 5 bloquants corrigés (D16) | `phase7/ux-verdict-fable.md`, captures `phase8/captures/` |
| 8. Prototype | **fini** : 9 gates sur 9 (`GATES-phase8.md`), commits `f8e1326b`, `2fd16758`, `c0d64808` ; page privée version 2 | `prototypes/houblons/` ; https://claude.ai/artifact/UrdkDumB4m95s1iHr4ye27 |
| Porte B | **refusée** (D17) : « Ça correspond pas du tout à une UX UI propre... C'est pire que les alternatives » (Beer Maverick, outil de comparaison) ; v3 confiée à une session neuve (D18), carte task_7bb5b0e3 en attente du clic de démarrage (lancement automatique refusé par l'app depuis le contrôle à distance) | |

## Quota

| Moment | 5 h | Semaine | Contexte |
|---|---|---|---|
| Départ, 17.10 22:05 | 0 % | 0 % | 89 k |
| Corpus fini, 17.10 22:58 | 12 % | 2 % | 540 k |
| Phase 1 finie, 17.10 23:20 | voir get_usage | ≈ 3 % | ≈ 600 k |

## Décisions

Voir `decisions.md` (D1 à D12).

## Fichiers

- Branche `claude/refonte-frontend-specs` (depuis `origin/main` `c8f4c3ae`).
- Extraction (hors dépôt) : `C:\Users\mrspa\AppData\Local\Temp\claude\C--Users-mrspa--codex-worktrees-openai-clean-start-Brasserie\055d83f7-e384-467e-9f02-749828cb09f6\scratchpad\extract\`
  - `extract-human.mjs` : extraction des messages humains (lecture seule des journaux) ;
  - `human-only.jsonl` : 759 messages, identifiants `M0001` à `M0759` ;
  - `chunk-1.md` à `chunk-6.md` : lots pour les extracteurs ;
  - `themes-1.json` à `themes-6.json` : citations classées par thème ;
  - `verify-quotes.mjs` : vérifie chaque citation mot pour mot.

## Preuves

- Extraction : 328 sessions Codex lues (239 actives, 89 archivées), 138
  journaux Claude ; 759 messages humains retenus (D5).
- Florilège houblons : original introuvable, transcription d'agent retenue (D6).

- Production (lecture seule, 17.10 22:41) : `constats/donnees-production-2026-10-17.md` ; catalogue à 12 variétés, stock non normalisé, recettes avec alpha 0 (#120).
- Mesure de l'étape Houblons actuelle (banc QA, 390 × 844, American Stout, 8 houblons en stock) : `docs/besoins/mesure-actuel-390x844-stout.json` et captures ; 0 sur 8 houblons visibles sans toucher, 6 sur 8 après 2 touchers.
- Galerie (port 5182, serveur de lecture `serve-preview.mjs`) : 153 écrans ; 17 représentatifs capturés par `outils/capture-versions.mjs` (`phase2/captures/`, planches `phase2/planches/`). V5.5 maquette (candidate-team-v55-05 et final-22) : onglet Explorer avec « + comparer » et barres/radar sur 15 axes, valeurs simulées, aucun stock ; question « stout au Nugget » : réponse partielle noyée dans un long texte.
- Production jouée en rendu : impossible ce jour (aucune session Chrome QA sur 9222 ; connexion interdite à l'agent). Remplacement prévu : banc QA sur instantané de production (phase 4).
- Stock de production relu (lecture seule, 17.10 23:40) : 9 houblons avec quantité (Target 5 g α 11,3 ; Cascade 60 g α 6,5 ; Galaxy 60 g α 17,2 ; Citra Cryo 65 g ; Nelson Sauvin 100 g ; Sabro 30 g ; Hallertau Blanc 30 g ; Motueka 20 g ; Idaho 7 20 g).
- Fils de fer joués (`outils/check-fils-de-fer.mjs`, `phase2/fils-de-fer/`) : A = 0 toucher pour voir 9 houblons avec quantité, 1 pour ajouter, 2 pour comparer 2, 2 pour remplacer ; B = +1 toucher pour voir et ajouter. Aucun `type=number`, aucune erreur, pas de défilement horizontal.

## Risques ouverts

- R1 : des demandes humaines tapées hors de ces journaux (claude.ai, ChatGPT,
  téléphone) manquent au corpus. Le florilège du 28.09 en est un exemple.
- R2 : les sessions `cli` mêlent messages humains et relais d'agents ; chaque
  citation porte son type (`explicite`, `relaye`, `colle`, `reponse`).
- R3 : le corpus cite des messages privés ; analyse des secrets et des données
  personnelles avant tout commit.
- R4 : clé API Gemini en clair dans les journaux (M0009, M0642, M0643) ; non
  recopiée ; révocation recommandée à l'humain.
- R5 : le banc QA ne reflète pas la production (catalogue complet en fixture,
  12 variétés en production).

## Journal GitHub

| Date | Action | Lien |
|---|---|---|
| 17.10 22:27 | Création de l'issue de suivi de la mission | #119 |
| 17.10 22:28 | Commentaire : lien vers #119 | #115 |
| 17.10 22:28 | Commentaire : traitement en phase 2 de #119 | #116 |
| 17.10 22:45 | Création : données de production houblons (lecture seule) | #120 |
| 17.10 22:46 | Commentaire : lien vers #120 | #119 |
| 17.10 22:47 | Création : optimisation, app lente et données chargées pour rien (demande humaine 22:46) | #121 |
| 17.10 22:49 | Correction de l'heure de la demande dans le corps de #121 ; commentaire de lien | #121, #119 |
| 17.10 23:20 | Commentaire : phase 1 livrée | #119 |
| 17.10 23:21 | Case « phase 1 » cochée dans le corps | #119 |
| 18.10 00:45 | Commentaire : phase 2 livrée (matrice, 6 pertes, production) | #116 |
| 18.10 00:45 | Commentaire : phase 2 et fils de fer, D13 | #119 |
| 18.10 00:46 | Case « phase 2 » cochée dans le corps | #119 |
| 18.10 01:08 | Commentaire : résumé de la porte A (10 lignes) | #119 |
| 18.10 01:08 | Case « phase 3 » cochée ; porte A notée « envoyée, non bloquante » | #119 |
| 18.10 02:20 | Commentaire : phase 4 livrée (témoins, budgets, clôture, hooks préparés) ; case « phase 4 » cochée | #119 |
| 18.10 05:15 | Commentaire : phases 6 à 8, porte B ouverte ; cases 6, 7, 8 cochées | #119 |
| 18.10 | Commentaire : porte B refusée (D17), cause et suite | #119 |
| 18.10 03:05 | Phase 5, 60 écritures (détail horodaté : `phase5/journal-github.json`) : étiquette « interface » créée ; épopée #122 et tickets #123 à #129 créés ; 41 issues fermées comme caduques avec raison et lien (#21 #22 #23 #25 #27 #35 #36 #38 #39 #41 #43 #45 #46 #47 #49 #55 #57 #59 #60 #61 #67 #68 #70 #72 #73 #78 #79 #84 #85 #86 #87 #88 #90 #92 #94 #95 #98 #99 #101 #103 #107) ; #42 renommée et commentée ; #44 commentée (gardée) ; étiquette « interface » sur #115 et #119 ; rattachement commenté sur #115, #116, #120, #121 | #122 à #129, 41 issues |

## REPRISE APRÈS COMPACTION (19.10, ~20 h 30) : lire en premier

- **Objectif courant** : l'outil pour choisir les houblons et faire un dry hop (« Comment choisir deux
  houblons ? » ; « un outil de dry hopping, bio Transfo, levure »).
- **Décisions** :
  - **porte B fermée** (« attends encore pour la porte b ») ;
  - **baseline l8b** (disposition l8, style q2b, typographie de l'app). Les pictos passent au
    trait, sans halo ; l'α réel s'affiche par voie (D87) ; les barres de l5b remplacent les jauges ;
    plus de pictos, avec une légende derrière un « ? » discret (« Légende bis ») ;
  - **q2b** est intégré à la base v4.10 ;
  - **icônes v3 duo**, mais pictos d'arôme au trait.
- **Fait et commité** :
  - le moteur « pouvoir aromatique » (`prototypes/houblons-v4/src/engine/pouvoir.ts`,
    `data/composes-houblon.json`, `tests/pouvoir.test.ts`, 97 tests, tsc vert ; commit 4d93d0e).
    Il sépare Citra et Cascade (4MMP sur la base Hopsteiner 2024). Ses sorties sont dans
    `ecran-1/fils19-choix/donnees/` (non versionnées, à régénérer avec
    `vite-node scripts/pouvoir-cas.ts`) ;
  - l'état de l'art H (93 sources) ;
  - l'index des recherches (`docs/research/INDEX-houblon-levure.md`) ;
  - le diagnostic et l'inventaire (`fils19-choix/`) ;
  - les contrôles D84 à D87, `controle-commun.mjs` (toutes les exigences transversales) et
    `controle-contraste.mjs`.
- **Mise à jour, ~21 h** :
  - l8e et l8f sont faits, contrôlés et publiés (page des fils de fer, version 16, ancre
    t142-lot18c), commit 69a99c5. Quatre fils sont répondus et résolus. Le fil « Les bar de ce
    type… » n'est pas envoyé à Claude et reste ouvert.
  - Nouveaux contrôles :
    - D88 TRAIT (pas de halo) et D89 LEGENDE (bouton discret), dans `controle-commun` ;
    - D90 et D91 PARLANT (usage en mot, pas de bande « visée »), dans `controle-commun` ;
    - D92 PISTE (pistes de l5b sous les objectifs), joué à part.
  - Trois retours du brasseur sur l8e (SPEC-BRASSEUR, « La baseline l8 ») : les pictos d'usage ne
    sont pas parlants, la bande « visée » est inutile, la barre d'objectif doit être la piste de l5b.
- **Mise à jour, ~22 h** : tout est rendu, contrôlé par le pilote, publié et commité. Page des fils
  de fer : version 17 (l8g, l8h), 18 (lot 20, d1–d6), 19 (l5d), 20 (l5e, D31). Aucun agent en
  cours. Fils de la page : tous répondus et résolus, sauf « Les bar de ce type… », non envoyé à
  Claude. À faire valider par lui : l8 (l8g ou l8h ; trait l8e ou l8f) contre l5 (l5e ou l5d) ; les
  conventions [H] du moteur ; les icônes Barres et Radar de l5e (D31).
- **Agents (état à ~21 h, tous rendus depuis)** :
  - l7–l9 (a3f5fc091a01e0007), relancé : l8g (usage en mot entier) et l8h (pastille « amer »,
    « arôme », « mixte »), sur la base de l8e, avec les pistes de l5b et sans la bande « visée » ;
  - l5d (ad87b1e660b90482c) : l5b (« Il est très très bien celui-ci aussi ») avec tous les retours
    de la baseline (D87 à D93) ; l8g et l8h refont aussi leur fiche (D93) ;
  - d1–d3 et d4–d6 : le lot 20, mini maquettes de l'outil de dry hop
    (`ecran-1/fils20-dryhop/BRIEF-AUTEUR.md`), habillage l8b, chiffres lus dans les sorties du
    moteur, `controle-commun` + ALPHA ; prévenus de D88 à D92.
- **Prochaine action** :
  - rejouer `controle-commun.mjs`, PISTE, ALPHA et PLACE sur l8g, l8h et d1–d6 ;
  - regarder les captures ;
  - publier sur la page des fils de fer (`outils/page-nuit/ajouter-lot.mjs`, une ancre propre par
    lot, puis l'outil Artifact sur `site/index.html`, root = site, fichiers = nouvelles images) ;
  - répondre aux fils ouverts et les résoudre ;
  - committer.
- **À faire valider par lui** :
  - les conventions [H] du moteur (×10 pour « hors du style », densité des hydrocarbures,
    transfert des sesquiterpènes) ;
  - le trait des pictos, l8e ou l8f ; l'usage en mot, l8g ou l8h ;
  - le radar de Comparer, r3 ou r2 (lot 16).
- **Risques ouverts** :
  - V5.5 donne toujours le même effet aux voies (même amplitude par famille citée) ;
  - écart entre l'effet d'une voie et le profil recalculé (`apresPlage`) ;
  - mots des fiches mêlant le français et l'anglais ; « Ajouter à 10′ » figé ; Celeia sans
    fiche (tâche proposée : task_8db44248).

## ÉTAT AU 19.10, FIN DE SOIRÉE

- **BASELINE CHOISIE (19.10, 18 h 12)** : « C'est la meilleure version mais le glowing des icône de
  arôme c'est non, plutôt type Baseline 2 type fil » (sur l8b). l8b est retenu : la disposition l8,
  le style q2b et la typographie de l'app. Les pictos passent au trait : l8e (pictos de l2) ou l8f
  (v2 trait), à trancher par lui. Ensuite, porter l8b dans la base.
- **Porte B : toujours fermée.** Il l'a ouverte (« Je donne mon plein accord »), puis l'a
  refermée aussitôt : « Ah non pardon, attends encore pour la porte b ». Aucun code de l'app
  (`src/`) n'a été touché ; la note de mémoire ajoutée entre-temps a été retirée.
- **Mini maquettes de l'outil de dry hop** demandées : « Enrichit les des mini maquettes pour
  mettre en valeur tout ça ». Lot 20 (`ecran-1/fils20-dryhop/`), chiffres pris dans les tables de
  H en attendant la sortie du moteur.

- **Le vrai problème (19.10, ~19 h)** : « Comment choisir deux houblons ? La chose a été sur
  simplifier. […] citra aura un effet extrêmement differents en dry hopping que cascade alors que
  pourtant d'après Nos outils ils sont assez similaire. […] les données qui permettent à faire un
  vrai choix éclairé semble manquantes » ; « Aussi ils nous faut un outil de dry hopping, bio
  Transfo, levure, ça a été demandé, c'est toujours pas là ».
  - Diagnostic dans `ecran-1/fils19-choix/DIAGNOSTIC.md` : V5.5 donne exactement les mêmes
    agrumes à Citra et à Cascade, à dose et moment égaux. La variété n'entre que par « cité ou
    non ». Citra n'a qu'une fiche, et ni linalol ni thiols.
  - L'état de l'art est chez un agent de recherche : `recherche/H-choisir-deux-houblons.md`, avec une
    section sur l'outil de dry hop, de biotransformation et de levure.
  - Les baselines (lot 18) et le radar (lot 16) attendent : « Je vais checker ça après ».
  - Sa proposition : « peut être aussi simuler un moteur à ce niveau en prenons en compte ces
    facteurs avec des intervalles de confiance. Ça avait déjà été proposée. Mais peut être
    simplifier pour avoir une estimation de pouvoir d'arome sur les 16d ». Cela rejoint le rapport E
    (18.10), recommandations 2 et 3 : la charge par moment et la table de survie, jamais branchées.
  - Ses cas de test : « voir ce que ça change si je fais du dryhop de citra, Galaxy, idao7. Et
    combinaison de 3j dryhopping Citra, 7j dry hopping Galaxy ; 3j citra - 5j idao7 […] C'est
    extrêmement complexe à voir ce qui est vraiment faisable ». Ajoutés à la recherche H
    (section 7 : ce qui est prévisible, temps de contact, ajouts successifs, pouvoir aromatique,
    table faisable / pas faisable).
  - « D'autres choses à chercher pour mettre en place tout ça ? » La recherche H reçoit une
    section 8 : seuils de perception (OAV), taux de transfert par moment et par forme, matrice stout
    16D (BJCP, masquage par le torréfié), les quatre levures du dépôt (β-lyase, IRC7, glucosidase,
    POF, hop creep), vieillissement et HSI. Plus tard : prix et pertes par absorption (€ par
    pouvoir aromatique), disponibilité en Suisse. Ce qui ne peut venir que de lui : les certificats
    de ses lots, ses dégustations (#139), ses réglages de dry hop.
  - L'app réelle a déjà `src/domain/hopDecision/` (environ 14 000 lignes : `biotransformation.ts`,
    la charge introduite dans `calculations.ts`, `coldContactEvidence.ts`, `coldIbuContact.ts`,
    `measurements.ts`…). L'inventaire est en cours chez un agent de lecture. Le moteur « pouvoir
    aromatique » sera conçu une fois cet inventaire et l'état de l'art rentrés : reprendre plutôt
    qu'empiler.

- **Base v4.9** : commit 4e3bae7 et page à jour v5 (fiche g1, roue et cases au nombre de fiches,
  D72, D73, D25 bis, D33 ter, D40 ter). Moteur : `familyWords`, commit 9c4cb3c.
- **Lot 14, Suggestions en Barres** (`ecran-1/fils14-suggestions-barres/`, s1 à s9, trois auteurs) :
  - sa demande : « Tu t'es trop limité, m'eme au niveau des couleurs et tout... » ;
  - contrôle D74 `controle-couleurs.mjs` (3 teintes franches hors alerte au premier écran ; la base
    et le lot 6 → 0) ;
  - `FIL6 OK 9/9`, mots ≤ 70, `COULEURS OK 9/9`, `AU-STYLE OK` ;
  - planche sur la page des fils de fer, version 8 (section #138, à la place du lot 6) ; commentaire
    #138 (6267823868).
- **Au style partout** (#141) : « le "au style" donc normaliser au style les données semble être que
  ici ? C'est pas ce que j'avais demandé... » ; « commen ça a pu être oublié ? ». Contrôle D75
  `controle-au-style.mjs` (lentille au style par défaut et zone du style, sur chaque écran) ; base v4.9
  → Ma bière OK, Suggestions, Comparer, fiche et substitution en échec. Réponse dans le fil de la page
  à jour. Mémoire `affinee-exigence-transversale`. Reste : mini maquettes de la fiche et de Comparer
  au style, sur la stout 16D et la lager 3B (S2).
- **Lot 15, s5 à l'épreuve et les extras** (`ecran-1/fils15-s5-complexe/`, en cours) :
  - sur le lot 14, il retient s5 (et cite s4) : « mais proablement très compliqué si plusieurs voies,
    et pour les cas complexe, pas sûr que ça aille ». Puis : « on voit pas quels sont les autre ajouts »
    et « on selectionne plusieurs houbon et ensuite on peut comparer » ;
  - les cas calculés : `prototypes/houblons-v4/scripts/cas-suggestions.ts` → `donnees/c1–c3.json`. c1
    stout à trois objectifs, c2 stout, deux objectifs dans le même sens, c3 lager 3B. Pour chaque
    voie : `tout` (toutes les familles qui bougent) et `fiches` (marqué ou cité) ;
  - les constats : sous LalBrew Diamond (sans profil V5.5), la lager n'est située sur aucune famille ;
    le même houblonnage sous US-05 l'est. Le modèle donne la même amplitude à toute famille citée : les
    voies 1 à 7 de c1 ont le même effet sur les objectifs, et seuls leurs extras les distinguent ;
  - le contrôle D76 `controle-autres-ajouts.mjs` (les extras de chaque voie visibles ; avec
    `--via-comparer`, choisir puis Comparer). Le lot 14 → 9/9 en échec. FIL6 accepte le verdict
    « inconnu » s'il est écrit ;
  - fil a9f98db9 (13 h 31) : « si je veux banir, ou ouvrir vers plusieurs voie ça semble un peu
    limité ? D'ailleur ça prends pas encore en compte bio transfo, levure. et dry hopping ». Décision
    du pilote, puisque la question auto-postée est restée sans réponse : bannir une famille **et** une
    variété (c1b : épicé et Citra). On ajoute `ensemble` (voies posées ensemble, convention des voies
    seulement si les moments diffèrent), `momentId` et `bio` (yeastSignals, jamais chiffrés). p6 est
    ajouté. Fil fleur/sapin résolu : les 12 pictos `pictos-familles.html` ;
  - **risque ouvert, moteur** : l'effet d'une voie (Motueka 10′ : floral +15,9, soit 6,5 → 22,4)
    diffère du profil recalculé de la recette après la voie (`apresPlage` : floral 14,6). Le profil
    recalculé monte aussi résineux, épicé et terreux, que les fiches de Motueka ne citent pas. Après un
    dry hop en fermentation active, le profil recalculé n'est plus situé (0–100). Le moteur le note
    (« la variation prévue s'appuie alors sur les repères centraux de l'ajout seul »), mais Ma bière
    et Suggestions peuvent montrer deux chiffres. À trancher avant la porte B ;
  - ticket #142 (à faire, `status:backlog`) : « "normaliser" l'affichage, les forme. couleur
    aromonisé ça coorectement ». Un seul jeu de couleurs et de pictos sur tous les écrans, avec un
    contrôle ;
  - les auteurs : série p (p1–p6, s5 et s4 sur c1, c1b, c2, c3) chez l'auteur de s4–s6 ; série q (q1 cocher
    puis Comparer, q2 grouper par même effet, q3 la bande de 12 cases sous chaque voie, q4 projeter
    sur toute ma bière) chez un second auteur.
- **Lot 16, le radar de Comparer** (`ecran-1/fils16-radar-comparer/`) : fil b1c676bf, « très
  compliqué à voir les différence avec les cileur sur le spider graph », « surtout genant là ».
  - Contrôle D77 `controle-radar-series.mjs` ; la base v4.9 échoue (3 surfaces, traits de 2 px).
  - Générateur : `RENDUS` dans radar.js (`actuel` par défaut, inchangé ; r1 contours, r2 un plein,
    r4 tirets), r3 dans comparer.js (un radar par houblon), choisis par `window.RENDU_RADAR`.
    Base reconstruite → LOT OK 1/1.
  - Pages : `construire.mjs` (3 et 4 houblons, Motueka en 4ᵉ) ; captures : `captures.mjs`.
  - Planche sur la page des fils de fer, version 9 : section `t136-radar` (`ajouter-lot.mjs` accepte
    `ancre`, pour ne pas remplacer le lot 10 de #136).
  - Après son choix : faire du rendu choisi le défaut, retirer les autres, relancer D77 sur la base.
- **Lot 15 livré, à choisir** : p1–p6 et q1–q4.
  - Contrôles rejoués par le pilote : FIL6 10/10, MOTS OK, COULEURS 10/10, AU-STYLE, AUTRES (D76 ;
    q1 avec `--via-comparer`).
  - Planche : page des fils de fer, version 10, section `t138-lot15` ; le lot 14 est gardé, `t138`.
  - #138 commenté (6269292178) ; fil a9f98db9 résolu.
  - Générateurs : `p1/generateur-serie-p.mjs` et `q1/generateur-serie-q.mjs`, qui lisent
    `donnees/`.
  - Remarques de l'auteur q : la liste de q1 seule ne montre pas les extras, il faut cocher ; q3 est
    la plus haute ; dans q4, au style, un même +15,9 paraît de longueur différente selon les bandes.
- **Lot 15, son choix (19.10, 14 h 34)** : **q2** (« cella là »). Ses retours, devenus contrôles :
  - p4 : « vachement bien », puis « + » vers Comparer à la place du panier, dry hop, biotransformation
    et levure visibles (D78) ; l'intensité comme dans p5 et l'usage du houblon en mini picto (D80) ;
    « c'est quoi ce double boul violette ? » (D81, sens au survol seulement) ;
  - p1 : « le "ma bière" en haut sert é rien » (D79) ;
  - q2 : « c'est quoi ces gors bloque ? » (D82, les moitiés teintées) ;
  - le picto épicé : « plutôt vanille, canelle ? » → grains de poivre ;
  - données : `tout[].crans` et `fiches[].role` (hopRole : 3 houblons attestés par un
    fournisseur, 6 déduits par la règle rôle-α, à valider).
  - **q2b livré, à valider**. Les contrôles ont été rejoués par le pilote : FIL6, MOTS (54),
    COULEURS, AU-STYLE (etat-b et comparer), AUTRES, D78 à D82, tout OK.
    - Dans la liste, l'intensité est une jauge de traits ; le chiffre exact n'est écrit que dans
      Comparer. C'est à juger par lui (« comme sur p5 »).
    - p4b passe tout. p1b échoue à D82, car il garde les fonds de p1.
    - Publication : page des fils de fer, version 12, section `t138-lot15b`. Les six fils traités
      sont résolus.
    - Générateurs : `q2b/generateur-q2b.mjs` et `p1/generateur-serie-p.mjs`.
  - **Ses choix (19.10, soir)** :
    - « C'est effectivement qb2 reprise le mieux » : q2b retenu, à intégrer dans la base ;
    - « je vais choisir la variante 3 même si les 3 change très, trop peu. Regarde pour faire une
      vrai baseline avec mini maquettes. Soit créatif » : v3 duo retenu, lot 18 lancé ;
    - « Un appui long montre une vrai fiche de houblons... » : D25 réparé. Il ne dit plus « OK 0/0 »
      sur un dossier non nommé pNN ; q2b et b5 échouent, la base passe. b5b reprend la vraie fiche.
  - « Applique les variante sur qb2 reprise, chacune des 11 nouvelles baseline. Tu peux avoir des
    Baseline avec des choses en plus et en mois ». Le lot 18 est recentré sur q2b (`lN/etat-b.html`
    obligatoire ; Ma bière, Comparer et fiche facultatifs), avec 11 langages. Ajoutés : l7 Néon,
    l8 Typographique, l9 Atlas, l10 En moins, l11 En plus, chez deux auteurs de plus.
    `donnees/s1.json` est ajouté (le cas de la base, même ordre de voies que le pack S1, vérifié) pour
    l'intégration de q2b dans la base, qui attend la fin de b5b.
  - **b5b livré** : la vraie fiche de la base, sortie par `b5b/extraire-fiches.mjs`, s'ouvre à
    l'appui long (FICHE OK 1/1) ; dix contrôles OK. Défauts vus sur la fiche de Nelson Sauvin, à
    corriger (#140) :
    - les mots sans famille sont en double, français et anglais (« fruité … Fruité, fruity,
      grape ») ;
    - « Ajouter à 10′ » est encore fixe, alors qu'il doit venir des voies du modèle (demande du
      19.10, toujours ouverte) ;
    - Celeia n'a pas de fiche dans le pack.
  - **Sur l8** : « Visuellement horrible, mais la manière dont sont disposés les choses j'aime
    beaucoup !! ». Décision du pilote : garder la disposition (matrice famille × voie, moments en
    titre, tri par colonne) et refaire l'habillage en trois versions, l8b (q2b et v3), l8c (Cave)
    et l8d (Tuiles), chez l'auteur de l7–l9.
  - **Lot 18 livré, à choisir** : onze baselines sur q2b. Les contrôles, rejoués par le pilote, sont
    tous OK (FIL6 11/11, MOTS, COULEURS 11/11, AU-STYLE, AUTRES, MOMENTS, MA-BIERE, USAGE-INTENSITE,
    SURVOL, BLOCS, FICHE 11/11, STANDARD ×11). Publication : page des fils de fer, version 14,
    section `t142-lot18` ; #142 commenté (6272136992). Générateurs dans chaque `lN/`.
  - **Base v4.10 livrée** : q2b intégré (suggestions.js, suggestions.css, `suggestionsQ2b` dans
    build.mjs, pictos dans page.html, `role` ajouté aux fiches par buildPack.ts). Les 17 voies sont
    celles de s1.json, dans le même ordre. Le « + » ajoute à `ETAT.comp`, et l'appui long ouvre la
    vraie fiche.
    - Contrôles, rejoués par le pilote : LOT OK 1/1, FICHE OK (etat-b et comparer), FIL6, MOTS,
      COULEURS, AU-STYLE, AUTRES, MOMENTS, MA-BIERE, USAGE-INTENSITE, SURVOL et BLOCS OK ; vitest
      78/78. `controle-suggestions` (D52) ne s'applique plus (D52 bis).
    - Page à jour republiée (MoohEoyjPGAWqpMQZZCq5T, version 6), et `test.mjs` sans erreur.
    - Fragile :
      - le remplissage de l'écran B est à 0,81 ;
      - la liste défile sous un en-tête fixe ;
      - la fiche n'affiche pas encore l'usage (la vue fiche ne lit pas `role`) ;
      - les mots des fiches mêlent le français et l'anglais.
  - **Intégration de q2b dans la base, v4.10** : `base/BRIEF-INTEGRATION-Q2B.md`, chez un
    auteur dédié. Il possède suggestions.js et .css, l'acheminement dans build.mjs et buildPack.ts
    (S1 enrichi).
  - **Lot 18, baseline** (`ecran-1/fils18-baseline/`, `BRIEF-AUTEUR.md`) : l1 Cave (l'identité
    sombre réelle), l2 Carnet, l3 Étiquette, l4 Instrument, l5 Tuiles, l6 Jour de brassage, chez
    trois auteurs. Chacun fait quatre écrans (Ma bière, Suggestions q2b, Comparer, fiche) ;
    l'appui long y ouvre la vraie fiche (D25).
  - **Lot 17 livré** : v1–v3 (STANDARD et SURVOL OK, pire contraste 4,64:1) et b1–b6
    (dix contrôles de q2b OK), rejoués par le pilote. Publication : page des fils de fer, version
    13, section `t142` ; #142 commenté (6270949338). Générateurs : `b1/generateur-boosters.mjs`.
    Limites : en v1, « cité » (40 %) efface les familles claires ; en v2 et v3, le trait des
    familles claires reste sous 3:1 ; `controle-standard` ne lit pas les couleurs dans un `<use>`.
  - **Lot 17 (#142)** (`ecran-1/fils17-standard/`) : « regarde aussi pour la
    standardisation, UX booster, petit icone et autres ». Inventaire `inventaire-forme.mjs` ;
    contrôle D83 `controle-standard.mjs` (la base et q2b échouent) ; `jetons-familles.json` (base,
    texte ≥ 4,6:1 sur blanc et sur le fond, fond). Auteurs : v1–v3 (jeu commun : plein, trait,
    duo ; lucide-react pour les actions), chez un nouvel auteur ; b1–b6 (boosters L5, A2, C6, H4,
    X3, J6 sur q2b), chez l'auteur q. Briefs : `BRIEF-STANDARD.md`, `BRIEF-BOOSTERS.md`.
  - **Prochaine action** : sur son OK, intégrer q2b dans la base (Suggestions, `suggestions.js`),
    avec ses contrôles (D76, D78–D82 sur la base).
- **Lot 15, série p** : remarques de son auteur :
  - le résineux de c1 : ma bière est au repère du modèle (6,5), ce qui donnerait « atteint » sans
    rien faire ; il a gardé la dégustation de S1 (66–100). À trancher dans le moteur ;
  - `mots-premier-ecran.mjs` compte le texte des plis fermés ;
  - générateur `p1/generateur-serie-p.mjs`.
  La série q est en cours.
- **En attente de lui** : son choix dans le lot 14 ; le fil « refaire des mini maquette pour cette
  partie » (de0e8403), pris pour Suggestions ; les commentaires de la planche (« aucun actionnable ? »,
  « très dur à comprendre ces graph », la vignette qui ouvre toute la page, « plus tard clicker ici
  renvoie vers la page ») ; le bouton « Ajouter à 10′ » à tirer des voies du modèle.

## ÉTAT AU 19.10, SOIR (puis la fin d'après-midi ci-dessous)

- **Son retour** (deux captures au téléphone, page partagée, base v4.7) : « On arrive pas à aller de
  l'extrême haut, à l'extrême bas ». Mesuré : la page jouable y fait environ 390 × 620 ; Nugget glissé
  de 60′ au bas de l'écran s'arrêtait à J+3 (le rail sortait de 180 px sous l'écran) ; à 844 px, J+8.
  Cause : chaque rail refait (D67) prenait la loupe la plus grande pour son segment, sans garder la
  place des segments suivants.
- **Contrôle D69** (`controle-rail.mjs`) : cas-k3, écrans de 620 et 844, page en haut et défilée ; vers
  le bas, J+14 de la post-fermentation ; vers le haut, la durée d'ébullition ; le bout visé dans
  l'écran. Témoin : la v4.7 (`scratchpad/temoin-v47`) → 9 échecs.
- **Essai écarté** : un rail uniforme sans rail refait (6 px par graduation à 620) passait D69 mais
  cassait 8 contrôles de précision (D27, D34, D36, D44, D56, D67, D68).
- **Base v4.8** : `echelleGeste` choisit à la prise l'échelle du geste (6 à 11,5 px) avec laquelle le
  doigt va jusqu'aux deux bouts dans l'écran (`traversee`) ; chaque rail refait prend la loupe la plus
  grande qui laisse cette traversée ; le plateau passe d'un segment à l'autre (il ne se garde qu'aux
  deux bouts du rail, D45) ; à la prise, le bas reste dans le repos + 120 px (D55). Mesuré : à 620,
  J+14 de la post-fermentation tenu à 573 px (bas du rail 593) ; retour à 60′ ; tête à 40 px au plus.
  Captures `gestes-base.mjs` : 8 cas, dont `nugget-p14-620` et `citra-60-620`.
- **Limite dite** : un houblon pris tout près du bord de l'écran ne laisse pas la place au bout opposé
  (le rail en sort de ce côté) : défiler un peu avant de le prendre.
- **Preuves** : `RAIL OK 1/1`, `LOT OK 1/1` (avec `--comparer`), `SPEC OK`. Page à jour republiée :
  https://claude.ai/artifact/MoohEoyjPGAWqpMQZZCq5T, « Houblons, base v4.8 », version 3 (puce Rail :
  « De 60′ à J+14 après fermentation », « De J+3 à 60′ »). Commentaire #134 (6264437187).
- **Sa demande suivante** (19.10, soir, capture : les petits carrés de profil des ajouts proposés
  entourés) : refaire un lot de descriptions de houblons, et montrer au long appui sur un houblon à
  quoi correspondent ces valeurs ; fils de fer d'abord, dans la file des tickets.
- **Fait** : ticket #140 ; lot 12 `ecran-1/fils12-descriptions/` (brief, d1 à d6, chacune `vue.html`
  et `appui.html`, trois auteurs) ; contrôle `tournoi/outils/controle-appui.mjs` (A1 à A5 ; témoin :
  la base v4.8 → 8 échecs) ; `APPUI OK 6/6`, `FIL6 OK 6/6`, mots ≤ 90. Planches publiées en tête de
  la page des fils de fer https://claude.ai/artifact/2VTRQP7nLXhX5GqDaAGAyU (version 4) par
  `v4/outils/page-nuit/ajouter-lot.mjs` (repart de la page publiée, lue avec l'outil Artifact).
  Commentaire #140 (6264842384). Trouvé : « mojito » n'est dans aucune liste de termes du moteur.
- **Page à jour, version 4** : la page jouable en pleine largeur (fils « 1/4 mais full ? »,
  « 2/4 mais full ? », résolus).
- **Lot 12 refusé** : « Non c'est très mauvais. Tu as pas du tout bien compris le besoin, c'est entre la
  version actuelle qui est déjà vraiment plutôt bien et une de ces versions ». Contrôle D70
  (`controle-appui.mjs` A6 à A8 : la carte de la base au repos ; au long appui 30 mots et 160 px au
  plus, collé à la carte, titre et champ libres) ; témoin : lot 12 → 18 échecs. Mémoire
  `affinee-partir-de-l-actuel`.
- **Lot 12b** `ecran-1/fils12b-mi-chemin/` (b1 à b6, une idée du lot 12 en léger chacune, mêmes
  auteurs) : `APPUI OK 6/6`, `FIL6 OK 6/6`, mots ≤ 90. Section #140 remplacée sur la page des fils de
  fer (version 5 ; images du lot 12 retirées). Commentaire #140 (6265519941).
- **Lot 12b refusé aussi** : « Non... Un appuie long ouvre sa fiche. Comme avant, saufe que sa fiche est
  plus fourni avec les labels.. revoit et challenge de point avant de faire quoi que ce soit ». L'appui
  long ouvrait déjà la fiche (fiche.js) : les lots 12 et 12b l'avaient ignoré. Analyse rendue (quatre
  problèmes de la fiche et de la carte, P1 à P4). Sa réponse : « Non, il faut changer la carte et tout.
  Mais c'est déjà pas mal comme visuel de base. Mais il y a quelques problèmes dessus... Donc fait moi
  des mini maquettes de ça ».
- **Lot 13** `ecran-1/fils13-carte-fiche/` (g1 à g6, carte et fiche ensemble, en partant de la base) ;
  contrôle D71 `tournoi/outils/controle-carte-fiche.mjs` F1 à F6 (témoin `--base` → 23 échecs).
  `CARTE-FICHE OK 6/6`, `FIL6 OK 6/6`, mots ≤ 90. Planches (fiche Nugget, fiche Citra cryo, cartes) à la
  place du lot 12b sur la page des fils de fer, version 6 (`v4/outils/page-nuit/lot13.json`).
  Commentaire #140 (6266285105). Les auteurs ont écrit leurs générateurs dans le scratchpad (hors dépôt).
- **Ses retours sur le lot 13** :
  - « 1/4, 2/4 mais même valeur ??? » (sur g1, Épicé et Tropicaux au même rayon) : contrôle F7 / D72 (la
    roue suit le nombre écrit ; échec sur la base v4.8, g1, g3, g4, g6) ;
  - puis « Inutile mais la v1 est la meilleure » (table des IBU par moment de g1 barrée). g1 corrigée
    par son auteur (roue et cases au nombre de fiches, sans la table) et publiée seule (page des fils de
    fer, version 7) ; g3, g4, g6 arrêtées.
- **Moteur** (commit 9c4cb3c) : `familyWords` (hops.ts) donne les mots des fiches qui font chaque famille
  (même découpe que firstItem, même rattachement que les niveaux), dans `pack-fiches.json`
  (`aromes[].mots`, `aromes[].premier`, `motsSansFamille`) ; test sur tout le catalogue ; 78 tests verts.
- **Base v4.9** : fiche g1 (`blocLabels`, `noteAlpha`, plus de table des moments), roue et cases au
  nombre de fiches (D72), axes colorés. `CARTE-FICHE OK` en `--base` (la base v4.8 y échouait 33 fois).
  D25 (100 mots visibles dans la fiche) tenu en écrivant « 2/4 » et « sans famille : … » (97 mots).

## ÉTAT AU 19.10, FIN D'APRÈS-MIDI (avant la reprise du matin ci-dessous)

- **Fait** : les 6 étapes de la reprise du matin, plus ses deux retours sur le rail (D67, D68).
  **Base v4.7** : `ecran-1/base/consolide`, 15 pages (dont `substitution.html`) ; `LOT OK 1/1` avec
  la commande ci-dessous **plus `--comparer`** ; `SPEC OK`. Commits locaux 1303ac6 (v4.5), a1ee3e2
  (v4.6), f14a788 (v4.7), 0a85159 (planche sans cache). Rien de poussé.
- **Page à jour, la seule à publier** : https://claude.ai/artifact/MoohEoyjPGAWqpMQZZCq5T
  (« Houblons, base v4.7 », version 2). Générateur `v4/outils/page-partagee/build.mjs
  --src=<ecran-1>/base:consolide --version=v4.x` → `a-jour/` ; `test.mjs` ; publier
  `a-jour/index.html` (même chemin = même adresse), fichiers en liste `{path}` avec `root` `a-jour`.
  Captures du geste : `tournoi/outils/gestes-base.mjs consolide` (6 cas, dont `nugget-wp75`).
- **Pages à supprimer, impossible depuis une séance** : WSzBr4… (ancienne v4.6), V657sqy… (lot 4),
  FxHJbe7… (fils de fer), UrdkDumB4… (prototype v2). Le brasseur ne peut pas non plus : ne pas créer
  de nouvelles pages. Gardée : 2VTRQP7… (nuit : Barres de Suggestions à choisir).
- **Commentaires** : sur WSzBr4…, les fils 368630b0 et 664b425c ont eu leur réponse et sont fermés ;
  d9fb8227 (« On est pas à jour sur cette page, on est d'accord ? ») est resté ouvert, faute d'avoir
  été envoyé à Claude.
- **En attente de lui** : ses jugements au doigt (rail v4.7, Comparer, Suggestions, u4) ; ses choix
  ouverts : Barres de Suggestions (#138 ; lot 6 p03, p05, p11) ; #137 « le moins de grammes
  d'abord » ; #131 licences ; #139 après la porte B ; #136 mis de côté.
- **Points dits, à surveiller** : quand le doigt est bas, l'ébullition au-dessus est un trait sans
  graduations (D47) ; D61 −12 % tenu à 10′ (seuil 12 %, sans marge) ; `controle-fil6` garde
  10 points sur Comparer, en conflit avec D1, D5 et « pas de légende » (#138) ; plage de score de
  u4 = seul calcul de la page (à valider) ; le défaut de donnée Citra cryo (#131) reste.
- **Pièges de l'outillage** : Bash avale les barres obliques inverses (regex, `'\n'`) : passer par
  Edit ou un fichier écrit avec Write ; ne pas reconstruire `consolide` pendant qu'une batterie
  tourne (copie de travail : `node build.mjs --out=<scratchpad>/dev`) ; la batterie complète prend
  environ 8 min (en arrière-plan).
- **Révisions de contrôles faites à découvert** : D33 bis (`controle-palette` : les `data-couleur`
  des houblons sont un code) ; `check-spec` lit aussi les messages du brasseur de la séance
  16fc09ec (commandes en attente comprises). Nouveaux : D67, D68 (`controle-rail`).

## REPRISE — session neuve (19.10, fin de matinée) : lire en premier

Le brasseur ouvre une session neuve. Mission #119 : maquette houblons v4, hors de l'app, dans
`work/refonte-frontend/v4/ecran-1/base/` (générateur `base/generateur/`, `node build.mjs` →
`base/consolide/`, 14 pages). Branche `claude/refonte-houblons-v4`, commits locaux, rien de poussé.
Il choisit, on intègre en fidélité la seule variante choisie, on prouve (contrôles + captures
regardées), on publie sur la page partagée, on commente le ticket.

### Ses choix du 19.10 (SPEC-BRASSEUR §1, citations vérifiées par `v4/outils/check-spec.mjs`)

| Ticket | Choix | État |
|---|---|---|
| #134 rail | p02 Dock | **Dock à plateau, base v4.5** (×3 sur ±5′, crans nets) : RAIL OK, LOT OK ; à juger au doigt |
| #135 radars | m4 (Ma bière) et h4 (fiche), **sans légende écrite**, peu de texte | **fini, base v4.5** : LOT OK 1/1 |
| #136 échelles, classements | mis de côté | rien à faire |
| #137 substitution | **u4** (le jury mettait u3) | à intégrer (voir 6) |
| #138 Comparer | **p06** en barres ; **radar de p02 + intervalle de confiance** | à intégrer (voir 4) |
| #138 Suggestions | radar **p10, p5, p3 → « mais radar beaucoup plus grand »** | à intégrer (voir 5) |
| #139 grille | m4 en est la saisie ; le code de l'app manque « non goûté » (commentaire du ticket) | après la porte B |

### Fait le 19.10, midi (session neuve) : base v4.5, étapes 1 à 3

- **Rail (1)** : Dock à plateau codé dans `etape-consolide.js` (`forme`, `Mpl`, `centre`, `cran`,
  `LOUPE` gros 3, plateau 1, rampe 2, marge 120, max focus 11,5).
  - Écart à la piste : `cran` passe d'un cran net (la graduation la plus proche du doigt). Le
    passage doux (pente 2) faisait couler le rail à 4 fois la vitesse du doigt sous un ×3 : le doigt
    du contrôle ratait 35′ (D61) et Motueka bondissait de 27 px (D61 bis). Le max focus 11,5 borne
    le cran à 23 px (D61 bis : 24).
  - `centre` garde le plateau dans le segment (D45 échouait à 60′ : 9 à 28 px).
  - Sonde : 26 px par 5′ sous le doigt sur `index` (9 au loin), 35 sur `cas-k3` (12) ; D61 −12 %
    tenu à 10′ (seuil 12 % : sans marge). Le rail de base d'`index` reste à 8,7 px : la marge de 120
    est celle de D55 (ajouts proposés descendus de 120 px au plus).
  - Captures `base/captures/consolide-*-pendant.png` regardées : minutes écrites autour du doigt.
- **m4 et h4 (3)** : grille à quatre pastilles, mots en tête (95 → 48 mots, un écran) ; comptes et
  levure cachés en Radar (`rangee[hidden]` ne cachait rien : `.rangee{display:flex}`) ; `.f-dem`
  et `.deg-nom` alignés sur l'échelle 12 / 14 / 19.
- **Page partagée (2)** : générateur `v4/outils/page-partagee/build.mjs` réécrit pour la seule
  base (puces par écran, 5 captures du geste, sans notes) ; `test.mjs` joué ; publiée en version 10
  au même lien, titre « Houblons, base v4.5 », 36 fichiers de p02, p03 et p08 en null.
- Preuves : `LOT OK 1/1`, `SPEC OK` (162/162), `RAIL OK`. Commentaires #134 et #135.

### Fait le 19.10, début d'après-midi : base v4.6 (page partagée version 11)

- **Rail, D67** (sa capture au téléphone, Nugget glissé au whirlpool : « L'échelle ne s'adapte pas ne
  de focus, homme pas là où je suis… ») : `refaire` dans `ouvrirLoupe` rappelle `disposerDock`
  (mode compact) quand le doigt change de segment ; animé en 170 ms. Mesuré : au whirlpool 24 px par
  tranche sous le doigt, ébullition entière 14 px ; retour à 30′ normal. Contrôle D67 (témoin : v10
  → 2 px contre 12,9). Reste visible : la tête du rail descend pendant le geste (vide d'environ 130 px
  sous la barre d'IBU), à juger par lui.
- **Comparer (4)** : `comparer.js`, `comparer.css` ; p06 en Barres (bandes, matrice, barres-plages),
  p02 en Radar avec l'intervalle (noyau = toutes les fiches, deux au moins ; bande pâle = certaines) ;
  fiche de cas Nugget, East Kent, Fuggle (`CAS_COMPARER`). COMPARER OK. Mots 79 et 77 : l'α est sorti
  des bandes (rangée α), la plage d'IBU n'est plus écrite (dessinée), les noms quittent la matrice.
  `controle-fil6` : 10 points restants, en conflit avec D1, D5 et « pas de légende » (dits dans #138).
- **D33 bis** : `controle-palette` exclut les couleurs de houblon déclarées (`data-couleur`) ; témoin
  `scratchpad/temoin-palette` → échec.
- **Suggestions en Radar (5)** : `suggestions.js`, `suggestions.css` ; p10 (réponse par objectif,
  voies en lignes d'action), radar `grand` (~340 px) ; verdict honnête : Floral « Approche 6 → 22 »
  (visée 25), Résineux « Aucune voie houblon +6,1 → +5,8 T » ; données `tol`, `dirPack`, `ea`…
- `check-spec` lit aussi les paroles de la séance 16fc09ec (messages du brasseur seulement, commandes
  en attente comprises) : 163/163.
- Preuves : `LOT OK 1/1` avec `--comparer`, `RAIL OK`, `SPEC OK`, captures regardées. Commentaires
  #134, #138.
### Fait le 19.10, après-midi : base v4.7, page neuve

- **Page à jour, neuve** (sa demande : « Créé une nouvelle page avec les artefacts up to date
  alors ») : **https://claude.ai/artifact/MoohEoyjPGAWqpMQZZCq5T**, « Houblons, base v4.7 ». Le
  générateur écrit dans `v4/outils/page-partagee/a-jour/` ; publier `a-jour/index.html` (même chemin
  = même adresse). L'ancienne page WSzBr4… (v4.6, 11 versions) n'est plus mise à jour.
- **Suppressions demandées, impossibles d'ici** (l'outil exige une confirmation que la séance ne
  reçoit pas ; lui dit ne pas pouvoir supprimer non plus) : WSzBr4fBJerouWVtWqFiMJ (v4.6),
  V657sqy2X8DoCkxW7r8ttV (lot 4), FxHJbe7oaam8TeYTvvbxBW (fils de fer), UrdkDumB4m95s1iHr4ye27
  (prototype v2). Gardée : 2VTRQP7nLXhX5GqDaAGAyU (nuit ; Barres de Suggestions à choisir).
- **Rail, D68** (« Toujours un petit soucis... », Nugget à J+2, tête du rail descendue de 215 px) :
  en mode compact, la place au-dessus du doigt va aux segments du dessus (jamais plus grands que le
  segment tenu), le reste aux écarts de structure ; tête à 112 px (108 au repos). Contrôle D68
  (témoin v4.6 → 129 et 215 px).
- **u4 (6)** : `subst.js`, `subst.css` ; vue `substitution` depuis le repli « Substituts » de la
  fiche ; réponse écrite, 8 candidats du pack en points ou plages hachurées (pire cas), marquer,
  à IBU égal (dose, α en plage, rôle, arômes en couleur), « Face à face » → Comparer.
  `ficheCatalogue` (proto-data) pour Magnat, Yeoman, Altus… ; `data-couleur` déclarées (D33 bis).
  Parcours joué sans erreur. La plage de score est le seul calcul de la page (à valider).
- Preuves : `LOT OK 1/1` avec `--comparer` (15 pages), `RAIL OK`, `SPEC OK` (D67, D68 cités),
  captures regardées. Commentaires #134, #137, #119.

### Prochaine action

- Attendre ses jugements au doigt (rail v4.7, Comparer, Suggestions, u4).
- Ses choix encore ouverts : Barres de Suggestions (#138 ; lot 6 p03, p05, p11 sur la page de la
  nuit) ; #137 « le moins de grammes d'abord » ; #131 licences ; #139 après la porte B.
- Garde-fous inchangés : pas de push, pas de code de l'app avant la porte B.

### À faire, dans l'ordre

1. **Rail : « L'échelle ne s'adapte toujours pas à l'endroit où on est ??? »** (19.10, sur la
   version 9 de la page partagée).
   - Mesuré (`v4/tournoi/outils/sonde-dock.mjs <dossier consolide>`) : sous le doigt 19–20 px par
     5′, au loin 8–13 px. Le grossissement ne se voit pas : le rail d'ébullition de `index` ne fait
     que ~145 px.
   - Les contrôles qui bornent le Dock :
     - D45 : les 5 graduations voisines du doigt doivent être régulières (écart-type / moyenne ≤ 0,25) ;
     - D61 : hauteur = temps, à 12 % de la descente près ;
     - D34 : chaque 5′ doit être atteignable ;
     - D55 : vide ≤ 80 px, ajouts proposés qui descendent de 120 px au plus.
   - Un Dock en pointe plus fort (×3 à ×4) échoue à D45 et D34. Dans un Dock sans état, la précision
     du doigt est celle du rail de base ; grossir à longueur fixe resserre ce rail.
   - **Piste retenue, non codée : un Dock à plateau.**
     - Grossissement constant ×3 sur ±5′ autour du doigt (D45 régulier), rampe linéaire sur 2
       graduations de chaque côté, le reste à l'échelle du repos (e ≈ 12 px par 5′ : la précision
       du doigt reste).
     - Le rail s'allonge pendant le geste (LOUPE.marge 80 → ~120 px).
     - Surplus ≈ (G−1)(2P+Rampe)·e = 2·4·12 ≈ 96 px. D61 estimé ≈ 10 % au pire : à mesurer.
   - Code à changer dans `base/generateur/etape-consolide.js` :
     - `Stente` et `Yd` → intégrale M(x) du plateau et de la rampe : x si x ≤ P ;
       P + (x−P) − (x−P)²/(2·Rampe) jusqu'à P+Rampe ; puis P + Rampe/2 ;
     - `grossi` → 1 + KG·m(z−c) ;
     - `tient` → surplus `KG*(2P+Rampe)` au lieu de `KG*G.W` ;
     - `LOUPE` : gros 3, plateau 1 graduation, rampe 2, marge ~120.
   - Puis :
     - `controle-rail.mjs work/refonte-frontend/v4/ecran-1/base consolide` ;
     - la sonde ;
     - les captures du geste (`v4/tournoi/outils/gestes-base.mjs consolide` → `base/captures/`, 5 cas) ;
     - **regarder** : le zoom doit se voir à l'œil, les minutes écrites autour du doigt.
     Si un contrôle se révèle contraire à sa demande, le dire, et ne pas l'affaiblir en silence.
   - Les minutes écrites sur les graduations grossies (`texteGrad`, classe `ecrit`) sont déjà là.
2. **Page partagée : « Houblon lot 3 partage beaucoup trop de choses inutiles, supprime tout ce qui
   n'est pas à jour »** (https://claude.ai/artifact/WSzBr4fBJerouWVtWqFiMJ, version 9, titre
   « Houblons lot 3 »).
   - N'y garder que la base à jour : les 14 pages `consolide` jouables et leurs captures.
   - Retirer p02, p03 et p08 du lot 3, et toute note périmée.
   - Générateur versé : `v4/outils/page-partagee/build.mjs`, à appeler avec
     `--src=<E>/base:consolide --sans-radar` ; test : `test.mjs`.
   - Publier au même `url` (Artifact read d'abord), en passant `null` pour chaque fichier retiré
     (`files.json` de l'ancien build : `consolide/*`, `p02/*`, `p03/*`, `p08/*`, `img/*`).
   - Un titre à jour, par exemple « Houblons, base v4.4 ».
3. **m4 et h4 dans la base : codés, non committés comme finis.** Batterie : `LOT ECHEC 4`.
   - Fichiers : `radar.js` (`biere` = m4, `roue` = h4 avec flèches de ma demande, `RC` : inconnu
     dans le disque du centre pour tous les radars), `commun.js` (`grilleDegustation`, `ETAT.notes`,
     `rangee.hidden` dans la lentille radar), `fiche.js` (`.f-dem` au lieu de la légende `.f-leg`),
     `build.mjs` (`D.degustation.notes`, `D.direction`), `radar.css`, `fiche.css`.
   - Les 4 échecs :
     - `biere-radar` fait plus d'un écran à 390 (1,2) ;
     - 4 tailles de texte au lieu de 3 au plus (effet cockpit) sur `biere-radar` et sur `fiche` ;
     - 95 mots sur `biere-radar`, pour 80 au plus.
   - Piste : la grille écrit 48 mots (« pas senti, faible, moyen, marqué » × 12). Mettre les quatre
     mots une seule fois en tête de colonne, et des pastilles 0–3 par rangée.
   - Pour tenir dans un écran : des rangées de 26 px, ou la grille sur deux colonnes.
   - Les tailles de texte : 12/13 dans la grille, 12 dans le radar, `.f-dem` 13 → s'aligner sur
     l'échelle de la page.
   - Captures `base/captures/v44-biere-radar-390.png` et `v44-fiche-390.png` regardées : le fond
     est bon (résineux marqué en orangé, 11 familles « ? » hachurées au centre ; Nugget : flèche −
     résineux, + floral, « + Floral marqué 2/4 · − Résineux marqué 2/4 »).
4. **Comparer (lot 6)** : barres = `ecran-1/fils6-comparer/p06` (« tout l'arôme d'un seul regard » ;
   défaut du jury : N/M en points de 5 px, libellés verticaux).
   - Radar : la composition de `fils6-comparer/p02/comparer-radar.html`, dessinée avec le radar D3
     commun (`RADAR.houblons`), **plus un intervalle de confiance par famille**.
   - L'intervalle : la plage entre les fiches (N/M, niveau par source). À expliciter, sans chiffre
     inventé ; les sources sont dans `pack-fiches.json` (`aromes[].sources`, `of`).
   - Sans légende écrite si possible (son retour sur m4 et h4) ; la couleur de chaque houblon peut
     se lire sur les puces de Comparer.
5. **Suggestions, radar** : les variantes `fils6-suggestions/p10`, `p05` et `p03`, dans cet ordre de
   sa phrase, « mais radar beaucoup plus grand ».
   - Les pages Barres de Suggestions ne sont pas encore choisies (le jury : p03, p05, p11 ★★★).
6. **Substitution u4** (`ecran-1/fils11-substitution/u4/vue.html`) : le score en plage quand une
   composante manque, puis le face-à-face.
   - Moteur `prototypes/houblons-v4/src/engine/substitution.ts`, pack `substitutsCalcules`.
   - À brancher depuis la fiche (bouton « Substituts › ») en fidélité.
   - Question ouverte dans #137 : à l'amertume, le moins de grammes d'abord entre scores proches.

### Livraison (sa consigne du 19.10)

« Dit lui de me partager les pages en artefacts des que c'est clean et réglé ».
- Dès qu'une étape est propre (LOT OK, captures regardées), la publier en artefact et lui donner le
  lien, sans attendre la fin de la liste.
- Le rail, m4 et h4, Comparer, Suggestions et u4 vont sur la page partagée à jour, au même lien.
- Un écran neuf peut avoir sa propre page s'il la rend plus claire.

### Autres points à transmettre

- **Le changement `RC`** (l'inconnu dans le disque du centre) vaut pour tous les radars : vérifier
  aussi Suggestions et Comparer à l'œil.
- **Saut à l'ouverture du geste**, hérité de la base : au toucher, les cartes se replient et
  Motueka (10′) descend une fois de 73 à 95 px. Le jury l'a relevé, il ne l'a pas encore vu
  nommé : le lui montrer, ou l'adoucir.
- **Si le Dock à plateau échoue**, les autres loupes sont prêtes sur la base v4.3, dans
  `ecran-1/candidats-v44/` (sources versionnées, `preparer.mjs`) : p01 bulle, p01-haut (bulle
  au-dessus du doigt), p03 règle. Les lui proposer seulement avec les mesures.
- **Questions ouvertes de son côté** :
  - #137 : à l'amertume, le moins de grammes d'abord entre scores proches ?
  - #131 : les licences des sources (BarthHaas, Hopsteiner, Yakima Chief, Beer Maverick) ;
  - #138 : les barres de Suggestions ne sont pas choisies ;
  - #139 : la grille dans l'app, après la porte B.
- **Défaut de donnée connu (#131)** : la fiche Citra cryo porte les plages de Citra en pellets
  (α 10–15). Le dire sur tout écran qui montre ces plages ; ne pas le corriger sans source.
- **Page de la nuit** (https://claude.ai/artifact/2VTRQP7nLXhX5GqDaAGAyU) : les lots en fil de fer.
  Son générateur est resté dans le scratchpad de l'ancienne session : la page reste, mais ne sera
  plus reconstruite.
- **Mémoire** : `affinee-geste-se-voit` (une loupe doit se voir, ×3 au moins) et
  `affinee-page-partagee-a-jour` (seulement l'état à jour, pas de légende sur la version finale).

### Garde-fous et méthode

- **Contrôle de la base** :
  `node work/refonte-frontend/v4/tournoi/outils/controle-lot.mjs work/refonte-frontend/v4/ecran-1/base --mots=80 --fill=0.8 --boosters=4 --recette --rail --detail --palette --radar --fiche --coherence --objets`
  doit donner `LOT OK 1/1`.
- **Rail seul** : `controle-rail.mjs <dossier> consolide`. **Spec** : `check-spec.mjs` doit donner
  `SPEC OK`.
- **Captures** : `capture-page.mjs <page> <png> <hauteur>`, à 390 px. Une capture non regardée ne
  valide rien.
- **Méthode** : `docs/qualite/methode-conception-frontend.md` ; `v4/DEFAUTS-RECURRENTS.md`, où chaque
  plainte devient un contrôle avec un témoin négatif ; `v4/SPEC-BRASSEUR.md`.
- **Ses habitudes** : il choisit souvent autrement que le jury (les étoiles filtrent, il décide). Il
  veut peu de texte et pas de légende, et il juge au doigt sur son téléphone, sur la page partagée.
- **Règles** :
  - pas de push ;
  - jamais `.codex/hooks.json`, `source4-portable-bundle-manifest-01.json` ni `functions/.env` ;
  - texte avec barres obliques inverses ou accents graves : Write/Edit, pas Bash ;
  - committer avec `-- chemins` et la ligne Co-Authored-By ;
  - pas de code de l'app avant la porte B ;
  - pas d'écriture sur les données réelles.
- **Pages** :
  - page de la nuit : https://claude.ai/artifact/2VTRQP7nLXhX5GqDaAGAyU (version 3) ;
  - tickets #131, #135 à #139 ouverts, #134 fermé (à rouvrir si le Dock à plateau change le rail).

## 19.10, matin — ses choix arrivent ; base v4.4 (loupe p02)

Ses choix (SPEC-BRASSEUR §1) :
- rail p02 Dock (#134) ;
- radars m4 et h4, sans légende écrite et sans surcharge de texte (#135) ;
- #136 mis de côté ;
- substitution u4 (#137) ;
- Comparer : p06 en barres, le radar de p02 avec un intervalle de confiance (#138).

Suggestions (#138) et la grille (#139) restent à choisir.

- **Fait : base v4.4 = loupe p02** (`base/generateur/etape-consolide.js` et `.css`), finie une fois.
  - Le Dock écrit ses minutes sur les graduations grossies (défaut du jury : la minute n'était
    écrite que dans la pastille).
  - Réglage gardé : ×2,5 sur ±20′. Essais ×3/±15′, ×3,5/±15′ et ×4/±10′ : tous échouent à D45 et
    D34. Dans un Dock sans état, la précision du doigt est celle du rail de base ; grossir plus
    resserre ce rail. Sonde : `scratchpad/loupe-v44/sonde-dock.mjs`.
  - Mesures, réglage gardé : D61 de −8 à +8 % ; 19–20 px par 5′ sous le doigt, 8–13 au loin.
  - `controle-lot.mjs … base --recette --rail --detail --palette --radar --fiche --coherence
    --objets` → LOT OK 1/1.
  - Captures de 5 cas regardées (`base/captures/consolide-*-pendant.png`).
  - Page partagée en version 9.
- **Suite, dans l'ordre** :
  1. radars m4 (Ma bière) et h4 (fiche) dans la base, sans légende (D65 révisé : l'inconnu dit par
     « ? », les hachures et la bulle au toucher) ;
  2. Comparer p06 + radar p02 avec intervalle ;
  3. substitution u4 (nouvel écran).

## Matin du 19.10, suite — jurys rentrés, loupes prêtes, tout posté : à lui de choisir

Rien d'intégré (D50). Aucun agent en vol. Tout est commenté dans les tickets et sur la page de
la nuit, version 3 : https://claude.ai/artifact/2VTRQP7nLXhX5GqDaAGAyU (section #131 ajoutée).

- **Jurys indicatifs** (`ecran-1/JURY-NUIT-A.md`, `-B.md`, `-C.md`), postés en commentaire :
  - #134 : p01 bulle ★★★, p03 ★★, p02 ★, p04 ★ ;
  - #135 : m4 ★★★, h3 et h4 ★★★, aucune Suggestions à ★★★ ;
  - #136 : r1 et c1 ★★★ ;
  - #137 : u3 ★★★ ;
  - #138 : Comparer p05 et p09 ★★★ ; Suggestions p03, p05 et p11 ★★★.
- **#139** : le formulaire de note du journal de références (`src/ui/hopV55/ReferencePanel.tsx`)
  est inachevé récupérable. Il lui manque « non goûté » ≠ « pas senti », un identifiant de
  dégustation, la saisie en une fois et les 12 familles. `ObservationStateEditor` ne sert pas :
  il ne saisit pas de note. Lignes contrôlées.
- **Corrections des fils de fer** (fichiers locaux, ignorés par git par règle) :
  - m4 : « pas goûté » dans le disque du centre (`RC = r(MIN/2)`), plus sur l'anneau 0 ;
  - r2 : « mon lot 114 » avant « fiches 46–69 » ;
  - Suggestions p03 : « +1,8 IBU ».
  Toutes FIL6 OK, captures regardées.
- **Moteur de substitution** : la raison écrit l'α qui fait la dose, « α 9,6 % (lot) contre
  13 % (lot) » avec 62 g. Nouveau test, vérifié en échec sur l'ancien texte ; 77 tests verts.
  Dans le pack, seules 192 raisons changent ; `pack-mini-protos.json` est identique.
  Question posée dans #137 : à l'amertume, le moins de grammes d'abord entre scores proches ?
- **Loupe (#134), prête sans intégration** : `ecran-1/candidats-v44/` = base v4.3 + loupe.
  - Sources versionnées dans `sources/<id>/` ; `preparer.mjs` reconstruit à l'octet près.
  - Candidats : p01, p02, p03, plus `version-p01-haut` (bulle au-dessus du doigt, ±10′).
  - `controle-rail` : RAIL OK 4/4. Captures des trois cas dans `candidats-v44/captures/`.
  - Intégrer le choix = copier `sources/<id>/*` dans `base/generateur/`, `node build.mjs`, puis
    la batterie complète (base v4.4).
- **#131** : `v4/sources-houblons/RAPPORT-SOURCES.md` (script
  `prototypes/houblons-v4/scripts/rapport-sources.mjs`) : 146 mesures à source unique sur 320,
  dont 134 Beer Maverick seule ; 129 absentes. `SOURCES.md` couvre 23 sources, avec licence lue.
  BarthHaas (Ariana) et USDA (Cascade) vérifiés par le pilote.
  Défaut trouvé : la fiche Citra cryo porte les plages de Citra en pellets.
- **Prochaine action** : attendre ses choix (#134 loupe, #135, #136, #137 écran et règle, #138,
  #139, #131 licences). Ensuite, intégrer en fidélité la seule variante choisie.

## Reprise après compaction (19.10, matin) — suite autonome, rien à refaire

Le brasseur : « Je vais compacter ton contexte, continue sans mon intervention ». Rien ne
s'intègre sans son choix (D50) ; on prépare ses choix.

- **Fait depuis l'état du matin** :
  - `controle-fil6.mjs` vérifie aussi D39 (aucune série en tirets) et D40 bis (aucune série
    proche de l'orangé d'alerte) ;
  - h2 corrigée (Hopsteiner en gris foncé), lot 9 FIL6 OK 12/12 ;
  - les radars du lot 6 échouent sur D65 et D66, mais ils seront remplacés par le radar D3 de
    la base à l'intégration : ne pas les corriger, le dire dans #138.
- **En vol, ne pas relancer** :
  - correction u4 (Nugget en tirets, D39) : `a8032ac75b058c97d` ;
  - jury indicatif A (lots 8 et 11) `aed2293a19afa8bb7` → `ecran-1/JURY-NUIT-A.md` ;
  - jury B (lots 9 et 10) `aab19b156f1852e8e` → `JURY-NUIT-B.md` ;
  - jury C (lot 6) `af2122ae766757724` → `JURY-NUIT-C.md` ;
  - #139, éditeur d'observations de l'app classé (fini / récupérable / inutilisable), lecture
    seule : `ae2a1cb34b4aaff00`.
- **À leur retour** :
  - u4 : FIL6 OK, puis commit de fils11-substitution ;
  - jurys : relire leurs ★ (indicatives, il a souvent choisi autrement que le pilote), les
    poster dans #134 à #138 en commentaire « indicatif », les ajouter à la page de la nuit
    (`scratchpad/nuit` : `etat.json`, `node sections.mjs`, `node build.mjs`, puis Artifact sur
    `site/index.html`, même URL) ;
  - #139 : commentaire dans le ticket avec le classement ;
  - commit des JURY-NUIT-*.md et du registre.
- **Ensuite, sans lui** (réversible, utile) :
  - préparer l'intégration de la loupe la mieux notée sur une copie, sans toucher la base ;
  - #131 : liste des sources de données houblons possibles, en note seulement, sans import.

## Matin du 19.10 — tout est rentré, à lui de choisir

Page de la nuit : https://claude.ai/artifact/2VTRQP7nLXhX5GqDaAGAyU (une section par ticket).
Page partagée : https://claude.ai/artifact/WSzBr4fBJerouWVtWqFiMJ (version 8, base v4.3).

- **#134 Rail (lot 8)** : 4 loupes jouables.
  - RAIL OK au contrôle indépendant : p01 bulle iOS, p02 Dock sans état (marge D61 serrée près des
    bouts), p03 règle à côté.
  - p04 verre aimanté : échec D45.
  - **À lui de choisir** ; puis intégration dans la base. La base garde le rail v4.2, qui échoue
    sur D63 et D64.
- **#135 Radars (lot 9)** : 12 radars FIL6 OK (D62, D65, D66).
  - Ma bière : m1 à m4 (m4 grille de dégustation).
  - Suggestions : s1 à s4.
  - Fiche : h1 à h4.
  - Base v4.3 : un seul radar D3 partout (commit 61960cf), tous les contrôles radar verts.
- **#136 Échelles (lot 10)** : e1, e2, r1, r2, c1, c2 FIL6 OK.
- **#137 Substitution** :
  - moteur `prototypes/houblons-v4/src/engine/substitution.ts`, 76 tests verts (commit 8f5b5fa),
    règle « pas de cryo pour amériser » ;
  - lot 11 : u1 à u4 FIL6 OK (commit 688e669).
  - À valider : les remplaçants, la note d'arôme à l'amertume, et l'import éventuel des scores de
    Beer Maverick (#131).
- **#138 Lot 6** : son choix attendu.
- **#139 Dégustation** : proposition (m4).
- **Nouveaux contrôles de la nuit** :
  - D63, D64, D61 bis (`controle-rail.mjs`) ;
  - D65 inconnu ≠ zéro et D66 échelle hors du dessin (`controle-fil6.mjs`, sans faux positif pour
    « pas senti ») ;
  - `--objet=libre` pour les vues nouvelles.
- **Coût mesuré** : 130 à 350 k jetons et 7 à 25 min par auteur en fil de fer ; seuls le moteur
  (2 passes) et l'intégration radar dans la base dépassent.

## Nuit du 18 au 19.10 — programme autonome (le brasseur dort, quota illimité)

Sa demande : « Plusieurs versions de radar graph. De suggestions Aussi de ma bière et de mon
houblons. Fait des fils de fere, et un ladder de comparaison et un ranking ect... » ; « Aussi des
vrais comparaison... » ; « Et un système pour la substitution de houblons. Introduir ça. » ;
« Fait des ticket de replis les pour que je puisse suivre une fois le lendemain ».

- **Tickets** : #134 rail (lot 8), #135 radars par objet (lot 9), #136 échelles, classements et
  vraies comparaisons (lot 10), #137 substitution (moteur, puis lot 11), #138 choix du lot 6,
  #139 grille de dégustation. Ils sont liés depuis #119. Chaque résultat va en commentaire dans
  son ticket : planche, verdicts de contrôle, ce qui reste à choisir.
- **En vol, à ne pas relancer** :
  - radar D3 dans toute la base : `ae8318c6ab251d5e4` ;
  - lot 8 rail : p01 `a2ff0d7c8d24aee38`, p02 `a45f53c1f35bdf4d5`, p03 `a8d6562ba529db648`,
    p04 `a16a04cb1130a4c04` ;
  - lot 9 radars : m1–m2 `a236ad56fe39a2e86`, m3–m4 `afbed688e16b5f201`, s1–s2
    `aa337ace1fae1e10b`, s3–s4 `ad2649cfd02597813`, h1–h2 `ac9e16c642c60e3f2`, h3–h4
    `a252923e3691e2d95` ;
  - lot 10 : e1–e2 `aefeb6b129a6e901f`, r1–r2 `ac231104cb7d2f26e`, c1–c2 `a5a61081afe64d5a7` ;
  - moteur de substitution : `af3c5daef710e2cee`.
- **À chaque retour** :
  - contrôle indépendant :
    - lots 9 et 10 : `controle-fil6.mjs <dossier> --objet=libre` ;
    - lot 8 : `controle-rail.mjs fils8-rail pNN` ;
    - base radar : lot complet de la base ;
    - substitution : `npx vitest run` et `tsc` dans prototypes/houblons-v4 ;
  - planche (`planche.mjs <dossier> 390`), regardée ;
  - commentaire dans le ticket, avec la planche jointe à la page partagée ou en lien vers le
    fichier ;
  - commit du dossier rentré.
- **Après le moteur de substitution** : lot 11, écrans de substitution en fils de fer (depuis la
  fiche, depuis la recette, en rupture de stock, libre), ticket #137.
- **Rien n'est intégré** sans son choix (D50). Pas de push.

## État (18.10, ~23:00) — lots 6 et 7 rentrés, rail en vol

- **Lot 6** : les 11 fils de fer de chaque objet passent `controle-fil6.mjs`. Comparer et
  Suggestions sont à 11/11. Les planches sont envoyées au brasseur, qui doit encore choisir.
  - Coût mesuré : 130 à 350 k jetons et 8 à 28 min par auteur, contre une heure et 450 k au lot 5.
  - Contrôle complété en route : nom du houblon sur chaque barre ou en tête de sa colonne
    (D51, point 1) ; pistes mesurées où qu'elles soient, dans leur plus grande dimension ;
    plafond de 90 mots pour Comparer.
- **Lot 7, la base radar** (10 technologies, mêmes données
  `ecran-1/fils7-radar/donnees.json`, extraites par `tournoi/outils/extraire-radars.mjs`) :
  - le brasseur sur p08 : « Seul le premier est ok... ». Le radar Comparer en SVG maison devient
    la base radar ;
  - pour Ma bière et Suggestions, toutes les technologies donnent une pointe. Cause vérifiée :
    les données manquent. La dégustation ne note que le résineux, la prévision est « confiance
    faible » (plages 0–50), 5 familles sont non situées, et il n'y a pas d'intensités (#131) ;
  - proposé : grille de dégustation (12 familles, 0–3) et prévision dessinée en plage ; en
    attendant, barres et pistes. **Question ouverte au brasseur.**
- **Rail** : D61 (la hauteur dit le temps, indépendante de la vitesse du doigt), témoin négatif
  base v4.1 (4 échecs). L'auteur du rail `a17d51434443f441e` est relancé.
- **Contrôles nouveaux** : D61 (`controle-rail.mjs`), D62 (`controle-radar.mjs`,
  `controle-fil6.mjs` : séries fermées sur tous les axes, sans valeur vide ; témoin négatif base
  v4.1, positif Comparer p03), D48 bis.

## État (18.10, ~21:30) — lot 6 en fils de fer, 12 auteurs en vol

- **Ses choix sur les planches du lot 5** (SPEC-BRASSEUR, SPEC OK 131/131) :
  - Comparer p03, en Barres et en Radar (« J'aime beaucoup la variante 3 ») ;
  - mais pas d'intervalle de confiance, pas d'arômes en Barres, pas de lien au style ;
  - « pas encore meilleur que le site original » ;
  - le trait noir de mon lot est pris pour un centre (D57 à D59).
  - Suggestions : « vraiment difficile à lire », p06 s'il faut choisir (D60). Mon classement
    indicatif la mettait dernière : à garder pour calibrer le jury.
- **Méthode corrigée** (sa plainte « Pourquoi j'ai plus juste des maquettes fil de fer… ») :
  - exploration en fils de fer statiques, 15 min par auteur, planche ;
  - fidélité seulement pour la variante choisie ;
  - écrit dans `docs/qualite/methode-conception-frontend.md` et en mémoire.
  - Mesure : lot 1 7–12 min et ~150 k par auteur ; lots 3 à 5 50–85 min et 400–950 k.
- **Fait** :
  - contrôles indépendants des 22 variantes du lot 5 : LOT OK sauf Suggestions p07–p09, encore en
    cours au moment d'écrire ;
  - base v4.1 (vraie loupe façon Dock, D55 D56) LOT OK et publiée, version 6 de la page partagée ;
  - outils `tournoi/outils/figer.mjs` (page rendue → HTML statique) et `capture-page.mjs` ;
  - `controle-fil6.mjs` (D57 à D60), témoins négatifs p03 et p06 figés en échec (28 et 4).
- **En vol (12 auteurs, ne pas relancer)** : lot 6 Comparer (`fils6-comparer`, p01–p11, départ
  p03 figé) et lot 6 Suggestions (`fils6-suggestions`, p01–p11, départ p06 figé), deux variantes
  par auteur.
- **À leur retour** :
  1. `node work/refonte-frontend/v4/tournoi/outils/controle-fil6.mjs <fils6-…>` et
     `mots-premier-ecran.mjs` ;
  2. le premier fil de fer qui passe sert de témoin positif ;
  3. planches `planche.mjs <fils6-…> 390 --vue=comparer` (et comparer-radar, b,
     suggestions-radar), regardées, envoyées au brasseur ;
  4. son choix, puis intégration en fidélité dans la base (une seule fois).
- **Données manquantes pour battre Beer Maverick** : cohumulone et farnésène, absents des 32 fiches
  (#131) ; aucun substitut importé.

## Reprise après compaction (18.10, ~20:15) — agents en vol, rien à refaire

- **En vol (9 agents, ne pas relancer)** :
  - rail : `a17d51434443f441e` relancé pour la vraie loupe façon Dock (D55 : vide ≤ 80 px, ajouts
    proposés ≤ 120 px plus bas) et pour plusieurs houblons sans chevauchement (D56, cas-k3) ;
    base v4 en échec sur les deux.
  - lot 5a Comparer : `afdcc0d66e5485739` (p01–p03), `aa8453e1576a8afad` (p04–p06),
    `a7291edb1e9d4b617` (p07–p09), `ae30b17ff038764fa` (p10–p11).
  - lot 5b Suggestions : `aa5d80d813672ee8b` (p01–p03), `a24ff062473f69124` (p04–p06),
    `af514443688eac0ae` (p07–p09), `ada5ae5baa88c24fe` (p10–p11).
- **Au retour du rail** : contrôle indépendant (commande en tête de la section « Reprise après
  compaction (18.10, ~19:30) », ou celle du message à l'agent) ; regarder les captures
  « pendant » ; republier la page partagée (`scratchpad/artifact-lot3/build.mjs
  --src=<ecran-1>/base:consolide --src=<ecran-1>/fils3:p02,p03,p08 --sans-radar`, puis Artifact,
  même file_path `site/index.html`, `root` = site, fichiers consolide/* et img/consolide-*) ;
  commit de `base/consolide` et `base/generateur`.
- **Au retour des lots 5a et 5b** : contrôle indépendant par lot (commandes en bas des deux
  BRIEF-AUTEUR.md) ; regarder les captures de chaque variante ; jury léger facultatif (★
  indicatives, notes dans `scratchpad/artifact-lot3/notes-lot5.json`) ; page
  `node scratchpad/artifact-lot3/build-lot5.mjs <ecran-1>` (site-lot5, files-lot5.json ;
  le tester avant) ; publier comme nouvel artefact ; donner le lien ; fermer le fil 664b425c de la
  page partagée ; **attendre son choix (D50)**, le citer dans SPEC-BRASSEUR, puis intégrer.
- **À faire juger avec le lot 5** : pastille « 10′ » suggérée sur les ajouts proposés ; « résine
  2/4 » en orange d'alerte sur la carte de Nugget ; règle de tolérance D54 (à valider).
- **Commits locaux** jusqu'à `2d49c44` ; rien de poussé.

## Avancement (18.10, ~19:30) — Comparer d'abord, Suggestions ensuite

- **Nouveaux mots** (SPEC-BRASSEUR, 120 citations) : Beer Maverick est le **plancher** de
  Comparer (« faire mieux, pas moins bien ou la même chose ») ; « il faut des intervalles de
  confiance » ; l'échelle dépend du style et de son a priori (résine : stout ≠ Kölsch) ;
  biotransformation, levure, thiols : « pas pour tout de suite ».
- **Fait** (commit `48ae5bb`) : cadrage `ecran-1/CADRAGE-SC.md` ; `controle-comparer.mjs`
  (D51, D53) avec témoins (`scratchpad/temoin-comparer` : p01 Beer Maverick tel quel échoue,
  p02 passe, p02 altéré échoue) ; D24 bis (4 houblons superposés), D40 bis (seule la couleur
  d'alerte est interdite) ; pack : `apresPlage` par voie ; méthode v3
  (`docs/qualite/methode-conception-frontend.md`) ; tickets #131 (données houblons
  multi-sources, biotransformation), #132 (dose de levure), #133 (méthode sur tous les écrans).
- **Après le commit** : `controle-radar.mjs --pages=` et `controle-lot.mjs --radar-pages=`
  (lot d'un composant sur baseline gelée).
- **Lot 5a Comparer** : brief `ecran-1/fils5-comparer/BRIEF-AUTEUR.md` ; baseline gelée
  `scratchpad/baseline-lot5/` (v3 + Comparer en `data-composant`, cas Nugget, East Kent
  Goldings, Fuggle). Puis publication de toutes les variantes (D50).
- **Fait ensuite** : D54, tolérance par style (`src/engine/tolerance.ts`, commit `e534483`) et
  plages avant/après en tolérances (`b68a014`, pack 498 ko) ; D52 `controle-suggestions.mjs` avec
  témoins (`e032685`) ; brief `ecran-1/fils5-suggestions/BRIEF-AUTEUR.md`, baseline gelée
  `scratchpad/baseline-lot5b/`.
- **En cours (19:45)** : 8 auteurs, lot 5a Comparer (p01–p03, p04–p06, p07–p09, p10–p11) et
  lot 5b Suggestions (mêmes découpes). À leur retour : contrôle indépendant par lot (commande des
  briefs), regard des captures, jury léger (★ indicatives), puis page de publication
  `scratchpad/artifact-lot3/build-lot5.mjs <ecran-1>` (site-lot5, files-lot5.json,
  notes-lot5.json), publication, ping ; attendre son choix (D50).
- **Rail, fait** : base v4 (commit `25c0b71`), LOT OK indépendant, gestes regardés (vides
  pendant le geste : prix assumé, à faire juger), publiée sur la page partagée (version 5), fil
  303c6753 répondu et fermé. Fil 664b425c (radar « n'importe quoi », variations) : à fermer quand
  le lot 5 sera publié. À faire juger aussi : pastille « 10′ » suggérée sur les ajouts proposés,
  « résine 2/4 » en orange d'alerte sur la carte de Nugget.

## Reprise après compaction (18.10, ~19:30) — FOCUS : Suggestions et Comparer

- **Verdict du brasseur sur le lot 4 publié** (https://claude.ai/artifact/V657sqy2X8DoCkxW7r8ttV) :
  « Pour la fiche, on est bon, ma bière moyen convaincu. Les deux autres c'est n'importe quoi... »
  ; « on va de focus là dessus ». Les deux autres = Suggestions et Comparer (radars). Plus tôt, sur
  leurs barres : « tout ce qui est suggestions et comparaison, c'est très mauvaise et de mon point
  de vu pas terminé ». La fiche : celle de la base v3 (f08 greffée) — à confirmer d'un mot.
- **Prochaine étape : Suggestions et Comparer, de zéro, pensés en brasseur.**
  1. Cadrage court : quelle décision le brasseur prend dans chaque partie (Suggestions : quelle
     voie appliquer à ma recette — le changement concret, l'effet sur mes familles face à la
     cible du style, l'IBU tenu, le coût et le stock en icône ; Comparer : choisir entre 2 à 4
     houblons — α, rôle, arômes, usage dans CETTE recette). Les quatre objets (D19, D40) :
     ma bière, la cible du style, la comparaison manuelle, les suggestions de l'outil, jamais
     mélangés.
  2. Plaintes déjà connues en contrôles (D1–D50) ; écrire d'abord ce qui manque (avec témoin).
  3. Lot 5 : 4 tièdes, 5 chaudes, 2 froides, sur la base v3/v4 (barres ET radar de ces deux
     parties, un seul style de radar D39, 12 axes D48).
  4. **D50** : publier TOUTES les variantes pour lui (page partagée, vue par vue), pinger,
     attendre son choix cité dans SPEC-BRASSEUR, PUIS intégrer.
- **En cours** : refonte du rail (base v4) `a17d51434443f441e`, brief `ecran-1/base/BRIEF-RAIL.md`
  + 12 axes dans tous les radars (D48) + appui long sur toute la carte (D49). À son retour :
  contrôle indépendant (`controle-lot.mjs work/refonte-frontend/v4/ecran-1/base --mots=80
  --fill=0.8 --boosters=4 --recette --rail --detail --palette --radar --fiche --coherence
  --objets`), regard, publication sur la page partagée (même file_path :
  `scratchpad/artifact-lot3/site/index.html`, générateur `build.mjs --src=…`), puis fermer le fil
  de commentaires 303c6753 (D49) une fois publié.
- **État de la base** : v3 figée dans `base/_v3` (LOT OK indépendant), publiée sur
  https://claude.ai/artifact/WSzBr4fBJerouWVtWqFiMJ ; v2 dans `base/_v2`.
- **Moteur** : dernier commit `598610f5` (tables d'IBU 0–240′, premier moût, whirlpool, densité).
  Point ouvert : durée de contact pour l'arôme figée.
- **Contrôles** : D1 à D50 dans `v4/DEFAUTS-RECURRENTS.md` ; outils dans `v4/tournoi/outils/`
  (controle-lot, -recette, -radar, -rail, -fiche, -baseline, -detail, -palette, -coherence,
  -objets, fuite-touchers). SPEC-BRASSEUR : 100+ citations vérifiées.
- **Mémoires** ajoutées ce soir : penser en brasseur, rien de figé, le brasseur choisit.
- **Leçon git** : ne committer un dossier qu'une fois son auteur rentré.

## Reprise après compaction (18.10, ~16:00)

- **En cours, lot 3** (`v4/ecran-1/fils3/`, brief `fils3/BRIEF-AUTEUR.md`, 9 pages par
  variante) : agents p01 `a8c230236b7cd6dea`, p02–p03 `aca844c5cdc3c873d`, p04–p05
  `ad281b2bd243589f7`, p06–p07 `ad2a6a2c5f5a3af1f`, p08–p09 `a9016a968dd0f4d73`, p10
  `ae02aa9628c3e9a68`, p11 `a2682412df6009351` (mélange p2 p3 p4). Ils ont reçu en route :
  le radar par objet (D18, D19), la levure (D22).
- **18.10 soir, contrôles élargis** (signalés par p10 et p11) : `tournoi/outils/fuite-touchers.mjs`
  (D14 bis : tous les éléments interactifs touchés ; témoins `scratchpad/temoin-fuite` → 1 échec,
  lot 2 p03 → 3 échecs) et `controle-lot.mjs` mesure toutes les pages à 390 (D4, D5, D19 bis ;
  p01, p10, p11 → 14 échecs : radars 0,62–0,77, cas-k2 0,74–0,76, cas-k3 105–118 mots et 1,1–1,4
  écran). Les 7 auteurs ont reçu la nouvelle exigence ; p01, p10, p11 relancés sur leurs échecs.
  `planche.mjs --vue=<page>` et `paires.mjs --vues=index,b,biere,…` ajoutés.
- **18.10 soir, retour du brasseur (D27)** : p2, p3, p8 (rail des étapes) retenues ; stock
  trop en avant → contrôle D23 (`controle-recette.mjs`, `stockDiscret` ; témoins p04, p08, p10
  pastilles pleines, p02, p03 achats et filtre visibles). Agents arrêtés : p01, p04–p07, p10,
  p11. En cours : p02–p03 `aca844c5cdc3c873d`, p08 `a9016a968dd0f4d73` (p09 abandonnée). Il
  veut voir « les radar graph et autres écrans » : à leur LOT OK, planches par vue + page
  Artifact p2, p3, p8 toutes vues, puis consolidation.
- **18.10 soir, D28** : radars « toujours n'importe quoi », fiche à l'appui long, baseline.
  Contrôles D24 (`controle-radar.mjs` contrat v2, témoin `scratchpad/temoin-radar` → 21
  échecs), D25 (`controle-fiche.mjs`, `--fiche` ; p03 → 2 échecs), D26
  (`controle-baseline.mjs`, `--baseline=` ; p11 écartée → 5 échecs, p03 → OK). Bibliothèques
  dans `scratchpad/libs-radar` (README, recette esbuild). Moteur `9ae7e05d` : roueAromes,
  niveaux des voies, `pack-fiches.json` (32 fiches) ; échelle continue 0–3 demandée. Baseline :
  p02–p03 `aca844c5cdc3c873d` pose `data-composant` et `data-houblon`, générateur copié dans
  `scratchpad/baseline-p03`. Lots prêts : `ecran-1/fils4-radar/BRIEF-AUTEUR.md`,
  `ecran-1/fils4-fiche/BRIEF-AUTEUR.md` (4 tiède, 5 chaude, 2 froide chacun, 4 auteurs par
  lot). p2, p3, p8 : LOT OK 3/3 (contrôle indépendant) ; page Artifact prête à générer
  (`scratchpad/artifact-lot3/build.mjs`), en attente des radars refaits.
- **18.10 soir, lot 4 lancé** (baseline `fils3/p03`, générateur `fils3/generateur-p02p03/`) :
  radars `fils4-radar/` p01–p03 `a5b117c36ff16a4b2`, p04 p10 p11 `aef70991de69efe90`, p05–p07
  `a9c6fe37d5e9be19c`, p08–p09 `a835faa60ebf9cb1b` ; fiche `fils4-fiche/` p01–p03
  `ac412a37047b66094`, p04 p10 p11 `aa33d9fdef55a88e0`, p05–p07 `ae0657909f01f22fe`, p08–p09
  `a52a4e6140b388807`. Contrôle : `controle-lot.mjs <fils4-…> --mots=80 --fill=0.8 --boosters=4
  --recette [--radar | --fiche] --baseline=work/refonte-frontend/v4/ecran-1/fils3/p03`.
  Git : `/work/refonte-frontend` versionné en partie (`.gitignore`, commit `220ac000`) ; issue
  #119 commentée. Page privée p2, p3, p8 sans radars :
  https://claude.ai/artifact/WSzBr4fBJerouWVtWqFiMJ (générateur
  `scratchpad/artifact-lot3/build.mjs … --sans-radar`, test `test.mjs`).
- **18.10 soir, D29** : base consolidée (p2 + levure de p8 + moment glissable) confiée à
  `aca844c5cdc3c873d`, sortie `ecran-1/base/consolide/`, contrôle `controle-lot.mjs
  work/refonte-frontend/v4/ecran-1/base --mots=80 --fill=0.8 --boosters=4 --recette --rail`.
  Contrôles D27, D28 (`controle-rail.mjs`), témoins `scratchpad/temoin-rail` (échec) et
  `scratchpad/temoin-rail-positif` (OK).
- **18.10 soir, suite** : D29 à D37 contrôlés (α et rôle, stock en icône, Ma bière au style +
  absolu, gestes, palette, moment par 5′, geste propre, ébullition réglable). Moteur :
  `d8c94594` (recette vide en brasseur, α, rôle), `cf2b6b78` puis `598610f5` (tables d'IBU 0–240′
  par 5, premier moût, whirlpool 60–100 °C × 5–60 min, facteur de densité). **Point ouvert** :
  la durée de contact pour l'arôme reste figée (whirlpool 80 °C 20 min, à froid 24 h 18 °C) ;
  lot dédié à prévoir. Issue #130 (IBU, houblons libres ou en sac) créée pour après. Lot 4 :
  radars p01–p03, p05–p09 et fiches p08–p09 rentrés LOT OK (commande sans `--recette`, pack
  figé `scratchpad/pack-lot4`). Base consolidée en reprise (`aca844c5cdc3c873d`).
- **18.10 soir, base v3** (`a6009e3d5c2ba7adf`) : radar unique SVG maison (d3-shape, d3-scale,
  motion) au style des fiches, fiche p08 greffée (table des moments, roue N/4, feuille,
  actions), balayage des voies ; contrôle indépendant LOT OK (`--recette --detail --palette
  --radar --fiche --coherence --objets`) ; copie figée `base/_v3` ; publiée (artifact v3).
  Refonte du rail en loupe lancée (`a17d51434443f441e`, brief `base/BRIEF-RAIL.md`, contrôle
  `controle-rail.mjs` réécrit). Leçon : ne committer un dossier qu'une fois son auteur rentré
  (ca26d69 et f0fe648 ont saisi des états intermédiaires de la v3).
- **Moteur** (leaf A `a115e8520cde8e241`, réutilisable) : dernier commit `3f973ed2`, pack
  436 ko (plafond 500), `ENGINE-V4 OK (50 tests)`. Contient S1 à S5, crans du style,
  quatre objets, catalogue, achats, goûts, voiesSansHoublon, levure (double impact, leviers,
  signaux de biotransformation).
- **Ossature haute fidélité** : `1865da36` (`prototypes/houblons-v4/ecran/`, agent
  `a98ef3fbffcbe6b6b`).
- **À faire ensuite** :
  1. à chaque retour d'auteur : rien ; quand les 7 sont rentrés, `node
     work/refonte-frontend/v4/tournoi/outils/controle-lot.mjs work/refonte-frontend/v4/ecran-1/fils3
     --mots=80 --fill=0.8 --boosters=4 --radar --recette` (long : en arrière-plan) ; corriger
     ou renvoyer aux auteurs ce qui échoue ;
  2. planches (index, biere, etat-b, comparer, les trois radars, cas-k2, cas-k3) avec
     `tournoi/outils/planche.mjs <dossier> <suffixe>`, regardées par le pilote ;
  3. jury neuf (Opus) : tour 1 (coup d'œil + questions fermées, dont D11, D12, D15) puis
     paires dans les deux ordres (`tournoi/outils/paires.mjs`) ;
  4. **page Artifact privée** (multi-fichiers : les 3 meilleures variantes, toutes leurs pages)
     à toucher sur son téléphone + planches + PushNotification (il a dit « ok ping moi ») ;
  5. il choisit la base → `tournoi/outils/retro.mjs` → base déclinée sur les cas K1 à K10
     (`ecran-1/CAS.md`) → tranche verticale haute fidélité dans l'ossature → 3 versions
     (claire, sombre, troisième) → G5 à G10.
- **Règles en vigueur** : chaque plainte → contrôle d'abord (`v4/DEFAUTS-RECURRENTS.md`, D1 à
  D22, témoins négatifs) ; rien montré sans `LOT OK` ; pas de listes « quoi améliorer » : agir
  et prouver ; répartition des lots « 4 tiède, 5 chaude, 2 froide » ; texte avec barres
  obliques inverses ou accents graves par Write/Edit, jamais `node -e` dans Bash (deux outils
  abîmés ainsi le 18.10) ; commits à chemins explicites, pas de push.
- **Décisions en attente du brasseur** : import en masse des fiches sans licence ouverte
  (D25) ; bascule de l'app entière en thème clair (à la porte B, D26).

## État courant (18.10, après-midi) — méthode v2, écran 1 en fils de fer

- **Pause des tournois M1–M5 (D23)** : 23 mini-maquettes rejetées (« cockpit », 166 à 383
  mots au premier écran). Archivées dans `v4/tournoi/M1/_lots-1-2/`.
- **Recherche** `v4/recherche/` : A causes (Fable), B pratiques UI (Opus, 66 sources),
  C workflow (Opus), D profils de goût (Sonnet). **E données d'arôme (huiles) en cours**.
- **Méthode v2 (D24)** : `docs/qualite/methode-conception-frontend.md`. DESIGN.md
  « Deux régimes », PRODUCT.md (densité = sa définition du 18.10), règle
  `.claude/rules/affinee-frontend.md` réécrite. `v4/SPEC-BRASSEUR.md` (46 citations,
  `v4/outils/check-spec.mjs` → SPEC OK). Mémoire `affinee-ui-pas-cockpit`.
- **Références du brasseur** (5 liens, 18.10) : `v4/reference/brasseur-2026-10-18/`
  (README « on prend… »). 4 sur 5 claires ; ClyHealth = trois niveaux de profondeur.
- **Écran 1** `v4/ecran-1/` : CADRAGE.md, PRIORITE.md (corrigé par juge Opus neuf),
  `fils/BRIEF-AUTEUR.md`. **11 fils de fer en cours** (p01-p02 Opus tiède, p03-p04 Sonnet
  tiède, p05-p06 Fable chaud, p07-p08 Opus chaud, p09 Sonnet chaud, p10-p11 Opus froid).
- Outils : `capture.mjs` (+ `pNN-oeil.png` 40 %, + `etat-b.html`), `mots-premier-ecran.mjs`
  (`--max=60`, `--page=`), `planche.mjs`, `v4/outils/capture-refs.mjs`.
- **Suite** : capturer, mesurer (MOTS OK A et B), jury Opus neuf par paires (deux ordres)
  → 3 retenus → planche → **ping au brasseur** (PushNotification + SendUserFile ; il a dit
  « ok ping moi quand cela est bon »). Puis tranche verticale dans `prototypes/` avec
  composants de l'app (`src/ui/SegmentedControl`, `RecipeDisclosure`,
  `hopIndex/HopRangePlot`, `LevelGauge`), puis 3 versions (dont un monde clair).
- Rien commité depuis `691b3f5d` (docs modifiés : DESIGN.md, PRODUCT.md, méthode, règle).
- **Fils de fer faits** : 11/11, `CAPTURE OK`, `MOTS OK` (A 20–25 mots, B 48–60). Jury Opus
  neuf : `fils/jury/tour1.json` (6 retenus : p01 p04 p08 p09 p10 p11), `tour2.json` (paires
  dans les deux ordres, 4 % de verdicts incohérents ; classement p10 12, p09 10, p04 6,
  p01 5, p08 5, p11 4 ; à montrer : **p10 bande commune, p04 tuiles, p08 dialogue**).
  Défauts communs : état A à moitié vide, pistes lues comme barres de progression,
  « aucune voie » grisé, jauge IBU et badge illisibles au coup d'œil.
- **Ping envoyé** (planche `fils/captures/planche-brasseur.png`). Sa réponse : « C'est mieux
  […] pas assez dense », bascule barres ↔ radar, plus d'UX boosters ; pas de choix 1/2/3.
- Puis : `docs/ux-boosters.md` (37 boosters, commit `7e3c2944`), recherche G clair/sombre
  (D26 : versions claires par défaut, une sombre), `v4/DEFAUTS-RECURRENTS.md` (12 défauts →
  contrôles ; témoins négatifs en échec), `tournoi/outils/controle-lot.mjs` (mots, tailles,
  paragraphes, remplissage, 1 écran à 390 et 412, boosters joués `data-booster`, radar),
  `retro.mjs`, GATES.md v2 (G0–G10), méthode v2 commitée (`b42a07af`), #119 commentée.
  Moteur : `dabbeb27` (Nugget cité résineux 2/4, voies Nugget faibles, dégustation,
  hors modèle), `cd97f91a` (`S1.reading`, `S1.readingSummary`).
- **Lot 2 lancé** (`v4/ecran-1/fils2/`, brief `BRIEF-AUTEUR.md`) : p01–p02 froid (Opus, depuis
  p10 et p04), p03–p04 tiède Opus (biomarqueurs, carte-réponse et modules), p05–p06 tiède
  Sonnet (curseurs à deux pôles, dialogue), p07–p08 chaud Fable, p09–p10 chaud Opus, p11
  chaud Sonnet. Chacun doit imprimer LOT OK.
- **Lot 2 fait** : 11/11 `LOT OK` (contrôle rejoué par le pilote). Changement d'ordre du
  brasseur pendant le lot (D13 « Comme pour les Malts… ajouter en un click… Ensuite seulement
  […] panel de comparatif ») intégré par message aux auteurs. Jury neuf tour 1 :
  `fils2/jury/tour1.json`, 6 retenus (p01 p03 p04 p02 p05 p10). Défauts révélés → contrôles :
  D14 (texte technique « null » visible, `capture.mjs` + `jouer-boosters.mjs`, compté par
  `controle-lot`), D15 (fantôme trompeur, question jury), D16 (IBU par houblon) et D17 (type
  d'ajout et moment), dans `controle-recette.mjs` ; témoin : p03 échoue D14, D16, D17.
- **Choix du brasseur** : « P3 serait même le mieux de loin du lot » ; mélange p2 p3 p4 ;
  IBU par houblon ; type d'ajout et quand ; puis « mini version alternatives de p3 avec le
  meilleur des autres ». Retro consignée (`tournoi/retro.md`).
- Moteur : `cd1dc54a` (ajouts rapides au style avec dégustation), `9a0da5ea` (cible résine 30
  depuis la dégustation) ; **en cours** : `ibuParMoment` et `moments` (leaf A).
- **En cours** (18.10 ~14:35) :
  - consolidation p3 + ≤3 greffes → `fils2/consolide/` (Opus) ;
  - **lot 3 = variantes de p3** `v4/ecran-1/fils3/` (brief `fils3/BRIEF-AUTEUR.md`) :
    p01 froid Opus (greffes p04), p02–p03 tiède Opus (frise p10 ; pastille p08 + « +N IBU »
    p11), p04–p05 tiède Sonnet (bandeau p02 + tuiles ; grille houblon × famille p09),
    p06–p07 chaud Fable, p08–p09 chaud Opus, p10 chaud Sonnet ; la consolidation sera copiée
    en p11 (2e froid) ;
  - ossature haute fidélité `prototypes/houblons-v4/ecran/` (Vite multi-pages, composants
    `src/ui`, `hopIbu`, thèmes clair et sombre, sortie `prototypes/houblons-v4/maquettes/`).
- **18.10 ~15:00 : lot 3 et consolidation arrêtés** (rien d'écrit) après deux retours :
  « C'est une catastrophe la vue radar ?? » (D18) et « il y a confusion entre […] mon profil,
  le style un target, la comparaison manuel entre plusieurs houblons, la comparaison par
  suggestions » (D19). Modèle écrit : `v4/ecran-1/MODELE.md` (4 objets, 3 parties du panneau,
  un radar par partie). `controle-radar.mjs` réécrit (D18, D19 ; témoin p03 : 6 échecs),
  `controle-lot.mjs` mesure aussi `biere.html` et `comparer.html`. Brief du lot 3 réécrit
  (`fils3/BRIEF-AUTEUR.md`, 7 pages par variante). Moteur (leaf A) : `profilBiere`,
  `cibleStyle`, `profilApres`, `profilFiches` en cours.
- **Ossature haute fidélité livrée** (`1865da36`) : `prototypes/houblons-v4/ecran/` (Vite,
  un script classique pour `file://`, composants `SegmentedControl` et `RecipeDisclosure` de
  l'app, IBU en direct par `hopIbu`, thèmes clair et cave par variables, `ecran:contraste`
  avec témoin). Construire : `npm --prefix prototypes/houblons-v4 run ecran:build --
  --version=version-b --theme=cave` → `prototypes/houblons-v4/maquettes/<version>/`.
- 18.10 : modèle complété (C-a et C-b confirmés « Parfait », C-g mes goûts, C-h stock qui
  informe et liste d'achats), cas K1 à K9 (`ecran-1/CAS.md`), contrôles D20 et D21 dans
  `controle-recette.mjs` (témoin p03 : 6 échecs). Moteur (leaf A) : 4 objets, puis S4, S5,
  puis `catalogue`, `achats`, `gouts`, `voiesSansHoublon` (en file).
- Moteur livré : `b62c0d24` (4 objets), `e7e86bc8` (S4, S5), `e43c8d98` (catalogue, achats,
  goûts, voiesSansHoublon ; pack 476 ko, plafond porté à 500 ko, accepté). Échelle des objets
  1, 2, 4 passée en **crans du style** (MODELE.md ; `controle-radar.mjs` 0 à 4) : champs
  `*Crans` demandés au moteur (en cours).
- **Lot 3 relancé** (~15:35) : p01 froid Opus (greffes p04), p02–p03 tiède Opus, p04–p05 tiède
  Sonnet, p06–p07 chaud Fable, p08–p09 chaud Opus, p10 chaud Sonnet, p11 froid Opus (mélange
  p2 p3 p4). 9 pages par variante (`fils3/BRIEF-AUTEUR.md`).
- **Ancienne suite** : relancer le lot 3 (11 variantes, mêmes greffes qu'avant) dès que le moteur a
  livré → `controle-lot.mjs fils3 --radar --recette` → jury → planche (barres et radars) +
  page Artifact privée → ping → base choisie → tranche verticale (ossature en cours).

## Avancement après compaction (18.10)

- 10:36 quota semaine 5 % (5 h : 16 %) → tournois à taille pleine.
- 10:38 calibration du jury Fable (`v4/tournoi/jury/calibration.json`) : Territoire 7,0 ;
  v3 6,7 ; v2 5,4 ; Explorer V5.5 3,6. La v2 est sous Territoire : calibration acceptée.
  Réserve du jury : aveugle partiel (Read a rendu la section calibration de REGLES.md ;
  titres « Territoire » et « V5.5 » visibles sur les captures). Clé : R1 v2, R2 Territoire,
  R3 v3, R4 V5.5. Pour les prochaines calibrations, masquer les titres.
- Consignes prêtes (scratchpad) : `auteur-M1.md` (modèle avec __P1__/__F1__), `jury-M1.md`.
- Tranche A livrée : commits `1057939b`, `1c511525`, `12cbc0a7` (D21 : classement « reste au
  style », S2 en 3B). G0, G1, G2 tenues (gate-check `--cwd .` depuis la racine : sans
  `--cwd`, les CHECK partent du dossier du registre et échouent). Pack 142 ko.
  S1 top : Golding (à acheter), Motueka (stock), Aurum, EKG, Columbus ; Citra cryo 7e.
  À revoir pour M2 : Columbus n'est pas en conflit « moins résineux » (fiches à relire).
- 10:5x M1 lancé : consigne `v4/tournoi/M1/CONSIGNE-AUTEUR.md`. Auteurs : p01-p02 Opus
  (juge BJCP, accordeur), p03-p04 Sonnet (mixage, altitude), p05-p06 Fable (spécimen
  variable, rail central), p07-p08 Opus (orientation, volets), p09-p10 Sonnet (Crouwel,
  aéroport). Jury : l'agent de calibration (réutilisé par SendMessage, consigne
  `jury-M1.md` du scratchpad).

## Prochaine action (18.10, midi, avant compaction)

Le brasseur : « Alors c'est partie ».

**Phase maquette v4** (D19, D20). Branche `claude/refonte-houblons-v4`, commits
`824cd878` et `9fbf1513`, non poussés.

**Fichiers clés** :

- `docs/qualite/methode-conception-frontend.md` : deux phases ; tournois ; 3 versions finales.
- `v4/brief-v4.md` : § 9 = exigences retrouvées, et leur traitement.
- `.impeccable/surfaces/prototypes-houblons-v4-index-html.md` : contrat, tirage 36178972.
- `v4/GATES.md` : G0 à G10.
- `v4/tournoi/REGLES.md` : grille, calibration du jury, joker de rupture, quota, 412 px,
  rétrospective.
- `v4/tournoi/M1/BRIEF.md`.
- Outils dans `v4/tournoi/outils/` : `capture.mjs`, avec `CAPTURE_EXTRA=412` ;
  `check-tournoi.mjs`.
- Outils dans `v4/outils/` : `check-app-intacte.mjs`, `check-citations.mjs` (60/61).

**En cours : tranche A** (agent constructeur en arrière-plan, « Build v4 leaf A »).
Recentré sur :

- `prototypes/houblons-v4/data/pack-mini-protos.json`, tiré du moteur V5.5 importé ;
- `data/style-bands.json` ;
- `check:engine` → `ENGINE-V4 OK`.

Storybook, Playwright et axe-core sont abandonnés en phase maquette.

**À son retour** :

1. Vérifier le pack, G1 et G2.
2. Lancer M1 : 10 mini-maquettes, 5 auteurs de modèles différents (Opus, Sonnet, Fable),
   2 formes imposées chacun. Formes :
   - feuille de juge BJCP ;
   - accordeur ;
   - table de mixage ;
   - profil d'altitude ;
   - spécimen à axe variable ;
   - page à rail central ;
   - carte d'orientation ;
   - tableau à volets ;
   - grille de Crouwel ;
   - signalétique d'aéroport.
3. Captures, puis jury Fable calibré (Territoire, Explorer V5.5, v2, v3), joker de
   rupture, consolidation.
4. M2 à M4 avec la grammaire de M1, puis M5.
5. Les 3 versions : `prototypes/houblons-v4/maquettes/version-a`, `-b`, `-c`.
6. Revue : impeccable critique, puis Fable qui joue S1 à S3.
7. Artifact, commentaire #119, tableau des bandes de 3 styles à valider par le brasseur,
   porte B.

**Garde-fous** :

- quota : lire l'usage avant chaque tournoi (60 % → 6 mini-maquettes, 75 % → arrêt,
  plafond 80 %) ;
- l'app reste intacte ;
- pas de push.

## Prochaine action précédente (18.10, 11:00, v4 lancée)

Le brasseur a dit : « Construis direct une fois un plan sain avec les bon outil, skill et
que l'ux UI soit au top niveau qualité », puis « Et en place une vraie méthodologie de
travail de conception frontend, avec des vrai outils ».

- Méthode : `docs/qualite/methode-conception-frontend.md`.
- Brief : `v4/brief-v4.md`.
- Contrat impeccable : `.impeccable/surfaces/prototypes-houblons-v4-index-html.md`,
  tirage 36178972.
- Registre : `v4/GATES.md`, lint OK.
- Contrôle de l'app intacte : `v4/outils/check-app-intacte.mjs`.
- Commit `824cd878` sur `claude/refonte-houblons-v4`.

Tranche A en cours (agent constructeur) : outils dans le projet isolé
`prototypes/houblons-v4/`, moteur V5.5 importé, échelles au style, tests (G1 à G3).

Ensuite :

1. vérifier la tranche A et l'inventaire des exigences ;
2. lancer la tranche B (atelier Storybook, page, contrôles G4 à G11) ;
3. revues G14 (finish-reviewer) et G15 (Fable) ;
4. publier, puis porte B (G19).

## Prochaine action précédente (18.10, 10:00, v3 arrêtée, D19)

La v3 est arrêtée : l'agent commite l'état, mesure G0 à G9 comme base et rend ce qui est
réutilisable. Exigences perdues retrouvées (brief du 01.10) : moteur V5.5 piloté par
objectif (« ma stout trop résineuse, je la veux plus florale »), carte Territoire
(checkpoint-05/concept-2, captures dans `v4/reference/concept-2-territoire/`), échelles
relatives au style, bascule Barres / Radar, levure (biotransformation). Inventaire
complet en cours par un agent Haiku : `v4/exigences-retrouvees.md`. À son retour :
vérifier les citations par script, compléter la banque (Q31 et suivantes), écrire le
brief v4 (impeccable `shape` avant code, critères = scénarios du brasseur, pas Beer
Maverick). Le moteur V5.5 est pur mais injoignable dans l'app depuis 8d089a01 ; il ne
connaît ni deltas, ni assemblages, ni stock, ni échelle par style.

## Prochaine action précédente (18.10, v3 en cours)

Le brasseur a dit « Demarre le » ; l'app a refusé deux fois de lancer la session
(contrôle à distance). La v3 est confiée à un agent en arrière-plan (contexte vierge),
même brief que la carte retirée : branche `claude/refonte-houblons-v3`, dossier
`prototypes/houblons-v3/`, registre `work/refonte-frontend/v3/`. À son retour : lire son
compte rendu, vérifier les critères (a) 25/30 questions « répond » jugées par Fable,
(b) comparaison au moins aussi propre que Beer Maverick, (c) minimums du brief ;
republier l'Artifact si l'agent n'a pas pu ; lancer les revues Fable s'il n'a pas pu ;
puis prévenir le brasseur. Ne pas refaire son travail ici.

## Prochaine action précédente (18.10, 05:15)

Porte B : attendre l'essai du brasseur et ses corrections. Sur son accord : brancher
l'étape Houblons du prototype dans le créateur (`src/pages/BrewWizard.tsx`, à la place de
`HopV55Host`), sur une branche, avec les contrôles `scripts/check-hop-*.mjs` en témoins
(l'app doit alors passer là où elle échoue aujourd'hui) ; push et PR seulement sur accord.
En attente de son accord aussi : activer les hooks (`docs/qualite/hooks-settings.json`),
jouer le contrôle de production (Chrome QA, port 9222), révoquer la clé Gemini.
Suites possibles : specs des autres zones du frontend ; source d'usages par style (#127).

## Prochaine action précédente (18.10, 04:15, faite)

1. Lire le verdict Fable `work/refonte-frontend/phase7/ux-verdict-fable.md` (session
   lancée à l'aveugle, protocole `docs/qualite/protocole-revue-ux.md`).
2. Corriger dans `prototypes/houblons/app.html` chaque bloquant du verdict ; reconstruire
   (`node prototypes/houblons/build-data.mjs`) ; rejouer `scripts/check-hop-prototype.mjs`,
   `check-hop-one-tap`, `check-hop-ux-rules` (390 et 1280), `check-hop-budget` avec
   l'adaptateur `scripts/hop-one-tap/prototype.mjs` ; regarder les captures.
3. Inscrire G8 dans `GATES-phase8.md`, lancer `gate-check --approve --root . --cwd .`.
4. Commiter `prototypes/houblons/`, `scripts/check-hop-prototype.mjs`,
   `scripts/hop-one-tap/prototype.mjs` (jamais `.codex/hooks.json` ni le manifeste).
5. Republier la page (même fichier `prototypes/houblons/index.html`, même adresse).
6. #119 : commentaire phases 6 à 8, cases 6, 7, 8 ; message de porte B à l'humain ;
   journal GitHub du registre.

Ancienne prochaine action (phase 5, faite) : relire le classement de l'agent (`phase5/classement-issues.md`),
trancher, écrire `docs/qualite/revision-tickets.md` (garder, réécrire, fermer
comme caduque avec raison et lien ; backend gardé avec preuve), créer
l'étiquette « interface », créer l'épopée et ses 7 tickets depuis
`phase5/tickets/*.md` (corps validés par `scripts/check-issue-closure.mjs
--body-file --ui` : citations et questions exactes), fermer les caduques avec
commentaire, tout journaliser. Puis phase 6 (specs et architecture en anglais
ASD-STE100, glossaire, Mermaid ; faits relevés dans `phase6/faits-architecture.md`),
phase 7 (visuels, critique Fable), phase 8 (prototype `prototypes/houblons/index.html`,
adaptateur de contrôle, Artifact privé), porte B.

Commandes utiles : banc QA construit dans `TEMP/laffinee-hop-qa-one-tap`
(`SKIP_BUILD=1 QA_CATALOGUE=production`), build de mesure dans
`TEMP/laffinee-dist-mesure` (`npx vite build --outDir`). Galerie : serveur
`serve-preview.mjs` de l'archive, port 5182 (relancer si besoin).

## Reprise (pour une session neuve)

- Lire : `prompt-session.md`, ce registre, `decisions.md`, `GATES-phase1.md`, `constats/donnees-production-2026-10-17.md`.
- Corpus : `docs/besoins/corpus-demandes.md` ; sources brutes dans le scratchpad de la session 055d83f7 (`extract/human-only.jsonl`, `session-messages.jsonl`, `themes-*.json`). Si le scratchpad a disparu, relancer `extract-human.mjs` (copie à verser dans `work/refonte-frontend/outils/`).
- Mesure de l'étape Houblons : script `measure-hop-paths.mjs` (copie dans `work/refonte-frontend/outils/`), banc QA `scripts/build-hop-recipe-qa.mjs`.
- Firebase MCP : dossier isolé `scratchpad/fb-lecture` (aucun `.firebaserc` dans le dépôt) ; lecture seule.
