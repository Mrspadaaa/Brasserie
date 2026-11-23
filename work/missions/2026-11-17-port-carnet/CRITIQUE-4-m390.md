# Critique 4 — carnet porté, part m390 (18.11, critique Opus)

Question unique : combien et quels problèmes ? Banc `?preview=carnets`, worktree port-carnet HEAD e0073224e, IA simulée,
fixture « ZZ TEST — … » (préfixe ignoré). Côte à côte avec ses maquettes retenues (MISSION.md § Retenu).

**Ouvertes (35)** : maquettes p2:g05-1, h05-3, h03-5, h01-6, g01-8, g05-11, g5:v08-3, v06-10, g4:v02-18 ; captures clair
01, 02, 05, 07, 09, 10, 13b, 18, 21, 23, 25, 26b, 27, 28b, 30b, 32b, 33, 35c, 36b, 38, 39, 42, 43 ; sombre 07, 23, 27.
Le reste est jugé sur RAPPORT-m390.md et les journaux (marque « texte »).

**Bilan : 27 problèmes, dont 12 bloquants, 9 gênants, 6 mineurs.** Le fil marche : un champ, sa phrase citée là où elle
est rangée, « Annuler » sur place, le tableau qui naît au 2e article, la suppression v2 fidèle à g4:v02-18, et les deux
thèmes lisibles. Ce qui casse, ce sont les écrans figés : les cartes, la fiche, Comparer et Pourquoi s'éloignent de ses
maquettes. Et l'IA ne met pas assez en forme.

## Problèmes

### Bloquants (12)

1. **Liste des carnets (01, 05, 23 ; sombre 23)** : chaque carnet porte le même cube générique, alors que g05-1 montre
   une hotte, un évier, une tireuse et un frigo. La carte d'article de 18 a le même cube. Ce qu'il dirait : « C'est quoi
   ces cubes ? On sait plus ce que c'est. » Retenu manquant : R01 « photo », D-78 (CARNET-CARTE-MUETTE).
2. **Lien · après (18), comparé à g5:v06-10** : la carte n'a ni photo, ni les caractéristiques lues. Elle affiche
   « lu sur la page : débit », mais aucune valeur de débit. Il manque aussi « CHF » et la marque « exemple », et
   « tient 80 °C » est écrit deux fois. Ce qu'il dirait : « Il a lu le débit et il me le montre pas ? » Retenu
   manquant : R17 « carte complète ».
3. **Lien illisible (21, deux thèmes en ECHEC)** : le bandeau dit « ✓ Rangé ici » sans dire quoi. Il n'y a ni « page non
   lue », ni « Ouvrir ↗ », ni le lien en clair. Ce qu'il dirait : « J'ai collé un lien, il est où ? » Le geste reste
   sans retour (R25).
4. **Carnet ouvert, tableau (09, 33, 35c), comparé à p2:h05-3** : le lien non lu est classé 5e et s'affiche
   « exemple.invalid – – – ». Sa maquette montre « ? », « Lien sans aperçu · à relire » et « Ouvrir ↗ ». Ce qu'il
   dirait : « Il classe un truc qu'il a pas lu ? » C'est un écart à sa maquette (R03). Le correctif corr3-L2 ne couvre
   que Comparer.
5. **Note en vrac · après (23, clair et sombre), comparé à g5:v01-16** : les trois lignes sont toutes « note ». Pourtant
   « 2 bacs inox de 40 cm » et « hotte 120 cm » sont des critères ou des façons. Il n'y a aucune puce de type ▾ ni de
   carnet ▾ pour corriger d'un toucher. Ce qu'il dirait : « Il a juste recopié ma liste. » Retenu manquant (base
   v01-16 ; D-122, D-142 : « ça met en forme »).
6. **Cartes d'article (25)** : l'état R04 montre le tableau du carnet au lieu des cartes de h03-5. Il manque la photo,
   la valeur du critère en gros, la réglette et « Veiller » sur chaque article. Retenu manquant : R04, D-101.
7. **Article ouvert (26b), comparé à p2:h01-6** : il manque la photo de la page et le héros du critère (la valeur en
   gros, avec « la plus basse des 5 »). Les caractéristiques n'ont pas leur rang (« 2e »). Il n'y a qu'une offre, sans
   prix barré, et le bouton Choisir est noir au lieu de vert. C'est un écart à sa maquette figée (R05, D-102).
8. **Comparer (27, clair et sombre), comparé à p2:g01-8** : il manque surtout le « Compromis : la 1re, … » où l'IA dit
   qui gagne et pourquoi. Les colonnes n'ont pas de photo, les noms tiennent sur 4 lignes, la 4e colonne est coupée et
   « Valeurs annoncées par les vendeurs » n'apparaît pas. Ce qu'il dirait : « Il compare rien, il me fait un tableur. »
   Retenu manquant : R06, D-103, et sa plainte « pas assez d'aide de l'ai ».
