OK — série w : 6 concepts « la réponse d'abord », deux par chaleur, PANEL OK

## Fichiers écrits
- `v0/w1` à `v0/w6` : `etat.html`, `NOTE.md`, `capture-haut.png`, `capture-page.png`, et les états `etat-neuve.png`,
  `etat-plein.png`, `etat-nolo.png`, `etat-touche.png` (après un toucher).
- Rien dans `src/`. Outillage de fabrication hors dépôt, dans le scratchpad : un gabarit pour le chrome commun et un script
  d'assemblage par `split/join`, avec préfixe par concept (L26).

## Concepts
| id | chaleur | idée |
|---|---|---|
| w1 | froide | chaque champ montre sa conséquence : tuiles volume (fermenteur dessiné) et ébullition (évaporés) |
| w2 | froide | le récap éditable ligne par ligne, avec une icône teintée par ligne et la jauge dans la ligne |
| w3 | tiède | la carte bière, dans la langue de la carte houblon (rond NOLO, pictos chiffrés, piste « +6 L libres ») |
| w4 | tiède | la phrase-bière : « Je brasse neipa v3 en Double IPA, 24 L en fermenteur, bouillie 60 min, sans NOLO » |
| w5 | chaude | l'étiquette de la bouteille : nom, ruban du style, sceaux 24 L et 60 min, tampon NOLO, niveau |
| w6 | chaude | trois réponses géantes, quoi, combien, comment, avec le tube du fermenteur à l'échelle |

## Sorties décisives
- `verifier-page.mjs <etat.html> --captures … --min-images 0` → PAGE OK, ×6.
- `controle-commun.mjs v0 w1…w6 --page=etat.html --sans=mots,au-style,fiche,trait` → COMMUN OK.
  - Raison du `--sans` : au-style, fiche et trait exigent des houblons (`data-houblon`, pictos de famille). L'écran Identité n'en a pas.
  - Avant correction, contraste (w3, 4,17:1), standard (rayons de 6 et 10 px) et légende (« ? » caché dans w3) étaient en échec. Ils sont corrigés.
- `mots-premier-ecran.mjs --max=80` → MOTS OK.
  - Mots au premier écran : w1 62, w2 71, w3 61, w4 65, w5 51, w6 57.
  - Sans l'en-tête : 52, 61, 51, 55, 41, 47.
- `controle-panel.mjs` (6 captures, copiées sous des noms distincts) → PANEL OK.
  - Remplissage : 0,611 · 0,547 · 0,545 · 0,507 · 0,687 · 0,597.
  - Ressemblance moyenne : sous 0,90 ; aucune paire presque identique.
  - Piège : le contrôle confond des fichiers qui portent le même nom (`capture-haut.png` ×6 → ressemblance 1,00). Il faut le lancer sur des copies renommées.
- `type="number"` : 0. Aucun texte sous 12 px. Aucune cible sous 24 px, hors l'onglet « Eau » du fil commun (22 × 38, hors périmètre).
- `controle-choix.mjs` : sans objet, Identité n'est pas au registre `ecrans.json`.

## Captures à ouvrir
`v0/w<n>/capture-haut.png`, puis, pour chaque concept, `etat-neuve.png`, `etat-plein.png`, `etat-nolo.png` et `etat-touche.png`.

## Prédiction
Il prendra w6 et w3 : w6 pour la réponse qu'on voit à deux mètres, w3 parce que c'est « comme houblons ». Il dira de w4 « pas mal
mais trop de texte », et w5 le divisera par sa teinte crème-or.

## Limites connues
- B6 : 5 à 7 tailles de texte au premier écran partout, chrome commun compris. À resserrer en passe 2.
- Le + flottant peut couvrir un chevron quand NOLO allonge la page (w4, hors repos).
- En maquette, l'évaporation est recalculée à la louche. Dans l'app, le calcul ne change pas.
- Le clavier ouvert n'est pas simulé : il faut `?keyboard=` dans l'app.

DÉCISION À PRENDRE : aucune.
CONNAISSANCE : dans Chrome, le contenu d'un `<details>` fermé garde des boîtes de texte. `mots-premier-ecran.mjs` compte donc ses mots comme visibles (w1 : 85 au lieu de 61). Les concepts w utilisent un repli à `hidden`.
LEÇON PROPOSÉE : `controle-panel.mjs` identifie les captures par leur nom de fichier. Pour un panel de dossiers `<id>/capture-haut.png`, l'appeler sur des copies `<id>.png`, ou le corriger pour qu'il prenne le dossier comme id.
