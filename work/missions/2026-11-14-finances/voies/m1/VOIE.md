# Voie m1 — mini maquettes : sous-vues d'Opérations

- Mission : 2026-11-14-finances
- Agent : concepteur
- Modèle : opus
- Niveau : conception
- Plafond : 80 tours ; 3 essais par critère
- Dépend de : —
- Décideur en cas de doute : brasseur (page de choix) ; pilote pour le reste

## Objectif
Quatre mini maquettes statiques (non jouables) par vue, pour les vues de Finances qui n'ont aucune maquette choisie : Filtres, panneau ouvert ; Doublons ; Archives et « Gérer les archives » ; Apport ou prélèvement privé.

## Entrées
- `work/missions/2026-11-14-finances/DOSSIER-SOUS-VUES.md` — ses mots, ses goûts, les quatre genres, le format des images. Ne pas relire les sources qu'il résume.
- `work/missions/2026-11-14-finances/ref/v6a/etat.html` — jetons et langage visuel de base (et `ref/p5b`, `ref/g6`, `ref/g3a` pour l'écran derrière).
- **Filtres, panneau ouvert** (`m1fi`) : `src/ui/finance/TransactionJournal.tsx` (bouton « Filtres », `ops-panneau` : portée, états de paiement, catégories, « Écritures annulées uniquement », « Gérer les archives »).
- **Doublons** (`m1do`) : `src/ui/finance/TransactionJournal.tsx` (filtre `doublon`, `duplicateGroups`, « Ce n’est pas un doublon ») ; montrer un groupe de deux pièces semblables et le geste qui l'écarte.
- **Archives et « Gérer les archives »** (`m1ar`) : `src/ui/finance/TransactionJournal.tsx` (portée `archives`) et `src/ui/finance/ArchiveManagerSheet.tsx` (archiver une année close, parcourir une année).
- **Apport ou prélèvement privé** (`m1ap`) : `src/ui/finance/MovementSheet.tsx` (argent privé qui entre ou sort, montant, date, compte, remboursement).

## Possède (seuls chemins où écrire, avec RESULTAT.md)
- `work/missions/2026-11-14-finances/voies/m1`

## Consignes
Charger `boosters-ux`, `impeccable`, `ui-design-system`. Lire le code de chaque vue pour son contenu réel (champs, actions, règles), puis
dessiner les quatre genres a, b, c, d du dossier. Un dossier par variante : `work/missions/2026-11-14-finances/voies/m1/<id>/` avec `etat.html` (classes et globales
préfixées `<id>-…`, L26 ; polices locales ou système, aucun appel réseau), `<id>.png` (390 px, échelle 2, clair, l'état ouvert de la vue)
et `NOTE.md` (10 lignes au plus). Ids : m1fi-a, m1fi-b, m1fi-c, m1fi-d, m1do-a, m1do-b, m1do-c, m1do-d, m1ar-a, m1ar-b, m1ar-c, m1ar-d, m1ap-a, m1ap-b, m1ap-c, m1ap-d. Capturer avec puppeteer-core (`.claude/skills/webapp-testing/examples/_lanceur.mjs`),
ouvrir chaque image et la juger comme le brasseur avant de rendre. Aucun Fable, aucun sous-agent.

## Exigences transversales et acquis (recopiés, L05, L06)
- Règle n° 1 : l'écran derrière est sa maquette choisie, sans retouche (v6a, p5b, g6, g3a) ; « ✓ Payé » 24 px ; geste principal 44 px.
- Peu de texte au premier plan, pas de cockpit ; mots du métier, pas de jargon comptable ; jamais `type="number"` ; inconnu ≠ 0 ;
  une hachure veut dire « à payer » ; lignes-tâches filtrantes gardées (10.11) ; montants en CHF, justes et cohérents avec v6a.
- Plancher à enrichir (L07) : rien du contenu actuel ne disparaît sans être dit dans NOTE.md.

## Critères
Dans `GATES.md`, même dossier. Ne pas le modifier.

## Rendre
- `RESULTAT.md` tenu au fil, une ligne par variante (id, genre, image ouverte) : une limite de tours ne perd rien.
- Tests : maquettes statiques, aucun Vitest ; la ligne « Tests » est `node work/missions/2026-11-14-finances/outils/controle-minis.mjs work/missions/2026-11-14-finances/voies/m1 m1fi-a,m1fi-b,m1fi-c,m1fi-d,m1do-a,m1do-b,m1do-c,m1do-d,m1ar-a,m1ar-b,m1ar-c,m1ar-d,m1ap-a,m1ap-b,m1ap-c,m1ap-d > work/missions/2026-11-14-finances/voies/m1/tests.txt` (à la place de `npx vitest run … --reporter=dot > tests.txt`).
Réponse finale au pilote : une ligne.
