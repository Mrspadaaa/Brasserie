# Levure — revue utilisateur et mission de reprise

## Résultat local courant — 27septembre, source64554c1

Trois autocomplétions Gemini réelles et lotfrontend Claude terminé localement. Sources/preuve de reprise et réserve URLM20, provenanceIA, doublechamp, labelsgraphe ont leurs corrections dans le [registre](ux-mobile-poc-release-2026-09-25.md) et le [rendu final](../../work/ux-mobile-poc-2026-09-25/review/live-autocomplete-2026-09-27/result-final.md).241/241ciblés, builds verts ;sourcehypothèse/quantité/notes et4recettes exactes enDBdémo aprèssave/open.

La releaseglobale resteouverte : aucun déploiement ni acceptation UX déduite du nombre de tests. Les demandes originales ci-dessous restent la référence, avec leurs décisions/preuves datées. Incident de secret signalé, rotation séparée préparée et non exécutée.

## État de reprise

Revue transmise le 25 septembre 2026, après utilisation du site publié. Branche
observée : `poc`, HEAD `3593f9d`. Le registre de release indique une publication
`0e1e1a1` et des corrections locales ultérieures : identifier la version réellement
testée avant de déclarer un défaut corrigé. Les captures ne prouvent pas leur commit.

**État à la transmission du 25 septembre : demandes ouvertes, non reproduites ni corrigées par cette transmission.**
Cette revue complète et corrige les critères de la mission existante. Elle ne valide
pas la livraison précédente et ne donne pas une nouvelle autorisation de déployer.
Les tests verts et les anciennes revues visuelles ne réfutent pas ce retour réel.

Objectif : choisir simplement sa levure, comprendre ses possibilités, recevoir une
conduite pertinente pour son objectif, la régler puis enregistrer ; comparer reste
une possibilité explicite. Conserver les connaissances utiles sans répétitions.

## Clarification de couverture — reprise complète

« Énormément de doublons et d'infos inutiles », « comparaison fouillis / bouton noyé »
et « US05 introuvable, tous les ferments ? » concernent **tout le parcours et ses états**.
Deux textes supprimés, un bouton déplacé ou une souche devenue trouvable ne ferment
pas ces besoins. Les propriétés génériques et quelques contre-exemples renforcent
la preuve ; ils ne remplacent pas la couverture de tous les blocs concernés.

| Besoin / blocs et états à examiner | Constat et décision actuelle | Preuve actuelle / restante |
|---|---|---|
| Densité · en-tête enregistré/brouillon/essai, identité du point1 | Identité principale unique, détail de différences à la demande ; états réellement distincts. | Composition SRC et captures actuelles ; null/[] vs absence et seed vs brouillon repris reproduits puis corrigés. Contre-revue finale ouverte. |
| Densité · quantité/forme, fiche IA, dossier, alertes | Quantité après choix, fiche/source accessibles à la demande ; propositions et exceptions de l'IA séparées. | Fiche directe A→B→A, détour/reprise/save et types exacts joués ; mapping et réponse S04/DB émulée déjà prouvés. Aucun nouvel appel fournisseur. |
| Densité · Objectifs, conduite/frise/éditeur, décision | Objectif facultatif ; graphe, saisie exacte et décision réunis. | Monoaxes, J10/J20, zéro/inconnu, décalages, ajouter/retrait/annuler/save/reopen ; 3068 18→22°C vs M20 inchangé. Limite des quatre guides éditoriaux explicite. |
| Comparaison · découverte depuis choix direct, recherche et sélection | Recherche immédiate, aucune présélection ni ouverture imposée ; action Comparer près des choix cochés. | Parcours recherche→cocher→Comparer→essai séparé→choix direct joué aux deux tailles ; images examinées. Appréciation utilisateur distincte de cette preuve. |
| Comparaison · ouverture, référence, lecture, navigation, détails et IA | Référence fixe, valeurs alignées et types/sources accessibles ; candidats isolés et révisionnés. | Référence3068/M20/3638 aux mêmes fixtures que les maquettes, navigation tactile/clavier et fiche/IA par candidat ; livre direct et réponse tardive protégés. |
| Recherche · catalogue complet actif, stock/lots, saisie libre | Recherche générique par nom/code/labo/propriétés ; stock explicite, saisie libre ; aucune fusion nominale. | Catalogue actif couvert par les contrôles déterministes existants ; banc SRC stock QAUS05/libre QA-Z9, homonyme contradictoire, diversité2124/Verdant/BelleSaison/WLP099/Philly/AEB/3278. |
| États transversaux | Vide, enregistré, essai et brouillon différents restent explicites ; inconnus et contradictions fidèles. | Vide G1–G4 complet, save/reopen, snapshots figés, offline et NOLO spécialisé. Téléphone physique et IME Android non vérifiés. |

