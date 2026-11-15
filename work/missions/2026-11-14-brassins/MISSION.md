# Mission 2026-11-14-brassins

## Objectif
Ses mots (14.11) : « ok lance 1, 2, 4 en sous session avec la création de mini maquettes (non jouable) SANS FABLE » ; point 2 :
« Brassins (liste, fiche d'un brassin, fermentation) : suite directe du jour de brassage, jamais repris. »
Fini : (1) analyse par la vision au banc local de la liste des brassins (`brassins-liste`, `src/ui/production/ProductionCatalog.tsx`),
de la fiche d'un brassin (`feuille-brassin`, `src/ui/BatchDetailSheet.tsx`) et du suivi de fermentation (densités, températures,
dry hop, mise en fût ou bouteille, clôture), avec les trous fonctionnels ; (2) 12 à 16 mini maquettes statiques (repos et après un
geste), critique en Opus, défauts corrigés, page de choix en artefact privé neuf ; (3) port 1:1 de son choix, tests, build, captures
côte à côte, déploiement par tag `en-ligne/*`, jeu en ligne en lecture seule. Aucun agent Fable.
Hors périmètre : la vue du jour de brassage (`src/pages/BrewDayPage.tsx`, `src/ui/Brew*` du jour ; z1, m2, p2c, autre session) : on
s'y raccorde (fin du jour → brassin en fermentation), on ne la refait pas. Stock, Finances, assistant de recette : autres sessions.
Ses brassins réels : jamais d'écriture.

