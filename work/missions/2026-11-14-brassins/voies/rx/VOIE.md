# Voie rx — Recettes : les quatre retenues, corrigées d'après les quatre revues

- Mission : 2026-11-14-brassins · Agent : concepteur · Modèle : opus (Fable interdit) · Niveau : conception · Plafond : 45 tours · Dépend de : revues v0 · Décideur : brasseur

## Objectif
Ses mots (15.11) : « … Refait pour celle aucune... Ça resoud aucune de mes problématique ». Quatre revues (artiste, brasseur, UX/UI,
critique) ont jugé les 8 maquettes v0 de « Recettes ». Le pilote retient r1a, r2a, r1c, r1d (accord des classements, diversité de genre).
Corriger chacune d'après les quatre revues, appliquer les greffes utiles, sans changer son genre.

## Entrées
- `work/missions/2026-11-14-brassins/revue-v0/recettes-artiste.md`, `recettes-brasseur.md`, `recettes-uxui.md`, `recettes-critique.md` : sections r1a, r2a, r1c, r1d, `## Greffes`. Les [B] de la critique d'abord.
- `work/missions/2026-11-14-brassins/voies/a2/PROBLEMES.md` § Recettes (numéros cités par les revues).
- Greffe proposée par le regard Brasseur : r2a × r1a (la lignée avec « prête ou il manque ») ; chiffre faux de r2a : il manque 250 g de Citra pour la NEIPA (100 g du stock réservés au LOT-019). Ses choix autour, tels quels (règle n° 1) : coque e11a `work/missions/2026-11-14-brassins/voies/e11/e11a/`.

## Possède (seuls chemins où écrire, avec RESULTAT.md)
- `work/missions/2026-11-14-brassins/voies/r1/r1a/`, `work/missions/2026-11-14-brassins/voies/r2/r2a/`, `work/missions/2026-11-14-brassins/voies/r1/r1c/`, `work/missions/2026-11-14-brassins/voies/r1/r1d/` et `work/missions/2026-11-14-brassins/voies/rx/` (RESULTAT.md, tests.txt). Rien dans `src/`. Ni commit ni stash.

## Consignes
- `RESULTAT.md` : une ligne cochée `- [x] <id> : <correction>` par défaut [B] de la critique et par point retenu des trois autres revues.
- Régénérer toutes les images de chaque retenue par le `capture.mjs` de sa série (mêmes noms), les ouvrir (Read) une fois.
- Mettre à jour NOTE.md (Ce qui change, Geste, Problèmes résolus).
- Économise le contexte : revues par sections (grep -n « ## <id> »), etat.html par sections.

## Exigences transversales et acquis (recopiés, leçons L05 et L06)
- Identité de l'app (contrôle d'identité OK) ; saisie au curseur, jamais `type="number"` ; chiffres à la virgule ; inconnu dit en mots ;
  cibles ≥ 44 px ; clair et cave ; 390 et 1280 ; données de BRIEF-AUTEUR et DONNEES-COMMUNES. Fable interdit.

## Critères
`work/missions/2026-11-14-brassins/voies/rx/GATES.md`, depuis la racine du dépôt. Ne pas le modifier.

## Rendre
- `RESULTAT.md` tenu au fil (tous les 5 éléments) ; vers 150 k, « REPRISE : RESULTAT.md ».
- La ligne « Tests » écrite dans un fichier : aucune suite Vitest ; `tests.txt` porte la sortie des CHECK, au même format que `--reporter=dot > …`.
- Voie d'écran : captures 390 tactile et 1280, clair et cave, toutes ouvertes.
Réponse finale au pilote : une ligne.
