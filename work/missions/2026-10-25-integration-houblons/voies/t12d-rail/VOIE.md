# Voie t12d-rail — le rail de l'étape Houblons, cas de son ébullition de 120′

Agent : auteur (Sonnet), pour corriger du code. Le dessin du rail est son choix : on le répare, on ne le change pas.

## Ses mots (25.10, sur l'app déployée)
« Petit soucis de rail dans ce cas de figure ». Ses deux captures (`captures/brasseur-rail-55.jpg`, `brasseur-rail-120.jpg`) :
- une ébullition de 120′, Saaz (US) à 120′ et Saaz (CZ) glissé vers 55′, puis jusqu'à 120′ ;
- pendant le glisser, un grand vide blanc d'environ 400 px apparaît entre le bandeau et « Ébullition 120′ » ;
- les cartes se replient en étiquettes, et à 120′ les deux noms se chevauchent (« Saaz (CZ) · Saaz (US) »).

## À faire
1. Reproduire sur une fixture comme la sienne : ébullition 120′, Saaz (US) 8 g à 120′, Saaz (CZ) 22 g à 10′. Tu peux partir de
   `tests/fixtures/recetteSaazReelle.ts` de la voie t12c et lui donner une ébullition de 120′. Le banc est
   `?dev-local&etape=houblons` avec `VITE_HOP_V4=on`, servi par `scripts/with_server.mjs`.
2. Trouver la cause, sans la supposer. Pistes : `src/ui/hopIndex/maBiere/rail.ts`, `rail.css`, `Frise.tsx`, `Lentille.tsx` ; une
   hauteur d'échelle proportionnelle aux 120′ ; le défilement qui saute quand les cartes se replient ; le placement de deux ajouts
   au même moment.
3. Corriger, pour que pendant et après le glisser :
   - il n'y ait pas de vide sous le bandeau, et que la vue reste où est le doigt ;
   - deux ajouts au même moment soient lisibles, sans chevauchement (empilés ou côte à côte, comme la maquette le fait pour
     deux ajouts proches) ;
   - au relâcher, les cartes reviennent à leur place, et le moment et l'IBU suivent.
4. Une plainte devient un contrôle (L13) : ajoute ce cas au contrôle du rail. Ce peut être `controle-fonctions-rail.mjs` ou un
   test d'intégration. Il doit échouer sur HEAD : vide de plus de 40 px sous le bandeau pendant le glisser, ou étiquettes qui se
   chevauchent.

## Critères
- Le nouveau contrôle : rouge sur HEAD, vert après.
- `node work/refonte-frontend/v4/tournoi/outils/controle-fonctions-rail.mjs prototypes/houblons-v4/maquettes/parcours` et
  `controle-etats.mjs` tiennent sur la maquette reconstruite.
- `npx vitest run tests/unit/hopIndexV4` vert, et `npm run build` vert.
- Captures dans Chrome, en 390 × 844, à ouvrir : pendant le glisser vers 55′, à 120′, et après le relâcher.

## Possède
`src/ui/hopIndex/maBiere/rail.ts`, `rail.css`, `Frise.tsx`, `Lentille.tsx`,
`work/refonte-frontend/v4/tournoi/outils/controle-fonctions-rail.mjs`, `tests/unit/hopIndexV4/`, `tests/fixtures/`,
`work/missions/2026-10-25-integration-houblons/voies/t12d-rail/`.

Les autres fichiers de `maBiere/` ont des changements non commités (voies t12c, t13) : ne les touche pas. Si tu en as besoin, dis
lequel et pourquoi dans RESULTAT.md. Pas de `git mv`. Fichiers de travail dans `os.tmpdir()`.

Retour en une ligne ; RESULTAT.md avec la cause, les preuves et les captures ouvertes.
