OK — accepté : fc passe 2, 8 tâches en 0 à 2 gestes, l'année se lit en blocs ; un piège (balayer à gauche supprime) et des valeurs coupées à 390

Critique Opus, regard neuf, 16.11. L'ancienne critique (passe 1) est dans `v0/CRITIQUE.md`.
J'ai ouvert les 12 captures de mesure (t1 à t8), les captures bulle, + et défilement à 390, le repos et le geste en cave à 390
et à 844, et repos, défilement et t6 en paysage 844. J'ai lu les gestes dans `client.js` (l. 225 à 250) sans les rejouer : pour
les gestes, je me fie au mesureur. f1 vaut 8/10 pour lui.

## Notes (sur 10)
| brasseur | uxui | parcours | navigation | fluidité |
|---|---|---|---|---|
| 8 | 7,5 | 8,5 | 7,5 | 7,5 |

Sa phrase, à mon avis : « Là c'est vachement bien, je vois toute l'année par type, je tire, c'est posé, et le 709 bouge direct.
Mais j'ai glissé le malt pour l'avancer et il a disparu ??? Et l'IPA à cru elle coûte combien, elle est coupée. »

Réponse à sa question (« en une action, je peux ajouter, modifier ? ») :
- Oui pour lire (0 geste), modifier la fenêtre, le budget et les jours (1 glisser), filtrer (1 toucher) et supprimer (1 balayage).
- Ajouter en demande 2 : un glisser et une puce. Taper un nom coûte 13 à 17 frappes.
- Déplacer demande de tenir 300 ms avant de glisser, et c'est le seul geste à attente.

Sens métier : rien d'absurde.
- Un brassin dure 4 semaines, avec son jour de brassage. Malt et houblons s'achètent sur une fenêtre, et le paiement tombe la
  dernière semaine (« −540 payé en S1 · 180 / sem. mis de côté »).
- 2026 a bien 53 semaines ISO. S50 va du 7 au 13 décembre. S52 → S1 va du 21 décembre au 10 janvier.
- 4 180 − 148 (Blonde) = 4 032 : c'est la caisse de S47. 709 − 480 = 229, et 709 − 650 = 59.

## Problèmes, du plus grave au moins grave
1. **Glisser une barre vers la gauche la supprime.** Le geste naturel « avancer Malt groupé d'une semaine » part sans tenir :
   au-delà de 8 px à gauche, `barre?` devient `swipe` (client.js l. 246). Le même glisser vers la droite ne fait rien. Sur une
   frise où le temps va de gauche à droite, c'est l'effet le plus surprenant possible, et le Annuler ne fait que le rattraper.
   Correction :
   - glisser le corps d'une barre la déplace tout de suite, dans les deux sens, sans tenir (rien ne défile à l'horizontale,
     donc aucun conflit avec le défilement vertical) ;
   - supprimer passe par la bulle ou par un dépôt sur le + devenu poubelle (« Jeter »), qui existe déjà ;
   - plus aucun balayage sur une barre.
2. **Une chose coupée au bord d'un bloc perd son nom et ses valeurs.** À 390, IPA à cru (S5 → S8) montre « IPA à cru » sans
   montant au bout du bloc 1, puis une barre brune muette en S7 et S8 au bloc 2. Ses −142 et ses 2 j ne se voient nulle part
   (en 844, ils sont là). C'est pareil pour Embouteilleuse au bloc 2 de 844 (barre muette en S20 à S22) et pour la barre muette
   de S20 et S21 sous le filtre Achat. Correction :
   - chaque morceau porte « ‹ Nom » (comme « ‹ Frigo ») ;
   - le montant et les jours vont sur le morceau le plus long ; sous 2 semaines, une pastille « ‹ IPA −142 » à côté.
3. **Les étiquettes changent de côté, et on cherche à quoi elles se rapportent.** On lit « Dégustation +420 1 j » à gauche de
   sa barre, « Noël privés » à droite, « Frigo −1 800 1 j » à gauche avec un vide de 2 semaines, et « Malt groupé » à gauche
   après T6. L'œil fait des allers-retours. Correction :
   - le nom dans la barre dès qu'il y tient, sinon toujours juste à droite ;
   - à gauche seulement au bord droit du bloc, collé à la barre, sans vide ;
   - les valeurs suivent le nom, dans le même ordre partout (montant, puis jours).
4. **Les cibles d'une semaine font 25 px.** Un événement d'une semaine (Marché de Noël, Dégustation) mesure 25 × 24 px à 390.
   On y fait trois choses : le toucher (bulle), tirer un bout (13 px dedans, 16 px dehors) et le déplacer. Le mesureur a raté le
   balayage en partant du bord. Correction :
   - zone de toucher d'au moins 44 px autour de chaque barre courte ;
   - sur une barre de moins de 2 semaines, on n'y tire pas les bouts : la durée se règle par − / + dans la bulle.
