# Lire juste d'abord, plus vite ensuite

*Repères : **[mesuré]** = mesuré sur ses 7 factures (banc k1 du 01.11, recalcul hors ligne k2) ou lu dans le code de l'app ; **[publié]** = écrit par un éditeur (Google, Microsoft…) ou une étude, lien à l'appui ; **[déduction]** = raisonnement à partir de ces sources, à vérifier sur le banc. Aucune valeur de ses documents ici.*

Pas besoin de changer de modèle : les gains viennent de ce qu'on demande à Gemini et de ce qu'on lui évite de deviner. Sur ses 7 factures, **environ deux tiers des erreurs reviennent à chaque tirage et dans toutes les variantes** [mesuré] : une lecture de plus ou un vote de plus ne les corrige pas. Quatre gestes, dans cet ordre. (1) Faire corriger par le code ce qui est sûr, par exemple « Fr. » devient CHF : ce seul geste a rendu **3 champs et 6 lignes justes de plus à la variante C, sans aucun appel en plus** [mesuré]. (2) Changer la forme de la réponse demandée à Gemini : une case par date, la TVA taux par taux, chaque ligne recopiée avant ses chiffres. (3) Lire le QR-facture sans IA, ce qui donne montant, devise et créancier exacts. (4) Ensuite seulement, passer à la paire Flash-Lite (C), déjà **40 % plus rapide et 42 % moins chère, sans faux vert, mais avec 8 % de lignes justes en moins** [mesuré]. Recalculée sans appel, la variante où la 3.8 donne les valeurs et le vote garde le statut, avec la devise corrigée par le code (C★v + N), **dépasse la production : 217/243 champs, 187/207 lignes, 0 faux vert, pour la moitié du coût** [mesuré hors ligne, sur 7 factures : un indice, pas une preuve]. Moins d'erreurs veut aussi dire moins de troisièmes lectures, et ce sont elles qui font attendre. **Données de test : non, pas assez.** Avec 7 factures, on ne voit qu'un écart d'environ 6 points sur l'en-tête et 12 sur les lignes. Il en faut **40 à 60, variées, pour régler** (un écart de 5 points devient visible), puis **100 à 150 tenues à part pour juger** [déduction].

## Neuf gestes classés, du plus sûr au plus incertain

Le classement croise trois choses : la certitude du gain, son coût et l'effort. Rien de ceci n'est fait en production.

| Rang | Ce que ça change pour vous → nom technique | Gain attendu | Coût en plus | Effort | À mesurer | Votre accord |
|---|---|---|---|---|---|---|
| 1 | Le code corrige après lecture ce qui est sûr : « Fr. » devient CHF ; si la quantité vaut 1, prix unitaire = total → *normalisation déterministe* | C : +3 champs, +6 lignes, 0 faux vert [mesuré hors ligne] | aucun | moins d'un jour | rejouer k1 hors ligne, sans appel | oui, pour la production (redéploiement d'`aiTask`) |
| 2 | Gemini répond dans un meilleur ordre, avec des cases plus précises : une case par date, la TVA par taux, la devise dans une liste fermée, la ligne recopiée avant ses chiffres, la consigne placée après l'image → *schéma de sortie et consignes* | vise les erreurs fixes : date de période, prix des lignes, HT et TVA, type de document, nombre de lignes [déduction] | quelques centaines de jetons, moins de 0,005 CHF [déduction] | 1 à 2 jours | champs, lignes, faux verts : sur les 7, puis sur 40 | banc : dans le budget ; production : oui |
| 3 | Le QR-facture est lu sans IA : montant, devise, IBAN et créancier exacts ; avec Swico S1, aussi le numéro, la date, la période et la TVA par taux → *décodage QR (zxing-wasm) et contrôle croisé* | exact quand le QR est là [publié] ; la part de ses factures avec QR reste inconnue | presque nul, moins d'une seconde [déduction] | 1 à 2 jours | part de factures avec QR, avec S1 ; taux de décodage sur photo | oui (déploiement) |
| 4 | Deux lectures Flash-Lite, puis la 3.8 en cas de désaccord ; la 3.8 donne les valeurs, le vote garde le statut → *variante C★v + N* | C : −40 % de temps, −42 % de coût, 0 faux vert, −8 % de lignes ; C★v + N : 217/243 champs, 187/207 lignes, 0 faux vert, 0,53 CHF au lieu de 1,05 [mesuré hors ligne] | moins cher | un réglage | rejouer après les gestes 1 à 3 | oui, c'est votre choix ouvert (D234) |
| 5 | La troisième lecture ne relit que la zone en doute, donc plus vite → *relecture ciblée sur recadrage, schéma court* | la 3.8 fait environ les deux tiers de l'attente de C [mesuré] | moins de jetons | 2 à 3 jours | durée médiane et maximale | oui (production) |
| 6 | Essayer plus ou moins de réflexion sur Flash-Lite → *thinkingLevel minimal / medium / high* | inconnu sur des factures ; Google conseille d'essayer minimal et high [publié] | high : plusieurs fois plus de jetons et de temps [publié] | prêt (variantes Lm, Lh, Lp du banc) | champs, lignes, coupures | dans le budget déjà accordé |
| 7 | Le tableau des lignes part une seconde fois, recadré et plus net ; une photo floue est refusée dès la prise → *tuilage, ULTRA_HIGH par image, contrôle de netteté* | plus de détail sur les lignes [déduction] | environ 0,001 $ par image [déduction] | 2 à 4 jours | lignes justes | oui (production) |
| 8 | Retirer un réglage que Google ignore déjà et qui provoquera une erreur plus tard → *supprimer `temperature`, passer à `responseJsonSchema`* | évite une panne future [publié] | aucun | quelques heures | tests existants | oui (production) |
| 9 | Un second avis d'un autre fournisseur, en Suisse → *Azure Document Intelligence, modèle prebuilt-invoice* | erreurs moins liées à celles de Gemini [déduction] ; ne lit pas mieux que Gemini [publié] | environ 0,01 $ par page [publié, agrégateur] | 1 à 2 jours | accord avec Gemini, lignes | oui : nouveau sous-traitant de ses factures |
| — | Réunir 40 à 60 vraies factures variées, puis 100 à 150 tenues à part → *jeu de réglage, jeu de jugement* | rend les mesures lisibles | 1 à 2 CHF par passe de 40 factures [déduction] | quelques heures de tri | voir la section sur les données | oui, si ses anciennes dépenses ou son Drive servent |

