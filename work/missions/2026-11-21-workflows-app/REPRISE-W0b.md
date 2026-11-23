# REPRISE W0b (21.11) — étapes rouges de la file « port » dans chaines.mjs

Agent arrêté à ~200 k jetons. **Écrit, syntaxe vérifiée (`node --check` OK), JAMAIS ENCORE JOUÉ. Rien commité.**

## Où
Worktree `C:/Users/mrspa/.codex/worktrees/openai-clean-start/port-carnet`, branche `claude/port-carnet-1711` (HEAD `b2fe0efd2`).
Attention : ce worktree n'a pas `work/missions/2026-11-21-workflows-app/` (il est dans le dépôt Brasserie) ; `chaines.mjs` n'existe que dans port-carnet.
Arbre sale d'autres sessions (calendrier, `chaines-outils.mjs` modifié par F-HORIZON : non commité, non à moi). Commit par chemins : seulement
`scripts/parcours/chaines.mjs` et `scripts/parcours/fixtures/chaines.mjs`, message terminé par « Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com> ».

## Fait (fichiers modifiés, non commités)
- `scripts/parcours/fixtures/chaines.mjs` : `fixtureChaines(aujourdhui, opts)` gagne des ajouts À LA DEMANDE (les 13 étapes des bugs gardent leur fixture) :
  `cuve` (B-ZZ-FERM, fgTarget 1,010, 2 relevés 1,050 → 1,022), `garde` (B-ZZ-GARDE 96 L + fûts F-005/6 propres, F-007/8 à laver), `retours` (F-009, F-010 livrés
  à CL-CIGOGNE en plus de F-004), `rayons` (Mosaic, Saaz, Bouteille 33 cl, Capsule, Sucre, Dextrose : six rayons), `manques` (B-ZZ-MANQUE « ZZ TEST Brune », 3 kg
  de Caramünch pour 0,6 au stock, dans 9 j), `caisseBasse` (caisse 600 CHF, retire T-ZZ-ANC et P-POMPE : point bas −440), `marge` (tarifs 33 cl IPA 4,80 et Blonde 4,60),
  `achatPompe` (T-ZZ-POMPE « ZZ TEST Pompe 2025 » 420, pour D2), `rebrasser` (recette R-ZZ-PA-V1 « ZZ TEST Pale Ale v1 », houblon α 9 au lieu de 12,5).
- `scripts/parcours/chaines.mjs` : helpers (`appuiLong`, `libelles`, `moisPlus`, `nombre`, `venteComptoir33`), `jouer` passe `e.fixture`, **13 étapes ajoutées** :
  A2, B1, E2, N1, N3, N4, K7, N2, N6, K3-COURSES, K4, F2, C1-RECETTE (`--etape` existait déjà).

## Libellés attendus (D393, D396, maquettes moins-de-gestes v03 v05 v07 v09 v10 v11)
A2 appui long « 33 cl » → boutons 6 · 12 · 24 (24 × 33 cl, puis +1 = 25) · B1 carte LOT-PA « 120 × 33 cl · 2 fûts », 114 après 6 ventes, toucher le reste ouvre « Vendre »
· E2 « 1,0xx prévu » + bouton « Comme prévu » (3e relevé = prévu) · N1 malt non 0 kg, 1re proposition houblon « Ajouter ZZ TEST Citra… » + α 12,5, levure « ton stock d'abord » + « Poser »
· N3 « Tout relier à ton stock », « N reliées », α 12,5 · N4 « Ses 3 fûts sont revenus » sur la fiche du fût F-004 (kegs lavage, sans client, dernier historique `retour-vide` du jour)
· K7 « 2 à laver · marquer propres » puis F-005 à F-008 proposés · N2 commencer d'office (plus de « Commencer aujourd'hui »), eau 70 à 78 °C, « Tout pesé »
· N6 « CHF / L » et « marge » « par 33 cl » · K3-COURSES Caramünch et « 2,4 kg » dans Courses, pas « rien cette semaine » · K4 Bord « plus bas » et « 440 », Finances › Prévisions « 440 »
· F2 « ✓ le reste du rayon » (5/5 comptés Malts, Houblons reste 0/3) · C1-RECETTE « 3 mois » au 1er écran puis « vers févr. ».
Ce que l'exploration a montré sur HEAD (build `%TEMP%\chaines-build-W6Hwu9`) : aucun de ces mécanismes n'existe ; le 1er écran de la recette n'a pas de date (champ `brewDate` jamais rendu) ;
« Brasser · B-ZZ-JOUR » ouvre la page du jour avec « Commencer aujourd'hui » et « Eau d'empâtage ?°C … pose 55,0 » ; Courses dit « 3 manquent · rien cette semaine » ; Recompter montre
« Compter » par rayon (« 0/5 comptés ») ; la fiche d'un fût livré n'a que « Revenu plein » / « Retour vide » ; Brassins affiche « 120 × 33 cl · 3 fûts · 60 L » (le fût livré compté).

