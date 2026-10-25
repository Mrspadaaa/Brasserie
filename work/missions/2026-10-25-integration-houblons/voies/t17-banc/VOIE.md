# Voie t17-banc — Jeu réaliste « beaucoup de données » et budgets bloquants (#166)

- Mission : 2026-10-25-integration-houblons
- Agent : auteur
- Modèle : sonnet
- Niveau : jugement
- Plafond : 80 tours ; 3 essais par critère
- Dépend de : t5-causes, t6b-async (faites)
- Décideur en cas de doute : pilote

## Objectif
Ses mots : « La fluidité, l'optimisation de code est très importante vu qu'il y aura beaucoup de données !! ». Verdict D65 : un
**contrôle bloquant** `scripts/check-hop-tools-perf.mjs`, sur un **jeu réaliste** (318 houblons, stock ×5, recettes et dégustations ×10,
snapshots répétés), qui échoue au-delà des budgets. Le ×10 du catalogue reste une mesure rapportée, non bloquante. Ce contrôle
décide la suite : s'il échoue sur un calcul fait sous le doigt, T7 (worker, #171) ou une optimisation ciblée.

## Entrées
- `scripts/bench-hop-v4.ts` (T5 : jeu ×K construit par la fabrique, sortie JSON) ; `src/domain/hopIndex/v4/` (fabrique, `client.ts`).
- `prototypes/houblons-v4/parcours/src/moteur/prechauffage.ts` (ce qui est préchauffé au repos) et les écrans qui appellent le client.
- `work/missions/2026-10-25-integration-houblons/voies/t5-causes/RESULTAT.md` (mesures), `voies/t6b-async/RESULTAT.md` (contrat).
- Budgets de l'épopée #159 : toucher ≤ 100 ms ; image d'un glisser ≤ 16 ms en médiane, 33 ms au 95e ; écran ≤ 2,5 s à froid ; ×4.
- `work/refonte-frontend/v4/tournoi/outils/mesure-performance.mjs` (le contrôle navigateur, pour l'extension à T12).

## Possède (seuls chemins où écrire, avec RESULTAT.md)
- `scripts/check-hop-tools-perf.mjs` (neuf), `scripts/bench-hop-v4.ts` (le jeu réaliste s'y ajoute), `tests/fixtures/hopV4-volume/` (neuf, si un jeu est figé)
- `package.json` : une ligne de script `check:hop-perf` seulement
- `work/missions/2026-10-25-integration-houblons/voies/t17-banc/`

## Consignes
1. **Classer chaque calcul par le moment où il tourne** (lire les écrans et le préchauffage, pas deviner) :
   - *sous le doigt pendant un glisser* (un cran de dose, de moment, de jours) : budget image, 16 ms ×4 → **4 ms** sur ce PC ;
   - *à un toucher* (ouvrir un outil, changer d'onglet), après préchauffage au repos : **25 ms** sur ce PC (100 ms ×4) ;
   - *au repos* (préchauffage) : découpé en tranches, chaque tranche ≤ **50 ms** sur ce PC, le tout avant la fin du premier écran
     (≤ 2,5 s ×4 → 625 ms sur ce PC) ;
   - le facteur ×4 est une hypothèse écrite (aucun vrai téléphone mesuré) : le contrôle l'affiche.
2. Le contrôle imprime une ligne par calcul (nom, moment, mesure, budget, OK ou DÉPASSÉ), puis `PERF-OUTILS OK` ou `PERF-OUTILS ECHEC (n)`.
   Il prend `--temoin=lent` (un délai injecté dans un calcul sous le doigt) qui doit échouer, et `--echelle=10` (rapporté, non bloquant).
3. Snapshots répétés : recréer le moteur sur des données identiques ne relance aucun calcul (empreinte des données) ; si la fabrique
   ne le permet pas encore, le contrôle le mesure et le dit (c'est T8, #169).
4. **Joue-le sur le moteur d'aujourd'hui et écris ce qui dépasse**, sans maquiller un budget pour passer. Ce verdict n'est pas ton
   critère : ton critère est un contrôle juste (OK sur un témoin rapide, ECHEC sur le témoin lent), et le verdict écrit.
5. Gemini jamais ; aucune donnée réelle ; ne modifie pas le moteur.

## Exigences transversales et acquis (recopiés, leçons L05 et L06)
- Mesurer avant d'affirmer, attribuer le temps à sa cause (L20) ; un critère n'imprime jamais son jeton sans condition (M10).
- Réactivité (D134, D138) : un lag déjà signalé qui revient compte comme un refus répété.

## Critères
Dans `GATES.md`, même dossier. Ne pas le modifier. Lancer chaque `CHECK:` depuis la racine du dépôt.

## Rendre
`RESULTAT.md` au format de l'agent, avec `## Verdict du moteur` (le tableau du contrôle sur le moteur d'aujourd'hui, calcul par calcul,
et ce que chaque dépassement demande : worker, préchauffage, optimisation). Écris-le tôt ; garde 15 tours pour les critères.
Réponse finale au pilote : une ligne.
