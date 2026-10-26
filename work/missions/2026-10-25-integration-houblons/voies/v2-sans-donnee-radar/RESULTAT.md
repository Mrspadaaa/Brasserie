OK — Lotus, Caliente, Citra : 0 fiche sur les 5 familles ; « gooseberry » non rattaché.

## Fichiers écrits
- `work/missions/2026-10-25-integration-houblons/voies/v2-sans-donnee-radar/entree.ts` (lecture seule, réemploie `hopDescriptorEvidence` + `EXTRAPOLATION.axes` et `citations()` de `hops.ts`)
- `work/missions/2026-10-25-integration-houblons/voies/v2-sans-donnee-radar/rapport.mjs` (bundle vers `os.tmpdir()`, sortie JSON)
- `work/missions/2026-10-25-integration-houblons/voies/v2-sans-donnee-radar/RESULTAT.md`
- Rien dans `src/`. Sortie brute : `C:\Users\mrspa\AppData\Local\Temp\claude\C--Users-mrspa--codex-worktrees-openai-clean-start-Brasserie\16fc09ec-4e69-48a9-9744-5912b6ef6552\scratchpad\rapport.json`

## Données lues
- Source : les descripteurs de `beermaverick-lotus`, `-caliente`, `-citra`, `-galaxy`, `-nelson-sauvin` tels que `varietyById()` les expose (fiches compactes de `proto-data.json` dépliées par `depliee`). `complements.json` ne porte que les adresses de fiche (LOCATOR), pas de descripteurs : non utilisé. `catalogue-ajouts.json` non lu (les 5 ids sont dans le catalogue par défaut).
- Citra cryo : même id de variété (`beermaverick-citra`) ; seul le stock porte `beermaverick-citra:cryo`. Pas de fiche propre : les chiffres sont ceux de Citra.
- « Fiches lues » = descriptions hors contexte « bière ». Lotus : 4 descriptions, 3 sources distinctes (Hopsteiner en a 2). Nelson Sauvin : 10 descriptions, 9 sources distinctes. L'UI de l'app compte les sources distinctes ; le tableau compte les descriptions.
- Cohérence : pour chaque houblon et chaque famille, « fiches citantes > 0 » égale le statut de `citations()` (contrôle `coherent`, 12/12 × 5 = vrai).

## Tableau : fiches qui citent / fiches lues

Famille (nom de l'app ; lecture du brasseur) | Lotus (4) | Caliente (1) | Citra (7) | Galaxy (5) | Nelson Sauvin (10)
---|---|---|---|---|---
Agrumes (citrus) | 4 | 1 | 7 | 2 | 6
Fruits tropicaux (tropical) | 2 | 0 | 7 | 5 | 5
Fruits à noyau (stoneFruit) | 0 | 1 | 2 | 5 | 1
**Pomme et poire = pépins (pomeFruit)** | **0** | **0** | **0** | **0** | **0**
Petits fruits (berries) | 2 | 0 | 1 | 2 | 0
Melon (melon) | 0 | 0 | 1 | 0 | 2
Floral (floral) | 1 | 0 | 2 | 0 | 0
**Herbacé aromatique = herbacé (herbal)** | **0** | **0** | **0** | **0** | **0**
Boisé et résineux (resin) | 0 | 1 | 1 | 0 | 0
**Épicé (spice)** | **0** | **0** | **0** | **0** | **1**
**Végétal vert = végétal (green)** | **0** | **0** | **0** | **0** | **1**
**Terreux (earthy)** | **0** | **0** | **0** | **0** | **0**

Le radar « sans donnée » regroupe les cinq lignes en gras (pépins, herbacé, épicé, végétal, terreux). Pour Lotus, Caliente, Citra et Galaxy, ces cinq familles sont à zéro. Nelson Sauvin n'a qu'une fiche pour épicé et une pour végétal.

## Question 2 : Lotus, Caliente et Citra n'ont-ils aucune fiche citant pépins, végétal, herbacé, épicé ou terreux ?

**Oui.** Au sens de la règle de rattachement de l'app, aucune de leurs fiches ne cite ces cinq familles. Le scan des mots de contrôle (anglais et français : apple, pear, pomme, poire, pome, green, vert, vegetal, herbal, herbe, grassy, hay, foin, spicy, spice, poivre, clove, earthy, terreux, humus, soil, etc.) ne trouve aucun de ces mots dans leurs fiches. Le seul mot trouvé par le scan qui ressemble à ces familles est « stone » (Caliente, Citra) : c'est un fruit à noyau, rattaché à stoneFruit, pas à pépins. Ce n'est donc pas un rattachement manqué : les fiches ne disent pas ces familles. Le « ? » du radar est exact.

## Mots non rattachés qui auraient dû l'être (jugement, à confirmer par le brasseur)

Clairs :
1. **gooseberry** (groseille à maquereau) : non rattaché, alors que « groseille » l'est dans petits fruits. Citra (BarthHaas, Beer Maverick `#gooseberry`), Galaxy (BarthHaas, Crosby), Nelson Sauvin (huit descriptions sur dix). Conséquence : Nelson Sauvin affiche « petits fruits = 0 » malgré huit descriptions qui disent gooseberry. C'est le même angle mort que L14.
2. **Black Current** (faute de Crosby, Galaxy) : « black currant » est dans petits fruits, la variante avec faute ne l'est pas.
3. **Tomato Leaf** (Crosby, Nelson Sauvin) : feuille de tomate, c'est végétal vert. Ce mot ferait passer Nelson Sauvin de 1 à 2 fiches sur végétal.

Douteux :
4. **zest** (Caliente, Beer Maverick `#zest`, seul) : probablement agrumes, mais « zest » seul ne dit pas lequel.
5. **cannabis, dank** (Galaxy, Nelson Sauvin, Freestyle) : possiblement herbacé aromatique, pas évident.
6. **Pungent** (Nelson Sauvin, Crosby) : pas d'intuition de famille.
7. **vanilla, doux, fruité, cream** (Lotus) : pas de famille des 12 ; à laisser hors familles.
8. **white wine, grape, white grape, wine-y** (Nelson Sauvin, nombreuses fiches) : pas de famille des 12 (le raisin n'est pas pépins). Hors familles, comme le signale L14.

Faux rattachement à vérifier :
9. **« green fruits »** (BSG, Nelson Sauvin) est rattaché à **végétal** par le terme « green ». Le sens est fruits verts (non mûrs), pas végétal vert. C'est la seule fiche qui donne à Nelson Sauvin son « végétal = 1 ». À reconsidérer.

Hors liste mais noté : « Woody » (BSG, Citra) → boisé et résineux : correct. « Pine » (Beer Maverick, Caliente) → résineux : correct.

## Essais
1 (exécution du script, sortie JSON écrite). Aucun échec.

## Ce qui reste douteux
- Lecture de « fiches » : descriptions (Lotus 4) ou sources distinctes (Lotus 3). Le tableau suit la règle de l'app (descriptions) ; la colonne UI serait décalée d'une unité sur Lotus et Nelson Sauvin.
- Citra cryo : pas de fiche distincte dans les données ; le radar et le stock ne séparent pas la fiche.
- Les points 4 à 8 sont des jugements, pas des règles.

CONNAISSANCE : Lotus, Caliente, Citra et Galaxy n'ont aucune fiche citant pépins, herbacé, végétal, épicé ou terreux (26.10) ; le « sans donnée » est exact. Nelson Sauvin : « gooseberry » et « tomato leaf » non rattachés ; « green fruits » rattaché à végétal à tort.

LEÇON PROPOSÉE : aucune
