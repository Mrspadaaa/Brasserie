# Usages documentés du catalogue de levures

Audit du 12 septembre 2026. Périmètre : adaptateur pur `yeastStyleEvidence`, ses tests et ce rapport. La bibliothèque complète, la résolution des références personnelles et le branchement de l’interface sont des livrables d’intégration séparés.

Le choix par famille peut utiliser toute référence possédant un usage exploitable. Il ne dépend plus de son appartenance aux 38 profils éditoriaux. Sur les 1 733 fiches du catalogue mesuré, 311 ont au moins une famille attribuable, dont 274 hors de ces profils ; 540 possèdent un motif sensoriel à comparer. Une fiche sans famille reste une référence du catalogue : ce résultat ne signifie ni incompatibilité avec la bière, ni faible qualité du produit.

## Contrat livré

`yeastStyleEvidence(reference: YeastReference)` renvoie une valeur JSON sans écrire, modifier la référence, charger un stockage ou appeler un service. L’appelant fournit la référence déjà résolue, y compris son éventuel catalogue personnel.

| Champ | Utilisation |
|---|---|
| `styles` | Familles admissibles pour la sélection automatique. C’est le champ à utiliser pour filtrer. |
| `styleMatches` | Affirmations positives avec texte original, source, origine et contexte éventuel. Les affirmations en conflit restent consultables. |
| `exclusions` | Négations et usages retirés, avec leur provenance. |
| `goalReasons` | Motifs qualitatifs à comparer, associés à une source ; aucun score de goût ni gain calculé. |
| `goalMatches` | Descriptions positives, faibles ou négatives conservées pour comprendre les décisions. |
| `descriptor`, `descriptorSource` | Descriptif disponible, nettoyé des balises d’import pour l’affichage. Le texte brut reste dans les observations. |
| `culture` | `yeast`, `mixed`, `bacteria`, `other-fermentation` ou `unknown`. Sert notamment à éviter d’appliquer un calcul de fermentation standard à un autre procédé. |
| `warnings` | Contradictions, provenance insuffisante ou besoin de vérifier la composition/le rôle de la culture. |

Les tableaux et sources retournés sont détachés de l’entrée. Les autres faits — température, dose, atténuation, POF, STA1, etc. — restent dans la référence originale, sans être remplacés par un coefficient sensoriel.

## Règles de décision

1. Les faits `styles` et `application` sont les entrées principales. Un fait `aroma` peut documenter un usage lorsqu’il contient une formulation explicite d’emploi ou décrit directement le type de souche, par exemple une option de blé allemande. Un arôme banane/girofle isolé ne suffit pas à classer une référence en Weissbier.
2. Les expressions précises sont reconnues avant leurs composantes : American-style Hefeweizen → blé américain ; Belgian Wheat → Wit ; German Wheat → Weissbier ; Berliner Weisse → Sour. Une Belgian IPA reste dans la famille belge. NEIPA/Hazy IPA est distinct d’IPA générique. Les familles sont des regroupements de brassage, pas une identité génétique : `clean-ale` ne signifie pas absence garantie d’esters.
3. Les noms commerciaux, alias et tableaux d’équivalence entre laboratoires ne déterminent aucune famille. Kveik, Ale et Wheat Beer sans précision ne déterminent pas à eux seuls un style.
4. Les négations et conditions sont conservées. Un usage affirmé par une source et explicitement exclu par une autre est retiré de `styles`, tout en restant traçable dans les deux listes. Les clauses françaises et anglaises courantes sont prises en charge ; ce moteur n’est pas un interprète universel du langage naturel.
5. Les profils éditoriaux complètent une ancienne fiche sans usage explicite. Un fait personnel `styles`, même non reconnu, empêche ce retour automatique. Une exclusion explicite empêche également de réintroduire la famille éditoriale correspondante. Les données personnelles ne sont pas écrasées.
6. Les catégories agrégées ne promeuvent pas une famille : le format actuel ne rattache pas chaque tag à une source. Pour les cultures, les faits de composition/type sont examinés ; les catégories de rôle explicites peuvent aussi conduire à une exclusion prudente des calculs de bière. Leur présence ne crée ni une souche pure ni une équivalence.
7. Les motifs viennent des descriptions d’arômes et d’esters. Les mentions faibles ou négatives ne deviennent pas des préférences. POF, STA1, β-lyase et un chiffre de thiols ne créent pas un goût prédit. L’origine dans un environnement tropical n’est pas un arôme tropical. Un mélange destiné au vin ne devient pas une alternative fruitée pour bière.
8. Une description girofle/phénolique accompagnée d’un fait POF négatif reste signalée comme désaccord documentaire. L’adaptateur conserve les deux informations et ne transforme pas ce motif en instruction de repos férulique.

