# Évaluer et régler la lecture de factures avec très peu de documents réels, et trouver plus de données de test (état au 01.11.2026)

Contexte du banc (donné par le pilote, pas une source externe) : 7 factures réelles suisses (photos de
téléphone et captures, FR/DE, CHF), 3 lectures par variante, 243 champs d'en-tête et 207 champs de ligne
au total (soit 81 et 69 par passe, environ 11,6 et 9,9 par document). Deux variantes différaient sur
5/243 champs d'en-tête (2,1 %) et 16/207 champs de ligne (7,7 %).

## 1. Taille d'échantillon et statistiques : 7 documents × 3 lectures, est-ce significatif ?

### Takeaway
Non. L'unité statistique est le document, pas le champ ni la lecture. Les 3 lectures réduisent seulement
le bruit d'une lecture à l'autre ; elles n'ajoutent pas de documents. Les champs d'un même document sont
corrélés : l'effectif utile tombe à environ la moitié des champs. Même si les 5 champs d'en-tête
discordants allaient tous dans le même sens, un McNemar exact ne conclurait pas à 5 %. Pour voir un écart
d'environ 5 points de champ, il faut de l'ordre de 40 à 50 documents ; pour 2 points, de l'ordre de 100 à
130 (calcul en Inferences, hypothèses dites).

