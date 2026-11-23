REPRISE : work/missions/2026-11-21-chasse-calendrier/RESULTAT-V9.md — V9 : code et contrôles écrits, tsc propre ; rouge tour8 prouvé pour V5, D8 ; N10 pas encore rouge sur le bandeau ; vert arbre, vitest, commit et BUGS.md non faits (agent arrêté à ~100 k).

## Code écrit dans port-carnet (partir de HEAD 784b5b21b ; l'arbre porte AUSSI des hunks d'autres voies : CalendrierTab, calendrier.ts +3 l., usePointeur, Barre, geste.mjs, chaines.mjs +4 l., tests/calendrierGestes — ne pas les committer)
- `src/ui/calendrier/entete/EnTete.tsx` (clean vs HEAD avant moi) :
  - CHV-5 : `libellePastille(libelle, nombre, annee)` (exporté) → « Nov. · 6 sem. » (jamais ajouté pour An / 3 mois / 6 mois) ; le bouton `ent-per` et son aria-label lisent `pastille`. `libelle` reste pour le menu (V12).
  - EnTete.tsx:756 (message) : `causeCaisseInconnue(modele.causeSoldeInconnu)` (exporté) : `paiements` → « Des pièces payées n’ont pas de paiement : à confirmer dans Finances › Confirmer les paiements » ; `a-confirmer`, `autre`, défaut = texte d'avant (les 3 tests « Solde de départ inconnu » restent verts). `ModeleEnTete` accepte `causeSoldeInconnu`.
  - CHN-10 : l'invitation « Tourne le téléphone » ne passe plus par le message flottant de l'onglet (il se posait sur « Commande de malt −600 » / « Loyer du local ») ; `dire` la garde dans l'en-tête, `.ent-live` passe en `position: static` pour elle (inline) ; `taire('invite')` quand on quitte le plein écran.
  - CHD-8 : aria-label du chiffre clé « …(S43 ’27, sur tout l’horizon de la courbe) ».
