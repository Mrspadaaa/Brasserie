ECHEC — rejeu non joué : port-carnet bouge (garde refusée) ; outillage vision-3 corrigé, DEMANDE EXECUTANT

Lot corr2-L4-vision-3-rejeu. La consigne le demande : un lot mécanique, joué par Haiku après la fusion des lots 1 à 3. Le rejeu n'a pas
eu lieu. Au moment du travail, `git -C port-carnet status --short` changeait d'une minute à l'autre : 10 fichiers du carnet et du calendrier
étaient modifiés par les lots 1 à 3. La garde de `lancer.sh` l'a vu et a refusé la passe (`ECHEC GARDE : port-carnet bouge`). J'ai
préparé et éprouvé l'outillage par deux essais forcés (`SANS_GARDE=1`) sur 390 clair. Le banc y a rechargé 31 et 35 fois (HMR) : ces
essais ne valent pas vision-3. Je n'ai pas écrit `vision-3/RAPPORT.md`, parce qu'un rapport sur du code qui bouge serait un faux vert (L11).

## Fichiers écrits
Dans `work/missions/2026-11-17-port-carnet/vision-3/`. Rien n'est écrit dans port-carnet, aucun build n'est lancé, dist n'est pas touché.
- `lancer.sh` : banc sur le port 60415, dev-local sur 60416, émulateur `demo-carnet-vision` lancé avec `--config emu/firebase.json`.
  - **Garde** : il compare `git status` à 60 s d'écart et sort en code 2 si les deux diffèrent. Pour un essai seulement : `SANS_GARDE=1`.
  - Il écrit `HMR <passe> : n`, le nombre cumulé de rechargements de vite, à 0 attendu. Il écrit aussi `PORTS OUVERTS (6041x, 8080) : n`.
  - Il refuse la passe dev-local si le port 8080 est déjà tenu par un autre lot : il ne le tue pas.
- `outils.cjs` : il compte à part `consoleError` et `pageerror`, et `echecsAction` inclut les ECHEC PASSAGE. Fonctions ajoutées :
  - `attendreTexte` : attend qu'un texte paraisse ou disparaisse ;
  - `titreOuvert` : lit `h2.cn-titre` ;
  - `ouvrirCarnetVerifie` : ouvre un carnet, puis lit son titre, et échoue si ce n'est pas le bon ;
  - `menuPlus` : touche le bouton `button.cn-ico[aria-label="Plus"]`, mais seulement après avoir lu le titre attendu.
- `rejeu-banc.cjs` : états 1 à 55 du banc, avec en plus 12c (la fusion), 19 et 19a, 26a, 27b (tableau défilé au bout) et 50b.
  - Liens : les pages simulées `exemple.invalid` (`PAGES_BANC`). Les liens `exemple.test` de vision-2 n'étaient jamais lus, d'où ni squelette ni carte.
  - Les points à lire mot pour mot sont écrits au journal, sous la forme `présent : oui/NON`.
- `rejeu-devlocal.cjs` : la semaine ISO est calculée au jour du rejeu (S47 le 18.11). Autres changements :
  - 57b vise l'ampoule `.ent-bd-c[data-semaine=S] .ent-ic` ;
  - pour 49, le carnet est vérifié par son titre et le menu trouvé par « Plus » ;
  - 46 relève toutes les entrées du + volant ;
  - 56c cherche le double point.
- `emu/firebase.json`, `emu/ouvert.rules` : copies de vision-2 (règles ouvertes, émulateur seul, jamais déployées).
- `essai-auteur/` : les 124 sorties de mes deux essais. Ce n'est pas vision-3 : le code bougeait pendant ces essais.

## Problème → fait → preuve (essai 2, 390 clair, code en mouvement : à confirmer au rejeu)
1. m390-3 (16 et 18) → `&ia=lent`. La capture 16 attend « ✻ lecture de la page… », la 18 attend son départ, puis remet la carte au centre.
   Preuve : `essai-auteur/m390-clair-16-lien-pendant.png` est **ouverte** (cadre « Arrive ici, dans Articles », squelette, « ✻ lecture
   de la page… »). Journal 18 : « lecture finie (texte parti à 7183 ms) ; carte complète « Hotte inox 140 cm » présente : oui ».
   La 18 ouverte montrait la carte hors du cadre : c'est pourquoi le centrage a été ajouté après l'essai, et il n'a pas encore été rejoué.
2. m390-4a (27) → le geste touche `button.cn-comparer-lien`. Preuve : `essai-auteur/m390-clair-27-comparer-critere.png` est **ouverte**.
   On y voit la vue Comparer, « rangé par : tient 80 °C d'abord, puis le débit », et une colonne « écarté ». La capture montre aussi deux
   défauts : la colonne « écarté » est coupée à droite (« Ventilateur de plafond 130 cm » tronqué, sous un fondu), et la 1re colonne est
   coupée à gauche. Mon ancienne mesure faisait défiler le tableau avant la capture. Elle ne le fait plus : 27 montre le tableau à
   l'ouverture et écrit au journal de combien il déborde, puis 27b le montre défilé au bout.
