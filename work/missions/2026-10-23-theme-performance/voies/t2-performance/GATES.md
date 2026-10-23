# Gates: voie t2-performance — mesurer la maquette comme sur un téléphone

OWNS: work/refonte-frontend/v4/tournoi/outils/mesure-performance.mjs, work/refonte-frontend/v4/tournoi/outils/temoins/perf-*, work/missions/2026-10-23-theme-performance/voies/t2-performance

Scope: mesure-performance.mjs, ses témoins, joué sur la maquette construite ; optimisations classées par gain mesuré.

- [ ] G1: le témoin rapide passe
  CHECK: node work/refonte-frontend/v4/tournoi/outils/mesure-performance.mjs work/refonte-frontend/v4/tournoi/outils/temoins perf-rapide --page=etat.html
  EXPECT: PERF OK
  EVIDENCE: pending

- [ ] G2: un toucher qui bloque le fil 300 ms échoue par « toucher »
  CHECK: node scripts/agents/systeme.mjs echoue toucher -- node work/refonte-frontend/v4/tournoi/outils/mesure-performance.mjs work/refonte-frontend/v4/tournoi/outils/temoins perf-lent --page=etat.html
  EXPECT: ECHOUE OK
  EVIDENCE: pending

- [ ] G3: joué sur la maquette à ×4, il rend ses mesures sans planter
  CHECK: node scripts/agents/systeme.mjs verdict -- node work/refonte-frontend/v4/tournoi/outils/mesure-performance.mjs prototypes/houblons-v4/maquettes/parcours ma-biere suggerer comparer dryhopper --page=etat.html --cpu=4
  EXPECT: /ma-biere · [\s\S]*dryhopper · [\s\S]*VERDICT (OK|ECHEC)/
  EVIDENCE: pending

- [ ] G4: les mesures et les optimisations classées sont écrites
  CHECK: node scripts/agents/systeme.mjs note work/missions/2026-10-23-theme-performance/voies/t2-performance/RESULTAT.md --exiger "Mesures,Optimisations" --contient "×4,×6,gzip"
  EXPECT: NOTE OK
  EVIDENCE: pending

- [ ] G5: le câblage du système tient (pas d'OK 0/0, pas de caractère de contrôle)
  CHECK: node scripts/agents/systeme.mjs cablage
  EXPECT: CABLAGE OK
  EVIDENCE: pending
