OK — CRITIQUE 5/10 — 32 problèmes (9 bloquants)

# Critique 7, fusion m390 + d1280 (18.11) : le carnet porté, banc `?preview=carnets`

Critique : Opus (Fable interdit). Sources : `CRITIQUE-7-m390.md` (5/10, 18 problèmes, 6 bloquants) et `CRITIQUE-7-d1280.md`
(6,5/10, 22 problèmes, 4 bloquants). Un problème vu aux deux tailles = une ligne, tailles notées.
Désaccords tranchés en image (4 ouvertures) : m390-clair-23, d1280-clair-23, m390-clair-27, d1280-clair-13 ; plus la ligne 18 de
`vision-7/RAPPORT-m390.md` (« Le bandeau ne dit pas le rang »).

Constat de méthode : les deux tailles n'ont pas joué le même scénario. À 390, la note en vrac part d'une liste vide (Carnets 1) et
Comparer oppose Hotte inox 120 cm à un extracteur qui ne tient pas 80 °C ; à 1280, la liste est peuplée (Carnets 7) et la paire
comparée diffère. Un écart entre tailles peut donc venir de la fixture, pas du code. `RAPPORT-d1280.md` est absent.

Tenu aux deux tailles : liste, liste vide sans la flèche refusée, carnet ouvert sans « quoi ? », Renommer, Suppression v2 à 0 et
1 lien, trois états d'IA honnêtes (390), veille éteinte à la naissance, « 1er sur 2 ex aequo », thème sombre lisible. Aucun refusé
(§ Refusé) ne revient.

## Combien et quels problèmes ? 32, dont 9 bloquants

### Bloquants
1. **Note en vrac non découpée (22, 23 ; 390).** Liste vide : la note entière devient le titre d'un seul carnet (« Sachets de
   levure x2. Prochain brassage mardi. Tient 80 °C pour la hotte. »), sans « ✓ 3 lignes rangées dans 2 carnets » ni « › Texte
   d'origine ». À 1280 (liste peuplée), la découpe marche. « J'écris trois trucs, il m'en fait un titre. » Retenu manquant :
   R18, R19, D-139, D-140, D-122.
2. **Levures qui « tiennent 80 °C » (23 ; 390).** Le carnet « Sachets de levure… » porte « Ce qui compte · Tient 80 °C », critère
   de la hotte. « Des levures qui tiennent 80 °C ? » Sens métier (L14).
3. **Le critère annoncé ne devient pas un critère (11 → 13 ; 390 et 1280).** 11 annonce « ↓ va atterrir ici » en Ce qui compte.
   À 390, la phrase finit en Notes 1 et l'ordre des critères s'inverse. À 1280, la ligne Critère reste « 2 bacs », « assez profond
   pour un fût » disparaît, et le dépôt « Bac inox 40 cm au moins » n'a pas de place visible. « Il me dit critère, il range en
   note. » Geste qui ne fait pas ce qu'il dit (R13, R14, D-134, D-135 ; CRITIQUE-6 n° 3).
4. **Frigo de garde à 43 °C (29, 38, 55, 55b ; 390 et 1280).** Colonne « °C » à 43, 38 et 30, sans libellé, sur un frigo qui
   « tient 2 °C en été ». « Un frigo à 43 °C ? » Sens métier (L14). Correction : « °C ambiante max » ou retirer la colonne.
5. **Embouteillage dans trois états contradictoires (30, 31, 50 ; 390).** Payé dans Réalisés (« 11 700 CHF »), sa fiche dit
   « Réalisés » et « Dans À venir depuis le 15 nov. », À venir le range « Choisis, pas encore dans À venir ». Valeur fausse :
   `estRealise` (R23, R47) doit gouverner les trois écrans. 1280 : 30 et 50 non jugés.
6. **Pourquoi faux (28 ; 1280).** « La seule à tenir 80 °C avec le plus gros débit », alors que Comparer (27) donne « oui » à la
   Hotte murale aussi. « C'est faux, l'autre tient aussi. » Valeur fausse. À 390, la phrase est juste sur sa paire (l'extracteur
   dit « non ») : le pourquoi doit être recalculé sur les articles présents, pas figé.
7. **Le dépôt d'un lien ne dit pas ce qu'il change (18, 19 ; 390 et 1280).** « Article rangé ici » / « Carnet créé », sans rang
   ni G20 (« Pompe magnétique rangée, 2e »). À 1280, la Hotte 140 cm passe devant la 1re sans que rien le dise. « Et alors, elle
   est où dans le classement ? » Retenu manquant : G20, R26 (CRITIQUE-6 n° 12). La critique m390 l'avait marqué ✓ ; son rapport
   dit le contraire.
