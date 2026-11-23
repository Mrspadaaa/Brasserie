# Classement des houblons par usage IPA — relevé du 12 septembre 2026

Le catalogue doit aider à choisir une variété pour un contexte de brassage, puis à comparer ses apports aromatiques et ses conditions d’emploi. Un descripteur « tropical » n’est pas un style de bière ; une liste de quelques variétés célèbres ne constitue pas non plus un catalogue IPA. Le BJCP autorise toute variété dans l’American IPA et présente les familles aromatiques comme des exemples, sans liste fermée. [BJCP 2021, American IPA](https://styles.bjcp.org/bjcp-2021-beer/21/21a-american-ipa)

## Diagnostic et choix d’implémentation

Trois problèmes se combinaient : le catalogue chargé était principalement issu des fiches Hopsteiner ; la Double IPA récupérait un point de départ libre sans cible ; plusieurs conditions du même couple variété/levure occupaient les six premiers résultats. Une première correction par noms favoris restait insuffisante et a été remplacée.

Le module `hopStyleUsageBootstrap.json` rassemble des faits d’usage par identité variétale. Chaque fait conserve le libellé de style de la source, son commentaire, les rôles réellement décrits et sa provenance. Les sources sont des producteurs, sélectionneurs, fournisseurs de brassage ou brasseries décrivant leur propre bière. Les alias historiques disposent d’une preuve d’identité séparée lorsque celle-ci est nécessaire.

Le helper `styleSelection.ts`, utilisable dans le worker sans import de services, applique les règles suivantes :

- American / Double et West Coast partagent une famille pratique. Un conseil « IPA », « Session IPA » ou « Euro IPA » sans sous-style porte le libellé visible « IPA · sous-style non précisé ».
- Hazy / NEIPA et English IPA demandent une attestation propre. Le seul usage générique IPA ne suffit pas.
- Les autres IPA spécialisées, dont Belgian, Black et Rye, ne sont pas renommées American par défaut ; leur classement spécifique reste à documenter.
- Une référence non documentée reste disponible et comparable. L’état inconnu signifie une limite du relevé, jamais une incompatibilité.
- Les usages attestés sont triés alphabétiquement, sans priorité Citra, Idaho 7, Galaxy ou autre nom. Le score aromatique reste inchangé.
- Une référence personnelle dont les alias désignent plusieurs variétés reste indéterminée jusqu’à clarification. Un assemblage commercial identifié, comme Trident, conserve son identité propre.

## Couverture réellement chargée

Mesure produite par `tests/unit/hopStyleUsage.test.ts`, sur `loadGuideVarieties()` :

| Famille | Références avec usage documenté | À explorer | Total accessible |
|---|---:|---:|---:|
| American / Double IPA | 49 | 87 | 136 |
| Hazy / NEIPA | 44 | 92 | 136 |
| English IPA | 12 | 124 | 136 |

Ces groupes se recouvrent. Les comptes portent sur les références chargées, pas seulement sur les noms : la référence expérimentale « Cascade · cônes » garde ses observations distinctes de la fiche variétale Cascade.

Le catalogue passe de 108 à 136 références avec 28 ajouts qualitatifs vérifiés. Le relevé d’usages couvre 67 identités. Les ajouts comprennent notamment Azacca, Strata, Amarillo, Sabro, Krush, Dolcita, BRU-1, Talus, Belma, Nectaron, Eclipse, Vic Secret, Moutere, Rakau, Waimea, ainsi que plusieurs références britanniques. Chaque ajout a une forme inconnue et une liste d’analyses vide : aucune moyenne d’alpha, intensité de radar ou composition de lot n’a été inventée.

Les packs communautaires disponibles dans le dépôt — HopDatabase (220 références), BeerMaverick (318), BrewDB historique (119) — ne sont pas ajoutés automatiquement et ne sont pas requalifiés en sources fabricant.

## Cas concrets retenus

**Un éventail moderne, au-delà des exemples du signalement.** Crosby documente explicitement Cashmere pour American et Hazy IPA, Azacca pour IPA / NEIPA / Double, ainsi que les applications de nombreuses variétés américaines, européennes et néo-zélandaises. Indie Hops publie des notes séparées de brassage Strata pour Hazy et American / West Coast. Les recommandations HPA et NZ Hops apportent des preuves distinctes pour Galaxy, Eclipse, Nectaron et d’autres références. Ces fiches sont des conseils qualitatifs, pas des étalonnages sensoriels. [Cashmere, Crosby](https://www.crosbyhops.com/hops/varieties/cashmere), [Azacca, Crosby](https://www.crosbyhops.com/hops/varieties/azacca), [Strata, Indie Hops](https://indiehops.com/hops/strata), [Eclipse, HPA](https://www.hops.com.au/media-kit/data-sheets/HPA-Eclipse-Data-Sheet.pdf), [Nectaron, NZ Hops](https://nzhops.co.nz/products/nectaron)

**Les anciens codes comptent.** L’article Hopsteiner de 2018 recommande Calypso, X06277, Eureka!, Lemondrop, X06297, X09326 et X07270 pour NEIPA. X06297 devient Lotus, X07270 est Altus et X06277 est Sultana. Les preuves de ces correspondances accompagnent les recommandations dans l’interface. C’est une raison concrète de résoudre les identités avant de déclarer un usage inconnu. [Article NEIPA, Hopsteiner](https://hopsteiner.us/blog/when-juicy-meets-fruity/), [Lancement Lotus](https://hopsteiner.us/blog/we-are-excited-to-announce-the-official-release-of-lotus/), [Fiche Altus](https://hopsteiner.us/variety-data-sheets/altus/), [Lancement Sultana](https://hopsteiner.us/blog/one-of-hopsteiners-most-popular-experimental-hops-gets-a-name-sultana-is-here/)

**Les goûts ne réservent pas une variété à un style.** Ariana et Callista sont proposées pour Euro IPA dans le guide BarthHaas, tandis que Sabro et BRU-1 y sont associés à NEIPA. Sierra Nevada publie une Hazy IPA combinant Amarillo, Cascade, El Dorado, Sabro et Sultana. Ces faits empêchent de transformer un profil herbacé, floral ou résineux en exclusion automatique. [Guide BarthHaas, tableau Global Hop Portfolio](https://www.barthhaas.com/fileadmin/user_upload/01-barthhaas-2022/Downloads/Reports_Broschures/Other/English/barthhaas-product-guide.pdf), [Tropical Little Thing, Sierra Nevada](https://sierranevada.com/brews/tropical-little-thing)

**Une IPA anglaise conserve son contexte de fermentation.** Alter Ego décrit Mirrors comme une English IPA, avec Goldings et Fuggle à chaud, Golding et Target à froid, et une levure Windsor. Allsopp’s cite Bramling Cross, Fuggles et Challenger dans son IPA de tradition anglaise. La recette Full English IPA de Charles Faram emploie des variétés britanniques modernes et US-05 : un exemple d’usage anglais n’impose donc pas à lui seul un laboratoire ou une souche. [Mirrors, Alter Ego](https://alteregobrewing.co/blogs/news/mirrors-looking-backwards-for-our-latest-cask-special), [Allsopp’s](https://www.allsopps.com/), [Full English IPA, Charles Faram](https://charlesfaram.com/wp-content/uploads/2025/12/Charles-Faram-Recipe-cards-PRINT-FRIENDLY.pdf)

Les limites des recettes sont conservées. L’English IPA de Crisp à 25 IBU n’est pas un modèle strict BJCP 12C ; elle documente néanmoins l’usage de Sovereign, East Kent Goldings et Ernest. Le PDF Faram a été lu mais son URL s’est montrée intermittente lors des réouvertures. Une mention « English-style Ales » seule, comme pour Willamette, n’est pas transformée en preuve English IPA. [Recette Crisp](https://crispmalt.com/en-us/recipes/ipa/), [BJCP English IPA](https://www.bjcp.org/style/2021/12/12C/)

## Intégrité du moteur et entretien

La recherche automatique privilégie l’usage documenté après les conflits, puis conserve le classement aromatique existant. Le mode rapide annonce son périmètre calculé. Le choix explicite des variétés filtre le moteur et les essais complets ; une référence absente ou archivée est signalée sans revenir silencieusement en automatique. Les essais gardent leur identité ; les programmes simulés ne multiplient plus le même couple variété/levure pour ses seuls horaires ou doses.

Le cas de la capture est rejoué sur 24 L, Double IPA, US-05, deux ajouts existants de Lotus (252,78 g et 144 g) et les axes tropical, petits fruits (`berries`), melon, floral. Les tests vérifient six propositions distinctes, l’égalité des scores avec le moteur sans classement de style, les contraintes, la sélection en modes rapide/exhaustif et la conservation des ajouts/levure/fermentation. Le test du bundle vérifie l’absence de Firebase et services réseau dans le worker.

Pour compléter le relevé : ajouter le fait avec son libellé source exact, vérifier l’identité et les alias, conserver la portée du rôle décrit, puis rejouer les tests de couverture et de moteur. Une nouvelle attestation peut faire évoluer « à explorer » vers « documenté » ; elle ne doit pas devenir un rendement de biotransformation ou une intensité quantitative. Les saisons, millésimes, lots et formes commerciales restent des données distinctes.
