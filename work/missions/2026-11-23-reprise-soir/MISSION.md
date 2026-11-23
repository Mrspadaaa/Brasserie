# Mission 2026-11-23-reprise-soir

## Objectif
Ses mots (23.11 soir) : « (1) porter CHOIX.md dans le Carnet, plus dense que les maquettes, et le prouver sur la vraie app (carnet ZZ TEST, captures à 390 regardées) ; (2) les petits défauts de la lecture des liens : T25-8, T26-1, T26-2, T26-4 ; (3) revérifier un à un, au registre, BL-4 à BL-15, GH-1 à GH-4 et CALP-1 à CALP-14 ; (4) le Calendrier : reconstruire le cœur de la frise (D444, VOIE-LOT-CAL.md) ; (5) le reste de l'état des tâches. » Chrome de débug 9222, jamais fermé, jamais Claude in Chrome.
Fini : branché, typé, testé, en ligne (tour 27), prouvé sur la vraie app par la vision (D343) ; registre à jour.

## État de l'art
- Problème type : affichage progressif d'une tâche serveur longue (streaming) avec reprise par jeton (job polling) ; échelle de temps d'une frise ; libellés de caractéristiques en langue étrangère.
- Examiné : httpsCallable.stream de @firebase/functions (Apache-2.0, déjà dans AiClient.runFlux) ; polling du document lecturesLiens ; d3-scale scaleTime + d3-time (ISC, déjà au projet) ; fast-check fc.commands (MIT, déjà au projet) ; traduction IA libre (écartée : invente) contre table de clés connues.
- Décision : runFlux + rappel {jeton, reprise:true} ; d3 scaleTime et un état unique, test par modèle ; table de clés + libellés rendus en français par l'appel IA existant (aucun appel en plus).

## Décisions
| Décision | Options | Décideur | État |
|---|---|---|---|
| Contrat escalade | context.escalade=true → lecture neuve, IA forte d'emblée ; autre | pilote | tranchée : escalade=true |
| Parcours Calendrier (CALP-14) hors porte D440 | remplacer par les specs Playwright e2e/calendrier ; le remettre dans la porte | pilote | tranchée : specs e2e/calendrier (réversible) |
| Critique | Fable ; Opus | utilisateur | tranchée : Opus (Fable interdit depuis le 10.11) |

## Voies
| Voie | Objectif | Niveau | Agent | Modèle | Plafond | Possède | Dépend de | Contrôles | Décideur | Étape |
|---|---|---|---|---|---|---|---|---|---|---|
| etapes | étapes de lecture d'un lien selon CHOIX.md, plus dense ; T26-4 | conception | concepteur | opus | 120 | src/ui/carnets (sauf FicheArticle), src/domain/carnets, src/services/aiClient.ts, src/design/CarnetsPreview.tsx, scripts/controles/controle-etapes-dense.mjs | — | voies/etapes/GATES.md | pilote | — |
| liens | T25-8, T26-1, T26-2, T26-3 ; option escalade | jugement | auteur | sonnet | 100 | functions/src, src/ui/carnets/FicheArticle.tsx, src/ui/carnets/fiche-article.css | — | voies/liens/GATES.md | pilote | — |
| registre | 30 lignes revérifiées au registre | jugement | auteur | sonnet | 100 | work/missions/BUGS.md (lignes BL-4..15, GH-1..4, CALP-1..14) | — | voies/registre/GATES.md | pilote | — |
| frise | cœur de la frise reconstruit (D444) | conception | auteur | opus | 120 | copie lot-cal : src/ui/calendrier, src/domain/calendrier*, e2e/calendrier | — | voies/frise/GATES.md | pilote | — |
| critique | test d'écran avant et après mise en ligne (Carnet étapes, Calendrier) | jugement | critique | opus | 60 | work/missions/2026-11-23-reprise-soir/voies/critique | etapes, frise | voies/critique/GATES.md | pilote | — |

## Agents
- etapes, liens, registre, frise lancées le 23.11 soir, avant la règle « dossier, mécanique, gestes » (785982722) ; les suivantes la suivent.

## Pages
| Sujet | Version | Adresse | Source |
|---|---|---|---|

## Boucle de retour
Critère rouge au rejeu : relance du même agent avec le défaut précis (2 au plus), sinon contrat réécrit. Plainte du brasseur : SPEC mot pour mot, DEFAUTS-RECURRENTS, contrôle rouge d'abord.

## Budget
IA réelle : ≈ 3,3 CHF restants sur 5 ; chaque appel dans work/missions/2026-11-23-carnet-en-ligne/ia-journal.jsonl. Jetons : node scripts/agents/jetons.mjs.

## Sources
- work/missions/2026-11-23-ETAT-DES-TACHES.md
- work/missions/maquettes-carnet/CHOIX.md
- work/missions/BUGS.md
- work/missions/2026-11-23-calendrier-en-ligne/VOIE-LOT-CAL.md

## Signature
(à remplir)
