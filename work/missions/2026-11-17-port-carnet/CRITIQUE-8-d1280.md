CRITIQUE d1280 6/10 — 21 problèmes (4 bloquants)

# Critique 8, d1280 (18.11) : le carnet porté, banc `?preview=carnets`, captures `vision-8/d1280-*`

Critique : Opus (Fable interdit). Périmètre figé : les problèmes de CRITIQUE-7 (corrigé ou pas) et les régressions. Les défauts neufs
vont au registre ; ils ne bloquent que s'ils faussent une donnée ou cassent le geste principal.
Images ouvertes : 35. Clair : 01, 02, 04, 07, 09, 11, 12, 13, 14, 16, 18, 19, 21, 22, 23, 26, 27, 28, 31, 32, 38, 40, 41, 43, 47,
48c, 49b, 50, 55b, 56. Sombre : 09, 13, 23, 27, 38. Les autres états sont jugés sur le texte du rapport et sur l'empreinte md5.

Méthode : j'ai comparé les empreintes md5 des captures claires, ce qui a évité d'ouvrir des images identiques. Une capture qui a la
même empreinte qu'une autre montre un geste sans effet ou un état non atteint :
- 01 = 01c = 03 = 08 = 15 = 25 = 37b = 46a = 46 ;
- 09 = 10 = 29 = 30 = 44 = 45 ;
- 27 = 27c = 52b ; 32 = 32b = 51 ; 18 = 20 ; 38 = 49 ; 26 = 26b ; 40 = 40b ; 43 = 43b ; 35b = 35c ; 34 = 34b ; 38z = 48c ;
- 02-zero, 11-app, 25-fil, 38-zero et 48-zero datent de 09:33 et sont toutes identiques : périmées, non jugées.

Le rapport se trompe deux fois. 49b montre le Frigo et non l'Embouteillage. 26 a bien ouvert l'article, la hotte 120 cm.

Corrigés à 1280 :
- n° 1 et n° 19 : la note en vrac est découpée en trois lignes séparées, avec « Texte d'origine » (22, 23) ;
- n° 4 : le frigo affiche « amb. max °C 43 » (38, 49b, 55b) ; c'est plausible, la chambre tient 2 °C jusqu'à 43 °C dehors ;
- n° 5 : la fiche de l'Embouteillage dit « Réalisés », « Réalisé, payé le 16 nov. » et propose Archiver seul (50) ;
- n° 6 : le pourquoi est juste, « Le plus gros débit des deux à tenir 80 °C » (28) ;
- n° 12 : pendant la lecture, le lien paraît en clair avec « ✻ lecture de la page… » (16), puis le titre est mis en forme
  (« Pompe pour le moût », 19) ;
- n° 21 : « ✻ L'IA range… « bruit sous 55 dB » » se voit pendant le travail de l'IA (40) ;
- G9 : le banc a tapé une vraie phrase (« fond de bac 38 cm minimum »), et l'IA reformule la conséquence (11).

Le thème sombre est lisible sur les cinq captures. Aucun élément refusé (§ Refusé) ne revient.

## Combien et quels problèmes ? 21, dont 4 bloquants

### Bloquants
1. **RÉGRESSION, 13 Texte après (clair et sombre).** Sur Ventilation, on ajoute « hotte murale à 1 200 m³/h au moins ».
   Conséquences :
   - toute la colonne m³/h passe à « – », alors que 09 affichait 1 800, 1 200, 1 500 et 1 100 ;
   - la ligne Critère perd « puis le débit » ;
   - la Hotte murale 100 cm passe 1re ;
   - la Hotte inox 120 cm devient « moins bien que la 1re sur tout », alors qu'elle débite 1 800 m³/h contre 1 200.

   Ce qu'il dirait : « J'ajoute un minimum de débit et il efface les débits ? Et la 1 800 serait moins bien sur tout ? »
   Valeur fausse dans le geste principal. Correction : un seuil s'ajoute au critère débit et ne remplace pas ses valeurs. Le rang se
   recalcule sur les valeurs lues.
