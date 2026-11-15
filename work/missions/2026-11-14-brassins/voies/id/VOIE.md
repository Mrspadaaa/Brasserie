# Voie id — La trousse d'identité de l'app pour les maquettes

- Mission : 2026-11-14-brassins · Agent : concepteur · Modèle : opus (Fable interdit) · Niveau : conception · Plafond : 35 tours · Dépend de : — · Décideur : pilote

## Objectif
Ses mots (15.11), devant les 44 maquettes de la page « Brassins · tous les écrans » : « Ça semble pas du tout respecter l'identité
global de l'app ?? ». Chaque maquette avait sa palette, ses graisses (800, 900), ses titres géants (30 à 72 px). Construire UNE trousse
que toutes les maquettes chargeront : les jetons, polices, échelle, rayons, composants et le chrome de l'app, pris dans le code, pour
qu'une maquette ressemble à un écran de l'app, en clair et en cave.

## Entrées
- `DESIGN.md` en entier (jetons, deux thèmes, typographie, Layout, Shapes, Components, Do's and Don'ts).
- `src/theme/themes.css` (valeurs exactes des deux thèmes, `[data-theme='clair']` et `[data-theme='cave']`), `tailwind.config.js`,
  `src/theme/couleurs-portees.css`, `docs/ui-compacte.md`.
- Le chrome réel : `src/components/BottomNav.tsx` (barre du bas), l'en-tête des pages (cherche le composant d'en-tête utilisé par
  `src/App.tsx`), `src/components/tabs/ProductionTab.tsx` (barre des sous-onglets, `ViewNavigation`), le composant de feuille
  (`Sheet`) utilisé par `src/ui/BatchDetailSheet.tsx`, les boutons et cartes de `src/ui/production/CatalogCards.tsx`.
- L'app telle qu'elle est (captures du banc local, vraie app) : `work/missions/2026-11-14-brassins/voies/a1-banc/captures/liste-remplie-390-clair.png`,
  `liste-remplie-390-cave.png`, `fiche-fermentation-390-clair.png`, `fiche-fermentation-1280-clair.png` ; la vue z1 en ligne (choisie et portée) :
  `C:/Users/mrspa/Documents/Brasserie/.claude/worktrees/distracted-dewdney-b8bc6e/work/missions/2026-11-10-vue-brassin/v0/z1/etat.html` et ses PNG.
- Contrôle : `work/missions/2026-11-14-brassins/outils/controle-identite.mjs` (passe sur z1, échoue sur les 44).

## Possède (seuls chemins où écrire, avec RESULTAT.md)
- `work/missions/2026-11-14-brassins/outils/identite/` (`identite.css`, `chrome.js`, `LISEZMOI.md`, `demo/etat.html`, PNG) et
  `work/missions/2026-11-14-brassins/voies/id/`. Rien dans `src/`. Ni commit ni stash.

## Consignes
- `identite.css` : les jetons des deux thèmes recopiés de `themes.css` (mêmes noms, `--cave-950`…, valeurs RGB exactes), thème choisi par
  `?theme=clair|cave` (attribut `data-theme` sur `<html>`) ; polices Source Sans 3 et IBM Plex Mono (Google Fonts, repli système) ;
  classes de l'échelle (`id-display` 28 px 600, `id-title` 18 px 600, `id-body` 14 px, `id-label` 12 px, `id-reading` mono 16 px 600 et sa
  grande variante ≤ 28 px) ; rayons 10, 16, 24 ; composants : bouton principal / secondaire / danger, panneau, carte de liste, pastille,
  segments (barre de sous-onglets), puce, curseur m2 (piste, bande cible, pouce), feuille (poignée, rayon 24), lecture (nombre mono et
  unité). Préfixe `id-` partout (L26) ; aucune couleur en dur hors des jetons.
- `chrome.js` (fonction immédiate) : insère, sur demande par attributs (`data-chrome="onglet"` ou `"feuille"`), l'en-tête de page de l'app,
  la barre des sous-onglets Brassins / Recettes / Atelier / Volumes (compteurs), la barre du bas (ses 5 entrées, « Brassins » active), ou
  le cadre de feuille ; libellés et icônes comme le code (icônes lucide en SVG en ligne).
- `demo/etat.html` : la liste des brassins rebâtie avec la trousse (données de `BRIEF-AUTEUR.md`) ; captures `demo-390-clair.png`,
  `demo-390-cave.png`, `demo-1280-clair.png` ; ouvre-les à côté de `liste-remplie-390-clair.png` (Read) : même en-tête, même barre du bas,
  mêmes gris, même noir d'action, même typographie. Écrire les écarts restants dans RESULTAT.md.
- `LISEZMOI.md` (40 lignes au plus) : comment une maquette charge la trousse (chemins relatifs depuis `voies/<série>/<id>/etat.html`),
  ce qu'elle garde à elle (son idée, sa composition, ses graphes), les couleurs permises pour les données (familles d'arômes, styles,
  sémantique, EBC : DESIGN.md), et les interdits (graisse > 700, texte > 28 px, couleur hors jetons, rayon hors échelle).

## Exigences transversales et acquis (recopiés, leçons L05 et L06)
- Deux thèmes (clair par défaut, cave) ; 390 tactile et 1280 ; cibles ≥ 44 px ; chiffres à la virgule ; jamais `type="number"`.

## Critères
`work/missions/2026-11-14-brassins/voies/id/GATES.md`, depuis la racine du dépôt.

## Rendre
- `RESULTAT.md` tenu au fil (tous les 5 éléments).
- La ligne « Tests » écrite dans un fichier : aucune suite Vitest (rien dans `src/`) ; `tests.txt` porte la sortie des CHECK.
- Voie d'écran : captures 390 tactile et 1280, clair et cave, ouvertes côte à côte avec l'app.
Réponse finale au pilote : une ligne.
