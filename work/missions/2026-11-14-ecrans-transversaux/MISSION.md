# Mission 2026-11-14-ecrans-transversaux

## Objectif
Le brasseur, 14.11, mot pour mot : « Lance des autres sous session pour les autres écrans important(sauf clients) pour des
mini maquettes. Notamment ces écran et d'autres et sauf l'écran principal ». Portée (L01) : les écrans transversaux jamais
refaits — la recherche (loupe, ⌘K), l'en-tête et son menu ⋮ (et ce qu'il ouvre : réglages, compte, historique, thème,
période), la barre du bas et le bouton « + » avec son menu. Hors portée : Bord, Clients, et les écrans d'autres missions
(Stock, Finances, Brassins, Recette, Atelier, Fûts, Matériel, compagnon) ; seuls leurs points d'entrée sont ici.
Fini veut dire : (1) inventaire au banc local (INVENTAIRE.md, fait) ; (2) 12 mini maquettes non jouables en 3 séries, triées
par le critique en Opus, montrées dans une page d'artefact privée neuve ; (3) après son choix : port 1:1, tests, déploiement,
joué en ligne.

## État de l'art
Pas de code dans cette étape (maquettes statiques). Au port : palette de commandes = `cmdk` déjà en place
(`src/ui/CommandPalette.tsx`), recherche floue `fuse.js` déjà présente (docs/ui-compacte.md) ; navigation adaptative
téléphone/ordinateur = motif standard (barre du bas au téléphone, rail latéral à l'ordinateur, Material 3 « navigation
rail ») ; aucune bibliothèque nouvelle prévue.
- Problème type : palette de commandes et navigation adaptative.
- Examiné : cmdk (MIT, en place), fuse.js (Apache 2.0, en place), motifs Material 3 / HIG.
- Décision : réutiliser cmdk et fuse.js ; aucun algorithme sur mesure.

## Décisions
| Décision | Options | Décideur | État |
|---|---|---|---|
| Forme de la recherche | r1 à r4 | brasseur | ouverte |
| Forme de l'en-tête et du menu ⋮ | m1 à m4 | brasseur | ouverte |
| Forme de la barre du bas et du + | b1 à b4 | brasseur | ouverte |
| 4 variantes par série plutôt que 11 par vue (D126) | 16 en 4 séries, D204 | pilote | tranchée (brief parent : « 12 variantes en 3 séries » ; 4e série ajoutée pour la règle de couverture du 14.11) |