2. **n° 3 pas corrigé à 1280 : un critère est rangé en note (13, 22, 23).**
   - En 13, « Rangé ici » ne dit pas dans quelle section la phrase atterrit, et la ligne Critère ne la montre pas.
   - En 22 et 23, « doit tenir 80 °C » et « 1 200 m³/h au moins » sont typés « note », avec le résumé « 3 notes, pas d'achat ».

   L'état « après » de 11 (Évier, « fond de bac 38 cm minimum ») n'est pas capturé à 1280. Le n° 3 n'est tenu qu'à 390
   (`chir7/m390-3`).

   Ce qu'il dirait : « 80 °C, c'est un critère, pas une note. »
   Retenu manquant : R13, R14, R18, D-134, D-135, D-139.
3. **NEUF, scénario de zéro (48c = 38z).** Le banc crée « frigo de garde pour 6 fûts », puis tape « évier 2 bacs pour laver les
   fûts ». L'évier est rangé dans le carnet frigo (« Rangé ici · 2 bacs, pour laver les fûts »). La liste compte 1 carnet, alors que
   le scénario en attend 3 (38z). Au-dessus, cinq puces « ✻ Comparer sur… Ajouter » s'empilent :
   - le débit en m³/h, pour un frigo ;
   - le bruit en dB, deux fois.

   Ce qu'il dirait : « Un évier dans mon frigo ? Et cinq boutons à cliquer, c'est pas l'IA qui m'aide. »
   Donnée fausse et trop d'actions (D-63, D-113, D-122). Correction : un objet sans rapport avec le carnet ouvert déclenche
   « ✻ Ça ne parle pas de frigo : nouveau carnet Évier ? ». Une seule proposition de critère, sans doublon, et en rapport avec
   l'objet.
4. **n° 9 pas corrigé : preuve manquante et gestes sans effet.** Ces états ont la même empreinte que l'écran d'avant, ou ne sont pas
   atteints :
   - + volant (46 = 01) ;
   - ✕ de l'IA (40 = 40b) ;
   - veille OFF → ON (01c = 01, 26 = 26b) ;
   - photo et micro (44 = 45 = 09) ;
   - aides éteintes (51 = 32) ;
   - Envoyer dans À venir (30 = 09) ;
   - 2e lien et son tableau G20 (19 a créé un nouveau carnet) ;
   - modifier une note (32 ouvre le menu de l'idée, pas celui d'une note ; 32b = 32) ;
   - supprimer une note (35b = 35c) ;
   - créer « Ce qui compte » (06 non atteint) ;
   - Stocks › Matériel › Carnets dans l'app (47 reste sur « Chargement de l'écran… ») ;
   - calendrier (56 : Achats « vide », l'idée n'y paraît pas) ;
   - étapes (D-8, D-29).

   Ce qu'il dirait : « Qu'est-ce qui a été testé ? » Bloquant pour une mise en ligne (R42, L12).

### Gênants
5. **n° 7 en partie (18, 19).** Le dépôt d'un lien depuis la liste dit « Rangé dans … Ventilation » et « la page parle de
   « hotte » », mais pas son rang parmi 7 articles. G20 n'est prouvé qu'à 390 (`chir7/m390-7`). « Elle est où dans le classement ? »
6. **n° 11 en partie (13, 14).** En 14, la phrase brute devient le titre (« hotte murale à 1 200 m³/h au moins »), et « Ce qui
   compte » mêle l'objet et le seuil (« Hotte murale 1 200 m³/h au moins »). En 13, la phrase est encore recitée. G9 (11) et le
   titre lu sur le lien (19) sont mis en forme.
7. **n° 13 pas corrigé (27, deux thèmes).** Le compromis propose la 2e, que le tableau marque « sous votre minimum » deux lignes
   plus haut. Ce minimum n'est écrit nulle part. Il frappe 1 200 et 1 100 mais épargne 1 500, alors que sa phrase dit « 1 200 m³/h
   au moins » (13, 22). « Ça classe pas super super » (D-141).
