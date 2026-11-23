OK — 46 problèmes, 24 bloquants. Note : 4/10.

# Critique 4 — carnet porté, fusion m390 + d1280 (18.11)

Version : banc `?preview=carnets`, worktree port-carnet HEAD `e0073224e`, IA simulée, fixture « ZZ TEST — … ». Critique : Opus
(Fable interdit). Sources : `CRITIQUE-4-m390.md` (27 problèmes, 12 bloquants, 5/10) et `CRITIQUE-4-d1280.md` (29 problèmes,
15 bloquants, 5/10). Question unique : combien et quels problèmes ? Tailles : [390], [1280] ou [390 + 1280]. « texte » signifie
que le point est jugé sur RAPPORT ou corr3, sans image.

Désaccords tranchés à l'image (4 ouvertes : d1280-clair-02, m390-clair-02, p2:i02-2, d1280-clair-13b, m390-clair-13) :
- **Liste vide (02)** : le rendu est identique aux deux tailles : « Aucun carnet encore. Par exemple : » suivi de trois puces.
  Il ne reprend ni i02-2 (cadre pointillé « Votre premier carnet s'affichera ici », « Un carnet garde » et ses trois lignes,
  bulle verte « Écrivez ici un besoin »), ni i06-2. Le « conforme » de m390 est donc faux : le point est **bloquant** aux deux
  tailles.
- **Texte · après** : 13b (variante G9) atteint bien « ✓ Rangé ici · Annuler » aux deux tailles. En revanche, 13 (texte simple)
  reste sur « L'IA range… » et colle la phrase brute en 4e ligne de « Ce qui compte », aux deux tailles : **bloquant** [390 + 1280].
- **Sévérités relevées** : quand une part juge bloquant et l'autre gênant, le point est bloquant s'il s'agit d'un retenu absent
  ou d'une absurdité métier (G5, G35, critère « plus de condensation », lien non lu classé).
- **D-n absents des deux parts** : D-35 et D-63 deviennent bloquants (problèmes 23 et 24).

**Bilan : 46 problèmes, dont 24 bloquants, 15 gênants et 7 mineurs.** Ce qui tient : un seul champ, la phrase citée là où elle
est rangée, « Annuler » sur place, le tableau qui naît au 2e article, la suppression v2 fidèle à g4:v02-18 (« 1 lien le
retient »), les écartés visibles avec leur raison, la veille éteinte « demandée · pas encore relevée », et l'habit de l'app
lisible dans les deux thèmes. Ce qui casse : les écrans figés (liste vide, cartes, fiche, Comparer, Pourquoi) s'éloignent de
ses maquettes, et l'IA recopie au lieu de mettre en forme, de classer et de conclure (D-122).

## Problèmes

### Bloquants (24)

1. **Pictos génériques [390 + 1280] (01, 05, 18, 23, 28b, deux thèmes ; réf. p2:g05-1, g5:v06-10)** : le même cube vert sur
   chaque carnet, chaque article et le choisi, au lieu d'un picto ou d'une photo par objet (hotte, évier, tireuse, frigo).
   « C'est quoi ces cubes ? On sait plus ce que c'est. » Retenu manquant (R01, R04, D-25, D-78).
2. **Liste vide [390 + 1280] (02 ; réf. p2:i02-2, i06-2)** : il n'y a que trois puces dans un écran blanc. Il manque le cadre
   « Votre premier carnet s'affichera ici », « Un carnet garde » avec ses trois lignes (objets, prix, choix) et la bulle
   « Écrivez ici un besoin ». « C'est vide, ça dit pas à quoi ça sert. » Retenu manquant (R02, D-97).
3. **Liste : « dès 180 CHF » [1280] (01, 23)** : 180 CHF est le prix du ventilateur de plafond, qui est écarté. Le premier prix
   encore en lice est 420 CHF. « 180 ? C'est celui que j'ai écarté. » Valeur fausse.
4. **Créer : « Ce qui compte » recopie la phrase [390 + 1280] (05, 07)** : toute la phrase est reprise, titre compris
   (« ZZ TEST — Moulin à malt : 2 cylindres, 150 kg/h minimum »). G5 demande le critère seul : « 2 cylindres, 150 kg/h ».
   « Elle recopie ma phrase, elle aide pas. » Retenu G5 manquant (D-122).
