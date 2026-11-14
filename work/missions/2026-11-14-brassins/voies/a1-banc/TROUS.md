# Trous fonctionnels — brassins, fiche, suivi de fermentation (voie a1, 14.11)

Base : code du worktree et banc `banc.mjs` (fixtures ZZ, captures dans `captures/`). « Atteint » = joué dans le banc par un vrai geste depuis la liste.

## Existe

| Fonction | Où (fichier:ligne) | Atteint par un vrai parcours ? |
|---|---|---|
| Liste des brassins, carte par état (J+n, dernière densité, « Voir les mesures ») | `src/ui/production/CatalogCards.tsx:219-367`, `ProductionCatalog.tsx` | Oui : onglet Brassins, carte → fiche. Le filtre global « Période : Ce mois » (`App.tsx:171`, défaut `this-month`) CACHE les brassins brassés avant le mois : 3 sur 5 invisibles à l'ouverture (`liste-periode-defaut-*`). |
| Fiche d'un brassin (feuille, trois rubriques Mesures / Carnet / Dossier) | `src/ui/BatchDetailSheet.tsx:176-468` | Oui, 5 états joués (`fiche-*`). |
| Relevé de densité (date, SG, température facultative) | `src/ui/production/BatchGravityEntry.tsx:23-160` ; branché `BatchDetailSheet.tsx:381-387` (fermentation et garde seulement) | Oui : `saisie-releve-*`, `saisie-apres-releve-*` (compteur 4 → 5, « Relevé ajouté au suivi »). Valeur 1,500 refusée avec message (`releve-densite-erreur`). |
| Température | Seulement la température FACULTATIVE d'un relevé de densité (`BatchGravityEntry.tsx:117-127`) ; `tempC` du levurage affiché en une ligne (`BatchDetailSheet.tsx:408`). `FermentationTemperatureChart.tsx` trace la conduite de la RECETTE (`etapeLevure/Conduite.tsx:19`, `BrewWizard.tsx:3004`), jamais celle du brassin. | Température seule : non. Graphe de température sur la fiche : non. |
| Dry hop | Recette : `HopIngredient.stage 'dryHop'` + `dayOffset` (`types/index.ts:194-207`) ; g/L à cru sur la carte recette (`CatalogCards.tsx:94,167`). Brassin : seulement les « ajouts réservés » du stock (`BatchDetailSheet.tsx:226-234`, bouton « Confirmer les ajouts de fermentation », confirmation `:492-501`). | Oui pour la réservation et le déstockage (`fiche-fermentation`). Aucune date d'ajout, aucun J+6, aucun écran « j'ajoute le dry hop ». |
| Passage d'étape (fermentation → garde → conditionné → terminé, retours, abandon) | `src/domain/batchTransitions.ts:21-77` ; bouton et liste `BatchDetailSheet.tsx:258-275` ; confirmation de retour `:486-491` | Oui : `saisie-cloture-*`, `saisie-retour-arriere-confirmation`. Pas de « transfert » de cuve à cuve ; seul le conflit de fermenteur est dit (`:243-246`). |
| Mise en bouteille ou en fût | `BatchPackagingForm.tsx:16-52` : volume conditionné + date seulement. Le champ `packaging.bottles33 / bottles75 / kegIds` (`types/index.ts:640-644`) n'est lu ni écrit nulle part dans `src` ni `functions/src` (grep). Le fût se relie côté fût (`KegSheet.tsx:64-72`, `keg.batchRef`). | Oui pour volume et date (`saisie-conditionnement-*`) ; nombre de bouteilles et fût du brassin : non. |
| Clôture | « Passer en « Terminé » » (`BatchDetailSheet.tsx:258-266`) ; FG (`:323-340`) ; notes du Carnet (`:413-447`) | Oui : `saisie-cloture-*`, `saisie-fg-*` (FG 1,080 > OG refusée, message). |
| ABV et atténuation | ABV : `abvFromGravities` (`domain/gravityBounds.ts:82-88`), écrit à la sortie du champ FG (`BatchDetailSheet.tsx:168-170`), montré `:356-360`. Atténuation apparente : `fermentationReadings.ts:51-54`, montrée sous la courbe (`FermentationCurveChart.tsx:112-113`). | Oui (`saisie-fg-abv-calcule`, `saisie-apres-releve` : 77 %). Atténuation calculée sur le DERNIER relevé, pas sur la FG confirmée. |
| Graphe | `src/components/charts/FermentationCurveChart.tsx:17-120` : densité par rang de relevé, ligne « FG cible », détail « Voir les relevés » | Oui. L'abscisse est « Relevé 1, 2… », pas des jours : deux relevés à 1 et à 4 jours d'écart sont équidistants. Pas de température sur le graphe. |
| Historique | Courbe + détail des relevés ; Carnet à trois champs libres (`BatchDetailSheet.tsx:418-443`) ; `HopTastingsPanel` | Oui. Pas de journal daté des gestes (changement d'étape, ajout, transfert). |
| Rappel | `src/services/brewAlarms.ts` et `BrewAlarmSettings.tsx` : alarmes du JOUR de brassage seulement | Aucun rappel de fermentation (relevé du jour, dry hop, fin de fermentation, sortie de garde). |

## Manque

En brasseur, une ligne chacun (priorité 1 = bloque le suivi, 3 = confort).

1. (P1) Relevé à partir de la fiche ou de la carte en un geste, au curseur sur l'échelle cible (ses mots 10.11) : aujourd'hui trois champs texte (date, SG, °C) dans une feuille longue, au clavier.
2. (P1) Abscisse en jours depuis le levurage (J+0 … J+n), pas en « Relevé n » : sans elle la courbe ne dit pas la vitesse de la fermentation.
3. (P1) Température de fermentation du brassin : relevé et graphe sous la courbe de densité, avec la consigne de la recette (`recipeSnapshot.fermentation`, par exemple 19 °C) en repère ; aujourd'hui la consigne n'apparaît nulle part sur la fiche.
4. (P1) Dry hop daté : « prévu J+6, 180 g » sur la fiche et la carte, bouton « ajouté aujourd'hui » qui date le geste et confirme le stock ; aujourd'hui une ligne « ZZ-HOP-ARO · 180 g » dans un bandeau d'avertissement ambre.
5. (P1) Densité stable : dire « 1,014 depuis deux relevés à 24 h : fermentation finie ? » et proposer FG + garde ou conditionnement ; rien ne détecte la stabilité.
6. (P1) Rappel du prochain geste (relevé du jour, dry hop J+6, fin prévue) : aucun rappel hors du jour de brassage.
7. (P2) Mise en bouteilles et en fûts réelle : nombre de 33 cl et de 75 cl, fûts remplis, carbonatation (`carbonation` du type, jamais saisie) ; aujourd'hui un volume et une date.
8. (P2) Filtre « Période : Ce mois » par défaut : un brassin en garde depuis 18 jours disparaît de la liste (constaté au banc). Les brassins actifs devraient toujours s'y montrer.
9. (P2) Carte « fermentation » : montrer la tendance (dernière SG, atténuation en %, FG visée) et le prochain geste ; elle montre « Densité 1,018 · J+4 » et « Voir les mesures ».
10. (P2) Atténuation et ABV pendant la fermentation : « 77 % » existe en bas de la courbe seulement ; l'alcool provisoire (OG et dernière SG) n'est pas montré.
11. (P2) Bandeau de stock en tête de la fiche : il passe avant la saisie des mesures (rang 1 de l'écran) alors que le brasseur vient mesurer.
12. (P3) Journal daté des événements (levurage, ajouts, changements d'étape, transfert, mise en fût) dans la fiche.
13. (P3) Température de garde froide et durée visée ; la rubrique Dossier porte le changement d'étape et la suppression, loin de la saisie.
14. (P3) Durée écoulée : la carte dit « J+4 » pour un brassin levuré il y a 5 jours à 18 h le matin même (arrondi par le bas, `daysSincePitch`) ; vérifier que c'est voulu.

## Raccord jour de brassage

Fin du jour (`src/pages/BrewDayPage.tsx:1736-1760`, `onFinish`) : le brassin reçoit
- `status: 'fermentation'` (`:1759`) ;
- `og` mesurée à la fin du jour (`finalBrewReadings`, `.toFixed(3)`) et `volumeBrewedL` (`:1756-1758`) ;
- `brewDay` complet (relevés, étapes, `pitchedAt`, `pitchTemperatureC`, `pitchQuantityConfirmation`, ajouts) et le patch de date de brassage (`brewSessionDatePatch`) ;
- `yeastPreparation` passée à « transférée » si le starter est transféré (`:1746-1751`).

La fiche en montre : « Brassé le … » (`BatchSchedule.tsx`), OG dans son champ, volume brassé, « Levure ajoutée le … à 19 °C » (`BatchDetailSheet.tsx:408`), les ajouts réservés (dry hop) du stock, un tableau « Ce brassin · mon installation » (`BrewSystemFeedback`, vu 0 / 6 résultats sur la fixture). La carte de la liste en tire « J+n » et « Volume en cuve ».

La fiche n'en montre pas, alors que le brasseur vient de le fixer : la température de fermentation prévue (`recipeSnapshot.fermentation`), la date et la dose du dry hop prévu (`dayOffset`), la FG cible hors du champ vide, une prochaine étape datée. La température de levurage n'entre pas dans la courbe. Si la FG n'est pas attendue : le jour finit sans rappel de ce qui suit.

Limite du banc : les fixtures ne rejouent pas la fin du jour (`BrewDayPage` est hors périmètre) ; l'état « fermentation » est posé directement avec les champs listés ci-dessus.
