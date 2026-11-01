OK — baseline visuelle : 28 références des 7 écrans choisis, diff de pixels dans Chrome, 0 px d'écart sur deux rejeux

## Fichiers écrits
- `scripts/agents/baseline-visuelle.mjs` (le contrôle ; `node --check` vert) et `scripts/agents/baseline-cas.json` (écrans, états, gestes, tolérances).
- `work/refonte-frontend/v4/choix/baselines/<ecran>/<etat>.png` (28 images, 4,7 Mo) et `MANIFESTE.json` (commit ae7c7a8d, date, viewport 390 × 844 à ×2, tolérances, empreinte et masques de chaque état).
- `work/refonte-frontend/v4/choix/baselines/_temoins/ma-biere-repos-decalage-8px.diff.png` (le diff du témoin négatif, gardé pour être ouvert).
- Rien dans `src/`, aucun fichier suivi modifié, aucun commit. Dans la copie `atelier-ecrans` : un seul ajout, `src/data/seedData.ts` (ignoré par git) copié depuis `seedData.example.ts`, sans donnée réelle (voir doutes). `git status` de la copie : propre.

## Mode d'emploi
Depuis la racine de l'arbre principal. Le serveur tourne dans la copie, jamais ici (Firebase factice : l'app refuse de démarrer sans `VITE_FIREBASE_*`).
```
node scripts/with_server.mjs --server "cd C:/Users/mrspa/AppData/Local/Temp/atelier-ecrans && npm run dev -- --port 5601 --strictPort" --port 5601 \
  --env VITE_HOP_V4=on --env VITE_FIREBASE_API_KEY=fake-e1 --env VITE_FIREBASE_PROJECT_ID=demo-e1 --env VITE_FIREBASE_APP_ID=1:1:web:e1 \
  --env VITE_FIREBASE_AUTH_DOMAIN=demo-e1.local --env VITE_FIREBASE_STORAGE_BUCKET=demo-e1.local --env VITE_FIREBASE_MESSAGING_SENDER_ID=1 \
  -- node scripts/agents/baseline-visuelle.mjs --comparer
```
- `--prendre` : refait les références (complet : repart de zéro et retire les images orphelines ; avec `--cas=` : partiel). Refuse si la copie a des fichiers suivis modifiés (`--forcer`).
- `--comparer` : recapture chaque état dans un Chrome neuf, compare dans un canvas (aucune dépendance), écrit `baselines/_ecarts/<ecran>/<etat>.{actuel,diff}.png` pour chaque échec. Sortie `BASELINE OK` ou `BASELINE ECHEC n` (code 1). Un écart se signale, puis se REGARDE (L12).
- `--lister`, `--cas=ecran[/etat],…`, `--url=` (serveur déjà lancé), `--tol-pixel`, `--tol-image`, `--tol-bloc`, masques par sélecteur (`masques` dans le fichier de cas : aplat gris posé avant la capture, à la prise comme à la comparaison).
- Tolérances : pixel = 12/255 d'écart de canal ; image = 0,05 % de pixels qui diffèrent ; bloc = 25 % d'un carré de 16 px CSS (attrape un petit défaut local que la part d'image laisserait passer).
- Témoin négatif : `--decaler="<sélecteur>"` (ou `--css=`) injecte une CSS (`top: 8px`) dans la page, uniquement en comparaison.
- Un état nouveau : l'ajouter dans `baseline-cas.json` (gestes : cliquer, toucher, attendre, pause, ouvrir, fermer, aller, preparer, appui-long, defiler, saisir), puis `--prendre --cas=ecran/etat`, ouvrir l'image.

## Ligne proposée pour `docs/agents/systeme.md` (§ contrôles, non écrite)
`| node scripts/agents/baseline-visuelle.mjs --prendre|--comparer [--cas=écran/état] | références visuelles des 7 écrans choisis (28 états, 390 × 844), diff de pixels dans Chrome ; serveur dans la copie de production par scripts/with_server.mjs (commande dans work/missions/2026-10-31-systeme-ecrans/voies/e1-baselines/RESULTAT.md) ; BASELINE OK / ECHEC, l'image de diff s'ouvre (L12) |`

## Critères
1. `--prendre` puis `--comparer`, même copie, deux fois pour la stabilité (polices, animations, calculs asynchrones de Suggérer) :
   - prise complète (28 états), comparaison A : `BASELINE OK (28 état(s) ; écart le plus grand 0.0000 %, tolérance 0.0500 %)` ;
   - comparaison B : `BASELINE OK (28 état(s) ; écart le plus grand 0.0000 %, …)` ;
   - une comparaison antérieure sur la prise précédente (27 états) : `BASELINE OK`, 0 px aussi ; chaque état : 0 px, « bruit sous tolérance » 0 px, écart max 0/255. Les tailles d'octets des PNG de deux prises sont identiques, état par état. Le rendu est exact au pixel sur ce poste (polices de repli du système, animations coupées par CSS, réseau hors localhost bloqué).
   - Même résultat avec un serveur neuf (port 5602, lancé par `with_server`) : `BASELINE OK`, 0 px sur deux états.
2. Témoin négatif (CSS injectée, aucun fichier modifié, copie propre après) :
   - `--cas=ma-biere/repos,etape-houblons/repos --decaler="[data-famille-ligne='tropical']"` : `ECHEC ma-biere/repos : 14572 px (1,1068 %), 27 bloc(s) hors tolérance ; zone 363×26 CSS en (15, 449)`, `BASELINE ECHEC 1`, code 1 ; `etape-houblons/repos` reste OK (pas de ligne « tropical » : le témoin est sélectif). Diff ouvert : la ligne Tropicaux est doublée en rouge, 8 px plus bas, encadrée en bleu, blocs en magenta (`_temoins/ma-biere-repos-decalage-8px.diff.png`).
   - Deuxième témoin, petit : le picto Tropicaux seul décalé de 8 px (`"[data-famille-ligne='tropical'] svg"`) : 539 px, 0,0409 %, SOUS la tolérance d'image, mais `1 bloc(s) hors tolérance` → `BASELINE ECHEC 1`. C'est le critère de bloc qui l'attrape.
3. Références ouvertes une à une (image ouverte, regardée) :
   - etape-houblons/repos : étape Houblons, Nugget 46 g à 60′ replié, WGV proposée, barres Au style, « Ouvrir l'analyse », Retour / Suivant ; le + flottant recouvre le bord de « Suivant — Levure » (existant en production).
   - etape-houblons/liste-vide : aucun houblon, « 0 au style · 12 non situées », barres hachurées.
   - etape-houblons/legende-ouverte : carte de Nugget ouverte, légende en lignes (leg3-v2a), mots, linalol, huiles, légende des puces.
   - etape-houblons/absolu : bascule Absolu, barres triées autrement, melon hachuré.
   - ma-biere/repos : onglets Ma bière / Suggestions / Comparer, IBU 60 · OG 1,066 · EBC 70, 12 barres au style, « + viser une famille ».
   - ma-biere/bas : défilé en bas, « + viser une famille » et « Prévu avec SafAle US-05, caractérisée ».
   - ma-biere/famille-ouverte : Tropicaux touchée, « bannir · − · sans visée · + ».
   - ma-biere/visee-posee : « + » posé, losange et trait sur la piste, « faible », « × ».
   - ma-biere/bannie : Tropicaux barrée, « bannie ».
   - ma-biere/radar-notes : vue Radar, notes posées (agrumes moyen, tropicaux marqué, noyau faible, floral pas senti), grille de dégustation.
   - ma-biere/radar : vue Radar sans note, zone du style et « ? » aux bords.
   - ma-biere/absolu : « faible · moyen · marqué » en tête.
   - suggerer/sans-visee : « Aucune visée… », « Comparer (0) » grisé (écran vide dessous).
   - suggerer/visee-tropicaux : « Plus tropicaux », voies Nugget, Columbus, Motueka, Sabro, « Changer de levure ».
   - suggerer/bannie-tropicaux : « Sans tropicaux · Atteint », « Remplacer Nugget » (Hallertau Mittelfrüh, Willamette, East Kent Goldings, Hallertau Tradition).
   - comparer/repos : radar Au style de Cascade, Idaho 7, Galaxy contre ta bière, mots, tableau 60′ / 10′ / WP / actif / après.
   - comparer/absolu : radar Absolu à l'échelle brute (voir doutes : anneau de ronds noirs au centre).
   - comparer/bas : les mots de chaque houblon, « De Saaz à Idaho 7 », « Placer Idaho 7 ».
   - fiche/repos : fiche g1 de Nugget (appui long), radar, phrase noire « Lui seul », début du tableau ; sans infobulle de survol.
   - fiche/bas : la liste sous le radar (ananas, boisé, zeste de pamplemousse…), pied Comparer / Styles / Huiles / Sources / Substituts.
   - dryhopper/repos : « Quand ajouter Cascade ? », après · 3 j, courbes, trois mini graphes, rail, 12 barres.
   - dryhopper/absolu : même écran en Absolu, barres à l'échelle brute.
   - dryhopper/jour-1 : contact à 1 j, ligne « contre ★ : agrumes ~+0 · tropicaux ~−1 ».
   - dryhopper/ebullition : moment « ébullition », IBU ~79, « trop amer », rail au début.
   - dryhopper/froid-limite : cellule « limite » ouverte, « Près de la limite · bière 21C ».
   - substituer/repos : Galaxy à 10′, Harlequin 69, Mosaic 63…, « Face à face, même IBU ».
   - substituer/dry-hop : « Au dry hop, l'arôme fait le score », Harlequin 65, tableau « Galaxy seul ».
   - substituer/deux-compares : dry hop, deux remplaçants, radar avec contour de l'original (D156), « sans donnée », bandes α.
4. Mode d'emploi : ci-dessus. Ligne pour `docs/agents/systeme.md` : ci-dessus, non écrite.

## Écrans couverts (registre `ecrans.json`, statut « choisi »)
etape-houblons (4 états), ma-biere (8), suggerer (3), comparer (3), fiche (2), dryhopper (5), substituer (3) = 28. `levure` est « ouvert » : exclu (D123).

## Essais utilisés
Aucun critère n'a dépassé un essai. Trois reprises de mise au point, avant les critères : (1) la copie n'avait pas `src/data/seedData.ts` (ignoré par git) ; (2) l'app exige `VITE_FIREBASE_*` : valeurs factices ; (3) l'infobulle de survol dans fiche/repos (pointeur resté sur le radar) : le geste d'appui long ramène maintenant le pointeur en (1, 1), références reprises.

## Doutes et limites
- Les références sont celles de la copie au commit ae7c7a8d avec `seedData.example.ts` (société d'exemple) et Firebase factice. L'app est en `?dev-local` : fixture Stout 16D, Nugget 46 g à 60′. Rien de réel, aucun Gemini, aucun réseau hors localhost.
- Les polices externes (Google Fonts) sont coupées : le texte est rendu avec les polices de repli du poste. Les références valent pour CE poste ; sur un autre, relancer `--prendre`. Deux Chrome du même poste : 0 px d'écart. La tolérance (0,05 %) est très large par rapport au bruit mesuré (0) : on pourrait la serrer, je l'ai gardée pour un autre Chrome ou une autre version de police.
- Les animations et transitions sont coupées par une CSS injectée (`animation:none`) : un défaut d'animation n'est pas vu.
- Capture du viewport (390 × 844), pas de la page entière : les écrans longs ont un état « bas » (ma-biere, comparer, fiche). Suggérer n'a pas d'état « bas » (le défilement n'ajoutait rien de stable).
- Suggérer dépend du calcul asynchrone : pauses de 3 à 3,5 s ; stable sur 3 rejeux. Une machine plus lente pourrait capturer trop tôt : l'échec le dirait (taille ou diff), pas un faux vert.
- Le Suggérer du banc `ecran-bannir.mjs` (recette neipa v3 de Lotus, enveloppe du moteur) n'est pas repris : trop lié à la fixture de m9. Le bannir est joué par le geste du brasseur (Ma bière → bannir → onglet Suggestions) ; il montre bien les groupes « Sans … / Remplacer Nugget » de D194.
- Observations de la production, hors voie (à regarder) : (a) comparer/absolu montre un anneau de petits ronds noirs au centre du radar ; (b) le + flottant recouvre « Suivant — Levure » sur l'étape Houblons ; (c) suggerer/sans-visee : 1 000 px de blanc sous « Comparer (0) ».
- Git : `/work/refonte-frontend/**` est ignoré (`.gitignore` ligne 58) : le dossier `baselines/` et son MANIFESTE ne sont pas suivis tant qu'une exception n'est pas ajoutée.

DÉCISION À PRENDRE : versionner les références ? Options : (1) ajouter dans `.gitignore` `!/work/refonte-frontend/v4/choix/baselines/` et ses sous-dossiers (4,7 Mo de PNG, hors `_ecarts/`, à ignorer) ; (2) les garder locales, régénérées par `--prendre` sur la copie de production. Recommandation : 1, car la valeur d'une référence est d'être la même pour tous, et le MANIFESTE note le commit.
DÉCISION À PRENDRE : quand rejouer `--comparer` ? Recommandation : sur la copie de PRODUCTION (ae7c7a8d) à chaque refonte d'un écran choisi, avant de commiter : les références décrivent la production, donc un écart est attendu pour l'écran qu'on refait et doit être regardé ; ailleurs il doit être nul. Une fois un écran refait et accepté par le brasseur, `--prendre --cas=<écran>` pour le nouvel état.

CONNAISSANCE : le rendu de l'app dans Chrome sur ce poste est exact au pixel d'un lancement à l'autre (polices de repli, animations coupées, 0 px de bruit sur 28 états × 3 passes) : une comparaison à seuil serré est donc possible ; l'app exige `VITE_FIREBASE_*` (valeurs factices suffisent) et `src/data/seedData.ts` (ignoré par git) pour démarrer dans une copie propre.
LEÇON PROPOSÉE : aucune
