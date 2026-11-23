OK — 39 problèmes, 10 bloquants. Note : 6/10.

# Critique 6 — carnet porté, fusion m390 + d1280 (18.11)

Version : worktree port-carnet, HEAD `b3bb2d0fd` (vision-6, RAPPORT-m390 et RAPPORT-d1280). Banc `?preview=carnets`, IA simulée,
fixture « ZZ TEST — … ». Critique : Opus (Fable interdit). Sources : CRITIQUE-6-m390.md (18 problèmes, 5 bloquants, 6/10) et
CRITIQUE-6-d1280.md (23 problèmes, 5 bloquants, 6/10). Un problème vu aux deux tailles tient sur une ligne. Les quatre fusions sont
la note en vrac, le critère en double, le texte répété et les comptes. Deux D-n ne sont prouvés à aucune taille : D-35 et D-63
deviennent donc bloquants.

La critique 5 fusionnée comptait 43 problèmes, dont 18 bloquants (5/10). Ce qui progresse : Créer, la liste, la liste vide, le cadre
« va atterrir ici », la carte du lien lu à 390, l'échec de l'IA dit à l'écran, Renommer, Supprimer, le + volant, le sombre lisible. Ce qui
reste : les deux promesses de D-142, « met en forme » (la note en vrac) et « comparer » (non atteint à 390), plus trois valeurs fausses.

Désaccord tranché (3 images ouvertes : d1280-clair-14, d1280-clair-15, m390-clair-18) : la carte du lien collé existe. À 390 (clair-18),
elle montre la photo, le prix, « en stock », la veille éteinte et « lu sur la page… tient 80 °C : oui », comme v06-10. À 1280, le banc a
collé des adresses que la lecture simulée ne connaît pas (`hotte-inox-80c`, `hotte-2`), d'où « page non lue ». Ce n'est donc pas un
élément absent : le problème passe de bloquant à gênant (n° 11). Le 2e lien de 15 tombe dans un carnet qui a déjà son tableau : G20
n'est montré à aucune taille.

Phrase prédite : « Là ça ressemble à ce que j'ai choisi. Mais ma note en vrac reste en un bloc, avec ma levure dans le sol du local.
Je vois jamais le côte à côte sur le téléphone, et c'est quoi ce frigo à 43 °C ? »

## Problèmes

### Bloquants (10)
1. **Note en vrac · pendant et après, non découpée (390 clair-22, -23 ; 1280 17, 18, deux thèmes ; réf. g5:v01-15, v01-16).** La
   note donne un seul carnet neuf, alors que la maquette range ses lignes en 2 carnets.
   - À 390, le carnet s'appelle « Pour le bac » et prend la note entière pour titre. « Tient 80 °C », le critère de la hotte, s'y
     retrouve posé sur un bac.
   - À 1280, « 2 sachets de levure » (un achat de brassage) et « Prochain brassage mardi » (une date) tombent dans « Sol local ».
   - Manquent : « ✻ L'IA découpe votre note : 3 lignes, 2 carnets », « ✓ 3 lignes rangées dans 2 carnets · Annuler », les lignes
     typées avec leur carnet et « › Texte d'origine ».
   - Valeur fausse, retenu manquant : R18, R19 ; D-122, D-123, D-139, D-140, D-142.
   - Il dirait : « Je lui donne ma note, il me fait un carnet poubelle. »
   - Correction : chaque ligne est rattachée à son carnet, existant ou neuf, avec le bandeau de v01-16.
2. **Note en vrac, pendant → après : le type change (1280 17 → 18).** Pendant, l'écran dit « 3 notes, pas d'achat » et « Ajoute :
   2 sachets de levure » est typé note. Après, la même ligne devient « à acheter », et la carte porte « +3 · à acheter » pour 1 achat et
   2 notes. Valeur fausse. « Il dit une chose et en fait une autre. »
