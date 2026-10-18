# Lot 4 · fiche du houblon à l'appui long (écran 1) — brief auteur

Tu ajoutes **la fiche d'un houblon**, ouverte par un appui long (téléphone) ou un survol long
(ordinateur), sur la **baseline p3** que le brasseur a choisie. Écris en français. Répertoire :
C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie (chemins absolus). Texte avec barres
obliques inverses ou accents graves : outil Write, jamais Bash. Fichiers de travail dans un
sous-dossier à toi du scratchpad.

## Ce que le brasseur a dit (mot pour mot)

- « Aussi je voudrais que quand je fasse un appuie long, hover long super ordinateur, sur
  houblons, je puisse voir sa fiche en détails. » ; « Regarde pour des mini Proto de ça aussi ».
- « Je comprends pas ces nouveaux screen, on avait établi une Baseline, ça différent
  complètement ? » → **hors de la fiche, rien ne change** (contrôle D26).
- Sa règle de densité : « on doit voir que en premier plan les informations réellement utilise.
  Ensuite on peut trouver plus d'infos avec des raccords, renvoie, replis ou autre. » La fiche
  est ce « plus d'infos » : dense, mais pas surchargée.
- Sur le stock : « Juste un petit badge ou info très subtil suffit. »

## Lis (et rien d'autre)

1. `scratchpad\baseline-p03\README.md` puis le générateur qu'il décrit : **pars de lui**
   (copie dans ton sous-dossier). Chaque nom de houblon porte `data-houblon="<clé>"`.
2. `work/refonte-frontend/v4/ecran-1/MODELE.md` et `work/refonte-frontend/v4/DEFAUTS-RECURRENTS.md`
   (D14, D20, D23, D25, D26).
3. Références : la fiche Beer Maverick du brasseur, `work/refonte-frontend/v3/reference/beer-maverick/`
   (`10-fiche-target-identite.jpg`, `11-fiche-target-arome.jpg`, `12-fiche-target-valeurs.jpg`,
   `13-fiche-target-styles-substituts.jpg`, `telephone/t1` à `t7`) et `constats.md` ; ce qu'il
   y a de bon (identité, étiquettes, silhouette, plages de valeurs, substituts) et de lourd
   (une phrase par mesure, 7 écrans).
4. Le pack `prototypes/houblons-v4/data/pack-mini-protos.json` : `fichesHoublons` (en cours
   d'ajout, ou dans `pack-fiches.json` : relis juste avant d'écrire ; identité, alpha, bêta,
   huiles, arômes par famille avec sources, descripteurs, substituts, stock, dansRecette, IBU
   par gramme selon le moment, goût) et `roueAromes`. Tant qu'un champ manque, ne l'invente
   pas : « non renseigné ». Aucun chiffre calculé dans la page.

## Contrat (contrôlé, D25)

- Un **toucher court** garde son action actuelle et n'ouvre pas la fiche.
- Un **appui long** (≈ 500 ms ; retour visuel pendant l'appui) ouvre `data-role="fiche"`, qui
  nomme le houblon ; à l'ordinateur, un **survol de 700 à 900 ms** l'ouvre aussi.
- Dedans, visibles à l'ouverture : `data-role="fiche-alpha"` (« 11–14 % α »),
  `data-role="fiche-arome"` (arômes et sources, « 2/4 fiches »), une silhouette
  `<svg data-radar data-objet="fiche" data-axes="…">` (même contrat que les radars : roue,
  silhouette pleine, ≥ 5 axes), et le geste `data-role="gout"` (aimer, neutre, exclure).
- ≤ 100 mots visibles à l'ouverture ; le reste (huiles en détail, substituts, sources) à un
  geste dans la fiche. Aucun « null », « undefined », « NaN ».
- `data-role="fermer-fiche"` la ferme ; Échap aussi.
- Ce qui dit l'usage du houblon dans **cette** recette (moment, dose, IBU, ou « +N IBU à 10′ »
  pour un ajout proposé) vaut plus qu'une généralité.
- La découverte : un appui long ne se devine pas ; trouve un indice discret (sans texte ajouté
  hors de la fiche, sinon D26 échoue).
- Pages concernées : `index.html` (l'étape) et `comparer.html` ; les autres pages peuvent
  l'avoir aussi.

## Ta variante

Ton message te donne un numéro (pNN), une **température** et un **parti**. Tiède = le parti est
imposé ; chaud = libre, surprends ; froid = repars des idées retenues.

## Pages et contrôle, avant de t'arrêter

`work/refonte-frontend/v4/ecran-1/fils4-fiche/pNN/` : les 9 pages de la baseline (avec la
fiche) et `NOTE.md` (5 lignes : parti, geste, contenu au premier plan, ce qui est replié,
limites). Ajoute une page `fiche.html` : l'étape avec la fiche de Nugget **déjà ouverte** (pour
les captures et la planche).

`node work/refonte-frontend/v4/tournoi/outils/controle-lot.mjs work/refonte-frontend/v4/ecran-1/fils4-fiche pNN [pMM] --mots=80 --fill=0.8 --boosters=4 --fiche --baseline=work/refonte-frontend/v4/ecran-1/fils3/p03`

Il doit imprimer `LOT OK`. Regarde tes captures (`fils4-fiche/captures/`, dont `pNN-fiche-390.png`).
Trois passes au plus. Réponse finale : une ligne par variante (parti, geste, mots dans la
fiche, ce qui est replié).
