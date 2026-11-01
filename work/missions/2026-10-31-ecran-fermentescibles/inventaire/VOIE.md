# Voie i1 — inventaire et captures de l'étape « Malts/sucres 2/7 » telle qu'elle est aujourd'hui

Agent : executant (Haiku). Lecture du code et captures ; aucun changement de code. Écris RESULTAT.md tôt.

## 1. L'inventaire : `inventaire-fermentescibles.md`, dans ce dossier
Suis la structure de `work/missions/2026-10-31-ecran-identite/inventaire-identite.md` :
- **L'écran en un coup d'œil** : l'accès, la racine (fichier et lignes) et les fichiers propres. L'étape porte l'id `fermentescibles`,
  vers `src/pages/BrewWizard.tsx` l. 437 ; ses données `fermentables`, l. 660.
- **Blocs, du haut vers le bas** : un tableau numéro | bloc | composant | `fichier:ligne`.
- **Fonctions** : chaque geste possible.
  - Ajouter un malt ou un sucre, et comment ; changer la masse ; retirer ; comparer.
  - Ce que montre le bandeau commun : grain, OG, IBU, EBC.
  - Le rendement, les sucres et les extraits, les catalogues lus.
- **États** : recette vide, recette collée, valeur inconnue, hors ligne, erreur.
- **Données lues et écrites**, et les **tests** qui couvrent l'étape (par import ou par libellé).
Cite les lignes exactes. Rien d'inventé : un doute s'écrit comme doute.

## 2. Les captures : dans `captures/`, ce dossier
Sers-toi de l'outil de la voie e2, `work/missions/2026-10-31-systeme-ecrans/voies/e2-inventaire/capturer.mjs` : son en-tête dit comment
le lancer. Lance-le depuis la copie de production `C:/Users/mrspa/AppData/Local/Temp/atelier-ecrans`, avec `?dev-local` : aucun jeton,
aucune donnée réelle. S'il ne sait pas atteindre l'étape 2, copie-le dans ce dossier et adapte la copie.
- 390 × 844 :
  - l'étape 2 avec une recette remplie : neipa ou fixture de démonstration, avec plusieurs malts et un sucre si possible ;
  - l'étape 2 sur une recette vide ;
  - le geste « ajouter », la feuille ouverte ;
  - le panneau de comparaison, s'il existe.
- 1280 × 900 : l'étape 2, recette remplie.
Ouvre chaque capture (L12) et décris-la en une ligne dans RESULTAT.md.

## Possède
`work/missions/2026-10-31-ecran-fermentescibles/inventaire/`. Rien dans `src/`, et rien dans la copie atelier-ecrans, que tu lis et
lances sans la modifier. N'écris aucun code par heredoc ni par `node -e`. Pas de `git stash`, aucun commit. Rends une ligne.
