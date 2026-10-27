# Voie a4-algo-biais — trois biais du classement de Suggérer

Agent : auteur (Sonnet). Le moteur, pas l'écran. La voie s'arrête au code, aux tests, au build, aux états et aux mesures. Pour la suite
mécanique, écris une `DEMANDE EXECUTANT :`.

## Ses mots
- 27.10, sur la page de sa Double IPA : « Regarde surtout pour l'algo et implemtation avec l'ai » (D124). L'IA part dans la voie ia3. Toi,
  tu fais l'algorithme.
- Plus anciens, à tenir :
  - « Il faudrait pas que l'algo trie trop ou exclue trop tôt » ;
  - « elle récompense même surtout l'α c'est pas la bonne métrique » ;
  - « Citra cryo semble toujours être en tête pour beaucoup de choses ».

## Base, à lire
- `voies/f9-intensite-typicite/RESULTAT.md` (causes mesurées) et `voies/t2-typicite-defaut/RESULTAT.md` (le défaut actuel : la typicité).
- `voies/m9-dipa-listes/RESULTAT.md` : les rangs de ses six, sur sa vraie recette `voies/f9-intensite-typicite/recette-neipa-v3.txt`.
- D99, D102 (B1 : « on classe tout, et on ne coupe qu'à l'affichage »), D120, D121, D124 dans `work/refonte-frontend/decisions.md`.

## Les trois biais, chacun mesuré
1. **El Dorado freiné par le débordement de style.** Il est 74e en agrumes et 69e en tropicaux, en 22A. Sa poire (pomme/poire) déborde
   d'environ +0,8 cran, sur une famille **neutre** en 22A. D99 ne compte le débordement que pour une famille marquée.
   - Question à trancher par la mesure : une famille neutre du style (ni attendue, ni défaut) doit-elle punir comme une famille hors du
     style ?
   - Regarde `src/data/hopV4/style-bands.json` et la règle du débordement dans `voies.ts`.
2. **Calypso exclu trop tôt.** En agrumes, il sort de la borne de 80 du pool : l'ordre de qualité de la présélection le met au-delà du
   80e. D102 B1 disait « on classe tout ».
   - Un houblon qui cite la famille demandée ne doit pas être écarté par la présélection.
   - La borne existe pour le coût (f2, f4) : toute solution se chronomètre (L20).
3. **Une typicité inconnue passe après une typicité rare.** Mandarina passe de 5e à 18e avec la typicité. En 22A, Beer Analytics ne la
   compte pas dans ses 16 premiers styles : sa part n'est connue que bornée, au plus `p16`.
   - Un inconnu n'est pas une rareté ; il ne doit jamais passer derrière un rare connu.
   - Sers-toi de la borne quand elle tranche : si `p16` est sous le seuil du rare, le houblon est rare, et c'est connu.

## Méthode (L20, L14)
- Écris d'abord, dans RESULTAT.md, la règle que tu poses pour chaque biais. Pose-la par principe, jamais réglée sur ses six. Ses six sont la
  moitié jugée ; les autres styles et les phares sont la moitié du réglage.
- Pour chaque biais : un test qui échoue sur HEAD, puis qui passe (L13).
- **Rapport, pas porte** : le rang de ses six sur neipa v3, avant et après, en agrumes et en tropicaux, au dry hop actif et au whirlpool.
  « 4 sur 6 dans les 10 » n'est pas une porte : les données ne le permettent pas (leçon L14 du 27.10).

## Critères
- Trois tests rouges sur HEAD (2deafff1 ou plus récent), verts après.
- `npx vitest run tests/unit/hopIndexV4 prototypes/houblons-v4/tests --maxWorkers=2` : vert ; un test adapté porte sa raison (« D125 »).
- `npx tsc --noEmit` : sans sortie.
- Build à part :
  - construis avec `VITE_HOP_V4=on npx vite build --outDir C:/Users/mrspa/AppData/Local/Temp/dist-a4` ;
  - `node scripts/check-hop-budget.mjs --dist <ce dossier> --chunk-outils profil-simule` : B5 ≤ 164 ko ;
  - `fumee-worker-prod.mjs --dist=<ce dossier>` : `WORKER PROD OK`.
- `npm run check:hop-perf` et `npx vite-node scripts/eval-hop/f2-perf.ts` : pas de dépassement nouveau, au ms près, contre les mesures de
  c8 (`voies/c8-composes-hors-chunk/RESULTAT.md`).
- Non-régressions, en tableau avant/après :
  - `f2-phares.ts`, `f5-phares.ts`, `f2-borne.ts` et `f9-nonreg.ts` ;
  - Citra cryo premier dans 2 listes sur 16 au plus (D121) ;
  - East Kent Goldings premier du stout S1 ;
  - D105, et D106 (le recul de l'usage « arôme » à 60′).
- États : `node prototypes/houblons-v4/parcours/outils/construire.mjs`, puis
  `node work/refonte-frontend/v4/tournoi/outils/controle-etats.mjs prototypes/houblons-v4/maquettes/parcours` : `ETATS OK`. Un attendu
  qui ne dépend que de l'ordre des données s'actualise selon la convention e3 (`voies/e3-etats-donnees/RESULTAT.md`), avec la note
  « D125 ».

## Possède
- `src/domain/hopIndex/v4/` : `voies.ts`, `departage.ts`, `typicite.ts`, `typicite-acces.ts`, `palier.ts`, et des modules neufs.
- `scripts/eval-hop/a4-*` (neufs). Les tests du moteur concernés. `prototypes/houblons-v4/data/pack-*.json`, s'ils sont régénérés par
  `build-pack.ts`.
- Dans `work/refonte-frontend/v4/choix/etats/*.json` : les seuls états concernés.
- `work/missions/2026-10-25-integration-houblons/voies/a4-algo-biais/`.

**La voie ia3 travaille en même temps.** Elle possède `functions/`, `src/ui/hopIndex/suggerer/`, `src/ui/hopIndex/parcours/adaptateur.ts`.
N'y touche pas. Si tu en as besoin, écris-le dans RESULTAT.md (`BESOIN IA3 : …`). Relis `git status` avant ton build final.

Ne touche ni à `.codex/`, ni à `source4-portable-bundle-manifest-01.json`, ni à `functions/.env`. Aucun appel Gemini. N'écris aucun code
par heredoc ni par `node -e`. Pas de `git stash`, aucun commit. Écris RESULTAT.md tôt et tiens-le à jour. Rends une ligne.
