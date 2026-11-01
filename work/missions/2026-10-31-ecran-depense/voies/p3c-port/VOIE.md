# Voie p3c-port — l'écran Nouvelle dépense devient p3c-3 (bandes teintées compactes) dans l'app, avec le sceau QR z2

- Mission : 2026-10-31-ecran-depense
- Agent : auteur ; modèle : sonnet ; niveau : jugement (l'écran qui écrit une dépense, le stock et le justificatif Drive)
- Plafond : 150 tours (dont 40 pour le plan) ; 3 essais par critère
- Dépend de : qr-ecart (dba49adb, le sceau z2 dans l'app), p3c-r (c11dac21, p3c-3 retouchée), e-t5 (`critique/VERDICT-p3c-3.md` : RETENUE)
- Décideur en cas de doute : pilote ; l'option prudente et réversible

## Objectif (règle n° 1 : sa maquette choisie, reprise telle quelle)
Ses mots : « Les bandes teintées p3a-3 j'aime beaucoup ! C'est le top 1 de loin quasiment rien ne doit être changé. Il faudrait juste le
rendre un peu plus compact » (D245) ; « p3c-3 le mieux mais mettre plus en avant la quantité, juste mettre en gras, et bien alignées les
champs » (D248) ; « Le sceau QR z2 parfait comme telle » (D246). Après cette voie, l'écran « Nouvelle dépense » de l'app (`ExpenseSheet`)
est la maquette `work/missions/2026-10-31-ecran-depense/v3/p3c-3/etat.html`, **reprise telle quelle, état par état et geste par geste**
(ses captures sont dans le même dossier : repos, lecture, échec, hors ligne, envoi, reçu, renvoi, rouvert, plateau, TVA, papier, tous,
défilé, annexe, règle, 1280), avec le sceau QR z2 **tel qu'il est aujourd'hui dans l'app** (`src/ui/depense/Qr.tsx`, maquette
`work/missions/2026-10-31-ecran-depense/qr/v1/z2`), posé là où sa maquette le pose par rapport au bandeau.

À recevoir aussi :
1. **Plein écran à 390** (D235 : « que cette écran d'ajouter de facture prenne vraiment toute la place de l'app ») : la feuille prend toute
   la hauteur, sans marges de feuille ni navigation de l'app.
2. **Le port « Total seulement »** (D249 ; interface fixée par le pilote, la voie port-total fait l'enregistrement) : les lignes de la
   lecture dont `kind === 'shipping'` ne vont dans aucune bande ; le bandeau dit « dont port <montant> » sous le total, dans le style du
   « CHF » de la maquette (le plus petit élément, L02). Absent de la maquette : signale-le dans « ce qui diffère ».
3. **Rien ne se perd** de l'écran d'aujourd'hui (r2b porté par e-port, puis qr-app et qr-ecart) : points et chips numérotées, statut
   recalculé (`statutDeLecture`, `recomputeInvoicePoints`), valeur tapée jamais écrasée, mouture rattachée au seul geste (« Rattacher les
   5 »), S8 (même commande), base de la date, doublon de pièce (« Déjà enregistré · même fichier »), Drive en arrière-plan (file locale,
   notification d'échec, renvoi depuis la fiche), reçu, gardes `pendingId` / `proofSent` / `proofAttached`, sceau QR et ses états
   (confirmé, contredit, partiel, illisible, sans, lecture, invalide, écart et son choix QR / lu), pied « Confirmer » visible et toujours actif.

## Exigences communes
Lis et suis `work/missions/2026-10-31-ecran-depense/voies/COMMUN.md` ; sa dernière règle (« l'écran n'est pas refait ici ») ne s'applique
pas : cette voie **est** le port de son choix. Deux temps :
1. `COMPRIS.md`, G1, puis `PLAN.md`. Le plan contient : l'**inventaire** de p3c-3 (chaque état, chaque élément, chaque geste : repos,
   pendant, après ; M16) face à l'écran actuel, élément par élément ; la découpe des composants dans `src/ui/depense/` ; le tableau
   « Rien ne se perd » ; les tests existants dont le texte changera (chacun nommé, avec le comportement gardé) ; le script de captures.
   Tu t'arrêtes et rends `PLAN PRÊT — <n> points`.
2. Le pilote fait relire le plan par deux regards neufs et te renvoie la revue triée ; ensuite tu codes.
Écris `RESULTAT.md` **section par section dès le début** (L18).

Le business est juste à 100 % : une proposition perdue est permise, une fausse écriture ne l'est pas. Les règles d'enregistrement,
d'appariement et de lecture ne changent pas (le port à l'enregistrement est à port-total). Interface : `.claude/rules/affinee-frontend.md`,
DESIGN.md, docs/ui-compacte.md ; champs par le composant protégé `Input`, jamais `type="number"` ; aucun débordement horizontal à 390 ;
mêmes jetons de couleur que l'app, le thème suit ; quantités en gras, colonnes quantité · prix · montant alignées avec le sous-total de
bande (contrôle de la maquette : `v3/p3c-outils/controle-alignement.mjs`, à rejouer sur l'app servie dans ton script de captures).

## Où l'on joue (obligatoire)
L'écran charge zxing-wasm et pdf.js, absents de la jonction `node_modules` du dépôt. Tests, `tsc`, build et Chrome se jouent dans la copie
isolée `%TEMP%/qr-app-copie`, par `node work/missions/2026-10-31-ecran-depense/voies/p3c-port/copie.mjs <commande>` depuis la racine du
worktree (resynchronise puis lance). Jamais de serveur dans `C:/Users/mrspa/Documents/Brasserie`, jamais d'installation dans la jonction.

## Possède
`src/ui/finance/ExpenseSheet.tsx`, `src/ui/finance/InvoiceScanReview.tsx`, `src/ui/depense/**`, `src/ui/ModalShell.tsx` (une prop
facultative au plus, à justifier dans le plan), `tests/integration/expenseSheet.test.tsx`, `tests/unit/depense/ecran/**`,
`tests/unit/depense/qr/**`, `work/missions/2026-10-31-ecran-depense/voies/p3c-port/**`, la copie isolée.

Interdits : `src/services/**` en écriture (dont `purchaseEntry.ts`, à port-total), `src/domain/finance/invoicePoints.ts`, `functions/`,
`firebase.json`, `.firebaserc`, `firestore.rules`, `firestore.indexes.json`, les tests hors Possède (ils restent verts sans être
modifiés), tout ce que COMMUN.md interdit. Aucun déploiement, aucune installation dans la jonction, aucun commit, pas de `git stash`,
aucun appel Gemini (lectures simulées). Chemins absolus dans Bash ; aucun code écrit par heredoc ni `node -e`.

## Critères
`GATES.md`, même dossier. Ne le modifie pas. G7 : tu écris `voies/p3c-port/capturer-p3c.mjs` (puppeteer-core, sur le modèle de
`voies/e-port/capturer-depense.mjs` et de `work/missions/2026-11-01-bascule-lecture/voies/qr-app/outils/parcours.mjs`). Il joue sur l'app
servie chaque état et chaque geste de p3c-3 et du sceau z2, à 390 tactile, 390 souris et 1280, et écrit chaque scène côte à côte (l'app à
gauche, la maquette à droite) dans `voies/p3c-port/captures/`. Il imprime `P3C OK` seulement si : chaque geste a l'effet de la maquette ;
aucune erreur de console ; aucun débordement horizontal ; le pied est visible au repos ; la feuille prend toute la hauteur à 390 ;
l'alignement des colonnes tient ; aucune requête hors localhost. Ouvre en image au moins le repos, une bande, un point réglé, le sceau
(confirmé et écart), la TVA, l'enregistré et une erreur, aux trois modes.

## Rendre
`RESULTAT.md` : ligne 1 `OK — …` ou `ECHEC — …` ; « TEMOIN AVANT : … » ; le tableau « Rien ne se perd » ; ce qui diffère de la maquette,
et pourquoi ; les captures ouvertes ; `LEÇON PROPOSÉE : …` et `CONNAISSANCE : …`. Puis une ligne au pilote.
