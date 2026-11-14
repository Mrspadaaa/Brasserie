OK — 4 mini maquettes « Adapter les volumes » (froide, 2 tièdes, chaude), états refusé et vide

## Variantes
| id | chaleur | idée | images (toutes ouvertes) |
|---|---|---|---|
| e10a | froide | Le calculateur remis d'aplomb : carnet en puces, curseur m2 avec zone F1, eaux en tuiles, avant → après barré | repos-390-clair, geste-390-clair |
| e10b (meilleure) | tiède | La cuve d'abord : le pouce règle le niveau sur F1 dessiné ; « 40 L ne tiennent pas dans F1 · 10 L de trop · Ramener à 30 L » | repos-390-clair, geste-390-clair, repos-390-cave, repos-1280-clair, refuse-390-clair, vide-390-clair |
| e10c | tiède | La pesée du jour de brassage : quantités par moment (empâtage → dry hop), à cocher façon z1, curseur en bas | repos-390-clair, geste-390-clair |
| e10d | chaude | L'abaque, un seul trait : axes parallèles ; le trait plie là où ça ne suit pas (levure par palier, pertes d'eau) | repos-390-clair, geste-390-clair, repos-390-cave, repos-1280-clair |

Geste partout : volume cible de 24 L à 40 L au curseur, ingrédients recalculés.

## Fichiers écrits (tous dans voies/e10/)
- `e10a/` à `e10d/` : `etat.html` (?etat=repos|geste|refuse|vide, &theme=clair|cave), PNG, `NOTE.md`
- `capture.mjs` (repris de s5), `calc.ts` (rejoue `scaleBrewRecipeScenario` du dépôt avec vite-node, pour des chiffres vrais au code), `tests.txt`

## Critères (tests.txt)
- G1 : SERIE OK
- G2 : ETATS OK
- G3 : HORS OK (`git status` : seul `SPEC-BRASSEUR.md` modifié hors mission, déjà modifié avant la voie)
- Vitest : aucune suite (rien dans `src/`).

## Captures
`C:\Users\mrspa\Documents\Brasserie\.claude\worktrees\competent-curran-6da51f\work\missions\2026-11-14-brassins\voies\e10\e10{a,b,c,d}\e10?-*.png` (14 images).

## Défauts vus, non corrigés (plafond de tours)
1. e10b vide : la moitié basse de l'écran reste vide.
2. e10b refuse : « + 2 470 L » se lit mal sur les hachures.
3. e10d 1280 : la colonne gauche est vide sous la phrase ; à 390, la bulle « 24 L » cache l'étiquette F1.
4. e10c : les graduations de la piste ne tombent pas sur des litres ronds.
5. e10a : à 390, la levure et la fin des houblons demandent de défiler.

## Prédiction
« La cuve qui déborde, ça je comprends tout de suite. L'abaque est original, mais il faut le lire. »

DÉCISION À PRENDRE : à 40 L, le code garde l'installation de 30 L (47,4 L avant ébullition) sans rien signaler, parce que `targetBh` ne change qu'à partir de 250 L (`ProductionTab.tsx` l. 176). e10b et e10d le rendent visible avec la zone F1. Faut-il que l'outil signale aussi la cuve de brassage ?

CONNAISSANCE : `scaleBrewRecipeScenario` à 24 → 40 L (Système 30 L, 75 %) donne 1 → 2 sachets de levure et 1,1 L d'eau de moins que la proportion stricte (pertes fixes) ; les grains et les houblons suivent le volume.

LEÇON PROPOSÉE : aucune

Skills `boosters-ux`, `impeccable` et `ui-design-system` non chargés, faute de tours sous le plafond. J'ai repris les boosters de BRIEF-AUTEUR et les jetons de s5a.
