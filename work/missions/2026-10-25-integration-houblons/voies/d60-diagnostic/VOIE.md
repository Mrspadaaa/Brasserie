# Voie d60-diagnostic — « à 60′, il y a souvent pas de proposition du tout »

Agent : auteur (Sonnet). **Un diagnostic, pas une correction.** Rien n'est modifié dans `src/`. La voie rend des mesures, les causes
prouvées et des corrections proposées, chacune avec sa règle de principe. Le mécanique (séries de captures, rejeux) va dans une
`DEMANDE EXECUTANT :`. Écris RESULTAT.md tôt.

## Ses mots (31.10)
« tout fonctionne plutôt bien sauf pour les algo, surtout sur la partie 60', il y a souvent pas de propostion du tout ».
Lecture du pilote : « les algo » sont Suggérer et Substituer. « La partie 60′ » est, au choix :
- dans Suggérer : le palier 60′ (M1, M2 de m6 : le groupe amérisant à 60′, la carte « Plus d'amertume »), le moment 60′ du radar, ou un
  groupe vide quand on choisit 60′ ;
- dans Substituer : les remplaçants d'un houblon à 60′ (u4).
Mesure les deux ; ne choisis pas une lecture sans preuve.

## Où mesurer
Dans la copie propre, **au commit de production** `ae7c7a8d` : c'est ce qu'il voit.
- `C:/Users/mrspa/AppData/Local/Temp/deploy-63130965` ; `git checkout --detach ae7c7a8d`. Tu es seul à y écrire.
- N'y modifie aucun fichier suivi ; tes scripts et sorties vont dans ta voie, dans l'arbre principal :
  `work/missions/2026-10-25-integration-houblons/voies/d60-diagnostic/`.
- Bancs d'écran existants à réemployer :
  - `C:/Users/mrspa/AppData/Local/Temp/claude/C--Users-mrspa--codex-worktrees-openai-clean-start-Brasserie/16fc09ec-4e69-48a9-9744-5912b6ef6552/scratchpad/ecran-bannir.mjs` (recette par `M9_HOPS`) ;
  - `saturation.mjs` et `bannir2.mjs` dans le même dossier ;
  - `scripts/eval-hop/a4-general.ts`, qui couvre 31 styles.
  Chaque contrôle Chrome se lance par
  `node scripts/with_server.mjs --server "npm run dev -- --port P --strictPort" --port P --env VITE_HOP_V4=on -- node <script>`.

## Ce qui est demandé
1. **Un tableau de fréquence.** Prends au moins 4 recettes de fixture :
   - sa neipa v3 ;
   - le stout S1 ;
   - une 21C ;
   - une pale ale avec un amérisant à 60′.
   Croise-les avec les demandes courantes : plus d'agrumes, tropicaux, floral, résineux, amertume, et un bannissement.
   - Dans Suggérer, compte combien de propositions arrivent à 60′.
   - Dans Substituer, compte combien de remplaçants à 60′ pour les houblons de la recette.
   - Fais aussi la généralisation sur `a4-general.ts`.
2. **Les causes, prouvées.** Pour chaque liste vide, nomme le filtre ou la règle qui la vide, preuve à l'appui (un compte avant et après
   ce filtre). Pistes à vérifier, sans les croire :
   - le bannissement de D194, qui exclut un houblon qui cite la famille, même à 60′ où l'arôme ne survit pas ;
   - les règles D106 et g2b (usage « arôme » à 60′) ;
   - la présélection d'a4 par la typicité ;
   - la borne du pool ;
   - « aucun effet d'arôme à 60′ », donc aucune voie pour une demande d'arôme : c'est peut-être juste, mais alors l'écran doit le dire ;
   - le palier 60′ (`palier.ts`) ;
   - la typicité ;
   - `buyLimit`.
3. **Ce qu'un brasseur attend à 60′.** Pour chaque cas vide : ce qui devrait s'afficher, et pourquoi. Par exemple, un amérisant pour
   « plus d'amertume », ou bien « rien d'aromatique à 60′, voici le moment utile ». Appuie-toi sur PRODUCT.md, SPEC-BRASSEUR (cherche
   « 60′ ») et m6.
4. **Les corrections proposées**, une règle de principe chacune, avec le fichier et l'effet attendu. Pas de code.

## Critères
- `D60 RAPPORT` en tête de RESULTAT.md, avec le tableau de fréquence, les causes et leurs preuves.
- Au moins une capture d'un cas vide, ouverte (L12).
- `git status` de la copie propre sans fichier suivi modifié à la fin. Rien dans `src/` de l'arbre principal.

## Possède
`work/missions/2026-10-25-integration-houblons/voies/d60-diagnostic/` seulement. N'écris aucun code par heredoc ni par `node -e`. Aucun
appel Gemini. Pas de `git stash`, aucun commit. Rends une ligne.