5. **Carnet ouvert, tableau [390 + 1280] (09, 13, 33 ; réf. p2:h05-3)** : les lignes n'ont ni vignette, ni origine et délai
   (« CH · sur commande »), ni œil de veille. Les façons sortent en cartes au-dessus du tableau, sans « capte la buée / ne
   capte pas », et la conclusion « Retenir la hotte » manque. « La carte de l'article dit rien. » Écart à l'écran figé (R03,
   D-99).
6. **Lien non lu classé [390 + 1280] (09, 27, 33, 35c)** : le lien est classé 5e et s'affiche « exemple.invalid – – – ». Il
   n'a ni « ? », ni « Lien sans aperçu · à relire », ni « Ouvrir ↗ », dans le carnet comme dans Comparer. « Il classe un truc
   qu'il a pas lu ? » Écart à h05-3 (R03). Le correctif corr3-L2 ne couvre que Comparer.
7. **Texte · après non atteint [390 + 1280] (13 ; 44b texte)** : « L'IA range… » tourne encore. La phrase brute est collée,
   préfixe compris, en 4e ligne de « Ce qui compte » (« ZZ TEST — buées au-dessus de la cuve, 1 200 m³/h »). Il n'y a pas de
   « ✓ Rangé ici · Annuler ». « Elle range rien, elle colle ma phrase. » Retenu manquant (R14, R24, D-129).
8. **Lien · après [390 + 1280] (18 ; réf. g5:v06-10)** : la carte n'a ni photo, ni caractéristiques. « lu sur la page :
   débit » ne donne aucune valeur, et « tient 80 °C » est écrit deux fois. « CHF » et la marque « exemple » manquent. « Il a lu
   le débit et il me le montre pas ? » Retenu manquant (R17, D-78).
9. **Lien sans retour [390] (21, ECHEC dans les deux thèmes)** : le bandeau dit « ✓ Rangé ici » sans dire quoi. Il n'y a ni
   « page non lue », ni « Ouvrir ↗ », ni le lien en clair. « J'ai collé un lien, il est où ? » Geste sans retour (R25).
10. **Le tableau naît [1280] (19 ; réf. g5:v06-11)** : la pompe à 690 CHF est classée 1re et celle à 245 CHF 2e, alors que le
    prix est la seule colonne. Après deux liens, « Ce qui compte » reste « rien encore ». Rien de ce qui est lu (débit, °C)
    n'entre dans le tableau. « Ça classe pas super super. » Valeur fausse (R26, D-141).
11. **Note en vrac, pas de mise en forme [390 + 1280] (22, 23, deux thèmes ; réf. g5:v01-16)** : chaque ligne devient « note »
    et est recopiée brute. Il manque le type à faire / question / à acheter avec son ▾, le carnet ▾, la reformulation et le
    « +2 · question, à acheter » sur les cartes. « Il a juste recopié ma liste. » Retenu manquant (R18, R19, R24, D-123, D-129).
12. **Cartes d'article [390 + 1280] (25 ; 09, 18 ; réf. p2:h03-5)** : l'état R04 montre le tableau au lieu des cartes. Il manque
    la photo, la valeur du critère en gros, la réglette et « Veiller ». Retenu manquant (R04, D-101).
13. **Article ouvert [390 ; 1280 texte] (26b ; réf. p2:h01-6)** : il manque la photo de la page et le héros du critère (valeur en
    gros, « la plus basse des 5 »). Les caractéristiques n'ont pas leur rang. Il n'y a qu'une offre, sans prix barré, et
    « Choisir » est noir au lieu de vert. Écart à la maquette figée (R05, D-102).
14. **Comparer [390 + 1280] (27, deux thèmes ; réf. p2:g01-8)** : le « Compromis : la 1re, … » de l'IA manque, ainsi que les
    vignettes et « Valeurs annoncées par les vendeurs ». À 390, les noms tiennent sur 4 lignes et la 4e colonne est coupée.
    « Il compare rien, il me fait un tableur. » Retenu manquant (R06, D-103, D-122).
15. **Sens métier : « plus de condensation au plafond » [390 + 1280] (10, 21, 27, 28b, 39, 43)** : la phrase est proposée comme
    critère (bulle G8), rangée dans « Ce qui compte » et cochée comme raison du choix. C'est sa plainte : il en veut moins.
    « Plus de condensation ? Je veux l'inverse. » Absurdité (L14), vue en 2 secondes.
