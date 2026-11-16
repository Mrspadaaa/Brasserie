OK — 49 problèmes, 16 bloquants

Critique c4a (Opus, Fable interdit), 14.11.2026. Question : « combien et quels problèmes il y a ? », avant de lui montrer s4 et s5.
Images ouvertes (16) : s4a repos 390 clair, geste 390, repos 390 cave, repos 1280 ; s4b repos, geste, liste ; s4c repos, geste ;
s5a repos 390 clair, geste, repos 390 cave, repos 1280 ; s5b repos, geste ; s5c repos, geste, liste.
Chiffres comparés au brief (« Les chiffres ») : densités, dates, °C cuve, consignes, doses, ABV 5,8 % et 71 % à 1,018, 6,0 % et 74 %
à 1,016 (justes), autres cuves. Aucun chiffre de brassage faux. α : s4 cite Beer Maverick (Citra 10–15 %), s5 HopDatabase
(Citra 10–16 %) ; les deux sont sourcés.

Bilan : les six sortent enfin du squelette commun (cause c3 n° 1 levée) ; quatre ont la phrase-réponse en tête, cinq montrent les
houblons en brasseur. Aucune n'est sans bloquant ; tous se corrigent sans changer l'idée. [B] = bloquant.

## s4a — CORRIGER
Le tableau de cuverie (froide). « Là je vois ma cuve, mes jours, mes ajouts. Mais la case du jour est minuscule et la moitié du
graphe est vide. »
1. [B] Cible trop petite : `s4a-repos-390-clair`, colonne « J+5 auj. », case °C cuve « — » et bouton « + » de densité, 37 px de large
   (74 px sur la capture ×2). Règle : BRIEF § Obligatoire 3, cibles ≥ 44 px. Correction : élargir la colonne du jour à 56 px au moins
   (les colonnes passées peuvent descendre à 30 px), ou poser une rangée « Relever » pleine largeur sous la grille.
2. [B] Retour de la cause c3 n° 6 : `s4a-repos-390-clair`, zone Densité de J+5 à J+10, et `s4a-repos-1280-clair`, de J+6 à J+12 :
   blanc et grille seuls (60 % de la largeur à 1280). Correction : dessiner le couloir attendu jusqu'à la bande, sans chiffre (le
   fondu « actif jusqu'à la bande » de s4c), et réduire la hauteur de la zone à 1280.
3. `s4a-repos-390-clair` et `-1280` : doubles espaces entre nombre et unité (« 100  g », « Cuve à 21  °C », « 71  % », « 3  j »,
   « +6  j »). Correction : espace fine insécable, même police.
4. `s4a-repos-1280-clair`, rangée basse de la grille : étiquette « OG » sans valeur, dans la rangée des ajouts ; l'OG 1,062 est
   déjà sur la courbe à J+0. Correction : retirer l'étiquette ou y écrire « brassé ».
5. `s4a-repos-1280-clair`, courbe : « 1,018 » collé au point et au trait vert. Correction : étiquette à gauche du point.
6. `s4a-repos-390-clair`, « stable ? ○ = ○ → » sur J+8–J+9 : ne se comprend pas en 3 s sans la rangée « Garde » (hors écran à
   390). Correction : « 2 relevés égaux » en chiffres gras près des deux ronds.

## s4b — CORRIGER
Le tableau de cave debout (tiède). « L'idée est marrante, mais tout se marche dessus et je ne vois même pas l'α. »
1. [B] Chevauchement : `s4b-geste-390-clair`, la bande FG verte traverse la feuille ouverte, couvre le dernier chiffre de « 19,1 »
   et « Enregistrer °C cuve » (lu « Enregistre C cuve »). Correction : la feuille passe au-dessus de la grille (plan supérieur,
   pleine largeur), la bande s'interrompt.
2. [B] Texte coupé : `s4b-geste-390-clair`, « + » et « Enregistrer » sortent du bord droit. Correction : la feuille tient dans
   les 390 px, marges 20 px.
3. [B] Texte coupé : `s4b-repos-390-clair`, rangée J+3, « 1,030 » amputé de son « 1 » par le bord de la colonne °C. Correction :
   étiquette à droite du point, ou colonne densité élargie.
4. [B] Chevauchement : `s4b-repos-390-clair` (et geste), « stable ? » barré par le trait J+8/J+9 ; les cases des pastilles
   « 100 · 80 g » et « cuve 21 °C » posées sur la bande FG. Correction : pastilles arrêtées avant la bande, « stable ? » dans une
   seule rangée.
5. [B] Retour de la cause c3 n° 5 : `s4b-repos-390-clair`, Citra et Mosaic sans α ni rôle (nom et picto seulement ; la NOTE dit
   le contraire). Règle L04. Correction : « α 10–15 % · aromatique » sous chaque nom dans la tête de F1, ou au toucher de la
   pastille, ouverte au repos.
