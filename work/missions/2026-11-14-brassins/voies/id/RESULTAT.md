OK — trousse identite.css + chrome.js + démo liste conforme, IDENTITE OK 1/1, deux thèmes

## Fichiers écrits (Possède seulement)
- `work/missions/2026-11-14-brassins/outils/identite/identite.css` : jetons des deux thèmes copiés de `src/theme/themes.css`
  (mêmes noms, mêmes canaux), EBC, pastilles de style, échelle (`id-display` 28/600 … `id-label` 12, `id-reading` mono 16/600
  et grande 28), rayons 10/16/24, boutons, panneau, carte de liste, pastille d'état, pastille de style, segments, puce,
  curseur m2 (repris de `brew-day.css` p2c), feuille, lecture, chrome de l'app. Zones de toucher à 44 px par `::after`.
- `.../identite/chrome.js` : fonction immédiate ; `?theme=`, en-tête (compactLayout), sous-onglets (courts < 640 px, grille à
  compteurs au-delà), barre du bas (5 entrées, Brassins active), bouton +, cadre de feuille, icônes lucide 1.39 en ligne (26).
- `.../identite/LISEZMOI.md` (40 lignes) ; `.../identite/demo/etat.html` (`?etat=repos` liste, `?etat=feuille` composants).
- `work/missions/2026-11-14-brassins/voies/id/tests.txt` : sortie des CHECK. Tests : aucune suite Vitest (rien dans `src/`).

## Critères (rejoués depuis la racine, tests.txt)
- G1 : `OK …/identite/demo/etat.html` → `IDENTITE OK 1/1`
- G2 : `TROUSSE OK`
- G3 : `HORS OK`

## Captures (ouvertes, côte à côte avec `a1-banc/captures/liste-remplie-390-*.png`)
- `.../identite/demo/demo-390-clair.png`, `demo-390-cave.png`, `demo-1280-clair.png`, `demo-1280-cave.png`,
  `demo-feuille-390-clair.png`, `demo-feuille-390-cave.png`.
- Même en-tête de 36 px (logo 28, nom 14, lune/soleil, loupe et menu à point), mêmes sous-onglets à cellules égales,
  même barre du bas (62 px par entrée, trait et fond production), même bouton + noir (clair) / paille (cave), mêmes gris
  #F5F5F5 / #DDD, mêmes pastilles d'état et de style, même action noire en clair et paille en cave.

## Écarts restants
1. Police : la capture du banc est rendue en police système (Source Sans 3 non chargée dans le banc) ; la trousse charge
   Source Sans 3 (Google Fonts), plus étroite. La trousse suit DESIGN.md, pas la capture.
2. Pastille de style : le bord 300/40 de BeerStyleTag est retiré (transparent) : invisible à l'œil sur le fond 400/40, et
   hors des jetons du contrôle (10 % hors palette avec lui). Les fonds Tailwind 400/40 restent (seuls hors jetons, ≤ 5 %).
3. Sous-onglets : rembourrage 2 px mesuré sur la capture (le code dit p-1 = 4 px).
4. Bouton « Atelier Houblons V5.5 » et bandeau « Compagnon hors connexion » du banc non repris (outils de dev).
5. Données honnêtes (BRIEF-AUTEUR) : volume de la Pils et volume visé de la Pale Ale absents du brief, donc non affichés ;
   compteur Recettes absent (non inventé).

Prédiction : « Ah là oui, c'est l'app » — il jugera d'abord l'en-tête et la barre du bas, identiques.

DÉCISION À PRENDRE : `controle-identite.mjs` ne connaît pas la palette des styles de bière (Tailwind 400/300, réservée par
DESIGN.md aux pastilles) ; une maquette qui montre plus de pastilles de style que la démo peut dépasser 5 % sans faute.
Ajouter ces 11 teintes à la palette admise (contrôle du pilote).
CONNAISSANCE : l'en-tête de l'app est rendu en compactLayout (36 px, logo 28, commandes 28) et non h-12 ; la barre du bas
réserve une case de 76 px à droite pour le bouton + au téléphone.
LEÇON PROPOSÉE : aucune
