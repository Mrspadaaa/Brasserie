# Voie rv-uxui-recettes — Revue UX/UI : Recettes (séries v0 r1, r2)

- Mission : 2026-11-14-brassins · Agent : critique · Modèle : opus (Fable interdit) · Niveau : jugement · Plafond : 35 tours · Dépend de : r1, r2 · Décideur : pilote

## Objectif
Ses mots (15.11) : « Créer : aucune · … · Recettes : aucune · … Refait pour celle aucune... Ça resoud aucune de mes problématique ». Le pilote
demande quatre revues (artiste, brasseur, UX/UI, critique) des 8 maquettes v0 de « Recettes ». Celle-ci : Analyse UX/UI : charge le skill `boosters-ux` (et `impeccable` au besoin) ; hiérarchie, premier plan, gestes comptés, états, saisie au téléphone, cibles, coup d'œil ; Nielsen en bref.

## Entrées
- Ses problèmes : `work/missions/2026-11-14-brassins/voies/a2/PROBLEMES.md` § Recettes. 
- Maquettes : `work/missions/2026-11-14-brassins/voies/r1/r1[a-d]/`, `work/missions/2026-11-14-brassins/voies/r2/r2[a-d]/` (PNG et NOTE.md ; ne lis pas les etat.html). Ses choix autour : `work/missions/2026-11-14-brassins/voies/e6/e6a/`, `work/missions/2026-11-14-brassins/voies/e1/e1a/` (repos).

## Possède (seuls chemins où écrire, avec RESULTAT.md)
- `work/missions/2026-11-14-brassins/revue-v0/recettes-uxui.md` et `work/missions/2026-11-14-brassins/voies/rv-uxui-recettes/` (`RESULTAT.md`, `tests.txt`).

## Consignes
- Ouvre chaque image une fois. `work/missions/2026-11-14-brassins/revue-v0/recettes-uxui.md` : une section `## <id>` par maquette (r1a, r1b, r1c, r1d, r2a, r2b, r2c, r2d), 80 mots au plus chacune, finie par
  `Verdict : GARDER|CORRIGER|ÉCARTER` ; puis `## Classement` (les 8, une ligne chacune) et `## Greffes` (ce qu'il faut prendre où).
- Vers 150 k de contexte, écris ce qui est jugé et rends « REPRISE : work/missions/2026-11-14-brassins/revue-v0/recettes-uxui.md ».

## Exigences transversales et acquis (recopiés, leçons L05 et L06)
- Identité de l'app ; saisie au curseur ; inconnu dit en mots ; cibles ≥ 44 px ; deux thèmes ; 390 et 1280. Fable interdit.

## Critères
`work/missions/2026-11-14-brassins/voies/rv-uxui-recettes/GATES.md`, depuis la racine du dépôt.

## Rendre
- `RESULTAT.md` tenu au fil (tous les 5 éléments).
- La ligne « Tests » écrite dans un fichier : aucune suite Vitest ; `tests.txt` porte la sortie des CHECK, au même format que `--reporter=dot > …`.
- Voie d'écran : les captures, toutes ouvertes.
Réponse finale au pilote : une ligne.
