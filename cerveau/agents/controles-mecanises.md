---
name: controles-mecanises
description: Leçons devenues contrôles et sorties de LECONS.md (plafond de 8 lignes, M11, M12, M14 sortis le 24.10) ; leur contrôle bloque seul, la ligne garde le pourquoi.
type: agents
maj: 2026-10-24
sources: cerveau/LECONS.md (section Mécanisées, avant l'élagage du 22.10)
---

Une leçon mécanisée est tenue par son contrôle : elle n'a plus besoin d'être chargée à chaque session.
LECONS.md en garde 8 au plus, les plus utiles pour planifier ; les plus anciennes viennent ici, lues à la
demande (`systeme.mjs chercher <mots>`). Si le défaut revient malgré le contrôle, la ligne remonte dans
LECONS.md en leçon active.

- M01 — Valeurs brutes à l'écran (low, medium, null…), revenues trois fois : `controle-valeurs-brutes.mjs` (D97, dans controle-commun).
- M02 (L21) — Un hook s'essaie sur les vraies entrées de l'app : le 22.10, le hook de correction a réagi à la notification d'un conseiller. Témoin « notification d'agent » dans `systeme.mjs temoins`.
- M03 (L15) — Un monkey test voit les champs (`value`) et la console (`console.error`) : `tests/integration/monkey.test.tsx`, détail dans [[monkey-testing]].
- M04 (L22) — Condenser une source sans perdre : le 22.10, 51 citations et nombres perdus à la première condensation de deux sources de 330 à 350 lignes (voie Haiku). Lancer `systeme.mjs fidelite <source> <notes…>` ; au-delà de 150 lignes, prévoir plusieurs notes.
- M05 (L23) — Un critère et ses témoins vivent dans des fichiers versionnés : le 22.10, le contrôle de la planche r4 et son témoin, écrits d'abord dans `work/missions/…/voies/`, étaient ignorés par git (seuls .md et .json y sont suivis), comme les pages HTML sous `work/refonte-frontend/`. Contrôles dans `tournoi/outils/`, pages témoins dans `tournoi/outils/temoins/` ; `systeme.mjs voies` refuse un script de CHECK ignoré (témoin « critère ignoré par git »).
- M07 (L08) — Vérifier les entrées avant l'éventail : le 20.10, 33 variantes sur un moteur à un mauvais taux d'alcool ; le 22.10, le contrôle des entrées comptait les groupes `{ source, mots[] }` au lieu des mots (lire une entrée réelle avant d'écrire une formule). `npm run check:engine` et `controle-entrees-lot22.mjs` (D102). Tracer une fois la représentation obligatoire sur les vraies données (des « haut » hors domaine ont saturé le radar, D103), et calculer l'écart qu'un aperçu montrera avant de le dessiner (r6n2 : Pomona ≈ 0).
- M08 (L09) — Chaque chemin cité existe : le 22.10, un brief citait `scripts/profil-simule-cas.ts` au lieu de `prototypes/houblons-v4/scripts/`. `systeme.mjs mission` vérifie les sources de MISSION.md ; passer les chemins des VOIE.md par Glob.
- M09 — Planche de picto : quatre refus du picto « épicé » au 22.10. `controle-planche-picto.mjs` (D101), rien sous 12 px. La lisibilité n'est pas mesurée : nommer chaque picto sur une loupe en vrais pixels ([[pictos-familles]]).
- M06 (L06) — Les acquis validés passent d'un lot au suivant : le radar a disparu du lot 21. Liste dans [[acquis-valides]], recopiée dans chaque brief ; `controle-acquis.mjs` (D99).
- M15 — Un contrôle partagé ne se durcit qu'en rejouant ses appels : le 23.10, `verifier-page.mjs` a reçu les règles de lisibilité des pages de lot ; 23 voies du lot 21 l'appelaient sur leurs maquettes (`etat.html --min-images 0`), et le rejeu est tombé à 40 voies en échec sur 63. Le pilote n'avait pas cherché qui l'appelait. Les règles passent sous `--page-lot` ; `systeme.mjs appels <script> --rejouer` rejoue tous les critères qui appellent un script, et le hook cerveau le rappelle à chaque écriture d'un script de contrôle appelé (témoins « appels… », « contrôle durci qui casse un appel »).
- M11 (L16) — Tout livrable d'agent est un fichier du dépôt : `JURY-VERDICT.md` annoncé, jamais produit. `systeme.mjs voies` rejoue les critères de chaque voie au lieu de croire son rapport.
- M12 — Une variante rejetée est relancée ou écartée ; des écrans ne sont finis qu'une fois publiés, chaque version dans un artefact neuf et lisible (22.10 : 6 rejets en plan ; 23.10 : « chaque version devrait en créé des nouveaux »). `systeme.mjs voies` (« ## Pages »), `verifier-page.mjs`.
- M14 — Un panel v0 vaut le lot 21 avant d'être trié : le 23.10, 56 concepts « minimalistes » (5 tours chacun, un squelette commun) étaient « vraiment moins quali », et 32 pictos sur 48 restaient sur ses exemples. Minimaliste = une idée, pas un écran vide ; la baseline est un vocabulaire, pas un gabarit ; ses exemples, un tiers du panel au plus. `controle-panel.mjs` (PANEL OK), exigé par `systeme.mjs mission` dans chaque tri. Le 24.10 (sept voies) : il ne voit ni les écarts sous 60 au fond ni un bloc commun à une série ; dire le seuil au brief, une masse propre par concept, et le jouer dès le premier concept.
- M01 (complément, 24.10, fl-tri) — Le brief d'une série v0 cite D97 : `controle-valeurs-brutes` entre dans ses GATES et se rejoue sur le texte rendu, pas sur la NOTE.
