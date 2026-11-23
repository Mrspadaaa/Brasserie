# REPRISE — voie D417 + CRN-LISTE + V4 fiche (21.11)

Code : worktree `C:/Users/mrspa/.codex/worktrees/openai-clean-start/port-carnet`, branche `claude/port-carnet-1711` (HEAD 6d22c6115).
Attention : l'index de ce worktree est périmé (beaucoup de « MM »/« D  » qui ne sont pas à nous) ; l'arbre = HEAD pour tout le Carnet.
D'autres sessions écrivent stock, frise, chaines.mjs, equipment : ne pas les toucher. Commit par chemins avec un index temporaire
(`GIT_INDEX_FILE=<tmp> git read-tree HEAD; git add <nos chemins>; git commit`). Comparer et l'affichage du prix : NE PAS toucher (attendent son choix).

## Fait
- Lu : D415, D417 (decisions.md l.1932-1934), v2/RESULTAT.md (CRU-3a), VOIES-CORRECTION.md (V4 : CRB-7, CRU-3b, CRU-11, CRU-12),
  DEFAUTS CRN-CREATION-VUE et CRN-LISTE (DEFAUTS-RECURRENTS l.476-477), BUGS.md l.2224-2267 (CRB-7, CRB-11, CRB-12, CRU-3, CRU-7, CRU-9, CRU-10, CRU-11, CRU-12, CRW-7).
- Écrit le banc `scripts/parcours/carnet-etapes/v4-liste-fiche.mjs` (nouveau, à nous). Lancer :
  `node scripts/parcours/carnet.mjs <dossier> --seulement v4 [--ref en-ligne/2026-11-21-tour8]` (~2 min).
- Ligne de base sur l'arbre AVANT correction (= rouge, captures dans le scratchpad `.../scratchpad/base/`) :
  D417 : vues « carnet » directement, pas de « L'IA range… » ; CRN-LISTE : 3 carnets visibles (hauteurs 80/129/138), « Coller un lien » ×17,
  aucun filtre, trou mesuré 12 px au banc (la capture 08 du brasseur montre ~60 px : non reproduit au banc, cause à chercher dans la position
  sticky de `.cn-champ-zone` / padding bas du conteneur / safe-area) ; fiche Chambre 390 : 3 lignes vides, 5 tailles (13 14 15 16 21), Quand 196 px ;
  Ventilation : 1 cible < 24 px (« 1 critère sans valeur à comparer », CarnetOuvert.tsx:317) ; 1280 : 4 tailles (14 15 16 22), Quand 144 px.
  Le + volant s'appelle « Actions rapides » (aucun « idée » dans son nom : ce sous-contrôle passe déjà).

## Décisions prises (à écrire dans decisions.md, réversibles)
- Point d'ajout unique = le champ du bas (photo, micro, lien, rangement IA). Le + volant reste (acquis 15.11 « le bouton doit toujours être
  flottant », SPEC-BRASSEUR l.1712 et l.1937) : il porte les actions communes ; sur Carnets son action première `ACTION_CARNETS`
  (« Nouvelle idée · le champ en bas », src/domain/plusEcran.ts:199, App.tsx:736) n'est qu'une seconde porte vers le champ → la retirer
  (une ligne, réversible). Le champ s'aligne sur la rangée du + (pas de trou).
- « Coller un lien » : plus de bouton par carte ; une seule fois (le champ accepte le lien collé ; toucher une idée vide ouvre sa fiche avec le champ).

## Reste à faire
1. D417 dans `src/ui/carnets/CarnetsVue.tsx` (ecrireLocal l.668-730, ecrireIA l.731-896, surEtat échec l.655-662, annulerRetour l.1176-1187,
   rendu l.1276-1415) :
   - depuis la liste avec IA attendue : écriture locale gardée (P8 veut nb+1 tout de suite et le bandeau « Carnet créé · Annuler » tout de suite),
     mais PAS de `setVue(carnet)` (l.728 : `if (neuf && !iaAttendue)`), et `attente.current.neuf = neuf` pour que l'échec ouvre le carnet.
   - état `rangeEnCours` (carnetId) → prop de ListeCarnets : la ligne du carnet envoyé dit « L'IA range… » au lieu de la citation.
   - fin de l'IA (depuis la liste) : ouvrir UNE fois la destination (final.carnetId si 'cree', sinon le carnet connu où l'IA a rangé), seulement si
     la vue est encore la liste (ref de vue) ; vrac : rester sur la liste.
   - P8 test 1 exige que le bouton Annuler reste LE MÊME nœud après la fin de l'IA : rendre ce bandeau-là dans un emplacement stable de
     CarnetsVue (`<div className="cn-defile">{fixe}{ecran}</div>`, `fixe` null ou le bandeau, toujours à l'index 0) au lieu de le passer à
     ListeCarnets/CarnetOuvert. P8 test 4 (« Rangé dans Ventilation ») : Annuler doit revenir à la liste → dans annulerRetour, retour né de la liste → `setVue liste`.
   - mettre à jour l'étape V2 `scripts/parcours/carnet-etapes/prix-plan-creation.mjs` (V2-CRU-3a attend l'ancienne ouverture aussitôt).
   - garder verts : tests/unit/carnetsEnLigne2.test.tsx n° 3, tests/unit/carnetsCorrection3Fil.test.tsx P8 ; rejouer `tests/unit/carnets*`.
   - risque noté : le compteur « Carnets N » (StocksTab readSegments, lit le stockage) monte puis redescend si l'IA range ailleurs ; non corrigé ici.
