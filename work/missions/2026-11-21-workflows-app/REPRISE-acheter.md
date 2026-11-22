# REPRISE — chaîne ACHETER (21.11)

État : ANALYSE-acheter.md et BUGS-acheter.md écrits (11 bugs WFA-1 à WFA-11, 5 propositions G1 à G5 filtrées par GAIN.md).
Arrêt à ~165 k de contexte. Chaînes A, B (en partie) et C jouées au doigt ; D, E, F et hors ligne non jouées.

## Pourquoi l'arrêt
« Confirmer » de la facture a été refusé : la fixture donnait `tvaRate: 8.1` alors que la convention est une fraction (0,081). Corrigé dans
`acheter/fixture-achat.mjs`. Le refus muet est noté (WFA-10, basse).

## À faire (exécutant Haiku possible, jugement au concepteur)
1. Rebâtir le build si `port-carnet` a bougé :
   `cd C:/Users/mrspa/.codex/worktrees/openai-clean-start/port-carnet && PARCOURS_RACINE="$PWD" npx vite build --config scripts/parcours/vite.parcours.config.mjs --outDir <scratchpad>/build --emptyOutDir --logLevel error`
   (le chemin du scratchpad est en tête de `acheter/chaine.mjs` : variable `S` ; l'adapter).
2. `cd work/missions/2026-11-21-workflows-app/acheter && node chaine.mjs` ; attendu : segment « confirmer » sans « Confirmer encore visible »,
   puis `[apres]` : Malt pilsner 30 kg, manque de l'IPA de Noël à 0 ou réduit, « Commande de malt » soldée (plus à −420 au Calendrier, pas
   comptée deux fois avec la facture 421,57), Finances avec la dépense, solde −570 → environ −571,57 et non −991,57.
   Corriger dans `etat()` : après Confirmer, le Bord n'a plus d'onglet « Stocks » dans `nav button` (ERR « introuvable : Stocks ») ; viser le bouton `aria-label="Stocks"` de la barre basse.
3. Ouvrir chaque capture `captures/1x-apres-*.png` et confronter aux `0x-avant-*`.
4. Chaîne F : Stocks › Matériel › À venir › « Pompe de transfert » → payer / facture → l'appareil au Parc, besoin soldé, Calendrier mis à jour.
5. Hors ligne : `window.__horsLigne = true` avant la photo (banc.mjs) ; attendu : message clair, saisie à la main possible, rien de perdu.
6. Compléter la table de ANALYSE-acheter.md (D, E, F) et ajouter les bugs WFA-12… ; recommiter par chemins.
