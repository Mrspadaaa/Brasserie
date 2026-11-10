# Mission 2026-11-09-levure-port — porter les quatre vues Levure choisies dans l'app, et les correctifs

## Objectif
Ses mots du 09.11 : « Les deux suggestions sont bien, IMPLÉMENTE toutes ces vues maintenant » ; « Et fait les fixes » ; « Tout les fixe » (lu : aussi tous les bugs ouverts de work/missions/BUGS.md, 322 hors Levure, répartis en cinq voies par zone).
Les quatre vues de l'étape « Levure 4/7 » de la création de recette, telles que ses maquettes choisies (règle n° 1,
`work/refonte-frontend/v4/choix/ecrans-app.json`) :
- Ma levure : l5b (`work/missions/2026-11-09-ecran-levure/p2/l5b/`) ;
- Chercher : c6b (`p2/c6b/`) ;
- Comparer : s5a (`p2/s5a/`) ;
- Suggérer : s7a (`p2/s7a/`).

Les correctifs prévus au port :
- verser les 46 faits sourcés de `savoir/faits-proposes.json` ;
- renommer le 2e rang en « fabricant présent en Europe », validé par les offres ;
- la dose au choix de la levure (#132) ;
- les couleurs d'effets alignées sur les familles d'arômes des houblons ;
- les doutes du critique à sourcer (W-68 « + banane », 3068 « esters ↑ à chaud », Diamond, °C de c5b) ;
- les 12 tests Dépense rouges sur 48d16402.

Fini, c'est :
- branché dans l'assistant de recette, atteint par le vrai parcours ;
- typé, testé, build vert ;
- joué dans Chrome à 390 tactile et 1280, deux thèmes ;
- jugé par le critique contre les maquettes ;
- déployé, puis joué en ligne sur une recette « ZZ TEST ».

## État de l'art
- Problème type : recherche à facettes avec comptes par option (facettes disjonctives : chaque compte exclut son propre filtre) ; recherche plein texte tolérante ; plus proches voisins sur données mêlées avec valeurs manquantes (« proche de 1056 », Suggérer) ; classement multicritère.
- Examiné : itemsjs (Apache-2.0, facettes en mémoire, ~10 ko) ; minisearch et fuse.js (7.5 déjà dans le dépôt) ; l'index existant yeastSearchIndex / yeastSearchScore (src/domain/yeastCatalogue.ts : nom, code, alias, fabricant) ; distance de Gower (Gower 1971), standard pour variables mixtes et manquantes.
- Décision : facettes sur-mesure en mémoire (1 733 fiches, 18 filtres, O(n·f), cible < 20 ms à chaud, mesurée en test ; itemsjs ne sait ni les plages ni les « non documentées ») ; texte par l'index existant, sans nouvelle bibliothèque ; proximité de Gower sur les axes connus des deux levures (plages au milieu normalisé par l'étendue, niveaux en rangs 0 / 0,5 / 1, catégories en égalité).

## Décisions
| Décision | Options | Décideur | État |
|---|---|---|---|
| « les deux suggestions » | c6b et s7a (candidates) ; s7a et s7b | pilote | tranchée : c6b et s7a, lecture dite au brasseur (L01) |
| « les fixes » | correctifs prévus au port + tests Dépense rouges ; autre chose | pilote | tranchée : cette liste, dite au brasseur |
| Les anciens composants Yeast* | supprimés ; gardés hors de l'étape | pilote | tranchée : rien n'est supprimé sans accord ; l'étape les remplace, chaque fonction retrouve sa place (« rien ne se perd ») |
| Contrats | `src/domain/levure/contrat.ts`, `src/ui/etapeLevure/props.ts` | pilote | écrits par le pilote ; un changement passe par lui |

## Choisies
- l5b choisie : « l5b · effets en jauges, + entre les paliers · Top ! » (09.11).
- s5a choisie : « s5a · effets de fermentation en tête · Top ! » (09.11).
- c6b choisie : « Les deux suggestions sont bien, IMPLÉMENTE toutes ces vues maintenant » (09.11).
- s7a choisie : « Les deux suggestions sont bien, IMPLÉMENTE toutes ces vues maintenant » (09.11).

