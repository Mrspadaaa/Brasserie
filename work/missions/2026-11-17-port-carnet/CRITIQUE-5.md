OK — 43 problèmes, 18 bloquants. Note : 5/10.

# Critique 5 — carnet porté, fusion m390 + d1280 (18.11)

Version : banc `?preview=carnets`, HEAD `d15b72a3f` (RAPPORT-d1280), IA simulée, fixture « ZZ TEST — … ». Critique : Opus (Fable
interdit). Sources : `CRITIQUE-5-m390.md` (24 problèmes, 9 bloquants, 6/10) et `CRITIQUE-5-d1280.md` (22 problèmes, 5 bloquants,
6/10). Critique 4 fusionnée : 46 problèmes, 24 bloquants, 4/10. Tailles : [390], [1280] ou [390 + 1280] ; « texte » = jugé sur le
RAPPORT, sans image.

La passe progresse (24 → 18 bloquants, 4 → 5/10), mais 12 bloquants viennent de captures et 6 de preuves absentes aux deux tailles.

Désaccords tranchés à l'image (4 ouvertes : m390-clair-28, d1280-clair-24, m390-clair-41, d1280-clair-19) :
- **Choisir / choisi** : pas de contradiction, deux états différents. m390-28 est le cadre « Choisir » avant le choix : un tableau
  « Ses autres valeurs », sans réglettes, sans ✕ ni photo. d1280-24 est le « choisi · pourquoi » après le choix : les réglettes
  y sont, mais posées sur des pastilles grises. Deux lignes (10 et 25).
- **IA en échec** : pas de contradiction non plus. m390-41 ajoute une note à un carnet existant ; aucun avis d'échec n'y paraît,
  le bandeau est celui d'une réussite. d1280-19 crée un carnet ; l'avis « L'IA n'a pas répondu » est là, mais « Ensuite : l'IA
  cherche les façons » reste affiché. Une ligne (18).
- **Sévérités** : un point jugé bloquant d'un côté et gênant de l'autre devient bloquant s'il s'agit d'un retenu absent (photo de
  l'article ouvert, 8).
- **Retiré** : m390 n° 22 (« on garde sa photo, son prix, et on le surveille » promettrait trop). Cette phrase est dans sa maquette
  i06-2, et la règle n° 1 la garde. Le point passe en doute.

Phrase prédite : « Ça ressemble enfin à l'app, mais je colle un lien et il me dit rien, ma note en vrac ne se découpe pas, et le
tableau est caché sous un pavé. »

## Problèmes

### Bloquants (18)
1. **Carnet ouvert, « Ce qui compte » [390 + 1280] (m390-09, d1280-07, deux thèmes ; réf. p2:h05-3).**
   - Le bloc est un encadré de 4 lignes, « tiré de votre phrase ». h05-3 n'a qu'une ligne : « Critère : … · proposé par l'IA ».
   - À 390, le tableau des façons tombe sous trois blocs et n'en montre que 2 lignes.
   - À 1280, les critères « tient 80 °C » et « le débit » sont attribués à sa phrase (« buées au-dessus de la cuve ») : c'est faux.
   - Il dirait : « C'est pas la vue que j'ai choisie, le tableau est en bas. »
   - Écart au figé (R03, D-99, D-13). Correction : une ligne « Critère : … · proposé par l'IA », comme h05-3.
2. **Créer · après [390 + 1280] (m390-07, d1280-06 ; réf. g5:v04-4).** À 390, un encadré vert reprend toute la phrase comme critère
   (« Moulin à malt : 2 cylindres, 150 kg/h »). À 1280, trois blocs s'empilent (Idée, bandeau « Carnet créé », bandeau « Ce qui
   compte »). v04-4 n'a qu'un bandeau, puis des rubriques à filet, dont « Ce qui compte · rien encore : l'IA le proposera ». Il
   dirait : « Ce qui compte c'est 150 kg/h, pas "moulin à malt". » (D-132, G12)
