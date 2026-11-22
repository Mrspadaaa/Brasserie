# LO-2 — l'onglet gèle pendant la préparation d'une photo (Dépense)

Défaut du rejeu en ligne du 08.11 (`RAPPORT.md`, LO-2, gravité G) : doc3 (photo tournée, 2 bulletins QR Helvetia), onglet gelé 30 à 45 s ; doc5 brièvement.

## État de l'art (L29)

**Problème type.** Un long calcul synchrone (traitement d'image, décodage d'un code-barres) bloque la boucle d'événements du navigateur : « long task » (> 50 ms, API Long Tasks). Tant que le fil principal est occupé, rien ne se dessine, aucun geste n'est reçu, aucun script ou capture ne répond.

**Méthodes standard examinées.**

| Méthode | Verdict |
|---|---|
| Web Worker + `OffscreenCanvas` + `createImageBitmap` (HTML Standard ; Chrome 69+, Firefox 105+, Safari 16.4+) : le calcul entier sort du fil principal | **Retenue** : seule méthode qui laisse un fil principal libre pendant tout le calcul. |
| Découper le calcul et rendre la main (`scheduler.yield()` Chrome 129+, sinon `setTimeout(0)`) | **Retenue en repli** (sans Worker ni OffscreenCanvas : Safari iOS < 16.4, Worker refusé, fichier du Worker absent hors ligne). Limite : on ne rend la main qu'entre deux étapes ; `analyser` reste un bloc synchrone de 0,2 à 0,3 s sur un PC. |
| Réduire l'image avant tout calcul | **Déjà fait** : le coup d'œil se fait sur l'image réduite à 1 200 px de côté court. Le coût qui reste est celui de l'algorithme sur ces pixels, pas de la taille de la photo. |
| Bibliothèque de Worker (Comlink, Workerize) | Écartée : aucune installation de paquet ; le protocole est 20 lignes (`{ id, … }` → `{ id, … }`), comme les trois Workers déjà dans l'app (`calcul.worker`, `waterAnalysis.worker`, `hopSolver.worker`, tous `new Worker(new URL(…, import.meta.url), { type: 'module' })`). |
| OpenCV.js / WASM pour l'analyse | Écartée en amont (D381, 143 lignes perdues). Sans objet ici : le calcul ne change pas, il change de fil. |
| WebAssembly threads / SharedArrayBuffer | Écartée : exige l'isolation cross-origin (COOP/COEP), donc un changement de `firebase.json`. |

