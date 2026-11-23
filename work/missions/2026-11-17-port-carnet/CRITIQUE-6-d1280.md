OK — 23 problèmes, 5 bloquants. Note : 6/10.

# Critique 6 — carnet porté, d1280 (18.11)

Version : worktree port-carnet, HEAD b3bb2d0fd (vision-6, RAPPORT-d1280). Banc `?preview=carnets`, IA simulée, fixture « ZZ TEST — ».
Critique 5 : 22 problèmes, dont 5 bloquants, 6/10. Cette passe a corrigé « 30 L » inventé, le critère en tête, « moins bien
partout », l'IA en échec, le placeholder et la borne de la réglette. Deux valeurs fausses neuves (Choisir, note en vrac) gardent 5 bloquants.

Images ouvertes (35) : clair 01, 02, 04, 05, 07, 08, 09, 10, 13, 14, 15, 17, 18, 19, 20, 22, 23, 25, 26, 27, 29, 30, 31, 34, 35, 38 ;
sombre 01, 18, 22, 23, 30 ; réf. p2:g05-1, p2:h05-3, g5:v06-10, g5:v01-16.
Jugés sur le texte du rapport : aucun. Le rapport ne décrit pas 03, 06, 11, 12, 16, 21, 21a, 24, 28, 32, 33, 36, 37, 39, 40 (« non ouvert »), qui
restent non jugés. Comparé à la critique 5 : le sombre n'a rien montré de plus que le clair.

## Problèmes

### Bloquants
1. **Lien · après (14, 15 ; réf. g5:v06-10)**. « Lien rangé ici · page non lue » : il n'y a ni carte, ni photo, ni prix, ni
   « lu sur la page… tient 80 °C : oui », ni veille. Au 2e lien (15), aucun tableau ne naît (G20). Le cadre « pendant » (13) promettait
   « Nom, prix et photo se lisent à l'envoi ». — « Je colle un lien et il me rend le lien ? » — **Retenu manquant** : R17, D-27, D-138.
2. **Note en vrac · pendant et après (17, 18, deux thèmes ; réf. g5:v01-15, v01-16)**. Les trois lignes vont toutes dans un nouveau
   carnet « Sol local » : « 2 sachets de levure » (un achat de brassage) et « Prochain brassage mardi » (une date) y compris. La maquette
   retenue range en 2 carnets. — « Ma levure dans le sol du local ? » — **Retenu manquant** (R18, R19) et sens métier.
3. **Note en vrac, pendant → après (17 → 18)**. Pendant : « 3 notes, pas d'achat » ; « Ajoute : 2 sachets de levure » est typé
   note. Après : la même ligne devient « à acheter », et la carte « Sol local » porte « +3 · à acheter » pour 1 achat et 2 notes. —
   « Il dit une chose et en fait une autre. » — Valeur fausse.
4. **Texte · pendant → après (09 → 10)**. Le cadre annonce « les articles seront rangés sur le fond de bac, 38 cm au moins ».
   Après, ce critère n'arrive qu'en 3e, derrière « assez profond pour un fût », qui dit la même chose. Il y a donc deux critères
   de profondeur, non fusionnés. — « Il m'annonce un tri, il en fait un autre. » — Valeur fausse ; l'IA devait trier (D-113, D-122).
5. **Choisir (23, deux thèmes)**. « Tient 80 °C : oui · 1er sur 3 ex aequo » : dans Comparer (22), seules la 1re et la 2e
   tiennent 80 °C. — « 3 ex aequo ? Il y en a deux. » — Valeur fausse.

### Gênants
6. **Créer · après (05 ; réf. g5:v04-4)**. L'encadré beige « Idée · 18 nov. / Ensuite : l'IA cherche les façons » reste au-dessus du
   bandeau « Carnet créé », avec en plus les points d'état « ●○○○ idée » : deux blocs plus une pastille pour une seule nouvelle.
   La critique 5 n° 6 n'est pas corrigée (corr5-B la dit faite). Retenu partiel.
