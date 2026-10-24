# Lot 8 · La loupe du rail, qui garde l'échelle (brief auteur, une page)

Une variante de la loupe du rail des étapes, jouable, en 30 min au plus. Écris en français.
Répertoire : C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie (chemins absolus).
Texte avec barres obliques inverses ou accents graves : outil Write, jamais Bash. Pas de git.

## Ce que le brasseur a dit, dans l'ordre (18.10)

- D47 : « un truc type UX apple qui zoom focus la où on est » ; D55 : « à la apple en mode zoom
  loop » (et pas de grand vide).
- D61, sur la base v4.1 : « on est à 35' et on a l'impression d'être quasiment à 60' » ; « les deux
  sont à 25' mais on dirait que l'autre est à 0' ».
- Sur la base v4.2, qui a remplacé la loupe par une échelle régulière et poussé les autres houblons
  dans un couloir à droite : « Ça fait pas zoom focus sur l'emplacement. Les ajouter déjà présent
  saute à droite. C'est moins bien qu'avant... » ; « L'échelle est plus du tout respecter quand on
  passe dessus... ».

Il faut donc **les deux à la fois** : une vraie loupe sous le doigt, et une hauteur qui dit le
temps, sans que rien ne saute.

## Point de départ

Le générateur de la base : `work/refonte-frontend/v4/ecran-1/base/generateur/` (lis `README.md`,
puis la section loupe de `etape-consolide.js`). Copie-le dans ton sous-dossier du scratchpad, ne
change **que** la loupe du rail (et sa CSS), construis les 14 pages dans
`work/refonte-frontend/v4/ecran-1/fils8-rail/pNN/`. Ne touche pas à la base ni aux radars.

## Ta variante (ton message te donne ton numéro)

- **p01 · Bulle façon iOS** : le rail reste immobile et linéaire (la hauteur dit le temps, rien ne
  bouge) ; une bulle `data-role="loupe"` près du doigt montre ±15′ du rail grossi environ 3 fois,
  graduations de 5′ écrites, et les houblons de cette plage.
- **p02 · Dock sans état** : le rail se grossit autour du doigt (×2,5 au doigt, retombée douce sur
  ±20′), calculé à partir de la seule position du doigt (aucune fenêtre qui se fait entraîner) ;
  la longueur totale reste celle du repos, à 80 px près.
- **p03 · Règle à côté** : le rail reste immobile et linéaire ; une règle verticale grossie
  apparaît à côté de la pastille tenue (graduations de 5′ écrites autour du doigt).
- **p04 · Libre (chaud)** : ta meilleure idée, mêmes exigences.

## Les exigences, toutes contrôlées par `controle-rail.mjs`

- La loupe existe (D63 : une bulle qui écrit au moins 5 minutes, ou des graduations au moins
  2 fois plus espacées près du doigt qu'au loin).
- La hauteur dit le temps à 12 % près, pour le houblon tenu et pour les autres (D61). Le moment ne
  dépend que de la position du doigt.
- En descendant par pas de 10 px, le moment ne remonte jamais et ne saute pas de plus de 10′, et
  aucun autre houblon ne bondit de plus de 24 px (D61 bis).
- Les houblons déjà posés ne vont jamais de côté et restent dans le segment de leur moment
  (D64). Deux houblons au même moment : une seule étiquette réunie (« 35′ Motueka · Nugget »)
  ou côte à côte collés, jamais l'un poussé ailleurs.
- Aucun texte l'un sur l'autre (D56), pas de grand vide (D55), la carte tenue réduite à une ligne.

## Contrôles, et regarder

1. `node work/refonte-frontend/v4/tournoi/outils/controle-rail.mjs work/refonte-frontend/v4/ecran-1/fils8-rail pNN`
   doit imprimer `RAIL OK`.
2. Capture pendant le geste, et regarde, les trois cas du brasseur : Nugget tenu à 15′ avec
   Motueka à 40′ ; Nugget tenu à 35′ ; Motueka tenu à 35′ avec Nugget à 35′ (dans
   `fils8-rail/captures/pNN-…-pendant.png`).

Réponse finale courte : ta loupe en une phrase, RAIL OK, les trois captures regardées.
