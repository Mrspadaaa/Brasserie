# Refonte Levure — disponibilité, choix, fermentation et ensemencement

## Départ de la future session

Reprendre **poc publiée, base fonctionnelle « main v2 »**, sur `codex/levure-refonte`.
Le commit de base/passation exact est dans
[le registre](../validation/levure-refonte-preparation-2026-09-27.md).
Ne pas repartir de main, renommer/forcer main, rejouer la reprise Git ou refaire
les acquis. Constater branche/HEAD/diff et préserver les travaux présents.

Lire AGENTS.md, docs/openai-setup.md, cette mission et le registre, puis les
sections utiles de PRODUCT.md, DESIGN.md et docs/ui-compacte.md. Les rôles/profils
actuels sont canoniques : ne pas les recopier ni utiliser les anciens chiffres
Astra272000. Sol Max pilote ; Astra Max intervient dès la conception structurante
via astra-review. Luna possède une investigation indépendante utile si nécessaire.
Claude Pro Opus5.5 xhigh peut réaliser un lot frontend cohérent sur copies ; Sol
rend, joue et valide l'intégration. Pas d'appel pour quota, second Sol ou reprise
d'expertise en boucle. CLAUDE.md/.claude ne sont pas des instructions OpenAI.

Cette ancienne session livre seulement publication et préparation. La nouvelle
session consigne critères, owners, avis, décisions, preuves et état de reprise
dans le registre propre à la refonte. Aucune publication future ni essai sur données
réelles n'est autorisé implicitement ; utiliser fixtures/émulateurs.

## Résultat et périmètre complet

Trouver/saisir sa levure immédiatement, comprendre ses possibilités dans la recette,
son approvisionnement, la dose et la préparation requise, choisir volontairement,
enregistrer et retrouver ces décisions. Comparaison et objectif facultatifs.
Choix direct dans le brouillon ; essai de conduite séparé jusqu'à son application
explicite. Recette incomplète utilisable, hors ligne et brassin lancé figé.

### Disponibilité et formats réellement achetables

Séparer référence technique/souche, produit et variante de conditionnement, offre
vendeur/observation datée, article/lot détenu. Petits sachets secs autour de 11–12 g
et petits packs liquides, sans imposer12g ou supposer un format depuis une souche.
Priorité de distribution **vérifiée** : Suisse, puis France/Allemagne au même rang,
puis Europe. Domaine vendeur/pays du labo ne prouvent ni stock ni livraison.
Statut annoncé, vérification, ancienneté, destination/conditions de livraison,
prix/devise/base de quantité et sources/dates restent distincts.
Références indisponibles/étrangères conservées pour reconnaître les recettes et
trouver des alternatives. Revoir le rapprochement nominal de pénurie quand aucune
association stock n'existe : décider sa portée historique avant généralisation.

### Recherche, choix et alternatives dans le même contexte

Préserver nom/code/labo/alias, lots/homonymes séparés, catalogue/stock/libre,
choix direct et Undo/Redo. L'approvisionnement ne crée pas une porte obligatoire.
Une alternative fonctionnelle n'est pas une preuve d'identité. Comparaison volontaire
avec référence fixe, données alignées, écarts discriminants, inconnus et sources
accessibles. Étendre les sorties seulement si calculables sous hypothèses communes.

### Possibilités et conduite de fermentation

Objectif facultatif, réglages applicables (température/pression/procédé), programme
de plusieurs phases et Paliers partagent les valeurs de la recette. Graphe : J0
et jours cumulés de changement ; création : durées. Zéro/inconnu distincts,
décalages visibles, précision, monoaxes, clavier/tactile et largeur mobile utiles.
Lager/NOLO/autres cultures par propriétés et conditions, pas une liste de presets
liée aux exemples. Guides actuels bornés, pas optimum universel. Pas de score
sensoriel0–100, cinétique, DF garantie ou durée biologique inventés. Préserver les
phases/capacités ; une phase retirée ne revient pas au changement de souche.

### Quantité, pitch rate, packs et préparation

Distinguer dose fabricant, estimation cellulaire applicable, quantité manuelle,
packs à acheter/ouvrir, surplus et quantité réellement ensemencée. Le conseil suit
volume à ensemencer, densité/°P et données produit/procédé ; ni style ni masse de
grains seuls. Une plage reste une plage de masse/packs, sans milieu automatique.
Une action applique le conseil sans écraser une quantité ou consommer un stock.

