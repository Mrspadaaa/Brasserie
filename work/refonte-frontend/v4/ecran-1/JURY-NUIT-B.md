# Jury de nuit B · lots 9 (radars par objet) et 10 (échelles, classements, comparaisons)

Juré neuf, **indicatif** : les étoiles aident le brasseur à choisir, elles ne choisissent pas.
Étalon : `SPEC-BRASSEUR.md` § 6 (clair, dense mais lisible, juste pour un brasseur ; « resemble a
rien », « Seul le premier est ok », « P3,4,6,7 semble pas mal », le piège des inconnus lus comme 0)
et D39, D48, D51 à D53, D57 à D59, D62, D65, D66. Le brasseur a souvent choisi autrement que le
pilote ; ces étoiles peuvent se tromper de la même façon.

Ce qui a été regardé : les 12 captures du lot 9, les 6 du lot 10, plus e1 en Floral et en Huiles
et les lentilles radar de c1 et c2 ; les NOTE.md ; deux vérifications dans les sources (S1.before
du pack, tracé de m4).
★ = à revoir · ★★ = bonne piste, un défaut qui gêne · ★★★ = prêt à affiner.

## Constats communs (avant les tableaux)

1. **Trois sens pour « ? »** : non goûté (Ma bière), non situé par le moteur, effet de la voie non
   établi (Suggestions). Dans s2, « Boisé et résineux ? » porte un « ? » alors que c'est la seule
   famille qu'il a goûtée (marquée). Il faut un seul sens par marque.
2. **Les 5 non situés ne sont pas traités pareil** : dans le pack, `S1.before` donne pour eux
   `min 0, max 55,3` (estimé, `display: "non situé"`). m1, m2 et s1 écrasent la bande sur l'anneau 0
   (la forme dit « rien de fruité ») ; m3 la dessine jusqu'à 55, hors du disque du style, avec une
   marque creuse au centre sur le même axe. C'est à trancher une fois pour toutes les vues.
3. **La bande « après » gonfle là où l'effet n'est pas établi** (s1, s3, s4) : c'est le cumul
   d'incertitude du moteur, mais la forme dit « Golding ajoute agrumes et tropical ». Le texte est
   honnête ; la forme ne l'est pas.
4. **Fiches en citations 0 à 2** (h1 à h4, lentilles c1 et c2) : étoiles à pointes, et Floral réduit
   à une aiguille entre deux « ? ». La forme reste moins lisible que les intensités 0 à 5 de Beer
   Maverick ; c'est la donnée qui manque (#131), pas le dessin.

## Ma bière

Questions fermées (oui / non, avec la preuve vue) :

