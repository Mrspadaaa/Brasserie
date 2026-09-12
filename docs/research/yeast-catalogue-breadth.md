# Levures : ouvrir la création de recette au catalogue

Livraison du 13 septembre 2026. Le besoin du brasseur est de trouver une culture adaptée à sa bière, puis de comprendre ce que ses réglages permettent réellement d’explorer. Les 38 profils éditoriaux de la première version formaient de fait une limite d’accès aux outils. Ils servent maintenant de compléments documentaires.

## Couverture et distinction des informations

La bibliothèque inclut les **1 733 fiches du catalogue collecté**, issues de 25 libellés de laboratoire ou fournisseur. Elles sont consultables sans import dans les données personnelles. Les références historiques et personnelles continuent de s’y ajouter ; l’application sans données personnelles résout actuellement 1 734 identités. Ce sont des fiches produits : formats amateurs/professionnels, références historiques et cultures pour d’autres boissons peuvent coexister. Ce nombre ne désigne pas autant de souches génétiquement distinctes.

Sur le catalogue brut, **311 fiches** ont un usage de bière attribuable à l’une des familles reconnues, dont **274 hors des anciens profils**. **540** ont au moins un motif qualitatif exploitable. Le [rapport des usages](yeast-catalogue-style-evidence.md) donne les sources, les règles, les effectifs par famille et les limites. Par exemple : 18 fiches Weissbier de 9 laboratoires, 39 Hazy de 5 laboratoires, 102 Lager de 12 laboratoires. Ces groupes peuvent se recouper.

Les usages viennent de faits de style, d’application ou d’une description explicite de l’emploi. Un nom commercial ou le mot « banane » seul ne classe pas une levure en Hefeweizen. Les exclusions et les désaccords restent visibles. Les fiches non classées sont accessibles dans **Tout le catalogue**, avec leur adéquation à confirmer. Kveik reste une culture recherchable, pas un style de bière.

Les familles Stout/Porter, Kölsch/Altbier et bières acidulées complètent les familles existantes. Une famille regroupe des usages ; elle ne certifie pas la conformité de toutes ses fiches à chaque sous-style.

## Outils accessibles dans l’écran

| Besoin | Contrôle et représentation livrés | Résultat vérifié |
|---|---|---|
| Trouver un produit parmi beaucoup de références | Recherche par nom, code fabricant, laboratoire et texte documentaire ; filtres laboratoire/forme ; six lignes par page | US-05 exact précède les occurrences dans des textes comparatifs ; un code reste trouvable après personnalisation du nom |
| Comparer dans son style ou explorer une autre piste | Choix segmenté Style documenté/Tout le catalogue, tableau de souche, forme, température et atténuation | Le changement de filtre ne remplace pas le scénario ; un lien retrouve sa ligne |
| Comprendre les sources sans encombrer la sélection | Description courte, laboratoire affiché une seule fois, détails Usages et caractère et Fiche de la souche fermés initialement | Les usages et conditions sont accessibles au clavier ; les noms longs ne débordent pas sur téléphone |
| Préparer une nouvelle souche | Plage de température et repère de consigne, comparaison des enveloppes de DF/dose, champs de conduite, contrôle de la forme du produit | Dieter conserve sa plage convertie de 15,6–20,6 °C ; sa forme inconnue doit être précisée ; aucun nombre de flacons n’est inventé |
| Explorer banane, girofle ou expression du houblon | Objectif dans la famille, motifs descriptifs sourcés, réglages et interactions avec empâtage, pression et houblonnage | Omega Hefeweizen I est accessible avec ses descriptions banane/girofle ; pas de pourcentage de goût ni de pente thermique universelle |
| Préparer et suivre le brassin | Même fiche dans l’overview et le jour de brassage, courbe des températures et données de contact à cru | Le brassin conserve Dieter même après remplacement de la levure dans la recette vivante |

Les calculs restent conditionnels aux données. Une atténuation documentaire fournit une enveloppe, pas une analyse de l’alcool final. La projection simple est retirée pour les procédés acidulés, cultures mixtes, bactériennes ou destinées à d’autres usages. Les quantités et la viabilité inconnues restent à renseigner. La confirmation de la forme ne crée pas un protocole fabricant manquant. Les traits β-lyase/POF et les contacts des houblons ne deviennent pas un score sensoriel.

## Complément primaire NovaLager

