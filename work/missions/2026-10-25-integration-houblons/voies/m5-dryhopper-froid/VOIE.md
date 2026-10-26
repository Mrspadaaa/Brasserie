# Voie m5-dryhopper-froid — où montrer l'amertume au dry hop, le hop creep et les familles près de leur limite, dans Dryhopper

Agent : concepteur (Opus). C'est ce que le brasseur verra : des mini maquettes dans **son vrai écran Dryhopper**, une page de
choix. Rien n'est changé dans l'app par cette voie.

## Ses mots (26.10)
Sur Dryhopper de Cascade (21C, 4 g/L, dry hop après, 3 j), il barre d'une croix rouge l'espace vide sous la barre IBU, côté
ébullition, entre la barre et la réglette du moment. Il écrit : « Amertume, hop creep ? Résineux ? ».

Sa capture est la même que `voies/a2-demande-reelle/img/sans-visee-dryhopper.png` ; ouvre-la. La croix est sous la rangée IBU, à
gauche, au-dessus de la réglette.

## Les valeurs (déjà calculées, voie x1, `src/domain/hopIndex/v4/froid.ts`, non affiché)
Lis `voies/x1-amertume-creep/RESULTAT.md`. Pour sa capture :
- **Amertume au dry hop** : statut `conditional` ; IBU à chaud 27,9.
  - Essais Cascade : 22,3 à 26,3 en équivalent d'amertume, delta −5,6 à −1,6.
  - Avec les essais Centennial : delta −5,6 à +6,1, signe non établi.
  - C'est un équivalent d'amertume, pas un IBU mesuré.
- **Hop creep** : risque **moyen**.
  - Pourquoi : après fermentation, et Cascade est cité parmi les plus actifs (H68).
  - Effets : atténuation en plus, CO₂, diacétyle possible.
  - Ordre de grandeur publié : +0,6 à +1,3 % vol. à 10 g/L. L'ampleur pour ce brassin est inconnue.
- **Familles près de leur limite** (style 21C) :
  - **végétal 20,6 et herbacé 13,5 dépassent** leur borne de 5 (indésirables) ;
  - **résineux 27,5 et floral 24,4 s'approchent** de leur borne de 30.

## Ce qui est demandé
Des mini maquettes **dans la vraie app**, par la méthode de la voie m1 : clone des nœuds voisins dans la page rendue, classes
préfixées `m5d-…`, retirées après la capture. Voir `voies/m1-farnesene/capturer.mjs` et `voies/m3-listes-u4/capturer.mjs`.
- L'écran est le vrai Dryhopper de l'app : `?dev-local&etape=houblons`, `VITE_HOP_V4=on`, Cascade en recette 21C à 4 g/L, dry hop
  après, 3 j.
- Rien d'existant n'est masqué ; on ajoute seulement dans la zone qu'il a marquée, ou juste à côté.
- Le contrôle `work/refonte-frontend/v4/tournoi/outils/controle-capture-fidele.mjs` doit passer sur ton script.
- Les valeurs sont celles de x1, telles quelles. L'inconnu s'écrit « ? ». Le signe non établi de l'amertume se dit, sans être
  arrondi en un chiffre faux.

### Variantes : au moins 5, diverses (L24, M13 en petit)
- **A · l'actuel** : la capture sans ajout, en référence.
- Puis au moins 4 manières de remplir l'espace marqué :
  - par exemple, trois puces compactes sous la barre IBU (amertume à froid, hop creep, limite), qui s'ouvrent à un toucher ;
  - une rangée de « pastilles d'alerte » ;
  - une seconde ligne dans la barre IBU (l'équivalent à froid à côté de l'IBU à chaud) ;
  - la limite comme repère sur les courbes ;
  - le hop creep comme bande sur la frise du moment.
- « Pas de cockpit » ([[pas-de-cockpit]]) : au premier plan, l'essentiel en un mot ou un nombre ; le détail (sources, ordres de
  grandeur) à un toucher.
- Montre aussi l'état ouvert, au toucher, de ta meilleure variante.

## Livrable
- `voies/m5-dryhopper-froid/page.html` : une page de choix, A en référence, vignettes côte à côte, la visionneuse des pages m3 et
  m4.
  - En-tête d'une phrase : « Où montrer l'amertume au dry hop, le hop creep et les familles près de leur limite ? ».
  - `node scripts/agents/verifier-page.mjs <page.html> --page-lot --captures <os.tmpdir()>/m5` → `PAGE OK`.
- RESULTAT.md : les variantes, les captures ouvertes, ta préférence argumentée en brasseur.
- Lis `.claude/rules/affinee-frontend.md`, DESIGN.md, `cerveau/brasseur/pas-de-cockpit.md` et le portrait du critique
  (`work/refonte-frontend/v4/ecran-1/fils21-choisir/critique/PORTRAIT.md`).

## Possède
`work/missions/2026-10-25-integration-houblons/voies/m5-dryhopper-froid/` seulement. Rien dans `src/`. Fichiers de travail dans
`os.tmpdir()`.

Retour en une ligne.
