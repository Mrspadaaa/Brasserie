# Complément documentaire — Mangrove Jack’s

Collecte effectuée le 12 septembre 2026. Le supplément [mangrove.json](mangrove.json) ajoute **194 observations à 29 références commerciales déjà présentes**, sans créer de souche ni modifier les anciens faits. Les 29 identités sont vérifiées par l’identifiant produit, le titre et le handle de l’API fabricant. Le nombre de références n’est pas un nombre de génotypes distincts.

Le besoin principal était concret : aucune des 29 références du catalogue principal ne possédait de température exploitable. Les sources permettent d’ajouter **28 fenêtres de fermentation**, dont les 16 références de bière. M08 reste sans fenêtre générale : les 17–22 °C affichés pour certains kits cidre sont des consignes de ces recettes et ne sont pas transposés à tous les usages de la levure.

| Type d’observation ajouté | Nombre |
|---|---:|
| Forme sèche documentée | 29 |
| Classification du fabricant | 27 |
| Température de fermentation | 28 |
| Tolérance à l’alcool | 19 |
| Dose avec conditions d’emploi | 19 |
| Préparation, optimum ou conseil de procédé | 33 |
| Atténuation numérique auparavant seulement qualitative | 2 |
| Besoin azoté ou complément nutritif | 22 |
| Plage de pH dans l’application concernée | 12 |
| Floculation | 2 |
| H₂S | 1 |
| **Total** | **194** |

