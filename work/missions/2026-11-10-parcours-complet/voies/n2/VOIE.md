# Voie n2 — la fiche dit ce qui reste « à saisir » (EN-2, EN-3 à l'écran) (mission 2026-11-10-parcours-complet)

- Agent : auteur · Modèle : sonnet · Plafond : 80 tours · Décideur : pilote
- Lis : `CLAUDE.md`, `cerveau/LECONS.md` (L02, L11, L12, L13), `.claude/rules/affinee-frontend.md`, `DESIGN.md` ; `../n1/RESULTAT.md`
  (décisions 1 à 4 ; `champsASaisir(ref)`, `MOT_A_SAISIR`, `travail.manque`, plage `yeastTechnicalFacts`).
- Décisions du pilote sur n1 : (1) α d'une plage = milieu marqué « déduit » : gardé ; (3) atténuation en plage : champ vide, mais la plage
  publiée se montre à côté (« 78–82 % publié ») ; (4) malt générique : rien d'inventé, la fiche le dit.
- Base : branche `n1/enrichissement` (sha ffbcca63), worktree `n1-wt` dans os.tmpdir() (à toi maintenant).

## Objectif
Un test qui échoue avant (L13). Dans `src/ui/StockDetailSheet.tsx` (et seulement là), un champ utile vide listé par `champsASaisir(ref)`
montre le mot « à saisir » (petit, couleur d'attente de DESIGN.md, pas de paragraphe) ; un produit non reconnu le dit en un mot près du
nom (« non reconnu ») ; une atténuation publiée en plage s'affiche en indication à côté du champ vide. Rien d'autre ne change (L02).

## Contrôles
- `npx tsc --noEmit -p .` ; `npx vitest run tests/unit/depense tests/unit/stock tests/integration/stock tests/integration/Stock --reporter=dot > work/missions/2026-11-10-parcours-complet/voies/n2/tests.txt` ; `VITE_HOP_V4=on npx vite build` vert.
- Captures Chrome réel (banc local, fixture : houblon lié avec α déduit, malt non reconnu, levure à atténuation en plage) 390 tactile clair
  et cave, avant / après, toutes ouvertes, dans `voies/n2/captures/`.

## Possède
`src/ui/StockDetailSheet.tsx` et son test sur `n1/enrichissement` ; `work/missions/2026-11-10-parcours-complet/voies/n2/**`. Aucun déploiement,
aucune donnée réelle, aucun appel Gemini. Fichiers de travail : OWNS ou os.tmpdir().

## Rendre
`RESULTAT.md` au fil (tous les 5 éléments). À 150 k : « REPRISE : <fichier> ». Réponse finale : une ligne avec le sha.
