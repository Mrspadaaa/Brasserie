OK — 27 problèmes, 5 bloquants ; préférences : 1C · 2C réduite à l'ensemencement (2B à l'ébullition) · 3C · 4C · 5C

# Critique v3 : cinq choix du jour de brassage (page-v3, 10.11)

Juge : Opus (Fable interdit). Pas de rejet : le brasseur voit tout et choisit. Question : combien et quels problèmes par option ?
Contre : ses mots du 10.11 (« Okay montre », « utilise des slider… », « C'est toujours assez mauvaise le jour de brassage… »,
« Aides et repères » incompris), z1 et m2 (règle n° 1). Références d'arbitrage : les 5 réf. de la page (app actuelle),
`page-v2/img/ref-z1-ebullition.png` (z1) et `ref-mesurer.png` (feuille m2 portée).
Captures ouvertes en plein format : les 5 réf., 30 options (c1a-repos/après, c1b-après, c1c-après/deux, c2a-repos/après, c2b-repos,
c2c-après/ens, c3a-repos, c3b-geste/après, c3c-repos/après, c4a-repos, c4b-repos/après, c4c-repos/après, c5a/b/c-après, c5b/c-repos),
5 cave (1C, 2C, 3C, 4B, 5C), page-ordinateur, réf. z1 ébullition. Non ouvertes : c1b-repos, c5a-repos (répètent c1a-repos et 4A).

Tests : sans objet (critique de page, aucun code) — `critique/tests-v3.txt`.

## Sens métier (avant le visuel)
Les chiffres tiennent : 11,5 g ÷ 0,19 hL = 60,5 → 61 g/hL ; plage Fermentis 50–80 g/hL → 9,5–15,2 g pour 19 L ; 2 sachets 23 g =
121 g/hL ; 85 + 43 + 43 = 171 g, 171 / 19 = 9,0 g/L ; Hazy IPA 25–60 IBU (BJCP 21B) ; 1,058 contre 1,061 = −0,003 ; 18,2 contre
18,5 = −0,3 ; bande densité 1,059–1,063 reprise de l'app (ref-mesurer), pas inventée ; grains 4,1 + 0,91 + 0,45 + 0,34 = 5,8 kg.
Une seule invention : les jours d'à cru de 2C (bloquant 3).

## Bloquants (5)
1. **Commun, toutes les captures : titre coupé.** « New England IPA · LOT-DEMO · … » : le « 19 L » disparaît, alors que l'app
   l'affiche entier (ref-sachet, ref-mesurer). Le titre des maquettes est plus gros que celui de l'app. Correction : taille du titre
   de l'app. (1C parle de « Dose pour 19 L » sans que le 19 L se voie en tête.)
2. **Commun, Préparer (4A, 4B, 4C, 5A, 5B, 5C) : éléments de l'app absents, hors du point montré.** « Changer la date » à côté de
   « Date dépassée » et les boutons « + » des groupes Eau d'empâtage et Eau de rinçage manquent ; icône goutte devenue thermomètre,
   calendrier devenu journal (ref-preparer). L'option A, censée être « l'actuel », ne l'est pas. Correction : reprendre l'en-tête et
   les groupes de ref-preparer tels quels.
3. **2C : chiffres inventés.** « J2 Citra · J6 Galaxy · J9 Mosaic » est codé en dur (`voies/v3/etat.src.html:358`) ; le panneau de
   l'app ne donne que les doses (Citra 85, Galaxy 43, Mosaic 43 g). La même ligne dit « phase ? » : on affiche des jours et on avoue
   ne pas connaître la phase. En brasseur, trois dry hops d'une variété chacun à J2, J6, J9 ne sont pas cette recette. Correction :
   doses seules et « phase ? ».
4. **3B : la feuille Mesurer perd des pièces de m2.** Contre ref-mesurer (même onglet Densité) : le crayon (valeur tapée à un
   toucher, SPEC 10.11 lu), la case « Densité refroidie ou corrigée à l'étalonnage », la ligne d'aide et « Pourquoi maintenant »
   (raison à un toucher) ont disparu. Correction : la feuille de l'app telle quelle ; seul ajout, « Enregistrer revient à la
   confirmation ».
5. **3C : mêmes pertes dans la fenêtre.** Les deux curseurs n'ont ni crayon ni raison : au téléphone, aucune valeur tapée possible.
   Correction : crayon à côté du « ? » de chaque curseur, comme m2.

## Par choix : combien et lesquels

### 1 · Poids du sachet
- **1A** (actuel) : 0 propre (bloquant 1).
- **1B** : 3. (1) La masse est écrite trois fois : sous-ligne, case, pastille. (2) « 11 , 5 » en chasse fixe : la virgule se
  détache, ça se lit « 11 5 ». (3) « 11,5 g le sachet · catalogue Fermentis » tient sur deux lignes : du texte de plus.
