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
| p2 | passe 2 des candidates de t1 (défauts corrigés, greffes), page de choix | conception | concepteur | opus | 60 | `work/missions/2026-11-14-brassins/voies/p2/`, `work/missions/2026-11-14-brassins/page/` | t1 | GATES.md, controle-choix.mjs, baseline, verifier-page.mjs --page-lot | brasseur | passe 2 |

## Agents
Fable interdit (utilisateur, 10.11 et 14.11 « SANS FABLE ») : le contrepoids « créatif à fond » de M13 passe en Opus (s3, brief minimal). Le refus « aucune série en Fable » de systeme.mjs reste assumé.

## Pages
| Sujet | Version | Adresse | Source |
|---|---|---|---|

## Boucle de retour
Voie en échec : relance ciblée chez un agent neuf (D207), 2 fois au plus. Plainte du brasseur : SPEC, DEFAUTS-RECURRENTS, contrôle.

## Budget
Plafond visé : 2 analyses, 3 concepteurs v0, 1 critique, 3 passes 2 légères.

## Sources
- `src/ui/production/ProductionCatalog.tsx`, `src/ui/BatchDetailSheet.tsx`, `src/components/tabs/ProductionTab.tsx`
- `work/refonte-frontend/INVENTAIRE-ECRANS.md`, `work/refonte-frontend/v4/SPEC-BRASSEUR.md`

## Signature
