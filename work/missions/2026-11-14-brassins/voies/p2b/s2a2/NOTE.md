# s2a2 — série B, le prochain geste d'abord (passe 2 de s2a)

- Chaleur : froide (les idées retenues de s2a, affinées ; greffes de s2c et s2e).
- Idée : la file du jour. « Maintenant » (°C cuve, densité) en tête, « Où en est-elle » juste dessous, puis « Ensuite », la file datée ou à seuil.

## Défauts de s2a (t1), corrigés
1. Courbe en bas, coupée par le pied : « Où en est-elle » est remontée sous « Maintenant », entière dans le premier écran (y 370 à 585 sur 844).
2. Pas d'échelle, « 1,018 » barré par la ligne du jour : échelle 1,060 · 1,040 · 1,020 à gauche ; chaque point a son chiffre (1,062, 1,058,
   1,030, 1,018), posé hors de la ligne du jour et des traits, avec un halo du fond.
3. Jauge de garde illisible : remplacée par le rail OG → bande de s2e, nommé (« OG 1,062 », « dernière 1,018 », « bande », « encore 0,004
   jusqu'à 1,014 »).
4. Dry hop « Ajouté » seul : tuiles par houblon de s2c (Citra 100 g, Mosaic 80 g, « réservé au stock »), 180 g · 7,5 g/L sur 24 L, bouton
   « Ajouté aujourd'hui · sort Citra 100 g et Mosaic 80 g du stock ». Après le geste : « sorti du stock », « 1 j d'avance », Annuler, goutte
   déplacée de J+6 à J+5 sur la courbe.
5. 1280 petit et tiers bas vide : page agrandie (×1,15, texte 14 à 23 px) ; à droite la courbe, puis la table des relevés depuis J0.

## Retouches communes
1. Remplissage : médian 0,78 (s2a : 0,50) ; aucune bande vide de plus de 80 px à 390 (liste : 64 px en bas).
2. Consigne 18 à 20 °C partout : « consigne 19 °C · plage 18–20 °C », mini-pistes de la frise et piste du geste sur la même plage ; 19,6 n'est
   pas un écart. La °C du jour non relevée est un « — » en case pointillée avec « Relever », pas un badge.
3. Typographie : virgule resserrée en Plex Mono (plus de « 1 , 018 »), unité en Source Sans après un espace simple ; plus de `word-spacing`.
4. Étiquettes de courbe : aucune barrée ni cachée.
5. Note, Stock, Carnet : boutons bordés de 44 px, icône et mot.
6. Jauge de garde : rail OG → bande avec « encore 0,004 ».
7. Dry hop au repos : « Ajouté aujourd'hui » qui dit le déstockage.
- Plus : le « Fait » de la consigne 21 °C (actif dès J+5 pour un geste de J+7) est retiré ; la rangée dit « dans 2 j ».

## Greffes reçues
- Tuiles par houblon + « 7,5 g/L sur 24 L » + « Ajouté aujourd'hui · sort du stock » (s2c).
- Rail OG → bande (s2e), posé dans la rangée Garde, là où il décide du passage au froid, et non en tête sombre : s2a est froide, la tête
  reste celle de z1.
- Liste « Par geste à faire » (s2a) : Pale Ale « Brasser / Replanifier » en tête ; agenda « Cette semaine » en puces datées ; occupation
  F1 / F2 ; Clos.

## Baseline (cochée)
- [x] geste m2 : piste 17–21 à bande cible 18–20, pouce, ±0,1, valeur tapée à un toucher (role=textbox inputmode=decimal) ; type=number : 0
- [x] grammaire z1 : en-tête de lot, cartes, relevés du jour ; jetons DESIGN.md clair et cave ; rayons 10/16/24
- [x] J+5 · levuré le 09.11 (jours civils)
- [x] deux températures : °C cuve face à la consigne 18–20 (frise par jour) ; °C échantillon avec la densité (20,5 °C)
- [x] FG en bande 1,010–1,014 ; inconnu « — » ; atténuation 71 % et alcool 5,8 % « provisoires »
- [x] dry hop nommé, dosé, daté (Citra 100 g + Mosaic 80 g · J+6 · 15.11) ; « Ajouté aujourd'hui » date l'ajout et sort du stock
- [x] premier plan actionnable ; ni cockpit, ni bandeau d'alerte, ni paragraphe, ni code interne, ni secondes
- [x] chiffres à la virgule, un seul espace avant l'unité ; cibles ≥ 44 px (aucun bouton sous 44 px, mesuré au rendu)
- Valeur du geste (19,2 °C) : saisie simulée du scénario. « −100 g / −80 g » : les doses de la recette, pas un solde de stock (inconnu).

## Boosters UX (boosters-ux)
- releve-cuve, releve-densite — déclencher ; boutons dans « Maintenant » ; effet : feuille m2 (capture geste).
- frise-cuve — suivre ; 5 cases jour par jour, mini-piste 17–21 à plage 18–20, aujourd'hui en pointillé ; au geste la case du jour se remplit (19,2).
- courbe — suivre ; densité par jour, échelle, bande, phases 21 °C et garde, ligne du jour ; effet : goutte du dry hop J+6 → J+5.
- dryhop-ajoute — déclencher ; tuiles + bouton ; effet : tuiles « sorti du stock », 1 j d'avance, Annuler (capture dryhop).
- seuil-garde — lire ; rail OG → bande, « encore 0,004 ».
- curseur-m2 — ajuster ; piste et ±0,1.
- agenda (liste) — suivre ; gestes de la semaine par jour.
- B2 : une seule action primaire par écran (Relever) ; B6 : tailles 12, 14, 17 px à 390 (valeur de champ 28 hors compte) ; B13 : 0 cible sous 44 px.

## Contrôles (sorties recopiées)
- controle-panel (repos + geste 390 clair) : remplissage médian 0,78, 0 sous 0,50 · ressemblance 0,71 · paires 0 % → PANEL OK.

## Écarts assumés
- Ajouté aujourd'hui au repos tombe juste au-dessus du pied (y 740 à 790) : visible, pas coupé.
