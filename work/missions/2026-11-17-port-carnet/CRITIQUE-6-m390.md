CRITIQUE m390 6/10 — 18 problèmes (5 bloquants)

# Critique 6 — carnet porté, part m390 (18.11, critique Opus)

Banc vision-6 (HEAD b3bb2d0) : `?preview=carnets`, IA simulée, fixture « ZZ TEST — … », 390×844 tactile. Question unique : combien et quels problèmes ?
35 images ouvertes :
- 22 captures en clair : 01, 02, 07, 09, 11, 12, 13, 18, 19, 22, 23, 25, 26, 27, 28, 29, 30, 34, 36, 39, 41, 46 ;
- 5 captures en sombre : 01, 09, 13, 26, 36 ;
- 8 maquettes : p2:g05-1, h05-3, g01-8, g05-11, h01-6 ; g5:v04-4, v01-16, v06-10.
Le reste est jugé sur RAPPORT-m390.md (marque « texte »).

Bilan : 18 problèmes, dont 5 bloquants, 4 gênants et 9 mineurs. La critique 5 en comptait 24, dont 9 bloquants.
- Ce qui progresse :
  - Créer · avant et après (v04-4 fidèle, « Ensuite : collez un lien », qui est honnête), la liste (g05-1), la liste vide (i06-2) ;
  - le cadre « va atterrir ici » sur le bon carnet ;
  - la carte d'un lien collé (v06-10), avec la veille éteinte par défaut, ce qui est honnête ;
  - l'échec de l'IA, dit à l'écran ; Renommer, avec un titre proposé par l'IA ; Supprimer (G35, G36) ;
  - le + volant, avec « Nouvelle idée » près du pouce ; l'article ouvert, proche de h01-6 ; le sombre, lisible partout.
- Ce qui reste : les deux promesses de D-142, « met en forme » et « comparer ».
  - La note en vrac n'est toujours pas découpée.
  - L'écran Comparer côte à côte et la feuille « Pourquoi » ne se voient jamais à 390.
  - Une chambre froide affiche 43 °C.

Phrase prédite : « Là ça ressemble à ce que j'ai choisi. Mais ma note en vrac reste en un bloc, je vois jamais le côte à côte, et c'est quoi ce frigo à 43 °C ? »

## Problèmes

### Bloquants (5)
1. **Note en vrac · pendant puis après (clair-22, clair-23), comparée à g5:v01-16.** La note « Pour le bac : 2 bacs de lavage. Pour la hotte : tient 80 °C. Pour la pompe : … » donne un seul carnet neuf, « Pour le bac » :
   - la note entière sert de titre ;
   - « Ce qui compte » vaut « Tient 80 °C » : c'est le critère de la hotte, posé sur un bac ;
   - pendant, aucun « ✻ L'IA découpe votre note : 3 lignes, 2 carnets » ;
   - après, pas de « ✓ 3 lignes rangées dans 2 carnets · Annuler », pas de lignes typées avec leur carnet, pas de « › Texte d'origine ».

   Il dirait : « Je lui donne ma note, il me fait un carnet poubelle. C'est exactement ce que je voulais pas. »
   - Retenu manquant : R18, R19 ; D-123, D-139, D-140, D-142. Il doit tout refaire à la main (D-122).
   - corr5-A et corr5-D annoncent la découpe ; la capture ne la montre pas.
   - Correction : chaque « Pour X : … » devient une ligne rattachée au carnet X, existant ou neuf, avec le bandeau de v01-16.
2. **Comparer côte à côte (clair-27 ; 52b au texte) : retenu manquant.** La capture « comparer » montre le carnet ouvert, pas g01-8. On n'y voit aucun des éléments de g01-8 :
   - une colonne par article et une ligne par caractéristique ;
   - la meilleure valeur surlignée ;
   - le « Compromis » ;
   - « classées par … ».

   Le lien « Comparer côte à côte › » n'est jamais suivi à 390. Le « rangé par » de R26 est absent. Il dirait : « Comparer, c'était le but. Je vois pas le tableau que j'ai choisi. » (R06, D-21, D-23, D-103.)
   - Correction : capturer l'écran après le toucher. S'il n'existe pas à 390, porter g01-8 tel quel.
