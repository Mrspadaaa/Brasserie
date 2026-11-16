OK — « 19 L » grisé (titre en nœud) ; « + » dans la rangée de fin, à 8 px de « Suivant », 7 étapes

## Fichiers écrits
- `src/pages/PageShell.tsx` : `title: ReactNode` + `titleLabel` (nom du `main` et `aria-label` du `h1`) ; kind `page-row` ; la rangée de fin (`data-page-end-actions`, `flex gap-2`) porte `ActionDock kind="page-row"` 48 px à droite de `endActions`, priorité `dockPriority - 0.5` (la case d'en-tête clavier ouvert garde la main) ; `pr-16`, marge en ligne et état `largeur` retirés.
- `src/ui/FloatingActions.tsx` : pour `page-row`, le lanceur suit la case tant qu'elle est entière dans le `main` (écoute `scroll`), sinon il flotte comme avant ; observe aussi la colonne `data-floating-actions-gap` (défaut vu à la capture Identité 390 : le contenu qui grandit laissait le « + » à l'ancien emplacement).
- `src/pages/BrewWizard.tsx` (pied seulement) : `nav` `py-1` ; pied du Récap : boutons d'enregistrement gardés, case `page-compact` 48 px à leur droite (priorité propre, sous l'en-tête).
- `src/pages/RecipePage.tsx` (titre seulement) : `<span class="font-normal text-cave-400">19 L</span>` + `titleLabel`.
- `src/ui/water/eau.css` : règles caduques du « + » de l'Eau retirées (padding-right 4,75/4 rem, `right: max(...)`).
- Tests : neuf `tests/integration/assistantPiedPlus.test.tsx` (12 tests : 6 étapes Identité→Eau, Récap, titre nœud/chaîne/fiche, suivi de la case au défilement, colonne observée) ; mis à jour sans affaiblir `tests/integration/eauW1b.test.tsx` (l. 222 : plus de règle propre à l'Eau, la case de PageShell) et `tests/unit/hopIndexV4/etapeHoublons.test.tsx` (l. 145 : case `page-row`, et `'pr-16'` absent).
- Banc : `capturer-pied.mjs`, `captures/` (56 PNG + journal.json), `capture-log.txt`, `tests.txt`, `tests2.txt`, `build.txt`.

## Critères
- tsc : 0 erreur.
- `npm run build` : vert, DRAPEAUX OK (build.txt).
- Tests liés (9 fichiers, 98) verts. Tests larges (137 fichiers : FloatingActions, brewWizard*, compactRecipe, companion, pageShellPerformance, recipeEditing, etapeLevure, hopIndexV4) : 1260 verts, 6 échecs, tous `recipeEditing` (toBeVisible ×4, « Hypothèses et réglages complémentaires » en double ×2 : étape Levure, sans rapport avec le pied) : même nombre que les 6 connus du tag ; non rejoués sur le tag lui-même (pas de stash permis), identité jugée sur le nombre et le fichier.
- Rouge avant : le test neuf cherche `page-row`, absent du tag, et le test de colonne observée a échoué sur `FloatingActions` sans l'observateur (vu rouge ensuite vert).
- Captures (banc `?dev-local&etape=levure`, puis le fil d'étapes) : 7 étapes × 390 tactile 844 / 1280 × clair / cave × haut et bas = 56, journal : écart « + » ↔ « Suivant » = 8 px à toutes les étapes à Suivant (24 cas), 0 erreur de page, aucune requête externe. Ouvertes en image : Paliers clair 390 ; cave 390 Identité, Malts, Houblons (haut et bas), Levure, Eau, Récap ; clair 1280 Eau et Levure ; cave 1280 Récap (premier essai, chargement paresseux : refait). « + » jamais sur un contrôle (le journal liste des « recouvre » : éléments cachés sous la page ou rognés, aucun visible sur les images).
- Comparaison aux maquettes r2 / w1b : même rangée (Retour à gauche, « Suivant — <étape> » puis « + » rond à droite), pied du Récap en plus.

## Essais utilisés
Un par critère ; une correction de code après capture (colonne observée).

## Doutes et limites
- Le « + » flottant (hors case) garde sa forme 64×40 (BX-4) ; docké, il prend 48×48 rond comme les maquettes : bascule de forme au moment où la case entre à l'écran. Si le brasseur veut une seule forme : changer la case ou le flottant (non fait).
- Récap à 390 : les deux boutons d'enregistrement passent sur deux lignes à côté du « + » (pied ~96 px). Les maquettes n'ont pas de Récap ; pas de choix ouvert au brasseur sans maquette.
- Pied du Récap : une case vide de 48 px existe sans lanceur monté (même mécanisme que la fiche).
- Étape « Eau » mobile, onglet « 2. Sels » : la case est masquée par `floating-actions.css` (le lanceur y est docké par l'atelier) ; non recapturé.
- `work/refonte-frontend/v4/choix/ecrans-app.json` est modifié dans le dépôt : pas par cette voie (probablement l'autre voie ou un script).
- Les 3 échecs `eauW1b` RC-1 (« 70 % » au lieu de « 45 % ») vus en cours de route venaient du travail parallèle sur `src/domain/water/` ; verts au rejeu final.

CONNAISSANCE : le « + » de l'assistant est une case de la rangée de fin de `PageShell` (`ActionDock kind="page-row"`), suivie par `FloatingActions` quand elle est entière dans le `main`, plus aucune marge de réserve ni règle CSS propre à l'Eau.
LEÇON PROPOSÉE : un bouton fixe qui suit une case doit observer aussi la colonne qui la contient, pas seulement la case et sa rangée : le contenu qui grandit au-dessus la déplace sans qu'elle change de taille.

## SUITE 16.11 (critique SYNTHESE : 5 problèmes) — TERMINÉE
Ligne 1 mise à jour : OK — dans l'assistant le « + » ne flotte plus (posé dans la rangée de fin, effacé hors écran) ; Récap aligné.
Preuves : tsc 0 erreur (tsc2.txt) ; build vert, DRAPEAUX OK (build2.txt) ; `assistantPiedPlus` 21 verts ; 142 fichiers liés (tests4.txt) : 1350 verts, 6 échecs, tous `recipeEditing` (les 6 connus du tag). Captures ouvertes (captures-suite/) : Eau clair 30 % et cave 65 % (« −33 » et « 5,9 mL » visibles, aucun « + »), Levure 45 % (« + » dans la rangée collante), Sels cave bas, Récap clair bas, menu du « + » ouvert (Paliers clair), page de la recette (« 30 L » grisé, « + » à droite de « Préparer un brassin »), Récap cave 1280, Houblons clair 1280. Mesures : « + » au bord droit 382 (390) et 1012 (1280) au Récap comme aux autres étapes (journal2.json).
n° 5 (Houblons 1280, « Ouvrir l'analyse » tranchée) : non corrigé, voulu : c'est le bord d'une rangée collante opaque sur un contenu qui défile dessous (comportement du tag) ; une marge basse ne change rien en haut de page. Doute signalé.
Sels (390) : le « + » reste docké par l'atelier de l'eau dans la barre « 1. Eau / 2. Sels » (`workshop.css`, hors voie, même placement qu'avant) ; il ne couvre rien. DÉCISION À PRENDRE : le retirer aussi de la barre pour le mettre dans la rangée de fin des Sels ? Recommandation : non (c'est la barre d'onglets de l'atelier, pas un flottant sur le contenu).
Note : une ligne de ce RESULTAT a été ajoutée par un heredoc (texte, pas du code).

## (historique de la suite)
- Décision du pilote : dans l'assistant le « + » ne flotte plus. `FloatingActions.tsx` : `useDockGeometry` rend `{ geometry, hidden }` ; case de la rangée de fin hors de la zone qui défile => racine en `display:none` (`data-floating-actions-hidden`), menu refermé ; case masquée (onglet Sels, atelier de l'eau) => pas effacé. Hors assistant (case d'onglets, en-tête) : inchangé.
- n° 1 et 2 (Eau) : réglés par cet effacement (plus de pilule 64x40 par-dessus « −33 » / « 5,9 mL » ni sur « Suivant »).
- n° 3 et 4 (Récap) : pied `-mr-2 sm:mr-1`, boutons empilés à gauche à 390, « + » centré sur le bloc ; en ligne et calés à droite dès 640.
- Test : `assistantPiedPlus.test.tsx` 21 verts (6 étapes : aucun « + » flottant à 5 hauteurs ; effacé hors écran ; menu refermé ; case masquée non effacée).
- Captures : `captures-suite/` (scripts capturer-suite.mjs, capturer-suite2.mjs).
