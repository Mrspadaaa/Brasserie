ECHEC — PANEL : remplissage médian 0,50 < 0,55 ; G1–G3 verts, 5 variantes rendues

## Fichiers écrits
- `s2a/` à `s2e/` : `etat.html` (statique, classes préfixées, script en fonction immédiate), PNG, `NOTE.md` ; `capture.mjs` (puppeteer-core, 390 × 844 tactile DPR 2, 1280) ; `tests.txt`.

## Variantes
| id | chaleur | idée | images ouvertes |
|---|---|---|---|
| s2a | froide | La file du jour : « Maintenant » en tête, file datée ou à seuil, courbe en second (grammaire z1) | repos, geste (feuille m2 °C cuve 19,2), liste (par geste à faire), cave, 1280 |
| s2b | tiède | Le semainier : 7 jours de la cuve, consigne en marches, relevé en place | repos, geste (densité 1,016 au curseur OG → bande) |
| s2c | tiède | Le prochain jalon en grand : dry hop de demain, « Ajouté aujourd'hui » = date + déstockage | repos, geste (ajouté, le jalon 21 °C monte), liste (agenda de la brasserie) |
| s2d | chaude (B + A) | Les gestes posés sur la courbe, à leur jour ou à leur seuil ; couloir °C cuve | repos, geste (piste m2 en place), cave, 1280 |
| s2e | chaude (B + C) | Le fil fait / à faire : passé avec écart au plan, aujourd'hui encadré, avenir à boutons | repos, geste (densité 1,016 enregistrée) |

## Critères
- G1 : SERIE OK · G2 : ETATS OK · G3 : HORS OK (`tests.txt`).
- controle-panel (10 captures repos + geste) : médiane 0,50, 5 sous 0,50, ressemblance 0,82, doubles 0 % → PANEL ECHEC (remplissage seul ; diversité OK).
- controle-commun --profil=sans-houblons --sans=mots : non concluant, l'outil échoue à `page.goto` (controle-valeurs-brutes.mjs:26) sur ces pages ; probable attente réseau des polices Google.
- controle-choix : sans objet (aucune entrée brassins dans ecrans.json).
- Aucun `type="number"` au rendu (compté par capture.mjs : 0).

## Captures
`work/missions/2026-11-14-brassins/voies/s2/s2{a..e}/s2?-{repos,geste,liste}-390-clair.png`, `s2a|s2d-repos-390-cave.png`, `s2a|s2d-repos-1280-clair.png`.

## Prédiction
« s2d, là je vois ma cuve et ce que je dois faire au même endroit ; s2c pour le dry hop, mais le bas de l'écran est vide. »

DEMANDE EXECUTANT :
1. Dans chaque `etat.html`, remplir le bas du premier écran 390 (repos) : s2d (allonger la carte, `aspect-ratio:370/360`), s2b et s2e (lignes ≥ 60 px), s2a (rien sous le pied). Ou laisser au passe 2 (t1/p2).
2. `node work/missions/2026-11-14-brassins/voies/s2/capture.mjs`, puis `node work/refonte-frontend/v4/tournoi/outils/controle-panel.mjs work/missions/2026-11-14-brassins/voies/s2/s2?/*-repos-390-clair.png work/missions/2026-11-14-brassins/voies/s2/s2?/*-geste-390-clair.png` → attendu PANEL OK.
3. controle-commun : rejouer avec les polices locales (retirer le `<link>` Google ou le servir en local) → COMMUN OK attendu, recopier dans les NOTE.

DÉCISION À PRENDRE : aucune.
CONNAISSANCE : controle-commun échoue à la navigation sur une page autonome qui charge des polices Google (à confirmer).
LEÇON PROPOSÉE : aucune.
