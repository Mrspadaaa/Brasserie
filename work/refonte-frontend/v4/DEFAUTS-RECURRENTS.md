# Défauts récurrents : chaque plainte du brasseur devient un contrôle qui échoue

Créé le 18.10.2026. Le brasseur : « J'ai tout de même l'impression que je te demande à
chaque fois, ce qu'il faut mettre en place, modifier, changer ect mais que au final on se
retour toujours pas les même problèmes. Assure toi que ce ne soit plus le cas.. »

**Pourquoi les mêmes problèmes revenaient.** Chaque correction était un document ou une
règle de plus, lue (ou pas) par des agents, puis diluée. Aucune ne faisait échouer une
maquette. Et le brasseur ne voyait le résultat qu'à la fin.

**La règle, désormais.**

1. Toute plainte du brasseur devient d'abord un **contrôle automatique** (ou, si rien ne
   se mesure, une question fermée du jury), ajouté ici avec ses mots.
2. Le contrôle doit **échouer sur la version qu'il a rejetée** (témoin négatif) avant de
   servir.
3. **Rien ne lui est montré** sans `LOT OK` de `tournoi/outils/controle-lot.mjs` sur tous
   les contrôles de ce registre.
4. Ce registre ne se raccourcit pas : un défaut corrigé reste contrôlé.

| # | Ses mots | Contrôle | Seuil | Témoin négatif (version rejetée) |
|---|---|---|---|---|
| D1 | « énormément d'information pour rien, beaucoup de text inutile qui ne devrait pas être là en premier plan » (18.10) ; « trop de text ouvert de base. ça pollue » (C082) | mots visibles au premier écran, états A et B | ≤ 80 | M1 p07 : 383 ; p15 : 261 → échec |
| D2 | « On dirait des écrans de central nucléaire ou cockpit d'avion » (18.10) | tailles de texte distinctes au premier écran | ≤ 3 (DESIGN.md) | p07 : 5 ; p15 : 7 → échec |
| D3 | « les info sont des actionnable pas des […] explication » (C081) | plus long bloc de texte au premier écran | ≤ 2 lignes | p15 : 4 lignes → échec |
| D4 | « pas assez dense » (18.10) ; « voir un Max d'info au même endroit » | part de la hauteur du premier écran couverte par du contenu, A et B | ≥ 0,80 | fils de fer lot 1, p10 : 0,41 en A → échec |
| D5 | « mais ça doit pas être surchargé » (18.10) | tout tient dans un écran à 390 (le reste à un toucher) | ≤ 1,05 écran | p07 : 1,6 ; p15 : 2,2 → échec |
| D6 | « D'autres type de UX booster du genre doivent être mis en avant » (18.10) ; « Je vois aussi aucun slider ou autre UX booster » (C092) | boosters marqués `data-booster` qui changent l'écran au toucher | ≥ 4 distincts | fils de fer lot 1 : 0 → échec |
| D7 | « on peut aussi basculer d'un affichage à un autre, type bare graph à radar graph » (18.10) | un booster « radar » qui change l'écran | présent | fils de fer lot 1 : absent → échec |
| D8 | v3 : exigences perdues (D19) | `check-spec.mjs` : citations retrouvées mot pour mot | SPEC OK | `--control` → SPEC ECHEC |
| D9 | « on doit pas non plus perde le modèle de calcul de la 5.5 » (18.10) | `check:engine` | ENGINE-V4 OK | `V4_TEMOIN_NEGATIF=bande` → échec |
| D10 | pas d'erreur, pas de débordement (qualité de base) | erreurs de page, défilement horizontal | 0 | — |
| D11 | « Une UI ux toujours pas très moderne dans les normes et bon usage actuelle » (18.10) | non mesurable seul : question fermée du jury par paires (« lequel le brasseur trouverait le plus moderne et le moins surchargé ? »), calibrée sur ses références (`reference/brasseur-2026-10-18/`) | gagnant constant dans les deux ordres | — |
| D12 | « les échelles doivent être revu en fonction du style » | question fermée du jury : la position face au style se lit-elle sans texte, et la bande change-t-elle avec le style ? | oui | — |

| D13 | « Comme pour les Malts j'ai besoin d'avoir des le premier coup d'œil, quel matière première j'ai, et et je peux ajouter en un click ultra facilement. Ensuite seulement je peux ouvrir mon panel de comparatif » (18.10) | `controle-recette.mjs` : bloc des houblons de la recette dans la moitié haute, au moins une ligne, un ajout rapide visible, **un toucher ajoute une ligne**, le panneau d'analyse vient après | RECETTE OK | fils de fer lot 1 p10, p04 : bloc et ajout absents → échec |

