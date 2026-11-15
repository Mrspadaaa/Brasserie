# Test d'écran — port za3 (Stocks › Matériel), avant déploiement

Version : worktree `C:/Users/mrspa/AppData/Local/Temp/materiel-port`, branche `claude/materiel-port` (d2a 942198ca + cb797b6f,
d2b 72947bd5). Banc `?dev-local`, fixtures simulées. 16 captures de l'app ouvertes, chacune à côté de sa capture za3.
Question du brasseur : « combien et quels problèmes il y a ? » — **13 problèmes, 5 bloquants.**

| capture | thème | largeur | état | problèmes | bloquants |
|---|---|---|---|---|---|
| d2a-repos-390 | clair | 390 | repos | P6 P10 | 0 |
| d2a-repos-cave-390 | cave | 390 | repos | P6 P10 | 0 |
| d2a-traiter-390 | clair | 390 | Fait (Refroidisseur) | P6 P8 | 0 |
| d2a-ajout-390 | clair | 390 | ajout | P5 P11 | 1 |
| d2a-vide-390 | clair | 390 | vide | — | 0 |
| d2a-repos-1280 / cave-1280 | clair / cave | 1280 | repos, panneau Pompe | P6 P10 | 0 |
| d2b-ph-390 | clair | 390 | fiche, 7,01 / 4,02 saisis | P1 P2 P3 P4 P7 | 4 |
| d2b-ph-hors-390 | clair | 390 | fiche, 7,2 hors tolérance | P1 P4 P7 | 2 |
| d2b-pompe-390 | clair | 390 | fiche pompe | P1 P3 P7 P13 | 2 |
| d2b-frigo-390 | clair | 390 | fiche frigo | P1 P3 P7 P13 | 2 |
| d2b-gestion-390 | clair | 390 | ⋯ ouvert | P1 P4 P7 | 2 |
| d2b-ph-cave-390 | cave | 390 | fiche vide | P1 P4 P7 P13 | 2 |
| d2b-ph-1280 / cave-1280 | clair / cave | 1280 | panneau pH-mètre | P4 P6 P9 P10 P12 | 1 |
| (journal d2b) | — | 390 | geste Étalonné | P2 | 1 |

## Problèmes

