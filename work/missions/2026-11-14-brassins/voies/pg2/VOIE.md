# Voie pg2 — Page de choix « Brassins · nouvelles versions »

- Mission : 2026-11-14-brassins · Agent : executant · Modèle : haiku · Niveau : mécanique · Plafond : 30 tours · Dépend de : f2a, f2b · Décideur : pilote

## Objectif
Ses mots (14.11), devant la première page : « Pas super fan de aucun, lance une critique et fait d'autres versions ». Écrire à la
main (HTML, jamais généré par script : `work/refonte-frontend/v4/outils/pages/PUBLIER.md`) la page NEUVE
`work/missions/2026-11-14-brassins/page2/index.html` qui lui montre les 12 nouvelles variantes (4 genres × 3), avec l'écran actuel en référence, puis `PAGE OK`.

## Entrées
- `work/refonte-frontend/v4/outils/pages/PUBLIER.md` ; feuille de style et visionneuse à reprendre de `work/missions/2026-11-14-brassins/page/index.html` (la page
  précédente, même mission : jetons, vignettes `data-vignette`, visionneuse).
- `work/missions/2026-11-14-brassins/voies/c3/DIAGNOSTIC.md` : § Genres (nom de chaque genre G1 à G4 et son idée en une ligne).
- `work/missions/2026-11-14-brassins/voies/c4a/VERDICT.md` et `work/missions/2026-11-14-brassins/voies/c4b/VERDICT.md` : la phrase probable du brasseur sous chaque titre de variante, et
  § Classement (une ligne par variante).
- Images : `work/missions/2026-11-14-brassins/voies/s4|s5|s6|s7/<id>/*.png` (toutes, 12 variantes) ; référence : `work/missions/2026-11-14-brassins/voies/a1-banc/captures/fiche-fermentation-390-clair.png`,
  `liste-remplie-390-clair.png`. Nom en mots et idée : la ligne « Idée » de chaque `NOTE.md`.

## Possède (seuls chemins où écrire, avec RESULTAT.md)
- `work/missions/2026-11-14-brassins/page2/` (`index.html`, `img/`), `work/missions/2026-11-14-brassins/voies/pg2/`.

## Consignes
- En tête, contrat de page artefact : `<title>Brassins · nouvelles versions · 14.11.2026</title>`,
  `<meta name="claude:viewport-fit-sides" content="cover">`, puis `<style>` ; pas de `<!doctype>`, `<html>`, `<head>`, `<body>`.
  Jetons de couleur, thème sombre et gouttières comme la page précédente ; rien ne défile en largeur.
- `#a-choisir` dans le premier écran du téléphone : « Nouvelles versions, quatre genres neufs. Laquelle je porte dans l'app ?
  Touche une image pour l'agrandir ; dis son nom (ex. s5a), ou mêle deux variantes. » (≤ 45 mots).
- Rangée « Aujourd'hui » : les deux captures de référence. Puis une rangée par genre (G1 Le tableau de cuverie, G2 Trois cadrans,
  un bouton, G3 La conduite de z1, G4 Le dry hop en question), son idée en une ligne, et ses trois variantes : nom en mots (pris de
  l'idée de NOTE.md, 6 mots au plus), l'identifiant en petit, la ligne du classement de la critique, toutes ses images en vignettes
  (repos, geste, liste, cave, 1280 s'ils existent), chacune légendée (Au repos, Après le geste, Liste, Thème cave, 1280).
- Vignettes `data-vignette` qui s'ouvrent en grand au toucher (340 px au moins) ; aucun texte sous 14 px ; aucun paragraphe de plus de
  45 mots ; pas de « Fable ».
- Images copiées dans `page2/img/` avec des noms courts ; chemins relatifs `img/…`.
- Contrôle : `node scripts/agents/verifier-page.mjs work/missions/2026-11-14-brassins/page2/index.html --page-lot --captures work/missions/2026-11-14-brassins/voies/pg2/verif` → `PAGE OK` ;
  ouvrir les captures produites et dire en une ligne ce qu'on voit.

## Exigences transversales et acquis (recopiés, leçons L05 et L06)
- Rien inventé : noms, notes et lignes repris des sources ; deux thèmes ; lisible au téléphone et à 1280.

## Critères
`work/missions/2026-11-14-brassins/voies/pg2/GATES.md`, depuis la racine du dépôt.

## Rendre
- `voies/pg2/RESULTAT.md` tenu au fil (tous les 5 éléments).
- La ligne « Tests » écrite dans un fichier : aucune suite Vitest (rien dans `src/`) ; `voies/pg2/tests.txt` porte la sortie de
  verifier-page et des CHECK, au même format que `--reporter=dot > …`.
- Voie d'écran : captures de la page à 390 tactile et 1280, clair et cave, ouvertes.
Réponse finale au pilote : une ligne.
