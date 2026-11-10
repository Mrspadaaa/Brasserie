# Voie ue — port de c7c (Prix et marges) et de e3a (prix et impôt depuis le brassin)

Agent : auteur (Sonnet), plafond 120. Maquettes choisies, reprises à 99 % (règle n° 1, L03) : `work/missions/2026-11-09-compta-prix/p4/c7c/`
(deux échelles par bouteille et par an côte à côte ; sa base c5b `p3/c5b/`) et `p4/e3a/` (rangement : depuis la fiche du brassin, chaque marche
dessinée), etat.html, NOTE.md, captures, ouvertes avant de coder. e3a dit où vivent le Prix et l'Impôt bière ; c7c dit à quoi ressemble le Prix.
Domaine prêt : `src/domain/finance/chaineLitre.ts` (litre → format, voies/d1/RESULTAT.md) ; impôt bière porté (p2b, `src/ui/production/ImpotBiereSheet.tsx`) ;
coût du litre porté (c3a). Décisions : `voies/COMMUN.md` (« Remplacer, jamais fusionner », « 99 % mini maquettes »). Le tarif porte désormais son
format (volume) : la caisse (voies/uv/RESULTAT.md, D3) et les Prévisions (voies/pv/DECISIONS.md, D2) le liront.

Possède : `src/ui/TarifSheet.tsx`, `src/ui/finance/CreativePricing.tsx`, `src/ui/prix/**` (neuf), `src/ui/prix/prix.css` (neuf),
`src/components/tabs/ClientsTab.tsx` (section Prix et marges, et l'onglet Impôt refait sur p2b : reste « Clients › Impôt bière à moitié porté »),
`src/ui/BatchDetailSheet.tsx` (l'entrée e3a seulement), `src/components/CreativeLabTab.tsx` (« Essais de tarifs » : remplacé ou renvoyé vers c7c),
`src/types/index.ts` (format du tarif, champ optionnel), tests d'intégration `tests/integration/prix*.test.tsx` (neufs) et ceux des fichiers possédés,
`work/missions/2026-11-09-compta-prix/voies/ue/**`.

Fini = c7c remplace Clients › Prix et marges et les essais de tarifs (un seul endroit pour fixer un prix) ; e3a est l'entrée depuis le brassin ;
Clients › Impôt bière refait sur p2b ; branché, atteint depuis le menu, typé, testé, build vert.

Étape 1 : `voies/ue/PLAN.md` seul (gabarit `.claude/skills/voies/references/sans-memoire.md` § 2, inventaire de chaque élément et état de c7c
et e3a, appelants hors Possède par grep sur src/ tests/ scripts/, rejoués sur HEAD), puis arrête-toi et rends une ligne.
Étape 2 (après la revue) : code, tests rouges puis verts, `npx tsc --noEmit` hors firebase-admin, `npx vite build`, captures 390 tactile et 1280,
clair et cave, côte à côte avec les maquettes (`?dev-local&finance-demo`), ouvertes.
RESULTAT.md tenu au fil dans `voies/ue/RESULTAT.md` (une limite de tours ne doit rien perdre).
Tests : `npx vitest run <fichiers> --reporter=dot > voies/ue/tests.txt 2>&1`.
Aucun commit, pas de `git stash`, Gemini jamais appelé. Rends une ligne.
