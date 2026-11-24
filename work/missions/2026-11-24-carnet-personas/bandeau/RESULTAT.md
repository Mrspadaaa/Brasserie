OK — avis d'enregistrement : écriture réelle seule, pastille en bas qui ne couvre rien. PRÊT À METTRE EN LIGNE 9f753a28e

## Cause (BD-1)

Deux causes distinctes.

1. **Pourquoi il reste.** `PersistenceStatus` affichait « Enregistrement sur le serveur… » dès que `syncStatus().pending` était vrai. `pending` mélange :
   - les écritures de cet appareil (file, envoi `commit`, `documentWrites` en `queued`/`pending`) ;
   - **l'écho des instantanés** : `collectionState[...].pending` (= `snap.metadata.hasPendingWrites`) et `pendingDocuments` (= `doc.metadata.hasPendingWrites`).
   Le SDK Firestore garde `hasPendingWrites` vrai après la confirmation du `commit`, jusqu'à ce que le flux d'écoute ait livré la version du serveur. Si ce flux tarde (réseau mobile), l'avis reste des minutes, et le rechargement l'efface (« 07:31 au rechargement », CA13-5). Cause établie au code ; le délai réel du flux n'est pas mesurable hors réseau réel (doute ci-dessous).
2. **Pourquoi sur les onglets.** L'avis était `fixed` en haut, à `top = bas de <header> + 4`, mesuré UNE fois (`useLayoutEffect([visible])`). Sous `<header>` viennent les onglets (Articles, Matériel…) et les sous-onglets (Parc, À venir, Carnets), qu'il ne voit pas : il tombe dessus. Le test rouge le montre : `top: 60px` avec un en-tête de 56 px.

## Correctif

- `src/services/firestoreRepo.ts` : `syncStatus().writing` = file ou envoi en cours ou écriture `queued`/`pending` de cet appareil. `pending` est inchangé (autres lecteurs, hors ligne).
- `src/ui/PersistenceStatus.tsx` :
  - en ligne, l'avis « Enregistrement… » suit `writing` seul ; il part à la confirmation ; un refus s'affiche (« Enregistrement refusé : … ») ;
  - écriture, actualisation, lecture du cache : un délai de 500 ms évite le clignotement ; l'échec et le hors ligne sortent aussitôt ;
  - plus jamais en haut : petite pastille `fixed` en bas à gauche, au-dessus de la barre la plus haute du bas (mesure de `miseAJour.ts`, remesurée toutes les 400 ms), au-dessus de « Nouvelle version » (`--avis-maj`) et du message passager (`[data-toast]`) ; à gauche du rail à 1024 px et plus ; `pointer-events-none`, sauf « Actualiser » ;
  - hors ligne, le signe reste (L-56) et dit « gardé sur l'appareil » pour ce que `pending` retient.

## Preuves

- Rouge avant (`tests-rouge.log`) : 6 échecs sur 9 avant le correctif (`writing` absent ; l'écho affiche l'avis ; pas de délai ; posé à `top: 60px`). Les 3 qui passaient déjà : repos, refus, `writing` après refus.
- Vert : `npx vitest run tests/unit/bandeauEnregistrement.test.tsx tests/integration/liveDataSync.test.ts tests/integration/financialLedgerRepository.test.ts` → 3 fichiers, 24 tests verts (`tests.log`). Le fichier neuf compte 10 tests (7 de l'avis, dont un pour le message passager ajouté après les rouges).
- `npx vitest run tests/unit/proprietes` : 76 verts (`proprietes.log`).
- tsc : 2 erreurs, aucune neuve et aucune dans mes fichiers (`seedData.ts` GanttTask ; `virtual:pwa-register` absent de ce poste ; `tsc.log`).
- `node scripts/agents/controle-bugs.mjs` : « BUGS OK : 2280 bugs, 518 ouverts, 202 sources ».
- Vrai rendu (Chrome, vite dev avec `?dev-local`, config jetable `vite.capture.mjs` car `vite-plugin-pwa` manque ici ; `capturer.mjs`). Captures ouvertes : `cap/390-hors-ligne.png` (pastille « Hors ligne » à gauche, au-dessus du message passager et de la barre ; aucun onglet ni contrôle couvert), `cap/390-ecriture-simulee.png`, `cap/1280-*.png` (pastille à droite du rail, en bas).
  **Limite honnête** : en dev-local une écriture se confirme sur l'instant, donc la pastille « Enregistrement… » de la capture est le balisage du composant posé par le DOM (marqué « simulee ») ; la position vient du vrai code (mesure sur le vrai rendu).

## Fichiers

- Écrits et commités (9f753a28e) : `src/ui/PersistenceStatus.tsx`, `src/services/firestoreRepo.ts` (état seul), `tests/unit/bandeauEnregistrement.test.tsx`.
- Mon dossier : `tests-rouge.log`, `tests.log`, `proprietes.log`, `tsc.log`, `capturer.mjs`, `vite.capture.mjs`, `cap/` (ignorés par Git, sauf le registre).
- Registre : ligne `BD-1` (m) à `work/missions/BUGS.md`, « corrigé en local 9f753a28e ».
- Autres voies : `src/ui/carnets`, `src/domain/carnets`, `functions/`, stock : non touchés.

## Doutes et limites

- À rejouer en ligne sur « ZZ TEST — … » (L11) : une note du Carnet, regarder que la pastille naît puis part en quelques secondes, et le haut de l'écran (onglets) reste libre. Si l'avis reste malgré `writing`, la cause est un `commit` jamais acquitté : `data-attente` (`envoi`) le dira.
- Un `commit` bloqué reste affiché (c'est une écriture réelle non confirmée) : choix honnête, pas de plafond de durée.
- L'e2e `e2e/carnet/lot-8.spec.ts` (L-56) vérifie « sous l'en-tête » : toujours vrai (la pastille est en bas) ; non rejoué (pas de build e2e ici).
- La pastille « Enregistrement… » en 11 px est volontairement petite ; si le brasseur la veut plus visible, c'est un choix de goût.

DÉCISION À PRENDRE : aucune.
CONNAISSANCE : `FirestoreRepo.syncStatus().pending` mêle écritures de l'appareil et écho des instantanés (`hasPendingWrites`, vrai après confirmation tant que le flux d'écoute n'a pas livré) ; pour dire « en train d'écrire », lire `writing`.
LEÇON PROPOSÉE : un état d'attente affiché se lit sur la cause réelle (l'écriture), pas sur un drapeau dérivé d'un flux ; un avis fixe se place par une mesure répétée sur les barres réelles, jamais sur une mesure unique d'un seul élément.
