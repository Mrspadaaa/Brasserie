OK — tour 2 : CRITIQUE-1 tenue, plus de caisse sur C, ≥915 en A1 ; prêtes A1 B1, 4 retouches mineures (A3 B3 C1 C3) ; tour 3 non

# Critique 2 — Carnet : Comparer, prix, Choisir → À venir (21.11, tour 2 sur 3)

Juge : Opus (Fable interdit). Regards : le brasseur (PORTRAIT v2, ses mots) et un expert UX mobile.
Captures ouvertes, une fois chacune : les 18 `cmp-captures/cmp-{a1,a3,b1,b3,c1,c3}-{repos,sans,eur}.jpg` (390, clair).
Contrôles texte : `grep -i "trop juste|payable|caisse"` sur `cmp-c1-*.html` et `cmp-c3-*.html` ne trouve rien ;
`≥915` figure dans `cmp-a1-repos.html` et `cmp-a1-eur.html` (l'état sans prix n'a pas de ligne CHF/m³, à raison).
Sens métier revérifié : CHF/m³ 3 350/2,6 = 1 288, 4 900/4,06 = 1 207, 5 400/5,9 = 915 (borne basse) ; EUR à 0,94 :
2 513 € → 2 362, port 380 € → 357, TVA 8,1 % sur 2 719 → 220, frais 60, total ≈ 3 000 CHF. Livraisons depuis le 21.11 :
3–4 sem. → mi-déc., 6 sem. → janv. Plan au sol à l'échelle (1,5 : 1,8 : 2,1 tenu). Aucune valeur fausse.

## Les trois vérifications

1. **Points de CRITIQUE-1** : tous tenus, détail ci-dessous. Deux défauts nouveaux, nés des corrections, sont relevés.
2. **Caisse sur l'axe C** : aucune. Plus de « trop juste », de « payable », de point rouge ni de mois colorés. Le mois
   d'À venir est une case bleue que le brasseur choisit (⌄), et l'achat est un jalon. C4 et K5 sont tenus.
3. **« ≥915 » en A1** : présent au repos et en EUR, en encre normale. Plus rien n'est vert sur cette ligne.

## Par version

### A1 Colonnes-cartes — PRÊTE
Tenus : ≥915 ; épingle pleine sur la seule ligne active, la phrase d'aide est retirée ; « Devis » est une étiquette
pointillée (forme B3) ; les prix inconnus sont hachurés « ? » ; un « 1 » plein marque le gagnant ; plan au sol à l'échelle.
Phrase prédite : « Là c'est clair, le tableau avec les prix et le plan au sol. »
Doute (non compté) : la note EUR « ≈ rendu chez toi : port, TVA 8,1 %, estimé · exemple » est une légende au repos.
Elle est courte et dit d'où vient l'estimé : à garder.

### A3 Bandes par attribut — DÉFAUT RESTANT (mineur)
Tenus : ordre fixe et nom au bout de chaque barre ; en-tête dans l'ordre, avec m³ ; dispo en segments depuis « auj. »
(« en stock » est un point sur auj.) ; porte en icône et cm ; légendes « mieux » retirées.
Défaut : l'axe Dispo affiche « 6 8 sem. » collés. Le « 8 » est posé vers 7 semaines alors que la ligne s'arrête à 8.
Correction : placer le « 8 » au bout de la ligne, au même pas que 2, 4 et 6 (environ 45 px par graduation).
Doute : en EUR, le segment clair au bout de la barre Kühlzellen24 (port et TVA) n'a pas de légende. La décomposition est
ailleurs (B) : à laisser, ou à retirer pour une barre unie.

