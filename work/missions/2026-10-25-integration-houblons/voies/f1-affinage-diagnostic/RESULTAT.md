OK — diagnostic en six parties et plan d'affinage A à F ; cause de Citra cryo 1er à 60′ et de Citra simple absent localisée

Rapport : `rapport.md` (six parties, DÉCISION À PRENDRE avec coûts). Aucun critère de GATES.md (il n'y en a pas) ; critères pris dans VOIE.md.

## Fichiers écrits
- `scripts/eval-hop/` (nouveaux) : `f1-diagnostic.ts` (parties 1, 2), `f1-poids.ts` (3, 4), `f1-ia.ts` (5), `f1-formes.ts` (6), `f1-sonde.ts` (stock des fixtures).
- Voie : `rapport.md`, `diagnostic.json`, `poids.json`, `ia.json`, `formes.json`, `durees.json` (ms, non déterministe, hors empreinte).
- Rien dans `src/` ni `tests/`.

## Chiffres décisifs
- **D174** : score identique pour Citra et Citra cryo (95 à 60′, rang 214 ; 58 au dry hop, rang 10). Le « boost » vient de trois endroits : Suggérer 60′ (g2b) classe Citra cryo **1er sur 204** (α du lot 24,8 contre 12,5 : 3,8 g contre 7,5 g ; aucune démotion de produit, `voies.ts:495`, `palier.ts:26`) ; la fiche « en stock d'abord » (`stockFirst`, `substitution.ts:418`) le met 1er ou 2e ; Substituer le montre parce qu'il est 2e de 8 du stock quand Citra simple est 10e de 309 « à acheter » (coupe 5 + 3, `donnees.ts:103-105`). **`stockFirst` explique le boost de la fiche, pas celui de Suggérer.** Citra simple est absent de toute liste de Suggérer parce que `available` retire la **variété** (`voies.ts:238,244,487,536`) ; sans le stock : 46e à 60′, 53e au dry hop. Au dry hop, aucun boost (même effet, rang 53 avant D99, 29 sous l'option `c`).
- **D175** : l'écran de Substituer retire 309 de 317, la fenêtre IA 297 ; 94 passent derrière à 60′ (« chers pour amériser »). Suggérer : `maxBuy 6` coupe 140 à 212 candidats, mais **`buyLimit 4` coupe le plus** (10 → 154 houblons quand on le lève) ; Strata (21C, `herbal`) et Simcoe (16D, `resin`) sont exclus avant tout classement (D90). Coût de couper plus tard : Substituer nul (3,5 ms pour 317) ; Suggérer +65 ms chaud pour `maxBuy 400`, 1 450 ms si les 300 voies calculent leur profil « après », 6 s en g2b tout ouvert.
- **α** : 43 % de la dispersion des scores de Substituer à 60′ (50 % des amérisants) ; le premier change dans 47 % des cas sans l'α. Suggérer 60′ : α = 100 % (Spearman −1). J1 (α 0,15) : 14 %, 2 des 10 premiers changent ; jugé sur l'autre moitié, écart au jeu actuel |ΔMRR| ≤ 0,01, intervalles autour de zéro (ni gain ni perte). J2 : moins bon.
- **Banc** : P1 Hopsteiner / Hopslist / Hops Direct (33 et 74 originaux), P2 jugements du brasseur (v2 : MRR 0,63 ; K4 rang 1 ; K5 rang 265), P3 Beer Maverick à α constant (131), P4 style (inutilisable : 20 % de couverture).
- **IA** : 4,0 des 10 premiers communs ; ses choix au rang médian 19,5 du moteur, score moyen 56,3 contre 60,7 ; α : écart plus grand (0,25 contre 0,20) ; 66 phrases sur 80 citent un descripteur, 5 l'α.
- **Formes** : 84 fiches de forme (Cryo 28, Lupomax 20, Incognito 16, lupuline 12, Spectrum 7, HyperBoost 1) ; α publié pour 61, huile pour 9, **dose conseillée pour aucune**. Seuls BSG, Hopdatabase et Indie Hops publient une analyse de produit. Recommandation : modèle (b) « variété + forme ». Yakima Chief bloqué (#186).

## Critères de VOIE.md
- Scripts déterministes : deux passes à entrées figées, même sha256 pour les quatre scripts (diagnostic `4a341700…`, poids `bfbf5b39…`, ia `f9f06db4…`, formes `bb90ab7e…`). Les entrées (`proto-data.json`, `complements*.json`) ont bougé pendant la voie : les passes d'avant ont d'autres empreintes. La réplique de la formule redonne les 317 × 316 scores de `substitutes()` : 0 écart.
- `npx vitest run tests/unit/hopIndexV4` : **non tenu proprement**, par fichiers d'autres voies en cours. Première passe 679/680 verts ; deuxième 3 échecs différents (`complements.test.ts` déterminisme de fusion, `substituerIA.test.tsx`, `useHopData`). Je n'ai rien écrit dans `src/` ni `tests/`. À rejouer quand g2d, d99 et c3h ont fini.
- État mesuré au dry hop : sans l'option g2d (`apportMinoritaire` absent) et sous `c`, les deux dans `diagnostic.json` (`partie1c`).

## Essais utilisés
Un par script, plus : `f1-formes` deux corrections (regex DOSE qui attrapait « ISOBUTYRATE… % OF TOTAL OIL » ; ordre HyperBoost avant Cryo) ; `f1-diagnostic` une relance (une passe en arrière-plan n'avait pas écrit `partie1c`) ; `f1-poids` une ligne ajoutée (changement à l'écran du jeu, relancé deux fois, même sha).

## Doutes et limites
- Références indépendantes petites ; P2 (D) vient d'une formule proche de v2 ; P4 vide faute de données de style.
- Mon « froid » partage le contexte des fixtures : pas un premier passage absolu ; temps sous charge.
- Le poids d'amertume de Substituer à 60′ est 0,7 dans le code (`substitution.ts:30`), pas 0,8.
- Aucun facteur de dose cryo contre pellet n'est dans le dépôt : à sourcer, jamais inventé.

## DÉCISION À PRENDRE : plan d'affinage A à F
Voir `rapport.md` (fin). Recommandation : A (Suggérer par clé, démotion de produit, rang sur l'α de la variété) sans lui ; B1 et B2 (coupes à l'affichage) ; C avec J1 maintenant et S (Suggérer 60′ par ressemblance) après le test à l'aveugle E ; D (banc) ; F (formes, modèle b) après A. B3 (D90 en drapeau) : pilote ou conseil. Les choix de goût (J1, S, forme) : à lui, en mini maquettes.

CONNAISSANCE : Hopsteiner publie ses substituts **par moment** (« Brewhouse » 42 houblons, « Dry Hopping » 29) dans `src/data/hopSources/hopsteiner.json`, Hopslist (173) et Hops Direct (26) sans moment : référence indépendante de Beer Maverick pour un banc. Citra cryo : le « boost » à 60′ de Suggérer est l'α du lot sans démotion de produit ; l'α décide 100 % du rang de Suggérer 60′ (Spearman −1 par classe d'usage). Le stock fixe l'existence d'une forme (`build-data.mjs`) : sans stock, aucun cryo.
LEÇON PROPOSÉE : un banc de justesse ne doit pas se juger sur une référence dont la formule contient la variable qu'on veut alléger (Beer Maverick et l'α) ni sur une liste que le brasseur a choisie parmi des formules cousines (D) : croiser des références indépendantes et dire leur taille. Deuxième : un script de mesure qui lit des données modifiées par d'autres voies change d'empreinte entre deux passes sans être non déterministe : comparer deux passes dos à dos, après avoir figé les entrées.
