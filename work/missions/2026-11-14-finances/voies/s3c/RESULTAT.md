OK — Compagnon m4ia-c porté : feuille, pile visée, pastilles du contexte, question préremplie dans le chat ; 6 tests hors voie à adapter.

## Fichiers écrits
- `src/ui/finance/FinanceAssistant.tsx` (la puce ouvre la feuille ; « Envoyer » ouvre `BrewerChat` avec la question préremplie)
- `src/ui/finance/compagnon/CompagnonFeuille.tsx`, `compagnon.css` (classes `cpg-`), `vue.ts` (fonctions pures), `contexte.ts` (de s3, inchangé)
- `tests/integration/compagnonContexte.test.tsx` (6 tests du contexte + 6 de la feuille jouée = 12)
- `voies/s3c/capturer.mjs`, `capturer.txt`, `cap/` (12 captures : feuille, coche, chat × 390/1280 × clair/cave), `tests.txt`

## Critères
- G1 `VITEST OK` (12 passed). Ligne « Tests » : `npx vitest run tests/integration/compagnonContexte.test.tsx --reporter=dot --no-color > work/missions/2026-11-14-finances/voies/s3c/tests.txt`.
- G2 `TSC OK`. G3 `V6A OK`. Aussi `FRISE OK`.
- Essais : 1 par critère (+ 4 passes de capture pour réparer le chargement à froid, la grille 2 colonnes d'`.ops` à 1280, la bande grise en clair, l'alignement d'« Envoyer »).

## Ce que la feuille fait (banc `?dev-local&finance-demo`, captures ouvertes)
- Opérations : puce « Pourquoi les charges fixes pèsent autant ? » → feuille « ✦ Compagnon brasseur » : bande « Ta question vise · novembre » (Ventes +720,00 · Fixes 468,00 entourée, hachurée à payer · Brassage 186,80 · Nettoyage 42,00 · Matériel 28,60 : les chiffres de la maquette), question « … 468,00 sur 696,80 dépensés. » modifiable, pastilles 44 px : novembre, 6 opérations, « Loyer de l’atelier à payer 400,00 » (hachuré), 6 sans pièce, profil : sans TVA (cochées) ; tout l’historique, archives, projets de matériel (grises, +), « Auto ⌄ », « Envoyer » noir 44 px.
- Gestes joués : décocher « à payer » et cocher « tout l’historique » change les comptes (13 opérations, « 2 à payer 460,00 », 15 sans pièce) ; « Envoyer » ferme la feuille, ouvre le chat avec « Contexte choisi par le brasseur : tout l’historique. N’utilise pas : les archives, les projets de matériel, les pièces à payer. » puis la question. Rien n'est envoyé seul, Gemini jamais appelé.
- Les pastilles décochées sortent de `contexteCompagnon` (test) et sont nommées dans la consigne. Une ligne dit : « Il lit aussi le registre : une pastille décochée lui est demandée en consigne, elle n’est pas coupée du registre. »
- Les pastilles viennent des données : « à payer » = une pièce nommée ou « n à payer total », absente s'il n'y a rien ; « sans pièce » absente à 0 ; profil « sans TVA / avec TVA / profil financier » (jamais « sans TVA » par défaut).
- Autres vues : Prévisions / Annuel / Projets : pas de bande, période « tout l’historique » cochée d'office (une consigne « ce mois » dégraderait une question sur 90 jours ou l'année), projets cochés si le scénario les inclut. Synthèse : bande avec toutes les charges allumées, aucune entourée (la question « Comprendre mes dépenses » ne vise pas un poste).
- Clair et cave, 390 tactile et 1280 : captures ouvertes. Cible tactile mesurée : pastilles, Envoyer, mode = 44 px.

## Écarts à la maquette
1. Question : champ texte (textarea) : les nombres ne sont pas en mono gras (impossible dans un champ modifiable).
2. « Auto ⌄ » : un `<select>` natif (Rapide / Auto / Approfondi), écrit `brewer-chat-mode` que `BrewerChat` relit ; le chevron est un « ⌄ » de la police.
3. Une ligne d'explication sous les pastilles (demande du pilote) : absente de la maquette.
4. Pastille « loyer à payer » : le libellé est celui de la pièce (« Loyer de l’atelier »), coupé à 18 caractères.
5. À 1280 la bande s'étire sur toute la largeur de la feuille (720 px) : piles plus larges que la maquette 390.
6. Le gris de fond de la feuille (`bg-cave-900`, composant Sheet) remplace le blanc de la maquette en clair ; la bande est blanche bordée pour rester lisible.
7. « … » : aucune donnée actuelle sans place ; l'ancien accès direct au chat (une étape) devient deux (feuille puis chat).

## Limites et DÉCISIONS
- DÉCISION À PRENDRE : 6 tests hors « Possède » échouent, car la puce ouvre maintenant la feuille avant le chat : `synthese.test.tsx` T18 ; `fx1.test.tsx` (2 : « FinanceAssistant : sans pose… », « Opérations : la puce pose la question… ») ; `brewerChat.test.tsx` (3 : analyse financière datée, exercice annuel, questions financières après échanges). Chacun doit cliquer « Envoyer » dans la feuille avant d'attendre le chat. Je recommande qu'une voie d'adaptation les corrige (changement attendu, pas une régression ; non touchés).
- Le serveur lit tout le registre (`functions/src/brewerFinanceContext.ts`) : la restriction passe par la consigne, pas par le serveur ; la ligne de la feuille le dit. Option (b) de s3 (voie `functions/`) reste ouverte.
- Plage de dates d'Opérations : `FinanceAssistant` ne reçoit pas la plage ; si la question parle d'une « période » (ni `le mois AAAA-MM`, ni tout l'historique), la bande est masquée (jamais une bande qui contredit la question) et seule la pastille du mois reste. Un prop `plage` dans `FinancesTab` (hors voie) permettrait de l'afficher.
- « Envoyer » n'envoie pas la réponse : le chat attend un second toucher (le chat ne démarre jamais seul) ; un `autoSend` dans `BrewerChat` serait hors voie.
- Projets de matériel : seuls les plans `source: equipment` sont comptés ; les `creativeItems` ne sont pas lus par la feuille.
- `sansPiece` est recopié (`!proofUrl && !finance.proofDocumentId`) pour ne pas importer `TransactionJournal`.

CONNAISSANCE : à ≥ 900 px, `.ops` (operations.css) devient une grille 400 px + reste, `align-items:start` compris : tout composant réemployant `.ops` hors de l'écran Opérations doit forcer `display:flex; align-items:stretch`.
LEÇON PROPOSÉE : aucune
