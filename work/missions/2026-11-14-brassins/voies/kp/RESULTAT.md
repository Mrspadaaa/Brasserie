ECHEC — rejeté : 39 problèmes dont 21 bloquants ; e11a non portée (cartes, puces, + nommé, menu), e1a/e2a/e4c avec éléments de sa maquette absents

- **e1a** (Préparer, planifié) — REJET : « Reporter » invisible à 1280, 3e jour proposé absent, « Estimer le budget de ce brassin » sur 3 lignes, graduations « di 15lu 16 » collées (règle n° 1, D105 ; L03). Phrase prédite : « Le bouton Reporter est noir sans rien dedans, et il manque mon lundi proposé. » Correction : VERDICT.md § e1a 1 à 4 ; relance auteur Sonnet sur p1.
- **e2a** (fiche par état) — REJET : FG confirmée sans « ✓ FG », carnet du terminé sans puces ni lignes ✎, « Rebrasser » remplacé par « Fermer », dossier d'annulé refait (règle n° 1, D105 ; L03). Phrase prédite : « Où est mon Rebrasser ? Et pourquoi il dit encore pas stable alors que j'ai confirmé ? » Correction : VERDICT.md § e2a 1 à 4 et 6 ; relance auteur Sonnet sur p1.
- **e4c** (échelle des étapes) — REJET : dates des marches absentes, « ≈43L en cuve » faux après répartition, palet non glissable, flèche rouge du retour absente, barre de répartition perdue (règle n° 1, D105 ; L14 chiffre). Phrase prédite : « Il reste pas 43 L dans la cuve si j'en ai mis 22 en fût. » Correction : VERDICT.md § e4c 1 à 5 ; relance auteur Sonnet sur p1.
- **e7a** (bilan) — REJET : « ‹ Le bilan » absent, barre de la liste au-dessus du bilan (surtout à 1280) (règle n° 1, D105). Phrase prédite : « Le bilan est bon, mais pourquoi j'ai toute la barre de recherche au-dessus ? » Correction : `onBack` et `onFolder` dans `ProductionCatalog`, vue Bilan sans barre de liste ; relance auteur Sonnet (hors Possède de p2).
- **e10c** (Adapter les volumes) — ACCORDÉ : un seul écart mineur (décimales des pastilles d'écart). Phrase prédite : « Ça c'est ma page. » Correction : deux décimales sur « +0,20 kg ».
- **e11a** (coque Brassins / Recettes) — REJET : seule la phrase est portée ; cartes brassin et recette, puces « Tous · en cuve · en retard » et « Toutes · À cru », + nommé, menu du + (Outils houblons) absents (règle n° 1, D105 ; L03). Phrase prédite : « C'est l'ancienne liste avec un titre rouge par-dessus. » Correction : VERDICT.md § e11a 1 à 5 ; relance d'un port des cartes e11a et de `FloatingActions` (ACCORD p3).

Critères : G1 `VERDICT OK` (tests.txt). Captures : 104 de l'app ouvertes, en planches côte à côte avec les 24 PNG de maquette (montage puppeteer dans le scratchpad, aucun fichier hors kp/).

Captures plus anciennes que le dernier changement : les 54 de p1 précèdent les changements de p4 (18:00, 18:01) ; défauts de ces zones non comptés (voir VERDICT.md).

DEMANDE EXECUTANT :
1. `node scripts/with_server.mjs --server "npm run dev -- --port 3101 --strictPort" --port 3101 -- node work/missions/2026-11-14-brassins/voies/p1/banc.mjs` (fixture ZZ-004 et ZZ-005 aux dates JJ.MM.AAAA ; attendu `BANC OK 54 captures`, 0 geste sans effet).
2. Ajouter au banc p1 et p3 les captures 1280 cave, et pour p3 les 390 cave de geste, trop, refuse, vide, recettes.
3. Ouvrir : `p1/captures/e2a-termine-app-390-clair.png` et `e4c-retour-app-390-clair.png` (plus de « 2026- »), `e2a-annule-app-390-clair.png` (tête après p4).

LEÇON PROPOSÉE : un port d'écran choisi se découpe par éléments de la maquette (cartes, puces, boutons nommés, menu), pas par « coque » : p3 a rendu la phrase de e11a et gardé les anciennes cartes, et son RESULTAT ne listait pas les cartes parmi les écarts.