## Voies
| Voie | Objectif | Niveau | Agent | Modèle | Plafond | Possède | Dépend de | Contrôles | Décideur | Étape |
|---|---|---|---|---|---|---|---|---|---|---|
| voie-recherche | 4 mini maquettes de la recherche | conception | concepteur | opus | 60 | `voies/voie-recherche/**` | — | controle-serie.mjs ; baseline : INVENTAIRE.md § Ce qui existe (rien de perdu) ; controle-choix.mjs (aucun choix enregistré sur ces écrans) | brasseur | v0 ×4 (1 froide, 2 tiède, 1 chaude) |
| voie-menu | 4 mini maquettes de l'en-tête et du menu ⋮ | conception | concepteur | opus | 60 | `voies/voie-menu/**` | — | controle-serie.mjs ; baseline : INVENTAIRE.md § Ce qui existe (rien de perdu) ; controle-choix.mjs (aucun choix enregistré sur ces écrans) | brasseur | v0 ×4 (1 froide, 1 tiède, 2 chaude) |
| voie-barre | 4 mini maquettes de la barre du bas et du +, au brief minimal (question et obligatoire seuls, sans pistes) | conception | concepteur | opus | 60 | `voies/voie-barre/**` | — | controle-serie.mjs ; baseline : INVENTAIRE.md § Ce qui existe (rien de perdu) ; controle-choix.mjs (aucun choix enregistré sur ces écrans) | brasseur | v0 ×4 (1 froide, 1 tiède, 2 chaude) |
| voie-destinations | 4 mini maquettes de ce qu'ouvrent le ⋮ et le + (Réglages ×4 onglets, Journal, Connexions, Saisir au nom, Conversations, Encaisser, Période) | conception | concepteur | opus | 70 | `voies/voie-destinations/**` | — | controle-serie.mjs --vues ; baseline : INVENTAIRE.md § Ce qui existe (rien de perdu) ; controle-choix.mjs (aucun choix enregistré sur ces écrans) | brasseur | v0 ×4 (1 froide, 1 tiède, 2 chaude) |
| voie-critique | tri des 16, verdict par variante, 3 candidates et greffes | jugement | critique | opus | 30 | `voies/voie-critique/**` | voie-recherche, voie-menu, voie-barre, voie-destinations | controle-panel.mjs sur les 16 captures a-390 ; SYNTHESE.md | pilote | tri |
| voie-p2-r3 | r3 corrigée et enrichie de ses greffes | conception | concepteur | opus | 60 | `voies/voie-p2-r3/**` | voie-critique | controle-serie.mjs ; baseline : INVENTAIRE.md § Ce qui existe ; controle-choix.mjs | brasseur | passe 2 |
| voie-p2-m2 | m2 corrigée et enrichie de ses greffes | conception | concepteur | opus | 60 | `voies/voie-p2-m2/**` | voie-critique | controle-serie.mjs ; baseline : INVENTAIRE.md § Ce qui existe ; controle-choix.mjs | brasseur | passe 2 |
| voie-p2-b3 | b3 corrigée et enrichie de ses greffes | conception | concepteur | opus | 60 | `voies/voie-p2-b3/**` | voie-critique | controle-serie.mjs ; baseline : INVENTAIRE.md § Ce qui existe ; controle-choix.mjs | brasseur | passe 2 |
| voie-p2-d3 | d3 corrigée et enrichie de ses greffes | conception | concepteur | opus | 60 | `voies/voie-p2-d3/**` | voie-critique | controle-serie.mjs ; baseline : INVENTAIRE.md § Ce qui existe ; controle-choix.mjs | brasseur | passe 2 |
| voie-r-m3 | m3 (son choix), période refaite en 3 lectures (ET-PER) | conception | concepteur | opus | 60 | `voies/voie-r-m3/**` | — | controle-serie.mjs --vues ; baseline : m3 telle quelle ; controle-choix.mjs | brasseur | reprise |
| voie-r-b1 | b1 (son choix), + dynamique par écran (ET-PLUS) | conception | concepteur | opus | 60 | `voies/voie-r-b1/**` | — | controle-serie.mjs --vues ; baseline : b1 telle quelle ; controle-choix.mjs | brasseur | reprise |
| port-reglages | port 1:1 de d3p2, Réglages 4 onglets | jugement | auteur | sonnet | 120 | worktree : SettingsModal, reglages/** ; `voies/port-reglages/**` | — | tsc, vitest, build, captures côte à côte ; controle-choix.mjs | pilote | reprise |
| port-feuilles | port 1:1 de d3p2, Journal, Connexions, Saisir au nom, Conversations, Vente | jugement | auteur | sonnet | 120 | worktree : AuditLog, CloudConfig, feuilles/** ; `voies/port-feuilles/**` | — | tsc, vitest, build, captures côte à côte ; controle-choix.mjs | pilote | reprise |
| port-b1 | port 1:1 de b1r, + selon l'écran | jugement | auteur | sonnet | 120 | worktree : BottomNav, fabActions, navigation/** ; `voies/port-b1/**` | — | tsc, vitest, build, audit-plus étendu (ET-PLUS), captures ; controle-choix.mjs | pilote | reprise |
| port-m3 | port 1:1 de m3 + période m3r-a | jugement | auteur | sonnet | 120 | worktree : Header, plus/**, periode/** ; `voies/port-m3/**` | port-feuilles | tsc, vitest (ET-PER), build, captures ; controle-choix.mjs | pilote | reprise |
| port-r3 | port 1:1 de r3p2, la recherche | jugement | auteur | sonnet | 120 | worktree : CommandPalette, recherche/** ; `voies/port-r3/**` | port-b1 | tsc, vitest, build, captures ; controle-choix.mjs | pilote | reprise |
| voie-r2-b1 | seconde reprise du + : flottant, commun toujours là, écran en tête | conception | concepteur | opus | 60 | `voies/voie-r2-b1/**` | — | controle-serie.mjs --vues ; baseline : b1 telle quelle ; controle-choix.mjs | brasseur | reprise |

r3p2 choisie : « r3p2 top ».

m3 choisie : « m3 -> attention pour l'interval de temps ça doit être mieux fait. Et on peut le réglés à plusieurs endroits, attention à ce détails très important !! ».
b1 choisie : « b1 -> le + doit être dynamique en fonction de l'écran ou on est ».
d3p2 choisie : « Dessiné / d3p2 / Le métier dessiné, bilan des réglages en tête. ».
Recherche : choix ouvert (aucun mot le 15.11) ; l'app actuelle reste.

Fable interdit jusqu'à nouvel ordre (l'utilisateur, 10.11) : aucune série en Fable ; critique et tri en Opus. Le contrôle M13
« aucune série en Fable » reste donc en échec, sciemment.

d4 écartée : texte au premier plan et menus déroulants au téléphone (critique, REJET) ; ses greffes vont dans d3. Elle reste visible sur la page, marquée écartée.
Panel v0 en ECHEC (médiane 0,45, 6 % de paires proches) : les quatre états « a » de voie-barre montrent la barre fermée ; corrigé dans voie-p2-b3 (état « a » sur un écran rempli).

## Agents
v0 : un concepteur Opus par série (destinations reprise en trois agents, d2 à d4, après la limite de contexte du premier). Tri et passe 2 : critique Opus. Passe 2 : un concepteur neuf par candidate ; b3p2 rejetée (volumes impossibles) puis relancée une fois, données corrigées.

## Pages
| Sujet | Version | Adresse | Source |
|---|---|---|---|
| Le + flottant | seconde reprise du + · 15.11 | https://claude.ai/artifact/E3MHXvErduH8FKH2NtzBpf | `work/refonte-frontend/v4/outils/pages/2026-11-15-plus-flottant/index.html` |
| Période et + | reprises m3 et b1 · 15.11 | https://claude.ai/artifact/H9K7tsC6CKoQHQNZW9pL6P | `work/refonte-frontend/v4/outils/pages/2026-11-15-periode-et-plus/index.html` |
| Recherche, menu, barre et + | v0 et passe 2 · 14.11 | https://claude.ai/artifact/64BnDUYmehXQUv2kTJRUAu | `work/refonte-frontend/v4/outils/pages/2026-11-14-ecrans-transversaux/index.html` |

## Boucle de retour
Une variante rejetée par le critique est relancée chez un concepteur neuf avec la correction (2 fois au plus) ou écartée
(« <id> écartée : raison »). Sa plainte → SPEC-BRASSEUR mot pour mot → DEFAUTS-RECURRENTS → contrôle.

## Budget
Concepteurs Opus ~250 k chacun en v0, critique ~150 k.

## Sources
- `INVENTAIRE.md`, `BRIEF-CONCEPTEUR.md`, `references/`, `captures/`
- `src/components/Header.tsx`, `src/components/BottomNav.tsx`, `src/ui/CommandPalette.tsx`, `src/domain/fabActions.ts`

## Signature
État au 14.11 : inventaire fait ; 16 v0 (d4 écartée) ; passe 2 r3p2, m2p2, b3p2, d3p2 (SERIE OK ×4 ; critique : ACCEPT r3p2, m2p2, d3p2 ; b3p2 corrigée après REJET) ; page publiée. PAGE OK, PAGE-CHOIX OK (--min=4). Ouvert : son choix par rangée, puis port 1:1 dans un worktree à soi, harmonisation (en-tête, + au 1280, données communes : PASSE2.md), tests, déploiement, jeu en ligne. systeme.mjs mission : ECHEC sur un seul point, la série Fable, interdite (10.11).

## Contrat réécrit — 15.11 (pilote), choix du brasseur
Paroles, mot pour mot : « Page « Plus » m3 — Mhmm utiliser une plage comme pour les finances.mais ai non tout bien — r3p2 top » ; et le 15.11 07:22 :
d3p2 « Le métier dessiné » ; m3 « attention pour l'interval de temps ça doit être mieux fait. Et on peut le réglés à plusieurs endroits » ; b1 « le + doit être dynamique en fonction de l'écran ou on est ».
À faire : porter 1:1 m3 (la période en plage comme dans Finances « du … au », frise s2ap2, réglable partout où elle sert), b1 avec un + selon l'écran, d3p2, r3p2 (recherche) ;
dans un worktree propre ; tests, build, captures 390/1280 deux thèmes regardées, critique Opus ; puis mise en ligne selon la méthode (check-firebase-config obligatoire) et jeu en ligne.
- Le + selon l'écran (page Période et +), mot pour mot : « b1r — Non mais certaines actions doivent toujours être possible, juste celle de l'écran actuel sont plus mis en avant. Et le bouton doit toujours être flottant.... ».
  Lecture du pilote : b1r refusée telle quelle. Le + reste toujours flottant ; son menu garde toujours les actions communes (Nouvelle écriture, Créer une recette, Lancer un brassin…) et met en tête, en avant, celles de l'écran courant. 2 ou 3 variantes de ce menu (mini maquettes, critique Opus), page neuve, puis port.