### B1 Pastille de prix — PRÊTE
Tenus : le titre est le modèle et la puce porte « 4,06 m³ · 2e » (le volume n'est plus en double) ; la décomposition EUR
est repliée sous la pastille (chevron), tout en CHF, et la somme est juste ; « 3–4 sem. » ne passe plus à la ligne ;
« Ce qui compte » et « lu · saisi » sont retirés.
Phrase prédite : « Ok, propre. Mais l'étiquette de B3 parle plus. »

### B3 Étiquette accrochée — DÉFAUT RESTANT (mineur)
Tenus : les deux phrases sont retirées ; l'étiquette € est entière, au-dessus ; la barre segmentée en CHF s'ouvre au
toucher ; « Saisir » et « Devis » sont sur les étiquettes vides ; le pavé n'a plus de touche « ' » et formate « 3 350 » ;
le volume n'est plus en double.
Défauts :
1. Sans prix, étiquette de Pro 210 : « sur demande » passe sur deux lignes et chevauche l'œillet (« Osur / demande »).
   Correction : « Devis » seul sur l'étiquette, comme dans A1 et C1 (« sur demande » est déjà dit par la forme pointillée).
2. Au repos et en EUR, l'étiquette de Pro 210 (« dès 5 400 ») n'a ni « CHF » ni l'icône de source, alors que les deux
   autres les ont. Correction : « CHF » et le lien sous 5 400.

### C1 Prix › livré › payé — DÉFAUT RESTANT (mineur)
Tenus : les puces de caisse sont retirées ; le titre est le modèle et le prix n'apparaît qu'une fois, dans l'étiquette ;
la case bleue « janv. ⌄ » est son choix, en pointillé sans prix ; les ronds de rang sont revenus.
Défauts :
1. Sans prix, lignes Cellule 180 et Compacte 150 : le cadre pointillé « CHF ? » passe sur « 4,06 m³ » et « 2,6 m³ », qui
   se lisent barrés. Correction : volume sous le cadre, ou cadre réduit à la hauteur d'une ligne.
2. La carte en tête n'a pas son rond de rang. Au repos, on voit les rangs 1 et 3, et le 2 manque : « Il est où le 2 ? ».
   Correction : le rond (2, ou 1 en sans prix et en EUR) devant l'icône de la carte en tête.

### C3 Après Choisir — DÉFAUT RESTANT (mineur)
Tenus : « trop juste » et le point rouge sont retirés ; l'achat est un jalon, point et étiquette, posé sur le bon mois
(janv., déc., févr.) ; « + » et l'œil sont retirés ; les montants sont en encre normale ; sans prix, À venir est en
pointillé bleu ; Annuler et les ronds de rang sont là.
Défauts :
1. Dans la carte choisie, le nom du modèle a disparu des trois états : le titre est le prix (« 4 900 Frigo-Plus · CH »).
   Après Choisir, il ne lit pas ce qu'il a choisi. Correction : « Cellule 180 » en titre, prix à côté, comme dans C1.
2. Sans prix : même chevauchement « CHF ? » sur le volume que C1-1.
3. EUR : « 2513 € » sans espace (« 2 513 € » partout ailleurs).
Doute (non compté) : sans prix, l'étiquette « Chambre froide CHF ? » s'étend à gauche du jalon, de N à J, et peut se relire
comme une durée. Je mettrais l'étiquette à droite du point, comme au repos.
Doute de CRITIQUE-1, maintenu pour le pilote : l'aperçu de la rangée Achats est-il conforme à CR-AVENIR-CAL ?

## Défaut commun B et C (incohérence entre axes)
Le rang n'a pas le même sens d'un axe à l'autre. Dans A1 et C, Compacte 150 est 1 (Prix épinglé) ; dans B, sa puce dit
« 2,6 m³ · 3e » (rang du volume) et les cartes vont de Pro à Compacte. S'il retient A1, B3 et C3, il verra le même article
1er, puis 3e. Mon exemple de CRITIQUE-1 (« 4,06 m³ · 2e ») était ambigu : Cellule est 2e dans les deux ordres.
Correction : en B, ranger les cartes et donner le rang selon le classement épinglé de Comparer (Compacte 1re, Cellule
2e, Pro 3e), et laisser la puce verte au volume seul.

## Décision : tour 3 — NON
Aucun défaut restant ne change ce qu'il choisirait entre versions. Les défauts sont communs à un axe (B, C sans prix)
ou ce sont des retouches de mise en page (A3, B3, C3). La caisse, qui risquait de lui faire écarter tout l'axe C, est
partie. Les corrections ci-dessus se font sans nouveau tour de critique, puis les captures sont rouvertes par le pilote
avant la page.
Combinaison probable : **A1 + B3 + C3**, avec les cases de C1 avant Choisir.
Phrase prédite globale : « Ok là c'est propre, plus de trop juste. Le tableau, l'étiquette, et le calendrier après. »

LEÇON PROPOSÉE : un rang affiché doit nommer son critère, ou suivre partout le même classement épinglé. Un exemple de
critique dont la valeur est identique dans deux ordres (« 2e ») laisse le concepteur choisir le mauvais.
