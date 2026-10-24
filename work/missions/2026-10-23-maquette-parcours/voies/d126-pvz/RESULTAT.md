OK — série pvz : quatre concepts v0 de la pastille « ~ simulé », posés sur r6a, captures repos et toucher

## Concepts (une ligne chacun : chaleur, idée, ce qui tient, ce qui casse)
- **pvz1** — chaleur tiède — les repères : la pastille numérote l'écran (❶ fiches → Chimie, ❷ ❸ ❹ posés sur la ligne « fixé pour les trois ») et deux portes « ● Chimie › ● OSU › » — tient : rien de nouveau à apprendre, 21 mots, les entrées du moteur sont déjà sous ses yeux — casse : pousse le radar de 110 px, ne dit pas pour quel houblon on a mesuré.
- **pvz2** — chaleur chaude — l'échelle de confiance : trois paliers des fiches à la bière (hachuré, pointillé, plein), Galaxy / Idaho 7 / Cascade chacun sur le sien avec sa raison, toucher = sa preuve — tient : répond à « et je peux m'y fier ? », valeurs relevées de la feuille Chimie — casse : 37 mots, paliers qualitatifs.
- **pvz3** — chaleur chaude — côte à côte : le radar du moteur à gauche, le même cadran « en bière » à droite, hachuré, un seul axe mesuré (floral : Cascade 57, Idaho 7 38±13 ?, Galaxy rien) — tient : se comprend sans lire, 12 mots, le côte à côte qu'il réclame — casse : le radar r2 réduit de moitié tant que c'est ouvert.
- **pvz4** — chaleur chaude — avant / maintenant / après la cuve : fiches des labos → le moteur (tu es ici) → ta cuve à J+14, hachurée, rien de mesuré ; pied « mesuré par d'autres » → Chimie — tient : pense en brasseur, l'« après » vide dit l'honnêteté — casse : le pied résume sans les µg/L, cases à 12 px.

## Fichiers écrits
- `work/refonte-frontend/v4/ecran-1/fils24-petits-choix/pvz{1,2,3,4}/{etat.html,pvzN.css,pvzN.js,NOTE.md}` : `etat.html` est
  `fils22-comparer/r6a/etat.html` copié tel quel (correction du pilote, D128), plus le titre suffixé et deux lignes avant `</body>`.
- `work/refonte-frontend/v4/ecran-1/fils24-petits-choix/captures/pvz{1,2,3,4}-{repos,toucher}.png` (390 × 844, ×2).
- Scripts de travail (capture, inspection du DOM) dans le dossier temporaire `d126-pvz`, hors dépôt.

## Critères
- G1 : `SERIE-BIEN-4`.
- G2 : `COMMUN OK` (mots sauté par `--sans=mots` ; les onze autres OK).
- G3 : `NOTE OK` (ce fichier nomme pvz1 à pvz4 et leur chaleur).
- Indicatifs, joués une fois et recopiés dans chaque NOTE : `controle-panel.mjs` sur les quatre captures au toucher : PANEL OK
  (remplissage médian 0,77 ; ressemblance 0,89 ; 0 paire presque identique) ; `controle-une-question.mjs` : UNE-QUESTION OK
  (1 groupe libre : houblon) ; `mots-premier-ecran.mjs --sans-donnees` : 39 mots pour chaque page, comme r6a ; capture : repos
  `aria-expanded=false` → toucher `true` → Échap `false`, pont ouvre « Chimie et vraies valeurs », 0 erreur de page, pas de
  débordement horizontal.
- `controle-choix.mjs --ecran=comparer` (copie en tmp) : CHOIX ECHEC, attendu : il exige la reprise balisée, D107 et les 18 états
  de la construction, que r6a seule n'a pas. La preuve du choix est le diff : chaque `etat.html` ne diffère de r6a que par le
  titre et deux lignes de script.

## Captures regardées (L12)
Les huit, ouvertes en image ; au repos, les quatre sont r6a (`r6a-premier-ecran.png`) au pixel près. Défauts vus et corrigés avant
de rendre : pvz1, numéros qui recouvraient la fin des mots de la ligne de contexte et « Panel OSU » rejeté à la ligne ; pvz3,
« rien » sur l'axe ; pvz4, trait de la frise visible à travers la case hachurée et point noir orphelin.

## Prédiction
Il garde pvz3 (« ah ouais, en bière il y a rien, ok ») et pvz2 pour la confiance par houblon ; pvz1 lui semblera « pas mal mais
ça pousse tout » ; pvz4 « joli mais j'ai pas les valeurs ».

DÉCISION À PRENDRE : aucune.
CONNAISSANCE : aucune.
LEÇON PROPOSÉE : une voie « seul l'élément change » sur un écran choisi doit recevoir le chemin exact de sa maquette (ici r6a) dans
VOIE.md, pas « Comparer rendu » : le brief P citait la Comparer du jour, et la série a d'abord été posée dessus avant la correction.
