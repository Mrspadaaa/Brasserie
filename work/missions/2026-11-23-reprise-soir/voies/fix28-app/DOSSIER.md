# Dossier fix28-app (extraits ; lire à la place des sources)

## Constats (BUGS.md, tour 28 en ligne, mot pour mot)
 T28-1 | Stocks › Matériel › Carnets › carnet « ZZ TEST — tour 28 » ouvert (390 px, en ligne index-CoXAhg_q.js) | Coller le lien landi Schwerlastregal, recharger la page pendant la lecture, revenir au carnet → observé : carte « Lu pendant que l’app était fermée » juste, mais l’article est rangé dans le vrai carnet « Armoire de rangement malte » (passé à « À comparer ») ; ZZ reste à 4 articles ; attendu : article rangé dans le carnet où le lien a été collé | B 
 T28-2 | Stocks › Matériel › Carnets › carnet « Sol — matières premières… » (390 px, en ligne index-CoXAhg_q.js) | Lire brouwland dans ZZ, quitter, ouvrir un autre carnet, toucher la barre repliée « Lu · Brew Monk… » → observé : la carte de fin (Photos absent, Contrôle absent, Compléter) s’ouvre dans le carnet Sol, sans nom de carnet ni d’article ; attendu : la barre mène au carnet du lien, la carte de fin y est (v01-fin, v03-4) | B 
 T28-3 | Stocks › Matériel › Carnets › carnet « ZZ TEST — tour 28 » ouvert (390 px, en ligne index-CoXAhg_q.js) | Lien mort brewtools, toucher « Compléter » sur la carte d’échec → observé : aucun formulaire ; le lien mort devient l’article « ? brewtools.com · lecture… » compté (5 articles à comparer, avec Déplacer) et bandeau persistant « L’IA n’a pas répondu : rangé sur place, rien n’est perdu » ; attendu : saisie manuelle de l’article (nom, prix), ou rien de rangé | B 
 T28-4 | Stocks › Matériel › Carnets › carnet « ZZ TEST — tour 28 » ouvert (390 px, en ligne index-CoXAhg_q.js) | Lien mort brewtools, toucher « Escalader IA plus forte » → observé : rien de visible pendant 30 s, seul « arrêté à 1 sur 6 » devient « 1 sur 7 » et « 5 étapes » devient « 6 » ; ni attente, ni résultat, bouton toujours là ; attendu : une étape « relu par une IA plus forte » en cours puis son résultat (v03-5) | B 
 T28-6 | Stocks › Matériel › Carnets › carnet « ZZ TEST — tour 28 » ouvert (390 px, en ligne index-CoXAhg_q.js) | Coller sios Citra 1 kg et hopfenmarkt Mosaic → observé : Mosaic 7,25 CHF (100 g affichés) classé 1er devant Citra 72,50 CHF (1 kg), le même prix au kilo ; aucune quantité à côté du prix dans la liste ni la fiche ; attendu : prix ramené à la même quantité (CHF/kg) ou quantité dite | B 
 T28-10 | Stocks › Matériel › Carnets › carnet « ZZ TEST — tour 28 » ouvert (390 px, en ligne index-CoXAhg_q.js) | brouwland et doublon galaxus → observé : barre « 6 s » pendant la lecture puis « Lu · 3 s » ; doublon : « Lecture · 6 sur 6 » pendant 5 s puis « lu en 1 s » ; attendu : durée affichée égale au temps vécu | m 
 T28-11 | Stocks › Matériel › Carnets › carnet « ZZ TEST — tour 28 » ouvert (390 px, en ligne index-CoXAhg_q.js) | Coller un lien (brewtools mort, landi, gastro-held) → observé : « 5 articles à comparer », « Articles 5 » dès le collage, avant toute lecture ; pour le lien mort le compte retombe à 4 ; attendu : compte inchangé tant que l’article n’est pas rangé | m 
 T28-15 | Stocks › Matériel › Carnets (liste) (390 px, en ligne index-CoXAhg_q.js) | Quitter le carnet ZZ pendant la lecture brouwland → observé : à la fin, bandeau « Rangé ici, à l’instant · Annuler » sur la liste des Carnets ; attendu : nom du carnet où l’article est rangé | m 
 T28-17 | Stocks › Matériel › Carnets › carnet « ZZ TEST — tour 28 » ouvert (390 px, en ligne index-CoXAhg_q.js) | Recoller le lien galaxus déjà rangé → observé : la page est relue en entier (6 étapes, environ 5 s, appel serveur) avant « Déjà dans ce carnet : rien de plus rangé » ; attendu : doublon reconnu au collage, sans relecture | m 

## Code (étapes de lecture, commit 5cc83346c)
 src/design/CarnetsPreview.tsx      |  29 ++++-
 src/domain/carnets/iaSimulee.ts    | 112 ++++++++++++++--
 src/domain/carnets/lecture.ts      | 158 ++++++++++++++++++++++
 src/services/aiClient.ts           |  22 +++-
 src/ui/carnets/CarnetsVue.tsx      |  48 ++++++-
 src/ui/carnets/LectureLien.tsx     | 260 +++++++++++++++++++++++++++++++++++++
 src/ui/carnets/apercuCarnet.tsx    |  53 +++++++-
 src/ui/carnets/carnetsTypes.ts     |   2 +
 src/ui/carnets/lecture-lien.css    | 104 +++++++++++++++
 src/ui/carnets/rangement.ts        | 143 ++++++++++++++++----
 src/ui/carnets/rangementCarnets.ts |  22 +++-
 11 files changed, 903 insertions(+), 50 deletions(-)

## Rappels
- Son choix D448 : work/missions/maquettes-carnet/CHOIX.md (31 lignes) ; captures du test : voies/critique/cap/ (ouvre seulement celles des constats).
- Contrat serveur : functions/src/lecturesLiens.ts (en-tête) ; {url, jeton} ; reprise {jeton, reprise:true} ; escalade:true = lecture neuve, IA forte.