5. **709 compte des ventes estimées comme si elles étaient sûres.** La tête dit « 709 sans passer sous 0 en S24 ». Ce chiffre
   inclut Marché de Noël +1 180, Dégustation +420, Café du Pont +520… et une hypothèse « ventes +120 / sem. », qu'on ne voit qu'en
   touchant. Si le Marché de Noël rate, le 709 est faux. SPEC (portrait § 3, honnêteté : « il faut des intervalles »). Correction :
   - une vente confirmée en plein, une vente estimée hachurée ;
   - la tête dit « 709 · 0 si le Marché de Noël rate », ou donne une fourchette « 0 à 709 ».
6. **Les deux couleurs d'événement ne sont expliquées nulle part.** Le vert est une vente (Noël privés, Café du Pont, La Cigogne,
   Mariage), le framboise un événement. Le filtre « Événement » ne montre que le framboise. C'est de l'information « qui sort de
   nulle part ». Correction :
   - soit un filtre « Vente » vert à part ;
   - soit la puce Événement montre ses deux pastilles, et la bulle dit « vente » ou « marché ».
   Le même problème touche le vert pointillé des activités de fûts.
7. **Les brassins ne disent pas leur cuve.** Pour un brasseur, ce qui coince, c'est deux brassins sur la même cuve au même moment,
   plus que 1 j de plus. Le + annonce « Brassin : cuve et jour J », mais aucune barre ne porte de cuve. Correction :
   - une lettre de cuve sur chaque brassin (« F1 ») ;
   - une alerte « F1 prise S50 » à côté de « S50 surchargée » quand deux brassins se chevauchent sur la même cuve.
8. **Les petits traits sous les barres ne disent pas ce qu'ils sont.** Ce sont les semaines où l'on travaille (1 à 3 traits par
   barre). Au repos, ils ressemblent à des poignées ou à du bruit. Correction : un point par jour actif, dans la couleur du type,
   collé sous la barre ; ou rien au repos, et dans la bulle.
9. **Le chiffre « à te permettre » ne change pas de semaine en semaine.** S50 choisie : la caisse passe à 5 172 et le chiffre reste
   à 709, parce que le plancher est en S24. Le chiffre est juste, mais « cette semaine » ne répond rien de neuf. Correction : quand
   la semaine choisie précède le plancher, dire « 709 jusqu'en S24 · 5 172 en caisse ». Toucher « S24 » amène au plancher.
10. **Le Annuler couvre la ligne du haut**, avec l'alerte « S50 surchargée », et rogne « 1 j libre » (capture t3). Correction : le
    Annuler va en bas, au-dessus de la barre d'onglets, à gauche du +, sur une seule ligne.
11. **Le + couvre la fin de la dernière piste visible** (La Cigogne, 1 j, et sa barre ; capture t1). Correction : une marge basse
    égale à la hauteur du + plus 16 px ; le + se réduit pendant le défilement.
12. **Au repos à 390, la tête prend 300 px sur 844.** Les cinq puces de filtre sont sur deux lignes (picto au-dessus du mot).
    Correction : des puces d'une ligne (picto et mot côte à côte), soit environ 50 px de gagnés ; la barre d'une ligne existe déjà
    au défilement.
13. **Sous le filtre Achat, l'alerte « S50 surchargée · 4 j / 2 » reste visible**, alors qu'aucune activité n'est montrée.
    Correction : l'alerte suit le filtre, ou elle dit « 4 j / 2 (masqué) ».
14. **« glisse ici pour poser une rénovation » est du texte au repos** sur une piste vide. Correction : un + estompé dans la piste,
    et le texte seulement au premier usage.
15. **En cave, les activités se lisent mal** : pointillé gris foncé sur noir (Inventaire, Laver fûts). Correction : un contour plus
    clair (contraste ≥ 3:1).

## Doutes (non comptés)
- Blonde montre −148 sans « j », mais occupe le mardi de S47 (point brun) : le jour de brassage est-il compté sans être affiché ?
- On ne voit pas les semaines passées. Un calendrier global ne devrait-il pas montrer au moins le mois écoulé (brassins en cours) ?
- Les points des jours : un point gris veut-il dire « jour non travaillé » ou « libre » ? Avec le contour vert pour le libre, ça
  se comprend, mais seulement après coup.
- Aucune capture ne montre un ✗ rouge pendant un geste.
- On ne peut pas renommer une chose depuis la bulle.

## Greffes possibles
- La tête paysage d'une ligne (« 709 · 1 j libre · ⚠ S50 · ●●●●● ») : la reprendre à 390 au repos, et pas seulement au défilement.
- Le + qui devient « Jeter » pendant qu'on tient une barre : c'est le bon geste de suppression, à garder seul (problème 1).
