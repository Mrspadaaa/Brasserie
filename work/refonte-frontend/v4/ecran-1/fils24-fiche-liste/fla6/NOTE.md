# fla6 — lot D125, la liste de la fiche, série a (les mots d'abord)

- **Chaleur : chaude**
- Question : « Que sent ce houblon, dit avec ses mots ? » Facteur libre : la façon de dire les arômes ; houblon, fiche et style en contexte.

## Idée
La roue des mots : au centre le radar g1, autour un anneau des familles, et dehors une couronne où chaque mot a sa part (plus haute quand toutes les fiches le disent). Les mots sans famille ont leur part, grise au pointillé ; « * » : classé, pas senti. En-tête centré.

## Ce qui tient
Nelson Sauvin : la roue est aux trois quarts grise, ce que le radar seul cachait ; Nugget : une roue pleine de couleurs.

## Ce qui casse
Les étiquettes autour de la roue se serrent quand elles sont nombreuses (Nugget, 12) ; le gris domine sur Nelson Sauvin et peut sembler éteint ; bas de l'écran vide.

## La jouer
`etat.html` : l'étape Houblons de la base v4.10 au repos (stout 16D, Nugget à 60′ ; Nelson Sauvin, Citra cryo, Motueka, Cascade proposés ; profil au style). Appui long (ou survol long à l'ordinateur) sur un houblon : sa fiche g1 avec cette liste ; ✕ ou Échap la ferme. `etat.html#fiche=<clé>` l'ouvre directement.
Captures (`../captures/`) : `fla6-premier-ecran.png` (nelson-sauvin, ouverte par un vrai appui long), `fla6-page.png` (feuille dépliée) ; états : nugget, motueka.
Générateur commun de la série : `../fla1/commun/` (`donnees.mjs`, `socle.mjs`, `generer.mjs`, `capturer.mjs`) ; ce concept : `concept.mjs`.

## Baseline (suivie)
Pictos au trait de `pictos-familles.svg` (épicé : cannelle et clou croisés, `p-spice`), couleurs des familles (jetons), α en plage puis lot et jauge, usage en mot, au style par défaut (lentille au style / absolu sur l'étape ; légende derrière un « ? » discret), stock en petit badge, thème blanc, ✕ rond pour sortir, appui long → la fiche. Radar g1 avant la liste (D115).

## Honnêteté
Chaque mot vient d'une fiche du dépôt (`pack-fiches.json`), traduit (White wine → vin blanc, gooseberry → groseille à maquereau, Pineapple → ananas, black currant → cassis…) ; `donnees.mjs` vérifie chaque mot d'origine et chaque famille contre la fiche avant de générer. n/N = fiches qui le disent sur fiches lues. Les « Familles déclarées » de Hopsteiner sont dites « classé », pas présentées comme des mots sentis. L'inconnu : « ? » hachuré, jamais zéro. Aucun nombre simulé dans la fiche ; le rond de « ma bière » sur l'étape est le modèle de la base (~), le résineux vient de ta dégustation du 18.10.

## Sorties des contrôles
- Baseline : `controle-commun.mjs … --page=etat.html --sans=mots` → COMMUN OK (couleurs, au-style, survol, blocs, contraste, fiche, standard, trait, legende, parlant, brutes ; mots sauté par --sans=mots, comme le demande GATES.md).
- Panel de la série : `controle-panel.mjs` → PANEL OK — 8 captures · remplissage médian 0,67, 0 sous 0,50 · ressemblance moyenne 0,87 · paires presque identiques 0/28 (0 %).
- Indicatifs, joués une fois sur `etat.html` au repos (ils lisent l'étape, pas la fiche ouverte : à porter sur la fiche en passe 2) :
  - `controle-une-question.mjs` → UNE-QUESTION ECHEC : titre « Houblons 3/7 » sans « ? », 4 sélecteurs « Ajouter … » hors de [data-libre], pas de [data-role="contexte"] (c'est l'étape de la base, derrière la fiche).
  - `controle-sans-famille.mjs` → SANS-FAMILLE ECHEC : « Nelson Sauvin (83 % sans famille) : aucune part autres visible » (au repos la fiche est fermée ; ouverte, ses mots hors des 12 sont au premier plan).
  - `mots-premier-ecran.mjs --sans-donnees` → 38 mots (hors données) au repos.
