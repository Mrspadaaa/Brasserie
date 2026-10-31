# Verdict du critique, second regard — port de l'étape Identité après p2-correctifs (31.10)

**PRÊT À MONTRER** — les 11 écarts sont corrigés ou réglés (n° 6 et n° 9 par la lecture admise au premier verdict) ; 2 retouches d'une ligne
à faire avant le déploiement, sans second regard, et 4 notes sans effet sur son verdict.

Base : son choix r4-a (`v1/r4-a/`, NOTE et captures `reperes-ouverts.png`, `g2-fermenteur-pendant.png`, `g2-fermenteur-apres.png`,
`g3-volume-apres.png`), comparé aux captures de `voies/p2-correctifs/captures/r3/` : `cote-a-cote-390`, `cote-a-cote-1280`, puis les états
repos, vide, repères ouverts, fermenteur ouvert, fermenteur 60, profil rendu, cuve déborde, ébullition 240, clavier pendant, clavier après, à 390
et à 1280, et repos cave à 390. Toutes ouvertes en image (L12) ; le journal `serie-sortie.txt` n'a servi qu'à lire des mesures du DOM.

**Au repos comme au toucher, c'est maintenant son écran.** Côte à côte à 390 : mêmes blocs, mêmes pointillés, mêmes règles, mêmes tuiles,
même pied ; la seule différence est la recette de démonstration. Dès qu'il touche, l'ancien bloc ne revient plus : une ligne ambre au plus
entre Volume et Ébullition, les repères sur une source et deux liens, Matériel déplié sur « Fermenteur [N] L » et « ↺ profil » avec deux liens et
une ligne repliée. À 1280, le bandeau tient sur une ligne et « Abandonner » ne fait plus descendre la page.

## Les 11 écarts

| n | Écart (verdict 1) | État | Preuve (captures r3) |
|---|---|---|---|
| 1 | alertes redites entre les tuiles | **corrigé** | `app-clavier-apres-390`/`-1280`, `app-cuve-deborde-390`/`-1280`, `app-profil-rendu-390`/`-1280`, `app-reperes-ouverts-390` : une seule ligne ambre « Rinçage : 45,5 L pour 24 L à chaud » (42,5 à 180 min) ; `app-vide-390`/`-1280`, `app-ebullition-240-*` : aucune. « +25 L de trop » sous le 55 et « +36,2 L de trop » sur la barre ne sont plus redits. |
| 2 | repères : source en double, deux boutons larges, phrase | **corrigé** | `app-reperes-ouverts-390`/`-1280` : FG, Alcool, EBC « sous ↓ », « 16D · BJCP 2021 · Lire la source », puis « Empâtage « Corps rond »   Conduite « Ale » » en liens ; aucune phrase. Comme `reperes-ouverts.png`, plus la ligne de liens admise (inventaire n° 21). |
| 3 | fermenteur ouvert : « Matériel du plan », boutons ambre, tableau de 8 lignes | **corrigé** | `app-fermenteur-60-390`/`-1280`, `app-profil-rendu-*`, `app-cuve-deborde-1280` : « Système 30L », « Fermenteur [60] L », « ↺ profil », deux liens « Adapter la recette à 30 L · Adapter à mon matériel actuel · Système 30L », « Volumes · 71,2 / 35 L avant ébullition ⌄ » replié. Comme `g2-fermenteur-pendant.png`, plus ce que le verdict 1 admettait. |
| 4 | bandeau sur deux étages à 1280 | **corrigé** | `app-repos-1280`, `app-ebullition-240-1280`, `cote-a-cote-1280` : Grain · OG · IBU (jauge) · EBC sur une ligne, comme `ordinateur-1280-ebullition-120.png`. |
| 5 | boîte blanche au focus | **corrigé** | `app-clavier-saisie-en-cours-390`/`-1280` : « 180 » sur fond transparent, trait plein sous le nombre, caret seul ; `app-fermenteur-ouvert-390`/`-1280` : le champ « Fermenteur [30] L » garde son cadre (retouche B). |
| 6 | colonne 744 px contre 560 dans la NOTE | **réglé, documenté** | `app-repos-1280` : inchangé, 744 px comme les six autres étapes (mesure INFO de la série). Le verdict 1 admettait « ou documenter » ; c'est écrit dans RESULTAT § 3, pas encore dans la NOTE de r4-a (note 4 ci-dessous). |
| 7 | phrase « Adopte ton installation… Ouvrir Matériel » | **corrigé** | `cote-a-cote-390`, `app-repos-390`/`-1280` : la phrase a disparu ; la demi-tuile dit « Système 30L · à adopter » en ambre. |
| 8 | code du style après le chevron | **corrigé** | `cote-a-cote-390`, `app-repos-390` : « Foreign Extra Stout 16D ⌄ », code accolé, chevron au bout, comme « Double IPA 22A ⌄ ». |
| 9 | « cuve utile 35 L », « Système 30L » | **corrigé** (cuve) ; nom gardé tel que saisi | `cote-a-cote-390`, `app-repos-*` : « cuve 35 L ». « Système 30L » est le nom du profil de la fixture : lecture admise par le verdict 1 (« ou le nom du profil tel qu'il l'a saisi »). |
| 10 | règle 0–70 « 70 › » ; « 240 » et « 270 › » qui se touchent | **corrigé** | `app-fermenteur-60-390`/`-1280` : 0–65, « 60 › », conseil ~48, cuve sur la même règle, comme `g2-fermenteur-apres.png`. `app-ebullition-240-390`/`-1280` : 0, 60, 120, 180, « 240 › » ; `app-clavier-apres-*` : 0, 60, 120, « 180 › ». |
| 11 | « Abandonner » sur sa propre ligne à 1280 | **corrigé** | `app-ebullition-240-1280`, `app-fermenteur-60-1280` : « Abandonner » sur la ligne du titre, barre d'étapes à la même hauteur qu'au repos (`app-repos-1280`). |

