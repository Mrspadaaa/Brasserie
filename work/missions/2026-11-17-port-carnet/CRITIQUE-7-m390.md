OK — CRITIQUE m390 5/10 — 18 problèmes (6 bloquants)

# Critique 7, m390 (18.11) : le carnet porté, banc `?preview=carnets`

Critique : Opus (Fable interdit). Version : worktree `port-carnet`, branche `claude/port-carnet-1711`, captures `vision-7/m390-*` (RAPPORT-m390.md).
Méthode : 19 planches côte à côte (capture | maquette retenue du § Retenu), montées dans le scratchpad. Une planche compte pour une image
ouverte, soit 19 ouvertures sur 35 permises. **54 captures vues, dont 6 en sombre** : 01, 09, 22, 26, 27, 28.
- Planches ouvertes : 01|g05-1 ; 02|i06-2 ; 03, 04|v03-2, v08-3 ; 07, 08|v04-4 ; 09|h05-3 ; 10|v03-6 ; 11, 13|v02-10, v03-8 ;
  16, 18|v03-10, v06-10 ; 22, 23|v01-15, v01-16 ; 26|h01-6 ; 27, 52|g01-8 ; 28, 28b|g05-11 ; 29, 30, 31|g05-9, h05-9 ;
  34, 36, 38b|g4:v01-13, g4:v02-18 ; 39 à 43 ; 44, 45, 46, 50, 50b ; 51, 54, 55, 38.
- Ce que je n'ai pas ouvert se juge sur le rapport, marqué « texte » ; c'est le cas des autres captures en sombre.

Sa question : **combien et quels problèmes ? 18 problèmes, dont 6 bloquants.**

Tenu, et fidèle à ses maquettes :
- les écrans figés : liste (01), liste vide sans la flèche refusée (02), carnet ouvert sans la rangée « quoi ? » (09), article (26), Comparer (27, 52, tableau absent à 1 article) ;
- la Suppression v2, à 0 et à 1 lien (36, 38b) ;
- les trois états d'IA, honnêtes (41 à 43) ;
- la veille éteinte à la naissance (18, 26) ;
- le thème sombre, lisible.

Le cœur de sa demande ne tient pas : « un chat, et ça met en forme ». Le brouillon n'est ni découpé ni mis en forme, et une phrase
annoncée en critère finit en note.

## Problèmes

### Bloquants
1. **22 et 23, note en vrac.** La note entière devient le titre d'un seul carnet, sur trois lignes : « Sachets de levure x2. Prochain brassage mardi. Tient 80 °C pour la hotte. ».
   - Manquent « ✻ L'IA découpe votre note : 3 lignes, 2 carnets », « ✓ 3 lignes rangées dans 2 carnets · Annuler » et « › Texte d'origine ».
   - Ce qu'il dirait : « J'écris trois trucs, il m'en fait un titre. L'IA fait rien. »
   - Bloquant, **retenu manquant** : R18, R19, D-139, D-140, D-122, CARNET-IA-AIDE.
2. **23, sens métier.** Le carnet « Sachets de levure… » porte « Ce qui compte · Tient 80 °C », le critère de la hotte collé à des levures.
   - Ce qu'il dirait : « Des levures qui tiennent 80 °C ? »
   - Bloquant (L14) : chaque ligne de la note va à son objet ; jamais de critère tiré d'une autre ligne.
3. **De 11 à 13, ce qui est annoncé ne se fait pas.**
   - En 11, le cadre dit « ↓ va atterrir ici », la puce « Ce qui compte » est préchoisie, et la conséquence annonce « les articles seront rangés sur le fond de bac, 38 cm au moins ».
   - En 13, la phrase finit en **Notes 1**. Le critère ne change pas, et l'ordre des critères s'inverse (« assez profond… puis 2 bacs »).
   - Ce qu'il dirait : « Il me dit critère, il range en note. »
   - Bloquant : un geste qui ne fait pas ce qu'il dit (R13, R14, D-134, D-135 ; n° 3 de CRITIQUE-6, toujours présent).
4. **29, 38 et 55, frigo de garde.** La colonne « °C » donne 43, 38 et 30, sans libellé, sur un frigo qui « tient 2 °C en été ». On lit une chambre froide à 43 °C.
   - Ce qu'il dirait : « Un frigo à 43 °C ? »
   - Bloquant (L14, valeur trompeuse ; n° 7). corr6-B l'a laissé « au lot C », et rien ne l'a corrigé.
   - Correction : un libellé « °C ambiant max » (classe climatique), ou retirer la colonne du tableau ouvert.
5. **30, 31, 50 : Embouteillage dans trois états qui se contredisent.**
   - Il est payé dans Réalisés (31 : « Payé 11 700 CHF »).
   - Sa fiche (50) dit à la fois « Réalisés · ZZ TEST — Embouteillage » et « Dans À venir depuis le 15 nov. ».
   - À venir (30) le range dans « Choisis, pas encore dans À venir ».
   - Ce qu'il dirait : « Il est payé, pourquoi il me dit pas encore dans À venir ? »
   - Bloquant : valeur fausse. La règle `estRealise` (R23, R47) doit gouverner les trois écrans.