La revue finale commence par ces formulations générales, puis le vrai parcours et
cette couverture. Elle peut refuser des exemples corrigés si le défaut persiste
dans un autre bloc. Aucun nouveau rapport parallèle ni test automatique par champ
n'est requis ; quelques propriétés discriminantes et un scénario indépendant
du réalisateur complètent les parcours réels.

## Autocomplétion IA — orientation validée le 26 septembre

Complément aux demandes existantes de lisibilité, de données et d'IA par candidat,
**pas une nouvelle priorité exclusive ni un remplacement du goal complet**.
Intégrer ce fonctionnement au lot comparaison/faits déjà prévu. Garder les autres
correctifs attribués et leur état visible ; ne pas multiplier les revues ou variantes
de ce seul sujet au détriment de la conduite, du graphe, de la recherche et du reste.

### Problème compris avec l'utilisateur

La [capture 18505](levure-revue-utilisateur-2026-09-25/18505.jpg) montre un menu
« Choisir… » entre « Saisie » et « Fiche », une validation grisée, puis un long
éditeur où des champs semblent vides malgré les plages documentées visibles.
Le code examiné traitait toute valeur existante différente comme un conflit,
y compris des notes reformulées, et un arbitrage manquant bloquait l'application
de toutes les propositions. Le problème est le parcours complet : comprendre ce
qui est trouvé, ce qui change, ce qui mérite une décision et ce qui sera enregistré.
La capture est un exemple de ce problème général, pas son périmètre exclusif.

### Cas standard : validation facile

- Présenter une fiche enrichie proposée, avec ajouts et corrections compréhensibles
  près des valeurs concernées ; sources accessibles sans répétitions permanentes.
- Quand les propositions sont cohérentes, permettre **« Tout valider » en un geste**.
  Ne pas imposer de menu ou case à cocher pour chaque champ.
- Distinguer données documentaires et hypothèses propres à la recette. Une plage
  connue doit se lire et s'éditer comme telle, sans case scalaire vide laissant
  croire qu'elle manque. L'état proposé, retenu et enregistré reste compréhensible.

### Conflits : résoudre les exceptions sans bloquer le reste

- Permettre **« Valider les données sans conflit »**. Conserver les écarts ouverts
  avec la valeur actuelle, ou un champ non renseigné si aucune valeur n'est retenue.
  Montrer ensuite ce qui a été appliqué et ce qui reste à vérifier.
- Un conflit est une divergence pertinente pour la même donnée et des conditions
  comparables. Une reformulation, une unité convertible ou une information
  complémentaire ne justifie pas automatiquement un choix bloquant. Ne pas fusionner
  des notes réellement contradictoires ou effacer la provenance pour simplifier.
- Regrouper les exceptions dans une zone compacte **« Écarts à vérifier »** : valeur
  actuelle, proposition, sources et raison de l'incertitude. Éviter le « Choisir… »
  générique qui cache les actions et leurs conséquences.
- **« Vérifier avec l'IA »** relance explicitement la recherche applicative sur les
  seuls écarts : identité, conditions, source, version. Elle fournit une recommandation
  étayée ou reconnaît l'incertitude ; aucune boucle de recherches automatique.
