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
