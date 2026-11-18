# Services tiers et modèles ouverts pour lire les factures (remplacer ou doubler Gemini) — état au 01.11.2026

Contexte de départ (donné par le pilote, non vérifié ici) : l'app lit des photos et captures de factures avec une paire
gemini-3.5-flash-lite et un arbitre gemini-3.8-flash en cas de désaccord ; 10 à 17 s et 0,02 à 0,04 CHF par facture ;
quelques dizaines de factures par mois ; les lignes (nom, quantité, unité, prix unitaire, total, taux de TVA) comptent
autant que l'en-tête.

Avertissement de méthode : 19 appels de recherche (au-dessus du budget de 15). Beaucoup de chiffres viennent de sites
agrégateurs ou de concurrents ; les pages de prix officielles de Google et d'Azure n'ont pas pu être lues (contenu tronqué
ou tarifs masqués). Aucun appel payant, aucune installation.

## 1. API spécialisées factures et reçus : qualité des lignes, langues, prix, latence, gratuit, lieu de traitement

### Takeaway
Au volume de L'Affinée (dizaines de pages par mois), toutes les API spécialisées coûtent moins d'un franc par mois, sauf
Veryfi (plancher 500 $/mois) ; le choix se fait donc sur la qualité des lignes et le lieu de traitement, pas sur le prix.
Azure Document Intelligence (prebuilt-invoice, v4.0, région Switzerland North) et Mistral Document AI (OCR + annotations
en schéma JSON/Zod, endpoints UE) sont les deux candidats réalistes ; Google Document AI Invoice Parser et AWS
AnalyzeExpense sont derrière dans le seul banc comparatif de factures trouvé.

### Cited Findings

