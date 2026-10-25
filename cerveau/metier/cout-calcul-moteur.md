---
name: cout-calcul-moteur
description: Temps mesuré de simulerCas (léger et complet) sur le cas stout, sur un ajout, et sur tout le catalogue (318 houblons) — base du choix de calcul dans le navigateur.
type: metier
maj: 2026-10-25
sources: scripts/bench-hop-v4.ts (banc du 25.10, fabrique creerMoteur) ; work/missions/2026-10-25-integration-houblons/voies/t5-causes/RESULTAT.md ; src/domain/hopIndex/v4/profil-simule.ts (simulerCas ; déplacé le 25.10 depuis prototypes/houblons-v4/src/engine) ; prototypes/houblons-v4/scripts/profil-simule-cas.ts ; prototypes/houblons-v4/src/pack/buildPack.ts (s1Recipe, S1_TASTING) ; prototypes/houblons-v4/src/engine/index.ts ; work/refonte-frontend/v4/ecran-1/fils21-choisir/donnees/PROFIL-SIMULE.md ; work/refonte-frontend/v4/ecran-1/fils21-choisir/donnees/profils-simules.json ; annexe work/missions/2026-10-22-reprise-lot21/voies/r2-cout-calcul/ANNEXE.md (script bench.ts, sortie brute)
---

Mesure du moteur de simulation, sans modifier le moteur ni les données. Léger = `complet: false` (grille) ; complet = `complet: true` (drapeaux et parJour). Détail, script et sortie brute : ANNEXE.md de la voie r2-cout-calcul.

**Mesures** (médiane ; p95 ; max ; en millisecondes, 30 répétitions après 5 appels de chauffe)
- Cas stout, un ajout (Citra 4 g/L, dry hop après fermentation, US-05) : léger 0,167 ; 0,236 ; 0,255. Complet 3,94 ; 4,11 ; 5,74.
- Cas stout, deux ajouts (Citra 2 g/L puis Galaxy 2 g/L, dry hop après fermentation) : léger 0,092 ; 0,112 ; 0,116. Complet 5,19 ; 6,00 ; 6,10.
- Même ajout, dose changée à chaque appel (cache interne vide) : léger 1,42 ; 1,50 ; 1,53. Complet 3,92 ; 4,27 ; 5,62.
- Catalogue (318 houblons × 5 moments = 1590 cas, 4 g/L, US-05) : complet, balayage médian 7 961 ms (p95 8 301 ; max 8 382), par cas médiane 4,6 ms (p95 5,5 ; max 8,7). Léger, balayage médian 165 ms (p95 191), par cas médiane 0,091 ms.
- Catalogue léger, autres levures (balayage médian) : Verdant 157 ms ; Pomona 162 ms ; Diamond 159 ms. Les 4 levures : 643 ms au total.
- Premier balayage (cache vide) : léger US-05 1 239 ms ; complet 8 346 ms ; les 3 autres levures léger 2 444 à 2 595 ms.
- Variante d'écran (un houblon × 5 moments × 4 levures, léger) : médiane 1,81 ms (max 2,00). Un houblon × 5 moments, complet, US-05 : médiane 24,1 ms (p95 24,8 ; max 37,1).

**Conditions**
- Node v24.19.0 ; Intel Core i5-14600KF (20 cœurs) ; RAM 15,8 Go ; Windows 11 ; 2026-10-22.
- 30 répétitions par cas et par balayage ; 1 balayage de chauffe pour le catalogue (non compté).
- Le cache interne (`cacheBase`) fausse les mesures répétées : léger, un ajout passe de 1,42 à 0,17 ms. Les balayages mesurés sont à cache chaud ; le premier balayage est le froid.
- Taille de `profils-simules.json` : 1 800 628 octets (1,8 Mo). Le coût de la grille (script profil-simule-cas.ts) n'a pas été chronométré.

**Conclusion** (faits mesurés sur ce PC)
- Un cas : 0,1 à 0,2 ms en léger si l'entrée est déjà en cache, 1,4 ms sans cache (un geste qui change la dose) ; 4 à 6 ms en complet.
- Une variante d'écran (un houblon, 5 moments, 4 levures) : 1,8 ms en léger ; 24 ms en complet pour 5 moments.
- Tout le catalogue : 0,16 s par levure en léger (0,64 s pour 4 levures, cache chaud, 8,8 s au premier passage) ; 8,0 s en complet (une levure).
- Hypothèse, non mesurée : un téléphone est 4 à 6 fois plus lent que ce PC. Alors : une variante complète ≈ 100 à 150 ms ; le catalogue complet ≈ 32 à 48 s ; le léger 4 levures ≈ 2,6 à 3,9 s.
- Reste à mesurer sur un vrai téléphone (navigateur, cache froid, batterie) : le facteur de vitesse réel, le coût de la grille, et le coût de chargement de `profils-simules.json`.
- Décision du pilote (22.10, réversible, MISSION 2026-10-22-reprise-lot21) : le repli « dry hop et biotransformation seulement si trop lourd » est levé pour les écrans. Une variante se calcule en direct dans le navigateur, sans serveur. Seul le balayage complet du catalogue (8 s) reste hors du direct : Suggestions classe en léger ou lit la grille précalculée. À revoir si un vrai téléphone dépasse 100 ms par geste.

**Mesures dans la maquette jouable** (Chrome, 24.10 ; voies p0, p2, p4, p8)
- Recalcul de Ma bière : 1,1 ms médian ; un geste 3,7 ms (24 ms au plus pour Suggérer et ses 9 candidats).
- `proposeVoies` à froid : 90 à 130 ms ; frise de Dryhopper : 40 ms à l'ouverture (30 `lireBiere`), puis 0,9 ms par cran.
- Préchauffer au repos fait passer les premiers touchers de Suggérer et de Substituer de 798 et 728 ms à 288 et 184 ms.
- Limites de ce que le moteur simule : [[moteur-parcours-limites]].
**Banc du 25.10** (`npx vite-node scripts/bench-hop-v4.ts -- --echelle=K --json`, jeu ×K construit par la fabrique ; même PC). Les balayages
complets du 22.10 ci-dessus sont périmés : le complet est environ 9 fois plus rapide depuis le 23.10 (ETAT-DES-LIEUX de l'intégration).
- ×10 (3 180 houblons, stock 160) : `substitutes` froid 82 à 86 ms (était 1 470), chaud 3,3 à 5,6 ms (était 43) ; `remplacants` 4,5 ms ;
  `comparer` 12 houblons 18 ms ; `lireBiere` 3,4 ms froid, 0,7 ms par entrée ; `suggerer` 154 ms froid, 125 ms par cran de dose (90 candidats).
- `proposer` ×10 froid ≈ 1,1 s (14 voies, 1 499 évaluées) : la fabrique voit tout le stock, l'ancien banc non. À tenir par T17 (#166) ou un worker (#171).
- Causes retirées : preuves documentaires sans cache (premier mot, `describeFamilies` refait), LRU qui supprimait et remettait à chaque lecture,
  `toLocaleString` à chaque appel. Un geste sur une recette reste sous 15 ms quelle que soit la taille du catalogue.
