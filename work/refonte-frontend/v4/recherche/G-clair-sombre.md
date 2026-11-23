# G — Clair ou sombre pour L'Affinée ?

Recherche du 18.10.2026 (chercheur ergonomie). Pages consultées le 18.10.2026 ; date de
publication donnée quand la page l'affiche.

**Légende.** **[P]** preuve : étude mesurée, lue au moins par son résumé. **[S]** source
secondaire : doc de plateforme, éditeur, brevet, page de fabricant (une pratique, pas une
mesure). **[O]** opinion ou inférence de ce rapport. Les chiffres « dépôt » viennent de mesures
faites aujourd'hui sur `src/` et `tailwind.config.js`.

## Recommandation en 5 lignes

1. **Clair par défaut** (papier chaud, encre charbon) : l'usage principal (lumière forte, petit
   texte, coup d'œil) est celui où la preuve favorise le positif et où le sombre n'apporte
   aucun gain de lecture.
2. **Le « cave » devient le thème sombre complet**, il n'est pas jeté : réglage Auto / Clair /
   Sombre, bascule en 2 appuis, premier lancement en Clair (réversible).
3. Ce n'est pas la polarité qui fait « cockpit » mais l'empilement (teintes saturées, micro-texte
   en capitales, filets de 1 px, 15 teintes nommées). Moderne = un accent, de l'air, une
   hiérarchie, dans les deux thèmes.
4. **Seuils** : valeurs de lecture ≥ 7:1 et ≥ 16 px ; secondaire ≥ 4,5:1 ; non-texte porteur de
   sens ≥ 3:1 ; ni #000 ni #FFF ; traits d'information ≥ 2 px ; état = couleur + mot/icône.
5. **Coût** : mécanique côté jetons (8 classes `cave-*` = 90 % des 3 100 usages), mais 12 des 13
   jetons de texte actuels échouent sur fond clair (1,37 à 3,88:1) et 781 hex isolés sont à
   reprendre ; le poste lourd est la vérification visuelle des deux thèmes.

## 1. Lisibilité : positif contre négatif

| Constat | Force | Source |
|---|---|---|
| Texte sombre sur clair mieux lu que l'inverse chez les normo-voyants : acuité (Landolt C) et relecture, 18–33 ans et 60–85 ans (écart plus faible chez les âgés) | [P] | Piepenbrock 2013 |
| L'avantage du positif **croît quand le corps diminue** (8, 10, 12, 14 pt testés). Les auteurs : éviter le négatif en petite police | [P] | Piepenbrock 2014 (Human Factors) |
| Mécanisme proposé : écran plus lumineux, pupille plus petite, image rétinienne plus nette. Pupilles mesurées plus petites en positif | [P] mesure ; mécanisme = hypothèse compatible | Piepenbrock 2014 (Ergonomics) |
| Lecture « coup d'œil » (décision lexicale) : noir sur blanc plus lisible que blanc sur noir | [P] | Dobres 2016 |
| Lumière ambiante : en quasi-obscurité le négatif est le pire ; en lumière « de jour » tout s'améliore et, selon NN/g, la polarité n'a plus d'effet significatif | [P] lu via NN/g + résumé | Dobres 2017 |
| Les lecteurs **ne perçoivent pas** l'écart : préférence ≠ performance | [P] | Piepenbrock via NN/g |
| Le sombre aide certains yeux à milieux troubles (cataracte) ; 7 sujets, écrans CRT | [P] faible | Legge 1985 via NN/g |
| Fatigue visuelle : pas de différence significative clair/sombre sur tablette (30 sujets) | [P] petit | Sengsoon 2025 |
| Revue de 28 études : préférence pour fort contraste et texte sombre sur clair | [P] revue | Muhamad 2023 |
| Astigmatisme, halo du blanc sur noir | [S]/[O] : répété par les guides d'accessibilité, sans étude citée ; mécanisme plausible (pupille dilatée), **non testé** sur interface dans ce que j'ai trouvé | Level Access 30.06.2020 |

NN/g (Budiu, 02.02.2020) : en vision normale, le clair donne « de meilleures performances la
plupart du temps » ; ne pas imposer le sombre au grand public, l'offrir ; utiliser l'API du
système. La conclusion « myopie » de la même page repose sur 7 sujets : à ignorer.

**Lumière forte.** Je n'ai trouvé **aucune étude** qui compare les polarités en plein soleil
ou sous néon. Physique des fabricants d'écrans [S, résumés de recherche, pages non relues] : les
reflets relèvent noirs et blancs, le rapport s'effondre (un LCD 200 nits à 300:1 en pièce noire
passe sous 2:1 en plein soleil). [O] Sous forte lumière, le levier est le contraste de
luminance et le niveau de luminosité, pas la polarité ; le sombre ne gagne rien en lecture
(Dobres 2017) et n'a pas d'avantage de fatigue démontré.

