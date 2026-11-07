# D380 — lecture d'une longue pièce en morceaux (03.11)

Ses mots : SPEC-BRASSEUR (03.11, « tu vas fixer ça ??? », « 2 lecture paralelle qui font des take », « Comment l'ia sait où elle en est ??? »,
« surtout sur les … ticket de caisse », « Pas besoin de toujours découper […] Quand est-ce que ça trigger ? »). Décision : `decisions.md` D380.
Défaut : DEFAUTS-RECURRENTS D380. Essai réel et coûts : `../2026-10-31-ecran-depense/journal-gemini.md` (03.11 matin).
Pièces fictives (hors Git) : scratchpad `beaucoup/` (`fabriquer.mjs` : 300 lignes sur une page haute, 600 sur 8 pages A4 ; `verite-*.json`).

## Architecture retenue (pilote)
- **App (client) découpe**, le serveur lit et assemble. `invoiceScanCore` importe `node:zlib`, `node:crypto`, `node:fs` : l'app ne peut pas normaliser.
- Chaque morceau = un appel `aiTask` `scanInvoice` ordinaire (fichier = l'image du morceau) + `morceau: { k, n }` : même vote (deux Flash-Lite en
  parallèle, 3.8 sur désaccord), même cache, même budget (3 appels par morceau), même délai. Consigne ajoutée : `bandNote(k, n)` (k = 1 : en-tête ; k = n : totaux).
- Puis un appel `aiTask` `assemblerLecture` (aucune IA, aucun coût) : les résultats des morceaux → `mergeDecoded` (dédoublonne le recouvrement,
  en-tête du premier, totaux du dernier) → `normalizeInvoiceScan` → `finirUneLecture` → revue agrégée (pire statut, lecteurs min, phrases réunies),
  points de désaccord des morceaux décalés sur les rangs globaux. Rend le format habituel : l'écran ne change pas.
- Pur partagé : déplacer de `scripts/banc-lecture-bandes.ts` vers `functions/src/invoiceMorceaux.ts` (pur, sans import node) `inkRows`, `pickCut`,
  `planBands`, `inkedCuts`, `bandNote`, `pageNote`, `itemKey`, `dedupeOverlap`, `mergeDecoded` ; le banc les réimporte (une maison par fait).
- **Bande bornée en lignes** : `planBands` borne à 1,4 × la largeur ; une page serrée (75 lignes) tiendrait en une bande → trop pour 8 192 jetons
  (≈ 45 lignes). Ajout : hauteur max = min(1,4 × largeur, 25 × pas des lignes), le pas = médiane des débuts de séries encrées.

## Déclencheurs (jamais par défaut)
- Avant : PDF → pdf.js `getTextContent` par page, rangées de texte (y regroupés) ; plusieurs pages ou > 35 rangées sur une page → morceaux.
  Image (ou page) plus de 3 × plus haute que large → bandes.
- Après une lecture normale : point `lecture-coupee` (cause sortie), ou `printedLineCount` > lignes rendues de plus de 2 → relue en morceaux, sans geste.
- Rendu : pages à ~180 dpi (pdf.js scale 2,5), JPEG 0,85 ; bandes coupées sur rangées blanches, recouvrement 8 %.

## Étapes et preuves
1. `functions/src/invoiceMorceaux.ts` + bande bornée en lignes ; tests purs (plan sur bitmap fabriqué de 300 lignes : chaque bande ≤ 25 lignes, aucune coupe encrée).
2. Serveur : `morceau` validé (entiers, 1 ≤ k ≤ n ≤ 400) → note ajoutée, clé de cache = fichier + morceau ; tâche `assemblerLecture` ; tests (fetch simulé).
3. Plafond de 4 pages : un PDF lu en morceaux n'est jamais envoyé entier ; le refus « 4 pages » ne joue plus que si le client ne découpe pas (ancien client).
4. Client : `src/services/decoupe.ts` (pdf.js, canvas) ; orchestration dans `geminiScanner` (parallèle 4, puis assemblage) ; message d'attente « morceau i/n ».
5. Tests : orchestration (aiTask simulé) ; banc émulé si possible ; puis **en ligne** les deux pièces fictives (appels autorisés), lecture seule, rien enregistré :
   300 lignes → 300 lignes, total = somme ; 600 → 600. Vision : captures de l'écran à 390 et 1280, deux thèmes.
