# Gates: voie r4d-a2-passe2 — « épicé », passe 2 de la série A

OWNS: work/refonte-frontend/v4/ecran-1/fils22-picto-epice-3/serie-a/passe2/**, work/missions/2026-10-22-reprise-lot21/voies/r4d-a2-passe2/RESULTAT.md

Scope: les candidates de la série A retenues au tri, améliorées, épices réelles, à 12, 16 et 24 px, à côté de la feuille et des brins, et sur de vraies cartes.

- [ ] G1: chaque candidate de la série retenue au tri est sur la planche, avec son id
  CHECK: node -e "const fs=require('fs'); const t=fs.readFileSync('work/refonte-frontend/v4/ecran-1/fils22-picto-epice-3/tri/SYNTHESE.md','utf8'); const c=[...t.matchAll(/^- [*][*](a[0-9][\w-]*)[*][*] [(]/gm)].map(m=>m[1]); const h=fs.readFileSync('work/refonte-frontend/v4/ecran-1/fils22-picto-epice-3/serie-a/passe2/etat.html','utf8'); const manque=c.filter(id=>!h.includes('data-variante=\x22'+id+'\x22')); const ok=c.length>0 && !manque.length; console.log(ok?'CANDIDATES OK ('+c.length+')':'CANDIDATES ECHEC '+c.length+' retenues, manque '+manque.join(', ')); process.exit(ok?0:1)"
  EXPECT: CANDIDATES OK
  EVIDENCE:

- [ ] G2: D101 ter et quater sur ses candidates : épices réelles, refus, tailles, cartes, voisins
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-planche-picto.mjs work/refonte-frontend/v4/ecran-1/fils22-picto-epice-3/serie-a/passe2/etat.html --ter --genres=1 --nombre=1-6 --voisins=herbal,green --epices=1
  EXPECT: /PLANCHE OK \([1-6] variantes/
  EVIDENCE:

- [ ] G3: baseline : au trait, sans halo ni disque (D88)
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-pictos-trait.mjs work/refonte-frontend/v4/ecran-1/fils22-picto-epice-3/serie-a passe2 --page=etat.html
  EXPECT: TRAIT OK
  EVIDENCE:

- [ ] G4: la page se rend sans erreur de script ni défilement horizontal
  CHECK: node scripts/agents/verifier-page.mjs work/refonte-frontend/v4/ecran-1/fils22-picto-epice-3/serie-a/passe2/etat.html --min-images 0
  EXPECT: PAGE OK
  EVIDENCE:

- [ ] G5: note et captures existent
  CHECK: node scripts/agents/systeme.mjs existent work/refonte-frontend/v4/ecran-1/fils22-picto-epice-3/serie-a/passe2/NOTE.md work/refonte-frontend/v4/ecran-1/fils22-picto-epice-3/serie-a/passe2/captures/tailles-390.png work/refonte-frontend/v4/ecran-1/fils22-picto-epice-3/serie-a/passe2/captures/cartes-390.png
  EXPECT: EXISTENT OK
  EVIDENCE:

- [ ] G6: la NOTE dit ce qui a changé et les greffes
  CHECK: node scripts/agents/systeme.mjs note work/refonte-frontend/v4/ecran-1/fils22-picto-epice-3/serie-a/passe2/NOTE.md --contient "## Passe 2,greffe"
  EXPECT: NOTE OK
  EVIDENCE:

- [ ] G7: le rapport cite les captures ouvertes
  CHECK: node scripts/agents/systeme.mjs note work/missions/2026-10-22-reprise-lot21/voies/r4d-a2-passe2/RESULTAT.md --contient "tailles-390.png,cartes-390.png,LEÇON PROPOSÉE"
  EXPECT: NOTE OK
  EVIDENCE:
