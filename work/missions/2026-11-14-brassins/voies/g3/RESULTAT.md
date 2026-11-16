OK — 6 bloquants k3 corrigés (e9b, e10a, e10c, e10d, e11b, s4b), images régénérées, identité OK

## Bloquants
- [x] e9b n° 1 : fiche de l'idée dessinée (état `fiche`, capture `e9b-fiche-390-clair.png`) ; un toucher sur la pastille (crayon visible) ouvre nom, style, étape en segment (avancer ou reculer), note, Supprimer, Enregistrer ; dit dans NOTE.md.
- [x] e10a n° 1 : à 1280, les eaux passent sous le curseur en trois lignes (empâtage, rinçage, avant ébullition 29,1 L, chiffre déjà calculé) ; grain et houblons à droite ; les deux colonnes finissent à la même hauteur.
- [x] e10c n° 1 : à 1280, « Volume cible » se pose dans la tête, à côté d'« À peser pour 24 L » ; il ne couvre plus le dry hop ni le levurage.
- [x] e10d n° 1 : à 1280, la moitié gauche porte les quantités par ingrédient (grain, eau, houblon par moment, levure) en quatre panneaux aux couleurs des axes.
- [x] e11b n° 1 : à 1280, le dock des sous-onglets se range en tête de la colonne gauche, à la place des sous-onglets de l'app ; la liste des recettes n'est plus couverte.
- [x] s4b n° 1 : étiquettes de densité hors du trait (« 1,058 » sous la flèche, « 1,018 » sous son point), sur un halo couleur page ; vérifié à 390 et 1280.

## Non bloquants faits
- e9b n° 2 : titre « La 33 cl rapporte le plus au litre : 10,30 » ; n° 3 : En cuve en Source Sans ; n° 4 : pastilles pleine largeur avec la puce de style ; n° 5 : cave et 1280 capturés (plan de `e9/capture.mjs`). Bande « En cuve » pleine largeur à 1280.
- e10a n° 2 : un seul sélecteur (pastilles, « Changer » retiré) ; n° 3 : resserré ; n° 4 : repères du curseur en Source Sans, « F1 30 L » en puce.
- e10c n° 4 : tête et repères en Source Sans ; n° 5 : écart (pas d'α sur la pesée) dit dans NOTE.md.
- e10d n° 2 : puce « Système 30 L dépassé » ; n° 3 : « sachet(s) » en entier ; n° 4 : graduations 14 px, contraste plein.
- e11b n° 2 : « F1 DH », « F1 21 °C » insécable ; n° 3 : « 1,010 stable ».

## Non faits (et pourquoi)
- e10c n° 2 (coches liées au brassin du jour : demande une date et un lot neufs, hors brief) ; n° 3 (marge basse déjà égale au panneau).
- e10d n° 5, s4b n° 2 à 6, e11b n° 4 et 5 : changent la composition ou demandent plus qu'une ligne ; passe 2.
- Non bloquants de e9a, e9c, e9d, e11a, e11c, e11d, s4a, s4c : hors bloquants, contexte réservé.

## Fichiers écrits
- `voies/e9/e9b/etat.html`, `NOTE.md`, 6 PNG (dont `e9b-fiche-390-clair`, `e9b-repos-390-cave`, `e9b-repos-1280-clair` neufs) ; `voies/e9/capture.mjs` (plan e9b).
- `voies/e10/e10a|e10c|e10d/etat.html`, `NOTE.md`, 4 PNG chacun.
- `voies/e11/e11b/etat.html`, `NOTE.md`, 5 PNG.
- `voies/s4/s4b/etat.html`, `NOTE.md`, 5 PNG.
- `voies/g3/RESULTAT.md`, `tests.txt`.

## Critères
- Identité : `controle-identite.mjs` IDENTITE OK 4/4 (e9, e10, e11), 3/3 (s4) — `tests.txt`.
- G1 : COCHE OK 6. G2 : IMAGES OK. G3 : HORS KO, seul `M work/refonte-frontend/v4/DEFAUTS-RECURRENTS.md`, déjà modifié avant la voie (présent dans le git status du début de session) ; g3 n'y a pas écrit. Hors de mon OWNS : à régler par le pilote.

## Captures ouvertes
Toutes les PNG des six variantes, une à une en 1280 et par planche en 390 (clair, cave, geste, tarifs, fiche, liste, recettes).

Prédiction : « Là je corrige mon idée, et à l'ordi plus rien ne se marche dessus ; mais s4b reste un téléphone étiré. »

DÉCISION À PRENDRE : aucune.
CONNAISSANCE : aucune.
LEÇON PROPOSÉE : un `node -e "…"` en Bash avec des backticks dans la chaîne les exécute comme substitution de commande (NOTE.md vidé de deux noms) ; écrire le script dans un fichier par heredoc à guillemets simples.
