# Prétraitement et sources déterministes pour la lecture de factures suisses (état au 01.11.2026)

Notes de recherche : ce qui peut être fait avant ou à côté du modèle de vision (Gemini 3.5 Flash-Lite / 3.8 Flash) pour qu'il reste moins de valeurs devinées. Cadre : PWA React hors ligne sur téléphone, Cloud Functions Node/TypeScript, photos JPEG ou PDF jusqu'à 4 Mo. Rien n'a été installé ; les PDF de SIX et de Swico n'ont pas pu être lus en texte (polices encodées), d'où des sources secondaires signalées comme telles.

## 1. QR-facture suisse : contenu du code, Swico S1, décodage navigateur/Node

### Takeaway
Le Swiss QR Code donne déjà, de façon exacte et contrôlable, le montant à payer, la devise ISO (CHF/EUR), l'IBAN/QR-IBAN, le créancier et la référence. S'il porte les « informations de facture » Swico S1 (`//S1/…`), il donne aussi le n° de facture, la date de facture (distincte de la période TVA), le n° TVA et la ventilation taux:net : précisément les quatre erreurs typiques du modèle. Le décodage se fait sans IA avec zxing-wasm (navigateur et Node) ; BarcodeDetector natif n'existe que sur Chrome/Android, pas sur iOS.

