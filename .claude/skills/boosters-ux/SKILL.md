---
name: boosters-ux
description: Mettre en avant les boosters UX/UI d'un écran de L'Affinée (les moyens de comprendre et d'agir autres que le texte - curseur, bascule, pastille, jauge, plage, frise, édition sur place) et le renforcer par une check-list courte et vérifiable - hiérarchie, premier plan, regroupement, rythme, typographie, contraste, états (vide, erreur, chargement, hors ligne), retours de geste, saisie au téléphone, coup d'œil, cohérence, cibles. À charger avant toute conception, variante, fil de fer, revue, critique ou port d'un écran de L'Affinée, avec impeccable et ui-design-system ; au port, avec a11y-audit et senior-frontend. Heuristiques reprises de ui-ux-pro-max et taste-skill (MIT), soumises à DESIGN.md. Ne choisit ni le style ni la direction.
license: Heuristiques adaptées de deux dépôts sous licence MIT ; provenance, copyrights et texte de la licence dans SOURCE.md.
---

# Boosters UX — rendre un écran parlant, et le prouver

Ses mots : « Oublie pas de bien mettre en avant les UX UI booster ! » (31.10) ; « Je vois aussi aucun slider ou autre UX
booster » (C092) ; « Actuellement l'application est très textuel » (C094) ; « il faut que ce soit visuelement parlant et
frappant ! » (C096). Source : `work/refonte-frontend/v4/SPEC-BRASSEUR.md`, § 4.

Un **booster** est un moyen de comprendre ou d'agir autre que le texte : il rend une relation, une conséquence ou un
choix immédiat (PRODUCT.md, « Compréhension et boosters UX/UI »). Son vocabulaire, ouvert, est dans `docs/ui-compacte.md`
(tables « Interagir », « Afficher », « Composer ») avec les composants du dépôt. Ce skill cherche et montre les boosters
(B1), puis renforce l'écran autour d'eux (B2 à B13). Chaque point a sa source et sa preuve. Il ne remplace ni DESIGN.md,
ni ses choix (`ecrans.json`), ni le regard sur les captures (L12). Avant : `.claude/rules/affinee-frontend.md` et les
parties utiles de PRODUCT.md, DESIGN.md et `docs/ui-compacte.md`. Ci-dessous, `outils/` = `work/refonte-frontend/v4/tournoi/outils/`.

## Ce qui cède devant nos règles

Les deux dépôts sources sont génériques. Ce qui suit l'emporte, sans redemander d'autorisation.

1. **DESIGN.md fait autorité ; sa densité compacte prime.** Cible web de 24 × 24 px CSS au moins (WCAG 2.2 AA 2.5.8),
   jetons 24/28/32 px, champ de 32 px à texte saisi de 16 px, données à 13–14 px, libellés à 12 px, marge de page de
   8–12 px, trois tailles de texte par écran. Les 44/48 px de ui-ux-pro-max (`touch-target-size`, `touch-friendly-input`)
   ne sont pas un minimum ici, pas plus que son corps de 16 px, les marges de 16–32 px et les « 4 à 9 tailles » de
   taste-skill. ui-ux-pro-max le dit lui-même : le web se juge à part, sur 24 px CSS (`app-interface.csv`, n° 6).
2. **Pas de cockpit.** Au premier plan, la réponse et ce qui permet d'agir, rien d'autre (DESIGN.md, « Deux régimes » ;
   `cerveau/brasseur/pas-de-cockpit.md`). Le style « Data-Dense Dashboard », les rangées de chiffres-clés et les légendes
   au premier plan cèdent. La densité se compte en information utile, jamais en texte.
3. **Le brasseur choisit.** L'outil ne choisit jamais le style, la palette, la typographie ni la direction : ni le
   `--design-system` de ui-ux-pro-max (pour « Brewery/Winery », il sort du bordeaux et un style « Vintage Analog », loin
   de la page blanche qu'il a choisie), ni le tirage `draw.mjs` de taste-skill. Le style vient de DESIGN.md et de ses
   choix (`work/refonte-frontend/v4/choix/ecrans.json`, règle n° 1) ; un goût ouvert devient un axe de variantes (L24).
   Sa maquette choisie se reprend telle quelle : une heuristique qui la contredit ne la corrige pas, elle devient une
   remarque au pilote.
4. **Jamais de question bloquante.** Les questions qui closent la critique d'impeccable (« Ask the User »), son « Ask
   once » et la stack à demander de ui-ux-pro-max ne s'appliquent pas. La stack est connue (React, TypeScript, Vite,
   Tailwind) ; un doute de cadrage va au skill `jury`, un fait se mesure, un goût devient une variante ; sinon, lecture
   étroite et réversible, signalée (L01).
5. **Le monospace des chiffres est permis**, et même requis : IBM Plex Mono en chiffres tabulaires pour tout ce qui se
   mesure (DESIGN.md, « Typography »). L'interdit `mono` de taste-skill tombe ; reste la règle de DESIGN.md : un mot en
   mono qui n'est pas une mesure est une faute.
6. **Un écran de l'app n'est pas une vitrine.** Les règles de page de taste-skill (photos réelles, huit éléments animés,
   entrées échelonnées, accroche) ne valent pas ici : le mouvement répond à une action, jamais à l'ouverture d'un écran
   (DESIGN.md), comme dans le mode « Operate » d'impeccable.

## La check-list

Pour chaque point : ce qui renforce l'écran, la source, la preuve. Une mesure est un nombre lu au rendu ; une capture est
une image ouverte et regardée (L12). Les recettes R1 à R6 sont plus bas.

**B1 — Les boosters, mis en avant.** Chaque décision du premier plan (lire, comparer, choisir, ajuster, suivre,
déclencher) a son contrôle et sa représentation choisis pour elle, pas un bouton, un champ ou un paragraphe par réflexe ;
le geste et son effet tiennent dans le même bloc ; le booster est branché sur la vraie donnée et change l'écran au toucher.
Source : PRODUCT.md ; `docs/ui-compacte.md` ; SPEC § 4 (C091 à C097, D6, D7) ; taste-skill (« un élément vivant »).
Preuve : chaque déclencheur porte `data-booster="nom"` ; captures avant et après le toucher, qui diffèrent
(`outils/jouer-boosters.mjs` sur un lot au format `pNN/index.html`, sinon R6) ; la NOTE donne pour chacun le besoin, le
contrôle, la représentation et l'effet vu. Le nombre de widgets n'est pas un critère.

**B2 — Une seule chose domine.** La réponse de l'écran porte le plus grand poids visuel ; une seule action `primary`.
Source : taste-skill (critique, passes 1 et 2 : une seconde puis cinq, test du flou) ; impeccable `layout` (squint test) ;
ui-ux-pro-max `visual-hierarchy`, `primary-action` ; DESIGN.md (« Components », Button). Preuve : capture floutée (R6),
deux ou trois masses nettes et la dominante nommée ; boutons `primary` comptés : un.

**B3 — Premier plan léger, détail à un toucher.** Premier plan : 7 éléments et 60 mots au plus à 390 × 844 ; second plan
à un geste sur place, troisième à deux gestes ; chaque déclencheur nomme ce qu'il ouvre ; au-delà de 4 options à une
même décision, une raison dans la NOTE ; les barres fixes prennent le moins de hauteur possible. Source : DESIGN.md (« Deux régimes »,
D24 ; « Le budget vertical ») ; ui-ux-pro-max `content-priority`, `progressive-disclosure` ; impeccable `critique` (charge
cognitive). Preuve : `outils/mots-premier-ecran.mjs <dossier> <id> --page=<page> --max=60` (les lots houblons tournaient
à 80) ; éléments du premier plan comptés sur la capture ; `outils/controle-hauteur.mjs` (1,05 écran au plus pour une
étape) ; hauteur cumulée des barres (R6).

**B4 — Regrouper par le sens.** Les éléments liés se touchent ; les groupes se séparent par l'espace avant le cadre ;
deux ou trois bords gauches pour le texte ; pas de carte dans une carte ; chaque groupe se nomme. Source : taste-skill
(critique, passe 4 ; `ragged-edges`) ; impeccable `layout` (Grouping) et `craft-floor` (cartes imbriquées) ;
ui-ux-pro-max `field-grouping`. Preuve : R1 ; capture.

**B5 — Un rythme, sur l'échelle.** Dans un groupe 4–6 px, entre groupes 8–12 px, panneau rembourré de 8 px ; rien hors
de l'échelle ; aucun vide accidentel. Source : DESIGN.md (« Dimensions compactes ») ; ui-ux-pro-max `spacing-scale` ;
taste-skill (`blank-gap`, `panel-void`, passe 5) ; impeccable `layout` (Rhythm). Preuve : R2, R3.

**B6 — Trois tailles, deux familles, des chiffres alignés.** Trois tailles de texte au plus par écran ; Source Sans 3
pour ce qui se dit, IBM Plex Mono `tnum` pour ce qui se mesure ; rien sous 12 px ; nombre et unité sur une ligne ; une
colonne de nombres alignée à droite. Source : DESIGN.md (« Typography », D24, Reading) ; mission Identité (L05) ;
taste-skill (`size-count`, `tabular`, `numeric-align`, `tiny-text`) ; ui-ux-pro-max `number-tabular`. Preuve : R4.

**B7 — Contraste et couleur qui guident.** Texte à 4,5:1 (3:1 s'il est grand) sur son fond réel, en clair et en cave
mesurés à part ; la couleur accompagne toujours un libellé ; une seule couleur d'alerte ; seule l'exception s'étiquette ;
une notion, une couleur et une forme. Source : ui-ux-pro-max `color-contrast`, `color-not-only`, `pro-rules.md` (clair
et sombre) ; taste-skill `contrast` ; DESIGN.md (lois 1 et 5, D24) ; a11y-audit. Preuve : `outils/controle-contraste.mjs
<dossier> <id>` dans chaque thème ; `node scripts/theme/contraste.mjs` ; `outils/controle-teinte.mjs` ;
`outils/controle-standard.mjs <page.html>`.

**B8 — Chaque état dessiné, et honnête.** Vide : le cadre reste, une phrase, l'action là où la donnée viendra. Zéro
affiché ; inconnu dit « incalculable » ou un tiret, jamais une barre à zéro. Chargement : squelette à la taille finale,
sans saut. Erreur : dans le bloc qui échoue, avec la cause et la sortie. Hors ligne : rien de perdu, l'état
d'enregistrement visible (`PersistenceStatus`). Désactivé distinct de lecture seule. Source : PRODUCT.md (« refuse
d'inventer un chiffre ») ; `docs/ui-compacte.md` ; taste-skill (`app-screens.md`, § 11) ; ui-ux-pro-max `empty-states`,
`error-recovery`, `offline-support`, `content-jumping`, `read-only-distinction` ; impeccable `harden`, `operate`.
Preuve : une capture par état, sur fixture ; hors ligne : `page.setOfflineMode(true)` après le chargement, saisie, retour
en ligne, valeur relue ; `outils/fuite-touchers.mjs` et `outils/controle-valeurs-brutes.mjs` : ni « null », ni « NaN »,
ni code brut (D14, D97).

**B9 — Chaque geste répond.** Retour visible sous le doigt en moins de 100 ms, sans décaler la mise en page ; mouvement
de 150–250 ms, en réponse à une action ; `prefers-reduced-motion` respecté ; une liste se sélectionne au `pointerup`
(moins de 12 px de glissement) ; un glisser a son équivalent au toucher. Source : ui-ux-pro-max `press-feedback`,
`tap-feedback-speed`, `drag-threshold`, `dragging-alternative`, `pro-rules.md` (états stables) ; impeccable `operate` ;
DESIGN.md (« Do's and Don'ts ») ; taste-skill `reduced-hidden`. Preuve : R6 (captures, délai, mouvement réduit sans
texte masqué) ; `outils/controle-etats.mjs` pour une maquette choisie.

**B10 — Saisie au téléphone.** Jamais `type="number"` (`NumberInput`, `NumericField`) ; virgule décimale ; `inputmode`
adapté ; borne métier ; libellé visible relié au champ ; erreur sous le champ, avec la sortie ; validation à la sortie du
champ ; bouton d'enregistrement au-dessus du clavier (`useKeyboardInset`). Source : `cerveau/produit/saisie-mobile.md` ;
DESIGN.md (« Components », « Layout ») ; ui-ux-pro-max `input-labels`, `error-placement`, `inline-validation`
(`input-type-keyboard` cède pour `number`). Preuve : grep de `type="number"` sur le périmètre : 0 ; « 12,5 » saisi avec
`?keyboard=330`, capture : valeur gardée, bouton visible.

**B11 — Lisible en un coup d'œil.** La capture du premier écran suffit à dire la réponse de l'écran en une phrase ;
valeurs exactes avec leur unité, jamais un code ; la légende au second plan. Source : taste-skill (critique, passe 1) ;
DESIGN.md (D24, Reading) ; `docs/ui-compacte.md` (l'artefact avant le récit de son auteur). Preuve : la phrase, écrite par
le critique depuis la seule capture, avant la NOTE, puis confrontée à la question de l'outil (L10).

**B12 — Les mêmes formes d'un écran à l'autre.** Un signifiant par geste (le chevron ⌄ partout) ; trois intentions de
bouton ; les trois rayons et la bordure de 1 px de DESIGN.md ; une bibliothèque d'icônes, d'un seul trait ; un segment
change une valeur, un onglet change une vue ; hors du composant travaillé, la baseline. Source : DESIGN.md (« Shapes »,
« Components ») ; impeccable `operate` (« if the save button looks different in two places, one is wrong ») ;
ui-ux-pro-max `consistency`, `icon-style-consistent` ; taste-skill `radius-mix`. Preuve : R2 (rayons rendus) ;
`outils/controle-baseline.mjs` ; captures côte à côte avec un écran voisin déjà choisi.

**B13 — Des cibles sûres.** Surface activable de 24 × 24 px CSS au moins, ou l'exception d'espacement ; une commande de
rangée prend toute la rangée ; aucun chevauchement ; focus visible, jamais caché par une barre fixe. Source : DESIGN.md
(« Cibles et accessibilité web ») ; ui-ux-pro-max `web-target-size`, `focus-not-obscured` ; a11y-audit. Preuve : R5.

## Mesurer sans leur script (puppeteer-core)

taste-skill mesure le cadre dans un vrai navigateur (`inspect.mjs`, `lib/probe.mjs`, `lib/rules.mjs`). On en refait
l'essentiel avec nos outils, sans copier son code : `puppeteer-core` et le Chrome du poste (skill `webapp-testing`). Le
script se range dans le dossier de la variante ou dans `os.tmpdir()`, jamais à la racine (L17). Réglage commun :
390 × 844 (`isMobile`, `hasTouch`), puis 1280 × 800 ; thème posé avant le chargement (`localStorage`,
`laffinee.theme` = `clair` puis `cave`, comme `scripts/theme/captures-ecrans.mjs`) ; attendre `document.fonts.ready`. On ne
lit que le visible : ni `display: none`, ni `visibility: hidden`, ni opacité nulle, ni texte réservé aux lecteurs d'écran
(boîte de 2 px au plus). Chaque recette imprime ses nombres puis `Rn OK` ou `Rn ECHEC` selon son seuil, jamais un OK sans
condition (M10), et s'éprouve d'abord sur un témoin qui doit échouer (l'écran d'avant, ou une page cassée exprès, L13).

- **R1 — Bords et marges.** Boîtes des nœuds texte (`Range.getClientRects`), des contrôles, des médias et des panneaux
  (fond plein ou bordure). Marge gauche : 2e centile des bords gauches ; droite : largeur moins le 98e centile des bords
  droits. Attendu : 8–12 px de chaque côté (DESIGN.md), moins de 12 px d'écart entre les deux (seuil d'alerte de
  taste-skill au téléphone). Ancrages : bords gauches des blocs de texte, regroupés à 4 px près ; les trois plus fréquents
  couvrent 60 % des blocs au moins (taste-skill `ragged-edges`).
- **R2 — Écart à la grille d'espacement.** Pour chaque élément visible : `margin`, `padding` et `gap` calculés, et l'écart
  vertical avec la boîte voisine. Hors échelle : ni 0, ni 1 px (bordure), ni un pas de 2 px jusqu'à 14, ni un pas de
  4 px au-delà. Rendre la part hors échelle et les cinq pires, avec leur sélecteur. Les écarts entre voisins tombent dans
  4–6 px (groupe) ou 8–12 px (entre groupes) ; les autres sont listés. Compter aussi les `border-radius` distincts :
  trois au plus (DESIGN.md, « Shapes » ; taste-skill `radius-mix`).
- **R3 — Blanc utile.** Part des rangées de pixels du premier écran traversées par un texte, un média, un contrôle ou une
  petite marque teintée : la fonction `fill` de `outils/capture.mjs`, notre code ; un lot vise 0,8
  (`outils/controle-lot.mjs --fill=0.8`). Puis le plus grand vide vertical entre deux contenus, dans la page et dans
  chaque panneau : au-delà de 40 px dans un panneau (taste-skill `panel-void`), il se referme ou se justifie dans la NOTE.
- **R4 — Niveaux typographiques.** Tailles distinctes, arrondies au pixel, des textes visibles du premier écran : la
  fonction `typo` de `outils/capture.mjs` ; trois au plus. Les valeurs de champ, qui ne sont pas des nœuds texte, n'y
  entrent pas. Familles qui portent 2 % des caractères au moins : deux. Tout texte de mesure (chiffre et unité) est en
  IBM Plex Mono avec `font-variant-numeric: tabular-nums` ; aucun mot en mono qui n'est pas une mesure ; aucune taille
  sous 12 px ; une colonne de nombres a le même bord droit.
- **R5 — Cibles.** Pour chaque élément interactif visible (`button`, `a`, `input`, `select`, `summary`, rôles `button`,
  `tab`, `radio`, `switch`, `slider`) : boîte de 24 × 24 px au moins, sinon un cercle de 24 px centré qui ne touche
  aucune autre cible (exception d'espacement de 2.5.8) ; `elementFromPoint` au centre rend l'élément ou un descendant ;
  aucune paire de cibles ne se chevauche.
- **R6 — Flou, barres, gestes.** Premier écran capturé sous `filter: blur(6px)` (`addStyleTag`), regardé, la masse
  dominante nommée. Hauteur cumulée des éléments `fixed` et `sticky`. Un geste : captures avant, pendant (doigt posé) et
  après ; délai du retour, du `pointerdown` au premier cadre où le style calculé de la cible change, sous 100 ms ; puis
  rejeu en `prefers-reduced-motion: reduce` (`emulateMediaFeatures`) et hors ligne (`setOfflineMode(true)`).

## Dans l'entonnoir (`.claude/skills/voies/references/entonnoir.md`)

- **Cadrage.** Le pilote met la ligne boosters-ux dans la partie indicative du `BRIEF-AUTEUR.md`. Deux points relèvent
  déjà de l'obligatoire : l'honnêteté (B8 et B11 : inconnu n'est pas zéro, aucun code brut) et le doigt à 390 px (B13).
- **v0.** Chaque concepteur charge `boosters-ux` avec `impeccable` et `ui-design-system`, marque ses boosters
  (`data-booster`) et coche la check-list dans sa NOTE (gabarit ci-dessous). En v0, les mesures se recopient sans chercher
  à les faire passer ; seules pèsent l'honnêteté et la baseline.
- **Tri.** Le critique (Fable) joue la check-list : il touche un booster par page, regarde les captures avant de lire la
  NOTE, confirme ou dément chaque coche, et écrit B11 depuis la seule capture. Un point manqué devient une retouche
  vérifiable d'une candidate (« B5 : 18 px entre deux lignes d'un même groupe »). La check-list ordonne : elle ne rejette
  rien, ne pénalise pas la diversité (L27) et ne choisit rien.
- **Passes 2, 3…** Les points qui ont une mesure deviennent obligatoires, comme les autres contrôles du lot. Un écart
  voulu s'écrit dans la NOTE, avec sa raison.
- **Port.** S'y ajoutent `a11y-audit` et `senior-frontend`. La check-list se rejoue dans l'app (fixtures, Chrome, 390 puis
  1280 px, clair et cave, chaque état, clavier ouvert, hors ligne), avec les captures côte à côte de sa maquette choisie.
  Elle vérifie que le port ne perd rien ; elle ne corrige pas sa maquette (règle n° 1).

## Gabarit de la NOTE

```markdown
## Boosters UX (boosters-ux)
- Boosters : <nom data-booster> — besoin <lire|comparer|choisir|ajuster|suivre|déclencher> ; contrôle ; représentation ; effet vu (captures avant, après)
- B1 OK | ECHEC | s.o. — <preuve : nombre mesuré, contrôle et sa sortie, ou capture>
- B2 … B13 : idem, une ligne chacun
- Écarts voulus : <Bn — raison>
```