## Nouveaux écarts avec r4-a

### Retouches avant le déploiement (une ligne chacune, pas de second regard)

**R1 — Le bout de la barre de la cuve vire au violet quand le moût déborde.** `app-cuve-deborde-390` (barre, 680 à 740 px),
`app-cuve-deborde-1280` et `app-reperes-ouverts-1280` (1500 à 1560 px) : à 71,2 L sur une règle de 0–65, la part évaporée (bleu à 50 %,
`.idn-cevap`, de 59,2 à 71,2 L) est peinte sous les hachures rouges du dépassement (`.idn-cdep`, de 35 L au bout) : les deux se mêlent en un
segment gris-violet au bout de la barre. À 68,2 L (`app-profil-rendu-*`), il ne reste qu'un liseré de 0,8 L, presque invisible. r4-a (`g2-fermenteur-apres.png`)
ne montre jamais le bleu hors de la cuve. C'est l'état qu'il a lui-même demandé (« la cuve qui déborde »), et sa remarque est connue : « Pourquoi
il y a parfois le truc noir » (D57). Correction : couper `.idn-cevap` à `cuveL` (`zone(barre.moutL, Math.min(barre.moutL + barre.evapL, cuveL), echelle)`),
ou dessiner `.idn-cdep` opaque ; au-delà de la cuve, seules les hachures rouges, « ~12 L évaporés » reste dans la bulle.

**R2 — « Lire la source » : cible sous 24 px.** `app-reperes-ouverts-390` : lien en ligne dans `.idn-src` (12 px, pas de `min-height`), ligne
de ~16 px ; les autres liens (`.idn-lien-ligne`) ont bien 28 px. Correction : `.idn-src a { display: inline-flex; align-items: center; min-height: 24px; }`
(la ligne garde sa hauteur de texte si le `min-height` porte sur le lien seul).

### Notes (sans effet sur son verdict ; à décider par le pilote)

