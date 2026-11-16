OK — s4a, s4b et s4c rhabillées à l'identité de l'app : IDENTITE OK 3/3, 15 images refaites

- [x] s4a : trousse chargée ; écran de l'onglet Brassins (en-tête, sous-onglets, barre du bas) ; réponse en id-display 28/600 sans dalle noire ; jetons des deux thèmes (phases : hop, attention, water ; jour = --repere) ; Quand ?, Brasser, −/+ en id-btn ; saisie m2 = feuille de l'app avec id-curseur ; pictos baies et résineux aux couleurs de familyTokens · écart restant : tableau plus dense que la fiche de l'app (cases de 35 px) ; deux boutons pleins à 1280 (le + du jour et Enregistrer).
- [x] s4b : rhabillée par `rhabiller-s4b.cjs` : chrome de l'onglet, grille en traits fins cave-700 et rayon 16, Dry hop demain en 28/600, F2 en alerte pâle, Pils en eau pâle, pastilles d'action recolorées, °C cuve édité sur place avec id-curseur, boutons id-btn · écart restant : à 1280 la courbe de densité s'étire sur toute la largeur et ses étiquettes (1,058, 1,018) chevauchent leurs points ; la carte F1 occupe toute la largeur alors que l'app limite ses colonnes.
- [x] s4c : réécrite en feuille de l'app posée sur l'onglet Brassins (poignée, titre « F1 · NEIPA · LOT-019 », sous-titre J+5 · levuré le 09.11, ×, pied « Quand ajouter ? › » primaire + °C cuve, Densité) ; id-display 28/600 ; moments en id-segments ; fenêtre « actif » en attention pâle, bande FG en hop pâle (comme s4b), aujourd'hui en repère ; °C cuve en hop / hop pâle / attention pâle ; rôle en id-puce ; « Ajouté aujourd'hui » en id-btn ; blocs de dose et filets des cartes aux couleurs de familyTokens, dessinés en SVG ; textes et chiffres inchangés · écart restant : au geste, le bandeau « Citra ajouté · stock −100 g » pousse les cartes, et le bouton « Ajouté le 14.11 » passe sous le pied (le tableau montre la coche) ; à 1280, le fondu « actif » prend une teinte brun-beige un peu terne.

Fichiers écrits : `voies/s4/s4a/etat.html` et ses 4 PNG ; `voies/s4/s4b/etat.html` et ses 5 PNG ; `voies/s4/s4c/etat.html`, `NOTE.md` et ses 4 PNG ; `voies/s4/capturer.mjs` (PLAN : cave et 1280 ajoutés à s4b et s4c) ; `voies/rs4/rhabiller-s4b.cjs` ; `voies/rs4/tests.txt`.

Sorties (tests.txt, rejouées depuis la racine) : G1 `IDENTITE OK 3/3` ; G2 `RHABILLE OK` ; G3 `HORS OK`. Tests : aucune suite Vitest (rien dans `src/`).

Captures ouvertes : s4a-repos-390-clair, s4a-geste-390-clair, s4a-repos-390-cave, s4a-repos-1280-clair ; s4b-repos-390-clair, s4b-geste-390-clair, s4b-liste-390-clair, s4b-repos-390-cave, s4b-repos-1280-clair ; s4c-repos-390-clair (avant et après la retouche des cartes), s4c-geste-390-clair, s4c-repos-390-cave, s4c-repos-1280-clair. Toutes dans `work/missions/2026-11-14-brassins/voies/s4/<id>/`.
Comparaison avec l'app (`a1-banc/captures/fiche-fermentation-390-clair.png`) : même feuille (poignée, titre 14/600 et sous-titre, ×, pied), mêmes boutons gris à bord fin et même noir plein unique ; s4c reste plus dense et plus colorée (couloirs) que la fiche actuelle.

Prédiction : « Là c'est mon app : la fiche du NEIPA avec les couloirs Citra et Mosaic, je vois tout de suite que le dry hop c'est demain. »

DÉCISION À PRENDRE : aucune.
CONNAISSANCE : chrome.js monte à `DOMContentLoaded` ; une maquette qui mesure ses largeurs doit lancer son script à ce même événement. Un reset `.x button{border:0}` écrase `id-btn-secondaire` : le mettre sous `:where()`. Dans une feuille, le corps a le fond cave-900 : une carte en `--panel` y disparaît, la poser en cave-950 avec un filet cave-800.
LEÇON PROPOSÉE : aucune.
