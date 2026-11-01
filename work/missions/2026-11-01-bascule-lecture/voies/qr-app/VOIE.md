# Voie qr-app — le QR-facture lu dans le téléphone, montré comme z2 (D240, D243, D246, D247)

Agent `auteur` (Sonnet), 80 tours au plus. Décideur : pilote ; le critique Fable juge le port ensuite (voie qr-critique).

## Ses mots
« zxing-wasm ok » (D240) ; « Okok » à pdf.js et au QR branché après des mini maquettes (D243) ; « Le sceau QR z2 parfait comme telle »
(D246) ; « Yes ok » à la bascule (D247). Règle n° 1 : z2 se reprend tel quel.

## La base et la maquette
- L'écran en ligne : `src/ui/finance/ExpenseSheet.tsx`, `src/ui/depense/*` (Verdict, Ticket, Pictos…). Lis ce qui existe avant d'ajouter
  (L02) ; ne change rien d'autre de l'écran.
- La maquette choisie : `work/missions/2026-10-31-ecran-depense/qr/v1/z2/etat.html` et sa `NOTE.md`, ses captures `qr/v1/z2/*.png`
  (états confirme, contredit, partiel, illisible, sans, lecture, l'ouverture du sceau, 1280). Inventorie-la état par état et geste par
  geste avant d'écrire (L03, M16) : le sceau à côté du total, son verdict en un mot, la feuille au toucher (ce que dit le QR, IBAN et
  référence à copier), « sans QR » distinct de « pas vérifié », le désaccord montré côte à côte sans jamais changer un champ sans lui.
- Le module pur, déjà testé : `src/services/qrFacture.ts` (`parseSwissQr`, `parseSwicoS1`, `confronterQr`).

## À faire
1. Dépendances accordées, versions exactes : `zxing-wasm@3.1.5`, `pdfjs-dist@4.10.38`. **Aucune installation dans la jonction
   `node_modules`** (elle pointe vers `C:/Users/mrspa/Documents/Brasserie`) : `npm install --package-lock-only --save-exact` pour
   écrire `package.json` et `package-lock.json` seulement, puis tests, build et serveur de vérification depuis une **copie isolée**
   (`%TEMP%/qr-app-copie` : copie du worktree sans `node_modules`, puis `npm ci` réel dedans ; resynchronise `src/` et `tests/` avant
   chaque passe). Jamais de serveur dans `C:/Users/mrspa/Documents/Brasserie`.
2. Un module `src/services/qrLecture.ts` : lit un QR-facture dans le fichier choisi, **dans le téléphone, avant ou pendant l'appel à
   Gemini**, sans réseau. Image : zxing-wasm sur l'image (et, si rien, une seconde passe agrandie). PDF : pdf.js rend les deux dernières
   pages à l'échelle 3, zxing lit chaque rendu, arrêt au premier QR-facture. Piège mesuré au banc : **ne passe pas `standardFontDataUrl`**
   à `getDocument` (il effaçait le QR d'un de ses PDF) ; garde `isEvalSupported: false`. Le wasm de zxing et le worker de pdf.js sont
   **servis par l'app** (imports `?url` de Vite), chargés à la demande (import dynamique), jamais d'un CDN. Résultat : `QrFacture` lu,
   `illisible` (un QR vu mais pas décodé), `sans`, ou `non-verifie` (bibliothèque non chargée, hors ligne, erreur) ; jamais d'exception
   qui bloque la dépense, jamais de délai qui retarde la lecture Gemini.
3. Après la lecture Gemini, `confronterQr(qr, lecture)` donne l'état ; l'écran le montre comme z2. Rien n'est écrit dans Firestore
   (aucun changement de schéma) : le contrôle vit dans l'écran.
4. Tests (Vitest, zxing et pdf.js simulés) qui échouent avant : chaque état, le PDF sans `standardFontDataUrl`, la confrontation montrée,
   « Confirmer » jamais bloqué, aucun champ changé sans geste. Tests existants de l'écran gardés verts : `grep -rln "ExpenseSheet" tests`.
5. Fixtures fictives (« Malterie Fictive SA », F-1001, 110,40 CHF, 12.10.2026 ; aucune valeur de ses pièces) : une image et un PDF portant
   un vrai QR-facture SPC 0200 avec S1, un désaccord (QR 110,40, lecture 110,04), un bulletin sans montant ; générés par script dans ta
   voie. Parcours joués dans Chrome (puppeteer-core, `?dev-local`, voir `cerveau/agents/verification-locale.md`) depuis la copie
   isolée, à 390 × 844 tactile et à 1280 : chaque état, l'ouverture du sceau, la copie de l'IBAN. Captures nommées comme celles de la
   maquette, **ouvertes** et comparées côte à côte avec `qr/v1/z2/*.png` (L12).
6. `npm run build` vert dans la copie ; `node scripts/check-no-dev-auth.mjs` (ou le contrôle existant du même nom) propre. Note la taille
   des morceaux ajoutés (le wasm et pdf.js ne doivent pas entrer dans le morceau principal).

## Possède
`package.json`, `package-lock.json`, `src/services/qrLecture*.ts`, `src/ui/depense/**`, `src/ui/finance/ExpenseSheet.tsx`,
`tests/unit/depense/qr/**`, `work/missions/2026-11-01-bascule-lecture/voies/qr-app/**`, la copie isolée dans `%TEMP%`. Rien d'autre ;
ni `functions/` (une autre voie y travaille), ni `vite.config.*` sans le dire dans RESULTAT. Aucun déploiement, aucun commit, pas de
`git stash`, aucune donnée réelle, aucun appel Gemini. Ne touche jamais `firebase.json`, `.firebaserc`, `firestore.rules`,
`firestore.indexes.json`, `.codex/hooks.json`, `source4-portable-bundle-manifest-01.json`, `functions/.env`. Chemins absolus dans
Bash, pas de `cd` hors d'un sous-shell ; aucun code écrit par heredoc ni `node -e`.

## Retour
`voies/qr-app/RESULTAT.md` : inventaire de z2 (état par état), fichiers changés, tests (échouaient avant), build et tailles, parcours
Chrome, captures ouvertes et comparées, écarts restants avec la maquette. Puis une ligne : `QR-APP OK — …` ou `QR-APP ECHEC — <raison>`.
