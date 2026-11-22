# Voie UX/UI mobile — parcours réels du brasseur (15.11)

Sources : SPEC (09 au 15.11), BUGS « Recette en ligne 15.11 », code lu. Gains « estimés » : touchers comptés sur le code. Écrans choisis (`ecrans.json`) : leur maquette reste la base, les astuces s'y greffent. « Créer » et « Recettes » (Brassins) sont refusés : mini maquettes avant tout port.

| Parcours et ses mots | Frein concret | Astuces (genre) | Gain / risque |
|---|---|---|---|
| **1. Dépense, lignes → stock.** 09.11 : « quand je click sur l'unité, ça met 1 dans la quantité, 90 % du temps j'ai pas besoin de plus » ; 10.11 : « next pour aller à l'article suivant » | Chaque ligne : ouvrir, unité (`ExpenseSheet.tsx:1070`, cinq cases `Plateau.tsx:57` si non déductible), quantité. Facture de 29 lignes : ~3 touchers × 29. « Suivant › » (`:1242`) aide sans supprimer. | (a) **Historique** : unité et quantité apprises par article et fournisseur (`nomsAppris`, `purchaseEntry.ts:430`, apprend déjà les noms). (b) **Lot** : « Valider les lignes sûres », arrêt sur les rouges seulement. (c) **Plus tard** : enregistrer avec des lignes « à compléter ». | ~87 → ~10 touchers (estimé, 2/3 déduites). Risque : déduction prise pour lecture → jaune « déduit » (D277). |
| **2. Menu + .** 09.11 : « entrer une facture ouvre la bonne vue tandis que nouvelle écriture, non » ; 15.11 b1r : « certaines actions doivent toujours être possibles… toujours flottant » | Deux touchers (+ puis ligne) même pour l'action de l'écran ; groupes fixes (`FloatingActions.tsx:177-189`). | (a) **Un geste** : toucher = action de l'écran, appui long = menu complet. (b) **Historique** : dernière action en tête. | 2 → 1. Risque : action rare cachée → menu complet gardé. |
| **3. Période.** 15.11 : « l'interval de temps… on peut le régler à plusieurs endroits, attention » ; 10.11 : « je peux pas filtrer pour un intervalle précis » | Trois réglages indépendants : `Header.tsx:160`, `FinancesTab.tsx:173` (MonthStepper), `:435` (« Période de l'application »). | (a) **Valeur déduite** : plage globale (m3), les locales l'héritent, « héritée » marqué. (b) **Un geste** : puces 7 j / mois / trimestre. | 3 → 1 réglage. Risque : période locale écrasée → marquée, retour en 1 toucher. |
| **4. Créer une recette.** 15.11 : « Créer : aucune… ça résout aucune de mes problématiques » ; BUGS RL-8 : s'ouvre à l'étape 3/7, nom vide ; RL-1 : nom de levure ×3 ; RL-2 : deux réglages de quantité ; RL-3 : « dose à saisir » malgré 1 sachet | Sept étapes ; ressaisie de ce qui est connu (ensemencement réglé aux Paliers, « à définir » ensuite). | (a) **Historique** : cloner la dernière recette du style. (b) **Valeur déduite** : dose de levure depuis volume et plage fabricant (AM-22, existe), nom depuis style. (c) **Moins d'info** : une rangée Levure, un seul réglage. | ~15 → ~5 touchers (estimé). Risque : valeur reprise prise pour saisie → badge « reprise de ». |
| **5. Jour de brassage, mesures.** 10.11 : « utilise des slider plutôt que des input de chiffre sur téléphone » ; « Aides et repères » : alertes incomprises | `BrewDayMeasurements.tsx` : sans cible, ni curseur ni champ lisible (m2 choisie). | (a) **Un geste** : curseur posé sur la dernière mesure ou la cible. (b) **Moins d'info** : une alerte = une phrase + une action. (c) **Plus tard** : « à relever », jamais bloquant. | Clavier ~5 → 1 à 2 touchers. Risque : cible prise pour mesure → n'écrit qu'au toucher, jamais 0. |
| **6. Besoin → devis → achat.** 15.11 : « je crée un besoin envie. Je cherche prix ou demande devis. Je scane devis ou achat, l'IA fait le lien et l'enlève de la Todo » ; « trop contraignant, pas intuitif » | Lien scan ↔ besoin absent en ligne (ticket #201). Mission « dossier de solutions » ouverte : ne pas refaire. | (a) **IA bon marché** (Flash-Lite, accordé) : rattache à l'enregistrement de la dépense. (b) **Plus tard** : un besoin = une ligne de texte. | Liaison manuelle → 0 ou 1. Risque : faux lien → proposition sous seuil. |
| **7. Fûts : laver, remplir.** 15.11 : « laver un fût fait baisser les consommables » | `KegBoard.tsx:69-86` : un toucher par état + feuille, un fût à la fois ; `updateKeg` (`storage.ts:929`) écrit état et journal, aucun effet stock. Choix l1/l2, R1, F2 déjà pris. | (a) **Lot** : plusieurs fûts, « Laver » en un geste. (b) **Cascade** (ci-dessous). | 2N → N+1 touchers. Risque : mauvais fût coché → récapitulatif. |

Aussi : « Atelier Houblons V5.5 : moi plus du tout » (15.11) : retirer l'entrée (`ProductionTab.tsx:241`). Non vérifié : stock « pas tout mes outils » (09.11).

## Cascade générique : événement → règles → effets → trace → annulation

**Déjà là** :
- `prepareBrewStockConsumption` (`brewStockConsumption.ts:38`) : plan pur `{stockUpdates, movements, issues}`, id `BREW-STOCK-<lot>-<étape>` donc idempotent. Limite : seul `kind: 'ingredient'` touche le stock (`brewBudget.ts:26`).
- `revertTransaction` (`storage.ts:568`) : relit les mouvements, refuse si consommé, écrit un mouvement inverse sans rien effacer.
- `updateKeg` : journal, aucun effet.

**Mécanisme** (aucun cas codé en dur) :
1. **Événement** `{id, type, sujet, quantités}`, publié par l'action ; l'id le rend idempotent.
2. **Règles réglables**, des données : `{quand: type + filtre sur le sujet, consomme: article ou catégorie, formule: fixe | par litre | par unité, active}`. Un écran de réglage les liste avec leur dernier effet.
3. **Moteur pur** `planifier(événement, règles, stocks)` : même forme que `BrewConsumptionPlan`, écrit avec l'action, atomiquement.
4. **Trace** : mouvements typés `effet` portant `eventId` et `ruleId` ; l'action dit « a aussi baissé : … », un toucher ouvre la règle.
5. **Annulation** : inverse tous les mouvements d'un `eventId` (`revertTransaction` généralisée), refus motivé si déjà consommé.

**Garde-fous** : règle sans quantité = aucun effet et une question, une fois (jamais 0) ; quantité « estimée » tant qu'elle n'est pas mesurée ; stock insuffisant : l'action passe, l'effet va en `issues`. Finances ou besoins : une règle, pas un cas.

**Ordre conseillé** : 1, cascade, 3, puis 4 (à montrer d'abord).
