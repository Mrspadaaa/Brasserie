# Mission 2026-11-01-renovation

## Objectif
Ses mots (SPEC-BRASSEUR, § « La vue TVA, et la rénovation d'abord », D259) : « j'ai plus besoin d'outil de prédictions, vu
d'ensemble, panification et autres car la brasserie est en grande rénovation […] Genre installation de hotte. Installation du 2eme
évier. Armoire extérieur, seconde passe sur les sols ectt création du site web vitrine.... ».

Fini ici veut dire :
1. il a vu les mini maquettes (une page neuve et datée par version) et en a choisi une ;
2. son choix est porté dans l'app, après son accord sur le modèle de données, puis testé dans Chrome.

Le point de départ est `DEPART.md` ; le cadrage, `jury-renovation/fiche.md`.

## Décisions
| Décision | Options | Décideur | État |
|---|---|---|---|
| Question de l'outil | payer ; finir ; ce qui manque et la suite | pilote | tranchée : « Qu'est-ce qui me manque, et qu'est-ce que je fais ensuite ? », facteur libre = la place dans la suite (fiche) |
| Place, forme, mot, argent, temps, étapes | axes de la fiche | brasseur | ouverte : axes des séries v0 |
| Modèle de données (champs de `financialPlans` ou collection) | champs facultatifs v1 ; collection neuve | utilisateur | ouverte : après son choix de maquette |

## Voies
| Voie | Objectif | Niveau | Agent | Modèle | Plafond | Possède | Dépend de | Contrôles | Décideur | Étape |
|---|---|---|---|---|---|---|---|---|---|---|
| reno-r | outil rénovation, série r : dans la langue de l'app en ligne (BRIEF-V0.md, jury-renovation/fiche.md) | conception | concepteur | opus | 60 | work/missions/2026-11-01-renovation/v0/r*/** | — | baseline : controle-choix (écran hors d'ecrans.json, dit), controle-commun --profil=sans-houblons --sans-lignes, mots-premier-ecran --max=60, controle-contraste, verifier-page, captures | brasseur | v0 ×4 (1 froide, 1 tiède, 2 chaudes) |
| reno-z | outil rénovation, série z : créative à fond (BRIEF-V0.md) | conception | concepteur | fable | 60 | work/missions/2026-11-01-renovation/v0/z*/** | — | baseline : controle-choix (écran hors d'ecrans.json, dit), controle-commun --profil=sans-houblons --sans-lignes, mots-premier-ecran --max=60, controle-contraste, verifier-page, captures | brasseur | v0 ×4 (1 froide, 1 tiède, 2 chaudes) |
| reno-u | outil rénovation, série u : libre au brief minimal (BRIEF-V0.md § Brief minimal) | conception | concepteur | opus | 60 | work/missions/2026-11-01-renovation/v0/u*/** | — | baseline : controle-choix (écran hors d'ecrans.json, dit), controle-commun --profil=sans-houblons --sans-lignes, mots-premier-ecran --max=60, controle-contraste, verifier-page, captures | brasseur | v0 ×4 (1 froide, 1 tiède, 2 chaudes) |
| reno-t | tri des 12 concepts (classement, candidates, greffes), honnêteté des chiffres et jour 1 compris | jugement | critique | fable | 30 | work/missions/2026-11-01-renovation/critique/** | reno-r, reno-z, reno-u | controle-panel indicatif (une capture par variante, D244), couverture des axes, captures ouvertes | pilote | tri |
| reno-p2 | passe 2 des candidates, agents neufs sur brief serré (D207), avec les greffes du critique | conception | concepteur | opus | 60 | work/missions/2026-11-01-renovation/v1/** | reno-t | controle-choix, controle-commun --profil=sans-houblons --sans-lignes, mots-premier-ecran --max=60, controle-contraste, verifier-page, captures | brasseur | passe 2 |

Ce que le brasseur verra passe par l'entonnoir (D204) : 12 concepts en 3 séries, le tri du critique, une passe 2 par des agents
neufs sur brief serré (D207), puis une page neuve.

## Agents
- reno-r : ae3e4b22b2438d8cb (opus) ; reno-z : adf38572f61bd2e10 (fable) ; reno-u : a84479055970cdd3b (opus), lancées le 01.11, nuit.

## Pages
| Sujet | Version | Adresse | Source |
|---|---|---|---|
| Rénovation | panel v0 · 01.11 | https://claude.ai/artifact/NomDkNMQMY2GFVki5wFFvY | work/missions/2026-11-01-renovation/choix-renovation/index.html |

## Boucle de retour
- Une variante en échec de contrôle se corrige dans sa voie (3 essais).
- Une variante rejetée par le critique est relancée chez un agent neuf (2 fois au plus) ou écartée, avec une ligne ici.
- Sa plainte va dans SPEC mot pour mot, puis dans DEFAUTS-RECURRENTS avec un contrôle qui échoue sur la version rejetée.

## Budget
- Jury : 3 appels, 174 k jetons.
- Séries v0 : 3 concepteurs, plafond de 60 tours chacun.

## Sources
- `work/missions/2026-11-01-renovation/DEPART.md`
- `work/missions/2026-11-01-renovation/jury-renovation/fiche.md`
- `work/missions/2026-11-01-renovation/BRIEF-V0.md`
- `src/ui/finance/UpgradeWorkspace.tsx`
- `src/domain/finance/upgrades.ts`
- `src/components/tabs/DashboardTab.tsx`

## Signature
Rien n'est signé pour l'instant.