- **1C** : 2. (1) À 2 sachets, la pastille « 1 sachet » reste sélectionnée (c1c-deux) : état contradictoire. (2) « Dose pour 19 L »
  prend le volume cible ; une fois « Au fermenteur » relevé, la dose doit suivre le relevé. Doute : la jauge a un pouce, il voudra
  peut-être la glisser ; elle n'est qu'une lecture.
- Préférence : **1C**, la seule qui répond « est-ce que ma dose tient ? » ; corriger la pastille.

### 2 · Panneau Houblons des Aides
- **2A** (actuel) : 2. (1) L'« actuel » est raccourci : phrases de ref-houblons coupées, axe 0–72 absent. (2) Le panneau long sous
  le pied reste ce qu'il a appelé « c'est quoi ça ??? » (10.11) : cockpit.
- **2B** : 1. L'état ensemencement n'est pas montré : on ne sait pas où va l'alerte « À cru · phase à préciser » de ref-sachet.
- **2C** : 5. (1) Bloquant 3. (2) À l'ébullition, la ligne met l'IBU en premier, sans α ni rôle : rejoue « trop centré sur le ibu,
  pas d'info sur les AA » (18.10, L04). (3) Barre « Ébullition 43 g » alors que l'ajout s'appelle « 0′ coupure du feu » juste au-dessus.
  (4) Unités mêlées : « 43 g » pour trois moments, « 171 g · 9 g/L » pour l'à cru. (5) Ambre pour 61 contre 60 IBU : un écart sous
  la précision de Tinseth fait une alerte pour rien.
- Préférence : **2B à l'ébullition, 2C à l'ensemencement seulement** (une ligne « À cru 171 g · 9 g/L · phase ? », sans jours).
  L'IBU ne se règle plus pendant l'ébullition.

### 3 · Relevés depuis la clôture
- **3A** (actuel) : 1. C'est la plainte même : la fenêtre dit le manque sans y mener (« pas de renvoi », 10.11).
- **3B** : 3. (1) Bloquant 4. (2) Le texte de la fenêtre est réécrit (« sans dose prévue », « Confirme uniquement si la levure a
  réellement été ajoutée » retirés), et l'option ne le dit pas. (3) Deux allers-retours pour deux relevés.
- **3C** : 3. (1) Bloquant 5. (2) La fenêtre monte aux deux tiers de l'écran ; « Confirmer ? » passe sous les curseurs.
  (3) Même réécriture du texte que 3B.
- Préférence : **3C** : le relevé se fait là où on le réclame, sans quitter ; remettre crayon et raison.

### 4 · Levure dans Préparer
- Remarque z1 (règle n° 1) : z1 met déjà « Sortir la levure Verdant IPA » dans **À anticiper, à l'ébullition**
  (ref-z1-ebullition). L'ébullition de v3 (c2*) ne l'a pas. La forme de 4C est donc celle de z1 ; sa place, dans z1, est l'ébullition.
- **4A** : 0 propre (bloquant 2).
- **4B** : 3. (1) La quantité se choisit deux fois, en Préparer et à l'ensemencement : deux sources pour une valeur. (2) Pastilles
  différentes de l'ensemencement (« 2 sachets » au lieu de « Sans mesure »). (3) Un groupe entier pour une ligne : vers le cockpit.
- **4C** : 0 propre (bloquant 2).
- Préférence : **4C**, à la place qu'elle a dans z1 (À anticiper de l'ébullition) si le brasseur ne tient pas à Préparer.

### 5 · Polices des chiffres
- **5A** (actuel) : 0 propre (bloquant 2). Doute : la chasse fixe rendue ressemble à une police à chasse fixe générique ; vérifier
  que c'est bien IBM Plex Mono.
- **5B** : 1. Indiscernable de 5C sur ces captures : aucune colonne de chiffres empilés où proportionnel et tabulaire diffèrent.
- **5C** : 1. Même défaut. Correction commune : montrer Ajouts (60′, 15′, 5′, 0′ ; heures) ou Relevés du jour empilés, A, B et C
  côte à côte.
- Doute (5A à 5C) : la feuille Volume n'a ni crayon ni « Pourquoi maintenant » ; je n'ai pas sa référence pour l'onglet Volume.
- Préférence : **5C** (une police, colonnes droites, plus moderne), à confirmer sur une capture où la différence se voit.

## La page
Lisible à 390 et 1280 (page-ordinateur ouverte), agrandissement au toucher, réf. à gauche en pointillé. À 1280, les vignettes font
environ 150 px : on ne juge qu'en agrandissant. 1C n'a pas d'état au repos dans la page (c1c-repos existe).

## Phrase prédite du brasseur
« 1C oui, je vois direct si mon sachet suffit. Les houblons, enlève-moi ça du jour, sauf le dry hop à la fin. 3C, je relève dans la
fenêtre. La levure, un rappel ça suffit. Les polices B et C, je vois pas la différence. Et pourquoi le titre est coupé ? »

LEÇON PROPOSÉE : une option « actuel » se capture depuis l'app, ou se compare pixel à pixel à sa référence avant publication :
ici 4A et 5A perdent « Changer la date » et les « + », 2A perd des phrases, et le titre de toutes les maquettes est coupé.