6. Build, `check-no-dev-auth`, drapeaux, déploiement aiTask + hosting, bundle servi vérifié.

## État
- 0bf5d540 : message vrai (« N ligne(s) imprimée(s) non lue(s) »), test D380 rouge sur ddc6539a. Non déployé.
- En ligne : ddc6539a (index-BeOzPTDF.js, aiTask à jour) avec D378, D379.
7. **Sa demande** : « repasse toutes les pièces, en plus de tes test. Tout doit passer et ça doit pas être beaucoup plus lent » → après déploiement, chacune
   de ses pièces réelles (manifeste du banc, hors Git) relue dans l'app en ligne (lecture seule, feuilles fermées, aucun enregistrement), plus les deux
   fictives ; tableau pièce × (lignes, total, statut, durée avant → après). Une pièce normale garde le chemin d'aujourd'hui (seul l'examen local du fichier s'ajoute).
8. **Photo à fond sombre** (son ticket Bauhaus sur un tissu, 03.11) : `inkRows` prend le niveau le plus fréquent pour fond → le tissu ; le papier entier passe pour
   de l'encre, toute coupe est « forcée » à travers le texte. Avant le plan : trouver le papier (zone claire, colonnes et rangées), encre mesurée DANS le papier
   avec un fond local (ombre), pente légère tolérée. Test : photo fabriquée à fond sombre et ombre → rouge sur le code du banc, vert après. Ce ticket (17 articles)
   ne se découpe pas : ni coupé, ni court, ratio 1,33.

