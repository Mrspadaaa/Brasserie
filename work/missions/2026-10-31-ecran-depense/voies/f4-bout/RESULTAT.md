OK — ENRICHIR 8/8 aux deux largeurs : les KO venaient du banc (lecture avant confirmation), pas de l'app ; rien perdu

## Diagnostic (preuves : `sonde1/report.json`, `sonde2/report.json`)
Cause unique des KO 1 à 3 et du « bis » : **le banc lit le serveur émulé avant que Firestore ait envoyé l'écriture de f4**. `f4Repos` rendait la
main quand la file de f4 était vide (`enAttente === 0`) ; or un travail « fait » a seulement posé son `put` : Firestore groupe (`enqueueWrite`,
microtâche, `writeBatch`) et confirme plus tard. Sonde posée dans le banc (`f4Sonde`, page contre serveur, à l'instant `f4Repos` rend) :

| largeur | article | page (stock local) | état d'écriture | serveur émulé |
|---|---|---|---|---|
| 390 | Windsor | `levure:lalbrew-windsor`, `cle`, `par: catalogue` | `pending` | fiche déjà là |
| 390 | Challenger | `beermaverick-challenger`, `cle` | `pending` | `beermaverick-challenger` **sans `cle`** (la fiche de création, S6) |
| 390 | ambre | `cle:malt\|\|60 ambre banc du malterie`, `par: en-ligne` | `pending` | **aucun** `fiche` |
| 1280 | Windsor | idem | `pending` | **aucun** `fiche` ni `yeastLab` |
| 1280 | ambre | **null** (le cache de l'app n'a pas encore reçu son propre `put`) | `pending` | aucun `fiche` |
| 390 et 1280, 6 s plus tard | les quatre | tous avec `cle`, `par` | `confirmed` | **tous** avec `cle` (Windsor, Challenger, ambre) |

- Challenger « sans `cle` ni `par` » : l'hypothèse de la voie (la fiche posée à la création empêcherait f4 de compléter la sienne) est **fausse**.
  `patchDeTrous` pose bien `cle` (`cleNeuve`), le `put` est parti, le serveur l'a reçu quelques secondes plus tard. Même chose pour Windsor à 1280 (« ordre ou
  attente » : attente) et pour l'ambre (« réponse rejouée pas écrite » : écrite, 2 appels partis, reçue à +6 s). `articleNeufDe` n'est pas en cause :
  **aucune `DEMANDE PILOTE`**.