8. **n° 14 pas corrigé (27).** Le Ventilateur de plafond est « écarté » sans sa raison. On ne la lit qu'en Choisir (« brasse la
   buée sans la sortir », 28) (R26).
9. **n° 16 pas corrigé (55b).** « À venir » est dit trois fois : la pastille, l'aperçu « dans À venir · Ouvrir dans À venir », puis
   « Dans À venir depuis le 16 nov. » (R47).
10. **n° 17 pas corrigé (26).** L'article montre un picto au lieu d'une photo, et la ligne « lues sur la fiche du vendeur, <date> »
    manque ; il n'y a que le badge « exemple ». Écart à h01-6 (R05).
11. **n° 20 pas corrigé (43).** Hors ligne, « acheter 2 sachets de levure » devient un carnet complet, et rien ne promet que l'IA
    rangera au retour du réseau.
12. **n° 22 pas corrigé (07, 14, 41, 43).** « Photos · aucune » reste affiché alors qu'il est vide (§ Rangé derrière).
13. **n° 24 pas corrigé (toutes).** Il n'y a pas de fil de chat : ses messages ne vivent que cités dans les cartes. Le report
    suit R39 (lots E et F, après son choix), mais c'est sa dernière parole : « En gros, un chat, et ça met en forme ».
14. **n° 10 (10 = 09).** La bulle G8 ne paraît pas à 1280. On ne sait pas si c'est voulu (rien à trancher, `null` en corr6-B) ou
    si elle manque : à prouver avec un cas qui la déclenche (R12).
15. **NEUF (14).** Depuis la liste, « hotte murale à 1 200 m³/h au moins » crée un 2e carnet. Pourtant 04 détecte « Déjà un carnet
    proche : Ventilation » pour « hotte au-dessus de la cuve ». « J'ai déjà un carnet hotte. »

### Mineurs
16. **n° 23 en partie (09).** La meilleure valeur est écrite en vert, mais garde l'aplat gris-vert. h05-3 n'a que le vert.
17. **n° 25 pas corrigé (27).** Comparer affiche « Ce qui compte tient 80 °C », alors que le carnet ouvert (09) et le classement
    disent « puis le débit ».
18. **n° 30 pas corrigé (16).** Le cadre « Arrive ici » garde environ 90 px vides.
19. **n° 32 pas corrigé (02).** La liste vide promet « on le surveille », alors que la veille naît éteinte.
20. **NEUF (32).** Le menu ··· s'insère dans le flux et pousse le titre de 130 px vers le bas, au lieu de flotter.
21. **NEUF (16, 21).** Une pastille « À comparer » paraît sur un carnet dont le seul lien n'est pas lu.

### Doutes (non comptés)
- 01 et 31 contre 50 : dans 01, l'Embouteillage est rangé en « Choisi » et 31 affiche Réalisés 0. En 50, le même run affiche
  Réalisés 1 avec « payé le 16 nov. ». Est-ce que la fixture change en cours de run, ou est-ce que la liste ne lit pas `estRealise` ?
- 22 : « Sol du local » est déjà dans la liste (Idée 3, Carnets 7) pendant le découpage, avant toute confirmation.
- 49b : après « Garder le plan sans ce carnet », un bouton « Envoyer dans À venir » grisé reparaît.
- 47 : l'app reste sur « Chargement de l'écran… » à 1280. La cause est-elle le banc ou l'app ? À 390, `chir7/m390-8` montre
  l'en-tête et le segment.

## D-n → preuve (1280)

