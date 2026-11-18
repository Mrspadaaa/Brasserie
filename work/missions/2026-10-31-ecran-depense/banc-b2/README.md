# Banc B2 — test d'écran de « Nouvelle dépense » (prêt pour le critique, 07.11)

Build figé de l'app en mode développement (aucun serveur, aucun rechargement Vite), servi par interception sur `localhost:4319`
(`?dev-local` n'ouvre que sur localhost), états SIMULÉS d'`src/ui/depense/apercuDev.ts` : aucun Gemini, aucun Drive, aucune écriture.

1. Construire (depuis la racine du dépôt) :
   `NODE_ENV=development npx vite build --mode development --config work/missions/2026-10-31-ecran-depense/banc-b2/vite.depense.config.mjs --outDir "$TEMP/depense-b2"`
   (pdf.js et zxing viennent de `%TEMP%/deploy-hosting-qr/node_modules` ; sans cette copie, les états PDF et QR ne se chargent pas.)
2. Toutes les scènes au repos, 390 tactile et 1280, clair et cave : `node work/missions/2026-10-31-ecran-depense/banc-b2/scenes.mjs "$TEMP/depense-b2" <sortie> [état…]`
   → `<état>-<mode>-<thème>.png` et `mesures.json` (débordement, valeurs brutes, console ; « ERR_FAILED » = police Google bloquée, attendu).
3. Les gestes : `import { ouvrirEtat, dormir, mesurer } from './scenes.mjs'` ; `ouvrirEtat(nav, construit, etat, 't390' | 'pc1280', 'clair' | 'cave')`
   rend la page, feuille ouverte sur l'état.

États (`ETATS`) : `3` (facture lue, points), `2` (sans point), `date` (date absente), `port`, `port-sans-montant`, `tout-port`, `5` (lecture
impossible), `difficile` (D381 : lecture en morceaux incomplète, photo plus nette ou saisie à la main), `6` (Drive absent), `8` (doublon),
`9` (hors réseau), `commande`, `familles`, `renovation`, `s6`, `qr-*` (confirme, contredit, partiel, illisible, ecart, invalide, sans, lecture,
pdf, non-verifie). Écrans récents à viser d'abord : D372 à D379 (unité en doute, q × prix, face à face, TVA, plier et déplier), import D381.
