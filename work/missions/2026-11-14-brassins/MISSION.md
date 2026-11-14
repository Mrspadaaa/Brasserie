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
- Ouvert : son choix sur la page 2 et, vue par vue, sur la page 3 ; puis port 1:1 (voie à écrire), correctif du filtre de période (App.tsx:171), champs °C de cuve et dry hop daté (accord avant écriture), déploiement (accord).
- systeme.mjs mission : seul refus restant « aucune série en Fable », assumé (Fable interdit).
- Leçons proposées, à traiter : concepteurs v0 arrêtés à 200 k (s1, s3, p2a) : brief v0 plus serré, contrôles COMMUN/PANEL laissés au tri ; fichiers de travail dans os.tmpdir() préfixés par l'id de voie (collision p2a/p2b) ; avant « ses mots sont rares », chercher l'objet sous d'autres noms (cuve, rail, J+n) ; une convention (origine de J+n, deux températures) se lit dans le code avant d'être recommandée.