### Cited Findings
- Miller (Anthropic, arXiv 2411.00640, nov. 2024) recommande cinq gestes : erreur standard par le théorème central limite ; erreurs standard groupées quand les questions forment des grappes ; réduction de variance par rééchantillonnage des réponses ; inférence sur les différences appariées question par question ; analyse de puissance avant de lancer une évaluation — [arXiv 2411.00640](https://arxiv.org/html/2411.00640v1)
- Erreur standard groupée (éq. 4) : elle égale l'erreur naïve si les scores d'une grappe ne sont pas corrélés, et compte chaque grappe comme une seule observation s'ils le sont parfaitement. Sur des bancs réels, l'erreur groupée vaut jusqu'à 3,05 fois l'erreur naïve (DROP) ; 1,88 sur MGSM ; 1,10 sur RACE-H — [arXiv 2411.00640](https://arxiv.org/html/2411.00640v1)
- Comparaison appariée (éq. 7) : SE = √(Var(s_A−s_B)/n), soit √(SE_A² + SE_B² − 2·SE_A·SE_B·Corr). L'appariement réduit la variance quand les deux variantes trouvent difficiles les mêmes questions. Dans l'exemple (corrélation 0,5), la variance passe de 1/6 à 1/9 — [arXiv 2411.00640](https://arxiv.org/html/2411.00640v1)
- Taille d'échantillon (éq. 9) : n = (z_{α/2}+z_β)² · (ω² + σ_A²/K_A + σ_B²/K_B) / δ², avec ω² la variance de la différence appariée, K le nombre de lectures par question et δ l'effet minimal détectable. Exemple : δ = 3 points, ω² = 1/9, α = 0,05, puissance 80 % donne n ≈ 969, d'où « au moins 1 000 questions » pour une nouvelle évaluation — [arXiv 2411.00640](https://arxiv.org/html/2411.00640v1)
- Lectures répétées : Var(s_i) = σ_i²/K. Les gains décroissent : K = 2 réduit la variance de 1/3, K = 4 de 1/2, K = 6 de 5/9, avec 2/3 pour plafond (scores binaires, difficulté uniforme). Une erreur standard calculée sur les K·N réponses comme si elles étaient indépendantes est « inconsistante » : l'inférence repose sur le nombre de questions indépendantes. Dans un autre exemple (n = 198), passer K de 1 à 10 fait baisser l'effet détectable de 13,2 % à 7,5 %. Baisser la température pour réduire la variance est déconseillé (biais) — [arXiv 2411.00640](https://arxiv.org/html/2411.00640v1)
- Le paquet PyPI `errorbars` dit suivre ce papier : erreur standard et valeur p appariées, robustes aux grappes (estimateur sandwich CR1, comme `cov_type="cluster"` de statsmodels). Outil tiers, non vérifié contre les formules du papier — [PyPI errorbars](https://pypi.org/project/errorbars/)
- Extraction de documents : sur 800 tickets CORD (13 859 champs, 49,0 % corrects), les champs d'un même document ne sont pas indépendants, avec un effet de grappe (design effect) de 1,84 à 2,45. Préprint d'un seul auteur, juillet 2026 — [arXiv 2608.14639](https://arxiv.org/abs/2608.14639)
- Effet de grappe de Kish : Deff = 1 + (m−1)·ρ, avec m la taille moyenne de grappe et ρ la corrélation intraclasse ; effectif utile n_eff = n / Deff — [Wikipedia, Design effect](https://en.wikipedia.org/wiki/Design_effect)
- McNemar : seules les paires discordantes b et c comptent, χ² = (b−c)²/(b+c). Si b + c < 25, l'usage est le test binomial exact (n = b + c, p = 0,5). La version mid-p a une puissance proche du test asymptotique sans dépasser le seuil nominal. Une extension existe pour des données en grappes (paires non indépendantes à l'intérieur d'une grappe) — [Wikipedia, McNemar's test](https://en.wikipedia.org/wiki/McNemar%27s_test)
- Card et al. (EMNLP 2020) : les expériences sous-puissantes sont courantes en TAL. Sur plusieurs tâches GLUE, les petits jeux de test laissent la plupart des comparaisons sans puissance suffisante. En traduction, 2 000 phrases donnent environ 75 % de puissance pour 1 point BLEU. Méthode proposée : puissance par simulation ; l'analyse de puissance a posteriori, calculée sur le résultat observé, est déconseillée. Carnets publiés (dallascard/NLP-power-analysis) — [Card et al. 2020](https://web.stanford.edu/~jurafsky/pubs/2020.emnlp-main.745.pdf)
- Source secondaire : un gain de 4 points sur 100 questions reste dans le bruit ; donner aussi les résultats par strate, car un gain global peut cacher trois strates en recul sur quatre — [DEV Community](https://dev.to/gabrielanhaia/eval-set-sizing-the-statistical-power-math-behind-llm-ab-tests-4gpc)

### Inferences
- **McNemar exact sur le banc actuel**, en supposant à tort l'indépendance des champs. En-tête : 5 discordants au mieux répartis 5–0 donnent p bilatéral = 2 × 0,5⁵ = 0,0625, au-dessus de 0,05 (mid-p : 0,031). Lignes : 16 discordants demandent au moins une répartition 13–3 (p ≈ 0,021) ; 12–4 donne p ≈ 0,077. Ces valeurs sont optimistes. Les 3 lectures d'un même champ comptent pour une seule observation, et les champs se groupent par document (Miller ; arXiv 2608.14639).
- **Effectif utile.** Corrélation intraclasse déduite du préprint CORD : m ≈ 13 859/800 ≈ 17,3 champs par ticket et Deff 1,84 à 2,45, d'où ρ ≈ 0,05 à 0,09. Sur le banc (m ≈ 11,6 champs d'en-tête par document), Deff vaut environ 1,5 à 1,9, soit 42 à 52 champs d'en-tête indépendants par passe, pas 243. Extrapolation entre jeux et modèles ; la corrélation des différences entre variantes reste inconnue. Pour les lignes, ρ est probablement plus haut : une ligne mal alignée décale tous ses champs.
- **Effet détectable du banc actuel** (Miller, éq. 10, approximation normale, puissance 80 %). En-tête, avec ψ (part de discordance) ≈ 0,02 et n_eff ≈ 47 : δ_min ≈ 2,8 × √(0,02/47) ≈ 5,8 points. C'est plus que les 2,1 % de discordance observés : aucun écart n'est détectable, même tout dans le même sens. Lignes, avec ψ ≈ 0,077 et n_eff ≈ 40 (hypothèse) : δ_min ≈ 12 points, contre 7,7 % observés. Avec 7 documents en test t apparié par document (6 degrés de liberté, t = 2,447), l'effet détectable vaut environ 1,3 écart-type de la différence par document.
- **Combien de documents** (Miller, éq. 9 ; K grand ; ω² ≈ ψ − δ² pour des champs binaires appariés ; 12 champs d'en-tête par document ; Deff 1,55 à 2) :
  - δ = 10 points (ψ ≈ 0,15) : 110 champs utiles, environ 170 à 220 champs, **14 à 18 documents**.
  - δ = 5 points (ψ ≈ 0,10) : 306 champs utiles, environ 475 à 610 champs, **40 à 51 documents**.
  - δ = 2 points (ψ ≈ 0,04) : 776 champs utiles, environ 1 200 à 1 550 champs, **100 à 130 documents**.
- **Méthode recommandée.** Bootstrap apparié **sur les documents** : rééchantillonner des documents entiers, avec leurs K lectures et tous leurs champs ; ou bien erreur standard groupée par document (`errorbars`, statsmodels). Garder McNemar exact ou mid-p pour un seul champ critique (total, TVA), en comptant une observation par document (majorité ou moyenne des K lectures). À K = 3, il reste peu à gagner ; mieux vaut ajouter des documents que des lectures.

### Gaps
- Je n'ai trouvé aucune règle publiée propre à l'extraction de factures du type « N documents pour détecter δ ». Les ordres de grandeur ci-dessus sont des calculs faits ici à partir de formules générales et d'une corrélation intraclasse empruntée à CORD.
- La corrélation intraclasse des différences appariées (et non des scores) n'a été trouvée dans aucune source.

## 2. Méthode d'évaluation : correspondance des champs, lignes, faux verts, réglage sans surapprentissage

### Takeaway
Normaliser avant de comparer (montants, dates, TVA, IDE), puis compter juste ou faux par champ. Apparier
les lignes par un appariement maximal (hongrois), comme DocILE et ANLS*, et ajouter un score de texte
flou (ANLS) pour les libellés. Pour les tableaux complets, GriTS. Le faux vert (valeur fausse montrée sûre)
se mesure à part : la confiance propre du modèle ne suffit pas. Le désaccord entre deux lectures de
cadrages différents est le signal le mieux étayé en 2026. Pour régler sans surapprendre, découper par
document, et même par fournisseur ; ne jamais réajuster seuil ou prompt sur la moitié qui sert à juger.

### Cited Findings
- DocILE : deux tâches, KILE (champs clés) et LIR (lignes), jugées en AP, F1, précision et rappel micro-moyennés. Un champ prédit correspond à la vérité s'il a le même type et se recouvre en position. Les lignes prédites et réelles sont appariées par un **appariement maximal** qui maximise le nombre de champs appariés. L'exactitude du texte est une métrique secondaire (`--evaluate-also-text`) — [GitHub rossumai/docile](https://github.com/rossumai/docile) ; [arXiv 2302.05658](https://arxiv.org/pdf/2302.05658)
- ANLS* (arXiv 2402.03848, 2024) étend ANLS sans en changer les scores existants. Il couvre listes, dictionnaires et leurs combinaisons, sorties typiques d'un LLM génératif. Pour les listes, il aligne vérité et prédiction par **appariement hongrois** (extension de Tito et al.), sans tenir compte de l'ordre. Paquet `anls_star`. Les détails sur les dictionnaires (clés manquantes ou inventées pénalisées) viennent en partie du README et de résumés tiers — [arXiv 2402.03848](https://arxiv.org/html/2402.03848v10) ; [PyPI anls-star](https://pypi.org/project/anls-star/0.0.4)
- GriTS (Microsoft, 2022, révisé en 2023) juge un tableau prédit comme une matrice de cellules. Il unifie topologie, position et contenu des cellules (2D most-similar substructures, heuristique polynomiale à bornes haute et basse). Code dans `microsoft/table-transformer` — [arXiv 2203.12555](https://arxiv.org/abs/2203.12555v3)
- Faux verts. ExtractConf (préprint, juin 2026) : les log-probabilités, la confiance déclarée et l'auto-cohérence par échantillonnage « s'effondrent vers un comportement tout-positif aux seuils pratiques ». Deux appels de cadrages différents (« Hunter » guidé par les champs, « Mapper » guidé par le document), leur désaccord fusionné avec OCR, qualité d'image et mise en page, donnent une AUC ROC de 0,928 sur DocILE (55 champs, 26 % d'échecs) et 0,858 sur CORD sans réentraînement. Risque sélectif réduit de 70 % face à la moyenne des log-probabilités ; 99,1 % d'exactitude à 80 % de couverture — [arXiv 2606.24420](https://arxiv.org/abs/2606.24420)
- Contrôle du risque par champ (préprint, juillet 2026) : accepter un champ seulement si l'erreur parmi les acceptés reste ≤ α. La procédure naturelle casse en silence cette garantie, pour trois raisons : grappes par document (Deff 1,84 à 2,45) ; fuite quand le score est réajusté sur les mêmes données, qui viole α = 0,10 dans 95 % des découpages ; ex-aequo qui écrasent la grille de seuils. Un découpage ajustement/validation rétablit la garantie **en moyenne seulement** : risque réalisé au-dessus de α dans 47,5 % des redécoupages. Le seul niveau « par document » est « presque vide aujourd'hui » (couverture 0,060). Audit humain à l'aveugle, trois annotateurs : 1,3 % de risque réel pour un budget de 10 % (κ de Fleiss 0,83). Le gain du conditionnement, vu sur la capture Sonnet, ne se reproduit pas avec Haiku ni Qwen — [arXiv 2608.14639](https://arxiv.org/abs/2608.14639)
- Seuil choisi sur un jeu tenu à part, avec garantie sans hypothèse de distribution (Learn-Then-Test), pour l'acceptation automatique des documents financiers (préprint 2026, vu seulement par la recherche) — [arXiv 2609.20110](https://arxiv.org/pdf/2609.20110)
- Non vérifié (résumé de recherche seulement) : erreur de calibration (ECE) de 0,15 à 0,18 pour la confiance brute de l'OCR et du modèle sur SROIE, CORD et FUNSD ; une fusion multi-signaux ferait passer l'automatisation à 99 % de précision d'environ 57 % à 70 % sur SROIE — [Research Square rs-10721490](https://www.researchsquare.com/article/rs-10721490)
- Les petites erreurs par champ se composent sur le document : une facture de 20 champs est entièrement juste bien moins souvent qu'une de 8 (source éditeur) — [Cradl](https://www.cradl.ai/posts/invoice-data-extraction-with-ai)
- Réglage sans surapprentissage (Husain, résumé par Latent Space, source secondaire) : les exemples du prompt dans un jeu d'entraînement ; les révisions du prompt sur un jeu de développement ; un jeu de test caché pour l'estimation finale, prompt figé. Faire l'analyse d'erreurs avant de construire des évaluateurs — [Latent Space, Hamel Husain](https://latent.space/wiki/hamel-husain/) ; [eval-audit](https://skills.sh/hamelsmu/evals-skills/eval-audit)
- FATURA propose deux stratégies : tester sur de nouvelles images des mêmes gabarits, ou tenir à part des gabarits jamais vus. DocILE inclut au test des mises en page vues, peu vues et jamais vues — [Zenodo FATURA](https://zenodo.org/records/10371464) ; [arXiv 2302.05658](https://arxiv.org/abs/2302.05658)

### Inferences
- **Grille de comparaison par champ.** Montants : à 0,01 CHF près, après normalisation (apostrophe suisse, virgule et point). Dates : forme ISO. TVA : taux et montant séparés. Fournisseur : correspondance floue (ANLS ≥ seuil) ou identifiant (IDE CHE-xxx). La normalisation fait partie de la règle ; elle se fige avant la comparaison des variantes.
- **Lignes.** Appariement hongrois sur un coût combinant libellé (ANLS), quantité et montant. Puis scores séparés : nombre de lignes juste, champs justes par ligne appariée, lignes manquantes, lignes inventées. Un contrôle arithmétique (Σ lignes = sous-total, sous-total + TVA = total) donne une mesure sans vérité terrain.
- **Faux vert.** Compter les champs faux montrés sans alerte, divisés par les champs montrés sans alerte : c'est le risque sélectif d'arXiv 2608.14639. Signal candidat bon marché pour l'app : désaccord entre deux lectures de cadrages différents (ExtractConf), plutôt que trois lectures du même prompt.
- **« Régler sur une moitié, juger sur l'autre ».** Avec 7 documents, la moitié de jugement compte 3 ou 4 documents : sans valeur statistique (partie 1). Mieux : les 7 documents réels deviennent le jeu de **développement et de régression** ; le jugement se fait sur un jeu tenu à part plus grand, tiré des dépenses historiques (partie 5). Découper par fournisseur, ou par gabarit, pour que la même mise en page ne soit pas des deux côtés (logique FATURA et DocILE). Avec peu de documents, une validation croisée par groupe (leave-one-supplier-out) ne sert qu'à orienter, jamais à conclure.
- **Suite de régression.** Chaque erreur corrigée devient un cas figé (image, vérité, champ visé) ; on rejoue tout à chaque changement de prompt ou de niveau de réflexion, avec Gemini simulé hors des tests dédiés (règle du projet).

### Gaps
- Je n'ai trouvé aucune étude publiée sur le surapprentissage d'un **prompt** réglé sur quelques documents d'extraction. Les conseils de découpage viennent de pratiques générales d'évaluation des LLM, via des sources secondaires.
- Les AUC d'ExtractConf et les résultats de 2608.14639 sont des préprints de 2026 à un seul auteur, non reproduits.

## 3. Jeux publics de factures et de tickets : licences, langues, pertinence

### Takeaway
Aucun jeu public trouvé ne ressemble aux factures suisses photographiées au téléphone en CHF, en
français ou en allemand, avec des lignes. DocILE (factures en anglais, en majorité) est le plus proche
pour les champs et les lignes. CORD et SROIE sont des tickets asiatiques. XFUND a du français et de
l'allemand, mais ce sont des formulaires, et sa licence est non commerciale. La meilleure source de vérité
exacte en allemand et en français vient des corpus de factures électroniques ZUGFeRD/Factur-X (PDF avec XML
embarqué), et, pour la Suisse, du QR-facture.

### Cited Findings
- **DocILE** (ICDAR 2023) : 6 700 documents d'affaires annotés, 100 000 synthétiques, près d'un million non annotés ; 55 classes de champs ; nombreuses mises en page, dont des cas zéro-shot et peu vus au test — [arXiv 2302.05658](https://arxiv.org/abs/2302.05658). Téléchargement par jeton secret obtenu sur docile.rossum.ai ; code sous licence MIT ; aucune licence de **données** dans le README — [GitHub rossumai/docile](https://github.com/rossumai/docile)
- **SROIE** (ICDAR 2019) : 1 000 images de tickets scannés entiers, avec annotations et procédure d'évaluation — [arXiv 2103.10213](https://arxiv.org/abs/2103.10213). Un miroir Hugging Face indique CC-BY-4.0 ; conditions officielles non trouvées — [HF jsdnrs/ICDAR2019-SROIE](https://huggingface.co/datasets/jsdnrs/ICDAR2019-SROIE/discussions)
- **CORD** : licence CC BY 4.0 (dépôt officiel et carte HF). Des classes du papier ont été retirées pour des raisons juridiques indonésiennes — [GitHub clovaai/cord](https://github.com/clovaai/cord) ; [HF wkrl/cord](https://huggingface.co/datasets/wkrl/cord/blob/main/README.md?code=true)
- **FATURA** (2023) : factures synthétiques, 50 gabarits × 200 images, fond blanc et fond coloré, annotations JSON. Licence CC BY-NC-SA 4.0 d'après un miroir des métadonnées arXiv, non confirmée sur Zenodo — [Zenodo 10371464](https://zenodo.org/records/10371464) ; [fugumt (miroir)](https://fugumt.com/fugumt/paper_check/2311.11856v1_enmode) ; [arXiv 2311.11856](https://arxiv.org/abs/2311.11856v1)
- **XFUND** (ACL Findings 2022) : sept langues, dont français et allemand, paires clé-valeur annotées à la main. Licence CC BY-NC-SA 4.0 d'après le miroir du dépôt original ; d'autres miroirs indiquent MIT ou « other » — [HF FrancophonIA/XFUND](https://huggingface.co/datasets/FrancophonIA/XFUND/blob/855e5fa05e6ede94c4369a2d5aca848857a775bc/README.md) ; [ACL 2022.findings-acl.253](https://aclanthology.org/2022.findings-acl.253) ; [HF cooleel/xfund_de](https://huggingface.co/datasets/cooleel/xfund_de/blob/main/README.md)
- **RVL-CDIP** : 400 000 images en niveaux de gris, 16 classes dont « invoice », étiquette de classe seulement. Sous-ensemble d'IIT-CDIP (archives du tabac, UCSF) ; licence « other », renvoyant aux conditions de l'UCSF Industry Documents Library — [HF aharley/rvl_cdip](https://huggingface.co/datasets/aharley/rvl_cdip) ; [HF chainyo/rvl-cdip-invoice](https://huggingface.co/datasets/chainyo/rvl-cdip-invoice) ; [HF chainyo/rvl-cdip](https://huggingface.co/datasets/chainyo/rvl-cdip/blob/main/README.md)
- **Allemand** : `nimalu/kassenzettel-synth`, tickets de caisse synthétiques en allemand (< 1 000), licence MIT, étiquetés pour la structure de tableau et l'image vers texte — [HF nimalu/kassenzettel-synth](https://huggingface.co/datasets/nimalu/kassenzettel-synth/tree/main)
- **Autres tickets** : CORU/ReceiptSense, plus de 20 000 tickets arabe/anglais, fichiers sous MIT — [arXiv 2406.04493](https://arxiv.org/pdf/2406.04493) ; [HF Timokerr/CORU](https://huggingface.co/datasets/Timokerr/CORU/blob/main/README.md). AMuRD, arabe/anglais, recherche non commerciale seulement — [HF AMuRD (miroir)](https://huggingface-gw-kz.just-ai.com/datasets/abdoelsayed/AMuRD)
- **ZUGFeRD / Factur-X** : `ZUGFeRD/corpus` rassemble des factures électroniques réelles, d'exemple et de test (en général ZUGFeRD), certaines avec des erreurs volontaires. L'XML embarqué s'extrait avec Mustang (`--action extract`). L'« Infopaket » ZUGFeRD 2.2 contient des PDF Factur-X des profils EN16931 et XRechnung — [README du corpus (miroir)](https://code.foss.global/fin.cx/xinvoice/raw/commit/024b7feb09d728286147c0de4c7529a5c78b66e7/test/assets/corpus/README.md) ; [GitHub ZUGFeRD/b2b](https://github.com/ZUGFeRD/b2b)
- **QR-facture suisse** : les scripts d'introduction de SIX (émetteurs, destinataires, instituts financiers) contiennent des listes de contrôle, des cas de test et des exemples de section paiement ; SIX ne propose pas de contrôle qualité. Spécification IG QR-bill v2.2. D'après une bibliothèque tierce, la v2.4 est en vigueur et la v2.3 reste valable jusqu'en novembre 2027 — [SIX, script émetteurs](https://www.six-group.com/dam/download/banking-services/standardization/qr-bill/introduction-script-invoice-issuers-recipients-en.pdf) ; [SIX FAQ](https://www.six-group.com/en/products-services/banking-services/payment-standardization/downloads-faq/faq.html) ; [SIX IG v2.2](https://www.six-group.com/dam/download/banking-services/standardization/qr-bill/ig-qr-bill-v2.2-en.pdf) ; [hex swiss_qr_bill](https://readme.hex.pm/swiss_qr_bill/0.2.0)
- Non vérifié (source secondaire) : un banc d'OCR dit tester 500 factures et tickets réels, de 12 secteurs et 8 langues dont l'allemand, en scan, photo et PDF — [Codesota](https://codesota.com/ocr/invoice-receipt-benchmark)

### Inferences
- **Pertinence pour L'Affinée.** SROIE et CORD (tickets d'Asie, autres monnaies et mises en page) servent seulement à tester la robustesse générale ou à rejouer une métrique ; pas à régler un prompt suisse. DocILE sert à valider le code de métrique des lignes (appariement), pas le français ni l'allemand. FATURA et XFUND sont non commerciaux selon les miroirs : utilisables pour un test interne seulement si la licence le permet, à vérifier à la source. RVL-CDIP n'a pas de vérité par champ.
- **Factures électroniques comme vérité exacte.** Les PDF ZUGFeRD/Factur-X allemands et français portent leur vérité dans l'XML (fournisseur, date, lignes, TVA, total). Imprimés puis photographiés au téléphone, ils donnent de vraies photos avec une vérité parfaite. Limite : monnaie EUR et mises en page de logiciels, pas des fournisseurs suisses.
- **QR-facture comme vérité gratuite sur les vraies factures suisses.** La partie paiement contient un code QR lisible par machine (créancier, IBAN, montant, monnaie, référence, selon la spécification SIX). Décodé sur les photos réelles, il donne une vérité indépendante du LLM pour le montant, la monnaie et le créancier. Cela couvre aussi le cas « monnaie étrangère » (CHF ou EUR).

### Gaps
- Aucun jeu public de factures suisses (CHF, FR/DE, photos de téléphone) n'a été trouvé.
- Langues et sources de DocILE, licence de ses données : non confirmées (ni le README ni l'abstract ne les donnent).
- Kleister (NDA, Charity) et WildReceipt : pages et licences non trouvées par mes recherches. Kleister, si mes souvenirs sont justes, porte sur des contrats et des rapports, pas des factures (non vérifié).
- Licence officielle de SROIE et de FATURA (Zenodo) non lue à la source.

## 4. Factures synthétiques : rendu à vérité connue, augmentation « photo », valeur prédictive

### Takeaway
Rendre des factures depuis des gabarits HTML/PDF à vérité connue est facile et utile pour **couvrir des
cas** (deux taux de TVA, rabais, EUR, multipage) et tester la robustesse. Les sources concordent : les
scores sur données synthétiques ne prédisent pas fidèlement le réel. Ils restent un complément du petit jeu
réel, jamais un juge. Augraphy imite le scanner et la photocopie ; la perspective et le flou du téléphone
relèvent de bibliothèques générales (Albumentations, imgaug).

### Cited Findings
- Augraphy (ICDAR 2023, arXiv 2208.14558) : bibliothèque Python open source qui ajoute aux images de documents le bruit réaliste du scan, de la photocopie et des procédés de bureau. 26 augmentations en trois phases, plus une « paper factory » pour les fonds de papier. Deux usages : données d'entraînement variées, et **données de test difficiles pour juger la robustesse**. Les bibliothèques générales (Albumentations, imgaug, Augmentor) font rotations, déformations et couleurs — [arXiv 2208.14558](https://arxiv.org/pdf/2208.14558) ; [GitHub sparkfish/augraphy-paper](https://github.com/sparkfish/augraphy-paper)
- Synthèse qui garde la mise en page (arXiv 2508.03754, 2025) : on prend la mise en page d'une facture réelle, on remplace le contenu par du synthétique, puis on refait le rendu. Motif : les augmentations indifférentes au contenu ne changent pas l'information sémantique du document — [arXiv 2508.03754](https://arxiv.org/html/2508.03754v1)
- FlexDoc (EMNLP 2025, Industry) modélise de façon probabiliste les motifs de mise en page, la structure visuelle et la variabilité du contenu, pour générer des variantes contrôlées en extraction d'information clé. Résultats chiffrés non lus (téléchargement échoué) — [ACL 2025.emnlp-industry.105](https://aclanthology.org/anthology-files/pdf/emnlp/2025.emnlp-industry.105.pdf)
- Témoignage de praticien : un modèle Gemma affiné sur factures synthétiques brillait sur la validation synthétique ; une seule facture réelle a cassé quatre hypothèses. Le modèle avait appris « la version synthétique » de la tâche. Conseil : un petit jeu réel de référence, dans l'évaluation dès le début — [DEV Community](https://dev.to/angu10/the-model-looked-great-on-validation-until-one-real-invoice-broke-four-assumptions-5g2l)
- Cartes de modèles Pix2Struct pour factures tchèques (autodéclarées) : données hybrides, mises en page réelles et contenu synthétique, pour réduire l'écart de domaine, puis réelles annotées en dernière étape — [HF TomasFAV/Pix2StructCzechInvoiceV0123](https://huggingface.co/TomasFAV/Pix2StructCzechInvoiceV0123/blob/main/README.md)
- Une carte de jeu synthétique avertit que ses factures « peuvent ne pas couvrir toute la diversité des formats réels » et conseille de valider sur des factures réelles avant déploiement — [HF Shubhal829/high-quality-invoice-images-for-ocr](https://huggingface.co/datasets/Shubhal829/high-quality-invoice-images-for-ocr)
- FATURA (50 gabarits × 200 images) et les 100 000 synthétiques de DocILE montrent l'usage établi : beaucoup d'images depuis peu de gabarits, avec un test sur gabarits jamais vus pour mesurer la généralisation — [Zenodo FATURA](https://zenodo.org/records/10371464) ; [arXiv 2302.05658](https://arxiv.org/abs/2302.05658)
- Outils de rendu à vérité structurée : bibliothèques Factur-X et ZUGFeRD (Python `drafthorse`, JS `@stackforge-eu/factur-x`) pour produire un PDF avec son XML ; bibliothèques de QR-facture suisse (`swissqrbill` npm, `swiss_qr_bill`) — [PyPI drafthorse](https://pypi.org/project/drafthorse/2.3.0) ; [JSR factur-x](https://jsr.io/@stackforge-eu/factur-x/1.4.0/README.md) ; [swissqrbill](https://classic.yarnpkg.com/en/package/swissqrbill) ; [hex swiss_qr_bill](https://readme.hex.pm/swiss_qr_bill/0.2.0)

### Inferences
- Pour un banc de **prompt** (pas d'entraînement), le synthétique sert surtout à des tests de cas ciblés à vérité exacte : deux taux de TVA suisses, rabais en ligne et en pied, EUR, trois pages, bon de livraison sans prix. Chaque cas vérifie un comportement, pas une moyenne.
- Pipeline plausible et léger : gabarit HTML (fournisseurs suisses fictifs, IDE CHE fictif, QR-facture valide) ; rendu PDF ; d'abord impression réelle et photo au téléphone d'une dizaine de pages (le plus fidèle), puis augmentation numérique (perspective, flou, éclairage, Augraphy pour le papier).
- Garde-fou : ne jamais choisir une variante sur un gain synthétique seul. Un gain synthétique non confirmé sur le jeu réel tenu à part ne compte pas.

### Gaps
- Je n'ai trouvé aucune mesure chiffrée de la corrélation entre scores synthétiques et réels pour une extraction **par LLM de vision avec prompt** (sans entraînement). Les preuves de l'écart viennent de modèles affinés et de témoignages.
- Résultats chiffrés de FlexDoc et d'arXiv 2508.03754 non lus.

## 5. Vérité terrain tirée des dépenses validées : fiabilité, biais, confidentialité, apprentissage actif

### Takeaway
Les dépenses validées par le brasseur, avec la photo dans Drive, sont la plus grande réserve de vérité
réelle disponible. Ce sont des **étiquettes faibles** : partielles (lignes parfois), probablement ancrées
sur la proposition du modèle, et penchées vers les cas faciles. Les utiliser comme grand jeu de jugement
tenu à part, champ par champ, seulement pour les champs fiables, avec des contrôles ponctuels. Les
documents où deux variantes ou deux cadrages divergent passent en premier en vérification humaine.

### Cited Findings
- Le désaccord entre le modèle de la tâche et un annotateur LLM sert d'indicateur d'étiquette peu fiable. Utiliser directement les étiquettes générées comme supervision peut dégrader les performances (préprint, janvier 2026) — [arXiv 2601.15773](https://arxiv.org/html/2601.15773v1)
- Le désaccord entre annotateurs, modélisé par plusieurs têtes, donne de meilleures estimations d'incertitude en apprentissage actif, avec 70 % du budget d'annotation économisé (EMNLP 2023) — [ACL 2023.emnlp-main.126](https://aclanthology.org/2023.emnlp-main.126)
- En extraction d'information, l'incertitude a deux parts : celle du format et celle du contenu, qui échouent séparément (Active Prompting for IE, 2025) — [arXiv 2508.10036](https://arxiv.org/html/2508.10036v1)
- Le désaccord entre deux appels de cadrages différents est le signal central d'ExtractConf pour repérer les extractions fausses — [arXiv 2606.24420](https://arxiv.org/abs/2606.24420)
- Dans une seule petite expérience de classification de texte, un LLM-oracle s'accordait à 96,1 % avec la vérité — [FutureSearch](https://futuresearch.ai/active-learning-llm-oracle/)
- Google Document AI (extraction par gabarit) : ajouter des documents au-delà du minimum de trois améliore rarement la qualité ; mieux vaut **étiqueter très exactement un petit jeu** — [Google Cloud, template-based](https://docs.cloud.google.com/document-ai/docs/ce-template-based)
- Un audit humain à l'aveugle (trois annotateurs, κ de Fleiss 0,83) a servi à vérifier le risque réel d'un ensemble accepté — [arXiv 2608.14639](https://arxiv.org/abs/2608.14639)

### Inferences
- **Fiabilité par champ** (hypothèses à vérifier sur le code de l'app). Le total et la date sont probablement les plus fiables, recoupés par le paiement ou le relevé bancaire. Le fournisseur est fiable mais normalisé par l'app (nom canonique, pas le texte imprimé) : comparer à l'entité, pas à la chaîne. TVA et lignes sont moins sûres : validées seulement « parfois », et elles peuvent avoir été corrigées à la main sans relire chaque ligne. Juger un champ seulement quand il a été explicitement saisi ou confirmé.
- **Biais.** (1) Ancrage : si l'app proposait la valeur lue, le brasseur a pu valider une valeur fausse mais plausible. Le jeu historique sous-estime alors les faux verts de l'ancien modèle et favorise les variantes qui lui ressemblent. (2) Survie : les factures illisibles ou abandonnées manquent, d'où un penchant vers les cas faciles. (3) Mélange de versions : les photos validées sous d'anciens prompts ne sont pas neutres. Correctif : tirer au hasard un sous-échantillon (par exemple 30 à 50 dépenses) vérifié à nouveau à l'aveugle sur l'image, pour estimer le taux d'erreur des étiquettes elles-mêmes.
- **Vérités indépendantes du LLM** : code QR suisse décodé (montant, monnaie, créancier) ; montant du paiement bancaire ; contrôles arithmétiques (Σ lignes, TVA = taux × base). Là où elles existent, elles valent mieux que la validation humaine ancrée.
- **Priorisation (apprentissage actif léger).** Lire les dépenses historiques avec les deux variantes ou deux cadrages ; soumettre d'abord à la vérification les documents où elles divergent entre elles ou avec l'étiquette. Ces cas portent toute l'information de comparaison : seules les paires discordantes comptent pour McNemar.
- **Confidentialité.** Les photos dans Drive sont des données réelles (fournisseurs, parfois des personnes nommées, IBAN). Règles du projet : pas d'écriture sur les données réelles pour tester, et appels Gemini réels seulement dans des tests dédiés et journalisés. Il faut donc une copie locale anonymisée ou un jeu figé hors production, et l'accord du brasseur avant d'envoyer ses photos à une API externe pour un banc.

### Gaps
- Je n'ai trouvé aucune étude publiée sur l'usage de saisies comptables validées par l'utilisateur comme vérité d'extraction, ni sur le biais d'ancrage dans ce cas précis. Les points ci-dessus sont des déductions.
- Règles suisses de protection des données (nLPD) pour l'envoi de photos de factures à un fournisseur d'IA : non recherchées ici.

## 6. Cible pratique : combien de documents réels collecter, et quelle diversité

### Takeaway
Cible raisonnable pour une petite équipe. (a) Un jeu réel de développement et de régression de **40 à
60 documents**, stratifiés, assez pour voir un écart d'environ 5 points de champ. (b) Un jeu de jugement
tenu à part de **100 à 150 documents**, tiré des dépenses historiques (champs fiables seulement), pour des
écarts d'environ 2 points sur le total, la date et le fournisseur. (c) Au moins une dizaine de documents
par cas difficile, pour voir une panne fréquente. Avant de régler, faire une analyse d'erreurs sur 50 à
100 lectures variées.

### Cited Findings
- Google Document AI (extracteur entraîné) : au moins 10 documents d'entraînement et 10 de test (une version de la page dit 3). Gabarit fixe : 3 + 3 suffisent. Métriques F1, précision et rappel par champ et par document — [Google Cloud, custom-based](https://docs.cloud.google.com/document-ai/docs/custom-based-extraction) ; [Google Cloud, template-based](https://docs.cloud.google.com/document-ai/docs/ce-template-based)
- Analyse d'erreurs initiale : 50 à 100 traces représentatives ; la diversité compte plus que le nombre (guide Langfuse tiré de la FAQ de Husain, source secondaire) — [Langfuse, 29.08.2025](https://langfuse.com/blog/2025-08-29-error-analysis-to-evaluate-llm-applications)
- Évaluations de LLM en général : au moins 1 000 questions pour voir 3 points (exemple de Miller) — [arXiv 2411.00640](https://arxiv.org/html/2411.00640v1)
- Donner les résultats par strate, pas seulement le global (source secondaire) — [DEV Community](https://dev.to/gabrielanhaia/eval-set-sizing-the-statistical-power-math-behind-llm-ab-tests-4gpc)
- Un benchmark d'OCR décrit un jeu réel mêlant scans, photos et PDF natifs, de plusieurs secteurs et langues (non vérifié) — [Codesota](https://codesota.com/ocr/invoice-receipt-benchmark)

### Inferences
- **Taille** : voir le tableau de la partie 1. 14 à 18 documents pour 10 points, 40 à 51 pour 5 points, 100 à 130 pour 2 points. Hypothèses : environ 12 champs d'en-tête par document, effet de grappe 1,5 à 2, puissance 80 %, α = 5 %.
- **Strates** (à cocher, chacune avec au moins une dizaine de documents dans le jeu de développement) : photo papier (dont pli, ombre, biais) ; capture d'écran ; PDF natif ; multipage ; deux taux de TVA (8,1 % et 2,6 %, à vérifier dans le code) ; rabais (ligne et pied) ; monnaie étrangère (EUR) ; bon de livraison face à facture ; ticket de caisse ; QR-facture présente ou absente ; français et allemand ; fournisseurs récurrents et occasionnels.
- **Pourquoi une dizaine par strate.** Une panne de fréquence p a une probabilité 1 − (1 − p)ⁿ d'apparaître au moins une fois sur n documents. Pour p = 20 % : 89 % avec n = 10, 96 % avec n = 14. Zéro échec sur n documents borne le taux réel vers 3/n au plus (à 95 %) : 10 documents sans échec disent seulement « ≤ 30 % ».
- **Coût.** 40 à 60 documents réels représentent quelques mois de factures d'une micro-brasserie, ou quelques heures de reprise dans Drive. Le jeu historique de 100 à 150 documents demande surtout la vérification d'un échantillon tiré au hasard, et l'accord du brasseur avant tout envoi à une API externe.

### Gaps
- Aucune règle publiée propre à l'extraction de factures par LLM de vision n'a été trouvée pour le nombre de documents par strate. Les chiffres ci-dessus sont des calculs et des déductions, à présenter comme tels.
- Taux de TVA suisses en vigueur et part réelle de chaque strate chez L'Affinée : non vérifiés ici (à lire dans le code et l'historique).