**Azure AI Document Intelligence — prebuilt-invoice**
- Dernière version GA : v4.0, API `2024-11-30`, modèle `prebuilt-invoice` ; page de doc mise à jour le 2026-10-19 (aucune version plus récente que 2024-11-30 n'y figure) — [Microsoft Learn, Invoice model](https://learn.microsoft.com/en-us/azure/ai-services/document-intelligence/prebuilt/invoice)
- Extrait champs clés **et lignes** de factures, factures de services, bons de commande ; accepte « phone-captured images, scanned documents, and digital PDFs » ; 27 langues ; SDK JavaScript officiel listé pour v4.0 — [Microsoft Learn](https://learn.microsoft.com/en-us/azure/ai-services/document-intelligence/prebuilt/invoice)
- Contraintes d'entrée : JPEG/PNG/BMP/TIFF/HEIF/PDF ; texte d'au moins 12 px sur une image 1024×768 (≈ 8 pt à 150 dpi) ; 50×50 à 10 000×10 000 px ; palier gratuit F0 : 4 Mo et seulement les 2 premières pages ; payant S0 : 500 Mo, 2 000 pages — [Microsoft Learn](https://learn.microsoft.com/en-us/azure/ai-services/document-intelligence/prebuilt/invoice)
- Le schéma exact des champs de ligne est publié séparément (schéma 2024-11-30) — [GitHub Azure-Samples, invoice.md](https://github.com/Azure-Samples/document-intelligence-code-samples/blob/main/schema/2024-11-30-ga/invoice.md) (non lu ici)
- Prix : prebuilt (dont facture) 10 $ / 1 000 pages (≈ 0,01 $/page), Read 1,50 $, custom extraction 30 $ / 1 000 pages, en East US — [ERP Research, pricing 2026](https://www.erpresearch.com/erp-add-ons/ocr/azure-document-intelligence/pricing) ; [superdupr, pricing 2026](https://superdupr.com/blog/azure-document-intelligence-pricing). Une source signale qu'en août 2026 la page officielle affichait des tirets au lieu des tarifs — [résultats de recherche agrégés, voir invoiceextractor.ai](https://invoiceextractor.ai/azure-document-intelligence-pricing). Aucun tarif propre à Switzerland North trouvé.
- Gratuit F0 : 500 pages/mois (2 premières pages par document) — [superdupr](https://superdupr.com/blog/azure-document-intelligence-pricing) ; confirmé pour la limite des 2 pages par [Microsoft Learn](https://learn.microsoft.com/en-us/azure/ai-services/document-intelligence/prebuilt/invoice)
- Région : Document Intelligence listé et suivi en Switzerland North (sources secondaires) — [statusfield, DI Switzerland North](https://statusfield.com/services/microsoft-azure-europe/azure-ai-document-intelligence-switzerland-north) ; [cloudatlas](https://cloudatlas.pages.dev/services/azure-ai-document-intelligence/) ; Switzerland North = Zurich, données au repos en Suisse, paire Switzerland West — [azurespeed](https://www.azurespeed.com/Information/AzureRegions/SwitzerlandNorth) ; régions suisses ouvertes en 2019 pour la résidence des données — [Thomas Maurer, 2019](https://www.thomasmaurer.ch/2019/08/microsoft-azure-regions-in-switzerland-now-available/) (ancien)

**Google Document AI — Invoice Parser, Custom Extractor**
- Invoice Parser : 0,10 $ par bloc de 10 pages selon des agrégateurs, arrondi au bloc supérieur (une facture d'1 page coûterait comme 10 pages) ; une autre source dit « 0,10 $ par count » en octobre 2026 — [ERP Research, Google DocAI pricing](https://www.erpresearch.com/erp-add-ons/ocr/google-document-ai/pricing) ; [invoiceextractor.ai](https://invoiceextractor.ai/google-document-ai-pricing). **Ambigu** : la page officielle n'a pas pu être lue — [cloud.google.com/document-ai/pricing](https://cloud.google.com/document-ai/pricing) (contenu tronqué au fetch)
- Custom Extractor génératif : ≈ 30 $ / 1 000 pages, 20 $ au-delà d'1 M pages/mois — [ERP Research](https://www.erpresearch.com/erp-add-ons/ocr/google-document-ai/pricing) ; [openapipricing](https://openapipricing.com/blog/docai/google-document-ai)
- Banc de 20 factures (mars 2026) : Google Document AI Invoice Parser 79,76 %, dernier des services testés (68,1 % en mars 2025) — [Businessware, 2026](https://www.businesswaretech.com/blog/best-ai-models-for-invoice-processing-in-2026-gemini-aws-chatgpt)

**AWS Textract — AnalyzeExpense**
- Officiel : 0,01 $/page jusqu'à 1 M pages, 0,008 $ au-delà (exemple US West Oregon) ; gratuit 100 pages/mois pendant 3 mois pour les nouveaux comptes ; aucun tarif par région — [AWS Textract pricing](https://aws.amazon.com/textract/pricing/). Contredit par un calculateur tiers à 1,50 $ / 1 000 pages et 150 pages gratuites — [factualminds](https://www.factualminds.com/tools/amazon-textract-pricing-calculator/) ; la page AWS prime.
- Facturation AnalyzeExpense observée en Europe à Francfort (EUC1) et Paris (EUW3) ; aucune ligne pour Zurich (eu-central-2) — [Vantage, EUC1](https://cur.vantage.sh/aws/amazontextract/euc1-syncexpensepagesprocessed) ; [Vantage, EUW3](https://cur.vantage.sh/aws/amazontextract/api%20request/euw3-syncexpensepagesprocessed)
- Banc de 20 factures : AnalyzeExpense 83,05 % en 2026 (91,1 % en mars 2025) — [Businessware](https://www.businesswaretech.com/blog/best-ai-models-for-invoice-processing-in-2026-gemini-aws-chatgpt)

**Mistral OCR / Document AI (annotations)**
- Version courante citée : Mistral OCR 4 / 4.1 (4.1 en « preview », sortie juillet 2026) ; OCR standard 4 $ / 1 000 pages, batch 2 $ ; **annotations (Document AI) 5 $ / 1 000 pages** ; en euros 3,5 € et 4,38 € — [The Rundown, OCR 4.1](https://www.therundown.ai/tools/mistral-ocr-4) ; [invoiceextractor.ai, Mistral pricing](https://invoiceextractor.ai/mistral-ocr-pricing) ; [Kompozy, OCR 4.1 review](https://kompozy.io/reviews/mistral-ocr-4-1) ; [aitopic, juillet 2026](https://www.aitopic.org/en/daily-topics/mistral-ocr-4-1-document-ai-july-2026-release). Non vérifié sur la page officielle de Mistral ; la revue Kompozy rappelle qu'un modèle preview peut changer de prix.
- Mécanisme : `document_annotation` envoie le Markdown de l'OCR **plus les 8 premières images détectées** à un LLM vision, avec un format défini en **Pydantic, Zod ou JSON Schema** (objets imbriqués, tableaux, enums) et un `document_annotation_prompt` facultatif ; `bbox_annotation` annote chaque figure ; id d'exemple `mistral-ocr-latest` ; entrées PDF, images (y compris basse qualité, manuscrit), DOCX, PPTX — [Mistral docs, Annotations](https://docs.mistral.ai/capabilities/document_ai/annotations/)
- Les limites de pages des annotations et la liste des langues ne figurent pas dans la page lue — [Mistral docs](https://docs.mistral.ai/capabilities/document_ai/annotations/)
- Un revendeur liste OCR 4.1 à 0,004 $/page, résidence UE disponible — [Opper, OCR 4.1](https://opper.ai/mistral/mistral-ocr-4-1)

**Mindee, Veryfi, Klippa, autres**
- Veryfi : 0,16 $ par facture (page officielle), remise d'1 centime sur engagement 12 mois ; l'API démarre à 500 $/mois d'usage — [Veryfi pricing](https://veryfi.com:443/pricing) ; [Veryfi FAQ](https://faq.veryfi.com/en/articles/3743986-what-are-the-plans-prices-for-ocr-api)
- Mindee : gratuit 250 pages/mois selon un comparatif, ou Starter ≈ 44 €/mois pour 500 pages selon un autre ; **contradiction**, page officielle non lue — [DocuClipper (concurrent)](https://www.docuclipper.com/comparisons/best-value-invoice-ocr-2026/) ; [ERP Research, Klippa vs Mindee](https://erpresearch.com/erp-add-ons/ocr/klippa-vs-mindee)
- Klippa : tarifs non publics ; « DocHorizon dès ≈ 0,04 €/document » non confirmé par le vendeur — [ERP Research, Klippa pricing](https://erpresearch.com/erp-add-ons/ocr/klippa/pricing) ; [dev.to, alternatives Klippa](https://dev.to/thompson-kari/best-alternatives-to-klippa-7-top-tier-ai-invoice-ocr-solutions-for-2026-5ep5)
- Nanonets : son modèle Nanonets OCR-3 est 1er (85,9) du classement IDP que Nanonets tient lui-même — [IDP Leaderboard](https://www.idp-leaderboard.org/)

**Fournisseurs suisses / QR-facture**
- PDF4me : API REST SwissQR qui lit le QR des PDF (OCR + code-barres) et rend du JSON — [pdf4me developer](https://developer.pdf4me.com/?p=8010)
- Parashift : extraction de factures QR suisses et internationales par API REST — [parashift.io](https://parashift.io/?p=2625)
- DocBits : fusionne QR suisse, ZUGFeRD et OCR/ML, **le QR prime pour les champs de paiement** — [DocBits docs](https://docs.docbits.com/administration-and-setup/settings/global-settings/document-types/edi/zugferd-and-swiss-qr-merge)
- Lecteur QR-facture Apify : décode le QR sans OCR, mais tourne sur Apify (pas en Suisse par défaut) — [Apify actor](https://apify.com/najx/swiss-qr-bill-reader.md)
- Aucune de ces pages ne confirme un hébergement en Suisse — [résultats de recherche, voir pages ci-dessus](https://parashift.io/?p=2625)

### Inferences
- Coût : à 50 pages/mois, Azure ou Textract ≈ 0,50 $/mois, Mistral annotations ≈ 0,25 $/mois ; tous en dessous du coût Gemini actuel (0,02–0,04 CHF/facture ≈ 1–2 CHF/mois). Le prix ne départage pas ; Veryfi est exclu par son plancher de 500 $/mois.
- Google Document AI Invoice Parser n'apporte rien sur Gemini : il est dernier du seul banc de factures trouvé, et son arrondi par bloc de 10 pages (si confirmé) le rend 10× plus cher par facture d'une page.
- Azure prebuilt-invoice est le seul service spécialisé qui cumule : lignes de facture natives, photos de téléphone, SDK JS, région Zurich. C'est le meilleur « second vote » indépendant de Gemini (autre vendeur, autre architecture).
- Mistral Document AI accepte un schéma Zod : le schéma TypeScript de l'app pourrait être réemployé presque tel quel. Mais c'est lui-même un montage OCR + LLM, donc pas forcément plus rapide qu'un appel Gemini.
- Pour les factures suisses avec QR, décoder le QR (montant, IBAN, référence, créancier) donne des champs de paiement exacts sans IA ; c'est un contrôle croisé gratuit du total.

### Gaps
- Latence publiée par service (Azure, Textract, Google, Mistral) : rien trouvé ; à mesurer sur fixtures locales.
- Précision **par ligne** (quantité, unité, prix unitaire, taux de TVA) : aucun service ne publie de score séparé ; le banc Businessware mêle lignes et en-tête dans 16 champs.
- Prise en charge explicite du français, de l'allemand, des locales de-CH/fr-CH et du CHF par prebuilt-invoice : la liste des 27 langues est sur une page non lue ([language support prebuilt](https://learn.microsoft.com/en-us/azure/ai-services/document-intelligence/language-support/prebuilt)).
- Tarifs officiels Google Document AI (page tronquée) et Azure (page masquée) ; tarif officiel Mistral non lu ; Rossum, Nanonets (API) et Mindee non lus à la source.
- Abacus (AbaScan) et bexio OCR : aucune API publique trouvée.
- Disponibilité de Textract en Zurich (eu-central-2) : non confirmée ; Google Document AI en région « eu » : non sourcée ici.

## 2. VLM de pointe contre Gemini Flash / Flash-Lite sur l'extraction de documents

### Takeaway
Les classements indépendants ou semi-indépendants placent Gemini (Pro surtout, Flash ensuite) en tête ou près de la tête
pour l'extraction d'informations clés ; GPT-5.x est au même niveau, Claude Sonnet légèrement derrière, Claude Haiku
nettement derrière. Aucun classement trouvé ne couvre les modèles que l'app utilise (gemini-3.5-flash-lite, gemini-3.8-flash).

### Cited Findings
- IDP Leaderboard v1.5 (tenu par Nanonets, via son dépôt `docext`) : global / IDP — Nanonets OCR-3 85,9 / 80,2 ; GPT-5.4 83,5 / 84,4 ; Gemini-3-Pro 82,8 / 81,8 ; **Gemini-3-Flash 82,0 / 80,5** ; Gemini 3.1 Pro 81,6 / **89,6** ; GPT-5.2 81,5 / 77,4 ; Claude Sonnet 4.6 80,7 / 81,2 ; Claude Opus 4.6 80,4 / 81,1 ; Qwen3-VL-Plus 80,1 / 79,8 ; Qwen3-VL-235B 79,6 / 80,0 ; GPT-5-Mini 75,2 / 73,3 ; Mistral Small 4 71,5 / 68,5 ; Claude Haiku 4.5 71,2 / 72,9 ; GPT-4.1 68,0 / 74,7 ; global = moyenne de trois bancs (IDP, olmOCR, OmniDoc) ; pas de Flash-Lite, pas de Mistral OCR, pas de coût ni de latence, pas de date — [IDP Leaderboard](https://www.idp-leaderboard.org/)
- Sous-score KIE (extraction d'informations clés) : Gemini-3-Flash en tête à 91,10 (miroir du classement) — [benchmarklist, IDP leaderboard](https://benchmarklist.com/benchmarks/idp_leaderboard/)
- Banc factures Businessware (mars 2026, 20 factures de 2006 à 2020, 1 à 12 lignes chacune, 16 champs normalisés, sans réglage) : Gemini 3 Pro 94,75 % ; Azure DI 90,52 % ; Claude Sonnet 4.5 > 90 % (90,27 % selon le résumé de recherche) ; GPT-5.2 et GPT-5 Mini ≈ 88 % ; AWS AnalyzeExpense 83,05 % ; Google DocAI 79,76 % ; Gemini 3 Flash testé sans chiffre publié ; ni latence ni coût — [Businessware 2026](https://www.businesswaretech.com/blog/best-ai-models-for-invoice-processing-in-2026-gemini-aws-chatgpt) ; méthode générale — [Businessware IDP benchmark](https://www.businesswaretech.com/intelligent-document-processing-benchmark)
- ExtractBench (LlamaIndex sur Kaggle, mis à jour en octobre 2026, extraction guidée par schéma) : GPT-5.6 Sol 1er, GPT-6 Astra 2e, Gemini 4 Argon 5e, Claude Sonnet 5.5 plus bas — [Kaggle ExtractBench](https://www.kaggle.com/benchmarks/llamaindex-org/extractbench-leaderboard/leaderboard) (vu en résumé de recherche seulement, page non lue)
- Connaissement de 20 pages (Parseur, 2026, vendeur) : Claude 77, ChatGPT 76, Gemini 74 ; Claude seul à rendre les 47 numéros de conteneur — [Parseur](https://parseur.com/blog/llm-document-extraction-benchmark) (un seul document)
- Comparatifs complémentaires non lus : [Koncile, Claude vs GPT vs Gemini factures](https://www.koncile.ai/en/ressources/claude-gpt-or-gemini-which-is-the-best-llm-for-invoice-extraction) ; [revexos, 2026](https://revexos.com/blog/best-ai-model-for-invoice-parsing) ; [idp-software, « The 76% Wall »](https://idp-software.com/news/the-76-percent-wall/)

### Inferences
- Changer de famille de VLM n'apporterait pas de gain net de qualité : Gemini Flash est déjà parmi les meilleurs en KIE. Un autre VLM (GPT-5.x, Claude Sonnet) servirait plutôt de **vote indépendant** que de remplaçant.
- Claude Haiku 4.5 et GPT-5-Mini, souvent pris pour la vitesse, perdent 7 à 9 points d'IDP sur Gemini-3-Flash ; le rapide bon marché chez les autres vendeurs n'est pas meilleur que Flash-Lite.
- Le banc Businessware est petit (20 factures) et ancien par les documents (2006–2020) ; ses écarts de 2 à 4 points ne sont pas significatifs.

### Gaps
- Aucun score publié pour gemini-3.5-flash-lite ni gemini-3.8-flash, ni pour les modèles 2026 récents (GPT-5.6, Claude 5.5) sur un banc de factures.
- Latence et prix par facture des VLM concurrents : non trouvés dans des sources mesurées.
- DocILE, OCRBench v2 et bancs KIE académiques : non consultés faute de budget.
- Factures en français ou allemand, CHF, TVA suisse : aucun banc trouvé.

## 3. Modèles et outils ouverts : auto-hébergés, API bon marché, navigateur hors ligne

### Takeaway
Les meilleurs modèles ouverts de lecture (PaddleOCR-VL-1.6, MinerU2.5-Pro, GLM-OCR, dots.ocr, DeepSeek-OCR 2) excellent au
**rendu de page** (OmniDocBench ≈ 90 à 97), mais un bon rendu ne fait pas une bonne extraction : GLM-OCR, 95 sur
OmniDocBench, n'a que 54,9 en IDP. Dans le navigateur, des versions ONNX WebGPU existent (≈ 0,6 à 1,4 Go), utiles au mieux
pour un premier texte hors ligne, pas pour des lignes fiables.

### Cited Findings
- OmniDocBench v1.6 : TeleOCR 96,91 ; OvisOCR2 96,47 ; PaddleOCR-VL-1.6 96,34 (0,9 B, Apache 2.0) ; MinerU2.5-Pro 95,75 ; GLM-OCR 95,22 ; dots.ocr 90,77 ; DeepSeek-OCR 2 90,25 (91,09 ailleurs) ; olmOCR 85,74 ou 81,79 selon les sources ; pipeline MinerU classique 86,47 ; les tableaux d'origines différentes ne sont pas comparables — [Roboflow, 2026](https://roboflow.com/blog/best-open-source-ocr-models) ; [Docsumo](https://www.docsumo.com/blog/best-ocr-models) ; [Pasquale Pillitteri](https://pasqualepillitteri.it/en/news/25568/best-local-ocr-pc-server-2026) ; [invoicedataextraction, bancs OCR](https://invoicedataextraction.com/blog/ocr-benchmarks) (attribution exacte chiffre par chiffre non vérifiée, pages datées d'octobre à novembre 2026)
- dots.ocr à 88,41 sur OmniDocBench v1.5 selon l'article de PaddleOCR-VL-1.5 — [arXiv 2601.21957](https://arxiv.org/pdf/2601.21957) ; autre rapport : [FireRed-OCR, arXiv 2603.01840](https://arxiv.org/pdf/2603.01840)
- IDP Leaderboard : GLM-OCR 64,2 global / 54,9 IDP ; Qwen3.5-9B 76,7 / 76,2 ; Qwen3.5-4B 72,5 / 74,5 ; Qwen3.5-2B 62,6 / 67,1 ; Qwen3.5-0.8B 57,8 / 61,2 ; Gemma-4-E4B-it 53,9 / 55,0 ; Gemma-4-E2B-it 41,9 / 44,1 ; Pixtral-12B 46,5 / 59,0 — [IDP Leaderboard](https://www.idp-leaderboard.org/)
- Mistral OCR 4 déployable dans un seul conteneur Docker sur sa propre infrastructure (selon Eden AI) — [Eden AI](https://www.edenai.co/post/mistral-ocr-4-vs-top-document-parsing-apis-features-benchmarks-and-integration-guide) (source secondaire, conditions de licence non lues)
- Navigateur : TeleOCR-ONNX, conversion non officielle (1,4 B, Apache 2.0) pour transformers.js sur WebGPU, testée sous Chrome 154, q4f16 conseillé — [Hugging Face, TeleOCR-ONNX](https://huggingface.co/stefanj0/TeleOCR-ONNX)
- GLM-OCR ONNX q4f16 ≈ 635 Mo (contre 5 Go et plus pour le dépôt complet), chargé avec `device: 'webgpu'` — [Hugging Face, GLM-OCR-ONNX-q4f16](https://huggingface.co/wolfofbackstreet/GLM-OCR-ONNX-q4f16)
- Chaîne reçu hors ligne : détection et reconnaissance de texte dans le navigateur (LiteRT.js, backend WebGPU TensorFlow.js), reconstruction de la mise en page, puis structuration par un Gemma local via LiteRT-LM — [LogRocket](https://blog.logrocket.com/building-browser-based-receipt-scanner-litert-js/)
- Modèle mis en cache après un premier téléchargement puis hors ligne ; bogue connu de sortie du décodeur q8 sous WebGPU (issue #1317) — [forum Hugging Face, PaneTrans](https://discuss.huggingface.co/t/panetrans-drag-select-region-translation-ocr-on-video-canvas-built-on-transformers-js-local-by-default/176929)
- Liste communautaire de modèles OCR web — [xlocllm wiki](https://github.com/mgg789/xlocllm/wiki/Models-Web-ocr)

### Inferences
- Un modèle ouvert de rendu (PaddleOCR-VL, MinerU) n'est utile qu'en premier étage « image → Markdown/tableau », suivi d'un LLM qui structure ; seul, il ne remplace pas Gemini sur les lignes.
- Les petits modèles qui tiennent sur un téléphone (Gemma-4-E2B/E4B, Qwen3.5 ≤ 2 B) sont 25 à 40 points sous Gemini-3-Flash en IDP : un premier passage hors ligne peut proposer fournisseur, date et total à confirmer, pas des lignes fiables.
- 0,6 à 1,4 Go de poids à télécharger dans une PWA est lourd pour un usage de quelques dizaines de factures par mois.
- Auto-héberger un GPU pour ce volume coûte bien plus que les API (non chiffré ici).

### Gaps
- Docling, Marker/Surya, Nanonets-OCR (ouvert), GOT-OCR : non consultés à la source.
- Scores KIE ou factures des modèles ouverts : très peu publiés ; aucun sur factures françaises ou allemandes.
- Vitesse réelle dans le navigateur sur téléphone (WebGPU mobile) : aucune mesure trouvée.

## 4. Montages hybrides signalés comme efficaces

### Takeaway
Trois montages sont documentés : OCR puis LLM structurant (c'est l'architecture même de Mistral Document AI), données
déterministes prioritaires (QR suisse) avant l'IA, et OCR local plus petit LLM local pour le hors ligne. Aucune mesure
publiée d'un ensemble de deux vendeurs votant indépendamment n'a été trouvée.

### Cited Findings
- Mistral `document_annotation` = OCR en Markdown + premières images détectées, puis LLM vision guidé par un schéma — [Mistral docs](https://docs.mistral.ai/capabilities/document_ai/annotations/)
- QR suisse + ZUGFeRD + OCR/ML fusionnés, le QR prime pour les champs de paiement — [DocBits](https://docs.docbits.com/administration-and-setup/settings/global-settings/document-types/edi/zugferd-and-swiss-qr-merge)
- OCR navigateur + reconstruction de mise en page + Gemma local pour structurer — [LogRocket](https://blog.logrocket.com/building-browser-based-receipt-scanner-litert-js/)
- Couche d'extraction définie par prompt pour factures suisses multilingues — [invoicedataextraction, factures suisses](https://invoicedataextraction.com/blog/multilingual-swiss-invoice-extraction-international-finance-teams) (non lue en entier)
- Écarts entre vendeurs sur 20 factures : Gemini 3 Pro 94,75 %, Azure 90,52 %, AWS 83,05 % — [Businessware](https://www.businesswaretech.com/blog/best-ai-models-for-invoice-processing-in-2026-gemini-aws-chatgpt) (base d'un vote, mais pas un test d'ensemble)

### Inferences
- Pour L'Affinée, le montage le plus prometteur : Gemini Flash-Lite seul en lecture principale, **Azure prebuilt-invoice en parallèle** (autre vendeur, autre modèle, Zurich) comme vote indépendant, et l'arbitre Gemini Flash seulement si les deux divergent sur total, lignes ou TVA. Les erreurs de deux vendeurs différents sont moins corrélées que celles de deux appels Gemini.
- Le QR-facture, décodé localement quand il existe, fixe montant et créancier : on peut contrôler la somme des lignes contre lui avant tout arbitrage.
- La latence actuelle (10–17 s) vient sans doute surtout de la paire + arbitrage en série ; lancer les deux lectures en parallèle et n'arbitrer que sur désaccord réduit le temps sans changer de fournisseur (à mesurer).

### Gaps
- Aucune mesure publiée d'un ensemble de deux vendeurs (accord, gain de précision, coût) ; aucune étude « en-tête par parseur spécialisé + lignes par VLM ».

## 5. Contraintes suisses et européennes (nLPD, RGPD) par fournisseur ; intégration depuis une Cloud Function Node/TypeScript

### Takeaway
Seul Azure offre clairement un traitement en Suisse (Switzerland North, Zurich). Mistral propose des endpoints UE et
n'entraîne pas sur les données d'API, mais la non-conservation (ZDR) est sur demande. AWS AnalyzeExpense est visible à
Francfort et Paris, pas à Zurich. Côté code, Azure (SDK JS) et Mistral (schéma Zod) sont les plus simples depuis Node.

### Cited Findings
- Azure Switzerland North : Document Intelligence listé et suivi dans cette région ; données au repos en Suisse — [statusfield](https://statusfield.com/services/microsoft-azure-europe/azure-ai-document-intelligence/azure-ai-document-intelligence-switzerland-north) ; [azurespeed](https://www.azurespeed.com/Information/AzureRegions/SwitzerlandNorth) (sources secondaires ; page officielle de disponibilité par région non lue)
- Azure : la région facturée peut différer de celle de la ressource (question utilisateur) — [Microsoft Q&A](https://learn.microsoft.com/en-us/answers/questions/1688509/document-intelligence-region-in-billing-differs-fr)
- Mistral : endpoints régionaux UE, données d'API non utilisées pour l'entraînement, ZDR « available on request » ; contrôles régionaux en offre entreprise — [Mistral, inference](https://mistral.ai/cloud/inference/). Un revendeur dit ZDR par défaut, contredit par sa propre page OCR 4.1 (rétention 30 jours, surveillance d'abus) — [Opper, Mistral](https://opper.ai/provider/mistral) ; [Opper, OCR 4.1](https://opper.ai/mistral/mistral-ocr-4-1) ; conditions à fixer dans le DPA — [Meetily](https://meetily.ai/llm-privacy/mistral)
- AWS AnalyzeExpense : lignes de facturation à Francfort (EUC1) et Paris (EUW3), rien à Zurich — [Vantage](https://cur.vantage.sh/aws/amazontextract/)
- Fournisseurs QR suisses (PDF4me, Parashift, DocBits) : hébergement non indiqué — [PDF4me](https://developer.pdf4me.com/?p=8010) ; [Parashift](https://parashift.io/?p=2625)
- Intégration : Azure v4.0 a un SDK JavaScript officiel — [Microsoft Learn](https://learn.microsoft.com/en-us/azure/ai-services/document-intelligence/prebuilt/invoice) ; Mistral accepte un format Zod ou JSON Schema — [Mistral docs](https://docs.mistral.ai/capabilities/document_ai/annotations/)

### Inferences
- Depuis une Cloud Function Firebase en Europe, Azure Switzerland North est l'option la plus défendable pour des factures fournisseurs (données de tiers : noms, adresses, IBAN) au regard de la nLPD ; Mistral UE ensuite, avec DPA et ZDR demandés.
- Effort d'intégration estimé : Azure ≈ une fonction (clé et endpoint en secret, appel d'analyse puis lecture du résultat, correspondance du schéma `Items` vers le type de l'app) ; Mistral ≈ un appel avec le schéma Zod existant ; Google DocAI demande de créer un processeur ; Textract demande un compte AWS et IAM. (Estimation, non mesurée.)
- Un second fournisseur ajoute un sous-traitant à déclarer et une clé de plus à garder ; pour l'adopter, Firebase/Google reste de toute façon dans la chaîne.

### Gaps
- Adéquation UE ↔ nLPD et obligations exactes pour transférer des factures fournisseurs vers l'UE ou les États-Unis : non recherchées ici (voir un autre chercheur ou le PFPDT).
- Rétention par défaut d'Azure Document Intelligence (durée de conservation des résultats d'analyse) et options de non-conservation : non trouvées.
- Région UE de Google Document AI et lieu de traitement réel de Gemini via l'API utilisée par l'app : non sourcés ici.
- Mindee (France), Klippa (Pays-Bas), Rossum (Tchéquie) : lieux de traitement non vérifiés à la source.
