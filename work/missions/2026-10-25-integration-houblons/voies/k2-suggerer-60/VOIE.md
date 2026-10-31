# Voie k2-suggerer-60 — Suggérer à 60′ : son palier choisi (M1 + M2), les remplacements qui restent, l'usage

Agent : auteur (Sonnet). Le port dans l'app d'un écran qu'il a choisi, et le moteur qui le nourrit. La voie s'arrête au code, aux tests, au
build, aux captures et aux mesures. Le critique (Fable) jugera tes captures. Le mécanique va dans une `DEMANDE EXECUTANT :`. Écris
RESULTAT.md tôt.

## Ses mots
- 31.10 : « tout fonctionne plutôt bien sauf pour les algo, surtout sur la partie 60', il y a souvent pas de propostion du tout » (D196).
- 26.10, sur la page m6 : « M1 + M2 · avec l'IA semble le mieux mais pallier 60' toujours pas très clair et pas de vrai dry hopping ».
  Précisé : « les rangées, qui donnent l'α et les grammes, mais pas ce que chacune apporte » — « Exactement » (D165).

## Base, à lire
- `voies/d60-diagnostic/RESULTAT.md`, en entier : les causes C1 à C3 et les corrections K2, K4 et K5.
- Sa maquette choisie (règle n° 1, reprise telle quelle) : m6, M1 + M2. Ouvre `voies/m6-suggerer-moment/img/m1m2.png`,
  `m1-groupes-60-dryhop.png`, `m2-carte-amertume.png`, `m2-carte-touchee.png`, `m1m2-polaris-touche.png`, ainsi que `RESULTAT.md` et
  `page.html` de m6. Lis aussi le complément d'écran Suggérer dans `work/refonte-frontend/v4/choix/ecrans.json`.
  - Inventorie chaque élément de M1 et de M2 avant de coder (L03) : le groupe « Amérisant · 60′ », la carte « Plus d'amertume +n IBU », les
    rangées, ce qu'un toucher ouvre.
  - Fais des captures côte à côte de ta construction et de la maquette, état par état.
- Le moteur : `src/domain/hopIndex/v4/voies.ts`. L'option `palier60` et `VoieResult.palier60` (g2b, D88 B) existent : usage puis α, à la
  dose exacte pour +n IBU. `palier.ts` donne `InfoPalier`.

## Ce qui est demandé
1. **K2.** Brancher le palier 60′ dans Suggérer comme M1 + M2.
   - L'adaptateur appelle `palier60`.
   - Le groupe « Amérisant · 60′ » et la carte « Plus d'amertume +n IBU » apparaissent comme dans sa maquette.
   - « Plus d'amertume » ne rend plus 0 voie.
   - **D165** : chaque rangée dit ce qu'elle apporte, en plus de l'α et des grammes. Ce sont les IBU ajoutés, et ce que la maquette prévoit,
     comme la cohumulone ou l'usage. Rien de plus que ce que sa maquette permet : pas de cockpit, texte à 12 px au moins.
2. **K4.** Chaque houblon de la recette qu'on remplace garde sa place : au moins 2 rangées par « Remplacer X », au lieu d'une coupe
   globale `limit`/`buyLimit` qui les absorbe. L'exclusion D194 (`exclue`) passe AVANT la coupe, et une place retirée est rendue.
   - Cas de preuve : la 21C, avec résineux banni et sans stock, où d60 trouvait 0 « Remplacer Nugget · 60′ ».
3. **K5.** La règle d'usage de g2b s'applique aussi à « remplacer à IBU égal » : un amérisant ou un double usage passe devant un houblon
   d'arôme.
   - Cas de preuve : le stout, avec résineux banni, ne doit plus avoir Cashmere en tête pour remplacer Nugget à 60′.
4. Garder le bannissement D194 tel quel : « aucune suggestion sur ce chemin ».

## Critères
- Tests rouges sur HEAD, puis verts, pour K2, K4 et K5 (L13).
- Les bancs de d60, rejoués, en tableau avant/après :
  - `d60-mesure.ts` : sur 56 cas, ajouts à 60′ montrés quand l'amertume est demandée ;
  - « Remplacer X · 60′ » montré ;
  - la 21C sans stock, avec résineux banni ;
  - le stout avec résineux banni.
- `npx vitest run tests/unit/hopIndexV4 prototypes/houblons-v4/tests --maxWorkers=2` : vert. `npx tsc --noEmit` : sans sortie.
- Build à part : `VITE_HOP_V4=on npx vite build --outDir C:/Users/mrspa/AppData/Local/Temp/dist-k2`, B5 ≤ 164 ko.
- La maquette et les états :
  - `node prototypes/houblons-v4/parcours/outils/construire.mjs` ;
  - `node work/refonte-frontend/v4/tournoi/outils/controle-etats.mjs prototypes/houblons-v4/maquettes/parcours` doit rendre `ETATS OK`.
  Un attendu qui ne dépend que des données s'actualise selon e3.
- Captures à 390 × 844 de M1 et M2 dans l'app, à côté de sa maquette, toutes ouvertes (L12) :
  - sa neipa v3 avec « plus d'amertume » ;
  - le stout avec résineux banni.
- Non-régressions :
  - `bannir2.mjs` A et B, ainsi que `saturation.mjs` (dans `C:/Users/mrspa/AppData/Local/Temp/claude/C--Users-mrspa--codex-worktrees-openai-clean-start-Brasserie/16fc09ec-4e69-48a9-9744-5912b6ef6552/scratchpad/`) ;
  - `s3-general.ts`, soit 0 contradiction carte/liste ;
  - f5-phares ;
  - Citra cryo premier dans 2 listes sur 16 au plus ;
  - East Kent Goldings premier du stout S1.

## Possède
- `src/domain/hopIndex/v4/voies.ts`, `palier.ts`.
- `src/ui/hopIndex/parcours/adaptateur.ts`, et `src/ui/hopIndex/suggerer/` (`voies.ts`, `index.tsx`, ses CSS).
- Les tests concernés et `prototypes/houblons-v4/data/pack-*.json` s'ils sont régénérés.
- Dans `work/refonte-frontend/v4/choix/etats/*.json` : les seuls états concernés.
- `scripts/eval-hop/k2-*` (neufs).
- `work/missions/2026-10-25-integration-houblons/voies/k2-suggerer-60/`.

La voie k1 modifie `src/domain/hopIndex/v4/substitution.ts` en même temps : n'y touche pas. Ne touche ni à `.codex/`, ni à
`source4-portable-bundle-manifest-01.json`, ni à `functions/`. Aucun appel Gemini. N'écris aucun code par heredoc ni par `node -e`. Pas
de `git stash`, aucun commit. Rends une ligne.