3. **Choisir · pourquoi (clair-28) : geste sans effet, ou non atteint.** La capture est identique à clair-27, au pixel près. La feuille g05-11 n'apparaît pas : réglettes de la valeur et du prix, critère, façon, fournisseur, écarté avec sa raison. Le rapport note : « Choisir absent de la vue Comparer (tap sans effet) ». Il dirait : « J'appuie, rien. Et le pourquoi que j'avais choisi, il est où ? » (R07, R34, D-20, D-104.)
   - Correction : « Retenir la hotte » ou « Pourquoi › » (clair-29) ouvre la feuille g05-11 ; la capturer.
4. **Choix revu, frigo (clair-29) : valeur absurde au premier regard.** Le critère est « tenir 2 °C stable en été ». Le tableau a pourtant une colonne « °C » qui affiche 43 et 38 pour une chambre froide. Un brasseur y lit « 43 °C dans mon frigo ». Il s'agit probablement de l'ambiance maximale, mais rien ne le dit. Il dirait : « Un frigo à 43 °C ? N'importe quoi. » (Sens métier, L14 : un nombre sans libellé juste est faux pour lui.)
   - Correction : colonne « ambiance max °C », ou la valeur du critère : « 2 °C tenus jusqu'à 43 °C dehors ».
5. **Carnet ouvert (clair-09, sombre-09) : écart à la maquette figée p2:h05-3.**
   - Deux lignes absentes de h05-3 s'intercalent entre le critère et le tableau : « Articles 5 lus, 1 sans aperçu ⌄ » et « Comparer côte à côte › ».
   - À 390, une seule façon tient à l'écran. h05-3 montre au premier écran les deux façons et « Retenir la hotte ».
   - Les noms d'article tiennent sur trois lignes : « Hotte murale 100 / cm / DE · délai 4 / semaines ».

   Il dirait : « C'est mieux, mais c'est toujours pas ma vue : le tableau commence en bas. » (R03, D-99.)
   - Correction : les deux liens sur une seule ligne, « Articles 6 ⌄ · Comparer › », comme clair-27 le fait déjà avec « 2 lus » ; la ligne « Lien sans aperçu · Ouvrir » dans le tableau, comme h05-3.

### Gênants (4)
6. **Texte · après (clair-13, sombre-13) : trop de texte.** « fond de bac 38 cm minimum » s'écrit trois fois : dans la ligne Critère, dans le bandeau et dans « votre phrase : « … » ». La sous-liste redit aussi « 2 bacs » et « assez profond pour un fût ». g5:v03-8 n'a qu'une citation. Il dirait : « Je lis trois fois la même chose. » (D-38, CARNET-LIS.)
   - Correction : le bandeau seul, avec sa phrase ; la ligne Critère dit « +1 ».
