# Passe vision 7, 390 tactile (18.11), carnet porté

Worktree : `C:/Users/mrspa/.codex/worktrees/openai-clean-start/port-carnet`, branche `claude/port-carnet-1711`, HEAD du dernier commit (07:49:54). `dist/` était plus vieux que ce commit : `npm run build` relancé, exit 0.
Banc : `npm run dev` (Vite, port 5189, `--force`), `?preview=carnets&theme=clair|sombre`. Le banc est absent du paquet (MISSION, § Vérification, `vite preview` ne le sert pas), d'où le serveur de dev.
Environnement : `.env` absent du worktree ; variables `VITE_FIREBASE_*` factices passées en ligne de commande (projet `banc-factice`), émulateurs coupés. Le banc écrit en mémoire, rien n'est écrit dans Firestore. Données : fixture « ZZ TEST — … », IA simulée. Serveur arrêté après les captures.
Puppeteer-core et Chrome (`C:/Program Files/Google/Chrome/Application/chrome.exe`), viewport 390×844, DPR 2, `isMobile`, `hasTouch`. Gestes = `click()` JS sur l'élément (pas de `tap()` natif, sauf le champ, en `tap()`), saisie au clavier virtuel de Puppeteer (`keyboard.type`), Entrée pour envoyer.
Clavier réel non simulable en headless : l'état 39 est un redimensionnement du viewport à 300 px.

Captures : `vision-7/m390-<thème>-<nn>-<état>.png` ; 78 fichiers (39 clair, 39 sombre), dont 2 captures de contrôle par thème (38b, 50b) et un geste raté (46) qui ne montre pas d'état. Agit = image différente avant/après le geste (hachage md5 du PNG), pas une lecture visuelle.
Ouvertes et vues (14) : clair 22, 26, 27, 28, 36, 38b, 39, 50b ; sombre 07, 10, 11, 13, 18, 38, 41. Les autres sont capturées mais non ouvertes : elles ne valident rien.

## États (§ Vérification, 57 numéros) : 35 atteints, 22 non joués

