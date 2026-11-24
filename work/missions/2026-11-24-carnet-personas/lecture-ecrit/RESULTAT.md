OK — regarder un carnet n’écrit plus : une lecture gardée ne repart qu’au toucher « Reprendre » (LE-1, 6f2d66fb9)


## 1. Les écritures déclenchées sans geste (état au 24.11, avant correctif)

UNE SEULE écriture part du montage ou de l'ouverture d'une vue du Carnet sans geste : la REPRISE DES LECTURES GARDÉES.

- Déclencheur : `src/ui/carnets/CarnetsVue.tsx:169-173` (`useEffect` au montage : `void rangement.reprendreLectures()`), qui appelle
  `src/ui/carnets/rangement.ts:501-512` (`reprendreLectures` -> `passerIA(..., { reouverture: true })`).
- Ce qu'elle écrit : `deps.ecrireIA` (rangement.ts:~478, puis `ecrireIA` de rangementCarnets.ts) = `magasin.appliquer` -> `FirestoreRepo.put('creativeItems', ...)`
  sur le carnet du lien ET sur le message ; si l'IA ne répond pas, `echouer` (rangement.ts:~414) écrit le repli local
  (`repliLocal` : nom, prix, valeurs de la page = « articles relus, prix et caractéristiques ajoutés »).
