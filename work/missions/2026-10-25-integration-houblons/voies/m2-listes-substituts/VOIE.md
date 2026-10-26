# Voie m2-listes-substituts — les listes de remplaçants côte à côte, pour qu'il choisisse (#181, D77)

Agent : concepteur (Opus). C'est ce que le brasseur verra : une page de choix. Rien n'est changé dans l'app.

## Ses mots
- « nelson sauvin est un houbon ordinaire alors que c'est un un houbon incroyable » ; « motueka est ultra fruité » (lot 21).
- 26.10 : « SI l'algo est déjà bien et très fiable et donne les bon résultat, pas forcé d'utiliser l'ai. C'était plus pour
  simplifier le processus, et l'améliorer facilement ».
- Le regard Brasseur du conseil (D77) : chaque remplaçant avec son α et les mots qu'il partage avec l'original, en couleur ;
  « lequel me remplace, et pourquoi en un mot ». Aucune mention de Beer Maverick : c'est lui qui juge.

## Les données (ne recalcule rien)
`voies/e1-banc-eval/resultats/listes-lambda.json` donne, pour 11 houblons au dry hop, les 10 premiers de trois classements, avec
pour chaque candidat l'α, l'usage et les mots partagés :
- **A · l'actuel** : le moteur d'aujourd'hui ;
- **B · mots, prudent** : λ = 0,5, garde de 2 mots ;
- **C · mots, fort** : λ = 0,25, garde de 2 mots. C'est le seul où Hallertau Blanc entre dans les 10 de Nelson Sauvin (2e).

Une 4e colonne, **D · C + IA**, arrivera de la voie ia1 (`voies/ia1-reclassement/resultats/cote-a-cote.json`, 8 houblons). Prévois sa
place. Si le fichier n'existe pas encore quand tu publies ta page, laisse-la sans D et écris-le dans RESULTAT.md.

## Le dessin
- La grammaire est celle de son écran Substituer choisi (u4, `src/ui/hopIndex/substituer/`). Prends la vraie ligne d'un remplaçant
  dans l'app rendue (`?dev-local&etape=houblons`, `VITE_HOP_V4=on`, ouvrir Substituer sur un ajout), puis clone-la dans la page
  rendue pour chaque candidat : nom, α, usage, et les mots partagés en couleur de leur famille (pictos de
  `src/data/hopV4/pictos-familles.svg`).
  - C'est la méthode de la voie m1 : `voies/m1-farnesene/capturer.mjs`, classes ajoutées préfixées `m2l-…`, retirées après la
    capture.
- Pour chaque houblon, les colonnes A, B, C (et D) côte à côte, A en premier comme référence.
  - Ordre : Nelson Sauvin, Motueka, Citra, Galaxy, Saaz, Mosaic, Simcoe, Cascade, puis les ordinaires.
  - À 390 px, une colonne par vignette, et un toucher ouvre la vue en grand à côté de A, comme la page m1.
- Rien d'autre : pas de légende ni de texte en plus. Le nom de chaque colonne tient en une ligne (« A · l'actuel »…).
- Lis `.claude/rules/affinee-frontend.md` et DESIGN.md. Regarde chaque capture avant de dire OK (L12).

## Livrable
- `voies/m2-listes-substituts/page.html` : page de choix (L24, D126), avec un en-tête d'une phrase, « Quelle liste te remplace le
  mieux chaque houblon ? ».
  - Elle doit passer `node scripts/agents/verifier-page.mjs <page.html> --page-lot --captures <os.tmpdir()>/m2` → `PAGE OK`.
  - Ouvre ses captures.
- RESULTAT.md : ce que tu as fait, les captures ouvertes.

## Possède
`work/missions/2026-10-25-integration-houblons/voies/m2-listes-substituts/` seulement. Rien dans `src/`. Fichiers de travail dans
`os.tmpdir()`.

Retour en une ligne.