3. **Texte : un critère annoncé, un autre appliqué, et deux critères de profondeur (390 clair-13 ; 1280 09 → 10).**
   - Pendant, le cadre annonce « rangés sur le fond de bac, 38 cm au moins ». Après, ce critère n'arrive qu'en 3e.
   - Il passe derrière « assez profond pour un fût », proposé par l'IA, qui dit la même chose ; l'IA ajoute au lieu de remplacer.
   - Valeur fausse (D-53, D-113, D-122). « Il m'annonce un tri, il en fait un autre. »
   - Correction : sa valeur remplace la proposition de l'IA sur le même axe, avec Annuler.
4. **Comparer côte à côte non atteint à 390 (clair-27 ; 52b au texte ; réf. g01-8).** La capture montre le carnet ouvert. Il n'y a ni
   colonne par article, ni meilleure valeur surlignée, ni « Compromis », ni « classées par… ». L'écran existe à 1280 (22). Retenu
   manquant à 390 (R06, R26 ; D-21, D-23, D-103). « Comparer, c'était le but. »
5. **Choisir · pourquoi, geste sans effet à 390 (clair-28 = clair-27 au pixel).** La feuille g05-11 n'apparaît pas : réglettes de la
   valeur et du prix, critère, façon, fournisseur, écarté et sa raison. Le rapport le dit : « tap sans effet ». Elle s'ouvre à 1280 (23).
   (R07, R34 ; D-20, D-104.)
6. **Choisir, rang faux (1280 23, deux thèmes).** La feuille affiche « Tient 80 °C : oui · 1er sur 3 ex aequo ». Or, dans Comparer (22),
   seules la 1re et la 2e tiennent 80 °C. Valeur fausse. « 3 ex aequo ? Il y en a deux. »
7. **Choix revu, frigo à 43 °C (390 clair-29).** Le critère est « tenir 2 °C stable en été », mais la colonne « °C » affiche 43 et 38
   pour une chambre froide. C'est l'ambiance maximale, sans libellé (sens métier, L14). « Un frigo à 43 °C ? N'importe quoi. »
   - Correction : « ambiance max °C », ou « 2 °C tenus jusqu'à 43 °C dehors ».
8. **Carnet ouvert, écart à p2:h05-3 (390 clair-09, sombre-09).**
   - Deux lignes absentes de h05-3 s'intercalent : « Articles 5 lus, 1 sans aperçu ⌄ » et « Comparer côte à côte › ».
   - Une seule façon tient à l'écran, contre deux façons et « Retenir la hotte » dans h05-3.
   - Les noms d'article prennent trois lignes. (R03, D-99.)
   - Correction : « Articles 6 ⌄ · Comparer › » sur une ligne ; « Lien sans aperçu · Ouvrir » dans le tableau.
9. **D-35, prouvé à aucune taille.** Le retenu p2:i06-4 et g5:v08-3 propose les caractéristiques de la catégorie et des fournisseurs,
   acceptés d'un toucher. Rien ne le montre.
10. **D-63, son scénario joué de zéro, prouvé à aucune taille.** À 1280, la capture 38 est identique à 02. À 390, le scénario n'est
    pas joué. Il faut partir d'une base sans fixture, puis passer par un frigo, une ventilation et un évier (CARNET-COEUR,
    acceptation du port).

### Gênants (15)
11. **Lien · après à 1280 (14, 15) : « Lien rangé ici · page non lue », sans carte.** Le cadre pendant (13) promettait pourtant « Nom,
    prix et photo se lisent à l'envoi ». La carte existe à 390 (clair-18). G20, le tableau qui naît au 2e lien d'un carnet né d'un
    lien, n'est montré à aucune taille : à 390, le carnet de 19 n'a qu'un article.
12. **Lien · après (390 clair-18) : le bandeau tait le rang.** « Article rangé ici » ne dit pas « 1re de sa façon, devant la
    120 cm » (R26, G20). « OK, mais elle est mieux ou pas ? »
