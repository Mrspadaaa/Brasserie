# Voie cma — Comparer depuis la maquette jouable, série cma (quatre mini maquettes)

- Mission : 2026-10-23-maquette-parcours ; lot : `work/refonte-frontend/v4/ecran-1/fils25-comparer/BRIEF-AUTEUR.md` (à lire en entier)
- Agent : concepteur
- Modèle : opus
- Niveau : conception
- Plafond : 110 tours ; 3 essais par critère
- Étape : v0 ×4 (1 froide, 2 tiède, 1 chaude)

## Ton approche
Série cma : la base jouable presque intacte ; le moment se choisit sur ses propres étapes (60′ · 10′ · dry hop), les rangées et le radar suivent ; moins de texte ; hors 16D et huiles là où ils comptent.

## Tes variantes
cma1, cma2, cma3, cma4 ; chaleurs : une froide (1), deux tièdes (2, 3), une chaude (4). Une idée par variante ; les quatre diffèrent. La base est l'écran Comparer de la maquette
jouable (`prototypes/houblons-v4/maquettes/parcours-cmp-base/comparer/etat.html`, captures `work/refonte-frontend/v4/ecran-1/fils25-comparer/captures/base-jouable*.png`) ;
plancher à enrichir (L07). Chaque page se joue : un toucher sur un moment change ce qui est comparé ; ⇄, × et ＋ (recherche) marchent.

## Possède
`work/refonte-frontend/v4/ecran-1/fils25-comparer/cma[1-4]/**`, `work/refonte-frontend/v4/ecran-1/fils25-comparer/captures/cma[1-4]*`, `work/missions/2026-10-23-maquette-parcours/voies/cma/RESULTAT.md`. Scripts : `os.tmpdir()`.
Le contrôle `work/refonte-frontend/v4/tournoi/outils/controle-quand-comparer.mjs` est écrit en parallèle par la voie cm-quand : s'il manque encore à tes critères, finis tes
pages et rejoue-le ensuite.

## Exigences transversales et acquis (recopiés, leçons L05 et L06)
- Règle n° 1 ; L03 : la base d'une reprise est l'écran de la maquette jouable ; peu de texte au premier plan (≤ 100 mots) ; l'inconnu
  jamais 0 ; penser en brasseur ; pictos au trait (baseline) ; thème clair (D106) ; au style (D75).

## Critères
Dans `GATES.md`. Réponse finale : une ligne.
