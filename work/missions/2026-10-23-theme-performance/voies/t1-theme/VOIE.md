# Voie t1-theme — Le thème clair des maquettes dans toute l'app

- Mission : 2026-10-23-theme-performance (lire `../../MISSION.md` d'abord)
- Agent : concepteur
- Modèle : opus
- Niveau : conception
- Plafond : 150 tours ; 3 essais par critère
- Dépend de : —
- Décideur en cas de doute : pilote (option prudente, écrite dans la NOTE ; aucune question bloquante)

## Objectif
Toute l'app s'affiche par défaut dans le thème clair des maquettes que le brasseur a choisies, et dans le « cave » actuel
au choix. Ses mots : « Le thème de l'app principal doit être revu. On garde celle des maquettes » (23.10).

## Entrées
- `prototypes/houblons-v4/ecran/THEMES.md`, `…/ecran/src/themes.css`, `…/ecran/tailwind.config.js` : le mécanisme du
  prototype (mêmes noms de jetons, valeurs en canaux RGB par thème sous `[data-theme]`) et les valeurs du clair, avec
  leurs contrastes mesurés. C'est la référence : on le porte, on ne le réinvente pas.
- `tailwind.config.js`, `src/index.css`, `src/main.tsx` : le thème actuel de l'app.
- `DESIGN.md` (la décision du 23.10 est en tête), `PRODUCT.md`, `docs/ui-compacte.md`, `.claude/rules/affinee-frontend.md`.
- Les captures des maquettes choisies, pour l'allure du clair : `work/refonte-frontend/v4/ecran-1/base/consolide/`
  (`index.html`, l'étape Houblons, et `biere.html`, l'onglet Ma bière) et le registre
  `work/refonte-frontend/v4/choix/ecrans.json` (règle n° 1).
- La vérification locale de l'app : `cerveau/agents/verification-locale.md` (`?dev-local`, scripts de contrôle).

## Possède (seuls chemins où écrire, avec RESULTAT.md)
- `tailwind.config.js`, `src/index.css`, `src/main.tsx`, `src/theme/**` (nouveau)
- les composants de `src/` qui portent une couleur en dur à remplacer par un jeton (les lister dans la NOTE)
- l'endroit des réglages de l'app où l'on choisit le thème (le trouver ; le nommer dans la NOTE)
- `scripts/theme/**` (vérifications de la voie)
- `DESIGN.md` : l'en-tête des couleurs et la section « Colors », réécrites pour deux thèmes
- `work/missions/2026-10-23-theme-performance/voies/t1-theme/` (NOTE.md, RESULTAT.md, captures)
- Ne pas toucher `prototypes/houblons-v4/**` ni `work/refonte-frontend/**` : ils appartiennent à une autre session. Une
  sortie de construction de la maquette va dans `prototypes/houblons-v4/maquettes/parcours-theme/` (ignoré par git).

## Consignes
1. **Porter, pas réinventer.**
   - Les jetons de l'app gardent leurs noms (`cave-*`, `ebc-straw`, `hop`, `water`, `alert`…) ; leurs valeurs
     deviennent des variables en canaux RGB par thème, comme dans le prototype. Les opacités (`bg-water/50`) restent
     valides.
   - `[data-theme='clair']` par défaut sur `<html>`, `[data-theme='cave']` au choix.
   - Les deux jetons propres au prototype (`marque`, `repere`) entrent s'ils servent.
2. **Choisir le thème** : clair par défaut. « Cave » se choisit dans les réglages existants de l'app. Le choix est gardé
   sur l'appareil, hors ligne, sans clignotement au démarrage.
3. **Couleurs en dur** : chercher dans `src/` les couleurs écrites en dur (hex, `rgb(`, couleurs nommées dans le JSX et
   le CSS) qui ne suivraient pas le thème, et les remplacer par des jetons. Lister les restes justifiés.
4. **DESIGN.md**
   - L'en-tête des couleurs et la section « Colors » décrivent les deux thèmes, avec les contrastes mesurés aux seuils
     du document (7, 4,5, 3).
   - La règle « ne jamais porter de texte » est réécrite pour le clair.
   - Le reste de DESIGN.md ne change pas.
5. **Vérifier en vrai** (règle frontend du dépôt)
   - Chaque écran et chaque feuille de l'app, ouverts dans Chrome :
     - à 390 puis à 1280 px ;
     - en clair puis en cave ;
     - captures regardées.
   - Hiérarchie, lisibilité, contrastes, débordements, éléments fixes, place des barres. La densité de DESIGN.md ne
     bouge pas : seul le thème change.
   - Jouer les parcours principaux : recette, brassage, stock, réglages.
   - La maquette jouable, reconstruite dans `maquettes/parcours-theme/` : ses routes s'ouvrent et elle reste identique
     en clair.
6. Skills à employer : `ui-design-system` (jetons), `a11y-audit` (contrastes), `impeccable` (critique du rendu).
6 bis. **La maquette jouable de l'autre session étend `tailwind.config.js` et importe `src/index.css`.**
   - Après ton changement, reconstruis-la dans `prototypes/houblons-v4/maquettes/parcours-theme/` :
     `node prototypes/houblons-v4/parcours/outils/construire.mjs --sortie=prototypes/houblons-v4/maquettes/parcours-theme`.
   - Ses choix doivent rester tenus (`controle-choix.mjs`, règle n° 1) et son parcours complet doit passer (G10, G11).
   - Tes modifications de `src/` font virer au rouge le critère « APP INTACTE » de l'autre session tant qu'elles ne
     sont pas commitées. Le pilote les commitera d'un bloc à ton retour : ne laisse rien à moitié fait dans `src/`.
7. `NOTE.md` : `## Mécanisme`, `## Couleurs en dur`, `## Réglage`, `## Écrans vérifiés` (écran × format × thème, et
   capture), `## Restes`.

## Exigences transversales (recopiées, leçons L05, L11, L12)
- Montrer d'abord l'utile, compacter le chrome : la règle principale de l'interface ne change pas.
- Fini = branché, atteint par un vrai parcours dans Chrome, typé, testé, build vert. Une capture non regardée ne prouve
  rien.
- Pas de `type="number"` ; contrastes, clavier et zoom gardés.

## Critères
Dans `GATES.md`, même dossier. Ne pas le modifier. Lancer chaque `CHECK:` depuis la racine du dépôt.

## Rendre
`RESULTAT.md` au format de l'agent, avec la section `## Captures regardées`. Réponse finale au pilote : une ligne.