Cinq décisions lui reviennent. Aucune n'est prise. Elles peuvent être groupées.

| Décision | Pourquoi elle vous revient |
|---|---|
| Redéployer la fonction `aiTask` avec les gestes 1, 2, 3, 5, 7 ou 8 | change la lecture en production |
| Passer la production à la variante C | choix ouvert sur les chiffres du banc (D234) |
| Utiliser ses anciennes dépenses et ses justificatifs Drive comme données de test, et les envoyer à Gemini dans un banc | données réelles |
| Envoyer des factures à un nouveau fournisseur (Azure, Mistral), même pour un essai | nouveau sous-traitant (nLPD) |
| Dépenser au-delà des 5 CHF accordés au banc (1,39 CHF dépensés, 3,61 CHF restants) | dépense |

## Deux tiers des erreurs reviennent à chaque tirage : le réglage compte plus que le vote

**L'appel actuel.** Chaque lecture envoie la photo telle quelle. La réponse suit un format imposé (`responseSchema`, JSON). Les réglages : température 0, image en haute résolution (`MEDIA_RESOLUTION_HIGH`), réflexion basse (`thinkingLevel: LOW`), au plus 5 100 jetons de sortie. Les lectures 1, 2 et 3 ont chacune leur consigne ([code](../../../../functions/src/ai.ts)) [mesuré]. Les deux premières lectures partent déjà en même temps ; seule la troisième attend un désaccord. L'attente vient donc de **cette troisième lecture, qui passe après les deux autres, et de la réflexion**. Durées médianes : **3,3 s pour une lecture Flash-Lite, 6,8 à 9,8 s pour une lecture 3.8, 8,6 s pour la troisième lecture 3.8** ([journal du banc](../journal-gemini.md)) [mesuré]. Dans C, la 3.8 a servi **dans 17 parcours sur 21** ([banc k1](../RESULTAT-BANC.md)) [mesuré]. Le gain de C vient donc d'une paire plus rapide, pas d'appels 3.8 évités. Chaque désaccord supprimé enlève environ 5 à 9 s d'attente [déduction].

