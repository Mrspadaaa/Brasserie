# Voie l3 — relance des ouverts du 21.11

- BK4-1 | corrigé | 8ced536f0 | le code avait raison : un brassin ensemencé rouvre sur la clôture E4 (bloc « Levure » du brassin, maquette choisie p2c) ; le guide « Levure · » n'y est plus monté (`state.pitchedAt == null || isConsulting || displayRecipe`). Les 2 tests périmés suivent la clôture ; yeastPitchingExecution 11/11 verts. Limite : la déclaration explicite d'une quantité sur un historique sans quantité n'existe plus après l'ensemencement (`pitchEditor` absent quand `pitchedAt` est posé) : geste retiré par le port, non rétabli (BrewDayPage.tsx occupé et hors voie).
- BK4-2 | corrigé | 2e35d386b | « pas au stock » devient « non relié » dans « Ce qui manque » (BrewLaunchPanel.tsx), commentaires de brewLaunch.ts alignés ; test rouge avant (bugs-l3-bk4-2), vert après. Limite : BrewLaunchManque n'a aucun importeur dans src/ : pas de capture possible dans l'app, preuve par rendu Testing Library.
- LEV-11 | corrigé | 10126f15b | « valeur · à confirmer · Retenir · Écarter » tient sur une ligne (CSS de la cellule pleine largeur de Ma levure). Contrôle banc/lev11.mjs : 2 lignes avant (clair et cave, 390), 1 ligne après (390 et 1280, clair et cave : capturer.mjs, « lignes = 1 » ×4). Captures avant/après ouvertes.
- LEV-8 | ouvert | — | hors voie : BrewWizard.tsx (rendu complet du wizard à chaque écriture de la recette), src/pages/recipe-wizard.css (5 835 règles : un recalcul de style de ≈ 700 éléments coûte jusqu'à 190 ms à CPU ×4), src/ui/YeastRecipePlan.tsx (glisser de palier). Gain en zone : onglet Chercher/Comparer/Suggérer mis en différé (commit d2b89e108). Mesures ci-dessous.
- T2B-3 | corrigé | cd1d3262b | même constat que T4-6 (index d'identité des 1 734 fiches reconstruit à chaque montage, 86 % du profil), corrigé par cd1d3262b ; source inchangée depuis (git log). Mesure ici (build de production local, 390 tactile, CPU ×4) du retour Paliers → Levure : 232 ms (avant) et 280 ms (après), contre 8 s relevés en ligne avant la correction ; bruit ≈ ±50 ms. Reste au-dessus de 100 ms (montage complet de l'étape). Note : tests/unit/t46levureRetour.test.ts (seuil 400 ms) a donné 520 ms en passage sous charge machine (3 sessions + Chrome) : seuil dépendant de la machine, pas de régression de source.

## Mesures LEV-8 (Event Timing, pire durée entrée → image, ms ; CPU ×4 ; une passe propre chacune)
| geste | avant (HEAD) | après d2b89e108 |
|---|---|---|
| frappe « Andechs » / « Munich Lager » | 112 / 64 | 104 / 56 |
| choix Andechs / Munich | 168 / 568 | 136 / 248 |
| caler / rétablir | 136 / 48 | 152 / 56 |
| ouvrir dose / fermer | 48 / 16 | 96 / 24 |
| ouvrir Repères / fermer | 240 / 56 | 64 / 24 |
| glisser température / durée | 96 / 152 | 120 / 96 |
| retour Paliers → Levure | 232 | 280 |
| onglet Chercher / retour Ma levure | 224 / 40 | 48 / 96 |

Encore > 100 ms : choix d'une tuile (248, un EventDispatch de ≈ 260 ms = rendu du wizard, puis UpdateLayoutTree 192 ms), caler (152), glisser température (120), retour d'étape (280). Les écarts avant/après de ±50 ms sont du bruit (une seule passe propre ; deux passes d'« après » ont été polluées par une autre charge et écartées). Fichiers : voies/l3/mesures/*.json et *.txt (profil, trace), banc/ (vite.banc.config.mjs, mesure.mjs, profil.mjs, trace.mjs, lev11.mjs, capturer.mjs).

Tests : `npx vitest run tests/integration/etapeLevure tests/unit/bugs-l3-bk4-2.test.tsx tests/unit/brewLaunch.test.ts tests/integration/yeastPitchingExecution.test.tsx --reporter=dot --maxWorkers=3` → 19 fichiers, 153 passés, 0 échoué (tests.txt).
Captures (voies/l3/captures/, toutes ouvertes sauf chercher-apres-1280-cave.png, prise mais non ouverte) : lev11-avant-390-clair/cave (« Écarter » seul sur la 2e ligne), lev11-apres-390 et 1280 clair/cave (une ligne, texte lisible, boutons Retenir et Écarter à côté de « à confirmer »), chercher-apres-390 clair/cave et 1280 clair (vue Chercher rendue, segment « Chercher » actif, Ma levure masquée). Doute : « Retenir » et « Écarter » sont à 12 px de corps, hauteur tactile 28 px conservée mais largeur ≈ 40 px.

DÉCISION À PRENDRE : LEV-8 — passer le rendu complet du wizard (BrewWizard.tsx) et la mise en page globale (recipe-wizard.css) à un autre auteur ; recommandation : une voie dédiée « fluidité du wizard » avec le banc banc/mesure.mjs (build de production local, CPU ×4), cible 100 ms au choix d'une tuile.
CONNAISSANCE : un brassin ensemencé rouvre sur la clôture E4 ; il n'y a plus de déclaration de quantité réelle après l'ensemencement.
LEÇON PROPOSÉE : un test de rendu périmé par un port de maquette choisie se réécrit contre la maquette (le code a raison) ; le diagnostic commence par le DOM réel (DEBUG_PRINT_LIMIT).
REPRISE (si besoin) : ouvrir chercher-apres-1280-cave.png ; lancer `node work/missions/2026-11-19-bugs-ecrans/verdicts.mjs l3` et `--tests`.