3. **Texte · pendant [390 + 1280] (m390-11, d1280-11).** Le cadre annonce « va atterrir ici · Ce qui compte : … ». Pourtant, à 390,
   la phrase finit « Rangé dans Évier inox », et aucune puce « Va dans » ne propose ce carnet. La promesse est fausse. Il dirait :
   « Ça me dit ici, puis ça part ailleurs ? » Le cadre doit nommer le carnet visé dès la frappe (G4). (D-134, D-122)
4. **Texte · après : chiffre inventé [1280] (d1280-12).** Il tape « fond de bac 38 cm minimum » et l'écran range « Un fût de 30 L
   couché entre dans le bac (38 cm) ». Le 30 L vient de l'exemple G13, que l'IA simulée rend quelle que soit la phrase. « assez
   profond pour un fût » disparaît aussi de « Ce qui compte ». C'est une valeur fausse (R45). Il dirait : « J'ai jamais parlé de
   30 L. » À vérifier à 390 : m390-13 ne montre que le rangement.
5. **Clavier ouvert, 300 px [390] (m390-39).** La bulle G8 prend toute la hauteur libre sur 4 lignes ; il ne reste qu'un filet du
   carnet. corr4-D promettait une ligne et environ 340 px de carnet. (D-54, R27, CARNET-CLAV)
6. **Lien · après [390 + 1280] (m390-18, d1280-15 ; réf. g5:v06-10).**
   - À 390, collé dans Ventilation, le lien ne laisse rien dans ce carnet. Le compteur passe pourtant de 6 à 7 : un carnet est né
     ailleurs, sans que l'écran le dise.
   - À 1280, la carte se réduit au nom, au vendeur et au prix. Il manque les caractéristiques (débit, °C) et la ligne « lu sur la
     page : … ».
   - Il dirait : « Je colle un lien, rien. »
   - Retenu absent (R17, D-27, D-138, D-78).
7. **Note en vrac [390 + 1280] (m390-23, d1280-16, d1280-17 ; réf. g5:v01-16).**
   - Il n'y a pas de pendant « ✻ L'IA découpe votre note » : la capture 16 est identique à la 17.
   - Chaque ligne est rangée seule (390), ou toute la note fait un seul carnet (1280).
   - Il manque « 3 lignes rangées dans 2 carnets », le type ▾ et le carnet ▾ de chaque ligne, et « › Texte d'origine ».
   - Il dirait : « Mais c'est justement ça que je veux, qu'il me mette en forme ! »
   - Retenu absent (R18, R19, D-139, D-140, D-123, D-126, D-129). Déjà signalé en critique 4.
8. **Article ouvert sans photo [390 + 1280] (m390-26, d1280-09 ; réf. p2:h01-6).** L'en-tête montre le nom seul, ou un picto au
   trait fin. Il manque la photo de la page collée, ou à défaut le picto en grand dans le cadre photo. Il dirait : « La carte est
   peu parlante, quand on clique dessus aussi. » Retenu absent (R05, D-102).
9. **Comparer, colonnes [390] (m390-27, deux thèmes ; réf. p2:g01-8).** On voit 2 colonnes sur 4, la 3e coupée, et environ 100 px
   de vide sous les noms. g01-8 en tient 3 à la même largeur. Correction : colonnes d'environ 170 px, sans ce vide. (R06, D-103)
10. **Choisir, cadre avant le choix [390] (m390-28 ; réf. p2:g05-11).** Il manque les réglettes (« débit 1 800 m³/h, 1er sur 4 »
    et prix), le ✕ de chaque écarté avec sa raison, et la photo du choisi. corr4-C est en échec : CarnetsVue ne passe pas
    `carnet`. Retenu absent (R07, R34, D-104). Ce cadre n'est pas capturé à 1280.
