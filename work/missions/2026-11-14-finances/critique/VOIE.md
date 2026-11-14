# Voie c1 — Critique du panel « du … au … » (12 mini maquettes)

- Mission : 2026-11-14-finances
- Agent : critique
- Modèle : opus (Fable interdit, 10.11 et 14.11 « SANS FABLE »)
- Niveau : conception
- Plafond : 30 tours ; 3 essais par critère
- Dépend de : s1, s2, s3
- Décideur en cas de doute : pilote

## Objectif
Juger les 12 mini maquettes statiques comme le brasseur : par variante, « combien et quels problèmes ? » (liste numérotée, chaque défaut vu sur l'image), verdict (garder / corriger / écarter), classement, 3 candidates au moins pour leur diversité, greffes. Rien n'est rejeté pour sa diversité : le brasseur voit tout.

## Entrées
- `work/missions/2026-11-14-finances/DOSSIER.md` — ses mots, la base v6a, ce qu'on cherche.
- `work/missions/2026-11-14-finances/ref/v6a/v6a-page.png` — sa maquette choisie, à garder intacte au repos.
- `work/missions/2026-11-14-finances/voies/s1/`, `s2/`, `s3/` — pour chaque id : `<id>-repos.png`, `<id>-apres.png`, `NOTE.md`. Ouvre chaque image en entier.
- `work/refonte-frontend/v4/SPEC-BRASSEUR.md` (fin du fichier) et le portrait du critique (`.claude/agents/critique.md`) pour l'étalonnage.

## Possède (seuls chemins où écrire, avec RESULTAT.md)
- `work/missions/2026-11-14-finances/critique`

## Consignes
1. Charge `boosters-ux`, `impeccable`, `ui-design-system`.
2. Mesure le panel : `node work/refonte-frontend/v4/tournoi/outils/controle-panel.mjs <les 12 images repos>` ; note sa sortie (une ressemblance haute est attendue : v6a commune).
3. Vérifie sur chaque image « après » que les montants payé · à payer · dépensé sont justes pour la plage dessinée (données v6a : tout le 9 nov., loyer 400,00 à payer le 25 nov., retard 60,00 de déc. 2025).
4. Écris `SYNTHESE.md` : tableau id · verdict · défauts numérotés · correctif précis ; puis classement, candidates, greffes. Écris pour qu'un concepteur neuf corrige sans te relire.

## Exigences transversales et acquis (recopiés, L05)
- Règle n° 1 : v6a intacte au repos ; « ✓ Payé » 24 px minimum ; peu de texte au premier plan ; jamais type="number" ; inconnu ≠ 0 ; lignes-tâches filtrantes gardées.
- Ses goûts : premier plan léger, détails à un toucher, renvois ; le mois ‹ › reste le geste premier.

## Critères
Dans `GATES.md`, même dossier.

## Rendre
- Tests : sans objet (critique) ; la ligne « Tests » est la mesure du panel écrite dans un fichier : `node work/refonte-frontend/v4/tournoi/outils/controle-panel.mjs … > work/missions/2026-11-14-finances/critique/tests.txt` (à la place de `npx vitest run … --reporter=dot > tests.txt`).
- Voie d'écran : les 24 images ouvertes, citées par nom dans SYNTHESE.md.
Réponse finale au pilote : une ligne.
