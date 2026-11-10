# Revue A (métier et fidélité) du PLAN de la voie ue

Verdict : **CORRIGER LE PLAN AVANT LE CODE** (4 bloquants B, 7 gênants G, 5 détails D). L'inventaire de c7c et de e3a est complet et honnête sur
les cas neufs. La chaîne litre → format → prix tient pour 2,48 / 2,52 / 50 % / 9 162,72 / +363,60 / 41-40 (recalculés ici à la main, d'accord avec d1).
Elle casse sur trois chiffres de la maquette, sur un point d'entrée (l'emballage) et sur une contradiction interne de l'échelle /an.

Rejeu : lu `VOIE.md`, `PLAN.md`, `DECISIONS.md`, `p4/c7c/{NOTE.md,c7c-page.png}`, `p4/e3a/{NOTE.md,e3a-page.png}` (images ouvertes), `p2/e1b/NOTE.md`, `p3/c5b/NOTE.md`,
`voies/d1/RESULTAT.md`, `chaineLitre.ts`, `escalier.ts` (graduations), `formatsVente.ts`, `ClientsTab.tsx`, `BatchDetailSheet.tsx`, `types/index.ts`.

## Bloquants

**B1 — « brassin 202,23 CHF » (e3a ⑥) : un chiffre affiché sans calcul ni test.** `PLAN.md:65` (§ 2, ligne 9) écrit « 202,23 CHF, 81 cases, 41 paient 202,77 »
sans dire ce que vaut 202,23 ; `PLAN.md:107` (`brassinEnUnites` → `n, paient, pourToi`) et `PLAN.md:128` (test) ne l'ont pas. D'après `p2/e1b/NOTE.md:7`, c'est
« reste 202,23 » = vendu 405,00 − coût 202,77 (81 × 5,00 − 202,77), en CHF, à ne pas confondre avec « 40 pour toi » (bouteilles) de c7c. En planifié, « ≤ 202,23 »
est juste (coût ≥ donc reste ≤). Attendu : ajouter `vendu = n × prix`, `resteBrassinCHF = vendu − coût` (centimes), `≤` si coût incomplet, et un test 405,00 − 202,77 = **202,23**.
Un lecteur du plan lit « 202,23 » comme le coût et le met en contradiction avec 202,77 du ①.

**B2 — Test « fût ≤ 27,54 » faux avec le code de d1.** `PLAN.md:129` ; `PLAN.md:34` (tuiles). `coutLitre.liquide` est exact : (202,77 − 24,00 − 6,84) ÷ 27 = 6,36778 (`chaineLitre.ts:46-48`) ;
fût = 6,36778 × 20 + 5,064 = 132,42 → reste **≤ 27,58**, pas 27,54. La maquette obtient 27,54 en arrondissant le litre à 6,37 avant de multiplier (132,464). Même cas pour
« ≤ 1 652,40 » (60 × 27,54 ; correct : 60 × 27,58 = 1 654,80). Le 75 cl (5,0343 → 5,03 ; 1 600 × 5,03 = 8 048,00) coïncide par hasard. Règle d1 : « l'arrondi s'applique une seule fois, à la fin » (`chaineLitre.ts:42`).
Attendu : le test vaut 27,58 / 1 654,80 ; l'écart à la maquette est listé dans RESULTAT (un chiffre de maquette n'est pas une source, L14) ; ne pas arrondir le litre pour retrouver 27,54.

**B3 — L'échelle /an : la règle écrite contredit la maquette et le test.** `PLAN.md:27` et `PLAN.md:195` : « cran /an = cran /bouteille × unités/an » donnerait 3 636 · 7 272 · 10 908…
Or c7c (image) et `PLAN.md:133` montrent 0 · 5 k · 10 k · 15 k, alignés sur un ratio 3 636 (15 k ↔ 4,13). Attendu : **deux jeux de crans indépendants** (`graduations` de `escalier.ts:100`, centimes, 1-2-5)
sur un **même axe vertical** (zéro commun, ratio unique = unités/an), donc une seule plage de départ : fixer d'abord le maximum en CHF/bouteille, en déduire le maximum /an,
puis graduer chacun dans cette plage (sinon `graduations` arrondit chaque haut à sa façon et les deux sommets ne coïncident plus). Tester : le cran 5 k est à y(5 000 ÷ 3 636).