Le filtrage ne suffit pas à décider de la dose, de la sécurité de conditionnement ou de la conduite d’une culture mixte. `unknown` reste une absence d’information. Un hybride génétique n’est pas automatiquement un mélange de cultures.

## Cas primaires examinés

Les pages ci-dessous ont été ouvertes et leur contenu utile lu. L’audit confronte les usages importés aux descriptions du fabricant ; il n’établit pas de supériorité universelle entre laboratoires.

| Cas | Preuve du fabricant et conséquence vérifiée |
|---|---|
| Imperial G05 Kurt | Le fabricant recommande le blé américain, l’Altbier et la Kölsch. L’emploi américain du mot Hefeweizen ne doit donc pas l’introduire parmi les Weissbier allemandes. Le test retrouve `american-wheat` et `kolsch-alt`. [Fiche Kurt](https://www.imperialyeast.com/yeast-strains/kurt). |
| Imperial A38 Juice | La description cible les IPA troubles de Nouvelle-Angleterre ; la liste de styles mentionne aussi American IPA et American Stout. Ces usages explicites peuvent coexister sans faire de chaque IPA une Hazy IPA. [Fiche Juice](https://www.imperialyeast.com/yeast-strains/juice). |
| Escarpment Überweizen | Le texte vise les Hefeweizen et autres bières de blé allemandes, avec des descripteurs agrume, banane et girofle. La famille Weissbier et le motif banane sont retrouvés depuis ces faits, sans relation chiffrée entre température et goût. [Fiche Überweizen](https://escarpmentlabs.com/products/uberweizen). |
| Escarpment Foggy London Ale | La page cite les NEIPA, American IPA et British Bitter. Le test retrouve les familles Hazy, ale américaine et anglaise. Les mentions de produits d’autres laboratoires figurant sur la page ne servent pas d’identifiants équivalents. [Fiche Foggy London](https://escarpmentlabs.com/products/foggy-london-ale). |
| BSI Express W177 Kölsch | La phrase d’usage indique la production de Kölsch. Dans l’import, ce texte se trouve sous `aroma` : l’adaptateur reconnaît son rôle documentaire. L’ancienne URL du catalogue est `/product/express-w177-kolsch/` ; la page actuelle examinée est la [fiche Kölsch BSI](https://brewingscience.com/product/kolsch-3/). |
| Omega Hefeweizen I | La description identifie explicitement une souche de blé allemande avec banane et girofle. Elle permet la famille Weissbier sans utiliser le nom commercial. Les indications de conduite ne deviennent pas une pente thermique universelle. [Fiche Hefeweizen I](https://omegayeast.com/products/hefeweizen-ale-i-standard). |
| Omega Hefeweizen II | La description identifie également le blé allemand et banane/girofle, mais le champ Phenolic de la même page indique No. Le catalogue conserve ce désaccord ; le test vérifie la famille, le motif descriptif et l’avertissement POF. [Fiche Hefeweizen II](https://omegayeast.com/products/hefeweizen-ale-ii-standard). |
| Omega Lacto OYL-605 | Le fabricant décrit une association de bactéries lactiques pour l’acidification. Ce rôle ne remplace pas une levure principale ; une mesure d’atténuation ou un calendrier générique de levure ne doit pas être inventé. [Fiche Lacto](https://omegayeast.com/products/lacto-standard). |
| Maurivin : hybrides de vin | Le document décrit des applications en vins blancs et rouges. L’aptitude à produire des esters dans ce contexte n’autorise pas un classement en bière fruitée. La génétique hybride ne signifie pas un mélange commercial. [Document primaire Maurivin, mars 2017, pages 1–2](https://www.maurivin.com/perch/resources/next-generation-hybrid-yeast-research-information-march-2017-web.pdf). |
| LalBrew NovaLager | Le bloc Beer Styles de la fiche technique indique explicitement Lagers. Le problème observé est l’absence de ce fait structuré dans l’import, alors que le PDF figure déjà dans `documents`. L’ajout de ce fait, avec sa source, classe immédiatement la référence en Lager. [Fiche technique Lallemand, page 1](https://files.scottlab.com/uploads/NOVALAGER%20TDS.pdf). |

Les infobulles générales des pages Escarpment abordent plusieurs catégories de levure, même sur une fiche particulière. Elles ne sont pas des usages attribuables à la souche affichée. De même, un tableau d’arômes ou une comparaison commerciale n’est pas automatiquement une liste de styles.

### NovaLager : lacune d’ingestion, preuve disponible

Le catalogue `lalbrew-novalager` agrège des passages et collectes d’Escarpment, Lallemand et White Labs. Son tag `Yeast: Lager` n’enregistre pas de source propre ; choisir arbitrairement la source générale de la référence pour ce tag aurait produit une fausse attribution.

La preuve exploitable est différente : le PDF fabricant déjà référencé dans les documents contient directement le fait d’usage. Le test construit un état sans fait `styles`, confirme qu’aucun tag ne le remplace, puis ajoute le fait suivant et vérifie famille et provenance :

```json
{
  "key": "styles",
  "label": "Beer Styles",
  "reported": "Lagers",
  "source": {
    "title": "LalBrew NovaLager — Technical Data Sheet",
    "author": "Lallemand Brewing",
    "year": null,
    "kind": "manufacturer",
    "reference": "https://files.scottlab.com/uploads/NOVALAGER%20TDS.pdf",
    "locator": "Page 1 — Quick Facts / Beer Styles"
  }
}
```

Cet enrichissement documentaire est intégré dans les données, sans nouvelle règle de nom ni nouvelle entrée dans une whitelist. L’audit ne confond donc pas « non extrait » et « non documenté par le fabricant ». Les modifications du bootstrap et sa régénération appartiennent au travail d’intégration.

## Couverture mesurée

Mesure reproductible : `npx vitest run tests/unit/yeastStyleEvidence.test.ts`, sortie JSON `YEAST_STYLE_COVERAGE`. Jeu mesuré : `src/data/yeastCatalogueBootstrap.json`, 1 733 références, SHA-256 `0376F01676323043BC3DEEB9ECA29935FC5130EE5ED2B93BA27CC87F5EE1623B`. Cette mesure inclut l’enrichissement NovaLager décrit plus haut.

Le jeu contient 25 libellés de laboratoire/fournisseur ; 12 ont des références classées. Les effectifs sont des fiches produits, pas des souches génétiquement uniques : formats professionnels et amateurs, variantes et produits historiques peuvent coexister. Les références résolues dans l’application peuvent différer si le brasseur a modifié ses propres faits.

| Famille | Fiches | Laboratoires représentés |
|---|---:|---:|
| Weissbier allemandes | 18 | 9 |
| Witbier | 14 | 7 |
| Blé américain | 4 | 4 |
| Hazy / NEIPA | 39 | 5 |
| Ales américaines / IPA | 82 | 6 |
| Ales anglaises | 17 | 5 |
| Lager | 102 | 12 |
| Saison | 39 | 7 |
| Ales belges | 44 | 7 |
| Stout / Porter | 22 | 3 |
| Kölsch / Altbier | 12 | 4 |
| Sour / Wild | 40 | 2 |

Une référence peut relever de plusieurs familles : la somme des lignes n’est pas le nombre de références classées. Les Weissbier proviennent de BSI, Escarpment, Fermentis, Imperial, Lallemand Brewing, Mangrove Jack’s, Omega, White Labs et Wyeast. Les cinq laboratoires Hazy sont Escarpment, Imperial, Lallemand Brewing, White Labs et Wyeast.

| Laboratoire / fournisseur | Fiches du catalogue | Avec famille | Avec motif qualitatif |
|---|---:|---:|---:|
| Fermentis | 73 | 8 | 4 |
| Lallemand Brewing | 32 | 10 | 13 |
| White Labs | 206 | 14 | 53 |
| Wyeast | 93 | 13 | 43 |
| AEB | 84 | 0 | 0 |
| Bootleg Biology | 98 | 0 | 61 |
| Brewferm / Brouwland | 3 | 0 | 0 |
| Brewing Science Institute | 138 | 44 | 71 |
| CellarScience | 35 | 1 | 14 |
| Doemens | 113 | 0 | 0 |
| Escarpment Labs | 184 | 153 | 154 |
| Fermentum Mobile | 29 | 0 | 0 |
| Imperial Yeast | 59 | 52 | 40 |
| Kveik Yeastery | 4 | 0 | 0 |
| Lallemand Distilling | 14 | 0 | 0 |
| Lallemand Wine | 159 | 0 | 0 |
| Mangrove Jack’s | 29 | 3 | 11 |
| AB Biotek / Maurivin | 21 | 0 | 0 |
| Omega Yeast | 104 | 3 | 52 |
| AB Biotek / Pinnacle | 9 | 0 | 2 |
| VLB Berlin | 23 | 9 | 12 |
| Hefebank Weihenstephan | 129 | 0 | 0 |
| WHC Lab | 50 | 1 | 10 |
| The Yeast Bay | 4 | 0 | 0 |
| Yeastflow | 40 | 0 | 0 |
| **Total** | **1 733** | **311** | **540** |

Les zéros peuvent provenir de simples fiches d’inventaire, de champs non extraits, d’un usage imprécis, d’une langue non reconnue ou d’un usage extérieur à la bière. Ils ne justifient pas d’écarter ces laboratoires de la recherche libre. La forte différence de couverture entre laboratoires reflète en partie la structure de la collecte : 254 fiches seulement possèdent un fait `styles`, alors que des descriptions d’usage se trouvent aussi dans `application` et `aroma`.

## Vérification et limites

Les quatre passes ont couvert l’implémentation complète, la relecture métier des usages, les défauts de négation/provenance/cultures et la finition des textes affichés. Les corrections observables comprennent le pluriel des phénols de WLP380, les usages descriptifs des Omega Hefeweizen, la priorité des styles composites, les mélanges vin, les absences de levure/bactéries explicitement formulées et le faux arôme tiré d’un environnement tropical.

La dernière vérification de la feuille, le 12 septembre 2026 à 23:54 Europe/Zurich, exécute **38 tests réussis, un fichier réussi**. Elle comprend des contrôles positifs et négatifs, des références réelles hors profils, des faits personnels contradictoires, des exclusions postposées dans les conditions, des données gelées, la conservation des sources et la mesure complète. `npx tsc --noEmit` a également réussi après la dernière correction du moteur ; la vérification finale des dépendances et de l’interface appartient à la branche parente.

Ce module ne prouve ni une équivalence génétique entre produits, ni un résultat sensoriel, ni la viabilité d’un lot, ni la disponibilité commerciale actuelle. La sélection documentaire et le protocole de brassage restent deux décisions liées mais distinctes. L’élargissement futur se fait en améliorant les faits sources et leur collecte ; l’adaptateur prend immédiatement en charge les mêmes formulations pour une nouvelle référence personnelle ou un autre laboratoire.
