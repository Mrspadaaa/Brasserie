# Voie t-mat — tri du panel v0, Stocks › Matériel

- Mission : 2026-11-14-materiel
- Agent : critique (en Opus : Fable interdit)
- Modèle : opus
- Niveau : jugement
- Plafond : 30 tours
- Dépend de : r-mat, z-mat, u-mat
- Décideur en cas de doute : pilote

## Objectif
Classer les 12 variantes v0 comme le brasseur les jugerait, lister les défauts de CHACUNE (aucun rejet : tout sera montré, M13),
proposer 3 candidates pour leur diversité et leurs greffes. M = `C:/Users/mrspa/.codex/worktrees/openai-clean-start/Brasserie/work/missions/2026-11-14-materiel`.

## Entrées
- Captures : `M/v0/{r,z,u}/<id>/<id>-{repos,geste,repos-cave}-390.png` (rq1–4, zq1–4, uq1–4) ; NOTE.md de chacune.
  Planches d'ensemble (à ouvrir d'abord) : `M/critique/montage-repos.png`, `M/critique/montage-geste.png`.
- `M/BRIEF-AUTEUR.md` (exigences), `M/analyse/ANALYSE.md` (P1–P28, M1–M10), sa capture `M/brasseur/14-11-stocks-materiel.jpg`,
  la langue d'Articles `M/banc/ref-articles-390-clair.png`.
- Ton étalonnage : `.claude/agents/critique.md` (portrait du brasseur), `cerveau/brasseur/pas-de-cockpit.md`.
- Contrôle du panel (rejoué par le pilote) : remplissage médian 0,44, ressemblance 0,91 (coque commune imposée) → PANEL ECHEC ;
  dis où le vide est réel (à densifier) et où la mesure est trompée par la coque.

## Possède
- `M/critique/`, `M/voies/t-mat/`. Rien d'autre.

## Consignes
Écris `M/critique/SYNTHESE.md` :
1. `## Classement` : les 12, du meilleur au moins bon, une ligne de raison chacune.
2. `## Défauts` : par variante, `### <id>` puis D1…Dn : ce qu'on voit (zone, état, thème), pourquoi il le refuserait, correction
   précise. Vérifie : chiffres cohérents (date du jour 14.11.2026 ; « retard 6 j », « dans 17 j » justes), texte ≥ 12 px, cibles,
   débordements, mots au premier écran, inconnu jamais 0, totals honnêtes, cave lisible, coque identique à l'app.
3. `## Candidates` : 3, pour leur diversité, avec greffes (« même les plus extravagantes ») prises aux autres.
4. `## États de passe 2` : pour chaque variante, ce que doivent montrer les états `traiter` (filtre À traiter, après un « Fait »),
   `ajout` (Actions du matériel / nouveau matériel), `vide` (inventaire vide), `repos-1280`, dans sa langue.

## Critères
`GATES.md` ; ne pas le modifier.

## Rendre
- `RESULTAT.md` tenu au fil, mis à jour tous les 5 éléments.
- La ligne « Tests » écrite dans un fichier : sans objet (pas de `--reporter=dot > …`) : « Tests : sans objet » dans RESULTAT.md.
- Voie d'écran : captures 390 tactile, clair et cave, toutes ouvertes.
Réponse finale : une ligne.
