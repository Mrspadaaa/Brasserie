# Ma bière : Paliers, puce de malt, « + » sur Eau (26.11)

Plaintes (25.11 nuit) : PALIERS-EDITION-MAL, PUCE-OUVRE-CLAVIER, BOUTON-FLOTTANT-COUVRE (`work/refonte-frontend/v4/DEFAUTS-RECURRENTS.md`).

## État de l'art (L29)
Problème type : éditeur de profil linéaire par morceaux (enveloppe, « keyframes ») au toucher. Méthode standard : manipulation directe de points
(poignées) doublée de champs numériques ; les logiciels de brassage (Brewfather, BeerSmith, Grainfather) éditent une liste de paliers et dessinent la
courbe. Sa maquette r2 (14.11) est la base (règle n° 1) : on garde courbe + poignées + bandeau à chiffres, on corrige le geste. Glissé au doigt sur
SVG : `touch-action` ne s'applique pas aux éléments internes du SVG (Chrome) → `touchstart` non passif + `preventDefault` sur la poignée (méthode
standard des bibliothèques de glissé). Repos types : Palmer, How to Brew, ch. 14 ; Kunze, ch. 3.

## Preuves
- Contrôle Chrome 9222 : `node controle-ma-biere.mjs 3117 <captures>` → KO 8/9 sur 136946d5b, OK 9/9 après.
- Gestes rejoués : `banc.mjs` (avant/ et apres/, journal apres/banc.log) ; planches avant/planche-1.png, apres/planche-finale.png.
- Critique Opus : apres/CRITIQUE.md (7 problèmes, 1 bloquant) ; corrigés : 1 à 6 ; n° 7 (OG/IBU « – » après un malt de test sans couleur) hors périmètre, à juger sur un malt réel.
- Vitest : tests/unit/paliersEdition.test.ts, bugs-k1b-poignee.test.ts, eauSels.test.tsx ; suite complète : mêmes échecs que la base (collecte functions/node_modules, c81Regles, recipePersistence, murDonnees : déjà rouges sur 136946d5b).
- Build : `vite build` vert.

## Déploiement (accord du brasseur requis)
Cette branche a 24 commits de retard sur `claude/refonte-houblons-v4` (Carnet) : fusionner d'abord dans la branche pilote, puis depuis elle :
```
rm -rf dist && npx tsc --noEmit && node scripts/check-water.mjs && npx vitest run
npx vite build && node scripts/check-no-dev-auth.mjs
node scripts/agents/controle-avant-deploiement.mjs <sha>
npx firebase deploy --only hosting -m "Ma bière : paliers au doigt, puce sans clavier, + au pied sur Eau"
```
Puis, en ligne, sur une recette « ZZ TEST — » : rejouer chaque geste des Paliers au téléphone.
