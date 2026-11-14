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

Fable interdit jusqu'à nouvel ordre (l'utilisateur, 10.11) : aucune série en Fable ; critique et tri en Opus. Le contrôle M13
« aucune série en Fable » reste donc en échec, sciemment.

d4 écartée : texte au premier plan et menus déroulants au téléphone (critique, REJET) ; ses greffes vont dans d3. Elle reste visible sur la page, marquée écartée.
Panel v0 en ECHEC (médiane 0,45, 6 % de paires proches) : les quatre états « a » de voie-barre montrent la barre fermée ; corrigé dans voie-p2-b3 (état « a » sur un écran rempli).

## Agents
v0 : un concepteur Opus par série (destinations reprise en trois agents, d2 à d4, après la limite de contexte du premier). Tri et passe 2 : critique Opus. Passe 2 : un concepteur neuf par candidate ; b3p2 rejetée (volumes impossibles) puis relancée une fois, données corrigées.

## Pages
| Sujet | Version | Adresse | Source |
|---|---|---|---|
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