13. **Lien depuis la liste (390 clair-19) : le carnet prend le nom du produit.** Il s'appelle « Pompe de transfert inox », alors que
    v06-10 nomme le besoin, « Pompe pour le moût », avec un critère proposé. Ici : « Ce qui compte · rien encore ». (D-7, D-13, R17.)
14. **Texte · après, trop de texte (390 clair-13, sombre-13 ; 1280 10).** Sa phrase est citée trois fois. Les critères sont écrits deux
    fois, en ligne puis en sous-liste. g5:v03-8 n'a qu'une citation (D-38). « Je lis trois fois la même chose. »
15. **Les comptes se contredisent (390 clair-01, -09, -36 ; 1280 01, 07).** La liste dit « 3 façons · 6 articles », le carnet « 2 façons
    à comparer · 5 lus, 1 sans aperçu », la suppression « 3 façons ». L'écartée et le lien sont comptés tantôt oui, tantôt non. « 2 ou 3 ? »
16. **Créer · après (1280 05 ; réf. g5:v04-4).** Pour une seule nouvelle, l'écran montre l'encadré beige « Idée · Ensuite : l'IA cherche
    les façons », le bandeau « Carnet créé » et les points « ●○○○ idée ». La critique 5 n° 6 n'est pas corrigée à 1280 ; la critique
    m390 juge 390 fidèle.
17. **Ajouter · avant, G8 (1280 08).** La bulle propose « pas trop de bruit », déjà affiché en Critère, et aucune colonne de bruit
    n'existe. « Elle me propose ce qu'il y a déjà. »
18. **Comparer (1280 22).** La 4e affiche « – » pour « tient 80 °C », alors que sa façon porte « ne tient pas 80 °C ».
19. **Article ouvert (1280 20).** « 2e sur 4 » et « 3e sur 4 · le débit » coexistent, sans dire lequel est le rang général.
20. **Article ouvert (1280 20 ; réf. p2:h01-6).** Un grand picto tient la place de la photo, et la fixture n'en a pas : la photo lue
    n'est jamais prouvée (R05, D-78).
21. **Choisir · pourquoi (1280 23).** Le pourquoi recopie les chiffres au lieu de dire le problème réglé, par exemple « la seule à
    tenir 80 °C avec le plus gros débit » (D-13, D-20).
22. **Renommer (1280 25).** Le menu « Renommer / Supprimer l'idée » reste ouvert au-dessus du cadre de renommage.
23. **À venir (1280 30, deux thèmes).** Un mode d'emploi, « « Envoyer dans À venir » se trouve sous le pourquoi… », tient la place
    d'un geste (D-122).
24. **Hors ligne (1280 34).** « L'IA ne le reprendra pas au retour du réseau » : son message reste brut, sans « Ranger maintenant »
    au retour (D-113, D-142).
25. **Le fil et Comparer deux idées (D-142).** Ses messages ne vivent que cités dans les cartes, et rien ne compare deux idées. C'est
    un choix ouvert (lots E puis F, D123), non bloquant pour ce port, mais c'est ce qui prime pour lui.

### Mineurs (14)
26. Placeholder coupé en plein mot à 390 : « Ajouter à Pompe de tra » (clair-19), « Frigo de garde » (clair-29), « Pompe doseu »
    (clair-41). Le `titreCourt` de corr5-D ne s'applique pas partout.
27. Choix revu (390 clair-29) : le lien vers À venir est dit deux fois, par la pastille, puis par « Dans À venir depuis le 16 nov. ».
28. Créer · après (390 clair-07) : « 1 façons ».
29. Texte · pendant (390 clair-11) : les puces « Va dans » prennent deux rangs.
30. Cartes d'article (390 clair-25) : « « buées au-dessus de la cuve » » flotte sans « votre phrase : » (R25).
31. Supprimer (390 clair-36) : pluriel faux (« 1 article… les déplacer »). Le carnet proposé (« Ventilation de la cave de garde »)
    répond à un autre besoin : à vérifier dans `carnetProche`.