7. **Texte · après (clair-13) : un critère en double, l'IA n'aide pas.** « assez profond pour un fût » (proposé par l'IA) et « fond de bac 38 cm minimum » (sa phrase) sont le même critère. L'IA en ajoute un troisième au lieu de remplacer sa proposition par la valeur donnée. Il dirait : « C'est la même chose, il devrait le comprendre tout seul. » (D-122, D-53.)
   - Correction : sa valeur remplace la proposition de l'IA sur le même axe, avec Annuler.
8. **Lien · après (clair-18) : le dépôt ne dit pas ce qu'il change pour comparer.** Une hotte à 2 000 m³/h arrive. Le bandeau dit « Article rangé ici », sans dire « 1re de sa façon, devant la 120 cm » (R26 ; G20 : « Pompe magnétique rangée, 2e »). Il dirait : « OK, mais elle est mieux ou pas ? »
   - Correction : dans le bandeau, le rang dans la façon et la valeur qui le donne.
9. **Lien depuis la liste (clair-19) : le carnet prend le nom du produit.**
   - Le carnet s'appelle « Pompe de transfert inox ». v06-10 nomme le besoin, « Pompe pour le moût », et propose « tient le moût à 80 °C ». Ici : « Ce qui compte · rien encore ».
   - L'état « tableau au 2e lien » (G20), que le nom de la capture annonce, n'est pas montré : il n'y a qu'un article.

   Il dirait : « Un carnet, c'est mon besoin, pas une référence. » (D-13, D-7, R17.)
   - Correction : le titre du besoin et le critère proposé, comme v06-10 ; capturer le 2e lien.

### Mineurs (9)
10. **Placeholder coupé en plein mot** : « Ajouter à Frigo de garde » (clair-29), « Ajouter à Pompe de tra » (clair-19), « Ajouter à Pompe doseu » (clair-41). Le `titreCourt` de corr5-D n° 8 ne s'applique pas partout.
11. **Choix revu (clair-29) : le lien vers À venir est dit deux fois**, par la pastille « À venir · ZZ TEST — Frigo… » puis par « Dans À venir depuis le 16 nov. ».
12. **Les comptes se contredisent** : « 3 façons · 6 articles » sur la liste (clair-01), « 2 façons à comparer » dans le carnet (clair-09), « 3 façons » à la suppression (clair-36). La façon écartée est comptée ici, pas là. Il dirait : « 2 ou 3 ? »
13. **Créer · après (clair-07)** : « 1 façons ».
14. **Texte · pendant (clair-11)** : les puces « Va dans » prennent deux rangs ; « Façon », seule sur le second, pousse le carnet vers le haut.
15. **Cartes d'article (clair-25)** : « « buées au-dessus de la cuve » » flotte sous le tableau, sans dire d'où cela vient (R25 : « votre phrase : … »).
16. **Supprimer (clair-36)** : « 1 article en veille : les déplacer… » met un pluriel faux. Le carnet proposé, « Ventilation de la cave de garde », est un autre besoin qu'une hotte de salle de brassage : à vérifier dans `carnetProche`.
17. **L'état en tête du carnet a deux formes** pour le même état : la pastille « Idée · 15 nov. » (clair-11, -13) et les points « ●●●● idée » (clair-07, -23, -41).
18. **Article ouvert (clair-26, sombre-26)** : le fil d'Ariane « Articles · ZZ TEST — Ventilation de la salle de brassage » tient sur deux lignes et repousse la photo ; h01-6 le tient sur une.

### Doutes (non comptés)
- Note en vrac du banc : la pompe à « 1 800 m³/h » (clair-22) est absurde pour une brasserie, où l'ordre de grandeur est de 2 à 5 m³/h. C'est une saisie du banc, mais une fixture absurde masque les vraies absurdités.
- Ventilation : sa note dit « il faudrait au moins 1 500 m³/h ». La hotte murale à 1 200 m³/h est rangée 2e sans « sous votre minimum » : l'IA n'a pas fait de sa note un seuil (D-122).
- L'en-tête de l'app est absent au banc (« Banc — données simulées ») : R29 ne se vérifie qu'au port réel ou en ligne.
- Article ouvert : « Choisir · fournisseur » et la veille de h01-6 sont sous le pli, non vus.

## Tableau D-n → preuve

| D | Preuve m390 |
|---|---|
| D-1, D-11, D-105 | clair-30 (À venir, image) ; Réalisés 31 (texte) |
| D-7, D-15, D-130 | clair-39, clair-02 (image) ; 03 (texte) |
| D-13 | clair-27 « Le critère sépare… » (image) ; clair-19 nomme le produit (n° 9) |
| D-16, D-17 | clair-09 (image) |
| D-18, D-52, D-101 | clair-25 (écarté visible, image) |
| D-19, D-142 (fil) | clair-13, -07 (phrase citée, image) ; fil de chat : lot E, non porté (choix ouvert) |
| D-20, D-104 | clair-29 (image) ; feuille g05-11 **absente** (n° 3) |
| D-21, D-23, D-103 | **absent** à 390 (n° 2) |
| D-22 | clair-18 « en stock · exemple » (image) |
| D-24, D-30 | clair-34, clair-19 (image) |
| D-25, D-102 | clair-26 (image) |
| D-27, D-138 | clair-18 (image) |
| D-28 (R31) | clair-18 (éteinte par défaut), clair-09 « veille demandée » (image) |
| D-31, D-32, D-34, D-40, D-44, D-72 | hors banc (56 non joué) |
| D-38 | clair-13 (n° 6) |
| D-41 | 08 Annuler (texte) |
| D-42, D-68, D-74 | clair-46 (image) |
| D-46, D-76 | clair-29 (image), 55 (texte) |
| D-47, D-47b, D-121 | clair-36 (image) ; 38, 49, 50 (texte) |
| D-53, D-113, D-129 | clair-11 (image) |
| D-54 | clair-39 (image) |
| D-65, D-69, D-80, D-85 | sombre-01, -09, -36 (image) ; en-tête de l'app : hors banc |
| D-66 | non vu |
| D-78 | clair-18, -26 (image) |
| D-79, D-133 | 10 (texte) |
| D-96 | clair-01 (image) |
| D-97 | clair-02 (image) |
| D-99 | clair-09 : écart (n° 5) |
| D-118 | 32 (texte) ; « avec l'IA » (33) non joué |
| D-119 | clair-34 (image) |
| D-120 | **non joué** (35) |
| D-122 | clair-23 en échec (n° 1), clair-13 (n° 7) |
| D-123, D-124, D-126 | clair-23 en échec ; notes ref/ (24) non jouées |
| D-128 | clair-02 « Une note en vrac marche aussi » (image) |
| D-131 | **non capturé** (04 à 06 : rangé avant la capture) |
| D-132 | clair-07 (image) |
| D-134 | clair-11 (image) ; G11 doublon : clair-12 sans saisie, non montré |
| D-135 | clair-13 (image) |
| D-136, D-137 | 15, 16, 17 (texte) |
| D-139, D-140 | clair-22, -23 : **en échec** (n° 1) |
| D-143, D-144 | hors banc |

## DEMANDE EXECUTANT
Banc : `C:/Users/mrspa/.codex/worktrees/openai-clean-start/port-carnet`, `vite` dev, `?preview=carnets`, 390×844, tactile ; clair, puis `&theme=sombre`. Captures dans `vision-6/m390-<thème>-<nn>b-<état>.png`, chacune ouverte.
1. **27b** : dans le carnet Ventilation, toucher « Comparer côte à côte › » et attendre. Capturer en haut, puis défiler et capturer. Attendu : le tableau g01-8.
2. **28b** : depuis clair-29 (frigo), toucher « Pourquoi › » ; depuis Ventilation, toucher « Retenir la hotte ». Attendu : la feuille g05-11.
3. **12b** : dans Ventilation, taper une phrase qui double une note existante, attendre 600 ms, capturer. Attendu : G11, « Garder à part ».
4. **04b, 05b, 22b, 40b** : ralentir le rangement simulé, au banc seulement, puis capturer pendant. Attendu : « ↓ arrive ici », « ✻ Déjà un carnet proche », « ✻ L'IA découpe votre note », ✕.
5. **33 et 35** :
   - 33 : modifier une note avec l'aide de l'IA ;
   - 35 : supprimer une note, puis Annuler.
6. **44 et 45** : toucher l'icône 📷, puis 🎤, du champ, en la trouvant par son `aria-label`.
7. **19b** : coller un 2e lien dans le carnet né en 19. Attendu : le tableau naît (G20).