6. `s4b-repos-390-clair`, colonne FG : « FG » sans 1,010–1,014. Correction : écrire la plage dans la bande.
7. `s4b-repos-390-clair`, tête de F1 : atténuation absente (alc. seul).
8. `s4b-liste-390-clair` : les rangées portent les J+n de F1 pour toutes les cuves (le J+n est propre à chaque brassin) ; la Pils
   n'a pas sa densité « 1,010 stable ». Correction : rangées titrées par la date seule en liste, « 1,010 » dans la tête Pils.
9. `s4b-liste-390-clair` : « Brasser ou replanifier », « Confirmer la FG » en texte coloré, pas en boutons. Correction : boutons
   ≥ 44 px (comme la liste de s5c).
10. `s4b-repos-390-clair` : boutons « °C » et « + » du jour 44 × 40 px. Correction : 48 px de haut.
11. `s4b-repos-390-clair` et `-liste` : bas d'écran vide (1/9 et 1/6).

## s4c — CORRIGER
Les couloirs du dry hop (chaude). « Les houblons, enfin comme ailleurs dans l'app. Mais ébullition sur une cuve à J+5 ? »
1. [B] Sens métier (L14) : `s4c-repos-390-clair`, segment « ébullition · WP · actif · après » sur une cuve à J+5 : l'ébullition et
   le whirlpool sont passés, ces choix n'existent plus. Correction : garder « actif · après » comme repère (actif allumé), et
   « ébullition · WP » seulement dans Dryhopper, derrière « Quand ajouter ? ».
2. [B] Texte coupé : `s4c-geste-390-clair`, bandeau vert « Citra ajouté le 14.11 · stock −100 » puis « g » seul à la ligne.
   Correction : « stock −100 g » insécable, texte plus court (« Citra ajouté · stock −100 g »).
3. [B] Élément de la baseline absent : ni carnet ni stock sur l'écran (seuls ×, « Quand ajouter ? », « °C cuve », « Densité »).
   Règle : BRIEF § Obligatoire 1, « stock, installation, budget, carnet, suppression à un toucher ». Correction : deux icônes
   en tête, à côté du ×.
4. `s4c-repos-390-clair`, couloirs Citra et Mosaic étalés sur J+6 et J+7 : se lit « deux jours de contact », absent du brief.
   Correction : bloc sur J+6 seul.
5. `s4c-repos-390-clair`, graphe : « FG » sur la bande, borne 1,010 nulle part (seul « bande à 1,014 »). Correction : « FG
   1,010–1,014 » dans la bande.
6. `s4c-repos-390-clair` : alcool et atténuation provisoires absents.
7. `s4c-repos-390-clair` : le critère « stable » (garde) n'est pas dessiné, alors que la NOTE le dit.
8. `s4c-repos-390-clair` : l'historique commence à J+3 ; 1,058 et l'OG disparaissent sans repère. Correction : flèche « 1,058 ↑ »
   comme s4a.
9. `s4c-repos-390-clair` : le contour noir du jour est interrompu par les étiquettes « Citra α… » et « Mosaic α… » ; « 1,018 »
   touche le haut de la bande.

## s5a — CORRIGER
Trois tuiles empilées (froide). « Ça c'est clair : dry hop demain, ma densité en gros, mes houblons. Celle-là je la garde. »
1. [B] Élément de la baseline absent : `s5a-geste-390-clair`, « alcool 6,0 % att. 74 % » sans « provisoires » (la densité n'est
   pas stable). Correction : « provisoires » comme au repos.
2. [B] Élément de la baseline absent (m2) : `s5a-geste-390-clair`, aucun « Taper » : la valeur tapée n'est pas à un toucher.
   Correction : bouton « Taper » à gauche d'« Enregistrer ».
3. [B] Chiffre inventé : `s5a-geste-390-clair`, « °C échantillon 20,5 » pré-rempli pour le 14.11 (c'est la valeur du 13.11 ;
   rien n'est mesuré aujourd'hui). Règle : inconnu = « — ». Correction : « °C échantillon — », 20,5 en repère « hier » sur sa
   piste.
4. `s5a-repos-390-clair` et `-cave` : « Ajouter › » chevauche la barre de familles de Mosaic. Correction : bouton au-dessus des
   barres, ou dans le pied de la tuile.
5. `s5a-repos-390-clair` : le dry hop n'a pas de case « Ajouté aujourd'hui » au repos (« Ajouter › » ouvre une feuille non
   montrée) : un toucher de plus que z1. Correction : une case pleine par houblon, à droite des grammes.
6. `s5a-repos-1280-clair` : texte de 11 à 13 px (α, dates, relevés, consignes) pour un poste de cave lu debout. Correction :
   16 px au moins.
7. `s5a-repos-1280-clair`, barres °C : la barre vide du 14.11 monte plus haut que les autres, elle se lit « environ 20 °C ».
   Correction : case basse en pointillé, « — » centré.

## s5b — CORRIGER
Deux cadrans carrés (tiède). « Joli, la case à cocher du dry hop est bien. Mais c'est 1,018 de quand ? Et mes crans je les
comprends pas. »
1. [B] Élément de la baseline absent : ni carnet, ni stock, ni courbe sur l'écran (seuls ‹, NEIPA et J+5). Règle : BRIEF
   § Obligatoire 1 ; c3 G2 « l'historique ne doit pas être perdu ». Correction : trois icônes « courbe · carnet · stock » en tête,
   comme s5a.