8. **En-tête L'Affinée et segment Stocks absents (toutes ; 390 et 1280).** Seul « Banc — données simulées » paraît ; la capture 47
   « stocks-segment-nav » est identique à 01. « C'est où dans l'app, ça ? » Retenu manquant aux deux tailles : R29, D-65, D-80,
   D-85 (CRITIQUE-6 n° 2).
9. **Preuve manquante (390 et 1280).** Absents aux deux tailles : D-63 scénario de zéro (48a à 48c), D-136 lien avant (15), D-118
   modifier une note (32, 33), D-120 supprimer une note (35), D-40 et D-72 calendrier (56, 57), D-8 et D-29 étapes (R38), la
   feuille Archiver (50), la veille allumée (D-28), le + volant touché (46). À 390 seulement : « Déjà un carnet proche » (04),
   feuille « Pourquoi ce choix » (28). `RAPPORT-d1280.md` absent : rien ne dit quels gestes ont agi à 1280. Bloquant pour une mise
   en ligne (R42, L12).

### Gênants
10. **Bulle G8 (10 ; 390 et 1280).** Tronquée à 390 (« … peut … »), elle cache la rangée « Ventilateur de plafond » et ne dit pas
    quoi faire ; elle propose « pas trop de bruit », déjà dans la ligne Critère (corr6-B dit `null`). CRITIQUE-6 n° 7.
11. **Aucune mise en forme du texte (11, 13 ; 390 et 1280).** La phrase reprise telle quelle puis recitée (« votre phrase : … »,
    deux fois à 390, trois fois en 11 à 1280). g5:v03-8 reformule (« Un fût de 30 L couché entre dans le bac »). Retenu manquant
    en partie (R14, D-142). Le banc a tapé la conséquence comme entrée : G9 n'est pas prouvé.
12. **Lien collé sur liste vide (16 ; 390).** Carnet titré « exemple.invalid » ; ni « ✻ lecture de la page… » ni le lien en clair
    de g5:v03-10 (R16, en partie).
13. **Compromis (27 ; 390 et 1280).** À 390, il aligne des valeurs (« la 1re, tient 80 °C : oui ; 1 800 m³/h ; 2 600 CHF ») au lieu
    du prix de l'écart de g01-8 (« la seule à tenir 80 °C, pour 2 180 CHF de plus ») ; à 1280, il propose la 2e, « sous votre
    minimum » deux lignes plus haut. « Ça classe pas super super » (D-141).
14. **Comparer : écarté sans sa raison (27 ; 1280).** « Ventilateur de plafond 130 cm » n'a sa raison qu'en Choisir (R26).
15. **2e lien (19 ; 1280).** Le tableau du 2e article n'est pas au-dessus de la ligne de flottaison ; à sa place, « ✻ Comparer sur
    le débit · Ajouter » demande un geste. « Trop d'action, pas assez d'aide de l'IA. »
16. **Lien À venir dit deux ou trois fois (29, 38, 55, 55b ; 390 et 1280).** Pastille, aperçu, puis « Dans À venir depuis le
    16 nov. » ; l'aperçu n'a pas de date (R47). CRITIQUE-6 n° 27.
17. **Article ouvert (26 ; 390 et 1280).** Un picto, rogné en bas à 390, remplace la photo et sa légende de h01-6 ; la ligne « lues
    sur la fiche du vendeur, <date> » manque. Le banc n'a pas de photo : rien n'est prouvé.
18. **À venir (30 ; 390).** La liste « Cette semaine et après » de h05-9 manque. Port partiel connu (§ Points ouverts 7), retenu
    manquant visible.
19. **Note en vrac découpée, lignes collées (22, 23 ; 1280).** La carte « Prochain brassin » cite « 2 sachets de levure Prochain
    brassage mardi » sans séparation, et une date de brassage se range en Matériel. « Mardi c'est un brassage, pas du matériel. »
20. **Hors ligne (43 ; 390 et 1280).** « Acheter 2 sachets de levure » devient un carnet complet (Façons, Articles, Photos, Notes),
    et rien ne promet que l'IA rangera au retour du réseau.
21. **IA en cours (40 ; 390 et 1280).** À 1280, aucun signe que l'IA travaille (même écran que 07) ; à 390, « Sachets de levure »
    tapé dans Évier inox s'y range d'abord en note pendant que l'IA range.
22. **« Photos · aucune » montrée vide (07, 23, 40, 43 ; 390 et 1280).** Elle doit rester masquée tant qu'elle est vide (§ Rangé
    derrière) ; elle l'est en 13.
23. **Carnet ouvert : meilleure valeur sur aplat gris (09, 34 ; 1280).** h05-3 l'écrit en vert ; peu lisible en clair. Écart à sa
    maquette.