3. m390-5 (26 et 26b) → la fiche ouverte est celle de ZZ-V-A2, « Hotte murale 100 cm ». Preuve : `essai-auteur/m390-clair-26b-article-a2-veille-rallumee.png`
   est **ouverte** : « Veille du prix, tous les 3 jours », bascule allumée, « demandée · pas encore relevée », aucune date. Le journal 26a
   dit « aria-checked=false ; aucune ligne d'état ».
4. d1280-6 (35 à 38) → chaque geste de menu passe par `menuPlus`, après lecture du titre. Journal 38 : « titre lu avant le geste :
   « ZZ TEST — Frigo de garde pour fûts » ; « 1 lien le retient » présent : oui ». La capture 38 n'est pas ouverte, et 1280 n'a pas été joué.
5. L4-1 (puce Coller) → journal 15 : « presse-papiers accordé, il tient « https://exemple.invalid/plaque-froid/echangeur-30 » ; puce
   « Coller : … » présente : oui ». La capture 15 n'est pas ouverte.
6. L4-P14 (G9, « 38 cm au moins ») → `essai-auteur/m390-clair-11-texte-pendant-g9.png` est **ouverte** : « les articles seront rangés
   sur le fond de bac, 38 cm au moins », les puces « Va dans », le ✕. Seul 390 clair est vu.
7. L4-2 (57b) → `essai-auteur/m390-clair-devlocal-57b-icone-touchee.png` est **ouverte**. Le toucher sur l'ampoule de S47 ouvre le carnet
   « ZZ TEST — idée du calendrier S47 », sans infobulle.
8. États non joués (12, 14, 17, 20, 24, 29, 32 à 34, 38 à 40, 44, 45, 47 à 50, 52, 53, 55 à 57) : chacun a un geste dans les scripts.
   Non prouvé tant que le rejeu n'a pas eu lieu.
9. L4-P18 (captures non ouvertes), puis la preuve des lots 1 à 3 : rien n'est fait. Cela attend le rejeu des 8 passes et `RAPPORT.md`.

Bilan : 4 défauts du banc corrigés dans l'outillage et vus sur une capture ouverte ou au journal (m390-3, m390-4a, m390-5, d1280-6).
Trois problèmes sont vus à l'essai (L4-1, L4-P14, L4-2). Les deux derniers (états non joués, L4-P18 avec la preuve des lots 1 à 3)
attendent le rejeu.

## Sorties décisives
- `node --check` vert sur les trois `.cjs` ; `bash -n lancer.sh` vert. Regex éprouvées : `/✻ lecture de la page/` et `/(\d+)\s+carnets?\b/` (rend 2).
- Garde : `ECHEC GARDE : port-carnet bouge (git status différent à 60 s) ; rejeu refusé`.
- Essai 2, banc : `{"captures":82,"erreurs":13,"echecsAction":11,"consoleError":0,"pageerror":2,"coupes":0}`, puis `HMR … : 31`.
  Les deux `pageerror` disent `BARRE_SUR_DEFILEMENT is not defined` : un état intermédiaire d'un autre lot.
- Essai 2, dev-local : `{"semaine":47,"captures":34,"erreurs":4,"echecsAction":4,"consoleError":0,"pageerror":0,"coupes":0}`, `HMR : 0`,
  puis 99 « 0 restant(s) ». Fin du lancer : `PORTS OUVERTS (6041x, 8080) : 0`. Plus tard, 8080 était tenu par le pid 16916, qui n'est pas
  à moi et que je n'ai pas touché.
- Constats de l'essai, à confirmer au rejeu (code non fusionné) :
  - 12, doublon non proposé (« elles seront fusionnées » : NON) ;
  - 19 et 52b, aucun tableau après deux liens dans Évier ;
  - 20, « Rangé dans » : NON ;
  - 36b, « Déplacer » : NON ;
  - 34, G29 « proposé d'après » : NON ;
  - dev-local 47, « À venir 2 » sur un émulateur vide (L4-6) ;
  - dev-local 30, « Choisir » absent, car les liens `exemple.test` y restent sans aperçu ; 30 se juge au banc.

## Essais
Par critère : garde 1. Banc 390 clair : 2 essais forcés. Dev-local 390 clair : 1 essai. Je n'ai pas joué les autres passes : elles sont
mécaniques et confiées à Haiku.

## Doutes et limites
- 43 : le retour du réseau ne se joue pas au banc (`horsLigne` y est fixe). Seul le rangement hors ligne est capté.
- 45 : pas de micro en headless. Seul l'état du bouton Dicter se voit.
- 39 se joue à 390 seulement (clavier simulé). À 1280, il est dit « sans objet ».
- 56f : il n'y a pas d'onglet Atelier, donc le script joue Brassins › Bières.
- Le retrait (99) vide tous les carnets de l'émulateur. L'IA simulée retire « ZZ TEST — » de certains titres (L4-7).
- Les sélecteurs de Choisir et d'Écarter (28, 29, 52d) suivent `Choisir.tsx` au HEAD 0fea5f478 (`.cn-choisir-cadre`). Si les lots 1 à 3 les
  changent, les lignes ECHEC ACTION le diront.