| n° | état | fichiers | ce qui se voit (ouvert) | agit |
|---|---|---|---|---|
| 01 | liste repos | clair-01, sombre-01 | non ouvert | n/a |
| 02 | liste vide | clair-02, sombre-02 | non ouvert | n/a |
| 03 | créer avant (focus) | clair-03, sombre-03 | non ouvert | oui |
| 04 | créer pendant, carnet proche | clair-04, sombre-04 | non ouvert | oui |
| 07 | créer après | sombre-07 | bandeau « Carnet créé, en tête des Carnets · Annuler », phrase citée « votre phrase en titre », « Ce qui compte · Tient 80 °C · de votre phrase ». Pas d'encadré beige « Ensuite : l'IA cherche les façons » (critique n° 16 corrigé). Titre coupé « 80 / °C » | oui |
| 08 | créer après, Annuler | clair-08, sombre-08 | non ouvert | oui |
| 09 | carnet ouvert repos | clair-09 | non ouvert (sombre-10 montre le même carnet) | n/a |
| 10 | ajouter avant, bulle G8 | sombre-10 | bulle « Le critère « pas trop de bruit » peut … » au-dessus du champ, tronquée. « pas trop de bruit » est déjà affiché en Critère (critique n° 17 non corrigé). « Articles 6 ⌄ · Comparer › » sur une ligne (critique n° 8 corrigé) | oui |
| 11 | texte pendant, fond de bac | sombre-11 | cadre « ↓ va atterrir ici · tiré de votre phrase », « Ce qui compte : les articles seront rangés sur le fond de bac, 38 cm au moins ». Ligne verte qui répète la phrase, pas de conséquence distincte. Puces « Va dans » sur une rangée défilante, « Fa » coupée | oui |
| 13 | texte après | sombre-13 | « Rangé ici, à l'instant · Annuler ». La phrase devient une note (« Notes 1 »), pas un critère. Critères inchangés : « assez profond pour un fût · proposé par l'IA, puis 2 bacs ». Le « fond de bac » annoncé en 11 n'est pas un critère (critique n° 3 non corrigé) ; la phrase est citée deux fois (n° 14) | oui |
| 16 | lien pendant | clair-16, sombre-16 | non ouvert | oui |
| 18 | lien après (carnet créé depuis un lien) | sombre-18 | « Carnet créé, en tête des Carnets · Annuler », titre IA « Ventilation de la salle de brassage », carte « Hotte inox 140 cm + extracteur », photo = picto, veille éteinte, « lu sur la page : nom, prix, débit, tient 80 °C ». Le bandeau ne dit pas le rang (critique n° 12 non corrigé) | oui |
| 22 | note en vrac, pendant | clair-22 | « Nouveau carnet · Idée · ↓ arrive ici » ; toute la note devient un seul titre « Sachets de levure x2. Prochain brassage mardi. Tient 80 °C pour la hotte. » Pas de découpe en lignes ni en 2 carnets (critique n° 1 non corrigé) | oui |
| 23 | note en vrac, après | clair-23 | non ouvert | oui |
| 26 | article ouvert | clair-26 | fiche « Hotte inox 120 cm + moteur », grand picto à la place de la photo (critique n° 20 non corrigé), « 1re sur 4 » seul, « le débit 1 800 la plus haute des 4 », offre « Inox Broye · CH », veille éteinte, « Choisir · Inox Broye », « Part dans À venir » | oui |
| 27 | comparer, 2 articles | clair-27 | « Côte à côte 2 », colonnes 1re et 2e, meilleures valeurs en vert, « Compromis : la 1re… », « classées par tient 80 °C d'abord, puis le débit, puis le prix ». Accès par « Comparer › » (critique n° 4 corrigé) | oui |
| 28 | Choisir depuis Comparer | clair-28 | feuille Choisir : réglettes débit et prix (« 1er sur 2 », « 2e sur 2 »), critère, façon, fournisseur, « Pourquoi · proposé, à corriger : La seule à tenir 80 °C ; en stock, Inox Broye (CH). » (critiques n° 5, 6 et 21 corrigés sur ce cas) | oui |
| 29 | choix revu | clair-29, sombre-29 | non ouvert | n/a |
| 30 | À venir | clair-30, sombre-30 | non ouvert | oui |
| 31 | Réalisés | clair-31, sombre-31 | non ouvert | n/a |
| 34 | renommer | clair-34, sombre-34 | non ouvert (menu « Renommer » ouvert au toucher) | oui |
| 36 | supprimer idée sans lien | clair-36 | confirmation « Supprimer le carnet … ? Il part avec 6 articles, 2 façons, 1 façon écartée et 3 notes. La veille du prix… s'arrête. ni dans À venir, ni en commande ». « Supprimer » contour rouge allumé, « Garder » (D-47b à 0 lien, correct) | oui |
| 38 | supprimer, lien retient (menu seul) | sombre-38 | menu « Renommer / Supprimer l'idée » seulement ; geste incomplet. Sous le menu : pastille « À venir · ZZ TEST — Frigo de garde pour fûts » et « Dans À venir depuis le 16 nov. » : le lien est dit deux fois (critique n° 27 non corrigé) ; « Garder le plan » n'apparaît pas à ce stade. Table « °C » 43 et 38 sans libellé (critique n° 7 non corrigé) | oui |
| 38b | supprimer, 1 lien (Suppression v2) | clair-38b ; sombre-38b non ouvert | « Supprimer le carnet … ? Il part avec 4 articles, 1 façon, 1 façon écartée et 1 note. 1 lien le retient » ; « ZZ TEST — Frigo de garde pour fûts · plan dans À venir » ; « Garder le plan sans ce carnet » ; « Supprimer » en tirets, grisé ; « Garder ». Conforme à D-47b | oui (sur clair) |
| 39 | clavier simulé 300 px | clair-39, sombre-39 | champ « Ajouter à ZZ TEST… » reste visible au-dessus des onglets (CARNET-CLAV) | oui |
| 40 | IA en cours | clair-40, sombre-40 | non ouvert | oui |
| 41 | IA en échec | sombre-41 | « Carnet créé · Annuler » et « L'IA n'a pas répondu : rangé sur l'appareil, tel quel ; rien n'est perdu » ; la saisie est gardée (« Sachets de levure »). Message clair, pas de perte | oui |
| 42 | IA éteinte | clair-42, sombre-42 | non ouvert | oui |
| 43 | hors ligne | clair-43, sombre-43 | non ouvert ; le texte visible ne contient pas « Ranger maintenant » (critique n° 24 : à vérifier à l'œil) | oui |
| 44 | bouton photo | clair-44, sombre-44 | aucun changement visible (sélecteur de fichier invisible en headless) | non visible |
| 45 | bouton dicter | clair-45, sombre-45 | aucun changement visible (micro non disponible en headless) | non visible |
| 50 | archiver, plan réalisé | clair-50, sombre-50 ; 50b clair ouvert | 50b : menu « Renommer / Supprimer l'idée » sur « ZZ TEST — Embouteillage », « Choisi le 14 nov. », pastille « Réalisés · ZZ TEST — Embouteillage ». La feuille Archiver n'est pas ouverte : geste incomplet | oui |
| 51 | aides éteintes | clair-51, sombre-51 | non ouvert | n/a |
| 52 | comparer, 1 article | clair-52, sombre-52 | non ouvert | n/a |
| 54 | tâches chronométrées | clair-54, sombre-54 | non ouvert | n/a |
| 55 | pastille lié à | clair-55, sombre-55 | non ouvert (la pastille est visible en 38 et 38b) | n/a |

Non joués (22) : 05, 06, 12, 14, 15, 17, 19, 20, 21, 24, 25, 32, 33, 35, 37, 46 (libellé du + volant introuvable : capture sans geste, à ignorer), 47, 48, 49, 53, 56, 57 (calendrier : hors banc, `?dev-local` non joué).

## Problèmes CRITIQUE-6 (m390) : état à la capture

Corrigés sur ce qui est ouvert : 4 (Comparer à 390), 5 et 6 (Choisir, « 1er sur 2 »), 8 (articles et comparer sur une ligne), 16 (pas d'encadré « Ensuite » après création), 21 (pourquoi sans chiffres, sur ce cas), 33 (fil d'Ariane sur une ligne en 26), 36 (noms de cartes complets en comparer), 26 (placeholder coupé au mot, « Ajouter à Pompe… »).
Toujours présents : 1 (note non découpée, 22), 3 (critère annoncé ≠ appliqué, 11 → 13), 7 (43 °C sans libellé, 38), 12 (bandeau sans rang, 18), 14 (phrase citée deux fois, 13), 17 (bulle « pas trop de bruit » déjà affiché, 10), 20 (picto au lieu de photo, 26), 27 (lien dit deux fois, 38).
Non vérifiés (état non ouvert ou non joué) : 2, 9 (D-35, non joué), 10 (D-63, non joué), 11, 13, 15, 18, 19, 22, 23, 24, 25, 28, 30, 31, 32, 34, 35, 37, 39.

## Erreurs console

- Passe finale, clair et sombre : 0 erreur console.
- Passes précédentes (serveur de dev au cache optimisé périmé, 504 « Outdated Optimize Dep », puis « Invalid hook call ») : artefact du serveur de dev, pas de l'app ; corrigé par `--force` et un nouveau port. La page affichait « Impossible de charger la brasserie » sans les variables factices : le banc ne démarre pas sans elles dans ce worktree.

## Ce qui reste douteux

- Clavier réel : non simulé (redimensionnement seul).
- Photo et dictée : aucun effet visible en headless ; leur bon fonctionnement n'est pas vérifié.
- Lecture de 22 à 45 : la plupart des captures ne sont pas ouvertes ; un état non ouvert n'est pas validé.
- Scénario D-63 (zéro, frigo, ventilation, évier) : non joué ; une seule création depuis une liste vide (Pompe).
- Le fichier `scratchpad/vision7.cjs` d'une autre session (port 4418, 1280) a remplacé le mien pendant la passe ; j'ai travaillé avec `vision7-m390.cjs`.

VISION m390 35/57 états atteints (22 non joués), 78 captures (14 ouvertes), 0 erreur console.
