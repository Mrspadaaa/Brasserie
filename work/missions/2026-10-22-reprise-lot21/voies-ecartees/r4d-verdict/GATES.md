# Gates: voie r4d-verdict — verdict sur les propositions « épicé » améliorées

OWNS: work/missions/2026-10-22-reprise-lot21/voies/r4d-verdict/RESULTAT.md

Scope: reclasser et regreffer les candidates améliorées, rendre un verdict (satisfaisant ou passe 3) au format du rejeu ; chaque REJET cite une règle.

- [ ] G1: un verdict au format du rejeu, satisfaisant ou passe 3
  CHECK: node -e "const t=require('fs').readFileSync('work/missions/2026-10-22-reprise-lot21/voies/r4d-verdict/RESULTAT.md','utf8'); const ok=/^- [*][*]r4d[*][*].*(REJET|ACCEPT)/m.test(t) && /verdict : (satisfaisant|passe 3)/.test(t); console.log(ok?'VERDICT OK':'VERDICT ECHEC'); process.exit(ok?0:1)"
  EXPECT: VERDICT OK
  EVIDENCE:

- [ ] G2: chaque REJET cite une ligne de DEFAUTS (Dnn) ou la SPEC
  CHECK: node -e "const t=require('fs').readFileSync('work/missions/2026-10-22-reprise-lot21/voies/r4d-verdict/RESULTAT.md','utf8'); const r=t.split('\n').filter(l=>/^- [*][*]r[\w-]+[*][*].*REJET/.test(l)); const sans=r.filter(l=>!/D[0-9]{2,3}|SPEC/.test(l)); console.log(sans.length?'REJETS ECHEC '+sans.length+' sans règle citée':'REJETS OK ('+r.length+')'); process.exit(sans.length?1:0)"
  EXPECT: REJETS OK
  EVIDENCE:

- [ ] G3: reclassement, greffes et phrase prédite
  CHECK: node scripts/agents/systeme.mjs note work/missions/2026-10-22-reprise-lot21/voies/r4d-verdict/RESULTAT.md --contient "## Classement,## Greffes,Phrase prédite,tailles-390.png,cartes-390.png,LEÇON PROPOSÉE"
  EXPECT: NOTE OK
  EVIDENCE:

- [ ] G4: l'ensemble amélioré tient D101 ter et quater : 8 propositions au moins, 6 épices réelles différentes
  CHECK: node -e "const fs=require('fs'); let n=0; const e=new Set(); for (const x of ['a','d','e','f']) { const f='work/refonte-frontend/v4/ecran-1/fils22-picto-epice-3/serie-'+x+'/passe2/etat.html'; if (!fs.existsSync(f)) continue; const h=fs.readFileSync(f,'utf8'); for (const m of h.matchAll(/<[^>]*data-variante=[^>]*>/g)) { n++; const k=m[0].match(/data-epice=.([^'\x22]+)/); if (k) e.add(k[1].toLowerCase().replace(/^clou de /,'')); } } const ok=n>=8 && e.size>=6; console.log(ok?'ENSEMBLE OK ('+n+' propositions, '+e.size+' epices)':'ENSEMBLE ECHEC '+n+' propositions, '+e.size+' epices'); process.exit(ok?0:1)"
  EXPECT: ENSEMBLE OK
  EVIDENCE:
