# Catalogue des levures — collecte du 8 septembre 2026

Les comptes ci-dessous décrivent la collecte initiale. Les ajouts et vérifications du 12 septembre sont suivis dans [l’enrichissement des fiches de levures](../yeast-enrichment/README.md).

**1733 références et présentations, 6476 caractéristiques sourcées, 25 fabricants et banques.** Le fichier de référence est [yeastCatalogueBootstrap.json](../../../src/data/yeastCatalogueBootstrap.json). L'import cible la collection existante **hopKnowledge** du projet **brasserie-l-affinee**, avec un document par référence. Aucun nouveau silo Firestore.

## Périmètre et état des données

La collecte conserve les levures de bière, vin, cidre, distillation et seltzer, les cultures mixtes, Brettanomyces, bactéries, références saisonnières et présentations professionnelles ou amateurs. Une présence dans le catalogue n'affirme ni une aptitude à toute bière, ni une disponibilité actuelle. Les accessoires, nutriments seuls et coffrets sont écartés avec leur motif dans [coverage.json](coverage.json). Une levure vendue avec nutriments ou enzymes reste présente.

Ce nombre compte des **références commerciales et de banque**, pas autant de génotypes indépendants. Les reventes portant explicitement la marque LalBrew sont regroupées ; les équivalences supposées entre fabricants ne le sont pas. Les présentations sèches et liquides conservent leurs propres observations. Les anciennes références ne sont jamais supprimées automatiquement.

La collecte n'est pas un inventaire exhaustif de toutes les souches existant dans le monde. Les catalogues publics et champs encore manquants restent identifiés ci-dessous ; leur absence ne devient pas un potentiel aromatique nul.

| Fabricant ou banque · exemple de source | Références après regroupement | Caractéristiques |
|---|---:|---:|
| [AB Biotek / Maurivin](https://www.maurivin.com/perch/resources/maurivin-catalogue-november-2025-en-repro-web.pdf) | 21 | 42 |
| [AB Biotek / Pinnacle](https://www.pinnaclebrewingingredients.com/perch/resources/downloads/pinnacle-brewing-heritage-american-ale-pis-en-v1-0-may-2026-repro-digital.pdf) | 9 | 51 |
| [AEB](https://www.aeb-group.com/media/catalogo-unico/fermobrew_acid-6432/docs/en/FERMO_BREW_ACID_CDS_EN_1310724_Beer_EN.pdf) | 84 | 125 |
| [Bootleg Biology](https://bootlegbiology.com/product/regal-lager-yeast-blend/) | 98 | 545 |
| [Brewferm / Brouwland](https://brouwland.com/en/index.php?controller=attachment&id_attachment=13915&filename=Non-GMO+Certificate.pdf) | 3 | 10 |
| [Brewing Science Institute](https://brewingscience.com/product/louis-p-hard-seltzer-yeast/) | 138 | 903 |
| [CellarScience](https://cellarscience.com/products/munich-dry-beer-yeast) | 35 | 65 |
| [Doemens](https://doemens.org/uploads/2026/02/brochure-yeast-bank-and-mircorganism-collection-2026.pdf) | 113 | 226 |
| [Escarpment Labs](https://escarpmentlabs.com/products/h-uvarum) | 184 | 134 |
| [Fermentis](https://cdn.bfldr.com/G7S7MSWL/as/38n9np39rf7xfhs5ccmf845/SafAle_US-05_TDS_-_Technical_Data_Sheet) | 73 | 234 |
| [Fermentum Mobile](http://fermentum-mobile.pl/oferta-fermentum-mobile/fm10-o-czym-szumia-wierzby/) | 29 | 29 |
| [Hefebank Weihenstephan](https://www.hefebank-weihenstephan.de/en/products/yeast/sekthefen/svt-lumprai/) | 129 | 30 |
| [Imperial Yeast](https://www.imperialyeast.com/yeast-strains/kurt) | 59 | 465 |
| [Kveik Yeastery](https://cdn.prod.website-files.com/69dccf8ce0d6565976574b16/69de01d73f36c902374e76cb_7520c2_326cba931cf945b3935abff98a57883a.pdf) | 4 | 27 |
| [Lallemand Brewing](https://files.scottlab.com/uploads/Declaration%20ADY%20Lallemand%20Brewing.pdf) | 32 | 303 |
| [Lallemand Distilling](https://admin.lallemanddistilling.com/wp-content/uploads/2025/10/TDS_DistilaMaxCN_ENG_260302.pdf) | 14 | 10 |
| [Lallemand Wine](https://products.lallemandwine.com/storage/files/wine-yeasts/235-technical-datasheet-us-1728686973.pdf) | 159 | 634 |
| [Mangrove Jack’s](https://mangrovejacks.com/products/belgian-ale-yeast-10g) | 29 | 61 |
| [Omega Yeast](https://cdn.shopify.com/s/files/1/0800/8505/7790/files/Probrew_Strain_Directory-WEB.pdf?v=1786394512) | 104 | 600 |
| [The Yeast Bay](https://www.theyeastbay.com/s/TYB_StrainGuide_2025.pdf) | 4 | 0 |
| [VLB Berlin](https://www.vlb-berlin.org/sites/default/files/2022-12/List%20of%20brewers%20yeast%20strains%20and%20prices_2023.pdf) | 23 | 46 |
| [WHC Lab](https://cdn.shopify.com/s/files/1/0891/5124/2579/files/brewing-distilling-product-catalogue-2026-v1.0.pdf?v=1772640074) | 50 | 110 |
| [White Labs](https://4099054.app.netsuite.com/core/media/media.nl?id=10918288&c=4099054&h=SbBP8393XiYbYfTNkO0O_CRbKJ7Dt7L3r17iF5wi5gOfPlDH&_xt=.pdf) | 206 | 997 |
| [Wyeast](https://wyeastlab.com/product/german-ale/) | 93 | 672 |
| [Yeastflow](https://yeastflow.com/our-strains/yf-101-queen-of-hearts/) | 40 | 157 |

Le registre machine distingue les produits découverts, références retenues avant regroupement, exclusions et erreurs de collecte. **complete** signifie que l'exécution de l'adaptateur s'est terminée ; ce n'est pas un certificat d'exhaustivité. **detailed** signifie qu'au moins un champ a été extrait, pas que toutes les propriétés sont connues. Les suppléments PDF ont leurs propres comptes, qui ne s'additionnent pas au catalogue : beaucoup enrichissent des références déjà présentes.

## Limites identifiées et prochaines consolidations

- Omega, Escarpment, WHC, CellarScience et Mangrove Jack's ont limité certaines pages détaillées (HTTP 429/403). Les inventaires publics JSON ont été conservés. Les PDF Omega et WHC complètent une partie des champs. Aucun contournement de ces limites.
- Lallemand Wine : 35 marchés parcourus, 159 références/variantes de libellés ; 17 fiches détaillées indisponibles à la collecte. Les champs régionaux non reconnus restent à transcrire. La date technique d'une page peut refléter un stock ou une modification de site.
- Doemens : 113 identifiants dans les tableaux publics 2026 ; les descriptions des pages suivantes restent à transcrire. Ce n'est pas la totalité des cultures conservées par l'institut.
- VLB : 23 références de la liste publique 2023. Le document présente explicitement une sélection de la banque.
- Maurivin : 21 références du catalogue de novembre 2025. Les barres graphiques qualitatives n'ont pas été converties en coefficients ou rendements.
- The Yeast Bay : 45 codes WLP repérés dans le guide 2025 et reliés aux fiches White Labs quand disponibles. Le total annoncé de 48 cultures n'est pas entièrement réconcilié ; les cellules de tableaux ambiguës restent non transcrites.
- Les références historiques Mauribrew et les autres producteurs absents de ce registre nécessitent une collecte complémentaire. Aucune équivalence avec Pinnacle n'est présumée.
- Les descriptions courtes n'exposent pas nécessairement les thiols, POF ou STA1. La recherche aromatique retrouve les mots réellement cités ; elle n'affirme pas qu'un résultat absent n'a pas cet arôme.

## Ce qui peut alimenter le brasseur et le modèle

Température de fermentation, atténuation apparente, tolérance à l'alcool, floculation, inoculation, formes, applications, profils déclarés, POF, gène STA1 et activité diastatique sont conservés quand leur libellé est explicite. Les champs biologiques restent distincts : STA1 négatif ne prouve pas POF négatif ; biotransformation des terpènes ne donne pas un rendement de libération des thiols.

Les valeurs publiées sont des **observations documentaires**, pas des coefficients du moteur, ni des intervalles de confiance statistiques. Les graphiques affichent les bornes fabricant avec leur source. Une borne unique n'est pas une précision expérimentale. Une source sans année connue porte year: null ; la date de collecte n'est pas substituée à l'année de publication.

Le solveur réutilise seulement les fenêtres de température et statuts POF documentés sans contradiction ; les règles de conduite déjà documentées restent prioritaires. Aucun rendement, score aromatique, cinétique, durée de fermentation ou intervalle de prédiction n'est inventé à partir d'un descriptif commercial. Pour extrapoler davantage, il faudra des essais avec moût, inoculum, oxygène, pression, températures, mesures et dégustations appariées.

Cas contrôlés : WLP300 20–22 °C / 72–76 %, Wyeast 3068 18–24 °C / 73–77 %, W-68 18–26 °C / 50–80 g/hL. La fiche de revente Windsor contient un désaccord Celsius/Fahrenheit : son texte est conservé, sa plage numérique n'est pas utilisée. Les plages primaires Lallemand restent sourcées séparément. Les recommandations de levure et paliers pour une Weissbier banane restent une couche documentée distincte.

## Actualisation reproductible

Les scripts n'utilisent pas Gemini. Ils respectent une cadence par domaine (10,1 secondes chez Wyeast), vérifient les empreintes des fichiers en cache et s'arrêtent devant les refus de pages. Conserver le cache local pour une reconstruction hors ligne ; il reste ignoré par Git.

Depuis la racine du dépôt, avec Node et Python contenant pdfplumber :

```powershell
node scripts/harvest-yeast-catalogue.mjs --refresh
node scripts/harvest-lallemand-catalogue.mjs --refresh
node scripts/harvest-yeast-pdfs.mjs --refresh
python -X utf8 scripts/extract-yeast-pdfs.py
node scripts/build-yeast-catalogue.mjs
node scripts/enrich-yeast-pdfs.mjs
npm --prefix functions run build
npx vitest run tests/unit/yeastCatalogue.test.ts tests/unit/hopSolver.test.ts tests/integration/YeastCataloguePanel.test.tsx
node scripts/import-yeast-catalogue.mjs --project=brasserie-l-affinee
```

La dernière commande produit un plan **sans écrire**. Relire les changements et les erreurs du registre avant l'import. Pour cibler une collecte, utiliser par exemple --sources=wyeast,imperial pour le premier script ou --sources=wine pour Lallemand. Les URL de PDF sont déclarées dans harvest-yeast-pdfs.mjs : rechercher une édition plus récente avant chaque actualisation. L'extracteur Omega conserve les colonnes indépendantes pour ne pas attribuer les valeurs d'une souche à sa voisine.

Après validation du plan :

```powershell
node scripts/import-yeast-catalogue.mjs --project=brasserie-l-affinee --apply
node scripts/import-yeast-catalogue.mjs --project=brasserie-l-affinee
```

Le deuxième passage doit proposer zéro écriture si les données n'ont pas changé. Le script sauvegarde l'état distant avant import, valide tout le jeu avant écriture, écrit par identifiant avec préconditions de version, puis relit les documents effectivement enregistrés. Il ne supprime aucune référence. Une correction manuelle du bloc catalogue est signalée comme conflit et préservée ; les champs de levure hors catalogue restent toujours conservés. Une interruption laisse des lots atomiques déjà validés, et le rejeu reprend les différences restantes.

Chaque document porte les URL, dates de collecte, empreintes SHA-256, ETag/Last-Modified quand disponibles, version du parseur et lacunes restantes. L'empreinte métier ignore la seule date de consultation : vérifier une page inchangée ne provoque pas une réécriture. Les preuves complètes des vérifications récentes restent dans le registre local. Pour rendre une nouvelle date de contrôle visible en base même sans changement de contenu, il faudrait un journal de contrôles distinct ; ce mécanisme n'est pas activé ici.

## Utilisation et vérification

Création ou modification de recette → **Choisir les arômes de levure** → **Chercher dans toutes les levures**. Recherche par nom, code, fabricant ou arôme documenté ; graphes et sources dans chaque fiche. **Choisir cette culture** est la seule action qui change la recette. La quantité est à renseigner et les paliers existants sont à vérifier. Dans une recette enregistrée, **Caractéristiques actuelles de la levure et sources fabricant** reste en lecture seule. Ces données actuelles ne remplacent pas une prédiction antérieure figée.

Le catalogue est lu depuis Firestore ; le fichier de collecte n'est pas embarqué dans le JavaScript de production. La recherche affiche douze lignes par page. Le comparateur de houblons examine tout son domaine par lots et conserve une sélection bornée ; les valeurs mathématiques ne changent pas avec la taille des lots.

Contrôles : validation de tout le jeu, provenance obligatoire, incohérences d'unités, absence de faux nutriments et accessoires, identité des références, préservation des recettes, import idempotent et conflits manuels. Parcours navigateur sur le catalogue complet à 320, 390 et 1280 px, avec les requêtes externes bloquées : recherche, choix explicite, graphes, sauvegarde et lecture seule. Les tests normaux ne font aucun appel IA facturable.
