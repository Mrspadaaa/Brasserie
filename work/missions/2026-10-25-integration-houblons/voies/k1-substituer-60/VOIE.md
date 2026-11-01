# Voie k1-substituer-60 — Substituer à 60′ : un inconnu d'amertume passe après le connu

Agent : auteur (Sonnet). Le moteur de Substituer, pas l'écran. La voie s'arrête au code, aux tests et aux bancs. **Pas de serveur ni de
Chrome** pendant ta voie, parce que la voie s3 en fait tourner dans l'arbre : la vérification Chrome sera faite au rejeu final. Écris
RESULTAT.md tôt.

## Ses mots (31.10)
« tout fonctionne plutôt bien sauf pour les algo, surtout sur la partie 60', il y a souvent pas de propostion du tout » (D196).

## La cause prouvée (d60, C4)
Lis `voies/d60-diagnostic/RESULTAT.md`, section C4, et ses sorties `sorties/bru.txt`, `sorties/d60-substituer.json`.
- Le cas : Nugget 46 g à 60′, stout S1. Les 12 premiers ex æquo, à 100 et « très proche », sont Bru, Kohia Nelson, Limequat, Mapuche…
- Tous ont `composantes = { arome: 100, huiles: null, amertume: null }`.
- À un moment d'amertume, les poids sont amertume 0,7, huile 0,2 et arôme 0,1. L'inconnu sort du calcul, et il reste 0,1/0,1 = 100.
- Les substituts attendus passent loin derrière : Warrior 22e, Chinook 32e, Columbus 48e, Magnum US 48e.
- 17 houblons courants sur 20, posés à 60′, ont au moins un inconnu parmi les 5 montrés.

## Ce qui est demandé (K1, D196)
Règle de principe, à écrire d'abord dans RESULTAT.md :
- **inconnu ≠ 0, et l'inconnu passe après le connu** (L14).
- À un moment d'amertume, un candidat sans aucune variable d'amertume connue (α, β, cohumulone, usage) passe derrière tout candidat qui
  en a. Son score, fondé sur le seul poids de l'arôme, ne s'étiquette jamais « très proche ».
- Même esprit que la clé `fiabilite`. Fichier : `src/domain/hopIndex/v4/substitution.ts`, la clé c1 du classement, vers la ligne 426.
- Ne règle aucun poids sur Nugget ni sur ses six (L20). Le jugement se fait sur l'autre moitié des cas.

## Critères
- Test rouge sur HEAD, puis vert (L13). Nugget à 60′ : aucun inconnu d'amertume parmi les 5 premiers ; tête faite d'amérisants connus.
- Les 20 houblons courants à 60′ de d60 : combien gardent un inconnu dans leurs 5 premiers. Attendu : 0 sur 20 (avant : 17).
- À 10′ et au dry hop, rien ne change : même ordre, à l'octet près, ou écart expliqué.
- Non-régressions : `scripts/eval-hop/banc-justesse.ts` (D), `scripts/eval-hop/f1-*.ts` s'il existe, `moteurInchange.test.ts` et les
  empreintes `substitutes`/`remplacants`, avec la raison « D196 » si elles changent. Rends un tableau avant/après.
- `npx vitest run tests/unit/hopIndexV4 prototypes/houblons-v4/tests --maxWorkers=2` : vert. `npx tsc --noEmit` : sans sortie.

## Possède
- `src/domain/hopIndex/v4/substitution.ts`.
- Les tests de Substituer et les empreintes concernées.
- `scripts/eval-hop/k1-*` (neufs).
- `work/missions/2026-10-25-integration-houblons/voies/k1-substituer-60/`.

Rien d'autre dans `src/`. La voie s3 possède `voies.ts` et `palier.ts`. N'écris aucun code par heredoc ni par `node -e`. Pas de
`git stash`, aucun commit. Rends une ligne.
