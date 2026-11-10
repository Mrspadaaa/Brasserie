OK — Opérations v6b : mois changeable partout, lignes à 36 px sur une ligne, annulées en un groupe, puce IA en pointillé

## Fichiers écrits
- `src/ui/finance/TransactionJournal.tsx` : mois en « Tout » (pilote, gardé) ; une facture ouverte reste dans la liste du mois en « Tout » (comme en Courantes : la pastille « en retard » ne promet plus un absent) ; total vide quand rien d'actif (jamais « 0,00 ») ; points ronds de l'icône « Autres frais ».
- `src/ui/finance/operations/groupes.ts` : groupe `annulees` (« Annulées », icône ✕), en dernier ; `groupeDe` y range toute écriture annulée.
- `src/ui/finance/operations.css` : nom sur une ligne (nowrap + …), meta sans retour à la ligne (la pastille d'état se coupe, « sans pièce » jamais), annulée : nom et montant effacés, montant barré ; puce IA en pointillé (✦ + libellé, sans chevron ni « Compagnon brasseur ») ; bande claire = gris le plus pâle du thème, pastille de mois blanche ; total du groupe « En retard » en rouge.
- `src/ui/finance/TransactionRow.tsx` : `title` (nom complet au survol) sur le nom.
- `src/ui/finance/operations/Bande.tsx` : sans `disabled` (pilote, gardé).
- Tests : `tests/integration/operationsV6bMois.test.tsx` (8 neufs) ; `tests/integration/f2ReelOperations.test.tsx` (la règle « titre sur deux lignes » de f2 devient « une ligne, coupé par … », voir décision).
- Outils de voie : `voies/vo/capturer.mjs`, `cote-a-cote.mjs`, `captures/` (app-*, maquette-*, cote-*, mesures-*.json), `tests.txt`, `tests-rouge.txt`, `tsc.txt`, `build.txt`.

## Critères
- Rouge d'abord : les 8 tests neufs échouent sur HEAD (`tests-rouge.txt` : « 8 failed »). Verts après : 8/8.
  (a) « Tout » : ‹ actif, liste → octobre ; (b) « Tout » mois : graphe rendu ; (c) depuis « Par date », depuis un exercice, depuis un suivi : ‹ revient au mois ; annulées : pas de groupe « 0,00 », groupe « Annulées ».
- `npx vitest run` 32 fichiers (grep TransactionJournal, TransactionRow, operations/, ops-, Bande, financeJournal, FinancesTab, groupeDe) : 31 passés, 1 sauté, 397 tests verts (`tests.txt`).
- `npx tsc --noEmit` hors exclusions : 0 ligne (`tsc.txt`). `npx vite build --outDir $TEMP/vo-build` : « built in 14.54s ».
- Captures (ouvertes) : 390 tactile et 1280, clair et cave, `captures/app-*`, planches `cote-390.png`, `cote-390-bas.png`, `cote-1280.png` (v6b à gauche, app à droite). Jeu `?dev-local&finance-demo=reel` + facture 2025 ouverte + deux annulées en Matériel (108,10 et 35,00) + « Tout » (archives comprises) + « Par date » éteint = ‹ novembre › « Archives comprises », comme sa capture. Mesures CSS (`mesures-*.json`) : tailles de police et hauteurs identiques à v6b (nom 14/15, état 12/14, pastille 14 px, en-tête 24 px, ligne 36 px, puces 30 px, ✓ Payé 28 px, mini 24 px).
- Essais : 1 par critère. Serveur 3003 arrêté.

## « Combien et quels problèmes ? » (390 clair, app contre v6b)
Corrigés (6) : 1 graphe absent archives comprises (le mois se change, le graphe revient) ; 2 nom sur deux lignes, ligne à 3 étages ; 3 groupe « Matériel · à part 0,00 » sur des annulées ; 4 carte IA pleine largeur à deux lignes ; 5 bande grise plus foncée et pastille de mois transparente ; 6 liste « Tout » plus pauvre que « Courantes » (facture ouverte absente).
Restent (à juger) :
- A. Palette claire : en-têtes de groupe, liserés et piles prennent les jetons du thème (plus foncés que les pastels de v6b, cercles d'en-tête pâles au lieu de pleins). Choix de la voie de port, gardé : reprendre les hex de la maquette en clair coûterait le contraste du thème.
- B. En-têtes de groupe collants (`position:sticky`) de v6b non repris : la barre de l'app masquerait le haut. À essayer si tu veux.
- C. Montants larges (5 500,00 ; +5 695,00) avec « Annuler » : le nom et la pastille se coupent (« Restaur… », « aujourd'hu… »). Le montant, le geste et « sans pièce » priment ; nom complet dans le `title` et le nom accessible.
- D. Le texte de la puce IA reste « Vérifier mes opérations » : v6b écrit une question (« ✦ Pourquoi les charges fixes pèsent autant ? »).
- E. La ligne « Archives comprises » sous la pastille (absente de v6b) est gardée : sans elle, « Tout » ne se distingue pas de « Courantes ».
- F. Fond crème de la bande (#FAF8F3) : pas un jeton ; on prend le gris le plus pâle du thème.

## Rangement des annulées (mon choix)
v6b n'a pas d'état « annulé ». Le plus proche : un groupe de la maquette (même en-tête `ops-g`, même ligne `ops-row`, même pastille « Annulé » grise `ops-tg-void`), comme « En retard » et « Date à vérifier » : un seul groupe « Annulées » en fin de liste, sans total ; une catégorie n'en porte plus. Les totaux de catégorie ne comptaient déjà que les actives. En « Par date », elles restent dans leur jour ; un jour sans active n'a pas de total.

## Besoins hors Possède
- `src/ui/finance/FinanceAssistant.tsx` : le libellé de la puce (point D) ; pour une vraie question de la maquette il faut une question calculée de la vue Opérations.
- `src/components/tabs/FinancesTab.tsx` : rien.

DÉCISION À PRENDRE : titre de ligne sur une ligne (v6b, toutes les lignes à 36 px) ou sur deux (règle de f2, 10.11, « Restaur… » trouvé trop court) ? J'ai pris v6b, car « nom sur deux lignes » figure dans ses reproches du 10.11 ; l'autre option rend les lignes à 3 étages. Recommandation : une ligne ; s'il tient à voir le client, le mettre dans l'étage d'état plutôt que de rallonger le nom.

CONNAISSANCE : en « Tout » (scope all), le bouton « Tout » met `allDates` à vrai ; seul « Par date » éteint donne « ‹ novembre › + Archives comprises » (c'est l'état de sa capture). Une facture ouverte d'un autre mois ne se montrait qu'en Courantes.
LEÇON PROPOSÉE : aucune