## Décisions mesurées (03.11, `MESURE-BANDES.md`)
- `BAND_MAX_LINES` 25 (≈ 20 lignes réelles, ≈ 50 % du plafond Flash-Lite ; 39 lignes = 93 %, trop juste). Bandes en parallèle, 5 à la fois côté app.
- Consigne de bande (`bandNote`) obligatoire : sans elle la 3.8 tranchait sur chaque bande (+26 s).
- Ordre de travail : (a) serveur `morceau` + `assemblerLecture` ; (b) app `decoupe.ts` (pdf.js, canvas, papier d'une photo) + orchestration ;
  (c) tests ; (d) build, déploiement ; (e) en ligne : 300, 600, puis toutes ses pièces (temps avant/après).

## Reprise du 03.11 soir (découpe d'une photo ; remplacée par « Reprise du 03.11, nuit » plus bas)
- **Banc des 200 (masque exact)**, dernière version du travail : 25 pièces à coupes silencieuses (82 lignes), 2 à lignes perdues (h0065 : 37, h0101 :
  45), plan médian 995 ms : DÉCOUPE ÉCHEC. Les 11 fixes : OK. Ses 5 tickets Bauhaus : coupes propres, cadres serrés (échelle 1). Vitest d381 vert (133).
- **Causes trouvées** : (1) seuil d'Otsu global pollué par le bord de table (≈ 180) au-dessus d'un texte flou (≈ 70) → plus d'encre, plus d'angle
  (corrigé : seuil sur l'intérieur du papier, `dedansDuPapier`) ; (2) carte d'encre inversée sur un tissu sombre (corrigé : `clair`) ; (3) hors-image
  blanc d'un cadre redressé (corrigé : bord étendu) ; (4) profil par intervalle de rangée qui laissait le texte à l'ombre (retiré) ; (5) restent : zébrures,
  ombre forte (h0065, h0101 : lignes perdues au recadrage), h0016 (flou + encre pâle + ombre).
- **Critique du brasseur** (SPEC, 03.11 soir) : « Tu reinvte la roue là » — la chaîne standard (contour du papier, redressement par perspective, marge,
  seuil adaptatif local de type Sauvola, profil des rangées) existe dans OpenCV.js (Apache-2.0, ≈ 10 Mo, chargé à la demande). Ses règles : rien de
  silencieux (au pire signalé), pas plus lent, pas de régression des cas courants, cas extrême → « document illisible, saisie à la main ».
- **Prochaine action** : prototype OpenCV.js sur la copie de banc (`deploy-hosting-qr`, son propre node_modules), en gardant nos coupes, bandes de
  contrôle et votes ; jugé sur les 200 + ses 5 tickets + temps ; sinon Sauvola seul (formule standard). Puis tests, commit, déploiement, relectures en ligne.

## État de l'art (L29, 03.11 soir)
- Problème type : scanner de document sur une photo de ticket — contour du papier, redressement par perspective (4 coins), marge, binarisation
  locale (Sauvola / seuil adaptatif), profil horizontal des rangées pour couper dans les blancs.
- Examiné : OpenCV.js (Apache-2.0 ; `@techstark/opencv-js` 5.0.0, 14,7 Mo décompressé, WASM intégré, chargé à la demande) : `findContours`,
  `approxPolyDP`, `minAreaRect`, `getPerspectiveTransform`, `warpPerspective` (BORDER_REPLICATE), `adaptiveThreshold`, `boxFilter` (Sauvola :
  T = m·(1 + k·(s/R − 1)), ximgproc absent du build web). jscanify (MIT) : contour + perspective sur OpenCV, paquet npm lourd (canvas, jsdom),
  rien de plus que les appels ci-dessus. Tesseract.js : boîtes de lignes fiables mais lecture de plusieurs secondes par ticket au téléphone :
  écarté pour la découpe. Notre code maison (papier par blocs, Otsu global, angle par profil) : 25 pièces sur 200 en coupes silencieuses.
- Décision (première version, corrigée le 03.11 nuit, voir plus bas) : OpenCV.js servi par l'app (fichier statique, chargé seulement quand une pièce se découpe) pour papier, perspective et seuil
  (Sauvola sur boxFilter) ; on garde nos coupes (`planMorceaux`), bandes de contrôle, vote, garde-fous et banc. Juge : 200 pièces (0 silencieux,
  0 perdue), 11 fixes, ses 5 tickets, temps médian du plan ≤ celui d'aujourd'hui (≈ 1 s). Repli : sans papier net (capture, PDF), pas de perspective.

- Décision corrigée (03.11 nuit) : OpenCV.js 5.0.0 (build officielle docs.opencv.org, `src/vendor/opencv-5.0.0`, md5 ad24594c…) dans un worker
  (`src/services/decoupePerspective.worker.ts`). OpenCV.js crée ses liaisons par `new Function` : la CSP de la page l'interdit ; seul le worker reçoit
  `script-src 'self' 'unsafe-eval' 'wasm-unsafe-eval'` (firebase.json, dernière règle ; accord du brasseur pour ce cas). scanic 1.7.1 (MIT, sans eval)
  examiné puis écarté : pas une référence reconnue (80 étoiles, un auteur), sa règle : « SI non opencv est mieux reconnu comme ref ».

## Reprise du 03.11, nuit (OpenCV ; arrêt demandé : « On en reste là pour le moment »)
- **Fait, non commité, non déployé** : voie OpenCV complète et branchée derrière `planifierImage(image, force, { opencv: true })` ; par défaut
  l'app garde la voie mesurée (variante F) : le comportement servi ne change pas. Fichiers : `src/services/decoupe.ts` (plan asynchrone, `PlanImage`,
  `papierDuCadre`, `boiteTexte`, `partiesDe` par dessinateur), `src/services/decoupePerspective.ts` (client du worker, marges par côté triplées
  quand le texte touche le bord, 15 % au plus, sinon refus), `src/services/decoupePerspective.worker.ts` (coins : Canny « auto » + Otsu, contours,
  enveloppe, `approxPolyDP` ou `minAreaRect`, tri des coins par angle, forme plausible, côtés affinés par `fitLine` Huber ; redressement
  `warpPerspective` par bandes, bord répliqué ; `sansOmbre` : gris ÷ fond (dilatation + médiane), ÉCRIT MAIS NON BRANCHÉ NI MESURÉ),
  `src/vendor/opencv-5.0.0/` (13,3 Mo, LICENSE, README), firebase.json (règle CSP du worker), banc (`harnais.ts` : masque par la matrice
  sortie → source, `__diagCv` ; `controler.mjs` : CSP de production servies, 4ᵉ argument `affine` ; `diag-final.mjs … cv`).
- **Mesures** (copie de banc `deploy-hosting-qr`, Chrome sans écran, CSP de production) : OpenCV se charge sous la CSP du worker en 470 à 510 ms,
  coins en 33 à 48 ms. 19 pièces les plus dures : variante F 43 coupes silencieuses ; OpenCV v1 43 et 254 lignes perdues (h0005 : coins mal
  ordonnés, corrigé) ; v3 (tri par angle, `fitLine`, marges adaptées) 30 silencieuses, 37 perdues (h0065, repli), OpenCV sur 11 pièces.
  200 pièces, v2 (sans `fitLine` ni marges adaptées) : 97 silencieuses contre 82 pour F, 82 perdues (repli, h0065 et h0101), OpenCV sur 30 pièces
  seulement (refus : texte au bord 126, papier couché 18 — à comprendre —, plein cadre 16, sans 4 coins 17). v3 non jouée sur les 200.
- **Biais à corriger** (sa question du 03.11 : « mal fine tuné ou … une meilleure version d'open cv ??? ») : la variante F a été réglée sur ces 200
  pièces, OpenCV non ; juger les deux voies sur 200 pièces neuves (`generer.mjs <dossier> --hasard 200 --graine 2`, tirage arrêté avant la fin), L20.
- **Ouvert** : (1) v3 sur les 200 et sur la graine 2 ; (2) « papier couché » sur 18 pièces debout (coins ou tri) ; (3) brancher `sansOmbre`
  (option `fond` du rendu gris) et le mesurer contre la soustraction actuelle (h0023, h0062 : texte flou sous l'ombre) ; (4) lignes perdues du
  repli (h0065, h0101) ; (5) issue « document illisible, saisie à la main ou meilleure photo » quand aucune voie ne garantit ; (6) vitest d381 à
  mettre à jour (`planifierImage` asynchrone, `encreDetaillee(…, papier)`, `normaliser` à bord étendu) et non rejoué depuis la variante F ;
  (7) indices de coupables (`invoiceControls.ts`, `confiance.ts`) non commités, sans tests ; (8) déploiement, relectures en ligne de ses
  13 pièces et 5 tickets, contrôle visuel : rien fait. D376 non commencé ; la question des trous de stock (cas B et C) attend toujours sa réponse.

## Fin de D381, étape 1 (07.11) : OpenCV écarté, voie F gardée
- **Juge sans biais** (L20, sa question du 03.11) : 200 pièces NEUVES (graine 2), jamais vues au réglage. Voie F : 88 coupes silencieuses, 0 perdue,
  0 rognée, 980 ms ; OpenCV : 114, 143 perdues, 78 rognées ; OpenCV + division par le fond : 73, 219 perdues ; HEAD (202506bb) : 57 silencieuses mais
  6 lignes rognées et 198 coupes signalées, 575 ms. 11 fixes : DÉCOUPE OK. Archive et tableau : `opencv-essai/README.md`.
- **Décision** : la voie F reste. Une coupe silencieuse est relue par sa bande de contrôle ; une ligne rognée ou perdue ne revient jamais (F : 0 et 0).
  Le réglage de F était en partie collé aux 200 premières pièces (silencieuses 82 → 88 sur des pièces neuves, HEAD 57) : biais avoué, à ne plus refaire.
- **Doute noté** : sur les rangées zébrées, la boîte d'une ligne du masque englobe toute la bande grisée ; une coupe dans la bande, sous le texte,
  compte « silencieuse » (h0124 : 9). Le critère du banc surestime donc les échecs ; à corriger dans `controler.mjs` (boîte = encre, pas la bande).
- **Message d'échec** : une lecture en morceaux qui échoue ajoute « Pièce peu lisible ? Reprends une photo plus nette, ou saisis les valeurs à la
  main. » (`geminiScanner.ts`, `PIECE_DIFFICILE`) ; aucun signal fiable ne prédit une découpe ratée avant lecture (part de coupes forcées : 1 échec
  sur 15 pièces signalées). À voir à l'écran au banc Dépense (B2).
- **Son ticket du 07.11** (métal gaufré à reflets) : ni F ni OpenCV ne trouvent le papier ; lu entier, comme avant.
- **Reste pour la demande groupée** : déploiement (aiTask et hébergement) ; relecture en ligne de ses 13 pièces et 5 tickets (Gemini facturé).
