OK — r6p1 : r6n2 au premier écran identique, restes des critiques soldés, CoA dans la fiche

## Fichiers écrits
- `work/refonte-frontend/v4/ecran-1/fils22-comparer/r6p1/generer.mjs` (copie de r6n2, classes `r6p1-…`), `captures.mjs`, `etat.html`, `NOTE.md`
- `work/refonte-frontend/v4/ecran-1/fils22-comparer/captures/r6p1-*.png` (16 captures)
- r6n2 intacte ; rien à la racine (`pistes-l5f.png`, à la racine, date du lot 21, pas de cette voie).

## Idées reprises (d'où → où)
1. Radar moins rose (critique r6nc2) → radar : moustache 30 % et 1 px, « // » gris de grille et plus court, surface 16 %, autres en contour net.
2. Pont de la Frise sans Citra (critique r6nc2) → feuille Frise : « enchaîner Idaho 7 puis Galaxy », calculé depuis le cas, suit le houblon touché.
3. « Emporté » en contour, hachure = inconnu seul (Dryhopper a1, r7-verdict) → Frise « en actif » (pertes en pastilles contour) ; Égaler « ~jamais » en barre vide.
4. Teneur CoA dans la fiche (Dryhopper b4, d8) → appui long : « Lot publié » ID7-2573 (huile 2,5 ; linalol 0,4 % ; géraniol 0,6 % ; myrcène 45,4 %), Cascade 4 lots en plages, Nelson huile seule, Galaxy « aucun ».
5. Grille des 20 bières allégée (critiques r6nc, r6nc2) → Preuve : réglette de 20 cases, rangée comme les barres l5b, comptes en gris.
6. Pictos au bout des courbes (Dryhopper g1) → panel OSU.
7. Pomona écrit, plus en forme de bouton ; titre dans l'ordre des colonnes ; « IBU à 10′ / au whirlpool » sous leur dose.

## Sorties décisives
- G1 : `COMMUN OK`
- G2 : `r6p1 79 mots` · `MOTS OK` (r6n2 : 79 ; rien retiré du premier écran)
- G3 : `UNE-QUESTION OK (1 groupe libre : houblon)`
- G4 : `ACQUIS OK (4/4 : radar, chimie, osu, valeurs)`
- G5 : `ALPHA OK`
- G6 : `REPRISE OK (27 repris, 2 en contexte, 8 en pont, 0 écartés)`
- G7 : `PAGE OK (0 images chargées, 390 px, sans erreur)`
- G8 : `EXISTENT OK 7`
- G9 : `NOTE OK`
- L26 : audit du CSS généré, une classe par rôle (`r6p1-o` servait à deux rôles, renommée `r6p1-tir-fort` pour le compte) ; seul `r6p1-sel` est partagé, comme état toujours composé.

## Captures ouvertes
- `captures/r6p1-premier-ecran.png` : comparée à `r6n2-premier-ecran.png`, même disposition, même densité, aucun vide nouveau ; le radar perd ses « // » rouges.
- `captures/r6p1-toucher-390.png` (Défi, joué au doigt), `captures/r6p1-fiche-390.png` (encart « Lot publié » sous l'α).
- Aussi : `r6p1-preuve-390.png`, `r6p1-frise-390.png`, `r6p1-souche-390.png`, `r6p1-egaler-390.png`.

## Prédiction
« C'est r6n2 en plus propre, le radar est moins rose et j'ai les vraies valeurs du lot dans la fiche. Mais à part ça c'est
la même. » Il la gardera si r6n2 est déjà son choix ; elle ne le surprendra pas.

DÉCISION À PRENDRE : aucune.

CONNAISSANCE : `comparer-stout.json` porte des CoA publiés pour Cascade (4 lots YCH 2024–2025), Idaho 7 (ID7-2573) et
Nelson Sauvin (CH25-BR05-NSN, fractions au dénominateur non dit) ; aucun pour Galaxy. Un encart de fiche peut s'ajouter
sans toucher au noyau l8g, par un script qui observe `#fiche-racine` et insère après `.f-ab`.

LEÇON PROPOSÉE : un signe ne garde qu'un sens dans toute la variante, feuilles comprises. Le 23.10, r6n2 hachurait
« jamais atteint à 8 g/L » (Égaler) alors que la hachure veut dire « inconnu » ; le défaut ne se voyait que dans une
feuille, jamais au premier écran. Faire : avant de rendre, lister chaque usage de la hachure (et de l'orangé) dans toutes
les feuilles ouvertes. Rôles : concepteur, critique. Contrôle : aucun ; un contrôle pourrait exiger qu'une hachure porte
un `aria-label` contenant « inconnu », « non modélisé » ou « ? ».
