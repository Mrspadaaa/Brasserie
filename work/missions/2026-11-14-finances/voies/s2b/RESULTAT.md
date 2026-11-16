OK — Projet matériel m3pm-d porté (piste Idée à En service), testé (14 verts), tsc, V6A, FRISE verts ; 3 tests non possédés à aligner

## Fichiers écrits
- `src/ui/finance/UpgradeSheet.tsx` : brouillon, enregistrement (`FinanceService.saveUpgrade`, inchangé), pied, saisie d'achat (`ExpenseSheet` chargé à la demande).
- `src/ui/finance/projet/ProjetPiste.tsx` (en-tête, piste, notes), `projet/piste.ts` (règles pures), `projet/projet.css` (classes `pjd-`, clair et cave par les jetons du thème).
- `tests/integration/projetPiste.test.tsx` (14 tests), `voies/s2b/capturer.mjs` (script de capture), `voies/s2b/cap/` (captures), `tests.txt`.
- `UpgradeWorkspace.tsx` et `upgrades.css` : inchangés (la liste garde ses cases et « Noter l'achat »).

## Ce qui est porté (m3pm-d)
- En-tête : titre éditable (même rendu que le h2), budget en mono (« — » si inconnu, jamais 0), croix. L'en-tête générique de `Sheet` est masqué par CSS (son titre reste le nom du dialogue : « Mon projet de matériel » / « Prévoir du matériel »).
- Piste verticale : Idée (Bientôt/Ensuite/Plus tard + but), À étudier (prix, livraison, installation, source du prix, budget total), Devis (« Noter un devis » : fournisseur, référence), Prêt à acheter (« Payé en » mois + interrupteur « Dans mes prévisions »), Acheté (achats liés, « Noter l'achat », « Marquer comme réalisé »), En service (catégorie d'usure, durée, mise en service). Stations passées = une ligne cochée ; la station en cours est ouverte ; toucher une station l'ouvre (une seule à la fois) ; toucher le rond d'une des quatre premières place le projet à cette étape.
- Acheté et En service sont déduits (achats liés ou « réalisé » ; `inServiceMonth` échu), sans nouveau champ. Pied : Archiver (= « cancelled ») + « Enregistrer le projet » ; « Reprendre ce projet » sur un projet archivé ou réalisé ; « Annuler » sur un projet neuf.

## Écarts à la maquette
- Champs à 44 px (exigence transversale) au lieu de 36 ; ronds 28 px, pilules 30 px et segment 30 px gardent leur taille, zone tactile étendue à 44 px par pseudo-élément.
- « Dans mes prévisions » : texte visible de la maquette ; nom accessible « Inclure dans mes prévisions » (tests TE-35/36). Contrôle = `input type=checkbox` habillé en interrupteur (jamais `role=switch`, qui casserait les requêtes « checkbox »).
- « Devis » (maquette) remplace « Devis en cours » du domaine dans la piste et dans la liste « Avancement » ; la liste du domaine (`UPGRADE_STAGES`) est intouchée.
- Rien d'inventé hors maquette sauf ce qui porte une donnée actuelle (voir « … »).
- Station « Prêt à acheter » non en cours : une ligne « Payé en nov. 2026 · dans mes prévisions » (ajout).

## Le « … » : ce qui n'a pas de place dans la maquette
- Rangée repliée « Avancement et notes » sous la piste : liste « Avancement du projet » (autre voie d'accès aux étapes) et « Notes du projet ».
- Textes d'aide de l'ancienne feuille raccourcis et rangés dans leur station (pose et raccordement, usure « jamais 0 », avoirs déduits). Factures liées : lignes avec ouverture de la pièce (`onOpenTransaction`), paiements enregistrés, avertissement « facture mixte ou avoir à répartir » : tout gardé, dans la station Acheté.
- Erreur `role=alert` + `scrollIntoView` (TE-35) gardés ; en plus, un refus d'inclusion ouvre la station concernée (« Prêt à acheter » ou « À étudier » si le budget manque).
- Les champs de la feuille d'avant : tous retrouvés (Matériel ou aménagement, but, horizon, prix, mois, livraison, installation, source, fournisseur, référence, usure, mise en service, avancement, notes, inclusion, achats liés, réalisé, archiver, reprendre).

## Critères
- G1 : `node …/vitest-lu.mjs voies/s2b/tests.txt` → `VITEST OK` (14 tests, 1 fichier).
- G2 : `node …/tsc.mjs` → `TSC OK`.
- G3 : `controle-v6a.mjs 3000` → `V6A OK` ; `controle-frise.mjs 3000` → `FRISE OK`.
- Rejoués non possédés : `upgradeSheetTe35` 5 verts.
- Essais : G2 deux (une erreur de type corrigée) ; G1 un.

## Captures (banc `?dev-local&finance-demo`, jeu fictif ; ouvertes en image : 390 clair côte à côte avec la maquette, 390 cave « après geste », 1280 clair « après geste »)
- Faites : 390 clair, 390 cave, 1280 clair (`cap/p-<largeur>-<thème>-{ouvert,apres,neuf}.png`, `cap/cote-390-clair.png`). Mesures relevées : ronds 28, rangs 20, pilules 30, pied 44, interrupteur 26, pas de débordement.
- Les trois images ouvertes sont conformes à la maquette (piste, coche, tuile bleue, pilules, pied). Le projet du banc est « Fermenteur supplémentaire » (étape À étudier) : le banc n'a pas le frigo de p5b.
- Non regardées par l'auteur : `p-1280-cave-*`, `p-390-*-neuf` et `*-ouvert` en cave, `p-1280-*-neuf`. À confier à Haiku : voir ci-dessous.

DEMANDE EXECUTANT :
1. `node work/missions/2026-11-14-finances/voies/s2b/capturer.mjs 1280 cave` puis `node work/missions/2026-11-14-finances/voies/s2b/capturer.mjs 390 clair` (régénère aussi `cote-390-clair.png`). Sortie attendue : `PAGE OK | bloquées 2` et la ligne `mesures` sans `"debord":true`.
2. Ouvrir en image, au moins : `cap/p-1280-cave-apres.png`, `cap/p-390-clair-neuf.png`, `cap/p-390-cave-neuf.png`, `cap/p-1280-clair-neuf.png`. Dire si le titre vide montre son texte d'exemple, si l'interrupteur et les rondes sont lisibles en cave, si un élément déborde.
3. Rendre à l'auteur les constats numérotés ; ne rien corriger.

## Doutes et limites
- Focus : à l'ouverture d'un projet existant le focus tombe sur la croix (rond de focus visible en capture automatisée, pas au doigt) ; sur un projet neuf, sur le titre.
- Les champs des stations fermées restent dans le DOM (masqués par CSS, `data-ferme`) : nécessaire pour que les tests de TE-35 (libellés de champs d'une feuille neuve) restent verts ; les tests jsdom ne voient pas le masquage, la capture si.
- Pas de station « En service » cochée dans le banc (aucun achat lié au jeu fictif) : testée en jsdom seulement (`etatPiste`).
- « Noter l'achat » de la feuille ouvre `ExpenseSheet` par-dessus (lazy) : non joué en Chrome ici.

DÉCISION À PRENDRE : aucune. À SIGNALER AU PILOTE (tests non possédés, `tests/integration/equipmentProjects.test.tsx`, 3 échecs voulus par le port) :
- ligne 55 : `screen.getByText('Livraison, installation et devis')` : cette rangée n'existe plus (prix, livraison, installation sont dans la station « À étudier », déjà visible quand l'étape est « idée » : en jsdom les champs sont dans le DOM) → supprimer la ligne.
- ligne 127 (2 cas paid/unpaid) : `getByText(/Achats liés ·/)` : l'en-tête est maintenant le bouton « Acheté · N achat lié : montant » → `screen.getByRole('button', { name: /^Acheté/ })`.
CONNAISSANCE : une feuille portée garde les champs des stations fermées dans le DOM (`data-ferme`) ; `getByRole` ne voit alors pas la différence en jsdom, car le CSS n'y est pas chargé.
LEÇON PROPOSÉE : aucune.
