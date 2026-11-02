# Voie g1-audit — son ticket rejoué dans Chrome, chaque état touché, la version en ligne mesurée

Agent : `auteur` (Sonnet). Plafond : 100 tours. Lire d'abord `../g-commun.md`. Part tout de suite.

## Pourquoi
Il a trouvé en dix minutes ce que nos bancs n'ont jamais montré : aucun cas n'a joué un ticket hors brassage, ni chaque état touché, ni les deux
thèmes. Cette voie fait ce qu'il a fait, sur la version **en ligne** (b3ab392e), et en tire des mesures qui échouent sur elle (L13).

## Où jouer
Dans `C:/Users/mrspa/AppData/Local/Temp/deploy-hosting-qr` (détaché sur b3ab392e = l'app en ligne, node_modules et functions/lib présents ; nul
autre n'y écrit pendant la voie). N'y change que le script du banc (copié depuis le worktree) et la config ; aucun commit, aucun `git checkout`,
aucun déploiement, ne touche ni `.firebaserc` ni `source4-portable-bundle-manifest-01.json` ni `functions/.env`. Les voies g2a et g2b écrivent
dans le worktree pendant ce temps : ne joue jamais le banc depuis le worktree ni depuis `qr-app-copie`.

## Ce qu'il faut faire
1. Un manifeste **hors Git** (`os.tmpdir()/bauhaus-0211/rejeu-bauhaus.json`) : les pièces de `rejeu-k6.json` plus une pièce `bauhaus` (sa photo,
   `final.json` servi comme une lecture déjà en cache, `finalSeul`). Lis comment le banc sert une pièce rejouée (`loadReplay`, `scan`, `cacheable`).
2. Des cas `g-*` dans `scripts/check-invoice-journey-emulator.mjs` (le worktree ; copie-le dans deploy-hosting-qr pour jouer), par l'entrée de l'app
   (Actions rapides → Entrer une facture → Importer un justificatif), en thème clair **et** sombre (`data-theme='cave'`), à 390 tactile et 1280 :
   - `g-repos` : récap, puis la liste défilée jusqu'en bas ;
   - `g-puces` : chaque puce du récap touchée tour à tour (à contrôler, à remplir, nouveaux, hors stock, désaccord, corrigées s'il y en a) ;
   - `g-plier` : « Plié », puis « Déplié », puis une en-tête touchée ;
   - `g-plateaux` : la rangée ouverte de Vitrificateur, DURGOL, DEBOUCHEUR, COMBINAISON, Tapis, le sac ;
   - `g-remplir` : le filtre « à remplir » touché, ce que l'écran désigne ;
   - `g-regrouper` : « Regrouper en une dépense » touché, puis ce qui reste pour revenir ;
   - `g-brassage` : les mêmes états (repos, puces, plier, une rangée de malt et de houblon ouverte) sur doc14 du manifeste, et un cas lenteur
     avec corrections de la 3e lecture (les cas `lenteur-*` existants) pour le bandeau B et « ↻ corrigées ».
   Chaque cas écrit ses mesures en JSON : M1 rangées « à contrôler » ; M2 « ? » des rangées et des en-têtes ; M3 « nouveau » ; M4 par rangée nature
   pressée, type d'achat, bande ; M5 contraste minimal du texte de chaque bouton et de chaque texte visible de la fiche (liste sous 4,5) ; M6 éléments
   du récap rognés qui contiennent un chiffre ; M7 rangées `inconnu` et la couleur calculée de leur quantité ; M8 la puce active contre une inactive
   (fond, bord calculés) ; M9 après « Regrouper », un geste de retour existe-t-il ; M10 après « Plié », corps de groupe visibles ; M11 sous « à remplir »,
   le champ attendu est-il marqué (bord `alert`) et nommé ; M12 bandeau B présent quand la 3e lecture a changé quelque chose ; M13 par rangée ouverte, le nombre de segments Nature pressés (D335, attendu 1).
3. Lance tout ; captures et mesures dans `voies/g1-audit/avant/` (dossier ignoré : ce sont ses pièces). **Ouvre chaque capture en image** (L12) et
   écris `voies/g1-audit/ETATS.md` : une ligne par capture (cas, thème, largeur, ce qu'on voit, ce qui cloche à l'œil, sans valeur de sa pièce).
4. Rends à la voie g2 (via le pilote) les mesures M1 à M13 comme contrôles : chacune doit **échouer** sur b3ab392e ; garde la sortie.

## Possède
`scripts/check-invoice-journey-emulator.mjs`, `work/missions/2026-10-31-ecran-depense/voies/g1-audit/**`, le dossier temporaire. Interdits : `src/**`,
`functions/**`, `tests/**`. Un défaut vu se dit (capture, mesure), il ne se corrige pas ici.

## Critères (le pilote les rejoue)
1. Les cas existants du banc rejoués : même nombre d'OK qu'avant le changement du script (sortie gardée).
2. Les cas `g-*` tournent jusqu'au bout aux deux largeurs et aux deux thèmes ; 0 requête hors localhost ; 0 appel Gemini.
3. Sur b3ab392e, chaque mesure M1 à M13 rend son échec attendu (DEFAUTS D328a à D334) ; sinon le dire (le défaut ne se reproduit pas).
4. Chaque capture ouverte et décrite dans ETATS.md.
5. `git status --short` dans le worktree : rien hors de « Possède » ; aucune valeur de ses pièces dans un fichier suivi.

## Rendre
`voies/g1-audit/RESULTAT.md` (cas, sorties, mesures avant, liste des écarts vus à l'œil ; `LEÇON PROPOSÉE : …`, `CONNAISSANCE : …`), puis une ligne
`G1-AUDIT OK — …` ou `G1-AUDIT ECHEC — …`.
