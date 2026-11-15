# Voie m3 — mini maquettes : ajouts de Prévisions et d'Annuel

- Mission : 2026-11-14-finances
- Agent : concepteur
- Modèle : opus
- Niveau : conception
- Plafond : 80 tours ; 3 essais par critère
- Dépend de : —
- Décideur en cas de doute : brasseur (page de choix) ; pilote pour le reste

## Objectif
Quatre mini maquettes statiques (non jouables) par vue, pour les vues de Finances qui n'ont aucune maquette choisie : Ajouter une prévision ; Projet matériel ; Immobilisation (bien amorti).

## Entrées
- `work/missions/2026-11-14-finances/DOSSIER-SOUS-VUES.md` — ses mots, ses goûts, les quatre genres, le format des images. Ne pas relire les sources qu'il résume.
- `work/missions/2026-11-14-finances/ref/v6a/etat.html` — jetons et langage visuel de base (et `ref/p5b`, `ref/g6`, `ref/g3a` pour l'écran derrière).
- **Ajouter une prévision** (`m3pr`) : `src/ui/finance/FinanceForms.tsx`, `PlanSheet` ; contexte `src/ui/finance/previsions/` (p5b derrière).
- **Projet matériel** (`m3pm`) : `src/ui/finance/UpgradeSheet.tsx`, `src/ui/finance/UpgradeWorkspace.tsx` (achat de matériel prévu, son coût, son effet sur la trésorerie).
- **Immobilisation (bien amorti)** (`m3im`) : `src/ui/finance/FinanceForms.tsx`, `AssetSheet` (bien, prix, date, durée, amortissement) ; contexte g6 derrière.

## Possède (seuls chemins où écrire, avec RESULTAT.md)
- `work/missions/2026-11-14-finances/voies/m3`

## Consignes
Charger `boosters-ux`, `impeccable`, `ui-design-system`. Lire le code de chaque vue pour son contenu réel (champs, actions, règles), puis
dessiner les quatre genres a, b, c, d du dossier. Un dossier par variante : `work/missions/2026-11-14-finances/voies/m3/<id>/` avec `etat.html` (classes et globales
préfixées `<id>-…`, L26 ; polices locales ou système, aucun appel réseau), `<id>.png` (390 px, échelle 2, clair, l'état ouvert de la vue)
et `NOTE.md` (10 lignes au plus). Ids : m3pr-a, m3pr-b, m3pr-c, m3pr-d, m3pm-a, m3pm-b, m3pm-c, m3pm-d, m3im-a, m3im-b, m3im-c, m3im-d. Capturer avec puppeteer-core (`.claude/skills/webapp-testing/examples/_lanceur.mjs`),
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
- Tests : maquettes statiques, aucun Vitest ; la ligne « Tests » est `node work/missions/2026-11-14-finances/outils/controle-minis.mjs work/missions/2026-11-14-finances/voies/m3 m3pr-a,m3pr-b,m3pr-c,m3pr-d,m3pm-a,m3pm-b,m3pm-c,m3pm-d,m3im-a,m3im-b,m3im-c,m3im-d > work/missions/2026-11-14-finances/voies/m3/tests.txt` (à la place de `npx vitest run … --reporter=dot > tests.txt`).
Réponse finale au pilote : une ligne.
