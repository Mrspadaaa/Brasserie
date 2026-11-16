OK — code des 12 problèmes (A1-4, B1-8) écrit, G1 à G5 verts ; captures finales à rejouer par l'exécutant (DEMANDE EXECUTANT)

## Critères (rejoués depuis la racine)
- G1 tests : `VITEST OK` (24 fichiers touchés ou voisins, `tests.txt`).
- G2 build : `BUILD OK` (`build.txt`).
- G3 typage : `TSC OK`.
- G4 v6a : `V6A OK` (`controle-v6a.mjs 3000`). FRISE non rejoué (s2ap2 non touché : Bande.tsx intact).
- G5 émulateur : `EMULATEUR OK` (`emulateur.txt`).
- Essais : 1 par critère. Test changé : `tests/integration/compagnonContexte.test.tsx` (la phrase « Il lit aussi le registre » n'est plus attendue ; absente de m4ia-c, B8).

## Fichiers écrits (Possède)
- B1 `src/ui/finance/BrewBudgetSheet.tsx` (classe `cbf-act-3`) + `cout-brassin.css` : trois gestes du pied sans icône, gap 6, comme m4bb-a. Mesuré en capture 390 clair : « Prévoir 64,26 » entier.
- B2 `src/ui/finance/previsions.css` : le nom de la tuile passe à la ligne, le montant reste entier. Capture 390 clair : « Sans fermenteur supplémentaire 2 857,34 » entier. Aucun fichier de `previsions/` touché.
- B3 `src/ui/finance/projet/ProjetPiste.tsx` : toucher le titre d'une étape saisie la fait étape en cours (Devis coché, « tu en es là » sur Prêt à acheter) ; Acheté et En service restent déduits. Vu en capture 390 clair.
- B4 `operations/PaireDoublons.tsx`, `TransactionJournal.tsx` : une pièce annulée dans le délai ne compte plus ; un groupe à une pièce n'est plus un doublon ; bandeau (« Plus de doublon ») et puce « Doublons n » se recomptent.
- B5 `TransactionJournal.tsx` : une année d'archive consultée remplit « du 01.01 au 31.12 » ; « toutes les années » laisse vide.
- B6 `profil/profil.css` : `.pfc` pleine largeur à ≥ 640 px (la cause : `margin: auto` dans la grille du formulaire).
- B7 `modeClavier.ts` (neuf), `finance.css`, `FinancesTab.tsx` : la croix × perd son cadre sauf au clavier (`:focus-visible` + `data-clavier`). Voir doute 1.
- B8 `compagnon/CompagnonFeuille.tsx` : phrase retirée, rien à la place (aucun mot court équivalent dans m4ia-c).
- A1 `operations/calculs.ts` (`etatDeLigne`) : la créance se lit « à récupérer 1,00 · sorti aujourd’hui · banque » (ton à payer, hachuré), plus « ✓ payé ». La fiche C reprend le même texte.
- A2 `TransactionDetails.tsx`, `FinancesTab.tsx` : la fiche A montre « 1,00 CHF à récupérer : voir la créance › » et l'ouvre (prop `onOpenTransaction`). Lien trouvé par le motif de la créance (« « <pièce> » »), voir doute 2.
- A3 `operations/assistant.ts`, `TransactionJournal.tsx`, `compagnon/vue.ts` : « autant en novembre 2026 ? » (la consigne au modèle garde « le mois novembre 2026 » : test existant).
- A4 `finance.css`, `BrewerChat.tsx` (prop optionnelle `classeFeuille`), `FinanceAssistant.tsx` : en clair, question envoyée #1F2A1B sur #E6ECDD (≈ 13:1), « Auto » blanc sur #2F5A2B (≈ 8:1) ; cave inchangé. Valeurs choisies, contraste non mesuré en capture.
- Outils de la voie : `capturer.mjs`, `fnx.mjs` (copies de efff31bd, sorties dans ce dossier, `capturer.mjs` envoie un `pointerdown` avant chaque clic comme un vrai toucher).

## DEMANDE EXECUTANT
Banc `http://localhost:3000/?dev-local&finance-demo` déjà lancé (ne pas relancer). Depuis `work/missions/2026-11-14-finances/voies/t3` :
1. `node capturer.mjs 3000 tout dbl,prev,profildemo,budget,ia > capturer.log 2>&1`
2. `node fnx.mjs > fnx.log 2>&1` (pièces ZZ TEST du navigateur de test seulement ; produit `fn10-apres-*`, `fn10-creance-*`, `fn10-ficheA-*`, `fn10-ficheC-*`, `fnx.json`).
3. `mv *.png cap/` ; sorties attendues : `fait 390-clair`, `fait 390-sombre`, `fait 1280-clair`, `fait 1280-sombre`, aucune ligne `ECHEC`, `err` vides.
4. Captures à ouvrir et décrire (une ligne chacune, 390 puis 1280, clair puis sombre) : `bb-repos` / `bb-c3a-bas` (Prévoir 64,26 entier) ; `prev-onglet` (tuile Sans fermenteur + montant) ; `pm-pret` (Prêt à acheter en cours, Devis coché) ; `dbl-annule` (bandeau « Plus de doublon », puce sans chiffre) ; `arc-consulte` 1280 (champs du…au remplis) ; `pfd-ouvert` 1280 (contenu sur toute la feuille) ; `ia-feuille` (pas de phrase) ; `ia-chat` clair (question lisible, « Auto » lisible, « en novembre 2026 ») ; `fn10-apres`/`fn10-creance` (« à récupérer 1,00 ») ; `fn10-ficheA` (lien vers la créance) ; la croix × de chaque feuille sans gros cadre.
5. Rendre à l'auteur la liste des écarts ; il juge.

## Doutes et limites
1. Croix × : la règle `html[data-clavier-suivi]:not([data-clavier]) [role=dialog] header button[aria-label=Fermer]:focus-visible { outline: none }` vaut pour toute feuille une fois l'onglet Finances chargé (Sheet.tsx hors Possède). Dans un banc qui tape au clavier, le cadre revient (un clic réel le retire) : sonde faite, outline `none` après toucher.
2. Le lien fiche A vers la créance se fait par le texte du motif ; une autre pièce du même libellé exact partagerait la créance. Un champ de lien (`refundOfId` existe) demanderait de changer l'écriture de `creanceDeTropPaye` et la règle Firestore : non fait.
3. Pas de `FRISE OK` rejoué ; Bande.tsx non modifié.
4. Les captures de la première passe (390 clair seulement) ont été supprimées au profit de la série complète.

DÉCISION À PRENDRE : aucune
CONNAISSANCE : `margin: 0 auto` sur un enfant d'une grille CSS fait rétrécir l'élément à son contenu : `width: 100%` obligatoire (profil 1280).
LEÇON PROPOSÉE : aucune
