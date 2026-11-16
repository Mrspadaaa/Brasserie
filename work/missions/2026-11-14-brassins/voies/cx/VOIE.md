# Voie cx — Créer un brassin : les quatre retenues, corrigées d'après les quatre revues

- Mission : 2026-11-14-brassins · Agent : concepteur · Modèle : opus (Fable interdit) · Niveau : conception · Plafond : 45 tours · Dépend de : revues v0 · Décideur : brasseur

## Objectif
Ses mots (15.11) : « … Refait pour celle aucune... Ça resoud aucune de mes problématique ». Quatre revues (artiste, brasseur, UX/UI,
critique) ont jugé les 8 maquettes v0 de « Créer un brassin ». Le pilote retient c2a, c1d, c1c, c2c (accord des classements, diversité de genre).
Corriger chacune d'après les quatre revues, appliquer les greffes utiles, sans changer son genre.

## Entrées
- `work/missions/2026-11-14-brassins/revue-v0/creer-artiste.md`, `creer-brasseur.md`, `creer-uxui.md`, `creer-critique.md` : sections c2a, c1d, c1c, c2c, `## Greffes`. Les [B] de la critique d'abord.
- `work/missions/2026-11-14-brassins/voies/a2/PROBLEMES.md` § Créer un brassin (numéros cités par les revues).
- Ses choix autour, tels quels (règle n° 1) : liste e6a `work/missions/2026-11-14-brassins/voies/e6/e6a/` (la liste n'est jamais amputée : recherche, puces, cartes restent), fiche planifiée e1a `work/missions/2026-11-14-brassins/voies/e1/e1a/`.

## Possède (seuls chemins où écrire, avec RESULTAT.md)
- `work/missions/2026-11-14-brassins/voies/c2/c2a/`, `work/missions/2026-11-14-brassins/voies/c1/c1d/`, `work/missions/2026-11-14-brassins/voies/c1/c1c/`, `work/missions/2026-11-14-brassins/voies/c2/c2c/` et `work/missions/2026-11-14-brassins/voies/cx/` (RESULTAT.md, tests.txt). Rien dans `src/`. Ni commit ni stash.

## Consignes
- `RESULTAT.md` : une ligne cochée `- [x] <id> : <correction>` par défaut [B] de la critique et par point retenu des trois autres revues.
- Régénérer toutes les images de chaque retenue par le `capture.mjs` de sa série (mêmes noms), les ouvrir (Read) une fois.
- Mettre à jour NOTE.md (Ce qui change, Geste, Problèmes résolus).
- Économise le contexte : revues par sections (grep -n « ## <id> »), etat.html par sections.

## Exigences transversales et acquis (recopiés, leçons L05 et L06)
- Identité de l'app (contrôle d'identité OK) ; saisie au curseur, jamais `type="number"` ; chiffres à la virgule ; inconnu dit en mots ;
  cibles ≥ 44 px ; clair et cave ; 390 et 1280 ; données de BRIEF-AUTEUR et DONNEES-COMMUNES. Fable interdit.

## Critères
`work/missions/2026-11-14-brassins/voies/cx/GATES.md`, depuis la racine du dépôt. Ne pas le modifier.

## Rendre
- `RESULTAT.md` tenu au fil (tous les 5 éléments) ; vers 150 k, « REPRISE : RESULTAT.md ».
- La ligne « Tests » écrite dans un fichier : aucune suite Vitest ; `tests.txt` porte la sortie des CHECK, au même format que `--reporter=dot > …`.
- Voie d'écran : captures 390 tactile et 1280, clair et cave, toutes ouvertes.
Réponse finale au pilote : une ligne.
