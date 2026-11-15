# Voie pg8 — Page « Feuille Brasser · le jour »

- Mission : 2026-11-14-brassins · Agent : concepteur · Modèle : opus (Fable interdit) · Niveau : conception · Plafond : 45 tours · Dépend de : d1, kd1, gd1 · Décideur : brasseur

## Objectif
Ses mots (15.11), sur sa capture de la feuille « Brasser Blonde de soif · v4 » : « Créer : c2a · Recettes : r2a — Mais bien revoir cette écran notamment pour la sélection de date ».
Écrire à la main la page NEUVE `work/missions/2026-11-14-brassins/page8/index.html`, même forme que page7 (styles, accueil, écran par ancre,
barre « Ta réponse », Copier) : UNE question, « La feuille Brasser : laquelle ? », sur les 4 versions refaites (voie d1, corrigées en gd1).
`PAGE OK` et `PAGE CLAIRE OK 1`.

## Entrées
- La forme : `work/missions/2026-11-14-brassins/page7/index.html` (à reprendre : styles, accueil, écran, barre, Copier).
- Ses mots et ce qui ne va pas dans le choix de date : `voies/d1/RESULTAT.md` (« Ce qui ne va pas… », « Données »), `voies/gd1/RESULTAT.md`.
- Sa capture (la référence, en petit) : `voies/d1/ref/sa-capture-c2a-geste.jpg`.
- Classement de la critique : `voies/kd1/VERDICT.md` § Classement (ordre : d1d, d1b, d1a, d1c).
- Pour chaque variante, `voies/d1/<id>/NOTE.md` : « Idée », « Ce qui change », « Geste ». Images : `voies/d1/<id>/*.png` (repos, geste, loin, conflit à 390 clair ; repos cave).

## Possède (seuls chemins où écrire, avec RESULTAT.md)
- `work/missions/2026-11-14-brassins/page8/` (`index.html`, `img/`), `work/missions/2026-11-14-brassins/voies/pg8/`.

## Consignes
- En tête : `<title>Feuille Brasser · le jour · 15.11.2026</title>`, `<meta name="claude:viewport-fit-sides" content="cover">`, puis `<style>` ;
  pas de `<!doctype>`, `<html>`, `<head>`, `<body>`. Gouttière `max(16px, env(safe-area-inset-left))`. Rien ne déborde à 390.
- Accueil (sans ancre, `id="a-choisir"`, ≤ 45 mots) : ses mots en tête ; une ligne « Noté : Créer c2a, Recettes r2a (en cours dans l'app) » ; un gros bouton vers `#brasser`.
- L'écran `<section data-question id="brasser">` commence par « Ce qui ne va pas aujourd'hui » : 3 à 5 lignes courtes tirées de d1/RESULTAT.md (« Sam. 21 » sans raison, « Plus tard » sans date, la cuve dite à part, « Demain » tombe sur le dry hop), sa capture en petit à côté ; puis la question fermée `data-ask` (« Laquelle garder : … ou aucune ? ») ; puis les 4 variantes dans l'ordre du classement, chacune `data-variante="<id>"` : nom en mots (titre sans code), identifiant en petit, repos 390 clair en pleine colonne (≥ 340 px), `data-change` (≤ 20 mots, de NOTE.md), autres états en rangée qui défile, légendés et geste nommé (« Après "+ ici" sur sam. 21 »), repos cave compris. Une ligne dit, une fois, ce qui est fictif (mise en bouteille de la Pils mar. 17).
- « Je prends » par variante compose la réponse (« Feuille Brasser : d1b ») dans la barre du bas avec « Copier » ; « aucune » possible.
- Aucun texte sous 14 px ; aucun paragraphe de plus de 45 mots ; pas de « Fable » ; aucun verdict ni jargon ; images copiées dans `page8/img/` (mêmes noms), `loading="lazy"`.
- Contrôles : `node scripts/agents/verifier-page.mjs work/missions/2026-11-14-brassins/page8/index.html --page-lot --captures work/missions/2026-11-14-brassins/voies/pg8/verif`
  → `PAGE OK` ; `node work/missions/2026-11-14-brassins/outils/controle-page-claire.mjs work/missions/2026-11-14-brassins/page8/index.html` → `PAGE CLAIRE OK 1`.
  Capturer l'écran à 390 (clair et cave) dans `voies/pg8/verif/` et ouvrir chaque capture : la question et la première variante se lisent au premier écran.

## Exigences transversales et acquis (recopiés, leçons L05 et L06)
- Rien inventé : noms et lignes repris des NOTE.md ; deux thèmes ; lisible au téléphone et à 1280 ; règle n° 1 (ses choix tels quels).

## Critères
`work/missions/2026-11-14-brassins/voies/pg8/GATES.md`, depuis la racine du dépôt. Ne pas le modifier.

## Rendre
- `RESULTAT.md` tenu au fil (tous les 5 éléments).
- La ligne « Tests » écrite dans un fichier : aucune suite Vitest ; `tests.txt` porte la sortie des CHECK, au même format que `--reporter=dot > …`.
- Voie d'écran : captures de chaque écran, ouvertes.
Réponse finale au pilote : une ligne.
