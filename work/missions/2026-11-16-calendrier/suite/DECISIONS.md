# Décisions sur les choix ouverts (16.11, président du conseil, Opus)

Cadre : « Parfait soit autonome, n'attends pas de retour de ma part. SI une décision est à prendre, utilise le conseil ou les persona » (16.11, SPEC l.1810).
Toutes les décisions sont des **défauts provisoires et réversibles**. Aucune n'entre dans `work/refonte-frontend/v4/choix/ecrans.json` : ce sont des votes du conseil, pas les choix du brasseur (règle n° 1, D123). Les pages restent ouvertes pour lui.
Regards : R1 (prédiction calibrée), R2 (contradicteur, lots caducs), R3 (lecture étroite). Limite commune : aucun regard n'a vu les images des propositions (sim-N, astuces) ; jugé sur les légendes de `index.html` et les 4 captures « avant ».

## Choix 1 — effets en cascade (c1, c2, c3)
- **Décision : caduc.** Rien n'est retenu de c1 à c3. Le sujet passe au groupe Effets du choix 3.
- Raison : la passe 1 a été refusée en bloc : « Pour le workflow, relancer avec plusieurs agent , , c'est mal target » (15.11, l.1767). La passe 2 reprend la question (pe1 à pe5).
- Regards : R2 et R3 d'accord (caduc). R1 vote c1 + c3 mais dit lui-même que c'est « remplacé par le groupe 2 du choix 3 » : désaccord de forme seulement.
- Confiance : 80 %. À lui montrer au prochain lot : **non**.

## Choix 2 — sept parcours de la passe 1
- **Décision : le lot est caduc.** Trois idées passent dans des chantiers vivants, deux sont refusées pour l'instant.
  - Besoin relié au scan : acquis (« Devis ↔ besoin … Ok », 15.11, l.1726). Il est porté par pl1 et pl2 du choix 3.
  - Note depuis le + : portée par le calendrier et le carnet (« ajouter avec un + une nouvelle idée, et ça viendrait directement là bas », 16.11, l.1806).
  - Fût au quotidien : c'est son propre exemple (« lavé un fût fait baisser les consommables », 15.11). Il sert de cas d'essai à pe3.
  - Dépense scannée : remplacée par pa1 et pa2. Densité du jour : remplacée par pm1.
  - Conditionner et remplir, Corriger le stock (Compter) : refusés pour l'instant, faute de plainte datée (RESULTAT.md).
- Raison : même verdict « mal target » (15.11). Reproposer ce lot ferait revivre un lot refusé.
- Regards : R2 d'accord (caduc, sauf le lien besoin-scan). R3 garde Fût, retouche Dépense et refuse le reste : proche. R1 garde 4 parcours sur 7 : désaccord partiel, mais ses « Garder » tombent tous dans les reports ci-dessus.
- Confiance : 70 %. À lui montrer au prochain lot : **non**.

## Choix 3 — passe 2 (artefact 82HDNSfh4ADr8aigeigoH1)
Réponse votée : **`pa1 · pa2 · pe1 · pe3 · pe4 · pb1 · pb2 · pb3 · pm1 · pl1 · pl2`**