9. **Pourquoi ce choix (28b), comparé à p2:g05-11** : l'écran n'a qu'une phrase et trois ✓. Il manque les deux
   réglettes (critère « 1er sur 5 », prix « 4e sur 5 »), la ligne ✕ de l'écarté et la photo du choisi. C'est un écart
   à sa maquette figée (R07, D-104).
10. **Doublon (12, 12b ; texte, ECHEC dans les deux thèmes)** : « Garder à part » ne paraît jamais.
    `CadreArrivee` sait l'afficher, mais aucun appelant ne lui passe `doublon` (corr3-L4). Retenu absent : G11, et le
    geste est injoignable.
11. **Note · aide IA (33)** : la feuille n'est pas atteinte, donc « Ressemble à un critère · Passer » n'est jamais
    montré. La fixture n'a pas de note qui ressemble à un critère (corr3-L4). G25 à G27 ne sont pas prouvés : le
    problème reste bloquant tant que l'écran n'est pas montré.
12. **Supprimer une idée en veille (36b, clair et sombre), comparé à g4:v02-18** : la feuille est fidèle, mais l'offre
    G35 « 2 articles en veille : les déplacer dans <carnet proche> · Déplacer » manque. Retenu manquant : G35, R23.

### Gênants (9)

13. **Créer · après (07, sombre 07) et note en vrac · après (23, sombre 23)** : « L'IA range… ••• » tourne encore sous
    un bandeau qui dit que c'est fini (« Carnet créé », « 3 lignes rangées »). Ce qu'il dirait : « C'est fini ou
    pas ? » Le correctif corr3-L3 annonçait pourtant les états « en cours » et « fini » distincts.
14. **Créer · après (07), et 05 au pendant** : « Ce qui compte, tiré de votre phrase » recopie toute la phrase, titre
    compris. La greffe G5 voulait seulement le critère (« 2 cylindres, 150 kg/h »).
15. **Sens métier, carnet Ventilation (10, 21, 27, 28b, 39, 43)** : « plus de condensation au plafond » est proposé
    comme critère (bulle G8), rangé dans « Ce qui compte » et coché comme raison du choix. C'est sa plainte, pas un
    critère : il en veut moins. Ce qu'il dirait : « Plus de condensation ? Je veux l'inverse. » Cela se voit en
    2 secondes.
16. **Comparer (27)** : l'en-tête annonce « Ce qui compte : plus de condensation au plafond », mais le tableau est rangé
    par « tient 80 °C, puis le débit ». Le critère affiché n'est pas celui du classement.
17. **Modifier une note (32b)** : le cadre « Se modifie ici · Supprimer · ✕ » est vide et placé en haut du carnet,
    loin de la note, qui est en bas dans Notes. On ne voit pas quelle note on modifie.
18. **Note supprimée puis Annuler (35c, ECHEC dans les deux thèmes)** : la note est revenue, mais « Note supprimée ·
    Annuler » reste affiché. Ce qu'il dirait : « Elle est supprimée ou pas ? »
19. **Supprimer une idée liée (38)** : sous le titre, le libellé « votre phrase en titre » s'affiche seul, sans la
    phrase. Ce texte est faux.
20. **Clavier à 300 px (39)** : la bulle G8, la puce « Coller : … » et le champ prennent la moitié de la hauteur. Il
    reste environ 180 px de carnet visibles (R27, CARNET-CLAV).
21. **Lisibilité des tableaux (09, 25, 33)** : les noms tiennent sur 2 à 5 lignes, l'en-tête « tient 80 °C » sur
    3 lignes, et h05-3 avait des vignettes que le port n'a pas (D-38, CARNET-LIS).

### Mineurs (6)

22. Les prix s'affichent sans « CHF » (18, 26b dans l'offre, 28b).
23. Les écartés répètent leur nom, avec un accord faux (25, 27) : « Ventilateur de plafond 130 cm / Ventilateur de
    plafond écartée : … ».
24. À venir (30b) : deux « + » à l'écran (« + Besoin » et le + volant), « Ouvrir le carnet » répété sous chaque ligne
    et un titre coupé (« Ventilation de l… »).
25. Supprimer une idée liée (38) : le lien tient sur 5 lignes dans une colonne étroite, et la puce « À venir · … »
    double la carte « dans À venir ».
26. Liste (01) : la ligne « 3 façons · 6 articles · 1 en veille » tient sur 2 lignes au lieu d'une. La pastille
    « À comparer » est beige au lieu de verte comme dans g05-1. La carte Pompe dit « 0 façon » (23).
27. Texte · après (13b) : le critère reformulé (« Un fût de 30 L couché entre dans le bac ») perd le « 38 cm » de sa
    phrase. La phrase reste citée dessous.

### Doutes (non comptés)

- 52d : la raison de l'écart est affichée, mais le mot attendu manque. Il faut vérifier le texte attendu.
- 42 (IA éteinte) : rien à l'écran ne dit que l'IA est éteinte. « filtre à air G4, 2 pièces » (un achat) est rangé en
  note. C'est peut-être le repli voulu.
