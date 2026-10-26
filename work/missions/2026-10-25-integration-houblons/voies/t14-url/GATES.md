# Gates: voie t14-url — les contrôles de ses choix lisent une adresse servie

OWNS: prototypes/houblons-v4/maquettes/parcours-t14/, work/refonte-frontend/v4/tournoi/outils/lib/, work/refonte-frontend/v4/tournoi/outils/controle-choix.mjs, work/refonte-frontend/v4/tournoi/outils/servir.mjs, work/refonte-frontend/v4/tournoi/outils/temoins/choix-url-*/, work/missions/2026-10-25-integration-houblons/voies/t14-url/

Scope: résolveur commun et `controle-choix.mjs --url`, CHOIX OK sur la maquette servie, témoin négatif en échec.

- [ ] G1: la maquette servie par HTTP passe, le témoin servi échoue
  CHECK: node work/missions/2026-10-25-integration-houblons/voies/t14-url/verifier.mjs
  EXPECT: URL OK
  EVIDENCE: pending

- [ ] G2: le mode fichier d'aujourd'hui tient toujours (rien ne casse)
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-choix.mjs --registre
  EXPECT: REGISTRE OK
  EVIDENCE: pending