- `src/ui/calendrier/entete/DetailCreux.tsx` : ligne `data-horizon` « Horizon : jusqu’au <fin> ».
- `src/components/tabs/DashboardTab.tsx` (clean vs HEAD) : Bord « Point le plus bas … · 28.12 · horizon 90 j ».
- `src/components/Header.tsx` (clean vs HEAD) : plein écran tenu droit : l'en-tête de l'app reste mais sans « L'Affinée » ni avatars (‹ pastille › et loupe restent) ; en paysage il reste masqué comme avant (Tour 2 n° 1). `data-plein-allege`.
- `src/domain/finance/forecast.ts` : `FinanceForecast.cashCause?` (= `ledger.cashCause`) + import type `CashCause`.
- `src/domain/calendrier.ts` (1 hunk de moi : type `causeSoldeInconnu?` après `soldeDepartInconnu`) ; `src/ui/calendrier/useDonneesCalendrier.ts` (`causeSoldeInconnu: courbe === null ? (prevision.cashCause ?? null) : null`).
- Contrôles : nouveau `scripts/parcours/chaines-calendrier-v9.mjs` (CH-V5, CH-N10, CH-D8, CH-MSG) ; `scripts/parcours/chaines.mjs` : 2 lignes à moi (import `etapesV9` avant l'import V8, `...etapesV9({ echec, ok, sleep })` après V8).
- `tsc --noEmit` : propre (après toutes ces retouches).

## Preuves déjà obtenues (build tour8 gardé : C:\Users\mrspa\AppData\Local\Temp\chaines-build-69lQoP ; captures dans scratchpad `v9/t8*`)
- Rouge tour8 : CH-V5 « la frise montre 6 semaines (S44 – S49), la pastille dit « Nov. » » ; CH-D8 « Bord : Point le plus bas au plus −4 149,00 CHF · 28.12 ; Calendrier : … (S43 ’27) » sans horizon (Prévisions dit déjà « Prévision sur 90 jours » : OK dès tour8) ; CH-N10 : ‹ › et loupe introuvables (rouge) MAIS le test « bandeau couvre » ne se déclenche pas encore.
- CH-MSG : sur tour8 aucun message (V1 y chiffrait la caisse, autre défaut) : le rouge est à prouver sur HEAD 784b5b21b (`--ref 784b5b21b`), pas sur tour8.

## Prochaine action
1. CH-N10, partie « bandeau couvre » : sur tour8 la capture (`v9/t8g/CH-N10-1-plein.png`, ouverte) montre la pastille noire « Tourne le téléphone : 13 semaines » (y 765–795) sur la rangée « Commande de malt −600 » de Papiers. Le contrôle ne le voit pas : déboguer (`rb`, la pastille trouvée par texte ; peut-être le texte des rangées est dessiné sans nœud texte intersecté, ou la copie sr-only est choisie). Ajouter dans le message d'échec `rb` et le nombre de nœuds testés. Rejouer : `node scripts/parcours/chaines.mjs <dossier> --build C:\Users\mrspa\AppData\Local\Temp\chaines-build-69lQoP --etape CH-N10`. Si le rectangle échoue encore : test de repli = élément `elementFromPoint` au centre de chaque rangée de texte (le bandeau est-il au-dessus ?).
2. Vert arbre : `node scripts/parcours/chaines.mjs <dossier> --etape CH-V5,CH-N10,CH-D8,CH-MSG` (build de l'arbre) ; ouvrir les captures CH-V5-1, CH-N10-1 (en-tête allégé + bandeau en haut, 390), CH-D8-1/3, CH-MSG-1 ; vérifier que « Nov. · 6 sem. » tient à 390 sans rogner (± et ses voisins) ; clair et cave.
3. Rouge CH-MSG : `--ref 784b5b21b --etape CH-MSG`.
4. Vitest : `calendrierEntete`, `calendrier-onglet`, `calendrierPeriodeFinances`, `calendrierCaisse`, `dashboardNavigation`, `calendrierFrise` — attendre des échecs sur « Nov. » seul (CRITIQUE-6 n° 11, ET-PER : le bouton dit « Nov. · 6 sem. » : mettre à jour ces attentes), sur le texte du Bord (`point-bas`) et sur un test de plein écran qui supposerait le Header caché (`brewFrise`, etc.). Ajouter un test unitaire de `libellePastille` et `causeCaisseInconnue`.
5. Commit par chemins, index temporaire (`GIT_INDEX_FILE`), hunks à moi seuls pour `calendrier.ts` (1 hunk) et `chaines.mjs` (2 lignes) ; fichiers entiers à moi : EnTete.tsx, DetailCreux.tsx, DashboardTab.tsx, Header.tsx, forecast.ts, useDonneesCalendrier.ts, chaines-calendrier-v9.mjs, tests ajoutés. Vérifier `git diff HEAD -- <fichier>` : V12 peut avoir touché EnTete.tsx entre-temps.
6. BUGS.md (Brasserie) : CHV-5, CHN-10, CHD-8 « corrigé », hash dans la colonne commit ; puis `node scripts/agents/controle-bugs.mjs` → OK.

## Doutes et décisions
- DÉCISION À PRENDRE (CHV-5) : « Nov. · 6 sem. » garde le nom de la période de l'app (ET-PER, CRITIQUE-5 n° 18 : « Nov. » comme la barre) ET dit ce que la frise montre. Le contrôle écrit « pas Nov. » ; l'autre lecture serait « 6 sem. » seul, qui casse ET-PER. Recommandation : garder « Nov. · 6 sem. ».
- DÉCISION À PRENDRE (CHN-10) : la période ‹ › et la loupe restent atteignables en plein écran portrait en gardant l'en-tête de l'app, allégé (sans « L'Affinée » ni avatars). Le brasseur avait demandé (19.11) que « L'Affinée » ne reste pas en plein écran : l'identité part, la période reste. Le paysage ne change pas. Recommandation : garder.
- Latent de calcul CHD-8 non corrigé : `creuxDepuis` au pas de la semaine (−3 624 au lieu de −3 729 sur 90 j) ; le contrôle ne couvre que le texte, l'horizon est dit mais les trois chiffres restent différents. Corriger demande une courbe au jour : hors voie.
- CHD-1 / EnTete.tsx:756 : le texte « Des pièces payées n’ont pas de paiement… » mène par le même lien (`onOuvrirFinances`) à Finances, pas directement à « Confirmer les paiements ».

CONNAISSANCE : le message flottant de l'onglet (`frise/Message.tsx`, via `onMessage`) n'est pas placé par l'en-tête : l'invitation « Tourne le téléphone » se posait sur la dernière rangée ; en plein écran le Header de l'app est masqué dans `Header.tsx` (magasin `pleinEcran.ts`).
LEÇON PROPOSÉE : aucune