| D-n | capture | état |
|---|---|---|
| D-96 liste | 01 | ✓ |
| D-97 vide | 02 | ✓ (n° 19) |
| D-99, D-114 ouvert | 09 | ✓ (n° 16) |
| D-101 cartes | 09, 19 | ✓ |
| D-102 article | 26 | partiel (n° 10) |
| D-103, D-52 comparer | 27 | n° 7, 8, 17 |
| D-104, D-20 choisir, pourquoi | 28 ; 28b texte | ✓ juste ; feuille non vue |
| D-105, D-11 À venir, Réalisés | 31 vide ; 30b absent | partiel (doute) |
| D-130 créer avant | 03 = 01 (texte) | non prouvé |
| D-131 créer pendant | 04 ✓ ; 06 absent | partiel |
| D-132 créer après | 07 | ✓ (n° 12) |
| D-133 ajouter avant, G8 | 10 = 09 | n° 14 |
| D-134 texte pendant, G9 | 11 ✓ | ✓ |
| D-135 texte après | 13, 14 | **bloquant** (n° 1, 2) |
| D-136 lien avant | 15 = 01 | absent (n° 4) |
| D-137 lien pendant | 16 | ✓ (n° 18) |
| D-138, D-21, D-23 lien après, G20 | 18, 19 | partiel (n° 5) |
| D-139, D-140 vrac | 22, 23 | découpé ✓ ; types faux (n° 2) |
| D-118 modifier une note | 32b = 32 | absent (n° 4) |
| D-119 renommer | 34 (texte) | non revu |
| D-120 supprimer une note | 35b = 35c | absent (n° 4) |
| D-121, D-47, D-47b supprimer, archiver | 38, 49b, 50 | ✓ |
| D-113, D-122, D-129 l'IA aide | 11, 22 ✓ ; 48c ✗ | n° 3 |
| D-142, D-19 fil | — | n° 13 |
| D-54 clavier | 39 (texte) | non revu |
| D-68, D-74, D-42 + volant | 46 = 01 | sans effet (n° 4) |
| D-65, D-80, D-85, D-69 en-tête | 47, 56 (en-tête) ; segment non vu | partiel (n° 4 ; 390 ✓) |
| D-24 frigo | 38, 55b | ✓ |
| D-28 veille | 19 éteinte ✓ ; ON = sans effet | n° 4 |
| D-46, D-76 pastilles | 55b, 50 | n° 9 |
| D-128 achat en tête | 22 | ✓ |
| D-63 scénario de zéro | 48c | **bloquant** (n° 3) |
| D-83 micro | 45 = 09 | sans effet (n° 4) |
| D-8, D-29 étapes | — | absent (n° 4) |
| D-36 tâches | 54 (texte) | non revu |
| D-40, D-72 calendrier | 56 vide | absent (n° 4) |
| § Refusé | aucun vu | ✓ |

## Ce qu'il dirait
« Ça avance : la note en vrac est découpée, le pourquoi est juste, le frigo a son libellé. Mais j'ajoute un débit minimum et il efface
les débits, il range mon évier dans le frigo, 80 °C finit en note, et la moitié des boutons n'ont pas été touchés. Et c'est toujours
pas un chat. »

## DEMANDE EXECUTANT
Prérequis : serveur `vite` DEV du worktree `port-carnet`, variables factices ; même script `vision-8/d1280.mjs`.
1. Rejouer, dans les deux thèmes :
   - 19 : 2e lien dans Ventilation, défilé jusqu'au tableau ;
   - 30 → 30c : idée choisie, puis Envoyer dans À venir ;
   - 32b, 33 : ··· d'une note, pas de l'idée ;
   - 35b : note supprimée, puis Annuler ;
   - 06 : une phrase sans carnet proche ;
   - 46 : + volant ;
   - 40b : ✕ ;
   - 26b : bascule de veille ;
   - 44, 45 : photo et micro ;
   - 51 : `&aides=0` ;
   - 47 : attendre la fin de « Chargement », jusqu'à Matériel › Carnets ;
   - 56, 57 : calendrier avec une idée datée ;
   - 11 : l'état « après » sur l'Évier.
2. Supprimer les cinq captures de 09:33, qui sont périmées.
3. Après chaque geste : « PAGE OK » si l'empreinte a changé et que l'image est ouverte, sinon « SANS EFFET ».

LEÇON PROPOSÉE : avant toute ouverture d'image, comparer les empreintes md5 des captures. Des captures identiques montrent un geste
sans effet ou un état non atteint, sans coût de contexte. Ici, 30 captures se réduisaient à 9 écrans.