24. **Pas de fil de chat (toutes ; D-142).** Ses messages ne vivent que cités dans les cartes ; ni fil ni comparaison de deux idées.
    Report conforme à R39 (lots E et F, après son choix ; D123) : en attente de son choix, pas une faute du port, mais c'est sa
    dernière parole.

### Mineurs
25. **Un seul critère affiché (27, 28 ; 390 et 1280).** « Ce qui compte tient 80 °C », alors que le classement en cite deux
    (« puis le débit »).
26. **07 (390).** Titre coupé entre « 80 » et « °C » ; le critère est écrit deux fois (titre et Ce qui compte).
27. **Cartes Idée (01, 46 ; 390).** « ZZ TEST — Extracteur… » coupé sur trois lignes, « Coller un lien » mange la largeur (g05-1 :
    une ligne).
28. **11 (390).** Rangée « Va dans » coupée à droite (« Fa »).
29. **18 (390).** Critère « Capter la buée », caractéristique lue « tient 80 °C : oui » : la valeur lue ne sert pas le critère.
30. **16 (1280).** Le cadre « Arrive ici » garde environ 90 px vides.
31. **Réalisés (31 ; 1280).** Ligne nue, sans vignette (h05-9 ; CRITIQUE-6 n° 21).
32. **Liste vide (02 ; 1280).** « On garde sa photo, son prix, et on le surveille » promet une veille qui ne relève rien (R31).

### Doutes (non comptés)
- Photo (44) et dictée (45) : aucun effet visible en headless. Clavier réel non simulé (39) ; le + volant reste visible pendant la
  frappe (04, 11, 22, 34), alors que v08-3, v02-10 et v01-13 l'ôtent.
- Liste 1280 (01) : carte Frigo coupée en bas, « Dans À venir depuis le 16 nov. · Voir » de g05-1 non vu.
- 22 à 1280 : « Prochain brassin » déjà dans la liste pendant le découpage (création anticipée, ou capture prise après ?).
- 27 à 1280 : le « minimum » du débit n'est écrit nulle part.

## Trois regards (R50)
- **Besoin du brasseur, 5/10.** Figés et Comparer justes ; le chat ne met pas en forme (1, 3, 11) et des chiffres sont faux (2, 4,
  5, 6).
- **UX et UI, 6,5/10.** Habit fidèle aux deux thèmes ; coupures à 390 (10, 26 à 28), écarts de maquette (17, 18, 23).
- **Critique, 5/10.** Neuf bloquants ; CRITIQUE-6 n° 2, 3, 7, 12, 21, 27 toujours présents.

## D-n → preuve (fusion ; absent des deux = bloquant)

| D-n | 390 | 1280 | état fusionné |
|---|---|---|---|
| D-96 liste | 01 ✓ | 01 ✓ | ✓ (n° 27) |
| D-97 vide | 02 ✓ | 02 ✓ | ✓ (n° 32) |
| D-99, D-114 ouvert | 09 ✓ | 09 ✓ | ✓ (n° 23) |
| D-101 cartes | 09, 18 ✓ | non jugé | ✓ |
| D-102 article | 26 picto | 26 picto | partiel (n° 17) |
| D-103, D-52 comparer | 27 ✓ | 27 | ✓ ; n° 13, 14, 25 |
| D-104, D-20 choisir, pourquoi | 28b, feuille absente | 28 | vu à 1280 ; faux (n° 6) |
| D-105, D-11 À venir, Réalisés | 30, 31 | 30b, 31 | partiel (n° 5, 18, 31) |
| D-130 créer avant | 03 ✓ | non jugé | ✓ |
| D-131 créer pendant | 04 sans carnet proche | 04 ✓ | ✓ à 1280 |
| D-132 créer après | 07, 08 ✓ | 07 | ✓ (n° 22, 26) |
| D-133 ajouter avant, G8 | 10 | 10 | n° 10 |
| D-134 texte pendant, G9 | 11 | 11 | ✗ (n° 3, 11) |
| D-135 texte après | 13 | 13 | ✗ (n° 3) |
| D-136 lien avant | absent (15) | non jugé (15) | **bloquant** (n° 9) |
| D-137 lien pendant | 16 | 16 | n° 12, 30 |
| D-138, D-21, D-23 lien après, G20 | 18, sans rang | 18, 19 sans G20 | **bloquant** (n° 7) |
| D-139, D-140 vrac | 22, 23 ✗ | 22, 23 découpé | **bloquant** à 390 (n° 1, 2, 19) |
| D-118 modifier une note | absent (32, 33) | non jugé | **bloquant** (n° 9) |
| D-119 renommer | 34 ✓ | 34 ✓ | ✓ |
| D-120 supprimer une note | absent (35) | non jugé | **bloquant** (n° 9) |
| D-121, D-47, D-47b supprimer, archiver | 36, 38b ✓ ; 50 absent | 36, 38 ; 49, 50 non jugés | Archiver **bloquant** (n° 9) |
| D-113, D-122, D-129 l'IA aide | ✗ | partiel | ✗ (n° 1, 3, 11) |
| D-142, D-19 fil | cité sur place | cité sur place | fil en attente de son choix (n° 24, R39) |
| D-54 clavier | 39 simulé | non jugé | simulé (doute) |
| D-68, D-74, D-42 + volant | 46 non touché | visible, non touché | **bloquant** (n° 9) |
| D-65, D-80, D-85, D-69 habit, en-tête | absent | absent | **bloquant** (n° 8) |
| D-24 frigo | 29, 38, 55 | 55b, 38 | ✗ (n° 4) |
| D-28 veille | éteinte ✓, allumée absente | éteinte ✓, ON non vu | ON **bloquant** (n° 9) |
| D-46, D-76 pastilles | 55 ✓, 55b absent | 55b, 38 | ✓ (n° 16) |
| D-128 achat en tête | — | 22 ✓ | ✓ |
| D-123, D-124, D-126 | — | 22, 23 | ✓ à 1280 |
| D-83 micro | 45 présent | présent | effet non prouvé (doute) |
| D-8, D-29 étapes (R38) | absent | aucune étape vue | **bloquant** (n° 9) |
| D-36 tâches | 54 ✓ | non jugé | ✓ |
| D-63 scénario de zéro | absent | absent | **bloquant** (n° 9) |
| D-40, D-72 calendrier | absent (56, 57) | absent | **bloquant** (n° 9) |
| D-38 lisibilité | coupures | — | n° 10, 26 à 28 |
| § Refusé (D-55, D-9, D-12, D-14, D-92, D-108, D-117) | aucun vu | aucun vu | ✓ |