11. **Liste vide [1280] (d1280-02 ; réf. p2:i06-2).** Il manque le titre, la phrase, la carte exemple « Évier inox, 2 bacs ·
    exemple · ↓ arrive ici » et « Par exemple : … ». À la place, une bulle verte pointe vers le champ : c'est la flèche refusée
    (D-108). Correction : porter i06-2 telle quelle, sans la flèche. À 390, l'état n'est pas atteint (m390-02 montre la liste
    pleine). (R02, D-97)
12. **À venir [390 + 1280] (m390-30, d1280-22, deux thèmes ; réf. p2:h05-9).** La carte n'a ni vignette, ni « Abfülltechnik West ·
    en stock », ni « Fixer la date ». On voit à la place un « + mois ▾ » obscur et un « Modifier » noir pleine largeur. Le titre
    est redit (« ZZ TEST — Frigo… / du carnet ZZ TEST — Frigo… »), et à 390 la moitié de l'écran reste vide. Il dirait : « + mois,
    c'est quoi ? » (R08, D-105)
13. **D-35, propositions acceptées d'un toucher [390 + 1280]** : absent des deux parts, jamais capturé.
14. **D-63, scénario de zéro (CARNET-COEUR) [390 + 1280]** : absent des deux parts.
15. **D-131, créer · pendant, carnet proche [390 + 1280]** : non joué à 390 ; à 1280, la capture 04 n'atteint pas le carnet proche.
16. **D-118, modifier une note [390 + 1280]** : vu en critique 4 (32b) ; en vision-5, seulement « 32 texte » à 390, rien à 1280.
17. **D-120, supprimer une note [390 + 1280]** : vu en critique 4 (35c) ; absent des deux parts en vision-5.
18. **D-46, D-76, pastilles « lié à » [390 + 1280]** : non joué à 390, absent à 1280.

### Gênants (17)
19. **Carnet ouvert, ligne d'état [390] (m390-09).** La ligne « 2 façons à comparer · attend l'avis du ferblantier » de h05-3
    manque sous le titre (R03).
20. **Carnet défilé, conclusion [390] (m390-09b, m390-41).** « Le critère sépare les deux façons · Retenir la hotte » vient après
    l'écarté et le lien à relire, au lieu d'être collée au tableau. Il dirait : « La réponse est tout en bas. »
21. **Bulle G8 [390 + 1280] (m390-13, 18, 21, 23, 41, 43 ; d1280-08).** La même bulle de 4 lignes revient à chaque état. Elle
    propose comme critère la phrase du besoin (« capter la buée »), alors que le carnet dit déjà que seule la hotte tient 80 °C.
    À 1280, elle couvre la 3e ligne du tableau. C'est une aide qui n'aide pas (D-122, D-133) : la bulle doit viser une
    caractéristique manquante, et ne paraître qu'au focus.
22. **Critère incohérent [1280] (d1280-07, d1280-10).** Le carnet met « capter la buée » en tête, mais la pastille de façon et
    Comparer rangent sur « tient 80 °C ». Il dirait : « Je lui parle de buée, il range sur 80 °C. » Correction : nommer le critère
    qui range, et dire que le premier n'a pas de valeur.
23. **Comparer, « moins bien partout » [1280] (d1280-10, deux thèmes).** La 4e (690 CHF) coûte moins que la 1re et la 2e, et son
    « tient 80 °C » est inconnu. Le libellé est faux ; il faut « moins bien que la 3e sur tout ».
24. **IA en échec et hors ligne [390 + 1280] (m390-41, m390-43, d1280-19, d1280-21).** À 390, quand on ajoute dans un carnet, le
    bandeau est celui d'une réussite (« ✓ Rangé ici, à l'instant ») : aucun avis « L'IA n'a pas répondu » ni « Hors ligne ». À
    1280, à la création, l'avis est là, mais « Ensuite : l'IA cherche les façons » reste affiché. « Ce qui compte » y figure deux
    fois et reprend le titre (« Tuyau silicone 8 mm, 5 m »), qui n'est pas un critère.