Conversions explicites g/kg,mL/L/hL,cellules,taux/°P et formats documentés. Grammes
ou volume de pack ne donnent pas les cellules sans données produit. Âge/date/
conservation/viabilité seulement si connus et justifiés ; modèle manquant → inconnu
ou calcul impossible, pas moyenne opaque. Ne pas réactiver BrewingMath.pitchRate.
Un pack prévu peut venir d'un format exact volontairement choisi, pas de la seule
identité ; «1prévu/3conseillés» est une représentation, pas une règle métier.

Starter seulement si produit/méthode/contexte le justifient, jamais automatique
pour le sec. Extrait de malt et maltodextrine ne sont pas un milieu équivalent.
Si retenu : plan enregistré (méthode/milieu/volume/étapes/échéances/matériel/statut),
correction/annulation, lien produit/lot/recette et révision, préparation avantJ0,
reprise/réalisation au brassage, prévu/réel distincts, snapshot et hors ligne.
Ne pas proposer le jour même une préparation devenue irréalisable.

### Gemini et correction durable dans la bonne portée

Préserver livre candidat et enveloppes catalogue/locales, valeurs typées, sources/
contexte/dates/notes, validation cohérente en un geste, exceptions indépendantes,
priorité manuelle, réponses obsolètes refusées, save/reopen et statut sync.
Compléter alternatives et correction de **valeurs DB existantes** : catalogue,
offres, stock/lot et recette. Propositions avec identité stable, champ/ancienne/
nouvelle valeur typés, raison, source/date/conditions, portée, révision attendue
et reçu. Relire avant écriture autorisée ; conflit/saisie récente non écrasés.
Suggestion/brouillon/attente sync ne sont pas une confirmation serveur.

URL localisée ≠ preuve factuelle ; racine seule d'un nouveau lookup ≠ fiche précise.
Adoption garde l'origine IA. Correction personnelle de valeur/type et correction
du lien seul sont distinctes : préserver brut/origine et tracer l'intervention.

### UX et contraintes transversales

Mobile d'abord et desktop : chaque donnée/action aide une décision à ce moment.
Aucun bloc n'a de place acquise ; ne refaire un acquis qu'avec bénéfice démontré.
Richesse/source accessible à la demande, outils visuels utiles, commandes près de
la décision, aucun panneau masquant les champs. Mesure/estimation/cible/document/
manque distincts. Préserver performances, hors ligne, transports/import-export,
unités, zoom/clavier/tactile, snapshots et NOLO. p95<200ms reste une cible à mesurer,
pas un résultat. Tests verts/viewport/captures seuls ne valident pas la refonte.

## Conception et preuve discriminante

Matrice d'audit du registre : acquis prouvé, manque/cassé, obsolète, décision ouverte.
Recherches24/09 (disponibilité,pitch,visualisations,code) datées, à réutiliser ;
offres non actuelles et carte antérieure aux corrections. Actualiser seulement
ce qui change une décision. Définir avec Astra frontières référence→produit/format
→offre datée→lot, puis conseil→prévu→préparation→réel. Les opérations/offres ne
vont pas dans le livre documentaire. Règles/inconnus avant choix coûteux, puis
conception avec Claude sur un lot utile et tranche réelle avant extension.

Tranche proposée : recette incomplète/référence sans offre locale confirmée →
retrouver → comparer volontairement alternative au format/offre documentés →
distinguer non-livrable et lot homonyme → choisir directement → garder quantité
manuelle → compléter volume/densité → comprendre/adopter conseil justifié →
régler conduite → save/reopen hors ligne. Bifurcation liquide/starter applicable :
préparation avantJ0→réalisation→snapshot figé. Correction concurrente refusée sans
perte. Choisir par propriétés hors des dernières fixtures, pas campagne par style.

## Vérification et livraison

Rapprocher demande/critères/contrats/avis/actions, tests capables d'échouer et
parcours réel. Ouvrir/examiner390×844 et1280×900 ; recherche/choix/correction/retour/
annulation/application selon l'action, save/reopen, clavier/tactile/hors ligne.
Autre largeur seulement pour un défaut. Régressions identité/stock/source/unités/
recette incomplète/import-export/snapshot/NOLO et phases selon leurs propriétés.
Gates/build selon diff, pas répétition de campagne ou nombre d'appels comme objectif.
Essais IA réels opt-in hors tests normaux, budget autorisé, données publiques/fixtures.
Bilan : réalisé/prouvé, choix humains/limites, branches/commits/rendus complets et
prochaine action concrète. Le déploiement de la base n'autorise pas la suite.
