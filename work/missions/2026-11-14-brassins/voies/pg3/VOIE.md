# Voie pg3 — Page « Brassins · tous les écrans »

- Mission : 2026-11-14-brassins · Agent : executant · Modèle : haiku · Niveau : mécanique · Plafond : 40 tours · Dépend de : f3a1 à f3a4, f3b1, f3b2, f3c · Décideur : pilote

## Objectif
Ses mots (14.11) : « J'ai l'impression que tout les écrans sous les boutons de ces Tabs ne sont pas traitées ??? ». Écrire à la main
(HTML, jamais généré par script : `work/refonte-frontend/v4/outils/pages/PUBLIER.md`) la page NEUVE `work/missions/2026-11-14-brassins/page3/index.html` : en tête,
le tableau de couverture de l'onglet Brassins ; puis, pour chacune des 11 vues jamais maquettées (e1 à e11), ses 4 mini maquettes ; puis `PAGE OK`.

## Entrées
- `work/refonte-frontend/v4/outils/pages/PUBLIER.md` ; feuille de style et visionneuse à reprendre de `work/missions/2026-11-14-brassins/page2/index.html`.
- Couverture : `work/missions/2026-11-14-brassins/voies/cv/COUVERTURE.md` (ligne 1 et « ## Sans maquette, groupées »). Pages existantes : fiche en fermentation et
  liste, https://claude.ai/artifact/SqU1y2jQgMAX8tX6MKn9qL (12 versions, en attente de son choix) et https://claude.ai/artifact/Jis8k1YGo26euJoLVKiMDv (19, refusées).
- Par vue : nom et vue = titre et § Objectif de `work/missions/2026-11-14-brassins/voies/eN/VOIE.md` ; variantes `work/missions/2026-11-14-brassins/voies/eN/eN[a-d]/` (PNG, ligne « Idée » de
  `NOTE.md`) ; phrase de classement : § « Classement » de `work/missions/2026-11-14-brassins/voies/c5a/VERDICT.md` (e1 à e4), `c5b` (e5 à e8), `c5c` (e9 à e11).
- Écran actuel par vue (s'il existe) : les captures citées au § Entrées de `work/missions/2026-11-14-brassins/voies/eN/VOIE.md` (dossier `voies/a1-banc/captures/`).

## Possède (seuls chemins où écrire, avec RESULTAT.md)
- `work/missions/2026-11-14-brassins/page3/` (`index.html`, `img/`), `work/missions/2026-11-14-brassins/voies/pg3/`.

## Consignes
- En tête, contrat de page artefact : `<title>Brassins · tous les écrans · 14.11.2026</title>`,
  `<meta name="claude:viewport-fit-sides" content="cover">`, puis `<style>` ; pas de `<!doctype>`, `<html>`, `<head>`, `<body>`.
  Jetons de couleur, thème sombre et gouttières comme page2 ; rien ne défile en largeur.
- `#a-choisir` dans le premier écran du téléphone : « Tous les écrans de l'onglet Brassins. 11 vues n'avaient aucune maquette : 4 versions
  chacune. Pour chaque vue, dis son nom (ex. e4b), ou « aucune ». Touche une image pour l'agrandir. » (≤ 45 mots).
- Puis `#couverture` : un tableau court, une ligne par sous-onglet et vue groupée (Brassins : fiche en fermentation et liste → lien page 2 ;
  e1 à e11 → ancre de la section), colonne « Maquettes » (page 2, ou « 4 versions ↓ »). Les vues d'autres sessions (jour de brassage,
  fiche et édition de recette, Matériel, stock) dites « autre session », sans lien inventé.
- Une section par vue `id="eN"` : titre en mots, la vue en une ligne, une rangée « Aujourd'hui » (captures actuelles s'il y en a, sinon
  « pas encore de capture »), puis ses 4 variantes : nom en mots (de « Idée », 6 mots au plus), l'identifiant en petit, la ligne de
  classement, toutes ses images en vignettes légendées (Au repos, Après le geste, et l'état en plus : Conditionné, Terminé, Dossier,
  Retour, Sans recette, Vide, Comparer, Tarifs, Recettes ; Thème cave ; 1280).
- Vignettes `data-vignette` qui s'ouvrent en grand au toucher (340 px au moins) ; aucun texte sous 14 px ; aucun paragraphe de plus de
  45 mots ; pas de « Fable ». Images copiées dans `page3/img/` (noms courts, chemins relatifs `img/…`) ; `loading="lazy"` sur les images.
- Contrôle : `node scripts/agents/verifier-page.mjs work/missions/2026-11-14-brassins/page3/index.html --page-lot --captures work/missions/2026-11-14-brassins/voies/pg3/verif` → `PAGE OK` ; ouvrir les
  captures produites et dire en une ligne ce qu'on voit.

## Exigences transversales et acquis (recopiés, leçons L05 et L06)
- Rien inventé : noms, notes et lignes repris des sources ; deux thèmes ; lisible au téléphone et à 1280.

## Critères
`work/missions/2026-11-14-brassins/voies/pg3/GATES.md`, depuis la racine du dépôt.

## Rendre
- `RESULTAT.md` tenu au fil (tous les 5 éléments).
- La ligne « Tests » écrite dans un fichier : aucune suite Vitest (rien dans `src/`) ; `tests.txt` porte la sortie de verifier-page et des
  CHECK, au même format que `--reporter=dot > …`.
- Voie d'écran : captures de la page à 390 tactile et 1280, clair et cave, ouvertes.
Réponse finale au pilote : une ligne.
