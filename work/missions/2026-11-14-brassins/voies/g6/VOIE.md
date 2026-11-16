# Voie g6 — Greffes e6a × e6c : la liste d'aplomb, avec les filtres qui comptent

- Mission : 2026-11-14-brassins · Agent : concepteur · Modèle : opus (Fable interdit) · Niveau : conception · Plafond : 40 tours · Dépend de : g2a · Décideur : brasseur (il choisit sur la page)

## Objectif
Ses mots (15.11), mot pour mot : « e7a — e6a — e6c Des filtres qui comptent — Créer un brassin ?? Pas convaincu — e4c ». Pour la vue
« Retrouver, trier, filtrer et ranger » : 3 greffes de **e6a** (« La liste actuelle, remise d'aplomb ») qui prennent les **filtres qui
comptent** de **e6c** (puces avec leur compte, ce qui est filtré visible, retour à tout en un toucher). La liste reste celle de e6a ;
seuls les filtres viennent de e6c. Plancher à enrichir (L07).

## Entrées
- Parents (Read, chaque image une fois) : `work/missions/2026-11-14-brassins/voies/e6/e6a/` et `voies/e6/e6c/` (etat.html, PNG, NOTE.md).
- Critique des parents : `voies/k2/VERDICT.md` § e6a et § e6c ; ce qui a été corrigé : `voies/g2a/RESULTAT.md`.
- Trousse d'identité, obligatoire : `work/missions/2026-11-14-brassins/outils/identite/` (LISEZMOI.md, identite.css, chrome.js).
- `work/missions/2026-11-14-brassins/BRIEF-AUTEUR.md` § Les chiffres ; `DONNEES-COMMUNES.md` ; gabarit : `voies/e6/capture.mjs`.

## Possède (seuls chemins où écrire, avec RESULTAT.md)
- `work/missions/2026-11-14-brassins/voies/g6/` : `g6a` à `g6c` (`etat.html`, PNG, `NOTE.md`), `capture.mjs`. Rien dans `src/`. Ni commit ni stash.

## Consignes
- 3 greffes vraiment différentes dans la place et la forme des filtres (ex. : rangée de puces comptées sous la recherche ; filtres
  repliés en une ligne « 3 en cours · 1 à conditionner » ; filtres en tête de section). Tout brassin en cours reste visible par défaut
  (le filtre « Ce mois » qui cachait 3 brassins sur 5 est un défaut connu).
- Images par greffe : `<id>-repos-390-clair.png`, `<id>-geste-390-clair.png` (un filtre posé et la liste qui en résulte),
  `<id>-vide-390-clair.png` (filtre sans résultat), `<id>-repos-390-cave.png` ; la meilleure ajoute `<id>-repos-1280-clair.png`. Ouvrir
  chaque image (Read) une fois.
- `NOTE.md` : chaleur, « Idée : » (6 mots au plus pour le nom), ce qui vient de e6a, ce qui vient de e6c.

## Exigences transversales et acquis (recopiés, leçons L05 et L06)
- Identité de l'app (trousse, contrôle d'identité OK) ; chiffres à la virgule ; inconnu « — » ; cibles ≥ 44 px ; clair et cave ; 390 et
  1280 ; premier plan actionnable ; données de BRIEF-AUTEUR et DONNEES-COMMUNES seulement.

## Critères
`work/missions/2026-11-14-brassins/voies/g6/GATES.md`, depuis la racine du dépôt.

## Rendre
- `RESULTAT.md` tenu au fil (tous les 5 éléments).
- La ligne « Tests » écrite dans un fichier : aucune suite Vitest ; `tests.txt` porte la sortie des CHECK.
- Voie d'écran : captures 390 tactile et 1280, clair et cave, toutes ouvertes.
Réponse finale au pilote : une ligne.