DEMANDE EXECUTANT :
Préalable : le pilote a fusionné et rejoué les lots 1 à 3, et plus aucun lot n'écrit dans port-carnet. Le port 8080 est libre
(`netstat -ano | grep -c ':8080 .*LISTENING'` donne 0).
Toutes les commandes se lancent en Git Bash, une par appel, avec un délai de 600 000 ms, depuis
`C:/Users/mrspa/.codex/worktrees/openai-clean-start/Brasserie/work/missions/2026-11-17-port-carnet/vision-3`. La garde y attend 60 s.
1. `LARGEURS=390 THEMES=clair bash lancer.sh banc`
2. `LARGEURS=390 THEMES=sombre bash lancer.sh banc`
3. `LARGEURS=1280 THEMES=clair bash lancer.sh banc`
4. `LARGEURS=1280 THEMES=sombre bash lancer.sh banc`
5. `LARGEURS=390 THEMES=clair bash lancer.sh devlocal`
6. `LARGEURS=390 THEMES=sombre bash lancer.sh devlocal`
7. `LARGEURS=1280 THEMES=clair bash lancer.sh devlocal`
8. `LARGEURS=1280 THEMES=sombre bash lancer.sh devlocal`
Après chaque commande, `cat lancer.log`. On attend :
- `GARDE OK`. Sinon, arrêter et le dire (`ECHEC GARDE`).
- Une ligne JSON avec `"coupes":0`, `"consoleError":0` et `"pageerror":0`.
- `HMR … : 0`.
- `PORTS OUVERTS (6041x, 8080) : 0`.
Le fichier `lancer.log` est vidé à chaque commande : recopier ces lignes au rapport avant la commande suivante.
Captures attendues : environ 84 au banc à 390 (83 à 1280, sans le 39) et environ 34 en dev-local. Elles se nomment
`<m390|d1280>-<clair|sombre>[-devlocal]-<nn>-<état>.png`. Le dossier contient aussi `journal-*.txt` et `erreurs-*.txt`.
Ne pas ouvrir `essai-auteur/`.
Ouvrir **chaque** capture avec Read. Aucune ligne ne doit rester « non ouverte ». Écrire ensuite `vision-3/RAPPORT.md` au format de vision-1 :
- une section par passe, avec un tableau `n° | état | fichier | ce qui se voit | agit ?`, une ligne par capture ;
- les lignes ECHEC de `erreurs-*.txt`, recopiées ;
- les états non captés, avec leur motif : 43, retour du réseau ; 45, micro ; 39 à 1280 ;
- une ligne par problème : m390-1 à m390-7, d1280-1 à d1280-6, L4-1 à L4-7, L4-P14, L4-P18. Chacune dit « corrigé » ou « non
  corrigé », avec le nom de sa capture. Les libellés sont dans `vision-2/RAPPORT-m390.md` (« Problèmes »), `vision-2/RAPPORT-d1280.md`
  (« Problèmes relevés ») et `voies/corr1-L4-vision-2-rejeu-complet/RESULTAT.md` (« Constats de l'essai », 1 à 7).
Points à lire mot pour mot, sur le journal et sur la capture :
- 07 : « ✓ Carnet créé » ;
- 11 : « 38 cm au moins » ;
- 15 : « présente : oui/NON » ;
- 16 : « ✻ lecture de la page… » visible ;
- 18 : la carte « Hotte inox 140 cm » visible ;
- 23 : « égaux : oui/NON » ;
- 26b : « demandée · pas encore relevée », aucune date ;
- 27 : la colonne « écarté » entière, ou non, et la ligne du journal ;
- 46 : « Nouvelle idée » ;
- 57b : « le carnet s'ouvre : oui/NON » ;
- 99 : « 0 restant(s) ».
Ne rien corriger. Ne rien juger au-delà de ce qui se voit. Rendre : `VISION-3 FAITE — <n> captures ouvertes, <p> problèmes`.
Le pilote me renvoie ensuite le rapport, ou le passe au critique Opus (R50).

DÉCISION À PRENDRE : aucune nouvelle. La puce Coller (L4-1) est branchée au HEAD.

CONNAISSANCE : au banc, seules les adresses `exemple.invalid` de `PAGES_BANC` (`src/domain/carnets/iaSimulee.ts`) sont lues. Ce sont
hotte-140, pompe-inox, pompe-magnetique, evier-riviera et plaque-froid/echangeur-30 ; `v5` est l'adresse illisible. Toute autre adresse
reste « sans aperçu », donc ni squelette, ni carte, ni tableau. `&lien-retient=realise` ouvre l'Embouteillage retenu par un plan payé (état 50).
`&realise=1` ouvre Réalisés.
LEÇON PROPOSÉE : un banc de vision mesure ce qu'il voit sans le déplacer. Le `scrollIntoView` de ma mesure du 27 faisait défiler le
tableau, et la capture montrait un état que l'utilisateur ne voit jamais. Mesurer d'abord, puis faire défiler dans un état à part, nommé.