**Limite des normes.** Le ratio WCAG 2.2 est symétrique : il ne distingue pas clair sur sombre
et sombre sur clair (« polarity-blind »). APCA signe son résultat selon la polarité [S]. Un
4,5:1 passe donc en AA sans garantir la même lisibilité dans les deux sens.

## 2. Ce que font les autres

| Domaine | Observation | Force |
|---|---|---|
| Brassage | Grainfather : « Added Dark Mode theme » en v5.6.0 (22.11.2023), donc clair d'abord. Brewfather : « dark mode support » ; v2.20.1 (28.08.2025) ajoute un interrupteur clair/sombre dans le menu principal. BeerSmith 4 (billet de mars 2026) : mode sombre sur Windows et Mac. Les trois offrent les deux, aucun n'impose le sombre seul | [S] ; défauts non vérifiés dans la doc officielle |
| Caisse / cuisine | Toast : clair ou sombre **par appareil** (page màj 21.09.2026), exemple « terminal plus sombre au bar, plus clair en salle ». Oolio KDS : bascule, clair par défaut. Tabit Kitchen : par écran [Oolio et Tabit : extraits de recherche, pages 404/403] | [S] |
| Santé / terrain | Brevet Philips US 8 823 729 (délivré 02.09.2014) : chiffres colorés sur fond sombre en lumière faible ou normale, **remappés en chiffres sombres sur fond clair au soleil**, commutation automatique par seuil ou manuelle. Seul exemple trouvé où la forte lumière fait passer au clair. Tracteurs : modes jour/nuit annoncés par un concessionnaire [extrait, 403]. Rien de publié trouvé sur dossiers patient ou moniteurs | [S] |
| Plateformes | Apple : mode sombre = réglage système « pour les environnements peu éclairés » ; **éviter un réglage d'apparence propre à l'app** ; bien rendre dans les deux ; 4,5:1 minimum, viser 7:1 en petit texte ; le sombre seul « dans de rares cas » (média immersif). Material : gris foncé plutôt que noir ; avantages OLED, fatigue, faible lumière | [S] |

[O] Convergence : tous offrent les deux et laissent le contexte trancher (éclairé, clair ;
sombre, sombre). Nuance sur les cinq références du brasseur : ce sont des captures Dribbble /
Fuselab, des maquettes regardées sur un écran de bureau, pas des outils éprouvés sous néon.

## 3. Quand le sombre se justifie, et ce qui fait « cockpit »

**Se justifie** : (a) pièce sombre, le soir : confort et éblouissement, **pas** gain de lecture
(Dobres 2017 : le négatif est le pire dans le noir ; Fan 2024 : en polarité négative, plus de
lumière ambiante réduit la fatigue) ; (b) photophobie, basse vision : option individuelle ;
(c) OLED : Purdue (Dash et Hu, MobiSys 2021) mesure 3–9 % d'énergie en moins à 30–50 % de
luminosité, **39–47 % à 100 %** [P] : réel au soleil, marginal sinon ; (d) média immersif.
De nuit, le sombre est un confort, pas une performance. Cela décrit la maison le soir, pas
la brasserie.

**« Cockpit » : aucune recherche** [O]. Hypothèse : l'effet vient de l'accumulation, pas du
fond noir. Facteurs : teintes saturées lumineuses sur quasi-noir, capitales et micro-texte
mono, jauges et cadres simultanés, filets de 1 px, beaucoup de teintes (la palette actuelle en
nomme 15 : 4 rubriques, 6 EBC, 5 états). Les plateformes décrivent l'inverse du cockpit :
gris foncé plutôt que noir, surfaces surélevées plus claires, blanc adouci (Material, Apple,
web.dev). La référence sombre du brasseur (AG.Drone) est dense mais « nette » : un accent,
alignements stricts. Le sombre n'est donc pas la cause.

## 4. Recommandation et conditions

**Décision [O]** : clair par défaut, sombre complet, Auto disponible ; pas de capteur de
lumière (`AmbientLightSensor` est expérimental, hors Baseline, MDN). Apple déconseille un
réglage propre à l'app, mais son cadre est le grand public ; ici l'usage documenté
(brasserie le jour, maison le soir) justifie un défaut clair et un interrupteur à portée,
comme Brewfather depuis 08.2025. Le « cave » actuel devient le sombre : identité conservée.