2. CRN-LISTE dans `src/ui/carnets/ListeCarnets.tsx` (+ carnets.css) : rangée d'une ligne compacte (≤ 48 px, titre une ligne + état/compte),
   retirer `cn-coller-lien` par carte (l.219-221) ; une rangée unique recherche (`input type=search`) + puces de filtre `data-filtre="research|idea|validated"`
   (bascule) dans `.cn-liste` ; ne pas changer le rendu du prix (`cn-carnet-prix`). Trou : vérifier `.cn-champ-zone` (carnets.css:268, padding 8px 76px 8px 12px).
3. V4 fiche dans `src/ui/carnets/CarnetOuvert.tsx` : retirer les lignes vides l.474-483 (Ce qui compte vide), l.486-490 (Façons vide),
   l.582-583 (Photos aucune), l.587-588 (Notes aucune) ; Articles vide sans « aucun » ; RubriqueQuand (l.629-654) en une rangée
   (puces Horizons défilantes + « Au calendrier » compact) ; tailles : titre 18, corps 14, libellés 12 (carnets.css) ; `.cn-critere-plus` et tout bouton ≥ 24 px.
4. Rejouer le banc sur l'arbre (vert) et sur `--ref en-ligne/2026-11-21-tour8` (rouge), captures 390 et 1280 clair/cave ouvertes ;
   vitest `tests/unit/carnets*` + `npx tsc --noEmit -p .` ; BUGS.md à la main (CRB-7, CRB-11, CRB-12, CRU-3, CRU-7, CRU-9, CRU-10, CRU-11, CRU-12, CRW-7),
   `node scripts/agents/controle-bugs.mjs` OK ; decisions.md (point d'ajout) ; commit par chemins.

## ÉTAT 21.11 (agent Sonnet, arrêté à ~150 k)
- COMMITS (worktree port-carnet, index temporaire, script `$TEMP/commit.sh` = read-tree HEAD, add chemins, commit) :
  621f73727 D417 (CarnetsVue : rangeEnCours, neDeListe, vueRef, `fixe` à l'index 0 de `.cn-defile` ; ListeCarnets `range`) ; banc D417 VERT ;
  49a669214 CRN-LISTE (lignes 48 px, recherche + puces `data-filtre`, plus de « Coller un lien » par carte, tests carnetsEcrans/Tour3F11 mis à jour) ; banc CRN-LISTE-390 et -filtre VERTS, vitest tests/unit/carnets* 811 verts.
- NON COMMITÉ (point 3, fiche) : src/ui/carnets/CarnetOuvert.tsx (rubriques vides retirées : Ce qui compte, Façons, Photos, Notes ; Articles « · collez un lien » ; Quand `.cn-quand` une rangée),
  src/ui/carnets/carnets.css (blocs « V4 fiche » en fin de fichier : Quand + 3 tailles 18/14/12 + `.cn-critere-plus` 24 px), scripts/parcours/carnet-etapes/v4-liste-fiche.mjs (diagnostic parTaille).
  Dernier banc (avant le bloc 3 tailles) : vides 0, Quand 32 px (vert) ; restaient 5 tailles (13/14/15/16/21) et 1 cible 20 px. Le bloc de tailles vient d'être ajouté, NON rejoué.
- À FAIRE : rejouer `node scripts/parcours/carnet.mjs <dir> --seulement v4` ; si encore > 3 tailles, lire `parTaille` dans le log ; `npx tsc --noEmit -p .` ; `npx vitest run tests/unit/carnets`
  (des tests peuvent attendre « rien encore »/« Photos · aucune »/« Façons · aucune » : les mettre à jour) ; ouvrir captures 390/1280 clair+cave de la fiche (FICHE-*, T-*-chambre) ; commit par chemins.
- TROU (12 px vs ~60 px) : l'arbre contient f4ea9449b (VUE-FOND) ; le banc mesure 12 px sur l'arbre. NON vérifié sur le build tour8 : lancer `--ref en-ligne/2026-11-21-tour8` et lire « trou N px » de CRN-LISTE ; si ~60 px là-bas : cause = marge basse/réserve pour le + supprimées par f4ea9449b (« sans réserve pour le + »).
- NON FAIT : BUGS.md (CRB-7, CRB-11, CRB-12, CRU-3, CRU-7, CRU-9, CRU-10, CRU-11, CRU-12, CRW-7) à la main + `node scripts/agents/controle-bugs.mjs` ; decisions.md (point d'ajout unique ; bandeau « Carnet créé » désormais en haut du défilement pour un envoi parti de la liste ; ACTION_CARNETS gardé, le sous-contrôle « + ne double pas le champ » passe) ; passe 1280 de la liste.
