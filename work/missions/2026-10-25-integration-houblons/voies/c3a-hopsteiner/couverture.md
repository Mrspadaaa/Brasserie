# Couverture — c3a-hopsteiner (relevé du 26.10.2026)

Sortie : `src/data/hopSources/hopsteiner.json` (587 Ko, 102 fiches, un seul fichier). Script : `scripts/collecte-hop/hopsteiner.mjs --offline`
(relit le cache, aucun réseau ; sha256 de la sortie identique sur deux passes : `376c594c…d139d3`). Téléchargement :
`scripts/collecte-hop/hopsteiner-collecte.mjs` (robots.txt lu, 1 requête/s, arrêt sur 401/403/429 ; le cache sert d'abord).

## Hôtes tentés
| Hôte | robots.txt | Réponse | Lu |
|---|---|---|---|
| www.hopsteiner.de | 200 : `Disallow: /typo3/`, `/typo3_src/` (Allow `/typo3/sysext/frontend/Resources/Public/*`) | 200 partout, aucun 401/403/429 | liste (5 pages), 102 fiches, mentions légales |
| pim.hopsteiner.de (PDF « Download as PDF ») | 200 : `Disallow /typo3/…`, `/*?id=*`, `/*tx_form_formframework` | 200 sur 1 PDF (Nelson Sauvin) | 1 PDF lu hors dépôt (tmp) : copie exacte de la fiche HTML (mêmes champs, mêmes alternatives). Non ajouté au cache : les 102 PDF ne donneraient rien de plus. |
| hopsteiner.us | 200 : `Disallow:` vide | 200 | accueil, `/variety-data-sheets/`, `/sitemap/`, `/news/type/technical-publications/`, `/news/type/guidelines/` |
| www.hopsteiner.com | 200 : `Allow: /` | non lu : la voie a trouvé la liste complète sur .de | — |

Aucun blocage. `hopsteiner.com/variety-data-sheets/…` : non retenté (404 le 19.10), non deviné.

## Pages lues (cache, avec reçu sha256)
- Liste : `/en/products/all-hop-varieties` et `?tx_solr[page]=2…5` (24 + 24 + 24 + 24 + 6 = 102 ; la page 6 est vide).
- 102 fiches `/en/products/all-hop-varieties/detail/<code>` (codes lus dans les liens de la liste, rien de deviné).
- Annexes : `/en/imprint` (conditions d'usage), `hopsteiner.us/variety-data-sheets/`, publications techniques, guides d'achat.
- `hopsteiner.us/variety-data-sheets/` charge ses données par un script (`?l=en&data=1&ver=1.0.6`) qui a rendu 0 octet : pas de donnée supplémentaire côté US.
  Ne rien forcer : la liste européenne (102) est la source.

## Variétés
- Trouvées : **102**. Dates « Last updated » des fiches : du 2024-06-25 au 2026-05-26.
- Rattachées au catalogue : **89**.
  - 79 par le lien Hopsteiner déjà dans le catalogue (`hs.reference`) — leur α et leur huile sont identiques au catalogue (0 écart sur 79).
  - 10 par le code international, trouvé comme alias unique : `fsp`→Strisselspalt, `heb`→Hersbrucker (la fiche s'appelle « Hersbrucker Spät »),
    `hmn`→Huell Melon, `hmr`→Merkur, `lub`→Lublin (fiche « Lubelski »), `mtr`→Mount Rainier, `spa`→Spalt, `ssg`→Styrian Golding,
    `sul`→Denali (le catalogue l'appelle « Sultana (Denali) »), `wgv`→Whitbread Golding Variety. **À vérifier par le tri** : `heb`, `ssg`, `sul`.
- Ambiguës, laissées à `null` avec leurs candidats (7) : `bgo` Brewers Gold (GR ou US), `cbs-tom` Columbus/Tomahawk (Columbus, CTZ, Tomahawk),
  `gol` Golding (UK) (Golding ou East Kent Goldings, déjà tous deux reliés à `hopsteiner-gol` dans le catalogue), `hmg` Hallertauer Magnum
  (Magnum GR ou US), `nbr` Northern Brewer (GR ou US), `per` Perle (GR ou US), `sgc` Styrian Golding (Celeia) (Celeia ou Styrian Golding).
- Absentes du catalogue, gardées (6) : `alr` Alora, `ers` Erebus, `hs09326` HS09326 (code d'obtention), `nbl` Nobella, `stg` Styrian Gold, `ttn` Titan.
  Aucune n'est dans le catalogue sous ce nom ni ce code.
- **Absents de Hopsteiner Europe** : Citra, Mosaic, Simcoe, Amarillo, Galaxy, Azacca (marques Yakima, BarthHaas, HPA). Présents : Nelson Sauvin, Motueka, Cascade, Riwaka, El Dorado, Sorachi Ace.

## Champs, variété par variété (sur 102 fiches ; « rempli » = valeur ou plage lue)
| Champ (clé) | Écrit sur la fiche | Unité | Présent | Rempli |
|---|---|---|---|---|
| **linalol** | Linalool % rel. of total oil | % de l'huile | **77** | 77 (1 valeur seule, 76 plages) |
| **farnesene** | Farnesene % rel. of total oil | % de l'huile | **81** | 81 (dont 6 en borne « < 0.1 » ×5 ou « ca. 0.1 » ×1, avec `qualificatif`) |
| **geraniol** | — | — | **0** | jamais publié par Hopsteiner |
| **beta_pinene** | — | — | **0** | jamais publié |
| **selinene** | — | — | **0** | jamais publié |
| myrcène, humulène, caryophyllène, citronellol, nérol | — | — | 0 | jamais publiés (seuls farnésène et linalol le sont) |
| alpha | Alpha acids % | % | 102 | 102 |
| beta | Beta acids % | % | 101 | 101 |
| cohumulone | Co-humulone % rel. | % des α | 102 | 102 |
| huile_totale | Total oil (ml/100g) | mL/100 g | 102 | 102 |
| thiol_impact | Thiol impact | low / medium / high | 70 | 70 (42 low, 14 medium, 14 high) |
| xanthohumol | Xanthohumol % | % | 78 | 78 |
| polyphenols_totaux | Total polyphenols % | % | 37 | 37 (dont 2 « ca. 4 » / « ca. 5 ») |
| arome_* (8 notes 0-5) | Aroma evaluation (graphique) | note 0-5 odeur du houblon brut | 102 | 100 (Phoenix `phx` et Santiam `snt` : 8 zéros → non évalué, valeur null) |
| rendement | Yield (kg/ ha) | kg/ha | 87 | 87 |
| maturite | Maturity | texte (early … very late) | 92 | 92 |
| pays_principal | Main growing country | texte | 97 | 97 |
| surface | Acreage (ha) | ha | 46 | 46 |
| mildiou / oidium / verticilliose / pucerons | Downy / Powdery mildew, Wilt disease, Aphid | resistant / tolerant / susceptible | 79 / 82 / 43 / 22 | idem |
| premiere_mise_sur_le_marche | « first released in AAAA » (phrase de l'en-tête) | année | 17 | 17 |

Listes (dans `listes`) : `etiquettes` (goûts de l'en-tête), `lignee` (une phrase courte ; vide pour 4 fiches), `descripteurs` (316 mots courts ; vide
pour `dnt` et `ttn`), `substituts` (usage « Brewhouse » : 42 fiches ; « Dry Hopping » : 29 ; mots sans lien comme « Bitter hops » : `code` null).

## Doutes
1. **Droits.** Les mentions légales (`/en/imprint`, § 3) soumettent le contenu au droit d'auteur allemand et limitent copies et téléchargements à
   « personal, private and non-commercial use » ; le stockage dans des bases de données demande un accord écrit. Les valeurs sont des faits chiffrés
   (le catalogue en cite déjà 79 avec lien), mais il n'y a pas de licence. Le JSON est inerte (importé par aucun code) ; à trancher avant toute fusion
   ou publication.
2. **Plages d'un tableau de marque.** Ce sont des plages de producteur, sans année de récolte ni méthode. Un seul linalol sur 77 est une valeur seule.
3. **Rendement, surface, maladies** : agronomie, hors question du brasseur ; gardés (« récupère TOUT »).
4. **Date.** Chaque fiche donne « Last updated » (jj/mm/aaaa), mise en ISO dans `publie.date`, brut gardé.
5. **Guides d'achat Hopsteiner (PDF) non extraits.** `hopsteiner.us/news/type/guidelines/` liste 2014→2023 ; la fiche 2023 contient une table
   « Hopsteiner laboratory values 2020-2023 » (α moyen par variété et par récolte, une trentaine de variétés). La mise en page en colonnes imbriquées
   ne s'extrait pas proprement avec `pdftotext` ; il reste à lire à la main ou avec un outil de tableaux. « Hop aroma substances » (Biendl, 2023) donne
   des plages mondiales par composé (myrcène 1000–12000 ppm, linalol 15–200, géraniol 2–150, …), pas par variété.
