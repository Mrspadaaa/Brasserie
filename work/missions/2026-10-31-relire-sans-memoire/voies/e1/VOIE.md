# Voie e1 — rapport d'écart entre les docs des finances et le code

- Mission : 2026-10-31-relire-sans-memoire
- Agent : relecteur
- Modèle : sonnet
- Niveau : jugement
- Plafond : 40 tours ; 3 essais par critère
- Dépend de : —
- Décideur en cas de doute : pilote

## Objectif
Le premier rapport d'écart « sens » de la marche à suivre `.claude/skills/voies/references/sans-memoire.md` § 3 : ce que les docs des
finances affirment et que le code ne fait pas (ou fait autrement), et ce qui compte dans le code sans être écrit dans ces docs. Il
servira à la mission `2026-10-31-ecran-depense` (l'écran « Nouvelle dépense » : lecture d'une facture par Gemini, champs, lignes,
liens au stock, justificatif rangé dans le Drive, onglets des finances).

## Entrées
- La règle : `.claude/skills/voies/references/sans-memoire.md` § 3, à lire en entier (classes, format, « que les écarts »).
- Les documents, l'un après l'autre : `docs/finances.md`, `docs/gemini-budget.md`, `docs/finance-verification.md`,
  `docs/financial-sync.md`, `docs/expense-vision-evaluation.md`.
- Le code qu'ils décrivent : les chemins qu'ils citent, sinon `git grep` depuis leurs mots. Points d'entrée : `src/ui/finance/`,
  `src/services/driveFileStore.ts`, `src/services/financeDocuments.ts`, `src/domain/` (grand livre, prévisions),
  `functions/src/ai.ts`, `functions/src/invoiceScanCore.ts`, `functions/src/invoiceVisionReview.ts`,
  `functions/src/invoiceScanBudget.ts`.
- Tu ne lis rien d'autre : ni diagnostic, ni mission, ni conversation. C'est le principe de la relecture sans mémoire.

## Possède (seuls chemins où écrire, avec RESULTAT.md)
- `work/missions/2026-10-31-ecran-depense/ecarts/`

## Consignes
Lire, ne rien corriger : ni doc, ni code. Aucun appel réseau, aucune donnée réelle. `git grep` et la lecture des fichiers suffisent.

Livrable : `work/missions/2026-10-31-ecran-depense/ecarts/2026-10-31-finances.md`, une section `## <chemin du document>` par document,
dans l'ordre des Entrées. Dans chaque section, un écart par ligne, en puce (`- `), au format de § 3 :
`doc:ligne`, l'affirmation citée en moins de 15 mots, `code:ligne` (chemin depuis la racine, par exemple `functions/src/ai.ts:129`),
la classe en toutes lettres (`absent`, `incomplet`, `figé`, `autre architecture` ou `non documenté`), puis une phrase sur ce qui
compte pour le brasseur. Un document sans écart : la ligne « Aucun écart », sans puce. Ne jamais approuver par défaut : chaque
affirmation vérifiable (chiffre, chemin, stockage, délai, modèle, version de registre, règle de calcul) est confrontée au code.

## Exigences transversales et acquis (recopiés, leçons L05 et L06)
- Un chiffre n'est jamais inventé : un écart se prouve par les deux lignes, doc et code.
- Pour ce qui existe, le code fait foi ; tu ne dis pas lequel des deux corriger, seulement l'écart.

## Critères
Dans `GATES.md`, même dossier. Ne pas le modifier. Lancer chaque `CHECK:` depuis la racine du dépôt.

## Rendre
`RESULTAT.md` dans ce dossier de voie : ligne 1 `OK — <n> écarts sur 5 documents` ou `ECHEC — <raison>`, puis le compte par classe,
puis `LEÇON PROPOSÉE : …` ou `aucune`. Réponse finale au pilote : une ligne.
