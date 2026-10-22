---
name: cout-calcul-moteur
description: Temps mesuré de simulerCas (léger et complet) sur le cas stout, sur un ajout, et sur tout le catalogue (318 houblons) — base du choix de calcul dans le navigateur.
type: metier
maj: 2026-10-22
sources: prototypes/houblons-v4/src/engine/profil-simule.ts (simulerCas, l. 471-477) ; prototypes/houblons-v4/scripts/profil-simule-cas.ts ; prototypes/houblons-v4/src/pack/buildPack.ts (s1Recipe, S1_TASTING) ; prototypes/houblons-v4/src/engine/index.ts ; work/refonte-frontend/v4/ecran-1/fils21-choisir/donnees/PROFIL-SIMULE.md ; work/refonte-frontend/v4/ecran-1/fils21-choisir/donnees/profils-simules.json ; annexe work/missions/2026-10-22-reprise-lot21/voies/r2-cout-calcul/ANNEXE.md (script bench.ts, sortie brute)
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
