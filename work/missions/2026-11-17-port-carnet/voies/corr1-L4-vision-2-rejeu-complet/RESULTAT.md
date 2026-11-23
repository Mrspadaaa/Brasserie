ECHEC — rejeu complet non joué : code en cours d'écriture par L1 à L3 ; outillage prêt, DEMANDE EXECUTANT

Lot L4-vision-2-rejeu-complet, tour 1. La consigne le dit : lot mécanique, à confier à Haiku **après** la fusion de L1, L2 et L3.
L'essai le confirme : pendant le rejeu du banc, vite a rechargé `CarnetsVue.tsx` (erreur 500, `carteSupprimer is not defined`),
car un autre lot l'écrivait. Le banc revenait à la liste au milieu des gestes, et 29 gestes sur 76 ont échoué pour cette raison.
`git -C port-carnet status` montre 10 fichiers du carnet modifiés par les autres lots. Une vision faite maintenant ne vaudrait rien.
J'ai donc préparé et éprouvé les scripts. Je n'ai pas écrit `vision-2/RAPPORT.md` : un rapport sur du code qui bouge serait un faux vert (L11).

## Fichiers écrits (tous dans `vision-2/`, rien dans port-carnet)
- `outils.cjs` : Chrome 390 tactile (deviceScaleFactor 2, hasTouch) ou 1280. Le presse-papiers est accordé à l'origine
  (`clipboard-read`, P16). Il attend 450 ms avant chaque capture (P18) et réessaie chaque toucher 10 s au plus (écrans chargés à la demande).
  Les requêtes vers Gemini, Firestore réel ou Functions sont coupées et comptées (`coupes`). Il tient un journal et la liste des erreurs.
- `rejeu-banc.cjs` : `?preview=carnets`, états 1 à 55 (avec 12 b, 17, 20, 29, 33, 38, 49, 52 à 55, nouveaux par rapport à vision-1).
  En 11, il tape « fond de bac 38 cm minimum » dans Évier (P14). En 15, il écrit un lien dans le presse-papiers puis note si la puce est là (P16).
- `rejeu-devlocal.cjs` : `?dev-local` sur émulateurs. États : 47, + volant 46 (P19), CARNET-COEUR 48, 30 et 31, 49 et 55 côté À venir,
  56 (idée du calendrier) et 57 (icône de la bande, appui long sur S48). À la fin, il retire les données « ZZ TEST ».
- `emu/firebase.json`, `emu/ouvert.rules` : émulateur du projet `demo-carnet-vision`, avec des règles ouvertes que lui seul lit. Le compte
  dev-local n'a pas de jeton. Ces fichiers ne remplacent pas `firestore.rules` et ne partent jamais en ligne.