**Décision.** Deux Workers de module, fichiers de l'app (jamais un blob : la CSP de production ne le veut pas) :
1. `decoupe.worker.ts` : `planifierImage` (réduction, papier, angle, rangées, plan final), le **même code** que la page, avec `OffscreenCanvas`. Le fichier est copié au Worker, qui le décode lui-même.
2. `qr.worker.ts` : zxing-wasm (`readBarcodes`) et l'agrandissement de la seconde passe.
Repli : `decoupeTravail.ts` / `qrTravail.ts` rendent `undefined` (pas de Worker, pas d'OffscreenCanvas, première erreur, silence de 30 s) et la page fait le même calcul, en rendant la main entre ses étapes. Un Worker en échec n'est plus essayé avant le rechargement.

**CSP.** Aucun changement : `script-src 'self' … 'wasm-unsafe-eval'` couvre un Worker de module du même site (`worker-src` retombe sur `script-src`), et zxing garde `'wasm-unsafe-eval'`. Jamais `'unsafe-eval'`. `firebase.json` n'est pas touché.

**Hors ligne.** Le calcul reste local. Les fichiers des Workers sont des fichiers de l'app, servis avec le reste ; s'ils manquent (cache vidé hors ligne), le repli prend le relais.

## Mesures (Chrome 1x et processeur ralenti 4x, CSP de production, `lo2/mesurer.mjs`)

Banc : `lo2/construire.mjs` + `lo2/mesurer.mjs` + `lo2/resumer.mjs` (tâches longues > 50 ms et plus grand retard d'un battement de 10 ms du fil principal, pendant `decouperPiece` et `lireQrDuFichier`, appelés comme l'écran). Pièces : 23 photos H13-reels (hors Git, <= 4 Mo) et 200 pièces piégées (`pieges/generer.mjs --hasard 200 --graine 1`).

**Cause mesurée.** Le calcul d'image de la découpe (`analyser` : papier, angle, encre, rangées, deux fois ; plus la normalisation par canevas) bloque le fil principal d'un seul bloc : jusqu'à 0,83 s sur PC, 3,7 s à 4x. Le décodage zxing-wasm du QR : 0,1 à 0,2 s (PC), 1,8 s à 4x. Pour doc3 elle-même (1280x2772, QR lu), la découpe et le QR coûtent < 50 ms : **le gel de 30 à 45 s n'est pas reproduit par ces deux modules ; leur part mesurée va de 0,6 s (doc5, PC) à 3,7 s (téléphone simulé)**. Reste à rejouer en ligne pour savoir si autre chose gèle (rendu React, flux) : non fait ici.

| Cas | Avant | Après |
|---|---|---|
| PC 1x, 23 photos, découpe : plus longue tâche | 831 ms (7 photos > 50 ms) | 0 (aucune > 50 ms) ; plus grand retard de battement 75 ms (encodage JPEG d'un morceau, sur la page) |
| PC 1x, QR : plus longue tâche | 207 ms (21 photos > 50 ms) | 0 ; battement max 1 ms |
| 4x, 8 photos lourdes, découpe | 3 699 ms (8/8 > 50 ms) | 66 ms (1/8) ; battement max 323 ms (encodage JPEG, doc5) |
| 4x, QR | 1 810 ms | 0 |
| 4x, découpe + QR ensemble (l'écran) | 3 544 ms (total 4 583) | 0 tâche > 50 ms |
| Repli (sans Worker ni OffscreenCanvas), PC | découpe 831 ms d'un bloc | découpe 532 ms au plus (blocs de 0,2 à 0,5 s) ; QR inchangé (394 ms au plus) |

**Résultat identique.** 200 pièces piégées : empreinte du plan (recadrage, angle, géométrie, morceaux, rangées) avant = après sur 200/200 ; plan sur la page = plan dans le Worker sur 400/400 (force vrai et faux). 23 photos H13 : 69 comparaisons avant/après identiques (plan, nombre de morceaux, statut et montant du QR : doc3 « lu, 2 bulletins, 150 CHF » inchangé) et 46/46 page = Worker.

**Tests.** `tests/unit/depense/d380`, `d381`, `qr`, `lo2` : 234 tests verts. 6 fichiers de la Dépense échouent à la collecte, sans lien : `firebase-functions` et `src/data/seedData` absents de cette copie (d381/serveur, noms-fr/aiTask-traduireNoms, pages/lecture-serveur, enrichir/learn, lecture-d/serveur, rapprochement/lecture-coupee). `tsc --noEmit` : seule erreur sur mes fichiers = `zxing-wasm/reader` introuvable (paquet absent du poste, déjà vrai de `qrLecture.ts`). `vite build` via `lo2/vite.build.config.mjs` (alias vers `qr-deps`, hors Git) : vert, `decoupe.worker` 16 Ko (sans pdf.js) et `qr.worker` 35 Ko émis. `npm run build` non joué tel quel : zxing-wasm et pdfjs-dist ne sont pas installés ici.

**Limites.** Les encodages JPEG des morceaux restent sur la page (un par tâche, 75 ms PC / 320 ms à 4x au pire) ; le repli garde un bloc de 0,2 à 0,5 s par étape de calcul. La page de PDF (pdf.js) n'est pas déplacée. Pas d'image synthétique : doc13 (4096x3072, photo tournée réelle) la remplace (QR 139 ms de blocage avant, 0 après).