2. `s5b-repos-390-clair`, tuile Densité : « 1,018 » sans sa date (13.11), lu comme la mesure du jour. Correction : « 13.11 »
   sous le chiffre, comme s5a.
3. `s5b-repos-390-clair` : la FG n'est pas chiffrée (crans et « bande ») ; 1,010–1,014 n'apparaît pas. Correction : « 1,014–1,010 »
   sous les crans verts.
4. `s5b-repos-390-clair` : les 8 crans et « −0,004 » ne se comprennent pas en 3 s. Correction : « encore 0,004 » en pastille,
   comme s5a.
5. `s5b-repos-390-clair`, tuile °C : la barre vide du 14 est la plus haute, elle se lit « environ 20 °C ». Correction : case
   basse en pointillé.
6. `s5b-repos-390-clair` : vide de 80 px dans la carte verte, entre Mosaic et les pastilles 21 °C et 2 °C.
7. `s5b-repos-390-clair` : la phrase-réponse « Dry hop demain » est au milieu de l'écran, sous les mesures (cause c3 n° 4 à
   moitié). Correction : remonter un bandeau « Dry hop demain » sous l'en-tête, ou la carte verte en tête.

## s5c — CORRIGER
Cadrans ronds et cuverie (chaude). « Ça c'est moderne, le cadran et la frise en couleur. Mais où je coche mon houblon ? »
1. [B] Élément de la baseline absent : ni carnet ni stock (l'en-tête est le rail des cuves). Règle : BRIEF § Obligatoire 1.
   Correction : icônes « carnet · stock » sous le titre, à droite.
2. [B] Élément de la baseline absent (m2) : `s5c-geste-390-clair`, aucun « Taper ». Correction : « Taper » à gauche
   d'« Enregistrer ».
3. `s5c-repos-390-clair`, frise J+5 : « ? » au lieu de « — » pour la densité du jour.
4. `s5c-repos-390-clair`, frise J+6 : seul le picto Citra ; Mosaic manque. Correction : les deux pictos.
5. `s5c-repos-390-clair`, frise : densités tronquées « 062 », « 058 », « 030 », « 018 » dans les cases passées et °C dans les
   cases futures : deux grandeurs dans le même emplacement. Correction : « 1,062 » sur deux lignes ou point de densité, °C en
   deuxième ligne dans toutes les cases.
6. `s5c-repos-390-clair`, carte dry hop : rôle absent (α seul), et aucune case « Ajouté aujourd'hui » visible. Correction :
   « arôme · actif » et une case pleine à droite des grammes.
7. `s5c-repos-390-clair`, frise : « J+10 » et « J+11 » collés aux bords de leur case.
8. `s5c-liste-390-clair` : tuiles Pale Ale et Pils à moitié vides (200 px sans rien), bas d'écran vide (1/6) ; fiche : 1/7 vide
   en bas. Correction : tuiles plus basses, ou la frise de chaque cuve dans sa tuile.
9. `s5c-repos-390-clair` : « consigne 19 » touche l'anneau °C ; point orphelin après « att. 71 % ».

## Doutes (non comptés)
- `s4a-geste` montre la feuille ouverte sur 1,018 « hier », pas l'état après « Enregistrer » ; la case du jour remplie n'est pas vue.
- `s5a` : « stable ? = ? dans la bande, à 24 h » : le délai de 24 h n'est pas dans le brief (pratique courante, à confirmer).
- `s5b` : « + » des tuiles à 34 px ; sans gravité si toute la tuile est la cible, comme la NOTE le dit.
- α de Citra : 10–15 % (s4, Beer Maverick) contre 10–16 % (s5, HopDatabase). Les deux sont sourcés ; il verra l'écart s'il compare.
  À unifier sur la source de l'app (`roles.ts`) avant de lui montrer les deux séries ensemble.
- s4c, s5b : ni cave ni 1280 (non exigé : deux meilleures par série) ; s4a et s5a seules à 1280.

## Classement
1. **s5a** — la réponse en 3 s, densité en gros, houblons en brasseur, et le 1280 est un vrai poste de cave avec toutes les cuves.
2. **s4a** — le tableau dense et coloré, ajouts à cocher de z1 ; le 1280 est le plus riche ; perd sur le graphe vide à droite.
3. **s4c** — les houblons les mieux dits (α, rôle, familles nommées) et le lien Dryhopper ; perd sur ébullition/WP et l'état de la cuve réduit.
4. **s5c** — le plus moderne (cadran, frise pleine, liste en tuiles d'action) ; perd sur le houblon sans rôle ni case.
5. **s5b** — la case à cocher du dry hop est la meilleure ; les crans et le 1,018 sans date gênent.
6. **s4b** — l'idée du tableau debout plaît, mais à 390 tout se chevauche et l'α manque.