1. **À 1280, « Abandonner » est à droite de l'icône du thème** (`app-ebullition-240-1280`), alors qu'à 390 (`app-ebullition-240-390`) et dans
   r4-a il est à gauche des icônes ; l'icône du thème saute de ~140 px quand la recette devient modifiée. En-tête commun, hors périmètre du port.
   Si on y touche : même ordre qu'à 390 (Abandonner, import, thème).
2. **À 1280, le + flotte au bord de la fenêtre** (`app-repos-1280`, 1935 px sur 2000), pas au bord de la colonne comme dans r4-a
   (`cote-a-cote-1280` gauche ; NOTE : « le + est à son bord »). Lanceur commun de l'app. Il ne recouvre rien au repos.
3. **Recette vide à 390 : le texte d'exemple du nom est coupé au milieu d'un mot** (« Milk Stout #2, NI », `app-vide-390`) ; entier à 1280.
   Cosmétique : un exemple plus court à 390 (« Milk Stout #2… ») ou une coupe par points de suspension.
4. **La NOTE de r4-a dit encore « centrée à 560 px, comme l'assistant »** ; l'assistant est à 744. Une ligne à corriger dans `v1/r4-a/NOTE.md`
   (n° 6), par le pilote.
5. **Un cadre noir (or en cave) entoure le contenu dans les captures de repos et de vide** (`app-repos-390`, `app-repos-1280`, `app-vide-*`,
   `app-repos-cave-390`), absent après le premier geste. C'est le `:focus-visible` de `src/index.css` (contour 2 px) sur le conteneur de l'étape,
   posé par la navigation du script ; un toucher ne le montre pas. À confirmer d'un regard sur son téléphone après le déploiement ; si le cadre
   s'y voit à l'arrivée sur l'étape, retirer le focus programmatique du conteneur.
6. **Une recette neuve s'ouvre à 30 L dans 30 L, « 0 L libre, plein »**, zone rouge sous le pouce (`app-vide-390`/`-1280`). Défaut de données déjà
   relevé au cadrage (MISSION.md), pas un écart du port : le volume par défaut devrait être le conseil (~24 L).

### Ce que j'ai vérifié et qui n'est pas un écart
- Tailles de texte : les plus petites (règles, « cuve 35 L », source) sont à 12 px (CSS et mesure DOM de la série) ; rien en dessous à l'œil.
- Sélection noire sur blanc dans « Fermenteur [30] L » au focus (`app-fermenteur-ouvert-*`) : c'est le `::selection` du thème clair
  (`themes.css` l. 164), partout dans l'app.
- Densité et hiérarchie à 390 : les deux colonnes de `cote-a-cote-390` se superposent bloc pour bloc (Volume 190 → 415 contre 205 → 420).
- Thème cave (`app-repos-cave-390`) : hachures, pastille violette, Suivant ambre, barre de la cuve en or sombre et bleu : cohérent.
- Le + qui recouvre le chevron de Matériel une fois défilé (`app-reperes-ouverts-390`) : comportement commun, le repos est propre.
- Les nombres : 55 L dans 30 → +25 ; 60 − 55 → 5 L libres ; 240 min × 3 L/h → ~12 L ; 71,2 − 35 → +36,2 ; OG 1,025 à 55 L : tous du moteur.

## La phrase du brasseur
Au repos, à 390 : « Oui, c'est ma maquette. » Après avoir tapé 60 dans le fermenteur, puis 55 : « Là c'est bien, je vois mes 5 L libres et la
cuve en rouge, sans le roman. » Sur la cuve qui déborde, s'il regarde le bout de la barre : « Pourquoi c'est violet au bout ? » (R1). Sur
l'ordinateur : « Le bandeau est sur une ligne, ok. »

Verdict : PRÊT À MONTRER. R1 et R2 avant le déploiement (deux lignes de CSS/TSX, rejouer `capturer-identite.mjs` et rouvrir `app-cuve-deborde-390`
et `app-reperes-ouverts-390`) ; les notes 1 à 6 au choix du pilote.

LEÇON PROPOSÉE : aucune.