| | Forme parlante en 5 s ? | Inconnu ≠ zéro ? | Échelle claire, jamais lue comme une valeur ? | Goûté et prévu distingués ? | Mieux que Beer Maverick ? |
|---|---|---|---|---|---|
| m1 | Oui : l'aiguille noire du résineux dépasse la bande bleue (« au-dessus de sa bande ») | En partie : « Melon ? » gris et hachures, mais la bande tombe à 0 sur tout le côté fruits | Oui : anneaux nommés en une ligne sous le radar (0, faible 33, moyen 66, marqué 100) | Oui : point noir à part, bande bleue sans centre | Sans objet (BM ne montre pas une bière) ; plus honnête que les radars de Ma bière d'avant |
| m2 | Non : bande presque régulière de 0 à ~50 ; rien ne ressort | Oui : « prévu / non goûté » au cœur, « ? » hachurés | Oui, sous le radar ; 0 posé sur un anneau à 39 px du centre | Oui, par exclusion : le goûté sort du dessin (texte seul) | Sans objet |
| m3 | Oui : la barre orange du résineux sort du disque du style | En partie : marques creuses au centre pour les non situés, mais la bande y monte hors du disque | Non : dans le disque, chaque rayon dépend de la limite de sa famille (deux rayons égaux ≠ deux intensités) ; unité « T » abstraite | Oui : barre orange contre bande bleue | Oui sur la relation au style (BM n'en a pas) |
| m4 | Oui (exemple) : pointe rouge du résineux hors du gris du style | En partie : libellés gris « ? » et « pas goûté · inconnu » dans la grille, mais dans le dessin le trait plonge au centre et la marque creuse est posée sur l'anneau « pas senti » (code : `radius(null) = 0`, marque à `r(0)`) | Oui : anneaux nommés sous le radar, du centre au bord | Oui : le prévu n'y est pas ; goûté et style seulement | Oui : BM n'a aucune saisie de dégustation |

| Variante | ★ | Pourquoi (une ligne) | Défaut principal |
|---|---|---|---|
| m1 · goûté à part, prévu en bande | ★★ | Dit en 5 s l'écart entre ce qu'il a goûté et ce que le moteur prévoit | Une seule famille goûtée donne une aiguille ; Floral, son objectif, n'est qu'une pointe |
| m2 · prévision seule | ★ | Honnête sur l'incertitude, mais la forme ne dit rien | Retire du dessin la seule donnée réelle (le résineux goûté) ; la bande peut passer pour la bière |
| m3 · échelle au style | ★★ | Répond à « dans le style ou non ? », sa demande d'échelle par style (D31, § 2) | Échelle relative illisible sans légende (T), et plus de vue absolue, qu'il a demandée aussi |
| m4 · grille de dégustation | ★★★ | Comble le vrai trou (on ne note que le résineux) ; un toucher par famille, le radar se remplit, « pas senti » ≠ « pas goûté » | La marque « pas goûté » est posée sur l'anneau « pas senti » (lue comme 0) ; exemple fictif sauf le résineux |

## Suggestions

| | Forme parlante en 5 s ? | Inconnu ≠ zéro ? | Échelle claire, jamais lue comme une valeur ? | Goûté et prévu distingués ? | Mieux que Beer Maverick ? |
|---|---|---|---|---|---|
| s1 | Non : la bande « après » est plus large partout, la forme dit « Golding augmente tout » | Oui pour les non situés (hachures, « ? ») | Non : « marqué / moyen / faible » écrits dans le dessin juste sous « Agrumes », coupés par les contours (le piège de « cité », D66) | Oui : bloc orange au bord | Sans objet (BM ne suggère rien) |
| s2 | En partie : seules les 4 familles touchées s'allument, mais les flèches sont courtes ; la réponse est la phrase du haut (« Floral +16 · Épicé +16 · Terreux +16 · Herbacé +9 · résineux : rien d'établi ») | Oui, mais « ? » sert aussi à « effet non établi », y compris sur le résineux goûté | Non : échelle resserrée à 0–66, différente des autres vues ; « moyen / faible » dans le dessin | Oui : orange au bord, « au-delà » | Sans objet |
| s3 | Non : 17 mini-radars ; les voies 1 à 3 sont identiques à l'œil | Oui : la meilleure légende du lot (règle graduée hors dessin, « centre = non situé, puis 0, 33, 66, 100 ») | Oui | Oui | Sans objet |
| s4 | En partie : la visée (triangles verts) se lit, mais la bande « après » gonfle sur Agrumes ? et Fruits tropicaux ? | Oui : deux légendes (non situé, effet non établi) | Oui : anneaux nommés hors du dessin | Oui | Sans objet ; répond à sa phrase : « Dans le bon sens… dans la plage, pas garanti » ; « Rien d'établi » sur le résineux |

| Variante | ★ | Pourquoi (une ligne) | Défaut principal |
|---|---|---|---|
| s1 · avant / après en bandes | ★ | Honnête sur les plages, mais la forme induit en erreur | Bande « après » gonflée partout ; noms d'anneaux dans le dessin |
| s2 · seulement ce qui change | ★★ | La phrase du haut est la réponse la plus claire du lot | « ? » à trois sens (résineux goûté marqué « ? ») ; échelle changée (0–66) |
| s3 · petits multiples | ★ | Vue d'ensemble, colonne texte utile par voie | Les formes ne départagent pas les voies ; 4 670 px pour 18 radars |
| s4 · la demande dessinée | ★★ | Seule variante qui pose sa demande sur le radar et y répond famille par famille | Même bande « après » gonflée que s1 ; une voie à la fois ; unités mêlées (« +1,6 cran » à côté de « sur 100 ») |