25. **Choisi · pourquoi, habillage [1280] (d1280-24, deux thèmes).** Les réglettes sont posées sur de grandes pastilles arrondies,
    grises en clair et brunes en sombre, absentes de g05-11. Le picto est minuscule dans un grand carré.
26. **Renommer [390] (m390-34).** Il ne reste à l'écran que le cadre « Se renomme ici » : l'en-tête, le contenu du carnet et le
    champ ont disparu. Le picto ✎ est décalé au-dessus de son libellé. (D-119)
27. **Supprimer, G35 [390] (m390-36, deux thèmes).** On propose de déplacer la hotte en veille dans « Extracteur pour la salle de
    fermentation », un carnet fait pour sortir le CO₂ : ce n'est pas le même objet. Il dirait : « Pourquoi je mettrais une hotte dans
    l'extracteur CO₂ ? » C'est un défaut de sens métier : ne proposer qu'un carnet de même catégorie. Non joué à 1280.
28. **Article ouvert maigre [390 + 1280] (m390-26, d1280-09).** Les caractéristiques se réduisent à « tient 80 °C · oui ». h01-6
    montre une grille de 4 valeurs avec leur rang. Il dirait : « Ça semble pas fini. » (D-56, CARNET-MAIGRE)
29. **Vignettes [1280] (d1280-01, 07, 09, 10, 24 ; réf. g05-1, h05-3, h01-6, g01-8).** Partout, un picto au trait fin sur un carré
    gris, là où ses maquettes montrent l'objet dessiné. C'est mieux que le cube de la critique 4, mais encore « peu parlant ».
    (R01, R04, D-78)
30. **Note en vrac, carnet né [1280] (d1280-17).** Le carnet flotte au-dessus de « À comparer », hors du groupe « Idée », avec le
    cube générique refusé en P1. Son titre est la phrase recopiée en minuscule, alors que le bandeau dit « titre mis en forme par
    l'IA ».
31. **Le fil [390 + 1280] (D-19, D-142, R39).** Ses messages ne restent visibles que cités dans les carnets, et on ne peut pas
    comparer des idées. Le choix est ouvert (lot E puis F, après son choix) : pas un bloquant du port (D123). Il dirait pourtant :
    « Je voulais un chat. »
32. **Liste, En veille [390] (m390-01b).** Deux lignes identiques « Isobarique 4 becs pré-évacuation » (11 200 et 11 700 CHF), sans
    dire que ce sont deux offres de la même machine.
33. **Choisir, couleur [390] (m390-28).** « Choisir chez Inox Broye » est noir, alors que « Choisir · Gastro Lüftung » est vert
    dans l'article : le même geste a deux habits.
34. **Champ tronqué [390] (tous les écrans).** On lit « Ajouter à Ventilation de » ; il dirait « à quoi ? ». Déjà le point 29 de
    la critique 4.
35. **Réalisés [1280] (d1280-23).** « Marque un projet comme réalisé » demande un geste à la main, alors que la facture doit solder
    seule (D-2, D-8). Le tutoiement (« Tes projets ») tombe au milieu du vouvoiement.

### Mineurs (8)
36. **Réglette sans borne gauche [390 + 1280] (m390-26, d1280-09).** Seule la borne droite est chiffrée ; il manque l'autre et
    « la plus … des 4 » de h01-6.
37. **Prix sans espace [390] (m390-26, m390-28).** « 1450 CHF » et « 2600 CHF » ; ailleurs, c'est « 1 450 ».
38. **Proposition locale en violet IA [390] (m390-36).** Le picto calculette est teinté violet, alors que Q19 veut que le local ne
    passe pas pour de l'IA.
