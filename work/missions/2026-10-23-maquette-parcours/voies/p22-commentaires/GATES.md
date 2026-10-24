# Gates: voie p22-commentaires — chacun de ses commentaires, et ce qu'il est devenu

OWNS: work/refonte-frontend/v4/choix/commentaires/fils-2026-10-24.json, work/refonte-frontend/v4/choix/commentaires/vues-a-revoir.md, work/refonte-frontend/v4/choix/commentaires/captures/**, work/missions/2026-10-23-maquette-parcours/voies/p22-commentaires/RESULTAT.md

Scope: chaque commentaire du brasseur relevé dans les lectures, sa trace (SPEC, défaut, contrôle, ticket) et son effet dans la maquette 24.10, et la liste des vues dont il n'est pas convaincu.

- [ ] G1: chaque fil du brasseur des lectures est relevé, avec un verdict permis et une preuve
  CHECK: node -e "const fs=require('fs');const L=JSON.parse(fs.readFileSync('work/refonte-frontend/v4/choix/commentaires/lectures-2026-10-24.json','utf8')).lectures;const fils=new Set();for(const l of L)for(const m of l.texte.matchAll(/Thread ([0-9a-f]{8})[0-9a-f-]*\n(?:(?!Thread )[\s\S])*?the user \(owner\)/g))fils.add(m[1]);const J=JSON.parse(fs.readFileSync('work/refonte-frontend/v4/choix/commentaires/fils-2026-10-24.json','utf8')).fils||[];const V=['fait','note-sans-controle','controle-sans-correction','promis-non-fait','perdu','attend-son-choix','caduc'];const vus=new Set(J.map(x=>String(x.fil||'').slice(0,8)));const manque=[...fils].filter(f=>!vus.has(f));const mal=J.filter(x=>!x.mots||!V.includes(x.verdict)||!x.preuve);console.log(!manque.length&&!mal.length&&J.length>=fils.size?['FILS','BIEN',J.length].join('-'):'FILS ECHEC manque '+manque.join(',')+' mal '+mal.map(x=>x.id).join(','));process.exit(!manque.length&&!mal.length?0:1)"
  EXPECT: FILS-BIEN
  EVIDENCE: pending

- [ ] G2: la liste des vues à revoir existe et cite ses mots
  CHECK: node scripts/agents/systeme.mjs note work/refonte-frontend/v4/choix/commentaires/vues-a-revoir.md --contient "Dryhopper,«"
  EXPECT: NOTE OK
  EVIDENCE: pending

- [ ] G3: le rapport donne la limite du relevé, les fils perdus en tête et le décompte
  CHECK: node scripts/agents/systeme.mjs note work/missions/2026-10-23-maquette-parcours/voies/p22-commentaires/RESULTAT.md --contient "autre compte,perdu,promis-non-fait,attend-son-choix,5345f6ad"
  EXPECT: NOTE OK
  EVIDENCE: pending
