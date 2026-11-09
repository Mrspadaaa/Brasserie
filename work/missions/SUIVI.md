# Suivi des tâches ouvertes — session de monitoring (chef d'orchestre)

Tenu par la session monitoring. Aucune modification de code ni commit ; elle déploie et pilote les tests (accord du brasseur, 08.11).

## Consignes du brasseur en vigueur (relire avant chaque brief ; mot pour mot)

1. Tests sur l'app DÉPLOYÉE, vraies données : « Faire les test sur la vrai app déployé, je l'ai expressément demandé !!! » (07.11).
2. Le critique TOUCHE tout, sur des données de test : « Non non justement il doit! Juste faire ça sur des données de test, flaggé comme
   telle » (07.11) → chaque actionneur de chaque écran, sur des « ZZ TEST — … » qu'il crée ; regarder seul = « non couvert ».
3. Déployer et itérer sans attendre : « N'attends pas mon accord pour déployer, tu dois itérer dessus en fixant les bugs ??? » (08.11).
4. Gemini dans les tests : « oui Normal, ça fait partie des test » (08.11). Doublons B-001 à B-026 : « Retir. » (08.11).
5. Bloqué → tâche suivante, jamais d'attente (07.11). Liste de tâches tenue à jour sans qu'il le demande (07.11).
6. Un bug ou un problème visuel se corrige, sans mini maquette : « Juste régaler le problème... » (07.11). Levure : à refaire, pas de temps dessus (08.11).
7. Jetons : « les utiliser et les maximiser pour la qualité » (07.11) ; workflow de test : Opus 5.5 max (07.11).
8. TOUT tester, vérifié à l'image : « surtout bien tester les vrai actionneurs type ajouter du houblons, modifer son poids, temps de
   qqch ecttr et comparez notamment avec de la vision » puis « Non c'était des exemples ils doivent TOUT tester... » (08.11) → chaque
   actionneur de chaque écran, sans priorité qui en écarte ; capture avant/après de chaque geste ; effet sur tout ce qui en dépend,
   même nombre partout, bon sens et bonne proportion ; matrice écran × actionneur × joué × vu. Les exemples du brasseur ne bornent rien.
   Et le SENS MÉTIER : « Donc le fait que on puisse mettre du malt après la fermentation, ça a pas posé de problème ???? » (08.11) →
   chaque choix proposé doit être possible en vrai, chaque résultat plausible ; une combinaison impossible acceptée = bloquant.
9. Son Chrome sert aux VRAIS tests : « https://brasserie-l-affinee.web.app/ est ouvert dans mon chrome bien s'en servir pour les VRAIS
   tests » (07.11) ; vraies images de l'app (07.11). Un geste à la fois dans son Chrome (un seul onglet reçoit les touchers).
10. Les tests unitaires ne prouvent rien sur l'UX/UI : « les unit test sur beaucoup de problèmes UX UI ne servait à rien » (07.11) ;
    améliorer le workflow existant, pas en refaire un (07.11). Mesure : bugs inconnus trouvés et capture-recapture, jamais le taux de
    bugs déjà connus retrouvés (« Justement nous on doit trouver des bugs là où on sait pas », 07.11).
12. Aucun constat perdu : « Il faut pas perdre les bug finding » ; « Il faut pas que ça se reproduise c'est critique met en place un
    mécanisme » (08.11) → registre unique `work/missions/BUGS.md` ; contrôle `node scripts/agents/controle-bugs.mjs` ; hook Stop
    (`.claude/settings.json`) qui bloque une fin de session tant qu'un rapport n'est pas versé ; chaque brief d'agent dit « verse au registre ».