| Groupe | Décision | Raison sourcée | Regards | Confiance |
|---|---|---|---|---|
| Facture | **pa1 + pa2.** pa3 refusé pour l'instant. Garder « Un doute ? » et le mode Déplié. | `avant-depense.png` montre 23 lignes et 5 doutes d'un coup, contre « Moi d'info en une fois », « ça s'autocomplete » (15.11). pa3 ajoute des tuiles, donc de l'information. Pour le mode Déplié : « Je veux pas perdre en fonctionnalités ». | R2 et R3 : pa1+pa2. R1 : pa2+pa3 avec le repli pa1. 2 contre 1 sur pa3. | 65 % |
| Effets | **pe3 + pe1 + pe4** (pe4 comme règle de donnée). pe2 et pe5 refusés. | pe3 : « ça a des conséquences sur tout … dynamique sur toute l'app » (15.11). pe1 : sa demande « un Tab en bas … type Lignes serrées v6a » (10.11). C'est un panneau de l'écran de saisie (lecture l.1660), pas la barre de navigation : pas de conflit avec le choix 4. pe4 : une dose n'est jamais inventée. **Retouche pe4** : remplacer l'exemple faux « Acide phospho » (la dose dépend de l'eau et du style) par Star San, soude ou PBW. | pe3 : 3 sur 3. pe1 : R1 et R3 (R2 craint le conflit de barre, levé par la lecture l.1660). pe4 : R1 et R2 ; R3 y voit une règle, pas un goût (même effet). | 70 % |
| Créer | **pb1 + pb3, dans la feuille d1b** (déjà choisie : « Feuille Brasser : d1b », 15.11), **+ pb2** (rebrasser, un toucher). pb4 refusé pour l'instant. | `avant-brassin.png` montre un refus en rouge (« Ouvre « Modifier la recette »… ») ; « Ça resoud aucune de mes problématique » (15.11). L'astuce entre dans d1b, elle ne la remplace pas. | pb1 : 3 sur 3. pb3 : R2 et R3 (R1 le dit contenu dans pb1). pb2 : R1, et R3 « peut s'ajouter ». pb4 : R1 seul. | 65 % |
| Mesure | **pm1, dans le compagnon p2a** (« Parfait », 15.11). pm2 refusé. **Retouches** : afficher la valeur proposée (67 °C) au lieu de « — °C » ; ajouter un curseur de pH. | « des slider plutot que … des input de chiffre sur téléphone », « pas de renvoi » (10.11). Avec pm2, il retaperait tout à la fin. | pm1 : 3 sur 3. pm2 en filet : R1 seul. | 75 % |
| Besoin | **pl1 + pl2.** pl1 quand le lien est sûr (visible et défaisable dans Nouvelle dépense). pl2 pour la trace (Réalisés, courbe kh1r). Aucune étape dans À venir. | « ça le fait pas quand on a une nouvelle depense ??? » ; « en théorie il y en a pas besoin ?? » (15.11). `avant-lien.png` : champ « facultatif » à remplir à la main. | R1 : pl1+pl2. R2 : pl2. R3 : pl1. Partage 1-1-1 ; la greffe couvre les deux raisons. | 65 % |

- À lui montrer au prochain lot : **oui**, sans attendre sa réponse : la réponse votée, cochée sur sa page, qu'il corrige s'il veut. Les retouches de pe4 et de pm1 sont faites avant.

## Choix 4 — place de l'onglet Calendrier
- **Décision : 6e onglet de la barre du bas** (Bord, Finances, Calendrier, Brassins, Stocks, Clients) comme défaut. Le + reste flottant et porte les actions du calendrier.
- Raison : lecture étroite de « un onglet calendrier en bas pour le global » (16.11, l.1778) et « Le + n'a jamais été en bas, c'est un bouton "volant" » (l.1780). Fusionner avec Bord contredit « onglet ». Remplacer Finances retirerait 8 vues choisies le 15.11 ; ce n'est possible qu'après le « mode finance » (l.1812, autre session). Le proto fb9 montre que six onglets tiennent à 390.
- **Retouche** : libellés de fb9 à environ 12 px, à mesurer contre la règle de lisibilité du PORTRAIT (§ 7).
- Regards : R2 et R3 : 6e onglet. R1 : 6e onglet maintenant, à la place de Finances quand le mode finance existera. Accord sur le défaut ; le remplacement de Finances reste une suite possible.
- Confiance : 60 %. À lui montrer au prochain lot : **oui**, en mini maquettes à 390 (6e onglet, fusion avec Bord, à la place de Finances), dans un artefact neuf (règle n° 1 et L24). Non bloquant : le défaut s'applique en attendant.

## Leçon proposée (3 regards sur 3)
LEÇON PROPOSÉE : une page de choix publiée en artefact garde une copie locale de ses images dans la mission. Sinon, le conseil vote sur des légendes, contre « un choix se montre en mini maquettes ». Et un lot refusé en bloc ferme tous ses sous-choix : les marquer caducs dans le registre plutôt que de les reproposer.
