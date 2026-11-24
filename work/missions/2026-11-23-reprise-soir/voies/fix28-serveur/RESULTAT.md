OK — T28-5, 7, 8, 9, 12, 13, 14 corrigés côté serveur et fiche : 21+3 tests neufs verts, banc 63 liens sans recul

## Fichiers écrits
- `functions/src/lienValeurs.ts` (nouveau) : valeurs à la suisse (virgule, milliers sous condition d'unité, « bis » → « à »), table de mots, unité sortie du nom, `montantDit`.
- `functions/src/lienLibelles.ts` : table étendue (anglais fermenteurs, houblons), unité du nom → `unite`, « Poids net » → « Poids » si aucun autre poids, huiles totales en `ml/100 g`.
- `functions/src/lireLien.ts` : 404/410 → `introuvable` + « la page n’existe plus (erreur 404) » ; redirection vers la recherche idem ; DNS inchangé (« le site n’existe plus »).
- `functions/src/lienPlateforme.ts` : `dimensionsDuNom` (rayonnage H × L × P, jamais d'ordre deviné pour un autre produit).
- `functions/src/lienIA.ts` : garde des dimensions (nombre écrit avec une unité de longueur ou dans une suite « a × b × c »).
- `functions/src/lienProduit.ts`, `lienBloquee.ts` : étapes en mots du brasseur (« prix 72,50 CHF », « frais de port 4,90 CHF », « taxe comprise », « fiche produit publiée par le site », « 5 mesures : 2 ailleurs dans la page, 3 du nom »).
- `src/ui/carnets/FicheArticle.tsx` : houblon (alpha présent) : Alpha, Récolte, Huiles totales en tête ; « 0.8ml » dit « 0,8 ml/100 g ».
- Tests : `tests/unit/carnetsFix28Serveur.test.ts` (21, vraies pages du banc), `tests/unit/carnetsFix28Fiche.test.tsx` (3) ; deux assertions de l'ancien comportement mises à jour (`carnetsLecturesLiens`, `carnetsLiensReprise`).
- Preuves : `voies/fix28-serveur/` (banc-avant/apres.txt, mesures/*.json, tests*.log, voir.ts et compact.ts = outils de lecture du banc).

## Constats (une ligne chacun : fait, test, commit)
- T28-5 : fait ; test rouge puis vert « T28-5 » (404, 410, redirection, DNS) ; commit voir ci-dessous.
- T28-7 : fait ; « Poids net en kg 82 » → Poids 82 kg (colonne Poids de la comparaison rattachée par le nom) ; plus de « non publié ».
- T28-8 : fait ; landi : Hauteur 180, Largeur 160, Profondeur 60 cm, Matériau « Acier, MDF » ; la garde de l'IA refuse « Largeur 61 · Longueur 162 · Hauteur 6 ».
- T28-9 : fait ; aucun « schema.org / microdata / JSON-LD / RDFa / Open Graph / embarqu » sur sios, hopfenmarkt, landi, gastro-held (2), galaxus.
- T28-12 / T28-13 : fait ; libellés anglais et allemands par table ; valeurs « Réfrigérateur sans compartiment congélateur », « Compartiment Fresh Zone », « Houblon mixte », « 143,5 cm », « 11,4 % », « +2 à +8 °C ». Aucun appel IA de plus.
- T28-14 : fait côté serveur (libellé « Huiles totales », unité) et fiche (ordre).

## Critères
- `cd functions && npx tsc --noEmit` : exit 0.
- `npx vitest run tests/unit/carnets tests/unit/lien` : 40 fichiers, 577 tests verts.
- Banc sans IA `npx tsx scripts/banc-liens.ts` : avant et après identiques (nom 58/63, prix 52/56, photo 56/59, caractéristiques 35/48, 0 invention), tableau des 63 lignes sans écart (`diff` vide).
- Gemini réel : 0. Aucune capture (preuve en ligne par le pilote).
- `tsc -p .` à la racine : deux erreurs déjà présentes, hors de mes fichiers (`seedData.ts` GanttTask, `virtual:pwa-register`).

## Doutes et limites
- Huiles totales : la page dit « 0.8ml » ; « ml/100 g » est l'unité du métier (huiles par 100 g de cônes), pas écrite par le site. À confirmer par le brasseur si un houblon publie un autre sens.
- Redirection vers la recherche (brewtools) : le détail dit « erreur 404 » comme demandé, alors que le site renvoie une recherche (HTTP 200) ; la forme honnête serait « la page n’existe plus ».
- « 1.500 kg » reste « 1.500 kg » (milliers ou décimal indécidable sans unité qui tranche) ; seuls mm, g, W, kWh/an, Hz, l/h retirent le point de milliers.
- Les articles déjà rangés gardent les noms de leur lecture (« Total oil », « Alpha 11.4% ») : seul l'ordre et l'unité des huiles sont corrigés à l'affichage ; une relecture du lien donne tout en français.
- « Poids net » renommé « Poids » seulement quand la page ne donne aucun autre « Poids » ; un « Poids brut » reste séparé.
- Rayonnage seulement pour l'ordre H × L × P (deux sources : Landi, Hornbach). Un frigo « 740×830×2010 mm » ne reçoit toujours aucune dimension du nom.
- Fichiers hors Possède touchés : aucun (les mesures du banc ont été déplacées dans mon dossier).

CONNAISSANCE : une dimension passait la garde de l'IA parce que ses chiffres (61, 162, 6) existaient ailleurs dans la page ; la garde exige maintenant l'unité de longueur ou la suite « a × b × c » pour toute dimension.
LEÇON PROPOSÉE : aucune
