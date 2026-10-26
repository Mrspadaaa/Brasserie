# NOTE — voie t1-theme (#144) : clair par défaut, « cave » au choix

Ses mots : « Le thème de l'app principal doit être revu. On garde celle des maquettes » (23.10) ; « Pourquoi c'est en
thème noir, tu peux ajouter dans le header le choix de thèmes à côté de l'import » (25.10, `brasseur-theme-noir.jpg`).

## Mécanisme

Porté de `prototypes/houblons-v4/ecran/THEMES.md` (le mécanisme seulement ; le « clair » chaud reste rejeté, D106).

- `src/theme/themes.css` : tous les jetons en canaux RGB, sous `:root, [data-theme='clair']` (défaut) et
  `[data-theme='cave']`. Clair = valeurs de `prototypes/houblons-v4/parcours/src/theme-maquettes.css` (page `#FFFFFF`,
  `#F5F5F5`, `#EBEBEB`, texte `#111111`, secondaire `#666666`, action principale noire) ; accents du clair = ceux de
  `ecran/src/themes.css`, que la maquette emploie aussi : la maquette reconstruite reçoit donc les mêmes valeurs quel que
  soit l'ordre de ses feuilles. Cave = valeurs d'avant, sauf trois textes colorés éclaircis pour tenir 4,5:1
  (`text-alert` `#DC5F58`, `text-water` `#5E8CA8`, `text-ebc-copper` `#B5785B` ; les aplats ne bougent pas).
- Règles propres au clair (même fichier, reprises de theme-maquettes.css) : un aplat `bg-ebc-straw` porte un texte blanc ;
  les boutons en dégradé paille → ambre deviennent l'aplat noir ; survol gris foncé au lieu de l'or ; sélection noire ;
  chevrons des `summary` en `#666`.
- `tailwind.config.js` : mêmes noms (`cave-*`, `ebc-straw`, `area-*`, `hop`, `water`, `alert`, `attention`), valeurs
  `rgb(var(--x) / <alpha-value>)` (les opacités `bg-water/50` restent valides) ; `textColor` séparé (variantes texte,
  dont `text-ebc-gold/amber/copper`) ; jetons `marque` et `repere` du prototype ajoutés ; ombres `lift`/`sheet`
  dosées par thème (`--ombre-lift`, `--ombre-sheet`).