La [fiche technique Lallemand](https://files.scottlab.com/uploads/NOVALAGER%20TDS.pdf), déjà référencée dans les documents du catalogue, indiquait l’usage Lager mais ce fait n’avait pas été structuré. Quatre faits sont ajoutés : cet usage, le statut POF négatif, la méthode d’ajout direct privilégiée et les conditions après ouverture du sachet. Le PDF a été téléchargé, avec reçu de collecte et empreinte SHA-256 ; l’empreinte de la fiche et la bibliothèque générée sont recalculées.

La correction n’ajoute pas une règle fondée sur le nom NovaLager. Le même fait de style documenté rend n’importe quelle fiche éligible. Les valeurs de floculation publiées qui divergent restent présentées séparément. Le [rapport d’audit](yeast-catalogue-style-evidence.md) confronte également Imperial, Escarpment, BSI, Omega et Maurivin à leurs sources primaires.

## Cohérence des données et de l’IA

La résolution commune donne priorité aux documents personnels, y compris quand ils invalident une référence par défaut. Une fiche personnelle avec des faits explicitement retirés ne récupère pas silencieusement les anciennes affirmations. Les formes déjà documentées par les guides, notamment Pomona et Bananza, restent disponibles si l’inventaire n’a pas renseigné ce champ.

L’outil IA de recherche peut retrouver une identité du catalogue même sans index houblon déjà chargé. Le contexte de fermentation inclut usages, culture, données manquantes, sources et alternatives diversifiées entre laboratoires. Les aperçus restent limités : les 1 733 fiches ne sont pas envoyées dans chaque prompt. Une alternative explicitement demandée est résolue par son identité, indépendamment de sa présence dans les quelques lignes de l’aperçu.

Consulter et filtrer n’écrit rien. Enregistrer la recette ajoute seulement la référence choisie qui manque aux données de travail ; le test navigateur constate exactement une nouvelle fiche pour Dieter. Les amorces de connaissances de prédiction restent limitées. L’import/export conserve identité, forme réellement saisie, quantité, famille, intention, fermentation et houblons. Le snapshot du brassin conserve ces données.

La [bibliothèque réversible](yeast-catalogue-library.md) conserve les **9 011 faits et 3 448 reçus**, sans simplification des valeurs ni des sources. Le pack généré mesure environ 1,39 Mo de JSON et 395 ko gzip. Un cache commun aux listes personnelles vides évite les reconstructions répétées pendant les simulations. La contre-épreuve Node de préparation NOLO passe de 77 tableaux distincts à un tableau partagé, avec le même résultat et les mêmes six candidates du procédé ; il ne s’agit pas d’une mesure de performance sur téléphone.

## Vérification

Les contrôles couvrent le décodage intégral du catalogue, sa fraîcheur, les usages négatifs/contradictoires, les conditions de plage, les références personnelles, l’IA, les transferts, la conduite et les parcours React. La suite ciblée levures/fermentation comporte **414 tests dans 36 fichiers**. Les audits de protection des saisies et de séparation des tests locaux passent, ainsi que le contrôle scientifique levures. Les commandes reproductibles sont :

```sh
node node_modules/vitest/vitest.mjs run yeast Yeast fermentation Fermentation
node scripts/build-yeast-library.mjs --check
node scripts/check-yeast-breadth-ui.mjs
node scripts/check-yeast-information-ui.mjs --375-only
node scripts/check-yeast-recipe-ui.mjs
npm run build
npm --prefix functions run build
```

Le navigateur réel est Chrome installé, piloté par le Puppeteer déjà présent dans le dépôt ; le plugin Browser n’était pas disponible. Les adaptateurs locaux isolent authentification, stockage et IA, et les requêtes externes sont bloquées. Les captures avant modification à 375 px et après modification à 320, 375, 430 et 1280 px sont examinées. La revue inclut sélection, pagination, filtres, vide, clavier, zoom texte 200 %, forme manquante/corrigée, application, sauvegarde, rechargement, copie/import, overview et brassin figé. Les captures retenues figurent dans [les preuves visuelles](yeast-catalogue-breadth-evidence/README.md).

Cette vérification ne prétend pas tester le clavier système d’un téléphone physique, une écriture sur le compte de production ou une réponse facturée d’un modèle IA. Les builds client et serveur vérifient le code livré ; la transmission réelle au modèle reste couverte par les contrats et tests du contexte partagé.