- **« Choisir moi-même »** permet de garder, remplacer ou corriger la valeur.
  **« Plus tard »** conserve l'écart repérable sans bloquer les données indépendantes.
  L'utilisateur arbitre lorsque sa préférence/connaissance est nécessaire ou que
  les preuves ne suffisent pas, pas pour chaque différence technique.
- Une ambiguïté sur l'identité de la souche peut invalider toute la fiche concernée :
  ne pas traiter ses champs comme des ajouts fiables tant que cette identité manque.

### Contrats et preuve proportionnée

Préserver priorité aux corrections manuelles, provenance, cible exacte et rejet des
réponses périmées. Une validation partielle respecte les groupes cohérents de données
(dont bornes d'une plage) et n'écrit ni une autre souche, ni le stock, ni un brassin
figé implicitement. Une proposition non retenue n'alimente pas silencieusement les
calculs ou paliers. Le traitement des exceptions ne surcharge pas le cas standard.

Dans les vérifications déjà prévues, couvrir : fiche cohérente validée en un geste ;
ajouts acceptés malgré un conflit indépendant ; vérification ciblée concluante ou
non concluante ; arbitrage manuel/report ; cohérence des valeurs liées, réponse
obsolète et sauvegarde/réouverture. Vérifier la compréhension et la facilité du
parcours sur mobile, pas seulement l'existence des boutons. Réutiliser les tests et
le relecteur prévus, sans batterie par champ ni nouveau chantier d'orchestration.

**État à l'ajout : orientation validée, réalisation et preuves encore ouvertes.**

## Avancement local après le réveil du 26 septembre — non publié

Le site que l'utilisateur a examiné reste au commit `0e1e1a1`. La tranche locale
choix/recherche/comparaison est au checkpoint `b6fde32`, puis les scénarios de
validation ont été adaptés. [Résultat intégral du premier lot Claude](../../work/ux-mobile-poc-2026-09-25/review/claude-user-review-choice-result.json),
[résultat du second lot](../../work/ux-mobile-poc-2026-09-25/review/claude-user-review-tests-result.json) et
[captures du vrai Wizard](../../work/ux-mobile-poc-2026-09-25/review/user-choice-final/report.json).
Aucune modification de cette tranche n'a été déployée ni essayée sur des données réelles.

| Section | État et limite |
|---|---|
| 1 · Choix et recherche | **Corrigée localement en partie, vérifiée sur fixtures.** Choix direct sans comparaison, recherche générique sur nom/fabricant/code/alias et variantes de saisie, recherche hors style signalée, référence courante visible, homonymes distingués sans fusion. Le parcours applique puis retrouve le choix. La cause exacte des deux S‑04 du site et les listes de stock/saisie libre ne sont pas établies. |
| 2 · Propositions de conduite | **Ouverte.** La réaction métier à la souche et à l'objectif n'a pas été revue dans cette tranche. |
| 3 · Graphe tactile | **Ouverte.** Le geste tactile vérifié ici concerne uniquement le défilement horizontal du comparatif, pas l'édition des paliers. |
| 4 · Hiérarchie et quantité | **Partiellement corrigée localement, non publiée.** Quantité et unité visibles dans le point 1 ; zéro présent mais invalide, absence et positif distincts, sans reprise de dose. Vérification actuelle 4599 tests, 87 captures et NOLO verts. Repli des autres postes, doublons enregistrée/brouillon et objectifs restent ouverts ; les copies de ces changements n'ont pas été intégrées. |
| 5 · Comparaison | **Corrigée localement en partie, vérifiée sur fixtures.** Alternatives cochées volontairement, colonne de référence fixe, défilement tactile à 390 px, retrait et essai sans écriture implicite. L'IA dans chaque candidat de la comparaison reste ouverte ; la découvrabilité auprès de l'utilisateur n'est pas validée sur le site. |
| 6 · Types des faits | **Ouverte.** Les plages et bornes déjà préservées par le code précédent ne répondent pas à elles seules à la revue demandée de saisie, mapping, comparaison et sauvegarde. |

Preuves exécutées sur cette tranche : **303 fichiers, 4 595/4 595 tests** ;
`npm run build` réussi ; `check-ux-mobile-poc.mjs` **85 captures** aux deux tailles,
zéro erreur JavaScript ou requête distante, sélection directe avec
sauvegarde/réouverture et comparaison par glissement tactile réel ;
`check-nolo-wizard-apply.mjs` réussi. Les captures conservées montrent la
sélection, la référence et les colonnes ; elles ne prouvent pas les sections
encore ouvertes ni l'acceptation de ce nouvel écran par le brasseur.

Un lot Claude suivant sur la section 4 a atteint son quota avant résultat complet.
Ses [copies partielles récupérées](../../work/ux-mobile-poc-2026-09-25/review/claude-user-review-hierarchy-recovery/README.md)
sont conservées **hors du code produit** et n'ont été ni revues ni testées : la
section 4 demeure ouverte. Reset Claude annoncé le 26 septembre à 04 h 30,
heure de Zurich ; le reset Codex est distinct.

Après ce reset, un [audit en lecture seule](../../work/ux-mobile-poc-2026-09-25/review/claude-hierarchy-recovery-audit-retry.json)
a refusé l'application en bloc. Seuls les petits changements quantité ont été
repris et contrôlés progressivement : [bilan et limites actuels](../../work/ux-mobile-poc-2026-09-25/review/hierarchy-quantity-verification.md).
Les décisions structurelles attendent Astra après renouvellement Codex le
27 septembre ; aucun nouvel avis ancien ni test vert ne ferme les demandes restantes.

Prochaine action : confronter cette revue au parcours actuel, identifier les écarts
encore présents et confier un lot cohérent à Claude pour réalisation et vérification.
Ne pas relancer une exploration générale des anciennes maquettes.

## 1. Choisir et retrouver une levure sans imposer une comparaison

- Pouvoir taper/rechercher puis choisir directement sa levure et poursuivre.
  La comparaison ne doit pas être une étape obligatoire ni présélectionner des
  alternatives sans action de l'utilisateur. Distinguer référence et candidats.
- Défauts signalés : deux « safeale 04 » ; recherche « safeale 04 » ne plaçant pas
  la bonne référence en premier ; « safe us05 » ne renvoyant rien dans le comparateur
  malgré SafAle US-05 sélectionnée ; impression que d'autres ferments sont absents.
- Vérifier le contrat commun de recherche : nom, marque, code, espaces, tirets,
  casse et variantes de saisie usuelles ; pertinence du classement ; filtres actifs ;
  couverture catalogue/stock/saisie libre et cohérence entre sélecteur et comparateur.
- Résoudre l'identité et le mapping, sans fusionner des produits ou lots distincts
  parce qu'ils partagent un nom. Si plusieurs entrées sont légitimes, les distinguer
  utilement. Une référence principale exclue des alternatives doit rester clairement
  présente comme référence, sans donner l'impression qu'elle est introuvable.
- Preuve : choix direct puis sauvegarde/réouverture, recherche par plusieurs formes
  de nom et code, homonymes/lots, candidat hors fixtures historiques. Aucune règle
  spéciale `US-05` ou `S-04` créée uniquement pour satisfaire cet exemple.

## 2. Rendre la conduite réellement réactive au choix et à l'objectif

- Constat utilisateur : changer de levure ou de cible ne semble changer aucun
  palier ; les projections et la conduite paraissent figées. L'utilisateur attend
  de **véritables propositions de changements**, pas seulement un nouveau libellé.
- Relier les propositions aux propriétés documentées de la souche, à la recette,
  au programme existant et à l'objectif recherché. Présenter les modifications
  pertinentes, leurs conséquences et les limites des connaissances disponibles.
- Ne pas inventer une réponse biologique ni changer arbitrairement un programme
  pour le rendre « dynamique ». Si rien de justifiable ne change, l'expliquer
  brièvement. Distinguer proposition, réglage manuel et application explicite.
- Préserver les spécialisations légitimes (dont lager et NOLO), les contacts de
  houblons et les données inconnues. Le nom d'un style ne remplace pas ces propriétés.
- Preuve : une tranche complète où un changement pertinent produit une proposition
  réelle, comprise et applicable, puis retrouvée dans Paliers et après réouverture ;
  un cas où aucun changement n'est justifié et un cas de données insuffisantes.

## 3. Graphe mobile comme outil d'édition

- Agrandir le graphe des paliers sur téléphone et permettre de régler au doigt
  les points/segments sur les dimensions temps et température, ajouter et supprimer
  des paliers. C'est l'interprétation de « bouger les différents axes », pas une
  demande de simple zoom ou de déplacement décoratif du graphe.
- Conserver une saisie exacte avec unités, un usage clavier et des gestes fiables
  au défilement. Les champs, graphe et Paliers partagent les mêmes valeurs.
- Tester correction, ajout, suppression, annulation, application et réouverture,
  avec durées inégales et données partielles. Ne pas supposer une durée égale pour
  chaque phase ou assimiler fin du programme et fermentation biologiquement achevée.

## 4. Hiérarchie et informations au bon moment

- À l'ouverture : **point 1 et quantité de levure visibles ; autres sections repliées**.
  La quantité actuellement isolée en bas doit être accessible dans le parcours de
  base. Un état qui exige une action doit rester repérable malgré le repli.
- L'utilisateur juge inutiles les blocs identiques « Recette enregistrée » et
  « Brouillon » affichant chacun `SafAle US-05 · sèche · 0 sachet`, suivis de la
  répétition textuelle de toute la conduite. Montrer les différences quand elles
  servent une décision ; utiliser un renvoi vers le réglage existant autrement.
- Vérifier aussi la signification de `0 sachet` : ne pas confondre zéro réellement
  saisi, quantité non renseignée et dose conseillée. Ce constat ne demande pas
  implicitement d'implémenter tout le futur outil pitch rate/starter.
- Auditer chaque information et commande : décision qu'elle aide, bon moment,
  emplacement, visibilité directe ou à la demande, représentation, source unique.
  Réduire les doublons sans supprimer des capacités ou masquer toute la richesse.
- Exemples de bruit : répétitions de référence/marque/forme/plage, « Autre style ·
  choix libre », longues légendes, valeur de température + chevauchement + deltas
  des bornes tous affichés simultanément. Choisir une représentation principale
  intelligible ; conserver détails et sources accessibles quand ils sont utiles.

## 5. Comparaison côte à côte à préserver et améliorer

- **Retour positif explicite : le côte à côte est excellent.** Le rendre facile à
  découvrir et à ouvrir ; le bouton actuel est noyé parmi listes, filtres et textes.
- Montrer la levure réellement choisie comme colonne de référence et les alternatives
  à côté. Permettre plusieurs alternatives par navigation/défilement horizontal au
  doigt, avec identité de la référence toujours compréhensible. Ne pas tasser toutes
  les colonnes dans la largeur mobile ni imposer silencieusement trois références.
- Comprendre pourquoi des levures semblent déjà cochées ; aucun candidat implicite
  sans choix utilisateur. Les sélections conservées doivent être explicites.
- Rendre la complétion IA utilisable depuis la comparaison, sur la bonne souche et
  ses champs, y compris pour vérifier/corriger des données existantes. Conserver
  provenance, arbitrage manuel et rejet des réponses obsolètes ; annoncer la portée
  d'écriture et ne pas modifier implicitement stock, autre candidat ou recette.
- Preuve : trouver l'action sans fouiller, ajouter/retirer plusieurs candidats,
  comparer avec la référence, compléter un candidat par IA mockée, garder les
  autres intacts, choisir puis enregistrer et retrouver.

## 6. Données compréhensibles pour un brasseur

- L'utilisateur conteste l'atténuation présentée comme un nombre fixe, la
  flocculation non typée et la représentation de la tolérance. Revoir ensemble
  saisie, import/mapping, affichage, calcul et sauvegarde ; pas seulement les labels.
- Vérifier les types réellement publiés par les fabricants : intervalle, point,
  seuil/borne, catégorie, conditions et inconnue. Ne pas transformer la remarque
  « toujours en tranche » en règle universelle sans source. Ne pas inventer de
  moyenne ni perdre une borne lors d'une conversion.
- Distinguer donnée fabricant et estimation propre à la bière ; conserver unités,
  qualification et sources sans les répéter dans chaque sous-bloc visible.
- Preuve : types de données représentatifs indépendants des noms de souches,
  aller-retour sans perte et lecture compréhensible de la comparaison.

## Captures utilisateur conservées

Copies des pièces jointes originales, à fournir à Claude et au repreneur :

| Capture | Ce qu'elle illustre |
|---|---|
| [18465](levure-revue-utilisateur-2026-09-25/18465.jpg) | `safe us05` : zéro résultat malgré US-05 choisie ; filtres et textes accumulés. |
| [18464](levure-revue-utilisateur-2026-09-25/18464.jpg) | Référence répétée dans chaque critère, légendes et valeurs redondantes. |
| [18463](levure-revue-utilisateur-2026-09-25/18463.jpg) | Liste et commandes encombrées, comparaison en bas, compteur 3/3. |
| [18462](levure-revue-utilisateur-2026-09-25/18462.jpg) | Comparaison utile, mais référence dans les labels et colonnes serrées. |
| [18458](levure-revue-utilisateur-2026-09-25/18458.jpg) | Changement de cible affiché avec FG et alcool inchangés ; ne prouve pas seul un calcul erroné. |
| [18461](levure-revue-utilisateur-2026-09-25/18461.jpg) | Fiche IA avec atténuation 78–82 %, tolérance 9–11 %, dose 50–80 g/hL ; champ unique « Atténuation connue » vide sous la fiche. Vérifier la cohérence édition/valeurs retenues. |
| [18457](levure-revue-utilisateur-2026-09-25/18457.jpg) | Objectif « Finale sèche », action « Proposer une conduite », essai S-189 avec primaire à 25 °C ; petit graphe et explications longues. La capture ne démontre pas que le bouton a été actionné. |
| [18453](levure-revue-utilisateur-2026-09-25/18453.jpg) | Décision chargée, avertissement de potentiel manquant sans ingrédient nommé, données d'ensemencement à revalider loin du choix. Le contexte/version de cette capture reste à identifier. |
| [18459](levure-revue-utilisateur-2026-09-25/18459.jpg) | « Ce que je veux obtenir / Définir ma cible » après la décision, puis quantité et forme en bas : vérifier le doublon de cible et rapprocher la quantité du parcours de base. |
| [18454](levure-revue-utilisateur-2026-09-25/18454.jpg) | Résumé recette/brouillon et conduite avant « garder ou comparer » ; recherche IA sur American Ale. Ici les deux identités diffèrent : conserver un accès aux écarts utiles sans imposer ce résumé permanent. |

Compléments issus de ces captures : l'objectif apparaît à plusieurs endroits
(« Objectif de fermentation » et « Ce que je veux obtenir »). Vérifier si les
champs commandent réellement la même intention ; unifier leur source et leur
accès si c'est le cas, expliquer leur différence métier sinon. Les alertes de
donnée manquante doivent identifier ce qui manque et permettre de rejoindre sa
correction, sans ajouter une seconde saisie concurrente. Garder la dose fabricant
avec ses conditions distincte de la quantité prévue et d'un conseil de pitch.

Les doublons S-04, les présélections et l'absence de réaction sont des signalements
à reproduire ; une capture seule n'en établit pas la cause.

## Diversité des preuves — demande du 27 septembre

Les preuves visuelles centrées sur 3068/M20/3638 ne suffisent pas à représenter
le parcours complet. Élargir les scénarios métier et les captures réelles, sans
tester chaque souche/style ni créer de nouvelles options produit à partir d'exemples.

- Choisir un petit échantillon discriminant dans les données existantes : ales
  houblonnées, bières fortes, fermentation froide, profils fortement atténuants,
  cultures acidifiantes/mixtes et voie NOLO. Ces familles illustrent l'étendue
  recherchée ; elles ne forment ni un catalogue fermé ni des règles de brassage.
  Les propriétés documentées de chaque souche gouvernent ses capacités, pas le
  seul nom du style. Une capacité inconnue ou non prise en charge reste explicite.
- Faire varier ce qui change le parcours : sèche/liquide/autre forme documentée,
  stock/lot/catalogue/saisie libre, fiche riche/incomplète/contradictoire, plage/
  point/borne/catégorie, programme court/multipalier/partiel, recette vierge ou
  déjà enregistrée. Croiser ces dimensions intelligemment dans les mêmes scénarios,
  sans produit cartésien et sans refaire les tests équivalents.
- Définir avant l'essai la décision du brasseur et le résultat attendu. Un changement
  de nom ou de chiffres sur le même scénario ne démontre pas une nouvelle couverture.
  Prévoir des propositions réellement justifiées et des maintiens/inconnues légitimes.
- Réutiliser une Luna ou un relecteur existant pour choisir au moins un scénario
  pertinent absent du brief de réalisation. Lire les faits disponibles ; ne pas
  inventer une aptitude, une disponibilité commerciale ou un protocole pour la fixture.
- Les captures doivent montrer les vrais écrans de ces scénarios, au moment de la
  décision ou du geste différent : entrée vide, choix direct, comparaison, conduite
  et révision IA selon le risque. Conserver le mobile/desktop représentatif sans
  imposer toutes les combinaisons ; ouvrir et examiner les images produites.
- Présenter une synthèse courte dans le registre existant : scénario, propriétés,
  résultat attendu, observation et lien de preuve. Réutiliser les anciennes preuves
  pour ce qu'elles couvrent ; ne pas les présenter comme validation des nouveaux cas.

Étendre ainsi les vérifications des lots en cours, sans nouvelle recherche générale,
nouvel agent automatique ou nouvelle campagne d'appels IA réels.

## Appels IA réels — autorisation ciblée du 26 septembre

L'utilisateur autorise **quelques appels réels aux fonctionnalités IA de
l'application**, pour essayer et confirmer les parcours concernés, y compris
hors autocomplétion. Cette autorisation complète les validations avec mocks ;
elle ne remplace pas les tests déterministes ni les restrictions sur les données
réelles et le déploiement. Elle lève, pour ces essais ciblés uniquement, les
anciennes consignes « aucun appel IA réel » des briefs de cette mission.

- Garder les tests unitaires, d'intégration, de régression et la CI sur mocks ou
  fixtures : aucun appel IA facturé requis à chaque lancement, build, capture,
  modification ou contrôle périodique. Un éventuel essai réel doit être explicite,
  séparé, désactivé par défaut et jamais branché sur la suite automatique courante.
- Choisir des essais qui lèvent une incertitude réelle d'intégration. Utiliser les
  connexions et fonctionnalités déjà configurées ; aucun achat de crédits, reset
  ou basculement des agents Claude/Codex vers une API payante n'est autorisé ici.
- Avant un essai : préciser ce qu'il doit vérifier. Conserver sa réponse utile,
  le résultat observé et les limites, sans secret ni données réelles à modifier.
  Réutiliser cette preuve lorsque le parcours et son contrat n'ont pas changé.
- Si une erreur est trouvée, plusieurs tours correction → essai ciblé sont permis,
  tant que chacun répond à un défaut précis et apporte une information nouvelle.
  Pas de répétition identique, balayage de variantes ni essais à volonté. Une
  démonstration réussie ne déclenche pas une nouvelle série « pour confirmer ».
- Après correction, transformer le défaut en régression déterministe avec une
  fixture adaptée quand c'est pertinent. Ne pas rejouer l'appel réel à chaque test.
- Tenir un décompte léger des appels réels et leur motif dans le registre existant ;
  distinguer déclenchements applicatifs et éventuelles reprises fournisseur visibles.
  Si une campagne plus large devient nécessaire, présenter le besoin et demander
  une extension avant de dépasser cette autorisation de quelques appels.

Cette autorisation couvre les points IA utiles du goal complet ; elle ne donne
aucune priorité exclusive à l'autocomplétion ni aux exemples cités par l'utilisateur.

## Exécution, quota et validation

- Lire cette revue, l'état actuel du registre de release et les seuls contrats
  nécessaires. Préserver les modifications des autres tâches. Ne pas repartir
  sur des comptes rendus historiques déjà dépassés.
- Claude Pro Opus 5.5 xhigh prend des lots cohérents de diagnostic, réalisation et
  tests avec ownership de fichiers, outils autorisés et contexte ciblé ; un seul
  Claude actif. Sol conserve intégration et contrôle indépendant proportionné.
  OpenAI est bas : pas de nouveaux audits/agents systématiques, ni de remplissage
  du quota Claude. Conserver son travail partiel et ses limites s'il s'arrête.
- Les exemples commerciaux et styles servent de reproduction, pas de périmètre.
  Employer `conception-generique` côté OpenAI ; transmettre à Claude les exigences
  métier et les preuves, sans importer les instructions internes OpenAI.
- Vérifier le parcours réel sur un mobile et un desktop représentatifs, avec
  interaction tactile pour le graphe et la comparaison. Les contrôles portent
  sur compréhension, trouvabilité, utilité et fiabilité, pas seulement le viewport.
- Réutiliser les tests pertinents, ajouter les invariants/cas limites nécessaires ;
  pas un test par levure/style ni une multiplication automatique des captures.
- Refuser une livraison si la sélection reste imposée comme comparaison, si la
  recherche exclut des références sans raison intelligible, si une proposition
  annoncée ne modifie rien sans explication, si les données sont perdues ou si
  les doublons et commandes noyées empêchent toujours le parcours demandé.
- Au relais, mettre à jour pour chaque section : **ouvert / reproduit / corrigé
  localement / vérifié / publié**, commit, preuves et limites. Aucun point n'est
  clos par cette rédaction. Conserver cette revue et ses images dans Git pour la
  prochaine session ; indexer ce fichier dans le registre de mission existant.

### Continuité en cas d'épuisement du quota

Au contrôle du 25 septembre, l'outil de compte Codex indique **95 % du quota
hebdomadaire consommés, 5 % restants**, reset `1790500026` (Unix). Cette mesure
est datée, à ne pas traiter comme disponibilité actuelle lors d'une reprise.

Avant de poursuivre un lot coûteux, le pilote doit rendre l'état de reprise du
registre de release immédiatement exploitable : branche/HEAD, modifications à
préserver, lot et fichiers confiés, Claude actif ou terminé avec identifiants
observables, chemins du brief/progression/résultat/récupération, preuves exécutées,
travail non vérifié et prochaine action concrète. Conserver les artefacts utiles
dans le dépôt, pas uniquement dans TEMP ou la conversation ; ne conserver aucun
secret d'authentification. Sauvegarder les changements partiels sans les déclarer
validés. Le repreneur vérifie l'état de Claude avant tout nouveau lancement pour
éviter deux agents écrivant les mêmes fichiers.

La revue et ses dix images sont déjà committées (`57e6550`). Le pilote doit aussi
committer sa passation et ses résultats appropriés sans inclure les modifications
tierces. Une nouvelle session relit ces fichiers ; elle ne constitue pas une
réinitialisation du quota du compte. Ne pas dépendre exclusivement d'un réveil
automatisé pour reprendre quand ce quota est épuisé. Un crédit de reset éventuel
ne doit être utilisé qu'après une demande explicite de l'utilisateur.

### Prompt de reprise

> Lis AGENTS.md, puis docs/validation/levure-revue-utilisateur-2026-09-25.md et
> l'état courant de docs/validation/ux-mobile-poc-release-2026-09-25.md. Reprends
> les écarts encore ouverts du parcours Levure, sans refaire les corrections
> déjà prouvées. Respecte la différence entre exemple et règle générique.
> Confie les lots utiles à Claude via le pont Pro existant et garde un contrôle
> indépendant proportionné. Conserve les preuves et l'état de reprise ; ne
> déploie pas ces nouvelles corrections sans autorisation correspondante.
