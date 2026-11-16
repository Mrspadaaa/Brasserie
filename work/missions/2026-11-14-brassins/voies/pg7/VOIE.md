# Voie pg7 — Page « Brassins · deux questions refaites » (Créer, Recettes)

- Mission : 2026-11-14-brassins · Agent : concepteur · Modèle : opus (Fable interdit) · Niveau : conception · Plafond : 45 tours · Dépend de : cx, rx · Décideur : brasseur

## Objectif
Ses mots (15.11) : « Fermentation : gfc · Filtres : e6a + e6c · Créer : aucune · Carnet : e3gb · Recettes : aucune · Atelier : e9na Refait pour
celle aucune... Ça resoud aucune de mes problématique ». Écrire à la main la page NEUVE `work/missions/2026-11-14-brassins/page7/index.html`,
même forme que page7 (un écran par question, vues par ancre) : deux questions, « Créer un brassin » et « Recettes », refaites en partant de
ses problèmes. `PAGE OK` et `PAGE CLAIRE OK 2`.

## Entrées
- La forme : `page7/index.html` (à reprendre telle quelle : styles, accueil, écrans, barre « Ta réponse », Copier).
- Ses problèmes : `voies/a2/PROBLEMES.md` § Créer un brassin et § Recettes, « Ses problèmes » (numéros et citations datées).
- Revues : `revue-v0/creer-*.md`, `revue-v0/recettes-*.md` (§ Classement) ; corrections : `voies/cx/RESULTAT.md`, `voies/rx/RESULTAT.md`.
- Pour chaque variante, `NOTE.md` : « Idée », « Ce qui change », « Geste », « Problèmes résolus ». Images : `voies/<série>/<id>/*.png`.

## Possède (seuls chemins où écrire, avec RESULTAT.md)
- `work/missions/2026-11-14-brassins/page7/` (`index.html`, `img/`), `work/missions/2026-11-14-brassins/voies/pg7/`.

## Consignes
- En tête : `<title>Brassins · deux questions refaites · 15.11.2026</title>`, `<meta name="claude:viewport-fit-sides" content="cover">`, puis `<style>` ;
  pas de `<!doctype>`, `<html>`, `<head>`, `<body>`. Gouttière `max(16px, env(safe-area-inset-left))`. Rien ne déborde à 390.
- Accueil (sans ancre, `id="a-choisir"`, ≤ 45 mots) : ses mots en tête ; ses choix en cours de port dans l'app en une ligne de vignettes (`data-vignette`) gfc, e6a, e6c, e3gb, e9na (`-repos-390-clair.png`, légende en mots) ; puis les deux questions en gros boutons :
  1. `#creer` « Créer un brassin » : c2a, c1d, c1c, c2c (ordre du consensus des revues).
  2. `#recettes` « Recettes » : r1a, r2a, r1c, r1d.
- Chaque écran commence par « Tes problèmes » : 3 à 5 de ses problèmes en une ligne chacun, avec sa citation courte et sa date (de PROBLEMES.md) ; chaque variante dit lesquels elle résout (« Problèmes résolus »), en mots.
- Chaque écran de question : `<section data-question id="…">`, ses mots exacts en tête, une question fermée visible `data-ask`
  (« Laquelle garder : … ou aucune ? »), la référence en petit, puis les variantes dans l'ordre du classement, chacune
  `data-variante="<id>"` : le nom en mots (titre sans code), l'identifiant en petit (pas dans un titre), l'image au repos 390 clair
  en pleine colonne (≥ 340 px), la ligne `data-change` (« Ce qui change », 20 mots au plus), puis les autres états en rangée qui
  défile (`overflow-x:auto`, `scroll-snap`), légendés en mots, le geste nommé (« Après "Planifier" »), jamais « Après le geste » seul.
  Un bouton « Je prends » par variante compose la réponse (ex. « Fermentation : gfc · Filtres : g6b ») dans une barre en bas, avec
  « Copier » (clipboard dans le clic, repli sélection) ; « aucune » possible. Retour à l'accueil en haut de chaque écran.
- Aucun texte sous 14 px ; aucun paragraphe de plus de 45 mots ; pas de « Fable » ; aucun verdict de critique ni jargon (« greffe »,
  « parents », « × », codes) dans le texte qu'il lit ; images copiées dans `page7/img/` (mêmes noms), `loading="lazy"`.
- Contrôles : `node scripts/agents/verifier-page.mjs work/missions/2026-11-14-brassins/page7/index.html --page-lot --captures work/missions/2026-11-14-brassins/voies/pg7/verif`
  → `PAGE OK` ; `node work/missions/2026-11-14-brassins/outils/controle-page-claire.mjs work/missions/2026-11-14-brassins/page7/index.html`
  → `PAGE CLAIRE OK 2`. Capturer chaque écran à 390 (clair et cave) dans `voies/pg7/verif/` et ouvrir chaque capture : la
  question et la première variante se lisent au premier écran.

## Exigences transversales et acquis (recopiés, leçons L05 et L06)
- Rien inventé : noms et lignes repris des NOTE.md ; deux thèmes ; lisible au téléphone et à 1280 ; règle n° 1 (ses choix tels quels).

## Critères
`work/missions/2026-11-14-brassins/voies/pg7/GATES.md`, depuis la racine du dépôt. Ne pas le modifier.

## Rendre
- `RESULTAT.md` tenu au fil (tous les 5 éléments).
- La ligne « Tests » écrite dans un fichier : aucune suite Vitest ; `tests.txt` porte la sortie des CHECK, au même format que `--reporter=dot > …`.
- Voie d'écran : captures de chaque écran, ouvertes.
Réponse finale au pilote : une ligne.
