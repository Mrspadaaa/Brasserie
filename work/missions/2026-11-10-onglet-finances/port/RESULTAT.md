ECHEC — preuve 2 (Chrome) et tests d'écran non rejouables : `react-zoom-pan-pinch` (déclaré 4.2.0) absent de `C:/Users/mrspa/Documents/Brasserie/node_modules` ; code port fait, typé, testé en domaine, non vu à l'écran

## Ce qui est fait
- Domaine pur : `src/domain/finance/effetPiece.ts`. « avant » et « après » sont deux appels de `periodeSynthese` ; « après » ajoute la pièce comme transaction
  provisoire (mêmes lignes que `savePurchase`, même catégorie, même paiement). Écart = après − avant au centime. Aucun second calcul.
  Renvoie `null` (onglet neutre, sans écart) pour montant nul/NaN/négatif, date invalide, catégorie absente. Une pièce déjà écrite sous son id final n'est pas comptée deux fois.
- Tests : `tests/unit/effetPiece.test.ts`, 18 verts : payée, à payer, bascule (dépensé identique), règlement inconnu (plein, pas hachuré), encaissement,
  facture QR, autre mois (octobre), matériel à part (avec lignes, et sans), plusieurs lignes, montant vide, catégorie/date absentes, pièce déjà écrite, base vide, entrées non modifiées, paiement daté dans le futur.