- 43 (hors ligne) : l'écran dit « rangé sur place », sans montrer ce qui a été rangé.
- Le 4e article est marqué « moins bien partout » alors que sa tenue à 80 °C est inconnue.
- Habit (R29) : au banc, la barre « Banc — données simulées » remplace l'en-tête L'Affinée et les segments de Stocks.
  Ce point est à vérifier dans l'app réelle (dev-local, part 1280).
- 05 : le cadre « arrive ici » est suivi des grandes cartes, et non de la liste compacte « Vos carnets » de v08-3. Ce
  n'est peut-être voulu que pour le cas « carnet proche » (04, non ouvert).
- Build : le contrôle de confidentialité a échoué au moment du build (`dist` absent) et n'a pas été relancé.
- D-63 (son scénario joué de zéro, sans fixture) n'est pas joué ici.

## D-n → capture

| D-n | Où | Statut |
|---|---|---|
| D-96 liste figée | 01 | vu, écart (1, 26) |
| D-97 liste vide | 02 | vu, conforme (exemples touchables, « note en vrac ») |
| D-99 carnet ouvert | 09, 21, 43 | vu, écart (4, 21) |
| D-101 cartes d'article | 25 | absent (6) |
| D-102 article ouvert | 26b | vu, écart (7) |
| D-103, D-21, D-23 comparer | 27 | vu, écart (8, 16) |
| D-52 écartés visibles | 27, 25 | vu (23) |
| D-104, D-20 pourquoi | 28b | vu, écart (9) |
| D-105, D-11, D-1 À venir, Réalisés | 30b ; 31b texte | vu (24) |
| D-130 créer avant | 03 | texte |
| D-131 créer pendant | 05 ; 04 texte | vu (14) |
| D-132, D-111 créer après | 07 | vu (13, 14) |
| D-133 ajouter avant | 10 | vu (15) |
| D-134 texte pendant | 11 texte ; 12, 12b | doublon absent (10) |
| D-135 texte après | 13b | vu, conforme (27) |
| D-136 lien avant | 15 texte ; puce vue en 35c, 39 | vu |
| D-137 lien pendant | 16 | texte |
| D-138, D-27 lien après | 18 ; 21 | vu, écart (2, 3) |
| D-139, D-124, D-126 note en vrac pendant | 22 | texte |
| D-140, D-122, D-123 note en vrac après | 23 | vu, écart (5, 13) |
| D-118 modifier une note | 32b ; 32, 32c texte | vu (17) ; aide IA absente (11) |
| D-119 renommer | 34 à 34d | texte |
| D-120 supprimer une note | 35c ; 35, 35b texte | vu (18) |
| D-121, D-47, D-47b supprimer une idée | 36b, 38 ; 36, 37, 49 texte | vu (12, 19, 25) |
| D-142, D-19, D-129, D-113, D-53 fil et champ unique | 07, 13b, 18, 23, 42 | vu, fil conforme ; mise en forme faible (5, 14) |
| D-13, D-17 critère | 07, 13b, 21 | vu (14, 15) |
| D-10, D-16 façons | 21, 43 | vu, conforme |
| D-18 5 ou 6 articles | 25, 27 | vu |
| D-22, D-28 veille, dispo | 18, 26b | vu (« demandée · pas encore relevée ») |
| D-24 générique | 18, 26b | vu ; pictos génériques (1) |
| D-25 vue sans détail, détail à un toucher | 01, 26b | vu |
| D-29 un geste par action | 05, 07, 13b | vu, conforme |
| D-35 caractéristiques acceptées d'un toucher | — | absent (non montré au banc) |
| D-38 lisibilité | 09, 25, 27 | vu (21) |
| D-41 rien ne se perd | 43 | vu |
| D-42, D-68, D-74 + volant | 01 et toutes | vu, conforme |
| D-46, D-76 pastilles « lié à » | 55 | texte |
| D-54 champ au-dessus du clavier | 39 | vu (20) |
| D-65, D-69, D-80, D-85 thème | sombre 07, 23, 27 | vu, lisible ; en-tête remplacé au banc (doute) |
| D-78 carte et fiche parlantes | 01, 18, 26b | écart (1, 2, 7) |
| D-128 centré sur l'achat | 18 | vu |
| D-36 tâches chronométrées | 54 | texte |
| D-63 scénario de zéro | — | non joué ici |
| D-31, D-32, D-34 (idées à dessiner) ; D-2, D-6, D-8, D-45 (scan) ; D-40, D-72 (calendrier) ; D-143, D-144 (en ligne) | — | hors part m390 ou hors écran carnet |

## Ce qu'il dirait

« Le chat, ça marche, je vois mes phrases. Mais mes écrans choisis, les cartes, la fiche, la comparaison, le
pourquoi, c'est pas eux. Et l'IA trie rien, elle met tout en note et elle me dit pas lequel prendre. »