## À faire (dans l'ordre)
1. Builds (déjà faits, réutilisables) : HEAD `%TEMP%\chaines-build-W6Hwu9` (copie de HEAD, `--ref HEAD`), tour7 `%TEMP%\chaines-build-KVR8N3`. Si absents : `PARCOURS_GARDER=1 node scripts/parcours/chaines.mjs <cap> --ref HEAD --etape B2`.
2. Deux jeux en parallèle (lancés puis coupés par le plafond : relancer) :
   `NEW="A2,B1,E2,N1,N3,N4,K7,N2,N6,K3-COURSES,K4,F2,C1-RECETTE"`
   `node scripts/parcours/chaines.mjs $TEMP/w0b-cap/head --build $TEMP/chaines-build-W6Hwu9 --etape $NEW > $TEMP/w0b-head.log`
   `node scripts/parcours/chaines.mjs $TEMP/w0b-cap/tour7 --build $TEMP/chaines-build-KVR8N3 --etape $NEW > $TEMP/w0b-tour7.log`
   Attendu : 13 KO sur chacun, **chacun pour la bonne raison** (le message dit le mécanisme absent, pas « introuvable » d'un geste d'avant). Une étape qui passe ou casse trop tôt : corriger l'étape.
3. Points probables à corriger à la première exécution (jamais joués) : A2 sélecteur de « 6 » exact ; B1 regex de la carte `LOT-PA\s*—?\s*(\d+) × 33 cl · (\d+) fûts?` et `venteComptoir33` (Espèces, « Encaisser ») ;
   E2 `Mesurer` en préfixe ; N1 `libelles(s,'Ajouter ')` et la sélection du style ; N4 `Fûts` en `button,[role=tab]` ; N6 « Dossier » (casse) ; K4 présence de `T-ZZ-ANC` retiré ; F2 `Compter` i:0.
4. Les 13 étapes des bugs (B1 B2 B4 D394 B6 B5 B10 B11 DOSE WF2-8 WF2-1 WFA-15 WFA-12) doivent rester vertes sur une copie de HEAD : `node scripts/parcours/chaines.mjs <cap> --build $TEMP/chaines-build-W6Hwu9 --etape B1,B2,B4,D394,B6,B5,B10,B11,DOSE,WF2-8,WF2-1,WFA-15,WFA-12` (fixture inchangée pour elles).
5. Ouvrir 2 ou 3 captures de `w0b-cap` (L12), puis commit par chemins (deux fichiers), puis RESULTAT.md du voie (étapes, KO sur tour7, commit).

## Doutes à rendre
- K4 : le chiffre −440 vient de la fixture (600 − 420 + 280 − 900), calculé à la main ; si le moteur compte autre chose, V-COUT ajuste.
- N6 : le coût du litre exige des litres nets (inconnus pour un brassin planifié, « jamais 0 ») : la voie V-COUT peut devoir changer le brassin de l'étape.
- N4 : « un fût absent se décoche » n'est pas jouée (pas de libellé fixé). N2 : « commencer d'office » est lue comme l'absence du bouton « Commencer aujourd'hui ».
- DÉCISION À PRENDRE : aucune ; `chaines-outils.mjs` (modifié par F-HORIZON, non commité) n'est pas commité ici.

CONNAISSANCE : le 1er écran de l'assistant de recette n'a aucun champ de date (BrewWizard `brewDate` n'est pas rendu) : C1-RECETTE crée l'horizon, il ne remplace pas un carrousel.
LEÇON PROPOSÉE : aucune.
