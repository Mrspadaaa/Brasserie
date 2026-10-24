# psa — la bulle (froide)

**Chaleur : froide.** L'idée la plus attendue, affinée : un toucher sur « ~ simulé » ouvre une bulle juste sous la
pastille, avec une flèche qui pointe vers elle. Ses mots : « ????? » (24.10) ; D122 : le sens n'était que dans un
`title`, un toucher ne montrait rien.

## Base
Comparer de r6a rendu par la reprise r5, copié tel quel (`../assets/parcours.js`, `../assets/style.css`, copies de
`prototypes/houblons-v4/maquettes/parcours-comparer/assets/`). Seul ajout : `psa.js` et `psa.css` (classes `psa-`,
script dans une fonction immédiate, L26). Au repos, la page est celle de r5, au pixel près : pas un mot de plus (95 mots,
comme r5).

## Au toucher
- La pastille devient pleine (noire) : elle est ouverte.
- **~ calculé par le moteur**, puis l'équation en quatre jetons : fiches + 4 g/L + dry hop, 3 j + US-05. Dose et levure sont
  lues dans la ligne de contexte de l'écran : si elles changent, la bulle suit.
- Hachuré : « pas mesuré dans une bière » (le même hachuré que l'inconnu du radar).
- **Vraies valeurs ›** : ferme la bulle et ouvre la feuille « Vraies valeurs et chimie » du dock (vérifié :
  `captures/psa-suite.png`).
- Fermer : un toucher ailleurs, la pastille à nouveau, ou Échap. Échap ne fait plus reculer l'écran (le retour de l'app
  écoutait Échap : la touche est prise en capture tant que la bulle est ouverte).
- Cible du doigt : la pastille reste dessinée à 59 × 24 px, sa zone de toucher fait 71 × 40 px, sans recouvrir « Au style ».

## Ce qui tient
- Rien au repos, tout au toucher : la règle de r6a (peu de mots) et D122 (le sens au doigt) tiennent ensemble.
- L'équation se lit en trois secondes ; les jetons sont les mêmes mots que la ligne de contexte.
- L'honnêteté : « ~ », le hachuré « pas mesuré », et le chemin vers le mesuré.

## Ce qui casse
- La bulle couvre le radar pendant qu'elle est ouverte (c'est une bulle) : on ne lit pas l'explication à côté de ce
  qu'elle explique.
- Elle ne dit pas *quoi* est mesuré, ni pour quel houblon : il faut ouvrir Valeurs (psb le montre, lui).

## Contrôles (24.10)
- `controle-commun.mjs … psa psb psc --page=etat.html --sans=mots` : **COMMUN OK** (couleurs, au-style, survol, blocs,
  contraste, fiche, standard, trait, legende, parlant, brutes : OK). `--sans=mots` vient de GATES : la page de base r5
  compte déjà 95 mots au premier écran (MOTS ECHEC sur r5 elle-même) ; psa en compte 95, aucun de plus.
- `capturer.mjs psa` : repos `aria-expanded=false` → toucher `true` ; Échap → `false` ; le pont ouvre « Vraies valeurs et
  chimie » ; aucune erreur de page.
- `controle-panel.mjs` : PANEL ECHEC (ressemblance 0,96), attendu : le contrat veut trois copies de la même page, où seule
  la pastille change ; ce n'est pas un panel v0.
- `controle-choix.mjs --ecran=comparer` : voir RESULTAT.md de la voie.

Captures : `../captures/psa-repos.png`, `../captures/psa-toucher.png`, `../captures/psa-suite.png`.
