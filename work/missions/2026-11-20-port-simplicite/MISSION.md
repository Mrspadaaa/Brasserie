# Mission 2026-11-20-port-simplicite

## Objectif
Porter dans l'app (branche `claude/port-carnet-1711`, celle qui est en ligne) les choix « simplicité » du brasseur du 16.11 qui n'y sont pas : pa1 · pa2 · pe1 · pb1 · pb2 · pb3 · pm1 · pl1 · pl2, et compléter pe3 · pe4 (règle L9 en ligne : da2e52035, 8e6f9d220, fc5f70dcc). Registre `work/refonte-frontend/v4/choix/ecrans.json` (entrée « simplicite », retouches : pe4 sur un nettoyant, dose au curseur jamais inventée ; pm1 montre 67 °C proposé, à confirmer, et un curseur de pH, dans le compagnon p2a ; pb1 et pb3 dans la feuille d1b). Page choisie : https://claude.ai/artifact/Phf2ArFjBguzQNsAZGkqkf, copiée dans `maquette/`. Ses mots : « SIMPLEMENT et sans me prendre la tête » (15.11) ; moins de gestes partout sans perte de qualité (20.11).
Fini = branché, atteint par un vrai parcours, typé, testé, build vert, vu à 390 tactile et 1280 dans les deux thèmes, côte à côte avec la maquette ; critique Opus « combien et quels problèmes ? », bloquants corrigés ; BUGS.md à jour. Pas de push ni de déploiement (session parente).

## État de l'art
- Problème type : pa1, file de revue d'exceptions (« exception-based review ») ; pa2 et pl1, rapprochement d'enregistrements (« record linkage ») par clé normalisée ; pe1 et pe3, journal d'effets et écriture compensatoire (« compensating transaction », comme `revertTransaction` et L9) ; pm1, saisie au curseur avec valeur par défaut à confirmer (« default value with explicit confirmation ») ; pb1 à pb3, gabarit/clonage d'ordre de fabrication (« reorder from history ») ; pl2, rapprochement facture-engagement (« commitment matching »).
- Examiné : bibliothèques de correspondance floue (fuse.js, string-similarity) pour pa2 et pl1 : écartées tant qu'une clé exacte normalisée suffit (mesure par la voie) ; moteur de règles (json-rules-engine) déjà écarté par L9 (REGLE-CONSOMMATION.md). Curseur : `<input type="range">` natif, déjà utilisé (BandeauEffets), sans dépendance.
- Décision : aucune dépendance neuve ; fonctions pures testées dans src/domain, composants sur les jetons de l'app, réemploi des chemins existants (revertTransaction, adapterPourCeBrassin, estRealise, mesures du jour J).

## Décisions
| Décision | Options | Décideur | État |
|---|---|---|---|
| pl1 « déjà relié » dans la Dépense et pl2 « rien dans la dépense » sont tous deux choisis | pl1 dans la Dépense + traces de pl2 ailleurs ; pl2 seul | pilote | tranchée : pl1 dans la Dépense (choisi en propre), pl2 pour Réalisés et la courbe |
| ↺ d'une trace de facture (pe3) | annuler l'entrée de stock ; ouvrir la facture | pilote | tranchée : écriture compensatoire de l'entrée, refus motivé si l'article a bougé depuis |
| Composants pa2/pl1 et ExpenseSheet (un seul propriétaire, L17) | voie séparée sans ExpenseSheet puis branchement ; une seule voie | pilote | tranchée : voie séparée, branchement par le pilote après v-pa1 |

