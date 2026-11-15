OK — Impôt bière de l'année porté sur i1a (total par bande, brassins sur leur bande, feuille p2b) ; 28 tests verts, build vert

## Fichiers écrits (Possède)
- `src/ui/production/impotAnnee/calculAnnee.ts` (neuf, pur : `lignesImpot`, `totalAnnee`, `echeances`), `ImpotAnnee.tsx` (l'écran), `impotAnnee.css` (classes `iaa-`).
- `src/components/tabs/ClientsTab.tsx` : la section `ofdf` n'est plus que `<ImpotAnnee batches config />` ; retirés l'ancien bloc, `lireImpot`, `PHRASE_BAREME`, les états `taxYear`/`copiedTax`/`impotBatch`, le total et la copie, et six imports devenus inutiles. Rien d'autre touché.
- Tests : `tests/integration/impotAnneeCalcul.test.tsx` (12) et `impotAnneeEcran.test.tsx` (12) neufs ; `impotBiereClients.test.tsx` (18b suit « Comprendre le barème », 18c neuf : aucun taux littéral dans le dossier) ; `bDiversImpot` inchangé, vert.
- `voies/ui/` : `PLAN.md`, `tests-rouge.txt`, `tests.txt`, `tests-appelants.txt`, `tsc.txt`, `vite.txt`, `capturer.mjs`, `cote-a-cote.mjs`, `captures/`.

## Sorties décisives
- Rouge d'abord (`tests-rouge.txt`) : `Test Files 2 failed (2) · Tests 10 failed | 2 passed (12)` (module introuvable, texte de l'ancien écran).
- Vert (`tests.txt`) : `Test Files 4 passed (4) · Tests 28 passed (28)` (calcul, écran, impotBiereClients, bDiversImpot).
- Appelants (`tests-appelants.txt`, 10 fichiers : Clients, caisse, dashboard, mobile, prix, tarifs, feuille p2b, lien, f3) : `9 passed | 1 failed · Tests 100 passed | 1 failed`. L'échec : `compactClients.test.tsx` (hors Possède, voir ci-dessous).
- `npx tsc --noEmit` : aucune erreur hors `firebase-admin` (les 2 déjà connues) ; `react-zoom-pan-pinch` n'a rien produit ici.
- `npx vite build` (sortie dans le dossier temporaire, `dist` intact) : `✓ built in 14.50s`.
- `controle-virgule.mjs` : plus aucune ligne de mes fichiers (restent 10 lignes d'autres fichiers, par ex. `ExpenseSheet.tsx:1591`, hors voie).

## Captures (ouvertes : riche 390 clair avant/après correctif, 390 cave, 1280 clair, 1280 cave feuille, plein 390 pli, reel 390 cave, côte à côte)
`captures/` : jeux `plein` (`?finance-demo`, 1 brassin sans densité), `reel` (`?finance-demo=reel`, 1 brassin « Ssr » sur sa visée), `riche` (`?finance-demo` + les 6 brassins de i1a injectés en mémoire par `capturer.mjs`, fixture de capture), 390 et 1280, clair et cave, états `liste`, `pli`, `feuille` (36 fichiers) ; `cote-a-cote-390-clair.png` et `cote-a-cote-1280-clair.png` (i1a à gauche, app à droite).
Vu : le total 256,00 – 260,49 de la maquette devient 260,56 – 269,61 en `riche` parce que la démo ajoute sa propre « Pale Ale » 27 L sans densité (4,56 – 9,12) ; les six brassins de la maquette donnent bien 33,76 / 156,98 / 60,77 et 4,49 – 8,98 (tests de calcul). Barre, légende, pastilles, lignes de 44 px, Quand / À qui, pli, pied bleu : même dessin que i1a dans les deux thèmes ; en 1280 la colonne se centre à 640 px. La feuille p2b s'ouvre sur la ligne touchée.
Les captures de la première fournée datent d'avant deux retouches (sous-titre « 11,4 °P · 200 L » en une seule police, « CHF » collé au total) : seuls `riche-390-clair-*` et `riche-390-cave-*` sont à jour. Le reste est dans la demande exécutant.

## Ce qui est repris de i1a / ce qui en diffère (compromis, 99 %)
1. « janv. – août : exemple » non porté : c'est le marquage des données fictives de la maquette.
2. Fil « ‹ Impôt bière 2026 · brassin » et primaire « Noter la densité » de l'annexe : ils sont dans `ImpotBiereSheet.tsx` (hors Possède) ; la feuille s'ouvre telle que portée (titre « Impôt bière », sous-titre = brassin, ×). « Noter la densité » exige un chemin vers la fiche du brassin que Clients n'a pas.
3. Bande « visée » (cas absent de la maquette, rangé dans son état « densité à noter ») : la ligne prend la bande de la visée de la recette, montant en gris avec « ~ », sous-titre « visée 12,4 °P » ; le total passe en « ~ ». Le cas « litres à noter » : montant hachuré vide, total « ≥ ».
4. Couleur de la bande forte : #C8864F de la maquette (la feuille p2b a #E2A874). Pastilles avec un liseré gris fin pour tenir sur blanc.
5. Un brassin annulé n'entre plus dans l'impôt (comme `estimateSwissBeerTax`) ; l'ancien écran le comptait.
6. Ajouts : lien « réduction petit brasseur » souligné (c'est un bouton vers Réglages), texte copié enrichi d'une ligne par brassin, un paragraphe de plus dans « Comprendre le barème » (impôt dû à la sortie de cave ; densité manquante = fourchette).
7. Fonctions de l'ancien écran : réduction confirmée → pastille de la carte et ligne « À qui » ; « Ouvrir Taxas » → lien Taxas (nom accessible gardé) ; copie et son échec → gardés ; titre « Cette année, je dois » devient « En 2025, je devais » pour une autre année ; année vide : « Aucun brassin en 2025 » et total « — » hachuré.
8. CSS `.clients-tax*` de `src/ui/clients.css` et `.clients-tax-brassin*` de `impot-biere.css` : plus utilisées, non supprimées (hors Possède).

## Doutes et limites
- **Test hors Possède à mettre à jour** : `tests/integration/compactClients.test.tsx` lignes 181-197 (« garde la réduction visible… ») lit l'ancien texte. Changements à faire : l.185 `/réduction annuelle à confirmer/` → `/réduction petit brasseur : à confirmer/` ; l.191 `'Comprendre le calcul et les démarches'` → `'Comprendre le barème'` ; l.195 `{ name: 'Copier cette estimation' }` → `{ name: 'Copier pour Taxas' }`. Les autres lignes (« Aucun brassin en », « — », « Année de réserve OFDF », « Ouvrir Taxas ») passent telles quelles.
- Les dates « 20 janv. / 30 janv. » viennent de la règle 20 j / 30 j de la directive OFDF (lue par d1), en régime annuel ; tant que `beerTaxPeriod` n'est pas réglé, « si régime annuel ». Pas de test sur un trimestriel côté écran (calcul testé : `null`, texte « chaque trimestre »).
- L'écran dit « taux plein » tant que la réduction n'est pas confirmée pour l'année : ce n'est pas une promesse de réduction.
- Police mono : le rendu en capture retombe sur la police système (comme la feuille p2b déjà portée) ; non touché.
- Revue séparée non demandée (petit écran, aucune écriture). Aucun commit, pas de `git stash`.
- Serveur `vite --port 3001` lancé par moi, encore actif : à arrêter après les captures.

## DEMANDE EXECUTANT :
Série mécanique : refaire les 36 captures à jour (le serveur http://localhost:3001 tourne ; sinon `npx vite --port 3001 --strictPort` depuis la racine du worktree, en arrière-plan).
1. Depuis `work/missions/2026-11-09-compta-prix/voies/ui/`, pour chaque `j` dans `plein reel riche`, `l` dans `390 1280`, `t` dans `clair cave` : `node capturer.mjs $j $l $t` (une commande à la fois, 2 minutes au plus chacune ; la sortie attendue finit par `[]`, c'est le journal d'erreurs vide).
2. Puis `node cote-a-cote.mjs` (sorties attendues : `COTE 390-clair`, `COTE 1280-clair`).
3. Fichiers produits : `captures/{plein,reel,riche}-{390,1280}-{clair,cave}-{liste,pli,feuille}.png` et `captures/cote-a-cote-{390,1280}-clair.png`.
4. À ouvrir en image et décrire (un défaut par ligne, sans interpréter) : `riche-390-clair-liste`, `riche-390-cave-liste`, `riche-1280-cave-liste`, `plein-390-clair-liste`, `reel-390-clair-liste`, `reel-1280-cave-feuille`, les deux `cote-a-cote`.
Renvoyer la liste numérotée « combien et quels problèmes ? » ; je juge.

CONNAISSANCE : l'écran des états d'Impôt bière de l'année tient en un tableau : note (°P saisi), visée (recette, « ~ »), inconnue (fourchette 16,88-33,76 CHF/hl sur les litres, ou « litres à noter » : total « ≥ »), exonéré (≤ 0,5 % vol., 0 dit). Source unique : `baseImpot` + `beerTaxForVolume`.

LEÇON PROPOSÉE : aucune
