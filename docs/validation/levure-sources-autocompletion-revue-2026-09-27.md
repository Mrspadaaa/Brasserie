# Revue utilisateur — sources lisibles et complétion Levure complète

Reçue le 27 septembre 2026. Pilote destinataire : Sol
01a0e37a-f9ca-7603-b336-68aa82d4b312, refonte complète Levure.
Cette revue complète la mission ; elle ne remplace pas les lots déjà engagés.
Pas d'implémentation produit ni d'appel IA applicatif par le contrôleur.

## Instruction prioritaire : généraliser le besoin et son étendue

S-04, la floculation et les phénols sont des cas témoins, pas le périmètre ni
une liste fermée de champs. Ne pas créer de règle par souche, fournisseur ou style
sans justification métier. Examiner toute la chaîne et tous les blocs concernés,
en réutilisant les contrats et preuves acquis. Tous les blocs doivent être examinés ;
tous ne doivent pas changer. Ne pas rouvrir une refonte globale du reste de l'app.

## Observations, hypothèses et version

- [Capture18553](./levure-sources-autocompletion-revue-2026-09-27/18553-fiche-s04.jpg) : fiche SafAle S-04 après
  complétion/adoption ; plusieurs données présentes, mais « Floculation — Non
  renseignée ». L'utilisateur confirme que c'est un défaut concret à reproduire.
- [Capture18554](./levure-sources-autocompletion-revue-2026-09-27/18554-references-observations.jpg) : bloc de différences
  avec notes/source/observations et longues répétitions d'URL, titres et timestamps,
  au détriment de la compréhension. Le contenu visible mentionne US-05 : les deux
  captures ne prouvent PAS une confusion d'identité entre S-04 et US-05.
- L'utilisateur signale aussi des informations métier utiles non reprises ou sans
  contrôle exploitable. Les phénols en sont un exemple, pas une demande isolée.
- Traduction, lecture de pages ou extraction défaillante sont des hypothèses, pas
  des causes établies. Identifier la version publiée réellement concernée et
  vérifier le parcours équivalent sur la branche actuelle avant d'annoncer un fix.

