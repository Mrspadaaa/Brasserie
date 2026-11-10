# Voie p-port-pu4d — son choix pu4d porté dans l'app (D361)

Agent : `auteur` (Sonnet). Plafond : 120 tours. Tu codes dans le worktree. Tu ne commites pas : le pilote commite par chemins.

## Son choix
- Mots du brasseur (SPEC-BRASSEUR, 02.11, soir) : « Ah oui la 1 est toujours mieux sauf une fois elle oublie d'ajouter ce champs ».
- Sa maquette, c'est la base, **telle quelle** (règle n° 1, CLAUDE.md) : `work/missions/2026-10-31-ecran-depense/plateau/v3/pu4d/`. Tu y trouves :
  - `etat.html?etat=repos|a|b|c|d|e|f` et `&theme=cave` ;
  - `NOTE.md`, toutes ses passes ;
  - `src/` ;
  - les captures `pu4d-*.png`.
  Ouvre les captures.
- La greffe de pa1d : sur une ligne hors stock, « article — · hors stock + Suivre au stock ». Voir `plateau/v3/pa1d/pa1d-c.png` et `pa1d/src/pa1.client.js` (classe `PX-art`).
- Elle remplace le plateau de la ligne ouverte, et lui seul. Le récap, la liste, l'en-tête et le pied ne bougent pas.

## Règles qui la portent (decisions.md)
- D350 : aucun menu déroulant dans le plateau ; chaque choix en un toucher (cases, segments).
- D351 : pas de « au centime » quand le calcul tombe juste.
- D352 : unités alignées.
- D353 : la pièce dans chaque choix d'unité, et un « Stk » imprimé qui se lit pièce.
- D354 : déjà fait par g7 ; ne le casse pas.
- D355 : le détail ne nomme aucune autre ligne. Le passage à la suivante se fait par les pastilles du récap.
- D277 : sûr = rien, jaune = repris, rouge = à remplir, sur le champ même.
- D215 : le bis par défaut quand l'α diffère.
- D332 et D357 : Regrouper et Rétablir restent tels quels.

## Méthode (L03, D346)
1. **Inventaire d'abord** : `voies/p-port-pu4d/INVENTAIRE.md`. Pour chaque cas a à f :
   - chaque élément de pu4d, et ce qui en tient lieu dans l'app aujourd'hui (fichier et ligne) ;
   - son sort : gardé, ajouté, ou retiré parce que pu4d ne l'a pas.
   Un port retire ce que sa maquette n'a pas : l'ancien formulaire sous « plus », la phrase d'unité, une pastille en trop (D346).
2. **Branche sur les vraies données** : le stock réel de l'article, « 18 → 24 Kg » calculé, le bis réel. Rien du texte de la fixture ne doit être écrit en dur.
3. Le plateau est dans `src/ui/depense/` (cherche le plateau de la ligne ouverte, p3c) et dans `src/ui/finance/ExpenseSheet.tsx`.
4. **Tests** (D343) : Vitest pour les règles de calcul, comme le stock après réception ou le choix d'unité ; quelques tests de composant pour la structure de chaque cas. Pas de fixtures en masse.
5. Ne supprime aucun test sans le dire. Un test qui affirme l'ancien plateau se met à jour, avec sa raison.

## Hors périmètre
- Le reste de la feuille ; les menus déroulants hors du plateau (« Pour quoi ? » et les suivants).
- doc6 « Même achat » et la pastille TVA de doc14.
- Gemini, les données réelles, le déploiement.
- Ne touche ni à `deploy-hosting-qr` (le banc y tourne), ni à `source4-portable-bundle-manifest-01.json`, ni à `.codex/`, ni à `functions/`, ni à `firebase.json`.

## Contrôles (jusqu'au vert)
- Tests de la Dépense : `tests/unit/depense` et `tests/unit/finance*`, sans échec nouveau.
  Dans ce worktree, `zxing-wasm` et `pdfjs-dist` manquent. Reprends la méthode de g7-reste (`voies/g7-reste/RESULTAT.md`) : des configs temporaires dans le scratchpad, en lecture seule sur `deploy-hosting-qr`.
- `tsc` : 0 erreur. Le build se fait chez le pilote.
- Manifeste `21dd75b3`, avant et après.
- `git status --short` : rien hors de « Possède ».

## Possède
`src/ui/depense/**`, `src/ui/finance/ExpenseSheet.tsx`, `tests/unit/depense/**`, `work/missions/2026-10-31-ecran-depense/voies/p-port-pu4d/**`.

## Rendre
`voies/p-port-pu4d/RESULTAT.md` :
- ligne 1 : `OK — <n> éléments portés, <n> retirés, <n> tests` ou `ECHEC — <raison>` ;
- l'inventaire résumé ;
- ce qui diffère de pu4d et pourquoi : une donnée réelle absente, ou un cas que la maquette ne montre pas ;
- les fichiers touchés ;
- les lignes `LEÇON PROPOSÉE` et `CONNAISSANCE`.
