RELEVE 4 carnets ; données identiques oui 00d44a6062517335

# Voie c75-releve : les vrais documents des carnets qui échouent (25.11)

Où : https://brasserie-l-affinee.web.app. Paquet servi au relevé : `index-CV-4hErC.js`, plus récent que celui du tour 75 (`index-DLKIyTrR.js`). Le service worker a été contourné. Chrome de débug 9222, un onglet neuf à moi, fermé à la fin par page.close() puis disconnect. Viewport 390 × 844.
Tests : sans objet (relevé de données, aucun test unitaire). Le DOSSIER prime sur le VOIE.md : aucun geste dans l'écran, aucune ligne versée à BUGS.md.

## Lecture seule : données identiques, oui
- Garde dans l'onglet (`outil.mjs`) : tout POST vers les fonctions et l'IA est annulé, ainsi que toute écriture Firestore (update, delete, transform). Résultat :
  - 0 écriture tentée ;
  - 4 POST de fonctions bloqués au chargement : la synchronisation comptable et l'activité, l'app les lance seule ;
  - 0 appel IA, 0 geste.
- Le cache Firestore a été lu dans IndexedDB (`remoteDocumentsV14`) : 4 154 documents, tous genres et ZZ compris. Il a été lu deux fois, à 20 s d'écart, avec une empreinte SHA-256 tronquée sur (nom, updateTime, champs) : avant `00d44a6062517335`, après `00d44a6062517335`, donc identique. Journal : `journal.txt`.
- La copie brute du cache est restée hors dépôt, dans le scratchpad de la session. Seules les 4 fixtures anonymisées sont versées.

## Fixtures : tests/fixtures/c75/<nom>.json, au format { _releve, carnet, messages, articles, plan }
Anonymisation :
- les ids CARNET, MSG, NOTE, ART, CRIT et PLAN sont remplacés par des alias stables (`CARNET-c75-01`…, 31 alias, communs aux 4 fichiers) ;
- les documents ne contiennent aucun champ de personne, d'email ou d'uid (vérifié par recherche dans les fichiers, et aucun uuid ne reste hors des URL) ;
- les boutiques, les URL publiques et les prix restent.

Les articles sont rangés dans `carnet.carnet.articles` : ils sont recopiés tels quels dans `articles`. Les messages sont les documents `carnet-message` qui citent le carnet.

1. `zz-malt-pilsner.json` : 5 messages, 1 article, pas de plan. C'est ce que montrait le tour 75 (cap Z01-carnet, ouverte) :
   - R75-1 est déjà dans la donnée. La bulle « Autre fournisseur : en stock, 4 CHF de plus le sac. » est stockée en **article** (`prixCentimes` 400, `nom` = la phrase entière, `valeurs` {}, rangement « locale »). L'écran affiche donc « Articles 1 », une carte « 4 CHF » et la veille du prix sur une note. Un correctif d'affichage seul ne suffit pas : il faut reclasser les carnets déjà rangés ainsi ;
   - R75-2 : « Commandé 2 sacs chez l'autre, brassin maintenu. » est rangé en note de genre **`a-acheter`**, alors que c'est un achat fait et la résolution du carnet. Le carnet reste en `status` « research » (pastille « À comparer ») et aucun « Ranger » n'apparaît.
2. `zz-pompe.json` : 4 messages, 0 article, pas de plan (cap Z02-carnet, ouverte) :
   - R75-1 : le constat « La pompe de recirculation est brûlante après 30 min d'empâtage. » est stocké en **critère** (`criteres[0]`, origine « locale »). L'écran affiche donc « Critère : … · calculé sur place » ;
   - R75-2 : la dernière bulle « … maintenant. Résolu. » a été coupée en **deux notes** sur le même messageId (« La vanne d'entrée… » et « Résolu »). Le carnet reste en `status` « idea » (« Idée · 24 nov. ») et aucune proposition de résolu n'apparaît.
3. `houblons-citra.json` : 3 messages, 2 articles, pas de plan (caps K01-f1 et K01-f1-choisir, ouvertes) :
   - R73-4 : l'article MotlerHops n'a qu'**un** prix, `prixCentimes` 372 EUR (taux BCE 0,9183), et `valeurs.Poids` = « 50 g, 250 g et 500 g » en un seul texte. La donnée n'a aucun prix par conditionnement. L'écran montre « ≈4 CHF rendu · 50 g · 73,80 CHF/kg » et ne donne aucun prix pour 250 g ni pour 500 g ; la table « je prends · prix · CHF/kg » de sa maquette v01-fiche ne peut pas se remplir depuis cette donnée ;
   - R73-5 : rien dans la donnée ne dit « 1 kg ». Pourtant le bouton affiche « Choisir · MotlerHops, 1 kg », et Choisir envoie « ≈4 CHF » dans À venir, soit le prix des 50 g ;
   - article Brau- und Rauchshop : `prixCentimes` 10 CHF avec `prixDes` true, c'est-à-dire « dès 0,10 CHF », sans unité. Doute : ce prix est probablement au gramme, et la fiche ne l'a pas été vérifiée au tour 75 ;
   - la note a été corrigée (`modifieeLe`) : la note dit « Semble difficile à obtenir… », sa bulle source dit « Ça semble dur… ». Les deux textes sont à garder dans un test.
4. `embouteillage-planning.json` : il s'agit du carnet importé du Planning (« Embouteillage — station complète (2027) »). 1 message, 0 article, plan `PLAN-c75-01` (caps C04-carnet et C04-quand, ouvertes) :
   - R73-25 : le plan porte `date` 2027-07-01 et `fenetre` du 2027-04-26 au 2027-07-04 ; le carnet porte `date` 2027-04-26 ; la note dit « À faire du 01.05.2027 au 01.07.2027 ». Pourtant Quand affiche « S26 », la semaine du 1er juillet 2027, **sans 2027**, et la réglette affiche juin · juil. · août sans année. À faire dit « dès le 1 mai 2027 » : les deux bornes ne concordent pas (début de fenêtre ou fin) ;
   - R73-23 : l'unique message porte titre, budget et dates sur trois lignes, d'où la 1re bulle qui redit l'en-tête ;
   - `fenetre.du` vaut 2027-04-26 alors que la note dit 01.05 : la fenêtre a été arrondie à la semaine. À tester tel quel.

## Fichiers
- Fixtures : `tests/fixtures/c75/zz-malt-pilsner.json`, `zz-pompe.json`, `houblons-citra.json`, `embouteillage-planning.json`.
- Voie : `outil.mjs` (onglet propre, garde, lecture du cache), `releve.mjs` (relevé avant et après), `journal.txt`.

LEÇON PROPOSÉE : avant d'écrire une fixture « à la forme » d'un carnet qui échoue en ligne, relever son document réel dans le cache IndexedDB et l'anonymiser. R75-1 et R75-2 viennent de la donnée déjà rangée (article à 400 centimes, critère « locale », note `a-acheter`), pas seulement de l'affichage ; une fixture neuve ne pouvait pas les reproduire.
