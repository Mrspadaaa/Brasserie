# Mission 2026-11-14-compagnon

## Objectif
Brasseur, 14.11 : « Lance des autres sous session pour les autres écrans important(sauf clients) pour des mini maquettes » ; « surtout regarde pour l'aide au brasseur ».
Écran : le compagnon brasseur (`src/ui/BrewerChat.tsx`, `BrewerProposalCard.tsx`, `BrewerActivity.tsx`, `BrewerBudget.tsx`, `BrewerNotifications.tsx`, `brewer-chat.css`), ses entrées (bouton flottant, Finances « Vérifier mes opérations », menu « Mes conversations »).
Fini : 1) analyse au banc local (réponses simulées) ; 2) 12 mini maquettes non jouables, 3 séries de 4, page privée neuve ; 3) son choix porté 1:1, testé, déployé (hébergement seul), joué en ligne (une question réelle au plus, rien appliqué).

## Couverture (exigée)
Brasseur, 14.11 : « J'ai l'impression que tout les écrans sous les boutons de ces Tabs ne sont pas traitées ??? ». Tableau `COUVERTURE.md` : chaque vue, mode, état, « Mes conversations », chaque entrée depuis les autres écrans, et la page de maquettes qui le montre. Une vue sans maquette = pas fini.

## État de l'art
- Problème type : interface de conversation avec un agent long (attente asynchrone, réponse structurée, propositions à valider) ; aucun algorithme.
- Examiné : composants existants (`Sheet`, `BrewerWorkCard`, `BrewerProposalCard`), banc `scripts/check-brewer-jobs-mobile.mjs` (interception des callables), puppeteer-core déjà au dépôt.
- Décision : réemploi du banc existant par interception ; aucune bibliothèque neuve.

## Décisions
| Décision | Options | Décideur | État |
|---|---|---|---|
| Nom du modèle à l'écran | brut ; aucun nom (DESIGN.md « Le nom du fournisseur du modèle ne s'affiche pas ») | pilote | tranchée : aucun nom de fournisseur ni de modèle à l'écran |
| Variante portée | 12 mini maquettes | brasseur | tranchée : p2a choisie : « Tout se lit sans lire / p2a · de s3b / Parfait » (15.11) |

## Voies
| Voie | Objectif | Niveau | Agent | Modèle | Plafond | Possède | Dépend de | Contrôles | Décideur | Étape |
|---|---|---|---|---|---|---|---|---|---|---|
| b-banc | captures de chaque état, 4 formats, planches | mécanique | executant | haiku | 40 | work/missions/2026-11-14-compagnon/voies/b-banc, work/missions/2026-11-14-compagnon/analyse/cap | — | controle-banc.mjs | pilote | — |
| s1 | 4 mini maquettes, 4 cadres | conception | concepteur | opus | 60 | work/missions/2026-11-14-compagnon/voies/s1 | b-banc | baseline (DOSSIER « À garder »), sans controle-choix : aucun choix inscrit pour le compagnon dans ecrans.json, controle-serie.mjs, verifier-page.mjs | brasseur | v0 ×4 (1 froide, 2 tiede, 1 chaude) |
| s2 | 4 mini maquettes, 4 cadres | conception | concepteur | opus | 60 | work/missions/2026-11-14-compagnon/voies/s2 | b-banc | baseline (DOSSIER « À garder »), sans controle-choix : aucun choix inscrit pour le compagnon dans ecrans.json, controle-serie.mjs, verifier-page.mjs | brasseur | v0 ×4 (1 froide, 1 tiede, 2 chaude) |
| s3 | 4 mini maquettes, 4 cadres | conception | concepteur | opus | 60 | work/missions/2026-11-14-compagnon/voies/s3 | b-banc | baseline (DOSSIER « À garder »), sans controle-choix : aucun choix inscrit pour le compagnon dans ecrans.json, controle-serie.mjs, verifier-page.mjs | brasseur | v0 ×4 (1 froide, 2 tiede, 1 chaude) |
| c1 | tri et défauts du panel s1 à s3, 3 candidates et greffes | conception | critique | opus | 30 | work/missions/2026-11-14-compagnon/critique | s1, s2, s3 | controle-panel (absent du dépôt : captures ouvertes), SYNTHESE.md | pilote | tri |
| p2a | passe 2 de s3b, 12 cadres | conception | concepteur | opus | 60 | work/missions/2026-11-14-compagnon/voies/p2a | c1 | baseline, sans controle-choix : le choix vient de cette page, controle-serie.mjs --complet, verifier-page.mjs | brasseur | passe 2 |
| p2b | passe 2 de s2a, 12 cadres | conception | concepteur | opus | 60 | work/missions/2026-11-14-compagnon/voies/p2b | c1 | baseline, sans controle-choix : le choix vient de cette page, controle-serie.mjs --complet, verifier-page.mjs | brasseur | passe 2 |
| p2c | passe 2 de s2d, 12 cadres | conception | concepteur | opus | 60 | work/missions/2026-11-14-compagnon/voies/p2c | c1 | baseline, sans controle-choix : le choix vient de cette page, controle-serie.mjs --complet, verifier-page.mjs | brasseur | passe 2 |
| port | p2a portée 1:1 dans le worktree compagnon-p2a | jugement | auteur | sonnet | 120 | C:/Users/mrspa/AppData/Local/Temp/compagnon-p2a/src/ui, work/missions/2026-11-14-compagnon/voies/port | p2a | controle-port.mjs (noms, tsc, tests, build) | pilote | reprise |

Écarts assumés à M13 : « aucune série en Fable » (Fable interdit jusqu'à nouvel ordre, 10.11, et brief de la session parente : « FABLE INTERDIT ») ; « série libre au brief minimal » (chaque série porte sa chaude libre). `systeme.mjs mission` garde ces lignes en échec.

## Agents
Tri c1 (14.11) : candidates s3b, s2a, s2d ; passe 2 par agents neufs (D207) : p2a ← s3b, p2b ← s2a, p2c ← s2d. Verdict c2 : p2c ACCEPT ; p2a et p2b REJET (Brassin 31 donné à deux bières, J+4 incohérent avec 36 h, curseur du plafond mal placé ; erreurs venues du dossier du pilote) → relancés une fois par agents neufs, corrigés, rejoués par le pilote (SERIE OK, PAGE OK, « Blonde » au brassin 30, captures p2b accueil et p2a plafond ouvertes). Scénario « dry hop chargé » retiré (faux en brassage, relevé par c1) : remplacé dans les VOIE.md de passe 2.

## Pages
| Sujet | Version | Adresse | Source |
|---|---|---|---|
| Compagnon brasseur | v0 ×12 et passe 2 ×3 ; 14.11 | https://claude.ai/artifact/V4JfNqJvtKUWRFLMoxYLam | `work/refonte-frontend/v4/outils/pages/2026-11-14-compagnon/index.html` |

## Boucle de retour
Échec de voie : relance par le pilote (2 au plus), puis contrat réécrit. Plainte du brasseur : SPEC-BRASSEUR mot pour mot, contrôle rouge sur la version rejetée.

## Budget
Fenêtre partagée avec les autres sessions du 14.11 ; agents plafonnés.

## Sources
- `src/ui/BrewerChat.tsx`
- `docs/compagnon-brasseur.md`
- `scripts/check-brewer-jobs-mobile.mjs`

## Signature