32. L'état du carnet a deux formes, la pastille « Idée · 15 nov. » et les points « ●●●● idée » (390 clair-07, -11, -13, -23, -41 ;
    1280 05).
33. Article ouvert (390 clair-26, sombre-26) : le fil d'Ariane tient sur deux lignes et repousse la photo.
34. « +1 sans valeur », « +2 sans valeur » est une mention cryptique, qui change pendant que l'IA range (390 clair-18 ; 1280 07, 14,
    34, 35).
35. Créer · pendant (1280 04) : « Aucun de vos 0 carnets n'en parle ».
36. Comparer (1280 22) : « Ventilateur de plafon… » est tronqué alors que la place ne manque pas (D-58).
37. Réalisés (1280 31) : la ligne est nue ; on lit « 11 700,00 CHF » contre « 11 700 CHF » ailleurs, et « comme prévu » reste vague.
38. À venir (1280 30) : cartes de 680 px sous un segment de 736 px, les bords ne s'alignent pas.
39. Choisir (1280 23) : un rond vide devant « 2 600 CHF », sans rôle.

### Doutes (non comptés)
- Tout vient du banc (« Banc — données simulées ») : l'en-tête de l'app, le sous-segment de g05-1, R29, D-80 et D-85 ne sont pas
  prouvés.
- La pompe à « 1 800 m³/h » de la note du banc (390 clair-22) est absurde (2 à 5 m³/h en brasserie). Une fixture absurde masque les
  vraies absurdités.
- Sa note de ventilation dit « au moins 1 500 m³/h », et la hotte à 1 200 est rangée 2e sans « sous votre minimum » (D-122).
- Note · actions (1280 26) : sans menu visible, le geste est soit sans effet, soit sous le pli. 390 n'a que le texte (32).
- Liste 1280 : le groupe « En veille » est sous le pli. La veille n'est jouée que de ON vers OFF.
- Article ouvert 390 : « Choisir · fournisseur » et la veille de h01-6 sont sous le pli.

## D-n → preuve (fusion)

| D | m390 | d1280 | Bilan |
|---|---|---|---|
| D-1, D-11, D-105 | clair-30 ; 31 texte | 30, 31 | prouvé |
| D-7, D-15, D-130 à D-132 | clair-02, -07, -39 ; 04-06 non capturés | 02, 04, 05 | prouvé (n° 16, 28) |
| D-13 | clair-27 ; clair-19 (n° 13) | 23 (n° 21) | partiel |
| D-16, D-17 | clair-09 | 07 | prouvé |
| D-18, D-52, D-101 | clair-25 | 07, 19, 22 | prouvé |
| D-19 | clair-07, -13 | 10 | prouvé (n° 14) |
| D-20, D-104 | clair-29 ; g05-11 absente (n° 5) | 23 (n° 6, 21) | partiel |
| D-21, D-23, D-103 | **absent** (n° 4) | 22 | partiel (n° 4) |
| D-22 | clair-18 | 07 | prouvé |
| D-24, D-30 | clair-19, -34 | — | prouvé |
| D-25, D-102 | clair-26 | 07 → 22, 20 | prouvé |
| D-27, D-138 | clair-18 | absent (page non lue) | prouvé à 390 (n° 11) |
| D-28 | clair-18, -09 | 21a, 21 texte | prouvé |
| D-35 | — | absent | **absent des deux (n° 9)** |
| D-38 | clair-13 (n° 14) | 10 | défaut (n° 14) |
| D-41 | 08 texte | — | texte seul |
| D-42, D-68, D-74 | clair-46 | 01 | prouvé |
| D-46, D-76 | clair-29 ; 55 texte | non joué | prouvé à 390 |
| D-47, D-47b, D-121 | clair-36 ; 38, 49, 50 texte | 28 texte, 29 | prouvé |
| D-53, D-113, D-129 | clair-11 | 07, 09 | défaut (n° 3) |
| D-54 | clair-39 | 390 seulement | prouvé |
| D-63 | non joué | absent (38 = 02) | **absent des deux (n° 10)** |
| D-65, D-69, D-80, D-85 | sombre 01, 09, 13, 26, 36 ; en-tête hors banc | sombre 01, 18, 22, 23, 30 ; en-tête hors banc | thème prouvé ; habit de l'app en doute |
| D-66 | non vu | à dessiner | idée à dessiner, hors port |
| D-78 | clair-18, -26 | 01 ; 20 picto | partiel (n° 20) |
| D-79, D-133 | 10 texte | 08 | prouvé (n° 17) |
| D-96, D-97, D-128 | clair-01, -02 | 01, 02 | prouvé |
| D-99 | écart (n° 8) | 07 | défaut à 390 |
| D-118 | 32 texte ; 33 non joué | 26 non visible | texte seul (doute) |
| D-119 | clair-34 | 25 (n° 22) | prouvé |
| D-120 | non joué (35) | 27 | prouvé à 1280 |
| D-122, D-123, D-124, D-126 | clair-13, -23 en échec | 09, 10, 17, 18 en échec | **en échec (n° 1 à 3)** |
| D-134, D-135 | clair-11, -13 ; G11 non montré | 09, 10 | prouvé, G11 non montré |
| D-136, D-137 | 15 à 17 texte | 12 non décrit ; 13 | partiel |
| D-139, D-140 | clair-22, -23 en échec | 17, 18 en échec | **en échec (n° 1)** |
| D-142 | fil non porté (choix ouvert) | absent (choix ouvert) | choix ouvert (n° 25) |
| D-2, D-6, D-8, D-31, D-32, D-34, D-40, D-44, D-45, D-49, D-72, D-143, D-144 | hors banc | hors banc | hors de cette critique |

