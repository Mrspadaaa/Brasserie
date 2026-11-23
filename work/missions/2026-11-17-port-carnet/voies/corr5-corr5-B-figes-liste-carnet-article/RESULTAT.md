OK — figés h05-3, v04-4, v06-10, h01-6, i06-2 repris : 11 corrections sur 11 ; 1280 et sombre à capturer

# Lot corr5-B : figés liste, carnet ouvert, articles (18.11)

Travail fait dans le worktree `port-carnet` (branche `claude/port-carnet-1711`), sans commit. Je n'ai lancé aucun build (dist intact),
aucun appel Gemini, et je n'ai touché à aucune donnée réelle. Le banc tournait sous vite dev sur le port 5431, avec des
`VITE_FIREBASE_*` fictifs et les hôtes Google coupés. Le serveur a été arrêté après chaque série : 0 écoute sur 5431.

Avant de coder, j'ai ouvert les maquettes p2:h05-3, p2:i06-2, p2:h01-6, g5:v04-4, g5:v06-10 et g5:v04-1, ainsi que les captures
vision-5 m390-09, m390-26 et d1280-15.

## Fichiers écrits

- `src/ui/carnets/CarnetOuvert.tsx`, `ListeCarnets.tsx`, `FicheArticle.tsx`, `CarteArticle.tsx`, `pictos.tsx`, `carnets.css`
  (tout est ajouté en fin de fichier, bloc « Correction 5, lot B »).
- `tests/unit/carnetsCritique5Figes.test.tsx` : fichier neuf, 25 tests.
- Dans `voies/corr5-corr5-B-figes-liste-carnet-article/` : `captures.mjs` et `cap/` (7 captures à 390 clair, plus les journaux).
- Je n'ai touché ni `Photos.tsx` ni `photo.ts`.

## Problème → fait → preuve

