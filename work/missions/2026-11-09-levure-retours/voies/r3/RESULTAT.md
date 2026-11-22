OK — les 8 constats corrigés dans le code, 240 tests verts ; série de captures 1280 et cave à rejouer (DEMANDE EXECUTANT)

Version : arbre de travail sur c1b2b60f (mission 0df6d24a dessous). Ni commit ni stash.

## Les 8 constats

1. **Saisie libre (bloquant).** Cause : le repli s'ouvrait tout en bas, sans défilement ni focus. Correction : « Mon stock ou saisie libre » ouvert par le geste se pose juste sous le champ de recherche (prop `libre` de `MaLevure`), pré-rempli, et un effet attend le champ (chargé à la demande, 8 s au plus) puis `focus` + `scrollIntoView`. « Hors catalogue » (sans texte) ouvre aussi la saisie (contexte `NomLibreInitial` défini, même vide). Fermée, elle retourne dans la liste des replis. Mesuré à 390 clair : `focus = « Nom de la levure personnelle »`, `valeur zzqxjw`, `dansEcran true`, `repliSousChamp true`. Piège trouvé : à 390 tactile `Input` rend un `textarea`, pas un `input` (sélecteur et CSS couvrent les deux).
2. **Poignées sur le pied (bloquant).** `FermentationTemperatureChart.tsx` : la surface du graphe est `isolate` ; les z-index des poignées (z-30) restent dans le graphe, le pied (sticky z-10, hors de ma voie) passe dessus. Mesuré à 390 clair, poignée ↕ puis ↔ amenées par la molette dans la bande du pied (800–844) : `elementFromPoint` rend le pied (`NAV.recipe-step-actions`), capture : pied propre, plus de demi-disque.
3. **Arômes = Tropicaux (bloquant).** `catalogue.tsx` : `familles()` = familles MARQUÉES ; une fiche qui n'en marque aucune garde ses citées (décrite, moins nettement) ; sans rien : non documentée. Hersbrucker (« tropical/fruit » cité par une fiche) sort. La ligne montre toujours la pastille de la famille filtrée (`Pastilles` reçoit `filtres`, `RechercheAvancee` les passe). Mesuré 390 clair, Rôle = aromatique + Tropicaux : 8 lignes montrées (Talus, Elixir, Relax, Strata, Citra, Mandarina Bavaria, Callista, Cashmere), 8 avec « Tropicaux », `sansTropicaux 0`.
4. **« Arômes non documentée 52 ».** Champ `nonDoc` par filtre (`types.ts`, `contrat.ts`) : houblons Arômes « non documentés », Rôle et α « non documenté », Huiles « non documentée » ; levure Style « non documenté », Effets « non documentés ». Mesuré : « Arômes non documentés 52 ». Le gabarit de la maquette c6b (« STA1 non documentée ») reste le défaut.
5. **Carte à 390.** `nomDeCarte` : « LalBrew Verdant IPA » → « Verdant IPA » quand le fabricant est dit dessous et le nom dépasse 18 caractères (« SafAle US-05 » reste entier : son nom d'usage) ; fabricant « Lallemand Brewing » → « Lallemand » ; nom complet en `title`. Mesuré : `lignesNom 1`, `lignesSous 1`, en-tête 66 px (4 lignes avant).
6. **« avancée ».** `Ajouter.tsx` : « Avancée » (majuscule) à 390, « Recherche avancée » dès sm. Capture h1 ouverte.
7. **Unité « j ».** `etapeLevure.css` (sous `.lv-base`, `YeastRecipePlan.tsx` n'est pas dans Possède) : écart de 8 px et unité `flex: 0 0 auto`. Capture 390 clair : « j » à droite de l'anneau de focus, entier.
8. **Repli de saisie libre.** `YeastIngredientPicker.tsx` (étiquette en bloc au-dessus, Entrée valide) et `etapeLevure.css` : champ bordé, bouton « Utiliser cette levure » bordé. Capture 390 clair ouverte.

## Fichiers écrits
`src/ui/etapeLevure/EtapeLevure.tsx`, `MaLevure.tsx`, `etapeLevure.css` ; `src/ui/YeastIngredientPicker.tsx` ; `src/ui/FermentationTemperatureChart.tsx` ; `src/ui/rechercheAvancee/RechercheAvancee.tsx`, `types.ts` ; `src/ui/hopIndex/rechercheAvancee/catalogue.tsx` ; `src/ui/hopIndex/maBiere/Ajouter.tsx` ; `src/domain/levure/axes.ts`, `contrat.ts` ; tests : `tests/integration/etapeLevure/etapeCritique.test.tsx` (nouveau), `etapeRetours.test.tsx` (une attente : « Verdant IPA » + titre), `tests/unit/hopIndexV4/rechercheAvancee-critique.test.tsx` (nouveau) ; voie : `capturer.mjs`, `planches.mjs`, `sonde-poignees.mjs`, `captures/`, `tests.txt`.

## Critères
- `npx tsc --noEmit -p .` : 0 erreur dans mes fichiers. Restent 4 erreurs hors voie, dans `src/ui/finance/ExpenseSheet.tsx` (exports manquants de `controlesCroises`, `InvoiceScanReview`) : un travail concurrent sur la facture (`functions/src/invoice*`, `ExpenseSheet.tsx` modifiés), pas le mien.
- Tests (`tests.txt`) : `Test Files 18 passed (18)` · `Tests  240 passed (240)` (étape levure, domaine levure, recherche houblons, YeastRecipeChoice, YeastIngredientPicker, mes deux fichiers).
- L13 : sur les 8 fichiers source remis à HEAD (copie vérifiée, rétablis ensuite, `cmp` identique), 9 des 10 tests nouveaux échouaient ; le dixième (pastille ajoutée au-delà de 4) sort sans rien vérifier quand aucune fiche du catalogue n'a ce cas : il ne prouve rien tout seul, la pastille est prouvée par le test voisin et par la capture h3.
- Captures : 390 clair faites et ouvertes (s1, s2 ×2, s3, s4, h1, h3f, h3). Reste la série cave et 1280 : voir ci-dessous.

## DEMANDE EXECUTANT
Commandes, depuis la racine du dépôt, dans l'ordre (la première dure plusieurs minutes : la lancer en arrière-plan ; premier chargement de Vite plus de 30 s) :
1. `node scripts/with_server.mjs --server "npm run dev -- --port 5691 --strictPort" --port 5691 --env VITE_HOP_V4=on --env VITE_FIREBASE_API_KEY=fake -- node work/missions/2026-11-09-levure-retours/voies/r3/capturer.mjs > work/missions/2026-11-09-levure-retours/voies/r3/sortie-captures.txt 2>&1`
2. `node work/missions/2026-11-09-levure-retours/voies/r3/planches.mjs`
Fichiers attendus : `voies/r3/captures/` : 32 PNG (8 états × clair/cave × 390/1280 : `s1-saisie-libre`, `s2-poignee-haut-bas`, `s2-poignee-gauche-droite`, `s3-verdant-choisie`, `s4-duree-focus`, `h1-bouton-avancee`, `h3f-feuille`, `h3-lignes`) ; `voies/r3/sortie-captures.txt` ; `voies/r3/planches/c-*.png` (critique à gauche, r3 à droite).
Sorties attendues dans `sortie-captures.txt` : 32 lignes `CAPTURE …`, `ERREURS []`, `BLOQUES []`, puis dans `NOTES` : s1 `focus "Nom de la levure personnelle"`, `dansEcran true`, `repliSousChamp true` ; s2 `recuParLePied true` ; s3 `lignesNom 1`, `lignesSous 1` ; s4 `uniteDansCarte true` ; h3 `sansTropicaux 0`. Un écart : le recopier tel quel, sans corriger.
À ouvrir (Read, en image) et à décrire en deux lignes chacune : toutes les planches `c-*-1280-*` et `c-*-390-cave`. Le jugement (OK ou défaut) reste à r3/pilote.

## Doutes et limites
- Le focus de la saisie libre attend le chunk de `YeastIngredientPicker` (8 s au plus) ; si le chunk est plus lent, le repli est ouvert et visible mais sans focus.
- « Hersbrucker tropical » sort du filtre, et ce par une règle (marqué, sinon cité si rien de marqué) qui change aussi les comptes des autres familles (Citrus, Floral…) : les chiffres de l'index bougent, c'est voulu (D167). Le chiffre « 29 » du critique n'est plus 29 ; non comparé.
- Le critique recommande « ouvrir la saisie à la place des tuiles » : faite sous le champ (les tuiles se vident quand on touche la tuile libre).
- La poignée ↔/↕ est corrigée sans toucher au pied (`PageShell`, hors voie) : si un autre écran superpose la poignée à un élément `z-index` plus haut que le pied, le correctif est le même (`isolate` sur la surface).
- Captures 1280 et cave non encore vues : pas de verdict dessus.

DÉCISION À PRENDRE : aucune
CONNAISSANCE : à 390 tactile `Input` rend un `textarea` (pas un `input`) : tout sélecteur de champ texte doit l'inclure ; une poignée `absolute z-30` dans un parent non isolé passe au-dessus d'un pied sticky z-10.
LEÇON PROPOSÉE : aucune (celle du critique, mesurer « sur le pied » après défilement, vaut ; s'ajoute : une capture puppeteer qui défile un conteneur interne se prouve par la molette, pas par `scrollBy`).
