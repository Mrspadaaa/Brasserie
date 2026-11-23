# Témoin choix-url-legende-retiree (#161)

La maquette servie `prototypes/houblons-v4/maquettes/parcours-t14/` (construite par `construire.mjs --sortie=…`, ignorée par git),
moins la légende de l'étape : `ma-biere/etat.html` y ajoute un `<style>` qui masque `[data-role="legende-bande"]` et
`[data-role="bande-ouverte"]`. `servir.mjs` lit `superposition.json` et complète avec la base.

Attendu : `node work/refonte-frontend/v4/tournoi/outils/controle-choix.mjs --url=<adresse servie>` → `CHOIX ECHEC` (étape Houblons).
Rejouer : `node work/missions/2026-10-25-integration-houblons/voies/t14-url/verifier.mjs`.
