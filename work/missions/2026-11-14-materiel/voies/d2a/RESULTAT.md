OK — liste za3 portée dans Stocks › Matériel : fil, gestes avec Annuler, ajout, vide, 1280 ; 31 tests, build, 7 captures.

## Fichiers (commits 942198ca puis cb797b6f dans W = `C:/Users/mrspa/AppData/Local/Temp/materiel-port`)
- `src/ui/EquipmentList.tsx`, `src/ui/equipment/{ListFil,ListPictos,NewEquipment}.tsx`, `src/ui/equipment/list.css`, bloc matériel de `src/components/tabs/StocksTab.tsx`, `tests/integration/equipmentTimeline.test.tsx`, `compactEquipment.test.tsx` (anciens tests de liste remplacés par ceux du fil).
- Captures : `voies/d2a/captures/d2a-{repos,traiter,ajout,vide}-390.png`, `d2a-repos-cave-390.png`, `d2a-repos-1280.png`, `d2a-repos-cave-1280.png` (+ `journal-*.json`). Tests : `voies/d2a/tests.txt`.

## Critères
- G1 : `TESTS OK 31` (3 fichiers verts : equipmentTimeline, compactEquipment, defautsStocksEcrans). tsc vert, `npm run build` vert (DRAPEAUX OK).
- G2 : `CAPTURES OK 7`.
- Ouvertes une à une et comparées à `v2/za3/za3-*.png` : repos 390 clair et cave, 1280 clair et cave, ajout, vide, traiter.

## Corrigé au banc (après la première passe de captures)
1. Marges : la coque de l'app ajoute 12 px de chaque côté (la maquette tient à 10 px du bord) : le sous-titre « depuis le 05.11 » était coupé et « Densimètre + éprouvette » passait sur deux lignes. Marge négative sous 1024 px.
2. Feuille « Nouveau matériel » : elle vit dans un portail, hors `.mt` : jetons absents (pastilles, champs, boutons sans bordure). Jetons repris par `.mt-feuille` / `.mt-vars` (pied), et rangée Annuler | Ajouter remise en ligne.
3. Toast : empilé en colonne (la rangée héritait de `.mt`) → une ligne « ✓ Fait … Annuler ».
4. 1280 : colonne liste 545 px, divider à 565 px comme za3, puces à 20 px.

## Banc (fixtures et écarts)
- Serveur 3437 arrêté. `src/data/seedData.ts` (copie jetable, ignorée par Git) : fixtures posées pour les captures, puis remis à l'original. Date du jour du banc figée au 14.11.2026 (shim `Date` dans la page) pour coller aux dates de za3 (prévu 11.11, 01.12, 20.12, 28.12, 02.03). Cinq brassins fictifs après le 01.08 pour « après 5 brassins ».
- Capture « traiter » : le geste joué est **Fait** sur le Refroidisseur (au brassin : repasse en « sans échéance », « encore 5 brassins », note « ✓ Refroidisseur à plaques à jour », toast « Fait » + Annuler). La maquette montre l'étalonnage du pH-mètre (4,02 · 7,01 → 14.12) : cet étalonnage se fait dans la fiche (d2b), pas depuis la ligne.
- 0 texte < 12 px, 0 `type="number"`, 0 débordement horizontal, 0 exception ; seules erreurs console : ressources externes bloquées par le banc.

## Écarts connus avec za3 (à juger)
- « 1'739 CHF » (formateur suisse de l'app) au lieu de « 1 739 CHF » ; pastille « 24 » de la barre du bas : propre à la coque de la maquette.
- À 1280 le panneau s'ouvre sur la Pompe (premier à traiter, contrat de la voie) ; za3 montre le pH-mètre.
- Sous-ligne « encore N brassins » dans « sans échéance » (décision d1 ; absente de la maquette).
- Fait sur appareil au brassin : toast « Fait » seul (pas de date à dire). Réparée : toast seul.
- « Payer un entretien » ouvre la Dépense sans typer la ligne « maintenance » (ExpenseSheet hors voie).
- Annuler réécrit `previous` même si l'appareil a changé entre-temps (un seul toast à la fois).
- Toast de la coque (« Compagnon hors connexion ») recouvre le pied de liste en 390 : propre à l'app.

Essais : 2 passes de captures + 1 correction, 1 relance des tests. Aucun critère à plus de 3 essais.

CONNAISSANCE : aucune
LEÇON PROPOSÉE : une feuille ou un toast en portail est hors du conteneur qui porte les variables CSS du port : définir les jetons sur chaque racine de portail, et ne pas mettre `display:flex; flex-direction:column` sur une classe de jetons partagée par un toast ou un pied de feuille.
