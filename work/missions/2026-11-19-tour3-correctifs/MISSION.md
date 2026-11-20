# Mission 2026-11-19-tour3-correctifs

## Objectif
Corriger les défauts ouverts du registre `work/missions/BUGS.md` : T2-2 à T2-8, T2B-1 à T2B-3 (rapports :
`work/missions/2026-11-18-choix-calendrier/tour2/`). T2-1 reste ouvert, « à dessiner » (choix d'axe du brasseur).
Code dans le worktree `C:/Users/mrspa/.codex/worktrees/openai-clean-start/port-carnet` (branche claude/port-carnet-1711).
Fini = chaque défaut : test qui échoue avant (L13), correction, vitest vert, vision locale (390 tactile, 844×340, 1280,
deux thèmes), critique opus, mise en ligne tour 3 (tag en-ligne/2026-11-19-tour3), rejeu en ligne, registre BUGS OK.

## État de l'art
- Problème type : défilement d'une liste virtualisée par la fenêtre (T2-7) ; cible tactile minimale (T2-2) ; libellés
  d'axe tronqués aux bords (T2B-2) ; coût de remontage d'un composant React (T2B-3).
- Examiné : react-virtuoso `useWindowScroll` (option documentée, MIT, déjà installée) au lieu d'un relais maison ;
  WCAG 2.5.8 / Apple HIG : cible ≥ 24 px (44 px conseillé) par zone de toucher élargie (pseudo-élément) ;
  axes d3/visx : on retire un libellé qui ne tient pas plutôt que de le couper ; React Profiler, `React.memo`,
  garder monté (`hidden`) plutôt que remonter.
- Décision : option `useWindowScroll` de react-virtuoso dans EntityList ; zone de toucher élargie ; libellé de bord
  retiré s'il ne tient pas ; profil mesuré avant toute optimisation de Ma levure.

## Décisions
| Décision | Options | Décideur | État |
|---|---|---|---|
| T2-1 axe du calendrier | mois en haut / semaines seules / autre | brasseur | ouverte : à dessiner |
| T2-6 total Courses contre Étagère | A « 24 en tout » ; B « 22 manquent · 2 au seuil » | pilote | tranchée : B (vrai et lisible) |
| T2-7 relais ou option | A relais ; B `useWindowScroll` | pilote | tranchée : B |
| T2B-3 code de l'étape Levure | toucher / ne pas toucher | utilisateur | ne pas toucher `src/ui/etapeLevure/` (refonte en cours) |

## Voies
| Voie | Objectif | Niveau | Agent | Modèle | Plafond | Possède | Dépend de | Contrôles | Décideur | Étape |
|---|---|---|---|---|---|---|---|---|---|---|
| cal | T2-2, T2-5, T2B-2 | jugement | auteur | sonnet | 120 | src/ui/calendrier/, src/components/tabs/CalendrierTab.tsx, src/components/Header.tsx, tests/integration/calendrierTour3.test.tsx | — | voies/cal/GATES.md | pilote | — |
| fin | T2-3, T2-4 | jugement | auteur | sonnet | 120 | src/ui/finance/, src/components/tabs/FinancesTab.tsx, tests/integration/financesTour3.test.tsx | — | voies/fin/GATES.md | pilote | — |
| stock | T2-6, T2-7 | jugement | auteur | sonnet | 120 | src/components/tabs/StocksTab.tsx, src/ui/stock/, src/ui/EntityList.tsx, tests/integration/stocksTour3.test.tsx | — | voies/stock/GATES.md | pilote | — |
| recette | T2-8, T2B-1 | jugement | auteur | sonnet | 120 | src/domain/brewerRecipeRefresh*, src/domain/brewerTools.ts, src/domain/brewSystemInsights*, src/ui/production/brasser/, tests/unit/recetteTour3.test.ts* | — | voies/recette/GATES.md | pilote | — |
| levure | T2B-3 | jugement | auteur | sonnet | 80 | src/pages/BrewWizard.tsx (montage des étapes seulement), tests/unit/levureMontage.test.tsx | — | voies/levure/GATES.md | pilote | — |

## Boucle de retour
Critère rouge : la voie corrige (3 essais). Rejeu pilote rouge : SendMessage, 2 fois. Vision et critique opus après
intégration, 3 tours au plus (L18). Constats T3-n de la session t3-test-chrome lus avant la mise en ligne.

## Sources
- `work/missions/BUGS.md`
- `work/missions/2026-11-18-choix-calendrier/tour2/VERDICT.md`

## Signature
(à remplir)
