# Voie m4 — mini maquettes : budget, profil et assistant

- Mission : 2026-11-14-finances
- Agent : concepteur
- Modèle : opus
- Niveau : conception
- Plafond : 80 tours ; 3 essais par critère
- Dépend de : —
- Décideur en cas de doute : brasseur (page de choix) ; pilote pour le reste

## Objectif
Quatre mini maquettes statiques (non jouables) par vue, pour les vues de Finances qui n'ont aucune maquette choisie : Budget d'un brassin, et choix du brassin ; Profil et paramètres ; Assistant IA.

## Entrées
- `work/missions/2026-11-14-finances/DOSSIER-SOUS-VUES.md` — ses mots, ses goûts, les quatre genres, le format des images. Ne pas relire les sources qu'il résume.
- `work/missions/2026-11-14-finances/ref/v6a/etat.html` — jetons et langage visuel de base (et `ref/p5b`, `ref/g6`, `ref/g3a` pour l'écran derrière).
- **Budget d'un brassin, et choix du brassin** (`m4bb`) : `src/ui/finance/BrewBudgetDialog.tsx`, `src/ui/finance/BrewBudgetSheet.tsx`, et la feuille « Quel brassin veux-tu estimer ? » de `src/components/tabs/FinancesTab.tsx` (vers la ligne 137). Série c du 09.11 (`work/missions/2026-11-09-compta-prix/v0/c*`), jamais choisie : à lire seulement comme indice.
- **Profil et paramètres** (`m4pf`) : `src/ui/finance/FinanceForms.tsx`, `ProfileSheet` (statut, TVA, seuils, caisse d'ouverture, paramètres).
- **Assistant IA** (`m4ia`) : `src/ui/finance/FinanceAssistant.tsx` et ce qu'il appelle (questions par onglet ; Gemini simulé, aucune vraie réponse).

## Possède (seuls chemins où écrire, avec RESULTAT.md)
- `work/missions/2026-11-14-finances/voies/m4`

## Consignes
Charger `boosters-ux`, `impeccable`, `ui-design-system`. Lire le code de chaque vue pour son contenu réel (champs, actions, règles), puis
dessiner les quatre genres a, b, c, d du dossier. Un dossier par variante : `work/missions/2026-11-14-finances/voies/m4/<id>/` avec `etat.html` (classes et globales
préfixées `<id>-…`, L26 ; polices locales ou système, aucun appel réseau), `<id>.png` (390 px, échelle 2, clair, l'état ouvert de la vue)
et `NOTE.md` (10 lignes au plus). Ids : m4bb-a, m4bb-b, m4bb-c, m4bb-d, m4pf-a, m4pf-b, m4pf-c, m4pf-d, m4ia-a, m4ia-b, m4ia-c, m4ia-d. Capturer avec puppeteer-core (`.claude/skills/webapp-testing/examples/_lanceur.mjs`),
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
- Tests : maquettes statiques, aucun Vitest ; la ligne « Tests » est `node work/missions/2026-11-14-finances/outils/controle-minis.mjs work/missions/2026-11-14-finances/voies/m4 m4bb-a,m4bb-b,m4bb-c,m4bb-d,m4pf-a,m4pf-b,m4pf-c,m4pf-d,m4ia-a,m4ia-b,m4ia-c,m4ia-d > work/missions/2026-11-14-finances/voies/m4/tests.txt` (à la place de `npx vitest run … --reporter=dot > tests.txt`).
Réponse finale au pilote : une ligne.
