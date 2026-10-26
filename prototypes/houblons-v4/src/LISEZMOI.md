# Où est passé le moteur ? (voie t4-moteur, #163, 25.10)

Le moteur v4 n'est plus ici : une seule copie, dans l'app.

| Avant | Maintenant |
|---|---|
| `prototypes/houblons-v4/src/engine/*.ts` (22 fichiers) | `src/domain/hopIndex/v4/` |
| `prototypes/houblons-v4/src/style/scale.ts`, `verdict.ts` | `src/domain/hopIndex/v4/style/` |
| `prototypes/houblons-v4/data/` : `proto-data`, `composes-houblon`, `style-bands`, `correspondance-familles`, `faits-cites` (moteur) ; `jetons-familles`, `pictos-familles.svg`, `comparatifs-dryhop` (écrans) ; `copies-de-work.mjs` | `src/data/hopV4/` |

Reste ici :
- `pack/buildPack.ts` : il bâtit le pack des mini-prototypes (`data/pack-mini-protos.json`, `data/pack-fiches.json`,
  lus par les contrôles de `work/`) et les cas S1 et S2 de la maquette. Ce n'est pas le moteur ; il l'importe depuis `src/`.

Importer le moteur : par chemin relatif, `…/src/domain/hopIndex/v4` (aucun alias, aucun `process.env`).
Le témoin négatif des tests (`tests/temoin.ts`) pose la variable de module de `v4/temoin.ts`.
