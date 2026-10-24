# M3 — Comparer 2 à 4 houblons ou voies, bascule Barres / Radar

Lis d'abord `work/refonte-frontend/v4/tournoi/REGLES.md` (règles des auteurs), le contrat
de direction `.impeccable/surfaces/prototypes-houblons-v4-index-html.md`, puis **la
grammaire consolidée de M1** : `work/refonte-frontend/v4/tournoi/M1/consolide/index.html`
et son `NOTE.md`. Reprends sa grammaire (pistes zoomées sur la bande du style, repère en
plage, verdicts) ; ton travail porte sur la comparaison.

## La tâche du brasseur

« La moteur nous propose plusieurs houblons et on peut ensuite comparé. » Et : « Un écart
faible pour une ipa peut être très grand pour un autre style vise versa ».

- **État par défaut : S2 du pack.** Lager tchèque premium (3B). Lequel de Saaz, Styrian
  Golding et Hallertau Mittelfrüh est le plus floral, et l'écart compte-t-il ? La vraie
  réponse du modèle : leurs plages se recouvrent sur les 12 familles, verdict « ≈ »
  partout. **C'est la bonne réponse à montrer**, clairement, sans fabriquer un gagnant :
  « le modèle ne les départage pas ». Ce qui les distingue alors (origine, alpha,
  descripteurs des fiches, `citation` cité / non cité) peut se montrer comme tel.
- **Bascule vers une comparaison de voies de S1** (stout, plus floral) : 2 ou 3 voies
  (par exemple Golding, Motueka, Citra cryo), avec leurs effets établis, leurs effets de
  bord hors du style, IBU après, stock. Là, des différences existent : la comparaison doit
  les rendre lisibles.
- **Bascule Barres / Radar**, obligatoire (demande retrouvée du brasseur). Le radar doit
  rester **au style** : axes zoomés sur la bande de chaque famille, bande dessinée, jamais
  un radar absolu 0–100 présenté comme lecture au style. Les barres et le radar montrent
  les mêmes données.
- La démonstration de l'échelle : `scenarios.S2.illustration` (même écart absolu lu sur la
  piste lager et sur la piste IPA). Une petite différence prend de la place dans le style
  étroit, presque aucune dans l'IPA, mais jamais plus fine que les plages.

## Vérité des données, éliminatoire

- Profils de houblons : souvent `completeDomain` (0–100) avec un repère `central` de
  confiance faible et une `citation`. Le modèle distingue surtout cité / non cité : ne fais
  pas croire à une mesure fine. Les verdicts de paire viennent de `S2.pairs`.
- Couleurs des houblons comparés : les 4 couleurs vérifiées en daltonisme de DESIGN.md,
  plus 4 formes, pour que la comparaison ne repose jamais sur la seule couleur.
- IBU, g, g/L et intensités jamais sur la même échelle.

## Ta contrainte de forme

Deux formes imposées, une par mini-maquette ; traduis-la dans le monde de DESIGN.md.

## Sortie

`work/refonte-frontend/v4/tournoi/M3/pNN/index.html` et `NOTE.md`. Contrôle une fois :
`node work/refonte-frontend/v4/tournoi/outils/capture.mjs work/refonte-frontend/v4/tournoi/M3 pNN pMM`.
L'état au chargement est S2 en barres. Regarde tes captures, corrige ce qui est cassé,
puis arrête-toi.