**Pourquoi le vote ne corrige pas ces erreurs.** Environ deux tiers des défauts du banc sont les mêmes dans les quatre variantes : même facture, même champ, à chaque tirage. On y trouve une date de période prise pour la date de facture, des prix de lignes et le couple HT et TVA ([banc k1](../RESULTAT-BANC.md)) [mesuré]. Google ignore la température sur 3.5 Flash-Lite et la déclare obsolète sur les modèles 3.x. Les générations futures refuseront même la requête (erreur HTTP 400) ([Google](https://ai.google.dev/gemini-api/docs/generate-content/whats-new-gemini-3.6)) [publié]. La « température 0 » de l'app ne fait donc rien. Quand deux lectures tombent d'accord sur une valeur fausse, l'erreur vient de la manière dont la question est comprise, pas du hasard : un vote ne peut pas la rattraper [déduction]. Le banc le montre aussi. Sur une facture, les deux Flash-Lite s'accordent à chaque tirage sur des prix de lignes faux, et ce vote à deux contre un l'emporte sur la 3.8 ([voie k2](../voies/k2-reglages/VOIE.md)) [mesuré]. Laisser la 3.8 trancher seule remonte les lignes de C de 166 à 181 sur 207, mais donne **4 faux verts** : à écarter ([recalcul hors ligne](../voies/k2-reglages/HORS-LIGNE.md)) [mesuré]. Recalculée ensuite sans appel, la variante où la 3.8 donne les valeurs mais où le vote garde le statut (« à confirmer » dès que les lectures ont divergé) garde ces lignes sans aucun faux vert : **217/243 champs, 181/207 lignes, puis 187/207 avec la devise corrigée par le code** ([recalcul hors ligne](../voies/k2-reglages/HORS-LIGNE.md)) [mesuré].

**Changer la forme de la réponse.** Si Gemini écrit d'abord ce qu'il voit, puis les chiffres, il prend moins souvent un prix dans la mauvaise colonne (nom technique : ordre des clés du schéma). Google confirme que la réponse suit l'ordre des clés du schéma ([Google](https://ai.google.dev/gemini-api/docs/generate-content/structured-output)) [publié]. Concrètement, on mettrait en tête une case qui dit si les prix sont hors taxe ou TTC et quels taux de TVA figurent sur la facture ; puis, pour chaque ligne, sa recopie telle qu'imprimée ; puis ses chiffres. Trois autres changements de cases [déduction] :

- une case par date (facture, début et fin de période, échéance), pour que la date de période ne prenne plus la place de la date de facture ;
- une liste de TVA taux par taux (taux, net, TVA, brut), qui remplace les deux cases HT et TVA, celles qui échouent quand une facture a deux taux ;
- une devise choisie dans une liste fermée (CHF, EUR…), pour que Gemini ne puisse rien écrire d'autre.

Aucune étude ne chiffre ce gain sur Gemini 3.x : seul le banc le dira. Le schéma doit rester compact. Un banc de 2026 a obtenu **0 % de réponses valides sur un schéma de 369 champs**, pour tous les modèles testés ([ExtractBench](https://arxiv.org/abs/2602.12247)) [publié]. Et le format imposé ne garantit pas des valeurs justes : Google conseille de les vérifier en code ([Google](https://ai.google.dev/gemini-api/docs/generate-content/structured-output)) [publié]. C'est le rôle du geste 1. Il y a aussi un détail gratuit. L'app place la consigne avant la photo dans la requête ([code](../../../../functions/src/ai.ts)) [mesuré]. Or Google conseille de mettre le texte après l'image ([Google](https://ai.google.dev/gemini-api/docs/generate-content/image-understanding)) et de garder des consignes courtes, car Gemini 3 « peut sur-analyser » une consigne trop élaborée ([Google](https://ai.google.dev/gemini-api/docs/gemini-3)) [publié]. Ces deux changements se testent dans la même passe de banc.

**Plus de réflexion : cher, et pas sûrement utile** (nom technique : `thinkingLevel`).

- **3.8 Flash.** Roboflow mesure **+5,9 points de lecture de texte en réflexion haute, pour 8 fois le coût et 6,3 fois le temps**. La réponse structurée progresse (86,1 → 90,9 %), mais la lecture d'une valeur isolée recule ([Roboflow](https://playground.roboflow.com/models/google/gemini-3-8-flash)) [publié]. Un petit banc de 4 pages trouve au contraire la réflexion basse meilleure, et la haute 4 fois plus lente ([GitHub](https://github.com/luseloso/gemini-thinking-ocr-benchmark)) [publié]. Le niveau minimal n'existe pas sur la 3.8 ([Google](https://ai.google.dev/gemini-api/docs/whats-new-gemini-3.8)) [publié].
- **3.5 Flash-Lite.** Google met le niveau minimal par défaut pour l'extraction JSON, et conseille d'essayer minimal et high selon la difficulté du document ([Google Cloud](https://docs.cloud.google.com/gemini-enterprise-agent-platform/models/gemini/3-5-flash-lite)) [publié]. Aucune mesure n'est publiée sur des factures.
- **Le plafond de sortie.** La réflexion utilise le même plafond de jetons que la réponse. Le 13.10, une lecture 3.8 en réflexion haute a dépensé 4 486 jetons sur 4 500, et sa réponse a été coupée (commentaire dans le [code](../../../../functions/src/ai.ts)) [mesuré]. Sur le banc, des lectures Flash-Lite en réflexion basse sont déjà montées à environ 4 560 jetons sur 5 100 ([journal](../journal-gemini.md)) [mesuré]. Monter la réflexion impose donc de relever ce plafond. Les variantes Lm et Lh, déjà prêtes, le relèvent à 8 192 ([script du banc](../../../../scripts/banc-lecture-facture.ts)) [mesuré].
- **Un piège de méthode.** Ces variantes prêtes reposent sur C★′, où la 3.8 tranche seule, et cette règle a donné 4 faux verts. Pour juger la réflexion seule, il faut les rejouer sur C, avec le vote à trois [déduction].

Une réponse coupée est déjà traitée comme une lecture ratée, jamais comme vérifiée ([code](../../../../functions/src/ai.ts)) [mesuré]. Usage conseillé : réflexion haute pour relire un doute, jamais par défaut [déduction].

**Ajouter un contrôle de calcul n'a rien changé sur ces 7 factures.** La variante C′ appelle aussi la 3.8 quand le calcul ne tombe pas juste. Elle rend exactement les mêmes résultats que C, pour un peu plus cher ([banc k1](../RESULTAT-BANC.md)) [mesuré]. Les contrôles servent quand ils ont une valeur exacte à laquelle comparer : le QR, la TVA taux par taux [déduction].

**Le reste du réglage, en bref.**

- **Le zoom par la 3.8 elle-même.** La 3.8 sait zoomer dans l'image en écrivant du code (Agentic Vision). Google annonce **+5 à 10 % sur des bancs de vision**, sans aucun exemple de facture, au prix de tours de plus et de jusqu'à 30 s d'exécution, et prévient de régressions possibles ([Google](https://blog.google/innovation-and-ai/technology/developers-tools/agentic-vision-gemini-3-flash/), [docs](https://ai.google.dev/gemini-api/docs/code-execution)) [publié]. Pour Flash-Lite, rien n'est documenté sur les images. Recadrer nous-mêmes dans la Cloud Function donne le même effet, plus vite (geste 7) [déduction].
- **Pas de note de confiance par mot.** Gemini 3.x n'en donne plus : les logprobs y sont obsolètes ([Google Cloud](https://docs.cloud.google.com/gemini-enterprise-agent-platform/reference/models/inference)) [publié]. La confiance doit venir de l'accord des lectures, des contrôles et du QR.
- **Le palier Flex.** Il coûte moitié prix, mais ajoute du retard et peut échouer plus souvent ([Google](https://blog.google/innovation-and-ai/technology/developers-tools/introducing-flex-and-priority-inference/)) [publié]. Il ne convient pas tant que le brasseur attend le résultat. Il irait pour une relecture de contrôle faite en arrière-plan [déduction].
- **Le prix de la 3.8 double au 01.01.2027.** Son tarif actuel est un tarif de lancement, valable jusqu'au 31.12.2026. Ensuite, l'entrée passe de 0,75 à 1,50 $ et la sortie de 3,75 à 7,50 $ par million de jetons ([Google](https://ai.google.dev/gemini-api/docs/whats-new-gemini-3.8)) [publié]. La production actuelle, toute en 3.8, passerait d'environ 0,042 à environ 0,085 CHF par facture. C monterait moins, car sa paire Flash-Lite garde son prix [déduction].
- **La fin de 3.5 Flash-Lite.** Le modèle doit être retiré au plus tôt le 21.07.2027 ([Google Cloud](https://docs.cloud.google.com/gemini-enterprise-agent-platform/models/gemini/3-5-flash-lite)) [publié].

## Le QR-facture et le PDF donnent des chiffres exacts sans IA

**Le QR-facture.** Il contient déjà, sous forme exacte, **le montant à payer, la devise (CHF ou EUR seulement), l'IBAN, le créancier et la référence** ([Scandit](https://docs.scandit.com/data-capture-sdk/web/parser/swissqr.html), [spécification résumée](https://qrcode4payment.pages.dev/docs/SWISS_QR_SPEC.md)) [publié]. Quand l'émetteur ajoute les informations Swico S1, le code donne aussi le numéro et la date de facture, la date ou la période de TVA, le numéro TVA et le net taux par taux ([SwissQRBill](https://raw.githubusercontent.com/manuelbl/SwissQRBill/master/generator/src/main/java/net/codecrete/qrbill/generator/SwicoS1Encoder.java)) [publié]. Ce sont précisément les champs où le banc se trompe. Mais S1 est facultatif, pas toujours activé par les logiciels suisses et rare chez les fournisseurs étrangers ([éditeur](https://invoicedataextraction.com/blog/swiss-qr-bill-requirements)) [publié]. Combien de ses factures en portent, cela reste à compter.

**Comment le lire.** Le lecteur zxing-wasm (licence MIT) tourne dans le navigateur comme dans Node, et pèse environ 1 Mio ([GitHub](https://github.com/Sec-ant/zxing-wasm)) [publié]. Sur un banc d'éditeur, il lit une image en 74 ms en médiane ([Dynamsoft](https://www.dynamsoft.com/codepool/benchmark-barcode-reading-javascript-zxing-wasm-dynamsoft-barcode-reader.html)) [publié]. Le détecteur intégré au navigateur existe sur Chrome Android, mais pas sur iPhone ([caniuse](https://caniuse.com/mdn-api_barcodedetector)) [publié].

**Trois précautions** [déduction] :

- **Le montant du QR est le montant à payer.** Il peut être vide, ou différer du total (acompte, escompte). Il sert de contrôle fort, il n'écrase pas le total à l'aveugle.
- **Décoder sur la photo d'origine, avant toute réduction.** Sur une photo d'A4 ramenée à 1 024 px de large, un carré du QR ne fait plus qu'environ 2 px (calcul).
- **Vérifier le code lui-même**, gratuitement : clé de contrôle de l'IBAN, clé de la référence QR.

**Le PDF.** Pour un PDF numérique, Gemini lit déjà la couche de texte en plus de l'image ([Google](https://ai.google.dev/gemini-api/docs/generate-content/media-resolution)) [publié]. L'app envoie le PDF tel quel, donc en profite déjà [mesuré]. On peut aussi extraire ce texte nous-mêmes avec pdf.js (licence Apache-2.0), pour comparer les chiffres sans IA ([pdf.js](https://github.com/mozilla/pdf.js/releases)) [publié]. Certains PDF allemands ou français embarquent une facture électronique complète, en XML (ZUGFeRD ou Factur-X). La Suisse recommande ce format depuis 2020, mais peu de PME l'utilisent ([ecosio](https://ecosio.com/de/blog/zugferdfactur-x-in-der-schweiz/)) [publié]. Quand il est là, tout est exact sans vision. Le banc k1 ne comptait aucun PDF : rien de cette partie n'est mesuré.

**Les règles suisses donnent des contrôles bon marché**, et chaque échec désigne la case à relire :

- les taux en vigueur depuis le 01.01.2024 sont 8,1 %, 2,6 % et 3,8 % ([AFC](https://www.estv.admin.ch/de/mwst-steuersaetze-schweiz)) [publié] ;
- le taux dépend de la date ou de la période de la prestation, pas de la date de facture ([art. 26 LTVA](https://lawbrary.ch/law/art/MWSTG-v2023.01-en-art-26)) [publié] ;
- le numéro IDE (CHE) porte une clé de contrôle, calculée modulo 11 ([python-stdnum](https://sources.debian.org/data/main/p/python-stdnum/2.1-3/stdnum/ch/uid.py)) [publié] ;
- net + TVA = brut, taux par taux ; somme des lignes = total ; total = montant du QR.

Le vote du 29.11.2026 pourrait porter le taux normal à 8,5 %, au plus tôt en 2028 ([admin.ch](https://www.admin.ch/de/ahv-zusatzfinanzierung)) [publié]. La table des taux doit donc dépendre de la date.

## Chaque image vaut au plus 1 120 jetons, quelle que soit sa taille

La photo part telle quelle, jusqu'à 4 Mo (JPEG, PNG, WebP ou PDF). Le module [`imageCompression.ts`](../../../../src/services/imageCompression.ts) existe (1 600 px, JPEG 0,75), mais n'est pas sur le chemin de lecture [mesuré]. Sur Gemini 3, une image vaut au plus 1 120 jetons en haute résolution, et 2 240 en ULTRA_HIGH, réglable image par image ([Google](https://ai.google.dev/gemini-api/docs/media-resolution)) [publié]. Une longue facture photographiée en entier tient donc dans le même budget qu'un petit ticket, et ses lignes sont écrasées [déduction]. Envoyer en plus le tableau des lignes, recadré, lui donne son propre budget (nom technique : tuilage, ou ULTRA_HIGH sur une image). Coût d'une image : environ 0,0003 $ sur Flash-Lite et 0,0008 $ sur la 3.8 au tarif de lancement (calcul sur les prix publiés) [déduction].

**Ce que disent les sources.** Google demande des images droites et nettes ([Google](https://ai.google.dev/gemini-api/docs/generate-content/image-understanding)) [publié]. Une étude montre que la perspective et la rotation dégradent la lecture de la structure, et qu'une simple remise droite aide ([arXiv 2511.17607](https://arxiv.org/abs/2511.17607)) [publié]. Un blog d'ingénierie note qu'un traitement lourd (noir et blanc forcé, débruitage) peut au contraire faire perdre de l'exactitude ([tianpan.co](https://tianpan.co/blog/2026-04-12-vision-inputs-production-ai-pipelines-preprocessing)) [publié].

**L'ordre proposé** [déduction] :

1. lire le QR sur l'original ;
2. redresser selon l'orientation de l'appareil ;
3. recadrer si c'est simple ;
4. ne pas passer en noir et blanc ;
5. faire reprendre une photo floue au moment de la prise (nom technique : contrôle de netteté).

Brancher la compression existante raccourcirait l'envoi depuis le téléphone [déduction]. Elle doit venir après le décodage du QR, et son effet sur la lecture se mesure au banc. Le redressement de perspective (jscanify, sur OpenCV.js) demande de charger 4 à 8 Mo ([jscanify](https://www.github.com/ColonelParrot/jscanify), [OpenCV](https://answers.opencv.org/question/229032/opencv_jswasm-is-too-large)) [publié]. C'est pour plus tard, si les photos de biais posent problème.

## Un autre fournisseur ne lit pas mieux que Gemini, il lit autrement

**Le prix ne départage pas.** À quelques dizaines de factures par mois, toutes les API spécialisées coûtent moins d'un franc par mois. Seul Veryfi fait exception, avec un minimum de 500 $ d'usage par mois ([Veryfi](https://veryfi.com:443/pricing)) [publié]. Le choix porte donc sur la qualité des lignes et le lieu de traitement.

**Azure Document Intelligence.** Son modèle prebuilt-invoice lit les lignes, accepte les photos de téléphone et a un SDK JavaScript ([Microsoft](https://learn.microsoft.com/en-us/azure/ai-services/document-intelligence/prebuilt/invoice)) [publié]. Il coûte environ 10 $ les 1 000 pages selon des agrégateurs ([ERP Research](https://www.erpresearch.com/erp-add-ons/ocr/azure-document-intelligence/pricing)) [publié]. Il serait proposé à Zurich, d'après des sources secondaires ([statusfield](https://statusfield.com/services/microsoft-azure-europe/azure-ai-document-intelligence-switzerland-north)) [publié].

**Le seul banc comparatif de factures trouvé** (20 factures, mars 2026) donne :

| Service | Champs justes |
|---|---|
| Gemini 3 Pro | 94,75 % |
| Azure Document Intelligence | 90,52 % |
| AWS AnalyzeExpense | 83,05 % |
| Google Document AI | 79,76 % |

Source : [Businessware](https://www.businesswaretech.com/blog/best-ai-models-for-invoice-processing-in-2026-gemini-aws-chatgpt) [publié]. Azure ne lit donc pas mieux que Gemini. Son intérêt serait d'être différent : deux fournisseurs se trompent sans doute moins souvent ensemble que deux appels à Gemini. Aucune mesure publiée d'un tel vote n'existe [déduction].

**Mistral Document AI.** Il accepte directement un schéma JSON ou Zod. Ses serveurs sont dans l'UE, et la non-conservation des données se demande ([Mistral](https://docs.mistral.ai/capabilities/document_ai/annotations/), [Mistral](https://mistral.ai/cloud/inference/)) [publié]. Il coûte environ 5 $ les 1 000 pages selon des revues ([invoiceextractor.ai](https://invoiceextractor.ai/mistral-ocr-pricing)) [publié]. Aucun de ces services ne publie sa latence. Chacun ajouterait un sous-traitant qui verrait ses factures.

**Les autres grands modèles.** Le classement IDP, tenu par l'éditeur Nanonets, met Gemini 3 Flash en tête pour l'extraction de champs (91,10). Les modèles rapides des autres fournisseurs sont loin derrière au score global : Claude Haiku 4.5 à 71,2, GPT-5-Mini à 75,2 ([IDP Leaderboard](https://www.idp-leaderboard.org/), [benchmarklist](https://benchmarklist.com/benchmarks/idp_leaderboard/)) [publié]. Aucun banc public ne couvre 3.5 Flash-Lite ni 3.8 Flash.

**Les modèles ouverts.** Ils excellent à recopier une page (90 à 97 sur OmniDocBench), mais pas à en tirer les champs. GLM-OCR obtient 95 en recopie et seulement 54,9 en extraction ([Roboflow](https://roboflow.com/blog/best-open-source-ocr-models), [IDP Leaderboard](https://www.idp-leaderboard.org/)) [publié]. Ceux qui tiennent sur un téléphone sont 25 à 40 points sous Gemini 3 Flash, et pèsent 0,6 à 1,4 Go à télécharger ([Hugging Face](https://huggingface.co/wolfofbackstreet/GLM-OCR-ONNX-q4f16)) [publié]. Ils ne conviennent pas ici.

**Skills, plugins et connecteurs MCP.** Recherche faite : aucun n'aide la lecture faite par l'app elle-même. Receiptor AI, PaperOffice et les connecteurs comptables sont des outils pour Claude, pas pour la Cloud Function.

## Sept factures ne départagent rien : viser 40 à 60, puis 100 à 150

**Le banc actuel est trop petit.** L'unité qui compte est la facture, pas le champ ni le tirage. Trois tirages réduisent le bruit d'une lecture à l'autre, mais n'ajoutent pas de factures ([Miller, Anthropic](https://arxiv.org/html/2411.00640v1)) [publié]. Les champs d'une même facture se trompent ensemble. Sur 800 tickets, cet effet de groupe compte de 1,84 à 2,45 fois ([arXiv 2608.14639](https://arxiv.org/abs/2608.14639)) [publié]. Entre A et C, l'écart porte sur 5 champs d'en-tête et 16 champs de ligne [mesuré]. Même si les 5 champs allaient tous dans le même sens, un test exact ne conclurait pas (p = 0,0625). Avec 7 factures, on ne voit qu'un écart d'environ 6 points sur l'en-tête et 12 sur les lignes [déduction].

**Combien de factures il faut** [déduction, à partir des formules de [Miller](https://arxiv.org/html/2411.00640v1)] :

| Écart à voir | Factures nécessaires |
|---|---|
| 10 points | 14 à 18 |
| 5 points | 40 à 51 |
| 2 points | 100 à 130 |

Hypothèses : environ 12 champs par facture, effet de groupe de 1,5 à 2, puissance de 80 %, seuil de 5 %.

**Il faut aussi de la variété.** Une panne qui touche une facture sur cinq apparaît au moins une fois sur 10 factures, 89 fois sur 100. À l'inverse, zéro échec sur 10 factures permet seulement de dire « au plus 30 % » [déduction]. D'où une dizaine de factures par cas difficile : photo pliée ou de biais, capture d'écran, PDF, plusieurs pages, deux taux de TVA, rabais, EUR, bulletin de livraison, ticket de caisse, QR présent ou absent, français et allemand, fournisseurs habituels et occasionnels.

**Où mettre le budget.** Les 3,61 CHF restants servent mieux à lire 40 factures une fois que 7 factures trois fois. Comptez environ 1,7 CHF pour A et 1,0 CHF pour C sur 40 factures (d'après les coûts médians mesurés) [déduction]. Miller montre que le gain des tirages répétés plafonne vite ([Miller](https://arxiv.org/html/2411.00640v1)) [publié].

**Déjà reçu le 01.11** : six nouvelles pièces réelles, dont les deux premiers PDF du banc (avec QR-facture et Swico S1), trois commandes
en plusieurs captures d'écran et une photo de facture CFF tournée. Leur vérité est en cours d'écriture par deux lecteurs indépendants ;
le banc passe ainsi de 7 à 13 documents. C'est encore loin des 40, mais elles couvrent des cas absents : PDF, QR avec S1, plusieurs
captures pour une facture, anciens taux de TVA, lignes hors champ.

**D'où viendraient ces factures.**

- **Ses anciennes dépenses validées**, avec le justificatif dans Drive. C'est la plus grande réserve, mais leur vérité est faible : le brasseur a pu valider une valeur proposée, fausse mais plausible, et les factures abandonnées manquent. Il faudrait revérifier à l'aveugle 30 à 50 d'entre elles, tirées au hasard [déduction]. Les utiliser demande son accord.
- **Les nouvelles factures du quotidien**, avec leur vérité saisie à la main. Elles nourrissent le jeu de réglage.
- **Des factures fictives à vérité connue**, pour les cas rares. L'app contient déjà `swissqrbill`, qui produit de vrais QR-factures. Imprimées puis photographiées, ces factures fictives donnent de vraies photos dont on connaît toute la vérité [déduction]. Mais un gain mesuré sur du fictif ne prédit pas le réel ([témoignage](https://dev.to/angu10/the-model-looked-great-on-validation-until-one-real-invoice-broke-four-assumptions-5g2l)) [publié] : on ne choisit jamais une variante sur du fictif seul.
- **Les jeux publics**, qui ne ressemblent pas à ses factures : aucun n'est suisse. DocILE sert à vérifier notre code de notation des lignes ([DocILE](https://github.com/rossumai/docile)). Le corpus ZUGFeRD donne des factures allemandes, en EUR, dont on connaît toute la vérité ([ZUGFeRD](https://github.com/ZUGFeRD/b2b)) [publié].

**La méthode.**

- **Figer d'abord les règles de notation** : montants au centime, dates au format ISO, prix unitaire d'une ligne à quantité 1, deux bulletins comptés pour un ou pour deux. Sur deux factures du banc, l'écart vient peut-être de la vérité écrite à la main ([banc k1](../RESULTAT-BANC.md)) [mesuré].
- **Comparer les variantes facture par facture**, et rééchantillonner des factures entières (bootstrap apparié). Apparier les lignes avant de les noter, comme le fait DocILE (appariement maximal) ([DocILE](https://arxiv.org/pdf/2302.05658)) [publié].
- **Suivre deux nombres** : les faux verts, qui doivent rester à 0, et la part de factures validées sans retouche. En production, cette part vaut aujourd'hui **0 sur 21** : 20 parcours finissent « à confirmer », 1 « corrigé » ([banc k1](../RESULTAT-BANC.md)) [mesuré].
- **Chercher les erreurs par deux lectures différentes**, pas par la confiance du modèle. Selon une étude de 2026, la confiance que le modèle s'attribue ne vaut presque rien en pratique, tandis que deux lectures cadrées différemment signalent bien mieux les erreurs (AUC 0,928) ([ExtractConf](https://arxiv.org/abs/2606.24420)) [publié, préprint non reproduit].
- **Régler sur un jeu, juger sur un autre**, séparés par fournisseur, pour qu'une même mise en page ne soit pas des deux côtés ([DocILE](https://arxiv.org/abs/2302.05658)) [publié].
- **Figer chaque erreur corrigée** en cas de test, rejoué avec Gemini simulé (règle du projet).

## Ce qui reste incertain

**Ses factures.** On ne connaît ni la part de ses factures qui portent un QR, ni celle qui porte S1, ni la part de PDF face aux photos. Or tout le geste 3 en dépend, et la partie PDF n'a jamais été mesurée.

**Les gestes eux-mêmes.** Personne n'a publié l'effet, sur Gemini 3.x, d'un schéma réordonné, de cases séparées pour les dates, de la consigne placée après l'image ou d'exemples montrés à Gemini. Seul le banc le dira. Pour Flash-Lite, on ignore l'effet des niveaux de réflexion sur des factures, et les variantes prêtes doivent d'abord être ramenées sur C. On ignore aussi si la compression à 1 600 px change la lecture.

**Les risques techniques.** Une boucle de répétition est signalée dans les réponses imposées de la 3.7 Flash, avec des lignes presque identiques ([forum Google](https://discuss.ai.google.dev/t/gemini-3-7-flash-schema-constrained-json-output-degenerates-into-repeated-0-until-maxoutputtokens-regression-vs-gemini-3-flash-preview/178681)) [publié]. Rien ne dit si 3.5 Flash-Lite ou la 3.8 en souffrent. L'app traite déjà une réponse coupée comme ratée.

**Azure et Mistral.** Latence et justesse des lignes inconnues sur des factures suisses en français et en allemand. Les obligations de la nLPD pour envoyer des factures dans l'UE ou aux États-Unis n'ont pas été étudiées.

**Le banc lui-même.** Les chiffres de k1 sur 21 parcours sont des indices, pas des preuves. Un faux vert de plus ou de moins ne départage rien.

## Conclusion

Vitesse et justesse sont ici un seul problème. L'attente vient de la troisième lecture, et la troisième lecture vient des désaccords. Corriger les erreurs qui reviennent à chaque tirage rend donc la lecture à la fois plus juste, plus rapide et moins chère, surtout avant que le prix de la 3.8 double en janvier. Le bon tableau de bord n'est plus « combien de champs justes ». Il tient en deux nombres : zéro faux vert, et la part de factures qu'il peut valider sans les relire, aujourd'hui nulle.

Le QR-facture joue un double rôle. En production, il fournit des valeurs exactes. Pour les tests, il sert de vérité gratuite sur ses vraies factures (montant, devise, créancier), sans saisie à la main. Il aide ainsi à combler le manque de données qui empêche aujourd'hui de trancher.