Le [guide technique fabricant, version 10](https://help.mangrovejacks.com/hc/en-us/article_attachments/13551379984785), est celui lié par la [page d’aide actuelle](https://help.mangrovejacks.com/hc/en-us/articles/360019111174-Craft-Series-Beer-Wine-Cider-Mead-Yeast-strain-information). Il couvre 27 références du supplément. Les tableaux et fiches ont été extraits puis contrôlés visuellement. La pagination citée est la pagination imprimée : la page imprimée 40 correspond à la page PDF 41.

| Produit | Température ajoutée | Source technique |
|---|---|---|
| M76 Bavarian Lager | 8–14 °C | Guide p. 7 et tableau p. 40 |
| M20 Bavarian Wheat | 18–30 °C | Guide p. 8 et tableau p. 40 |
| M47 Belgian Abbey | 18–25 °C | Guide p. 9 et tableau p. 40 |
| M41 Belgian Ale | 18–28 °C | Guide p. 10 et tableau p. 40 |
| M31 Belgian Tripel | 18–28 °C | Guide p. 11 et tableau p. 40 |
| M21 Belgian Wit | 18–25 °C | Guide p. 12 et tableau p. 40 |
| M84 Bohemian Lager | 10–15 °C | Guide p. 13 et tableau p. 40 |
| M54 Californian Lager | 18–20 °C | Guide p. 14 et tableau p. 40 |
| M15 Empire Ale | 18–22 °C | Guide p. 15 et tableau p. 40 |
| M29 French Saison | 26–32 °C | Guide p. 16 et tableau p. 40 |
| M66 Hophead Ale | 18–22 °C | Guide p. 17 et tableau p. 40 |
| M12 Kveik | 20–40 °C ; optimum 30–40 °C distinct | Guide p. 18 et [fiche M12](https://mangrovejacks.com/products/kveik-yeast-10g) |
| M36 Liberty Bell Ale | 18–23 °C | Guide p. 19 et tableau p. 40 |
| M42 New World Strong Ale | 16–22 °C | Guide p. 20 et tableau p. 40 |
| M44 US West Coast | 18–23 °C | Guide p. 21 et tableau p. 40 |
| M24 Versa Lager | 10–25 °C ; optimum 10–20 °C distinct | [Fiche M24](https://mangrovejacks.com/products/m24-versa-lager-yeast-10g) |
| M02 Cider | 12–28 °C | Guide p. 22 |
| M05 Mead | 15–30 °C | Guide p. 23 |
| Hard Seltzer Yeast & Nutrient | 20–25 °C | Guide p. 24 |
| CL23 | 14–32 °C | Guide p. 26 |
| AW4 | 16–24 °C | Guide p. 27 |
| CY17 | 16–24 °C | Guide p. 28 |
| MA33 | 18–28 °C | Guide p. 29 |
| BV7 | 14–28 °C | Guide p. 30 |
| CR51 | 16–24 °C | Guide p. 31 |
| VR21 | 18–28 °C | Guide p. 32 |
| R56 | 18–28 °C | Guide p. 33 |
| SN9 | 14–28 °C | Guide p. 34 |
| M08 Premium Cider | Non publiée dans la fiche générale consultée | [Fiche M08](https://mangrovejacks.com/products/m08-premium-cider-yeast-9g) |

Les consignes de dose de bière viennent de la page 4 du guide. La base de 10 g pour au plus 23 L comporte des exceptions de densité initiale et de température de lager. Elles restent dans un fait textuel complet ; elles ne deviennent pas une dose universelle en g/hL. Le conditionnement 250 g relève de ses propres instructions. Les doses spécifiques de [M02, 9 g pour au plus 23 L de jus](https://mangrovejacks.com/products/craft-series-cider-yeast), de [M05, 10 g pour au plus 17 L de moût](https://mangrovejacks.com/products/mead-m05-yeast-10g), et du [mélange Hard Seltzer](https://mangrovejacks.com/products/hard-seltzer-yeast-and-nutrient-25g) gardent leur application.

Les points à conserver lors de l’intégration :

- M12 et M24 ont une seule fenêtre numérique générale. Leur optimum est un fait `application` distinct afin de ne pas créer deux plages concurrentes. Les recettes restent libres de choisir leur température.
- Les nombres de bière portent le contexte `Beer`. Les faits de vin, cidre, hydromel ou hard seltzer restent contextualisés et ne servent pas de consignes automatiques de bière.
- Le guide classe M29, M31 et M41 en *Saccharomyces cerevisiae var. diastaticus*. Cette classification est transcrite ; aucun résultat STA1 ni statut POF n’en est déduit. Les descriptions phénoliques ne deviennent pas des tests POF.
- Les 5 % vol. du mélange Hard Seltzer sont associés au sachet de 25 g et à son apport nutritif. Ils ne sont pas présentés comme une limite intrinsèque de la souche isolée.
- Le H₂S de M08 est « non détectable selon le fabricant », avec méthode, limite de détection et conditions non publiées. Il n’est pas converti en concentration nulle.
- Les recommandations de garde lager sont sensorielles. Elles ne prouvent ni la fin de fermentation ni la stabilité du conditionnement.
- M76 possédait déjà l’atténuation qualitative « High ». Le nouveau 75–80 % s’ajoute sans suppression. Le helper actuel `agreedFermentationFact` refuse un ensemble contenant un fait qualitatif sans plage : l’information devient visible, mais la résolution de ce cas pour les propositions automatiques relève de l’intégration, sans masquer l’ancien fait.
- Aucune valeur d’un autre produit n’est transposée à M24 malgré l’identité NovaLager annoncée par le fabricant.

La forme sèche est appuyée par le guide pour ses 27 produits, par la [gamme des levures de bière](https://mangrovejacks.com/collections/beer-yeasts) pour M24 et par la [gamme Craft Series](https://mangrovejacks.com/collections/yeasts?page=2) pour M08.

Les pièces de contrôle sont conservées dans `.codex-remote-attachments/yeast-enrichment/mangrove/` : corps téléchargés, 10 reçus de collecte, PDF, extraction par page, captures effectivement examinées, snapshot des 29 références avant ajout, générateur du supplément et vérificateur. Le PDF fait 567 109 octets ; son SHA-256 est `a59a2a709675b552bd3a94eb46ca530fd8851bcc98b748d81ce5f21db33a1a4a`. Chaque URL de source d’un fait possède un reçu avec exactement la même URL et le hash du vrai corps téléchargé.

Le guide indique la version 10, sans date de publication explicite. Le `Last-Modified` HTTP du PDF est une métadonnée technique de 2023 ; ce n’est pas une preuve de publication. Les champs `source.year` restent donc `null`. La date de consultation de septembre 2026 reste dans les reçus.

La collecte HTTP de la page d’aide consacrée aux espèces a retourné 403. Aucun reçu ni fait de cette page n’est introduit dans le supplément. Le PDF primaire contient les classifications conservées et reste accessible. La recherche n’a pas trouvé de résultat POF/STA1 explicitement applicable aux références ajoutées.

Vérification de la feuille, en quatre passes : livraison des données et sources ; relecture métier des doses, substrats et limites ; correction des preuves exactes de trois fiches d’usage et validation de chaque URL/hash ; dernière relecture des nombres, libellés et inconnues sans défaut restant dans le supplément. Contrôle visuel du tableau p. 40, des pages 4, 7, 10, 11, 16 et 22–34 ; lecture textuelle des autres fiches concernées. La vérification de l’interface reste à la charge de l’intégration parent.

Commande de contrôle reproductible : `node .codex-remote-attachments/yeast-enrichment/mangrove/verify.mjs`. Résultat : **29 catalogues fusionnés conformes au schéma, 194 faits, 10 reçus vérifiés, 16 fenêtres numériques de bière contrôlées**. Le contrôle négatif rejette bien une température de 900–1000 °C. Le détail horodaté est dans `verification.json`.