39. **URL en double [1280] (d1280-15).** Elle est citée sous le titre et dans le bandeau.
40. **« ZZ TEST — » incohérent [1280] (d1280-07, 18b contre 10, 24).** Le même carnet le porte sur un écran et pas sur l'autre.
41. **Largeurs [1280] (toutes).** Le segment fait 1 150 px pour une colonne de 736 px. Le + volant est à 175 px de la colonne,
    détaché du champ.
42. **Envoi [1280] (d1280-04 contre 11).** Le bouton est une flèche ↑ ici, « Ajouter » là : deux formes pour le même geste.
43. **Hors ligne [1280] (d1280-21).** « rien ne bougera au retour du réseau » est ambigu : l'IA rangera-t-elle au retour ?

## Doutes, non comptés
- **Habit de l'app (R29, D-65, D-69, D-80, D-85).** Aux deux tailles, le banc remplace l'en-tête L'Affinée et le segment Stocks par
  « Banc — données simulées ». À prouver dans l'app réelle, Stocks › Matériel.
- **Créer · avant.** La phrase « on garde sa photo, son prix, et on le surveille » va plus loin qu'une veille qui naît éteinte (R31).
  Mais elle est dans i06-2 : on la garde.
- **États non atteints à 390** : la liste vide (02), le choix revu (29, identique au carnet ouvert) et le lien qui retient (38).
- **Hors cadre à 1280** : dans Comparer, « Écartés : 1 » et le bouton Choisir ; dans le choisi, le ✕ de l'écarté et « Valeurs
  annoncées » ; dans l'article, la ligne « demandée · pas encore relevée ». À 390 non plus, l'écarté n'est pas vu dans Comparer
  (D-52).
- **Lien · avant et pendant (D-136, D-137).** Les captures existent aux deux tailles (m390-16, d1280-13 et 14), mais n'ont été
  jugées que sur le texte. À ouvrir.
- **« Ensuite : l'IA cherche les façons ».** On ne voit aucune recherche ; D-66 (façons proposées d'office) n'est pas confirmé.
- **À venir.** Le graphe kh1r de h05-9 manque (caisse inconnue, ce qui est honnête).
- **D-36 (tâches)** : « 54 texte » à 390 seulement.

