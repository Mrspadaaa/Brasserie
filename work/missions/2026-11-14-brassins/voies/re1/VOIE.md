# Voie re1 — Rhabiller e1 à l'identité de l'app

- Mission : 2026-11-14-brassins · Agent : concepteur · Modèle : opus (Fable interdit) · Niveau : conception · Plafond : 40 tours · Dépend de : id · Décideur : pilote

## Objectif
Ses mots (15.11) : « Ça semble pas du tout respecter l'identité global de l'app ?? ». Les variantes e1a, e1b, e1c, e1d gardent leur idée,
leur composition, leurs textes et leurs chiffres (déjà corrigés par la critique) ; elles prennent l'identité de l'app : jetons des deux
thèmes, Source Sans 3 et IBM Plex Mono, échelle (≤ 28 px, graisse ≤ 700), rayons 10, 16, 24, composants, et le chrome de l'app. Une
maquette doit se lire comme un écran de l'app, pas comme une affiche.

## Entrées
- La trousse : `work/missions/2026-11-14-brassins/outils/identite/LISEZMOI.md`, `identite.css`, `chrome.js`, et sa démo `demo/demo-390-clair.png` (Read).
- L'app réelle à côté (Read) : `work/missions/2026-11-14-brassins/voies/a1-banc/captures/liste-remplie-390-clair.png`, `fiche-fermentation-390-clair.png`,
  `liste-remplie-390-cave.png` ; `DESIGN.md` § Colors, Typography, Shapes, Do's and Don'ts.
- Tes variantes : `work/missions/2026-11-14-brassins/voies/e1/` (`etat.html`, `NOTE.md`, PNG, `capture.mjs` de la série).

## Possède (seuls chemins où écrire, avec RESULTAT.md)
- `work/missions/2026-11-14-brassins/voies/e1/` (etat.html, NOTE.md, PNG des variantes) et `work/missions/2026-11-14-brassins/voies/re1/`. Rien dans `src/` ni dans la trousse. Ni commit ni stash.
  Fichiers de travail : ton OWNS, ou `os.tmpdir()` préfixés `re1-`.

## Consignes
- Charger la trousse par lien relatif (`../../../outils/identite/identite.css` et `chrome.js`) ; retirer de chaque variante ses couleurs
  en dur, ses polices, ses graisses > 700, ses tailles > 28 px et ses rayons hors échelle ; les remplacer par les jetons et classes
  `id-`. Couleurs de données : seulement celles permises par LISEZMOI (familles, styles, sémantique, EBC).
- Chrome : un écran de l'onglet (liste, bilan, carnet de recettes, atelier, volumes, coque) porte l'en-tête, la barre des sous-onglets
  et la barre du bas de l'app ; une fiche ou une saisie est une feuille de l'app (poignée, rayon 24) posée sur l'écran.
- Ne rien retirer de l'idée : la phrase-réponse reste en tête, en `id-display` (28 px au plus) ; graphes et boosters gardés, recolorés.
- Régénérer TOUTES les images de chaque variante par le `capture.mjs` de la série (mêmes noms) ; ouvrir chacune (Read) ; comparer au
  moins un repos par variante à la capture de l'app et noter l'écart restant en une ligne dans RESULTAT.md.
- Vers 150 k de contexte, finis les images en cours et rends.

## Exigences transversales et acquis (recopiés, leçons L05 et L06)
- Saisie au curseur (m2) ; jamais `type="number"` ; inconnu « — » ; chiffres à la virgule ; cibles ≥ 44 px ; clair et cave ; 390 et 1280 ;
  premier plan actionnable, pas de cockpit ; aucun chiffre changé.

## Critères
`work/missions/2026-11-14-brassins/voies/re1/GATES.md`, depuis la racine du dépôt.

## Rendre
- `RESULTAT.md` tenu au fil (tous les 5 éléments) : une ligne `- [x] <id> : <ce qui a changé> · écart restant : …` par variante.
- La ligne « Tests » écrite dans un fichier : aucune suite Vitest (rien dans `src/`) ; `tests.txt` porte la sortie des CHECK.
- Voie d'écran : captures 390 tactile et 1280, clair et cave, toutes ouvertes.
Réponse finale au pilote : une ligne.
