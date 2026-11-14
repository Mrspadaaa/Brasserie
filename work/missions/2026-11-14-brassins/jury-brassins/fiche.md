# Fiche de cadrage — Brassins (liste, fiche d'un brassin, suivi de fermentation)

## Hypothèse
Avant (75 %) : au téléphone, « où en est ma cuve et que faire maintenant » ; courbe en jours, prochain geste daté, relevé au curseur.
Après (80 %) : idem, avec deux corrections du jury : (1) **deux températures distinctes**, celle de la cuve (régulateur, chaque jour,
comparée à la consigne de la recette) et celle de l'échantillon (corrige la lecture du densimètre, liée au relevé de densité) ;
(2) **le prochain geste se déclenche par une date OU un seuil de densité** (dry hop en fermentation active, repos diacétyle, garde
froide à densité stable). La fiche ignore aujourd'hui le temps : c'est la cause commune (VERDICT 5, 17, 19, 36 ; TROUS 2, 3, 14).

## Tranché
| n° | Question | Réponse | Source |
|---|---|---|---|
| J2 | Le geste | « que faire maintenant » d'abord, puis « où en est-elle » ; un écran agit | SPEC l. 698-699 : « regarde que les info sont des actionnable pas des "information, warning" » |
| J3 | Pourquoi | la fiche ignore le temps ; saisie au clavier ; stock en tête ; dry hop en code | VERDICT 5, 10, 11, 12, 17, 19, 36 |
| J5 | Acquis | geste au curseur de m2 tel quel (un toucher pose la cible, piste puis ±0,1, valeur tapée à un toucher) ; bornes du curseur de densité = OG → bande de FG visée du brassin ; grammaire de z1 pour la continuité ; rail v4.10 « J+0 à J+14 réguliers », « J+n » comme échelle de temps | SPEC 10.11 (m2, « Le geste, joué au doigt ») ; SPEC l. 462-464 |
| J6 | Refusé | cockpit (tableau « mon installation » à « – ») ; bandeaux d'alerte en tête ; codes internes ; « V5.5 » ; texte d'exemple pris pour une valeur ; secondes ; ABV ou atténuation montrés définitifs avant la densité stable | VERDICT 8, 10, 13, 20, 21, 27 ; `cerveau/brasseur/pas-de-cockpit.md` |
| J7 | FG visée | en bande (plage), jamais en point | PORTRAIT § 3.4 « il faut des intervalles de confiance » |
| J8 | J+n | compté depuis le levurage, en jours civils (J0 = jour du levurage), dit « levuré le 09.11 » ; fin de « depuis brassage » | Brasseur + Premiers principes ; code `daysSincePitch` (origine levurage, arrondi à corriger) |
| J14 | Températures | °C de l'échantillon ≠ °C de la cuve | `src/ui/production/BatchGravityEntry.tsx:10,49` (« celle de l'échantillon ») |
| J14 | Stable | deux à trois jours à 0,001 près, dans la bande de FG visée ; au-dessus de la bande et stable = « bloquée ? » | usage courant (à sourcer au port, L29) ; Premiers principes |
| J12 | Stock | « dry hop ajouté aujourd'hui » date l'ajout ET confirme le déstockage en un geste : la confirmation n'est pas cachée, elle est fusionnée | Contradicteur, Premiers principes ; `BatchDetailSheet.tsx:226-234, 492-501` |

## Hypothèses du pilote (à recopier dans chaque VOIE.md)
1. Instrument : densimètre (le code porte la °C d'échantillon) ; réfractomètre et sonde connectée hors de ce lot.
2. La °C de cuve se relève en un toucher seule (chaque jour) ; la densité, plus rare, ajoute la °C d'échantillon (facultative).
3. Le prochain geste vient de la recette figée (`recipeSnapshot` : consigne °C, paliers, dry hop `dayOffset`) : une date estimée,
   ou un seuil de densité quand la recette le dit ; jamais une valeur inventée.
4. Liste : tout brassin en cours (planifié, fermentation, garde, conditionné) reste visible quelle que soit la période ; la période
   ne filtre que les clos. Correctif de code au port (`App.tsx:171`), vérifié sur les autres onglets.
5. Un seul taux d'alcool, celui du code (`src/domain/alcohol.ts`, extrait réel), appelé « provisoire » tant que la densité n'est pas
   stable. Formule tranchée au port (L29).
6. « Terminé » (= vendu ou consommé) : mot mineur, tranché au port sans maquette (L24) ; dans les maquettes, « Écoulé ».
7. Rappels : dans l'app (prochain geste visible sur la carte et la fiche) ; aucune notification poussée dans ce lot (permission).
8. Raccord : la fiche à J0, juste après le jour de brassage, montre déjà « prochain relevé · dry hop J+6 · fin prévue » ; c'est notre
   écran ; la vue du jour de brassage n'est pas touchée.
9. 1280 : la fiche s'élargit (courbe à gauche, gestes et relevés à droite) au lieu d'une colonne de 670 px (VERDICT 35).

## Axes de variantes (séries v0)
- **A. La cuve d'abord** : la courbe en jours est l'écran (densité, bande de FG, °C cuve et consigne, jalons posés sur l'axe).
- **B. Le prochain geste d'abord** : une file de gestes datés ou à seuil (relevé, dry hop, repos diacétyle, garde, conditionner),
  chacun faisable en un toucher.
- **C. L'écart au prévu** : la réalité face au plan de la recette (OG → bande FG, consigne °C, dry hop au jour ou au seuil) ; ce qui
  s'écarte se voit seul.
- Liste (dans chaque série) : cartes-cuves à mini-courbe, ou tri par urgence du geste, ou par fermenteur physique.
- Relevé : °C de cuve seule en un toucher vs relevé groupé ; deux températures montrées distinctement.
- Mélanges : le brasseur mêle les variantes (PORTRAIT § 3.7) ; au moins deux variantes chaudes mêlent deux axes.

## Accords groupés
- Déploiement (tag `en-ligne/*`) ; écriture de nouveaux champs facultatifs sur le brassin (°C de cuve, dry hop ajouté le, bouteilles
  et fûts) : sens de chaque champ nommé (cuve ou échantillon) avant toute écriture ; règles Firestore à lire au port (aucune écriture).

## À mesurer
- Au port : chronométrer un relevé (touchers) ; précision 0,001 au curseur sur 390 px (bornes OG → FG) ; tout au-dessus du pli à 390.
- Fréquence réelle de ses relevés : à compter sur ses brassins réels en lecture seule si utile au port.

## Au conseil
- Aucun : pas de décision lourde ; l'origine de J+n et les deux températures sont tranchées par le code et deux regards.

## Désaccords du jury
- J1 scène : « une main » contesté (Contradicteur : invention ; Brasseur : téléphone posé, mains mouillées) → hypothèse : grosses
  cibles, pas de geste à deux doigts.
- J13 : la frise (c) refusée comme rail (Contradicteur) ; remplacée par l'axe C « écart au prévu » (Premiers principes) ; le rail v4.10
  reste une échelle de temps acquise, pas un écran.
- J17 : pari le plus risqué : relevé groupé (PP), deux températures (Brasseur), relever dans l'app plutôt que sur papier (Contradicteur)
  → les maquettes montrent le relevé de °C seul en un toucher.

## Coût
3 appels conseiller en Opus : 51 k, 47 k, 39 k jetons.
