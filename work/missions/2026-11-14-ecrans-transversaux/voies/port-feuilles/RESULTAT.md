OK — 4 vues d3p2 portées (Journal, Connexions, Saisir au nom de, Conversations) ; la vente n'est pas portée ; commit 7fedee50

Worktree `C:/Users/mrspa/AppData/Local/Temp/transversaux-port`, branche `claude/ecrans-transversaux`, commit `7fedee50`.

## Décision du pilote : la vente de d3p2 n'est PAS portée
La caisse v3a (commit d4bb2126, choix déployé d'une autre mission) reste dans + › Vendre et Clients › Facturer.
- `src/components/QuickActionModal.tsx` : remis comme au tag (`git show HEAD:…`) ; plus aucune trace d'`EncaisserVente` ; non commité (identique à HEAD).
- `src/components/feuilles/EncaisserVente.tsx` : supprimé (plus appelé). `regles.ts` : `blocagesVente`, `aideBoutonVente` et leurs types retirés ; leurs tests retirés de `tests/unit/feuilles.test.ts`. `src/ui/vente/Caisse.tsx` : jamais touché.
- Conséquence : la ligne « Encaisser une vente » et le « manque : » de la vente (Virement, justificatif, quittance) de l'ancien état de reprise tombent.

## Fichiers (commit 7fedee50)
`src/components/AuditLogModal.tsx`, `CloudConfigModal.tsx`, `Header.tsx` (seul le dialogue « Saisir au nom de »), `src/components/feuilles/{Feuille,SaisirAuNom,ConversationsBoite}.tsx`, `feuilles.css`, `regles.ts`, `src/ui/BrewerActivity.tsx` (seule la boîte de conversations), `tests/unit/feuilles.test.ts`, `tests/integration/headerSignataire.test.tsx` (assertions de texte au nouveau titre « Qui signe les écritures ? » / bouton « Saisir au nom d’Aricia » : conséquence du port d3p2, rien masqué).

## Vues portées
1. Journal des modifications : frise 14 jours (touchable : filtre jour), cartes Gaëtan / Aricia (touchables : filtre personne, % jamais 0 sans écriture), recherche, rubriques comptées, groupes par jour, état vide dit juste. Dev-local n'a aucune écriture : rempli vu par le vrai composant monté avec des écritures « SIMULE ».
2. Connexions cloud et IA : voyants IA / Drive, segment Rapide / Max, clé « sur le serveur », « Vérifier que l’IA répond », Drive (`DriveConnection`).
3. Saisir au nom de : bascule G / A, bouton « Saisir au nom d’Aricia » ou « Garder Gaëtan ».
4. Mes conversations : lien coupé et dit hors ligne, lignes avec pictos, « attend le réseau », « Supprimer » au balayage / survol / focus, confirmation dite, « Supprimer les échanges ».

## Défauts trouvés sur les captures et corrigés
- `feuilles.css` : `--hop:rgb(var(--hop))` se référençait lui-même (cyclique, invalide) : bande et vert de Conversations perdus. Renommé `--hopc`.
- `.fe-cv` / `.fe-del` : z-index posés (le bouton « Supprimer » recouvrait toutes les lignes).
- Fil de Conversations : second tronçon pointillé hors ligne (`svg~s`). Bloc Drive de Connexions : aligné à gauche (il était poussé à droite).
- `AuditLogModal` : `{pct} %` flagué par `virgule-transversale` (TE-23) : réécrit sans motif `{nombre} unité`.

## Critères
- G1 `tests.txt` : `tests/unit/feuilles` + `headerSignataire` : 19 verts (15 + 4). CHECK → TESTS OK.
- G2 : `captures/cote-a-cote-{journal-plein,journal,connexions,nom,conversations-hors-ligne}-{390,1280}.png` (d3p2 | port clair | port cave à 390 ; clair | cave à 1280). Planches 390 ouvertes (journal, connexions, nom, conversations).
- tsc : 0 erreur hors `functions/` (2 erreurs `firebase-admin/firestore` d'avant). `tsc.txt`.
- Build : vert (`build.txt`, exit 0, verrou `build.lock` pris puis rendu).
- Suite complète (`tests-tout.txt`, unit + integration) : 16 fichiers rouges sur 1292. Rejoués seuls : brewerNavigation, dashboardNavigation, floatingActionsShellLayout passent (charge de la machine). Restent hors de ma voie : `designTokens` (`text-cave-300` dans `ui/depense`, `ui/finance` : d'avant), `virgule-transversale` (27 lignes d'autres fichiers : d'avant), `brewForecast` (chrono 32 ms > 20 ms sous charge), et les rouges connus de recettes / fuzz / levure / houblon (recipeEditing, recipeAiWorkflow, fuzzSaisie, yeastPitching, hopV55*, expenseSheet). Je n'ai pas rejoué ces derniers seuls ni sur HEAD : l'attribution « d'avant » repose sur les 11 rouges connus et l'absence de leurs fichiers dans mon diff.
- `bDiversEntete` (pastille « hors connexion ») rouge : pas de mon fait. Une autre voie a posé dans la copie de travail (non commité) `return null` à la place de la pastille de `BrewerActivity` (b1r). J'ai commité mon fichier SANS ce `return null` (version préparée hors copie de travail, l'index seulement) ; la copie de travail de l'autre voie est intacte. À elle de mettre à jour ce test.

## Doutes et limites
- Mes conversations en `?dev-local` : le compagnon est « hors connexion » d'office (`localOnly`), la feuille ne s'ouvre pas par le menu. Capture faite avec le vrai `ConversationsBoite` monté dans la page de l'app (lignes « SIMULE », en ligne et hors ligne). Le geste du menu n'est donc pas joué en Chrome : il l'est par `brewerNavigation.test.tsx`.
- Le balayage est tactile ; au pointeur : survol ; au clavier : focus. Plus de glisser-pour-fermer de la feuille (coque `ModalShell` : × et Échap).
- « expire dans 3 j » (Drive) et « il y a 2 min » (IA) : non calculables comme d3p2 (jeton Drive ≈ 1 h renouvelé en silence ; l'IA n'a de « il y a » qu'après un essai) : l'app dit « à renouveler / connecté » et « pas encore ».
- La phrase « Chaque action garde son propre niveau adapté ; celui-ci ne fixe que la valeur de départ » (Connexions) n'est pas dans d3p2 : gardée car elle dit ce que fait le segment ; à retirer si le brasseur la juge en trop.
- Bouton « Connecter Drive » : gris en clair au moment de la capture (état de préparation), jaune en cave : dépend de l'instant, pas de la feuille.
- Journal : la pastille de rubrique compte avec les filtres posés (pas le total) ; en dehors de la fenêtre de 14 jours, la frise ne montre rien mais la liste garde tout.

DÉCISION À PRENDRE : aucune.
CONNAISSANCE : une variable CSS locale ne se nomme pas comme le jeton d'app qu'elle enveloppe (`--hop:rgb(var(--hop))` est cyclique donc invalide, sans erreur) ; `?dev-local` coupe la boîte de conversations (`localOnly`).
LEÇON PROPOSÉE : aucune.
