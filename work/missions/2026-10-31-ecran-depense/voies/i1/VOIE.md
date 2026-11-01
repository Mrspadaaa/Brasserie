# Voie i1 — inventaire et captures de l'écran « Nouvelle dépense » et des onglets des finances

- Mission : 2026-10-31-ecran-depense
- Agent : executant
- Modèle : haiku
- Niveau : mécanique
- Plafond : 60 tours ; 3 essais par critère
- Dépend de : —
- Décideur en cas de doute : pilote

## Objectif
L'inventaire de l'écran actuel, élément par élément, et ses captures dans un vrai Chrome, sur les fixtures.

## Entrées
- `cerveau/agents/verification-locale.md` : `?dev-local`, les fixtures, le serveur.
- `.claude/skills/webapp-testing/SKILL.md` : puppeteer-core, serveur, captures.
- `src/ui/finance/ExpenseSheet.tsx`, `src/ui/finance/InvoiceScanReview.tsx` ; le composant des onglets « Entrées », « Prévision », « Tout »
  (dans `src/ui/finance/`).
- Ses captures de l'app en ligne, pour savoir quoi atteindre : `work/missions/2026-10-31-ecran-depense/brasseur/depense-*.jpg`.

## Possède (seuls chemins où écrire, avec RESULTAT.md)
- `work/missions/2026-10-31-ecran-depense/inventaire/`

## Consignes
Serveur dans CE worktree, port 5621 (le 5611 est pris) :
`node scripts/with_server.mjs --server "npm run dev -- --port 5621 --strictPort" --port 5621 -- node <ton script>`.
Aucune donnée réelle, aucun appel Gemini (toute requête hors localhost est coupée), aucun serveur dans `C:/Users/mrspa/Documents/Brasserie`.
Ton script de captures va dans `inventaire/`.

À capturer, à 390 × 844 puis 1280 × 800 : la page des finances sur chacun des onglets Entrées, Prévision et Tout ; « Nouvelle dépense »
vide ; la fiche avec un justificatif lu, si le banc permet une lecture simulée (sinon, dire pourquoi, avec fichier:ligne) ; la section
« Articles, stock et matériel » ouverte, une ligne ouverte. Ouvrir chaque capture en image et la décrire en une phrase.

`inventaire/inventaire-depense.md` : une ligne par élément visible (libellé, composant, fichier:ligne), les états (vide, lu, à confirmer,
erreur, hors ligne), les gestes, et ce qui n'a pas pu être atteint, avec la raison.

## Exigences transversales et acquis (recopiés, leçons L05 et L06)
- Une capture non regardée ne prouve rien (L12).

## Critères
Dans `GATES.md`, même dossier. Ne pas le modifier. Lancer chaque `CHECK:` depuis la racine du dépôt.

## Rendre
`RESULTAT.md` au format de l'agent. Réponse finale au pilote : une ligne.