## État de l'art
- Problème type : suivi de fermentation (série temporelle de densités et températures, atténuation apparente, ABV par formule
  (OG − FG) × 131,25, détection d'une densité stable sur 2 à 3 jours) ; saisie au curseur (slider) sur une échelle cible.
- Examiné : formule ABV standard (131,25) et formule de Hall pour les fortes densités ; stabilité usuelle (deux relevés à 24 h
  d'écart identiques à 0,001 près) ; composants du dépôt déjà en place : `FermentationTemperatureChart.tsx`, la piste et le geste
  au curseur de z1/m2 (`BrewDayMeasurements.tsx`).
- Décision : aucun algorithme neuf avant l'analyse a1 ; formules standard et composants du dépôt réutilisés ; revue à la voie de port.

## Décisions
| Décision | Options | Décideur | État |
|---|---|---|---|
| Base des écrans brassins | aucune maquette choisie (ecrans.json sans entrée brassins) | brasseur | ouverte : page de choix |
| Critique et jury | Fable interdit | utilisateur | tranchée : Opus |
| Saisie des mesures | curseur sur l'échelle cible (ses mots 10.11, geste commun de m2) | brasseur | tranchée : reprise |

## Voies
| Voie | Objectif | Niveau | Agent | Modèle | Plafond | Possède | Dépend de | Contrôles | Décideur | Étape |
|---|---|---|---|---|---|---|---|---|---|---|
| a1 | banc local à fixtures fictives, captures, trous fonctionnels | jugement | auteur | sonnet | 80 | `work/missions/2026-11-14-brassins/voies/a1-banc/` | — | GATES.md | pilote | — |
| a2 | test d'écran « combien et quels problèmes » sur les captures a1 | jugement | critique | opus | 30 | `work/missions/2026-11-14-brassins/voies/a2-ecran/` | a1 | GATES.md | pilote | — |
| s1 | série A « la cuve d'abord », 5 mini maquettes | conception | concepteur | opus | 60 | `work/missions/2026-11-14-brassins/voies/s1/` | a2 | GATES.md, controle-choix.mjs, baseline (BRIEF-AUTEUR, NOTE cochée) | brasseur | v0 ×5 (1 froide, 2 tiède, 2 chaude) |
| s2 | série B « le prochain geste d'abord », 5 mini maquettes | conception | concepteur | opus | 60 | `work/missions/2026-11-14-brassins/voies/s2/` | a2 | GATES.md, controle-choix.mjs, baseline (BRIEF-AUTEUR, NOTE cochée) | brasseur | v0 ×5 (1 froide, 2 tiède, 2 chaude) |
| s3 | série C « l'écart au prévu », 5 mini maquettes, brief minimal, créative à fond | conception | concepteur | opus | 60 | `work/missions/2026-11-14-brassins/voies/s3/` | a2 | GATES.md, controle-choix.mjs, baseline (BRIEF-AUTEUR, NOTE cochée) | brasseur | v0 ×5 (1 froide, 2 tiède, 2 chaude) |
| t1 | classement du panel, défauts par variante, candidates et greffes | jugement | critique | opus | 30 | `work/missions/2026-11-14-brassins/voies/t1/` | s1, s2, s3 | GATES.md, controle-panel.mjs | pilote | tri |
| p2a | passe 2 de s1e (+ s1g fusion s1e, s1c, s2d) (défauts de t1 corrigés, greffes) | conception | concepteur | opus | 45 | `work/missions/2026-11-14-brassins/voies/p2a/` | t1 | GATES.md, controle-choix.mjs, baseline, controle-panel.mjs | brasseur | passe 2 |
| p2b | passe 2 de s2a (défauts de t1 corrigés, greffes) | conception | concepteur | opus | 45 | `work/missions/2026-11-14-brassins/voies/p2b/` | t1 | GATES.md, controle-choix.mjs, baseline, controle-panel.mjs | brasseur | passe 2 |
| p2c | passe 2 de s3b (défauts de t1 corrigés, greffes) | conception | concepteur | opus | 45 | `work/missions/2026-11-14-brassins/voies/p2c/` | t1 | GATES.md, controle-choix.mjs, baseline, controle-panel.mjs | brasseur | passe 2 |
| pg | page de choix : 15 v0 et 4 passes 2, captures, verifier-page | mécanique | executant | haiku | 30 | `work/missions/2026-11-14-brassins/page/` | p2a, p2b, p2c | verifier-page.mjs --page-lot | pilote | — |
| pg2 | page de choix neuve : 12 variantes s4 à s7 | mécanique | executant | haiku | 30 | `work/missions/2026-11-14-brassins/page2/` | f2a, f2b | verifier-page.mjs --page-lot | pilote | — |
| c3 | critique du refus (« Pas super fan de aucun »), causes et 4 genres neufs | jugement | critique | opus | 30 | `work/missions/2026-11-14-brassins/voies/c3/` | pg | GATES.md | pilote | tri |
| s4 | série G1 « tableau de cuverie », 3 mini maquettes | conception | concepteur | opus | 45 | `work/missions/2026-11-14-brassins/voies/s4/` | c3 | GATES.md, controle-choix.mjs, baseline (BRIEF-AUTEUR, NOTE cochée) | brasseur | v0 ×3 (1 froide, 1 tiède, 1 chaude) |
| s5 | série G2 « trois cadrans, un bouton », 3 mini maquettes | conception | concepteur | opus | 45 | `work/missions/2026-11-14-brassins/voies/s5/` | c3 | GATES.md, controle-choix.mjs, baseline (BRIEF-AUTEUR, NOTE cochée) | brasseur | v0 ×3 (1 froide, 1 tiède, 1 chaude) |
| s6 | série G3 « conduite de z1 transposée », 3 mini maquettes | conception | concepteur | opus | 45 | `work/missions/2026-11-14-brassins/voies/s6/` | c3 | GATES.md, controle-choix.mjs, baseline (BRIEF-AUTEUR, NOTE cochée) | brasseur | v0 ×3 (1 froide, 1 tiède, 1 chaude) |
| s7 | série G4 « dry hop en question », 3 mini maquettes | conception | concepteur | opus | 45 | `work/missions/2026-11-14-brassins/voies/s7/` | c3 | GATES.md, controle-choix.mjs, baseline (BRIEF-AUTEUR, NOTE cochée) | brasseur | v0 ×3 (1 froide, 1 tiède, 1 chaude) |
| cv | couverture de l'onglet Brassins (52 vues, 38 sans maquette) | jugement | auteur | sonnet | 40 | `work/missions/2026-11-14-brassins/voies/cv/` | — | GATES.md | pilote | — |
| e1 | vue jamais maquettée, 4 mini maquettes | conception | concepteur | opus | 45 | `work/missions/2026-11-14-brassins/voies/e1/` | cv | GATES.md | brasseur | v0 ×4 |
| e2 | vue jamais maquettée, 4 mini maquettes | conception | concepteur | opus | 45 | `work/missions/2026-11-14-brassins/voies/e2/` | cv | GATES.md | brasseur | v0 ×4 |
| e3 | vue jamais maquettée, 4 mini maquettes | conception | concepteur | opus | 45 | `work/missions/2026-11-14-brassins/voies/e3/` | cv | GATES.md | brasseur | v0 ×4 |
| e4 | vue jamais maquettée, 4 mini maquettes | conception | concepteur | opus | 45 | `work/missions/2026-11-14-brassins/voies/e4/` | cv | GATES.md | brasseur | v0 ×4 |
| e5 | vue jamais maquettée, 4 mini maquettes | conception | concepteur | opus | 45 | `work/missions/2026-11-14-brassins/voies/e5/` | cv | GATES.md | brasseur | v0 ×4 |
| e6 | vue jamais maquettée, 4 mini maquettes | conception | concepteur | opus | 45 | `work/missions/2026-11-14-brassins/voies/e6/` | cv | GATES.md | brasseur | v0 ×4 |
| e7 | vue jamais maquettée, 4 mini maquettes | conception | concepteur | opus | 45 | `work/missions/2026-11-14-brassins/voies/e7/` | cv | GATES.md | brasseur | v0 ×4 |
| e8 | vue jamais maquettée, 4 mini maquettes | conception | concepteur | opus | 45 | `work/missions/2026-11-14-brassins/voies/e8/` | cv | GATES.md | brasseur | v0 ×4 |
| e9 | vue jamais maquettée, 4 mini maquettes | conception | concepteur | opus | 45 | `work/missions/2026-11-14-brassins/voies/e9/` | cv | GATES.md | brasseur | v0 ×4 |
| e10 | vue jamais maquettée, 4 mini maquettes | conception | concepteur | opus | 45 | `work/missions/2026-11-14-brassins/voies/e10/` | cv | GATES.md | brasseur | v0 ×4 |
| e11 | vue jamais maquettée, 4 mini maquettes | conception | concepteur | opus | 45 | `work/missions/2026-11-14-brassins/voies/e11/` | cv | GATES.md | brasseur | v0 ×4 |
| c5a, c5b, c5c | critiques de e1 à e11 (99+73+56 problèmes ; 30+20+8 bloquants) | jugement | critique | opus | 30 | `work/missions/2026-11-14-brassins/voies/c5*/` | e1 à e11 | GATES.md | pilote | tri |
| f3a1 à f3a4, f3b1, f3b2, f3c, f4 | corrections des 58 bloquants, volumes alignés (DONNEES-COMMUNES.md) | conception | concepteur | opus | 40 | `work/missions/2026-11-14-brassins/voies/f3*/`, `f4/` | c5* | GATES.md | pilote | — |
| pg3 | page « tous les écrans » : couverture et 44 variantes | mécanique | executant | haiku | 40 | `work/missions/2026-11-14-brassins/page3/` | f3*, f4 | verifier-page.mjs --page-lot | pilote | — |

## Agents
Fable interdit (utilisateur, 10.11 et 14.11 « SANS FABLE ») : le contrepoids « créatif à fond » de M13 passe en Opus (s3, brief minimal). Le refus « aucune série en Fable » de systeme.mjs reste assumé.

## Pages
| Sujet | Version | Adresse | Source |
|---|---|---|---|
| Brassins · fiche et fermentation (s1e2, s1g, s2a2, s3b2 ; panel v0 de 15 ; critique : s1e, s2a, s3b) | 14.11 passe 2 | https://claude.ai/artifact/Jis8k1YGo26euJoLVKiMDv | `work/missions/2026-11-14-brassins/page/index.html` |
| Brassins · nouvelles versions (12 : s4 à s7, quatre genres, après « Pas super fan de aucun ») | 14.11 v0 corrigée | https://claude.ai/artifact/SqU1y2jQgMAX8tX6MKn9qL | `work/missions/2026-11-14-brassins/page2/index.html` |
| Brassins · tous les écrans (couverture ; 11 vues sans maquette, 4 versions chacune, e1 à e11) | 14.11 v0 corrigée | https://claude.ai/artifact/PVfjKmT4U9rvXxsKQTPPDp | `work/missions/2026-11-14-brassins/page3/index.html` |
| Brassins · tes choix et la suite (retenues e1a, e4c, e7a ; greffes gfa à gfd s4a × s6c, g6a à g6c e6a × e6c ; Créer un brassin refait e5na à e5nd ; e2, e3, e8 à e11 remontrées) | 15.11 v0 corrigée | https://claude.ai/artifact/PUbMUHbiuv8Z3eucLQTffU | `work/missions/2026-11-14-brassins/page5/index.html` |
- page6 « Brassins · six questions » (15.11) : https://claude.ai/artifact/3f8xRStDq4kDYofi6FihRm (`page6/`), une question par écran, PAGE OK, PAGE CLAIRE OK 6.

## Boucle de retour
Voie en échec : relance ciblée chez un agent neuf (D207), 2 fois au plus. Plainte du brasseur : SPEC, DEFAUTS-RECURRENTS, contrôle.

## Budget
Plafond visé : 2 analyses, 3 concepteurs v0, 1 critique, 3 passes 2 légères.

## Sources
- `src/ui/production/ProductionCatalog.tsx`, `src/ui/BatchDetailSheet.tsx`, `src/components/tabs/ProductionTab.tsx`
- `work/refonte-frontend/INVENTAIRE-ECRANS.md`, `work/refonte-frontend/v4/SPEC-BRASSEUR.md`

## Signature
- Fait : a1 (banc, 156 captures, TROUS), a2 (36 problèmes, 4 bloquants), jury normal en Opus (fiche), v0 15 (s1 à s3, finis par f1), tri t1 (s1e, s2a, s3b), passes 2 (s1e2, s1g, s2a2, s3b2), critique c2 (7 bloquants, corrigés par c2f), page pg (PAGE OK), publiée.
- 14.11, refus de la page 1 (« Pas super fan de aucun ») : critique c3 (7 causes, 4 genres), séries s4 à s7 (12), critiques c4a et c4b (20 bloquants), corrigés par f2a et f2b, page pg2 (PAGE OK), publiée. Réserves : 8 non bloquants de s5 laissés (f2a).
- 14.11, « tout les écrans sous les boutons de ces Tabs ne sont pas traitées ??? » : couverture cv (52 vues, 38 sans), e1 à e11 (44), critiques c5a à c5c (58 bloquants, corrigés par f3*, volumes par f4 et DONNEES-COMMUNES.md ; OG de la Stout e2c corrigée par le pilote), page pg3 (PAGE OK), publiée.
- 15.11, « Ça semble pas du tout respecter l'identité global de l'app ?? » : contrôle BR-ID (outils/controle-identite.mjs, passe sur z1, échouait 56/56), trousse id (jetons, polices, chrome tirés du code), rhabillage re1 à re11 et rs4 à rs7, critiques k1 à k4 (39 bloquants, corrigés par g1 à g4b), IDENTITE OK 56/56, pages 2 et 3 republiées (version 2). Leçon proposée (le savoir chargé dépasse déjà 30 000 car., rien ajouté à LECONS) : une mini maquette charge la trousse outils/identite/ et passe controle-identite.mjs ; l'idée est libre, l'identité non ; données communes, jamais les fixtures du banc.
- Ouvert : son choix sur la page 2 et, vue par vue, sur la page 3 ; puis port 1:1 (voie à écrire), correctif du filtre de période (App.tsx:171), champs °C de cuve et dry hop daté (accord avant écriture), déploiement (accord).
- systeme.mjs mission : seul refus restant « aucune série en Fable », assumé (Fable interdit).
- Leçons proposées, à traiter : concepteurs v0 arrêtés à 200 k (s1, s3, p2a) : brief v0 plus serré, contrôles COMMUN/PANEL laissés au tri ; fichiers de travail dans os.tmpdir() préfixés par l'id de voie (collision p2a/p2b) ; avant « ses mots sont rares », chercher l'objet sous d'autres noms (cuve, rail, J+n) ; une convention (origine de J+n, deux températures) se lit dans le code avant d'être recommandée.

## Contrat réécrit — 15.11 (pilote), choix du brasseur sur e1–e11
Mot pour mot : « e7a — e6a — e6c Des filtres qui comptent — Créer un brassin ?? Pas convaincu — e4c ».
Lecture du pilote : e7 = e7a ; e6 = e6a avec les filtres qui comptent de e6c (greffe) ; e4 = e4c ; « Créer un brassin » : aucune ne convainc → 3 ou 4 nouvelles maquettes de ce groupe, d'un autre genre. Autres groupes e1, e2, e3, e5, e8 à e11 : sa règle du 15.11 sur Finances (« SI non candidat 1 ») ne vaut que pour Finances ; les montrer à nouveau dans la page avec les greffes s4a × s6c.
À faire : verser dans SPEC ; page neuve (greffes s4a × s6c, e6a+e6c, Créer un brassin refait, groupes restants) ; puis port des choisis.
- Ajout 15.11, mot pour mot : « e1a ». e1 = e1a ; ne plus le remontrer.
- Ajout 15.11, mot pour mot : « e2a ». e2 = e2a ; ne plus le remontrer.
- Ajout 15.11, mot pour mot : « e3b Le fil — e3a Carnet — Je plaise bien... À faire d'autres versions de ceux là. Aussi utiliser l'ia pas chère pour remettre en place des note en vrac ». Lecture : e3 = 3 ou 4 greffes e3a × e3b ; les notes en vrac rangées par l'IA la moins chère (Flash-Lite, proposée, validée par lui, jamais réelle dans npm test), comme ri4 de l'Atelier ; sur la même page neuve.
- Ajout 15.11, mot pour mot : « Le carnet de recettes, pas très compact, pas super convaincu quand il y aura des dizaines de recette — e4c L'échelle ok ». Lecture : e4 = e4c confirmé ; le groupe « carnet de recettes » est refusé tel quel : 3 ou 4 versions compactes qui tiennent des dizaines de recettes (recherche, tri, lignes denses), sur la même page neuve.
- Ajout 15.11, mot pour mot : « e11a — e10c ». e11 = e11a ; e10 = e10c.
- 15.11 : « e8 · Le carnet de recettes j'ai déjà donné mon avis la dessus » : e8 est le carnet déjà refusé (versions compactes demandées). Restent e5 et e9.
- 15.11 : « e5 · Créer un brassin j'aussi donner mon avis... » : e5 = « Créer un brassin », déjà refusé (« Pas convaincu ») → à refaire. Reste e9 seulement.
- 15.11, mot pour mot : « · L'Atelier R&D toujours pas super convaincu ». e9 (Atelier R&D) refusé à nouveau → 3 ou 4 versions d'un autre genre, en partant de ses mots dans SPEC sur l'Atelier R&D. Tous les groupes e1–e11 ont maintenant leur réponse.

- 15.11, fait : greffes gf (s4a × s6c, critique kg, 8 bloquants corrigés par gk), g6 (e6a × e6c) et e5n (Créer un brassin, 4 genres neufs), critique k6 (9 bloquants, corrigés par g6f), IDENTITE OK 11/11, page pg5 (PAGE OK) publiée : https://claude.ai/artifact/PUbMUHbiuv8Z3eucLQTffU. Ouvert : son choix sur cette page, puis port de e1a, e4c, e7a et des choisis.

## État de reprise — 15.11 (pilote)
- Pages : choix et suite https://claude.ai/artifact/PUbMUHbiuv8Z3eucLQTffU (`page5/`), tous les écrans PVfjKmT4U9rvXxsKQTPPDp (`page3/`), fermentation SqU1y2jQgMAX8tX6MKn9qL (`page2/`).
- Retenues à porter : e1a (fiche planifiée), e4c (saisies de passage), e7a (bilan). En attente de son choix : gfa–gfd, g6a–g6c, e5na–e5nd, e2, e3, e8–e11.
- Outils : `outils/controle-identite.mjs` (BR-ID, 0 écart exigé), trousse `outils/identite/`, données `DONNEES-COMMUNES.md` ; générateurs de voies dans le scratchpad (non versés).
- Prochaine action : relever son choix, puis voie de port 1:1 (BatchDetailSheet, production/*, ProductionCatalog), tests, build, captures côte à côte ; correctif du filtre de période (App.tsx:171) ; champs °C de cuve et dry hop daté (accord) ; déploiement (accord).
- Risques : leçon proposée non versée (savoir chargé > 30 000 car.) ; défauts non bloquants listés dans les VERDICT k1–k4, kg, k6.
- 15.11, mot pour mot : « e5na proposée Le brassin naît dans sa frise · 4 vues — e5nb La carte fantôme dans la liste · 3 vues — Les deux sont bien... Je sais pas trop... ». Lecture du pilote : Créer un brassin hésite entre e5na et e5nb → 2 greffes e5na × e5nb (la carte fantôme dans la liste qui s'ouvre sur sa frise), montrées sur la prochaine page ; à défaut de réponse, e5na (la proposée) est portée.
- 15.11, mot pour mot, sur la page « tes choix et la suite » : « Toujours pas très clair. Faire passer critique, feedback, helper, analyse UX UI, et brasseur ». Le pilote lance une revue à trois regards (critique Opus, analyse UX/UI boosters-ux, regard Brasseur) ; synthèse dans work/missions/2026-11-14-brassins/revue-page5/SYNTHESE.md, à appliquer à la reprise avant toute nouvelle page.
- Revue faite par le pilote (15.11) : lire work/missions/2026-11-14-brassins/revue-page5/SYNTHESE.md AVANT toute nouvelle page ; corrections et découpage en trois questions.

## État de reprise — 15.11, soir (pilote)
- Fait : ses mots versés (SPEC, 9 entrées) ; BR-PAGE (`outils/controle-page-claire.mjs`, témoin négatif page5) ; maquettes gf (gfa, gfc, gfd corrigées ; gfb retirée), g6a, g6b, e5ga, e5gb, e3ga–e3gd, e8na–e8nd, e9na–e9nd ; critiques Opus k7, k8, k9 et corrections g7, g8, g9 ; IDENTITE OK (familles d'arômes ajoutées à la palette) ; page6 publiée.
- Port (p1 fiche e1a, e2a, e4c ; p2 bilan e7a ; p3 coque e11a et Volumes e10c, filtre de période en contournement local) : tsc OK hors functions/ (absent sur HEAD aussi), vite build OK, 13 tests anciens adaptés (p4) ; critique du port kp en cours.
- Ouvert : son choix sur page6 ; ACCORD : filtre de période dans `filterCatalog`, libellé du + (`fabActions.ts`), flèche retour du bilan via `ProductionCatalog` ; `tests/unit/depense/loupe.test.tsx` échoue dans ce worktree (deux copies de React), hors port ; erreurs tsc de `functions/` (firebase-admin absent) préexistantes.
- Port (15.11, soir) : e1a, e2a, e4c (fiche), e7a (bilan), e10c (Volumes), e11a (coque, + nommé et son menu) portés ; critiques kp (21 [B]) puis kp2 (4 [B]) ; corrigés par p5, p6, p7 sauf un. tsc OK hors functions/, 199 tests des fichiers touchés verts, vite build OK. ACCORD restant : date d'entrée en garde (champ neuf) pour e4c ; filtre de période dans filterCatalog (contournement local en place). e11a n° 1, 2, 5 (cartes de liste et de recette) attendent son choix sur page6.

## État de reprise — 15.11, nuit (pilote)
- Ses mots (SPEC, commit 5e627214 repris) : « Fermentation : gfc · Filtres : e6a + e6c · Créer : aucune · Carnet : e3gb · Recettes : aucune · Atelier : e9na Refait pour celle aucune... Ça resoud aucune de mes problématique ».
- Port : gfc (fiche en fermentation), e6a + e6c (liste et feuille Filtrer), e3gb (Carnet et Dossier), e9na (Atelier R&D) ; voies q1 à q10 ; critiques kq (12 [B]) puis kq2 (5 [B]), corrigés sauf l'ACCORD IA. Les règles de mesure (OG/FG, alcool, jour brassé, nombres à la française) vivent dans le Dossier. tsc OK hors functions/, vite build OK, suite complète : seuls échecs préexistants sur HEAD (et loupe, hors port).
- Créer et Recettes : ses problèmes sourcés (`voies/a2/PROBLEMES.md`, 9 + 9), 16 maquettes v0 (c1, c2, r1, r2), quatre revues (`revue-v0/`), 8 retenues corrigées (cx, rx), page7 https://claude.ai/artifact/2KzzuYs2orjYwtfkJAzM6R (PAGE CLAIRE OK 2).
- ACCORD en attente : tâche serveur d'IA pour ranger les notes (e3gb, e9na ; drapeau éteint) ; date d'entrée en garde (e4c) ; filtre de période dans filterCatalog (contournement local).
- Prochaine action : son choix sur page7, puis port.