## Mon houblon (fiche de Nugget)

| | Forme parlante en 5 s ? | Inconnu ≠ zéro ? | Échelle claire, jamais lue comme une valeur ? | Goûté et prévu distingués ? | Mieux que Beer Maverick ? |
|---|---|---|---|---|---|
| h1 | Oui : résineux, tropical, épicé, herbacé, floral ; mais étoile à aiguilles | Oui : 5 familles grises « ? », hachures, marque creuse, « ce n'est pas zéro » | Oui : en légende (« anneau du milieu cité, bord marqué ») | Sans objet (fiche) | Plus honnête (inconnus, N sur 4 et auteurs au toucher, α par source 9,5–16 / 11–14) ; forme moins lisible que les 0–5 de BM |
| h2 | Non : des rayons fins ; boutique US et Yakima Chief Hops ont le même tracé | Oui | Oui (légende) | Sans objet | Non pour la lecture ; montre une chose que BM n'a pas (le résineux ne vient que de 2 fiches sur 4) |
| h3 | Oui (= h1), plus des arcs verts sur les 3 familles attendues du 16D | Oui | Oui ; la page dit pourquoi aucune zone du style n'est posée sur des citations | Sans objet | Oui : la relation au style qu'il réclamait (D59) |
| h4 | Oui, plus deux flèches : plus de floral (vers l'extérieur), moins de résineux (vers le centre) | Oui | Oui (légende) | Oui : le goûté n'est pas posé sur les citations | Oui : répond à « ma stout est trop résineuse » et renvoie vers remplacer (5 voies) ou diminuer à 38,5 g |

| Variante | ★ | Pourquoi (une ligne) | Défaut principal |
|---|---|---|---|
| h1 · simple façon BM | ★★ | Bonne base, honnête sur les inconnus et les sources | Étoile à aiguilles (citations 0–2) : risque de « resemble a rien » |
| h2 · un polygone par source | ★ | Info utile (divergence des fiches) mal servie par le radar | Rayons superposés ; tiendrait en une ligne « cité par 2 fiches sur 4 » |
| h3 · face au 16D | ★★★ | Relation au style sans mélanger citations et intensités ; une phrase claire | α réduit au lot (13 %), sans la plage des sources que h1 montre |
| h4 · face à ma demande | ★★★ | Pense en brasseur : sa demande, la réponse (« autant ce que tu veux réduire que renforcer »), puis les gestes | α en point (13 %), sans plage ; flèche « moins » rouge, proche de la couleur d'alerte ; utile seulement si une demande existe |

## Lot 10 · échelles, classements, vraies comparaisons

Questions fermées :

| | Répond à « lequel je prends / lequel remplace le mien » ? | Intervalles présents ? | Style 16D présent ? | Mieux que Beer Maverick ? |
|---|---|---|---|---|
| e1 | En partie : « qui a l'α de Nugget » se lit (rang 8, « possible 2 à 18 », chevauchements écrits), pas « lequel remplace » (ni arôme ni dose sur l'échelle α) | Oui : plage, sources en traits fins, centre, lot ▼, « 24,8 ▸ » hors échelle, Sun « non renseigné » à part | En partie : seulement l'onglet « Floral · 16D » | Oui : les 32 houblons rangés avec leur incertitude |
| e2 | Non : « qui garde son rang » n'est pas sa question ; ρ de Spearman = jargon | En partie : rangs en plage (« 2–4 »), blocs ex æquo ; pas les plages de valeur | Oui : colonne « Floral 16D » | Autre chose, pas mieux pour choisir |
| r1 | Oui pour « lequel je prends » (EKG, Golding, WGV en tête, avec la raison : niveau floral, N/M, herbacé, terreux) ; en partie pour « remplace » : IBU à 46 g sur la bande 50–70 (EKG 18–32, on voit le manque d'amer), sans dose pour 60 IBU | Oui : IBU en plage, centre, lot ▲, α en plage | Oui : pastille 16D, familles attendues, bande 50–70 | Oui : BM ne classe pas pour un objectif |
| r2 | Oui, littéralement (« Lequel je prends ? », gagnant par critère, règle écrite) | Oui : α et IBU avec sources ; « plages qui se recouvrent : égal » | Oui : bande 50–70, herbacé et terreux attendus | Oui : BM ne dit ni qui gagne ni pourquoi |
| c1 | Oui : « ⇄ 24 g / 35 g (37–54) / 47 g (40–63) » pour 60 IBU, IBU à 46 g (114, 79, 58), rôle | Oui, sauf Citra cryo (IBU et dose sans plage, écrit « – » et hachuré) | Oui : arômes 16D d'abord, « Face à 16D » par houblon, « aucune stout citée » | Oui, nettement : lot sur les sources, dose équivalente, IBU, style, rôle |
| c2 | Oui pour « avec ce que j'ai » : Citra cryo 24 g (65 g, assez), Galaxy 35 g, Nelson Sauvin 62 g ; Target « manque 48 g » | Oui | Oui : matrice 16D d'abord, bande 50–70, couleur = les plus proches du 16D | Oui : BM ignore le stock |

| Variante | ★ | Pourquoi (une ligne) | Défaut principal |
|---|---|---|---|
| e1 · échelle d'une mesure | ★★ | Une vraie échelle de 32 houblons avec plages, recette, stock et lot repérés | En arômes (0–2), grands ex æquo : l'échelle ne range plus ; pas de dose ni de rôle |
| e2 · échelles croisées | ★ | Idée juste (les arômes ne suivent pas α), lecture de spaghetti | 32 lignes grises entrecroisées ; ρ et « garde son rang à 8 près » ne servent pas un brasseur |
| r1 · classement pour un objectif | ★★★ | La meilleure réponse à « lequel je prends » pour « + floral, − résineux, 16D », la raison sur chaque ligne | Pas de dose pour 60 IBU ; glyphes de cases (▮▯ 1/2) à apprendre ; règle stricte (tout résineux cité écarté) |
| r2 · duel | ★★ | Choix guidé, critère par critère, dans l'ordre du brasseur | La coche IBU va à EKG (18–32) alors que Citra cryo affiche 46–69, dans la bande : la règle décide sur « lot 114 », écrit petit à droite ; 16 duels pour un classement |
| c1 · houblons riches | ★★★ | Sa « variante 3 » complétée de ce qu'il demandait : intervalles, arômes, style ; lentille radar lisible (Citra agrumes, Galaxy tropical, Idaho 7 baies) | Page très longue (plus de 3 écrans) ; une fiche d'arôme par houblon (N/M 1/1) |
| c2 · mon stock | ★★ | Répond « lequel de mon stock remplace Nugget, et combien » | Le stock passe au premier plan (« manque … g » en gras sur 6 lignes), contre « juste un petit badge » ; matrice 9 × 12 aux en-têtes en biais serrés |

## Si le brasseur hésite (indicatif)

- **Ma bière** : m4 pour saisir, avec la lecture de m1 (le goûté en noir sur la bande bleue) une
  fois la grille remplie ; poser la marque « pas goûté » au centre, pas sur l'anneau « pas senti ».
  m3 peut devenir une bascule « face au style », à condition de garder une vue absolue.
- **Suggestions** : aucune variante n'atteint ★★★ ; le radar n'est peut-être pas le bon outil ici.
  Si un radar reste, s4 (la demande dessinée et la réponse écrite) avec la règle de s2 (seules les
  familles à effet établi bougent ; pas de bande « après » gonflée ailleurs). Pour « lequel je
  prends », r1 du lot 10 répond mieux que les quatre.
- **Mon houblon** : h4, avec les arcs 16D de h3 et la plage α des sources de h1 (les trois tiennent
  sur le même radar).
- **Lot 10** : c1 pour Comparer ; r1 pour le classement (en ajoutant la dose pour 60 IBU) ; e1
  comme échelle d'une mesure, en α et en huiles plutôt qu'en arômes.