7. **Ajouter · avant, G8 (08)**. La bulle propose « pas trop de bruit » pour trancher, alors que la ligne Critère l'affiche déjà
   et qu'aucune colonne de bruit n'existe : rien ne peut trancher. — « Elle me propose ce qu'il y a déjà. »
8. **Comparer (22)**. La 4e affiche « – » pour « tient 80 °C », alors que sa façon porte « ne tient pas 80 °C » (07). Même donnée, deux
   réponses.
9. **Article ouvert (20)**. La pastille dit « 2e sur 4 » et la réglette « 3e sur 4 · le débit » sur le même écran, sans dire que l'un
   est le rang général et l'autre le rang au débit.
10. **Article ouvert (20 ; réf. p2:h01-6)**. Un grand picto remplace la photo. La fixture n'a pas de photo : rien ne montre la photo
    lue. Retenu partiel (R05, D-78).
11. **Choisir · pourquoi (23)**. Le « pourquoi » proposé recopie les chiffres (« 1 800 m³/h, 1er sur 4 ; 2 600 CHF, 4e sur 4… »). Il
    ne dit pas le problème réglé : « la seule à tenir 80 °C avec le plus gros débit » (D-13, D-20).
12. **Renommer (25)**. Le menu « Renommer / Supprimer l'idée » reste ouvert au-dessus du cadre de renommage.
13. **À venir (30, deux thèmes)**. Sous « Choisis, pas encore dans À venir · 2 », la phrase « « Envoyer dans À venir » se trouve
    sous le pourquoi du choix » est un mode d'emploi, là où un geste suffisait. — « Trop d'actions, pas assez d'aide » (D-122).
14. **Hors ligne (34)**. « L'IA ne le reprendra pas au retour du réseau » : son message reste brut pour toujours, sans « Ranger
    maintenant » au retour (D-113, D-142).
15. **Liste contre carnet (01 contre 07)**. La carte dit « 3 façons · 6 articles », le carnet ouvert « 2 façons à comparer · 5 lus,
    1 sans aperçu ». L'écartée et le lien sont comptés d'un côté, pas de l'autre.
16. **Le fil et Comparer deux idées (tous ; D-142)**. Ses messages n'existent que cités dans les cartes (« votre phrase ») ; aucun fil
    ne les garde visibles, et rien ne compare deux idées. C'est un choix ouvert (lot E puis F, D123) : ce n'est pas bloquant pour
    ce port, mais c'est ce qui prime pour lui.

### Mineurs
17. **Texte · après (10)**. Les critères sont écrits deux fois, en ligne puis en sous-liste ; sa phrase est citée 3 fois (titre, « de
    votre phrase », « votre phrase : « … » »).
18. **« +1 sans valeur » (07, 14), « +2 sans valeur » (34, 35)** : la mention est cryptique, et elle passe à +2 pendant que l'IA range encore (35).
19. **Créer · pendant (04)**. « Aucun de vos 0 carnets n'en parle » alors que la liste est vide.
20. **Comparer (22)**. « Ventilateur de plafon… » est tronqué à 1280, alors que la place ne manque pas (D-58, noms entiers).
21. **Réalisés (31)**. La ligne est nue, sans vignette ; le montant est écrit « 11 700,00 CHF » (ailleurs « 11 700 CHF ») ; « Achats
    liés : comme prévu » reste vague.
22. **À venir (30)**. Les cartes font 680 px de large, le segment au-dessus 736 px : les bords ne s'alignent pas.
23. **Choisir (23)**. Un rond vide devant « 2 600 CHF », sans rôle.

### Doutes (non comptés)
- Toutes les captures sont du banc : à la place de l'en-tête L'Affinée et du sous-segment « Articles · Courses · Fûts · Matériel ·
  Houblons » de g05-1, on voit « Banc — données simulées ». L'habit de l'app à 1280 (D-80, D-85) n'est donc pas prouvé.