**B4 — « Annuel et emballage » : le chiffre de tête exact n'est jamais atteignable, et rien ne permet de le saisir.** `PLAN.md:62,119,182` (D4) : `emballageUnite` est un champ du tarif « donné par le brasseur »,
mais la feuille « Changer le prix » (`PLAN.md:88`) n'a aucun champ pour lui. Seul repli : emballage du brassin ÷ unités, « quand le brassin est tout en 33 cl ». Le brassin réel de la démo
(`financeDemo.ts:18`, 96 × 33 cl, 24 × 75 cl, 1 fût) et celui d'e1b ④ (81 × 33 cl, 36 × 75 cl, 1 fût) sont mixtes : la tête de c7c (« 2,52 ») et « coût 2,48 » ne s'affichent jamais, tout est « ≤ ».
La maquette montre l'état exact comme l'état normal. Attendu : dire où naît l'emballage d'une unité (soit une ligne « emballage de l'unité » dans la feuille, optionnelle, vide = « ≤ » ;
soit la répartition du poste `packaging` par unités réellement conditionnées : somme des unités de tous les formats) et tester le brassin mixte, pas seulement le tout-33 cl. Sans cela le port ne ressemble pas à c7c sur les vraies données.

## Gênants

**G1 — Le coût vient du « dernier brassin » de la bière, pas du brassin de l'onglet Argent.** `PLAN.md:108` : `useDonneesPrix(biere, formatId)` ; e3a est la fiche d'*un* brassin (Pale Ale de septembre, puis Pale Ale 20 nov.).
Les marches ④⑤⑥ ouvrent `PrixEcran` : le coût (2,48), « 27 L nets » et « 81 cases » doivent être ceux de ce brassin. Attendu : paramètre `batchId` optionnel, la sélection « dernier » seulement depuis Clients ; test : deux brassins de coûts différents, l'écran suit celui d'où l'on vient.

**G2 — Le rail de Clients n'est pas « comme dessiné » (D1 du pilote).** `PLAN.md:37,172` : « Clients » reste, le « Carnet » est hors périmètre ; or `DECISIONS.md:2` dit « rail Carnet · Prix · Impôt bière, comme dessiné ».
`ClientsTab.tsx:195,200-201` donne l'ordre actuel Clients · Impôt · Prix ; c7c dessine Carnet · Prix · Impôt bière (ordre aussi). Le fichier est possédé. Attendu : libellés **et ordre** de la maquette, tests renommés avec ; sinon réserve écrite pour le pilote.

**G3 — Blocs ajoutés à c7c (« remplacer, jamais fusionner », 99 %, ≤ 60 mots).** `PLAN.md:79,81,47,51` : ligne « N formats sans marge » (renvoyant à une liste qui n'existe plus à l'écran), pli « Comprendre les marges »,
ligne « volume annuel à renseigner », « plusieurs prix pour ce format ». Aucun n'est dans c7c. Attendu : une seule règle pour tout ajout : hors du premier plan de la maquette, replié, ou listé dans RESULTAT pour le pilote ;
la ligne « N formats sans marge » est à supprimer (elle pointe vers une vue disparue : fonction listée, pas portée). Compter les mots du repos, plafond de la maquette.

**G4 — Clients › Impôt bière : deux totaux de l'année sur le même écran.** `PLAN.md:114,180` (D2 : « total exact de l'année + liste », « plis gardés ») ; `ClientsTab.tsx:301-308,134` garde déjà `taxReport` (fourchette ou total, réserve) et la liste « Par brassin » (`:310-314`, déjà branchée sur p2b).
Si on ajoute la somme des feuilles p2b sans retirer `taxReport`, deux chiffres d'impôt concurrents s'affichent (l'un du chemin « litres conditionnés », l'autre de p2b, qui peut être une fourchette ou nulle si °P inconnu). Attendu : une seule source du total (celle de p2b, d1 `beerTaxForVolume`), `taxReport` retiré
ou rendu au même chiffre ; écrire le cas « °P inconnu → fourchette, jamais 0 » (déjà dans `ClientsTab.tsx:322`) et la réduction confirmée de l'année (`baseImpot`, `ImpotBiereSheet.tsx:88-90`).

