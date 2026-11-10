RENO-U OK — u1 carte du Bord, u2 grille des trous, u3 frise des mois, u4 cuve ; huit états, contrôles verts

# Série u — résultat (écrit variante par variante)

Captures : `node scripts/agents/verifier-page.mjs "<id>/etat.html?etat=<état>" --min-images 0 --captures <id>/captures/<id>-<état>`
pour les huit états à 390 (fichiers `-haut.png` et `-page.png`) ; la capture à 1280 (`<id>-encours-1280.png`) vient d'un
petit script hors dépôt (puppeteer-core, 1280 × 800), car `verifier-page` ne capture le 1280 qu'en mode `--page-lot`.
`verifier-page` accepte `?etat=` dans le chemin (adaptation signalée). L'état par défaut de chaque page est `encours` :
c'est lui que lisent les contrôles.

## u1 — froide : la carte « Rénovation » en tête du Bord

- **Idée** : une carte teintée de plus sur le Bord. En tête, « Ensuite » (le prochain geste, bouton « Fait ») ; puis
  les cinq projets par horizon, chacun avec ses trous en pastilles pointillées (« prix ? », « date ? ») ou son budget
  chiffré ; un champ « Ce qui te manque… » pour noter en une ligne. Ouvrir = déplier sur place.
- **Contrôles** (depuis la racine) :
  - `controle-choix.mjs … --ecran=renovation` → `CHOIX OK (0 écran(s) conforme(s) à son choix ; 0 ouvert(s))` (pas
    d'entrée dans `ecrans.json`, attendu) ;
  - `controle-commun.mjs … --profil=sans-houblons --sans-lignes` → `COMMUN OK` (au-style, fiche, trait, legende sautés
    par le profil) ;
  - `mots-premier-ecran.mjs … --max=60 --sans-lignes` → `u1 54 mots`, `MOTS OK` (63 au premier jet : les sous-lignes
    d'étape et de mois sont passées en `data-mots="lignes"`) ;
  - `controle-contraste.mjs` → `CONTRASTE OK` (pire 4,83:1) ;
  - `verifier-page.mjs etat.html --min-images 0` → `PAGE OK` ; les huit états : `PAGE OK`, débord 0 px à 1280.
- **Captures ouvertes** : `u1/captures/u1-encours-haut.png`, `-depasse-haut`, `-caisse-haut`, `-fini-haut`, `-ajout-page`,
  `-horsligne-haut`, `-jour1-haut`, `u1-encours-1280.png`.
- **Ce qui tient** : en trois secondes, « Ensuite : relancer Sophie… » et les trous en jaune ; la hotte qui dépasse se
  lit (+370 en rouge, prévu 3 610 / facturé 3 980) ; noter = taper une ligne. Ton du Bord respecté.
- **Ce qui casse** : les crans d'avancement (4 barrettes) ressemblent à un signal réseau ; la carte pousse les autres
  sous le pli ; la carte Finances du Bord est repliée (« Ce mois › ») pour ne rien inventer ; à 1280 la colonne de
  gauche reste étroite.
- **Prédiction** : « c'est propre, je vois ce qui manque, mais c'est juste une liste » — mitigé positif.

## u2 — tiède : la grille des trous (Finances › Prévisions › Projets de matériel)

- **Idée** : une grille Projet × Prix · Mois · Qui ; chaque inconnue est une case pointillée jaune « + » à remplir sur
  place ; la prochaine est cerclée de noir et nommée (« Prochain trou : le mois de l'évier ») ; trois tuiles en tête
  (projets, CHF chiffrés, trous).
- **Contrôles** :
  - `controle-choix.mjs` → `CHOIX OK (0 écran(s) conforme(s) à son choix ; 0 ouvert(s))` (sans entrée, attendu) ;
  - `controle-commun.mjs` → `COMMUN OK` ;
  - `mots-premier-ecran.mjs --max=60 --sans-lignes` → `u2 44 mots`, `MOTS OK` (cellules et titres en `data-mots="lignes"`) ;
  - `controle-contraste.mjs` → `CONTRASTE OK` (pire 5,07:1) ;
  - `verifier-page.mjs` → `PAGE OK` ; huit états `PAGE OK` ; 1280 sans débord.
- **Captures ouvertes** : `u2/captures/u2-encours-haut.png`, `-ouvert-haut`, `-caisse-haut`, `-depasse-haut`, `-fini-haut`,
  `-ajout-haut`.
- **Ce qui tient** : le manque se compte d'un coup d'œil (7 cases jaunes) ; noter une ligne fait apparaître ses trous ;
  « 380 + ? » est honnête ; la caisse dit en mots ce qui n'est pas compté.
- **Ce qui casse** : un « + » seul dans une case reste abstrait (quel geste ?) ; la colonne Qui mélange artisan et
  heures ; au premier jet, « 3 980 / 3 610 » et « Sols, seconde passe » se coupaient (corrigé : facturé dans la case,
  prévu en sous-ligne ; titre sur deux lignes).
- **Prédiction** : « là je vois direct ce qui me manque » — aime, avec une réserve sur le côté tableur.

## u3 — chaude : la frise des mois et le bac « sans mois » (page Rénovation, depuis le Bord)

- **Idée** : chaque projet est posé sur le mois où il sera payé, le long d'un rail noir qui part d'aujourd'hui
  (point jaune) ; ce qui n'a pas de mois attend dans un bac pointillé, en jetons qui disent leur trou ; en état
  `caisse`, le solde « après » chaque mois se lit en piste (6 200 → 2 590 → 2 130), avec ce qui n'est pas compté.
- **Contrôles** :
  - `controle-choix.mjs` → `CHOIX OK (0 écran(s) conforme(s) à son choix ; 0 ouvert(s))` (sans entrée, attendu) ;
  - `controle-commun.mjs` → `COMMUN OK` ;
  - `mots-premier-ecran.mjs --max=60 --sans-lignes` → `u3 46 mots`, `MOTS OK` ;
  - `controle-contraste.mjs` → `CONTRASTE OK` (pire 5,27:1) ;
  - `verifier-page.mjs` → `PAGE OK` ; huit états `PAGE OK` ; 1280 sans débord.
- **Captures ouvertes** : `u3/captures/u3-encours-haut.png`, `-caisse-haut`, `-depasse-haut`, `-ajout-haut`, `-fini-haut`,
  `-ouvert-haut`.
- **Ce qui tient** : la planification se voit (décembre la hotte, janvier les sols) ; le bac rend le manque concret ;
  la piste de solde est la seule « prédiction » honnête de la série ; les heures notées sont visibles.
- **Ce qui casse** : février et mars restent vides (honnête, mais la frise paraît creuse) ; le geste « glisser du bac
  sur un mois » n'est pas joué dans la maquette (statique) ; corrigé en route : rail en pointillés, « · » sur les mois
  vides, un solde mis en rouge sans seuil connu (retiré), un « aujourd'hui » resté en novembre dans l'état fini.
- **Prédiction** : « ça c'est de la planification, j'aime bien la frise » — aime, demandera de remplir les mois vides.

## u4 — chaude : la cuve (Finances › Rénovation)

- **Idée** : les projets chiffrés s'empilent dans une cuve dans l'ordre de sa priorité ; une ligne pointillée marque
  l'enveloppe qu'il a fixée (4 000) ou, d'un toucher, ce qu'il a au compte (6 200) ; ce qui passe au-dessus est hachuré ;
  ce qui n'a pas de prix flotte en bulles « ? ». La phrase en tête répond : « Les sols dépassent de 450 CHF. L'ordre
  décide. » En `depasse`, la hotte à 3 980 pousse l'évier et les sols hors de l'enveloppe.
- **Contrôles** :
  - `controle-choix.mjs` → `CHOIX OK (0 écran(s) conforme(s) à son choix ; 0 ouvert(s))` (sans entrée, attendu) ;
  - `controle-commun.mjs` → `COMMUN OK` (au premier jet `CONTRASTE ECHEC` : texte blanc sur le vert de l'évier à
    3,91:1 ; vert foncé à `#2B6E60`, rejoué OK) ;
  - `mots-premier-ecran.mjs --max=60 --sans-lignes` → `u4 38 mots`, `MOTS OK` ;
  - `controle-contraste.mjs` → `CONTRASTE OK` (pire 4,85:1) ;
  - `verifier-page.mjs` → `PAGE OK` ; huit états `PAGE OK` ; 1280 sans débord.
- **Captures ouvertes** : `u4/captures/u4-encours-haut.png`, `-depasse-haut`, `-ajout-haut`, `-caisse-haut`, `-ouvert-haut`,
  `-fini-haut`, `-jour1-haut`, `u4-encours-1280.png`.
- **Ce qui tient** : la seule variante qui répond « est-ce que ça passe ? » d'un regard ; le dépassement de la hotte a
  une conséquence visible (l'évier sort de l'enveloppe) ; l'inconnu n'a pas de taille (bulle), donc rien d'inventé.
- **Ce qui casse** : les petits blocs (évier 380, sols 460) n'ont que 25 à 40 px, leurs noms tombent ; « Armoire » déborde
  presque de sa bulle ; l'enveloppe est une donnée neuve à saisir ; la métaphore peut paraître gadget. Corrigé en
  route : bulles qui chevauchaient la ligne, étiquettes « dépasse tout » restées dans l'état fini.
- **Prédiction** : « la cuve c'est marrant et je vois direct si ça passe » — aime ou mitigé selon qu'il prend la cuve
  pour un gadget.

## Bilan de la série

- Quatre compositions sans squelette commun hors du chrome imposé : carte du Bord (u1), grille Finances (u2), page frise
  (u3), cuve à deux colonnes (u4). Les quatre passent `COMMUN OK`, `MOTS OK`, `CONTRASTE OK`, `PAGE OK` sur l'état par
  défaut, et `PAGE OK` sur les huit états.
- Ma prédiction : il retient u3 (planification) ou u4 (prédiction), et greffe les trous de u2 sur l'une d'elles.
- DÉCISION À PRENDRE : u4 suppose une « enveloppe » de rénovation saisie par lui, absente du modèle
  (`upgrades.ts`) ; à garder en variante si elle plaît, sinon la ligne « Au compte » seule.
- CONNAISSANCE : `verifier-page.mjs` accepte `"etat.html?etat=x"` (l'URL file garde la requête) ; il ne capture le 1280
  qu'en mode `--page-lot`.
- LEÇON PROPOSÉE : aucune.