## D-n → preuve (fusion)
| D | 390 | 1280 | État |
|---|---|---|---|
| D-1, D-105 À venir, Réalisés | 30 ; 31 texte | 22, 23 | écart (12, 35) |
| D-2, D-8 la facture solde | — | 23 | écart (35) |
| D-3 crayon dans À venir | — | 22 « Modifier » | écart (12) |
| D-7, D-15, D-29, D-38, D-130 créer · avant | 03 | 03 | conforme à g5:v03-2 |
| D-131 créer · pendant, carnet proche | non joué | 04, carnet proche non atteint | **bloquant, absent des deux (15)** |
| D-132 créer · après | 07 | 06 | écart (2) |
| D-10, D-16, D-18 façons, articles | 09, 09b | 07 | présents |
| D-13, D-17, D-99 critère, carnet ouvert | 09 | 07 | écart (1, 19, 20, 22) |
| D-19, D-142 le fil | cité dans le bandeau | absent | choix ouvert, lot E/F (31) |
| D-20, D-104, D-34 pourquoi, choix revu | 28 ; 29 non atteint | 24 | partiel (10, 25) |
| D-21, D-23, D-52, D-103 Comparer | 27 | 10 | écart (9, 23) ; écarté hors cadre (doute) |
| D-22, D-28, R31 veille | 09, 26, 01b | 07, 09 | honnête |
| D-24 générique | 01 | 01, 07, 12, 24 | conforme |
| D-25, D-96 liste | 01, 01b | 01 | conforme ; vignettes (29), doublon (32) |
| D-27, D-138, D-78 lien · après | 18 | 15 | **bloquant (6)** |
| D-136, D-137 lien · avant et pendant | 16 texte | 13, 14 texte | captures non ouvertes (doute) |
| D-35 propositions d'un toucher | absent | non joué | **bloquant, absent des deux (13)** |
| D-42, D-68, D-74 + volant | 01 ; 46 texte | toutes | conforme ; détaché à 1280 (41) |
| D-46, D-76 pastilles « lié à » | non joué | absent | **bloquant, absent des deux (18)** |
| D-47, D-47b, D-121 supprimer une idée | 36 ; 38 non atteint | 18b ; G35 non joué | conforme sans lien ; G35 faux (27) |
| D-118 modifier une note | 32 texte | absent | **bloquant, absent des deux (16)** |
| D-119 renommer | 34 | 18 menu, texte | écart (26) |
| D-120 supprimer une note | non joué | absent | **bloquant, absent des deux (17)** |
| D-53, D-111, D-113, D-129 un champ, l'IA trie | 13, 41 | 17 | tri d'une phrase vu ; note en vrac non (7) |
| D-54 clavier | 39 | relève de 390 | **bloquant (5)** |
| D-56 pas maigri | 26 | 09 | écart (28) |
| D-63 scénario de zéro | absent | absent | **bloquant, absent des deux (14)** |
| D-65, D-69, D-80, D-85 habit, thème | 01, sombre 01 | 01, deux thèmes | lisibles ; en-tête réel non montré (doute) |
| D-83 petit micro | 01 | 01 | conforme |
| D-97 liste vide | 02 non atteint | 02 | **bloquant (11)** |
| D-101, D-102 cartes, article ouvert | 26 | 07, 09 | photo absente (8), maigre (28) |
| D-122 aide de l'IA | 11, 13 | 08 | écart (3, 21) |
| D-123, D-124, D-126, D-139, D-140 note en vrac | 22 texte, 23 | 16, 17 | **bloquant (7)** |
| D-128 achat d'abord | 41 | — | conforme |
| D-133 ajouter · avant | 10 texte | 08 | bulle (21) |
| D-134, D-135 texte | 11, 13 | 11, 12 | **bloquant (3, 4)** |
| D-70 pas de paysage | conforme | — | conforme |
| D-36 tâches | 54 texte | — | texte (doute) |
| D-40, D-72 idée du calendrier | non joué | — | hors écran carnet |
| D-143, D-144 en ligne | — | hors banc | à prouver en ligne, hors banc |

## Le plus urgent
1. La note en vrac découpée, avec un pendant et un après distincts (7).
2. Une IA simulée qui dérive de la phrase tapée, jamais de l'exemple de la maquette (3, 4, 24).
3. La carte du lien lu, dans le carnet où on l'a collé (6).
4. Les figés repris tels quels : h05-3 (1), v04-4 (2), i06-2 (11), h05-9 (12), g01-8 à 390 (9), g05-11 (10), photo de h01-6 (8).
5. Le clavier à 390 (5).
6. Les six D-n sans preuve, capturés aux deux tailles (13 à 18).

## DEMANDE EXECUTANT
Captures à faire aux deux tailles (390 tactile et 1280), en clair et en sombre, puis à ouvrir :
- la liste vide à 390 (`&zero=1` effectif) ;
- le lien · avant, pendant et après, collé dans un carnet ouvert ;
- la note en vrac sur 3 lignes, collée d'un bloc (pendant et après) ;
- le créer · pendant jusqu'au carnet proche (D-131) ;
- la carte de proposition D-35 (`23p`) ;
- le scénario de zéro (D-63) ;
- modifier et supprimer une note (D-118, D-120) ;
- les pastilles « lié à » (D-46, D-76) ;
- le cadre Choisir à 1280, et le choix revu, le lien qui retient et G35 aux deux tailles ;
- Comparer défilé jusqu'aux écartés ;
- la liste et le carnet dans l'app réelle (Stocks › Matériel, avec l'en-tête L'Affinée).