| Brief | Problème (CRITIQUE-5) | Fait | Preuve |
|---|---|---|---|
| (1) | n° 1, 19, 20, 22 : le carnet ouvert n'est pas h05-3 | Sous le titre, la ligne d'état « 2 façons à comparer · attendre l'avis du ferblantier » (la note « à faire » telle qu'il l'a écrite). Ensuite **une** ligne, section « Ce qui compte » : « ◎ Critère : **tient 80 °C**, puis **le débit** · proposé par l'IA · +1 sans valeur ». Elle nomme ce qui range, dans l'ordre de Comparer. « de votre phrase » est réservé à l'origine `vous` (ou `phrase`). Son critère sans valeur est rangé derrière « +1 sans valeur », qu'un toucher déplie. Le tableau monte juste dessous ; la phrase citée passe sous le tableau. La conclusion « Le critère sépare… · Retenir la hotte » est insérée dans le tableau, juste après les façons en lice, avant l'écartée et le lien à relire. La pastille « À comparer » disparaît quand la ligne d'état le dit déjà | Tests 1 (3 tests). Mesure 09 à 390 : ligne 1 du tableau en bas à 566 px, champ à 733 px, donc visible sans défiler ; `apresSep` = bloc écarté. Capture `cap/09-390-clair.png`, ouverte |
| (2) | n° 2 : créer · après, blocs empilés | La rubrique « Ce qui compte » est à filet comme les autres : « · rien encore : l'IA le proposera », ou « · 150 kg/h · de votre phrase ». Elle n'est jamais un encadré. Le bandeau reste le seul, rendu par le lot D via `bandeau`. J'ai gardé l'en-tête beige « Idée · 18 nov. / Ensuite : … » de v04-4 (voir les doutes) | Tests 2 (2 tests). Capture `cap/06-390-clair.png`, ouverte : en-tête, un seul bandeau, 5 rubriques à filet, comme v04-4 |
| (3) | n° 24 : « Ensuite : l'IA cherche les façons » s'affiche alors que l'IA a échoué | Nouvelle prop `iaIndisponible?: 'echec' \| 'hors-ligne' \| 'eteinte' \| null`. Quand elle est posée, plus aucune promesse de l'IA : on lit « Ensuite : collez un lien », « rien encore », « aucune » | Tests 3 (4 tests). Capture `cap/19-390-clair.png`, ouverte (`&ia=echec`, BIEN-ABSENT pour les 3 textes). **Le lot D doit encore passer la prop**, voir plus bas |
| (4) | n° 6 : la carte d'article est muette | Variante complète : sans `luSurPage` ni `verdict` du geste, ils se lisent sur l'article lui-même (`luDeLArticle`, `verdictDe`). La carte de liste affiche aussi les valeurs lues avec leur unité. Quand le carnet n'a qu'un seul article lu, il s'affiche en carte complète (v06-10) | Tests 4 (3 tests). Capture `cap/15-390-clair.png`, ouverte : « 25 L/min · 100 °C », « lu sur la page : nom, prix, débit, température max, tient 80 °C » |
| (5) | n° 8, 28, 36, 37 : l'article ouvert n'est pas h01-6 | Le cadre photo est toujours là : la photo de la page, sinon l'objet dessiné à 132 px. La grille « Caractéristiques » montre d'abord les valeurs de l'article, chacune avec son rang quand elle classe. Viennent ensuite les colonnes du carnet non publiées (« non publié »), puis la disponibilité et l'origine, sans rien inventer. La réglette est bornée des deux côtés : « 1 800 la plus haute des 4 » à gauche, « 1 100 » à droite. La place propre se lit sous la valeur (« 3e sur 4 · le débit »). Les prix passent par `prixTexte`, en chiffres mono : « 1 450 CHF » | Tests 5 (5 tests). Capture `cap/26-390-clair.png`, ouverte : hotte dessinée en grand, réglette à deux bornes, « 1 450 CHF ». Journal : BIEN-ABSENT « 1450 » |
| (6) | n° 29, 30 : traits fins, cube générique | `pictos.tsx` réécrit avec 21 objets dessinés en surfaces pleines (métal, moteur bleu, bouteilles brunes, vert de zone) : hotte, extracteur, centrifuge, évier, tireuse, frigo, pompe, moulin, remplisseuse, fût, cuve, densimètre, thermomètre, balance, tuyau, chauffe-eau, filtre, échangeur, bouteille de gaz, étagère, diable. Les teintes passent par des variables CSS, une jeu par thème (`[data-theme='cave']`), sans rouge. Un objet sans dessin reçoit **son initiale**, jamais le cube. Vignette par défaut : 40 px | Tests 6 (3 tests : 20 objets, 20 dessins distincts ; surfaces pleines à 40 px ; initiale « G » sans `path`). Captures 01b, 02, 09 et 26, ouvertes |
| (7) | n° 11 : la liste vide n'est pas i06-2 | Elle reprend i06-2 : « Carnets », la phrase, la carte exemple en pointillé (évier dessiné, « Évier inox, 2 bacs », `exemple`, « votre premier carnet », « ↓ arrive ici »), « Par exemple : » suivi des puces G1 touchables, « Une note en vrac marche aussi. ». **La bulle verte vers le champ venait de `ListeCarnets.tsx`, mon fichier : elle est retirée.** Il n'y a aucune flèche | Test 7. Capture `cap/02-390-clair.png`, ouverte. Journal : BIEN-ABSENT « Écrivez », « s'affichera ici » |
| (8) | n° 32 : deux lignes identiques en veille | `offresEnVeille` regroupe par nom normalisé dans un même carnet. On lit « Isobarique 4 becs pré-évacuation / 2 offres · 11 200 à 11 700 CHF / dans ZZ TEST — Embouteillage » (`prixOffres`) | Test 8. Capture `cap/01b-390-clair.png`, ouverte |
| (9) | n° 30 : le carnet né flotte hors de son groupe | Le carnet tout juste créé se range en tête de son groupe (une idée va dans « Idée »), et ce groupe passe en tête de la liste. La section « Carnet créé » est supprimée | Test 9 (le picto d'un « Tuyau silicone » est `tuyau`, plus le cube) |
| (10) | n° 23 : « moins bien partout » | `texteMoinsBien` = `moinsBienQueDe` (le rang que Comparer calcule, à partir du `moinsBienQue` du lot A), mis en mots par `texteMoinsBienQue` (comparer.ts) : « moins bien que la 3e sur tout » | Test 10 : identique à Comparer ligne par ligne ; jamais « moins bien partout » |
| (11) | n° 40 : le titre change d'un écran à l'autre | Le titre stocké s'affiche tel quel, « ZZ TEST — » compris : carnet ouvert, liste, En veille (« dans ZZ TEST — … »). Le `.replace(/^ZZ TEST — /)` de la ligne En veille est retiré | Test 9 (2e). **Pour le lot C et le lot D** : `CarnetsVue` passe encore `titreSansBanc(...)` à FicheArticle, Comparer et Choisir. Il faut passer le titre stocké pour que tout se rende pareil |

## Critères

- `npx vitest run tests/unit/carnetsCritique5Figes.test.tsx` : **25 sur 25 verts**.
- `npx tsc --noEmit -p .` : **0 erreur**, tout le projet.
- `npx vitest run tests/unit/carnets tests/unit/port-q` : 28 échecs sur 611 au dernier passage. Les lots A à D travaillent en même
  temps, ce qui les explique en partie :
  - **Les miens, voulus, dans des tests que je ne possède pas** (les figés remplacés par la critique 5) :
    - `carnetsCritique4Figes` P2 ×2 et `carnetsEcrans` R02 attendent la bulle et « s'affichera ici » (i02-2) ; or le brief et D-108
      demandent i06-2 sans bulle.
    - `carnetsEcrans` R03 et P11 ×2 attendent « Ce qui compte, proposé par l'IA : » et « tiré de votre phrase » ; h05-3 dit
      « Critère : … · proposé par l'IA ».
    - Ces 6 assertions sont à réécrire par le possesseur de ces tests, ou par le pilote.
  - **Ceux des autres lots** :
    - `carnetsEcrans` R06 (« moins bien partout » dans Comparer, lot C), C6 et P13 (champ et bulle G8, lot D) ;
    - `carnetsComparer`, `carnetsCritique4Donnees`, `carnetsIA` et `carnetsRangement` (lots A et B, en cours) ;
    - `carnetsCritique5Fil` (lot D).
  - Ces 22 échecs ne passent pas par mes fichiers.
- `git status --short` : mes fichiers modifiés sont les 6 listés plus haut, et le test neuf n'est pas encore suivi. Les autres
  `M` viennent des lots A, C et D.

Essais :
- pictos : 1 ;
- test « grille » : 3, dont un raté par un `\s` que le heredoc Bash avait mangé, corrigé avec Edit ;
- banc : 4, à cause du rechargement de vite au premier passage (second essai ajouté dans `captures.mjs`) et du bouton d'envoi trouvé
  par `type=submit` ;
- veille 390 : 2 (nom écrasé sur 3 lignes, puis mis sur 3 lignes courtes).

## Doutes et limites

- **Encadré « Idée » en créer · après.** Le brief dit « plus d'encadré Idée en bloc », mais g5:v04-4 le montre en tête : beige,
  « Idée · 17 nov. / Ensuite : … ». La règle n° 1 passe d'abord : je l'ai gardé, et j'ai retiré l'encadré vert « Ce qui compte »,
  qui est le 3e bloc de la critique. S'il faut l'enlever aussi, le changement tient en une ligne.
- **La grille à 4 cases** n'atteint 4 qu'avec des données qui le permettent. Sur la fixture Ventilation, la hotte murale en montre
  3 (tient 80 °C, disponibilité, origine) : rien n'est inventé. Le test le prouve sur une variante à 4 valeurs. Le rang ne se dit que
  sur une caractéristique de critère (sens plus ou moins) : une valeur lue sans sens ne se classe pas, comme dans `placesDe`.
- **À 390, « Comparer côte à côte › » occupe sa propre ligne.** Ce retour à la ligne vient de la règle P10 de la correction 1, que
  j'ai gardée. La 1re ligne du tableau reste visible (566 px pour 733 px).
- **15 (lien · après)** : l'article de la pompe a été créé depuis la liste par le lot D. Le carnet affiche encore « À comparer » avec
  1 article. Ce statut vient d'eux.
- Les captures en 1280 et en sombre ne sont pas faites (DEMANDE EXECUTANT).

## Pour le lot D (CarnetsVue)

1. Passer `iaIndisponible={…}` à `CarnetOuvert` (`'echec' | 'hors-ligne' | 'eteinte' | null`).
2. Passer le titre stocké (`ouvert.title`) à FicheArticle, Comparer et Choisir, à la place de `titreSansBanc(...)` (n° 40, à voir
   avec le lot C).
3. La bulle de la liste vide venait de `ListeCarnets.tsx`, et elle est retirée. Si une flèche vers le champ paraît encore, elle vient
   de `CarnetsVue` ou de `ChampCarnet`, qui ne sont pas à moi.

## DEMANDE EXECUTANT

Depuis `C:/Users/mrspa/.codex/worktrees/openai-clean-start/port-carnet` :
1. `VITE_FIREBASE_PROJECT_ID=demo-banc-carnet VITE_FIREBASE_API_KEY=banc-sans-cle VITE_FIREBASE_AUTH_DOMAIN=demo-banc-carnet.firebaseapp.com VITE_FIREBASE_APP_ID=1:1:web:banc npx vite --port 5431 --strictPort &`
2. Préchauffage : `node ../Brasserie/work/missions/2026-11-17-port-carnet/voies/corr5-corr5-B-figes-liste-carnet-article/captures.mjs 5431 02 390 clair` (le résultat est ignoré).
3. `node ../Brasserie/work/missions/2026-11-17-port-carnet/voies/corr5-corr5-B-figes-liste-carnet-article/captures.mjs 5431 02,01b,06,09,09plein,15,26,19 390,1280 clair,sombre`
4. Arrêter vite : `netstat -ano | grep ":5431 " | grep LISTENING` puis `taskkill //PID <pid> //F //T`. On attend 0 écoute.

Résultat attendu :
- 32 captures dans `cap/` (`<état>-<390|1280>-<clair|sombre>.png`) ;
- un journal `cap/journal-02,01b,06,09,09plein,15,26,19-390_1280.txt`, avec :
  - aucun `ABSENT`, aucun `PRESENT-A-TORT`, aucune `pageerror` ;
  - pour `mesure [09]`, `"visible":true` à 390.

À ouvrir en image, et à renvoyer avec une ligne par capture (« combien et quels problèmes ? ») :
- `02-1280-clair` (i06-2, sans flèche) ;
- `09-1280-clair` et `09-390-sombre` (ligne d'état, une ligne Critère, conclusion collée) ;
- `06-1280-clair` (un bandeau, rubriques à filet) ;
- `15-1280-clair` (caractéristiques et « lu sur la page » à 1280) ;
- `26-1280-sombre` (picto en grand en sombre, réglette, « 1 450 CHF ») ;
- `19-1280-clair` (sans « Ensuite : l'IA ») ;
- `01b-390-sombre` (pictos en sombre).

CONNAISSANCE : un picto d'objet lisible à 40 px se dessine en surfaces pleines (métal, moteur, verre) teintées par des variables
CSS propres à chaque thème. Un objet sans dessin prend son initiale : jamais un cube générique, qui ferait croire qu'on le montre.

LEÇON PROPOSÉE : un `node -` en heredoc Bash mange les `\s` des regex d'un fichier de test, sans aucune erreur (L26). Une regex
s'écrit avec Edit, même dans un test.