- UI `src/ui/finance/ongletMois/` : `OngletMois.tsx` (`BoutonMois`, `CarteMois`, piles avec segment cerné ; colonnes par `colonnesDe` d'Opérations),
  `ongletMois.css` (classes `om-`), `pieceDeDepense.ts` (brouillon → pièce, hook `useEffetPiece`).
- Montage minimal : `Pied.tsx` (2 props optionnelles `mois`, `carte`, footer `relative`), `ExpenseSheet.tsx` (état d'ouverture, effet, deux props au `<Pied>`),
  `Caisse.tsx` (état d'ouverture, effet, la rangée `om-bas` autour de « Encaisser », le × `choisirQr` réutilisé par le vrai bouton « Facture QR »).
- La bascule EST le règlement : Dépense, elle appelle le même geste que « Déjà payé / À payer » (`reviewed('paymentEvidence')` + `patch({paymentStatus})`) ;
  Caisse, elle écrit `setMode('paye')` ou le même `choisirQr` que « Facture QR » (sans client : ouvre le choix du client, le mode ne change pas). Aucun état propre.
- Carte sans titre ; seul le mois (« novembre », sans « exemple ») à droite. Onglet fermé neutre et désactivé (`aria-disabled`) sans montant/date/catégorie.
  Caché quand la pièce est déjà saisie, rattachée ou enregistrée (`done`, `attached`, `dejaTx`) : l'écran ne montre rien qui compterait deux fois.

## Preuves
1. `npx vitest run tests/unit/effetPiece.test.ts tests/unit/periodeSynthese.test.ts` : verts (167 tests avec les suites voisines chargeables).
   `npx tsc --noEmit` : 3 erreurs, toutes déjà là (`firebase-admin/firestore` ×2 dans functions/, `react-zoom-pan-pinch` dans Loupe.tsx) ; 0 dans mes fichiers.
   `npx vite build` : ROUGE, cause unique `Rollup failed to resolve import "react-zoom-pan-pinch" from src/ui/depense/Loupe.tsx` (pas mon code).
   Suites d'écran (ExpenseSheet, Caisse, QuickActionModal…, ~30 fichiers) : FAIL au chargement, même cause (Loupe.tsx importé par ExpenseSheet). Comparaison avec la base
   à faire après l'installation : la liste en échec doit être vide ou identique.
2. Chrome : NON FAIT (le dev server ne charge pas ExpenseSheet pour la même raison). Aucune capture. Validation visuelle : non effectuée.

## DEMANDE EXECUTANT :
Préalable (geste du pilote, hors de mes droits) : installer la dépendance déclarée, par exemple `npm install --no-save react-zoom-pan-pinch@4.2.0` dans le worktree
(ou `npm ci` dans un dossier neuf), puis :
1. `npx tsc --noEmit` (attendu : seules les 2 erreurs `functions/`), `npx vite build` (attendu : vert),
   `npx vitest run src/domain/finance src/ui/finance src/ui/depense src/ui/vente tests/unit/effetPiece.test.ts $(fichiers de tests qui citent ExpenseSheet|Caisse|Pied)` ;
   comparer la liste des fichiers en échec à celle de HEAD (`git show HEAD` dans un dossier temporaire) : aucun nouvel échec.
2. `PORT=3127 npm run dev`, `?dev-local`, pièces « ZZ TEST » en mémoire (`FirestoreRepo.put` ou `src/dev/financeDemo.ts`, voir `cerveau/agents/verification-locale.md`) :
   novembre avec vente 720, nettoyage 42, brassage 186,80, électricité 68 payés, loyer 400 à payer, joints 28,60 matériel (la démo g3a/f2d).
3. Captures dans `work/missions/2026-11-10-onglet-finances/port/captures/`, 390 tactile (redimensionner PUIS recharger) et 1280, clair et sombre :
   `depense-ferme`, `depense-ouvert-paye` (total 58,40, « ZZ Malt Pilsner 25 kg », Brassage), `depense-ouvert-apayer` (après un toucher sur « À payer » : le champ Règlement derrière doit passer à « À payer »),
   `caisse-ouverte` (12 × 33 cl à 4,50 = 54,00, bascule « Facture QR » avec un client). Puis les maquettes `v0/f2d/f2d-haut.png`, `f2d-etat.png`, `f2d-sombre.png`, `f2d-1280.png` à côté.
4. À OUVRIR en image et juger (moi) : pastille « +58,40 » sur le bouton ; tuile payé ou à payer cernée ; segment de Brassage cerné (plein ou hachuré) ; carte sans titre ;
   scrim sur toute la fenêtre (il est `position: fixed` : à vérifier dans la coque ModalShell) ; carte non coupée en haut dans la Caisse (rangée collante en bas) ; ≥ 24 px de haut ;
   avec lecture (`ordre` Catégorie/Papier + Confirmer) à 390 : le bouton ne doit pas écraser le pied.

## Écarts connus avec f2d (à confirmer à la capture)
- Pied : bouton à 36 px (le bouton principal de l'app), pas 44 px de la maquette.
- Fond de la carte et du segment : jetons de l'app (cave-900/850), pas les teintes crème fixes de la maquette ; pastilles ambre et vert, hachure par `attention`, comme Opérations.
- Piles : hauteur 176 px à 390 (236 dans la maquette), 130 px à 1280 ; segment cerné par `outline`.
- Caisse : la maquette montre une barre fixe « Mon mois + Encaisser » ; ici la rangée est collante au bas du défilement (`position: sticky`), « Encaisser » garde son style (hauteur 44).
  C'est le seul changement de mise en page de la Caisse.
- Pas de bascule cochée quand le règlement est inconnu (une pièce lue dont le paiement n'est pas su) : les deux moitiés sont décochées, la pile est pleine.
- Matériel seul : la pastille du bouton dit l'écart du matériel à part (rien d'autre ne bouge) ; la maquette ne montrait pas ce cas.
- Fait en Dépense seulement : la pièce d'un scan (lignes lues) passe par `draftEff` comme à l'enregistrement ; non rejouée.

## DÉCISION À PRENDRE
- Question : le pilote installe-t-il `react-zoom-pan-pinch` pour ce worktree (ou la voie rebase sur un arbre qui l'a) ? Recommandation : oui, `npm install --no-save` dans le worktree.
- Question : la rangée collante de la Caisse (écart de mise en page) est-elle acceptée, ou « Mon mois » seul sans toucher « Encaisser » ? Recommandation : collante (c'est le « Tab en bas » de sa demande), à montrer à la capture.

CONNAISSANCE : `react-zoom-pan-pinch` manque dans le node_modules partagé du dépôt : le build, ExpenseSheet en dev et ~30 suites d'écran échouent sur HEAD aussi (Loupe.tsx).
LEÇON PROPOSÉE : avant de lancer une voie d'interface, lancer `npx vite build` sur la base : un module manquant se voit en une minute et change le plan.
