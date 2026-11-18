# Voie c-lenteur — la lenteur de la lecture (D261c) : une page de choix en mini maquettes

Agent : `concepteur` (Opus). Plafond : 60 tours. Critique Fable après la voie (e-t11), puis le pilote publie. Aucun code de l'app modifié,
aucun commit, aucun déploiement, aucun serveur Vite dans le dépôt. Possède : `work/missions/2026-10-31-ecran-depense/choix-lenteur/**`.
Avant de concevoir : `.claude/rules/affinee-frontend.md`, `DESIGN.md`, `docs/ui-compacte.md` (parties utiles) ; skills `boosters-ux`, `impeccable`.
Reprends la forme des pages déjà acceptées `choix-nom/` et `choix-captures/` (index.html, outils/, maquettes/ : feuille de style,
visionneuse, vignettes « = X » grisées, en-tête court) et leurs verdicts `critique/VERDICT-c-nom.md`, `critique/VERDICT-c-captures.md`
(s'il existe quand tu commences) : ne refais pas leurs défauts.

## La question (un seul facteur, L10)
Après « Choisir le document », combien de temps attend-il, et que voit-il pendant ce temps ? Seul varie **le moment où la troisième
lecture (3.8 Flash) compte** et ce que l'écran montre en l'attendant. L'écran Dépense lui-même (rangées, bandes, pied) ne change pas.

## Ses mots (SPEC-BRASSEUR, mot pour mot)
- 01.11, 8 h 25 : « Aussi, c'est assez fiable mais toujours plutôt lent ».
- 01.11, nuit : « Et ça a pris vraiment beaucoup de temps pour une "facture" relativement simple ??? » (environ 27 s côté serveur).
- 01.11, nuit : « SI on perd à ce point en qualité avec 2 Rapid puis 1 lent autant utiliser 2 lents puis 1 lent comme au début. »
- 02.11 : « Choix encore ouverts : D273b (…) et D261c. Montre moi ».

## Les faits mesurés (voie m-lenteur, 02.11, 14 pièces, 1 tirage, hors ligne, rejoués par le pilote)
Source : `voies/m-lenteur/RESULTAT.md` (tableau « Les options »). Recopie ces chiffres tels quels sous chaque option ; dis « 14 pièces,
1 tirage : un indice » une seule fois en tête.
- **A — aujourd'hui** (référence, `data-reference`) : deux lectures rapides, puis la 3.8 sur 12 pièces sur 14 ; l'écran arrive à la fin.
  18,5 s médian, 37,7 s au pire ; 154/165 champs justes ; 10 erreurs sans drapeau ; 0,045 CHF par pièce.
- **B — la 3.8 seulement quand l'argent diffère** (total, HT, montant de ligne, lignes sans vis-à-vis ; variante B2 du banc) : 8 pièces
  sur 14 ; 11,0 s médian, 34,3 s au pire ; 156/165 ; 7 erreurs sans drapeau ; 0,031 CHF. À confirmer par deux tirages de plus.
- **C — jamais de 3.8** : 6,3 s médian, 9,9 s au pire ; 149/165 ; 34 champs rouges ; **22 erreurs sans drapeau** ; 0,021 CHF.
- **D — écran tout de suite, 3.8 ensuite** : l'écran arrive après les deux lectures rapides (6,3 s médian, 9,9 s au pire), valeurs
  provisoires ; la 3.8 finit en arrière-plan (18,5 s médian) ; « Confirmer » attend la lecture finale. Justesse finale = A (154/165).
  Au premier écran, 22 valeurs fausses n'ont pas encore de drapeau : la page doit le montrer honnêtement.
- Tu peux montrer **B + D** (écran tout de suite, 3.8 seulement quand l'argent diffère) si tu le juges une vraie alternative, en le disant.
- Le temps compté est celui des appels Gemini côté serveur ; le transfert et la traduction des noms (≈ 4 s, en parallèle) s'ajoutent.

## Les vues de chaque option
1. **Pendant la lecture** à environ 6 s (ce qu'il voit).
2. **Pendant la lecture** à environ 15 s (D : l'écran rempli, provisoire ; A : toujours l'attente).
3. **Lue** (la dépense prête à confirmer).
Pour D : comment l'écran dit « lecture finale en cours » sans cockpit (une marque compacte, jamais un paragraphe), comment une valeur
corrigée par la 3.8 se voit à l'arrivée, et le « Confirmer » en attente. Pour B et C : rien de neuf à l'écran, seul le temps change ;
dis-le par la frise de l'état « lecture » actuel et le temps affiché, pas par du texte.
Le temps : une petite frise ou un repère « ≈ 6 s », « ≈ 18 s » sous chaque vue, la même pour toutes les options.

## La forme de la page et les contrôles
`choix-lenteur/index.html`, maquettes HTML à 390 px capturées en PNG (`img/`), valeurs fictives, fournisseurs fictifs (aucune valeur de
ses pièces). Base visuelle : l'écran actuel (`voies/p3c-port/captures/tactile390-lecture.png` pour l'état « lecture »,
`voies/f3-rangees/captures/tactile390-clair-repos.png` pour la dépense lue). Aucune option proposée par le pilote ; tu peux en
proposer une, en le disant comme ton avis.
1. `node work/refonte-frontend/v4/tournoi/outils/controle-page-choix.mjs work/missions/2026-10-31-ecran-depense/choix-lenteur/index.html --min=3` → `PAGE-CHOIX OK`.
2. `node scripts/agents/verifier-page.mjs work/missions/2026-10-31-ecran-depense/choix-lenteur/index.html --page-lot --captures work/missions/2026-10-31-ecran-depense/choix-lenteur/controle` → `PAGE OK` ; ouvre chaque capture (L12).
3. `controle-choix` : l'écran Dépense n'est pas dans `ecrans.json` ; le dire dans RESULTAT.
4. Chaque nombre de la page se retrouve dans `voies/m-lenteur/RESULTAT.md` (L14) : liste-les dans RESULTAT avec leur ligne.

## Retour
`choix-lenteur/RESULTAT.md`, puis une ligne `C-LENTEUR OK — <n> options — choix-lenteur/index.html` ou `C-LENTEUR ECHEC — <raison>`.
