---
name: brasserie-frontend
description: Concevoir, réaliser ou évaluer les interfaces de L'Affinée selon les usages du brasseur et les contraintes mobiles.
---

# Frontend de L'Affinée

## Critères de conception et d'examen

Lire les sections pertinentes de PRODUCT.md, DESIGN.md et docs/ui-compacte.md
depuis la racine du dépôt.
Partir de la décision, du réglage ou du constat que le brasseur doit effectuer.
Inventorier l'information utile et ses sources avant de la réorganiser.
En refonte, aucune position ni aucun composant existant n'est acquis. Pour chaque
champ, sortie et action, préciser : décision du brasseur, utilité maintenant,
moment d'affichage, emplacement, visibilité immédiate ou à la demande, contrôle,
représentation, meilleure alternative examinée et preuve dans le parcours.
Un champ secondaire peut être différé ; conserver son accès et sa valeur.
Appliquer la section « Généraliser sans suradapter aux exemples » d'AGENTS.md :
une fixture ne devient pas une option produit ou une référence fixe. Concevoir
les commandes selon les propriétés et décisions utiles ; éprouver le parcours
avec un cas hors fixtures, sans ajouter une interface par style ou recette.

Pour une refonte majeure ou un essai explicite d'audace, appliquer la section
« Explorer une refonte et reconnaître la prise de risque » de
`docs/ui-compacte.md` : deux directions visuelles avant l'intégration, critères
E1/E2/E3 avec preuves, puis décision distincte sur la qualité à livrer.
Une retouche ponctuelle ne déclenche pas ce dispositif. Préserver les exigences
d'usage explicites même quand l'organisation visuelle est remise en question.

Rechercher activement des moyens de compréhension au-delà du texte : les
« boosters UX/UI » sont un résultat positif de conception et de revue.
Le choix des représentations et interactions est ouvert. Réutiliser l'existant
s'il convient ; créer ou intégrer un outil quand son bénéfice justifie son coût
de maintenance, sa consommation de ressources et son accessibilité.

Pour un choix important, confronter les approches plausibles et vérifier les
outils existants ou externes dans leur documentation actuelle. Éprouver les
incertitudes par un prototype représentatif avant de valider un choix qui en
dépend. En consultation, préciser l'essai à confier à Sol s'il exige une réalisation.
Le catalogue du dépôt est un point de départ, pas une limite de recherche.
Séparer choix de représentation et choix de bibliothèque. Ne pas quantifier un
effet qualitatif pour rendre possible un graphique.

Conserver les informations métier pertinentes, les valeurs exactes, unités,
sources, conditions et incertitudes. Rapprocher réglage et conséquence. Garder
les rappels utiles s'ils partagent la même donnée. Justifier une suppression
par une erreur, une obsolescence ou une duplication sans utilité.

Adapter la densité à la tâche et à l'échelle du projet. Réduire systématiquement
les tailles, tout déplier ou tout masquer ne prouve pas une amélioration.
La représentation choisie doit préserver clavier, zoom, libellés et accès aux
valeurs exactes ; la couleur seule ne porte pas une information.

## Consultation

Rendre un avis exploitable : décision recommandée, solution concrète, preuves,
conditions et limites. Examiner les écrans, captures et parcours disponibles
dans le périmètre autorisé ; distinguer observations et propositions. L'absence
d'un prototype n'empêche pas le conseil, mais laisse sa validation d'usage ouverte.
Identifier les vérifications manquantes à confier à Sol. Valoriser les boosters
qui aident à comprendre et agir, sans prétendre à un bénéfice déjà observé.

## Réalisation et validation du parcours livré

Pour une délégation, transmettre ces exigences et pointer les sections métier,
design et composants concernés. Attribuer la propriété des fichiers. Les consignes de
l'autre fournisseur ne sont pas une entrée : partager seulement le besoin,
le code, les références produit et les preuves.

Ouvrir réellement l'écran avant et après. Examiner les captures sur un mobile
et un desktop représentatifs (390 et 1280 px par défaut) ; une largeur
supplémentaire répond à un défaut concret. Jouer le parcours avec saisie,
retour, erreur, sauvegarde et réouverture selon le changement. Employer les
outils navigateur disponibles,
les tests métier et les skills OpenAI disponibles :
`build-web-apps:react-best-practices` pour React et ses performances,
`build-web-apps:frontend-testing-debugging` pour le navigateur. Leur sélection
dépend du travail ; les consignes métier et visuelles du projet restent prioritaires.
Un build seul ne valide pas l'UX.

La revue valorise les boosters qui rendent les relations, choix ou conséquences
plus compréhensibles. Rapporter le bénéfice observé et les limites ; mesurer tout
gain chiffré. Pour une mission de réalisation UI, une proposition seule ne termine
pas la tâche.
Une revue de viewport ou une capture sans parcours ne suffit pas : le brasseur
doit pouvoir choisir, comprendre la conséquence d'un réglage et corriger son choix.
Transformer les exigences UI stables et mesurables en contrôles navigateur qui
peuvent refuser une régression. Vérifier ce que le brasseur voit et actionne,
pas seulement la présence d'un composant. Une référence visuelle mise à jour
ne justifie pas à elle seule la modification d'une exigence d'usage.