**P1 — bloquant (valeur fausse).** d2b-ph-390, ph-hors, pompe, frigo, gestion, ph-cave-390 ; zone « Dépenses reliées ».
On voit « aucun prix connu » alors que le pH-mètre a deux dépenses reliées (24,90 + 12,50 = 37,40 CHF, visibles à 1280).
za3-geste-390 : « 37,40 CHF · 2 prix connus » et les deux lignes. Même cause : « utilisé dans N brassins » manque à 390
(la pompe l'a à 1280, « 5 brassins »). Brasseur : « sur le téléphone il me dit que j'ai rien payé, c'est faux ».
Correction : `src/components/tabs/StocksTab.tsx`, le `<EquipmentSheet …>` (vers l. 690) ne reçoit ni `transactions` ni `batches` :
lui passer `transactions={transactions as unknown as FinanceTransaction[]}` et `batches={batches}`, comme le panneau 1280 (l. 671).

**P2 — bloquant (élément de sa maquette absent, geste non annulable).** Journal d2b, geste « Étalonné » à 390 : le toast dit
« pH-mètre enregistré. », sans « Étalonné · à jour jusqu'au 15.12 » ni « Annuler » (za3-traiter-390). Idem pour « Fait » et
« Réparée » touchés dans la fiche à 390. Brasseur : « j'ai appuyé trop vite, je fais comment pour revenir ? ».
Correction : même `<EquipmentSheet>` : passer `onChange={(m, toast) => ecrireMateriel(m, undefined, toast)}` (sans `onChange`,
la feuille retombe sur `onSave`, qui affiche « <nom> enregistré. »).

**P3 — bloquant (geste sans effet).** Fiches à 390 (ph, pompe, frigo) : « Payer un entretien » ne fait rien. Constat par le code
(`src/ui/EquipmentSheet.tsx` l. 30 : « Absent : le bouton ne fait rien » ; StocksTab ne passe pas `onPayMaintenance`), non joué
au banc. Correction : passer `onPayMaintenance={(i) => setPayingMaintenance(i.ref)}` et `today={aujourdhuiIso()}` au
`<EquipmentSheet>` ; rejouer le geste au banc (la Dépense doit s'ouvrir sur l'appareil).

**P4 — bloquant (valeur fausse).** d2b-ph-390, ph-hors, gestion, ph-cave-390, ph-1280 et cave-1280 ; lectures et écarts.
7,01 et 4,02 lus donnent « +0,0 ✓ » (za3 : « +0,01 ✓ », « +0,02 ✓ ») ; l'historique montre quatre fois « 4,0 · 7,0 »
alors que les données sont 4,03 · 7,02 (11.10) etc. (za3 : « 4,03 · 7,02 », « 4,04 · 7,05 »…) ; fil 1280 « étalonné 4,0 · 7,0 ».
Un pH-mètre se juge au centième : à une décimale, l'historique ne dit plus rien. Brasseur : « il arrondit mes mesures, ça sert à quoi ».
Correction : `src/ui/equipment/DetailModel.ts` `decimalesDe` et `src/ui/equipment/Detail.tsx` l. 70 : les décimales ne viennent
pas de la seule tolérance (0,1 → 1). Prendre le maximum de : décimales de la tolérance, décimales des valeurs lues et saisies, et 2
pour l'unité pH (3 pour la densité). Test : tolérance 0,1, lu 7,01 → « +0,01 » ; historique 4,03 → « 4,03 ».

**P5 — bloquant (élément de sa maquette absent).** d2a-ajout-390, bas de feuille. za3-ajout-390 montre la petite réglette
(point « dernier fait », trait jusqu'au rond « prochain ») devant « prochain le 01.02 » ; l'app n'a que le texte « prochain le 14.02 »
dans un cadre pointillé. Correction : `src/ui/equipment/NewEquipment.tsx`, ajouter la réglette de za3 (`v2/za3/etat.html?etat=ajout`)
à gauche du texte, longueur proportionnelle au rythme choisi.

**P6 — gênant (lignes qui se touchent).** d2a-repos-390, cave-390, traiter-390, 1280 et cave-1280 : « dégivrer » (Frigo, 20.12)
colle à « Réfractomètre » (28.12) ; d2b-ph-1280 et cave-1280 : « nettoyer le filtre » (01.12) colle à « Frigo levures & houblons »
(10.12). za3 garde un blanc entre ces deux lignes. Avec de vraies dates, deux appareils à moins de ~10 j se chevaucheront souvent.
Correction : `src/ui/equipment/ListFil.tsx` / `list.css` : écart minimal entre deux lignes (≥ 34 px de pas), la ligne suivante
descend, son nœud reste à sa date avec un petit trait de rappel.

**P7 — gênant (écart à sa maquette).** Toutes les fiches à 390 : feuille avec poignée, « Stocks · Matériel » sans flèche et un ×,
et le ⋯ descendu à côté du nom (le nom de la pompe et du frigo passe sur deux lignes à cause de lui). za3-geste-390 :
page pleine, « ← Stocks · Matériel » à gauche et ⋯ rond dans la barre, nom sur une ligne. Correction : `src/ui/EquipmentSheet.tsx`
/ `Detail.tsx` (layout feuille) : en-tête de za3 (retour ←, ⋯ dans la barre), nom sur toute la largeur.

**P8 — mineur.** d2a-traiter-390 : après « Fait » sur le Refroidisseur, toast « Fait » seul et note « ✓ Refroidisseur à plaques
à jour » sans échéance. za3 dit toujours le verbe et jusqu'à quand (« Étalonné · à jour jusqu'au 14.12 »). Correction :
`src/ui/EquipmentList.tsx` l. 60 : pour un rythme au brassin, « Fait · à jour pour 5 brassins » (toast et note).

**P9 — gênant (élément absent).** d2b-ph-1280 et cave-1280, « Dépenses reliées » : la ligne « – Achat · date et prix inconnus »
manque (elle est à 390 et dans za3-repos-1280). Correction : `Detail.tsx`, même liste de dépenses en `layout="pane"` qu'en feuille.

**P10 — mineur.** Pied de liste à 390 et 1280 : « 1'739 CHF », « 1'450 CHF » ; za3 : « 1 739 CHF ». Le code remplace `’` mais
le caractère rendu est `'`. Correction : `src/ui/equipment/ListFil.tsx` l. 115, `.replace(/[’']/g, ' ')` (espace fine insécable).

**P11 — mineur.** d2a-ajout-390, en-tête : « Nouveau matériel » en 16 px maigre et × nu, fond de feuille gris ; za3 : titre gras
22 px, × dans un rond, fond blanc. Correction : `NewEquipment.tsx` (titre et × de za3, fond de surface).

**P12 — gênant (illisible).** d2b-ph-1280 et cave-1280, « sans échéance » : « Refroidisseur à / plaques / détartrer · encore 5 /
brassins » sur cinq lignes dans une cellule étroite ; la sous-ligne « encore N brassins » n'est pas dans za3. Correction :
`ListFil.tsx` : la grille sans échéance garde picto + nom (za3) ; le compte de brassins va dans la fiche.

**P13 — mineur.** d2b-pompe-390, frigo-390, ph-cave-390 : le focus initial sur le × de la feuille trace un anneau coupé par le
bord droit de l'écran. Correction : focus initial sur le titre de la fiche, ou anneau en `outline-offset` négatif.

### Doutes (non comptés)
- D1. Tolérance « ±0,1 » et lignes « pH 7 » / « pH 4 » (za3 : « ±0,05 », « pH 7,00 ») : viennent de la calibration posée par la
  fixture d2b ; le préréglage du code (`calibration.ts` l. 5) dit bien ±0,05 et « pH 7,00 ». À recapturer avec le préréglage.
- D2. Hors tolérance (+0,2 ✗), « ✓ Étalonné » reste noir et actif : enregistrer un étalonnage raté comme réussi ? À vérifier
  (un brasseur réétalonne ou change la sonde).
- D3. Fiche du frigo, à jour jusqu'au 10.12 : le nœud « aujourd'hui » dit « 15.11 Dégivrer » en gras, comme si c'était dû.
- D4. Bandeau de la coque « Compagnon hors connexion · mode local » couvre Déjà possédé / Projets à 390 (banc local).
- D5. Pastilles Rythme / État ~30 px de haut à 390 (< 44), mais identiques à za3.
- D6. À 1280 le panneau s'ouvre sur la Pompe, za3 sur le pH-mètre (contrat de voie).
- D7. Captures absentes : filtre « À traiter » après un geste (za3-traiter montre « À traiter 3 » actif et « 9 à jour · Tout › »),
  toast Étalonné et Annuler en image, cave pour ajout / vide / traiter, 1280 après un geste.

## Conforme
- Liste repos 390, clair et cave : barre (Tout 13, À traiter 4 en encre, loupe, Achat), fil, nœuds (rouge pompe, ambre dû,
  pointillé densimètre), « verbe · date » mot pour mot, gestes Réparée / Étalonner / ✓ Fait / Étalonner à 43-44 px, « aujourd'hui
  14.11 », bande 30 j, repères de mois, coupure, dates seules à droite, grille « sans échéance 5 », pied : quasi pixel pour pixel.
- Vide : identique à za3-vide-390 (fil pointillé, Enregistrer un achat, Matériel déjà possédé, Projets d'équipement).
- 1280 : trois colonnes (liste | fil de l'appareil | fiche), « Enregistrer un achat », bande 30 j des deux côtés ; à 1280 les
  dépenses reliées sont justes (37,40 CHF · 2 prix connus, sans « Démo »).
- Fiche : « À étalonner · prévu le 11.11 », « prochain, si étalonné » en pointillé, pastilles rincer / pH 7 / pH 4 / ranger,
  flacons jaune et rouge, champ « lu » au clavier décimal, ✗ rouge hors tolérance, Rythme, État, pied Payer un entretien /
  ✓ Étalonné (Réparée pour la pompe, ✓ Fait pour le frigo, sans étapes) ; ⋯ : Modifier, Vendu, Réformé, Supprimer en rouge avec
  confirmation.
- Ajout : trois tuiles (Déjà possédé choisie), Nom, Catégorie (5), État (4), Entretien (aucun · mois · 3 mois · an), Dernier
  fait en date suisse, « prochain le 14.02 » juste (14.11 + 3 mois), Annuler · ✓ Ajouter.
- Liste après « Fait » : la ligne quitte le haut, note pointillée verte à sa place, Tout 13 · À traiter 3, Annuler présent.
- Cave : jetons de l'app (ambre sur la sélection et l'action principale), lisible partout.
- Sens métier : dates, rythmes, écarts et sommes plausibles ; aucune combinaison absurde.

## Verdict
**A CORRIGER** — 13 problèmes, 5 bloquants : P1 (dépenses vides à 390), P2 (toast sans « à jour jusqu'au » ni Annuler à 390),
P3 (Payer un entretien sans effet à 390), P4 (lectures arrondies : « +0,0 », « 4,0 · 7,0 »), P5 (réglette de l'ajout absente).
P1 à P3 tiennent en un seul correctif : passer à `<EquipmentSheet>` dans StocksTab les mêmes props que le panneau 1280.
Puis rejouer les captures d2b 390 (clair et cave) et celles de D7.
