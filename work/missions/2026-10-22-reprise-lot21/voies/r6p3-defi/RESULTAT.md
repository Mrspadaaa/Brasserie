OK — r6p3 : r6n2 intacte, avec son défi en bandeau de deux pistes lettrées sous la réponse

## Fichiers écrits (tous dans Possède)

- `work/refonte-frontend/v4/ecran-1/fils22-comparer/r6p3/generer.mjs` (copie de r6n2, classes `r6p3-…`, r6n2 intact)
- `work/refonte-frontend/v4/ecran-1/fils22-comparer/r6p3/etat.html` (généré)
- `work/refonte-frontend/v4/ecran-1/fils22-comparer/r6p3/NOTE.md`, `captures.mjs`, `note-reprise.mjs` (écrit la section Reprise)
- `work/refonte-frontend/v4/ecran-1/fils22-comparer/captures/r6p3-*.png` (17 captures)

## Ce que fait la variante

Le premier écran est celui de r6n2 (titre, contexte, réponse et pastille, Dryhopper, radar r2, trois colonnes de la
tête au pied, rangées l5b, dock à six touchers). Sous la réponse s'ajoute un **bandeau « ton défi »** sur la grille du
tableau : à gauche, ta demande (↑ ❀ Floral, ↓ ♣ Résineux) et le verdict en mot du houblon mis en avant ; à droite, sur
la largeur des trois colonnes, une piste commune : zone 16D, trait de ta stout, visée en pointillé, barre du houblon
mis en avant, un rond lettré par houblon. Les ronds trop proches passent sur un autre couloir, sans décalage en
largeur. Toucher une tête de colonne met le bandeau à jour ; toucher le bandeau ouvre la feuille Défi.
Payé par : les six écarts chiffrés des rangées Floral et Résineux (portés par le bandeau et la feuille), « trop / plus »
devenus des flèches, les deux « ? » écrits du radar, un radar de rayon 72 au lieu de 84. Toujours 79 mots. Le tableau
finit 16 px plus bas qu'avant, sans vide au-dessus du dock.

## Idées reprises (d'où → où)

- Pistes d'objectif l5b, piste lettrée w2, verdicts l8b, défi y1b (r6n1 au premier écran, r6n2 dans la feuille) → bandeau au premier écran.
- Critique r6nc2, « radar très rose » → moustache et « // » à l'encre, remplissage 0,14.
- Critique r6nc2, « Citra » dans la Frise → « enchaîner Idaho 7 puis Galaxy », calculé depuis les données.
- Critique r6nc2, Pomona dessinée en bouton dans Souche → « US-05 ; Pomona en aperçu » en texte.
- Greffe Dryhopper, teneur du lot (CoA) → feuille Valeurs : un losange par lot réel sur l'huile et la chimie (Idaho 7 ID7-2573,
  Cascade ×4) ; Nelson Sauvin non utilisé (dénominateur non dit).
- Non transposées, avec leur raison (NOTE) : loupe à mini-barres et « contre ★ » (rail de moments, facteur fixé), « emporté »,
  « trop amer » (aucune cible d'IBU 16D dans les données).

## Sorties décisives (lancées depuis la racine, après la dernière génération)

- G1 : `COMMUN OK` (au premier essai, S2 était en échec : les ronds des houblons étaient dans un conteneur `data-famille`. Corrigé : variables de couleur posées en style)
- G2 : `r6p3 79 mots` · `MOTS OK`
- G3 : `UNE-QUESTION OK (1 groupe libre : houblon)`
- G4 : `ACQUIS OK (4/4 : radar, chimie, osu, valeurs)`
- G5 : `ALPHA OK`
- G6 : `REPRISE OK (27 repris, 2 en contexte, 8 en pont, 0 écartés)`
- G7 : `PAGE OK (0 images chargées, 390 px, sans erreur)`
- G8 : `EXISTENT OK 7`
- G9 : `NOTE OK`
- Hors grille : `PISTE OK` (D92, `controle-piste-objectif.mjs` : les deux pistes du bandeau font 271 px)

## Captures ouvertes en image

- `r6p3-premier-ecran.png` : comparée à `r6n2-premier-ecran.png`. Même disposition et même densité, et le tableau descend plus bas : il était à 738 px, il est à 770 px, sur 788 px au-dessus du dock. Rien de r6n2 n'a disparu, sauf les six écarts déplacés.
- `r6p3-toucher-390.png` : le bandeau touché ouvre la feuille Défi.
- `r6p3-fiche-390.png` : fiche g1 d'Idaho 7 à l'appui long, « 1 seule fiche : Beer Maverick » (noyau déjà corrigé).
- `r6p3-cascade-390.png` : Cascade mis en avant ; le bandeau passe à « Approche », le rond C est cerclé, Défi 1/4.
- `r6p3-quatre-390.png` : avec Nelson Sauvin, le rond N apparaît. Le libellé du bandeau se chevauchait à 4 colonnes (`--lc` à 34 px) ; corrigé avec une colonne fixe de 76 px, puis recapturé.
- `r6p3-valeurs-390.png` : losanges CoA (le libellé passait à la ligne ; corrigé : « 4 lots 42–73 », sans coupure).
- `r6p3-frise-390.png`, `r6p3-souche-390.png` : les restes du critique, corrigés.
- Aussi générées : 390, critere, tropicaux, absolu-galaxy, ajout, pourquoi, preuve, egaler, legende.

## Prédiction

« Là c'est r6n2 mais je vois direct si j'ai mon floral et que le résineux bouge pas, pas mal. Les ronds C et G collés, ça se lit quand même. »

DÉCISION À PRENDRE : aucune.

CONNAISSANCE : dans le cas de la stout, à 4 g/L après fermentation, la variété ne joue que sur le floral (Idaho 7 ~25,
Cascade ~18, Galaxy ~17, visée ~20 sur 100). Sur le résineux, les trois sont à ~102 sur une visée de 73, en échelle
absolue. Nelson Sauvin est le seul à en ajouter moins (~91). Le bandeau rend cet enseignement lisible sans un chiffre.

LEÇON PROPOSÉE : un élément qui reprend la grille d'un tableau fixe sa propre largeur de libellé. Le 23.10, le bandeau
de r6p3 héritait de `--lc`. Cette variable passe de 76 à 34 px quand on ajoute une 4e colonne, et le libellé
« Floral » s'est fait recouvrir. Seule la capture `?n4` l'a montré, aucun contrôle. Faire : pour tout ajout sur une
grille à variables, capturer aussi l'état à quatre colonnes et l'ouvrir. Rôles : concepteur. Contrôle : aucun.
