# Bugs de la passe 2 (21.11) — WF2-n

Banc : build de test de `git archive HEAD` de port-carnet (aaecde10f), fixture `passe2/fixture-passe2.mjs` (ZZ TEST), 390 tactile,
CPU ×4 (tours en parallèle : temps majorés). Rejeu : `node passe2/pas2.mjs passe2/pas/<fichier>.txt <nom>`. Déjà connus et non recopiés :
WFA-1 (« rien cette semaine »), WFA-2 (seuil NaN), WFV-6 (pas de produit fini), B11 (Conditionnés 0 dans Brassins), B2 (levure nommée).

| # | Gravité | Chaîne | Constat (mesuré) | Rejeu | Règle |
|---|---|---|---|---|---|
| WF2-1 | bloquant | jour de brassage | compagnon de B-ZZ-JOUR, 1er « Terminer et continuer » (Eau et sels, relevé dû) → « Écran indisponible · Impossible de charger cet écran » ; déstockage, OG et passage en fermentation jamais atteints (stock pilsner resté 60 kg). Levure liée au stock sans nom (B2 évité) : cause non lue, peut-être la même famille que B2 | `pas/jour.txt`, capture `captures/r6-j/01-compagnon.png` (avant) | R1 |
| WF2-2 | gêne | fermentation | « Dry hop : jour à fixer » écrit sur la feuille de mesures et rien ne le fixe (aucun bouton, ni au Dossier) ; 200 g de Citra « à cru » sans jour | `pas/dh.txt` | R1, R3 |
| WF2-3 | lenteur | brassin | ×4 : onglet Dossier INP 496 à 600 ms, Budget 360 ms, « Commencer le brassage » 384 à 496 ms, ouverture d'une fiche d'étalonnage 408 ms (> 200 ms). Profiler seul avant correctif (L20) | `pas/cout.txt`, `pas/j2.txt`, `pas/ent.txt` | R4 |
| WF2-4 | lenteur | recherche | ×4 : INP 552 ms pendant la frappe de « Cigogne » (15 interactions) ; résultats justes (client et 3 ventes) | `pas/q.txt` | R4 |
| WF2-5 | grave, à confirmer en production | hors ligne | réseau coupé : Brassins « Impossible de charger cet écran » (morceau d'écran non chargé) ; rechargement hors ligne = page d'erreur de Chrome. `public/brew-alerts-sw.js` ne met rien en cache, `vite.config.ts` sans précache : le même défaut est probable en ligne. À rejouer en lecture seule sur l'app déployée (mode avion après un premier chargement) | `pas/off.txt` | « préserver le hors ligne » (CLAUDE.md) |
| WF2-6 | gêne | entretien | Densimètre prévu le 07.11 et pH-mètre le 15.11, tous deux « À traiter » dans Matériel ; le Bord dit « Agenda 0 à faire · Aucune tâche prévue » | `pas/ent.txt`, Bord de `pas/e1.txt` | R1 |
| WF2-7 | texte | client | fiche client : « Dernière vente 2026-11-05 » en ISO | `pas/cl.txt` | R5 |
| WF2-8 | casse la chaîne coût | coût et marge | Budget de B-ZZ-FERM : « ? CHF/L », « Coût du brassin pas encore chiffré » alors que pilsner (1,6/kg), Citra (0,09/g) et US-05 (4,5) ont un prix au stock ; marge illisible | `pas/cout.txt` | R1, R8 |
| WF2-9 | à confirmer | conditionnement | Conditionner 40 L remplit F-005 et F-006 (pleins, lot posé) mais le brassin reste « Garde froide » (« le déstockage est refusé ») : fûts pleins d'un lot encore en garde. Le stock du brassage n'était pas sorti dans la fixture (cas réel si le déstockage a été sauté) | `pas/k.txt` | R1 |

Gestes contournés : aucun dans une chaîne mesurée. L'état de départ (brassin démarré, recette complète) est posé dans la fixture pour passer B1 et B3.