14. Déployer sans attendre la fin des captures : « pourquoi ça attends `??? » (08.11, sur « tout ce qui a été corrigé attend son prochain
    déploiement ») → un lot corrigé et intégré se déploie tout de suite ; captures et rejeu se font en ligne après, pas avant.
13. Monitoring léger : « Économie les token pour le travail... Je vois que tu monitor trop l'autre session » (08.11) → pas de message
    à la pilote pour chaque événement : un seul message groupé quand elle doit agir ; pas de vérification de ses commits au fil de l'eau
    (au déploiement seulement) ; réponses courtes ; les jetons vont aux correcteurs et aux tests.
11. Accord reçu → la session qui l'a reçu agit elle-même, sans le relayer : « Le temps perdu alors que j'ai donné explicitement mon
    autorisation .. » (08.11). Retenir ses consignes : « Fait en sorte de retenir correctement mes informations » (08.11) → cette liste,
    recopiée dans chaque brief d'agent de test.

Créé le 07.11.2026, 18:38. Base de référence : HEAD `065a3102`, branche `claude/refonte-houblons-v4`.
États : ouverte / en cours / faite. « Preuve » = dernière trace lue, avec sa date.

## Périmètre en vigueur

- **En cours (08.11)** : en ligne `65d3c645` (déployé par le monitoring). Critique Fable dans son Chrome : tous les actionneurs de tous
  les écrans sur ZZ TEST (`2026-11-08-test-en-ligne-ecrans/RAPPORT.md`). Banc Opus local : tous les écrans (`2026-11-08-banc-tous-ecrans/
  RAPPORT.md`). Pilote : preuves locales n° 33, 34, puis corrections au fil des deux rapports. Ensuite : doublons, 13 pièces, ZZ TEST retirés.
- **Ancien (07.11, fait)** : reprise de D381, `work/missions/2026-11-03-lecture-longue/PLAN.md` ; découpe F hors déploiement.
- **Fichiers du périmètre D381** : `src/services/decoupe*.ts`, `src/services/decoupePerspective*.ts`, `src/vendor/opencv-5.0.0/`, `firebase.json`
  (règle CSP du worker seule), `functions/src/invoiceMorceaux.ts`, `functions/src/invoiceControls.ts`, `src/ui/depense/confiance.ts`,
  `tests/unit/depense/d381/`, `work/missions/2026-11-03-lecture-longue/`, `scripts/check-invoice-journey-emulator.mjs`.
- **Interdits** (jamais touchés ni commités) : `.codex/hooks.json`, `source4-portable-bundle-manifest-01.json`, `functions/.env`,
  `firestore.rules`, `.firebaserc` (absent du dépôt).
- **Sources du périmètre** : PLAN.md (mission), `v4/SPEC-BRASSEUR.md`, `CLAUDE.md` (déploiement, push, données réelles : accord du brasseur requis).

## Sale déjà là avant la reprise (à ne pas commiter avec D381)

Constat par date de modification (mtime) au 07.11 18:38 : ces fichiers datent d'avant le 03.11 ; ils ne viennent pas de la voie OpenCV.
- **Interdits modifiés** : `.codex/hooks.json` (mtime 04.10), `source4-portable-bundle-manifest-01.json` (01.11). Ne jamais les inclure dans un commit.
- Hors mission : `scripts/eval-hop/k1-*` et `tests/unit/hopIndexV4/fraisT3.test.ts` (31.10), `src/data/hopSources/beeranalytics-*.json` (51 fichiers, 27.10),
  `.../p4b-commun/mesurer-loupe.mjs` (24.10), 2 `GATES.md` d'essai-voies (03.11 08:12, à vérifier), ~25 PNG de `2026-10-31-ecran-fermentescibles`,
  dossiers non suivis de `work/missions/2026-10-25…` et `2026-10-31-ecran-depense/…`.
- Dans le périmètre D381 et non commité : voir tâches 1 à 8.

## Tâches

### A. D381 — 8 points ouverts (PLAN.md, « Reprise du 03.11, nuit »)

| # | Tâche | État | Dernière preuve |
|---|-------|------|-----------------|
| 1 | Jouer OpenCV v3 sur les 200 pièces et sur une graine neuve (`generer.mjs <dossier> --hasard 200 --graine 2`, tirage arrêté avant la fin) ; juger F et OpenCV sur pièces neuves (biais L20) | ouverte | v3 : 19 pièces dures seulement (30 silencieuses, 37 perdues) ; v2 sur 200 : 97 contre 82 pour F (PLAN, 03.11 nuit) |
| 2 | « Papier couché » : 18 pièces debout refusées (coins ou tri) | ouverte | PLAN : « à comprendre » |
| 3 | Brancher `sansOmbre` (option `fond` du rendu gris) et le mesurer contre la soustraction actuelle (h0023, h0062) | ouverte | écrit, non branché, non mesuré (PLAN) |
| 4 | Lignes perdues du repli (h0065, h0101) | ouverte | 82 perdues sur 200 (v2) ; h0065 : 37 (v3) |
| 5 | Issue « document illisible, saisie à la main ou meilleure photo » quand aucune voie ne garantit | ouverte | non commencé (PLAN) ; règle du brasseur : au pire signalé |
| 6 | Vitest d381 à mettre à jour (`planifierImage` asynchrone, `encreDetaillee(…, papier)`, `normaliser` à bord étendu), à rejouer | ouverte | dernier vert connu : 133 tests, variante F (PLAN 03.11 soir) ; `client-encre.test.ts` modifié, non rejoué depuis |
| 7 | Indices de coupables (`invoiceControls.ts`, `confiance.ts`) : tests, puis commit | ouverte | non commités, sans tests (PLAN) ; mtime 03.11 07:12 et 07:13 |
| 8 | Déploiement, relectures en ligne de ses 13 pièces et 5 tickets, contrôle visuel | ouverte | rien fait ; déploiement = accord du brasseur requis |

Risques liés : code OpenCV **non commité** (`decoupe.ts`, `decoupePerspective.ts`, `decoupePerspective.worker.ts`, `src/vendor/opencv-5.0.0/` 13,3 Mo, `firebase.json`,
banc `harnais.ts`/`controler.mjs`) ; **rien déployé** ; voie OpenCV coupée par défaut (`opencv: true` au banc seulement) ; le commit `065a3102` ne contient que la leçon L29 et les registres.

### B. Autres tâches nommées par la pilote

| # | Tâche | État | Dernière preuve |
|---|-------|------|-----------------|
| 9 | D376 : sous-familles des malts, houblons, levures — choix neuf à montrer en mini maquettes (artefact neuf) | ouverte, non commencée | decisions.md D375/377 : « Non ne commence pas ça » (brasseur, 03.11) ; ne pas commencer sans sa demande |
| 10 | Question au brasseur : trous de stock, cas B et C | ouverte, sans réponse | PLAN.md ligne 103 ; aucune réponse trouvée dans decisions.md (D372 à D381) |

### C. Tirées de decisions.md (D372 à D381)

| # | Tâche | État | Dernière preuve |
|---|-------|------|-----------------|
| 11 | D378 (familles pliables) et D379 (aucune ligne jetée, `LIGNES_MAX` 10 000) : « à déployer » | ouverte | commit `9474f3b8` dans HEAD ; aucun déploiement lu après D377 (e23fe7c8) |
| 12 | D375, D377 (TVA offerte, total de bande rouge) : « non vu au banc (vision) faute de contexte, à regarder au prochain tour » | ouverte | decisions.md ligne 1842 |
| 13 | D380/D381 : lecture par morceaux côté serveur et délais (3,8 à 45 s, lecture 100 s, client 150 s) adaptés aux morceaux ; plafond de 4 pages levé pour un PDF lu par pages | à vérifier (D381 a décidé et codé en partie, commits 3fd9cf56, 202506bb) | decisions.md D380 « À construire » ; état réel dans le code non relu |

### D. Tirées de registre.md (indices datés du 22 au 25.10 : à confirmer avant d'agir)

| # | Tâche | État | Dernière preuve |
|---|-------|------|-----------------|
| 14 | Choix ouverts du brasseur à montrer en variantes (L24, ne bloquent pas) : carte des outils, radar de Comparer, base de comparaison, Substituer (#145), levure, descripteurs hors familles, Dryhopper (#146), l8 ou l5, conventions du moteur, D121 A/B/C, appui long D112, liste de la fiche D115 | ouverte (registre non mis à jour depuis le 25.10) | registre.md « En attente de ses choix » |
| 15 | Intégration houblons dans l'app, épopée #159 (porte B ouverte le 24.10, D64) | état inconnu, mission `2026-10-25-integration-houblons` | registre.md ; non vérifié ici |
| 16 | R4 : clé API Gemini en clair dans d'anciens journaux ; révocation recommandée au brasseur | ouverte | registre.md, risque R4 (action externe : attend son accord) |

## Priorités (3)

1. **Mettre à l'abri le code OpenCV non commité** (risque de perte) : commit par chemins du périmètre D381 seulement, après tests (tâches 6 et 7). Accord du brasseur : pas de push.
2. **Tâche 1 + 6** : rejouer vitest d381 puis v3 sur pièces neuves (graine 2) : seule façon de savoir si OpenCV bat la variante F (sa question du 03.11).
3. **Tâche 10** : relancer le brasseur sur les trous de stock (cas B et C), la seule question restée sans réponse.

## File envoyée à la pilote (07.11), sans attente de l'utilisateur

Doute impossible à trancher : on l'écrit ici, puis on passe à la tâche suivante.

| # | Tâche | État |
|---|-------|------|
| A1 | Tests d381 mis à jour et rejoués, dossier Dépense (62 échecs anciens, aucun nouveau), tests des coupables | en cours |
| A2 | OpenCV v3 contre F : sur les 200 et sur la graine 2 neuve (0 silencieux, 0 perdue, ≤ 1 s) | ouverte |
| A3 | sansOmbre mesuré (h0023, h0062) ; papier couché (18) ; lignes perdues h0065, h0101 | ouverte |
| A4 | Issue « document illisible, saisie à la main ou meilleure photo » branchée et vue | ouverte |
| A5 | 13 pièces et 5 tickets dans l'app en local, champ par champ, avec le temps | ouverte |
| A6 | npm test et build verts ; commit par chemins (sans les interdits ni le sale ancien) | ouverte |
| B1 | Test UI Fermentescibles (malt, sucre, fruit, moments) : vraies images, états, gestes, 2 thèmes, 390 tactile et 1280, côte à côte avec sa maquette. Fait par le critique indépendant (Fable), lancé par le monitoring, sur un build figé ; rapport dans os.tmpdir()/affinee-test-ferm/RAPPORT.md | en cours |
| B2 | Test UI Dépense D372 à D379 et import D381, même méthode, même critique indépendant, après A6 | ouverte |
| C1 | Chaque problème : ligne DEFAUTS, contrôle rouge sur l'actuel, correctif, rejeu (L13) | ouverte |
| C2 | Bug passé à travers une passe : geste ou état ajouté à la checklist du banc, rejeu | ouverte |
| D | D375 et D377 regardés au banc | ouverte |
| E | Commits par lot ; une seule demande groupée : déploiement de D378, D379, D381 et des correctifs UI, Gemini facturé si besoin | ouverte |
| — | Hors file : D376 (« Non ne commence pas ça »), choix houblons du registre, R4 | en attente de sa demande |

## Passe en ligne (07.11, monitoring, Chrome du brasseur, ~500 px, recette « neipa v3 », lecture seule voulue)

| n° | Où, thème | Problème | Gravité |
|----|-----------|----------|---------|
| L1 | Éditeur, Malts/sucres, sombre | La pastille « empâtage ⌄ » a un chevron de menu, mais un toucher change le moment (→ « ébullition ») sans menu ; « Annuler » disparaît en ≈ 1 s. Modification involontaire. | bloquant |
| L2 | Brassins › Recettes, clair | Pastilles de style (Weissbier, Double IPA…) : texte blanc sur pastel, illisible | gênant |
| L3 | Fiche recette | FG et ABV sans chiffre : « plage dans la conduite de levure » | gênant |
| L4 | Fiche ↔ éditeur | OG 1.081 (fiche, alerte) contre 1,080 (en-tête) ; point et virgule mêlés sur un même écran (1.081, 71.8 % / 1,080) | gênant |
| L5 | Fiche, éditeur | Un même écran porte trois noms : « Grain », « Malts/sucres », « Fermentescibles » | détail |
| L6 | Fiche, éditeur | Bouton + flottant sur le texte de « Temps et conduite », collé à « Suivant » | gênant |
| L7 | Malts/sucres, sombre | Le repère de l'OG barre son chiffre « ~1,080 » | détail |
| L8 | Malts/sucres, sombre | Ligne sélectionnée : « empâtage » gris sur olive, contraste faible | gênant |
| L9 | Champ d'ajout | Bascule Grain → Sucre → « Lactose » : le type prend le nom d'un produit ; en Sucre, seul Lactose est proposé (à vérifier contre le stock) | à vérifier |

**Brouillon laissé** : dans l'onglet de test, Flocons d'Avoine est passé en « ébullition » (non enregistré, bouton « Abandonner » visible). Le brasseur doit toucher « Abandonner » dans cet onglet. Un second geste de remise en état a été refusé par le garde-fou.

**Méthode adaptée** : en ligne, on ne fait que regarder et ouvrir (aucun geste sur une pastille, une bascule ou un champ, parce qu'un seul toucher peut écrire). Les gestes qui écrivent se jouent sur le build local. Nouveau contrôle à écrire : toute pastille à chevron ouvre un menu et n'écrit jamais au premier toucher.

## B1 — rapport du critique (07.11) : 15 problèmes, 3 bloquants

Rapport complet : `%TEMP%/affinee-test-ferm/RAPPORT.md`, 148 captures dans `captures/`, banc réutilisable `serie.mjs` + `vite.ferm.config.mjs`
(à recopier dans la mission Fermentescibles avant que %TEMP% ne soit vidé). Build de dev de HEAD, 390 tactile et 1280, clair et cave.

| n° | Problème | Gravité | Traitement (C) |
|----|----------|---------|----------------|
| 1 | Pastille « empâtage ⌄ » : écrit au premier toucher, sans menu (L1) | bloquant | **Dans sa maquette s1** : règle n° 1 et L03 → ne pas corriger seul ; lui montrer en mini maquettes (garder le cycle sans chevron, menu, ou appui long) ; à ajouter à la demande groupée |
| 2 | Nom finissant par un chiffre : « Crystal 60 » → 60 kg | bloquant | corriger (`lireAjout` : masse seulement avec « kg » ou après un nom connu) |
| 3 | Un chiffre seul (« 0,2 ») crée un ingrédient « 0,2 » | bloquant | corriger (refuser un nom sans lettre) |
| 4 | « dext » en Grain propose Carapils, pas Dextrose du rayon Sucre | gênant | corriger |
| 5 | Couleur 2000 (hors 1–1500) avalée en silence | gênant | corriger (`aria-invalid`, le champ reste) |
| 6 | Deux retraits de suite : le premier est perdu sans « Annuler » | gênant | corriger |
| 7 | « + » flottant sur le plateau, « kg », la piste, l'alerte (L6) | gênant | corriger |
| 8 | Sombre : « empâtage » gris sur olive (L8) | gênant | corriger (contraste ≥ 4,5) |
| 9 | Fruit, curseur J+ au bout : focus et étiquette barrent « J0 J7 J14 » | gênant | corriger |
| 10 | Trois noms pour un écran ; « Nouvelle recette » à 1280 (L5) | détail | corriger (un nom : celui de sa maquette) |
| 11 | La famille s'appelle « Lactose » (L9) | détail | corriger si sa maquette ne le montre pas, sinon montrer |
| 12 | 99999 ramené à 10 000 sans rien dire ; 3 décimales au bandeau ; piste à 15 000 noire de graduations | détail | corriger |
| 13 | Bascule « Grain ⇄ » : cinq familles à l'aveugle | détail | même traitement que le n° 1 (sa maquette) |
| 14 | Rechargement : la recette en cours n'est pas reprise | détail | vérifier la reprise du brouillon, puis corriger |
| 15 | Pied « Retour/Suivant » hors écran à 1280 (sa maquette fait de même) | détail | lui montrer |

L2, L3, L4, L7 : non rejouables sans données en local ; L2 et L3 restent des constats en ligne (captures du monitoring), L4 et L7 à rejouer
avec une fixture qui porte un PPG sur chaque malt. **Méthode manquante** (à ajouter au banc) : clavier mobile réel (`&keyboard=300`), stock
réel du brasseur en lecture seule, fixture PPG complète, noms finissant par un chiffre, chiffre seul, deux retraits, valeur hors plage,
curseur au bout, toute pastille ou bascule touchée, glisser sur la piste du plateau.

## B2 — rapport du critique Dépense (07.11) : 20 problèmes, 3 bloquants

Rapport complet : `%TEMP%/affinee-test-b2/RAPPORT.md` (48 captures au repos, gestes dans `gestes/`). Couverture : 12 états au repos,
4 combinaisons ; gestes complets sur l'état 3 et `difficile` seulement ; **aucune vraie pièce** (fixture `lecture`) ; Confirmer, ordre
Papier, Rattacher et 13 états hors périmètre non joués.

| n° | Problème | Gravité | Traitement |
|----|----------|---------|------------|
| 1 | Badge « 7 +5 ↳ » sur 3 lignes à 390 : recouvre la 1ʳᵉ rangée | bloquant | corriger |
| 2 | Aller-retour Kg → g → Kg : prix lu effacé, D373 non appliquée ; retaper la quantité efface le montant | bloquant | corriger |
| 3 | Case g : « 2 Kg » devient « 2 g », stock « 1 → 1,002 Kg » | bloquant | à lui montrer (convertir ou vider) ; en attendant, jamais le nombre gardé sous une autre unité |
| 4 | Montant de bande coupé au bord droit (403 px pour 390) | moyen | corriger |
| 5 | Toucher « Kg » actif : passe en « kg » minuscule | faible | corriger |
| 6 | Prix calculé « 3,3333 » (4 décimales), la rangée passe à la ligne | faible | à lui montrer |
| 7 | Quantité modifiée : la mouture rattachée part en silence, bande « Services · 2 Kg » | moyen | corriger |
| 8 | « Garder » ne referme pas la ligne (D374) | moyen | corriger |
| 9 | Bande d'une ligne : ni chevron ni pli (« on peut toujours pas fermé les famille ») ; point mal aligné | moyen | corriger |
| 10 | `renovation` : « Plié » allumé à l'arrivée, 13/16 lignes cachées | faible | à lui montrer |
| 11 | « supprimer » sans annulation | moyen | à lui montrer (pu4d sans retour) |
| 12 | Libellé > 30 caractères tronqué en silence | moyen | corriger |
| 13 | −1 → 0 en silence, « abc » → vide, prix 99999999 accepté | faible | à lui montrer |
| 14 | Prix « 0,04 » au champ, « 0,040 » à la rangée | faible | corriger |
| 15 | « Somme = imprimé » sur 2 ou 3 lignes à 390 | faible | corriger |
| 16 | Sous-rangée « stock : … ⇄ » sur 3 lignes | faible | corriger |
| 17 | Lecture échouée : « Articles · 1 » sans article lu | faible | corriger |
| 18 | Ligne ajoutée : neuf marques rouges (cockpit) | faible | à lui montrer |
| 19 | `<select>` natif visible dans le pied du plateau (D364 : sous « plus ») | faible | à lui montrer |
| 20 | `difficile` : « Réessaie » puis « Relire » ; Relire ne dit pas qu'il reprend par morceaux | faible | à lui montrer |

Méthode manquante (à verser au workflow) : mesure par élément (bord droit, hauteur de badge, chevauchement) ; invariance
aller-retour de chaque bascule ; format des nombres rendus ; vraie pièce et réponse rejouée dans le banc ; état brouillon pour le
rechargement ; sélecteurs documentés (textarea, aria-label « Quantité ligne N »).

## État au 07.11, soir (tableau de bord)

| Tâche | État | Preuve |
|-------|------|--------|
| Import D381 (étape A) | faite ; découpe F hors déploiement | `dd5cf826`, `70355b2c` |
| Fermentescibles B1 : n° 2-9, 12, 14 | faits | `5d3b118a`, `bf35d73a`, `b2577be6` |
| Fermentescibles n° 1, 10, 11, 13, 15 et N3 | faits (bugs corrigés, pas montrés) | `bc9e084c` |
| D375 / D377 vus au banc | faite | `ed320275` |
| Critique sur l'app déployée (vraies données en lecture, gestes sur « ZZ TEST ») | faite en lecture : 51 problèmes ; gestes ZZ TEST et 1280 après déploiement | `work/missions/2026-11-07-test-en-ligne/RAPPORT.md` |
| Dépense B2 : n° 1, 2, 4, 5, 8, 9, 14-17 ; garde-fou n° 3 | faits ; n° 12 classé (libellé de 33 caractères entier au DOM et à la capture, preuve indépendante) | `c4c36583` |
| Fermentescibles N1, N2, N4 (refus), N5, N6, N7 | faits ; N3 et N4 à montrer | `69239d86` |
| Correction d'un faux vert : Dépense 2 365 verts et 60 échecs, les mêmes avant et après (27 fichiers non chargés jusque-là) | noté, L11 complétée | `b9a76674` |
| Banc d'actionneurs : mutation à l'aveugle | faite : 4/7 mutants aveugles tués ; WORKFLOW.md révisé (app déployée = étape principale) | `2026-11-07-banc-actionneurs/RESULTAT.md` |
| Capture-recapture sur un écran neuf (critique et banc à l'aveugle) | ouverte : seule mesure honnête du workflow, pas encore faite | WORKFLOW.md § Mesurer |
| Défauts trouvés en ligne → correctifs (lot C) | faits, Chrome rouge puis vert ; inchangés par décision : n° 10, 16, 18, 30, 48 (non reproduit) ; sans preuve Chrome faute de fixture : n° 13, 15, 49 | `19a0d538`, `22a89d5f`, `8619459b`, `4c94b726`, `605a3bc3` |
| Dépense B2 n° 3, 6, 7, 10, 11, 13, 18-20 (ex « à montrer ») | faits | `5cf2f99d` |
| Journal compté deux fois (Brau-Rauchshop) | doublon de DONNÉES confirmé en lecture (B-001 à B-026, facture 372765, commande 686863) ; retrait à son accord | `79cf1ee2` |
| Nettoyage des données ZZ TEST | ouverte, son accord (demande groupée finale) | — |
| Brouillon du monitoring sur « neipa v3 » (Flocons d'Avoine en « ébullition », jamais enregistré) | bloqué par le garde-fou ; boîte « Supprimer ce brouillon ? » ouverte dans l'onglet du monitoring | va dans la demande groupée finale |
| Demande groupée (déploiement, D381 tel quel, doublon du journal, brouillons, ZZ TEST) | envoyée au brasseur par la pilote ; attend son accord | — |
| Hors file : D376, choix houblons, R4 | en attente de sa demande | — |

À surveiller : `src/data/hopSources/beeranalytics-*.json` (51, sale ancien) et `src/ui/finance/DriveConnection.tsx` (N7, hors Dépense) :
ne pas les commiter avec Dépense par erreur.

## Journal du suivi

- 08.11 — branche Finances FUSIONNÉE par la pilote (636586c7, 75db3975 ancêtre vérifié). Le brasseur, dans le fil de la pilote : « Le
  relais de l'autre branche suffit.... » → un accord relayé mot pour mot par le monitoring vaut accord ([[autonomie-decisions]],
  e6926163). Pilote : suite complète, captures AM 8, AM 10, RF-3, RF-8, puis déploiement hébergement + aiTask (invoice-v6).

- 08.11 — le brasseur, dans le fil du monitoring, à « Lui dis-tu oui maintenant (fusion de la branche Finances) ? » : « Oui ».
  Transmis mot pour mot à la pilote (branche worktree-agent-ae8718fc1eef3067e, 75db3975).

- 08.11 — rejeu en ligne de bfc17095 (critique, Chrome du brasseur, ZZ TEST, stock réel inchangé) : vérifiés M-1, TE-16, M-2, AM-12,
  AM-13, PI-NOTE-1, AM-34, AM-35 ; AM-39 rouvert (RJ-2 B : « Garder cette valeur » enregistre OG −5) ; PI-5 écarté (non reproduit).
  15 RJ versés (2 B, 2 G), correcteur RJ lancé en worktree depuis 1424ec91. LT-2 vérifié en ligne par moi (doc21 → 07.11.2026, Gemini
  en test selon sa consigne, fermé par Abandonner) ; LT-5 D ajouté. 500 px impossible dans son Chrome → 390 tactile par puppeteer.
  BUGS OK : 466 bugs, 252 ouverts.

- 08.11 — branche Finances prête (75db3975, 1424ec91 fusionné dedans en 2f97fcaa, merge-tree propre, aucun interdit) : RF-2, 3, 6, 7, 8,
  10, 12, 18 « corrigé ». Correcteur CF : CF-1 à 5 commités (df2801d1, fffad64f, 6d43b298, be69de25, 788b432d), relancé pour CF-6 à 9
  et notes. Pilote prévenue ; fusion toujours suspendue au oui écrit du brasseur dans son fil. BUGS OK : 450 bugs, 237 ouverts.

- 08.11 — relecture indépendante de la branche Finances (relecteur Sonnet) : 4 fusionnables, 6 avec réserve, 0 à refaire ; 18 RF
  versés (source absolue dans %TEMP%) ; un conflit BatchDetailSheet.tsx ; RF-18 test rouge. LP-1 rouvert (divulgation seule). Correcteur
  Finances relancé sur RF-2, 3, 6, 7 (fusion de 1424ec91 dans sa branche), 8, 10, 12, 18. Contrôle-bugs : %TEMP% relatif résolu (bug du
  contrôle corrigé). BUGS OK : 450 bugs, 250 ouverts, 26 sources.

- 08.11 — pilote : DÉPLOYÉ aiTask 1424ec91 (LT-2, l'année à 4 chiffres l'emporte, puis la date plausible). LT-2 → « déployé » ; preuve
  en ligne (doc21, 07.11.2026) ajoutée à la passe du critique en ligne. Relecteur Finances relancé (limite de tours atteinte).

- 08.11 — pilote : DÉPLOYÉ bfc17095 (hébergement, index-CgZyiV2o.js vérifié servi ; aucune fonction changée depuis 92de7371).
  M-1, M-2, AM-12, AM-13, AM-34, AM-35, AM-39 → « déployé » ; EL-V1 (avis « Nouvelle version ») vérifié en ligne par la pilote ; PI-5
  ajouté (séparateur double, D). Lancé : rejeu en ligne par la vision sur ZZ TEST (TE-16, M-1/2, AM-12/13/34/35/39, PI-5, PI-NOTE-1,
  500 px, thème sombre) → `2026-11-08-rejeu-en-ligne/`. Pilote prend LT-2, TE-34, TE-42, TE-61 ; elle attend un oui écrit pour fusionner
  Finances et CF : ses mots d'accord lui ont été cités. BUGS OK : 432 bugs, 239 ouverts.

- 08.11 — correcteur Finances fini : LP-1 à 5 et LT-3 sur sa branche (984d3b40, 3cd676a7, 1788240e, 6c36a6e4, d477279e, 56953a64),
  registre « corrigé, à intégrer ». Preuves manquantes : AM 8 et AM 10 à l'image, LP et LT-3 sur les vraies pièces (à rejouer en ligne
  après déploiement). Pilote prévenue. BUGS OK : 431 bugs, 238 ouverts.

- 08.11 — contre-calcul fini (oracle réimplémenté, 240 comparaisons, 150 000 montants TVA) : 9 chiffres faux sur 27 grandeurs, 1 B
  (CF-1 : couleur des sucres ignorée, dubbel 22,3 EBC contre 38,9), + 2 notes (dextrose −10 %, taux d'impôt 25,2 resté en défaut,
  storage.ts:244). Justes : OG, FG, Plato, Tinseth, eau, TVA, impôt, coûts. Versé (CF, empreinte d8b06ee25bbf) ; correcteur CF lancé en
  worktree (auteur). Pilote bfc17095 (AM 4, 5) → AM-34, AM-35, AM-39 « corrigé ». BUGS OK : 431 bugs, 244 ouverts.
  LEÇON PROPOSÉE : un contre-calcul prend la méthode officielle (ASBC/Balling pour l'ABV), pas la variante la plus citée (Hall diverge
  au-delà de 1,070).

- 08.11 — pilote : 3 vrais tickets lus en ligne (1927152d), fermés sans Confirmer. Totaux justes (202,20 ; 51,80). LT-1 écarté confirmé
  en ligne. Nouveaux : LT-2 B (année 2025 retenue au lieu de 2026 → exercice clos ; pilote), LT-3 G (« 1 » pas lu en pièces ; correcteur
  Finances), LT-4 D (page figée > 60 s à l'allègement, à mesurer). BUGS OK : 420 bugs, 236 ouverts.

- 08.11 — critique en ligne fini : 64 constats sur 26 écrans, 4 B (TE-16 malt J+3 IBU 40→82, TE-34 écran non chargé après déploiement,
  TE-42 étapes 5/9 contre 1/9, TE-61 « Saisie au nom de » sans confirmation), versés (TE, empreinte posée). Correcteur Finances fini sur
  `worktree-agent-ae8718fc1eef3067e` : 8986b909, 351af757, 2498e4eb, 67dda3d9 → AM-37, AM-38, AM-52, AM-65, TR-NOTE-1 « corrigé »
  (à intégrer). BUGS OK : 417 bugs, 233 ouverts. Pilote prévenu : Chrome libre, branche à intégrer, 6 ZZ TEST à retirer, 3 vrais tickets
  à lire, 500 px et thème sombre jamais vus en ligne. Restent : banc tous écrans (BT), contre-calcul (CF), LP-1 à 5.

- 08.11 — capture-recapture audit (AM) contre regard (MV), périmètre commun : n1 = 43, n2 = 34, m = 19 (dédoublonné) → N ≈ 76
  (IC 60–92), restants ≈ 18 (11 à 40) ; genres « calcul faux » et « libellé » : m = 0, donc les plus cachés et l'estimation y est
  aveugle. 30 MV marqués doublons au registre (200 ouverts). Lancé : troisième méthode, contre-calcul indépendant (Opus, oracle par
  réimplémentation, `2026-11-08-contre-calcul/`), à verser au registre (préfixe CF). Première mesure honnête du workflow : faite.

- 08.11 — erreur du monitoring : doc17 à doc20, copiés comme « ses tickets Bauhaus », sont des MONTAGES (haut d'un vrai ticket brouillé,
  bas ajouté, EAN fictifs 7612345678901…, total 352,05 incohérent) : fixtures de stress de la session D381. Je les avais jugés sur une
  planche de miniatures de 98 px. Renommés `fixture-montage-0311-*.jpg` dans H13-reels (rien supprimé). Ses vrais tickets : doc15 et doc16
  (même ticket du 02.11, TWINT 202,20), doc21 (07.11, 51,80) ; vérité croisée `H13-reels/cas-6.json` (pilote, deux lecteurs à l'aveugle).
  LEÇON PROPOSÉE (L28) : une pièce « réelle » se vérifie en plein format avant d'entrer au banc ; une miniature ne prouve pas l'origine.

- 08.11 — pilote : 26/26 doublons annulés par l'app (son accord écrit dans le fil de la pilote), paiement 13,80 contre-passé
  (CONTRE-PAI-d5b16e0b), 372765 intacte, journal du 27.04 = 1 opération −110,40 (`96acd0fe`) → TL-35 « vérifié ». 60 tests Dépense
  rouges réécrits (`d146dc29`, 2 434 verts), régression réelle trouvée (focus « Unité à préciser ») → DP-1 ; `perf.test.ts` instable → DP-NOTE-1.
  ALERTE PUSH : `346d3625` et `96acd0fe` ont commité des captures de vraies données (IBAN, journal) ; retirées du suivi (`5bbdc385`) mais
  présentes dans l'historique local : purge obligatoire avant tout push (accord du brasseur pour réécrire l'historique). Le contrôle
  accepte maintenant une source déclarée en toutes lettres (message d'une session).

- 08.11 — pilote : mécanisme commité (`725f563e` : contrôle, hook Stop, BUGS.md, leçons L05 et L14) ; `68828a00` : DEPLOIEMENT.md corrigé
  (F en ligne). Règle BUGS.md hors CLAUDE.md (plafond 30 000 caractères), dans L05. Ses tickets Bauhaus retrouvés (uploads D381 du 03.11)
  et copiés hors Git : `H13-reels/doc15` à `doc20` + `doc21` (ticket métal du 07.11). Lecture en ligne confiée à la pilote. MV versé
  (34), « BUGS OK » : 349 lignes, 209 ouvertes.

- 08.11 — pilote : a redéployé avec l'accord du brasseur dans son fil : hébergement `1927152d` (index-CXIB813F.js, vérifié en ligne),
  aiTask `92de7371`, 39 fonctions `65d3c645` depuis le dépôt principal. Mon déploiement des fonctions venait de `%TEMP%\deploy-2bfe5dc3`,
  SANS `functions/.env` : erreur, corrigée par son redéploiement. Désormais la pilote seule déploie ; le monitoring vérifie le paquet servi.
  LEÇON PROPOSÉE : un seul déployeur ; fonctions toujours depuis le dépôt principal (functions/.env). 13 pièces relues en ligne : total
  juste 12/13 (la 13e à verser). Doublons : 1/26 annulé (MA0027) par « Annuler cette écriture » ; 24 restants refusés par l'outil
  (lot financier réel) ; B-001 bloqué par son paiement 13,80 (PAI-d5b16e0b) en doublon de PAY-6770960b. Son oui écrit dans le fil de la
  pilote est demandé. Commits `1927152d`, `38f75299` vérifiés : aucun fichier interdit.

- 08.11 — audit métier rendu : 73 absurdités (10 B, 46 G, 17 D), `2026-11-08-audit-metier/RAPPORT.md`, versé au registre (préfixe AM).
  Cause commune : pas de table famille × moment ; grain = un seul `kind`. B répartis : pilote AM 1, 2, 3, 4, 5, 9 ; correcteur Finances
  (agent auteur, worktree à part) AM 6, 7, 8, 10. Mécanisme anti-perte posé (contrôle + hook Stop), registre en construction.

- 08.11 — brasseur : « C'est exclus de rien du tout. Et qui va fixer tout ça ? Il faut pas perdre les bug finding. J'ai l'impression que
  c'est en partie ce qui c'est passé.... ». Vrai : des notes « non compté » ou « à suivre » n'ont jamais eu de suite (ex. facture déjà
  saisie non signalée à la lecture, RESULTAT TL ; couleur « 2,5 » affichée « 6,3 », banc N). Malt réintégré au critique métier. Registre
  UNIQUE lancé : `work/missions/BUGS.md` (tous rapports, notes comprises, état par bug, section « Perdus »), tenu par le monitoring.
  Correcteurs : la pilote (recette, Fermentescibles) ; un correcteur Finances/Dépense/lecture (agent auteur, worktree à part) dès que le
  registre existe ; la pilote intègre, le monitoring redéploie. Règle : un constat n'existe que s'il est au registre ; un rapport d'agent
  n'est fini qu'une fois versé au registre.

- 08.11 — brasseur : « Il y a d'autres cas comme ça, à toi de les trouver :) ». Deux inspections indépendantes des absurdités métier :
  audit du code (Opus, `2026-11-08-audit-metier/RAPPORT.md`) et regard brasseur à l'image (Fable, build dev `92de7371`, `?dev-local`
  enfin fonctionnel avec `NODE_ENV=development`, `%TEMP%/affinee-metier-vision/RAPPORT.md`), à l'aveugle l'un de l'autre → capture-
  recapture sur les absurdités. Commit pilote `92de7371` (total d'une facture lue en morceaux) vérifié : aucun fichier interdit.

- 08.11 — brasseur : « COMMENT CA A JAMAIS ÉTÉ FLAGGÉ ? JAI VU CA EN 2S ???? ». Cause, preuves à l'appui : le défaut a été VU trois fois et
  mal lu. (1) Le monitoring, 07.11, passe en ligne L1 : Flocons d'Avoine passé en « ébullition » d'un toucher, noté « écrit sans menu ».
  (2) Critique B1 n° 1 : « Weizenmalz passe en ébullition », noté geste involontaire. (3) Correctif bc9e084c : la pastille dit mieux son
  effet (⇄), donc le cycle malt → ébullition → fermentation a été renforcé. Personne n'a demandé : « un malt en ébullition, ça existe ? ».
  Causes : tests et critique jugent la mécanique et le visuel, pas le métier ; sa maquette s1 fait tourner le même moment pour tout
  fermentescible et la règle n° 1 l'a fait passer pour validé ; fixtures jamais lues comme un brasseur.
  LEÇON PROPOSÉE : chaque constat se relit avec la question du brasseur, « est-ce que ça existe en vrai ? », avant sa forme ; une maquette
  choisie ne valide pas une règle métier (un choix de forme, pas de brassage).

- 08.11 — brasseur : « Mais surtout niveau business ça fait aucun sens ??? ». Cause de fond : même pastille de moment et même curseur J+
  pour tout fermentescible, sans règle par famille. Pilote : J+ retiré des malts, moment par famille. Lancé : audit métier Opus de toute
  l'app (absurdités proposées, acceptées, comptées), `2026-11-08-audit-metier/RAPPORT.md`.

- 08.11 — BLOQUANT vu par le brasseur sur son téléphone, app déployée : « Donc le fait que on puisse mettre du malt après la fermentation,
  ça a pas posé de problème ???? ». Pilsner 1,8 kg à « fermentation » J+4, Caramünch 32,5 kg à J+3, comptés dans l'OG (1,290), sans alerte.
  Raté par B1, le banc, le test en ligne et le monitoring : les tests jugeaient la mécanique (le geste réagit), jamais le sens métier.
  Envoyé à la pilote (correctif, L13) ; critique en ligne et banc local : règles « sens métier » ajoutées (moment possible par famille,
  résultat plausible).
  LEÇON PROPOSÉE : un test d'interface juge aussi le sens métier de chaque choix proposé et de chaque résultat, comme le brasseur ; une
  combinaison impossible acceptée sans alerte est un bloquant.

- 08.11 — brasseur : « Je crois que l'autre session a déjà en train. De fixer ». Vrai : la pilote corrige la découpe (`jonctions.test.ts`,
  rouge puis vert, 103 tests de découpe). Partage : elle corrige et prouve au banc ; le monitoring déploie son commit puis passe ses vraies
  pièces et tickets en ligne. Demandé : commit, chiffres du banc, version à déployer, chemin des 5 tickets.

- 08.11 — brasseur : « Et ça marche bien maintenant la reconnaissance de ticket et long long facture ? ». Réponse honnête : non prouvé.
  En ligne : la découpe de base (202506bb), F non déployée (DEPLOIEMENT.md). Banc de 200 pièces neuves : base 3 coupes silencieuses,
  92 signalées, 6 lignes rognées ; F 24 silencieuses, 0 perdue, 0 rognée ; aucune ne passe. Ses 13 pièces (H13-reels, 20 fichiers) et
  5 tickets Bauhaus : jamais relus en ligne depuis. Son ticket du 07.11 (métal à reflets) : papier non trouvé, lu entier. Prochaine passe
  dans son Chrome, juste après le critique : import de chaque vraie pièce et ticket par Dépense, comparé champ par champ à la vérité
  (`H13-reels/cas*.json`, `verite-terrain.md`), temps mesuré, fermé sans Confirmer (vraies pièces). Budget Gemini cumulé : 8,65 CHF au journal.

- 08.11 — brasseur : « Continue les test n'attends pas d'input de ma part ». Navigateur intégré essayé pour les 26 doublons : non connecté
  (« Continuer avec Google »), fermé. Les gestes en ligne passent par son Chrome, l'un après l'autre : critique d'abord, puis annulation
  des doublons et relecture des 13 pièces. Banc local et critique tournent.

- 08.11 — DÉPLOYÉ `65d3c645` : hébergement (267 fichiers, index servi = `dist/index.html`) et 40 fonctions (aiTask, cleanupBreweryTransfers,
  applyBrewerProposal relancées après un 409 : « Deploy complete! »). Brasseur : « Pas de problème sur les autres écrans ??? » puis « est-ce
  que les actionneurs et tout ont bien été joués ??? ». Vérité : non. Actionneurs joués un à un seulement sur Fermentescibles (local) et en
  partie Dépense ; en ligne, lecture surtout ; Planning, Brassin en cours, Ventes, Clients, Tarifs, Fûts, Matériel, Eau, Houblons,
  Levures, Réglages jamais testés. Lancés : critique Fable en ligne sur ces écrans (`2026-11-08-test-en-ligne-ecrans/RAPPORT.md`) et banc
  d'actionneurs Opus sur TOUS les écrans en local (`2026-11-08-banc-tous-ecrans/RAPPORT.md`). Pilote : corriger au fil, je redéploie.
  LEÇON PROPOSÉE : un test d'interface n'est fini que si chaque écran du menu a ses actionneurs joués ; tenir la matrice écran × actionneurs
  × essais, et dire « non couvert » plutôt que « testé » quand on n'a fait que regarder.

- 08.11 — copie de secours des 26 doublons et du paiement lié (`PAI-d5b16e0b…`, 13,80) : `2026-11-07-test-en-ligne/doublons-B001-B026-copie.json`.
  Builds `65d3c645` verts (app, fonctions, aucune trace de dev-local). Premier `firebase deploy` non lancé : CLI absente du PATH ;
  relancé par `npx --no-install firebase` (15.29.0).

- 08.11 — brasseur : « Le temps perdu alors que j'ai donné explicitement mon autorisation .. ». Erreur du monitoring : l'accord était
  écrit dans MON fil ; je l'ai relayé au lieu d'agir, et la pilote, à juste titre, ne pouvait pas s'en servir. Le monitoring déploie donc
  lui-même `65d3c645` depuis `%TEMP%\deploy-2bfe5dc3` (build refait, journal `%TEMP%\affinee-capture-recapture\deploy-65d3c645.log`).
  LEÇON PROPOSÉE : l'accord vaut dans la session qui l'a reçu ; c'est elle qui fait le geste, jamais un relais vers une autre session.

- 08.11 — pilote : n° 13, 15, 49 prouvés dans Chrome (rouge puis vert) ; 2 défauts neufs corrigés (« 24.012 L », pastille Stock) ;
  déploiement prêt (`DEPLOIEMENT.md`, build vert sur 2bfe5dc3). Commits `3db67392`, `2bfe5dc3`, `679a7ef0` vérifiés : aucun fichier
  interdit. Déploiement NON lancé : la pilote veut l'accord du brasseur dans son propre fil (un relais n'est pas un accord) — juste.

- 08.11 — brasseur, sur les 26 écritures en double : « Retir. ». Relayé à la pilote : après le déploiement, copie de secours lisible
  d'abord, retrait par la voie de l'app, facture 372765 intacte, journal et totaux relus en ligne.

- 08.11 — brasseur : « N'attends pas mon accord pour déployer, tu dois itérer dessus en fixant les bugs ??? » ; relecture Gemini des
  13 pièces : « oui Normal, ça fait partie des test ». Relayé mot pour mot à la pilote : déployer, relire les 13 pièces, gestes ZZ TEST,
  corriger et redéployer en boucle. Reste à son oui : retrait des 26 écritures en double. — « Les Screens levure seront à refaire, ne
  passe pas de temps dessus » : banc et critique Levure arrêtés. Capture-recapture reportée sur Dépense (B2 jamais mesuré), après le
  déploiement : banc sur le build du commit déployé, critique à l'aveugle sur l'app déployée. Piège noté : `vite build --mode development`
  ne suffit pas, `?dev-local` exige `import.meta.env.DEV` → construire avec `NODE_ENV=development` (sinon écran « Continuer avec Google »).

- 08.11 — brasseur : « Pourquoi tu attends mon accord ??? ». Erreur du monitoring : je me suis arrêté sur la demande groupée. Seuls le
  déploiement et le retrait des 26 écritures en double attendent son oui (CLAUDE.md : déploiement, données réelles, suppression). Relancé
  aussitôt : pilote → preuves Chrome locales n° 13, 15, 49 et déploiement prêt en une commande, sans la relecture Gemini facturée ;
  monitoring → capture-recapture sur Levure (build HEAD dans `%TEMP%/affinee-capture-recapture/`).
  LEÇON PROPOSÉE : « regroupés sans bloquer » veut dire que tout le travail non bloqué continue pendant qu'une demande attend.

- 07.11, nuit — lot C fini (pilote). Commits vérifiés `bc9e084c` à `605a3bc3` : aucun fichier interdit, aucun sale ancien
  (beeranalytics, hooks.json, manifeste, DriveConnection). `scripts/check-invoice-journey-emulator.mjs` modifié non commité : sale
  D381 du 03.11, déjà listé. Demande groupée E envoyée au brasseur. Suite : après son accord et le déploiement, gestes ZZ TEST en ligne
  et passe 1280 ; puis capture-recapture sur un écran neuf. À vérifier en ligne : n° 13, 15, 49 (sans preuve Chrome).

- 07.11 ≈ 21:45 — test en ligne rendu : 51 problèmes, 6 bloquants (OG 1,094/1,085, FG 1.024/1,021, IBU liste ≠ fiche, état d'une recette
  qui fuit dans la suivante, facture Brau-Rauchshop comptée deux fois au journal, unité qui efface le prix). 500 × 805 et deux thèmes ;
  1280 non vu ; aucune donnée écrite. Recette ZZ TEST impossible : « Nouvelle recette » rouvre un brouillon déjà là (Saaz, Houblons 3/7),
  pas touché. Les gestes d'écriture se joueront sur l'app déployée APRÈS le déploiement des correctifs. Rapport passé à la pilote :
  tri contre les correctifs faits, diagnostic du doublon en lecture seule, puis correctifs.

- 07.11 21:27 — pilote : 16 points « à montrer » en cours de correction (BrewWizard, PageShell, Dépense, Fermentescibles, ChampNombre
  neuf ; non commités). Critique en ligne : RAPPORT.md vide depuis 20:57 (Chrome plafonné à 500 px) ; relancé pour écrire au fil.

- 07.11 — brasseur : « Pas besoin de mini maquettes si c'est vraiment un bug, ou problème visuel. Juste régaler le problème... ». Concepteur
  arrêté ; tous les « à montrer » (B1 n° 1, 10, 11, 13, 15 ; N3 ; B2 n° 3, 6, 7, 10, 11, 13, 18-20) passent en correctifs, au plus près
  de sa maquette. Mini maquettes seulement pour un vrai choix de goût.
  LEÇON PROPOSÉE (L03, L24) : un bug ou un défaut visuel présent dans sa maquette se corrige, au plus près d'elle ; la règle n° 1 protège
  ses choix, elle ne fait pas d'un bug un choix à lui montrer.

- 07.11 — **accord du brasseur** : « Non non justement il doit! Juste faire ça sur des données de test, flaggé comme telle ». Le critique en
  ligne joue tous les gestes qui écrivent sur des données « ZZ TEST — … » créées dans l'app déployée (recette de test enregistrable ;
  facture de test saisie à la main, jamais confirmée ni enregistrée) ; liste des objets créés dans son RAPPORT.md, à nettoyer avec son
  accord (une suppression attend son accord). Toujours interdits : vraies données, import photo/PDF (Gemini), Préparer un brassin.

- 07.11 — brasseur : « Faire les test sur la vrai app déployé, je l'ai expressément demandé !!! ». Faute du monitoring : B1, B2 et le banc
  ont été menés en local sur des fixtures, après sa demande du test en ligne. Correction : un critique Fable teste l'app déployée en lecture
  seule dans son Chrome (rapport : `work/missions/2026-11-07-test-en-ligne/RAPPORT.md`) ; le banc local n'est plus qu'un filtre. Les gestes
  qui écrivent attendent son accord pour une recette et une facture de test en production.
  LEÇON PROPOSÉE (L01, L28) : « la vraie app » veut dire l'app déployée et ses vraies données ; le local n'en est qu'un filtre. Ne jamais
  remplacer un lieu de test qu'il a nommé par un autre, plus commode.

- 07.11 — brasseur : « Justement nous on doit trouver des bugs là où on sait pas. Et 15 semble encore sous évalué. Comment on peut avoir un
  encore moins bon workflow que ce que on avait ???? ». Fait mesuré : critique seul 15 ; critique et banc ensemble 22 distincts sur
  Fermentescibles (15 + 7 nouveaux). L'ensemble trouve plus, mais la mesure présentée (12/15 connus) était la mauvaise. Le sous-agent est
  recadré : bugs inconnus sur un écran neuf, capture-recapture (deux testeurs à l'aveugle), étude des vraies données en copie locale.
  LEÇON PROPOSÉE : un workflow de test se mesure aux défauts inconnus qu'il trouve et à l'estimation de ce qui reste (capture-recapture,
  deux testeurs indépendants), jamais au taux de bugs déjà connus. Un testeur à qui l'on donne la liste des bugs n'est plus un
  testeur : la mesure est biaisée (L20). Erreur du monitoring : B1 et B2 transmis au banc pendant sa mesure.

- 07.11 20:30 — `ed320275` : D375 et D377 vus au banc (tâche D faite). `b2577be6` : Fermentescibles n° 7 (+ ne couvre plus le bas de page)
  et n° 14 (rechargement) corrigés. B2 Dépense en cours chez la pilote (Liste, Plateau, Recap, calculPlateau… modifiés, non commités).
  Banc d'actionneurs, intermédiaire : connus B1 12/15, faux positifs 35 % (17 groupes regardés), **7 défauts nouveaux** sur Fermentescibles
  (N1 bloquant : double toucher sur la corbeille = deux retraits, un seul rendu). N1 à N7 passés à la pilote (N1 à rejouer sur b2577be6,
  N2, N5, N6, N7 à corriger, N3, N4 à lui montrer). Mutation et passe Dépense du banc en cours.

- 07.11 20:10 — sous-agent du workflow (Opus max) arrêté à 120 tours : DIAGNOSTIC.md, WORKFLOW.md, MISSION.md écrits ; passe sur HEAD :
  2 970 essais, 533 états, 1 097 s, 1 504 constats bruts non triés ; mutation non lancée. Relancé (40 tours) : mutation, tri, faux
  positifs, détection des bugs connus (B1 + B2 = 35), défauts nouveaux.

- 07.11 — `70355b2c` : critère des zébrures corrigé ; remesure sur la graine 2 : F 24 silencieuses, 0 perdue, 0 rognée, ≈ 1,2 s ; base
  `202506bb` 3 silencieuses, 92 signalées, 6 rognées, ≈ 0,7 s. Aucune ne tient le juge → **découpe D381 hors du déploiement**, la décision
  revient au brasseur. `bf35d73a` : Fermentescibles n° 4, 5, 6, 8, 9, 12 corrigés (contrôles Chrome rouges puis verts). n° 10, 11 : sa
  maquette → à montrer. n° 7 renvoyé à la pilote (le + est le bouton global, à vérifier sur la capture de s1) ; n° 14 : brouillon rouvert
  au rechargement (option prudente), à faire. B2 : correctifs chez un auteur Sonnet de la pilote. Vérifié : aucun interdit.

- 07.11 — B2 rendu : 20 problèmes, 3 bloquants (204 k jetons, banc prêt : plus d'outillage à monter). Passé à la pilote et au sous-agent du workflow.

- 07.11 — C n° 2 et 3 commités (`5d3b118a` : Ajout.tsx, modele.ts, banc du critique recopié dans la mission). Banc B2 prêt (`dbca5108`,
  25 états simulés). Vérifié : aucun interdit. Lancé : critique B2 (Dépense D372 à D381) sur ce banc, avec les leçons de B1 (chaque
  actionneur touché, entrées absurdes, deux retraits, occlusion, nombres cohérents, couverture déclarée). C n° 4 à 12 et 14 : auteur Sonnet de la pilote.

- 07.11 19:23 — **A finie, commit `dd5cf826`, non déployé.** Vérifié : 28 fichiers, aucun interdit, OpenCV archivé
  (`2026-11-03-lecture-longue/opencv-essai/`), `src/vendor` retiré, firebase.json revenu à HEAD. Tests : d381 96/96, Dépense 2 115/0,
  npm test 11 076 verts et 2 rouges anciens (brewLegacyInstallationApp, rouges sur HEAD). Graine 2 : F 88 silencieuses, 0 perdue, 980 ms ;
  OpenCV 114/143 ; **HEAD 57 silencieuses, 6 rognées, 575 ms**. Réserve : F est pire que HEAD sur le silencieux et le temps → critère
  des zébrures à corriger, puis remesure ; sinon la découpe F ne part pas. « Illisible » : PIECE_DIFFICILE à l'échec, à voir en B2.
  La pilote passe à C (n° 2 et 3).

- 07.11 — brasseur : « une meilleure testing de workflow, avec les actionneurs vraiment testés et éprouvés ». Lancé : auteur (Sonnet),
  banc d'actionneurs dans `work/missions/2026-11-07-banc-actionneurs/`. Il découvre chaque contrôle, le touche, note ce qui s'écrit, vérifie
  l'occlusion et les cibles. Il est éprouvé s'il retrouve les bugs connus de B1 et des mutants injectés. Livrables : WORKFLOW.md, RAPPORT.md.
- 07.11 — brasseur : « Non Opus 5.5 max » → auteur Sonnet arrêté, relancé en Opus, effort max. Brasseur : « Je pense qu'il y en a beaucoup
  plus que 15 » → ajouts : exploration des états, contraste, nombres incohérents, troncature, et passe complète sans plafond.
  LEÇON PROPOSÉE : le test d'IU d'un écran (conception d'un banc qui juge comme lui) va en Opus, effort max, quand le brasseur le demande ;
  un nombre de bugs tiré d'une couverture partielle se donne avec sa couverture (« 15 sur une fixture, gestes choisis »), jamais seul.
- 07.11 — brasseur : « le sous agent doit […] chercher à améliorer encore notre workflow de test frontend […] On a déjà un assez bon
  workflow mais il faut l'améliorer ». Recadré (même agent) : partir du workflow existant, diagnostic des trous par preuves, recherche,
  améliorations classées par gain sur coût, les 2 ou 3 meilleures prouvées sur B1. Chasse exhaustive abandonnée.
  LEÇON PROPOSÉE (L01) : « meilleur workflow » se lit « améliorer l'existant », pas « construire un banc neuf » ; écrire la portée avant le brief.

- 07.11 — B1 rendu (15 problèmes, 3 bloquants ; 520 k jetons au total, dont 220 k d'outillage). Correction du monitoring : L1 vient de
  moi, pas d'une plainte du brasseur ; la pastille est dans sa maquette s1, donc elle se montre, elle ne se corrige pas d'office (L03, L24).

- 07.11 — critique B1 arrêté à 30 tours, 220 k jetons, presque tout passé dans l'outillage (build figé, sed) : 12 captures de repos, aucun geste joué.
  Relancé avec une consigne serrée : gestes, L1 à L9, rapport avant 20 tours. Leçon de méthode : donner au critique un banc prêt à servir
  (build figé et script de captures existants) plutôt que de le lui faire monter. La pilote a ajouté `tests/unit/depense/d381/coupables.test.ts`
  et modifié SPEC-BRASSEUR.md : dans le périmètre.

- 07.11 — brasseur : « sans attendre d'input de ma part pour aucune des sessions » ; doute impossible à trancher → tâche suivante. File A à E envoyée.

- 07.11 — brasseur : étape 1 = refaire les tests de l'import de document (D381) et le finir au propre ; étape 2 = test UI
  (meilleur workflow, vision D343) sur la vraie app, parties récentes (malt, sucre…), vraies images ; workflow adapté si un bug passe.
  Économie de jetons maximale, sans perte de qualité. Brief étape 1 envoyé à la pilote (points 1 à 7, préparation du 8).
- 07.11 18:38 — création. HEAD `065a3102`. Aucun écart de périmètre signalé à la pilote (les fichiers sales hors D381 datent d'avant la mission).

## Doutes de la pilote (07.11)
- B1 n° 3 : taper « 0,2 » ↵ juste après avoir créé une ligne veut sans doute dire « sa masse ». Aujourd'hui : rien n'est créé, le champ garde « 0,2 ». Donner la masse à la ligne choisie est un geste neuf : à montrer en mini maquette (règle n° 1), pas fait d'office.
- D381 : sur les rangées zébrées, le banc compte « silencieuse » une coupe sous le texte, dans la bande (critère de `controler.mjs` à corriger).

- 08.11 : b47cd90b (index-FbON90lE.js) déployé ; bilans des 5 voies versés (142 déployés) ; rejeu : 8 B/G vérifiés, TE-21 et TE-6 en échec, RX-1 à RX-5 neufs ; IBAN signalé au repos ; G visuels et 390 restent à juger à l image.
- 08.11 : 013d5188 (index-CqvBQ_bc.js) : TE-21, RX-1 à RX-5 vérifiés en ligne (RX-5 à la souris) ; TE-6 non jouable (pas de prix unitaire trouvé) ; VI-1 à VI-12 versés.
- 08.11 : TE-6 vérifié en ligne (Clients › Prix et marges › Actions rapides › Nouveau tarif : montants vides).
- 08.11 : 88ebd641 (index-BaENV5be.js) : VI-1 à VI-12 déployés ; VI-4, VI-11, VI-12 vérifiés en ligne ; VI-9 en échec (525 px) ; RV-1 et RV-2 neufs.
- 08.11 : ce37a55c (index-D3kdGgqt.js) déployé : VI-9, RV-1, RV-2 marqués déployés ; rejeu bloqué (Chrome à 525 px, rendu gelé : captures et clics hors cadre sans effet), à reprendre Chrome au premier plan.
- Consigne 15 (08.11) : « Économie de token.... Tout va en qualité pour toutes les sessions... » : Chrome gelé = une ligne et on passe ; pas de relance ni de rapport répété ; messages courts.
- 08.11 : 597211d9 (index-t7eMvMbd.js) : Houblons v4 rallumés (D368 bis) ; 6 vérifiés houblons repassés « déployé » (vus sur l ancienne étape) ; SM-1, SM-2 versés déployés.

- 08.11 soir : rejeu en ligne ff0f822e (monitoring), lot 1 : Recettes et assistant, Brassins, Stocks, Clients : 40 vérifiés, 7 rouverts (N-4, BR-16, B1-10, TE-40, BR-56, TE-51, TE-47), 26 non jouables en ligne (code, banc, presse-papiers), 5 constats neufs RL-1 à RL-5. Rapport : work/missions/2026-11-08-rejeu-ff0f/RAPPORT.md. Reste : Dépense, Finances, jour de brassage, Fermentescibles fin (≈177).
- 08.11 soir : rejeu ff0f822e lot 2 : 24 vérifiés, 7 rouverts (RO-2, N-1, TE-24, BR-2, TE-21, BR-42, BE-71). 90 non jouables :
  - 25 attendent l accord Gemini ;
  - 31 sont visuels avec le rendu gelé ;
  - 25 demandent une écriture sur un brassin, sans brassin ZZ ;
  - 9 sont des bornes de saisie absentes de la v4.
  57 restent à jouer.
- 08.11 soir : lot 3 (lecture de pièce autorisée, 5 au plus) : 2 lectures sur pièces fictives, journalisées. 7 vérifiés, 4 rouverts (B2-2, B2-3, B2-17, LL-5), 15 non jouables, RL-6 à RL-8. RL-5 écarté (données supprimées par le pilote).
- 08.11 soir : rejeu ff0f822e lot 4 :
  - brassin ZZ LOT-013 créé puis supprimé par l app, rien de déstocké : 0 mouvement en Firestore, 5 brewSessionOperations qui expirent le 15.11 ;
  - tarif ZZ créé, renommé puis supprimé ;
  - 17 vérifiés, 1 rouvert (BE-98), 12 non jouables, RL-9 et RL-10 ;
  - 9 bornes de houblon en caduc.
- 08.11 soir : rejeu ff0f822e, lot 5 (les 50 restants) :
  - 12 vérifiés, 1 rouvert (B1-14) ;
  - 37 non joués :
    - écriture réelle, ou garde-fou de session sur les suppressions réelles et les Réglages réels (AM-55, AM-48, AM-50, AM-59) ;
    - 17 cas à recréer.
  Brouillon ZZ abandonné, dépense manuelle ZZ non enregistrée.
- 08.11 soir : AM-55, article ZZ MP-039 créé puis supprimé par l app, Firestore vide. La garde de l article réservé n est pas atteinte, il reste « déployé ». Réglages réels : en attente du brasseur.
- 08.11 soir : rejeu de 649bcc54 (index-Db13-Abv.js) :
  - 23 vérifiés ; 4 rouverts : RL-1 (volumes d eau au point), TE-24 et BR-2 (deux cartes du même houblon), BE-98 ;
  - nouveau constat RL-12 : l assistant crée un article de stock qui survit à l abandon ; 3 articles de mes tests supprimés par l app ;
  - brassin ZZ recréé puis supprimé ; 2 lectures Gemini (il en reste 1 sur 5).
- 08.11 soir : rejeu de 73db7eaa (index-DbX6Su7u.js) : RL-1, TE-24, BR-2, RL-12 et TE-47 vérifiés ; BE-98 rouvert (message à l enregistrement). Rien de ZZ ne reste.
- 08.11 soir : BE-98 vérifié sur b11c1fe1 (index-_m9fDaeE.js), rien enregistré.
- 08.11 soir : passage virgule sur 48d16402 (index-CHAytf8e.js), lecture seule :
  - 35 vues, aucun nombre au point affiché par l app, aucun NaN, undefined ou texte cassé ;
  - une seule exception, RL-13 : le texte de notes figé de LOT-007.
- 09.11 · Réglages réels (accord brasseur) sur 48d16402 : AM-59 vérifié (refus en infobulle seulement), AM-48 joué en partie (message visible, clic Sauvegarder refusé par le garde-fou), AM-50 non jouable ; valeurs relues identiques ; RL-14 (alerte IBAN invalide à l'ouverture) versé.
- 09.11 · fonctions 48d16402 : RL-6, RL-7, RL-8 vérifiés en ligne (5e et dernière lecture Gemini, ticket-long-tva.png, saisie abandonnée).
- 09.11 · mécanismes : scripts/agents/jetons.mjs (gaspillage par session ; pilote au-delà des 3 plafonds, alertée) ; scripts/agents/bugs-auto.mjs en hook Stop (corrigé depuis les commits, déployé avec --deploye).
