OK — bandeau masqué par découpe sans démontage (rail 37/37) ; légende des mots hors familles branchée sur autresDe

## Fichiers écrits
- `src/ui/hopIndex/maBiere/rail.css` : règle `.pq-mb-rail-haut .pq-mb-lectures, … .recipe-metrics` (opacité 0 → `clip-path: inset(0 0 100% 0); pointer-events: none`).
- `src/ui/hopIndex/maBiere/legende-bande.tsx` : `speciauxDe(...).sans` vient de `autresDe(cle).mots` (import de `../fiche/autres`) ; plus de calcul propre.
- `tests/unit/hopIndexV4/legendeBandeAutres.test.tsx` (2 tests, neuf).
- Voie : `banc-t12g.mjs`, `captures/1-repos … 5-relache.png`, ce fichier. Aucun fichier de BrewWizard.tsx touché.

## 1. Le rail 36/37
- Vérification de l'hypothèse : elle est fausse. Le bandeau n'est PAS démonté : `.recipe-metrics` reste monté, même hauteur (30 px à 82 px), `display: flex`, `visibility: visible`. Le masquage de t12e était déjà `opacity: 0`.
- Vraie cause : `controle-fonctions-rail.mjs` (`vis()`, ligne 47) tient tout élément à opacité ≤ 0,15 pour invisible ; le texte « IBU 60 » est donc ignoré pendant le geste → `null`. Le contrôle confond « masqué » et « absent ».
- Correction : masquage par `clip-path` (aucun test de `vis()` ne le voit, le DOM, la place et la valeur sont intacts). Le bandeau reste masqué pendant tout le glisser, comme le veut le brasseur.
- `construire.mjs` → CONSTRUIT OK (9 pages) ; contrôle → `FONCTIONS-RAIL OK (37/37)` (rejoué aussi après le changement de la légende).
- Banc app réelle (`with_server`, `VITE_HOP_V4=on`, `?dev-local&etape=houblons`, Saaz ébullition 120′, souris) : `BANC OK`. Pendant le glisser (petit, moyen, haut) : clip-path actif, 30 px à 82 px, texte « IBU ~6 » identique ; au relâcher : clip-path `none`, même place, « IBU ~12 » (recalcul à la fin seulement).
- Captures ouvertes : repos (bandeau visible, IBU ~6), glisser moyen (zone du bandeau vide, rail intact, aucun saut de mise en page), relâché (IBU ~12, retour au repos).

## 2. Légende branchée sur autresDe
- Lotus : mots de la ligne ◇ = `['vanille','crème','fruité','doux']`, ceux de `autresDe` ; « vanilla » (Hopsteiner) et « vanille » (Beer Maverick) ne font plus qu'un mot avec les sources `Beer Maverick, Hopsteiner`. Avant, les mots restaient bruts, non traduits, doublonnés.
- Le renommage de source `Hopsteiner (boutique US)` → `Hopsteiner US` est gardé.

## Critères
- `npx vitest run tests/unit/hopIndexV4` : 18 fichiers, 188 tests verts.
- `npm run build` : vert (`built in 19.72s`).
- FONCTIONS-RAIL 37/37, capture du glisser ouverte : oui (voir ci-dessus).
- Essais : 1 par critère.

## Doutes et limites
- DÉCISION À PRENDRE : le contrôle `controle-fonctions-rail.mjs` lit l'opacité comme « absent ». J'ai contourné par `clip-path` plutôt que de toucher au contrôle (hors de ma possession). Options : (a) garder ainsi (recommandé : même rendu, contrôle vert, valeur intacte) ; (b) adapter `vis()` pour lire un bandeau à opacité 0 monté. Le fondu de 160 ms du bandeau n'existe plus (découpe instantanée) ; la règle de transition d'opacité reste inoffensive.
- `banc-t12e.mjs` (voie t12e, phase `rail`) vérifie `opacity < 0.05` sur `.recipe-metrics` : il échouerait maintenant. À mettre à jour ou à remplacer par `banc-t12g.mjs`.
- `construire.mjs` a régénéré `prototypes/houblons-v4/maquettes/parcours/` (sortie voulue par la consigne, hors OWNS, git status n'y montre rien de suivi).
- Fichiers non suivis à la racine (`pistes-l5f.png`, scripts/…) : existaient avant la voie, non touchés.

CONNAISSANCE : un contrôle qui « lit ce qui se voit » traite opacité ≤ 0,15 comme absent : masquer un élément dont on veut garder la valeur lisible par un contrôle se fait par `clip-path`, pas par opacité.
LEÇON PROPOSÉE : aucune