- Liste (01) : le groupe « En veille » de g05-1 n'est pas visible au-dessus du pli, alors que la fixture a 1 article en veille.
- Note · actions (26) : la capture montre le carnet ouvert sans aucun menu de note. Soit le geste n'a pas d'effet, soit
  l'état se trouve sous le pli.
- Scénario de zéro (38) : la capture est identique à la liste vide (02) ; le parcours D-63 n'est pas joué.
- La veille n'a été jouée que de ON vers OFF (21a, 21).

## D-n → preuve

| D | Preuve | | D | Preuve |
|---|---|---|---|---|
| D-1 À venir, Réalisés, Archives | 30, 31 (Archives : un lien) | | D-63 scénario de zéro | absent (38 = 02) |
| D-15 une ligne suffit | 04, 05 | | D-65, D-69 thème | sombre 01, 22, 23, 18, 30 |
| D-16, D-17 façons, critère | 07 | | D-68 + volant | 01 |
| D-18 articles variés | 07 (CH, DE, FR) | | D-78 carte parlante | 01 ; 20 partiel (picto) |
| D-20 le pourquoi | 23 (chiffres seuls), 27 | | D-80, D-85 habit de l'app | doute (banc) |
| D-21, D-23 comparer technique | 22 | | D-96, D-97 liste, liste vide | 01, 02 |
| D-22 dispo et prix | 07 (en stock, délai) | | D-99, D-101 carnet, cartes | 07, 19 |
| D-25 vue simple, puis détail | 07 → 22 | | D-102 article ouvert | 20 |
| D-27 aperçu du lien | **absent** (14, 15) | | D-103, D-52 comparer, écartés | 22 |
| D-28 veille | texte (21a, 21 : ON → OFF) | | D-104 choisir | 23 (valeur fausse) |
| D-35 caractéristiques proposées | absent | | D-105 À venir, Réalisés | 30, 31 |
| D-40, D-72 idée au calendrier | absent (hors banc) | | D-113, D-122, D-129 l'IA range | 09, 10, 17, 18 (erreurs n° 2 à 4) |
| D-46, D-76 pastilles « lié à » | absent (non joué) | | D-118 modifier une note | 26 (état non visible) |
| D-47, D-47b supprimer une idée | 29 ; 28 texte | | D-119 renommer | 25 |
| D-53 un champ, critère proposé | 07, 09 | | D-120 supprimer une note | 27 |
| D-54 champ au-dessus du clavier | 390 seulement | | D-121 confirmation dans la page | 29 |
| D-124, D-126 note brute | 17, 18 (erreurs n° 2 et 3) | | D-130 à D-132 créer | 02, 04, 05 |
| D-133 ajouter avant | 08 | | D-134, D-135 texte | 09, 10 |
| D-136 lien avant | texte (12 non décrit) | | D-137 lien pendant | 13 (lecture jamais vue) |
| D-138 lien après | **absent** | | D-139, D-140 note en vrac | 17, 18 |
| D-142 fil, comparer deux idées | absent (choix ouvert) | | D-2, D-6, D-8, D-45, D-49 scan | hors banc |
| D-31, D-32, D-34, D-66 | à dessiner, absent comme prévu | | D-143, D-144 en ligne | hors de cette critique |

## DEMANDE EXECUTANT
1. Rejouer 26 (« ··· » d'une note) en faisant défiler jusqu'à la note avant le geste ; rejouer 12, 24, 28, 32, 33, 36, 37, 39 et 40, et
   décrire chacun dans le rapport.
2. Une capture 1280 depuis l'app (`?dev-local`, Stocks › Matériel › Carnets), pas depuis le banc, pour prouver l'en-tête et le sous-segment.
3. Liste 01 défilée jusqu'en bas (groupe En veille) ; veille jouée de OFF vers ON.