- Pourquoi sans geste : une lecture lancée un jour (collage d'un lien) et jamais finie reste GARDÉE 24 h sur l'appareil
  (`src/domain/carnets/lecture.ts:145-163`, `suiviLocal`, localStorage `affinee.carnets.lectures`) ; chaque ouverture du Carnet la rejoue seule,
  même 20 h plus tard, même si le brasseur n'y pense plus. La file d'écriture de Firestore est alors non vide : « Enregistrement sur le
  serveur… » (`PersistenceStatus`, état `pending`). Seule une lecture gardée la provoque : sur un appareil neuf, rien.
- Depuis quand : commit 5cc83346c (23.11, D448 « étapes de lecture d'un lien… reprise par jeton »), `git log -S reprendreLectures`.
- A-t-elle déjà modifié des données ? Probable, non prouvable d'ici (aucune donnée réelle lue). Le 24.11 à 11:38, « Chambre froide » : ses deux articles
  « relus » (luLe 10:38:12Z et 10:38:14Z), prix 2 697,74 et 2 987,51, plus Tension et Volume ajoutés (critique-53) : ce sont exactement les champs que
  `repliLocal` / le rangement écrivent (nom, prix, valeurs, luLe) pour un article lu ; `relireArticle` (« Relire », geste) écrit les mêmes. Aucune
  ligne du journal IA à cette heure : cohérent avec un repli local. À confirmer par le brasseur : « une lecture de lien a-t-elle été lancée puis
  interrompue (fermeture, changement d'écran) avant le 24.11 11:38 ? ».

Pistes du dossier, vérifiées une à une (aucune n'écrit au montage ni à l'ouverture d'une vue ; test espion vert AVANT correctif sur des carnets anciens) :
- domaine déduit (D437) : `domaineDe` (domaines.ts:63) pur, lu par `PastilleDomaine` ; l'écriture `poserDomaine` n'est qu'au toucher (`onDomaine`, ecransCarnet.tsx:207).
- ordre des caractéristiques (c52, c53, c54) : calcul de `comparer.ts` à la lecture, jamais renvoyé au magasin.
- prix choisi (Q-1 A) : `prixChoisi.ts` pur ; `planSuitLeChoix` n'est appelé que par un geste (Choisir, prix d'une fiche, Envoyer à À venir).
- Relire (c48-fix R1) : `BoutonRelire` écrit au toucher seulement (`onClick`).
- C56-4 (reprise après 400 ms) : l'unique nouvel appel d'un ENVOI déjà lancé (rangement.ts:~467), jamais au montage.
- Autres effets du montage (navigation, historique, session, brouillon du champ `ChampCarnet:312`) : état React et localStorage (onglet, brouillon), aucune donnée du carnet.

## 2. Test espion

- `tests/unit/carnetsLectureEcrit.test.tsx` (14 tests) : vrai magasin (`magasinSur`) à port espion + espions sur `FirestoreRepo` (put, remove, adjustNumber, replaceAll, bulkWrite),
  `StorageService` et `FinanceService` ; carnets ANCIENS (sans domaine posé, valeurs en ordre de page inversé, article lu sans prix, choix déjà fait) ;
  vues jouées : liste, 5 carnets ouverts, Comparer, Choisir/Retenir, fiche d'article, Quand (rubrique du carnet ouvert) ; seule navigation, jamais un geste d'écriture.
- ROUGE AVANT correctif (`tests-rouge.log`) : 12 verts (les pistes du dossier n'écrivent pas), 2 ROUGES : « ouvrir le Carnet avec une lecture gardée » =
  `écritures sans geste : magasin.poser ZZ-CARNET-VENTILATION, magasin.poser ZZ-MSG-V2` ; et le bouton de reprise absent.
- VERT APRÈS (`tests-vert.log`) : 14/14 ; contre-épreuve : un renommage (geste) écrit bien (l'espion voit les écritures) ; « Reprendre » rejoue la lecture et vide le suivi.

## 3. Correctif

- `rangement.ts` : `lecturesEnAttente()` (liste sans rien lancer ni écrire) ; `reprendreLectures(seul?)` ne sert plus qu'au toucher.
- `CarnetsVue.tsx` : plus d'appel au montage ; les lectures gardées (message présent au fil) entrent, une fois par montage, dans le bandeau de reprise existant (`aReprendre`, `lecture: true`) ; `rangerMaintenant` les rejoue par leur jeton.
- `bandeauxCarnet.tsx` : « Lecture de lien interrompue : n à reprendre » + bouton « Reprendre » (le bandeau « De retour en ligne » existant, mot pour mot, quand il n'y a pas de lecture) ; `carnetsTypes.ts` : `AReprendre.lecture`.
- Effet voulu : sur un appareil sans lecture gardée, rien ne change ; avec une lecture gardée, plus aucune écriture, plus de « Enregistrement sur le serveur… » à l'ouverture.

## 4. Critères

- tsc : 2 erreurs, les 2 connues (seedData GanttTask, virtual:pwa-register), aucune neuve (`tsc.log`).
- test espion : 14/14 vert (`tests-vert.log`).
- `tests/unit/carnets* c4* c5*` : 55 fichiers, 1255 verts, 3 sautés (`tests.log`).
- `tests/unit/proprietes` : 8 fichiers, 76 verts (`tests-proprietes.log`).
- `node scripts/agents/controle-bugs.mjs` : BUGS OK : 2273 bugs, 522 ouverts, 202 sources. LE-1 (B) versée à BUGS.md, « corrigé en local 6f2d66fb9 ».
- Essais : 1 par critère.

## Doutes et limites

- Je n'ai pas lu les données réelles : le lien avec la réécriture du 24.11 11:38 est une déduction (mêmes champs, aucun journal IA), pas une preuve. Question au brasseur : une lecture de lien a-t-elle été interrompue avant ?
- L'avis « Enregistrement sur le serveur… » vient de la file d'écriture Firestore ; si une écriture LÉGITIME d'une session précédente restait en attente (réseau lent), il paraîtrait aussi à l'ouverture : non couvert par cette voie (hors Carnet, `firestoreRepo.ts`).
- Le bandeau « Lecture de lien interrompue » n'a pas été vu sur un vrai rendu (jsdom seulement, bouton joué) : c'est le bandeau de reprise existant avec un autre texte ; à regarder au prochain test en ligne (390 px).
- Les lectures gardées dont le message n'est pas (encore) dans le fil ne sont plus retirées du suivi à l'ouverture (avant : retirées) ; elles expirent seules après 24 h.
- BUGS.md : une modification d'une autre voie (ligne C50-5) est dans le dossier de travail ; je n'ai commité que ma ligne (index construit depuis HEAD).

DÉCISION À PRENDRE : aucune bloquante. Option à noter : retirer d'office les lectures gardées de plus de quelques heures (aujourd'hui 24 h) pour qu'un bandeau ancien ne revienne pas chaque jour ; recommandation : 6 h.
CONNAISSANCE : une lecture de lien gardée sur l'appareil (`affinee.carnets.lectures`, 24 h) est une écriture en attente de geste : elle doit être proposée, jamais rejouée à l'ouverture.
LEÇON PROPOSÉE : une reprise « automatique à l'ouverture » est une écriture sans geste ; tout effet de montage qui appelle `appliquer`/`ecrire*` doit être couvert par un test espion qui monte chaque vue avec des données ANCIENNES et un état gardé (localStorage) non vide.
