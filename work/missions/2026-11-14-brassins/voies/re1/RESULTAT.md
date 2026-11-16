OK — e1a à e1d rhabillées : feuille de l'app, jetons, IDENTITE OK 4/4

## Variantes
- [x] e1a : feuille de l'app sur la liste ; bloc de date au ton attention, « Lundi 16.11 » en id-display ; id-segments, id-puce ; curseur de jours = curseur m2 sur bande alerte / attention / houblon ; starter en id-panneau, cases 24 px (cible 44) ; une seule primaire (geste : Annuler + « Enregistrer lu 16.11 » au pied) · écart restant : face à `a1-banc/captures/fiche-fermentation-390-clair.png`, même feuille, même en-tête et même pied ; le bloc de date teinté reste plus marqué que les encadrés de l'app.
- [x] e1b : feuille de l'app ; « Brasser lundi 16.11 » en id-display ; stock, carnet, dossier en id-btn-icone ; bande des 7 jours teintée, jour choisi plein, DH en marque or ; compte à rebours en id-panneau ; à 1280, deux colonnes dans la feuille et cuverie visible (la colonne gauche n'est plus vide) · écart restant : à côté de la fiche de l'app, la bande des jours est le seul élément sans équivalent dans l'app ; le blanc au-dessus du pied de la v0 a disparu, car la feuille prend la hauteur de son contenu.
- [x] e1c : feuille de l'app ; cuve F2 au ton action ; planning en id-panneau, barres teintées (houblon, or, attention, eau), retard en tirets alerte, bloc PA au ton action (noir en clair, paille en cave) ; jours en cartes teintées · écart restant : le planning, à 12 px mono sur 14 colonnes de 23 px, est plus dense que tout écran actuel de l'app.
- [x] e1d : feuille de l'app ; 2/4 en id-reading 28, phrase en id-display ; tuiles teintées (fond 10 %, bord, filigrane 22 %) au lieu des aplats saturés ; « Glisser pour brasser » au pied · écart restant : les tuiles de 132 px restent plus grandes que les cartes de l'app (choix de l'idée : quatre feux lisibles d'un coup d'œil).

## Fichiers écrits
- `voies/e1/e1a…e1d/etat.html` (réécrits sur la trousse), `NOTE.md` (section « Rhabillage re1 » ajoutée), PNG régénérés par `voies/e1/capture.mjs` (mêmes noms).
- `voies/re1/captures-plus.mjs`, `voies/re1/captures/` (cave 390 de chaque variante, repos et geste ; 1280 clair de e1a, e1c, e1d ; geste cave de e1b), `voies/re1/tests.txt`, ce fichier.

## Critères (rejoués depuis la racine, sortie dans `tests.txt`)
- G1 : IDENTITE OK 4/4
- G2 : RHABILLE OK
- G3 : HORS OK
Tests : aucune suite Vitest (rien dans `src/`) ; `tests.txt` porte les trois sorties.

## Captures ouvertes
`e1/e1a/e1a-repos-390-clair.png`, `e1a-geste-390-clair.png`, `e1/e1b/e1b-repos-390-clair.png`, `e1b-geste-390-clair.png`, `e1b-repos-390-cave.png`,
`e1b-repos-1280-clair.png`, `e1/e1c/e1c-repos-390-clair.png`, `e1c-geste-390-clair.png`, `e1/e1d/e1d-repos-390-clair.png`, `e1d-geste-390-clair.png`,
`re1/captures/e1a-geste-390-cave.png`, `e1c-geste-390-cave.png`, `e1c-repos-1280-clair.png`, `e1d-repos-390-cave.png`.
Non ouvertes (produites, même gabarit) : `re1/captures/e1a-repos-390-cave.png`, `e1a-repos-1280-clair.png`, `e1b-geste-390-cave.png`,
`e1c-repos-390-cave.png`, `e1d-geste-390-cave.png`, `e1d-repos-1280-clair.png`.

## Limites
- Les anciens `etat.html` de e1 ne sont pas suivis par Git (`.gitignore` : `/work/missions/**`) : la v0 d'avant rhabillage n'a pas de copie ; ses chiffres et textes sont repris tels quels.
- « 1,5 » et « 1,062 » en IBM Plex Mono gardent la virgule large de la police, comme dans l'app.

Prédiction : « Là ça ressemble à l'app » ; e1c restera jugée dense, e1d la plus parlante.

DÉCISION À PRENDRE : aucune.
CONNAISSANCE : `/work/missions/**` est ignoré par Git : une voie qui réécrit une maquette sur place détruit la précédente sans recours ; copier d'abord dans `os.tmpdir()`.
LEÇON PROPOSÉE : avant de réécrire un fichier de `work/missions/`, vérifier `git check-ignore` ; s'il est ignoré, copier l'original (L17 suppose une copie dans Git qui n'existe pas ici).