### Cited Findings
**Versions de la norme**
- IG QR-facture v2.3 : version datée 20.11.2023, valable depuis le 21.11.2025 ; le chapitre 4.2.2 retire l'option d'adresse combinée — [SIX, IG v2.3 (PDF)](https://www.six-group.com/dam/download/banking-services/standardization/qr-bill/ig-qr-bill-v2.3-en.pdf) (via résumé de recherche, PDF non lu en texte).
- IG v2.4 datée 24.02.2026, valable dès le 14.11.2026, remplace la v2.3 ; la v2.3 reste valable jusqu'en novembre 2027 — [SIX, IG v2.4 (PDF)](https://www.six-group.com/dam/download/banking-services/standardization/qr-bill/ig-qr-bill-v2.4-en.pdf).
- Selon SIX, la v2.4 n'impose aucun ajustement technique pour les QR-factures en CHF (surtout pertinente pour l'EUR) — [SIX, page QR-bill](https://www.six-group.com/en/products-services/banking-services/payment-standardization/standards/qr-bill.html) ; [magicheidi.ch](https://magicheidi.ch/en/blog/neue-qr-rechnung-schweiz) (résumé de recherche).
- Adresses combinées (type K) refusées après le 30.09.2026 ; adresses structurées (S) obligatoires — [invoicedataextraction.com, 05.03.2026, maj 24.03.2026](https://invoicedataextraction.com/blog/swiss-qr-bill-requirements) ; [pfeffersack.ch](https://pfeffersack.ch/blog/qr-rechnung-aenderungen-2026-strukturierte-adressen).

**Champs du code (ordre des lignes, source secondaire se référant à l'IG v2.3)** — [qrcode4payment, Swiss QR spec](https://qrcode4payment.pages.dev/docs/SWISS_QR_SPEC.md)
- L1 `SPC` ; L2 `0200` ; L3 codage `1` (UTF-8 restreint au jeu latin de la QR-facture).
- L4 IBAN du créancier (21 car., `CH` ou `LI` ; QR-IBAN obligatoire si référence QRR).
- L5 type d'adresse `S`/`K` ; L6 nom (≤70) ; L7 rue ou ligne 1 (≤70) ; L8 n° (≤16 en S) ou ligne 2 (≤70 en K) ; L9 NPA (≤16) ; L10 localité (≤35) ; L11 pays ISO 3166-1.
- L12–18 créancier final : réservé, à laisser vide.
- L19 montant : 0.01 à 999999999.99, point décimal, vide = montant ouvert ; L20 devise `CHF` ou `EUR` (obligatoire).
- L21–27 débiteur final (optionnel).
- L28 type de référence `QRR`/`SCOR`/`NON` ; L29 référence (QRR : 27 chiffres avec clé modulo 10 ; SCOR ISO 11649 ≤25 car. ; vide pour NON).
- L30 message non structuré (≤140) ; L31 `EPD` (trailer) ; L32 informations de facture (≤140, syntaxe S1) ; L33–34 procédures alternatives (≤100 chacune).
- Séparateur CR LF (LF accepté par les lecteurs) ; 32 à 34 lignes ; niveau de correction M exigé pour que la croix centrale soit tolérée ; 46 × 46 mm + 5 mm de zone calme.
- Conflit de source : un autre résumé indique que message non structuré et informations de facture ne doivent pas dépasser 140 caractères **ensemble** — [résumé de recherche Swico/SIX](https://www.six-group.com/dam/download/banking-services/standardization/qr-bill/iq-qr-bill-delta-guide-v2.1-en.pdf) ; la page qrcode4payment donne 140 chacun. À vérifier dans l'IG.
- QR-IBAN : identifiant d'institution (IID) 30000–31999 ; QRR exige un QR-IBAN ; SCOR fonctionne avec IBAN ou QR-IBAN (selon invoicedataextraction) — [invoicedataextraction.com](https://invoicedataextraction.com/blog/swiss-qr-bill-requirements) ; contradiction : qrcode4payment dit que SCOR ne doit pas utiliser de QR-IBAN — [qrcode4payment](https://qrcode4payment.pages.dev/docs/SWISS_QR_SPEC.md).
- La croix suisse de 7 × 7 mm est posée au centre, par-dessus les modules — [IDAutomation support](https://support.idautomation.com/Barcode-Components/Swiss-QR-Code-size/_3748) ; le niveau M correspond à ~15 % de redondance — [Telerik SwissQRCode](https://docs.telerik.com/devtools/wpf/controls/radbarcode/supported-types/2d-barcodes/SwissQRCode/overview).
- Version de QR moyenne selon le style guide : 23 ; 25 possible si plus de données (forum fournisseur, non normatif) — [IDAutomation](https://support.idautomation.com/Barcode-Components/Swiss-QR-Code-size/_3748).

**Swico S1 (champ « informations de facture », L32)**
- Préfixe `//S1` ; balises écrites dans cet ordre : `/10/` n° de facture, `/11/` date de facture, `/20/` référence client, `/30/` n° TVA, `/31/` date TVA ou période (début+fin), `/32/` taux TVA unique ou détails taux:montant, `/33/` TVA à l'importation, `/40/` conditions de paiement — [manuelbl/SwissQRBill, SwicoS1Encoder.java](https://raw.githubusercontent.com/manuelbl/SwissQRBill/master/generator/src/main/java/net/codecrete/qrbill/generator/SwicoS1Encoder.java).
- Dates `yyMMdd` sans séparateur ; période = début suivi de la fin (`/31/180101181231`) ; listes `taux:montant` séparées par `;` ; conditions `escompte%:jours` (`/40/2:10;0:30`) ; nombres au point décimal, ≤3 décimales, zéros finaux supprimés ; échappement `\` → `\\` et `/` → `\/` pour n° de facture, référence client et n° TVA — [SwicoS1Encoder.java](https://raw.githubusercontent.com/manuelbl/SwissQRBill/master/generator/src/main/java/net/codecrete/qrbill/generator/SwicoS1Encoder.java).
- Sémantique : n° TVA « sans préfixe, espace, séparateur ni suffixe » (`106017086` pour `CHE-106.017.086 MWST`) ; taux unique quand un seul taux couvre toute la facture ; sinon chaque paire porte le taux et le **montant net** partiel auquel il s'applique ; `/33/` porte taux et **montant d'impôt** ; échéance = date de facture + jours de la condition à 0 % — [SwicoBillInformation.java](https://raw.githubusercontent.com/manuelbl/SwissQRBill/master/generator/src/main/java/net/codecrete/qrbill/generator/SwicoBillInformation.java).
- Exemple publié : `//S1/10/10201409/11/240401/30/106017086/31/240101240630/32/8.1:950;2.6:50/40/2:10;0:30` (facture du 01.04.2024, période TVA 01.01–30.06.2024, 8.1 % sur 950, 2.6 % sur 50) — [invoicedataextraction.com](https://invoicedataextraction.com/blog/swiss-qr-bill-requirements).
- SIX recommande la structure Swico plutôt qu'une structure maison ; Swico fournit un validateur et un dépôt GitHub — [SIX delta guide v2.1](https://www.six-group.com/dam/download/banking-services/standardization/qr-bill/iq-qr-bill-delta-guide-v2.1-en.pdf) ; [swico/qr-bill](https://github.com/swico/qr-bill) ; spécification : [Swico S1 (PDF fr)](https://www.swico.ch/media/filer_public/1c/cd/1ccd7062-fc69-40f8-be3f-2a3ba9048c5f/v2_qr-bill-s1-syntax-fr.pdf).
- Fréquence : S1 est volontaire, sans obligation ; pris en charge par beaucoup de logiciels comptables suisses mais pas toujours activé ; fournisseurs étrangers rarement — [invoicedataextraction.com (éditeur, non chiffré)](https://invoicedataextraction.com/blog/swiss-qr-bill-requirements).

**Décodeurs**
- zxing-wasm : ZXing-C++ en WebAssembly, ES/CJS typé, Web, Node.js, Bun, Deno ; licence MIT (zxing-cpp Apache-2.0, zint BSD-3) ; binaire wasm ~1.46 MiB complet, ~1.04 MiB lecteur seul ; `readBarcodes` accepte Blob, File, ArrayBuffer, Uint8Array ou ImageData (objet `{data,width,height}` hors DOM) ; options `tryHarder`, `formats: ["QRCode"]`, `maxNumberOfSymbols` — [GitHub Sec-ant/zxing-wasm](https://github.com/Sec-ant/zxing-wasm).
- Dernière version vue : 3.0.3, mise à jour du 04.05.2026 (agrégateur ; npm affichait une version plus ancienne en cache) — [depscope](https://mcp.depscope.dev/pkg/npm/zxing-wasm) ; [npm](https://npmjs.com/package/zxing-wasm).
- Le paquet `barcode-detector` est un polyfill de l'API BarcodeDetector bâti sur zxing-wasm — [GitHub Sec-ant/zxing-wasm](https://github.com/Sec-ant/zxing-wasm).
- BarcodeDetector natif : supporté sur Chrome Android ; Safari iOS « désactivé par défaut » de 17.0 à 26.5 ; Firefox non supporté (155) — [caniuse](https://caniuse.com/mdn-api_barcodedetector) ; tous les navigateurs iOS (WebKit) en sont privés — [eringen, Substack](https://eringen.substack.com/p/barcode-scanning-on-ios-the-missing).
- jsQR : Apache-2.0, JS pur, `jsQR(rgba, w, h, {inversionAttempts})` ; l'essai inversé par défaut coûte ~50 % de temps ; « toutes les images de test ne décodent pas » ; 80 issues et 18 PR ouvertes, aucune release publiée sur GitHub — [GitHub cozmo/jsQR](https://github.com/cozmo/jsQR).
- Banc éditeur (Dynamsoft, codes surtout 1D) sur 7 894 images réelles : zxing-wasm précision 92.35 % contre 91.81 %, médiane 74.10 ms contre 100.20 ms ; Dynamsoft lit plus de cas difficiles — [Dynamsoft](https://www.dynamsoft.com/codepool/benchmark-barcode-reading-javascript-zxing-wasm-dynamsoft-barcode-reader.html).
- `@paulmillr/qr` revendique être plus rapide que zxing-wasm et décoder 58 % des vecteurs photo BoofCV (allégation de l'auteur) — [JSR @paulmillr/qr](https://jsr.io/@paulmillr/qr@0.7.2).
- Banc comparatif jsQR / zxing-js / jsqrcode sur la suite de test zxing — [danimoh/qr-scanner-benchmark](https://www.github.com/danimoh/qr-scanner-benchmark).

### Inferences
- Ordre de confiance proposé : QR décodé > texte PDF natif > lecture du modèle. Montant (L19), devise (L20), IBAN, créancier deviennent des faits ; avec S1 : `/11/` remplace la date lue (et `/31/` donne la période, jamais confondue avec la date), `/32/` donne le net par taux, d'où la TVA par calcul. Le code « Fr. » disparaît : L20 est toujours `CHF` ou `EUR`.
- Le montant du QR est le montant **à payer** : il peut être vide (montant ouvert), ou différer du total facture (acompte, note de crédit, escompte). À traiter comme contrôle croisé fort, pas comme écrasement aveugle du total.
- Calcul (pas une source) : un QR v23 compte 4×23+17 = 109 modules sur 46 mm. Sur une photo d'A4 entière en 4000 px de large, le QR fait ~875 px (8 px/module, confortable) ; ramenée à 1024 px de large, ~224 px (~2 px/module, à la limite). Il faut donc décoder **avant** toute réduction, sur l'original, et si possible sur un recadrage du quart inférieur droit (section paiement).
- Chemin conseillé : BarcodeDetector si présent (Android) ; sinon zxing-wasm `/reader` chargé à la demande et mis en cache par le service worker (hors ligne) ; second essai côté Cloud Function avec zxing-wasm sous Node sur le fichier reçu. La croix suisse ne demande aucun traitement particulier : le niveau M l'absorbe, mais elle consomme une partie du budget d'erreur, ce qui rend le flou plus pénalisant.
- Contrôles déterministes après décodage : nombre de lignes 32–34, `SPC`/`0200`/`EPD`, IBAN mod 97 (ISO 13616), QRR modulo 10 récursif, SCOR modulo 97 (ISO 11649), cohérence QRR ↔ QR-IBAN (IID 30000–31999).
- Accepter encore le type `K` (anciennes factures, archives) même si interdit pour les nouvelles émissions après le 30.09.2026.

### Gaps
- Le texte de l'IG v2.3/v2.4 n'a pas pu être extrait (PDF à polices encodées) : longueurs exactes, règle « 140 caractères ensemble » et liste complète des changements v2.4 non vérifiées à la source.
- Aucune statistique trouvée sur la part de QR-factures portant S1 ; pas de mesure publique de fiabilité de décodage sur photos de téléphone de petits QR suisses.
- zbar-wasm non étudié (taille, licence, maintenance) faute de temps d'appels.
- Mention d'une syntaxe « S2 » (qrcode4payment) non confirmée.
- Le générateur de l'app (`swissqrbill`) n'a pas été vérifié pour une fonction de lecture.

## 2. Factures PDF : couche texte, PDF scannés, factures électroniques embarquées

### Takeaway
Pour un PDF numérique, la couche texte donne les chiffres exacts : Gemini 3 l'ajoute déjà lui-même à l'image des pages (« + Native Text »), et pdf.js permet de l'extraire localement pour des contrôles déterministes et pour détecter un PDF scanné (peu ou pas de texte). Les XML embarqués (ZUGFeRD/Factur-X) sont recommandés en Suisse depuis 2020 mais rares chez les PME suisses ; eBill est massif côté particuliers mais arrive dans l'e-banking, pas comme fichier.

### Cited Findings
- Gemini 3 : un PDF coûte 280/560/1120 jetons par page (LOW/MEDIUM/HIGH) « + Native Text » ; défaut 560 ; images 280/560/1120/2240 (ULTRA_HIGH), défaut 1120 — [Google, Media resolution, maj 13.10.2026](https://ai.google.dev/gemini-api/docs/generate-content/media-resolution).
- Pour les PDF, Google recommande MEDIUM : la qualité « sature » à medium et HIGH améliore rarement l'OCR de documents standard ; résolution par partie (`media_resolution` sur une Part) expérimentale, réservée aux Gemini 3 et 4 ; la page cite `gemini-3.8-flash` — [Google, Media resolution](https://ai.google.dev/gemini-api/docs/generate-content/media-resolution).
- Gemini 2.5 : PDF scanné « 256 + OCR », PDF natif « 256 + Native Text » — [Google, Media resolution](https://ai.google.dev/gemini-api/docs/generate-content/media-resolution).
- pdf.js : dernières versions v6.4.299 (03 oct.), v6.3.289 (29 août), v6.2.108 (28 juil.) ; Node.js ≥ 22 requis depuis v5.7.284 ; `getAttachments` renvoie une `Map` depuis v6.1.200 (changement d'API) — [GitHub mozilla/pdf.js releases](https://github.com/mozilla/pdf.js/releases) ; licence Apache-2.0 — [pdf.js LICENSE](https://github.com/mozilla/pdf.js/blob/master/LICENSE).
- Détection scanné/numérique : un texte vide via `getTextContent()` sur la page 1 indique un PDF image (méthode naïve) — [codepal](https://codepal.ai/code-generator/query/0CuGzUSg/javascript-function-detect-image-based-pdf) ; `ppu-pdf` (sur pdfjs-dist ou mupdfjs) offre une détection par page et par document fondée sur des seuils de texte — [JSR @snowfluke/ppu-pdf](https://jsr.io/@snowfluke/ppu-pdf).
- Suisse : pas d'obligation générale d'e-facture ; obligatoire seulement envers la Confédération (B2G) au-delà de CHF 5 000 — [pfeffersack.ch](https://pfeffersack.ch/blog/e-rechnung-schweiz-zukunft) ; pas d'obligation B2B privée — [ecosio](https://ecosio.com/de/blog/zugferdfactur-x-in-der-schweiz/).
- Le groupe « Hybrid Invoice » de GS1 Switzerland recommande ZUGFeRD/Factur-X comme format hybride suisse — [Seeburger](https://blog.seeburger.com/zugferd-factur-x-for-e-invoicing-switzerland/) ; recommandation officielle depuis début 2020 — [ecosio](https://ecosio.com/de/blog/zugferdfactur-x-in-der-schweiz/). Aucune source ne chiffre l'usage réel chez les PME suisses (sources d'éditeurs).
- ZUGFeRD 2.5 = Factur-X 1.09 publié le 10.06.2026, à utiliser dès le 01.07.2026 ; avant : ZUGFeRD 2.4 / Factur-X 1.08 obligatoire dès le 15.01.2026 (sources d'éditeurs) — [Projektron](https://www.projektron.de/en/blog/details/zugferd-format-3513/) ; [Stimulsoft](https://www.stimulsoft.com/en/blog/articles/support-for-factur-x-1-08-and-zugferd-2-4-versions-in-stimulsoft-products).
- Allemagne : factures papier encore admises jusqu'à fin 2026 avec l'accord du destinataire — [WHK Controlling](https://www.whk-controlling.de/wissen/erechnung-2026).
- eBill : plus de 4 millions d'utilisateurs fin juin 2026 (~moitié des adultes) ; ~93 millions de transactions en 2025, plus de 100 millions attendues en 2026 ; en moyenne près de 7 émetteurs par utilisateur — [SIX, communiqué du 26.08.2026](https://www.six-group.com/en/newsroom/media-releases/2026/20260826-ebill-surpasses-four-million-user-mark.html).

### Inferences
- Pour un PDF numérique, l'envoyer **comme PDF** à Gemini (et non rasterisé en JPEG) lui donne la couche texte native ; un PDF converti en image perd cet avantage.
- En parallèle, pdf.js (client ou Node) extrait le texte pour des contrôles sans IA : regex du n° CHE, des IBAN, des montants « Total », des taux ; la comparaison des chiffres lus par le modèle avec ceux du texte natif signale une colonne erronée. Rendre la page en canevas à haute échelle permet aussi de décoder le QR de manière quasi parfaite (code vectoriel ou image nette).
- Détection scanné : compter les éléments de texte sur toutes les pages (pas seulement la page 1) ; un PDF « scanné » contenant une couche OCR fantôme peut tromper le compteur : comparer aussi la vraisemblance du texte (présence de montants et de mots-clés).
- XML embarqués : via `getAttachments()`, chercher un fichier XML CII/UBL ; s'il existe, il donne totaux, TVA par taux, dates et n° sans vision. Utile surtout pour des fournisseurs allemands ou français (malt, houblon) ; rare chez les fournisseurs suisses.
- eBill concerne surtout la facturation aux particuliers via l'e-banking : peu d'impact sur la lecture de fichiers par l'app, sauf si le brasseur télécharge le PDF depuis son e-banking (alors PDF numérique avec QR).

### Gaps
- Noms de fichiers embarqués (`factur-x.xml`, `zugferd-invoice.xml`, `xrechnung.xml`) et syntaxes CII/UBL non vérifiés à la source.
- Taille du paquet pdfjs-dist (worker compris) non mesurée.
- Aucune donnée sur la part de PDF numériques vs scannés chez les fournisseurs d'une micro-brasserie suisse.
- Swiss eBill pour B2B (format, téléchargement PDF/XML) non étudié.

## 3. Préparation de l'image sur le téléphone

### Takeaway
Les preuves sur les VLM vont dans un sens prudent : corriger l'orientation et la perspective aide (la lecture de structure se dégrade nettement sous distorsion et une simple correction de rotation la rétablit en partie), tandis que la binarisation et le débruitage lourds peuvent faire perdre de l'exactitude. Le budget de jetons par image est plafonné (1120 en HIGH chez Gemini 3), donc découper un long ticket en tuiles ou recadrer le tableau des lignes donne plus de jetons à la zone utile.

### Cited Findings
- Distorsion perspective et rotation (Gemini-1.5-pro, documents synthétiques) : l'exactitude de reconnaissance de structure (ordre de lecture) est « significativement dégradée », et « une simple correction rotationnelle » l'améliore ; chiffres absents du résumé — [Nakada & Tanaka, arXiv 2511.17607, nov. 2025](https://arxiv.org/abs/2511.17607).
- Robustesse des VLM aux distorsions composées (perspective, rotation, bruit) en extraction structurée jugée « sous-explorée » ; 11 systèmes sur 750 chèques synthétiques ; open source affiné > F1 0.98 ; Claude Sonnet 4.5 « s'effondre » sur la date — [Patel et al., arXiv 2609.15706, sept. 2026](https://arxiv.org/abs/2609.15706).
- OCR-Robust (812 échantillons) : une meilleure exactitude sur image propre n'implique pas une meilleure robustesse ; les contenus structurés (tableaux) sont plus fragiles — [hyper.ai, arXiv 2606.26041](https://hyper.ai/en/papers/2606.26041).
- 15 840 images dégradées (bruit, résolution, rotation, flou) pour mesurer l'effet sur l'OCR des LVLM — [Urbanski & Peters, DATA 2025](https://www.scitepress.org/publishedPapers/2025/134628/pdf/index.html).
- Real5-OmniDocBench évalue numérisation, inclinaison, gauchissement, photo d'écran, éclairage — [PaddleOCR-VL-1.5, arXiv 2601.21957](https://arxiv.org/html/2601.21957v2).
- Blog d'ingénierie (avril 2026, non revu par les pairs) : le prétraitement aide parfois de 2–3 %, nuit parfois ; les réseaux sont plus sensibles au flou et au bruit qu'à la compression JPEG ou au contraste ; exemple illustratif (hypothétique) 94 % → 87 % après redressement et binarisation ; mesurer avant/après sur un jeu réservé, activer par type de document — [tianpan.co](https://tianpan.co/blog/2026-04-12-vision-inputs-production-ai-pipelines-preprocessing).
- Gain de 10 à 15 points annoncé pour l'OCR classique (300 dpi, débruitage, binarisation, redressement), chiffre éditeur Docsumo — [rets.ai](https://rets.ai/glossary/image-preprocessing) ; un débruitage lourd peut effacer les filets fins de tableau — [rets.ai](https://rets.ai/glossary/image-preprocessing).
- Gemini 3 : image plafonnée à 1120 jetons en HIGH (défaut), 2240 en ULTRA_HIGH ; réglage par partie expérimental — [Google, Media resolution](https://ai.google.dev/gemini-api/docs/generate-content/media-resolution).
- 150 dpi suffisent le plus souvent à l'extraction de texte par VLM (guide pratique) — [mljourney](https://mljourney.com/how-to-extract-text-from-images-with-an-llm/).
- EXIF : `image-orientation: from-image` est la valeur initiale CSS (rotation EXIF appliquée), disponible dans tous les navigateurs depuis avril 2020 ; la page ne couvre ni `drawImage` ni `createImageBitmap` (qui a sa propre option `imageOrientation`) — [MDN image-orientation](https://developer.mozilla.org/en-US/docs/Web/CSS/image-orientation).
- jscanify 1.4.0, MIT, sur OpenCV.js : détection du papier, `extractPaper` (correction de perspective), suppression des reflets et papier coloré depuis 1.3.0 ; navigateur et Node ; ~482 téléchargements/semaine ; conseille un fond uni — [GitHub jscanify](https://www.github.com/ColonelParrot/jscanify) ; [npm jscanify](https://npmjs.com/package/jscanify).
- OpenCV.js : >8 Mo (2019), wasm ~6 Mo (2020), ~4.2 Mo en build réduit, ~2 Mo avec core + features2d seulement (chiffres anciens) — [OpenCV Q&A 2019](https://answers.opencv.org/question/209264/opencvjs-smaller-package) ; [OpenCV Q&A 2020](https://answers.opencv.org/question/229032/opencv_jswasm-is-too-large).

### Inferences
- Chaîne minimale proposée : (1) décoder le QR sur l'original ; (2) orientation EXIF appliquée au décodage (`createImageBitmap(file, { imageOrientation: "from-image" })`, à vérifier sur iOS) ; (3) recadrage/perspective optionnel (jscanify, OpenCV.js chargé à la demande, ~4–8 Mo : coûteux au premier usage, à cacher hors ligne) ; (4) réduction à une taille où le texte reste lisible ; (5) **pas** de binarisation ni de débruitage fort pour le VLM : garder la couleur (tampons, surlignages, colonnes grisées).
- Comme une image vaut au plus 1120 jetons quelle que soit sa taille, envoyer 4000 px n'apporte rien de plus que la limite interne ; un long ticket gagne à être découpé en 2–3 tuiles avec recouvrement (chaque tuile = 1120 jetons) ou à envoyer le tableau des lignes recadré en plus de la page entière. À mesurer sur le banc (`banc-lecture-facture`).
- Proposer ULTRA_HIGH (2240) par partie seulement pour la tuile du tableau ou en relecture ciblée, puisque le réglage par partie existe sur Gemini 3.
- La qualité JPEG compte moins que le flou : un contrôle de netteté (variance du laplacien) à la prise de vue, avec invite « reprendre la photo », a plus de valeur qu'un filtre après coup.

### Gaps
- Pas d'étude chiffrée trouvée sur Gemini 3.x montrant l'effet net de la correction de perspective, de la binarisation ou de la qualité JPEG sur l'extraction de champs de facture.
- Résolution interne de Gemini 3 pour une image (redimensionnement, tuilage) non documentée sur la page.
- Taille actuelle d'OpenCV.js 4.x et alternatives plus légères (détection de bords sans OpenCV) non trouvées ; HEIC iPhone non étudié.
- Qualité JPEG optimale pour un VLM : aucune source chiffrée.

## 4. Règles de validation déterministes pour factures suisses

### Takeaway
Les taux (8.1 / 2.6 / 3.8 % depuis le 01.01.2024), la clé du n° IDE CHE (poids 5-4-3-2-7-6-5-4, modulo 11), l'arithmétique net + TVA = brut par taux, la somme des lignes et l'égalité avec le montant QR donnent des contrôles bon marché ; chaque échec désigne un champ précis à relire. Le taux dépend de la date ou période de la prestation, pas de la date de facture.

### Cited Findings
- Taux en vigueur depuis le 01.01.2024 : normal 8.1 %, réduit 2.6 % (eau, denrées, médicaments, journaux, livres ; produits d'hygiène menstruelle dès 01.01.2025), hébergement 3.8 % (petit-déjeuner compris) ; aucune modification annoncée sur la page (maj 22.09.2026) — [ESTV, taux de TVA](https://www.estv.admin.ch/de/mwst-steuersaetze-schweiz).
- Taux antérieurs 7.7 / 2.5 / 3.7 % — [PwC](https://www.pwc.ch/de/insights/steuern/erhoehung-der-schweizer-mwst-saetze.html).
- Votation du 29.11.2026 sur le financement de la 13e rente AVS : taux normal de 8.1 % à 8.5 %, entrée en vigueur au plus tôt début 2028 ; taux réduit inchangé — [admin.ch, financement additionnel AVS](https://www.admin.ch/de/ahv-zusatzfinanzierung) ; [SRF](https://www.srf.ch/news/schweiz/nach-parlamentsentscheid-13-ahv-rente-nur-teilfinanziert-wie-geht-es-weiter).
- Art. 26 MWSTG : la facture indique la date **ou la période** de la prestation si elle diffère de la date de facture, le taux applicable et le montant d'impôt (ou seulement le taux si le prix inclut la TVA) ; le taux se détermine selon la période ou la date de prestation (exemple d'abonnement réparti 7.7 % / 8.1 %) — [WEKA](https://www.weka.ch/themen/finanzen-controlling/mehrwertsteuer/mehrwertsteuerpflicht/article/mwst-rechnung-entgelt-fuer-eine-leistung-abrechnen/) ; [Art. 26 MWSTG (en)](https://lawbrary.ch/law/art/MWSTG-v2023.01-en-art-26).
- Les exigences de l'art. 26 ne conditionnent pas la déduction de l'impôt préalable — [WEKA, impôt préalable](https://www.weka.ch/themen/finanzen-controlling/mehrwertsteuer/buchfuehrung-und-abrechnung/article/falscher-mwst-ausweis-umgang-mit-eingangsrechnungen/).
- IDE/UID : format `CHE-999.999.99C` ; clé : poids 5,4,3,2,7,6,5,4 sur les 8 premiers chiffres, clé = 11 − (somme mod 11), 11 → 0, 10 → numéro invalide ; exemples CHE-100.155.212, CHE-116.281.710 — [python-stdnum uid.py](https://sources.debian.org/data/main/p/python-stdnum/2.1-3/stdnum/ch/uid.py) ; [recon-cli ch.rs](https://docs.rs/crate/recon-cli/0.93.0/source/src/checkdigit/vat/ch.rs). Une clé juste ne prouve pas l'existence au registre (recherche IDE officielle) — [lookuptax](https://lookuptax.com/docs/how-to-verify/uid-switzerland).
- Arrondi à 5 centimes : le paiement comptant est arrondi au multiple de 5 ct (plus petite pièce) — [Comarch](https://help.comarch.com/pos/?p=2777) ; sur facture, le total est en général arrondi à 5 ct et une ligne d'arrondi apparaît — [Sage X3 SWIRNDSIH](https://online-help.sagex3.com/erp/12/en-us/Content/OBJ/ADP_LOC_SWIRNDSIH.htm) ; [Business Central (gws)](https://docs.gws.ms/de-DE/geviserpveo/business-central/finance-set-up-invoice-rounding.html) ; montants CHF arrondis conventionnellement à 0.05 — [invoicedataextraction.com](https://invoicedataextraction.com/blog/swiss-qr-bill-requirements).
- TVA par ligne (méthode horizontale) ou sur le total (verticale) : petits écarts possibles entre brut et net — [forum Shopware (utilisateur, non sourcé)](https://forum.shopware.com/t/steuerberechnung-abweichung-rundungsfehler/66100).

### Inferences
- Contrôles et relecture ciblée proposés :
  1. Taux ∈ {8.1, 2.6, 3.8, 0} ; 7.7/2.5/3.7 seulement si la période de prestation est antérieure à 2024 → sinon relire la colonne des taux.
  2. Par taux : |net × taux − TVA| ≤ 0.01 × nombre de lignes (méthode horizontale) ; net + TVA = brut à 0.01 près → sinon relire le bloc récapitulatif TVA.
  3. Σ bruts (+ ligne d'arrondi ≤ 0.04) = total → sinon « mauvaise colonne de total ».
  4. Total = montant QR (si présent) → sinon relire le total, ou acompte/escompte.
  5. Total multiple de 0.05 : contrôle souple (avertissement, pas un rejet).
  6. N° CHE : clé modulo 11 et suffixe MWST/TVA/IVA ; S1 `/30/` comparé.
  7. Dates : date de facture ≤ aujourd'hui ; si une période est lue, la date de facture n'est pas son début ; S1 `/11/` prime.
  8. Deux taux mais un seul net/TVA lu → relecture ciblée du tableau TVA seul (recadrage, ULTRA_HIGH).
- Après la votation du 29.11.2026 : si oui, prévoir 8.5 % dès 2028 au plus tôt, piloté par la date de prestation.

### Gaps
- Pas de texte officiel ESTV trouvé sur l'arrondi à 5 ct des factures ni sur la tolérance d'écart TVA ; la règle « TVA arrondie par ligne » n'est sourcée que par un forum.
- Effet de la votation sur le taux d'hébergement 3.8 % non vérifié.
- Spécification officielle OFS/IDE de la clé non lue (implémentations libres concordantes).

## 5. Normalisation devise et dates des documents suisses

### Takeaway
Le QR (L20 `CHF`/`EUR`) et S1 (`yyMMdd`) donnent devise et date sous forme normée ; sans QR, la normalisation repose sur des règles de texte (Fr., SFr., CHF, « .– ») et sur l'art. 26 MWSTG qui distingue date de facture et date ou période de prestation. Les formes d'écriture suisses elles-mêmes n'ont pas trouvé de source primaire dans cette recherche.

### Cited Findings
- Devise du QR limitée à `CHF` ou `EUR` — [qrcode4payment](https://qrcode4payment.pages.dev/docs/SWISS_QR_SPEC.md) ; [invoicedataextraction.com](https://invoicedataextraction.com/blog/swiss-qr-bill-requirements).
- Montant du QR : point décimal, 0.01 à 999999999.99 — [qrcode4payment](https://qrcode4payment.pages.dev/docs/SWISS_QR_SPEC.md).
- Dates S1 en `yyMMdd`, période TVA = début + fin sans séparateur (12 chiffres) — [SwicoS1Encoder.java](https://raw.githubusercontent.com/manuelbl/SwissQRBill/master/generator/src/main/java/net/codecrete/qrbill/generator/SwicoS1Encoder.java).
- La facture porte la date ou la période de prestation quand elle diffère de la date de facture — [WEKA, art. 26 MWSTG](https://www.weka.ch/themen/finanzen-controlling/mehrwertsteuer/mehrwertsteuerpflicht/article/mwst-rechnung-entgelt-fuer-eine-leistung-abrechnen/).

### Inferences
- Règles proposées (non sourcées, à tester sur le banc) : « Fr. », « Frs », « SFr. », « sFr. », « CHF », « CHF.- », « Fr. 12.– », « 12.-- » → `CHF` et décimales 00 ; « € », « EUR » → `EUR` ; séparateur de milliers apostrophe (1'234.50) ou espace fine ; virgule décimale possible sur les factures en allemand d'Allemagne.
- Dates : `jj.mm.aaaa` ou `jj.mm.aa` ; mois en toutes lettres (fr/de) ; « période du … au … », « Leistungszeitraum », « Zeitraum », « Abrechnungsperiode » → période, jamais date de facture ; « Rechnungsdatum », « Datum », « date de facture », « Lieferdatum » distingués ; ambiguïté jj/mm improbable en Suisse (pas de format mm/jj américain), mais une facture étrangère peut l'introduire.
- Demander au modèle des champs séparés `date_facture`, `periode_debut`, `periode_fin`, `date_livraison`, puis appliquer la priorité S1 > texte PDF > modèle.

### Gaps
- Aucune source primaire trouvée sur les formes d'écriture de la devise (Fr., SFr., « .– ») ni sur les formats de date suisses ; la section repose sur des inférences.
