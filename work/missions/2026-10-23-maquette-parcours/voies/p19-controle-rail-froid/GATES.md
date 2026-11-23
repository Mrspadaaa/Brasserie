# Gates: voie p19-controle-rail-froid — le contrôle D123 et ses témoins

OWNS: work/refonte-frontend/v4/tournoi/outils/controle-geste-etape.mjs, work/refonte-frontend/v4/tournoi/outils/temoins/geste-froid-*/**, work/missions/2026-10-23-maquette-parcours/voies/p19-controle-rail-froid/RESULTAT.md

Scope: un mode froid du contrôle du geste de l'étape, qui exige le rail de sa base vers le whirlpool, la fermentation et la post-fermentation ; il échoue sur la version publiée 5345f6ad.

- [ ] G1: le rail froid de la version publiée échoue (échelle et mots de Dryhopper, débordement)
  CHECK: node scripts/agents/systeme.mjs echoue "GESTE-ETAPE ECHEC" -- node work/refonte-frontend/v4/tournoi/outils/controle-geste-etape.mjs prototypes/houblons-v4/maquettes/parcours-5345f6ad --froid
  EXPECT: ECHOUE OK
  EVIDENCE: pending

- [ ] G2: le rail froid de sa base v4.10 passe
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-geste-etape.mjs work/refonte-frontend/v4/ecran-1/base/consolide --page=index.html --froid
  EXPECT: GESTE-ETAPE OK (froid
  EVIDENCE: pending

- [ ] G3: des graduations qui débordent sur un ajout échouent
  CHECK: node scripts/agents/systeme.mjs echoue "GESTE-ETAPE ECHEC" -- node work/refonte-frontend/v4/tournoi/outils/controle-geste-etape.mjs work/refonte-frontend/v4/tournoi/outils/temoins/geste-froid-deborde --froid
  EXPECT: ECHOUE OK
  EVIDENCE: pending

- [ ] G4: le mode par défaut et ses appels tiennent toujours (M15)
  CHECK: node scripts/agents/systeme.mjs appels controle-geste-etape.mjs --rejouer
  EXPECT: APPELS OK
  EVIDENCE: pending

- [ ] G5: D123 est dans la portée des défauts, gardé, sur Ma bière
  CHECK: node -e "const p=require('./work/refonte-frontend/v4/tournoi/outils/portee-defauts.json');const d=p.defauts.find(x=>x.id==='D123');const ok=d&&d.verdict==='garde'&&d.tourne==='oui'&&d.portee.includes('ma-biere');console.log(ok?['PORTEE','BIEN'].join('-'):'PORTEE ECHEC');process.exit(ok?0:1)"
  EXPECT: PORTEE-BIEN
  EVIDENCE: pending

- [ ] G6: le câblage et les témoins du système tiennent
  CHECK: node scripts/agents/systeme.mjs cablage
  EXPECT: CABLAGE OK
  EVIDENCE: pending

- [ ] G7: le rapport donne les sorties sur la base, sur 5345f6ad et sur le témoin, et les mots de la base
  CHECK: node scripts/agents/systeme.mjs note work/missions/2026-10-23-maquette-parcours/voies/p19-controle-rail-froid/RESULTAT.md --contient "5345f6ad,base v4.10,geste-froid-deborde,J+,à froid"
  EXPECT: NOTE OK
  EVIDENCE: pending