16. **Choisir [1280] (28 ; réf. p2:g05-11)** : le cadre de la 1re ne nomme pas l'article (« 2 600 Inox Broye · CH »), et
    « Pourquoi » est un champ vide à taper. « Il y a trop besoin d'action et pas assez d'aide de l'ai. » (R07, D-122).
17. **Pourquoi ce choix [390 + 1280] (28b, deux thèmes ; réf. p2:g05-11)** : il n'y a qu'une phrase, sa propre ligne recopiée,
    et des ✓. Il manque la phrase de l'IA avec ses valeurs, les réglettes « 1er sur 5 » et « 4e sur 5 », la ligne ✕ de
    l'écarté (que 29b, la fixture Frigo, montre pourtant) et la photo du choisi. « Dans six mois je sais plus pourquoi j'ai pris
    celle-là. » (R07, D-20, D-104).
18. **Doublon [390 + 1280, texte] (12, 12b, ECHEC dans les deux thèmes)** : « Garder à part » ne paraît jamais. Aucun appelant
    ne passe `doublon` à `CadreArrivee` (corr3-L4). Retenu absent (R13, G11), geste injoignable.
19. **Note · aide IA [390] (33)** : la feuille « Ressemble à un critère · Passer » n'est jamais atteinte, car la fixture n'a pas
    de note qui ressemble à un critère. G25 à G27 ne sont pas montrés.
20. **Supprimer une idée en veille [390 + 1280] (36b, deux thèmes ; réf. g4:v02-18)** : l'offre G35 « 2 articles en veille :
    les déplacer dans <carnet proche> · Déplacer » manque. Le jeu de test n'a pas de carnet proche. Retenu absent (G35, R23).
21. **Photo [1280, texte] (44b)** : après l'envoi, il n'y a ni vignette « non lue », ni aucune trace de la photo. Geste sans
    effet visible (R24).
22. **IA éteinte ou hors ligne sans retour [390] (42, 43)** : rien ne dit que l'IA est éteinte, et « filtre à air G4,
    2 pièces » (un achat) est rangé en note. Hors ligne, l'écran dit « rangé sur place » sans montrer ce qui a été rangé.
    *Note de fusion : m390 classait ce point en doute ; il passe en bloquant, rattaché à l'état IA en échec (36), car c'est un
    geste sans retour visible.*
23. **D-35, caractéristiques acceptées d'un toucher [390 + 1280]** : absent des deux parts, jamais montré au banc.
24. **D-63, son scénario joué de zéro sans fixture [390 + 1280]** : non joué dans les deux parts.

### Gênants (15)

25. **« L'IA range… » sous un bandeau fini [390 + 1280] (07, 23, deux thèmes)** : la roue tourne sous « Carnet créé » ou
    « ✓ 3 lignes rangées ». « C'est fini ou pas ? » Pourtant, corr3-L3 annonçait ce point corrigé.
26. **Créer · après : trois bandeaux empilés [1280] (07)** : « Carnet créé », « L'IA range… » et « Ce qui compte » s'empilent
    au-dessus des rubriques vides. La maquette g5:v04-4 n'en a qu'un.
27. **Créer · après : en-tête réduit [1280] (07)** : « Photos · aucune » manque. « Idée · 17 nov. / Ensuite : l'IA cherche
    les façons » est réduit à une pastille (R11).
28. **Créer · avant [1280] (03)** : l'écran n'a aucun état propre et reste identique au repos (D-130).
29. **Champ trop étroit [1280] (01, 07, 19)** : le champ fait 270 px, et « Ajouter à Moulin à m » est coupé. Au repos, il
    recouvre « En veille », avec un filet gris flottant au-dessus (R27, G7).
30. **Mauvais placeholder [1280] (27, 28, 28b)** : dans un carnet, le champ dit « Une idée, un besoin… » au lieu de « Ajouter à
    Ventilation… » (G7).
31. **Champ flottant [1280] (13)** : le champ est à 70 px du bas, sur une bande blanche, et les segments ont disparu.
32. **Critère affiché ≠ classement [390 + 1280] (27)** : l'en-tête annonce un critère, mais le tableau est « rangé par : tient
    80 °C d'abord, puis le débit » (R26).