- Le « bis » (check 7) : même cause (lu avant l'envoi), et son contrôle passait à vide (`undefined === undefined`) quand les deux articles
  n'avaient pas encore de fiche. Il passait donc « OK » dans le premier banc de f4 sans rien prouver.
- Contrôle « hors ligne, aucune fiche » : `!horsLigne?.fiche` était vrai aussi si l'article n'existait pas (écriture hors ligne pas encore au serveur).
- Console : voir ci-dessous.

## Console : 20 erreurs par largeur, aucune venue d'une requête de l'app qu'elle ne devrait pas faire
Chaque erreur est maintenant relevée avec son adresse (`message.location().url`, car le texte de Chrome ne la donne pas), `sonde2/report.json`, `enrichir-console` :
| nombre | erreur | adresse | cause |
|---|---|---|---|
| 5 | `ERR_INTERNET_DISCONNECTED`, hors ligne | `127.0.0.1:8080/…Firestore/Write/channel` | le SDK Firestore retente son canal d'écriture pendant que le banc coupe le réseau (`setOfflineMode`) |
| 5 | `ERR_INTERNET_DISCONNECTED`, hors ligne | `127.0.0.1:8080/…Firestore/Listen/channel` | idem, canal d'écoute |
| 8 | `ERR_FAILED`, hors ligne | `www.google.com/images/cleardot.gif` | sonde de connexion du SDK Firestore, bloquée par le banc (hors localhost) |
| 1 | `ERR_FAILED`, réseau rétabli | `fonts.googleapis.com/css2` | polices de `index.html`, bloquées par le banc |
| 1 | `ERR_FAILED`, réseau rétabli | `identitytoolkit.googleapis.com/…accounts:lookup` | SDK d'authentification au rechargement, bloqué par le banc (la connexion est simulée) |
Toutes viennent du réseau que le banc coupe ou bloque lui-même ; aucune n'est un appel que f4 ou l'app ferait de leur propre fait hors ligne (f4 n'écrit
ni ne cherche hors ligne : `hors ligne, l'article est enregistré sans fiche` vert, 0 appel de plus). Le contrôle écarte exactement ces deux causes nommées :
(1) une adresse hors localhost, (2) `ERR_INTERNET_DISCONNECTED` pendant la partie coupée (`coupe` vrai). Toute autre erreur (une adresse locale en dehors
de la coupure, un `pageerror`) fait échouer le contrôle ; l'écart est écrit dans son libellé (`ecartees`).

## Corrections (banc seulement : `scripts/check-invoice-journey-emulator.mjs`, `caseEnrichir`, `f4Repos`, `f4Sonde` neuf)
1. `f4Repos` : après la file au repos, `FirestoreRepo.waitForWrites(30000)` dans la page : « au repos » veut dire aussi « écritures confirmées par le serveur ».
2. Contrôle « bis » : la clé de l'ambre doit être **définie** (`!!ambre?.fiche?.cle`), puis `bis.fiche.cle === ambre.fiche.cle` et `bis.fiche.id === ambre.fiche.id`.
3. Contrôle hors ligne : l'article existe dans l'app (stock local), n'a aucune fiche (local ni serveur), et la page est bien hors ligne (`navigator.onLine === false`).
4. Contrôle console : voir ci-dessus ; la liste complète des erreurs de console du cas est enregistrée (`enrichir-console`).
5. `f4Sonde` : sonde page-contre-serveur, enregistrée à chaque lancement (`enrichir-sonde-1`, `enrichir-hors-ligne`).
Aucun contrôle relâché : les huit contrôles gardent leur sens, trois sont plus stricts (bis, hors ligne, console nommée).

TEMOIN AVANT : la version rejetée (le banc d'avant, lancé par le pilote : `ENRICHIR KO 390 · 5/8 · appels 2`, `ENRICHIR KO 1280 · 4/8 · appels 2`) ; avec le contrôle
renforcé mais l'ancien `f4Repos` (`sonde1`, `f4-bout/sonde1/console.log`) : `ENRICHIR KO 390 · 7/8 · appels 2` et `ENRICHIR KO 1280 · 7/8 · appels 2`, le « bis » en KO
(l'ancien contrôle le laissait passer à vide). Après correction : voir critère 3.
Pas de test unitaire de l'app : **aucun défaut de l'app trouvé** (les trois fiches sont écrites, avec leur trace, dans l'état de cache de l'app dès l'écriture).

## Critères
1. `node …/p3c-port/copie.mjs "npx vitest run tests/unit/depense --maxWorkers=2"` : `Test Files 112 passed (112)`, `Tests 1841 passed | 3 skipped (1844)` (`vitest-copie.log`). Essai 1.
2. `npx tsc --noEmit -p tsconfig.json` : exit 0 (`tsc-copie.log`) ; `npm run build` : exit 0, « built in 13.51s » (`build-copie.log`). Essai 1.
3. `lancer.sh f4-bout/sonde2 enrichir 390,1280 …rejeu-d272b.json …banc-f5c-prod-paires/results.json` :
   `ENRICHIR OK 390 · 8/8 · appels 2` et `ENRICHIR OK 1280 · 8/8 · appels 2`, `18 OK, 0 KO` ; `grep -c "hmr update\|page reload" sonde2/vite.log` : 0.
   Captures ouvertes (`sonde2/390-01-enrichir-stock-1.png`, `390-02-…-2.png`, `1280-01-…-1.png`, `1280-02-…-2.png`) : stock 8 articles puis 9 (bis « Malterie du Banc Ambre 60 bis · 3 kg »), Challenger, Target, Windsor,
   « Levure du Banc 7 » présents ; **l'écran du stock n'affiche pas les fiches** (« Niveau inconnu » partout, écran non touché) : les captures prouvent la liste, pas la fiche ; la fiche se prouve par les contrôles (serveur émulé).
   Essais : 3 lancers en tout (`sonde1` diagnostic, `sonde2` verte), 1 correction de banc.
4. `lancer.sh f4-bout/doc14 doc14 …` (mêmes manifestes) : `55/55 contrôles du banc OK`, `54 OK, 0 KO`, 0 « hmr update » / « page reload » ; 8 constats (non KO, hors du cas : lecture du doc14, inchangés par ce travail).

`node --check scripts/check-invoice-journey-emulator.mjs` : SYNTAXE OK.

## Fichiers écrits
`scripts/check-invoice-journey-emulator.mjs` (`caseEnrichir`, `f4Repos`, `f4Sonde`) ; dans `work/missions/2026-10-31-ecran-depense/voies/f4-bout/` : `RESULTAT.md`, `sonde1/`, `sonde2/`, `doc14/`,
`vitest-copie.log`, `tsc-copie.log`, `build-copie.log`. Aucun fichier de `src/` touché.

## Rien ne se perd
Aucune ligne de `src/` changée ; ni donnée, ni champ Firestore ; tests existants verts (1841). Le banc écrit seulement dans l'émulateur et ses dossiers de sortie.

## Doutes et limites
- Le banc force `stockAction: 'new'` (`f4Ligne`) : l'article « LALLEMAND Windsor 11g · 2 Stk » naît à côté de la levure semée « LALLEMAND Windsor 11g · 1 sachet » (visible sur
  `1280-01-enrichir-stock-1.png`, deux lignes Windsor). Ce n'est pas la lecture ni le rapprochement de la vraie dépense (qui relierait ou signalerait Stk ↔ sachet, voie n1 / S6) ; ce n'est pas un défaut de f4.
  À ne pas prendre pour deux fiches du même produit : les deux ont la même `fiche.id` du catalogue (`levure:lalbrew-windsor`), ce qui est le but.
- Une écriture de f4 est confirmée quelques secondes après « fait » (`pending` pendant ~1 à 6 s sur la machine du banc) : sans effet pour le brasseur (l'app voit déjà la fiche localement, hors
  ligne comprise). Mais une écran qui lirait le serveur seul (`getDocFromServer`) juste après la dépense verrait l'ancien article : f3 doit lire le cache de l'app, comme le fait déjà l'écran.
- L'ambre à 1280 : le cache de l'app n'avait pas encore reçu son propre `put` quand `f4Repos` rendait (page `local: null`, `pending`) ; sans conséquence, la page se met à jour au prochain instantané.
- Les 28 requêtes bloquées hors localhost sont celles du banc (polices, Google Identity, cleardot, identitytoolkit) : aucune nouvelle.

DÉCISION À PRENDRE : aucune.

CONNAISSANCE : au banc émulateur, « la file de f4 est vide » ne veut pas dire « le serveur a la fiche » : Firestore envoie l'écriture 1 à 6 s après le `put` (état `pending`). Un contrôle qui lit le serveur
admin attend `FirestoreRepo.waitForWrites` d'abord. Un contrôle de la forme `a?.x === b?.x` passe à vide quand les deux côtés sont absents : exiger la valeur définie.

LEÇON PROPOSÉE : un contrôle d'égalité entre deux champs lus doit d'abord exiger que l'un soit défini (`!!a.x && a.x === b.x`) ; le premier banc de f4 passait « bis OK » avec deux articles sans fiche.