| Élément | Cible | Appui |
|---|---|---|
| Valeur lue d'un coup d'œil, texte courant | ≥ 7:1 ; valeur-clé ≥ 16 px | Apple (7:1 en petit texte) [S] ; seuil de taille [O] |
| Texte secondaire, unités, aides | ≥ 4,5:1 mesuré | WCAG 1.4.3 [S] |
| Non-texte porteur de sens (contour si seul repère, focus, jauge, icône d'état) | ≥ 3:1 | WCAG 1.4.11 [S] |
| Fonds et blancs | ni #000 ni #FFF. Clair : papier chaud + encre `#1A1613` (15,87:1). Sombre : charbon + `cave-50`/`cave-200` (15,87 et 11,60:1, déjà là) | Material, Apple, web.dev [S] |
| Taille minimale | clair : 12 px tolérés pour métadonnées non critiques ; **sombre : ≥ 13 px**, rien de vital en 12 px | Piepenbrock 2014 [P] + déduction [O] ; DESIGN.md (décision 12.09) fixe 12 px : **à arbitrer** |
| Graisse | ≥ 400, jamais Light/Thin (Apple) ; en sombre 400–500, la lumière sur noir paraît plus grasse | [S] ; irradiation : [S] non vérifié |
| Traits | informatifs (jauges, plages, soulignement d'état) ≥ 2 px ; 1 px réservé au décor | [O] |
| États | couleur + mot ou icône ; par thème, deux variantes : texte (≥ 4,5:1) et aplat (≥ 3:1) ; l'alerte reste distincte de l'échelle EBC | WCAG 1.4.1, DESIGN.md lois 2 et 5 |
| Préférences système | `prefers-color-scheme` + `prefers-contrast: more` (Baseline depuis 05.2022) pour une palette renforcée | MDN, web.dev [S] |

**Mesure sur les jetons actuels, placés sur le papier `#F5F0EA`** (script, ratio WCAG) :
`cave-200` 1,37:1, `ebc.straw` 1,48, stocks 1,66, attention 1,68, finances 1,84, agenda 1,91,
production 1,92, alert-strong 2,00, hop 2,85, `cave-400` 2,94, water 3,29, alert 3,88. **12 sur
13 échouent** à 4,5:1 : une version texte est nécessaire pour chaque accent. Exemples
assombris à teinte égale (à redessiner) : stocks `#A3C97A` → `#557730` (4,56:1), finances
`#86B9E6` → `#2570B3` (4,58), attention `#E3B55D` → `#8E6619` (4,56). **Bonne nouvelle** : le
bouton primaire garde son identité, `ebc-straw` avec texte `#1A1613` fait 10,71:1 dans les deux
thèmes (texte clair sur paille : 1,48, à proscrire).

### Coût de migration par jetons (mesuré)

- **État** : `cave-*` sont des hex statiques dans `tailwind.config.js` (Tailwind 3.4.19).
  3 100 usages, 175 fichiers, 89 classes ; 8 classes en couvrent 90 % (`text-cave-400` 936,
  `text-cave-200` 632, `text-cave-50` 463, `border-cave-700` 267, `border-cave-800` 169,
  `bg-cave-850` 150, `bg-cave-900` 96, `bg-cave-950` 89). Zéro `dark:`, zéro
  `prefers-color-scheme` ; `color-scheme: dark` figé (`src/index.css:7`, `DateField.tsx:108,115`,
  `finance.css:157`).
- **Piège de noms** : les noms suivent la clarté (`cave-50` = le plus clair) ; en clair,
  `text-cave-50` serait l'encre la plus foncée. Deux temps : (1) garder les noms et les
  remapper par variables ; (2) codemod vers des rôles (`ink`, `ink-2`, `ink-3`, `surface`,
  `surface-raised`, `line`), 8 classes pour 90 %.
- **Mécanisme** : variables en canaux (`--cave-900: 26 22 19`) enveloppées par
  `rgb(var(--cave-900) / <alpha-value>)`, ce qui garde les 82 usages avec opacité (`/40`) ;
  `<alpha-value>` est présent dans le Tailwind installé. Sombre = valeurs actuelles, donc
  **rendu sombre inchangé** (à prouver par captures de non-régression).
- **Accents** : 1 258 usages, dont 755 en `text-` à doubler en variante texte ; 241 `bg-` et 221
  `border-` gardent la teinte.
- **Hex isolés** : 781 dans 31 fichiers hors `hopV55` (surtout CSS : `brew-day.css` 128,
  `brewer-chat.css` 113, `finance.css` 98) ; 4 ombres noires ; 2 styles inline. `src/ui/hopV55/*.css`
  porte déjà un papier clair (`--hv-paper:#f5f2e9`, `color-scheme:light`) : 1 447 hex, palette
  séparée à raccorder (usage réel non vérifié).
- **Lots [O]** : L1 jetons + bascule (config, `index.css`, script anti-clignotement dans
  `index.html`, `color-scheme`, `theme-color`) ; L2 codemod des noms + variantes texte des
  accents ; L3 les 31 fichiers CSS, à la main ; L4 vérification : 10 pages × 2 thèmes × 390 et
  1280 px avec les scripts `puppeteer-core` existants, plus un script de contraste (le « pire
  contraste du jeu » de DESIGN.md). **L4 est le poste le plus lourd.**

## 5. Ce que je n'ai pas pu établir

Aucune étude de polarité en plein soleil, sous néon, vapeur ou avec gants ; rien de primaire
sur santé et terrain agricole ; astigmatisme non testé en interface ; Material M2 (#121212,
15,8:1), Oolio, Tabit et Monroe lus par extraits ; défauts de thème de Brewfather non
confirmés. **Preuve locale à obtenir (15 min)** : sur le téléphone du brasseur, en brasserie,
lire à bout de bras une bande de 5 valeurs en 12/13/16 px dans les deux thèmes, luminosité
réelle d'usage.

## Sources (consultées le 18.10.2026)

- NN/g, Budiu, « Dark Mode vs. Light Mode » (02.02.2020) : https://www.nngroup.com/articles/dark-mode/
- Piepenbrock et al., Ergonomics 2013 : https://doi.org/10.1080/00140139.2013.790485 ; Human Factors 2014 : https://doi.org/10.1177/0018720813515509 ; Ergonomics 2014 : https://doi.org/10.1080/00140139.2014.948496 (résumés lus via Europe PMC : https://www.ebi.ac.uk/europepmc/)
- Dobres et al., Ergonomics 2016 : https://doi.org/10.1080/00140139.2015.1137637 ; Applied Ergonomics 2017 : https://doi.org/10.1016/j.apergo.2016.11.001
- Sengsoon et Intaruk, IJERPH 2025 : https://doi.org/10.3390/ijerph22040609 ; Fan et al., Sensors 2024 : https://doi.org/10.3390/s24113516 ; Muhamad et Amali, IJPH 2023 : https://doi.org/10.18502/ijph.v52i8.13396
- Purdue, Dash et Hu, MobiSys 2021 (communiqué 28.07.2021) : https://www.purdue.edu/newsroom/releases/2021/Q3/dark-mode-may-not-save-your-phones-battery-life-as-much-as-you-think,-but-there-are-a-few-silver-linings.html
- Apple HIG, Dark Mode (changelog 06.08.2024) : https://developer.apple.com/design/human-interface-guidelines/dark-mode
- Material, thème sombre : https://m2.material.io/design/color/dark-theme (extrait de recherche) ; https://github.com/material-components/material-components-android/blob/master/docs/theming/Dark.md
- web.dev, `prefers-color-scheme` (màj 06.2019) : https://web.dev/articles/prefers-color-scheme
- WCAG 2.2 : https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html ; https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html ; APCA : https://github.com/Myndex/apca-introduction (extrait)
- Level Access, astigmatisme (30.06.2020) : https://www.levelaccess.com/blog/accessibility-for-people-with-astigmatism/
- Brewfather : https://apps.apple.com/us/app/brewfather/id1488585822 ; Grainfather : https://apps.apple.com/app/id1169264880 ; BeerSmith 4 : https://beersmith.com/blog/?p=15907
- Toast (màj 21.09.2026) : https://support.toasttab.com/en/article/Setting-Up-the-New-POS-Experience ; Oolio : https://help.oolio.com/kds-kitchen-display-change-the-appearance-settings-oolio-help-center ; Tabit : https://support-us.tabit.cloud/hc/en-us/articles/13675450238098-How-to-Change-to-Dark-Mode-in-Tabit-Kitchen ; Monroe Tractor : https://www.monroetractor.com/displays/
- Brevet Philips US 8 823 729 B2 : https://patents.google.com/patent/US8823729B2/en
- Lisibilité au soleil (fabricants, extraits) : https://riverdi.com/blog/sunlight-readable-displays-the-most-important-parameters-of-outdoor-lcd-displays-you-need-to-know
- Graisse en sombre (GRAD, extrait) : https://www.drweb.de/dark-mode-schrift-grade-achse/
- Tailwind 3 : https://v3.tailwindcss.com/docs/customizing-colors ; https://v3.tailwindcss.com/docs/dark-mode
- MDN : https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-contrast ; https://developer.mozilla.org/en-US/docs/Web/API/AmbientLightSensor
- Dépôt : `tailwind.config.js`, `src/index.css`, `work/refonte-frontend/v4/reference/brasseur-2026-10-18/README.md`