Vérification documentaire légère du contrôleur : la [page Fermentis indiquée](https://fermentis.com/en/product/safale-s%E2%80%9104/)
contient une description qualitative du pouvoir de floculation et des rubriques
POF, esters et alcools supérieurs. Le rendu textuel consulté expose les intitulés
de l'aperçu sans toutes leurs valeurs : piste de contenu non repris par une
extraction textuelle, pas preuve que Gemini suit ce même mécanisme. Aucun statut
POF ni catégorie de floculation n'est inventé par cette revue.

## S1 — Références utiles, lisibles et reliées aux faits

Résultat : le brasseur voit d'abord la donnée ou le changement utile ; il peut
comprendre sa provenance et ouvrir le document précis au moment voulu.
Examiner fiche, proposition IA, conflits, comparaison, différences avant adoption,
récapitulatif et états après sauvegarde. Une seule correction du pavé photographié
ne ferme pas le défaut si les mêmes répétitions existent ailleurs.

- Regrouper une source commune sans répéter l'URL brute à chaque observation.
  Garder le rattachement de chaque fait à sa source, les sources divergentes,
  conditions, dates et extraits utiles accessibles à la demande.
- Remplacer les dumps de métadonnées/objets sérialisés par des changements lisibles
  avec libellés, valeurs, unités et qualifications. Garder le détail documentaire.
- Distinguer duplication inutile et référence supplémentaire réellement utile.
  Ne pas supprimer les données, leur traçabilité ou tous les liens pour alléger.
- La traduction de l'interface ne remplace ni la source originale ni son sens.
  Le choix de présentation reste ouvert à Claude ; pas de plafond arbitraire de liens.

## S2 — Une bonne URL doit mener à des données réellement utilisables

Tracer sur une réponse enregistrée : document trouvé → contenu réellement lu →
faits extraits → normalisation/traduction → validation → proposition → adoption →
champs/détails → sauvegarde/réouverture/transports. Localiser la perte ou le refus,
ne pas confondre un résultat de recherche avec la lecture de la fiche.

- Examiner textes, tableaux et informations portées par documents liés ou rendus
  non textuels quand ils sont nécessaires. Langue et variation d'URL ne doivent
  pas faire disparaître un fait documenté ni mélanger des produits/versions.
- Préserver valeurs exactes, unités, plages, bornes, négations, catégories,
  descriptions qualitatives et conditions. Ne pas déduire une catégorie absente
  d'un phénomène voisin (par exemple sédimentation et floculation).
- Si une description utile est disponible sans catégorie normalisée, la conserver
  et la rendre accessible au bon endroit ; ne pas laisser croire que rien n'est
  connu. Si le fabricant ne publie réellement rien, conserver l'inconnu.
- Distinguer information absente de la source, extraction échouée, conflit,
  incompatibilité, fait non représentable, fait trouvé mais non adopté, et
  information retenue mais non affichée. Diagnostic précis dans les preuves ;
  explication utilisateur seulement si elle l'aide à décider ou corriger.
- Préserver validation simple du cas standard et traitement séparé des conflits,
  données manuelles, identité/révision et refus des réponses périmées.

## S3 — Couverture des connaissances utiles, pas ajout du seul champ « phénols »

Inventorier les informations documentées utiles pour choisir/comparer une levure,
comprendre son comportement et ses limites, conduire la fermentation et préparer
l'ensemencement. Classer selon utilité, représentation, source et conditions.
Les familles données qualitatives, capacités, paramètres physiques et procédés
sont des angles d'examen, pas une liste fermée d'options produit.

Le modèle actuel dispose déjà de clés pof, esters, higherAlcohols, pitchRate
(dosage/ensemencement) et d'autres
faits dans functions/src/yeastCatalogueSchema.ts ; le dossier expose surtout
quelques champs retenus et une liste d'observations. L'absence d'un champ visible
ne prouve pas l'absence de stockage. Vérifier ce qui manque à l'extraction,
la normalisation, l'adoption, l'édition, la lecture métier ou au transport.
Réutiliser/étendre les types existants seulement lorsque le besoin l'exige,
sans nouveau moteur documentaire universel ni formulaire interminable.

Précision utilisateur : le dosage est déjà en cours de refonte dans le lot
ensemencement/pitching. Cette revue ne crée pas un chantier supplémentaire et ne
le reclasse pas comme absent. Vérifier avec son owner que la dose documentée,
ses unités, plages et conditions arrivent jusqu'au conseil et au choix de quantité,
puis restent fidèles après sauvegarde. Distinguer ce qui existe, ce qui est en
traitement et ce qui reste réellement manquant ; réutiliser les preuves du lot.

Une donnée nouvelle pertinente doit pouvoir être retrouvée, comprise et corrigée
manuellement/avec IA dans sa bonne portée, puis conservée après sauvegarde et
réouverture. Une description d'arôme n'est pas un score sensoriel calculé.

## Critères de refus et preuves proportionnées

Refus si une URL correcte est présentée comme complétion réussie alors que des
faits utiles documentés sont perdus sans explication ; si un fait retenu reste
inaccessible ou paraît inconnu ; si l'écran expose des répétitions techniques
à la place de la décision ; si seule S-04/le champ cité bénéficie du correctif.

Dans le registre existant, conserver une couverture compacte par zone/famille :
constat, cause établie ou ouverte, décision, owner, preuve restante. Couvrir les
blocs et états pertinents sans recontrôler tout le produit à chaque passage.

Réutiliser les deux captures et une réponse/page sauvegardée comme fixtures.
Ajouter un petit nombre de cas discriminants d'un autre fabricant/format/langue
ou mode de représentation, et un cas réellement absent ou contradictoire.
Choisir ces cas selon la cause trouvée, pas une campagne par style/souche.
Vérifier le parcours complet source→proposition→adoption/correction→sauvegarde→
réouverture, la provenance et les contrats manuels, plus un mobile/un desktop.
Aucune IA réelle en CI ou tests automatiques. Quelques appels réels seulement
selon l'autorisation et le besoin concret, avec motif/décompte et réutilisation.

## Répartition et continuité

Sol garde les raccords et l'intégration ; Luna peut localiser extraction/mapping/
transports et les vérifier indépendamment. Claude traite le lot de présentation
et d'interaction utile à partir des captures et données exactes. Astra intervient
sur une ambiguïté structurante nouvelle, sans double expertise rituelle.
Réutiliser les agents/owners et artefacts actuels, intégrer cette revue aux lots
existants plutôt que lancer trois chantiers concurrents. Si Claude nécessaire
est bloqué par son quota : tâche en pause, passation sauvegardée et réveil unique
au reset confirmé, conformément à la demande utilisateur.