## Voies
| Voie | Objectif | Niveau | Agent | Modèle | Plafond | Possède | Dépend de | Contrôles | Décideur | Étape |
|---|---|---|---|---|---|---|---|---|---|---|
| v-pa1 | pa1 — un doute à la fois | conception | auteur | opus | 120 | `src/ui/finance/ExpenseSheet.tsx`, `src/ui/finance/relecture/`, `src/domain/finance/fileDesDoutes.ts`, `tests/unit/fileDesDoutes.test.ts`, `tests/unit/relectureUnDoute.test.tsx` | — | `npx vitest run tests/unit/fileDesDoutes.test.ts tests/unit/relectureUnDoute.test.tsx`, captures | pilote | — |
| v-pa2pl1 | pa2 et pl1 — comme la dernière fois, besoin déjà relié | jugement | auteur | sonnet | 90 | `src/domain/finance/commeAvant.ts`, `src/domain/finance/lienBesoin.ts`, `src/ui/finance/relecture/CommeAvant.tsx`, `src/ui/finance/relecture/LienBesoin.tsx`, `tests/unit/commeAvant.test.ts`, `tests/unit/lienBesoin.test.ts` | — | `npx vitest run tests/unit/commeAvant.test.ts tests/unit/lienBesoin.test.ts`, captures | pilote | — |
| v-pe1 | pe1 — l'onglet du bas, tes finances avant → après | jugement | auteur | sonnet | 90 | `src/ui/BandeauEffets.tsx`, `src/services/effetsGeste.ts`, `src/domain/finance/effetsFinances.ts`, `src/App.tsx`, `tests/unit/effetsFinances.test.ts` | — | `npx vitest run tests/unit/effetsFinances.test.ts`, captures | pilote | — |
| v-pe3 | pe3 et pe4 — la trace sur place complète, la dose une fois | jugement | auteur | sonnet | 80 | `src/ui/StockRow.tsx`, `src/ui/stock/LigneStock.tsx`, `src/domain/stock/traceMouvement.ts`, `src/services/storage.ts`, `tests/unit/traceMouvement.test.ts` | — | `npx vitest run tests/unit/traceMouvement.test.ts`, captures | pilote | — |
| v-pb | pb1, pb2, pb3 — adapter et créer, rebrasser, régler plus tard | jugement | auteur | sonnet | 110 | `src/components/QuickActionModal.tsx`, `src/ui/production/liste/`, `src/domain/brassin/rebrasser.ts`, `tests/unit/rebrasser.test.ts`, `tests/unit/feuilleBrasserPb.test.tsx` | — | `npx vitest run tests/unit/rebrasser.test.ts tests/unit/feuilleBrasserPb.test.tsx`, captures | pilote | — |
| v-pm1 | pm1 — le palier appelle la mesure | jugement | auteur | sonnet | 90 | `src/ui/BrewThermalControl.tsx`, `src/ui/brassage/AppelMesure.tsx`, `src/pages/BrewDayPage.tsx`, `src/domain/appelMesure.ts`, `tests/unit/appelMesure.test.ts`, `tests/unit/appelMesureVue.test.tsx` | — | `npx vitest run tests/unit/appelMesure.test.ts tests/unit/appelMesureVue.test.tsx`, captures | pilote | — |
| v-pl2 | pl2 — le besoin réalisé, tracé dans Réalisés et sur la courbe | jugement | auteur | sonnet | 70 | `src/ui/finance/UpgradeWorkspace.tsx`, `src/domain/finance/upgradeForecast.ts`, `tests/unit/realisesTrace.test.ts` | — | `npx vitest run tests/unit/realisesTrace.test.ts`, captures | pilote | — |
| v-critique | test d'écran de l'ensemble : « combien et quels problèmes ? » | jugement | critique | opus | 30 | `work/missions/2026-11-20-port-simplicite/critique/` | toutes | captures app et maquette côte à côte | pilote | — |

## Pages
| Sujet | Version | Adresse | Source |
|---|---|---|---|
| Simplicité · retenues (choisie, référence du port) | passe 2b ; 16.11 | https://claude.ai/artifact/Phf2ArFjBguzQNsAZGkqkf | `work/missions/2026-11-20-port-simplicite/maquette/index.html` |

## Boucle de retour
Critère en échec : la voie corrige (3 essais). Rejeu du pilote en échec : SendMessage à la même voie (2 fois). Critique : bloquants corrigés par le pilote ou la voie, défauts au registre `work/missions/BUGS.md`.

## Budget
Sept auteurs en parallèle, plafonds 70 à 120 tours ; un critique Opus.

## Sources
- `work/missions/2026-11-20-port-simplicite/maquette/index.html`
- `work/missions/2026-11-20-port-simplicite/maquette/REGLE-CONSOMMATION.md`

## Signature
(à remplir)
