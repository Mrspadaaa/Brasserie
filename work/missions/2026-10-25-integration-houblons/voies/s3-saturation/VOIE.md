# Voie s3-saturation — une bière déjà au-dessus du style : la demande prime sur la bande

Agent : auteur (Sonnet). Le moteur et la carte de Suggérer. La voie s'arrête au code, aux tests, au build, aux états et aux mesures.
**Économise les tours** ; le mécanique va dans une `DEMANDE EXECUTANT :`. Écris RESULTAT.md tôt.

## Le défaut (vu par le pilote et le critique, 27.10)
Sa neipa v3 a 78 g de Lotus à 20′ et 144 g au dry hop actif. Il demande « plus d'agrumes » au dry hop actif. Suggérer propose alors East
Kent Goldings, Golding, Spalter Select et Mount Hood, tous marqués hors du style, et la carte dit « Plus agrumes — Aucune voie houblon ».
- Le critique : « ça veut dire quoi aucune voie, il y en a quatre en dessous ? ».
- Même classe de défaut : avec 100 g de Columbus au dry hop, la carte « Plus tropicaux » dit « Aucune voie houblon » au-dessus de rangées.
- Le brasseur : « Corrige jusqu'à finir même si 100% » (D194).

Reproductions, à lancer avant toute correction (elles doivent montrer le défaut sur HEAD) :
- `scratchpad/saturation.mjs` ;
- `scratchpad/bannir2.mjs B`.
Elles sont dans `C:/Users/mrspa/AppData/Local/Temp/claude/C--Users-mrspa--codex-worktrees-openai-clean-start-Brasserie/16fc09ec-4e69-48a9-9744-5912b6ef6552/scratchpad/`. Chacune se lance par
`node scripts/with_server.mjs --server "npm run dev -- --port P --strictPort" --port P --env VITE_HOP_V4=on -- node <script> [arg]`.

## Hypothèses du pilote, à vérifier par la mesure, pas à croire
1. **La famille demandée déborde.** `styleOverflow` (dans `src/domain/hopIndex/v4/voies.ts`, vers la ligne 372) compte l'excès d'une famille au-dessus
   de sa bande. Il le compte aussi pour la famille que le brasseur demande d'augmenter (`direction[f] > 0`). Quand sa bière est déjà
   au-dessus de la bande en agrumes, ajouter des agrumes (sa demande) est un débordement ; les nobles, qui en ajoutent peu, passent devant
   au rang (`overflowRang`), et l'écran les marque hors du style.
   - Règle de principe proposée : pour une famille qu'il demande d'augmenter, dépasser la bande est sa demande. Ce n'est ni un
     débordement au rang, ni « hors du style » à l'écran.
   - De même, pour une famille qu'il demande de baisser ou qu'il bannit, descendre n'est pas un défaut.
2. **Un excès minuscule disqualifie.** La carte (`verdict`, `src/ui/hopIndex/suggerer/voies.ts`) écarte toute voie dont `hors` n'est pas
   vide. Or une famille déjà au-dessus de sa bande compte comme « hors » au moindre ajout, même de 0,01 cran.
   - Règle proposée : sous un quart de cran ajouté, ce n'est pas « hors du style ». Écris pourquoi : un cran est le pas du style.
Si la mesure contredit une hypothèse, dis-le et propose mieux.

## Méthode (L20, L14)
- Écris les règles dans RESULTAT.md AVANT les mesures de non-régression.
- **Généralisation** : `scripts/eval-hop/a4-general.ts`, soit 124 cas qu'il n'a jamais nommés, avec son compte des contradictions carte/liste.
  Attendu : moins de contradictions qu'à HEAD (ae7c7a8d) ; un phare médian au moins aussi bon ; et la liste des cas qui reculent de plus de
  20 places.
- Ses six et sa neipa v3 : un seul passage, à la fin, en rapport.

## Critères
- Les deux reproductions, après correction :
  - saturation : pas de noble en tête, et la carte ne dit pas « Aucune » au-dessus de rangées ;
  - B : la carte « Plus tropicaux » ne contredit plus la liste.
  Ouvre une capture de chaque cas (L12).
- Un test par règle, rouge sur ae7c7a8d, vert après (L13).
- `npx vitest run tests/unit/hopIndexV4 prototypes/houblons-v4/tests --maxWorkers=2` : vert ; un test adapté porte sa raison (« D195 »).
- `npx tsc --noEmit` : sans sortie.
- La maquette et les états : `node prototypes/houblons-v4/parcours/outils/construire.mjs`, puis
  `node work/refonte-frontend/v4/tournoi/outils/controle-etats.mjs prototypes/houblons-v4/maquettes/parcours`, qui doit rendre `ETATS OK`.
  Un attendu qui ne dépend que de l'ordre des données s'actualise selon e3, avec la note « D195 ».
- Non-régressions, en tableau avant/après :
  - `f2-phares.ts`, `f5-phares.ts`, `f9-nonreg.ts` ;
  - Citra cryo premier dans 2 listes sur 16 au plus ;
  - East Kent Goldings premier du stout S1 ;
  - D105 et D106 ;
  - le bannissement de D194 (`tests/unit/hopIndexV4/bannirZero.test.ts` ; `scratchpad/bannir2.mjs A` et `B`).
- Dans une `DEMANDE EXECUTANT :` :
  - le build à part (`VITE_HOP_V4=on npx vite build --outDir C:/Users/mrspa/AppData/Local/Temp/dist-s3`), avec B5 ≤ 164 ko et la fumée du
    worker ;
  - `check:hop-perf` et `f2-perf`.

## Possède
- `src/domain/hopIndex/v4/voies.ts`, `palier.ts`, `departage.ts`.
- `src/ui/hopIndex/suggerer/voies.ts` (`horsDuStyle`, `verdict`).
- `scripts/eval-hop/s3-*` (neufs), `scripts/eval-hop/a4-general.ts` (lecture, et sa sortie dans ta voie).
- Les tests du moteur et de Suggérer concernés, et `prototypes/houblons-v4/data/pack-*.json` s'ils sont régénérés par `build-pack.ts`.
- Dans `work/refonte-frontend/v4/choix/etats/*.json` : les seuls états concernés.
- `work/missions/2026-10-25-integration-houblons/voies/s3-saturation/`.

Personne d'autre n'écrit dans l'arbre. Ne touche ni à `.codex/`, ni à `source4-portable-bundle-manifest-01.json`, ni à `functions/`. Aucun
appel Gemini. N'écris aucun code par heredoc ni par `node -e`. Pas de `git stash`, aucun commit. Rends une ligne.