| D14 | (relevé par le jury du lot 2 : « null » affiché dans p03 après un ajout rapide) — la vérité des données du produit : « refuse d'inventer un chiffre » (PRODUCT.md) | `capture.mjs` et `jouer-boosters.mjs` : aucun « null », « undefined », « NaN » ni « [object …] » visible, au chargement et après chaque toucher | 0 | lot 2 p03 → échec attendu |
| D15 | (relevé par le jury du lot 2 : p07, p08) une voie « faible » dessinée comme si elle ramenait la famille dans la bande | non mesurable seul : question fermée du jury (« le fantôme d'une voie montre-t-il un effet plus fort que celui du moteur ? ») ; dans les versions, le fantôme ne dessine que `directedEffect` du pack | non | p07, p08 → oui (défaut) |

| D16 | « il faudrait aussi ibu par houblon ( genre 5g -> 20ibu en plus) » (18.10) | `controle-recette.mjs` : chaque ligne de la recette montre ses IBU, chaque ajout proposé les IBU qu'il ajoute | toutes | lot 2 p03 → échec |
| D17 | « Type d'ajouter (à froid, voilà, ect et quand) » (18.10) | `controle-recette.mjs` : chaque ligne a un type d'ajout (`data-role="type-ajout"`) et un moment (`data-role="quand"`), et toucher le type change la ligne | toutes | lot 2 p03 → échec |

| D18 | « C'est une catastrophe la vue radar ?? » (18.10) ; demande d'origine : « Les comparaisons avec un affichage de type spidergraph […] un par barre type intervalle de confiance et un type spidergraph/Radar chart. Pouvoir passer de l'un à l'autre » (R45) | `controle-radar.mjs` : le radar compare **2 à 4 houblons** (`data-objet="houblons"`), 12 niveaux de citation (0 non décrit, 1 cité, 2 marqué) par série, au moins une silhouette non plate, des séries qui diffèrent ; la lecture de la bière n'est jamais en radar | RADAR OK | lot 2 p01, p03 → échec |

| D19 | « Je pense qu'il y a confusion entre, ce que j'ai actuellement dans ma bière, son profil. Le style de la bière, un target. La comparaison manuel entre plusieurs houblons. Et la comparaison par suggestions de l'outils » (18.10) ; modèle `ecran-1/MODELE.md` | `controle-radar.mjs` : trois parties nommées (`data-partie` biere, suggestions, comparer) ; chaque partie a sa vue Radar, qui ne montre que son objet (`data-objet` biere-cible, voies, houblons) ; fiches des houblons (0–2) jamais sur l'échelle d'intensité de la bière (0–3) ; même budget de mots et de remplissage pour chaque partie | RADAR OK | lot 2 p03 → 6 échecs |

| D20 | « je peux goûté d'autres bière que les miennes et pas aimer un houblon en particulier ou autre » (18.10) | `controle-recette.mjs` : dans les suggestions, un geste `data-role="gout"` note un houblon, et la liste des voies change | présent et efficace | lot 2 p03 → échec |
| D21 | « je fais une recette puis ensuite j'achète les ingrédients, souvent pas présent » (18.10) | `controle-recette.mjs` : chaque ajout dit son état de stock ; une liste d'achats (`data-role="achats"`) ; des ajouts proposés hors stock ou un filtre Stock / Tout | tous | lot 2 p03 → 3 échecs |

| D22 | « Et tout ce qui est biotransformation avec levures, dry hopping et tout, comment ça d'intégre ? Ça a été oublié ? » (18.10) ; R43, R44 | `controle-recette.mjs` : la levure visible sur l'étape (`data-role="levure"`) ; sur la recette chargée (`cas-k3.html`), l'ajout à froid porte ses signaux de biotransformation (`data-role="biotransformation"`) | présents | lot 2 p03 → 2 échecs |

| D14 bis | (relevé par les auteurs p10 et p11 du lot 3, 18.10) « [object HTMLButtonElement] » après une exclusion de goût et dans Comparer : le contrôle D14 ne touchait que les `data-booster` | `fuite-touchers.mjs` : sur chaque page, tous les éléments interactifs visibles touchés l'un après l'autre, texte technique relevé après chaque toucher | 0 | page témoin `scratchpad/temoin-fuite` → 1 échec ; lot 2 p03 → 3 échecs |
| D4, D5, D19 bis | (relevé par p10 et p11 du lot 3) les vues radar remplissaient 0,62 à 0,64 de l'écran et `cas-k3` débordait à 1,1 écran sans échec : seules l'étape, l'état B, biere et comparer étaient mesurées | `controle-lot.mjs` : mots, remplissage, un écran, tailles et paragraphe sur **toutes** les pages à 390 (radars, cas K2, K3 compris) | mêmes seuils | lot 3 p11 avant reprise → échec attendu |

| D23 | « La stock sont beaucoup trop mis en avant surtout que dans l'app on voit dans le récap à la fin. Juste un petit badge ou info très subtil suffit » (18.10, soir) | `controle-recette.mjs` (`stockDiscret`) au premier écran de l'étape : « en stock » jamais écrit (seule l'exception s'étiquette) ; aucune pastille de stock à fond plein ; ni gras ni plus grand que le plus petit texte ; ≤ 3 mentions ; ni liste d'achats ni filtre Stock / Tout visibles (repliés si présents). **D21 révisé** : la liste d'achats n'est plus exigée sur l'étape ; il suffit qu'une exception (manque, à acheter) soit signalée et que des ajouts proposés soient hors stock | tous | lot 3 p04, p08, p10 (pastilles « en stock » pleines) → échec ; p02, p03 (filtre et achats au premier écran) → échec |

| D24 | « C'est toujours n'importe quoi les spidergraph Radar graph il faut faire qqch.... » (18.10, soir) ; étalon : le radar de Beer Maverick (`v3/reference/beer-maverick/telephone/t3-radar-3-houblons.jpg`) | `controle-radar.mjs`, contrat v2 : `data-axes` dans l'ordre de la roue des arômes (rotation ou miroir), ≥ 5 axes, aucune valeur vide sur un axe dessiné, ≤ 2 séries par radar (petits multiples au-delà), au moins une silhouette pleine translucide, largeur ≥ 75 % (42 % en petits multiples), libellés ≥ 11 px dans l'écran sans chevauchement ; bière et voies en intensité absolue 0–3 | tous | lot 3 p08 (radars avec `data-axes` posé dans l'ordre dessiné, `scratchpad/temoin-radar`) → 21 échecs |
| D25 | « quand je fasse un appuie long, hover long super ordinateur, sur houblons, je puisse voir sa fiche en détails » (18.10, soir) | `controle-fiche.mjs` (avec `--fiche`) : toucher court sans fiche ; appui long 650 ms → fiche nommée, alpha, arômes sourcés, silhouette, goût, ≤ 100 mots, sans fuite ; fermeture ; survol 900 ms à 1280 px | présent | lot 3 p03 → 2 échecs |
| D26 | « Je comprends pas ces nouveaux screen, on avait établi une Baseline, ça différent complètement ? » (18.10, soir) | `controle-baseline.mjs` (avec `--baseline=<dossier>`) : dans un lot de composant, texte visible hors `data-composant` et hors fiche identique à la baseline, page par page ; et rien d'écarté ne se montre (variantes écartées rangées dans `_ecartes/`) | identique | lot 3 p11 face à p03 → 5 échecs ; p03 face à elle-même → OK |

| D27 | « j'aimerais aussi pouvoir une fois mon houblons sélectionner pouvoir glisser comme un slider le moment de l'ajout » (18.10, soir, capture de p2 avec une flèche de 60′ à 10′) | `controle-rail.mjs` (avec `--rail`) : étapes du rail `data-etape` (codes du pack), poignée `data-role="glisser-moment"` sur chaque ligne ; au doigt à 390 px puis à la souris à 1280 px, glisser la première ligne vers une autre étape change son moment et ses IBU et la range sous cette étape | présent et efficace | lot 3 p02, p03, p08 → échec ; page témoin à poignée inerte → échec ; page qui fonctionne → RAIL OK |
| D28 | « J'aime beaucoup l'intégration de la levure directement dans la p8 mais la p2 a un meilleur visuel » (18.10, soir) | `controle-rail.mjs` : `data-etape="levure"` porte la levure et se place entre le whirlpool (`wp`) et le dry hop en fermentation (`dryActive`) | présent | lot 3 p02, p03 → échec ; page témoin (levure après le dry hop) → échec |

| D23 ter | « Le stock toujours trop mis en avant... » (18.10, soir, sur p2 à 1 à 3 mentions grises) | `controle-recette.mjs` sur index, cas-k2, cas-k3 : aucun mot de stock au premier écran ; icône `data-stock` ≤ 14 px ; D21 lu sur l'attribut | 0 mot | lot 3 p02 → échec (« à racheter », « à acheter ») |
| D29 | « quand la recette est vide, je trouve que les info sur les houblons sont pas pertinent pour le brasseur, pour la création de bière, j'aime bien le code couleur pour savoir quelle arôme ça ajoute mais c'est trop centré sur le ibu, pas d'info sur les AA. C'est un bon visuel, à garder mais le rendre plus pertinent » ; « Toujours pensé comme un brasseur » (18.10, soir) | `controle-recette.mjs` (`pertinence`) sur index, cas-k2, cas-k3 : α visible sur chaque ligne et chaque ajout ; code couleur `data-role="aromes"` gardé sur chaque ajout ; IBU ni plus grand ni plus gras que l'α ; recette vide : rôle sur chaque ajout, au moins un amérisant et un aromatique, pas tous au même moment | tous | lot 3 p02 → 10 échecs D29 |

| D30 | « Toujours pensé comme un brasseur » (18.10, soir) | non mesurable seul : question fermée du jury, posée pour chaque écran : « un brasseur qui construit ou corrige cette recette trouve-t-il au premier plan ce qu'il utilise pour décider (α, rôle, arômes, moment, dose), avant l'IBU et le stock ? » ; le jury lit `SPEC-BRASSEUR.md` et la mémoire « penser en brasseur » | oui | lot 3 p02, recette vide → non |

| D31 | « Tropicale 4/5 sur une ipa et 4/5 sur une Lager ça doit pas correspondre sur une Lager c'est très subtil alors que sur une ipa c'est tout ce que la bière est quasiment. » ; « Reste sur une échelle par style mais avoir en tout cas une vue qui affiche l'échelle en absolue. Car j'aime bien expérimenté et ai je veux une lager super tropical genre 50/100 ça sera pas vraiment affiché » (18.10, soir) | `controle-detail.mjs` (`--detail`) : biere.html au style avec bascule `lentille absolue` et écart chiffré hors zone (jamais écrasé au bord) ; biere-absolu.html sur une piste commune 0–3, zone et bière à leur place (tolérance 0,06) | tous | vue en crans du lot 3 (`scratchpad/temoin-detail/p01`) → 5 échecs ; version juste (`p02`) → OK |
| D32 | « je sais pas comment bannir une contraintes ou réduire une autre » (18.10, soir) | `controle-detail.mjs` : `data-action` bannir, réduire, augmenter sur chaque famille (sur la ligne ou après un toucher) ; bannir → `data-visee="0"` ; augmenter élève la visée | présents et efficaces | lot 3 p02, p08 → échec |
| D33 | « il y a des truc jaune ?? » (18.10, soir : le focus posé par script sur une ligne, entouré de jaune par la vue web du téléphone) | `controle-palette.mjs` (`--palette`) : surlignage du toucher neutralisé ; après un toucher, aucun contour ni focus sur un élément qui n'est pas une commande ; une seule teinte saturée hors arômes et radars | 0 | lot 3 p02 → échec |

| D34 | « Je veux choisir pas de 10' défini, pas de timing imposé hein » ; « Soit pas supide, c'est des tranche de 5'. » (18.10, soir) | `controle-rail.mjs` : deux lâchers entre 60′ et 10′ donnent des minutes multiples de 5, pas seulement des repères, et deux IBU différents | tous | base consolidée v1 (accroche à 30′ et 10′) → échec ; témoin positif → OK |
| D35 | « Ça semble un peu bancale, c'est l'idée mais pas hyper bien réalisé » (18.10, soir, capture pendant le geste) | `controle-rail.mjs`, doigt posé puis lâché : `data-glisse` sur l'élément qui suit le doigt, au-dessus de tout, ne cachant aucun texte ; aucun chevauchement de textes ; aucun vide de plus de 64 px dans la colonne du rail | 0 | base consolidée v1 → 3 échecs (« 10′ » doublé, vide de 95 px, rien de marqué) |
| D36 | « Parcontre prendre en compte que le boil peut durer 120' ou d'autres timing que 60 » (18.10, soir) | `controle-rail.mjs` : `cas-ebu120.html`, rail à `b120`, une ligne se pose au-delà de 60′ | présent | base consolidée v1 → échec |

D18 est désormais vérifié par le même script, partie par partie.

Commande (toutes les mesures D1 à D7, D10, D13, D14, D16 à D19) :

```
node work/refonte-frontend/v4/tournoi/outils/controle-lot.mjs <dossier> --mots=80 --fill=0.8 --boosters=4 --tailles=3 --paragraphe=2 --radar --recette
```

Témoin négatif rejoué le 18.10 sur `tournoi/M1/_lots-1-2` (p07, p15) : `LOT ECHEC 13
problème(s)`. Sur les fils de fer du lot 1 (p10, p04) : `LOT ECHEC 8 problème(s)`.
