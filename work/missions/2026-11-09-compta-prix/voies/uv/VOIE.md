# Voie uv — port de v3a, la caisse (facture de vente)

Agent : auteur (Sonnet), plafond 120. Maquette choisie, reprise telle quelle (règle n° 1, L03) : `work/missions/2026-11-09-compta-prix/p2/v3a/`
(etat.html, NOTE.md, captures, ouvertes avant de coder). Contrat métier : `PLAN-METIER.md` § 3.3 et § 3.5 (phase 3). Domaine prêt :
`src/services/swissQrBill.ts` (QR réel, PNG dans jsPDF), `src/domain/finance/numeroFacture.ts` (n° continu), voir `voies/f1/RESULTAT.md`.
Décisions : `voies/COMMUN.md` (P1–P7 ; P7 : adresse structurée de la brasserie obligatoire pour le QR).

Possède : `src/ui/vente/**` (neuf), `src/ui/finance/InvoiceSheet.tsx`, `src/components/QuickActionModal.tsx`, `src/components/tabs/ClientsTab.tsx`
(Facturer seulement), `src/components/EditClientModal.tsx`, `src/components/SettingsModal.tsx` (identité et adresse de la brasserie),
`src/types/index.ts`, `src/services/storage.ts` (config `company`), `src/domain/companyDefaults.ts`, `tests/integration/factureClientSaisie.test.tsx`,
`tests/integration/incomeProofFlows.test.tsx`, tests neufs `tests/integration/caisse*.test.tsx`, `work/missions/2026-11-09-compta-prix/voies/uv/**`.

Fini = une seule entrée « Vendre » (+ › Vendre et Clients › fiche › Facturer ouvrent la même caisse), atteinte depuis le menu, branchée,
typée, testée, build vert. InvoiceSheet retiré du chemin, pas supprimé.

Étape 1 : `voies/uv/PLAN.md` seul (gabarit `.claude/skills/voies/references/sans-memoire.md` § 2, inventaire de chaque élément et état de v3a,
appelants hors Possède par grep sur src/ tests/ scripts/, rejoués sur HEAD), puis arrête-toi et rends une ligne.
Étape 2 (après la revue) : code, tests rouges puis verts, `npx tsc --noEmit` hors firebase-admin, `npx vite build`, captures 390 tactile et 1280,
clair et cave, côte à côte avec v3a (`?dev-local&finance-demo`), ouvertes.
RESULTAT.md tenu au fil dans `voies/uv/RESULTAT.md` (une limite de tours ne doit rien perdre).
Tests : `npx vitest run <fichiers> --reporter=dot > voies/uv/tests.txt 2>&1`.
Aucun commit, pas de `git stash`, Gemini jamais appelé, l'IBAN jamais recopié (IBAN de test public de la norme, marqué test). Rends une ligne.

**Remplacer, jamais fusionner** (ses mots du 09.11 : « Bien replacé ce qui est déjà en place par les mini maquettes, par un merge ou portage à moitié ») : l'écran choisi remplace entièrement l'écran actuel ; aucun bloc de l'ancien ne reste à côté. Une fonction de l'ancien absente de la maquette va au second plan dans la langue de la maquette, ou est listée dans RESULTAT.md pour le pilote. « 99 % mini maquettes » : un compromis rare se justifie et se liste.
