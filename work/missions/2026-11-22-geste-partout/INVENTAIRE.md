# GESTE-DATE-PARTOUT — inventaire des choix de date et de période (22.11)

Règle : tout choix de date ou de période utilise la frise partagée au doigt (`DureeFenetre seule pas="jour"`, celle de la fiche v02), via `src/ui/ChoixDate.tsx`
(`ChoixDate` : un jour ; `ChoixInstant` : jour à la frise + heure tapée ; `ChoixMois` : un mois). Méthode : `grep` de `type="date|datetime-local|month|week"`,
`showPicker`, `role="slider"`, `<Curseur>` de jours, ‹ › de jour/semaine/mois dans `src/` (L05, L29) ; contrôle `scripts/agents/controle-geste-date.mjs`.
Colonne « Porté » : oui (écrit ce jour, tsc vert), banc (joué au doigt par son entrée sur un build, `scripts/parcours/geste-date.mjs`), non (raison).
Entrée = comment on atteint l'écran. Un seul thème, 390 tactile en profondeur, 1280 en simple contrôle (règle du brasseur, 22.11).

## A. Portés

| Fichier | Écran | Entrée | Date ou période | Porté |
|---|---|---|---|---|
| ui/production/fiche/PlannedDate.tsx + ui/BatchDetailSheet.tsx | Feuille d'un brassin planifié | Brassins > ligne du brassin > Reporter | jour de brassage (la réglette de 8 jours et ses ‹ › sont retirés ; « Était prévue le … » gardé ; Enregistrer garde sa date) | banc `brassin-fiche` |
| ui/DateField.tsx (→ 11 écrans) | Jour réellement brassé (BatchDetailSheet) ; Jour prévu (BrewScheduleField) ; Conditionnement (BatchPackagingForm, StageLadder) ; Remplissage / fût (KegFillSheet, KegSheet) ; Matériel (equipment/DetailEdit) ; Créatif (CreativeItemSheet) ; Budget de brassin (BrewBudgetSheet) ; DDM d'un lot de levure (StockDetailSheet) ; Achat, paiement, échéance (ExpenseSheet) | par leur écran | jour | oui (un composant : les ‹ › de mois et les sélecteurs sont retirés) |
| ui/finance/InvoiceSheet, MovementSheet, mouvement/ApportPoches, payer/PayerVirement, TransactionDetails, profil/ProfilEffets (jour du solde), prevision/PlanSheetC (paiement prévu, fin de répétition), bien/BienCuve (achat, mise en service, cession), vente/Caisse (date de la facture) | Finances et Vente | menu Finances / Caisse | jour | oui |
| ui/production/BatchGravityEntry, hopIndex/HopTastingsPanel, NoloPanel, YeastStarterEntry, YeastSupplyEntry (jour) | relevé de densité, dégustation, analyse d'eau, levure | par leur écran | jour | oui |
| ui/BrewIngredients, YeastPitchingPanel, YeastDbCorrectionsPanel, YeastSupplyEntry (relevé), hopV55/Observation*, ReferencePanel | ajout réel d'un houblon, ensemencement, observations de recherche | par leur écran | instant (jour à la frise, heure tapée) | oui (`ChoixInstant`) |
| hopV55/Catalogue (3 dates de source) | catalogue de recherche | Houblons > catalogue | jour | oui |
| finance/previsions/FicheEtiquette, profil/ProfilEffets (historique depuis), projet/ProjetPiste (×2) | mois de paiement, d'historique, de mise en service | par leur écran | mois (`ChoixMois`) | oui |
| ui/production/CatalogToolbar | Brassins > filtres > période personnalisée | filtres | du / au (deux `ChoixDate` bornés l'un par l'autre) | oui (voir DÉCISION : `FrisePeriode` plus fidèle) |

## B. Non portés, avec raison

| Fichier | Écran | Date ou période | Porté | Raison |
|---|---|---|---|---|
| components/periode/FrisePeriode.tsx | frise de période (Finances, Stocks…) | période | non | c'est la frise partagée ; ses champs « du / au » sont la saisie exacte à côté |
| ui/finance/operations/Bande.tsx | opérations | période | non | même frise de période ; `Frise.tsx` porte déjà le geste de la frise B (21.11) |
| ui/finance/operations/FriseArchives.tsx | archives | années, mois (poignée) | non | choisi par le brasseur (m1ar-c, 15.11), règle n° 1 ; geste propre au mois |
| ui/stock/ChiffreACommander.tsx | Stocks, pastille C | fenêtre « S49 · 6 sem. · Tout » | non | choisi (16.11) ; période en semaines, à confirmer par le pilote |
| ui/atelier/TodoTimeline.tsx | Atelier, « À faire » | date d'une tâche (perle sur le fil) | non | choisi (kd4, 15.11) ; fil du temps propre |
| hopIndex/maBiere/Frise.tsx, dryhopper, FermentationTemperatureChart, paliers/CourbeEmpatage, fermentescibles Plateau/Ligne | rails de recette | minutes, jours de fermentation (« J+3 »), masses | non | pas une date du calendrier : un moment de recette (D37, D98), jamais un jour |
| ui/RatioSlider, SliderField, curseurs de volume, dose, alcool | réglages | quantités | non | pas des dates |

## C. Limites de la frise partagée (écrites, pas contournées)

1. Plage R8 : du 6 janv. 2025 à fin 2029. Un jour antérieur se lit, mais le premier geste le ramène à janv. 2025 ; une facture de 2024 ne se corrige donc pas au doigt. À régler dans `DureeFenetre` (époque en prop) : pas touché ici.
2. Pas de « vider » : la frise ne peut pas effacer une date (les champs facultatifs gardent leur bouton existant, ou ne se vident plus).
3. La bande de faisabilité du starter (m2) de l'ancienne réglette est devenue une ligne de texte (« Le starter tient ce jour ») ; la frise n'a pas de bande de teintes par jour.
4. Les mois se tirent à l'échelle du jour (la frise n'a pas de pas mensuel).