## Voies
| Voie | Objectif | Niveau | Agent | Modèle | Plafond | Possède | Dépend de | Contrôles | Décideur | Étape |
|---|---|---|---|---|---|---|---|---|---|---|
| d1 | le domaine : axes, valeurs, disponibilité, recherche à facettes, proximité, comptes, suggestions ; faits sourcés versés ; doutes sourcés | jugement | auteur | sonnet | 90 | src/domain/levure/** (sauf contrat.ts), src/data/levure/**, tests/unit/levure/** | — | tsc, vitest tests/unit/levure, mesure du temps de chercher | pilote | — |
| u1 | coque des quatre vues dans l'étape, Ma levure = l5b (effets en jauges, conduite avec + et ×), dose au choix (#132), rien ne se perd, banc ?dev-local&etape=levure | jugement | auteur | sonnet | 120 | src/pages/BrewWizard.tsx (bloc Levure), src/App.tsx (banc etape=levure), src/ui/etapeLevure/** sauf Chercher/Comparer/Suggerer et vues.css, tests/integration/etapeLevure/etape*.test.tsx, work/missions/2026-11-09-levure-port/voies/u1/** | d1 (contrat) | tsc, vitest, build, Chrome 390/1280 deux thèmes, captures ouvertes | pilote | reprise |
| u2 | Chercher = c6b, Comparer = s5a, Suggérer = s7a | jugement | auteur | sonnet | 120 | src/ui/etapeLevure/Chercher.tsx, Comparer.tsx, Suggerer.tsx, vues.css, tests/integration/etapeLevure/vues*.test.tsx, work/missions/2026-11-09-levure-port/voies/u2/** | d1 (contrat) | tsc, vitest, Chrome 390/1280, captures ouvertes | pilote | reprise |
| b-dep | bugs ouverts Dépense (39) et les 12 tests rouges | jugement | auteur | sonnet | 120 | src/ui/finance/**, src/ui/depense/**, src/services/purchase*, src/services/invoice*, src/domain/finance/**, work/missions/2026-11-09-levure-port/voies/b-dep/** | — | REGLES-BUGS.md : tsc, vitest, captures | pilote | — |
| b-stock | bugs ouverts Stocks, brassins, jour de brassage (43) | jugement | auteur | sonnet | 120 | StocksTab, ProductionTab (liste), src/domain/stock/**, jour de brassage, work/missions/2026-11-09-levure-port/voies/b-stock/** | — | REGLES-BUGS.md : tsc, vitest, captures | pilote | — |
| b-divers | bugs ouverts Finances, clients, bord, réglages, autres (78) | jugement | auteur | sonnet | 120 | FinancesTab, ClientsTab, DashboardTab, Header, réglages, work/missions/2026-11-09-levure-port/voies/b-divers/** | — | REGLES-BUGS.md : tsc, vitest, captures | pilote | — |
| b-houblons | bugs ouverts Houblons (28) | jugement | auteur | sonnet | 120 | src/ui/hopIndex/**, src/domain/hopIndex/**, src/domain/hopDecision/**, work/missions/2026-11-09-levure-port/voies/b-houblons/** | — | REGLES-BUGS.md : tsc, vitest, captures | pilote | — |
| b-assistant | bugs ouverts assistant hors Levure et carnet (134) | jugement | auteur | sonnet | 120 | BrewWizard.tsx hors bloc Levure, src/ui/fermentescibles/**, src/ui/identite/**, eau, work/missions/2026-11-09-levure-port/voies/b-assistant/** | — | REGLES-BUGS.md : tsc, vitest, captures | pilote | — |
| t1 | verdict du port : l'app servie contre les maquettes l5b, c6b, s5a, s7a, état par état | jugement | critique | fable | 30 | work/missions/2026-11-09-levure-port/critique/** | u1, u2 | captures ouvertes | pilote | — |

## Pages
| Sujet | Version | Adresse | Source |
|---|---|---|---|
| Levure · passe 4 (choix c6b, s7a) | 09.11 v4 | https://claude.ai/artifact/DW4PfrQci56fx2YJ9hCAHd | `work/missions/2026-11-09-ecran-levure/panel-p4.html` |

## Boucle de retour
Un critère en échec : l'agent corrige, 3 essais. Un rejeu du pilote en échec : SendMessage au même agent, 2 relances.
Une plainte du brasseur : SPEC, DEFAUTS, contrôle, correction.

## Sources
- `work/missions/2026-11-09-ecran-levure/inventaire/inventaire-levure.md`
- `work/missions/2026-11-09-ecran-levure/savoir/AUDIT-FILTRES.md`
- `work/missions/2026-11-09-ecran-levure/savoir/faits-proposes.json`
- `work/missions/2026-11-09-ecran-levure/savoir/TROUS-COMBLES.md`
- `work/missions/2026-11-09-ecran-levure/critique/p2/SYNTHESE-P4.md`
