# Reste de la voie « transverse » (D402), pour les voies propriétaires

Relevé du 21.11, dans le worktree `port-carnet`. La voie transverse n'a pas touché ces fichiers : ils appartiennent à d'autres voies.
Rejouer : `npx vitest run tests/unit/rejeu-649b/virgule-transversale.test.ts tests/unit/designTokens.test.ts`.

## virgule-transversale (3 occurrences, voie `src/ui/etapeLevure/**`)

Contrôle : `node scripts/agents/controle-virgule.mjs`. Les numéros de ligne datent du relevé.

- `src/ui/etapeLevure/CarteDose.tsx:152` `{onOffre} g` : faux positif, c'est la prop `g={enG}` qui suit `onOffre={onOffre}`.
  Remède sans toucher le rendu : écrire `g={enG}` avant `onOffre={onOffre}` (même chose à la ligne 216), comme fait pour `MurStock.tsx` et `FicheFermentation.tsx`.
- `src/ui/etapeLevure/CarteDose.tsx:216` : idem.
- `src/ui/etapeLevure/CarteDose.tsx:259` `{m.y.toFixed(1)} L` : chemin SVG (`M`, `L`), pas un affichage. Remède : ajouter en fin de ligne
  `// virgule-ok : chemin SVG (M, L), pas un affichage` (la règle existe déjà : la ligne porte `virgule-ok :`).

Rien dans `src/ui/calendrier/**`, `CalendrierTab.tsx`, `BrewWizard.tsx`, `src/domain/hopIndex/**`, `Caisse.tsx`, `src/ui/gestes/**`.

## designTokens (2 classes, voie `src/ui/calendrier/**`)

- `src/ui/calendrier/LienSection.tsx:35` (ligne 30 au relevé) `text-cave-100` : degré absent (palette : 950 900 850 800 700 600 400 200 50).
  Remplacer par `text-cave-200` (texte courant), comme ailleurs dans la voie transverse.
- `src/ui/calendrier/LienSection.tsx:36` (ligne 31) `text-cave-300` : remplacer par `text-cave-400` (texte secondaire).

Correspondance retenue partout : `text-cave-100` vers `text-cave-200`, `text-cave-300` vers `text-cave-400`, `border-cave-500` vers `border-cave-600`.
Avant, ces classes ne produisaient aucune règle : l'élément héritait de son parent ; le jeton rend la couleur voulue explicite.

## fix114 et invoiceScanCache-d273c

Rien ne reste : les deux fichiers passent entièrement.

## Carnet : CRN-11 et CRN-20 (voie Calendrier, `src/ui/calendrier/entete/**`)

Relevé du 21.11 par la voie Carnet (critique `work/missions/2026-11-19-carnet-tour3/voies/CRITIQUE-CARNET.md`, captures
`k2/final-head/` ; revues sur l'arbre `port-carnet` après CRN-9 : `390-30a`, `30c`, `1280-40a` à `40d`). La voie Carnet n'a pas touché
ces fichiers.

- **CRN-11 (B)** · 390-30a, 30c, 22, 23 : après le Calendrier « 3 mois », la période « 26.10.26–24.01.27 » reste dans l'en-tête de
  l'app hors du Calendrier (Carnet, Finances). Elle pousse les avatars G et A sur une 2e ligne : l'en-tête prend ~40 px de plus, pour une
  info sans effet sur le Carnet (CAL-ENTETE, 21.11 : place inutile, en-tête trop haut).
  Attendu : hors des écrans qui lisent la période, l'en-tête garde sa hauteur d'une ligne (période courte « Nov. » ou rien) ; à 390,
  G et A restent sur la ligne du logo. Contrôle à écrire : hauteur de l'en-tête identique avant et après « 3 mois », mesurée sur le Carnet.
- **CRN-20 (m)** · 1280-40a/40b contre 40c/40d : la même période s'écrit « 26 oct. 2026 — 24 janv. 2027 » en clair et
  « 26 oct. 2026 → 24 janv. 2027 » en cave. Attendu : un seul séparateur, le même dans les deux thèmes (texte du composant, pas du thème).
  Contrôle : le `innerText` de la période est identique après bascule Clair/Cave.
