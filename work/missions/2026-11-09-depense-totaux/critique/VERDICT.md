OK — 12 problèmes, 2 bloquants

Version : d71d78d6 (arbre de travail du 09.11, voies t1, c1, d2 et b1 appliquées, non commises)
Banc : `voies/d2/banc` (lectures rejouées anonymisées de `tests/unit/finance/controlesPiece.pieces.ts`), Vite :5199, Chrome réel sans écran. 16 planches de d2 regardées (`voies/d2/captures/`), plus 19 captures de gestes à moi (`critique/captures/`, scripts `critique/gestes.mjs` et `critique/recherches.mjs`). Aucune `ERREUR PAGE`. Les trois captures du brasseur (`captures-brasseur/`) ouvertes et mises côte à côte avec la pièce rejouée de la tache.

## Table

| capture | thème | largeur | état | problèmes | bloquants |
|---|---|---|---|---|---|
| bauhaus-tache-390-clair | clair | 390 | repos · pastille Photo touchée · recherche « T07 » | 3, 4, 5, 6, 7, 9, 12, 13 | — |
| bauhaus-tache-390-cave | cave | 390 | idem | idem | — |
| bauhaus-tache-1280-clair | clair | 1280 | idem (clip 470 px ; plein format : C3) | 3, 4, 5, 6, 7, 9 | — |
| bauhaus-tache-1280-cave | cave | 1280 | idem | idem | — |
| bauhaus-copie-390-clair | clair | 390 | repos (section doublon) · pastille Somme touchée → focus recherche · « C05 » | 2, 3, 4, 5, 9 | 2 |
| bauhaus-copie-390-cave | cave | 390 | idem | idem | 2 |
| bauhaus-copie-1280-clair | clair | 1280 | idem (bloc hors clip ; plein format : C2) | 2, 3, 4, 5, 9 | 2 |
| bauhaus-copie-1280-cave | cave | 1280 | idem | idem | 2 |
| sunstore1-390-clair / cave | clair, cave | 390 | repos · « ibu » (1 sur 2) | 3, 12 | — |
| sunstore1-1280-clair / cave | clair, cave | 1280 | idem | 3, 12 | — |
| sunstore2-390-clair / cave | clair, cave | 390 | repos · « vaccin » (3 sur 5) | 1, 3, 7, 12 | 1 |
| sunstore2-1280-clair / cave | clair, cave | 1280 | idem | 1, 3, 7, 12 | 1 |
| critique A1 tache « serre » | clair | 390 | aucune ligne : « Aucune ligne ne contient « serre » : l'article manque dans les lignes lues », « 0 trouvée · 23 masquées » | 4 | — |
| critique A2/A4 tache « 14,90 », « 14.90 » | clair | 390 | aucune ligne (juste : 14,90 est une des 6 lignes perdues de cette lecture) | — | — |
| critique A3 tache « 8,85 » | clair | 390 | 2 lignes sur 23, « 2 trouvées · 21 masquées », groupe 2/23 · 17,70 | — | — |
| critique A5 « T1 », A6 copie « 66,95 », A8 « 86 », A7 sun2 « rabais » | clair | 390 | 10/23 · 1/22 · 1/23 · 2/5 ; Échap vide le champ et lève le filtre | 1 (A7 : « 2 pièces · −2,58 ») | 1 |
| critique B1 tache pastilles Articles, Somme ; B2 lien « Chercher la ligne manquante › » | clair | 390 | focus dans « Chercher dans les lignes lues », champ entouré | 6 | — |
| critique B3 / C1 bande « Ajouter la ligne » (tache, copie) | clair | 390 | ligne neuve « Ligne sans libellé » ouverte, focus quantité, en-tête « 24 · 23 pièces + ? · 234,40 + ? » | 10 | — |
| critique B4 bande « Photo » | clair | 390 | défile en haut sur « Ouvrir le PDF original · Changer » | 11 | — |
| critique B5 bande « Chercher » | clair | 390 | focus dans le champ juste au-dessus | 9 | — |
| critique D1 sun2 ligne Rabais ouverte ; D2 sun2 1280 plein | clair | 390, 1280 | « 1 pièce / L × −0,68 = −0,68 », « imprimé NoVatTax - 0% », « Autres 5 · 6 pièces » | 1 | 1 |

## Combien et quels problèmes ? 12, dont 2 bloquants

