# Voie pg — Page de choix « Brassins · mini maquettes »

- Mission : 2026-11-14-brassins · Agent : executant · Modèle : haiku · Niveau : mécanique · Plafond : 30 tours · Dépend de : p2a, p2b, p2c · Décideur : pilote

## Objectif
Écrire à la main (HTML, jamais généré par script : `work/refonte-frontend/v4/outils/pages/PUBLIER.md`) la page
`work/missions/2026-11-14-brassins/page/index.html` qui montre au brasseur les 4 variantes de passe 2 et le panel v0 de 15, avec
l'écran actuel en référence, puis `PAGE OK`.

## Entrées
- `work/refonte-frontend/v4/outils/pages/PUBLIER.md` (la règle, la disposition qu'il aime) ; feuille de style et visionneuse à
  reprendre de `work/refonte-frontend/v4/outils/pages/2026-11-10-onglet-finances/index.html`.
- `work/missions/2026-11-14-brassins/voies/t1/SYNTHESE.md` § Classement (note et une ligne par variante).
- Images : `voies/p2a/*/`, `voies/p2b/*/`, `voies/p2c/*/` (six chacune) ; `voies/s1|s2|s3/<id>/<id>-repos-390-clair.png` et
  `-geste-390-clair.png` ; référence : `voies/a1-banc/captures/fiche-fermentation-390-clair.png`, `liste-remplie-390-clair.png`.
- Les `RESULTAT.md` de p2a, p2b, p2c (nom en mots du brasseur et idée, une ligne).

## Possède (seuls chemins où écrire, avec RESULTAT.md)
- `work/missions/2026-11-14-brassins/page/` (`index.html`, `img/`), `work/missions/2026-11-14-brassins/voies/pg/`.

## Consignes
- En tête, contrat de page artefact : `<title>Brassins · mini maquettes · 14.11.2026</title>`,
  `<meta name="claude:viewport-fit-sides" content="cover">`, puis `<style>` ; pas de `<!doctype>`, `<html>`, `<head>`, `<body>`.
  Couleurs en jetons sur `:root`, redéfinies sous `@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) {…} }` et
  `:root[data-theme="dark"]` ; `body` avec fond explicite ; gouttière `padding-left: max(16px, env(safe-area-inset-left, 0px))` et
  `padding-right: max(16px, env(safe-area-inset-right, 0px))` ; rien ne défile en largeur ; polices : système ou Google Fonts.
- `#a-choisir` dans le premier écran du téléphone : « Quelle fiche de brassin je porte dans l'app ? Touche une image pour l'agrandir ;
  dis le nom (ex. s1e2), ou mêle deux variantes. » (≤ 45 mots).
- Rangée 1 « Aujourd'hui » : les deux captures de référence. Rangée 2 « Passe 2 » : s1e2, s1g, s2a2, s3b2, chacune avec son nom en
  mots, l'identifiant en petit, la note du critique, ses six images en vignettes. Rangée 3 « Panel v0 (15) » : repos et geste de chaque
  variante, nom, note de t1 en une ligne. Vignettes `data-vignette` qui s'ouvrent en grand au toucher (340 px au moins) ; aucun texte
  sous 14 px ; aucun paragraphe de plus de 45 mots ; pas de « Fable ».
- Images copiées dans `page/img/` avec des noms courts ; chemins relatifs `img/…`.
- Contrôle : `node scripts/agents/verifier-page.mjs work/missions/2026-11-14-brassins/page/index.html --page-lot --captures work/missions/2026-11-14-brassins/voies/pg/verif` → `PAGE OK` ; ouvrir les captures produites et dire en une ligne ce qu'on voit.

## Exigences transversales et acquis (recopiés, leçons L05 et L06)
- Rien inventé : noms, notes et lignes repris des sources ; deux thèmes ; lisible au téléphone et à 1280.

## Critères
`work/missions/2026-11-14-brassins/voies/pg/GATES.md`, depuis la racine du dépôt.

## Rendre
- `voies/pg/RESULTAT.md` tenu au fil (tous les 5 éléments).
- La ligne « Tests » écrite dans un fichier : aucune suite Vitest (rien dans `src/`) ; `voies/pg/tests.txt` porte la sortie de
  verifier-page et des CHECK, au même format que `--reporter=dot > …`.
- Voie d'écran : captures de la page à 390 tactile et 1280, clair et cave, ouvertes.
Réponse finale au pilote : une ligne.
