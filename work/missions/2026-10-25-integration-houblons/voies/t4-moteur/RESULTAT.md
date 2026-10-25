OK — moteur v4 (24 fichiers) et ses données dans src/domain/hopIndex/v4 et src/data/hopV4 ; une copie, démarrage 919 ko inchangé

## Avant de toucher (consigne 1)
- `npx vitest run prototypes/houblons-v4/tests` : 11 fichiers, 131/131 verts.
- `npm run build` : vert ; `check-hop-budget.mjs --dist dist --boot index,App,firebase --step Host` : B1 démarrage **919 ko gzip**, B2 étape Houblons 772 ko gzip.

## Fichiers écrits
- `git mv` (historique gardé) : 22 fichiers de `prototypes/houblons-v4/src/engine/` -> `src/domain/hopIndex/v4/` ; `src/style/scale.ts` et `verdict.ts` -> `src/domain/hopIndex/v4/style/` (24 fichiers .ts).
- `git mv` : `proto-data`, `composes-houblon`, `style-bands`, `correspondance-familles`, `faits-cites`, `jetons-familles`, `comparatifs-dryhop` (.json), `pictos-familles.svg` et `copies-de-work.mjs` -> `src/data/hopV4/`. Les trois copies de `work/` gardent leur source : `copies-de-work.mjs` (chemin vers la racine inchangé, 3 niveaux) rend COPIES identique, le test `copies-de-work.test.ts` est vert.
- Imports relatifs corrigés dans le moteur : `../../../../src/data/…` -> `../../../data/…`, `…/src/domain/hopIndex/solver|styleSelection` -> `../solver|../styleSelection`, `…/src/services/brewingMath` -> `../../../services/brewingMath`, `../style/…` -> `./style/…`, JSON déplacés -> `…/data/hopV4/…`. Les imports vers `functions/src/` ne changent pas (même profondeur, 4 niveaux). Aucun alias, aucun `process.env`. Les chaînes de source citées (`stock-affinee`, bandes) et les raisons « variété absente de … » nomment les nouveaux chemins.
- `prototypes/houblons-v4/src/pack/buildPack.ts` : reste au prototype (il bâtit le pack des mini-prototypes et les cas S1/S2 de la maquette, ce n'est pas le moteur) ; il importe le moteur depuis `src/`. Ses trois chaînes de provenance pointent les nouveaux chemins, donc `data/pack-mini-protos.json` a été régénéré (`vite-node scripts/build-pack.ts`) : un seul écart, ces trois chaînes ; `pack-fiches.json` identique.
- `prototypes/houblons-v4/data/` : ne garde que `pack-fiches.json` et `pack-mini-protos.json` (sorties générées, lues par ~8 contrôles de `work/…/tournoi/outils`).
- `prototypes/houblons-v4/src/LISEZMOI.md` (où sont passés les fichiers).
- `prototypes/houblons-v4/tests/*.ts` (10 fichiers) et `parcours/src/**` (48 fichiers) : chemins d'import seulement (+ 6 commentaires qui citaient l'ancien chemin).
- `parcours/outils/portabilite.mjs` : `--process` et `--alias` regardent maintenant `src/domain/hopIndex/v4/` (sorties : SANS PROCESS OK, IMPORTS RELATIFS OK, SANS WORK OK).
- `parcours/ARCHITECTURE.md` : lignes du moteur et des données marquées faites, notes à 3 endroits.

## Critères
- **G1** `node work/missions/2026-10-25-integration-houblons/voies/t4-moteur/verifier.mjs` -> `tests du prototype : 131/131 verts` / `démarrage : 919 ko gzip (≤ 919)` / `MOTEUR OK (24 fichiers)`. Essai 1.
- **G2** `node prototypes/houblons-v4/parcours/outils/batterie.mjs` -> `BATTERIE OK 46/46` (construction comprise : CONSTRUIT OK, TYPES OK, CHOIX OK, ROUTES OK, PONTS OK, PARCOURS OK 29+29 gestes). Essai 1.
- **G3** `controle-etats.mjs prototypes/houblons-v4/maquettes/parcours` -> `ETATS OK (141/141) ; 13 voulu(s) non rejoué(s)`. Essai 1.
- Aussi : `npm run build` (tsc de l'app compile maintenant le moteur ; vert) et `check-private-research.mjs` (« Private report excluded… ») : aucun JSON refusé.
- Budget : le moteur n'est importé par aucun fichier de `src/` hors maquette et tests, donc absent de `dist` ; B1 reste 919, B2 772 (inchangé). Poids à charger plus tard (gzip des sources, pas du bundle) : ~98 ko de .ts et ~89 ko de JSON (`proto-data` 49, `composes-houblon` 19, `style-bands` 6, `comparatifs-dryhop` 7) ; le chiffre exact du chunk viendra avec T9.

## Doutes et limites
- La maquette rend la même chose (batterie et états verts), mais seul le rendu joué est prouvé ; je n'ai pas comparé octet par octet l'ancien et le nouveau `parcours.js`.
- Des JSON déplacés citent encore l'ancien chemin dans leurs propres chaînes (`composes-houblon.json`, 6 lignes « lecture : dépôt : prototypes/houblons-v4/data/proto-data.json » ; `correspondance-familles.json`, `regle`). Je n'ai pas touché au contenu des données ; ces chaînes seront corrigées avec T8 (données injectées) ou sur ordre.
- `tsconfig.json` du prototype (`include: src, tests, scripts/build-pack.ts`) et son alias `@app/` ne servent plus qu'à la maquette et aux tests.

DÉCISION À PRENDRE : des fichiers **hors de mon Possède** importent encore l'ancien emplacement et sont maintenant cassés. Options : (a) une voie de balayage mécanique `sed` (`…/src/engine` -> `…/src/domain/hopIndex/v4`, `…/data/<json déplacé>` -> `…/src/data/hopV4/<json>`) sur la liste ci-dessous ; (b) ne corriger que les outils vivants et laisser les générateurs historiques de `work/` (pages déjà publiées) ; (c) rien. Recommandation : (b) maintenant pour `prototypes/houblons-v4/scripts/` (`build-data.mjs` et `build-bands.mjs` écrivent encore `data/proto-data.json` et `data/style-bands.json` : lancés tels quels, ils recréeraient une seconde copie ; `cas-suggestions.ts`, `pouvoir-cas.ts`, `profil-simule-cas.ts`), `ecran/src/` (3 fichiers), `parcours/outils/mesurer-voies.ts` et les générateurs récents de `work/refonte-frontend/v4/ecran-1/fils24-*` (levure-suggerer, r6a-plus rpb1 à rpb4, substituer sba1, sbb1, sbb7b, sbb7c, sbc1, sbd1, sbu1) ; les autres (fils18 à fils21, base/generateur, r2-cout-calcul/bench.ts, 17 fichiers) tant qu'on ne les rejoue pas. Aucun test, build ni contrôle de la batterie ne les appelle (vérifié par la batterie verte).

CONNAISSANCE : le moteur v4 vit dans `src/domain/hopIndex/v4/` (+ `style/`), ses données dans `src/data/hopV4/` ; les imports vers `functions/src/` gardent 4 niveaux ; `pack/` et `data/pack-*.json` restent au prototype. Le tsc de l'app compile le moteur (strict:false des deux côtés).
LEÇON PROPOSÉE : un OWNS de déménagement doit lister aussi les importeurs hors dossier (scripts/, ecran/, générateurs de work/) : un `grep` de l'ancien chemin sur tout le dépôt avant d'écrire GATES.