Bloquants
1. **Les rabais sont des pièces.** Sun Store 2 : l'en-tête du groupe dit « Autres 5 · 6 pièces · 149,25 » pour 4 pièces achetées (1 + 2 + 1) ; chaque rabais s'affiche « Rabais · 1 pièce × −0,68 · −0,68 », avec un picto d'article, une quantité 1 et une unité pièce/L une fois ouvert ; en recherche « rabais » : « 2 pièces · −2,58 ». Valeur fausse, et une remise n'a ni quantité ni unité chez un brasseur. Le bloc dit pourtant « 3 · 2 rabais » juste au-dessus : la liste et le bloc se contredisent. Le rabais n'est pas « sous son article » : c'est une rangée pleine, identique à un article, la seule différence est la bande de couleur partagée. Correction : sous-ligne indentée sous l'article réduit (le net de l'article à droite), sans picto, sans quantité ni unité, non comptée dans « pièces » ; ou au moins « — × — · −0,68 » et un compte de pièces qui exclut `discount`. (SPEC 09.11 « si elle compte bien les lignes » ; vérité b1 : 3 articles + 2 remises ; D123 : la forme est un choix à lui montrer si on hésite, pas une raison de laisser le faux compte.)
2. **Sur la copie, la pastille envoie vers le mauvais geste.** « ✓ Articles lus = imprimés 22 » puis, juste en dessous, « Somme ≠ imprimé 196,65 / 352,05 −155,40 · Chercher la ligne manquante › » : si toutes les lignes sont là, il ne manque pas de ligne, un montant est faux (ici 66,95 lu pour 6,95 : c'est le piège de cette pièce, SPEC 09.11 « le total match pas, c'est justement un piège »). Le toucher met le focus dans la recherche d'une ligne qui n'existe pas ; aucun chemin vers « modifier un item ». Correction : quand le compte concorde et la somme non, le geste devient « Vérifier les montants › » et ouvre la ligne la plus suspecte (le plus gros montant, ou celui que `coupablesDeLEcart` désigne) ; « Chercher la ligne manquante » reste pour le cas où le compte manque aussi (la tache). (SPEC 09.11 « guidée l'utilisateur sur quoi faire. Enlevé ou modifier un item, en ajouter ? ».)

À corriger
3. **Deux verdicts contraires sur le paiement, à un centimètre.** Le bloc dit « ✓ Payé · TWINT 352,05 » (ou 14,60, 149,25) et la tuile « Règlement » en dessous dit « supposée · Payé le 02.11.2026 » avec une pastille « 1 » à contrôler. Sur les 4 pièces, 2 thèmes, 2 largeurs. Quand le payé est lu (reçu ou terminal égal au total), la tuile doit dire « lu · TWINT » et perdre sa pastille.
4. **Le même écart écrit trois fois.** Tache à 390 : bloc « À vérifier · 117,65 CHF · 6 articles » + rangées, puis la bande sous la recherche « 117,65 CHF · 6 articles non retrouvés · ligne illisible, cachée ou rabais ? » avec trois boutons, puis le pied « 117,65 CHF non retrouvés dans les lignes ». À 1280, bloc et bande sont côte à côte. Le brasseur a dit « Donne aucune info » de la phrase du pied ; trois copies ne donnent pas plus d'information. Garder le bloc (avec ses gestes) ; la bande n'apparaît qu'une fois la recherche ouverte ou vide de résultat ; le pied se tait quand le bloc parle. (DEFAUTS : cockpit, trop de texte.)
5. **« Qté × prix 23/23 · incomplet »** : deux mots contraires, pastille « · » grise, la même que pour un contrôle absent (t1 l'avait écrit). Dire ce que ça veut dire : « 23/23 justes · 6 lignes non lues », ou fondre la rangée dans « Articles ».
6. **« Articles lus ≠ imprimés 23 / 29 »** : le ticket BAUHAUS n'imprime aucun nombre d'articles ; 29 est le comptage des montants par la lecture (`countedAmounts`), 28 ou 29 selon le tirage (b1 r1). « imprimés » promet une valeur que le brasseur cherchera en vain sur son ticket. Écrire « 23 lues / 29 comptées ». Sun Store 2 « Articles lus = imprimés · 3 · 2 rabais » : même mot.
7. **Le banc ne joue pas la lecture réelle de l'app (L28, L14).** Les fixtures enjolivent trois champs : Sun Store 2 `amountPaid: 149.25` alors que la vraie lecture ne l'a jamais (non imprimé ; terminal 163,85 ≠ total, donc `payeEffectif` rend null et l'écran réel dirait « montant payé non lu ; terminal 163,85 ») ; tache `photoIncomplete: true` alors que les 5 tirages réels disent `false` (la rangée « Photo incomplète » et le mot « Photo » du drapeau n'existeraient pas en ligne) ; `review.readers 3, findings []` donne « Lectures 3/3 d'accord » alors que b1 voyait 45 et 25 désaccords sur les Bauhaus. Ce que j'ai vu de « Payé » et de « Photo » n'est donc pas ce que le brasseur verra. Avant de dire tenu : rejouer l'écran sur les lectures finales de `H13-reels/banc-b1-r1-*` (comme `capturer-b1.mjs` le faisait), puis en ligne après `aiTask`.
8. **Aucune pièce n'exerce « modifier ou retirer une ligne » depuis une pastille.** Les gestes `ouvrir-ligne` (hors articles, prix, doublon, ligne en trop) ne se lèvent sur aucune des quatre pièces ; seuls les tests d'intégration de d2 les couvrent. Une pièce avec une ligne en trop ou un prix éloigné du stock à montrer (fixture) : c'est la moitié de ce qu'il a demandé.

Mineurs
9. Le bouton « Chercher » de la bande met le focus dans le champ de recherche situé un centimètre au-dessus : geste inutile, il prend la place.
10. « Ajouter la ligne » (bande) ouvre bien une ligne neuve, mais le focus est sur la quantité et la ligne est déjà toute en rouge (« unité à remplir ») avant la première frappe ; quand on ajoute « SERRE-JOINT 14,90 », on tape le nom d'abord.
11. Pastille « Photo » et bouton « Photo » : on arrive sur la barre « Ouvrir le PDF original · Changer » ; la photo n'est pas montrée, il faut un second toucher. « PDF » pour un ticket photographié vient du banc (type `application/pdf`) ; à vérifier dans l'app réelle.
12. « Lignes hors articles · Photo · rien à signaler » : une rangée verte qui ne dit rien, sur 4 pièces sur 4 ; et à 390 sur la tache le bloc occupe 60 % de l'écran avant la première ligne (d2 : ≈ 330 px). Les contrôles sont sa demande ; les rangées muettes pourraient tenir dans l'en-tête du bloc (« 4 autres contrôles : rien à signaler »).

## Ce qui tient (vu)
- Le bloc remplace l'ancien (celui qu'il a entouré) : chaque rangée en écart montre les deux valeurs, l'écart signé et un geste ; le drapeau « À vérifier · 117,65 CHF · 6 articles » se lève sur les deux Bauhaus et sur aucune Sun Store ; Sun Store 1 et 2 sont tout en vert avec « Le terminal affiche 163,85, plus que le total » en information, sans drapeau (le piège EFT tenu).
- « Payé » juste sur Sun Store 1 (14,60) et sur les Bauhaus (352,05) ; voir 7 pour Sun Store 2.
- « Brut − rabais 149,25 / 149,25 » n'apparaît qu'avec des remises ; « TVA recalculée 0,37 / 0,37 » seulement hors 0 %.
- Mini recherche : « serre » → phrase claire d'absence ; « 8,85 » 2 lignes ; « 86 » trouve 86,85 ; « vaccin » 3 sur 5 ; « ibu » 1 sur 2 ; Échap vide et lève le filtre ; « Toutes les lignes » visible ; groupe « 2/23 · 17,70 » recalculé sur les trouvées.
- La phrase « … de moins » est remplacée : « 117,65 CHF non retrouvés dans les lignes », « Lignes = total 14,60 ».
- Lisible en cave et en clair, rien de coupé ni chevauché à 390 ni à 1280 (hors clip du script d2, artefact de capture).

## Doutes (non comptés)
- La tache rejouée est la lecture d'avant c1 (23 lignes sur 29) ; après c1 (28 ou 29 lignes) l'écart affiché serait 74,45 à 83,35 et « Articles » passerait au vert ou à −1 : le brasseur verra un autre écran que celui-ci.
- Section « Achat peut-être déjà enregistré » : occupe tout le premier écran à 390 sur la copie avant même le montant ; existant, voulu, mais à côté du nouveau bloc cela fait beaucoup avant la pièce.
- Le mot « rabais ? » dans « ligne illisible, cachée ou rabais ? » sur une pièce qui n'en a pas (Bauhaus).