- `lancer.sh` : il démarre vite (ports 60417 et 60418, aucun build : `dist` n'est pas touché) et l'émulateur, joue les passes, puis
  arrête tout. Les variables `LARGEURS` et `THEMES` règlent les passes.
- Essais (seront écrasés au rejeu) : `m390-clair-*.png` (76, banc sur code instable), `m390-clair-devlocal-*.png` (34),
  journaux `journal-*.txt`, `erreurs-*.txt`, `lancer.log`, `vite-*.log`, `emu.log`.

## Essais et sorties décisives
- Banc 390 clair, 1 essai : `{"captures":76,"erreurs":32,"echecsAction":29,"coupes":0}`. Les échecs viennent du rechargement de vite
  (voir plus haut). Capture 11 ouverte : la liste au lieu d'Évier, et la phrase tapée perdue : c'est le banc remis à zéro.
- Dev-local 390 clair, 4 essais (attente du chargement, retour à la liste, ±, retrait) : dernier essai
  `{"captures":34,"erreurs":4,"echecsAction":4,"coupes":0}`, puis `99 … 0 restant(s)`. Après la passe, aucun port n'écoute (60417, 60418, 8080).
  Restent 30, 30b et 30d : « Choisir » manque, parce que les liens exemple.test restent « sans aperçu » en dev-local. L'état 30 se juge donc au banc.
  Reste aussi 49b : il découle de 30.
- `node --check` vert sur les trois `.cjs` ; `bash -n lancer.sh` vert.

## Problèmes → fait → preuve
- P18 (captures non ouvertes) : non corrigé. Le rejeu des 4 passes attend la fusion. Les scripts attendent 450 ms et écrivent un
  journal par capture. Captures ouvertes à l'essai (7) : banc m390-clair-11 ; dev-local 46, 48c, 48f, 56e, 57b, 57c.
- P14 (G9 à 390) : non prouvé. Le geste est écrit (Évier, « fond de bac 38 cm minimum ») ; le banc s'est remis à zéro pendant l'essai.
- P16 (puce Coller) : **cause trouvée, ce n'est pas le headless**. Le presse-papiers est accordé et lu (journal 15 : « il tient
  https://exemple.test/zz-test-pompe-magnetique »), et la puce reste absente (« présente : NON »). Dans `src/`, aucun
  `navigator.clipboard.readText` et aucun `coller=` passé à `ChampCarnet` : la puce G14/R15 n'est pas branchée. Voir DÉCISION.
- P19 (+ volant, états non joués) : + volant touché sur Carnets (dev-local 46, ouverte). Le menu affiche « Partout » (Écriture,
  Facture, Vente, Recette, Brassin, Compagnon) puis « Sur Carnets · Nouvelle idée », une seule porte. 46b met le focus sur le champ.
  Joués à l'essai : 47, 48, 31, 56, 57. Les autres états sont écrits dans les scripts et attendent le rejeu.

## Constats de l'essai (dev-local 390 clair, code non fusionné : à confirmer au rejeu)
1. P16 : la puce « Coller : … » n'est pas branchée (voir plus haut).
2. 57b : un toucher sur S47 affiche l'infobulle « S47, 16 – 22 nov. », qui cache la ligne Brassins. Le carnet ne s'ouvre pas.
   À trancher au rejeu : cible du script (l'icône 💡 sous S47) ou geste de l'app.
3. 57c : la feuille « Noter une idée » écrit « S48, 23 – 29 nov.. Elle arrive dans le carnet. » : double point.
4. 48f : la bulle G8 dit « peut trancher entre exemple.test et exemple.test ». Deux articles portent le même nom de domaine et ne se
   distinguent pas. La bulle recouvre aussi le haut du tableau.
5. 56e : l'idée du calendrier montre son titre puis la même phrase citée en dessous. À 390, les titres se coupent sur 4 lignes à
   côté de « Coller un lien ».
6. 47 : « À venir 2 » sur un émulateur vide, avant toute création. L'origine est inconnue (cache local ou données de démo ?), à vérifier.
7. L'IA simulée retitre la phrase (« Frigo pour les fûts »), et le titre perd « ZZ TEST — ». Le retrait vide donc tous les carnets
   de l'émulateur, pas seulement ceux qui portent ce préfixe.

## Doutes et limites
- La MISSION dit « Atelier › Bières » (56). La barre d'onglets n'a pas d'Atelier : le script joue Brassins (› Bières s'il existe).
- Le 43 « retour du réseau » ne se joue pas au banc : `horsLigne` y est un paramètre fixe.
- Le 45 (dictée) : pas de micro en headless ; seul l'état du bouton se voit.
- Le 24 : `voies/E/ref/` ne contient que des images. Les notes sont recopiées en texte, et la photo 44 vient de `ref/base-E06-note.webp`.

DEMANDE EXECUTANT :
Préalable : le pilote a fusionné et rejoué L1, L2 et L3, et aucun autre lot n'écrit dans port-carnet (`git -C
C:/Users/mrspa/.codex/worktrees/openai-clean-start/port-carnet status --short` est stable entre deux lectures à une minute d'intervalle).
Commandes (Git Bash, une par appel, délai de 600 000 ms), depuis
`C:/Users/mrspa/.codex/worktrees/openai-clean-start/Brasserie/work/missions/2026-11-17-port-carnet/vision-2` :
1. `LARGEURS=390 THEMES=clair bash lancer.sh banc`
2. `LARGEURS=390 THEMES=sombre bash lancer.sh banc`
3. `LARGEURS=1280 THEMES=clair bash lancer.sh banc`
4. `LARGEURS=1280 THEMES=sombre bash lancer.sh banc`
5. `LARGEURS=390 THEMES=clair bash lancer.sh devlocal`
6. `LARGEURS=390 THEMES=sombre bash lancer.sh devlocal`
7. `LARGEURS=1280 THEMES=clair bash lancer.sh devlocal`
8. `LARGEURS=1280 THEMES=sombre bash lancer.sh devlocal`
Après chaque commande : `grep '^{' lancer.log` donne une ligne JSON. On attend `"coupes":0`, environ 76 captures au banc 390 (75 à 1280,
sans le 39) et environ 35 en dev-local. Puis `netstat -ano | grep -c ":6041[78] .*LISTENING\|:8080 .*LISTENING"` vaut 0.
Les fichiers produits sont `<m390|d1280>-<clair|sombre>[-devlocal]-<nn>-<état>.png`, `journal-*.txt` et `erreurs-*.txt`.
Ouvrir **chaque** capture avec Read (aucune ligne « non ouverte »), puis écrire `vision-2/RAPPORT.md` au format de vision-1 : une
section par passe, un tableau `n° | état | fichier | ce qui se voit | agit ?` avec une ligne par capture, les lignes ECHEC ACTION de
`erreurs-*.txt` recopiées, puis la liste numérotée « Combien et quels problèmes ? ». Points à lire mot pour mot : 11 (« 38 cm au
moins » visible ?) ; 15 (journal : « présente : oui/NON ») ; 46 (« Sur Carnets · Nouvelle idée ») ; 57b (le carnet s'ouvre-t-il ?) ;
99 (« 0 restant(s) »). Ne rien corriger, ne rien juger au-delà de ce qui se voit. Rendre : `VISION-2 FAITE — <n> captures ouvertes,
<p> problèmes`.

DÉCISION À PRENDRE : puce « Coller : … » (G14, R15, P16), retenue mais non branchée. Options : a) le lot qui possède
`CarnetsVue`/`ChampCarnet` lit le presse-papiers au focus du champ (`navigator.clipboard.readText`, refus silencieux, lien seulement),
avec un test vitest sur presse-papiers simulé ; b) remplacer la puce par le bouton « Coller un lien » déjà visible sur les cartes
Idée ; c) la ranger derrière. Recommandation : a), car c'est une fonction retenue (« rien de retenu ne se perd ») et elle sert le fil
de chat. Le changement est réversible.

CONNAISSANCE : en `?dev-local` sur émulateur, le compte n'a pas de jeton. Il faut un émulateur `demo-*` avec des règles ouvertes, dans
un dossier à part (`--config`), pour que l'app écrive. Les liens exemple.test restent « sans aperçu » : choisir et comparer ne se
jouent qu'au banc. Sur Calendrier, l'appui long sur une semaine ouvre « Noter une idée en Sxx ».
LEÇON PROPOSÉE : un rejeu visuel ne se lance pas pendant que d'autres lots écrivent dans le même worktree. Le HMR de vite remet le
banc à zéro au milieu des gestes, et les échecs ressemblent à des bugs de l'app. Il faut d'abord vérifier que `git status` est stable.