## Ce qu'il dirait
« Ça ressemble enfin à mes maquettes, mais j'écris trois trucs et il m'en fait un titre, il me dit critère et il range en note,
un frigo à 43 °C, et quand je colle un lien il me dit pas où il se range. Et c'est toujours pas un chat. »

## DEMANDE EXECUTANT
Prérequis (corr6-D) : aucun lot n'écrit dans `src` du worktree `port-carnet` ; `git status --short` stable deux fois à une minute.
```
cd /c/Users/mrspa/.codex/worktrees/openai-clean-start/port-carnet
# variables VITE_FIREBASE_* factices, comme dans corr6-D/RESULTAT.md
npx vite --port 5431 --strictPort --force > $TMP/vite7b.log 2>&1 &
V=/c/Users/mrspa/.codex/worktrees/openai-clean-start/Brasserie/work/missions/2026-11-17-port-carnet/vision-7
node $V/captures.mjs 5431 e10 390 clair,sombre      # D-63 (48a à 48c), puis idem en 1280
node $V/captures.mjs 5431 <états 05,06,12,14,15,17,19,20,21,24,25,32,33,35,37,47,49,53,55b,56,57> 390,1280 clair,sombre
```
1. **Même fixture et même scénario aux deux tailles** (vrac depuis liste vide et depuis liste peuplée, même paire en Comparer).
2. Régénérer `vision-7/RAPPORT-d1280.md` au format de RAPPORT-m390.md (« agit » md5 avant/après, ou « non joué »).
3. Gestes à compléter, deux tailles, deux thèmes : 04 avec liste non vide ; 28 « Pourquoi › » ouvert ; 50 Supprimer l'idée jusqu'à
   « Archiver » ; 46 + volant touché ; 38 jusqu'à 38b ; 26 défilé jusqu'à la bascule, jouée OFF → ON ; 19 défilé jusqu'au tableau ;
   27 défilé jusqu'à « Choisir » ; 40 pendant que l'IA travaille (simulation retardée).
4. 11 rejoué avec une phrase de brasseur (« un fût de 30 L couché doit entrer dans le bac »), jamais la conséquence attendue.
5. 47 depuis l'app (`?dev-local`, Stocks › Matériel › Carnets) : en-tête et sous-segment Stocks doivent paraître.

Sorties attendues : aucune ligne `PAGEERROR` ni `RECHARGEMENT-INVALIDE` ; par capture, « PAGE OK » ou le problème vu, image
ouverte. Les captures reviennent au critique.

LEÇON PROPOSÉE : un banc qui tape en entrée la phrase attendue en sortie ne prouve pas la mise en forme ; et deux tailles jugées
sur des fixtures différentes ne se comparent pas : même scénario, même données, aux deux tailles.