33. **Modifier une note [390 + 1280] (32b)** : le cadre « Se modifie ici » est vide, en haut du carnet, loin de la note. On ne
    voit pas laquelle on modifie (R20).
34. **Annuler une suppression [390 + 1280] (35c, ECHEC dans les deux thèmes)** : la note revient, mais « Note supprimée ·
    Annuler » reste affiché. « Elle est supprimée ou pas ? »
35. **Supprimer une idée liée [390] (38)** : « votre phrase en titre » s'affiche seul, sans la phrase. Texte faux.
36. **IA en échec [1280] (41)** : l'état ne se distingue pas de « L'IA range… » en cours. Aucun avis ne dit que c'est raté.
37. **Clavier ouvert, 300 px [390] (39)** : la bulle G8, la puce « Coller : … » et le champ prennent la moitié de l'écran. Il
    reste environ 180 px de carnet visibles (R27, CARNET-CLAV).
38. **Lisibilité des tableaux [390] (09, 25, 33)** : les noms tiennent sur 2 à 5 lignes, et l'en-tête « tient 80 °C » sur 3
    lignes (D-38, CARNET-LIS).
39. **À venir [390 + 1280] (30b)** : deux « + » à l'écran (« + Besoin » et le + volant). À 390, « Ouvrir le carnet » est répété
    sous chaque ligne et le titre est coupé (« Ventilation de l… ») (D-42).

### Mineurs (7)

40. **Prix sans CHF [390 + 1280]** : 18, 26b (offre), 28b.
41. **Écartés [390 + 1280] (25, 27)** : le nom est répété, avec un accord faux (« Ventilateur de plafond écartée »).
42. **Supprimer une idée liée [390] (38)** : le lien tient sur 5 lignes, et la puce « À venir · … » double la carte « dans
    À venir ».
43. **Liste [390] (01, 23)** : « 3 façons · 6 articles · 1 en veille » tient sur 2 lignes. La pastille « À comparer » est beige
    au lieu de verte (g05-1). La carte Pompe dit « 0 façon ».
44. **Texte · après G9 [390 + 1280] (13b)** : le critère reformulé (« Un fût de 30 L couché entre dans le bac ») perd le
    « 38 cm » de sa phrase.
45. **Supprimer grisé [1280, texte] (38)** : contraste faible.
46. **Largeur de colonne [1280] (27)** : Comparer fait 900 px, contre 736 px ailleurs.

### Doutes (non comptés)

- 52d : la raison de l'écart est affichée, mais le mot attendu reste à vérifier.
- Le 4e article est marqué « moins bien partout » alors que sa tenue à 80 °C est inconnue. C'est défendable sur les valeurs
  connues.
- Habit (R29) : au banc, la barre « Banc — données simulées » remplace l'en-tête et le segment Stocks. En dev-local (46),
  l'en-tête est là ; reste à le confirmer sur Carnets.
- Dev-local 46 : le + volant y est vu sur Articles, pas sur Carnets ; l'action « Nouvelle idée » n'a pas été trouvée (D-42).
- 05 : « arrive ici » est suivi des grandes cartes, et non de la liste compacte de v08-3. C'est peut-être voulu hors du cas
  « carnet proche » (04, non ouvert).
- Fil de chat (D-142) : il attend les mini maquettes du lot E.
- 09 à 1280 est pris défilé, donc la tête du carnet n'y est pas jugée. 45 : « Dicter » n'est pas trouvé, alors qu'un micro est
  visible (nom accessible à vérifier). 49 ne montre pas le cas lié. La provenance des captures de 02:42 à 02:46 n'est pas
  garantie.
- Build : le contrôle de confidentialité a échoué (`dist` absent) et n'a pas été relancé. D-11 (graphe kh1r) n'apparaît pas
  dans 30b à 1280.

## D-n → capture (fusion)