## DEMANDE EXECUTANT
Banc : `C:/Users/mrspa/.codex/worktrees/openai-clean-start/port-carnet`, `vite` dev, `?preview=carnets`. Clair, puis `&theme=sombre` ;
390×844 tactile et 1280×800. Captures dans `vision-6/<taille>-<thème>-<nn>b-<état>.png`, chacune ouverte.
1. **27b, 390** : dans Ventilation, toucher « Comparer côte à côte › », capturer en haut, puis défiler. Attendu : g01-8.
2. **28b, 390** : toucher « Pourquoi › » depuis le frigo (clair-29), et « Retenir la hotte » depuis Ventilation. Attendu : g05-11.
3. **14b et 15b, 1280** : coller une adresse que la lecture simulée connaît (`exemple.invalid/hotte-140`). Attendu : la carte v06-10.
   **19b, deux tailles** : coller un 2e lien dans le carnet né en 19. Attendu : le tableau naît (G20).
4. **04b, 05b, 22b, 40b, 390** : ralentir le rangement simulé au banc, capturer pendant. Attendu : « ↓ arrive ici », « ✻ Déjà un
   carnet proche », « ✻ L'IA découpe votre note », ✕.
5. **12b, 390** : taper une phrase qui double une note existante, attendre 600 ms. Attendu : G11, « Garder à part ».
6. **33, 35 (390) ; 26 (1280, la note défilée avant le geste « ··· »)** : modifier une note avec l'aide de l'IA ; supprimer une note,
   puis Annuler.
7. **44 et 45, 390** : toucher 📷, puis 🎤, trouvés par leur `aria-label`.
8. **1280** : rejouer 12, 24, 28, 32, 33, 36, 37, 39 et 40, puis les décrire dans le rapport. Défiler la liste 01 jusqu'au groupe
   En veille, puis jouer la veille de OFF vers ON.
9. **D-35** : dans un carnet neuf, capturer les caractéristiques et les fournisseurs proposés, puis l'acceptation d'un toucher
   (p2:i06-4, g5:v08-3).
10. **D-63** : jouer son scénario de zéro, sans fixture, en frigo, ventilation, puis évier, aux deux tailles.
11. **1280 depuis l'app** (`?dev-local`, Stocks › Matériel › Carnets) : en-tête et sous-segment.
