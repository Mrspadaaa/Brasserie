# RESULTAT lecture-ecrit (tenu au fil)

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
