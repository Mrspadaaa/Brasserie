# Gates: voie p23-tickets — les tickets houblons face à l'état réel

OWNS: work/refonte-frontend/tickets-2026-10-24.md, work/missions/2026-10-23-maquette-parcours/voies/p23-tickets/RESULTAT.md

Scope: chaque ticket houblons ouvert, son verdict et son brouillon de mise à jour ; les tickets manquants ; rien publié.

- [ ] G1: chaque ticket demandé a sa section, avec un verdict permis
  CHECK: node -e "const t=require('fs').readFileSync('work/refonte-frontend/tickets-2026-10-24.md','utf8');const n=[119,122,123,124,125,126,127,130,131,132,133,135,136,137,138,139,140,141,142,143,144,145,146];const manque=n.filter(x=>!new RegExp('^#+ .*#'+x+'\\b','m').test(t));const v=(t.match(/\b(a-jour|a-completer|a-fermer-propose|a-scinder)\b/g)||[]).length;console.log(!manque.length&&v>=n.length?['TICKETS','BIEN'].join('-'):'TICKETS ECHEC manque '+manque.join(',')+' verdicts '+v);process.exit(!manque.length&&v>=n.length?0:1)"
  EXPECT: TICKETS-BIEN
  EVIDENCE: pending

- [ ] G2: rien n'a été publié sur GitHub par la voie (aucun commentaire de ce jour signé par l'outil)
  CHECK: node scripts/agents/systeme.mjs note work/missions/2026-10-23-maquette-parcours/voies/p23-tickets/RESULTAT.md --contient "accord,rien publié,à créer"
  EXPECT: NOTE OK
  EVIDENCE: pending
