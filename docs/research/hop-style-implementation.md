# Atelier houblons guidé par le style

Implémentation et vérification du 12 septembre 2026.

La création de recette commence désormais par le rôle des houblons dans le style choisi. Un bilan situe l’amertume calculée dans la plage du guide et montre les grammes et g/L par phase. Les caractères recherchés viennent ensuite, avec une orientation vers les leviers du houblon ou de la levure selon leur origine.

Les travaux de recherche sont disponibles dans [Houblonnage : cas pratiques et preuves](hop-style-practical-research.md) et [Interactions houblons, levures et procédé](hop-yeast-interactions-research.md). Ils distinguent recettes de brasseurs, descriptions fournisseurs, expériences scientifiques et propositions éditoriales. Parmi les cas étudiés : Weihenstephan Hefeweißbier, Sierra Nevada PILS et Pale Ale, Russian River et WeldWerks Juicy Bits. Les limites d’accès aux recettes réservées aux membres sont indiquées dans les dossiers.

## Besoins traduits dans l’interface

| Besoin du brasseur | Contrôle et représentation livrés | Résultat constaté |
| --- | --- | --- |
| Choisir un houblon cohérent avec sa bière | Catalogue filtré par famille de style ; groupes stock, ajout actuel et références ; autres styles accessibles | Les repères Weissbier ne présentent pas Citra par défaut. Les articles disponibles restent accessibles. |
| Trouver une masse pour son amertume visée | Cible IBU, raccourcis de plage, jauge actuel/scénario et masse proposée | La recette de contrôle passe de 8,7 à 12 IBU avec 20 → 27,5 g, à volume et densité courants. |
| Déplacer un apport pour changer son exposition à la chaleur | Destination, contact, température au whirlpool ; option de conservation des IBU | Passer de 60 à 10 minutes montre une baisse d’IBU à masse constante, puis 27,5 → 75,7 g avec compensation. |
| Remplacer un produit ou changer d’alpha de lot | Référence, confirmation des deux formes, alpha exact et comparaison de masse | Tettnanger à 4,5 % remplace l’ajout à 4 % : 27,5 → 24,4 g pour 12 → 12 IBU. La forme inconnue doit être confirmée. |
| Préparer un dry hop reproductible | g/L, phase biologique, température, durée et jour facultatif ; bilan et planning | Citra à 4 g/L dans 20 L donne 80 g ; 16 °C et 48 h après fermentation sont transmis à l’étape Levure. |
| Renforcer banane ou girofle dans une Weissbier | Choix du caractère, instructions en trois étapes, alternatives de laboratoires et accès au simulateur de levure existant | WLP380 se compare à la souche actuelle pour son profil épicé décrit ; l’essai girofle avec 3068 prépare un repos et une conduite à examiner avant application. |

Le bilan, la simulation et l’orientation sensorielle sont séparés par trois onglets accessibles au clavier. Les calculs ajustent un seul ajout. Un brouillon non appliqué survit à la navigation entre étapes, dans la mémoire du créateur ; il n’est pas enregistré dans la recette. Une modification des données de départ impose de reprendre le scénario avant application.

Le choix « comparer cette souche » ouvre une proposition locale. Il ne remplace pas immédiatement la levure. Le passage entre les étapes transporte l’intention ; les changements appliqués se retrouvent dans les paliers, la fermentation, le récapitulatif et la recette enregistrée. La reconnaissance des identifiants opaques du guide BA est maintenant cohérente entre les deux ateliers. Les conseils Weissbier prennent en compte les IBU calculés, même quand la cible saisie est plus basse.

## Ce que les prévisions signifient

