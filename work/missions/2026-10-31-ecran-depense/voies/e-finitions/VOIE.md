# Voie e-finitions — les retours du critique sur la lecture lente (VERDICT-e-ecran, D308, D312)

Agent : `auteur` (Sonnet). Plafond : 60 tours. Ligne `e-finitions` de MISSION.md. Part **après** la voie b-lenteur (son banc Chrome joue
l'arbre : rien n'est écrit dans `src/` pendant qu'il tourne, L17). Aucun déploiement, aucun commit, **aucun appel réel à Gemini**.

## Ses mots (SPEC, mot pour mot)
D277 : « Ne sait pas, aucune idée, flag rouge, je dois remplir ou corrigé » ; « On peut pas passer directement à l'intégration dans l'app »
(D317 : pas de page de choix ; défauts du pilote ci-dessous, réversibles). Sa maquette reste reprise telle quelle (règle n° 1).

## À lire
`work/missions/2026-10-31-ecran-depense/critique/VERDICT-e-ecran.md` (majeurs 1 et 2, mineurs 1 à 3), `voies/e-ecran/RESULTAT.md`
(écarts, reprise 1), `voies/b-lenteur/RESULTAT.md` (ce que le banc a vu, s'il dit quelque chose de ces points).

## Ce qu'il faut faire (défauts du pilote)
1. **Majeur 1, « Qté × prix n/n » ment après sa frappe.** La récap lit `result.controls.lines` du serveur ; dès qu'un recalcul sur le brouillon
   existe, elle prend ce recalcul (même règle que le serveur, `src/domain/finance/invoicePoints.ts`). `sum` reste celui du résultat tant
   qu'aucune ligne n'est gardée ni ajoutée (comme aujourd'hui). Cas aussi hors lenteur : il change une quantité sur une lecture ordinaire.
2. **Majeur 2, une cellule d'en-tête corrigée comptée sans marque.** Forme A de D312 : les cases visibles TVA et Règlement corrigées par la
   3.8 prennent le fond bleu et l'ancienne valeur barrée, comme le total, la date et le fournisseur. Une correction d'un champ qui n'a pas
   de case à l'écran (n° de facture, HT…) n'entre pas dans le compte de la puce. État d'aperçu `lenteur-entete` (une 3.8 qui corrige la TVA seule).
3. **Mineur 1, bandeau à 1280.** Le bandeau des lignes pas retrouvées est borné à la colonne de la liste (droite), mêmes rangées qu'à 390.
   La logique de `BandeauPerdues` ne bouge pas.
4. **Mineur 2, libellé barré.** Quand la quantité est la sienne et que seul le prix est corrigé, le barré ne montre que ce qui a changé
   (« × 1,45 »), jamais un produit qui n'a pas existé (« 12 Kg × 1,45 »).
5. **Mineur 3, dernière rangée sous le bandeau à 390.** Au bout du défilement, la dernière rangée est entière au-dessus du bandeau (retrait
   bas égal à sa hauteur, s'il manque).

## Possède
`src/ui/finance/ExpenseSheet.tsx`, `src/ui/depense/Recap.tsx`, `Ligne.tsx`, `Liste.tsx`, `Pied.tsx`, `finale.ts`, `apercuDev.ts`,
`p3c.css`, `tests/unit/depense/lecture-d/**`, `work/missions/2026-10-31-ecran-depense/voies/e-finitions/**`, et
`work/missions/2026-10-31-ecran-depense/voies/e-ecran/capturer-lenteur.mjs` (ajout d'états et de mesures). Interdits : `functions/**`,
`src/services/**`, tout autre fichier.

## Critères (le pilote les rejoue)
1. Témoins écrits d'abord dans `tests/unit/depense/lecture-d/finitions.test.tsx`, rouges sur HEAD (sortie gardée dans
   `voies/e-finitions/rouge.txt`), verts après : (a) taper 12 dans la quantité de Pilsner → « Qté × prix 6/7 » sans coche ; (a') même geste
   sur une lecture ordinaire, sans lenteur ; (b) une 3.8 qui corrige la TVA seule → case TVA en bleu avec l'ancienne valeur barrée, puce
   « 1 corrigée » ; (c) un champ sans case corrigé → pas compté ; (d) barré « × 1,45 » seul quand la quantité est la sienne.
2. Dans la copie isolée : `node work/missions/2026-10-31-ecran-depense/voies/p3c-port/copie.mjs "npx vitest run tests/unit/depense tests/unit/designTokens.test.ts --maxWorkers=2"`,
   puis `… copie.mjs "npx tsc --noEmit -p tsconfig.json"`, puis `… copie.mjs "npm run build"` : verts, aucune attente existante changée.
3. Captures (`capturer-lenteur.mjs`) : `ECRAN-D OK` avec, en plus, `lenteur-entete` et des mesures qui échouent sur HEAD : récap « 6/7 » dans
   `touchee` ; bandeau dans la colonne droite à 1280 ; au bout du défilement à 390, la dernière rangée entière au-dessus du bandeau. Captures
   ouvertes en image (L12) : `touchee`, `perdues-2` (390 et 1280), `lenteur-entete`.
4. `git status --short` : rien hors de « Possède ».

## Rendre
`voies/e-finitions/RESULTAT.md` (fichiers, témoins avant / après, sorties, captures ouvertes, doutes ; `LEÇON PROPOSÉE : …`), puis une ligne
`E-FINITIONS OK — …` ou `E-FINITIONS ECHEC — …`.