**G5 — Réserve non traitée : taux plein ou réduction.** `p4/RESULTAT-c7.md:30` laisse « impôt au taux plein 25,32 contre réduction petit brasseur, à trancher au port ». Le plan lit `beerTaxPerFormat` (0,0836) sans dire quel taux ni la source de la réduction. Attendu : le Prix lit le même taux que p2b (réduction **confirmée de l'année**, sinon taux plein) ; une ligne « taux plein, réduction à confirmer » quand elle manque ; un test avec 0 % et avec 20 %.

**G6 — États intermédiaires du brassin non couverts.** `PLAN.md:11,59-66` ne traite que « conditionné » et « planifié ». Brassage, fermentation, garde, conditionnement en cours (litres nets « attendu », `litresNets` source `attendu`) ne sont ni rangés dans S1/S2 ni testés. Attendu : une table statut → (≥/≤, source des litres, encart Prévisions oui/non) et un test par ligne ; jamais un état « conditionné » supposé.

**G7 — Arrondi du reste : deux chemins possibles.** `PLAN.md:126,161`. Reste = prix − coût arrondi (2,48) ou arrondi(prix − coût exact) ? Ils divergent (coût exact 2,4850 : 2,51 contre 2,52) et le brasseur soustrait ce qu'il lit. Attendu : une règle écrite (reste = prix − coût **affiché**, aligné sur D10) et un test aux demi-centimes. Idem pour le « 50 % » (partPrix) : sur le reste affiché.

## Détails

**D1 — Hypothèse annuelle écrite en dur.** `PLAN.md:25` : « si 1 200 L en 33 cl » doit suivre le format choisi (« en 75 cl », « en fûts de 20 L ») et le volume du profil (1 200 vient de `annualProductionL`), jamais le littéral de la maquette.

**D2 — Tuile sans tarif.** `PLAN.md:34` : « prix ? » ; la ligne ≤ n'existe plus (pas de prix). Écrire le rendu (la tuile atténuée dit « prix ? » et rien d'autre), car la maquette met 10,00 / 160,00 « ex. ».

**D3 — D6 : points voisins (2,02 · 3,52) et crans 4,50 / 6,00.** `PLAN.md:29,184`. Choix honnête (prix de vente réels sinon aucun), mais en démo sans vente ils disparaissent : le 99 % est perdu sur l'écran de référence. Attendu : la démo `?dev-local&finance-demo` porte au moins deux ventes de 33 cl à prix distincts, ou le cran est écrit « ex. » comme 5,00 ; à lister pour le pilote.

**D4 — Prévisions e3a.** `PLAN.md:59,181` : lire `estimerBrassinsPlanifies` est juste (57,42 = 33,42 + emballage 24,00 d'après le texte d'e3a) ; ajouter un test dont la valeur est calculée à la main sur la fixture, pas copiée de la maquette.

**D5 — Séparateur du reste négatif et « à perte ».** `PLAN.md:50` : « Il te manque 0,30 » est un mot nouveau du plan, absent des maquettes ; à lister comme écart mineur de texte (B8 « ≤, ex. »).

## Bien vu (vérifié)

- Un seul endroit pour fixer un prix : Essais de tarifs sort du parcours, liste des idées gardée, rien de l'utilisateur ne disparaît (`PLAN.md:90`).
- Ancien tableau, recherche, segments : sort écrit ligne par ligne (`PLAN.md:74-86`) ; trois coûts jamais reliés ramenés à `coutFormat`.
- Inconnu ≠ 0 partout (coût null, annuel null, tarif absent) ; centimes entiers ; impôt de l'unité de d1 (0,0836 / 0,1899 / 5,064) cohérent ; HT pour l'assujetti.
- Calculs retrouvés : 6,3678 × 0,33 + 24 ÷ 81 + 0,0836 = 2,4813 ; ⌈202,77 ÷ 5⌉ = 41 ; ⌊1 200 ÷ 0,33⌋ = 3 636 ; 2,52 × 3 636 = 9 162,72 ; 0,10 × 3 636 = 363,60 ; 75 cl ≤ 5,03.

LEÇON PROPOSÉE : aucune (B2 : un test « calculé à la main » doit se recalculer sur la fixture avant d'être écrit, ce que L14 couvre déjà).