| D-n | 390 | 1280 | État fusionné |
|---|---|---|---|
| D-96 liste | 01, écart | 01, écart | écart (1, 3, 43) |
| D-97 liste vide | 02, « conforme » | 02, retenu manquant | écart, tranché à l'image (2) |
| D-99 carnet ouvert | 09, 21, 43 | 09, 13 | écart (5, 6, 38) |
| D-101 cartes d'article | 25 absent | 09, 18 muettes | absent (12) |
| D-102 article ouvert | 26b | texte | écart (13) |
| D-103, D-21, D-23 comparer | 27 | 27 | écart (14, 32) |
| D-52 écartés visibles | 27, 25 | 27, 52d | vu (41) |
| D-104, D-20 pourquoi | 28b | 28, 28b, 29b | écart (16, 17) |
| D-105, D-1 À venir, Réalisés | 30b ; 31b texte | 30b | vu (39) |
| D-11 graphe kh1r | 30b (groupé) | absent à l'image | doute |
| D-130 créer avant | texte | 03, sans état propre | gênant (28) |
| D-131 créer pendant | 05 | 04, 05 | écart (4) |
| D-132, D-111 créer après | 07 | 07 | écart (4, 25, 26, 27) |
| D-133 ajouter avant | 10 | texte | vu (15) |
| D-134 texte pendant | 11 texte ; 12, 12b | 11 juste | doublon absent (18) |
| D-135 texte après | 13b conforme | 13 non atteint | 13 non atteint aux deux tailles (7) ; 13b (44) |
| D-136 lien avant | puce en 35c, 39 | puce en 35c | vu |
| D-137 lien pendant | 16 texte | 16 texte | texte, juste |
| D-138, D-27 lien après | 18, 21 | 18, 19 | écart (8, 9, 10) |
| D-139, D-124, D-126 note en vrac pendant | 22 texte | 22 | écart (11) |
| D-140, D-122, D-123 note en vrac après | 23 | 23 | écart (11, 25) |
| D-118 modifier une note | 32b | 32b | vu (33) ; aide IA absente (19) |
| D-119 renommer | 34 à 34d texte | texte | texte |
| D-120 supprimer une note | 35c | 35c | vu (34) |
| D-121, D-47, D-47b supprimer une idée | 36b, 38 | 36b, 38, 49 | vu (20, 35, 42, 45) |
| D-142, D-19, D-113, D-53, D-129 un champ, l'IA trie | fil conforme, mise en forme faible | l'IA ne met pas en forme | écart (4, 7, 11) ; fil : lot E |
| D-122 moins d'action, plus d'IA | — | manqué | écart (4, 10, 14, 16, 17) |
| D-13, D-17 critère | 07, 13b, 21 | — | écart (4, 15) |
| D-10, D-16 façons | 21, 43 conforme | — | vu |
| D-18 5 ou 6 articles | 25, 27 | — | vu |
| D-22, D-28, R31 veille | 18, 26b | 18, 26b | juste |
| D-24, D-30 générique | 18, 26b | 01, 19, 23 | pictos génériques (1) ; aucun critère proposé (10) |
| D-25, D-78 carte et fiche parlantes | 01, 18, 26b | 01, 18 | écart (1, 8, 13) |
| D-29 un geste par action | 05, 07, 13b conforme | — | vu |
| D-35 caractéristiques acceptées d'un toucher | absent | absent | **bloquant (23)** |
| D-36 tâches chronométrées | 54 texte | — | texte |
| D-38 lisibilité | 09, 25, 27 | — | écart (38) |
| D-40, D-72 idée du calendrier | hors part | devlocal-56e texte | texte |
| D-41 rien ne se perd | 43 | non jugé | vu (22) |
| D-42, D-68, D-74 + volant | conforme | à droite, action Carnets non vérifiée | vu ; doublon « + » (39) |
| D-46, D-76 pastilles « lié à » | 55 texte | 55 texte | texte |
| D-54 champ au-dessus du clavier | 39 | non joué | écart (37) |
| D-63 scénario de zéro | non joué | — | **bloquant (24)** |
| D-65, D-69, D-80, D-85 thème | lisible | tient | vu ; en-tête au banc (doute) |
| D-128 centré sur l'achat | 18 | — | vu |
| D-83, D-108, D-114, D-55 refusés | — | absents | bien |
| D-31, D-32, D-34 ; D-2, D-6, D-8, D-45 ; D-143, D-144 | hors part | — | hors écran carnet ou à dessiner |

## Ce qu'il dirait

« Le chat marche, je vois mes phrases. Mais mes écrans choisis (la liste vide, les cartes, la fiche, la comparaison, le
pourquoi), c'est pas eux. Tout a la même icône. Et l'IA trie rien : elle recopie ma phrase, met tout en note, prend "plus de
condensation" pour un critère et me dit pas laquelle prendre. »
