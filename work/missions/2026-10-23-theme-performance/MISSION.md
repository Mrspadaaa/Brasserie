# Mission 2026-10-23-theme-performance

## Objectif
Préparer la vraie intégration de l'outil houblons dans l'app, sur deux demandes de l'utilisateur du 23.10 :
- « Le thème de l'app principal doit être revu. On garde celle des maquettes » : les couleurs de SES maquettes
  choisies (page blanche, gris neutres, texte presque noir ; valeurs mesurées en tête de DESIGN.md) deviennent le thème
  par défaut de toute l'app. Ce n'est PAS le « clair » à papier chaud de `prototypes/houblons-v4/ecran/THEMES.md` :
  « Pourquoi c'est en thème pastel horrible ??? C'est pas ce que j'ai demandé ??? » (D106). Le « cave » actuel devient son
  thème sombre, au choix. Décision inscrite en tête de DESIGN.md et dans SPEC § 5.
- « Aussi regarder pour les optimisation, latence ect.. » : mesurer la maquette jouable comme sur un téléphone (temps de
  chargement, latence d'un toucher, fluidité d'un glisser, poids), avec un contrôle réutilisable dans l'app, et classer
  les optimisations par gain mesuré, pour la voie p8-portabilite de la mission maquette-parcours.

Fini veut dire :
- toute l'app s'affiche en clair par défaut, et en « cave » au choix ; chaque écran vérifié dans Chrome au téléphone et à
  l'ordinateur, dans les deux thèmes, captures regardées ; contrastes mesurés aux seuils de DESIGN.md ; build et tests
  verts ; la maquette jouable inchangée en clair ;
- `mesure-performance.mjs` échoue sur un témoin lent, passe sur un témoin rapide, et rend ses mesures sur la maquette
  construite ; les optimisations sont classées et transmises à p8 ;
- le critique a jugé l'app en clair contre les maquettes qu'il a choisies.

La porte B (l'intégration de l'outil houblons dans l'app) reste fermée : cette mission ne porte que le thème de l'app et
des mesures. Rien n'est poussé.

## Décisions
| Décision | Options | Décideur | État |
|---|---|---|---|
| Thème de l'app | les couleurs de ses maquettes choisies ; le « clair » chaud du prototype ; cave actuel | brasseur | tranchée le 23.10 : ses maquettes choisies (blanc neutre), par défaut ; le « clair » chaud est rejeté (D106) ; « cave » reste en thème sombre |
| Choisir le thème | réglage dans l'app ; thème du système | pilote | tranchée : clair par défaut, « cave » par un réglage gardé sur l'appareil, hors ligne ; réversible |
| Budgets de performance (téléphone moyen simulé, processeur ×4) | réponse à un toucher ≤ 100 ms ; image d'un glisser ≤ 16 ms en médiane, 33 ms au 95e centile ; écran utilisable ≤ 2,5 s à froid | pilote | tranchée : modèle RAIL ; à revoir sur un vrai téléphone |

## Voies
| Voie | Objectif | Niveau | Agent | Modèle | Plafond | Possède | Dépend de | Contrôles | Décideur | Étape |
|---|---|---|---|---|---|---|---|---|---|---|
| t1-theme | les couleurs de ses maquettes choisies dans toute l'app : jetons en variables par thème, blanc neutre par défaut, « cave » en réglage, couleurs en dur remplacées, DESIGN.md réécrit ; tous les écrans vérifiés en deux thèmes | conception | concepteur | opus | 150 | `tailwind.config.js`, `src/index.css`, `src/theme/**`, `src/main.tsx`, composants de `src/` qui portent une couleur en dur, `DESIGN.md`, `voies/t1-theme/**` | — | npm run build ; npm test ; contraste (script de la voie) ; captures 390 et 1280 en deux thèmes ; maquette inchangée | pilote | — |
| t2-performance | `mesure-performance.mjs` (chargement, toucher, glisser, poids, sous processeur ×4 et ×6), ses témoins, joué sur la maquette construite ; optimisations classées par gain | jugement | auteur | sonnet | 80 | `work/refonte-frontend/v4/tournoi/outils/mesure-performance.mjs`, `work/refonte-frontend/v4/tournoi/outils/temoins/perf-*/**`, `voies/t2-performance/**` | — | systeme.mjs echoue (témoin lent) ; systeme.mjs verdict (maquette) | pilote | — |
| t3-critique | relecture de t1 : l'app en clair, écran par écran, contre les maquettes qu'il a choisies et DESIGN.md | jugement | critique | fable | 40 | `voies/t3-critique/RESULTAT.md` | t1-theme | note RESULTAT (un avis par écran) | pilote | — |

Chemins de « Possède » : relatifs à la racine du dépôt ; `voies/…` est relatif au dossier de cette mission.

## Boucle de retour
- Un critère rouge : l'agent corrige dans sa voie, 3 essais. Au-delà, SendMessage au même agent (2 relances), puis le
  pilote réécrit le contrat.
- Un écran rejeté par le critique : relancé chez t1 ou écarté, jamais laissé en plan (M12).
- Une optimisation mesurée : transmise à la session de la maquette (p8-portabilite), qui possède le code de la maquette.

## Budget
Écrite le 23.10 vers 16 h 15 (heure de la fenêtre) : 5 h à 81 %, semaine à 64 %. Lancement après la remise à zéro de la
fenêtre de 5 h, pour ne pas bloquer la reprise de la maquette (règle n° 1). Plafond visé : 5 h sous 80 %.

## Sources
- `prototypes/houblons-v4/ecran/THEMES.md` (le mécanisme seulement ; ses valeurs « clair » sont rejetées, D106)
- `work/refonte-frontend/v4/choix/ecrans.json` et les captures de ses maquettes choisies
- `prototypes/houblons-v4/ecran/src/themes.css`
- `prototypes/houblons-v4/ecran/tailwind.config.js`
- `tailwind.config.js`
- `DESIGN.md`
- `.claude/rules/affinee-frontend.md`
- `work/missions/2026-10-23-maquette-parcours/voies/p7-implementation/RESULTAT.md`

## Signature