- `src/theme/couleurs-portees.css` (généré par `scripts/theme/porter-reste.mjs`) : les teintes propres des composants.
- `index.html` : `data-theme="clair"` sur `<html>`, classes en jetons au lieu de `bg-[#12100E]`, et un script en ligne
  qui pose « cave » avant le premier rendu si l'appareil l'a gardé (pas de clignotement ; vérifié par G3 : thème lu à
  l'apparition de `<body>`). `meta theme-color` suit le thème.
- `src/main.tsx` : `initialiserTheme()` (relit le choix, suit un autre onglet).
- L'étape Houblons v4 (`src/ui/hopIndex/maBiere/theme-app.css`) forçait « cave » sur `[data-hop-v4-etape]` : vidé
  (commentaire seul), l'étape suit maintenant le thème de l'app, comme sa maquette.

## Couleurs en dur

Deux passes mécaniques, rejouables, chacune avec sa règle écrite en tête du script :

1. `scripts/theme/porter-couleurs.mjs` : 468 valeurs de la palette de l'app (hex, hex à alpha, `rgba()`) devenues
   `rgb(var(--jeton))` dans 15 fichiers CSS ; une propriété de texte prend la variante texte ; un texte sombre sur un
   aplat paille prend `--sur-paille` (blanc en clair, `#12100E` en cave ; trois boutons : `brew-day.css`,
   `finance/brew-budget.css`, `finance/finance.css`).
   Fichiers : `src/pages/brew-day.css`, `src/ui/brew-equipment.css`, `brew-system.css`, `brew-thermal.css`,
   `equipment-compact.css`, `recipe-installation.css`, `nolo-simulator.css`, `water/workshop.css`,
   `finance/brew-budget.css`, `finance/finance.css`, `finance/journal.css`, `finance/tax.css`, `finance/upgrades.css`,
   `hopIndex/aroma-charts.css`, `hopIndex/hop-recipe.css`.
2. `scripts/theme/porter-reste.mjs` : 277 teintes hors palette (190 variables `--c-*` / `--ct-*`) dans `brew-day.css`,
   `brewer-chat.css`, `brewer-navigation.css`, `brew-equipment.css`, `finance/finance.css`, `finance/journal.css`,
   `finance/upgrades.css`, `hopIndex/hop-recipe.css`, `nolo-simulator.css`. En cave : la valeur d'origine exacte. En
   clair : neutre → degré `cave-*` le plus proche en luminance ; coloré → sa famille (houblon, eau, attention, alerte,
   agenda, production), texte foncé, aplat sombre devenu voile léger. Les 95 textes portés du clair tiennent 4,5:1
   (`contraste.mjs`).
3. TSX, à la main (sed relu) : `CatalogAnalysis.tsx`, `WaterRadar.tsx`, `FinanceComparisonChart.tsx`,
   `NoloAlcoholChart.tsx`, `FermentationCurveChart.tsx`, `CashflowBarChart.tsx` (axes), `ExpenseDonutChart.tsx` (trait),
   `HopAromaChart.tsx` : grilles, axes, infobulles et séries en `rgb(var(--jeton))`.

## Réglage

Le bouton soleil/lune (`src/theme/ThemeToggle.tsx`, `data-theme-toggle`) est dans l'en-tête, comme il l'a demandé :
- wizard (téléphone) : à droite de l'icône d'import « Coller une recette » (`src/pages/BrewWizard.tsx`) ;
- toutes les pages en `PageShell` (titre d'ordinateur et en-tête par défaut) : `src/pages/PageShell.tsx` ;
- accueil : `src/components/Header.tsx`, avant la loupe.
Un toucher bascule clair ↔ cave ; l'icône montre le thème où l'on va (lune en clair, soleil en cave). Choix gardé dans
`localStorage` (`laffinee.theme`), hors ligne, relu par `index.html` avant le premier rendu. Les « réglages existants »
(feuille Paramètres) n'ont pas reçu de doublon : son ajout du 25.10 place le choix dans l'en-tête.

## Écrans vérifiés

Captures dans `captures/` (`<écran>-<largeur>-<thème>.png`), prises par `scripts/theme/captures-ecrans.mjs` (serveur
Vite, `?dev-local`, drapeau `hopV4` allumé, réseau externe coupé), regardées en planches (`captures/planches/`).
Le tableau détaillé écran × format × thème est dans RESULTAT.md, « Captures regardées ».

## Restes

- `src/ui/hopV55/**` (1 700 teintes) : feuille déjà claire à part, montrée seulement drapeau `hopV4` éteint ; non portée.
- `src/ui/hopIndex/maBiere/**` : déjà en jetons et partagé avec la maquette ; `#c2410c` (clé de la légende) et les
  couleurs des familles d'arômes gardent leur valeur, comme dans sa maquette.
- `src/design/**` (bancs `?preview=design`, dev seulement) : nuancier écrit en dur, il montre la palette cave.
- `LoginPage.tsx` (logo Google), confettis (`QuickActionModal`, `CreativeLabTab`), couleurs de catégories de
  `ExpenseDonutChart`/`CashflowBarChart`, `finance-proof` blanc (fond d'une photo de justificatif) : volontaires.
- Blanc, noir et leurs voiles (`#fff`, ombres `rgb(0 0 0 / …)`) : inchangés.
- Le focus visible est noir en clair : sur `?preview=brew`, le conteneur focalisé au chargement montre un cadre noir
  (en cave, il était paille). Comportement existant, plus visible ; à juger par le critique.
- `npm test` échoue AVANT vitest sur `scripts/audit_inputs.mjs` : `src/ui/hopIndex/maBiere/Ajouter.tsx:114` (un
  `<input>` brut, venu de T12, pas de cette voie). Non corrigé ici : le composant est partagé avec sa maquette (règle n° 1).
