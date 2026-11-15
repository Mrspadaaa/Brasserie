# Voie pg5 — Page « Brassins · tes choix et la suite »

- Mission : 2026-11-14-brassins · Agent : executant · Modèle : haiku · Niveau : mécanique · Plafond : 35 tours · Dépend de : gk, k6 (et ses corrections) · Décideur : pilote

## Objectif
Ses mots (15.11), mot pour mot : « s4a Tableau de cuverie, fiche dépliée s4a — s6c Conduite de z1, houblons en colonnes s6c — Dans
l'idéal mais s4a est beaucoup trop chargé. Mais j'aime bien le graph sur le temps » ; « e7a — e6a — e6c Des filtres qui comptent —
Créer un brassin ?? Pas convaincu — e4c » ; « e1a ». Écrire à la main (HTML, jamais généré par script : PUBLIER.md) la page NEUVE
`work/missions/2026-11-14-brassins/page5/index.html` qui regroupe ses choix et ce qui reste à choisir, puis `PAGE OK`.

## Entrées
- `work/refonte-frontend/v4/outils/pages/PUBLIER.md` ; feuille de style et visionneuse à reprendre de `work/missions/2026-11-14-brassins/page3/index.html`.
- Images (toutes dans `work/missions/2026-11-14-brassins/voies/`) et lignes « Idée » des NOTE.md ; lignes de classement : § Classement de
  `voies/kg/VERDICT.md` (gf), `voies/k6/VERDICT.md` (g6, e5n), `voies/k1/VERDICT.md` (e2, e3), `voies/k2/VERDICT.md` (e8), `voies/k3/VERDICT.md` (e9 à e11).
- Titres des vues : § Objectif de `voies/e<N>/VOIE.md`.

## Possède (seuls chemins où écrire, avec RESULTAT.md)
- `work/missions/2026-11-14-brassins/page5/` (`index.html`, `img/`), `work/missions/2026-11-14-brassins/voies/pg5/`.

## Consignes
- En tête : `<title>Brassins · tes choix et la suite · 15.11.2026</title>`, `<meta name="claude:viewport-fit-sides" content="cover">`,
  puis `<style>` ; pas de `<!doctype>`, `<html>`, `<head>`, `<body>`. Jetons, deux thèmes et gouttières comme page3.
- `#a-choisir` dans le premier écran : « Tes choix sont gardés. Pour la fiche en fermentation, les filtres et « Créer un brassin »,
  voici les nouvelles versions ; plus bas, les vues encore sans réponse. Dis un nom par vue (ex. gfa, g6b), ou « aucune ». » (≤ 45 mots).
- Sections, dans l'ordre :
  1. `id="retenues"` « Tes choix, retenus » : e1a, e4c, e7a (leur `-repos-390-clair.png`, nom de vue en légende), une ligne « à porter dans l'app ».
  2. `id="fiche"` « La fiche en fermentation : s4a × s6c » : rangée « Tes choix » (`s4/s4a/s4a-repos-390-clair.png`, `s6/s6c/s6c-repos-390-clair.png`),
     puis gfa à gfd.
  3. `id="filtres"` « Retrouver et filtrer : e6a × e6c » : rangée parents (`e6/e6a`, `e6/e6c`, repos), puis g6a à g6c.
  4. `id="creer"` « Créer un brassin, refait » : e5na à e5nd (une ligne : « les 4 premières ne t'ont pas convaincu »).
  5. `id="reste"` « Encore sans réponse » : e2, e3, e8, e9, e10, e11, chacune avec ses 4 variantes.
- Pour chaque variante : nom en mots (de « Idée », 6 mots au plus), identifiant en petit, ligne de classement, toutes ses images en
  vignettes `data-vignette` légendées (Au repos, Après le geste, Thème cave, 1280, et l'état en plus : Vide, Conditionné, Terminé,
  Annulé, Dossier, Comparer, Tarifs, Recettes, Fiche…), `loading="lazy"`. Images copiées dans `page5/img/` (mêmes noms).
- Aucun texte sous 14 px ; aucun paragraphe de plus de 45 mots ; pas de « Fable ».
- Contrôle : `node scripts/agents/verifier-page.mjs work/missions/2026-11-14-brassins/page5/index.html --page-lot --captures work/missions/2026-11-14-brassins/voies/pg5/verif`
  → `PAGE OK` ; ouvrir `verif-haut`.

## Exigences transversales et acquis (recopiés, leçons L05 et L06)
- Rien inventé : noms et lignes repris des sources ; deux thèmes ; lisible au téléphone et à 1280.

## Critères
`work/missions/2026-11-14-brassins/voies/pg5/GATES.md`, depuis la racine du dépôt.

## Rendre
- `RESULTAT.md` tenu au fil (tous les 5 éléments).
- La ligne « Tests » écrite dans un fichier : aucune suite Vitest ; `tests.txt` porte la sortie des CHECK.
- Voie d'écran : captures de la page, ouvertes.
Réponse finale au pilote : une ligne.