6. **Preuve manquante.** 22 états ne sont pas joués, dont D-63, son scénario de zéro (frigo, ventilation, évier, CARNET-COEUR), et 56-57 (L1, l'idée du calendrier, R48). Quatre gestes sont incomplets :
   - 04 : « Déjà un carnet proche » ne se voit pas, la liste était vide ;
   - 28 : la feuille « Pourquoi ce choix » de g05-11 n'est pas ouverte, la capture montre le carnet ;
   - 50 : la feuille Archiver d'un plan réalisé n'est pas ouverte ;
   - 46 : le + volant n'est pas touché.
   - Bloquant pour une mise en ligne (R42, D-63). Voir DEMANDE EXECUTANT.

### Gênants
7. **10, bulle G8.**
   - Elle est tronquée (« Le critère « pas trop de bruit » peut … ») et cache le haut de la ligne « Ventilateur de plafond ».
   - Elle propose un critère déjà écrit dans la ligne Critère (n° 17). corr6-B dit `null` dans ce cas, mais la capture le montre encore.
   - Ce qu'il dirait : « Il me coupe sa phrase, et ce critère y est déjà. »
8. **13, aucune mise en forme.** La note reprend la phrase telle quelle, puis « votre phrase : « … » » la répète : elle est dite deux fois (n° 14).
   - g5:v03-8 reformule : « Un fût de 30 L couché entre dans le bac » et « articles rangés sur : fond de bac, 38 cm au moins », puis la phrase citée. **Retenu manquant** (R14, D-142 « met en forme »).
9. **16, lien collé sur une liste vide.**
   - Le carnet naît sous le titre « exemple.invalid » : le domaine sert de titre.
   - Le cadre n'a ni « ✻ lecture de la page… » ni le lien en clair de g5:v03-10 ; le lien n'est que dans le champ. **Retenu manquant**, en partie (R16).
10. **27, Compromis.** Il aligne des valeurs : « la 1re, tient 80 °C : oui ; le débit 1 800 m³/h ; 2 600 CHF ».
    - g01-8 dit le prix de l'écart. Ici, il faudrait : « la seule à tenir 80 °C, pour 2 180 CHF de plus ».
    - Ce qu'il dirait : « ça classe pas super super » (D-141).
11. **29, 38, 55 : le lien À venir dit deux fois.** La pastille « À venir · ZZ TEST — Frigo… » est suivie, deux lignes plus bas, de « Dans À venir depuis le 16 nov. » (n° 27).
12. **26, article ouvert.** Un grand picto remplace la photo de la page collée (h01-6), et le bas du picto est rogné (n° 20). Le banc n'a pas de photo, donc rien n'est prouvé.
13. **30, À venir.** La liste « Cette semaine et après » de h05-9 manque. Port partiel connu (§ Points ouverts 7), mais c'est un écart visible à sa maquette : **retenu manquant**.

### Mineurs
14. **07.** Le titre se coupe entre « 80 » et « °C ». Le titre reprend la phrase entière, donc le critère est écrit deux fois (titre et « Ce qui compte »).
15. **01 et 46, cartes Idée.** « ZZ TEST — Extracteur… » est coupé, sur trois lignes : le bouton « Coller un lien » mange la largeur. Dans g05-1, le nom tient sur une ligne.
16. **11.** La rangée « Va dans » est coupée à droite (« Fa »).
17. **18.** Le critère dit « Capter la buée au-dessus de la cuve », mais l'article lu dit « tient 80 °C : oui ». La caractéristique lue ne sert pas le critère affiché.
18. **40.** « Sachets de levure », tapé dans Évier inox, s'y range d'abord en note pendant que l'IA range.

### Doutes (non comptés)
- L'en-tête L'Affinée et le segment Stocks (Articles, Courses, Fûts, Matériel, Houblons) sont absents du banc : R29 n'est pas prouvé à 390. À voir dans l'app.
- Photo (44) et dictée (45) : aucun effet visible en headless.
- Clavier réel non simulé (39). Le + volant reste visible pendant la frappe (04, 11, 22, 34), alors que v08-3, v02-10 et v01-13 l'ôtent sous le clavier.
- 43 : après le hors-ligne, rien n'indique comment l'IA rangera au retour du réseau (n° 24).
- Comparer deux idées (D-142, R39) attend son choix (lots E et F) : ce n'est pas un défaut du port.

## Trois regards (R50)
- **Besoin du brasseur, 5/10.** Les figés et Comparer sont justes. Le chat ne met pas en forme (n° 1, 3, 8), et les chiffres sont faux (n° 2, 4, 5).
- **UX et UI, 7/10.** L'habit est fidèle en clair et en sombre, avec un geste par ajout. Défauts : coupures (n° 7, 14, 15, 16) et preuve à 390 incomplète.
- **Critique, 5/10.** Six bloquants. Les n° 3, 7, 11 et 12 de CRITIQUE-6 sont toujours présents.

## D-n → capture

| D-n | capture | état |
|---|---|---|
| D-96 liste | 01 | ✓ (n° 15) |
| D-97 vide | 02 | ✓ |
| D-99 ouvert | 09 | ✓ |
| D-101 cartes | 09, 18 | ✓ |
| D-102 article | 26 | picto (n° 12) |
| D-103, D-52 comparer | 27, 52 | ✓ ; compromis (n° 10) |
| D-104, D-20 choisir, pourquoi | 28b | Choisir ✓ ; relecture « Pourquoi ce choix » absente |
| D-105 À venir, Réalisés | 30, 31 | partiel (n° 5, 13) |
| D-130 créer avant | 03 | ✓ |
| D-131 créer pendant | 04 | carnet proche absent |
| D-132 créer après | 07, 08 | ✓ (n° 14) |
| D-133 ajouter avant | 10 | n° 7 |
| D-134 texte pendant | 11 | n° 3 |
| D-135 texte après | 13 | n° 3, 8 |
| D-136 lien avant | absent (15 non joué) | — |
| D-137 lien pendant | 16 | n° 9 |
| D-138 lien après | 18 | ✓ |
| D-139, D-140 vrac | 22, 23 | ✗ (n° 1, 2) |
| D-118 modifier une note | absent (32, 33) | — |
| D-119 renommer | 34 | ✓ |
| D-120 supprimer une note | absent (35) | — |
| D-121, D-47, D-47b | 36, 38b | ✓ ; Archiver absent (50) |
| D-54 clavier | 39 | simulé |
| D-46, D-76 pastilles | 55 | pastille ✓ ; aperçu (55b) absent ; n° 11 |
| D-28 veille | 18, 26 | éteinte ✓ ; allumée « demandée · pas encore relevée » absente |
| D-83 micro | 45 | présent ; effet texte |
| D-68, D-42 + volant | 46 | non joué |
| D-36 tâches | 54 | ✓ |
| D-63 scénario | absent | bloquant (n° 6) |
| D-40, D-72 calendrier | absent (56, 57) | — |
| D-122, D-129 l'IA aide | 22, 23, 13 | ✗ |
| D-142 fil cité sur place | 13, 18, 41 | ✓ ; comparer deux idées : lots E et F |
| D-65, D-80, D-85 habit | toutes | onglets ✓ ; en-tête absent du banc (doute) |
| D-38 lisibilité | 07, 10, 11, 01 | coupures (n° 7, 14 à 16) |

Refusés (MISSION, § Refusé) : la flèche « écrivez ou collez ici », les tuiles « quoi ? », le formulaire et les étapes sont absents des
captures vues. Aucun refusé ne revient.

## DEMANDE EXECUTANT
Prérequis (corr6-D) : aucun lot n'écrit dans `src` du worktree `port-carnet`, et `git status --short` est stable deux fois, à une minute d'écart.
```
cd /c/Users/mrspa/.codex/worktrees/openai-clean-start/port-carnet
# variables VITE_FIREBASE_* factices, comme dans corr6-D/RESULTAT.md, § DEMANDE EXECUTANT
npx vite --port 5431 --strictPort --force > $TMP/vite7b.log 2>&1 &
V=/c/Users/mrspa/.codex/worktrees/openai-clean-start/Brasserie/work/missions/2026-11-17-port-carnet/vision-7
node $V/captures.mjs 5431 e10 390 clair,sombre          # D-63 (48a, 48b, 48c)
node $V/captures.mjs 5431 <étapes des états 05,06,12,14,15,17,19,20,21,24,25,32,33,35,37,47,49,53,55b,56,57> 390 clair,sombre
```
Gestes à compléter à 390, en clair puis en sombre :
- 04 avec une liste non vide (« Déjà un carnet proche · Y ajouter en façon ») ;
- 28 : toucher « Pourquoi › » sur un carnet choisi (feuille « Pourquoi ce choix ») ;
- 50 : Supprimer l'idée sur Embouteillage, jusqu'à la carte « Archiver » ;
- 46 : toucher le + volant sur Carnets ;
- 38 : aller jusqu'à la carte à 1 lien (38b en sombre).

Sorties attendues : aucune ligne `PAGEERROR` ni `RECHARGEMENT-INVALIDE` ; pour chaque capture, une ligne « PAGE OK » ou le problème vu,
**image ouverte**. Les nouvelles captures reviennent ensuite au critique.

LEÇON PROPOSÉE : un banc qui tape la phrase attendue en sortie (11 : « les articles seront rangés sur… » saisi comme entrée) ne
prouve pas la mise en forme. La saisie d'un état « pendant » doit être une phrase de brasseur (« un fût de 30 L couché doit entrer
dans le bac »), jamais le texte qu'on attend à l'écran.
