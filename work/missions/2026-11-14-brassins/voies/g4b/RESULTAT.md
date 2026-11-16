OK — 5 bloquants s7 de k4 corrigés, 13 captures régénérées et ouvertes, IDENTITE OK

## Bloquants (k4/VERDICT.md, sections s7 et B0)
- [x] s7a n° 1 : B0, « Carnet · Stock · Dossier » (livre, cubes de la barre « Stocks », ⋯) dans l'en-tête de la feuille, à côté du × ; ligne dans la NOTE (le Dossier garde budget, installation, corrections OG / jour brassé / volume conditionné, suppression).
- [x] s7b n° 1 : 1280 pensé en poste de cave, feuille élargie (≤ 1180 px, 94 dvh), quatre questions en 2 × 2, « Mes cuves · 3 décisions » à droite (F1, F2, Pils, Stout, Saison), texte à 14-16 px.
- [x] s7b n° 2 : liste, recherche · filtre · statistiques à droite du titre, ★ et ⋯ sur chaque brassin (trois décisions, Stout, Saison) ; dit dans la NOTE.
- [x] s7b n° 3 : B0, « Carnet · Stock · Dossier » dans l'en-tête de la feuille ; ligne dans la NOTE.
- [x] s7c n° 1 : B0, « Stock · Dossier » dans l'en-tête (le carnet reste au pied, « Courbe et carnet ») ; ligne dans la NOTE.

## Non bloquants faits
- s7a n° 2 et 3 : à 1280, feuille montée (94 dvh), annotations, rail et puces de 11-13 à 14-16 px (le texte SVG du graphe reste à 11-12 px : non fait).
- s7a n° 4 et s7b n° 7 : la Stout a son fût « F-01 · 20 L » (BRIEF l. 55).
- s7b n° 4 à 6 : barres depuis 1,008 (2,07 px par point : 1,062 = 112 px, 1,058 = 104, 1,030 = 46, 1,018 = 21), trou du 11.11 en pointillé « — », bande FG 1,010–1,014 à son échelle (4 à 12 px).
- s7c n° 2 : « alcool 5,8 % · att. 71 %, provisoires jusque-là » dans la tuile Garde (sous la courbe, il chevauchait J+5 ; essayé puis déplacé).
- s7c n° 3 : au geste, la feuille m2 « °C de la cuve » ouverte : 19,2 °C, −/+ 0,1, « taper la valeur », consigne 19 en repère, hier 19,1, Annuler / Enregistrer. L'ancien résultat passe en `?etat=fait` (non capturé).

## Non fait, et pourquoi
- s7b liste : le quart bas reste vide (5 brassins, comme l'app) ; rien ajouté pour ne pas inventer de contenu.
- s7b 1280 : un tiers bas vide sous les questions ; s7a 1280 : blanc entre le titre et les puces (rangée étirée par la colonne du graphe).
- Doute k4 sur s7c 1280 (ouverte) : ce n'est pas le 390 étiré (tuiles Densité, Cuve et Garde en une rangée de trois), mais c'est la feuille de 670 px de l'app, en texte de 11-13 px, avec un tiers haut vide. Non corrigé (hors des 5 bloquants) ; voir DÉCISION.
- s7c cave (ouverte) : rien de neuf à signaler, lisible, aplats sombres de familles.

## Fichiers écrits
`voies/s7/s7a|s7b|s7c/source.html` (patch par split/join, copies d'origine dans `%TEMP%/g4b-bak/`), `etat.html` (régénérés par `faire.mjs`), `NOTE.md` (section « Corrections g4b »), PNG ; `voies/g4b/RESULTAT.md`, `voies/g4b/tests.txt`.

## Critères (tests.txt)
G1 COCHE OK 5 · G2 IMAGES OK · G3 HORS KO, à cause de `work/refonte-frontend/v4/DEFAUTS-RECURRENTS.md`, déjà modifié avant la voie (présent dans le git status du début de session) ; g4b n'y a pas écrit. Identité : `controle-identite.mjs voies/s7` → IDENTITE OK 3/3.
`faire.mjs` compte 18 à 34 « cibles<44 » par capture : ce sont les boutons du chrome de l'app (`id-btn-icone`, 28 px dessinés, 44 par `::after`), comptés depuis la trousse ; les boutons ajoutés font 52 × 44 (en-tête) et 44 × 44 (★ ⋯).

## Captures (toutes ouvertes)
- `voies/s7/s7a/` : `s7a-repos-390-clair.png`, `s7a-repos-390-cave.png`, `s7a-geste-390-clair.png`, `s7a-repos-1280-clair.png`
- `voies/s7/s7b/` : `s7b-repos-390-clair.png`, `s7b-repos-390-cave.png`, `s7b-geste-390-clair.png`, `s7b-liste-390-clair.png`, `s7b-repos-1280-clair.png`
- `voies/s7/s7c/` : `s7c-repos-390-clair.png`, `s7c-repos-390-cave.png`, `s7c-geste-390-clair.png`, `s7c-repos-1280-clair.png`

## Prédiction
« Là j'ai mon carnet, mon stock et le reste en haut, comme dans l'app ; et sur l'ordi s7b me montre toutes mes cuves. »

DÉCISION À PRENDRE : s7c à 1280 : la garder dans la feuille de 670 px de l'app, ou l'élargir en poste de cave comme s7a et s7b (même cause c3 n° 7 si on la juge stricte).
CONNAISSANCE : aucune
LEÇON PROPOSÉE : aucune
