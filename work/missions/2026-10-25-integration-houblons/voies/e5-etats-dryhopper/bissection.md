# Bissection e5 — états Dryhopper (10 échecs)

Copie propre : `C:/Users/mrspa/AppData/Local/Temp/deploy-63130965`. Date : 2026-10-26.

## Commandes

Pour chaque commit : `git checkout --detach <c>` ; `node prototypes/houblons-v4/parcours/outils/construire.mjs` ; `node work/refonte-frontend/v4/tournoi/outils/controle-etats.mjs prototypes/houblons-v4/maquettes/parcours --ecran=dryhopper`.

## Candidats (`git log --oneline 6e368cbd..fb0d14e3 -- src prototypes`, du plus ancien)

1. 846b76aa d99 (D99) + c6
2. 418a514e p6 (D171, D97)
3. c4e20c5e p6b (D118)

## Résultats

| Commit | Build | Contrôle EXIT | États en échec |
|---|---|---|---|
| 6e368cbd (parent de 846b76aa) | 0 | 0 | 0 (20/20 OK) |
| 846b76aa | 0 | 1 | 10 (10/20 ECHEC) |

Le passage 6e368cbd → 846b76aa fait apparaître les 10 échecs. Le test s'arrête là : 846b76aa est le premier candidat où les 10 échecs apparaissent. Les commits 418a514e et c4e20c5e n'ont pas été testés.

Note : `controle-etats.mjs --ecran=dryhopper` compte 20 états, pas 138 (les 138 du RESULTAT concernent l'ensemble des écrans). Le 6e368cbd est donc vérifié ici à 20/20.

## Coupable : 846b76aa

`git show --stat` (src/ et prototypes/) :
- prototypes/houblons-v4/data/pack-fiches.json (1 ligne modifiée)
- prototypes/houblons-v4/data/pack-mini-protos.json (1 ligne modifiée)
- prototypes/houblons-v4/scripts/build-data.mjs (77 lignes touchées)
- prototypes/houblons-v4/tests/client-async.test.ts
- prototypes/houblons-v4/tests/worker-calculs.test.ts
- src/data/hopV4/alias-noms.json (nouveau, 86 lignes)
- src/data/hopV4/catalogue-ajouts.json
- src/data/hopV4/complements-non-rattachees.json
- src/data/hopV4/complements.json
- src/data/hopV4/proto-data.json
- src/data/hopV4/rattachement.mjs (nouveau, 232 lignes)
- src/domain/hopIndex/v4/data.ts
- src/domain/hopIndex/v4/minoritaire.ts
- src/domain/hopIndex/v4/substitution.ts
- src/domain/hopIndex/v4/voies.ts
- src/ui/hopIndex/fiche/traduction.ts

Total : 16 fichiers, 448 insertions, 22 suppressions.

## Diff des données (prototypes/houblons-v4/data/), parent → 846b76aa

- pack-fiches.json : 404 196 → 406 043 octets. 2 clés top-level, 0 ajoutée, 0 retirée, 1 modifiée : `fichesHoublons` (393 161 → 395 018 octets). Premier écart à l'octet 3265 : ajout de champs dans `manque` (ex. « huile totale : absente de la fiche » reste, des entrées sont modifiées).
- pack-mini-protos.json : 551 877 → 556 328 octets. 10 clés top-level, 0 ajoutée, 0 retirée, 3 modifiées :
  - `stock` : 3 éléments sur 16 modifiés (indices 1, 7, 9) ;
  - `catalogue` : 9 éléments sur 25 modifiés (indices 2, 8 à 13, 15) ; un exemple : `central` 40,6 → 51,9 avec `citation` « non cité » → « cité » ;
  - `scenarios` : 3 entrées sur 6 modifiées (S1, S2, S5).

Le texte de la capture (valeurs ~+1 point, « trop amer » dans « contre ★ ») n'a pas été relu dans ce diff. Les données modifiées sont celles du catalogue et des scénarios, pas la fiche Idaho 7 seule. Le mécanisme exact reste à confirmer.

## Restauration

`git checkout --detach fb0d14e3` : HEAD = fb0d14e3, `git status --short` vide. Le dernier `construire.mjs` a tourné sur 6e368cbd (parent de 846b76aa), pas sur fb0d14e3 : le `dist` de la copie n'est pas celui de fb0d14e3, à reconstruire avant tout déploiement.

## Douteux

- Pas de relevé des valeurs (ctl.mjs, texte) pour 846b76aa : seul le compte d'échecs est établi.
- Pas de lien prouvé entre les données modifiées et le −1 point ; c'est une hypothèse à vérifier (rejeu du moteur sur catalogue ancien/nouveau).