Les IBU sont des estimations à chaud suivant la convention Tinseth déjà utilisée dans l’application. La densité, le volume final, l’alpha et le contact manquants restent des inconnues. Les coefficients de premier moût et de whirlpool sont des conventions locales ; ils ne modélisent pas la courbe réelle de refroidissement. La [documentation Grainfather](https://help.grainfather.com/hc/en-us/articles/360014527537-Calculation-IBU) expose ces distinctions entre calcul et perception ; son modèle de whirlpool n’est pas présenté comme celui de L’Affinée.

Le remplacement concerne deux produits conventionnels de même forme. Aucun rendement de Cryo ou d’extrait n’est déduit des seuls alpha. Doubler les grammes ne promet pas de doubler un arôme. Banane et girofle ne reçoivent aucun pourcentage sensoriel inventé : souche, dose viable, moût, pression et température interagissent, selon les limites documentées dans la recherche.

Les 44 °C / 15 minutes et la conduite proposés pour un essai girofle sont des points de départ éditoriaux explicitement annoncés. Ils ne constituent pas un optimum ni une concentration garantie. L’atelier de levure conserve ses fenêtres propres aux produits et la distinction entre ensemencement et fermentation.

Après le dernier dry hop, les consignes demandent de vérifier la stabilité de densité et le diacétyle avant refroidissement et conditionnement. Un jour prévu ne détermine pas la phase biologique. La simulation ne calcule pas l’alcool supplémentaire dû au hop creep ; le contexte NOLO demande de reprendre son bilan.

Deux fiches de variété absentes du catalogue initial chargé ont été ajoutées : [Citra · Yakima Chief Hops](https://www.yakimachief.com/variety/citra-brand) et [Mosaic · Yakima Chief Hops](https://www.yakimachief.com/variety/mosaic-brand), consultées le 12 septembre 2026. Les descriptions sont attribuées au fabricant ; la forme et l’alpha du lot ne sont pas supposés. Ces fiches ne prétendent pas décrire un lot détenu par la brasserie.

## Vérification technique et visuelle

Le script reproductible est [check-hop-style-ui.mjs](../../scripts/check-hop-style-ui.mjs). Il construit les vrais composants React avec les adaptateurs locaux existants pour l’authentification, la persistance et les API. Chrome/Puppeteer ouvre les vues et joue les interactions ; aucune donnée de compte réel n’est modifiée.

Téléphone : 320, 375 et 430 px ; ordinateur : 1280 px, hauteur 900 px. Captures avant et après réellement ouvertes et examinées. Parcours joués : filtre, recherche, clavier, alpha absent/corrigé, objectif IBU, déplacement avec compensation, remplacement, whirlpool, alternative de levure, essai girofle, paliers, IPA à cru, style inconnu, liste vide, sauvegarde et rechargement. Les tests contrôlent aussi l’absence d’écriture pendant les simulations, l’obsolescence après attente asynchrone et le maintien des autres ingrédients.

La revue indépendante a conduit à corriger la perte du brouillon entre étapes, les champs numériques tactiles, les groupes de catalogue masqués, les contours des champs, l’association des erreurs aux champs et le chevauchement des doses avec texte agrandi. Après correction : options de catalogue à environ 42 px pour deux lignes utiles, commandes de 28 px, champs de 32 px et texte saisi de 16 px. L’en-tête occupe 65 px sur téléphone. La dose passe sur une nouvelle ligne au besoin à 200 %, sans recouvrir le nom de phase.

La compilation de production et les dix fichiers de tests ciblés passent. La validation des références de levure consulte le catalogue réellement assemblé, incluant les références de base et d’enrichissement. Les contrôles de protection des saisies et de séparation des tests locaux passent également. Les avertissements de taille des bundles Vite demeurent ; cette tâche ne constitue pas un audit de performance de toute l’application.

Limites de vérification : appareils émulés, pas de téléphone physique, de lecteur d’écran ni de clavier logiciel iOS/Android. Le contrôle à 200 % agrandit la taille racine du texte ; il ne remplace pas un audit complet du zoom natif. Les vues de chargement et de panne de catalogue utilisent le mécanisme existant ; une panne réelle du service distant n’a pas été provoquée.

## Captures utiles

- [Avant : étape houblons à 375 px](hop-style-evidence/before-top-375.png)
- [Après : bilan du style et ingrédients visibles](hop-style-evidence/after-top-375.png)
- [Calcul de dose IBU](hop-style-evidence/after-simulation-375.png)
- [Catalogue avec groupes et lignes compactes](hop-style-evidence/after-catalogue-375.png)
- [Remplacement à amertume conservée](hop-style-evidence/after-replacement-375.png)
- [Dry hop : dose, phase et contact](hop-style-evidence/after-hazy-dry-375.png)
- [Comparaison de levure orientée girofle](hop-style-evidence/after-alternative-375.png)
- [Bilan avec texte agrandi à 200 %](hop-style-evidence/after-zoom-320.png)

## Revue impeccable

Method: dual-agent (A: /root/hop_research · B: /root/yeast_research). Évaluations indépendantes, puis synthèse et correction dans le travail d’implémentation autorisé.

L’évaluation A avant correction était de 30/40 : état 3, langage métier 4, contrôle 2, cohérence 3, prévention 3, reconnaissance 3, efficacité 3, densité 3, correction 3, aide 3. Les quatre problèmes P2 ont été corrigés et revérifiés indépendamment ; aucun nouveau score n’est inventé après cette passe.

Le détecteur source a retourné zéro constat. Les injections navigateur ont fonctionné dans cinq contextes distincts. Les alertes génériques sur les petits espacements et la hiérarchie typographique ne priment pas sur DESIGN.md. Les deux défauts visuels B — chevauchement au texte agrandi et libellé masqué — ont été corrigés puis revérifiés par coordonnées et captures. Les lignes explicatives restent assez longues sur ordinateur : amélioration secondaire possible, sans blocage du parcours. Aucun overlay n’est laissé ouvert chez l’utilisateur ; les serveurs de revue ont été arrêtés.

Questions skipped: les corrections dans le périmètre demandé étaient déjà autorisées. La revue sert ici à terminer l’implémentation, sans ajouter un cycle de validation produit.
